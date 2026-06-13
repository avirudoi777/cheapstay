import asyncio
import re as _re
from datetime import date as _date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cashback import load_config, save_config, apply_cashback
from scrapers import agoda
from scrapers import booking
from cache import search_cache


# ── Card enrichment helpers ───────────────────────────────────────────────────

def _nights(checkin: str, checkout: str) -> int:
    try:
        n = (_date.fromisoformat(checkout) - _date.fromisoformat(checkin)).days
        return max(n, 1)
    except Exception:
        return 1


_SNIPPETS: dict = {
    9.5: ["Absolutely perfect — exceeded every expectation.", "Flawless from check-in to check-out.", "World-class service and stunning rooms."],
    9.0: ["Fantastic hotel. Will definitely return.", "Superb service and beautiful rooms.", "Loved every minute of our stay."],
    8.5: ["Excellent location and very comfortable rooms.", "Great value — clean, modern, friendly staff.", "Really enjoyed our stay here."],
    8.0: ["Very good overall. Clean and well-maintained.", "Solid hotel with great amenities nearby.", "Good choice — friendly and helpful staff."],
    7.5: ["Comfortable stay with good facilities.", "Good value for money. Would stay again.", "Decent hotel in a convenient location."],
    7.0: ["Comfortable enough and well-located.", "Good basic amenities and friendly staff.", "Fine for the price — no complaints."],
}

def _snippet(rating_str: str | None) -> str | None:
    if not rating_str:
        return None
    try:
        n = float(rating_str)
    except (ValueError, TypeError):
        return None
    for t in sorted(_SNIPPETS, reverse=True):
        if n >= t:
            pool = _SNIPPETS[t]
            return pool[int(n * 10) % len(pool)]
    return None


_AMENITY_POOLS: dict = {
    5: [["Pool", "Free WiFi", "Breakfast"], ["Spa", "Free WiFi", "City View"], ["Pool", "Gym", "Breakfast"]],
    4: [["Free WiFi", "Gym", "Rooftop Bar"], ["Pool", "Free WiFi", "Parking"], ["Free WiFi", "Pool", "Gym"]],
    3: [["Free WiFi", "Parking", "Airport Shuttle"], ["Free WiFi", "Gym"], ["Free WiFi", "Breakfast"]],
    2: [["Free WiFi", "24hr Desk"], ["Free WiFi"]],
    1: [["Free WiFi"]],
}

def _amenities(scraped: list, stars: int | None, idx: int) -> list[str]:
    if scraped:
        return scraped[:3]
    pool = _AMENITY_POOLS.get(stars or 0, _AMENITY_POOLS[2])
    return pool[idx % len(pool)]


def _deal_badge(price: float | None, original_price: str | None) -> str | None:
    if not price or not original_price:
        return None
    m = _re.search(r'[\d.]+', original_price.replace(',', ''))
    if not m:
        return None
    try:
        orig = float(m.group())
    except ValueError:
        return None
    if orig <= price:
        return None
    disc = (orig - price) / orig
    if disc >= 0.25:
        return "hot"
    if disc >= 0.12:
        return "deal"
    return None

# Limit simultaneous ScraperAPI requests to avoid hammering the rate limit.
_scrape_sem = asyncio.Semaphore(3)

app = FastAPI(title="Cheapstay")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    hotel_name: str | None = None
    location: str = ""
    checkin: str
    checkout: str
    adults: int = 2
    rooms: int = 1
    force_refresh: bool = False


class ConfigUpdate(BaseModel):
    credit_card_rate: float | None = None
    agoda_affiliate_id: str | None = None
    travelpayouts_token: str | None = None
    travelpayouts_marker: str | None = None
    sites: dict | None = None


@app.post("/search")
async def search(req: SearchRequest):
    config = load_config()

    # Return cached result if available (3-hour TTL), unless force_refresh requested
    if not req.force_refresh:
        cached = await search_cache.get(req.hotel_name, req.location, req.checkin, req.checkout, req.adults)
        if cached is not None:
            return cached

    async with _scrape_sem:
        if not req.force_refresh:
            cached = await search_cache.get(req.hotel_name, req.location, req.checkin, req.checkout, req.adults)
            if cached is not None:
                return cached

        raw = [await booking.fetch_price(req.hotel_name, req.location, req.checkin, req.checkout, req.adults)]

    enriched = [apply_cashback(r, config) for r in raw]

    # Sort by net_price: real prices first (ascending), then N/A entries at the end
    with_price = sorted([r for r in enriched if r["net_price"] is not None], key=lambda r: r["net_price"])
    without_price = [r for r in enriched if r["net_price"] is None]

    sorted_results = with_price + without_price

    if with_price:
        with_price[0]["best"] = True

    await search_cache.set(req.hotel_name, req.location, req.checkin, req.checkout, req.adults, sorted_results)
    return sorted_results


@app.get("/config")
async def get_config():
    config = load_config()
    # Don't expose the API key to the frontend
    safe = {k: v for k, v in config.items() if k != "scraperapi_key"}
    return safe


@app.put("/config")
async def update_config(update: ConfigUpdate):
    config = load_config()

    if update.credit_card_rate is not None:
        if not 0 <= update.credit_card_rate <= 1:
            raise HTTPException(status_code=400, detail="credit_card_rate must be between 0 and 1")
        config["credit_card_rate"] = update.credit_card_rate

    if update.agoda_affiliate_id is not None:
        config["agoda_affiliate_id"] = update.agoda_affiliate_id.strip()

    if update.travelpayouts_token is not None:
        config["travelpayouts_token"] = update.travelpayouts_token.strip()

    if update.travelpayouts_marker is not None:
        config["travelpayouts_marker"] = update.travelpayouts_marker.strip()

    if update.sites is not None:
        config.setdefault("sites", {})
        for site, data in update.sites.items():
            config["sites"].setdefault(site, {})
            if "rate" in data:
                if not 0 <= data["rate"] <= 1:
                    raise HTTPException(status_code=400, detail=f"Rate for {site} must be between 0 and 1")
                config["sites"][site]["rate"] = data["rate"]

    save_config(config)
    return {"status": "ok"}


@app.get("/suggest")
async def suggest(q: str, location: str = ""):
    import httpx
    _HOTEL_TYPES = {"hotel", "house", "tourism", "hostel", "motel", "guest_house"}
    _CITY_TYPES  = {"city", "town", "village", "district", "county", "state"}

    async def _photon(query: str, limit: int = 8, osm_tag: str = ""):
        try:
            params: dict = {"q": query, "limit": limit, "lang": "en"}
            if osm_tag:
                params["osm_tag"] = osm_tag
            async with httpx.AsyncClient(
                headers={"User-Agent": "Mozilla/5.0 hotel-price-checker/1.0"},
                timeout=8,
            ) as c:
                r = await c.get("https://photon.komoot.io/api/", params=params)
                return r.json().get("features", [])
        except Exception:
            return []

    city_features, hotel_features = await asyncio.gather(
        _photon(f"{q} {location}"),
        _photon(q, limit=10, osm_tag="tourism:hotel"),
    )

    seen, results = set(), []

    for feature in city_features:
        p = feature.get("properties", {})
        osm_val = p.get("osm_value") or p.get("type") or ""
        name = p.get("name", "").strip()
        country = p.get("country") or ""
        if name and name not in seen and osm_val in _CITY_TYPES:
            seen.add(name)
            results.append({"name": name, "city": name, "country": country, "is_city": True})

    for feature in hotel_features:
        p = feature.get("properties", {})
        osm_val = p.get("osm_value") or p.get("type") or ""
        name = p.get("name", "").strip()
        city = p.get("city") or p.get("state") or ""
        country = p.get("country") or ""
        if name and name not in seen and osm_val in _HOTEL_TYPES:
            seen.add(name)
            results.append({"name": name, "city": city, "country": country, "is_city": False})

    return results[:10]


class CitySearchRequest(BaseModel):
    location: str
    checkin: str
    checkout: str
    adults: int = 2
    offset: int = 0
    limit: int = 20
    force_refresh: bool = False
    hotel_name: str | None = None  # set when user searched for a specific hotel


_CITY_CACHE_KEY = "__city__"


@app.post("/search-city")
async def search_city(req: CitySearchRequest):
    config = load_config()
    aff_id = config.get("agoda_affiliate_id", "").strip()

    use_cache = (not req.force_refresh) and (not req.hotel_name) or req.offset > 0
    if use_cache:
        cached = await search_cache.get(_CITY_CACHE_KEY, req.location, req.checkin, req.checkout, req.adults)
        if cached is not None:
            all_hotels  = cached["hotels"]
            total_count = cached.get("total_count", len(all_hotels))
            page_hotels = all_hotels[req.offset : req.offset + req.limit]
            return {
                "hotels":       page_hotels,
                "total_agoda":  total_count,
                "cached_count": len(all_hotels),
                "offset":       req.offset,
                "limit":        req.limit,
                "has_more":     req.offset + req.limit < len(all_hotels),
            }

    if req.offset > 0:
        return {"hotels": [], "total_agoda": 0, "cached_count": 0,
                "offset": req.offset, "limit": req.limit, "has_more": False}

    nights = _nights(req.checkin, req.checkout)

    async with _scrape_sem:
        bk_result = await booking.fetch_city_hotels(
            req.location, req.checkin, req.checkout, req.adults,
            hotel_name=req.hotel_name or "",
        )

    bk_hotels   = bk_result.get("hotels") or []
    total_count = bk_result.get("total_count") or len(bk_hotels)

    # Agoda search link (affiliate) for "Book on Agoda" button — no price scraping
    agoda_city_url = agoda.build_search_url(None, req.location, req.checkin, req.checkout, req.adults)
    if aff_id:
        agoda_city_url += f"&cid={aff_id}"

    results = []
    for idx, h in enumerate(bk_hotels):
        price = h.get("price")
        stars = h.get("stars")
        results.append({
            "name":           h["name"],
            "image_url":      h.get("imgUrl"),
            "rating":         h.get("rating"),
            "review_label":   None,
            "review_count":   None,
            "stars":          stars,
            "location":       h.get("location"),
            "original_price": h.get("originalPrice"),
            "nights":         nights,
            "amenities":      [],
            "review_snippet": None,
            "deal_badge":     _deal_badge(price, h.get("originalPrice")),
            "agoda_price":    None,
            "agoda_url":      agoda_city_url,
            "hl_price":       None,
            "hl_url":         None,
            "best_platform":  "booking",
            "price":          price,
            "booking_url":    h.get("href") or agoda_city_url,
            "total_price":    round(price * nights, 2) if price else None,
        })

    await search_cache.set(_CITY_CACHE_KEY, req.location, req.checkin, req.checkout, req.adults, {
        "hotels": results, "total_count": total_count,
    })

    page_hotels = results[:req.limit]
    return {
        "hotels":       page_hotels,
        "total_agoda":  total_count,
        "cached_count": len(results),
        "offset":       0,
        "limit":        req.limit,
        "has_more":     req.limit < len(results),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ip")
async def ip_info():
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get("https://ipapi.co/json/")
            d = r.json()
            return {
                "ip": d.get("ip"),
                "country": d.get("country_name"),
                "country_code": d.get("country_code"),
            }
    except Exception:
        return {"ip": None, "country": "Unknown", "country_code": None}


@app.get("/debug-scrape")
async def debug_scrape():
    import os, traceback
    from bs4 import BeautifulSoup
    from playwright.async_api import async_playwright
    from scrapers.booking import build_search_url

    proxy_url = os.environ.get("NORDVPN_SOCKS5_URL", "")
    result = {
        "NORDVPN_SOCKS5_URL_set": bool(proxy_url),
        "proxy_prefix": proxy_url[:20] + "..." if proxy_url else None,
    }

    url = build_search_url("Bangkok", "2026-08-01", "2026-08-03", 2)
    result["url"] = url
    proxy_config = {"server": proxy_url} if proxy_url else None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, proxy=proxy_config)
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            html = await page.content()
            await browser.close()
        result["html_length"] = len(html)
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select('[data-testid="property-card"]')
        result["property_cards_found"] = len(cards)
        result["html_snippet"] = html[:300]
        result["status"] = "ok" if cards else "no_cards"
    except Exception as e:
        result["status"] = "exception"
        result["error"] = str(e)
        result["traceback"] = traceback.format_exc()

    return result




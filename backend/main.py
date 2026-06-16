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
    booking_only: bool = False      # phase-1 fast path: return booking results immediately


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

    if req.booking_only:
        async with _scrape_sem:
            bk_result = await booking.fetch_city_hotels(
                req.location, req.checkin, req.checkout, req.adults,
                hotel_name=req.hotel_name or "",
            )
        ag_result = {"hotels": [], "total_count": 0}
    else:
        async with _scrape_sem:
            bk_result, ag_result = await asyncio.gather(
                booking.fetch_city_hotels(
                    req.location, req.checkin, req.checkout, req.adults,
                    hotel_name=req.hotel_name or "",
                ),
                agoda.fetch_city_hotels(
                    req.location, req.checkin, req.checkout, req.adults,
                    hotel_name=req.hotel_name or "",
                ),
            )

    bk_hotels   = bk_result.get("hotels") or []
    ag_hotels   = ag_result.get("hotels") or []
    total_count = bk_result.get("total_count") or len(bk_hotels)

    # Build Agoda price lookup by normalised hotel name
    def _norm(s: str) -> str:
        return _re.sub(r"[^a-z0-9]", "", s.lower())

    ag_by_name: dict[str, dict] = {}
    for h in ag_hotels:
        ag_by_name[_norm(h["name"])] = h

    agoda_city_url = agoda.build_search_url(None, req.location, req.checkin, req.checkout, req.adults)
    if aff_id:
        agoda_city_url += f"&cid={aff_id}"

    results = []
    for idx, h in enumerate(bk_hotels):
        bk_price = h.get("price")
        stars    = h.get("stars")

        # Try to match Agoda hotel by name
        ag_match = ag_by_name.get(_norm(h["name"]))
        ag_price = ag_match.get("price") if ag_match else None
        ag_url   = ag_match.get("href") or agoda_city_url if ag_match else agoda_city_url

        # Best price: whichever platform is cheaper
        prices = {k: v for k, v in {"booking": bk_price, "agoda": ag_price}.items() if v}
        if prices:
            best_platform = min(prices, key=lambda k: prices[k])
            best_price    = prices[best_platform]
        else:
            best_platform = "booking"
            best_price    = bk_price

        results.append({
            "name":           h["name"],
            "image_url":      h.get("imgUrl") or (ag_match.get("imgUrl") if ag_match else None),
            "rating":         h.get("rating") or (ag_match.get("rating") if ag_match else None),
            "review_label":   None,
            "review_count":   None,
            "stars":          stars or (ag_match.get("stars") if ag_match else None),
            "location":       h.get("location"),
            "original_price": h.get("originalPrice") or (ag_match.get("originalPrice") if ag_match else None),
            "nights":         nights,
            "amenities":      (ag_match.get("amenities") or []) if ag_match else [],
            "review_snippet": (ag_match.get("reviewSnippet")) if ag_match else None,
            "deal_badge":     _deal_badge(best_price, h.get("originalPrice")),
            "agoda_price":    ag_price,
            "agoda_url":      ag_url,
            "hl_price":       None,
            "hl_url":         None,
            "best_platform":  best_platform,
            "price":          best_price,
            "booking_price":  bk_price,
            "booking_url":    h.get("href") or agoda_city_url,
            "total_price":    round(best_price * nights, 2) if best_price else None,
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


_AGODA_CACHE_KEY = "__agoda__"


@app.get("/agoda-prices")
async def agoda_price_map(location: str, checkin: str, checkout: str, adults: int = 2):
    """Return a name→price map for Agoda hotels. Used by the frontend to merge prices after showing Booking results."""
    cached = await search_cache.get(_AGODA_CACHE_KEY, location, checkin, checkout, adults)
    if cached is not None:
        return cached

    async with _scrape_sem:
        ag_result = await agoda.fetch_city_hotels(location, checkin, checkout, adults, hotel_name="")

    def _norm(s: str) -> str:
        return _re.sub(r"[^a-z0-9]", "", s.lower())

    config = load_config()
    aff_id = config.get("agoda_affiliate_id", "").strip()
    prices: dict = {}
    for h in ag_result.get("hotels", []):
        if not h.get("price"):
            continue
        url = h.get("href", "")
        if aff_id and url and "cid=" not in url:
            url += f"&cid={aff_id}" if "?" in url else f"?cid={aff_id}"
        prices[_norm(h["name"])] = {
            "price": h["price"],
            "url": url,
            "img": h.get("imgUrl"),
            "rating": h.get("rating"),
        }

    result = {"prices": prices}
    await search_cache.set(_AGODA_CACHE_KEY, location, checkin, checkout, adults, result)
    return result


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

    proxy_url = os.environ.get("NORDVPN_SOCKS5_URL") or os.environ.get("THAI_PROXY") or ""
    thai_proxy_val = os.environ.get("THAI_PROXY", "")
    result = {
        "proxy_configured": bool(proxy_url),
        "proxy_prefix": proxy_url[:30] + "..." if proxy_url else None,
        "THAI_PROXY_prefix": thai_proxy_val[:30] + "..." if thai_proxy_val else None,
    }

    # Step 1: get current IP (no proxy — proxy is dead, NordVPN deprecated SOCKS5)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto("https://ipapi.co/json/", wait_until="domcontentloaded", timeout=15000)
            ip_text = await page.inner_text("body")
            await browser.close()
        result["server_ip_info"] = ip_text[:200]
    except Exception as e:
        result["ip_test_error"] = str(e)[:150]

    # Step 2: try Booking.com (no proxy)
    from scrapers.booking import build_search_url
    url = build_search_url("Bangkok", "2026-08-01", "2026-08-03", 2)
    result["url"] = url
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"],
            )
            ctx = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
            page = await ctx.new_page()
            await page.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
            await page.goto(url, timeout=60000)
            try:
                await page.wait_for_selector('[data-testid="property-card"]', timeout=20000)
            except Exception:
                pass
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
        result["error"] = str(e)[:300]

    return result




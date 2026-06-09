import asyncio
import re as _re
from datetime import date as _date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cashback import load_config, save_config, apply_cashback
from scrapers import agoda
from scrapers import hotellook
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

# Limit simultaneous Playwright sessions to avoid OOM on the server.
# Each Chromium process uses ~300-500MB RAM; a 2GB VPS can safely run 3-4 at once.
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
    api_key = config.get("scraperapi_key", "")

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

        raw = [await agoda.fetch_price(req.hotel_name, req.location, req.checkin, req.checkout, req.adults, api_key)]

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
    config = load_config()
    hl_token = config.get("travelpayouts_token", "").strip()

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

    async def _hotellook_hotels(query: str, limit: int = 6) -> list[dict]:
        """Hotel name autocomplete via Hotellook lookup — returns hotel suggestions."""
        if not hl_token:
            return []
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(
                    "https://engine.hotellook.com/api/v2/lookup.json",
                    params={"query": query, "lang": "en", "lookFor": "hotel",
                            "limit": limit, "token": hl_token},
                )
                if r.status_code != 200:
                    return []
                items = r.json().get("results", {}).get("hotels", [])
                return [
                    {
                        "name": h.get("label") or h.get("name", ""),
                        "city": h.get("cityName") or h.get("location", {}).get("name", ""),
                        "country": h.get("countryName", ""),
                        "is_city": False,
                    }
                    for h in items if h.get("label") or h.get("name")
                ]
        except Exception:
            return []

    # Run all queries in parallel: city bare, hotel-tagged OSM, Hotellook hotels
    city_features, hotel_features, hl_suggestions = await asyncio.gather(
        _photon(f"{q} {location}"),
        _photon(q, limit=10, osm_tag="tourism:hotel"),
        _hotellook_hotels(q),
    )

    seen, results = set(), []

    # Cities first
    for feature in city_features:
        p = feature.get("properties", {})
        osm_val = p.get("osm_value") or p.get("type") or ""
        name = p.get("name", "").strip()
        country = p.get("country") or ""
        if name and name not in seen and osm_val in _CITY_TYPES:
            seen.add(name)
            results.append({"name": name, "city": name, "country": country, "is_city": True})

    # Hotellook hotel suggestions (most comprehensive hotel database)
    for h in hl_suggestions:
        name = h["name"]
        if name and name not in seen:
            seen.add(name)
            results.append(h)

    # OSM hotel features
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


async def _fetch_agoda_city(req: CitySearchRequest) -> dict:
    async with _scrape_sem:
        return await agoda.fetch_city_hotels(
            req.location, req.checkin, req.checkout, req.adults,
            hotel_name=req.hotel_name or "",
        )


_CITY_CACHE_KEY = "__city__"


@app.post("/search-city")
async def search_city(req: CitySearchRequest):
    config   = load_config()
    aff_id   = config.get("agoda_affiliate_id", "").strip()
    hl_token = config.get("travelpayouts_token", "").strip()
    hl_mark  = config.get("travelpayouts_marker", "").strip()

    # Return cached slice if available.
    # Skip cache for hotel-name searches — cached city results aren't sorted by hotel match.
    use_cache = (not req.force_refresh) and (not req.hotel_name) or req.offset > 0
    if use_cache:
        cached = await search_cache.get(_CITY_CACHE_KEY, req.location, req.checkin, req.checkout, req.adults)
        if cached is not None:
            all_hotels  = cached["hotels"]
            total_count = cached.get("total_count", len(all_hotels))
            page_hotels = all_hotels[req.offset : req.offset + req.limit]
            return {
                "hotels":        page_hotels,
                "total_agoda":   total_count,
                "cached_count":  len(all_hotels),
                "offset":        req.offset,
                "limit":         req.limit,
                "has_more":      req.offset + req.limit < len(all_hotels),
            }

    # Cache miss on first page — scrape everything and cache it
    if req.offset > 0:
        # Shouldn't happen unless cache expired mid-session
        return {"hotels": [], "total_agoda": 0, "cached_count": 0,
                "offset": req.offset, "limit": req.limit, "has_more": False}

    nights = _nights(req.checkin, req.checkout)

    # When Hotellook token is configured, use it as the sole source — ~2s vs ~45s for Agoda scraping.
    # Falls back to Agoda-only if Hotellook returns nothing.
    if hl_token:
        hl_hotels = await hotellook.fetch_city_prices(
            req.location, req.checkin, req.checkout, req.adults, hl_token, hl_mark
        )
        if hl_hotels:
            # Sort by hotel name match if user searched for a specific hotel
            if req.hotel_name:
                hl_hotels = sorted(
                    hl_hotels,
                    key=lambda h: agoda._name_match_score(req.hotel_name, h.get("name", "")),
                    reverse=True,
                )
            results = []
            for idx, h in enumerate(hl_hotels):
                stars = h.get("stars")
                price = h["price"]
                results.append({
                    "name":           h["name"],
                    "image_url":      h.get("photo_url"),
                    "rating":         None,
                    "review_label":   None,
                    "review_count":   None,
                    "stars":          stars,
                    "location":       None,
                    "original_price": None,
                    "nights":         nights,
                    "amenities":      _amenities([], stars, idx),
                    "review_snippet": None,
                    "deal_badge":     None,
                    "agoda_price":    None,
                    "agoda_url":      None,
                    "hl_price":       price,
                    "hl_url":         h["url"],
                    "best_platform":  "hotellook",
                    "price":          price,
                    "booking_url":    h["url"],
                    "total_price":    round(price * nights, 2),
                })
            total_count = len(results)
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

    # Fallback: Agoda Playwright scraping (slow, used only when no Hotellook token)
    agoda_result = await _fetch_agoda_city(req)
    agoda_hotels = agoda_result.get("hotels") or []
    total_count  = agoda_result.get("total_count") or len(agoda_hotels)

    results = []
    for idx, h in enumerate(agoda_hotels):
        agoda_url = h.get("href") or ""
        if aff_id and agoda_url:
            sep = "&" if "?" in agoda_url else "?"
            agoda_url = f"{agoda_url}{sep}cid={aff_id}"
        agoda_price = h.get("price")
        stars = h.get("stars")
        results.append({
            "name":           h["name"],
            "image_url":      h.get("imgUrl"),
            "rating":         h.get("rating"),
            "review_label":   h.get("reviewLabel"),
            "review_count":   h.get("reviewCount"),
            "stars":          stars,
            "location":       h.get("location"),
            "original_price": h.get("originalPrice"),
            "nights":         nights,
            "amenities":      _amenities(h.get("amenities") or [], stars, idx),
            "review_snippet": _snippet(h.get("rating")),
            "deal_badge":     _deal_badge(agoda_price, h.get("originalPrice")),
            "agoda_price":    agoda_price,
            "agoda_url":      agoda_url,
            "hl_price":       None,
            "hl_url":         None,
            "best_platform":  "agoda",
            "price":          agoda_price,
            "booking_url":    agoda_url,
            "total_price":    round(agoda_price * nights, 2) if agoda_price else None,
        })

    # Cache full result set for subsequent offset requests
    await search_cache.set(_CITY_CACHE_KEY, req.location, req.checkin, req.checkout, req.adults, {
        "hotels":      results,
        "total_count": total_count,
    })

    page_hotels = results[:req.limit]
    return {
        "hotels":        page_hotels,
        "total_agoda":   total_count,
        "cached_count":  len(results),
        "offset":        0,
        "limit":         req.limit,
        "has_more":      req.limit < len(results),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ip")
async def ip_info():
    """Detect current public IP and country — used to show Thai IP vs US IP indicator."""
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


@app.get("/debug/screenshot")
async def debug_screenshot(site: str = "agoda", location: str = "bangkok", checkin: str = "2026-07-04", checkout: str = "2026-07-18", adults: int = 2):
    from scrapers.browser import fetch_cheapest
    from playwright.async_api import async_playwright
    import os

    url = agoda.build_search_url(None, location, checkin, checkout, adults)

    screenshot_path = os.path.join(os.path.dirname(__file__), f"debug_{site}.png")
    text_path = os.path.join(os.path.dirname(__file__), f"debug_{site}.txt")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="en-US",
            viewport={"width": 1440, "height": 900},
        )
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        page = await ctx.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=90_000)
        await page.wait_for_timeout(12_000)
        await page.screenshot(path=screenshot_path, full_page=True)
        text = await page.inner_text("body")
        with open(text_path, "w") as f:
            f.write(text[:5000])
        await browser.close()

    return {
        "url": url,
        "screenshot": screenshot_path,
        "text_preview": text[:2000],
    }



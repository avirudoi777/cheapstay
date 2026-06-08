import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cashback import load_config, save_config, apply_cashback
from scrapers import agoda, direct
from cache import search_cache

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
    direct_url: str | None = None
    force_refresh: bool = False


class ConfigUpdate(BaseModel):
    credit_card_rate: float | None = None
    agoda_affiliate_id: str | None = None
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

        raw = await asyncio.gather(
            agoda.fetch_price(req.hotel_name, req.location, req.checkin, req.checkout, req.adults, api_key),
            direct.fetch_price(req.hotel_name, req.direct_url),
        )

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

    if update.sites is not None:
        for site, data in update.sites.items():
            if site in config["sites"]:
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

    async def _photon(query: str, limit: int = 8):
        try:
            async with httpx.AsyncClient(
                headers={"User-Agent": "Mozilla/5.0 hotel-price-checker/1.0"},
                timeout=8,
            ) as c:
                r = await c.get(
                    "https://photon.komoot.io/api/",
                    params={"q": query, "limit": limit, "lang": "en"},
                )
                return r.json().get("features", [])
        except Exception:
            return []

    # Run both queries in parallel — one biased toward hotels, one bare for cities
    hotel_features, city_features = await asyncio.gather(
        _photon(f"{q} {location} hotel"),
        _photon(f"{q} {location}"),
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


@app.post("/search-city")
async def search_city(req: CitySearchRequest):
    config = load_config()
    aff_id = config.get("agoda_affiliate_id", "").strip()

    async with _scrape_sem:
        hotels = await agoda.fetch_city_hotels(req.location, req.checkin, req.checkout, req.adults)

    results = []
    for h in hotels:
        url = h.get("href") or ""
        if aff_id and url:
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}cid={aff_id}"
        results.append({
            "name":           h["name"],
            "price":          h.get("price"),
            "image_url":      h.get("imgUrl"),
            "rating":         h.get("rating"),
            "review_label":   h.get("reviewLabel"),
            "review_count":   h.get("reviewCount"),
            "stars":          h.get("stars"),
            "location":       h.get("location"),
            "original_price": h.get("originalPrice"),
            "booking_url":    url,
        })
    return results


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



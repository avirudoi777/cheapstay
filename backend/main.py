import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cashback import load_config, save_config
from scrapers import liteapi
from cache import search_cache


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
    booking_affiliate_id: str | None = None
    travelpayouts_token: str | None = None
    travelpayouts_marker: str | None = None
    sites: dict | None = None


@app.post("/search")
async def search(req: SearchRequest):
    config = load_config()
    liteapi_key = config.get("liteapi_key", "").strip()

    if not req.force_refresh:
        cached = await search_cache.get(req.hotel_name, req.location, req.checkin, req.checkout, req.adults)
        if cached is not None:
            return cached

    if not liteapi_key:
        raise HTTPException(status_code=503, detail="No liteapi_key configured")

    result = await liteapi.fetch_city_hotels(
        liteapi_key, req.location, req.checkin, req.checkout, req.adults,
        hotel_name=req.hotel_name or "",
    )
    hotels = result.get("hotels", [])

    await search_cache.set(req.hotel_name, req.location, req.checkin, req.checkout, req.adults, hotels)
    return hotels


@app.get("/config")
async def get_config():
    config = load_config()
    safe = {k: v for k, v in config.items() if k not in ("scraperapi_key", "liteapi_key")}
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

    if update.booking_affiliate_id is not None:
        config["booking_affiliate_id"] = update.booking_affiliate_id.strip()

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
    hotel_name: str | None = None
    booking_only: bool = False


_CITY_CACHE_KEY = "__city__"


@app.post("/search-city")
async def search_city(req: CitySearchRequest):
    config = load_config()
    liteapi_key = config.get("liteapi_key", "").strip()

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

    if not liteapi_key:
        raise HTTPException(status_code=503, detail="No liteapi_key configured")

    result = await liteapi.fetch_city_hotels(
        liteapi_key,
        req.location,
        req.checkin,
        req.checkout,
        req.adults,
        hotel_name=req.hotel_name or "",
    )
    results     = result.get("hotels", [])
    total_count = result.get("total_count", len(results))

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

"""
Travelpayouts / Hotellook price fetcher.

Flow:
  1. lookup.json   — city name → locationId
  2. hotels.json   — locationId → [{id, name, stars}]
  3. cache.json    — locationId + dates → [{hotelId, priceFrom}]
  4. Join by id, match against Agoda hotel names by word-overlap
"""
import asyncio
import re
from typing import Optional
import httpx

LOOKUP_URL = "https://engine.hotellook.com/api/v2/lookup.json"
HOTELS_URL = "https://engine.hotellook.com/api/v2/hotels.json"
CACHE_URL  = "https://engine.hotellook.com/api/v2/cache.json"

_STOP = frozenset({"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and",
                   "resort", "resorts", "inn", "suites", "suite", "grand", "royal",
                   "boutique", "luxury", "spa", "pool", "executive", "premier"})


def _tokens(name: str) -> frozenset[str]:
    words = re.sub(r"[^a-z0-9 ]", "", name.lower()).split()
    return frozenset(w for w in words if w not in _STOP and len(w) > 1)


def _match_score(a: str, b: str) -> float:
    sa, sb = _tokens(a), _tokens(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / max(len(sa), len(sb))


async def _lookup_city_id(city: str, token: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(LOOKUP_URL, params={
                "query": city,
                "lang": "en",
                "lookFor": "city",
                "limit": 1,
                "token": token,
            })
            if r.status_code != 200:
                print(f"[hotellook] lookup failed: HTTP {r.status_code} for city={city!r}")
                return None
            locs = r.json().get("results", {}).get("locations", [])
            if not locs:
                print(f"[hotellook] lookup returned no locations for city={city!r}")
            if locs:
                return str(locs[0]["id"])
    except Exception as e:
        print(f"[hotellook] lookup exception: {e}")
    return None


async def _fetch_hotels(location_id: str, token: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(HOTELS_URL, params={
                "locationId": location_id,
                "limit": 200,
                "lang": "en",
                "token": token,
            })
            if r.status_code == 200:
                return r.json() or []
    except Exception:
        pass
    return []


async def _fetch_cache(location_id: str, checkin: str, checkout: str,
                       adults: int, token: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            r = await c.get(CACHE_URL, params={
                "locationId": location_id,
                "checkIn": checkin,
                "checkOut": checkout,
                "adults": adults,
                "currency": "USD",
                "limit": 200,
                "token": token,
            })
            if r.status_code == 200:
                return r.json() or []
    except Exception:
        pass
    return []


async def fetch_city_prices(
    location: str,
    checkin: str,
    checkout: str,
    adults: int,
    token: str,
    marker: str = "",
) -> list[dict]:
    """
    Return [{id, name, price, url}] for hotels in a city from Hotellook.
    Returns [] on any failure so callers can proceed Agoda-only.
    """
    city = location.split(",")[0].strip()
    location_id = await _lookup_city_id(city, token)
    if not location_id:
        return []

    hotels_raw, cache_raw = await asyncio.gather(
        _fetch_hotels(location_id, token),
        _fetch_cache(location_id, checkin, checkout, adults, token),
    )

    # Build id → {name, stars} map from hotels list
    info_by_id: dict[str, dict] = {}
    for h in hotels_raw:
        hid = str(h.get("id", h.get("hotelId", "")))
        name = h.get("name") or h.get("hotelName") or ""
        if hid and name:
            info_by_id[hid] = {"name": name, "stars": h.get("stars")}

    results: list[dict] = []
    for item in cache_raw:
        hid = str(item.get("hotelId", item.get("id", "")))
        price = item.get("priceFrom") or item.get("priceAvg")
        if not price or not hid:
            continue
        info = info_by_id.get(hid)
        if not info:
            continue

        qs = (
            f"destination={location_id}&hotelId={hid}"
            f"&checkIn={checkin}&checkOut={checkout}"
            f"&adults={adults}&currency=USD"
        )
        if marker:
            qs += f"&marker={marker}"
        url = f"https://search.hotellook.com/?{qs}"

        results.append({
            "id":        hid,
            "name":      info["name"],
            "stars":     info.get("stars"),
            "price":     float(price),
            "url":       url,
            "photo_url": f"https://photo.hotellook.com/image_v2/crop/{hid}/960/720.auto",
        })

    return results


def match_to_agoda(agoda_hotels: list[dict], hl_hotels: list[dict]) -> dict[int, dict]:
    """
    For each Agoda hotel (by index), find the best-matching Hotellook hotel.
    Returns {agoda_index: hl_hotel_dict}. Threshold: 55% word overlap.
    """
    if not hl_hotels:
        return {}

    matches: dict[int, dict] = {}
    for i, ag in enumerate(agoda_hotels):
        best_score = 0.55
        best_hl: Optional[dict] = None
        for hl in hl_hotels:
            s = _match_score(ag["name"], hl["name"])
            if s > best_score:
                best_score = s
                best_hl = hl
        if best_hl:
            matches[i] = best_hl

    return matches

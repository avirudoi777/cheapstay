"""
Agoda scraper — uses ScraperAPI render endpoint (country_code=th) instead of
local Playwright. No Chromium required; works on any server.
"""
import os
import re as _re
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from .browser import _extract_usd, _extract_thb_as_usd

_SCRAPERAPI_KEY = os.environ.get("SCRAPERAPI_KEY", "")

_COUNTRY_CODES = {
    "bangkok": "th", "phuket": "th", "chiangmai": "th", "chiang mai": "th",
    "pattaya": "th", "hua hin": "th", "krabi": "th", "koh samui": "th", "thailand": "th",
    "jakarta": "id", "bali": "id", "indonesia": "id",
    "singapore": "sg",
    "kuala lumpur": "my", "penang": "my", "malaysia": "my",
    "ho chi minh": "vn", "hanoi": "vn", "da nang": "vn", "vietnam": "vn",
    "tokyo": "jp", "osaka": "jp", "kyoto": "jp", "japan": "jp",
    "seoul": "kr", "korea": "kr",
    "hong kong": "hk",
    "taipei": "tw", "taiwan": "tw",
    "manila": "ph", "philippines": "ph",
    "dubai": "ae", "uae": "ae",
    "london": "gb",
    "new york": "us", "los angeles": "us",
}

_GENERIC = {"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and", "&",
            "resort", "resorts", "inn", "suites", "suite", "grand", "royal",
            "bangkok", "phuket", "bali", "singapore"}


def _city_slug(location: str, hotel_name: str = "") -> str:
    combined = f"{location} {hotel_name}".lower().strip()
    cc = "th"
    for keyword, code in _COUNTRY_CODES.items():
        if keyword in combined:
            cc = code
            break
    city_str = location.split(",")[0].strip().lower()
    city_str = city_str or "bangkok"
    return f"{city_str.replace(' ', '-')}-{cc}"


def build_search_url(hotel_name: str | None, location: str, checkin: str, checkout: str,
                     adults: int, text_search: str = "") -> str:
    if text_search:
        return (
            f"https://www.agoda.com/search"
            f"?checkIn={checkin}&checkOut={checkout}"
            f"&adults={adults}&rooms=1&currencyCode=USD"
            f"&priceCur=USD&searchText={quote_plus(text_search)}"
        )
    slug = _city_slug(location, hotel_name or "")
    return (
        f"https://www.agoda.com/city/{slug}.html"
        f"?checkIn={checkin}&checkOut={checkout}"
        f"&adults={adults}&rooms=1&currencyCode=USD"
    )


def _name_match_score(query: str, hotel_name: str) -> float:
    stop = {"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and", "&",
            "resort", "spa", "inn", "suite", "suites", "grand", "royal"}
    def tokens(s: str):
        words = _re.sub(r"[^a-z0-9 ]", "", s.lower()).split()
        return {w for w in words if w not in stop and len(w) > 1}
    qa, qb = tokens(query), tokens(hotel_name)
    if not qa or not qb:
        return 0.0
    return len(qa & qb) / max(len(qa), len(qb))


async def _scraperapi_render(url: str, wait_selector: str = "") -> str | None:
    """Fetch a JS-rendered page via ScraperAPI (Thai IP). Returns HTML or None."""
    if not _SCRAPERAPI_KEY:
        return None
    params: dict = {
        "api_key": _SCRAPERAPI_KEY,
        "url": url,
        "render": "true",
        "country_code": "th",
        "wait": "6000",
    }
    if wait_selector:
        params["wait_for_selector"] = wait_selector
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.get("https://api.scraperapi.com/", params=params)
        return r.text if r.status_code == 200 else None
    except Exception:
        return None


def _parse_hotels(html: str) -> list[dict]:
    """Parse Agoda search results HTML → list of hotel dicts."""
    soup = BeautifulSoup(html, "lxml")
    hotels: list[dict] = []
    seen_names: set[str] = set()

    name_els = soup.select('[data-selenium="hotel-name"]')
    for name_el in name_els:
        name = name_el.get_text(strip=True)
        if not name or name in seen_names:
            continue

        # Walk up the DOM to find the card containing a price element
        card = name_el
        for _ in range(25):
            if card.select_one("[data-element-name='final-price']"):
                break
            if card.parent is None:
                break
            card = card.parent

        price_el = card.select_one("[data-element-name='final-price']")
        if not price_el:
            continue

        price_text = price_el.get_text(strip=True).replace("\xa0", "").replace(" ", "")
        prices = _extract_usd(price_text) or _extract_thb_as_usd(price_text)

        link = card.select_one('a[href*="/hotel/"]') or name_el.find_parent('a')
        href = link.get('href') if link else None

        img = (card.select_one('img[src*="agoda.net"]') or
               card.select_one('img[src*="akamai"]') or
               card.select_one('img[data-src]') or
               card.select_one('img'))
        img_url = None
        if img:
            img_url = img.get('src') or img.get('data-src')

        rating_el = (card.select_one('[data-element-name="review-score"]') or
                     card.select_one('[data-selenium="review-score"]'))
        rating = rating_el.get_text(strip=True) if rating_el else None
        if not rating:
            for leaf in card.find_all(['span', 'div']):
                if not leaf.find_all(recursive=False):
                    t = leaf.get_text(strip=True)
                    if _re.match(r'^([6-9]\.\d|10\.?0?)$', t):
                        rating = t
                        break

        stars_el = card.select_one('[data-element-name="star-rating"]')
        stars = None
        if stars_el:
            m = _re.search(r'(\d)', stars_el.get('aria-label', '') or stars_el.get_text())
            if m:
                stars = int(m.group(1))

        amenity_els = card.select(
            '[data-element-name="facility-highlight"],[class*="FacilityTag"],'
            '[class*="facility-tag"],[class*="HighlightedFacility"]'
        )
        amenities = list(dict.fromkeys(
            e.get_text(strip=True) for e in amenity_els
            if e.get_text(strip=True) and len(e.get_text(strip=True)) < 35
        ))[:3]

        snip_el = card.select_one('[data-element-name="review-snippet"],[class*="ReviewSnippet"]')
        snippet = snip_el.get_text(strip=True) if snip_el else None

        orig_el = (card.select_one('[data-element-name="strike-through-price"]') or
                   card.select_one('[style*="line-through"]'))
        orig_price = orig_el.get_text(strip=True) if orig_el else None

        seen_names.add(name)
        hotels.append({
            "name":          name,
            "price":         min(prices) if prices else None,
            "priceText":     price_text,
            "href":          href,
            "imgUrl":        img_url,
            "rating":        rating,
            "stars":         stars,
            "amenities":     amenities,
            "reviewSnippet": snippet,
            "originalPrice": orig_price,
            "location":      None,
        })

    return hotels


async def fetch_city_hotels(location: str, checkin: str, checkout: str, adults: int,
                            hotel_name: str = "") -> dict:
    """Fetch Agoda city results via ScraperAPI (Thai IP). No local Chromium needed."""
    city_url = build_search_url(None, location, checkin, checkout, adults)

    html = await _scraperapi_render(city_url, wait_selector="[data-element-name='final-price']")
    if not html:
        return {"hotels": [], "total_count": 0}

    hotels = _parse_hotels(html)

    # Total count from page
    soup = BeautifulSoup(html, "lxml")
    total_count = 0
    for sel in ['[data-element-name="total-hotel-found-label"]',
                '[data-selenium="searchResultHeroText"]']:
        el = soup.select_one(sel)
        if el:
            m = _re.search(r'[\d,]+', el.get_text())
            if m:
                total_count = int(m.group().replace(',', ''))
                break
    if not total_count:
        m = _re.search(r'([\d,]+)\s+propert', html, _re.IGNORECASE)
        if m:
            total_count = int(m.group(1).replace(',', ''))

    if hotel_name and hotels:
        hotels.sort(key=lambda h: _name_match_score(hotel_name, h.get("name", "")), reverse=True)

    return {"hotels": hotels, "total_count": total_count or len(hotels)}


async def fetch_price(
    hotel_name: str | None,
    location: str,
    checkin: str,
    checkout: str,
    adults: int,
    api_key: str,
) -> dict:
    """Fetch price for a specific hotel via ScraperAPI."""
    search_text = hotel_name or location
    city = location.split(",")[0].strip()
    if hotel_name and city.lower() not in hotel_name.lower():
        search_text = f"{hotel_name} {city}"

    search_url = build_search_url(hotel_name, location, checkin, checkout, adults,
                                  text_search=search_text)
    fallback_url = build_search_url(None, location, checkin, checkout, adults)

    html = await _scraperapi_render(search_url, wait_selector="[data-element-name='final-price']")
    if not html:
        return {"platform": "Agoda", "raw_price": None, "currency": None,
                "booking_url": fallback_url, "error": "ScraperAPI fetch failed"}

    hotels = _parse_hotels(html)
    if not hotels:
        return {"platform": "Agoda", "raw_price": None, "currency": None,
                "booking_url": fallback_url, "error": "No hotels found"}

    # Best match by name
    if hotel_name:
        hotels.sort(key=lambda h: _name_match_score(hotel_name, h.get("name", "")), reverse=True)

    best = hotels[0]
    return {
        "platform":    "Agoda",
        "raw_price":   best.get("price"),
        "currency":    "USD",
        "booking_url": best.get("href") or fallback_url,
        "found_hotel": best.get("name"),
        "error":       None if best.get("price") else "Price not found",
    }

"""
Agoda scraper — Playwright (headless Chromium) + GraphQL intercept.
Intercepts Agoda's internal GraphQL API responses to get hotel data as JSON.
Avoids fragile HTML parsing; more reliable than CSS selectors.
From a Thai IP (LightNode Bangkok) this returns geo-discounted Thai pricing.
"""
import asyncio
import json
import re as _re

from playwright.async_api import async_playwright

from .browser import _THB_TO_USD

# Pre-cached city IDs for fast lookups (no extra page load needed)
_CITY_IDS: dict[str, int] = {
    "bangkok-th":    9395,
    "phuket-th":     6214,
    "chiang-mai-th": 3164,
    "pattaya-th":    3203,
    "krabi-th":      3170,
    "koh-samui-th":  3218,
    "hua-hin-th":    3168,
}

_COUNTRY_CODES = {
    # SE Asia
    "bangkok": "th", "phuket": "th", "chiangmai": "th", "chiang mai": "th",
    "pattaya": "th", "hua hin": "th", "krabi": "th", "koh samui": "th", "thailand": "th",
    "jakarta": "id", "bali": "id", "indonesia": "id",
    "singapore": "sg",
    "kuala lumpur": "my", "penang": "my", "malaysia": "my",
    "ho chi minh": "vn", "hanoi": "vn", "da nang": "vn", "vietnam": "vn",
    # East Asia
    "tokyo": "jp", "osaka": "jp", "kyoto": "jp", "japan": "jp",
    "seoul": "kr", "korea": "kr",
    "hong kong": "hk",
    "taipei": "tw", "taiwan": "tw",
    "manila": "ph", "philippines": "ph",
    # Middle East
    "dubai": "ae", "uae": "ae",
    # Europe
    "london": "gb", "united kingdom": "gb",
    "paris": "fr", "france": "fr",
    "amsterdam": "nl",
    "rome": "it", "milan": "it", "italy": "it",
    "berlin": "de", "germany": "de",
    "barcelona": "es", "madrid": "es", "spain": "es",
    # US
    "new york": "us", "los angeles": "us", "las vegas": "us", "paradise": "us",
    "miami": "us", "chicago": "us", "san francisco": "us", "seattle": "us",
    "boston": "us", "denver": "us", "orlando": "us", "dallas": "us",
    "phoenix": "us", "atlanta": "us", "washington": "us", "hawaii": "us",
    "nevada": "us", "california": "us", "florida": "us", "texas": "us",
    "united states": "us",
    # Australia / Canada / India
    "sydney": "au", "melbourne": "au", "australia": "au",
    "toronto": "ca", "vancouver": "ca", "canada": "ca",
    "mumbai": "in", "delhi": "in", "goa": "in", "india": "in",
}

_BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
]
_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


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
    """Build a public Agoda search URL (used for affiliate links and fallbacks)."""
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


def _extract_price_thb(pricing: dict) -> float | None:
    """Extract THB price per night from pricing.offers[].roomOffers[].room.pricing[].price.perNight"""
    for offer in pricing.get("offers", []):
        for room_offer in offer.get("roomOffers", []):
            room = room_offer.get("room", {})
            room_pricing = room.get("pricing") or []
            # room.pricing is a list of {currency, price: {perNight, perBook}}
            entries = room_pricing if isinstance(room_pricing, list) else [room_pricing]
            for entry in entries:
                price_data = (entry.get("price") or {}) if isinstance(entry, dict) else {}
                per_night = price_data.get("perNight") or {}
                display = (per_night.get("exclusive") or {}).get("display")
                if display and display > 0:
                    return float(display)
    return None


def _parse_graphql_property(prop: dict, los: int, checkin: str, adults: int) -> dict | None:
    """Convert a GraphQL property dict to the hotel dict format expected by main.py."""
    pricing = prop.get("pricing", {}) or {}
    if not pricing.get("isAvailable"):
        return None

    thb_price = _extract_price_thb(pricing)
    if not thb_price:
        return None

    usd_price = round(thb_price * _THB_TO_USD, 2)

    content = prop.get("content", {}) or {}
    summary = content.get("informationSummary", {}) or {}

    name = summary.get("displayName") or summary.get("defaultName")
    if not name:
        return None

    url_path = (summary.get("propertyLinks") or {}).get("propertyPage", "")
    base_url = f"https://www.agoda.com{url_path}" if url_path else None
    full_url = (
        f"{base_url}?checkIn={checkin}&los={los}&adults={adults}&rooms=1&currencyCode=USD"
        if base_url else None
    )

    stars = summary.get("rating")

    reviews = content.get("reviews", {}) or {}
    cumulative = reviews.get("cumulative", {}) or {}
    review_score = cumulative.get("score")
    review_count = cumulative.get("reviewCount")

    snippet = None
    for cr in reviews.get("contentReview", []):
        summaries = (cr.get("summaries") or {})
        snippets = summaries.get("snippets", []) or []
        if snippets:
            snippet = snippets[0].get("snippet")
            break

    img_url = None
    images = content.get("images", {}) or {}
    hotel_images = images.get("hotelImages", []) or []
    if hotel_images:
        urls = hotel_images[0].get("urls", []) or []
        if urls:
            raw = urls[0].get("value", "")
            if raw:
                img_url = f"https:{raw}" if raw.startswith("//") else raw

    amenities = []
    highlight = content.get("highlight", {}) or {}
    features = (highlight.get("favoriteFeatures") or {}).get("features", []) or []
    for feat in features[:3]:
        title = feat.get("title")
        if title:
            amenities.append(title)

    return {
        "name":          name,
        "price":         usd_price,
        "priceText":     f"฿{thb_price:.0f}",
        "href":          full_url,
        "imgUrl":        img_url,
        "rating":        str(review_score) if review_score is not None else None,
        "stars":         int(stars) if stars else None,
        "amenities":     amenities,
        "reviewSnippet": snippet,
        "reviewCount":   str(review_count) if review_count else None,
        "originalPrice": None,
        "location":      summary.get("localeName"),
    }


async def _fetch_graphql_hotels(
    slug: str,
    checkin: str,
    checkout: str,
    adults: int,
    location: str = "",
) -> tuple[list[dict], int]:
    """
    Fetch hotels via Agoda's internal GraphQL API.
    If the city_id is not in the static table, loads the dateless city page
    first to capture it from the first GraphQL request.
    """
    from datetime import datetime
    dt_in  = datetime.strptime(checkin, "%Y-%m-%d")
    dt_out = datetime.strptime(checkout, "%Y-%m-%d")
    los = max((dt_out - dt_in).days, 1)

    city_id = _CITY_IDS.get(slug)
    all_props: list[dict] = []
    total_count = 0

    for attempt in range(2):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True, args=_BROWSER_ARGS)
                ctx = await browser.new_context(user_agent=_UA, locale="en-US")
                page = await ctx.new_page()
                await page.add_init_script(
                    "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"
                )

                # Step 1: Discover cityId if not already known
                if not city_id:
                    captured_id: list[int] = []

                    async def _on_request(request):
                        if "graphql" in request.url and not captured_id:
                            try:
                                body = json.loads(request.post_data or "")
                                if body.get("operationName") == "citySearch":
                                    cid = body["variables"]["CitySearchRequest"]["cityId"]
                                    if cid:
                                        captured_id.append(cid)
                            except Exception:
                                pass

                    page.on("request", _on_request)
                    # Use text search URL for discovery — works for any global destination.
                    # Slug-based city URLs only exist for pre-known Agoda city slugs.
                    if location:
                        discovery_url = f"https://www.agoda.com/search?q={location.replace(' ', '+')}&currencyCode=USD"
                    else:
                        discovery_url = f"https://www.agoda.com/city/{slug}.html"
                    await page.goto(discovery_url, timeout=60000, wait_until="domcontentloaded")
                    # Wait until we have the city ID (max 6s)
                    for _ in range(12):
                        if captured_id:
                            break
                        await asyncio.sleep(0.5)

                    if not captured_id:
                        await browser.close()
                        if attempt == 0:
                            await asyncio.sleep(3)
                        continue

                    city_id = captured_id[0]
                    _CITY_IDS[slug] = city_id  # cache for next call

                # Step 2: Navigate to dated search URL and intercept GraphQL responses
                dated_url = (
                    f"https://www.agoda.com/search"
                    f"?city={city_id}&checkIn={checkin}&los={los}"
                    f"&rooms=1&adults={adults}&currencyCode=USD"
                )

                async def _on_response(response):
                    if "graphql" not in response.url:
                        return
                    try:
                        ct = response.headers.get("content-type", "")
                        if "json" not in ct:
                            return
                        text = await response.text()
                        data = json.loads(text)
                        city_search = (data.get("data") or {}).get("citySearch") or {}
                        props = city_search.get("properties") or []
                        if props:
                            all_props.extend(props)
                        nonlocal total_count
                        if not total_count:
                            search_info = (city_search.get("searchResult") or {}).get("searchInfo") or {}
                            total_count = (
                                search_info.get("totalFilteredHotels")
                                or search_info.get("totalActiveHotels")
                                or 0
                            )
                    except Exception:
                        pass

                page.on("response", _on_response)
                await page.goto(dated_url, timeout=60000, wait_until="domcontentloaded")
                await asyncio.sleep(12)  # allow multiple pagination batches to load
                await browser.close()

            if all_props:
                break
            if attempt == 0:
                await asyncio.sleep(3)
        except Exception:
            if attempt == 0:
                await asyncio.sleep(3)

    hotels: list[dict] = []
    seen: set[str] = set()
    for prop in all_props:
        try:
            h = _parse_graphql_property(prop, los, checkin, adults)
            if h and h["name"] not in seen:
                seen.add(h["name"])
                hotels.append(h)
        except Exception:
            continue

    return hotels, total_count


async def fetch_city_hotels(location: str, checkin: str, checkout: str, adults: int,
                            hotel_name: str = "") -> dict:
    """Fetch Agoda city results via GraphQL intercept. Thai IP gives geo-discounted prices."""
    slug = _city_slug(location, hotel_name or "")
    hotels, total_count = await _fetch_graphql_hotels(slug, checkin, checkout, adults, location)

    if hotel_name and hotels:
        hotels.sort(key=lambda h: _name_match_score(hotel_name, h.get("name", "")), reverse=True)

    return {"hotels": hotels, "total_count": total_count or len(hotels)}


async def fetch_price(
    hotel_name: str | None,
    location: str,
    checkin: str,
    checkout: str,
    adults: int,
) -> dict:
    """Fetch price for a specific hotel via Agoda."""
    slug = _city_slug(location, hotel_name or "")
    fallback_url = build_search_url(hotel_name, location, checkin, checkout, adults)

    hotels, _ = await _fetch_graphql_hotels(slug, checkin, checkout, adults, location)
    if not hotels:
        return {"platform": "Agoda", "raw_price": None, "currency": None,
                "booking_url": fallback_url, "error": "No hotels found"}

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

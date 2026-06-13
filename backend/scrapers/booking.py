"""
Booking.com scraper — Playwright (headless Chromium) + BeautifulSoup.
Playwright executes JS so it passes Cloudflare challenges. Booking.com is SSR
so domcontentloaded is fast (~5-10s). Thai IP via NordVPN SOCKS5 proxy.
Price shown on results page is total for stay; we divide by nights for per-night.
"""
import asyncio
import os
import re
from datetime import datetime
from urllib.parse import quote_plus

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# NordVPN SOCKS5 proxy for Thai IP geo-pricing.
# Format: socks5://username:password@th1.nordvpn.com:1080
# Get credentials: nordvpn.com → Nord Account → Services → NordVPN → Manual Setup
_PROXY = os.environ.get("NORDVPN_SOCKS5_URL") or os.environ.get("THAI_PROXY") or None

_STOP = frozenset({"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and",
                   "resort", "resorts", "inn", "suites", "suite", "grand", "royal",
                   "boutique", "luxury", "spa", "pool", "executive", "premier"})


def _nights(checkin: str, checkout: str) -> int:
    try:
        ci = datetime.strptime(checkin, "%Y-%m-%d")
        co = datetime.strptime(checkout, "%Y-%m-%d")
        return max(1, (co - ci).days)
    except Exception:
        return 1


def _name_match_score(query: str, hotel_name: str) -> float:
    def tokens(s: str):
        words = re.sub(r"[^a-z0-9 ]", "", s.lower()).split()
        return {w for w in words if w not in _STOP and len(w) > 1}
    qa, qb = tokens(query), tokens(hotel_name)
    if not qa or not qb:
        return 0.0
    return len(qa & qb) / max(len(qa), len(qb))


def build_search_url(location: str, checkin: str, checkout: str, adults: int,
                     hotel_name: str = "", sort_by_price: bool = False) -> str:
    query = hotel_name.strip() if hotel_name else location.split(",")[0].strip()
    url = (
        f"https://www.booking.com/searchresults.html"
        f"?ss={quote_plus(query)}"
        f"&checkin={checkin}&checkout={checkout}"
        f"&group_adults={adults}&no_rooms=1"
        f"&lang=en-us&selected_currency=USD"
    )
    if sort_by_price:
        url += "&order=price"
    return url


async def _fetch(url: str) -> str | None:
    proxy_config = {"server": _PROXY} if _PROXY else None
    for attempt in range(2):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    proxy=proxy_config,
                    args=["--disable-blink-features=AutomationControlled"],
                )
                ctx = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    locale="en-US",
                )
                page = await ctx.new_page()
                # Hide webdriver flag
                await page.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
                await page.goto(url, timeout=45000)
                # Wait for actual hotel cards or timeout after 15s
                try:
                    await page.wait_for_selector('[data-testid="property-card"]', timeout=15000)
                except Exception:
                    pass
                html = await page.content()
                await browser.close()
            if html and len(html) > 5000:
                return html
            if attempt == 0:
                await asyncio.sleep(3)
        except Exception:
            if attempt == 0:
                await asyncio.sleep(3)
    return None


def _parse_hotels(html: str, nights: int = 1) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select('[data-testid="property-card"]')
    hotels: list[dict] = []
    seen: set[str] = set()

    for card in cards:
        name_el = card.select_one('[data-testid="title"]')
        price_el = card.select_one('[data-testid="price-and-discounted-price"]')
        link_el = card.select_one('[data-testid="title-link"]')
        score_el = card.select_one('[data-testid="review-score"]')
        img_el = (card.select_one('img[src*="bstatic.com"]') or
                  card.select_one('img[src*="cf.bstatic"]') or
                  card.select_one('img'))
        addr_el = card.select_one('[data-testid="address-link"]')

        name = name_el.get_text(strip=True) if name_el else None
        if not name or name in seen:
            continue

        # Price is total for stay — divide by nights for per-night
        price_text = price_el.get_text(strip=True) if price_el else None
        price_per_night = None
        if price_text:
            nums = []
            for p in re.findall(r"[\d,]+", price_text):
                try:
                    v = float(p.replace(",", ""))
                    if v > 10:
                        nums.append(v)
                except ValueError:
                    pass
            if nums:
                total = min(nums)
                price_per_night = round(total / max(nights, 1), 2)

        # Strip Booking's own affiliate params from the link
        href = link_el.get("href") if link_el else None
        if href and "?" in href:
            href = href.split("?")[0]

        # Review score — Booking.com text is "Scored 8.48.4Good…" (value doubled).
        # Match "Scored X.Y" to grab just the first occurrence before the repeat.
        score_text = score_el.get_text(strip=True) if score_el else None
        rating = None
        if score_text:
            m = re.search(r"Scored\s+(\d+\.\d)", score_text)
            if m:
                rating = m.group(1)
            else:
                # Integer score (e.g. perfect 10 → "Scored 1010")
                m2 = re.search(r"Scored\s+(\d{1,2})\b", score_text)
                if m2:
                    val = int(m2.group(1))
                    if 0 < val <= 10:
                        rating = str(float(val))

        # Stars
        stars_el = card.select_one('[data-testid="rating-squares"]')
        stars = None
        if stars_el:
            aria = stars_el.get("aria-label", "")
            sm = re.search(r"(\d+)", aria)
            if sm:
                stars = int(sm.group(1))

        img_url = None
        if img_el:
            img_url = img_el.get("src") or img_el.get("data-src")

        addr = addr_el.get_text(strip=True) if addr_el else None

        seen.add(name)
        hotels.append({
            "name":          name,
            "price":         price_per_night,
            "priceText":     price_text,
            "href":          href,
            "imgUrl":        img_url,
            "rating":        rating,
            "stars":         stars,
            "amenities":     [],
            "reviewSnippet": None,
            "originalPrice": None,
            "location":      addr,
        })

    return hotels


async def fetch_city_hotels(location: str, checkin: str, checkout: str, adults: int,
                            hotel_name: str = "") -> dict:
    nights = _nights(checkin, checkout)
    url = build_search_url(location, checkin, checkout, adults, hotel_name)
    html = await _fetch(url)
    if not html:
        return {"hotels": [], "total_count": 0, "source_url": url}

    hotels = _parse_hotels(html, nights)

    if hotel_name and hotels:
        hotels.sort(key=lambda h: _name_match_score(hotel_name, h.get("name", "")), reverse=True)

    total_m = re.search(r"(\d[\d,]*)\s*(?:properties|results|homes|found)", html, re.IGNORECASE)
    try:
        total_count = int(total_m.group(1).replace(",", "")) if total_m else len(hotels)
    except (ValueError, AttributeError):
        total_count = len(hotels)

    return {"hotels": hotels, "total_count": total_count, "source_url": url}


async def fetch_price(hotel_name: str | None, location: str,
                      checkin: str, checkout: str, adults: int) -> dict:
    nights = _nights(checkin, checkout)
    city = location.split(",")[0].strip()
    query = f"{hotel_name} {city}" if hotel_name and city.lower() not in (hotel_name or "").lower() else hotel_name or city

    url = build_search_url(location, checkin, checkout, adults, hotel_name=query)
    fallback_url = build_search_url(location, checkin, checkout, adults)

    html = await _fetch(url)
    if not html:
        return {"platform": "Booking.com", "raw_price": None, "currency": None,
                "booking_url": fallback_url, "error": "Fetch failed"}

    hotels = _parse_hotels(html, nights)
    if not hotels:
        return {"platform": "Booking.com", "raw_price": None, "currency": None,
                "booking_url": fallback_url, "error": "No hotels found"}

    if hotel_name:
        hotels.sort(key=lambda h: _name_match_score(hotel_name, h.get("name", "")), reverse=True)

    best = hotels[0]
    return {
        "platform":    "Booking.com",
        "raw_price":   best.get("price"),
        "currency":    "USD",
        "booking_url": best.get("href") or fallback_url,
        "found_hotel": best.get("name"),
        "error":       None if best.get("price") else "Price not found",
    }

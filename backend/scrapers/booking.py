import re
from urllib.parse import quote_plus
from datetime import datetime
from playwright.async_api import async_playwright
from .browser import _extract_usd

try:
    from playwright_stealth import stealth_async
    _STEALTH = True
except ImportError:
    _STEALTH = False


def _nights(checkin: str, checkout: str) -> int:
    ci = datetime.strptime(checkin, "%Y-%m-%d")
    co = datetime.strptime(checkout, "%Y-%m-%d")
    return max(1, (co - ci).days)


def build_search_url(hotel_name: str | None, location: str, checkin: str, checkout: str, adults: int) -> str:
    query = quote_plus(f"{hotel_name} {location}".strip() if hotel_name else location)
    return (
        f"https://www.booking.com/searchresults.html"
        f"?ss={query}"
        f"&checkin={checkin}"
        f"&checkout={checkout}"
        f"&group_adults={adults}"
        f"&no_rooms=1"
        f"&selected_currency=USD"
    )


async def fetch_price(
    hotel_name: str | None,
    location: str,
    checkin: str,
    checkout: str,
    adults: int,
    api_key: str,
) -> dict:
    url = build_search_url(hotel_name, location, checkin, checkout, adults)
    nights = _nights(checkin, checkout)
    price, found_hotel, err = await _scrape(url, hotel_name, nights)
    return {
        "platform": "Booking.com",
        "raw_price": price,
        "currency": "USD",
        "booking_url": url,
        "found_hotel": found_hotel,
        "error": err if price is None else None,
    }


async def _scrape(url: str, hotel_name: str | None, nights: int) -> tuple[float | None, str | None, str | None]:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            viewport={"width": 1440, "height": 900},
        )
        await ctx.add_init_script(
            "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"
        )
        page = await ctx.new_page()
        if _STEALTH:
            await stealth_async(page)

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=90_000)
            try:
                await page.wait_for_selector(
                    "[data-testid='price-and-discounted-price'], .bui-price-display__value",
                    timeout=20_000,
                )
            except Exception:
                pass
            await page.wait_for_timeout(8_000)

            _GENERIC_KW = {"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and", "&",
                           "resort", "resorts", "inn", "suites", "suite", "grand", "royal",
                           "bangkok", "phuket", "bali", "singapore", "jakarta", "kuala", "lumpur"}
            keywords = []
            if hotel_name:
                for w in hotel_name.lower().split():
                    if w not in _GENERIC_KW and len(w) > 3:
                        keywords.append(w)
                if not keywords:
                    keywords = [hotel_name.lower().split()[0]]
            keyword = keywords[0] if keywords else None  # primary keyword for text fallback

            # Extract the matched hotel card name + price directly from DOM
            card = await page.evaluate(f"""() => {{
                const keywords = {repr(keywords)};
                const cards = document.querySelectorAll('[data-testid="property-card"]');
                for (const c of cards) {{
                    const titleEl = c.querySelector('[data-testid="title"]');
                    if (!titleEl) continue;
                    const name = titleEl.textContent.trim();
                    if (!keywords.length || keywords.every(kw => name.toLowerCase().includes(kw))) {{
                        const priceEl = c.querySelector(
                            '[data-testid="price-and-discounted-price"], .bui-price-display__value'
                        );
                        return {{ name, priceText: priceEl ? priceEl.textContent.trim() : null }};
                    }}
                }}
                // No keyword match — return first card
                const first = cards[0];
                if (!first) return null;
                const name = first.querySelector('[data-testid="title"]')?.textContent?.trim() || null;
                const priceEl = first.querySelector('[data-testid="price-and-discounted-price"]');
                return {{ name, priceText: priceEl ? priceEl.textContent.trim() : null }};
            }}""")

            found_hotel = card["name"] if card else None

            text = await page.inner_text("body")

            # Try DOM price from the card first
            stay_prices = []
            if card and card.get("priceText"):
                stay_prices = _extract_usd(card["priceText"])

            # If the matched hotel has no DOM price, check for unavailability before
            # falling through to last resort (which would grab similar-hotel prices)
            if found_hotel and not stay_prices:
                unavail_markers = [
                    "no availability on our site",
                    "unavailable on our site",
                    "this property has no availability",
                    "this property is unavailable",
                    "no availability for your dates",
                ]
                if any(m in text.lower() for m in unavail_markers):
                    with open("/tmp/booking_debug.txt", "w") as f:
                        f.write(f"URL: {url}\nFound: {found_hotel}\nCard: {card}\nNights: {nights}\nUNAVAILABLE\n\n{text[:6000]}")
                    return None, found_hotel, "Not available for these dates on Booking.com — click Check"

            # Text-based fallback: "Price US$NNN" near the hotel name
            if not stay_prices and keyword:
                price_pat = re.compile(r'Price\s+US\$\s*([\d,]+(?:\.\d{1,2})?)', re.IGNORECASE)
                for pm in price_pat.finditer(text):
                    val = float(pm.group(1).replace(",", ""))
                    nearby = text[pm.end(): pm.end() + 200].lower()
                    if keyword.lower() in nearby:
                        stay_prices = [val]
                        break

            # Last resort: all prices >= 30× nights (filters out filter-range noise)
            if not stay_prices:
                all_prices = _extract_usd(text)
                stay_prices = [p for p in all_prices if p >= nights * 30]

            with open("/tmp/booking_debug.txt", "w") as f:
                f.write(f"URL: {url}\nFound: {found_hotel}\nCard: {card}\nNights: {nights}\nPrices found: {stay_prices[:5]}\n\n{text[:6000]}")

            if stay_prices:
                per_night = round(min(stay_prices) / nights, 2)
                return per_night, found_hotel, None
            return None, found_hotel, "Price not found — click Check to view"

        finally:
            await browser.close()

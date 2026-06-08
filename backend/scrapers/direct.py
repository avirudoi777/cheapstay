import httpx
import re
from urllib.parse import quote_plus


def google_hotel_url(hotel_name: str) -> str:
    query = quote_plus(f"{hotel_name} official website book direct")
    return f"https://www.google.com/search?q={query}"


async def fetch_price(hotel_name: str, direct_url: str | None) -> dict:
    """
    Attempts a best-effort price scrape of the hotel's own website.
    Returns None price with a fallback Google search link if URL not provided
    or if parsing fails.
    """
    fallback_url = google_hotel_url(hotel_name)

    if not direct_url:
        return {
            "platform": "Hotel Direct",
            "raw_price": None,
            "currency": None,
            "booking_url": fallback_url,
            "error": "No direct URL provided — click to search",
        }

    try:
        async with httpx.AsyncClient(
            timeout=30,
            headers={"User-Agent": "Mozilla/5.0 (compatible; HotelPriceChecker/1.0)"},
            follow_redirects=True,
        ) as client:
            resp = await client.get(direct_url)
            resp.raise_for_status()
            html = resp.text

        price = _parse_price(html)

        return {
            "platform": "Hotel Direct",
            "raw_price": price,
            "currency": "USD",
            "booking_url": direct_url,
            "error": None if price else "Could not parse price — click to check manually",
        }
    except Exception as e:
        return {
            "platform": "Hotel Direct",
            "raw_price": None,
            "currency": None,
            "booking_url": direct_url or fallback_url,
            "error": str(e),
        }


def _parse_price(html: str) -> float | None:
    patterns = [
        r'\$\s*([\d,]+(?:\.\d{1,2})?)\s*/\s*night',
        r'"price"\s*:\s*"?\$?([\d,]+(?:\.\d{1,2})?)"?',
        r'data-price="([\d.]+)"',
        r'class="[^"]*rate[^"]*"[^>]*>\s*\$\s*([\d,]+(?:\.\d{1,2})?)',
    ]
    prices = []
    for pat in patterns:
        for m in re.finditer(pat, html, re.IGNORECASE):
            try:
                val = float(m.group(1).replace(",", ""))
                if 5 < val < 100_000:
                    prices.append(val)
            except ValueError:
                continue
    return min(prices) if prices else None

"""
Price extraction helpers shared across scrapers.
Playwright removed — scraping now done via ScraperAPI.
"""
import os
import re

_PROXY = os.environ.get("THAI_PROXY", "").strip() or None

_USD_RE = re.compile(
    r'(?:US\$|USD\s*|(?<!\w)\$)\s*([\d,]+(?:\.\d{1,2})?)',
    re.IGNORECASE,
)

_THB_TO_USD = 0.028
_THB_RE = re.compile(r'(?:฿|THB\s*)([\d,]+(?:\.\d{1,2})?)', re.IGNORECASE)


def _extract_usd(text: str) -> list[float]:
    prices = []
    for m in _USD_RE.finditer(text):
        try:
            val = float(m.group(1).replace(",", ""))
            if 10 < val < 50_000:
                prices.append(val)
        except ValueError:
            continue
    return prices


def _extract_thb_as_usd(text: str) -> list[float]:
    prices = []
    for m in _THB_RE.finditer(text):
        try:
            thb = float(m.group(1).replace(",", ""))
            usd = round(thb * _THB_TO_USD, 2)
            if 10 < usd < 50_000:
                prices.append(usd)
        except ValueError:
            continue
    return prices

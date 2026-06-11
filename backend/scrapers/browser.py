"""
Shared Playwright browser fetcher.
Uses THAI_PROXY env var (socks5://user:pass@host:port) when set,
otherwise falls back to the system network (your local VPN).
"""
import os
import re
from playwright.async_api import async_playwright

_PROXY = os.environ.get("THAI_PROXY", "").strip() or None
try:
    from playwright_stealth import stealth_async
    _STEALTH = True
except ImportError:
    _STEALTH = False

# USD patterns: US$82  USD 82  $82
_USD_RE = re.compile(
    r'(?:US\$|USD\s*|(?<!\w)\$)\s*([\d,]+(?:\.\d{1,2})?)',
    re.IGNORECASE,
)

# Thai Baht: ฿2,800 or THB 2,800 — Agoda may show THB on Thai IP
# Rough conversion rate (update if needed)
_THB_TO_USD = 0.028
_THB_RE = re.compile(r'(?:฿|THB\s*)([\d,]+(?:\.\d{1,2})?)', re.IGNORECASE)


async def fetch_cheapest(
    url: str,
    wait_selector: str | None = None,
    extra_wait_ms: int = 12_000,
    timeout_ms: int = 90_000,
) -> tuple[float | None, str | None]:
    """
    Opens `url` in headless Chromium, waits for JS to render, returns (lowest_price_usd, error).
    Runs locally so it inherits your system VPN — Thai IP for Agoda automatically.
    """
    async with async_playwright() as pw:
        launch_opts: dict = {"headless": True}
        if _PROXY:
            launch_opts["proxy"] = {"server": _PROXY}
        browser = await pw.chromium.launch(**launch_opts)
        ctx = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
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
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)

            if wait_selector:
                try:
                    await page.wait_for_selector(wait_selector, timeout=20_000)
                except Exception:
                    pass

            await page.wait_for_timeout(extra_wait_ms)

            text = await page.inner_text("body")
            prices = _extract_usd(text)

            if not prices:
                prices = _extract_thb_as_usd(text)

            return (min(prices) if prices else None), None

        except Exception as exc:
            return None, f"Browser error: {exc}"
        finally:
            await browser.close()


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

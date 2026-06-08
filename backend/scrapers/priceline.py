from urllib.parse import quote_plus
from datetime import datetime
from playwright.async_api import async_playwright
from .browser import _extract_usd

try:
    from playwright_stealth import stealth_async
    _STEALTH = True
except ImportError:
    _STEALTH = False


def _fmt_date(date_str: str) -> str:
    return datetime.strptime(date_str, "%Y-%m-%d").strftime("%m%d%Y")


def _aria_label(date_str: str) -> str:
    """2026-07-05 → 'July 5, 2026'"""
    return datetime.strptime(date_str, "%Y-%m-%d").strftime("%B %-d, %Y")


def build_search_url(hotel_name: str | None, location: str, checkin: str, checkout: str, adults: int) -> str:
    city = quote_plus(location.lower().split(",")[0].strip())
    return (
        f"https://www.priceline.com/relax/in/{city}"
        f"/from/{_fmt_date(checkin)}"
        f"/to/{_fmt_date(checkout)}"
        f"/rooms/1/adults/{adults}"
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
    city = location.split(",")[0].strip()

    try:
        price, found_hotel, err = await _scrape(city, checkin, checkout, adults, url)
        return {
            "platform": "Priceline",
            "raw_price": price,
            "currency": "USD",
            "booking_url": url,
            "found_hotel": found_hotel,
            "error": err if price is None else None,
        }
    except Exception as exc:
        return {
            "platform": "Priceline",
            "raw_price": None,
            "currency": None,
            "booking_url": url,
            "found_hotel": None,
            "error": str(exc)[:200],
        }


async def _scrape(city: str, checkin: str, checkout: str, adults: int, fallback_url: str) -> tuple[float | None, str | None, str | None]:
    checkin_label  = _aria_label(checkin)   # "July 5, 2026"
    checkout_label = _aria_label(checkout)  # "July 12, 2026"

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        ctx = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            viewport={"width": 1440, "height": 900},
        )
        page = await ctx.new_page()
        if _STEALTH:
            await stealth_async(page)

        try:
            # Navigate to Priceline homepage
            await page.goto("https://www.priceline.com/", wait_until="domcontentloaded", timeout=60_000)
            await page.wait_for_timeout(4_000)

            # Handle Cloudflare "Press & Hold" bot challenge if it appears
            body_text = await page.inner_text("body")
            if "press" in body_text.lower() and "hold" in body_text.lower():
                try:
                    # Try main frame first, then check all frames (challenge may be in iframe)
                    for ctx_obj in [page, *page.frames]:
                        for sel in ['button', '[role="button"]', 'div[tabindex]']:
                            try:
                                btn = await ctx_obj.query_selector(sel)
                                if not btn:
                                    continue
                                box = await btn.bounding_box()
                                if not box or box["width"] < 20:
                                    continue
                                cx = box["x"] + box["width"] / 2
                                cy = box["y"] + box["height"] / 2
                                await page.mouse.move(cx, cy)
                                await page.mouse.down()
                                await page.wait_for_timeout(3500)
                                await page.mouse.up()
                                await page.wait_for_timeout(5_000)
                                break
                            except Exception:
                                continue
                except Exception:
                    pass

            # Fill destination field
            dest_selectors = [
                '[data-testid="search-hotel-destination"]',
                'input[placeholder*="Where"]',
                'input[aria-label*="destination" i]',
                'input[aria-label*="Destination" i]',
                '#landing-hotel-where-input',
            ]
            dest_filled = False
            for sel in dest_selectors:
                try:
                    await page.wait_for_selector(sel, timeout=4_000)
                    await page.click(sel)
                    await page.fill(sel, city)
                    dest_filled = True
                    break
                except Exception:
                    continue

            if dest_filled:
                await page.wait_for_timeout(2_000)
                # Click first autocomplete suggestion
                for auto_sel in [
                    '[data-testid="typeahead-suggestion"]:first-child',
                    '[role="option"]:first-child',
                    'li[role="option"]:first-child',
                    '.autocomplete-suggestion:first-child',
                ]:
                    try:
                        await page.wait_for_selector(auto_sel, timeout=3_000)
                        await page.click(auto_sel)
                        break
                    except Exception:
                        continue
                await page.wait_for_timeout(1_500)

            # The date picker calendar should now be open — click check-in date
            # Calendar may need scrolling if the target month isn't visible
            checkin_sel  = f'[aria-label="{checkin_label}"]'
            checkout_sel = f'[aria-label="{checkout_label}"]'

            try:
                # Scroll the calendar forward if needed (up to 6 months)
                for _ in range(6):
                    try:
                        await page.wait_for_selector(checkin_sel, timeout=2_000)
                        break
                    except Exception:
                        # Click next-month arrow
                        for nav_sel in ['[aria-label="Next month"]', 'button[aria-label*="next" i]', '.DayPickerNavigation_button__horizontalDefault:last-child']:
                            try:
                                await page.click(nav_sel, timeout=1_500)
                                await page.wait_for_timeout(400)
                                break
                            except Exception:
                                continue

                await page.click(checkin_sel, timeout=5_000)
                await page.wait_for_timeout(600)
                await page.click(checkout_sel, timeout=5_000)
                await page.wait_for_timeout(600)

                # Click Done/Search button
                for btn in ["Done", "Search", "Apply", "Find Hotels"]:
                    try:
                        await page.click(f'button:has-text("{btn}")', timeout=2_500)
                        break
                    except Exception:
                        continue

            except Exception:
                pass

            await page.wait_for_timeout(15_000)

            text = await page.inner_text("body")

            with open("/tmp/priceline_debug.txt", "w") as f:
                f.write(f"URL attempted: {fallback_url}\nCity: {city}\nCheckin: {checkin_label}\n\n{text[:8000]}")

            # If the page is the homepage (form wasn't submitted / bot blocked),
            # don't extract prices — they'd be random city deal teasers, not our hotel
            homepage_markers = ["where to?", "find your hotel", "the negotiator", "fan fest"]
            if any(m in text.lower() for m in homepage_markers):
                return None, None, "Bot protection blocked Priceline — click Check to view manually"

            # Also bail if the searched city/hotel name doesn't appear in results
            if city and city.lower() not in text.lower():
                return None, None, "Priceline did not return Bangkok results — click Check"

            # Filter out promo/discount text prices (e.g. "Save $20", "Get $50 off")
            import re as _re
            promo_amounts = set()
            for m in _re.finditer(r'\b(?:save|off|discount|get|earn)\s+\$\s*([\d]+)', text, _re.IGNORECASE):
                promo_amounts.add(float(m.group(1)))

            prices = [p for p in _extract_usd(text) if p not in promo_amounts and p >= 30]
            if prices:
                return min(prices), None, None
            return None, None, "Price not found — click Check to view"

        finally:
            await browser.close()

import re as _re
from datetime import datetime
from playwright.async_api import async_playwright
from .browser import _extract_usd, _extract_thb_as_usd

_COUNTRY_CODES = {
    "bangkok": "th", "phuket": "th", "chiangmai": "th", "chiang mai": "th",
    "pattaya": "th", "hua hin": "th", "krabi": "th", "koh samui": "th", "thailand": "th",
    "jakarta": "id", "bali": "id", "surabaya": "id", "bandung": "id",
    "yogyakarta": "id", "lombok": "id", "indonesia": "id",
    "singapore": "sg",
    "kuala lumpur": "my", "kl": "my", "penang": "my", "malacca": "my", "malaysia": "my",
    "ho chi minh": "vn", "hanoi": "vn", "da nang": "vn", "vietnam": "vn",
    "tokyo": "jp", "osaka": "jp", "kyoto": "jp", "japan": "jp",
    "seoul": "kr", "busan": "kr", "korea": "kr",
    "hong kong": "hk",
    "taipei": "tw", "taiwan": "tw",
    "manila": "ph", "cebu": "ph", "philippines": "ph",
    "dubai": "ae", "uae": "ae",
    "london": "gb", "uk": "gb",
    "new york": "us", "los angeles": "us", "usa": "us",
}

_GENERIC = {"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and", "&",
            "resort", "resorts", "inn", "suites", "suite", "grand", "royal",
            "bangkok", "phuket", "bali", "singapore", "jakarta", "kuala", "lumpur"}


def _city_slug(location: str, hotel_name: str = "") -> str:
    """Derive a city-country slug for the Agoda city URL fallback."""
    combined = f"{location} {hotel_name}".lower().strip()
    cc = "th"
    for keyword, code in _COUNTRY_CODES.items():
        if keyword in combined:
            cc = code
            break
    city_str = location.split(",")[0].strip().lower()
    if not city_str:
        for keyword in _COUNTRY_CODES:
            if keyword in (hotel_name or "").lower():
                city_str = keyword.split()[0]
                break
    city_str = city_str or "bangkok"
    return f"{city_str.replace(' ', '-')}-{cc}"


def build_search_url(hotel_name: str | None, location: str, checkin: str, checkout: str, adults: int,
                     text_search: str = "") -> str:
    from urllib.parse import quote_plus
    if text_search:
        # Hotel-name search: use Agoda's search page with searchText — returns hotel-specific results
        # regardless of rank, unlike the city page which only shows the top ~60 by popularity.
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


def _aria_date(date_str: str) -> str:
    """2026-06-13 → 'Sat Jun 13 2026' (aria-label format on Agoda calendar cells)"""
    return datetime.strptime(date_str, "%Y-%m-%d").strftime("%a %b %d %Y")


# Extracts whatever hotel cards are currently visible in the DOM.
# Called multiple times during incremental scroll to defeat Agoda's virtual-list rendering.
_CARD_EXTRACT_JS = """() => {
    const results = [];
    const nameEls = document.querySelectorAll('[data-selenium="hotel-name"]');
    function first(root, sels) {
        for (const s of sels) { const e = root.querySelector(s); if (e) return e; }
        return null;
    }
    for (const el of nameEls) {
        const name = el.textContent.trim();
        if (!name) continue;
        let card = el.closest('[data-selenium="listItem"]')
                || el.closest('[data-element-name="hotel-card"]')
                || el.closest('li');
        if (!card || !card.querySelector("[data-element-name='final-price']")) {
            card = el;
            for (let i = 0; i < 25; i++) {
                card = card.parentElement;
                if (!card) break;
                if (card.querySelector("[data-element-name='final-price']")) break;
            }
        }
        if (!card) continue;
        const priceEl = card.querySelector("[data-element-name='final-price']");
        if (!priceEl) continue;
        const d = {name, priceText: priceEl.textContent.trim(),
            href: null, imgUrl: null, rating: null, reviewLabel: null,
            reviewCount: null, stars: null, location: null, originalPrice: null,
            amenities: [], reviewSnippet: null};
        const a = card.querySelector('a[href*="/hotel/"]') || el.closest('a');
        d.href = a ? a.href : null;
        const img = card.querySelector('img[src*="agoda"], img[src*="akamai"]')
                 || card.querySelector('img[data-src]') || card.querySelector('img[src]');
        d.imgUrl = img ? (img.src || img.getAttribute('data-src')) : null;
        const ratingEl = first(card, [
            '[data-element-name="review-score"]', '[data-selenium="review-score"]',
            '[class*="ReviewScore__Score"]', '[class*="scoreValue"]', '[class*="score-text"]']);
        if (ratingEl) { d.rating = ratingEl.textContent.trim(); }
        else {
            for (const leaf of card.querySelectorAll('span, div')) {
                if (leaf.children.length === 0) {
                    const t = leaf.textContent.trim();
                    if (/^([6-9]\.[0-9]|10\.?0?)$/.test(t)) { d.rating = t; break; }
                }
            }
        }
        const labelEl = first(card, ['[data-element-name="review-score-word"]',
            '[data-selenium="review-score-word"]', '[class*="ReviewWord"]', '[class*="review-score-word"]']);
        if (labelEl) d.reviewLabel = labelEl.textContent.trim();
        const cntEl = first(card, ['[data-element-name="review-count"]',
            '[data-selenium="review-count"]', '[class*="ReviewCount"]', '[class*="review-count"]']);
        if (cntEl) d.reviewCount = cntEl.textContent.replace(/[^0-9,]/g, '').trim();
        const starWrap = card.querySelector('[aria-label*=" star"]');
        if (starWrap) {
            const m = starWrap.getAttribute('aria-label').match(/(\d+)/);
            if (m) d.stars = Math.min(parseInt(m[1]), 5);
        }
        if (!d.stars) {
            const filled = card.querySelectorAll(
                '[class*="star"][class*="fill"]:not([class*="review"]),' +
                '[class*="StarFull"]:not([class*="review"])');
            if (filled.length >= 1 && filled.length <= 5) d.stars = filled.length;
        }
        const locEl = first(card, [
            '[data-selenium="area-city-name"]', '[data-element-name="area-city-name"]',
            '[class*="AreaCity"]', '[class*="area-city"]', '[class*="PropertyLocation"]',
            '[class*="LocationText"]', '[class*="location-text"]', '[class*="locationInfo"]']);
        if (locEl) { d.location = locEl.textContent.trim(); }
        else {
            const parent = el.parentElement;
            if (parent) {
                for (const sib of parent.querySelectorAll('span, a, div')) {
                    if (sib === el || sib.contains(el)) continue;
                    const t = sib.textContent.trim();
                    if (t.length > 3 && t.length < 70 && !t.includes('$') && !t.includes('฿')
                        && !/^\d+(\.\d+)?$/.test(t)
                        && (t.includes(',') || /district|sukhumvit|silom|siam|sathorn|ploenchit|nana|asok|thonglor|ekkamai/i.test(t))) {
                        d.location = t; break;
                    }
                }
            }
        }
        const origEl = first(card, ['[data-element-name="strike-through-price"]',
            '[class*="strike"]', '[class*="strikethrough"]', '[class*="crossedOut"]'])
            || card.querySelector('[style*="line-through"]');
        if (origEl) d.originalPrice = origEl.textContent.trim();
        const amenityEls = card.querySelectorAll(
            '[data-element-name="facility-highlight"],[class*="FacilityTag"],[class*="facility-tag"],' +
            '[class*="HighlightedFacility"],[class*="FacilityItem"],[class*="amenityTag"]');
        if (amenityEls.length > 0) {
            d.amenities = Array.from(amenityEls)
                .map(e => e.textContent.trim().replace(/\s+/g, ' '))
                .filter(t => t && t.length > 1 && t.length < 35).slice(0, 3);
        }
        const snipEl = first(card, ['[data-element-name="review-snippet"]',
            '[class*="ReviewSnippet"]', '[class*="GuestReviewText"]', '[class*="ReviewSummary"]']);
        if (snipEl) {
            const t = snipEl.textContent.trim().replace(/^["\\u201c\\u201d\\u2018\\u2019']+|["\\u201c\\u201d\\u2018\\u2019']+$/g, '');
            if (t && t.length > 10 && t.length < 120) d.reviewSnippet = t;
        }
        results.push(d);
    }
    return results;
}"""

_TOTAL_COUNT_JS = """() => {
    const candidates = [
        document.querySelector('[data-element-name="total-hotel-found-label"]'),
        document.querySelector('[data-selenium="searchResultHeroText"]'),
        document.querySelector('[data-element-name="search-result-count"]'),
        document.querySelector('[data-element-name="page-count-string"]'),
    ];
    for (const el of candidates) {
        if (el) { const m = el.textContent.match(/[\d,]+/);
            if (m) return parseInt(m[0].replace(/,/g, ''), 10); }
    }
    const m = document.body.innerText.match(/([\d,]+)\s+propert/i);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
}"""


def _name_match_score(query: str, hotel_name: str) -> float:
    """Word overlap score 0-1 between query tokens and hotel name tokens."""
    stop = {"hotel", "hotels", "the", "a", "an", "by", "at", "in", "and", "&",
            "resort", "spa", "inn", "suite", "suites", "grand", "royal"}
    def tokens(s: str):
        words = _re.sub(r"[^a-z0-9 ]", "", s.lower()).split()
        return {w for w in words if w not in stop and len(w) > 1}
    qa, qb = tokens(query), tokens(hotel_name)
    if not qa or not qb:
        return 0.0
    return len(qa & qb) / max(len(qa), len(qb))


def _distinctive_name(hotel_name: str, city: str) -> str:
    """Extract the distinctive part of a hotel name for Agoda searchText.
    Removes city words and generic terms so 'Amara Bangkok Hotel' → 'Amara'
    and 'Citin Sukhumvit 11 Nana Bangkok' → 'Citin Sukhumvit 11 Nana'.
    """
    generic = {"hotel", "hotels", "resort", "resorts", "inn", "suites", "suite",
               "lodge", "hostel", "motel", "boutique", "palace", "the", "a", "an"}
    city_words = {w.lower() for w in city.split()}
    # Strip "by Brand" suffix first
    name = _re.sub(r'\s+by\s+.*$', '', hotel_name, flags=_re.IGNORECASE).strip()
    kept = [w for w in name.split() if w.lower() not in (generic | city_words)]
    return ' '.join(kept[:5]) if kept else hotel_name


async def fetch_city_hotels(location: str, checkin: str, checkout: str, adults: int,
                            hotel_name: str = "") -> dict:
    """Scrape Agoda city results page → return hotel list sorted by name match if hotel_name given."""
    city_url = build_search_url(None, location, checkin, checkout, adults)
    ci_label = _aria_date(checkin)
    co_label = _aria_date(checkout)

    ctx_kwargs: dict = {
        "user_agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "locale": "en-US",
        "viewport": {"width": 1440, "height": 900},
    }

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(**ctx_kwargs)
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        page = await ctx.new_page()
        # Block fonts only — keep images so we can extract their URLs
        await page.route("**/*.{woff,woff2,ttf,otf}", lambda r: r.abort())

        try:
            await page.goto(city_url, wait_until="domcontentloaded", timeout=60_000)
            await page.wait_for_timeout(4_000)

            try:
                await page.click(f'[aria-label="{ci_label}"]', timeout=5_000)
                await page.wait_for_timeout(400)
                await page.click(f'[aria-label="{co_label}"]', timeout=5_000)
                await page.wait_for_timeout(400)
            except Exception:
                pass

            for btn_sel in ['[data-selenium="searchButton"]', 'button:has-text("SEARCH")']:
                try:
                    await page.click(btn_sel, timeout=3_000)
                    break
                except Exception:
                    continue

            try:
                await page.wait_for_selector("[data-element-name='final-price']", timeout=25_000)
                await page.wait_for_timeout(2_000)
            except Exception:
                pass

            # Incremental scroll-and-extract: Agoda uses React virtual/windowed rendering
            # so cards outside the viewport are removed from the DOM. We must extract at
            # each scroll position and deduplicate — never scroll back to top.
            seen: dict[str, dict] = {}

            def _accumulate(batch: list) -> None:
                for h in batch:
                    key = h.get("href") or h.get("name", "")
                    if key and key not in seen:
                        seen[key] = h

            _accumulate(await page.evaluate(_CARD_EXTRACT_JS))

            for step in range(30):
                if len(seen) >= 60:
                    break
                at_bottom = await page.evaluate(
                    "() => Math.ceil(window.scrollY + window.innerHeight)"
                    " >= document.documentElement.scrollHeight - 300"
                )
                if at_bottom:
                    break
                prev = len(seen)
                await page.evaluate("window.scrollBy(0, Math.floor(window.innerHeight * 0.8))")
                await page.wait_for_timeout(1_300)
                _accumulate(await page.evaluate(_CARD_EXTRACT_JS))
                # If count stalled for 2+ steps, wait a bit longer for lazy content
                if len(seen) == prev and step >= 2:
                    await page.wait_for_timeout(900)
                    _accumulate(await page.evaluate(_CARD_EXTRACT_JS))
                    if len(seen) == prev:
                        break  # truly no more content loading

            total_count: int = (await page.evaluate(_TOTAL_COUNT_JS)) or 0

            # Parse prices from priceText strings
            parsed = []
            for h in seen.values():
                pt = h.get("priceText", "").replace("\xa0", "").replace(" ", "")
                prices = _extract_usd(pt) or _extract_thb_as_usd(pt)
                parsed.append({
                    **h,
                    "price":         min(prices) if prices else None,
                    "amenities":     h.get("amenities") or [],
                    "reviewSnippet": h.get("reviewSnippet"),
                })
            # When searching by hotel name, sort best name-matches first
            if hotel_name and parsed:
                parsed.sort(key=lambda h: _name_match_score(hotel_name, h.get("name", "")), reverse=True)

            return {"hotels": parsed, "total_count": total_count}

        finally:
            await browser.close()


async def fetch_price(
    hotel_name: str | None,
    location: str,
    checkin: str,
    checkout: str,
    adults: int,
    api_key: str,
) -> dict:
    city_url = build_search_url(hotel_name, location, checkin, checkout, adults)

    try:
        price, found_hotel, booking_url, err = await _scrape(
            hotel_name, location, checkin, checkout, adults, city_url,
        )
        return {
            "platform": "Agoda",
            "raw_price": price,
            "currency": "USD",
            "booking_url": booking_url or city_url,
            "found_hotel": found_hotel,
            "error": err if price is None else None,
        }
    except Exception as exc:
        return {
            "platform": "Agoda",
            "raw_price": None,
            "currency": None,
            "booking_url": city_url,
            "found_hotel": None,
            "error": str(exc)[:200],
        }


async def _scrape(
    hotel_name: str | None,
    location: str,
    checkin: str,
    checkout: str,
    adults: int,
    city_url: str,
) -> tuple[float | None, str | None, str | None, str | None]:
    """Returns (price_usd, found_hotel_name, booking_url, error)"""
    ci_label = _aria_date(checkin)
    co_label = _aria_date(checkout)

    ctx_kwargs: dict = {
        "user_agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "locale": "en-US",
        "viewport": {"width": 1440, "height": 900},
    }

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=[])
        ctx = await browser.new_context(**ctx_kwargs)
        await ctx.add_init_script(
            "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"
        )
        page = await ctx.new_page()
        # Block images and fonts — not needed for price extraction, saves load time without breaking rendering
        await page.route("**/*.{png,jpg,jpeg,gif,svg,ico,webp,woff,woff2,ttf,otf}", lambda r: r.abort())

        try:
            if hotel_name:
                # ── Hotel-specific path: autocomplete → dates → search ────────
                await page.goto("https://www.agoda.com/", wait_until="domcontentloaded", timeout=60_000)
                # Wait for search input to be ready
                await page.wait_for_selector("input[data-selenium='textInput']", timeout=10_000)

                city = location.split(",")[0].strip()
                if city and city.lower() not in hotel_name.lower():
                    search_query = f"{hotel_name} {city}"
                else:
                    search_query = hotel_name
                await page.fill("input[data-selenium='textInput']", search_query)
                await page.wait_for_timeout(1_500)

                suggestion_clicked = False
                for sel in [
                    "li[data-element-place-suggestion-type='Property']",
                    "[data-testid='topDestinationListItem']",
                ]:
                    try:
                        await page.click(sel, timeout=4_000)
                        suggestion_clicked = True
                        break
                    except Exception:
                        continue

                if not suggestion_clicked:
                    return None, None, city_url, "Hotel not found in Agoda — try Check link"

                await page.wait_for_load_state("domcontentloaded", timeout=15_000)
                await page.wait_for_timeout(2_000)

            else:
                # ── City search path: load city URL, use DayPicker calendar ──
                await page.goto(city_url, wait_until="domcontentloaded", timeout=60_000)
                await page.wait_for_timeout(5_000)

            # ── Click check-in and check-out dates ────────────────────────────
            try:
                await page.click(f'[aria-label="{ci_label}"]', timeout=5_000)
                await page.wait_for_timeout(400)
                await page.click(f'[aria-label="{co_label}"]', timeout=5_000)
                await page.wait_for_timeout(400)
            except Exception:
                return None, None, city_url, "Could not select dates on Agoda calendar"

            # ── Click the Search button ───────────────────────────────────────
            for btn_sel in ['[data-selenium="searchButton"]', 'button:has-text("SEARCH")']:
                try:
                    await page.click(btn_sel, timeout=3_000)
                    break
                except Exception:
                    continue

            # Wait for prices to appear in DOM — resolves as soon as ready, up to 25s
            try:
                await page.wait_for_selector("[data-element-name='final-price']", timeout=25_000)
            except Exception:
                pass  # prices may still be extractable via text fallback

            result_url = page.url

            # ── Build keyword list ────────────────────────────────────────────
            keywords = []
            if hotel_name:
                for w in hotel_name.lower().split():
                    if w not in _GENERIC and len(w) > 3:
                        keywords.append(w)
                if not keywords:
                    keywords = [hotel_name.lower().split()[0]]

            # ── DOM card match ────────────────────────────────────────────────
            card_result = await page.evaluate(f"""() => {{
                const keywords = {repr(keywords)};
                const nameEls = document.querySelectorAll('[data-selenium="hotel-name"]');
                for (const el of nameEls) {{
                    const name = el.textContent.trim();
                    if (!keywords.length || keywords.every(kw => name.toLowerCase().includes(kw))) {{
                        let container = el;
                        for (let i = 0; i < 15; i++) {{
                            container = container.parentElement;
                            if (!container) break;
                            const p = container.querySelector("[data-element-name='final-price']");
                            if (p) {{
                                // Grab the hotel page link from the card
                                const a = container.querySelector('a[href*="/hotel/"], a[href*=".html"]')
                                       || el.closest('a');
                                const href = a ? a.href : null;
                                return {{name, priceText: p.textContent.trim(), href}};
                            }}
                        }}
                        return {{name, priceText: null, href: null}};
                    }}
                }}
                return null;
            }}""")

            found_hotel = card_result["name"] if card_result else None

            # ── Extract price ─────────────────────────────────────────────────
            prices = []
            if card_result and card_result.get("priceText"):
                pt = card_result["priceText"].replace("\xa0", "").replace(" ", "")
                prices = _extract_usd(pt) or _extract_thb_as_usd(pt)

            if not prices and found_hotel:
                text = await page.inner_text("body")
                nm = _re.search(_re.escape(found_hotel[:20]), text, _re.IGNORECASE)
                if nm:
                    nearby = text[max(0, nm.start() - 200): nm.end() + 300]
                    prices = _extract_usd(nearby) or _extract_thb_as_usd(nearby)

            hotel_url = (card_result or {}).get("href") or result_url
            if prices:
                return min(prices), found_hotel, hotel_url, None
            return None, found_hotel, result_url, "Price not found — click Check to view"

        finally:
            await browser.close()

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : "/api";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form        = document.getElementById("search-form");
const btnSearch   = document.getElementById("btn-search");
const resultsDiv  = document.getElementById("results");
const statusDiv   = document.getElementById("status");
const btnSave     = document.getElementById("btn-save-rates");
const saveMsg     = document.getElementById("save-msg");
const hotelInput  = document.getElementById("hotel_name");
const suggestionEl = document.getElementById("hotel-suggestions");
const modeInput   = document.getElementById("search-mode");
const locationInput = document.getElementById("search-location");
const progressBar  = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");

// ── Popular destination cards ─────────────────────────────────────────────────
document.querySelectorAll(".dest-card").forEach(card => {
  card.addEventListener("click", () => {
    const city = card.dataset.city;
    hotelInput.value   = city;
    modeInput.value    = "city";
    locationInput.value = city;
    hotelInput.focus();
    // Scroll smoothly to the search form
    document.querySelector(".search-card").scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

// ── Settings modal ────────────────────────────────────────────────────────────
const settingsModal = document.getElementById("settings-modal");
document.getElementById("btn-settings-open").addEventListener("click", () => {
  settingsModal.style.display = "flex";
});
document.getElementById("btn-settings-close").addEventListener("click", () => {
  settingsModal.style.display = "none";
});
settingsModal.addEventListener("click", e => {
  if (e.target === settingsModal) settingsModal.style.display = "none";
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") settingsModal.style.display = "none";
});

// ── Progress bar ──────────────────────────────────────────────────────────────
let _progressTimer = null;

function startProgress(durationMs = 25000) {
  progressBar.style.display = "block";
  progressFill.style.width  = "0%";
  const startTime = Date.now();
  clearInterval(_progressTimer);
  _progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    // Ease toward 90% over durationMs, never reaching 100 until done
    const pct = 90 * (1 - Math.exp(-3 * elapsed / durationMs));
    progressFill.style.width = pct + "%";
  }, 200);
}

function finishProgress() {
  clearInterval(_progressTimer);
  progressFill.style.width = "100%";
  setTimeout(() => {
    progressBar.style.display = "none";
    progressFill.style.width  = "0%";
  }, 500);
}

// ── City search state ─────────────────────────────────────────────────────────
let _cityHotels = [];        // accumulated loaded hotels
let _cityRenderedCount = 0;  // rendered count within current filtered view
let _cityObserver = null;    // IntersectionObserver on sentinel
let _cityOffset = 0;         // next offset to request from server
let _cityHasMore = false;    // server has more results to give
let _cityLoading = false;    // a fetch is currently in progress
let _cityTotalAgoda = 0;     // total property count from Agoda (display only)
const CITY_PAGE = 20;

let _filterState = {
  sort: 'best',
  stars: new Set(),
  minRating: 0,
  minPrice: 0,
  maxPrice: Infinity,
};

function _hasActiveFilters() {
  return _filterState.stars.size > 0 || _filterState.minRating > 0
    || _filterState.minPrice > 0 || _filterState.maxPrice < Infinity
    || _filterState.sort !== 'best';
}

function applyFilters(hotels) {
  let list = hotels.filter(h => {
    if (_filterState.stars.size > 0 && !_filterState.stars.has(h.stars)) return false;
    const p = h.price;
    if (_filterState.minPrice > 0 && p != null && p < _filterState.minPrice) return false;
    if (_filterState.maxPrice < Infinity && p != null && p > _filterState.maxPrice) return false;
    if (_filterState.minRating > 0) {
      if (!parseFloat(h.rating) || parseFloat(h.rating) < _filterState.minRating) return false;
    }
    return true;
  });
  if (_filterState.sort === 'price_asc') {
    list = list.slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  } else if (_filterState.sort === 'price_desc') {
    list = list.slice().sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  } else if (_filterState.sort === 'rating') {
    list = list.slice().sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
  }
  return list;
}

function buildFilterBar() {
  return `
    <div class="filter-bar" id="filter-bar">
      <div class="filter-group">
        <span class="filter-label">Sort</span>
        <select class="filter-select" id="filter-sort">
          <option value="best">Best match</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>
      <div class="filter-sep"></div>
      <div class="filter-group">
        <span class="filter-label">Stars</span>
        <div class="filter-pills" id="filter-stars">
          <button type="button" class="fpill" data-star="5">5★</button>
          <button type="button" class="fpill" data-star="4">4★</button>
          <button type="button" class="fpill" data-star="3">3★</button>
          <button type="button" class="fpill" data-star="2">2★</button>
        </div>
      </div>
      <div class="filter-sep"></div>
      <div class="filter-group">
        <span class="filter-label">$/night</span>
        <div class="filter-price-row">
          <input type="number" id="filter-min-price" class="filter-input" placeholder="0" min="0" />
          <span class="filter-dash">—</span>
          <input type="number" id="filter-max-price" class="filter-input" placeholder="any" min="0" />
        </div>
      </div>
      <div class="filter-sep"></div>
      <div class="filter-group">
        <span class="filter-label">Rating</span>
        <select class="filter-select filter-select-sm" id="filter-rating">
          <option value="0">Any</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
          <option value="8.5">8.5+</option>
          <option value="9">9+</option>
        </select>
      </div>
      <button type="button" class="filter-clear" id="filter-clear">Clear</button>
    </div>
    <div class="filter-count-row"><span id="filter-count-label" class="filter-count"></span></div>`;
}

function initFilterBar() {
  document.getElementById('filter-sort').addEventListener('change', e => {
    _filterState.sort = e.target.value;
    refilter();
  });

  document.querySelectorAll('#filter-stars .fpill').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = parseInt(btn.dataset.star);
      if (_filterState.stars.has(s)) {
        _filterState.stars.delete(s);
        btn.classList.remove('fpill--active');
      } else {
        _filterState.stars.add(s);
        btn.classList.add('fpill--active');
      }
      refilter();
    });
  });

  const priceHandler = debounce(() => {
    _filterState.minPrice = parseFloat(document.getElementById('filter-min-price').value) || 0;
    _filterState.maxPrice = parseFloat(document.getElementById('filter-max-price').value) || Infinity;
    refilter();
  }, 400);
  document.getElementById('filter-min-price').addEventListener('input', priceHandler);
  document.getElementById('filter-max-price').addEventListener('input', priceHandler);

  document.getElementById('filter-rating').addEventListener('change', e => {
    _filterState.minRating = parseFloat(e.target.value) || 0;
    refilter();
  });

  document.getElementById('filter-clear').addEventListener('click', () => {
    _filterState = { sort: 'best', stars: new Set(), minRating: 0, minPrice: 0, maxPrice: Infinity };
    document.getElementById('filter-sort').value = 'best';
    document.querySelectorAll('#filter-stars .fpill').forEach(b => b.classList.remove('fpill--active'));
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    document.getElementById('filter-rating').value = '0';
    refilter();
  });
}

function refilter() {
  const grid = document.getElementById('city-grid');
  if (!grid) return;
  grid.innerHTML = '';
  _cityRenderedCount = 0;
  appendCityCards();
  setupSentinelObserver();
  updateFilterCount();
}

function updateFilterCount() {
  const countEl = document.getElementById('filter-count-label');
  if (!countEl) return;
  const filtered = applyFilters(_cityHotels);
  const loaded   = _cityHotels.length;
  if (_hasActiveFilters()) {
    countEl.textContent = `${filtered.length} of ${loaded} loaded hotels match your filters`;
  } else {
    countEl.textContent = `${loaded} hotel${loaded !== 1 ? 's' : ''} loaded`;
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mode = modeInput.value;
  if (mode === "city") {
    await runCitySearch();
  } else {
    await runHotelSearch();
  }
});

async function runHotelSearch() {
  const payload = {
    hotel_name:    hotelInput.value.trim(),
    location:      "",
    checkin:       val("checkin"),
    checkout:      val("checkout"),
    adults:        parseInt(val("adults"), 10),
    rooms:         1,
    force_refresh: document.getElementById("force-refresh")?.checked ?? false,
  };

  setLoading(true);
  startProgress(20000);
  showStatus("Searching for the best price… this may take ~20 seconds.");
  resultsDiv.innerHTML = "";

  try {
    const res = await fetch(`${API}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { showStatus(`Error: ${(await res.json()).detail}`, true); return; }
    showStatus("");
    renderHotelPrice(await res.json());
  } catch (err) {
    showStatus(`Could not reach backend: ${err}`, true);
  } finally {
    finishProgress();
    setLoading(false);
  }
}

async function runCitySearch() {
  const location = locationInput.value || hotelInput.value.trim();
  const payload = {
    location,
    checkin:       val("checkin"),
    checkout:      val("checkout"),
    adults:        parseInt(val("adults"), 10),
    offset:        0,
    limit:         CITY_PAGE,
    force_refresh: document.getElementById("force-refresh")?.checked ?? false,
  };

  // Reset all city state
  _cityHotels = [];
  _cityOffset = 0;
  _cityHasMore = false;
  _cityLoading = false;
  _cityTotalAgoda = 0;
  _filterState = { sort: 'best', stars: new Set(), minRating: 0, minPrice: 0, maxPrice: Infinity };
  if (_cityObserver) { _cityObserver.disconnect(); _cityObserver = null; }

  setLoading(true);
  startProgress(25000);
  showStatus(`Searching hotels in ${location}… this may take ~25 seconds.`);
  resultsDiv.innerHTML = "";

  try {
    const res = await fetch(`${API}/search-city`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { showStatus(`Error: ${(await res.json()).detail}`, true); return; }
    const resp = await res.json();
    showStatus("");
    if (!resp.hotels || !resp.hotels.length) {
      showStatus("No hotels found. Try different dates.", true);
      return;
    }
    renderCityResults(resp);
  } catch (err) {
    showStatus(`Could not reach backend: ${err}`, true);
  } finally {
    finishProgress();
    setLoading(false);
  }
}

// ── Render: city hotel grid ───────────────────────────────────────────────────
function renderCityResults(resp) {
  const { hotels, total_agoda, has_more, offset, limit } = resp;

  _cityHotels       = hotels;
  _cityOffset       = (offset || 0) + hotels.length;
  _cityHasMore      = has_more || false;
  _cityTotalAgoda   = total_agoda || hotels.length;
  _cityRenderedCount = 0;

  const checkin  = val("checkin");
  const checkout = val("checkout");
  const nights   = Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000));
  const dest     = escHtml(locationInput.value || hotelInput.value.trim());
  const totalStr = _cityTotalAgoda > 0 ? _cityTotalAgoda.toLocaleString() : hotels.length.toString();

  resultsDiv.innerHTML = `
    <div class="results-card">
      <h2 id="city-results-title">${totalStr} properties in ${dest}</h2>
      <p class="results-subtitle">${nights} night${nights !== 1 ? "s" : ""} · sorted by best match</p>
      ${buildFilterBar()}
      <div id="city-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:8px"></div>
      <div id="city-load-more" class="city-load-more" style="display:none">
        <div class="city-spinner"></div>
        <span>Loading more hotels…</span>
      </div>
      <div id="city-sentinel" style="height:1px;margin-top:8px"></div>
    </div>`;

  initFilterBar();
  appendCityCards();
  setupSentinelObserver();
}

function appendCityCards() {
  const grid = document.getElementById("city-grid");
  if (!grid) return;
  const filtered = applyFilters(_cityHotels);
  const slice = filtered.slice(_cityRenderedCount, _cityRenderedCount + CITY_PAGE);
  if (!slice.length) {
    if (_cityRenderedCount === 0) {
      grid.innerHTML = '<div class="filter-empty">No hotels match these filters.</div>';
    }
    return;
  }
  slice.forEach(h => grid.insertAdjacentHTML("beforeend", buildHotelCard(h)));
  _cityRenderedCount += slice.length;
}

async function loadMoreCityHotels() {
  if (_cityLoading || !_cityHasMore) return;
  _cityLoading = true;
  const spinnerEl = document.getElementById("city-load-more");
  if (spinnerEl) spinnerEl.style.display = "flex";

  try {
    const res = await fetch(`${API}/search-city`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: locationInput.value || hotelInput.value.trim(),
        checkin:  val("checkin"),
        checkout: val("checkout"),
        adults:   parseInt(val("adults"), 10),
        offset:   _cityOffset,
        limit:    CITY_PAGE,
      }),
    });
    if (!res.ok) { _cityHasMore = false; return; }
    const resp = await res.json();
    if (resp.hotels && resp.hotels.length > 0) {
      _cityHotels  = [..._cityHotels, ...resp.hotels];
      _cityOffset  += resp.hotels.length;
      _cityHasMore = resp.has_more || false;
      appendCityCards();
      updateFilterCount();
    } else {
      _cityHasMore = false;
    }
  } catch (_) {
    _cityHasMore = false;
  } finally {
    _cityLoading = false;
    const spinnerEl = document.getElementById("city-load-more");
    if (spinnerEl) spinnerEl.style.display = "none";
  }
}

function setupSentinelObserver() {
  if (_cityObserver) { _cityObserver.disconnect(); _cityObserver = null; }
  const sentinel = document.getElementById("city-sentinel");
  if (!sentinel) return;
  _cityObserver = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    const filtered = applyFilters(_cityHotels);
    if (_cityRenderedCount < filtered.length) {
      appendCityCards();
    } else if (_cityHasMore && !_cityLoading) {
      await loadMoreCityHotels();
    }
  }, { rootMargin: "300px" });
  _cityObserver.observe(sentinel);
}

// ── Hotel card helpers ────────────────────────────────────────────────────────
function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function ratingLabel(score) {
  const n = parseFloat(score);
  if (n >= 9.5) return 'Exceptional';
  if (n >= 9.0) return 'Wonderful';
  if (n >= 8.5) return 'Excellent';
  if (n >= 8.0) return 'Very Good';
  if (n >= 7.5) return 'Good';
  if (n >= 7.0) return 'Pleasant';
  return 'Okay';
}

function buildHotelCard(h) {
  const url = escHtml(h.booking_url || '#');

  // Photo + overlay elements
  const imgHtml = h.image_url
    ? `<img src="${escHtml(h.image_url)}" alt="${escHtml(h.name)}" loading="lazy"
           onerror="this.closest('.hcard-photo').innerHTML='<div class=\\'hcard-photo-fallback\\'>🏨</div>'">`
    : '<div class="hcard-photo-fallback">🏨</div>';

  const badgeHtml = h.deal_badge === 'hot'
    ? '<div class="hcard-badge hcard-badge--hot">🔥 Hot deal</div>'
    : h.deal_badge === 'deal'
    ? '<div class="hcard-badge hcard-badge--deal">✦ Great deal</div>'
    : '';

  // Stars row
  const starsHtml = (h.stars >= 1 && h.stars <= 5)
    ? `<div class="hcard-stars">${'★'.repeat(h.stars)}${'☆'.repeat(5 - h.stars)}</div>`
    : '';

  // Location
  const locHtml = h.location
    ? `<div class="hcard-loc"><span class="hcard-loc-pin">📍</span>${escHtml(h.location)}</div>`
    : '';

  // Review snippet
  const quoteHtml = h.review_snippet
    ? `<div class="hcard-quote">"${escHtml(h.review_snippet)}"</div>`
    : '';

  // Amenity tags
  const tagsHtml = h.amenities && h.amenities.length
    ? `<div class="hcard-tags">${h.amenities.map(a => `<span class="hcard-tag">${escHtml(a)}</span>`).join('')}</div>`
    : '';

  // Rating row
  let ratingHtml = '';
  if (h.rating) {
    const label = h.review_label || ratingLabel(h.rating);
    const count = h.review_count ? `<span class="hcard-rcount">${escHtml(h.review_count)} reviews</span>` : '';
    ratingHtml = `
      <div class="hcard-rating">
        <span class="hcard-score">${escHtml(h.rating)}</span>
        <span class="hcard-rlabel">${escHtml(label)}</span>
        ${count}
      </div>`;
  }

  // ── Price / comparison section ─────────────────────────────────────────────
  const hasAgoda = h.agoda_price != null;
  const hasHL    = h.hl_price    != null;
  const nights   = h.nights || 1;
  const best     = h.best_platform || 'agoda';

  // Helper: one compare row
  function cmpRow(platform, price, isBest) {
    if (price == null) return '';
    const badge = isBest ? `<span class="hcard-cmp-badge">🏷 Best</span>` : '';
    return `
      <div class="hcard-cmp-row${isBest ? ' hcard-cmp-best' : ''}">
        <span class="hcard-cmp-name">${platform}</span>
        <div class="hcard-cmp-right">
          <span class="hcard-cmp-price">$${Math.round(price)}/night</span>
          ${badge}
        </div>
      </div>`;
  }

  let priceHtml = '';

  if (!hasAgoda && !hasHL) {
    priceHtml = '<div class="hcard-no-price">Price unavailable</div>';

  } else if (hasHL && hasAgoda) {
    // Two-platform comparison
    const agodaBest = best === 'agoda';
    const hlBest    = best === 'hotellook';
    const totalStr  = h.total_price != null
      ? `<div class="hcard-net">$${Math.round(h.total_price)} total for ${nights} night${nights !== 1 ? 's' : ''}</div>`
      : '';
    priceHtml = `
      <div class="hcard-compare">
        ${cmpRow('Agoda',     h.agoda_price, agodaBest)}
        ${cmpRow('Hotellook', h.hl_price,    hlBest)}
      </div>
      ${totalStr}`;

  } else {
    // Single platform
    const price = hasAgoda ? h.agoda_price : h.hl_price;
    const orig  = h.original_price
      ? `<span class="hcard-orig">${escHtml(h.original_price)}</span>` : '';
    const totalStr = h.total_price != null
      ? `<div class="hcard-total">$${Math.round(h.total_price)} total for ${nights} night${nights !== 1 ? 's' : ''}</div>` : '';
    priceHtml = `
      <div class="hcard-price">
        <div class="hcard-price-top">
          ${orig}
          <span class="hcard-main">$${Math.round(price)}</span>
          <span class="hcard-per">/night</span>
        </div>
        ${totalStr}
      </div>`;
  }

  // Book button label and URL
  const bookLabel = best === 'hotellook' ? 'Book on Hotellook →' : 'Book on Agoda →';

  return `
    <div class="hcard">
      <div class="hcard-photo">
        ${imgHtml}
        ${badgeHtml}
        <button class="hcard-save" onclick="event.stopPropagation()" title="Save">♡</button>
      </div>
      <div class="hcard-body">
        ${starsHtml}
        <a href="${url}" target="_blank" rel="noopener" class="hcard-name">${escHtml(h.name)}</a>
        ${locHtml}
        ${quoteHtml}
        ${tagsHtml}
        ${ratingHtml}
        <hr class="hcard-divider">
        ${priceHtml}
        <a href="${url}" target="_blank" rel="noopener" class="hcard-book">${bookLabel}</a>
      </div>
    </div>`;
}

// ── Render: single hotel price table ─────────────────────────────────────────
function renderHotelPrice(results) {
  if (!results.length) { showStatus("No results returned.", true); return; }

  const rows = results.map(r => {
    const isBest   = r.best === true;
    const hasPrice = r.raw_price !== null;

    const rawCell = hasPrice ? `<td class="price">$${r.raw_price.toFixed(2)}</td>` : `<td class="na">N/A</td>`;
    const netCell = hasPrice
      ? `<td class="net-price" title="$${r.raw_price.toFixed(2)} − ${r.portal_cashback_pct}% − ${r.cc_cashback_pct}% = $${r.net_price.toFixed(2)}">$${r.net_price.toFixed(2)}</td>`
      : `<td class="na">N/A</td>`;
    const portalCell = hasPrice
      ? `<td class="cashback-pct">−${r.portal_cashback_pct}% <span style="color:#aaa;font-size:0.75rem">(${r.portal})</span></td>`
      : `<td class="na">—</td>`;
    const ccCell = hasPrice ? `<td class="cashback-pct">−${r.cc_cashback_pct}%</td>` : `<td class="na">—</td>`;

    const hotelNote = r.found_hotel ? `<div class="found-hotel">↳ ${r.found_hotel}</div>` : "";
    const errorNote = r.error && !hasPrice
      ? `<div class="error-msg">${r.error.length > 80 ? r.error.slice(0, 80) + "…" : r.error}</div>` : "";
    const badge = isBest ? '<span class="badge-best">Best Deal</span>' : "";
    const bookBtn = `<a href="${r.booking_url}" target="_blank" class="btn-book ${hasPrice ? "" : "secondary"}">${hasPrice ? "Book Now" : "Check →"}</a>`;

    return `
      <tr class="${isBest ? "best-row" : ""}">
        <td class="platform-name">${r.platform}${badge}${hotelNote}${errorNote}</td>
        ${rawCell}${portalCell}${ccCell}${netCell}
        <td>${bookBtn}</td>
      </tr>`;
  });

  resultsDiv.innerHTML = `
    <div class="results-card">
      <h2>Price Comparison</h2>
      <p class="results-subtitle">Cheapest available room per night. <strong>You Pay</strong> = listed price − portal cashback − CC cashback.</p>
      <table>
        <thead><tr>
          <th>Platform</th><th>Room Price / night</th>
          <th>Portal Cashback</th><th>CC Cashback</th>
          <th>You Pay</th><th></th>
        </tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`;
}

// ── Hotel name autocomplete ───────────────────────────────────────────────────
hotelInput.addEventListener("input", debounce(async () => {
  const q = hotelInput.value.trim();
  // Reset to hotel mode on manual typing
  modeInput.value = "hotel";
  locationInput.value = "";
  if (q.length < 3) { hideSuggestions(); return; }
  try {
    const res = await fetch(`${API}/suggest?q=${encodeURIComponent(q)}`);
    const items = await res.json();
    if (!items.length) { hideSuggestions(); return; }

    suggestionEl.innerHTML = items.map(s => {
      const isCity = s.is_city;
      const icon = isCity ? "🏙️" : "🏨";
      const sub = isCity
        ? s.country
        : [s.city, s.country].filter(Boolean).join(", ");
      return `<li data-name="${s.name}" data-city="${s.city || s.name}" data-is-city="${isCity}">
        <span class="sug-icon">${icon}</span>
        <span>
          <strong>${s.name}</strong>
          ${sub ? `<span class="sug-sub">${sub}</span>` : ""}
        </span>
      </li>`;
    }).join("");
    suggestionEl.style.display = "block";
  } catch (_) { hideSuggestions(); }
}, 350));

suggestionEl.addEventListener("click", e => {
  const li = e.target.closest("li");
  if (!li) return;
  const isCity = li.dataset.isCity === "true";
  const name   = li.dataset.name;
  const city   = li.dataset.city;

  if (isCity) {
    hotelInput.value   = name;
    modeInput.value    = "city";
    locationInput.value = city;
  } else {
    hotelInput.value   = city ? `${name} ${city}` : name;
    modeInput.value    = "hotel";
    locationInput.value = "";
  }
  hideSuggestions();
});

document.addEventListener("click", e => {
  if (!hotelInput.contains(e.target) && !suggestionEl.contains(e.target)) hideSuggestions();
});

function hideSuggestions() { suggestionEl.style.display = "none"; suggestionEl.innerHTML = ""; }

// ── Cashback rate editor ──────────────────────────────────────────────────────
async function loadRates() {
  try {
    const res = await fetch(`${API}/config`);
    const cfg = await res.json();
    const affEl = document.getElementById("agoda-affiliate-id");
    if (affEl) affEl.value = cfg.agoda_affiliate_id || "";
    const tpEl = document.getElementById("tp-token");
    if (tpEl) tpEl.value = cfg.travelpayouts_token || "";
    const tpMark = document.getElementById("tp-marker");
    if (tpMark) tpMark.value = cfg.travelpayouts_marker || "";
    setRateInput("rate-cc",        pct(cfg.credit_card_rate));
    setRateInput("rate-agoda",     pct(cfg.sites?.agoda?.rate));
    setRateInput("rate-hotellook", pct(cfg.sites?.hotellook?.rate));
    setRateInput("rate-booking",   pct(cfg.sites?.booking?.rate));
    setRateInput("rate-priceline", pct(cfg.sites?.priceline?.rate));
  } catch (_) {}
}

btnSave.addEventListener("click", async () => {
  const payload = {
    agoda_affiliate_id:    val("agoda-affiliate-id"),
    travelpayouts_token:   val("tp-token"),
    travelpayouts_marker:  val("tp-marker"),
    credit_card_rate: dec(val("rate-cc")),
    sites: {
      agoda:     { rate: dec(val("rate-agoda")) },
      hotellook: { rate: dec(val("rate-hotellook")) },
      booking:   { rate: dec(val("rate-booking")) },
      priceline: { rate: dec(val("rate-priceline")) },
    },
  };
  try {
    const res = await fetch(`${API}/config`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      saveMsg.textContent = "Saved!";
      saveMsg.style.display = "inline";
      setTimeout(() => { saveMsg.style.display = "none"; }, 2500);
    } else {
      alert(`Save failed: ${(await res.json()).detail}`);
    }
  } catch (err) { alert(`Could not reach backend: ${err}`); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function val(id)             { return document.getElementById(id)?.value?.trim() ?? ""; }
function debounce(fn, ms)    { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function setRateInput(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function pct(v)              { return v != null ? (v * 100).toFixed(1) : ""; }
function dec(s)              { return parseFloat(s) / 100; }
function setLoading(on)      { btnSearch.disabled = on; btnSearch.textContent = on ? "Searching…" : "Search"; }
function showStatus(msg, isErr = false) {
  statusDiv.textContent = msg;
  statusDiv.style.color = isErr ? "#dc2626" : "#666";
  statusDiv.style.display = msg ? "block" : "none";
}

// Default dates are set by datepicker.js on DOMContentLoaded

loadRates();

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

// ── City search infinite-scroll state ────────────────────────────────────────
let _cityHotels = [];
let _cityRenderedCount = 0;
let _cityObserver = null;
const CITY_PAGE = 20;

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
    direct_url:    val("direct_url") || null,
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
  const payload = {
    location: locationInput.value || hotelInput.value.trim(),
    checkin:  val("checkin"),
    checkout: val("checkout"),
    adults:   parseInt(val("adults"), 10),
  };

  setLoading(true);
  startProgress(25000);
  showStatus(`Searching hotels in ${payload.location}… this may take ~25 seconds.`);
  resultsDiv.innerHTML = "";
  if (_cityObserver) { _cityObserver.disconnect(); _cityObserver = null; }

  try {
    const res = await fetch(`${API}/search-city`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { showStatus(`Error: ${(await res.json()).detail}`, true); return; }
    const hotels = await res.json();
    showStatus("");
    if (!hotels.length) { showStatus("No hotels found. Try different dates.", true); return; }
    renderCityResults(hotels);
  } catch (err) {
    showStatus(`Could not reach backend: ${err}`, true);
  } finally {
    finishProgress();
    setLoading(false);
  }
}

// ── Render: city hotel grid (with infinite scroll) ───────────────────────────
function renderCityResults(hotels) {
  _cityHotels = hotels;
  _cityRenderedCount = 0;
  if (_cityObserver) { _cityObserver.disconnect(); _cityObserver = null; }

  const checkin  = val("checkin");
  const checkout = val("checkout");
  const nights   = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);

  resultsDiv.innerHTML = `
    <div class="results-card">
      <h2>Hotels in ${locationInput.value || hotelInput.value.trim()}</h2>
      <p class="results-subtitle">${hotels.length} hotels found · ${nights} night${nights !== 1 ? "s" : ""} · sorted by best match</p>
      <div id="city-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:16px"></div>
      <div id="city-sentinel" style="height:1px;margin-top:4px"></div>
    </div>`;

  appendCityCards();

  const sentinel = document.getElementById("city-sentinel");
  _cityObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) appendCityCards();
  }, { rootMargin: "400px" });
  _cityObserver.observe(sentinel);
}

function appendCityCards() {
  const grid = document.getElementById("city-grid");
  if (!grid) return;
  const slice = _cityHotels.slice(_cityRenderedCount, _cityRenderedCount + CITY_PAGE);
  if (!slice.length) {
    if (_cityObserver) { _cityObserver.disconnect(); _cityObserver = null; }
    return;
  }
  slice.forEach(h => grid.insertAdjacentHTML("beforeend", buildHotelCard(h)));
  _cityRenderedCount += slice.length;
  if (_cityRenderedCount >= _cityHotels.length && _cityObserver) {
    _cityObserver.disconnect();
    _cityObserver = null;
  }
}

function buildHotelCard(h) {
  const IMG_H = "190px";

  const imgContent = h.image_url
    ? `<img src="${h.image_url}" alt="${h.name}" loading="lazy"
            style="width:100%;height:${IMG_H};object-fit:cover;display:block;"
            onerror="this.parentElement.innerHTML='<div style=\\'height:${IMG_H};display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:#e8eaf0\\'>🏨</div>'">`
    : `<div style="height:${IMG_H};display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:#e8eaf0">🏨</div>`;

  // Stars row
  const starsHtml = (h.stars >= 1 && h.stars <= 5)
    ? `<div style="color:#f59e0b;font-size:0.7rem;letter-spacing:1px;margin-bottom:5px">${"★".repeat(h.stars)}${"☆".repeat(5 - h.stars)}</div>`
    : "";

  // Location — prominent, with pin icon, 2-line max
  const locHtml = h.location ? `
    <div style="display:flex;align-items:flex-start;gap:4px;margin-bottom:8px">
      <span style="color:#6366f1;font-size:0.75rem;margin-top:1px;flex-shrink:0">📍</span>
      <span style="font-size:0.73rem;color:#4b5563;line-height:1.4;
                   display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
        ${h.location}
      </span>
    </div>` : "";

  // Rating row: score badge + label + review count
  let ratingHtml = "";
  if (h.rating) {
    const label  = h.review_label  ? `<span style="color:#374151;font-size:0.76rem;font-weight:600">${h.review_label}</span>` : "";
    const count  = h.review_count  ? `<span style="color:#9ca3af;font-size:0.69rem">${h.review_count} reviews</span>` : "";
    ratingHtml = `
      <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:8px">
        <span style="background:#4f46e5;color:#fff;font-size:0.8rem;font-weight:700;
                     padding:3px 8px;border-radius:7px;flex-shrink:0">${h.rating}</span>
        ${label}
        ${count}
      </div>`;
  }

  // Price row: crossed-out original + final price
  let priceHtml = "";
  if (h.price) {
    const orig = h.original_price
      ? `<span style="color:#d1d5db;font-size:0.72rem;text-decoration:line-through">${h.original_price}</span>`
      : "";
    priceHtml = `
      <div style="margin-top:auto;padding-top:10px;border-top:1px solid #f3f4f6">
        <div style="display:flex;align-items:baseline;gap:5px;flex-wrap:wrap">
          ${orig}
          <span style="font-size:1.2rem;font-weight:800;color:#4f46e5">$${h.price.toFixed(0)}</span>
          <span style="font-size:0.7rem;color:#9ca3af">/night</span>
        </div>
        <div style="font-size:0.68rem;color:#6366f1;font-weight:600;margin-top:3px">Book on Agoda →</div>
      </div>`;
  } else {
    priceHtml = `<div style="margin-top:auto;padding-top:10px;border-top:1px solid #f3f4f6;font-size:0.78rem;color:#d1d5db">Price unavailable</div>`;
  }

  return `
    <a href="${h.booking_url || '#'}" target="_blank"
       style="display:flex;flex-direction:column;background:#fff;border-radius:14px;overflow:hidden;
              box-shadow:0 2px 12px rgba(0,0,0,0.07);text-decoration:none;color:inherit;
              transition:transform 0.2s,box-shadow 0.2s;"
       onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 10px 28px rgba(0,0,0,0.13)'"
       onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'">
      <div style="width:100%;height:${IMG_H};overflow:hidden;flex-shrink:0;position:relative">
        ${imgContent}
      </div>
      <div style="padding:13px 14px 14px;display:flex;flex-direction:column;flex:1">
        ${starsHtml}
        <div style="font-weight:700;font-size:0.88rem;color:#111827;line-height:1.35;margin-bottom:6px;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
          ${h.name}
        </div>
        ${locHtml}
        ${ratingHtml}
        ${priceHtml}
      </div>
    </a>`;
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
    setRateInput("rate-cc",        pct(cfg.credit_card_rate));
    setRateInput("rate-agoda",     pct(cfg.sites?.agoda?.rate));
    setRateInput("rate-booking",   pct(cfg.sites?.booking?.rate));
    setRateInput("rate-priceline", pct(cfg.sites?.priceline?.rate));
  } catch (_) {}
}

btnSave.addEventListener("click", async () => {
  const payload = {
    agoda_affiliate_id: val("agoda-affiliate-id"),
    credit_card_rate: dec(val("rate-cc")),
    sites: {
      agoda:     { rate: dec(val("rate-agoda")) },
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

(function setDefaultDates() {
  const today    = new Date();
  const checkin  = new Date(today); checkin.setDate(today.getDate() + 7);
  const checkout = new Date(today); checkout.setDate(today.getDate() + 9);
  const fmt = d => d.toISOString().split("T")[0];
  document.getElementById("checkin").value  = fmt(checkin);
  document.getElementById("checkout").value = fmt(checkout);
})();

loadRates();

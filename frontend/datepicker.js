// ── Agoda-style Date Picker ───────────────────────────────────────────────────
(function () {
  'use strict';

  const MONTHS_LONG  = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
  const DOW_LONG     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DOW_SHORT    = ['Mo','Tu','We','Th','Fr','Sa','Su'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const s = {
    viewYear:  today.getFullYear(),
    viewMonth: today.getMonth(),
    checkin:   null,
    checkout:  null,
    hover:     null,
    mode:      null,   // 'checkin' | 'checkout' | 'guests' | null
    adults:    2,
    rooms:     1,
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function fmtDisplay(d) {
    if (!d) return null;
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${DOW_LONG[d.getDay()]}`;
  }

  function fmtISO(d) {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function parseISO(str) {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function sameDay(a, b) {
    return a && b && a.getTime() === b.getTime();
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────────

  let elCI, elCO, elAdults, elRooms;
  let pillCI, pillCO, pillGuests;
  let valCI, valCO, valGuests;
  let hdrCI, hdrCO, tabCI, tabCO;
  let dpPanel, gPanel, dpLeft, dpRight, dpPrev, dpNext;
  let gAdults, gRooms;

  // ── Sync display + hidden inputs ──────────────────────────────────────────────

  function sync() {
    const ciStr = fmtDisplay(s.checkin)  || 'Select date';
    const coStr = fmtDisplay(s.checkout) || 'Select date';
    const gStr  = `${s.adults} Adult${s.adults > 1 ? 's' : ''} · ${s.rooms} Room${s.rooms > 1 ? 's' : ''}`;

    valCI.textContent    = ciStr;
    valCO.textContent    = coStr;
    valGuests.textContent = gStr;
    if (hdrCI) hdrCI.textContent = fmtDisplay(s.checkin)  || '—';
    if (hdrCO) hdrCO.textContent = fmtDisplay(s.checkout) || '—';

    elCI.value    = fmtISO(s.checkin);
    elCO.value    = fmtISO(s.checkout);
    elAdults.value = s.adults;
    if (elRooms) elRooms.value = s.rooms;

    // Active-state underline on pills
    pillCI.classList.toggle('dp-active',     s.mode === 'checkin');
    pillCO.classList.toggle('dp-active',     s.mode === 'checkout');
    pillGuests.classList.toggle('dp-active', s.mode === 'guests');

    // Active tabs inside panel header
    if (tabCI) tabCI.classList.toggle('dp-tab-active',  s.mode === 'checkin');
    if (tabCO) tabCO.classList.toggle('dp-tab-active',  s.mode === 'checkout');
  }

  // ── Calendar rendering ────────────────────────────────────────────────────────

  function renderCalendar() {
    renderMonth(dpLeft, s.viewYear, s.viewMonth);

    let ry = s.viewYear, rm = s.viewMonth + 1;
    if (rm > 11) { rm = 0; ry++; }
    renderMonth(dpRight, ry, rm);

    const atMin = s.viewYear === today.getFullYear() && s.viewMonth === today.getMonth();
    dpPrev.disabled = atMin;
  }

  function renderMonth(container, year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6

    const rangeEnd = s.checkout || (s.mode === 'checkout' ? s.hover : null);

    let html = `
      <div class="dp-month-name">${MONTHS_LONG[month]} ${year}</div>
      <div class="dp-dow-row">${DOW_SHORT.map(d => `<div class="dp-dow">${d}</div>`).join('')}</div>
      <div class="dp-grid">`;

    for (let i = 0; i < startDow; i++) html += `<div></div>`;

    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);

      const isPast     = date < today;
      const isToday    = sameDay(date, today);
      const isCI       = sameDay(date, s.checkin);
      const isCO       = sameDay(date, s.checkout);
      const inRange    = s.checkin && rangeEnd && date > s.checkin && date < rangeEnd;
      const isHover    = s.mode === 'checkout' && s.hover && sameDay(date, s.hover) && !isCO;

      let cls = 'dp-cell';
      if (isPast)     cls += ' dp-past';
      if (isToday)    cls += ' dp-today';
      if (isCI)       cls += ' dp-sel dp-ci';
      if (isCO)       cls += ' dp-sel dp-co';
      if (inRange)    cls += ' dp-in-range';
      if (isHover)    cls += ' dp-hover-sel';
      // Cap the range highlight at selection ends
      if (isCI && rangeEnd && s.checkin < rangeEnd) cls += ' dp-cap-left';
      if ((isCO || isHover) && s.checkin && date > s.checkin) cls += ' dp-cap-right';

      const iso = fmtISO(date);
      html += `<div class="${cls}"${!isPast ? ` data-date="${iso}"` : ''}>${d}</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
  }

  function handleDayClick(date) {
    if (s.mode === 'checkin' || !s.checkin || (s.checkin && s.checkout)) {
      s.checkin  = date;
      s.checkout = null;
      s.hover    = null;
      s.mode     = 'checkout';
    } else {
      if (date <= s.checkin) {
        s.checkin  = date;
        s.checkout = null;
        s.mode     = 'checkout';
      } else {
        s.checkout = date;
        s.hover    = null;
        s.mode     = null;
        setTimeout(closeAll, 380);
      }
    }
    sync();
    renderCalendar();
  }

  function handleHover(date) {
    if (s.mode === 'checkout' && s.checkin && !s.checkout) {
      const newHover = date > s.checkin ? date : null;
      // Only re-render if hover date actually changed — prevents DOM thrashing
      // that destroys click targets between mousedown and mouseup
      if (newHover?.getTime() === s.hover?.getTime()) return;
      s.hover = newHover;
      renderCalendar();
    }
  }

  // ── Open / close ─────────────────────────────────────────────────────────────

  function openCalendar(mode) {
    if (s.mode === mode && !dpPanel.hidden) { closeAll(); return; }
    s.mode = mode;
    dpPanel.hidden = false;
    gPanel.hidden  = true;
    sync();
    renderCalendar();
  }

  function openGuests() {
    if (s.mode === 'guests' && !gPanel.hidden) { closeAll(); return; }
    s.mode = 'guests';
    dpPanel.hidden = true;
    gPanel.hidden  = false;
    gAdults.textContent = s.adults;
    gRooms.textContent  = s.rooms;
    sync();
  }

  function closeAll() {
    s.mode  = null;
    s.hover = null;
    dpPanel.hidden = true;
    gPanel.hidden  = true;
    sync();
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    elCI    = document.getElementById('checkin');
    elCO    = document.getElementById('checkout');
    elAdults = document.getElementById('adults');
    elRooms  = document.getElementById('rooms');

    pillCI    = document.getElementById('pill-checkin');
    pillCO    = document.getElementById('pill-checkout');
    pillGuests = document.getElementById('pill-guests');

    valCI    = document.getElementById('val-checkin');
    valCO    = document.getElementById('val-checkout');
    valGuests = document.getElementById('val-guests');

    hdrCI = document.getElementById('dp-hdr-ci');
    hdrCO = document.getElementById('dp-hdr-co');
    tabCI = document.getElementById('dp-tab-ci');
    tabCO = document.getElementById('dp-tab-co');

    dpPanel = document.getElementById('dp-panel');
    gPanel  = document.getElementById('guest-panel');
    dpLeft  = document.getElementById('dp-left');
    dpRight = document.getElementById('dp-right');
    dpPrev  = document.getElementById('dp-prev');
    dpNext  = document.getElementById('dp-next');
    gAdults = document.getElementById('g-adults');
    gRooms  = document.getElementById('g-rooms');

    // Default: +7 and +9 days from today
    const ci = new Date(today); ci.setDate(today.getDate() + 7);
    const co = new Date(today); co.setDate(today.getDate() + 9);
    s.checkin  = parseISO(elCI.value)    || ci;
    s.checkout = parseISO(elCO.value)    || co;
    s.adults   = parseInt(elAdults.value) || 2;
    sync();

    // Event delegation on month containers — survives innerHTML re-renders
    [dpLeft, dpRight].forEach(container => {
      container.addEventListener('click', e => {
        const cell = e.target.closest('.dp-cell[data-date]');
        if (cell) handleDayClick(parseISO(cell.dataset.date));
      });
      container.addEventListener('mouseover', e => {
        const cell = e.target.closest('.dp-cell[data-date]');
        if (cell) handleHover(parseISO(cell.dataset.date));
      });
      container.addEventListener('mouseleave', () => {
        if (s.hover) { s.hover = null; renderCalendar(); }
      });
    });

    // Pill clicks
    pillCI.addEventListener('click',     () => openCalendar('checkin'));
    pillCO.addEventListener('click',     () => openCalendar('checkout'));
    pillGuests.addEventListener('click', () => openGuests());

    // In-panel tab clicks
    tabCI?.addEventListener('click', () => { s.mode = 'checkin'; sync(); renderCalendar(); });
    tabCO?.addEventListener('click', () => { s.mode = 'checkout'; sync(); renderCalendar(); });

    // Month navigation
    dpPrev.addEventListener('click', () => {
      s.viewMonth--;
      if (s.viewMonth < 0) { s.viewMonth = 11; s.viewYear--; }
      renderCalendar();
    });
    dpNext.addEventListener('click', () => {
      s.viewMonth++;
      if (s.viewMonth > 11) { s.viewMonth = 0; s.viewYear++; }
      renderCalendar();
    });

    // Done buttons
    document.getElementById('dp-done').addEventListener('click', closeAll);
    document.getElementById('guest-done').addEventListener('click', closeAll);

    // Guest controls
    [
      ['g-adults-minus', 'adults', -1, 1, 10],
      ['g-adults-plus',  'adults', +1, 1, 10],
      ['g-rooms-minus',  'rooms',  -1, 1, 10],
      ['g-rooms-plus',   'rooms',  +1, 1, 10],
    ].forEach(([id, key, delta, lo, hi]) => {
      document.getElementById(id).addEventListener('click', () => {
        s[key] = clamp(s[key] + delta, lo, hi);
        gAdults.textContent = s.adults;
        gRooms.textContent  = s.rooms;
        sync();
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      const wrap = document.getElementById('dp-wrap');
      if (wrap && !wrap.contains(e.target)) closeAll();
    }, true);

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
    });
  });
})();

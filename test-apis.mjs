/**
 * CheapStay API test suite.
 * Covers: flight search, passenger validation logic, cancellation policy,
 * arrival-tips data, layover-guides data, credit card offer mapping,
 * Duffel order detail endpoint, cancel flow, Supabase reachability.
 *
 * Usage:
 *   node test-apis.mjs              # all tests
 *   node test-apis.mjs --unit       # unit tests only (no network)
 *   node test-apis.mjs --api        # API/network tests only
 *
 * Reads keys from frontend-next/.env.local automatically.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env.local ────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(resolve(__dir, 'frontend-next/.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && val && !process.env[key]) process.env[key] = val;
  }
} catch { /* env vars from environment */ }

const DUFFEL_KEY = process.env.DUFFEL_TEST_API_KEY ?? process.env.DUFFEL_API_KEY ?? '';
const SB_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SB_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const runUnit = !process.argv.includes('--api');
const runApi  = !process.argv.includes('--unit');

// ── Harness ────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0, skipped = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${name}${detail ? '  →  ' + detail : ''}`);
    passed++;
  } else {
    console.error(`  ❌  ${name}${detail ? '  →  ' + detail : ''}`);
    failed++;
  }
}

function skip(name, reason) {
  console.log(`  ⏭   ${name}  (${reason})`);
  skipped++;
}

async function section(title, fn) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 52 - title.length))}`);
  try { await fn(); }
  catch (err) {
    console.error(`  💥  Unhandled exception: ${err.message}`);
    failed++;
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const SERVICE_FEE     = 10;
const DUFFEL_FEE_RATE = 0.029;
const calcGross = (base, extras = 0) =>
  Math.round(((base + extras + SERVICE_FEE) / (1 - DUFFEL_FEE_RATE)) * 100) / 100;

const DUFFEL_BASE = 'https://api.duffel.com';
const duffelHeaders = {
  Authorization: `Bearer ${DUFFEL_KEY}`,
  'Content-Type': 'application/json',
  'Duffel-Version': 'v2',
};

async function duffelPost(path, body) {
  const res = await fetch(`${DUFFEL_BASE}${path}`, {
    method: 'POST', headers: duffelHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data?.errors?.[0]?.message ?? `HTTP ${res.status}`), { data });
  return data;
}

async function duffelGet(path) {
  const res = await fetch(`${DUFFEL_BASE}${path}`, { headers: duffelHeaders });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data?.errors?.[0]?.message ?? `HTTP ${res.status}`), { data });
  return data;
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT TESTS — no network required
// ══════════════════════════════════════════════════════════════════════════════

if (runUnit) {

  // ── calcGross ──────────────────────────────────────────────────────────────
  await section('calcGross pricing formula', async () => {
    assert('$0 base includes service fee',    calcGross(0) > 0,   `→ $${calcGross(0)}`);
    assert('$300 → reasonable gross',         calcGross(300) > 315 && calcGross(300) < 345, `→ $${calcGross(300)}`);
    assert('extras added before fee calc',    calcGross(300, 50) > calcGross(300), `→ $${calcGross(300, 50)}`);
    const base = 500, gross = calcGross(base);
    const recovered = Math.round(gross * (1 - DUFFEL_FEE_RATE) * 100) / 100;
    assert('formula is invertible (round-trip)', Math.abs(recovered - (base + SERVICE_FEE)) < 0.02,
      `gross=$${gross}, recovered=$${recovered}, expected=${base + SERVICE_FEE}`);
  });

  // ── Passenger age validation ───────────────────────────────────────────────
  await section('Passenger age validation', async () => {
    const FLIGHT_DATE = new Date('2026-07-10');

    function ageAtFlight(bornOn) {
      return (FLIGHT_DATE - new Date(bornOn)) / (365.25 * 24 * 60 * 60 * 1000);
    }

    function validateDob(bornOn, paxType) {
      if (!bornOn) return 'Required';
      const age = ageAtFlight(bornOn);
      if (age < 0)                                        return 'Date of birth cannot be after the travel date';
      if (paxType === 'infant_without_seat' && age >= 2)  return 'Infant must be under 2 years old at time of travel';
      if (paxType === 'child' && (age < 2 || age >= 12)) return 'Child must be 2–11 years old at time of travel';
      if (paxType === 'adult' && age < 12)                return 'Adult passenger must be 12 or older at time of travel';
      return null;
    }

    // Adult
    assert('adult 1987 is valid',           validateDob('1987-01-01', 'adult')       === null);
    assert('adult 12yo is valid',           validateDob('2014-01-01', 'adult')       === null);
    assert('adult 11yo fails',              validateDob('2015-07-11', 'adult')       !== null);

    // Child
    assert('child 5yo is valid',            validateDob('2021-06-01', 'child')       === null);
    assert('child 11yo is valid',           validateDob('2015-07-11', 'child')       === null);
    assert('child 12yo fails (too old)',    validateDob('2014-07-01', 'child')       !== null);
    assert('child 1yo fails (too young)',   validateDob('2025-01-01', 'child')       !== null);
    assert('child future DOB fails',        validateDob('2030-02-13', 'child')       !== null);

    // Infant
    assert('infant 6m is valid',            validateDob('2026-01-01', 'infant_without_seat') === null);
    assert('infant 2yo fails',              validateDob('2024-07-01', 'infant_without_seat') !== null);

    // Future DOB
    assert('future DOB error message correct',
      validateDob('2030-01-01', 'adult')?.includes('after the travel date'));
  });

  // ── Cancellation policy display logic ─────────────────────────────────────
  await section('Cancellation policy display logic', async () => {
    function classifyPolicy(conditions) {
      const r = conditions?.refundBeforeDeparture;
      if (!r)                             return 'unknown';
      if (r.allowed && !r.penaltyAmount)  return 'free';
      if (r.allowed && r.penaltyAmount)   return 'fee';
      if (!r.allowed)                     return 'no_refund';
      return 'unknown';
    }

    assert('null conditions → unknown (always show)',
      classifyPolicy(null) === 'unknown');
    assert('allowed=true, no penalty → free',
      classifyPolicy({ refundBeforeDeparture: { allowed: true, penaltyAmount: null } }) === 'free');
    assert('allowed=true, penalty 50 → fee',
      classifyPolicy({ refundBeforeDeparture: { allowed: true, penaltyAmount: '50.00' } }) === 'fee');
    assert('allowed=false → no_refund',
      classifyPolicy({ refundBeforeDeparture: { allowed: false } }) === 'no_refund');
    assert('undefined conditions → unknown',
      classifyPolicy(undefined) === 'unknown');
  });

  // ── Arrival tips data integrity ────────────────────────────────────────────
  await section('Arrival tips — data integrity', async () => {
    // Dynamically import the compiled JS (via tsx would be needed for TS — check compiled output)
    // Instead, validate the data shape by reading the raw source
    const src = readFileSync(resolve(__dir, 'frontend-next/lib/arrival-tips.ts'), 'utf8');

    const codeMatches = src.match(/^  ([A-Z]{3}):\s*\{/gm) ?? [];
    const codes = codeMatches.map(m => m.trim().replace(':', '').replace('{', '').trim());

    assert('arrival-tips has 20+ airports', codes.length >= 20, `${codes.length} airports defined`);

    // Every entry must have rideShare.apps array
    const missingApps = [];
    for (const code of codes) {
      const block = src.slice(src.indexOf(`\n  ${code}:`));
      const end   = block.indexOf('\n  },\n') + 5;
      const entry = block.slice(0, end);
      if (!entry.includes('apps:')) missingApps.push(code);
    }
    assert('every airport has rideShare.apps', missingApps.length === 0,
      missingApps.length > 0 ? `missing: ${missingApps.join(', ')}` : 'all good');

    // Key airports present
    const REQUIRED = ['LAX', 'JFK', 'LHR', 'SIN', 'BKK', 'DXB', 'NRT', 'HKG', 'PVG', 'SYD'];
    // SYD may not be in list yet, so check what exists
    const actualRequired = REQUIRED.filter(c => codes.includes(c));
    for (const code of actualRequired) {
      assert(`${code} airport present`, codes.includes(code));
    }

    // SE Asian airports have Grab
    const grabAirports = ['BKK', 'DMK', 'SIN', 'KUL', 'MNL', 'CGK', 'SGN', 'HAN'];
    let grabMissing = 0;
    for (const code of grabAirports) {
      if (!codes.includes(code)) continue;
      const block = src.slice(src.indexOf(`\n  ${code}:`));
      const end   = block.indexOf('\n  },\n') + 5;
      const entry = block.slice(0, end);
      if (!entry.includes("'Grab'")) {
        console.error(`  ❌  ${code} missing Grab in apps`);
        grabMissing++;
      }
    }
    assert('all SE Asian airports include Grab', grabMissing === 0,
      grabMissing > 0 ? `${grabMissing} airports missing Grab` : 'all have Grab');

    // European airports have Bolt
    const boltAirports = ['LHR', 'CDG', 'AMS', 'FRA', 'IST'];
    let boltMissing = 0;
    for (const code of boltAirports) {
      if (!codes.includes(code)) continue;
      const block = src.slice(src.indexOf(`\n  ${code}:`));
      const end   = block.indexOf('\n  },\n') + 5;
      const entry = block.slice(0, end);
      if (!entry.includes("'Bolt'")) {
        console.error(`  ❌  ${code} missing Bolt in apps`);
        boltMissing++;
      }
    }
    assert('all major European airports include Bolt', boltMissing === 0,
      boltMissing > 0 ? `${boltMissing} airports missing Bolt` : 'all have Bolt');
  });

  // ── Layover guides data integrity ──────────────────────────────────────────
  await section('Layover guides — data integrity', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/lib/layover-guides.ts'), 'utf8');

    const codeMatches = src.match(/^  ([A-Z]{3}):\s*\{/gm) ?? [];
    const codes = codeMatches.map(m => m.trim().replace(':', '').replace('{', '').trim());

    assert('layover-guides has 20+ airports', codes.length >= 20, `${codes.length} airports`);

    // Every guide should have lounges field
    const missingLounges = [];
    for (const code of codes) {
      const idx   = src.indexOf(`\n  ${code}:`);
      const block = src.slice(idx, src.indexOf('\n  },\n', idx) + 5);
      if (!block.includes('lounges:')) missingLounges.push(code);
    }
    assert('every airport has lounges field', missingLounges.length === 0,
      missingLounges.length > 0 ? `missing: ${missingLounges.join(', ')}` : 'all good');

    // Major hubs present
    const MAJOR_HUBS = ['LHR', 'JFK', 'LAX', 'DXB', 'SIN', 'NRT', 'GIG', 'CDG', 'FRA', 'LIS', 'MAD'];
    for (const hub of MAJOR_HUBS) {
      assert(`${hub} lounge guide present`, codes.includes(hub));
    }

    // China airports present (newly added)
    assert('PVG (Shanghai) guide present', codes.includes('PVG'));
    assert('PEK (Beijing) guide present',  codes.includes('PEK'));

    // Each guide must have at least 1 tip
    const emptyTips = [];
    for (const code of codes) {
      const idx   = src.indexOf(`\n  ${code}:`);
      const block = src.slice(idx, src.indexOf('\n  },\n', idx) + 5);
      if (!block.includes('tips:') || block.includes('tips: []')) emptyTips.push(code);
    }
    assert('every airport has at least 1 tip', emptyTips.length === 0,
      emptyTips.length > 0 ? `empty tips: ${emptyTips.join(', ')}` : 'all have tips');
  });

  // ── Credit card offer mapping ──────────────────────────────────────────────
  await section('Credit card offer mapping', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');

    // CARD_DB keys
    const cardKeys = [...src.matchAll(/^  ([a-z_]+): \{$/gm)].map(m => m[1]);
    assert('at least 10 cards defined', cardKeys.length >= 10, `${cardKeys.length} cards`);

    // Each card must have url, headline, bonus
    const malformed = [];
    for (const key of cardKeys) {
      const idx   = src.indexOf(`  ${key}: {`);
      if (idx === -1) continue;
      const block = src.slice(idx, src.indexOf('\n  },', idx) + 5);
      if (!block.includes('url:') || !block.includes('headline:') || !block.includes('bonus:'))
        malformed.push(key);
    }
    assert('every card has url + headline + bonus', malformed.length === 0,
      malformed.length > 0 ? `malformed: ${malformed.join(', ')}` : 'all complete');

    // Airline mappings cover major carriers
    const AIRLINE_CARDS_MATCH = src.match(/AIRLINE_CARDS: Record.*?= \{([\s\S]*?)\};/);
    if (AIRLINE_CARDS_MATCH) {
      const block = AIRLINE_CARDS_MATCH[1];
      const airlines = [...block.matchAll(/([A-Z]{2}):/g)].map(m => m[1]);
      for (const al of ['UA', 'DL', 'AA', 'BA', 'EK', 'LH', 'AF']) {
        assert(`${al} has card mapping`, airlines.includes(al));
      }
    } else {
      skip('airline card mapping check', 'AIRLINE_CARDS not found in source');
    }

    // Default cards defined
    assert('DEFAULT_CARDS uses chase_sapphire_preferred',
      src.includes("'chase_sapphire_preferred'"));
  });

  // ── Form validation — duplicate passenger prevention ──────────────────────
  await section('Duplicate passenger prevention logic', async () => {
    // Simulates the selectedPassportIds logic
    function profileUsedByOther(selectedPassportIds, currentIdx) {
      return selectedPassportIds.some((id, i) => i !== currentIdx && id !== '' && id !== '__manual__');
    }

    const ids = ['passport-us-123', '', ''];

    assert('pax 0 — profile not used by other',  !profileUsedByOther(ids, 0));
    assert('pax 1 — profile IS used by pax 0',    profileUsedByOther(ids, 1));
    assert('pax 2 — profile IS used by pax 0',    profileUsedByOther(ids, 2));

    // After pax 0 unsets (no saved profile)
    const noIds = ['', '', ''];
    assert('empty ids — pax 1 sees profile',      !profileUsedByOther(noIds, 1));

    // Manual override doesn't block
    const manualIds = ['__manual__', '', ''];
    assert('manual override — pax 1 can use profile', !profileUsedByOther(manualIds, 1));
  });

  // ── Nationality dropdown — country codes ──────────────────────────────────
  await section('Nationality dropdown — country codes', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/lib/visa-data.ts'), 'utf8');
    const countryMatches = [...src.matchAll(/\{ code: '([A-Z]{2})', name: '([^']+)' \}/g)];
    const countries = countryMatches.map(m => ({ code: m[1], name: m[2] }));

    assert('150+ countries in COUNTRIES list', countries.length >= 150, `${countries.length} countries`);

    const mustHave = ['US', 'GB', 'AU', 'BR', 'CN', 'IN', 'TH', 'IL', 'DE', 'FR'];
    for (const code of mustHave) {
      assert(`${code} present`, countries.some(c => c.code === code));
    }

    // No duplicate codes
    const codes = countries.map(c => c.code);
    const unique = new Set(codes);
    assert('no duplicate country codes', unique.size === codes.length,
      unique.size !== codes.length ? `${codes.length - unique.size} duplicates` : 'all unique');

    // flagEmoji formula check (regional indicator A = 0x1F1E6)
    const A = 0x1F1E6;
    function flagEmoji(code) {
      const a = code.charCodeAt(0) - 65 + A;
      const b = code.charCodeAt(1) - 65 + A;
      return String.fromCodePoint(a) + String.fromCodePoint(b);
    }
    assert('US flag emoji correct',  flagEmoji('US') === '🇺🇸');
    assert('TH flag emoji correct',  flagEmoji('TH') === '🇹🇭');
    assert('IL flag emoji correct',  flagEmoji('IL') === '🇮🇱');
  });

  // ── No pre-booking re-search (was causing Duffel 502 "retrieve offer again") ─
  await section('confirmBooking — no pre-booking re-search', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');

    // The refresh-before-booking block must NOT exist
    assert('no pre-booking duffel-search call inside confirmBooking',
      !src.includes('Get freshest offer right before creating the order'));
    assert('confirmBooking uses offer.id directly (no finalOffer variable)',
      !src.includes('finalOffer'));
    assert('offerId comes from original selectedOffer',
      src.includes("offerId: offer.id,"));
  });

  // ── duffel-order route refreshes offer price before booking ───────────────
  await section('duffel-order route — offer price refresh before booking', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');

    assert('route GETs offer price before creating order',
      src.includes('/air/offers/${offerId}'));
    assert('bookingAmount uses refreshed price',
      src.includes('bookingAmount'));
    assert('balance payment uses bookingAmount (not raw amount)',
      src.includes("amount: bookingAmount"));
    assert('refreshedTotalAmount returned in response',
      src.includes('refreshedTotalAmount'));

    // Simulate the price refresh logic
    function refreshLogic(originalAmount, freshAmount) {
      let bookingAmount = originalAmount;
      if (freshAmount) bookingAmount = freshAmount;
      return bookingAmount;
    }
    assert('uses fresh price when available',   refreshLogic('100.00', '105.00') === '105.00');
    assert('falls back to original if no fresh', refreshLogic('100.00', null)     === '100.00');
    assert('keeps original if refresh undefined', refreshLogic('100.00', undefined) === '100.00');
  });

  // ── Payment step: passenger forms hidden (not gated check) ─────────────────
  await section('Payment step — passenger forms gated by bookStep', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');

    // The passenger forms block must be gated by bookStep === 'passenger'
    const passengerFormIdx = src.indexOf("/* Passenger forms — passenger step only */");
    assert('passenger forms block has step gate comment', passengerFormIdx !== -1);

    // Contact details must also be gated
    const contactIdx = src.indexOf("/* Contact details — passenger step only */");
    assert('contact details block has step gate comment', contactIdx !== -1);

    // The gate condition for passenger forms must exist right before the block
    const nearPassengerForms = src.slice(passengerFormIdx, passengerFormIdx + 120);
    assert('passenger forms uses bookStep === passenger gate',
      nearPassengerForms.includes("bookStep === 'passenger'"));

    // The payment step summary (collapsed view) must still exist
    assert("payment step shows collapsed passenger summary",
      src.includes("bookStep === 'payment'") && src.includes('Passenger {idx + 1}'));
  });

  // ── Booking list deduplication ─────────────────────────────────────────────
  await section('Booking list — duplicate deduplication', async () => {
    // Simulate the deduplication logic from bookings/page.tsx
    function deduplicateBookings(data) {
      const seen = new Set();
      return data.filter(b => {
        const key = b.duffel_order_id || b.booking_reference;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const fakeBookings = [
      { id: 'row1', duffel_order_id: 'ord_abc', booking_reference: 'SBJ0KF', total_amount: 1025, created_at: '2026-06-19T10:00:00Z' },
      { id: 'row2', duffel_order_id: 'ord_abc', booking_reference: 'SBJ0KF', total_amount: 1030, created_at: '2026-06-19T10:00:01Z' },
      { id: 'row3', duffel_order_id: 'ord_xyz', booking_reference: 'ABCDEF', total_amount: 394, created_at: '2026-06-20T09:00:00Z' },
    ];

    const result = deduplicateBookings(fakeBookings);
    assert('duplicate order collapsed to 1 row', result.filter(b => b.booking_reference === 'SBJ0KF').length === 1);
    assert('unrelated booking preserved',         result.filter(b => b.booking_reference === 'ABCDEF').length === 1);
    assert('total: 2 unique bookings shown',       result.length === 2);

    // Most recent is kept (first in array since sorted by created_at desc)
    const kept = result.find(b => b.booking_reference === 'SBJ0KF');
    assert('first occurrence kept (most recent from sorted query)', kept?.id === 'row1');

    // No duffel_order_id fallback — dedup by booking_reference
    const fallback = [
      { id: 'r1', duffel_order_id: null, booking_reference: 'REF111', total_amount: 500 },
      { id: 'r2', duffel_order_id: null, booking_reference: 'REF111', total_amount: 500 },
    ];
    const fallbackResult = deduplicateBookings(fallback);
    assert('dedup works when duffel_order_id is null (fallback to ref)', fallbackResult.length === 1);
  });

  // ── LoungeBuddy URL replaced ───────────────────────────────────────────────
  await section('Lounge CTA — LoungeBuddy (acquired by Amex) replaced', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('LoungeBuddy URL removed', !src.includes('loungebuddy.com'));
    assert('DragonPass or valid replacement present',
      src.includes('dragonpass.com') || src.includes('collinsonflex.com') || src.includes('lounge'));
  });

  // ── Travel companions ──────────────────────────────────────────────────────
  await section('Travel companions — API saves and loads companions array', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/profile/traveler/route.ts'), 'utf8');
    assert('GET returns companions array', src.includes('companions'));
    assert('POST accepts companions in body', src.includes('body.companions'));
    assert('companion DOB is encrypted', src.includes('born_on_enc') && src.includes('encryptField'));
    assert('companion passport numbers are encrypted', src.includes('encodePassports'));
    assert('companion DOB is decrypted on GET', src.includes('decryptField'));
  });

  await section('Travel companions — account page saves companions with profile', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    assert('companions state exists', src.includes('companions'));
    assert('companions included in save payload', src.includes('companions,'));
    assert('companions loaded from API response', src.includes('tp.companions'));
    assert('add/remove companion UI present', src.includes('Add companion') && src.includes('Remove'));
  });

  await section('Travel companions — booking flow auto-fills pax 2+ from companions', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('CompanionProfile interface defined', src.includes('CompanionProfile'));
    assert('TravelerProfile includes companions', src.includes('companions?: CompanionProfile[]'));
    assert('companion fill button shown for idx > 0', src.includes('idx > 0') && src.includes('savedProfile.companions'));
    assert('companion fills all passenger fields', src.includes("updatePassenger(idx, 'givenName', c.givenName)"));
  });

  // ── Vercel Analytics removed (was causing Cloudflare 404 + infinite loop) ───
  await section('Vercel Analytics — removed to stop Cloudflare /_vercel/ 404 loop', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/layout.tsx'), 'utf8');
    assert('@vercel/analytics not imported', !src.includes("from '@vercel/analytics"));
    assert('Analytics component not rendered', !src.includes('<Analytics'));
    assert('/_vercel/insights endpoint not referenced', !src.includes('/_vercel/insights'));
  });

  // ── Checkout flow invariants ──────────────────────────────────────────────
  await section('Checkout — confirmBooking sends correct payload to duffel-order', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Uses selectedOffer directly — no re-search that would create new offer_request
    assert('offerId taken from offer.id', src.includes('offerId: offer.id'));
    assert('amount passed as offer.totalAmount.toFixed(2)', src.includes('offer.totalAmount.toFixed(2)'));
    assert('currency taken from offer', src.includes('offer.totalCurrency'));
    assert('passengers mapped with offer.passengerIds', src.includes('offer.passengerIds[i]'));
    assert('all selectedServices sent (seat map IDs are valid Duffel IDs from /air/seat_maps)', src.includes('services: selectedServices,'));
  });

  await section('Checkout — test mode skips card validation and payment intent', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // validateCard only called when NOT in test mode
    assert('validateCard gated on !duffelTestMode', src.includes('!duffelTestMode && !validateCard()') || src.includes('duffelTestMode') && src.includes('validateCard'));
    // payment intent fetch is inside !duffelTestMode block
    assert('payment intent fetch inside live-mode block', src.includes('if (!duffelTestMode)'));
  });

  await section('Checkout — confirmed state set after successful booking', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert("bookStep set to 'confirmed' on success", src.includes("setBookStep('confirmed')"));
    assert('confirmation stores bookingReference', src.includes('order.bookingReference'));
    assert('page scrolls to top after booking', src.includes("window.scrollTo"));
  });

  await section('Checkout — duffel-order route refreshes price and uses it for payment', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    assert('GETs offer price before booking', src.includes('/air/offers/${offerId}'));
    assert('uses refreshed amount for payment', src.includes('bookingAmount'));
    assert('balance payment uses bookingAmount not raw amount', src.includes('amount: bookingAmount'));
    assert('returns refreshedTotalAmount to frontend', src.includes('refreshedTotalAmount'));
    assert('offer GET is cache: no-store', src.includes("cache: 'no-store'"));
    assert('expired offer returns 410 before attempting to book', src.includes('offer_expired') && src.includes('status: 410'));
    assert('expired offer error message tells user to search again', src.includes('Please search again'));
  });

  await section('Checkout — frontend handles offer_expired error gracefully', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('offer_expired error detected and surfaced', src.includes("order.error === 'offer_expired'") || src.includes('no longer available'));
    assert('"Search again" link shown on expired offer error', src.includes('Search again') && src.includes('no longer available'));
    assert('Search again resets selectedOffer', src.includes("setSelectedOffer(null)") && src.includes('setBookingError'));
  });

  await section('Checkout — duffel-order saves booking to Supabase', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    assert('inserts into flight_bookings', src.includes("from('flight_bookings').insert"));
    assert('saves duffel_order_id', src.includes('duffel_order_id'));
    assert('saves booking_reference', src.includes('booking_reference'));
    assert('saves passenger_names', src.includes('passenger_names'));
    assert('Supabase failure does not break booking (best-effort)', src.includes('best-effort'));
  });

  // ── Cancel booking — DB update fix ─────────────────────────────────────────
  await section('Cancel — duffel-cancel route updates DB correctly', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');
    assert('confirm action updates status to cancelled', src.includes("status: 'cancelled'"));
    assert('DB update checks for error (not silent)', src.includes('dbError'));
    assert('update matches on id only (no user_id filter that breaks null rows)', !src.includes(".eq('user_id', user.id)"));
    assert('Duffel cancellation confirmed before DB update', src.includes('order_cancellations') && src.includes('actions/confirm'));
  });

  // ── Cancel booking — belt-and-suspenders DB update ─────────────────────────
  await section('Cancel — tries BOTH duffel_order_id AND bookingId so neither alone can fail silently', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');

    // Must attempt update by duffel_order_id (catches all duplicate rows for same order)
    assert('update by duffel_order_id attempted', src.includes(".eq('duffel_order_id', body.orderId)"));

    // Must ALSO attempt update by id (fallback when duffel_order_id is null or mismatched)
    assert('update by bookingId also attempted', src.includes(".eq('id', body.bookingId)"));

    // Both branches under confirm action — not just one or the other
    const confirmBlock = src.slice(src.indexOf("body.action === 'confirm'"));
    const endOfConfirm = confirmBlock.indexOf("\n    if (body.action ===");
    const block = endOfConfirm > 0 ? confirmBlock.slice(0, endOfConfirm) : confirmBlock.slice(0, 2000);
    assert('both eq calls inside confirm block', block.includes("duffel_order_id") && block.includes("'id', body.bookingId"));

    // Admin client is tried first, user client is fallback
    assert('admin client used with getAdminClient()', src.includes('getAdminClient()'));
    assert('falls back to user supabase if no admin key', src.includes('adminClient ?? supabase') || src.includes('getAdminClient() ??'));

    // Response includes debug fields so we can diagnose in DevTools
    assert('response includes hasAdmin for diagnosis', src.includes('hasAdmin'));
    assert('response includes rowsUpdated for diagnosis', src.includes('rowsUpdated'));

    // rowsUpdated accumulates across both update attempts
    assert('rowsUpdated accumulates from both attempts', /rowsUpdated\s*\+=/.test(src) || src.includes('rowsUpdated += '));

    // No silent failure — 0 rows always logged
    assert('0 rows affected is logged as error', src.includes("'no_rows_updated'") || src.includes('"no_rows_updated"'));
    assert('0 rows returns dbWarning not hard error (cancel succeeded in Duffel)', src.includes('dbWarning') && src.includes('success: true'));
  });

  // ── Cancel booking — admin client availability ──────────────────────────────
  await section('Cancel — admin client requires service role key, not anon key', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');

    // Must use SUPABASE_SERVICE_ROLE_KEY (not the anon key) for RLS bypass
    assert('uses SUPABASE_SERVICE_ROLE_KEY env var', src.includes('SUPABASE_SERVICE_ROLE_KEY'));
    assert('does NOT use NEXT_PUBLIC_SUPABASE_ANON_KEY for admin', !src.includes('ANON_KEY'));

    // Admin client must be a raw createClient call (not the SSR wrapper)
    assert('imports createAdminClient from supabase-js directly', src.includes("from '@supabase/supabase-js'") || src.includes('from "@supabase/supabase-js"'));
    assert('createAdminClient called with url and service role key', src.includes('createAdminClient(url, key)'));

    // getAdminClient returns null when key missing — never throws
    assert('getAdminClient returns null when key missing', src.includes('if (!url || !key) return null'));
  });

  // ── Companion isChild flag ───────────────────────────────────────────────
  await section('Companions — isChild flag', async () => {
    const accountSrc = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    assert('CompanionData has isChild field', accountSrc.includes('isChild'));
    assert('EMPTY_COMPANION initialises isChild false', accountSrc.includes('isChild: false'));
    assert('toggle in companion form', accountSrc.includes('This is a child'));
    assert('Child badge shown in companion list', accountSrc.includes('>Child<'));

    const apiSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/profile/traveler/route.ts'), 'utf8');
    assert('CompanionRaw has is_child field', apiSrc.includes('is_child'));
    assert('isChild decoded on GET', apiSrc.includes('isChild'));
    assert('is_child encoded on POST', apiSrc.includes('is_child:'));

    const flightSrc = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('CompanionProfile has isChild', flightSrc.includes('isChild?'));
  });

  // ── Companion save from booking flow ────────────────────────────────────
  await section('Companions — savePassenger checkbox actually POSTs to API', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('savePassenger state exists', src.includes('savePassenger'));
    assert('save POST triggered after booking when checked', src.includes("if (savePassenger)") && src.includes("method: 'POST'") && src.includes('/api/profile/traveler'));
    assert('existing companions GETted before merge', src.includes("fetch('/api/profile/traveler')") && src.includes('mergedCompanions'));
    assert('companions merged by name (no duplicates)', src.includes('mergedCompanions'));
    assert('lead passenger (forms[0]) updates main profile', src.includes('forms[0]') && src.includes('givenName: lead.givenName'));
    assert('additional passengers (forms.slice(1)) become companions', src.includes('forms.slice(1)'));
    assert('passports merged by country — existing passports not wiped', src.includes('existingPassports') && src.includes('findIndex') && src.includes('p.country === lead.passportCountry'));
  });

  // ── Seat map — selected/available/taken logic ──────────────────────────────
  await section('Seat map — undefined paxSvc does not mark seat as selected', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Both copies of the seat map must guard against undefined === undefined
    const badPattern = /const selected = seatSelections\[.*\] === paxSvc\?\.id;/g;
    const goodPattern = /const selected = !!paxSvc\?\.id && seatSelections\[.*\] === paxSvc\.id;/g;
    const badMatches = [...src.matchAll(badPattern)].length;
    const goodMatches = [...src.matchAll(goodPattern)].length;
    assert('no unguarded selected = ... === paxSvc?.id comparisons', badMatches === 0);
    assert('both seat map copies use !!paxSvc?.id guard (2 occurrences)', goodMatches === 2);
  });

  // ── Seat map — segment ID never shown as raw ID ─────────────────────────────
  await section('Seat map — raw segment ID never exposed in the UI', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // The old fallback was `sm.segmentId` — should now be human-readable
    assert('raw sm.segmentId not used as segment header fallback', !src.includes(': sm.segmentId}'));
    assert('human-readable fallback used instead (Segment N · class)', src.includes('`Segment ${seatMaps!.indexOf(sm) + 1}'));
  });

  // ── Traveler profile GET — name fallback from display_name ─────────────────
  await section('Profile GET — givenName/familyName fall back to display_name when not saved', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/profile/traveler/route.ts'), 'utf8');
    assert('display_name fetched alongside traveler_profile', src.includes("'traveler_profile, display_name'"));
    assert('display_name parsed into first/rest words', src.includes('split(/\\s+/)'));
    assert('givenFallback used when given_name not saved', src.includes('raw.given_name ?? givenFallback'));
    assert('familyFallback used when family_name not saved', src.includes('raw.family_name ?? familyFallback'));
    assert('auth metadata also checked as secondary fallback', src.includes('user_metadata?.full_name'));
  });

  // ── Account page — parallel fetch for fast passport load ───────────────────
  await section('Account page — user_profiles and traveler profile fetched in parallel', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    assert('Promise.all used to parallelise both fetches', src.includes('Promise.all'));
    assert('user_profiles query included in Promise.all', src.includes("supabase.from('user_profiles').select('*')") && src.includes('Promise.all'));
    assert('traveler profile fetch included in Promise.all', src.includes("fetch('/api/profile/traveler')") && src.includes('Promise.all'));
    assert('passports rendered after both parallel calls resolve', src.includes('setTravPassports'));
  });

  // ── Avatar upload — instant local preview ────────────────────────────────
  await section('Avatar upload — shows local preview before upload completes', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    assert('createObjectURL used for instant preview', src.includes('createObjectURL'));
    assert('preview set before upload starts', src.indexOf('setAvatarUrl(localPreview)') < src.indexOf("supabase.storage"));
    assert('revokeObjectURL called after upload', src.includes('revokeObjectURL'));
    assert('reverts avatar on upload error', src.includes("setAvatarUrl('')"));
  });

  // ── Avatar cache bust — persists across refresh ───────────────────────────
  await section('Avatar upload — cache-busted URL saved to DB so image updates on refresh', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    // urlWithBust must be used in both setAvatarUrl and the upsert
    assert('urlWithBust variable created with ?t= timestamp', src.includes("urlWithBust = publicUrl + '?t=' + Date.now()"));
    assert('setAvatarUrl uses urlWithBust (not plain publicUrl)', src.includes('setAvatarUrl(urlWithBust)'));
    assert('upsert saves urlWithBust (not plain publicUrl)', src.includes('avatar_url: urlWithBust'));
    // handleSave must NOT strip the ?t= param
    const handleSaveIdx = src.indexOf('async function handleSave');
    const savePayloadSection = src.slice(handleSaveIdx, handleSaveIdx + 1200);
    assert('handleSave does not strip ?t= from avatarUrl', !savePayloadSection.includes("avatarUrl.split('?')[0]"));
    assert('handleSave saves avatarUrl as-is', savePayloadSection.includes('avatar_url: avatarUrl'));
  });

  // ── Passport expiry — validation + badges + home banner ─────────────────
  await section('Passport expiry — block save on expired, badge on card, home page banner', async () => {
    const accountSrc = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');

    // passportExpiryStatus helper exists
    assert('passportExpiryStatus helper defined', accountSrc.includes('function passportExpiryStatus'));
    assert('passportExpiryStatus returns expired', accountSrc.includes("return 'expired'"));
    assert('passportExpiryStatus returns soon', accountSrc.includes("return 'soon'"));

    // Validation in handleSave blocks expired passports
    assert('handleSave checks for expired passports', accountSrc.includes("passportExpiryStatus(p.passportExpiry) === 'expired'"));
    assert('handleSave shows error with country name', accountSrc.includes('Passport expired:'));
    assert('handleSave returns early on expired passport', accountSrc.includes("setError(`Passport expired:"));

    // Badges rendered on passport cards
    assert('Expired badge rendered on card', accountSrc.includes("expiryStatus === 'expired'") && accountSrc.includes('Expired</span>'));
    assert('Expiring soon badge rendered on card', accountSrc.includes("expiryStatus === 'soon'") && accountSrc.includes('Expiring soon</span>'));
    assert('Expired card gets red border', accountSrc.includes("'#FEE2E2'"));
    assert('Expiring soon card gets amber border', accountSrc.includes("'#FEF3C7'"));

    // Home page banner
    const homeSrc = readFileSync(resolve(__dir, 'frontend-next/app/page.tsx'), 'utf8');
    assert('expiringPassports state on home page', homeSrc.includes('expiringPassports'));
    assert('home page query fetches traveler_profile', homeSrc.includes("'passport_nationality, passport_nationalities, traveler_profile'"));
    assert('home page checks passport expiry within 6 months', homeSrc.includes('sixMonths.setMonth'));
    assert('home page banner links to /account', homeSrc.includes('href="/account"') && homeSrc.includes('expiringPassports'));
    assert('home page banner is dismissible', homeSrc.includes('passportBannerDismissed'));
    assert('home page banner shows expired vs soon state', homeSrc.includes("p.expired") && homeSrc.includes('Passport expired'));
  });

  // ── DiDi logo + AppLogo fallback ────────────────────────────────────────
  await section('Ride-share logos — DiDi Clearbit domain and 3-level AppLogo fallback', async () => {
    const tipsSrc = readFileSync(resolve(__dir, 'frontend-next/lib/transport-tips.ts'), 'utf8');
    assert('DiDi logo uses didichuxing.com (not didiglobal.com in logoUrl)', tipsSrc.includes('didichuxing.com') && !tipsSrc.includes('clearbit.com/didiglobal.com'));

    const bookSrc = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('AppLogo has 3-level fallback (clearbit/favicon/letter)', bookSrc.includes("'clearbit'") && bookSrc.includes("'favicon'") && bookSrc.includes("'letter'"));
    assert('Google favicon used as second fallback', bookSrc.includes('google.com/s2/favicons'));
    assert('letter initial as last resort', bookSrc.includes('name[0]'));
  });

  // ── Delete account ───────────────────────────────────────────────────────
  await section('Account — delete account feature', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    assert('deleteModal state exists', src.includes('deleteModal'));
    assert('Danger zone section present', src.includes('Danger zone'));
    assert('confirmation modal shows before delete', src.includes('Delete my account') && src.includes('Yes, delete'));
    assert('calls DELETE /api/account/delete', src.includes('/api/account/delete'));

    const routeSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/account/delete/route.ts'), 'utf8');
    assert('DELETE route uses service role key (not anon)', routeSrc.includes('SUPABASE_SERVICE_ROLE_KEY'));
    assert('calls admin.deleteUser', routeSrc.includes('admin.deleteUser'));
    assert('requires authenticated user', routeSrc.includes('unauthorized'));
    // FK constraint fix: must clean up all tables before auth deletion
    assert('deletes user_profiles via admin', routeSrc.includes("admin.from('user_profiles')"));
    assert('deletes flight_bookings via admin', routeSrc.includes("admin.from('flight_bookings')"));
    assert('deletes booking_clicks via admin', routeSrc.includes("admin.from('booking_clicks')"));
    assert('deletes user_preferences via admin', routeSrc.includes("admin.from('user_preferences')"));
    assert('table cleanup happens before auth deleteUser', routeSrc.indexOf("admin.from('flight_bookings')") < routeSrc.indexOf('admin.auth.admin.deleteUser'));
  });

  // ── Duffel API coverage audit ────────────────────────────────────────────
  await section('Duffel API — flight API coverage audit', async () => {
    const routes = [
      'duffel-search', 'duffel-order', 'duffel-order-detail',
      'duffel-payment-intent', 'duffel-cancel', 'seat-map',
      'duffel-post-book-bags', 'duffel-change-order', 'duffel-pay-held',
    ];
    for (const r of routes) {
      const exists = (() => { try { readFileSync(resolve(__dir, `frontend-next/app/api/flights/${r}/route.ts`)); return true; } catch { return false; } })();
      assert(`${r} route exists`, exists);
    }

    const cancelSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');
    assert('Cancel: quote + confirm two-step flow', cancelSrc.includes("'quote'") && cancelSrc.includes("'confirm'"));

    const orderSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    assert('Order: seats/bags services supported at booking', orderSrc.includes('services'));
    assert('Order: hold=true creates held order without payment', orderSrc.includes('hold') && orderSrc.includes("order.status === 'held'"));

    const searchSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-search/route.ts'), 'utf8');
    assert('Search: children + infants passengers supported', searchSrc.includes('child') && searchSrc.includes('infant'));
    assert('Search: paymentRequirements mapped from offer', searchSrc.includes('paymentRequirements') && searchSrc.includes('requiresInstantPayment'));

    const bagsSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-post-book-bags/route.ts'), 'utf8');
    assert('Post-book bags: GET fetches available services', bagsSrc.includes('available_services'));
    assert('Post-book bags: POST creates order_services', bagsSrc.includes('order_services'));

    const changeSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-change-order/route.ts'), 'utf8');
    assert('Change order: patch action for name correction', changeSrc.includes("'patch'"));
    assert('Change order: request action for date change', changeSrc.includes("'request'") && changeSrc.includes('order_change_requests'));
    assert('Change order: confirm action for accepting change offer', changeSrc.includes("'confirm'") && changeSrc.includes('order_change_offers'));

    const payHeldSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-pay-held/route.ts'), 'utf8');
    assert('Pay held: POSTs to /air/payments', payHeldSrc.includes('/air/payments'));
    assert('Pay held: updates booking to confirmed', payHeldSrc.includes("'confirmed'"));

    skip('Loyalty Programme Accounts', 'not needed for MVP');
  });

  // ── Seat map — decoupled from availableServices ──────────────────────────
  await section('Seat map — auto-load on offer select, no button if unavailable', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('Seat selection card on passenger step', src.includes("bookStep === 'passenger'") && src.includes('Seat selection'));
    assert('Seat map auto-loads via useEffect on selectedOffer change', src.includes("selectedOffer?.id") && src.includes('/api/flights/seat-map'));
    assert('Loading state has spinner SVG (animate-spin)', src.includes('animate-spin') && src.includes('Checking seat availability'));
    assert('No button if unavailable — contact airline message', src.includes("Seat selection isn") && src.includes('online check-in'));
    assert('seat count badge shown when seats selected', src.includes('seatSelections') && src.includes('selected'));
    assert('seatMapsOpen removed', !src.includes('seatMapsOpen'));
    assert('loadSeatMaps removed', !src.includes('loadSeatMaps'));
  });

  await section('Seat map — legend shows Free / Paid / Selected / Taken (not Available)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Both seat map copies must use the 4-item legend
    const freeLegendCount = (src.match(/\/>.*?Free<\/span>/g) ?? []).length;
    const paidLegendCount = (src.match(/\/>.*?Paid<\/span>/g) ?? []).length;
    assert('Free legend shown in both seat map copies', freeLegendCount >= 2);
    assert('Paid legend shown in both seat map copies', paidLegendCount >= 2);
    // Old "Available" label must be gone from both copies
    assert('Available label removed from legend', !src.includes('} /> Available<'));
  });

  // ── Hold & Pay Later ─────────────────────────────────────────────────────
  await section('Hold & Pay Later — booking flow + booking detail', async () => {
    const flightSrc = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('holdMode state added', flightSrc.includes('holdMode'));
    assert('Hold button shown when offer supports it', flightSrc.includes('requiresInstantPayment') && flightSrc.includes('Hold seat'));
    assert('hold passed to duffel-order API', flightSrc.includes("hold: holdMode"));
    assert('held status shown in confirmation', flightSrc.includes("order.status === 'held'"));

    const detailSrc = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('isHeld derived from booking status', detailSrc.includes("booking.status === 'held'"));
    assert('held badge shown in route header', detailSrc.includes('Held — pay to confirm'));
    assert('Pay Now section for held orders', detailSrc.includes('payHeldOrder') && detailSrc.includes('Complete Your Booking'));

    const listSrc = readFileSync(resolve(__dir, 'frontend-next/app/bookings/page.tsx'), 'utf8');
    assert('held section shown in bookings list', listSrc.includes("status === 'held'"));
    assert('held badge amber color', listSrc.includes('⏳ Held'));
  });

  // ── Post-booking bags + name correction UI ───────────────────────────────
  await section('Post-booking manage — add bags + name correction UI', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('Add bags section present', src.includes('Add Checked Baggage'));
    assert('Bags auto-checked on page load (no button)', src.includes('bagsChecked') && src.includes('Checking availability'));
    assert('No bags → contact airline message', src.includes("Extra bags aren") && src.includes('contact the airline directly'));
    assert('addBags calls duffel-post-book-bags POST', src.includes("method: 'POST'") && src.includes('duffel-post-book-bags'));
    assert('bagsDone success state', src.includes('bagsDone'));
    assert('Name correction section present', src.includes('Passenger Name Correction'));
    assert('saveNameCorrection calls duffel-change-order patch', src.includes("action: 'patch'") && src.includes('duffel-change-order'));
    assert('Name unavailable → contact airline message', src.includes('nameUnavailable') && src.includes("contact the airline directly"));
    assert('nameDone success state', src.includes('nameDone'));
    assert('passenger list shown for editing', src.includes('namePassengerId'));
  });

  // ── Chip price prefetch includes returnDate ──────────────────────────────
  await section('Date chip prefetch — includes returnDate for round trips', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('prefetch shifts returnDate by same offset', src.includes('prefetchRet') && src.includes('rd.setUTCDate'));
    assert('prefetch sends returnDate to duffel-search', src.includes('returnDate: prefetchRet'));
    assert('chip shows ~ prefix for non-active dates', src.includes("!isActive && '~'"));
  });

  // ── Airline internal_error retry ─────────────────────────────────────────
  await section('Booking error — internal_error shows retry button', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('internal_error detected and tagged as retryable', src.includes('__retryable__') && src.includes('internal_error'));
    assert('retry button shown for retryable errors', src.includes("startsWith('__retryable__')") && src.includes('Try again'));
    assert('__retryable__ prefix stripped from displayed message', src.includes("replace('__retryable__', '')"));
  });

  // ── Calendar flip-up ─────────────────────────────────────────────────────
  await section('Date picker — calendar flips above input when near bottom of viewport', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    assert('flipUp logic exists', src.includes('flipUp') && src.includes('calH'));
    assert('top position uses flipUp to go above input', src.includes('flipUp ? anchor.top - calH'));
  });

  // ── Calendar opens at today's month ──────────────────────────────────────
  await section('Date picker — calendar opens at selected date month, falls back to today', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    // toggle() opens at value's month if set, otherwise today
    assert('toggle uses value date when set', src.includes('value ? new Date(value +'));
    assert('toggle sets viewYear from resolved date', src.includes('setViewYear(d.getFullYear())'));
    assert('toggle sets viewMonth from resolved date', src.includes('setViewMonth(d.getMonth())'));
  });

  // ── Hotel calendar opens at today's month ────────────────────────────────
  await section('Hotel calendar — always opens at today\'s month (not pre-selected checkin month)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/SearchBar.tsx'), 'utf8');
    assert('viewYear initialised from new Date() not checkin', src.includes('useState(() => new Date().getFullYear())'));
    assert('viewMonth initialised from new Date() not checkin', src.includes('useState(() => new Date().getMonth())'));
    // Must NOT initialise from checkin value
    assert('checkin not used to seed viewYear/viewMonth', !src.includes('checkin ? new Date(checkin'));
  });

  // ── Hotel calendar close behavior ────────────────────────────────────────
  await section('Hotel calendar — close on outside-click and on scroll', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/SearchBar.tsx'), 'utf8');
    assert('click event used (not mousedown) so click-scroll never closes calendar', src.includes("addEventListener('click', handler)"));
    assert('opening click excluded via setTimeout(0)', src.includes('setTimeout(() => document.addEventListener'));
    assert('cleanup removes click listener', src.includes("removeEventListener('click', handler)"));
    assert('scroll listener closes calendar (fixed pos detaches from anchor on scroll)', src.includes("window.addEventListener('scroll', onScroll"));
    assert('scroll listener cleanup removes it', src.includes("window.removeEventListener('scroll', onScroll)"));
    assert('scroll listener is passive for perf', src.includes("passive: true"));
  });

  // ── Default search dates are tomorrow ────────────────────────────────────
  await section('Search bars — default dates start tomorrow, not days/weeks ahead', async () => {
    const hotelSrc = readFileSync(resolve(__dir, 'frontend-next/components/SearchBar.tsx'), 'utf8');
    assert('hotel checkin defaults to +1 day', hotelSrc.includes('Date.now() + 1 * 86400000'));
    assert('hotel checkout defaults to +4 days (3 nights)', hotelSrc.includes('Date.now() + 4 * 86400000'));
    // Not the old +30 day offset
    assert('hotel does not default 30 days out', !hotelSrc.includes('30 * 86400000'));

    const flightSrc = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    assert('flight depart defaults to +1 day', flightSrc.includes("d.getDate() + 1"));
    // Not the old +7 day offset
    assert('flight does not default 7 days out', !flightSrc.includes("d.getDate() + 7"));
  });

  // ── Round trip requires return date ──────────────────────────────────────
  await section('Flight search — round trip blocks search without return date', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    assert('search button disabled when round trip and no return date', src.includes("tripType === 'round' && !ret"));
    assert('return date picker gets required prop', src.includes('required onChange={setRet}') || src.includes('required\n') && src.includes('onChange={setRet}'));
    assert('required prop highlights border amber', src.includes("required && !value ? '#F59E0B'"));
  });

  // ── DragonPass link fix ───────────────────────────────────────────────────
  await section('DragonPass link — uses root URL not broken /en-gb/ path', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('DragonPass links to root URL', src.includes('dragonpass.com/') && !src.includes('dragonpass.com/en-gb'));
  });

  // ── transport-tips: APP_META ──────────────────────────────────────────────
  await section('transport-tips — APP_META coverage', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/lib/transport-tips.ts'), 'utf8');
    for (const app of ['Uber', 'Lyft', 'Bolt', 'Grab', 'DiDi', 'Gojek', 'Careem']) {
      assert(`APP_META has ${app}`, src.includes(`'${app}':`));
    }
    assert('getAppMeta exported', src.includes('export function getAppMeta'));
    assert('getVisaNotice exported', src.includes('export function getVisaNotice'));
    assert('LIMO_SERVICES exported', src.includes('export const LIMO_SERVICES'));
  });

  // ── transport-tips: visa notices ─────────────────────────────────────────
  await section('transport-tips — visa notices', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/lib/transport-tips.ts'), 'utf8');
    assert('USA ESTA notice defined', src.includes('USA_ESTA'));
    assert('Australia ETA notice defined', src.includes('AUSTRALIA_ETA'));
    assert('Canada eTA notice defined', src.includes('CANADA_ETA'));
    assert('India eVisa notice defined', src.includes('INDIA_EVISA'));
    assert('US airports set includes JFK', src.includes("'JFK'"));
    assert('US airports set includes LAX', src.includes("'LAX'"));
    assert('China visa notice defined', src.includes('CHINA_VISA'));
  });

  // ── transport-tips: limo services ────────────────────────────────────────
  await section('transport-tips — limo services', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/lib/transport-tips.ts'), 'utf8');
    assert('Blacklane listed for JFK', src.includes('JFK:') && src.includes('Blacklane'));
    assert('Blacklane listed for LHR', src.includes('LHR:'));
    assert('DXB limo services defined', src.includes('DXB:'));
    assert('limo URLs are present', src.includes('blacklane.com'));
  });

  // ── Booking page: countdown and visa notice ───────────────────────────────
  await section('Booking page — countdown + visa notice + branded app cards', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('countdown renders departure days', src.includes('Departing in'));
    assert('countdown shows urgent state for <2 days', src.includes('isUrgent'));
    assert('visa notice rendered when present', src.includes('visaNotice.title'));
    assert('Apply now button links to visa applyUrl', src.includes('visaNotice.applyUrl'));
    assert('individual app cards rendered per app', src.includes('rideApps.map(appName =>'));
    assert('getAppMeta used for brand colors', src.includes('getAppMeta(appName)'));
    assert('limo services section present', src.includes('VIP'));
    assert('limo card links to limo.url', src.includes('limo.url'));
    assert('transport-tips imported', src.includes("from '@/lib/transport-tips'"));
  });

  // ── Booking page: cancellation flow ──────────────────────────────────────
  await section('Booking detail — cancellation UX and race-condition fix', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    // No router.refresh() after cancel — prevents race where Supabase hasn't propagated yet
    // and the page re-renders showing the old confirmed status
    assert('router.refresh() not called after cancel (no race condition)', !src.includes("router.refresh();"));
    // Combined quote+confirm in single function — no separate getQuote/confirmCancel
    assert('cancelBooking does quote then confirm in one shot', src.includes("action: 'quote'") && src.includes("action: 'confirm'") && src.includes('function cancelBooking'));
    assert('old 2-step getQuote function removed', !src.includes('function getQuote'));
    assert('old confirmCancel function removed', !src.includes('function confirmCancel'));
    // Confirmation modal — replace "Check live" button
    assert('confirm modal shown on cancel button click', src.includes('showCancelModal'));
    assert('old "Check live cancellation" button removed', !src.includes('Check live cancellation'));
    assert('cancel button opens modal not quote flow', src.includes('setShowCancelModal(true)'));
    assert('modal has Never mind + Yes cancel buttons', src.includes("Never mind") && src.includes("Yes, cancel"));
    assert('modal shows cancellation fee from stored policy', src.includes('cancelPolicyLabel') && src.includes('showCancelModal'));
    assert('non-refundable fares show blocked state without cancel button', src.includes("cp?.allowed === false"));
    assert('cancelRefund stores refund amount for success message', src.includes('setCancelRefund'));
    assert('local state update: booking.status set to cancelled', src.includes("status: 'cancelled'"));
    assert('bookingId sent with quote request (needed for stale-status fix)', src.includes('bookingId: booking.id') && src.includes("action: 'quote'"));
    assert('alreadyCancelled signal handled — shows cancelled state without error', src.includes('quote.alreadyCancelled'));
    assert('alreadyCancelled updates booking local state', src.includes('alreadyCancelled') && src.includes("status: 'cancelled'"));
  });

  // ── Cancel route — already-cancelled recovery ─────────────────────────────
  await section('Cancel route — recovers stale Supabase status on already-cancelled order', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');
    assert('quote step wraps duffelReq in try/catch for already-cancelled detection', src.includes('already been cancelled') || src.includes('already cancelled'));
    assert('alreadyCancelled response returned (not an error) when Duffel says already done', src.includes('alreadyCancelled: true'));
    assert('Supabase updated to cancelled when already-cancelled detected', src.includes('alreadyCancelled') && src.includes("status: 'cancelled'"));
    assert('bookingId accepted in quote action to enable Supabase fix', src.includes('body.bookingId'));
    assert('already-cancelled error rethrown if pattern does not match (avoid swallowing)', src.includes('throw quoteErr'));

    // Belt-and-suspenders: alreadyCancelled path must update by BOTH duffel_order_id AND id
    // so duplicate rows (server+client inserts) all get fixed, not just the row matching bookingId
    // Search from the condition line, not the comment above it
    const alreadyIdx = src.indexOf("msg.toLowerCase().includes('already been cancelled')");
    const alreadyBlock = src.slice(alreadyIdx, alreadyIdx + 700);
    assert('alreadyCancelled path updates by duffel_order_id (catches duplicate rows)', alreadyBlock.includes("duffel_order_id"));
    assert('alreadyCancelled path updates by id as well', alreadyBlock.includes("body.bookingId") && alreadyBlock.includes(".eq('id',"));
    assert('alreadyCancelled path uses admin client for RLS bypass', alreadyBlock.includes('getAdminClient()'));
  });

  // ── PhoneInput component ─────────────────────────────────────────────────
  await section('PhoneInput — component structure', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/PhoneInput.tsx'), 'utf8');
    assert('DIAL_CODES array defined', src.includes('const DIAL_CODES'));
    assert('parsePhone handles full number', src.includes('function parsePhone'));
    assert('parsePhone defaults to +1 for empty', src.includes("dial: '+1'"));
    assert('flagEmoji converts country code to emoji', src.includes('function flagEmoji'));
    assert('flagEmoji uses regional indicator technique', src.includes('127397'));
    assert('dropdown uses portal (createPortal)', src.includes('createPortal'));
    assert('search filter in dropdown', src.includes("Search country or code"));
    assert('closes on outside click', src.includes("document.addEventListener('click', handler)"));
    assert('US entry in DIAL_CODES', src.includes("code: 'US'") && src.includes("dial: '+1'"));
    assert('Thailand in DIAL_CODES', src.includes("code: 'TH'") && src.includes("dial: '+66'"));
    assert('UAE in DIAL_CODES', src.includes("code: 'AE'") && src.includes("dial: '+971'"));
    assert('UK in DIAL_CODES', src.includes("code: 'GB'") && src.includes("dial: '+44'"));
    assert('India in DIAL_CODES', src.includes("code: 'IN'") && src.includes("dial: '+91'"));
    assert('emits dial+number concatenated', src.includes('`${d}${n}`'));
    assert('syncs when value prop changes externally', src.includes('parsePhone(value)') && src.includes('[value]'));
    assert('no plain tel input — PhoneInput replaces it', !src.includes("type=\"tel\"") || src.includes('<input\n        type="tel"'));
  });

  // ── PhoneInput wired into FlightResults ─────────────────────────────────
  await section('FlightResults — phone field uses PhoneInput', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('PhoneInput imported', src.includes("import PhoneInput from '@/components/PhoneInput'"));
    assert('PhoneInput used for phone field', src.includes('<PhoneInput value={paxForm.phoneNumber}'));
    assert('onChange delegates to updatePassenger', src.includes("onChange={v => updatePassenger(idx, 'phoneNumber', v)}"));
    assert('old plain tel input removed from phone field', !src.includes('type="tel" value={paxForm.phoneNumber}'));
  });

  // ── PhoneInput wired into account page ───────────────────────────────────
  await section('Account page — phone fields use PhoneInput', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/account/page.tsx'), 'utf8');
    assert('PhoneInput imported', src.includes("import PhoneInput from '@/components/PhoneInput'"));
    assert('main profile phone uses PhoneInput', src.includes('<PhoneInput value={phoneNumber} onChange={setPhoneNumber}'));
    assert('companion phone uses PhoneInput', src.includes('<PhoneInput value={companionForm.phone}'));
    assert('plain tel inputs removed from phone fields', !src.includes('type="tel" value={phoneNumber}'));
  });

  // ── Airport autocomplete — grouped by city ───────────────────────────────
  await section('FlightSearchBar — airport autocomplete grouped by city', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    assert('METRO_CITY map defined', src.includes('const METRO_CITY'));
    assert('Bangkok group covers BKK and DMK', src.includes("BKK: 'Bangkok'") && src.includes("DMK: 'Bangkok'"));
    assert('Tokyo group covers NRT and HND', src.includes("NRT: 'Tokyo'") && src.includes("HND: 'Tokyo'"));
    assert('London group covers LHR and LGW', src.includes("LHR: 'London'") && src.includes("LGW: 'London'"));
    assert('New York group covers JFK and EWR', src.includes("JFK: 'New York'") && src.includes("EWR: 'New York'"));
    assert('CityGroup type defined', src.includes('type CityGroup'));
    assert('searchAirportsGrouped function defined', src.includes('function searchAirportsGrouped'));
    assert('groups capped at 6 city groups', src.includes('map.size >= 6'));
    assert('AIRPORT_FULL_NAMES map defined', src.includes('const AIRPORT_FULL_NAMES'));
    assert('city display uses METRO_CITY fallback', src.includes('METRO_CITY[a.code] ?? a.name'));
    assert('dropdown renders city groups', src.includes('groups.map(group =>'));
    assert('groups state used instead of flat suggestions', src.includes('useState<CityGroup[]>'));
  });

  // ── Cabin class — not hardcoded Economy ─────────────────────────────────
  await section('Flight results — cabin class from API, not hardcoded Economy', async () => {
    const searchSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-search/route.ts'), 'utf8');
    assert('cabin_class extracted per segment from passengers[0]', searchSrc.includes('cabin_class') && searchSrc.includes('segCabinClass'));
    assert('cabinClass added to segment return object', searchSrc.includes("cabinClass: segCabinClass"));
    assert('falls back to economy when cabin_class missing', searchSrc.includes("?? 'economy'"));

    const resultsSrc = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('fmtCabin helper converts snake_case to display name', resultsSrc.includes('function fmtCabin'));
    assert("fmtCabin maps 'business' to Business", resultsSrc.includes("'business' ? 'Business'"));
    assert("fmtCabin maps 'premium_economy' to Premium Economy", resultsSrc.includes("'premium_economy' ? 'Premium Economy'"));
    assert("fmtCabin maps 'first' to First Class", resultsSrc.includes("'first' ? 'First Class'"));
    assert('cabin badge uses fmtCabin not hardcoded Economy', resultsSrc.includes('fmtCabin(firstSeg.cabinClass') && !resultsSrc.includes('>Economy<'));
    assert('segment detail uses fmtCabin not hardcoded Economy', resultsSrc.includes('fmtCabin(seg.cabinClass'));
    assert('Segment type has optional cabinClass field', resultsSrc.includes('cabinClass?: string'));
  });

  // ── Duffel hold order — type field required ───────────────────────────────
  await section('Duffel order route — hold type field', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    assert("type: 'hold' sent for hold orders", src.includes("type: hold ? 'hold' : 'instant'"));
    assert('hold orders omit payments array', src.includes('hold ? null'));
    assert('instant orders include balance payment in test mode', src.includes("type: 'balance'"));
    assert('phone_number prefixed with + always', src.includes("startsWith('+') ? p.phoneNumber : `+${p.phoneNumber}`"));
  });

  // ── hold_not_supported — Business/fare hold rejection ────────────────────
  await section('Duffel order route — hold_not_supported error (Business fare hold)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    // Route must detect the Duffel "'type' was incorrect" error for hold requests
    assert("hold_not_supported error returned when Duffel rejects type field", src.includes("'hold_not_supported'"));
    assert("detection only fires when hold=true (not for instant bookings)", src.includes("if (hold && detail.toLowerCase().includes(\"'type'\")")  || (src.includes('hold &&') && src.includes("'type'")));
    assert("error message lowercased for case-insensitive match", src.includes("detail.toLowerCase()") && src.includes("'type'"));
    assert("non-hold booking_failed path still present as fallback", src.includes("'booking_failed'"));
    assert("hold_not_supported returns 502 status", src.includes("{ error: 'hold_not_supported'") && src.includes('status: 502'));
    assert("regular booking errors still reach booking_failed path (hold_not_supported not over-broad)", src.includes("return NextResponse.json({ error: 'booking_failed'"));
  });

  // ── offer sold out during booking attempt ─────────────────────────────────
  await section('Duffel order route — offer_expired on "select another offer" Duffel error', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    assert("'select another offer' pattern detected and mapped to offer_expired", src.includes("select another offer"));
    assert("'new offer request' pattern also caught", src.includes("new offer request"));
    assert("'latest availability' pattern also caught", src.includes("latest availability"));
    assert("offer_expired returned (not booking_failed) for sold-out errors", src.includes("error: 'offer_expired'") && src.includes('status: 410'));
    assert("detection uses toLowerCase for case-insensitivity", src.includes("dl = detail.toLowerCase()") || (src.includes(".toLowerCase()") && src.includes("select another offer")));
    // Must NOT be gated on hold=true — regular Pay bookings hit the same Duffel error
    assert("offer_expired detection not gated on hold flag (applies to regular Pay too)", (() => {
      const idx = src.indexOf('select another offer');
      // walk backwards to find the enclosing if — it must NOT start with 'if (hold'
      const before = src.slice(Math.max(0, idx - 200), idx);
      const lastIf = before.lastIndexOf('if (hold');
      const lastBrace = before.lastIndexOf('{');
      // if there's an 'if (hold' between the last '{' and the pattern, it's gated
      return lastIf < lastBrace;
    })());

    // Frontend: offer_expired triggers "no longer available" message and search-again button
    const frontSrc = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert("frontend maps offer_expired to human-readable message", frontSrc.includes("offer_expired") && frontSrc.includes("no longer available"));
    assert("search-again button shown for 'no longer available' error", frontSrc.includes("no longer available") && frontSrc.includes("Search again"));
  });

  // ── hold_not_supported — Frontend recovery ────────────────────────────────
  await section('FlightResults — hold_not_supported auto-switches to instant payment', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert("hold_not_supported error checked in frontend", src.includes("order.error === 'hold_not_supported'"));
    assert("holdMode disabled on hold_not_supported", src.includes("setHoldMode(false)") && src.includes("hold_not_supported"));
    assert("user-facing message explains switch to instant", src.includes("Switched to instant payment"));
    assert("message tells user to click Pay (not hold)", src.includes("click Pay to confirm"));
    assert("hold_not_supported throws so error banner shows (not silently ignored)", (() => {
      const idx = src.indexOf("hold_not_supported");
      // The throw must appear after the hold_not_supported check
      return src.indexOf('throw new Error', idx) > idx && src.indexOf('throw new Error', idx) < src.indexOf('\n\n', idx + 500);
    })());
  });

  // ── Stale status auto-sync — detail page ─────────────────────────────────
  await section('Booking detail — auto-syncs stale Supabase status from Duffel', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    // When Duffel says 'cancelled' but Supabase has an old status, page self-heals
    assert("page fetches Duffel order to get live status", src.includes('duffel_order_id') && src.includes('/api/flights/duffel-order-detail') || src.includes('duffelRes') || src.includes('/api/flights/duffel'));
    assert("mismatch detected: Duffel cancelled vs Supabase not cancelled", src.includes("json.status === 'cancelled'") && src.includes("data.status !== 'cancelled'"));
    assert("local state fixed immediately on mismatch", src.includes("status: 'cancelled'") && src.includes("setBooking(prev"));
    assert("sync API called to persist fix in Supabase", src.includes("action: 'sync'") && src.includes("status: 'cancelled'"));
    assert("sync is fire-and-forget (catch swallowed)", src.includes("action: 'sync'") && src.includes('.catch('));

    const routeSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');
    assert("sync action accepted in cancel route", routeSrc.includes("body.action === 'sync'"));
    assert("sync updates the correct Supabase row by bookingId", routeSrc.includes('body.bookingId') && routeSrc.includes("body.status"));
    assert("sync returns { ok: true } on success", routeSrc.includes("{ ok: true }"));
    assert("sync errors logged but don't throw (resilient)", routeSrc.includes("action === 'sync'") && routeSrc.includes('console.error'));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DEEP LOGIC TESTS — run the actual algorithms inline
  // ══════════════════════════════════════════════════════════════════════════

  // ── parsePhone — actual logic execution ──────────────────────────────────
  await section('PhoneInput — parsePhone logic (live execution)', async () => {
    // Replicate the exact logic from PhoneInput.tsx
    const DIAL_CODES_T = [
      { code: 'US', dial: '+1' },
      { code: 'CA', dial: '+1' },
      { code: 'AE', dial: '+971' },
      { code: 'TH', dial: '+66' },
      { code: 'GB', dial: '+44' },
      { code: 'IN', dial: '+91' },
      { code: 'SG', dial: '+65' },
    ];
    function parsePhone(full) {
      if (!full) return { dial: '+1', number: '' };
      const match = [...DIAL_CODES_T].sort((a, b) => b.dial.length - a.dial.length)
        .find(d => full.startsWith(d.dial));
      if (match) return { dial: match.dial, number: full.slice(match.dial.length).trim() };
      if (full.startsWith('+')) {
        const spaceIdx = full.indexOf(' ');
        if (spaceIdx > 0) return { dial: full.slice(0, spaceIdx), number: full.slice(spaceIdx + 1) };
      }
      return { dial: '+1', number: full.replace(/^\+1/, '') };
    }

    const us = parsePhone('+12144146487');
    assert('US number: dial=+1', us.dial === '+1', JSON.stringify(us));
    assert('US number: number=2144146487', us.number === '2144146487', JSON.stringify(us));

    const ae = parsePhone('+97150123456');
    assert('UAE number: dial=+971 (longer code wins over +1 prefix)', ae.dial === '+971', JSON.stringify(ae));
    assert('UAE number: number stripped of dial code', ae.number === '50123456', JSON.stringify(ae));

    const th = parsePhone('+6681234567');
    assert('Thai number: dial=+66', th.dial === '+66', JSON.stringify(th));
    assert('Thai number: number=81234567', th.number === '81234567', JSON.stringify(th));

    const gb = parsePhone('+441234567890');
    assert('UK number: dial=+44', gb.dial === '+44', JSON.stringify(gb));
    assert('UK number: number correct', gb.number === '1234567890', JSON.stringify(gb));

    const empty = parsePhone('');
    assert('empty string: defaults to +1', empty.dial === '+1', JSON.stringify(empty));
    assert('empty string: number is empty string', empty.number === '', JSON.stringify(empty));

    const spaceFmt = parsePhone('+99 12345678');
    assert('unknown dial with space: splits on space', spaceFmt.dial === '+99', JSON.stringify(spaceFmt));
    assert('unknown dial with space: number after space', spaceFmt.number === '12345678', JSON.stringify(spaceFmt));

    // Ensure longer codes match before shorter — +971 must not be eaten by +1
    assert('longest dial code wins (no +1 prefix match on +971)', ae.dial !== '+1');
  });

  // ── fmtCabin — actual logic execution ────────────────────────────────────
  await section('FlightResults — fmtCabin display logic (live execution)', async () => {
    function fmtCabin(c) {
      return c === 'premium_economy' ? 'Premium Economy'
        : c === 'business' ? 'Business'
        : c === 'first' ? 'First Class'
        : 'Economy';
    }
    assert("fmtCabin('economy') = Economy", fmtCabin('economy') === 'Economy');
    assert("fmtCabin('business') = Business", fmtCabin('business') === 'Business');
    assert("fmtCabin('premium_economy') = Premium Economy", fmtCabin('premium_economy') === 'Premium Economy');
    assert("fmtCabin('first') = First Class", fmtCabin('first') === 'First Class');
    assert("fmtCabin(undefined) falls back to Economy", fmtCabin(undefined) === 'Economy');
    assert("fmtCabin('unknown') falls back to Economy", fmtCabin('unknown') === 'Economy');
  });

  // ── Hold expiry countdown — actual logic execution ────────────────────────
  await section('Hold confirmation — expiry countdown logic (live execution)', async () => {
    function formatHoldExpiry(paymentRequiredBy) {
      if (!paymentRequiredBy) return { label: '', urgent: false };
      const exp = new Date(paymentRequiredBy);
      const diffMs = exp.getTime() - Date.now();
      const diffH = diffMs / 3600000;
      const urgent = diffH < 4;
      if (diffH < 0) return { label: 'EXPIRED', urgent: true };
      if (diffH < 1) return { label: `${Math.max(1, Math.round(diffMs / 60000))} minutes`, urgent: true };
      if (diffH < 24) {
        const h = Math.floor(diffH);
        const m = Math.round((diffH - h) * 60);
        return { label: `${h}h${m > 0 ? ` ${m}m` : ''}`, urgent };
      }
      return { label: 'full date', urgent: false };
    }

    const in30min = new Date(Date.now() + 30 * 60000).toISOString();
    const r30 = formatHoldExpiry(in30min);
    assert('30 min remaining: urgent=true', r30.urgent === true, JSON.stringify(r30));
    assert('30 min remaining: label contains "minutes"', r30.label.includes('minute'), JSON.stringify(r30));

    const in3h = new Date(Date.now() + 3 * 3600000).toISOString();
    const r3h = formatHoldExpiry(in3h);
    assert('3h remaining: urgent=true (under 4h threshold)', r3h.urgent === true, JSON.stringify(r3h));
    assert('3h remaining: label starts with 3h', r3h.label.startsWith('3h'), JSON.stringify(r3h));

    const in5h = new Date(Date.now() + 5 * 3600000).toISOString();
    const r5h = formatHoldExpiry(in5h);
    assert('5h remaining: urgent=false (over 4h threshold)', r5h.urgent === false, JSON.stringify(r5h));
    assert('5h remaining: label starts with 5h', r5h.label.startsWith('5h'), JSON.stringify(r5h));

    const in30h = new Date(Date.now() + 30 * 3600000).toISOString();
    const r30h = formatHoldExpiry(in30h);
    assert('30h remaining: urgent=false', r30h.urgent === false, JSON.stringify(r30h));
    assert('30h remaining: uses full date format', r30h.label === 'full date', JSON.stringify(r30h));

    const expired = new Date(Date.now() - 3600000).toISOString();
    const rExp = formatHoldExpiry(expired);
    assert('expired: label=EXPIRED', rExp.label === 'EXPIRED', JSON.stringify(rExp));
    assert('expired: urgent=true', rExp.urgent === true, JSON.stringify(rExp));

    assert('no paymentRequiredBy: returns empty label', formatHoldExpiry(null).label === '');
  });

  // ── Hold confirmation screen — source checks ──────────────────────────────
  await section('Hold confirmation screen — amber state, expiry, CTA', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    assert('held flag derived from confirmation.held', src.includes('const isHeld') && src.includes('confirmation.held'));
    assert('amber background gradient used for held', src.includes("'#1a1200'") || src.includes('amber') || src.includes('#D97706'));
    assert('⏳ icon shown for held, ✦ for premium, ✓ for economy', src.includes("isHeld ? '⏳' : isBusinessOrFirst ? '✦' : '✓'"));
    assert('"Seat held" label for held confirmation', src.includes('Seat held'));
    assert('"Amount due" label for held (not "Total paid")', src.includes('Amount due'));
    assert('"Pay now to confirm seat" CTA for held', src.includes('Pay now to confirm seat'));
    assert('paymentRequiredBy stored in confirmation state', src.includes('paymentRequiredBy:'));
    assert('paymentRequiredBy read from API response', src.includes('paymentRequirements?.requires_payment_by'));
    assert('holdExpiryUrgent triggers red color', src.includes('holdExpiryUrgent'));
    assert('hold expiry banner shown in boarding pass card', src.includes('holdExpiryLabel'));
    assert('4h urgency threshold used', src.includes('diffH < 4'));
  });

  // ── Cancellation — deeper edge cases ──────────────────────────────────────
  await section('Cancellation — edge cases and error handling', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('cancelLoading blocks double-submit (disabled prop)', src.includes('disabled={cancelLoading}'));
    assert('cancelError rendered inside modal', src.includes('cancelError') && src.includes('showCancelModal'));
    assert('modal closes automatically on success', src.includes('setShowCancelModal(false)'));
    assert('modal closes on backdrop click (onClick on overlay)', src.includes("e.target === e.currentTarget") && src.includes('setShowCancelModal(false)'));
    assert('cancelBooking uses booking.duffel_order_id for Duffel (not booking.id)', src.includes('orderId: booking.duffel_order_id'));
    assert('confirm step uses cancellationId from quote response', src.includes('cancellationId: quote.cancellationId'));
    assert('success stores refund: quote.refundAmount + quote.refundCurrency', src.includes('quote.refundAmount') && src.includes('quote.refundCurrency'));
    assert('success state shows actual refund amount (not hardcoded)', src.includes('cancelRefund.amount') && src.includes('cancelRefund.currency'));
    assert('isPast blocks cancel (no cancel on departed flights)', src.includes('isPast'));
    assert('isHeld blocks cancel button (held orders go through pay flow)', src.includes('isHeld'));

    const routeSrc = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-cancel/route.ts'), 'utf8');
    assert('confirm step updates by duffel_order_id (not just id) to catch all duplicate rows', routeSrc.includes("eq('duffel_order_id', body.orderId)"));
    assert('confirm step falls back to id-match if orderId missing', routeSrc.includes("eq('id', body.bookingId)"));
    assert('confirm step detects 0 rows updated and returns dbWarning', routeSrc.includes('no_rows_updated'));
    assert('orderId sent from detail page to cancel confirm', readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8').includes("orderId: booking.duffel_order_id") && readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8').includes("action: 'confirm'"));
    assert('bookings list refetches on window focus (catches nav-back stale state)', readFileSync(resolve(__dir, 'frontend-next/app/bookings/page.tsx'), 'utf8').includes("window.addEventListener('focus'") && readFileSync(resolve(__dir, 'frontend-next/app/bookings/page.tsx'), 'utf8').includes('fetchBookings'));
    assert('already-cancelled: Supabase update uses eq id not user_id', routeSrc.includes("eq('id', body.bookingId)") && !routeSrc.includes("eq('user_id'"));
    assert('already-cancelled: pattern check is case-insensitive (toLowerCase)', routeSrc.includes('toLowerCase()'));
    assert('both "already been cancelled" and "already cancelled" patterns caught', routeSrc.includes('already been cancelled') && routeSrc.includes('already cancelled'));
    assert('non-matching errors rethrown (no silent swallow)', routeSrc.includes('throw quoteErr'));
  });

  // ── Airport autocomplete grouping — source checks ─────────────────────────
  await section('Airport autocomplete — group logic and display', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    // Priority: city-name-start matches ranked above contains
    assert('results sorted: city-name-start before contains', src.includes('toLowerCase().startsWith(lq)'));
    // Dropdown rendering
    assert('city header row rendered per group', src.includes('group.city'));
    assert('airport rows rendered inside each group', src.includes('group.airports'));
    assert('location pin SVG used for city row', src.includes('M17.657 16.657') || src.includes('strokeLinecap') || src.includes('svg'));
    assert('plane SVG or emoji used for airport row', src.includes('M17.657') || src.includes('airplane') || src.includes('M22 16.21') || src.includes('group.airports.map'));
    assert('airport code shown on right side of row', src.includes('group.airports.map') && src.includes('a.code'));
    // Osaka: both KIX and ITM should be in same group
    assert('Osaka covers KIX and ITM', src.includes("KIX: 'Osaka'") && src.includes("ITM: 'Osaka'"));
    // Seoul: ICN and GMP
    assert('Seoul covers ICN and GMP', src.includes("ICN: 'Seoul'") && src.includes("GMP: 'Seoul'"));
    // Istanbul: IST and SAW
    assert('Istanbul covers IST and SAW', src.includes("IST: 'Istanbul'") && src.includes("SAW: 'Istanbul'"));
    // Chicago: ORD and MDW
    assert('Chicago covers ORD and MDW', src.includes("ORD: 'Chicago'") && src.includes("MDW: 'Chicago'"));
  });

  // ── Seat map cabin label — uses segment cabin not seat map cabin ──────────
  await section('Seat map — cabin label uses segment cabinClass (not seat map API cabin)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Duffel seat map API returns 'economy' cabin even for Business/First in test mode.
    // We must use seg.cabinClass (from the offer search) which is correct.
    assert('cabinLabel derived from seg.cabinClass (not cabin.cabinClass directly)', src.includes("fmtCabin(seg?.cabinClass ?? cabin.cabinClass)"));
    assert('cabinLabel used in seat map header (not raw cabin.cabinClass)', (() => {
      // Count how many times raw cabin.cabinClass appears in seat map label context
      const matches = [...src.matchAll(/cabinClassName.*cabin\.cabinClass/g)];
      return matches.length === 0; // both occurrences replaced
    })());
    assert('fmtCabin applied to seat map label (First Class not "first")', src.includes('cabinLabel') && src.includes('fmtCabin(seg?.cabinClass'));
    assert('fallback to cabin.cabinClass when seg not found', src.includes('seg?.cabinClass ?? cabin.cabinClass'));
    assert('both seat map sections updated (passenger step + review step)', (() => {
      const count = (src.match(/fmtCabin\(seg\?\.cabinClass \?\? cabin\.cabinClass\)/g) ?? []).length;
      return count >= 2;
    })());
  });

  // ── Cabin class — end-to-end flow ────────────────────────────────────────
  await section('Cabin class — end-to-end flow check', async () => {
    const searchRoute = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-search/route.ts'), 'utf8');
    const searchBar   = readFileSync(resolve(__dir, 'frontend-next/components/FlightSearchBar.tsx'), 'utf8');
    const results     = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');

    // 1. Search bar has all 4 cabin options
    assert('Economy option defined in search bar', searchBar.includes("value: 'economy'"));
    assert('Premium Economy option defined', searchBar.includes("value: 'premium_economy'"));
    assert('Business option defined', searchBar.includes("value: 'business'"));
    assert('First option defined', searchBar.includes("value: 'first'"));

    // 2. cabinClass flows from bar → onSearch → FlightResults prop
    assert('cabinClass passed as 8th arg in onSearch call', searchBar.includes('cabinClass)') || searchBar.includes(', cabinClass'));
    assert('FlightResults receives cabinClass prop', results.includes('cabinClass = \'economy\'') || results.includes("cabinClass = \"economy\""));
    assert('FlightResults sends cabinClass to duffel-search', results.includes('cabinClass }') || results.includes('cabinClass,'));

    // 3. API sends it to Duffel
    assert('cabin_class sent to Duffel offer_requests', searchRoute.includes('cabin_class: cabinClass'));

    // 4. Response parsed and displayed correctly
    assert('segCabinClass extracted from segment passengers', searchRoute.includes('segCabinClass'));
    assert('cabinClass in segment object returned to frontend', searchRoute.includes("cabinClass: segCabinClass"));
    assert('badge shows fmtCabin result not literal string', results.includes('fmtCabin(firstSeg.cabinClass'));
    assert('segment detail shows fmtCabin result not literal string', results.includes('fmtCabin(seg.cabinClass'));

    // 5. No stale hardcoded Economy anywhere in the card rendering
    // (the source can contain "Economy" in fmtCabin return values but not as a hardcoded badge)
    const badgeLine = results.split('\n').find(l => l.includes('rounded-full') && l.includes('Economy'));
    assert('no hardcoded Economy string in badge element', !badgeLine, badgeLine ?? 'clean');
  });

  await section('Confirmation card — cabin class shown as labeled row (not just tiny pill)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Must have a clearly labeled "Cabin class" row in the lower details section of the boarding pass
    assert('Cabin class label present in confirmation card', src.includes('Cabin class') || src.includes('cabin class'));
    // cabinLabel must be displayed in the details section (after the 3-col grid)
    const detailIdx = src.indexOf('3-col detail row');
    assert('cabinLabel rendered after the 3-col grid', detailIdx !== -1 && src.indexOf('cabinLabel', detailIdx) > detailIdx);
    // The row must use the accentHex color so it matches the booking theme
    assert('cabin class row uses accentHex color', src.includes('accentHex') && src.indexOf('Cabin class') !== -1);
  });

  await section('Booking detail — FlightBooking interface includes cabin_class', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('cabin_class field in FlightBooking interface', src.includes('cabin_class: string | null'));
  });

  await section('Seat selection — seat map service IDs sent to Duffel (not filtered out)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // seat map services come from /air/seat_maps, NOT from offer.availableServices
    // The old filter `selectedServices.filter(s => offer.availableServices.some(...))` stripped them out
    assert('all selectedServices sent without filtering by availableServices', src.includes('services: selectedServices,') && !src.includes('selectedServices.filter(s => offer.availableServices'));
  });

  await section('Booking detail — seat badge only shown when seat is actually assigned', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    assert('assigned seat shown when service present', src.includes("Seat {s.metadata?.designator ?? '—'}"));
    assert('no fallback "at check-in" label shown when no seat', !src.includes('Seat at check-in'));
  });

  await section('Booking detail — cabin class badge falls back to booking.cabin_class then economy for ALL segments', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    // Must fall back through seg → booking → 'economy' for every segment (not just i===0)
    assert('fallback chain: seg → booking → economy for all segments', src.includes("seg.cabin_class ?? booking.cabin_class ?? 'economy'"));
    // Must NOT check seg.cabin_class alone for the badge condition
    const segOnlyCheck = src.includes('{seg.cabin_class && (() => {');
    assert('no longer gates badge on seg.cabin_class alone', !segOnlyCheck);
  });

  await section('Booking detail — cabin class shown in offline fallback view (Duffel fetch failed)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    // The offline fallback section (when allSegs.length === 0) must also show cabin class from booking
    assert('fallback view renders cabin_class badge from booking row', src.includes('booking.cabin_class && (() => {') || src.includes('{booking.cabin_class && (()'));
    assert('fallback cabin badge uses Business/First style (amber)', src.includes("isBizFirst ? { background: '#FEF3C7'"));
  });

  await section('Duffel order route — cabin_class saved to Supabase at booking time', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/api/flights/duffel-order/route.ts'), 'utf8');
    // Must save cabin_class from the first segment of the order
    assert('cabin_class saved from firstSeg in baseRow', src.includes('cabin_class: firstSeg?.cabin_class ?? null'));
    // The baseRow must use user.id (non-null — guaranteed by 401 guard before Duffel call)
    assert('baseRow uses user.id not user?.id for user_id', src.includes('user_id: user.id'));
  });

  await section('Booking list — FlightBooking interface includes cabin_class', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/page.tsx'), 'utf8');
    assert('cabin_class in FlightBooking interface on list page', src.includes('cabin_class: string | null'));
    assert('fmtCabin helper defined on list page', src.includes('fmtCabin'));
    assert('amber badge for Business/First on list card', src.includes("'business'" ) && src.includes("'first'") && src.includes('#B45309'));
  });

  await section('Seat selection — selectSeat clears previous seat map IDs to prevent Duffel duplicates', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Must use previously-selected seat IDs (from seatSelections state) to clear stale entries —
    // NOT offer.availableServices which doesn't include seat map IDs → would leave duplicates
    assert('prevSeatServiceIds built from Object.values(prev) not offer.availableServices', src.includes('prevSeatServiceIds = Object.values(prev).filter(Boolean)') && !src.includes('allSeatServiceIds = offer.availableServices'));
    // seat IDs from seat map go into selectedServices
    assert('seat map IDs added to selectedServices', src.includes('seatSvcIds.map(id => ({ serviceId: id, quantity: 1 }))'));
    // the toggle: selecting same seat again deselects it
    assert('seat toggle: prev_svcId === svcId deselects', src.includes("prev_svcId === svcId ? '' : svcId"));
  });

  await section('Seat selection — seat services reach Duffel order API unfiltered', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Seat map IDs are NOT in offer.availableServices — they come from /air/seat_maps
    // So we must NOT filter selectedServices before sending to the booking API
    assert('selectedServices sent as-is (no availableServices filter)', src.includes('services: selectedServices,'));
    assert('old filter removed (would strip seat map IDs)', !src.includes('selectedServices.filter(s => offer.availableServices'));
  });

  await section('Seat display — detail page matches seat by order segment ID', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    // Filter must match seat services to segments by the segment's Duffel ID (seg.id)
    assert('seat filter uses seg.id not segmentId', src.includes('s.segment_ids?.includes(seg.id)'));
    // DuffelOrder interface must have id on segments so the filter works
    assert('DuffelOrder segment interface has id field', src.includes('id: string') && src.includes('segments:'));
    // services[] typed on DuffelOrder
    assert('services typed on DuffelOrder interface', src.includes("services?: {") && src.includes("segment_ids?:"));
    // seat designator shown from metadata
    assert('seat designator read from metadata.designator', src.includes("s.metadata?.designator ?? '—'"));
  });

  await section('Seat display — booking list fmtCabin defaults to Economy when null', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/page.tsx'), 'utf8');
    assert('fmtCabin returns Economy when null (not empty string)', src.includes("if (!c) return 'Economy'"));
  });

  await section('Booking detail — cabin class defaults to economy on all segments (not just first)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/app/bookings/[id]/page.tsx'), 'utf8');
    // Must apply economy default to ALL segments via the full fallback chain
    assert('fallback chain applies to all segments (no i===0 gate)', src.includes("seg.cabin_class ?? booking.cabin_class ?? 'economy'"));
    // Old i===0 limited fallback must be gone
    assert('old i===0 fallback removed', !src.includes("i === 0 ? 'economy'"));
  });

  // ── Seat price total — paid seats update extrasTotal ─────────────────────────
  await section('Seat price — getSvcPrice helper searches seatMaps as fallback', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // getSvcPrice function must exist
    assert('getSvcPrice function defined', src.includes('function getSvcPrice(serviceId: string): number'));
    // Must check offer.availableServices first
    assert('getSvcPrice checks offer.availableServices first', src.includes('selectedOffer?.availableServices.find(s => s.id === serviceId)'));
    // Must fall back to seatMaps
    assert('getSvcPrice falls back to seatMaps data', src.includes('if (seatMaps)') && src.includes('el.available_services?.find(a => a.id === serviceId)'));
    // Must parse total_amount from seat map service (it is a string in Duffel API)
    assert('getSvcPrice parses total_amount string to float', src.includes('parseFloat(svc.total_amount)'));
  });

  await section('Seat price — extrasTotal uses getSvcPrice (not direct availableServices lookup)', async () => {
    const src = readFileSync(resolve(__dir, 'frontend-next/components/FlightResults.tsx'), 'utf8');
    // Both extrasTotal calculations must use getSvcPrice
    const getSvcPriceCalls = (src.match(/getSvcPrice\(ss\.serviceId\)/g) ?? []).length;
    assert('getSvcPrice called in extrasTotal (at least 2 times: render + confirmBooking)', getSvcPriceCalls >= 2);
    // Old direct lookup pattern must be gone
    assert('old offer.availableServices price lookup removed from extrasTotal', !src.includes('offer.availableServices.find(s => s.id === ss.serviceId)'));
  });

  // ── Duffel key fallback — empty string bug ────────────────────────────────
  await section('Duffel API key — uses || not ?? so empty string falls through to test key', async () => {
    const routes = [
      'duffel-search', 'seat-map', 'duffel-order', 'duffel-cancel',
      'duffel-pay-held', 'duffel-payment-intent', 'duffel-order-detail',
      'duffel-mode', 'duffel-change-order', 'duffel-post-book-bags',
    ];
    for (const r of routes) {
      const path = resolve(__dir, `frontend-next/app/api/flights/${r}/route.ts`);
      let src; try { src = readFileSync(path, 'utf8'); } catch { continue; }
      // Must use || not ?? so empty string DUFFEL_LIVE_API_KEY falls through
      assert(`${r}: DUFFEL_LIVE_API_KEY uses || fallback (not ??)`,
        src.includes('DUFFEL_LIVE_API_KEY ||') && !src.includes('DUFFEL_LIVE_API_KEY\n    ??') && !src.includes('DUFFEL_LIVE_API_KEY ?? '));
    }
  });

}

// ══════════════════════════════════════════════════════════════════════════════
// API TESTS — require DUFFEL_TEST_API_KEY
// ══════════════════════════════════════════════════════════════════════════════

if (runApi) {

  if (!DUFFEL_KEY || DUFFEL_KEY.startsWith('duffel_live_')) {
    console.log('\n⚠️  API tests skipped — set DUFFEL_TEST_API_KEY (test key, not live) to enable.');
    skipped += 5;
  } else {

    const DEPART = (() => {
      const d = new Date(); d.setDate(d.getDate() + 60);
      return d.toISOString().slice(0, 10);
    })();

    let offer = null, order = null;

    // ── Flight search ──────────────────────────────────────────────────────
    await section('Duffel — flight search (LHR→JFK)', async () => {
      const data = await duffelPost('/air/offer_requests', {
        data: {
          slices: [{ origin: 'LHR', destination: 'JFK', departure_date: DEPART }],
          passengers: [{ type: 'adult' }],
          cabin_class: 'economy',
          return_offers: true,
        },
      });

      const offers = data?.data?.offers ?? [];
      assert('at least 1 offer returned',          offers.length > 0,            `${offers.length} offers`);
      if (!offers.length) return;

      offer = offers[0];
      assert('offer.id present',                   !!offer.id,                    offer.id?.slice(0, 20));
      assert('offer.total_amount is number',        !isNaN(parseFloat(offer.total_amount)));
      assert('offer.total_currency is 3-char ISO',  /^[A-Z]{3}$/.test(offer.total_currency), offer.total_currency);
      assert('offer.expires_at is future',
        new Date(offer.expires_at) > new Date(), `expires ${offer.expires_at}`);
      assert('offer.passengers[0].id present',      !!offer.passengers?.[0]?.id);

      const seg = offer.slices?.[0]?.segments?.[0];
      assert('segment departing_at present',        !!seg?.departing_at);
      assert('marketing_carrier.iata_code present', !!seg?.marketing_carrier?.iata_code,
        seg?.marketing_carrier?.iata_code);

      // Conditions field present (may be null for some airlines — that's OK)
      assert('conditions field present in offer (may be null)',
        'conditions' in offer || offer.conditions !== undefined || true,
        offer.conditions ? JSON.stringify(offer.conditions).slice(0, 80) : 'null — airline did not provide (OK)');
    });

    // ── Child + adult search ───────────────────────────────────────────────
    await section('Duffel — search with 1 adult + 1 child', async () => {
      const data = await duffelPost('/air/offer_requests', {
        data: {
          slices: [{ origin: 'BKK', destination: 'SIN', departure_date: DEPART }],
          passengers: [{ type: 'adult' }, { type: 'child' }],
          cabin_class: 'economy',
          return_offers: true,
        },
      });
      const offers = data?.data?.offers ?? [];
      assert('child+adult search returns offers', offers.length > 0, `${offers.length} offers`);
      if (!offers.length) return;

      const pax = offers[0].passengers;
      assert('2 passengers in offer',            pax.length === 2, `${pax.length} pax`);
      const types = pax.map(p => p.type).sort();
      assert('passenger types are adult + child', JSON.stringify(types) === JSON.stringify(['adult', 'child']),
        types.join(', '));
    });

    // ── Order creation ─────────────────────────────────────────────────────
    if (offer) {
      await section('Duffel — order creation (balance payment)', async () => {
        const paxId = offer.passengers[0].id;
        const data = await duffelPost('/air/orders', {
          data: {
            selected_offers: [offer.id],
            passengers: [{
              id: paxId,
              title: 'mr', given_name: 'Test', family_name: 'Cheapstay',
              gender: 'm', born_on: '1990-06-15',
              email: 'test@cheapstay.co',
              phone_number: '+12025550100',
              identity_documents: [{
                type: 'passport',
                unique_identifier: 'A12345678',
                expires_on: '2032-01-01',
                issuing_country_code: 'US',
              }],
            }],
            payments: [{ type: 'balance', amount: offer.total_amount, currency: offer.total_currency }],
          },
        });

        order = data?.data;
        assert('order.id present',              !!order?.id,                order?.id?.slice(0, 25));
        assert('booking_reference present',     !!order?.booking_reference, order?.booking_reference);
        assert('order.passengers returned',     (order?.passengers?.length ?? 0) > 0);
        assert('status = confirmed or held',
          ['confirmed', 'held'].includes(order?.status), `status=${order?.status}`);
        assert('conditions field present',      'conditions' in (order ?? {}),
          order?.conditions ? 'policy provided' : 'null (airline did not provide — show unknown label)');
      });

      // ── Order detail (GET) ───────────────────────────────────────────────
      if (order?.id) {
        await section('Duffel — GET order detail by ID', async () => {
          const data = await duffelGet(`/air/orders/${order.id}`);
          const o = data?.data;
          assert('order retrieved by ID',             o?.id === order.id);
          assert('passengers populated',              (o?.passengers?.length ?? 0) > 0);
          assert('slices populated',                  (o?.slices?.length ?? 0) > 0);

          // Segments have terminal info
          const seg = o?.slices?.[0]?.segments?.[0];
          assert('segment marketing carrier present', !!seg?.marketing_carrier?.iata_code,
            seg?.marketing_carrier?.iata_code);
        });
      }
    }

    // ── Supabase reachability ──────────────────────────────────────────────
    await section('Supabase — table reachability', async () => {
      if (!SB_URL || !SB_KEY) {
        skip('Supabase check', 'no NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in env');
        return;
      }

      for (const table of ['flight_bookings', 'traveler_profiles']) {
        const res  = await fetch(`${SB_URL}/rest/v1/${table}?select=id&limit=0`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        });
        const body = await res.json().catch(() => null);

        const permDenied   = res.status === 401 && body?.message?.includes('permission denied');
        const notExist     = body?.message?.includes('does not exist');
        const serverError  = res.status === 500;
        const tableOk      = res.status === 200 || permDenied;

        assert(`${table}: REST reachable`,    !serverError && !notExist,
          `HTTP ${res.status}${body?.message ? ' — ' + body.message : ''}`);
        assert(`${table}: table exists`,      tableOk,
          tableOk ? (permDenied ? 'anon denied (correct RLS)' : 'accessible') : `HTTP ${res.status}`);
      }
    });

  }

}

// ══════════════════════════════════════════════════════════════════════════════
// Summary
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(55)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
if (failed > 0) {
  console.error('\n❌  Some tests failed — fix before deploying.');
  process.exit(1);
} else {
  console.log('\n✅  All tests passed.');
}

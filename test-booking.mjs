/**
 * Integration tests for the Duffel flight booking flow.
 * Calls the real Duffel test API — catches field-name and contract bugs before deploy.
 *
 * Usage:
 *   node test-booking.mjs
 *
 * Reads DUFFEL_TEST_API_KEY from frontend-next/.env.local or the environment.
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
} catch { /* env vars set externally */ }

const KEY = process.env.DUFFEL_TEST_API_KEY ?? process.env.DUFFEL_API_KEY ?? '';
if (!KEY || KEY.startsWith('duffel_live_')) {
  console.error('❌  Set DUFFEL_TEST_API_KEY to a duffel_test_... key before running.');
  process.exit(1);
}

const DUFFEL = 'https://api.duffel.com';
const H = {
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'Duffel-Version': 'v2',
};

// ── Tiny test harness ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${name}${detail ? '  →  ' + detail : ''}`);
    passed++;
  } else {
    console.error(`  ❌  ${name}${detail ? '  →  ' + detail : ''}`);
    failed++;
  }
}

async function section(title, fn) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);
  try { await fn(); }
  catch (err) {
    console.error(`  💥  Unhandled: ${err.message}`);
    failed++;
  }
}

// ── Helpers matching the route logic ──────────────────────────────────────────
const SERVICE_FEE = 10;
const DUFFEL_FEE_RATE = 0.029;
const calcGross = (base) =>
  Math.round(((base + SERVICE_FEE) / (1 - DUFFEL_FEE_RATE)) * 100) / 100;

async function duffelPost(path, body) {
  const res = await fetch(`${DUFFEL}${path}`, {
    method: 'POST', headers: H,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data?.errors?.[0]?.message ?? `HTTP ${res.status}`), { data });
  return data;
}

// ── Test data ──────────────────────────────────────────────────────────────────
// Use a future date at least 60 days out so Duffel test inventory exists
const DEPART = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
})();

const TEST_ROUTE = { origin: 'LHR', destination: 'JFK' };

// ══════════════════════════════════════════════════════════════════════════════
// 1. calcGross formula
// ══════════════════════════════════════════════════════════════════════════════
await section('calcGross formula', async () => {
  assert('fee-only amount > 0', calcGross(0) > 0, `$${calcGross(0)}`);
  assert('$300 base → reasonable gross', calcGross(300) > 315 && calcGross(300) < 340, `$${calcGross(300)}`);
  // Verify the formula: gross * (1 - 0.029) = base + 10
  const base = 200;
  const gross = calcGross(base);
  const recovered = Math.round(gross * (1 - DUFFEL_FEE_RATE) * 100) / 100;
  assert('formula is invertible', Math.abs(recovered - (base + SERVICE_FEE)) < 0.02,
    `gross=$${gross}, recovered base+fee=$${recovered} (expected ${base + SERVICE_FEE})`);
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Offer request (search)
// ══════════════════════════════════════════════════════════════════════════════
let offer = null;

await section('Search  (POST /air/offer_requests)', async () => {
  const data = await duffelPost('/air/offer_requests', {
    data: {
      slices: [{ origin: TEST_ROUTE.origin, destination: TEST_ROUTE.destination, departure_date: DEPART }],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
      return_offers: true,
    },
  });

  const offers = data?.data?.offers ?? [];
  assert('at least one offer returned', offers.length > 0, `${offers.length} offers`);
  if (!offers.length) return;

  offer = offers[0];

  assert('offer.id present',          !!offer.id,           offer.id?.slice(0, 30));
  assert('offer.total_amount present', !!offer.total_amount, `$${offer.total_amount} ${offer.total_currency}`);
  assert('offer.total_currency present', !!offer.total_currency);
  assert('offer.expires_at present',  !!offer.expires_at, (() => {
    const mins = Math.round((new Date(offer.expires_at) - Date.now()) / 60000);
    return `expires in ${mins} min`;
  })());
  assert('offer.passengers[0].id present',
    !!offer.passengers?.[0]?.id, offer.passengers?.[0]?.id);

  const seg = offer.slices?.[0]?.segments?.[0];
  assert('segment origin/dest match', seg?.origin?.iata_code === TEST_ROUTE.origin,
    `${seg?.origin?.iata_code} → ${seg?.destination?.iata_code}`);
  assert('segment departing_at present', !!seg?.departing_at, seg?.departing_at);
  assert('marketing_carrier.iata_code present', !!seg?.marketing_carrier?.iata_code,
    seg?.marketing_carrier?.iata_code);
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Order creation (balance payment — no card needed in test mode)
// ══════════════════════════════════════════════════════════════════════════════
let order = null;

if (offer) {
  await section('Order  (POST /air/orders  — balance payment)', async () => {
    const passengerId = offer.passengers[0].id;

    const data = await duffelPost('/air/orders', {
      data: {
        selected_offers: [offer.id],
        passengers: [{
          id: passengerId,
          title: 'mr',
          given_name: 'Test',
          family_name: 'Traveller',
          gender: 'm',
          born_on: '1990-06-15',
          email: 'test@cheapstay.co',
          phone_number: '+12025550100',
          identity_documents: [{
            type: 'passport',
            unique_identifier: 'A12345678',   // ← field name Duffel expects
            expires_on: '2032-01-01',
            issuing_country_code: 'US',
          }],
        }],
        payments: [{
          type: 'balance',
          amount: offer.total_amount,          // ← required even for balance
          currency: offer.total_currency,
        }],
      },
    });

    order = data?.data;
    assert('order.id present',               !!order?.id,                order?.id?.slice(0, 30));
    assert('booking_reference present',       !!order?.booking_reference, order?.booking_reference);
    assert('order.total_amount present',      !!order?.total_amount,      `$${order?.total_amount}`);
    assert('order.passengers returned',       (order?.passengers?.length ?? 0) > 0);
    assert('status is not cancelled',
      order?.status !== 'cancelled', `status=${order?.status ?? '(none)'}`);
  });
} else {
  console.log('\n⚠️  Skipping order test — search returned no offers.');
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Offer expiry warning
// ══════════════════════════════════════════════════════════════════════════════
if (offer?.expires_at) {
  await section('Offer expiry', async () => {
    const mins = Math.round((new Date(offer.expires_at) - Date.now()) / 60000);
    assert('offer still valid at order time', mins > 0, `${mins} min remaining`);
    if (mins < 5) {
      console.log('  ⚠️   Offers expire in under 5 min on this route — refresh before booking.');
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Summary
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(55)}`);
if (order?.booking_reference) {
  console.log(`🎉  Booking confirmed: ${order.booking_reference}`);
}
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

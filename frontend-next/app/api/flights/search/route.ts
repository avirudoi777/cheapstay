import { NextRequest, NextResponse } from 'next/server';

const TP_BASE = 'https://api.travelpayouts.com';

async function get(url: string) {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

function normalize(f: Record<string, unknown>, from: string, to: string): Record<string, unknown> {
  // departure_at from v2 can be "YYYY-MM" (month only) — append -01 to make it parseable
  let depAt = typeof f.departure_at === 'string' ? f.departure_at : undefined;
  if (depAt && /^\d{4}-\d{2}$/.test(depAt)) depAt = depAt + '-01';
  return {
    ...f,
    origin: from,
    destination: to,
    departure_at: depAt,
    transfers: typeof f.transfers === 'number' ? f.transfers : (typeof f.number_of_changes === 'number' ? f.number_of_changes : 0),
    duration: typeof f.duration === 'number' ? f.duration : 0,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from   = (searchParams.get('from') ?? '').toUpperCase();
  const to     = (searchParams.get('to') ?? '').toUpperCase();
  const depart = searchParams.get('depart') ?? '';
  const ret    = searchParams.get('return') ?? '';
  const token  = process.env.TRAVELPAYOUTS_API_TOKEN;

  if (!from || !to || !depart) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 503 });
  }

  const month    = depart.slice(0, 7);
  const retMonth = ret ? ret.slice(0, 7) : '';

  try {
    // 1. prices_for_dates — exact date
    const q1 = new URLSearchParams({ origin: from, destination: to, departure_at: depart, currency: 'USD', sorting: 'price', direct: 'false', limit: '20', one_way: ret ? 'false' : 'true', token });
    if (ret) q1.set('return_at', ret);
    const r1 = await get(`${TP_BASE}/aviasales/v3/prices_for_dates?${q1}`);
    if (r1?.data?.length) {
      const data = (r1.data as Record<string, unknown>[]).map(f => normalize(f, from, to));
      return NextResponse.json({ success: true, data, scope: 'exact' });
    }

    // 2. prices_for_dates — whole month
    const q2 = new URLSearchParams({ origin: from, destination: to, departure_at: month, currency: 'USD', sorting: 'price', direct: 'false', limit: '20', one_way: ret ? 'false' : 'true', token });
    if (retMonth) q2.set('return_at', retMonth);
    const r2 = await get(`${TP_BASE}/aviasales/v3/prices_for_dates?${q2}`);
    if (r2?.data?.length) {
      const data = (r2.data as Record<string, unknown>[]).map(f => normalize(f, from, to));
      return NextResponse.json({ success: true, data, scope: 'month' });
    }

    // 3. v2/prices/latest — recent cached prices, no date filter
    // Response: { data: { "GIG-BOG": { price, airline, number_of_changes, departure_at "YYYY-MM", ... } } }
    const q3 = new URLSearchParams({ origin: from, destination: to, period_type: 'year', one_way: ret ? 'false' : 'true', currency: 'usd', limit: '20', sorting: 'price', token });
    const r3 = await get(`${TP_BASE}/v2/prices/latest?${q3}`);
    const latest: unknown[] = [];
    if (r3?.data && typeof r3.data === 'object') {
      for (const flight of Object.values(r3.data as Record<string, unknown>)) {
        if (flight && typeof flight === 'object') {
          latest.push(normalize(flight as Record<string, unknown>, from, to));
        }
      }
    }
    if (latest.length) return NextResponse.json({ success: true, data: latest, scope: 'latest' });

    // 4. v1/prices/cheap — cheapest tickets for the month
    // Response: { data: { "BOG": { "YYYY-MM-DD": { price, airline, number_of_changes, ... } } } }
    const q4 = new URLSearchParams({ origin: from, destination: to, depart_date: month, currency: 'usd', token });
    if (retMonth) q4.set('return_date', retMonth);
    const r4 = await get(`${TP_BASE}/v1/prices/cheap?${q4}`);
    const cheap: unknown[] = [];
    if (r4?.data && typeof r4.data === 'object') {
      for (const destObj of Object.values(r4.data as Record<string, unknown>)) {
        if (destObj && typeof destObj === 'object') {
          for (const [dateKey, flight] of Object.entries(destObj as Record<string, unknown>)) {
            if (/^\d{4}-\d{2}-\d{2}/.test(dateKey) && flight && typeof flight === 'object') {
              const f = { ...(flight as Record<string, unknown>), departure_at: dateKey };
              cheap.push(normalize(f, from, to));
            }
          }
        }
      }
    }
    if (cheap.length) return NextResponse.json({ success: true, data: cheap, scope: 'cheap' });

    return NextResponse.json({ success: true, data: [], scope: 'none' });
  } catch (err) {
    console.error('Flight search error:', err);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

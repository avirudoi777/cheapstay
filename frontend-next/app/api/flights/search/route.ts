import { NextRequest, NextResponse } from 'next/server';

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

  const qs = new URLSearchParams({
    origin: from,
    destination: to,
    departure_at: depart,
    currency: 'USD',
    sorting: 'price',
    direct: 'false',
    limit: '10',
    one_way: ret ? 'false' : 'true',
    token,
  });
  if (ret) qs.set('return_at', ret);

  try {
    const res = await fetch(
      `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${qs}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TP API ${res.status}`);
    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    console.error('Flight search error:', err);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

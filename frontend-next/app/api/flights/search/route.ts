import { NextRequest, NextResponse } from 'next/server';

async function tpFetch(params: URLSearchParams) {
  const res = await fetch(
    `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`TP API ${res.status}`);
  return res.json();
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

  const base: Record<string, string> = {
    origin: from,
    destination: to,
    currency: 'USD',
    sorting: 'price',
    direct: 'false',
    limit: '10',
    one_way: ret ? 'false' : 'true',
    token,
  };

  try {
    // 1st attempt: exact date
    const qs1 = new URLSearchParams({ ...base, departure_at: depart });
    if (ret) qs1.set('return_at', ret);
    const exact = await tpFetch(qs1);
    if (exact.data?.length) return NextResponse.json({ ...exact, scope: 'exact' });

    // 2nd attempt: whole month (much higher cache hit rate)
    const month = depart.slice(0, 7); // YYYY-MM
    const qs2 = new URLSearchParams({ ...base, departure_at: month });
    if (ret) qs2.set('return_at', ret.slice(0, 7));
    const monthly = await tpFetch(qs2);
    if (monthly.data?.length) return NextResponse.json({ ...monthly, scope: 'month' });

    // 3rd attempt: open destination (any date in next 3 months, limited to route)
    const qs3 = new URLSearchParams({ ...base, limit: '5' });
    delete Object.assign(qs3 as unknown as Record<string, string>)['departure_at'];
    qs3.delete('departure_at');
    qs3.delete('return_at');
    const open = await tpFetch(qs3);
    if (open.data?.length) return NextResponse.json({ ...open, scope: 'open' });

    return NextResponse.json({ success: true, data: [], scope: 'none' });
  } catch (err) {
    console.error('Flight search error:', err);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

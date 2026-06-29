import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const key = process.env.DUFFEL_LIVE_API_KEY || process.env.DUFFEL_TEST_API_KEY || process.env.DUFFEL_API_KEY;
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const res = await fetch(`https://api.duffel.com/air/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Duffel-Version': 'v2',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.errors?.[0]?.message ?? 'Failed to fetch order' },
      { status: res.status },
    );
  }

  return NextResponse.json(data.data);
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DUFFEL = 'https://api.duffel.com';

function getKey() {
  return process.env.DUFFEL_LIVE_API_KEY
    ?? process.env.DUFFEL_TEST_API_KEY
    ?? process.env.DUFFEL_API_KEY;
}

async function duffelReq(method: string, path: string, body?: unknown) {
  const res = await fetch(`${DUFFEL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getKey()}`,
      'Content-Type': 'application/json',
      'Duffel-Version': 'v2',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// GET /api/flights/duffel-post-book-bags?orderId=xxx
// Returns available services (bags) for an existing order
export async function GET(req: NextRequest) {
  const key = getKey();
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  try {
    const data = await duffelReq('GET', `/air/orders/${orderId}`);
    const order = data.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = (order.available_services ?? []).filter((s: any) => s.type === 'baggage');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passengers = (order.passengers ?? []).map((p: any) => ({
      id: p.id,
      name: `${p.given_name} ${p.family_name}`,
    }));

    return NextResponse.json({
      services: services.map((s: {
        id: string; total_amount: string; total_currency: string;
        passenger_ids?: string[]; segment_ids?: string[];
        metadata?: { maximum_weight_kg?: number; maximum_quantity?: number };
      }) => ({
        id: s.id,
        totalAmount: parseFloat(s.total_amount),
        totalCurrency: s.total_currency,
        passengerIds: s.passenger_ids ?? [],
        segmentIds: s.segment_ids ?? [],
        maxWeightKg: s.metadata?.maximum_weight_kg ?? null,
        maxQuantity: s.metadata?.maximum_quantity ?? 1,
      })),
      passengers,
    });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? 'Failed to fetch order services';
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

// POST /api/flights/duffel-post-book-bags
// { orderId, bookingId, services: [{ serviceId, quantity }] }
// Creates order services (adds bags) and records payment
export async function POST(req: NextRequest) {
  const key = getKey();
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as {
      orderId: string;
      bookingId: string;
      services: { serviceId: string; quantity: number }[];
      paymentIntentId?: string;
    };

    const data = await duffelReq('POST', '/air/order_services', {
      data: {
        order_id: body.orderId,
        add: body.services.map(s => ({ id: s.serviceId, quantity: s.quantity })),
        payment: {
          type: body.paymentIntentId ? 'payment_intent' : 'balance',
          ...(body.paymentIntentId ? { payment_intent_id: body.paymentIntentId } : {}),
        },
      },
    });

    return NextResponse.json({ ok: true, orderService: data.data?.id });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? 'Failed to add bags';
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

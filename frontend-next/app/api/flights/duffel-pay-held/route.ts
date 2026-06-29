import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const DUFFEL = 'https://api.duffel.com';

function getKey() {
  return process.env.DUFFEL_LIVE_API_KEY || process.env.DUFFEL_TEST_API_KEY || process.env.DUFFEL_API_KEY;
}

// POST /api/flights/duffel-pay-held
// Pays for a held order using /air/payments
// body: { orderId, bookingId, amount, currency, paymentIntentId? }
export async function POST(req: NextRequest) {
  const key = getKey();
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isTestMode = process.env.DUFFEL_TEST_MODE === 'true' || !key.startsWith('duffel_live_');

  try {
    const body = await req.json() as {
      orderId: string;
      bookingId: string;
      amount: string;
      currency: string;
      paymentIntentId?: string;
    };

    const payment = isTestMode
      ? { type: 'balance', amount: body.amount, currency: body.currency }
      : { type: 'payment_intent', id: body.paymentIntentId };

    const res = await fetch(`${DUFFEL}/air/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
      },
      body: JSON.stringify({
        data: {
          order_id: body.orderId,
          payment,
        },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (data as any)?.errors?.[0]?.message ?? 'Payment failed';
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    // Update booking status to confirmed
    const { error: dbError } = await supabase
      .from('flight_bookings')
      .update({ status: 'confirmed' })
      .eq('id', body.bookingId);

    if (dbError) console.error('Failed to update held booking to confirmed:', dbError.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? 'Payment failed';
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

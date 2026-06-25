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

// POST /api/flights/duffel-cancel
// { action: 'quote', orderId } → returns refund quote
// { action: 'confirm', cancellationId, bookingId } → confirms and updates Supabase
export async function POST(req: NextRequest) {
  const key = getKey();
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();

  try {
    if (body.action === 'quote') {
      // Step 1: create order cancellation (get refund quote)
      const data = await duffelReq('POST', '/air/order_cancellations', {
        data: { order_id: body.orderId },
      });
      const c = data.data;
      return NextResponse.json({
        cancellationId: c.id,
        refundAmount: c.refund_amount ? parseFloat(c.refund_amount) : 0,
        refundCurrency: c.refund_currency ?? 'USD',
        refundTo: c.refund_to,
        expiresAt: c.expires_at,
      });
    }

    if (body.action === 'confirm') {
      // Step 2: confirm the cancellation
      await duffelReq('POST', `/air/order_cancellations/${body.cancellationId}/actions/confirm`);

      // Update status in Supabase — match by id only (no user_id filter to avoid null mismatch)
      const { error: dbError } = await supabase
        .from('flight_bookings')
        .update({ status: 'cancelled' })
        .eq('id', body.bookingId);

      if (dbError) {
        console.error('Supabase cancel update error:', dbError.message);
        // Duffel cancellation already confirmed — return success but log the DB failure
        return NextResponse.json({ success: true, dbWarning: dbError.message });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Duffel cancel error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Cancellation failed';
    return NextResponse.json({ error: 'cancel_failed', detail }, { status: 502 });
  }
}

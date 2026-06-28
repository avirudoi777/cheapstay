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
      let quoteData;
      try {
        quoteData = await duffelReq('POST', '/air/order_cancellations', {
          data: { order_id: body.orderId },
        });
      } catch (quoteErr) {
        // Duffel returns "already been cancelled" when the order is already cancelled
        // but Supabase wasn't updated (e.g. due to a previous router.refresh() race).
        // Fix the stale record and return a clean signal so the UI shows cancelled.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg: string = (quoteErr as any)?.errors?.[0]?.message ?? '';
        if (msg.toLowerCase().includes('already been cancelled') || msg.toLowerCase().includes('already cancelled')) {
          if (body.bookingId) {
            await supabase.from('flight_bookings').update({ status: 'cancelled' }).eq('id', body.bookingId);
          }
          return NextResponse.json({ alreadyCancelled: true, refundAmount: 0, refundCurrency: 'USD' });
        }
        throw quoteErr;
      }
      const c = quoteData.data;
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

      // Update by duffel_order_id (from body.orderId) so ALL rows for this order are
      // marked cancelled — handles the case where both server + client inserted rows.
      // Fall back to id-match if orderId missing.
      const { data: updated, error: dbError } = body.orderId
        ? await supabase.from('flight_bookings').update({ status: 'cancelled' })
            .eq('duffel_order_id', body.orderId).select('id')
        : await supabase.from('flight_bookings').update({ status: 'cancelled' })
            .eq('id', body.bookingId).select('id');

      if (dbError) {
        console.error('Supabase cancel update error:', dbError.message);
        return NextResponse.json({ success: true, dbWarning: dbError.message });
      }
      if (!updated || updated.length === 0) {
        console.error('Supabase cancel update: 0 rows affected', { orderId: body.orderId, bookingId: body.bookingId });
        return NextResponse.json({ success: true, dbWarning: 'no_rows_updated' });
      }

      return NextResponse.json({ success: true });
    }

    // Sync: fix a stale Supabase status from Duffel's source-of-truth.
    // Called automatically when the detail page loads and detects a mismatch.
    if (body.action === 'sync') {
      const { error } = await supabase
        .from('flight_bookings')
        .update({ status: body.status })
        .eq('id', body.bookingId);
      if (error) console.error('sync status error:', error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Duffel cancel error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Cancellation failed';
    return NextResponse.json({ error: 'cancel_failed', detail }, { status: 502 });
  }
}

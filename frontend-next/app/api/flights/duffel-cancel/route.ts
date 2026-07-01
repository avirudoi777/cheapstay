import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { cancellationEmail } from '@/lib/email-templates';

export const maxDuration = 60;

// Admin client bypasses RLS — used only for status updates where user session
// may not match row's user_id (e.g. test bookings with null user_id).
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key);
}

const DUFFEL = 'https://api.duffel.com';

function getKey() {
  return process.env.DUFFEL_LIVE_API_KEY || process.env.DUFFEL_TEST_API_KEY || process.env.DUFFEL_API_KEY;
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
          const db = getAdminClient() ?? supabase;
          // Belt-and-suspenders: update by both duffel_order_id AND id to catch all duplicate rows
          if (body.orderId) {
            await db.from('flight_bookings').update({ status: 'cancelled' }).eq('duffel_order_id', body.orderId);
          }
          if (body.bookingId) {
            await db.from('flight_bookings').update({ status: 'cancelled' }).eq('id', body.bookingId);
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

      // Use admin client to bypass RLS — rows may have null user_id (test bookings)
      // which would cause the user-session client to silently update 0 rows.
      const adminClient = getAdminClient();
      const db = adminClient ?? supabase;
      const hasAdmin = !!adminClient;
      let rowsUpdated = 0;
      let dbError: string | null = null;

      // Try by duffel_order_id first (catches all duplicate rows for same order)
      if (body.orderId) {
        const { data: byOrder, error: e1 } = await db
          .from('flight_bookings').update({ status: 'cancelled' })
          .eq('duffel_order_id', body.orderId).select('id');
        rowsUpdated = byOrder?.length ?? 0;
        if (e1) dbError = e1.message;
      }

      // Always also update by bookingId as belt-and-suspenders (catches cases where
      // duffel_order_id is null or mismatched)
      if (body.bookingId) {
        const { data: byId, error: e2 } = await db
          .from('flight_bookings').update({ status: 'cancelled' })
          .eq('id', body.bookingId).select('id');
        if ((byId?.length ?? 0) > 0) rowsUpdated += byId!.length;
        if (e2 && !dbError) dbError = e2.message;
      }

      // Third fallback: update by booking_reference if both above found 0 rows
      if (rowsUpdated === 0 && body.bookingReference) {
        const { data: byRef, error: e3 } = await db
          .from('flight_bookings').update({ status: 'cancelled' })
          .eq('booking_reference', body.bookingReference).select('id');
        if ((byRef?.length ?? 0) > 0) rowsUpdated += byRef!.length;
        if (e3 && !dbError) dbError = e3.message;
      }

      // Send cancellation email (best-effort — never block the response on this)
      try {
        const { data: row } = await db
          .from('flight_bookings')
          .select('booking_reference, origin_code, destination_code, passenger_email')
          .eq(body.orderId ? 'duffel_order_id' : 'id', body.orderId ?? body.bookingId)
          .single();
        if (row?.passenger_email) {
          await sendEmail({
            to: row.passenger_email,
            ...cancellationEmail({
              bookingReference: row.booking_reference,
              originCode: row.origin_code,
              destinationCode: row.destination_code,
              refundAmount: typeof body.refundAmount === 'number' ? body.refundAmount : undefined,
              refundCurrency: body.refundCurrency,
            }),
          });
        }
      } catch (emailErr) {
        console.error('Cancellation email failed:', emailErr);
      }

      if (dbError) {
        console.error('Supabase cancel update error:', dbError);
        return NextResponse.json({ error: 'cancel_db_failed', detail: `DB error: ${dbError} (hasAdmin=${hasAdmin})` }, { status: 500 });
      }
      if (rowsUpdated === 0) {
        console.error('Supabase cancel update: 0 rows', { orderId: body.orderId, bookingId: body.bookingId, hasAdmin });
        return NextResponse.json({ error: 'cancel_db_failed', detail: `0 rows updated — hasAdmin=${hasAdmin}, orderId=${body.orderId}, bookingId=${body.bookingId}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, hasAdmin, rowsUpdated });
    }

    // Sync: fix a stale Supabase status from Duffel's source-of-truth.
    // Uses admin client to bypass RLS on rows with null/mismatched user_id.
    if (body.action === 'sync') {
      const db = getAdminClient() ?? supabase;
      const q = body.orderId
        ? db.from('flight_bookings').update({ status: body.status }).eq('duffel_order_id', body.orderId)
        : db.from('flight_bookings').update({ status: body.status }).eq('id', body.bookingId);
      const { error } = await q;
      if (error) console.error('sync status error:', error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Duffel cancel error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    const detail: string = e?.errors?.[0]?.message || e?.message || 'Cancellation failed';
    const code: string = e?.errors?.[0]?.code ?? '';
    const dl = detail.toLowerCase();

    // User-facing errors — return 422 so the browser console doesn't show 502
    // and the frontend can display the actual reason clearly
    const isUserError =
      dl.includes('cannot be cancelled') ||
      dl.includes('cannot be changed') ||
      dl.includes('not cancellable') ||
      dl.includes('not refundable') ||
      dl.includes('non-refundable') ||
      dl.includes('already been cancelled') ||
      dl.includes('already cancelled') ||
      dl.includes('after departure') ||
      dl.includes('window has passed') ||
      dl.includes('no longer available') ||
      dl.includes('airline responded') ||
      dl.includes('unexpected error') ||
      code === 'not_supported' ||
      code === 'already_cancelled';

    // Translate airline passthrough errors into something actionable for the user
    const userDetail = (dl.includes('airline responded') || dl.includes('unexpected error'))
      ? 'The airline couldn\'t process this cancellation — this fare may be non-refundable. If you need to cancel, please contact your airline directly using the booking reference.'
      : detail;

    return NextResponse.json(
      { error: 'cancel_failed', detail: userDetail },
      { status: isUserError ? 422 : 502 },
    );
  }
}

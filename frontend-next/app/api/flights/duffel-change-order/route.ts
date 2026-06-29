import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

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

// POST /api/flights/duffel-change-order
// action: 'request'  → create order change request with new slices, returns change offers
// action: 'confirm'  → confirm a selected order change offer (and pay diff)
// action: 'patch'    → patch passenger details (name correction, phone, etc.)
export async function POST(req: NextRequest) {
  const key = getKey();
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();

  try {
    // ── Name / details correction ─────────────────────────────────────────────
    if (body.action === 'patch') {
      // body.orderId, body.passengerId, body.fields: { given_name?, family_name?, phone_number? }
      const data = await duffelReq('PATCH', `/air/orders/${body.orderId}/passengers/${body.passengerId}`, {
        data: body.fields,
      });
      return NextResponse.json({ ok: true, passenger: data.data });
    }

    // ── Request date/route change ─────────────────────────────────────────────
    if (body.action === 'request') {
      // body.orderId, body.slices: [{ origin, destination, departureDate, cabinClass }]
      const data = await duffelReq('POST', '/air/order_change_requests', {
        data: {
          order_id: body.orderId,
          slices: {
            add: body.slices.map((s: {
              origin: string; destination: string;
              departureDate: string; cabinClass?: string;
            }) => ({
              origin: s.origin,
              destination: s.destination,
              departure_date: s.departureDate,
              cabin_class: s.cabinClass ?? 'economy',
            })),
            remove: body.removeSliceIds ?? [],
          },
        },
      });

      const req_id = data.data?.id;
      if (!req_id) throw new Error('No change request ID returned');

      // Fetch the change offers for this request
      const offersData = await duffelReq('GET', `/air/order_change_offers?order_change_request_id=${req_id}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offers = (offersData.data ?? []).map((o: any) => ({
        id: o.id,
        changeTotalAmount: parseFloat(o.change_total_amount ?? '0'),
        changeTotalCurrency: o.change_total_currency ?? 'USD',
        newTotalAmount: parseFloat(o.new_total_amount ?? '0'),
        newTotalCurrency: o.new_total_currency ?? 'USD',
        expiresAt: o.expires_at,
        slices: o.slices?.add?.map((s: {
          id: string;
          segments: { origin: { iata_code: string }; destination: { iata_code: string }; departing_at: string; arriving_at: string }[];
        }) => ({
          id: s.id,
          segments: s.segments?.map(seg => ({
            origin: seg.origin?.iata_code,
            destination: seg.destination?.iata_code,
            departingAt: seg.departing_at,
            arrivingAt: seg.arriving_at,
          })),
        })) ?? [],
      }));

      return NextResponse.json({ changeRequestId: req_id, offers });
    }

    // ── Confirm a change offer ────────────────────────────────────────────────
    if (body.action === 'confirm') {
      // body.changeOfferId, body.paymentIntentId (optional — if payment needed)
      await duffelReq('POST', `/air/order_change_offers/${body.changeOfferId}/actions/confirm`, {
        data: body.paymentIntentId
          ? { payment: { type: 'payment_intent', payment_intent_id: body.paymentIntentId } }
          : { payment: { type: 'balance' } },
      });

      // Update departure_at in Supabase if provided
      if (body.bookingId && body.newDepartureAt) {
        await supabase
          .from('flight_bookings')
          .update({ departure_at: body.newDepartureAt })
          .eq('id', body.bookingId);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? 'Order change failed';
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DUFFEL = 'https://api.duffel.com';

function getDuffelKey() {
  return process.env.DUFFEL_LIVE_API_KEY
    ?? process.env.DUFFEL_TEST_API_KEY
    ?? process.env.DUFFEL_API_KEY;
}

async function duffelPost(path: string, body: unknown) {
  const res = await fetch(`${DUFFEL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getDuffelKey()}`,
      'Content-Type': 'application/json',
      'Duffel-Version': 'v2',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try { data = JSON.parse(text); } catch { data = { errors: [{ message: text }] }; }
  if (!res.ok) throw data;
  return data;
}

export async function POST(req: NextRequest) {
  const { quoteId, guest } = await req.json();
  // guest: { givenName, familyName, email, phone, bornOn }

  if (!getDuffelKey()) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });
  if (!quoteId || !guest?.givenName || !guest?.familyName || !guest?.email) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  try {
    const result = await duffelPost('/stays/orders', {
      data: {
        quote_id: quoteId,
        guests: [{
          given_name: guest.givenName,
          family_name: guest.familyName,
          email: guest.email,
          phone: guest.phone ?? null,
          born_on: guest.bornOn ?? null,
          type: 'lead_guest',
        }],
        payment: { method: 'balance' },
      },
    });

    const order = result.data ?? {};

    // Save to Supabase if user is logged in
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('flight_bookings').insert({
          user_id: user.id,
          booking_type: 'hotel',
          duffel_order_id: order.id ?? null,
          booking_reference: order.booking_reference ?? null,
          raw_order: order,
          status: order.status ?? 'confirmed',
        });
      }
    } catch {
      // non-fatal — booking succeeded, logging failed
    }

    return NextResponse.json({
      orderId: order.id,
      bookingReference: order.booking_reference ?? null,
      status: order.status ?? 'confirmed',
    });
  } catch (err) {
    console.error('Duffel stays book error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? 'Booking failed';
    return NextResponse.json({ error: 'book_failed', detail }, { status: 502 });
  }
}

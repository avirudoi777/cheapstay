import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DUFFEL = 'https://api.duffel.com';

interface PassengerInput {
  passengerId: string;
  title: string;
  givenName: string;
  familyName: string;
  gender: string;
  bornOn: string;
  email: string;
  phoneNumber: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
}

export async function POST(req: NextRequest) {
  const { offerId, paymentIntentId, amount, currency, passengers, services = [] } = await req.json() as {
    offerId: string;
    paymentIntentId: string;
    amount: string;
    currency: string;
    passengers: PassengerInput[];
    services?: { serviceId: string; quantity: number }[];
  };

  const key = process.env.DUFFEL_LIVE_API_KEY
    ?? process.env.DUFFEL_TEST_API_KEY
    ?? process.env.DUFFEL_API_KEY;

  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  // DUFFEL_TEST_MODE=true overrides; otherwise infer from key prefix
  const isTestMode = process.env.DUFFEL_TEST_MODE === 'true' || !key.startsWith('duffel_live_');
  const payment = isTestMode
    ? { type: 'balance', amount, currency }
    : { type: 'payment_intent', id: paymentIntentId };

  try {
    const res = await fetch(`${DUFFEL}/air/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
      },
      body: JSON.stringify({
        data: {
          selected_offers: [offerId],
          passengers: passengers.map(p => ({
            id: p.passengerId,
            title: p.title,
            given_name: p.givenName,
            family_name: p.familyName,
            gender: p.gender,
            born_on: p.bornOn,
            email: p.email,
            phone_number: p.phoneNumber.startsWith('+') ? p.phoneNumber : `+${p.phoneNumber}`,
            identity_documents: [{
              type: 'passport',
              unique_identifier: p.passportNumber,
              expires_on: p.passportExpiry,
              issuing_country_code: p.passportCountry,
            }],
          })),
          payments: [payment],
          ...(services.length > 0 ? {
            services: services.map(s => ({ id: s.serviceId, quantity: s.quantity })),
          } : {}),
        },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) throw data;

    const order = data.data;

    // Save booking to Supabase (best-effort — don't fail the booking if this errors)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const slice = order.slices?.[0];
      const segs = slice?.segments ?? [];
      const firstSeg = segs[0];
      const lastSeg = segs[segs.length - 1];

      const cancellationPolicy = (() => {
        const r = order.conditions?.refund_before_departure;
        if (!r) return null;
        return {
          allowed: r.allowed ?? false,
          penalty_amount: r.penalty_amount ? parseFloat(r.penalty_amount) : null,
          penalty_currency: r.penalty_currency ?? null,
        };
      })();

      const baseRow = {
        user_id: user?.id ?? null,
        passenger_email: passengers[0]?.email ?? null,
        duffel_order_id: order.id,
        booking_reference: order.booking_reference,
        status: 'confirmed',
        origin_code: firstSeg?.origin?.iata_code ?? null,
        origin_city: firstSeg?.origin?.city_name ?? firstSeg?.origin?.name ?? null,
        destination_code: lastSeg?.destination?.iata_code ?? null,
        destination_city: lastSeg?.destination?.city_name ?? lastSeg?.destination?.name ?? null,
        departure_at: firstSeg?.departing_at ?? null,
        arrival_at: lastSeg?.arriving_at ?? null,
        airline: firstSeg?.marketing_carrier?.name ?? null,
        total_amount: parseFloat(order.total_amount),
        currency: order.total_currency,
        passengers_count: order.passengers?.length ?? 1,
        passenger_names: order.passengers?.map((p: { given_name: string; family_name: string }) =>
          `${p.given_name} ${p.family_name}`
        ) ?? [],
      };

      // Try full insert with cancellation_policy; fall back to base row if column missing
      const { error: insertErr } = await supabase.from('flight_bookings').insert({
        ...baseRow,
        cancellation_policy: cancellationPolicy,
      });

      if (insertErr) {
        console.error('Full insert failed, retrying without cancellation_policy:', insertErr.message);
        const { error: retryErr } = await supabase.from('flight_bookings').insert(baseRow);
        if (retryErr) console.error('Retry insert also failed:', retryErr.message);
      }
    } catch (saveErr) {
      console.error('Failed to save booking to Supabase:', saveErr);
    }

    return NextResponse.json({
      orderId: order.id,
      bookingReference: order.booking_reference,
      totalAmount: parseFloat(order.total_amount),
      currency: order.total_currency,
      passengers: order.passengers,
      testMode: isTestMode,
    });
  } catch (err) {
    console.error('Duffel order error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Booking failed';
    return NextResponse.json({ error: 'booking_failed', detail }, { status: 502 });
  }
}

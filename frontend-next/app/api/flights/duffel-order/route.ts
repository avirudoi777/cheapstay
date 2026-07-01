import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { bookingConfirmationEmail } from '@/lib/email-templates';

export const maxDuration = 60; // Duffel order creation can take 15–30s for complex itineraries

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key);
}

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
  const { offerId, paymentIntentId, amount, extrasAmount = '0', currency, passengers, services = [], hold = false } = await req.json() as {
    offerId: string;
    paymentIntentId: string;
    amount: string;
    extrasAmount?: string;
    currency: string;
    passengers: PassengerInput[];
    services?: { serviceId: string; quantity: number }[];
    hold?: boolean;
  };

  const key = process.env.DUFFEL_LIVE_API_KEY || process.env.DUFFEL_TEST_API_KEY || process.env.DUFFEL_API_KEY;

  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  // Auth check BEFORE calling Duffel — never place a booking we can't attribute to a user
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized', detail: 'Must be logged in to book' }, { status: 401 });

  // DUFFEL_TEST_MODE=true overrides; otherwise infer from key prefix
  const isTestMode = process.env.DUFFEL_TEST_MODE === 'true' || !key.startsWith('duffel_live_');

  // Refresh the offer to get the current price before booking.
  // Airline prices change in real-time — booking with a stale amount causes
  // Duffel to return "Please retrieve the offer again to get the latest pricing information."
  // GET /air/offers/{id} refreshes the price without creating a new offer_request.
  // If the offer is no longer available (expired or sold out), fail early with a clear error.
  let bookingAmount = amount;
  let bookingCurrency = currency;
  let refreshedTotalAmount: number | null = null;
  try {
    const offerRes = await fetch(`${DUFFEL}/air/offers/${offerId}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Duffel-Version': 'v2',
      },
      cache: 'no-store',
    });
    if (offerRes.ok) {
      const offerData = await offerRes.json();
      const freshAmount: string | undefined = offerData.data?.total_amount;
      const freshCurrency: string | undefined = offerData.data?.total_currency;
      if (freshAmount) {
        // Add extras (seats/bags) to the refreshed base fare — Duffel requires
        // payments[].amount to equal offer.total_amount + selected services total
        const extras = parseFloat(extrasAmount) || 0;
        bookingAmount = (parseFloat(freshAmount) + extras).toFixed(2);
        bookingCurrency = freshCurrency ?? currency;
        refreshedTotalAmount = parseFloat(freshAmount);
      }
    } else {
      // Offer expired or no longer available — fail now before attempting to book
      const errBody = await offerRes.json().catch(() => ({}));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (errBody as any)?.errors?.[0]?.message || 'This offer is no longer available.';
      return NextResponse.json(
        { error: 'offer_expired', detail: `${detail} Please search again for updated prices.` },
        { status: 410 },
      );
    }
  } catch { /* keep original amount if refresh fails for an unexpected reason */ }

  // hold=true creates the order without payment (airline holds the seat)
  // The order can be paid later via POST /air/payments before the hold expires
  const payment = hold ? null
    : isTestMode
      ? { type: 'balance', amount: bookingAmount, currency: bookingCurrency }
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
          type: hold ? 'hold' : 'instant',
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
          ...(payment ? { payments: [payment] } : {}),
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
      // Admin client bypasses RLS — user session may not forward correctly on Vercel
      const supabase = getAdminClient() ?? supabaseAuth;
      // user is guaranteed non-null here (we returned 401 above if null)
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
        user_id: user.id,
        passenger_email: passengers[0]?.email ?? null,
        duffel_order_id: order.id,
        booking_reference: order.booking_reference,
        status: order.status === 'held' ? 'held' : 'confirmed',
        origin_code: firstSeg?.origin?.iata_code ?? null,
        origin_city: firstSeg?.origin?.city_name ?? firstSeg?.origin?.name ?? null,
        destination_code: lastSeg?.destination?.iata_code ?? null,
        destination_city: lastSeg?.destination?.city_name ?? lastSeg?.destination?.name ?? null,
        departure_at: firstSeg?.departing_at ?? null,
        arrival_at: lastSeg?.arriving_at ?? null,
        airline: firstSeg?.marketing_carrier?.name ?? null,
        cabin_class: firstSeg?.cabin_class ?? null,
        total_amount: parseFloat(order.total_amount),
        currency: order.total_currency,
        extras_amount: parseFloat(extrasAmount) || 0,
        passengers_count: order.passengers?.length ?? 1,
        passenger_names: order.passengers?.map((p: { given_name: string; family_name: string }) =>
          `${p.given_name} ${p.family_name}`
        ) ?? [],
      };

      // Upsert on duffel_order_id so retries / double-clicks don't 409 — the booking
      // is already saved on the first attempt; a second identical call just updates it.
      // Fallback chain: full row → without cancellation_policy → bare baseRow (extras_amount may not exist yet)
      const fullRow = { ...baseRow, cancellation_policy: cancellationPolicy };
      const { data: upsertedRow, error: upsertErr } = await supabase
        .from('flight_bookings')
        .upsert(fullRow, { onConflict: 'duffel_order_id', ignoreDuplicates: false })
        .select('id')
        .single();

      let finalErr = upsertErr;
      if (upsertErr) {
        console.error('Upsert failed, retrying without cancellation_policy:', upsertErr.message);
        const { error: e2 } = await supabase
          .from('flight_bookings')
          .upsert(baseRow, { onConflict: 'duffel_order_id', ignoreDuplicates: false });
        finalErr = e2;
        if (e2) {
          // Last resort: strip extras_amount in case column migration hasn't run yet
          console.error('Retry failed, stripping extras_amount:', e2.message);
          const { extras_amount: _x, ...bareRow } = baseRow;
          const { error: e3 } = await supabase
            .from('flight_bookings')
            .upsert(bareRow, { onConflict: 'duffel_order_id', ignoreDuplicates: false });
          finalErr = e3;
          if (e3) console.error('All upsert attempts failed:', e3.message);
        }
      }

      // Always look up the saved row ID — upsertedRow may be null if attempt 1 failed
      // (e.g. extras_amount column migration not yet run) but a later fallback succeeded.
      let savedRowId: string | undefined = upsertedRow?.id;
      if (!savedRowId) {
        const { data: fallbackRow } = await supabase
          .from('flight_bookings').select('id').eq('duffel_order_id', order.id).single();
        savedRowId = fallbackRow?.id;
      }

      // Expose save debug so we can diagnose in the network tab
      (order as Record<string, unknown>)._saveDebug = {
        userId: user?.id ?? null,
        insertError: finalErr?.message ?? null,
        savedRowId: savedRowId ?? null,
      };

      // Send booking confirmation email (best-effort — never block the booking response)
      try {
        const recipient = passengers[0]?.email;
        if (recipient) {
          await sendEmail({
            to: recipient,
            ...bookingConfirmationEmail({
              bookingReference: order.booking_reference,
              passengerNames: order.passengers?.map((p: { given_name: string; family_name: string }) => `${p.given_name} ${p.family_name}`) ?? [],
              originCode: firstSeg?.origin?.iata_code ?? '',
              originCity: firstSeg?.origin?.city_name ?? firstSeg?.origin?.name ?? '',
              destinationCode: lastSeg?.destination?.iata_code ?? '',
              destinationCity: lastSeg?.destination?.city_name ?? lastSeg?.destination?.name ?? '',
              departureAt: firstSeg?.departing_at ?? '',
              airline: firstSeg?.marketing_carrier?.name ?? '',
              totalAmount: parseFloat(order.total_amount),
              currency: order.total_currency,
              bookingId: savedRowId,
            }),
          });
        }
      } catch (emailErr) {
        console.error('Booking confirmation email failed:', emailErr);
      }
    } catch (saveErr) {
      console.error('Failed to save booking to Supabase:', saveErr);
    }

    return NextResponse.json({
      orderId: order.id,
      bookingReference: order.booking_reference,
      status: order.status,
      totalAmount: parseFloat(order.total_amount),
      currency: order.total_currency,
      passengers: order.passengers,
      refreshedTotalAmount,
      testMode: isTestMode,
      paymentRequirements: order.payment_requirements ?? null,
      _saveDebug: (order as Record<string, unknown>)._saveDebug ?? null,
    });
  } catch (err) {
    console.error('Duffel order error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Booking failed';

    // Duffel rejects hold orders with "The specified `type` was incorrect" when
    // the airline/fare doesn't support holds (even if requiresInstantPayment was false).
    // Return a distinct error so the frontend can switch to instant payment gracefully.
    if (hold && detail.toLowerCase().includes("'type'")) {
      return NextResponse.json({ error: 'hold_not_supported', detail }, { status: 502 });
    }

    // "Please select another offer, or create a new offer request to get the latest availability."
    // Duffel returns this when the offer is sold out or expired during order creation.
    // Treat as offer_expired so the frontend shows "Search again" instead of a dead error.
    const dl = detail.toLowerCase();
    if (dl.includes('select another offer') || dl.includes('new offer request') || dl.includes('latest availability')) {
      return NextResponse.json({ error: 'offer_expired', detail }, { status: 410 });
    }

    return NextResponse.json({ error: 'booking_failed', detail }, { status: 502 });
  }
}

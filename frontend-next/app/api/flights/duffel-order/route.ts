import { NextRequest, NextResponse } from 'next/server';

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
  const { offerId, offerAmount, offerCurrency, passenger } = await req.json() as {
    offerId: string;
    offerAmount: string;
    offerCurrency: string;
    passenger: PassengerInput;
  };

  if (!process.env.DUFFEL_API_KEY) {
    return NextResponse.json({ error: 'no_credentials' }, { status: 503 });
  }

  try {
    const res = await fetch(`${DUFFEL}/air/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
      },
      body: JSON.stringify({
        data: {
          selected_offers: [offerId],
          passengers: [{
            id: passenger.passengerId,
            title: passenger.title,
            given_name: passenger.givenName,
            family_name: passenger.familyName,
            gender: passenger.gender,
            born_on: passenger.bornOn,
            email: passenger.email,
            phone_number: passenger.phoneNumber,
            identity_documents: [{
              type: 'passport',
              number: passenger.passportNumber,
              expires_on: passenger.passportExpiry,
              issuing_country_code: passenger.passportCountry,
            }],
          }],
          payments: [{
            type: 'balance',
            amount: offerAmount,
            currency: offerCurrency,
          }],
        },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) throw data;

    const order = data.data;
    return NextResponse.json({
      orderId: order.id,
      bookingReference: order.booking_reference,
      totalAmount: parseFloat(order.total_amount),
      currency: order.total_currency,
      passengers: order.passengers,
    });
  } catch (err) {
    console.error('Duffel order error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Booking failed';
    return NextResponse.json({ error: 'booking_failed', detail }, { status: 502 });
  }
}

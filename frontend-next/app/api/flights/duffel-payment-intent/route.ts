import { NextRequest, NextResponse } from 'next/server';

const DUFFEL = 'https://api.duffel.com';

// Your service fee per booking (in the offer's currency)
export const SERVICE_FEE = 10;
// Duffel Payments processing fee rate
const DUFFEL_FEE_RATE = 0.029;

// Formula: ((base + markup) * exchangeRate) / (1 - duffelFee)
// For same-currency bookings: (base + SERVICE_FEE) / (1 - 0.029)
export function calcGross(base: number): number {
  return Math.round(((base + SERVICE_FEE) / (1 - DUFFEL_FEE_RATE)) * 100) / 100;
}

export async function POST(req: NextRequest) {
  const { amount, currency } = await req.json() as { amount: string; currency: string };

  const key = process.env.DUFFEL_LIVE_API_KEY
    ?? process.env.DUFFEL_TEST_API_KEY
    ?? process.env.DUFFEL_API_KEY;

  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  const baseFare = parseFloat(amount);
  const grossAmount = calcGross(baseFare);
  const processingFee = parseFloat((grossAmount - baseFare - SERVICE_FEE).toFixed(2));

  try {
    const res = await fetch(`${DUFFEL}/air/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
      },
      body: JSON.stringify({
        data: { amount: grossAmount.toFixed(2), currency },
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) throw data;

    return NextResponse.json({
      paymentIntentId: data.data.id,
      clientToken: data.data.client_token,
      grossAmount,
      currency,
      breakdown: {
        baseFare,
        serviceFee: SERVICE_FEE,
        processingFee,
        total: grossAmount,
      },
    });
  } catch (err) {
    console.error('Payment intent error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Payment setup failed';
    return NextResponse.json({ error: 'payment_intent_failed', detail }, { status: 502 });
  }
}

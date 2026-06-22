import { NextRequest, NextResponse } from 'next/server';

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
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

function parseISODur(iso: string): string {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return '';
  const h = m[1] ? parseInt(m[1]) : 0;
  const min = m[2] ? parseInt(m[2]) : 0;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

function totalDur(segments: Record<string, unknown>[]): string {
  if (!segments?.length) return '';
  const dep = new Date((segments[0] as Record<string, string>).departing_at);
  const arr = new Date((segments[segments.length - 1] as Record<string, string>).arriving_at);
  const ms = arr.getTime() - dep.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function layoverMin(arrAt: string, depAt: string): string {
  const diff = new Date(depAt).getTime() - new Date(arrAt).getTime();
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatOffer(offer: any) {
  const slice = offer.slices[0];
  const segs = slice.segments;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableServices = (offer.available_services ?? []).map((svc: any) => ({
    id: svc.id,
    type: svc.type,
    maximumQuantity: svc.maximum_quantity ?? 1,
    totalAmount: parseFloat(svc.total_amount ?? '0'),
    totalCurrency: svc.total_currency ?? offer.total_currency,
    passengerIds: svc.passenger_ids ?? [],
    segmentIds: svc.segment_ids ?? [],
    metadata: svc.metadata ?? {},
  }));
  const offerPassengers = (offer.passengers as { id: string; type: string }[]);
  return {
    id: offer.id,
    expiresAt: offer.expires_at,
    totalAmount: parseFloat(offer.total_amount),
    totalCurrency: offer.total_currency,
    totalDuration: totalDur(segs),
    passengerIds: offerPassengers.map(p => p.id),
    passengers: offerPassengers.map(p => ({ id: p.id, type: p.type as 'adult' | 'child' | 'infant_without_seat' })),
    availableServices,
    segments: segs.map((seg: Record<string, unknown>, si: number) => {
      const origin = seg.origin as Record<string, string>;
      const dest = seg.destination as Record<string, string>;
      const carrier = seg.marketing_carrier as Record<string, string>;
      const aircraft = seg.aircraft as Record<string, string> | null;
      const nextSeg = segs[si + 1] as Record<string, unknown> | undefined;
      const layover = nextSeg
        ? layoverMin(seg.arriving_at as string, (nextSeg as Record<string, string>).departing_at)
        : '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paxBaggages = ((seg.passengers as any[])?.[0]?.baggages ?? []) as { type: string; quantity: number }[];
      const checkedBags = paxBaggages.filter(b => b.type === 'checked').reduce((s, b) => s + b.quantity, 0);
      const carryOn = paxBaggages.filter(b => b.type === 'carry_on').reduce((s, b) => s + b.quantity, 0);
      return {
        segmentId: seg.id as string,
        depCode: origin.iata_code,
        depCity: origin.city_name || origin.name,
        depAt: seg.departing_at,
        arrCode: dest.iata_code,
        arrCity: dest.city_name || dest.name,
        arrAt: seg.arriving_at,
        airline: carrier.name,
        airlineCode: carrier.iata_code,
        flightNumber: `${carrier.iata_code}${seg.marketing_carrier_flight_number}`,
        duration: parseISODur(seg.duration as string),
        aircraft: aircraft?.name || '',
        layoverAfter: layover,
        baggage: { checkedBags, carryOn },
      };
    }),
  };
}

export async function POST(req: NextRequest) {
  const { origin, destination, departureDate, returnDate, adults = 1, children = 0, infants = 0 } = await req.json();

  if (!getDuffelKey()) {
    return NextResponse.json({ error: 'no_credentials' }, { status: 503 });
  }
  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slices: any[] = [{ origin, destination, departure_date: departureDate }];
    if (returnDate) slices.push({ origin: destination, destination: origin, departure_date: returnDate });

    const passengers = [
      ...Array.from({ length: Math.max(1, adults) }, () => ({ type: 'adult' })),
      ...Array.from({ length: Math.max(0, children) }, () => ({ type: 'child' })),
      ...Array.from({ length: Math.max(0, infants) }, () => ({ type: 'infant_without_seat' })),
    ];

    const result = await duffelPost('/air/offer_requests', {
      data: {
        slices,
        passengers,
        cabin_class: 'economy',
        return_offers: true,
      },
    });

    const offers = (result.data.offers ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
      .slice(0, 6)
      .map(formatOffer);

    return NextResponse.json({ offers });
  } catch (err) {
    console.error('Duffel search error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message || 'Search failed';
    return NextResponse.json({ error: 'search_failed', detail }, { status: 502 });
  }
}

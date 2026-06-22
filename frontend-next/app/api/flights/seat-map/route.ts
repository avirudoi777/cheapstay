import { NextRequest, NextResponse } from 'next/server';

const DUFFEL = 'https://api.duffel.com';

function getDuffelKey() {
  return process.env.DUFFEL_LIVE_API_KEY
    ?? process.env.DUFFEL_TEST_API_KEY
    ?? process.env.DUFFEL_API_KEY;
}

export async function GET(req: NextRequest) {
  const offerId = req.nextUrl.searchParams.get('offerId');
  if (!offerId) return NextResponse.json({ error: 'offerId required' }, { status: 400 });

  const key = getDuffelKey();
  if (!key) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });

  try {
    const res = await fetch(`${DUFFEL}/air/seat_maps?offer_id=${encodeURIComponent(offerId)}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (data as any)?.errors?.[0]?.message || 'Seat map unavailable';
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // Simplify seat map: return cabins with rows of seat elements per segment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maps = (data.data ?? []).map((sm: any) => ({
      segmentId: sm.segment_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cabins: (sm.cabins ?? []).map((cabin: any) => ({
        cabinClass: cabin.cabin_class,
        cabinClassName: cabin.cabin_class_marketing_name,
        wings: cabin.wings ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows: (cabin.rows ?? []).map((row: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sections: (row.sections ?? []).map((section: any) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            elements: (section.elements ?? []).map((el: any) => ({
              type: el.type,
              designator: el.designator ?? null,
              disclosures: el.disclosures ?? [],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              available_services: (el.available_services ?? []).map((svc: any) => ({
                id: svc.id,
                passenger_id: svc.passenger_id,
                total_amount: svc.total_amount,
                total_currency: svc.total_currency,
              })),
            })),
          })),
        })),
      })),
    }));

    return NextResponse.json({ maps });
  } catch (err) {
    console.error('Seat map error:', err);
    return NextResponse.json({ error: 'Failed to load seat map' }, { status: 502 });
  }
}

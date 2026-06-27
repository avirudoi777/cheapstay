import { NextRequest, NextResponse } from 'next/server';

const DUFFEL = 'https://api.duffel.com';

function getDuffelKey() {
  return process.env.DUFFEL_LIVE_API_KEY
    ?? process.env.DUFFEL_TEST_API_KEY
    ?? process.env.DUFFEL_API_KEY;
}

async function duffelPost(path: string, body: unknown) {
  const key = getDuffelKey();
  const res = await fetch(`${DUFFEL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
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

async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CheapStay/1.0 (cheapstay.app)' },
    });
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResult(r: any, searchId: string) {
  const acc = r.accommodation ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rooms = (r.rooms ?? []).map((room: any) => {
    const rates = room.rates ?? [];
    const cheapRate = rates[0] ?? {};
    return {
      id: room.id ?? '',
      name: room.name ?? 'Room',
      beds: (room.beds ?? []).map((b: { count?: number; type?: string }) => `${b.count ?? 1}x ${b.type ?? 'bed'}`).join(', '),
      totalAmount: parseFloat(cheapRate.total_amount ?? '0'),
      currency: cheapRate.total_currency ?? 'USD',
      rateId: cheapRate.id ?? '',
      freeCancellation: cheapRate.conditions?.refund_before_departure?.allowed ?? false,
      photos: (room.photos ?? []).slice(0, 2).map((p: { url?: string }) => p.url).filter(Boolean),
    };
  });

  const cheapestTotal = parseFloat(r.cheapest_rate_total_amount ?? rooms[0]?.totalAmount ?? '0');
  const currency = r.cheapest_rate_currency ?? rooms[0]?.currency ?? 'USD';

  return {
    id: r.id,
    searchId,
    accommodation: {
      id: acc.id ?? '',
      name: acc.name ?? 'Hotel',
      starRating: acc.rating?.value ?? null,
      photo: acc.photos?.[0]?.url ?? null,
      address: acc.location?.address?.line_one ?? acc.location?.address?.city_name ?? null,
      city: acc.location?.address?.city_name ?? null,
      amenities: (acc.amenities ?? []).slice(0, 6).map((a: { type?: string; description?: string }) => a.type ?? a.description ?? '').filter(Boolean),
      checkInTime: acc.check_in_information?.check_in_after_time ?? null,
      checkOutTime: acc.check_in_information?.check_out_before_time ?? null,
    },
    cheapestTotal,
    currency,
    cheapestRateId: r.cheapest_rate_id ?? rooms[0]?.rateId ?? '',
    rooms,
  };
}

export async function POST(req: NextRequest) {
  const { location, checkin, checkout, adults = 1, rooms = 1 } = await req.json();

  if (!getDuffelKey()) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });
  if (!location || !checkin || !checkout) return NextResponse.json({ error: 'missing_params' }, { status: 400 });

  const coords = await geocode(location);
  if (!coords) return NextResponse.json({ error: 'location_not_found', detail: `Could not geocode: ${location}` }, { status: 400 });

  const guests = Array.from({ length: Math.max(1, adults) }, () => ({ type: 'adult' as const }));

  try {
    const result = await duffelPost('/stays/search', {
      data: {
        check_in_date: checkin,
        check_out_date: checkout,
        rooms,
        guests,
        location: {
          radius: 3,
          geographic_coordinates: { latitude: coords.lat, longitude: coords.lon },
        },
      },
    });

    const searchId: string = result.data?.id ?? '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (result.data?.results ?? []).map((r: any) => parseResult(r, searchId));

    return NextResponse.json({ searchId, results: parsed });
  } catch (err) {
    console.error('Duffel stays search error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? (err as any)?.message ?? 'Search failed';
    return NextResponse.json({ error: 'search_failed', detail }, { status: 502 });
  }
}

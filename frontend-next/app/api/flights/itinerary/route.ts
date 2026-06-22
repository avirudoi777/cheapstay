import { NextRequest, NextResponse } from 'next/server';

const AMADEUS_BASE = process.env.AMADEUS_HOSTNAME === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

// Module-level token cache — reused across requests within the same serverless instance
let tokenCache: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.value;
  }
  const key    = process.env.AMADEUS_API_KEY!;
  const secret = process.env.AMADEUS_API_SECRET!;
  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(key)}&client_secret=${encodeURIComponent(secret)}`,
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const data = await res.json();
  tokenCache = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.value;
}

export interface FlightSegment {
  depCode: string;
  depName: string;
  depAt: string;
  arrCode: string;
  arrName: string;
  arrAt: string;
  airline: string;
  flightNumber: string;
  duration: string;
}

export interface ItineraryOption {
  totalDuration: string;
  price: number;
  currency: string;
  segments: FlightSegment[];
}

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = m[1] ? parseInt(m[1]) : 0;
  const min = m[2] ? parseInt(m[2]) : 0;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from   = searchParams.get('from') ?? '';
  const to     = searchParams.get('to') ?? '';
  const depart = searchParams.get('depart') ?? '';

  if (!from || !to || !depart) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    return NextResponse.json({ error: 'no_credentials' }, { status: 503 });
  }

  try {
    const token = await getToken();
    const qs = new URLSearchParams({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: depart.slice(0, 10),
      adults: '1',
      max: '5',
      currencyCode: 'USD',
    });
    const res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Amadeus flight-offers error:', err);
      return NextResponse.json({ error: 'search_failed' }, { status: 502 });
    }

    const json = await res.json();
    const dictionaries = json.dictionaries ?? {};
    const carriers: Record<string, string> = dictionaries.carriers ?? {};
    const locations: Record<string, { cityCode: string; countryCode: string }> = dictionaries.locations ?? {};

    const itineraries: ItineraryOption[] = (json.data ?? []).slice(0, 5).map((offer: Record<string, unknown>) => {
      const itin = (offer.itineraries as Record<string, unknown>[])[0];
      const segments: FlightSegment[] = (itin.segments as Record<string, unknown>[]).map(seg => {
        const dep = seg.departure as Record<string, unknown>;
        const arr = seg.arrival as Record<string, unknown>;
        const code = seg.carrierCode as string;
        return {
          depCode: dep.iataCode as string,
          depName: (carriers[dep.iataCode as string] ?? '') || (dep.iataCode as string),
          depAt: dep.at as string,
          arrCode: arr.iataCode as string,
          arrName: (carriers[arr.iataCode as string] ?? '') || (arr.iataCode as string),
          arrAt: arr.at as string,
          airline: carriers[code] ?? code,
          flightNumber: `${code}${seg.number}`,
          duration: parseDuration(seg.duration as string),
        };
      });
      const price = (offer.price as Record<string, unknown>);
      return {
        totalDuration: parseDuration(itin.duration as string),
        price: parseFloat(price.grandTotal as string) || parseFloat(price.total as string) || 0,
        currency: price.currency as string ?? 'USD',
        segments,
      };
    });

    return NextResponse.json({ itineraries, from, to });
  } catch (err) {
    console.error('Itinerary search error:', err);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}

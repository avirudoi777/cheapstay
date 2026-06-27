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

export async function POST(req: NextRequest) {
  const { searchResultId, roomRateId } = await req.json();

  if (!getDuffelKey()) return NextResponse.json({ error: 'no_credentials' }, { status: 503 });
  if (!searchResultId || !roomRateId) return NextResponse.json({ error: 'missing_params' }, { status: 400 });

  try {
    const result = await duffelPost('/stays/quotes', {
      data: {
        search_result_id: searchResultId,
        room_selection: [{ room_rate_id: roomRateId }],
      },
    });

    const q = result.data ?? {};
    return NextResponse.json({
      quoteId: q.id,
      totalAmount: parseFloat(q.total_amount ?? '0'),
      currency: q.total_currency ?? 'USD',
      expiresAt: q.expires_at ?? null,
      checkInDate: q.check_in_date ?? null,
      checkOutDate: q.check_out_date ?? null,
      accommodation: {
        name: q.accommodation?.name ?? '',
        address: q.accommodation?.location?.address?.line_one ?? null,
      },
      rooms: (q.rooms ?? []).map((r: { name?: string; beds?: { count?: number; type?: string }[]; rates?: { conditions?: { refund_before_departure?: { allowed?: boolean; penalty_amount?: string } } }[] }) => ({
        name: r.name ?? 'Room',
        beds: (r.beds ?? []).map((b) => `${b.count ?? 1}x ${b.type ?? 'bed'}`).join(', '),
        freeCancellation: r.rates?.[0]?.conditions?.refund_before_departure?.allowed ?? false,
        cancellationPenalty: r.rates?.[0]?.conditions?.refund_before_departure?.penalty_amount ?? null,
      })),
    });
  } catch (err) {
    console.error('Duffel stays quote error:', JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.errors?.[0]?.message ?? 'Quote failed';
    return NextResponse.json({ error: 'quote_failed', detail }, { status: 502 });
  }
}

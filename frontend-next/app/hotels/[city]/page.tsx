import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

interface Props { params: Promise<{ city: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const name = city.charAt(0).toUpperCase() + city.slice(1);
  return buildPageMetadata({
    title: `Cheap Hotels in ${name} — Best Prices`,
    description: `Find the cheapest hotel prices in ${name}. Compare Agoda, Booking.com and more to always get the best deal.`,
    path: `/hotels/${city}`,
  });
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;
  const name = city.charAt(0).toUpperCase() + city.slice(1);

  // Pre-fetch a default date window (30 days out, 3 nights) for SSR
  const checkin  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const checkout = new Date(Date.now() + 33 * 86400000).toISOString().split('T')[0];

  let initialHotels: unknown[] = [];
  let totalCount = 0;

  try {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/search-city`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: name, checkin, checkout, adults: 2, offset: 0, limit: 20 }),
      next: { revalidate: 3600 }, // cache for 1hr
    });
    if (res.ok) {
      const data = await res.json();
      initialHotels = data.hotels ?? [];
      totalCount    = data.total_agoda ?? 0;
    }
  } catch {
    // Backend not available at build time; page will still render
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* SEO-friendly header — rendered server-side */}
      <h1 className="text-3xl font-bold text-navy mb-2">
        {totalCount > 0 ? `${totalCount.toLocaleString()} ` : ''}Cheap Hotels in {name}
      </h1>
      <p className="text-gray-500 mb-8">
        Compare prices across Agoda, Booking.com and more. Always find the best deal in {name}.
      </p>

      {/* Tell user to search for live prices */}
      <div className="bg-teal/10 border border-teal/30 rounded-2xl p-5 text-center">
        <p className="text-navy font-medium">
          For live prices with your dates, search on the <a href="/" className="text-teal font-bold hover:underline">homepage</a>.
        </p>
      </div>

      {/* SEO content listing static hotel names for indexing */}
      {initialHotels.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy mb-4">Popular hotels in {name}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(initialHotels as Array<{ name: string; rating?: string; stars?: number }>).map((h, i) => (
              <li key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-navy">{h.name}</p>
                {h.stars && <p className="text-xs text-amber-400">{'★'.repeat(h.stars)}</p>}
                {h.rating && <p className="text-xs text-gray-400">{h.rating} / 10</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

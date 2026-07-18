import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import HotelGrid from '@/components/HotelGrid';
import type { CitySearchResponse } from '@/lib/types';

export const revalidate = 3600; // ISR: rebuild at most once per hour

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
  const adults = 2;

  let initialData: CitySearchResponse = {
    hotels: [], total_agoda: 0, cached_count: 0, offset: 0, limit: 20, has_more: false,
  };

  try {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/search-city`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: name, checkin, checkout, adults, offset: 0, limit: 20 }),
      next: { revalidate: 3600 }, // cache for 1hr
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch {
    // Backend not available at build time; page will still render
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* SEO-friendly header — rendered server-side */}
      <h1 className="text-3xl font-bold text-navy mb-2">
        {initialData.total_agoda > 0 ? `${initialData.total_agoda.toLocaleString()} ` : ''}Cheap Hotels in {name}
      </h1>
      <p className="text-gray-500 mb-8">
        Real prices for a 3-night stay starting {checkin} — pick your own dates on any card below.
      </p>

      {initialData.hotels.length > 0 ? (
        <HotelGrid
          initialData={initialData}
          location={name}
          checkin={checkin}
          checkout={checkout}
          adults={adults}
          agodaPrices={null}
        />
      ) : (
        <div className="bg-teal/10 border border-teal/30 rounded-2xl p-5 text-center">
          <p className="text-navy font-medium">
            We couldn&apos;t load hotels for {name} right now — try the <a href="/" className="text-teal font-bold hover:underline">homepage search</a> instead.
          </p>
        </div>
      )}
    </div>
  );
}

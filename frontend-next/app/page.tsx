'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import SearchBar, { type SearchValues } from '@/components/SearchBar';
import HotelGrid from '@/components/HotelGrid';
import { searchCity, getSuggestions, fetchAgodaPrices } from '@/lib/api';
import type { AgodaPriceEntry } from '@/lib/api';
import type { CitySearchResponse } from '@/lib/types';

const DESTINATIONS = [
  { city: 'Bangkok',   country: 'Thailand',  flag: '🇹🇭', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=200&fit=crop&auto=format' },
  { city: 'Bali',      country: 'Indonesia', flag: '🇮🇩', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=200&fit=crop&auto=format' },
  { city: 'Tokyo',     country: 'Japan',     flag: '🇯🇵', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop&auto=format' },
  { city: 'Dubai',     country: 'UAE',       flag: '🇦🇪', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop&auto=format' },
  { city: 'Singapore', country: 'Singapore', flag: '🇸🇬', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=200&fit=crop&auto=format' },
  { city: 'Paris',     country: 'France',    flag: '🇫🇷', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop&auto=format' },
];

function defaultDates() {
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 7);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { checkin: fmt(checkin), checkout: fmt(checkout) };
}

const STATS = [
  { icon: '🏨', value: '500,000+',       label: 'Hotels worldwide' },
  { icon: '💰', value: 'Save up to 40%', label: 'vs standard rates' },
  { icon: '⚡', value: 'Real-time',      label: 'Updated every search' },
  { icon: '🌍', value: '190+',           label: 'Countries' },
];

export default function HomePage() {
  const [results, setResults]           = useState<CitySearchResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [progress, setProgress]         = useState(0);
  const [searchValues, setSearchValues] = useState<SearchValues | null>(null);
  const [agodaUpdating, setAgodaUpdating] = useState(false);
  const [agodaPrices, setAgodaPrices]   = useState<Record<string, AgodaPriceEntry> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef  = useRef<HTMLDivElement>(null);

  function startProgress() {
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const pct = 90 * (1 - Math.exp(-3 * (Date.now() - start) / 25000));
      setProgress(pct);
    }, 200);
  }

  function finishProgress() {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
  }

  async function handleSearch(v: SearchValues) {
    setLoading(true);
    setError('');
    setResults(null);
    setAgodaPrices(null);
    setAgodaUpdating(false);
    setSearchValues(v);
    startProgress();
    try {
      // Determine which city to search in
      let searchLocation = v.location || v.query;

      // Hotel mode with no stored city — user typed a hotel name without picking from autocomplete.
      // Extract the city by querying progressively shorter terms (city is usually at the end).
      if (v.mode === 'hotel' && !v.location) {
        const SKIP = new Set(['hotel', 'hotels', 'resort', 'resorts', 'inn', 'suites',
                              'suite', 'lodge', 'hostel', 'motel', 'boutique', 'palace']);
        const stripped = v.query.replace(/\s+by\s+.*/i, '').trim();
        const words = stripped.split(/\s+/)
          .filter(w => w.length > 1 && !/^\d+$/.test(w) && !SKIP.has(w.toLowerCase()));
        // Candidates: last word, last 2 words, 2nd-to-last word, full stripped name
        const candidates = [
          words[words.length - 1],
          words.slice(-2).join(' '),
          words[words.length - 2],
          stripped,
        ].filter((t, i, a) => t && t.length > 1 && a.indexOf(t) === i);

        for (const term of candidates) {
          try {
            const sugs = await getSuggestions(term);
            const city = sugs.find(s => s.is_city)?.name
                      || sugs.find(s => !s.is_city && s.city)?.city;
            if (city) {
              searchLocation = city;
              setSearchValues({ ...v, location: city });
              break;
            }
          } catch { /* try next candidate */ }
        }
      }

      // When searching by hotel name, pass it so the backend can sort by name match
      const hotelNameParam = v.mode === 'hotel'
        ? v.query.replace(/\s+by\s+.*/i, '').trim()  // strip "by Brand" suffix
        : undefined;

      // Phase 1 — Booking.com results (fast, ~10s). Show immediately.
      const resp = await searchCity({
        location: searchLocation,
        checkin: v.checkin,
        checkout: v.checkout,
        adults: v.adults,
        offset: 0,
        limit: 20,
        force_refresh: v.forceRefresh,
        hotel_name: hotelNameParam,
        booking_only: true,
      });
      if (!resp.hotels?.length) {
        setError('No hotels found. Try different dates or destination.');
        return;
      }
      setResults(resp);
      finishProgress();
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);

      // Phase 2 — Agoda prices in background (~30s). Merge when ready.
      setAgodaUpdating(true);
      fetchAgodaPrices({
        location: searchLocation,
        checkin: v.checkin,
        checkout: v.checkout,
        adults: v.adults,
      })
        .then(agResp => {
          if (Object.keys(agResp.prices).length > 0) {
            setAgodaPrices(agResp.prices);
          }
        })
        .catch(() => { /* Agoda unavailable — booking prices already visible */ })
        .finally(() => setAgodaUpdating(false));

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed. Is the backend running?');
      finishProgress();
      setLoading(false);
    }
  }

  return (
    <>
      {/* Top progress bar */}
      {progress > 0 && (
        <div className="fixed top-14 left-0 right-0 h-1 z-50 bg-gray-100">
          <div className="h-full transition-all duration-200 rounded-full"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00C9B1, #1A73E8)' }} />
        </div>
      )}

      {/* Hero */}
      <section className="relative h-52 sm:h-64 overflow-hidden">
        <Image src="/hero.jpg" alt="Hotel view" fill className="object-cover" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,31,61,0.65), rgba(15,31,61,0.35))' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-lg">
            Always the cheapest hotel price
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/80">
            Search smarter. Stay cheaper. Every search, automatically.
          </p>
        </div>
      </section>

      {/* Search card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pb-12">
        {/* Loading spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-teal border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-navy font-semibold text-base">
                Searching hotels in {searchValues?.location || searchValues?.query}…
              </p>
              <p className="text-gray-400 text-sm mt-1">Comparing prices across platforms</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-center text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl py-4 px-6 mt-4">{error}</p>
        )}

        {/* Results */}
        {results && searchValues && (
          <div ref={resultsRef} className="mt-2">
            {/* Agoda loading banner */}
            {agodaUpdating && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-teal/5 border border-teal/20 rounded-xl text-sm text-teal">
                <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Comparing prices across platforms…
              </div>
            )}
            <HotelGrid
              initialData={results}
              location={searchValues.location || searchValues.query}
              checkin={searchValues.checkin}
              checkout={searchValues.checkout}
              adults={searchValues.adults}
              agodaPrices={agodaPrices}
              agodaLoading={agodaUpdating}
            />
          </div>
        )}

        {/* No results yet — show popular destinations + stats */}
        {!results && !loading && (
          <>
            <section className="py-8">
              <h2 className="text-xl font-bold text-navy mb-4">Popular Destinations</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {DESTINATIONS.map(d => (
                  <button
                    key={d.city}
                    onClick={() => {
                      const { checkin, checkout } = defaultDates();
                      handleSearch({ query: d.city, location: d.city, mode: 'city', checkin, checkout, adults: 2, rooms: 1, forceRefresh: false });
                    }}
                    className="relative overflow-hidden rounded-2xl h-28 sm:h-32 group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 text-left"
                  >
                    {/* Photo */}
                    <img src={d.img} alt={d.city} className="absolute inset-0 w-full h-full object-cover" />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    {/* Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                      <div className="text-base leading-none mb-0.5">{d.flag}</div>
                      <div className="text-sm font-bold leading-tight">{d.city}</div>
                      <div className="text-[10px] text-white/70">{d.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
                {STATS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
                    <span className="text-2xl flex-shrink-0">{s.icon}</span>
                    <div>
                      <div className="text-base font-bold text-navy leading-tight">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

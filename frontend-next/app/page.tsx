'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import SearchBar, { type SearchValues } from '@/components/SearchBar';
import HotelGrid from '@/components/HotelGrid';
import { searchCity, getSuggestions, fetchAgodaPrices, getUserCountry } from '@/lib/api';
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
  { icon: '🔍', value: 'Booking + Agoda',  label: 'Compared automatically' },
  { icon: '💰', value: 'Best price found', label: 'Every search' },
  { icon: '⚡', value: 'Real-time',        label: 'Live prices, no cache' },
  { icon: '🌍', value: '190+ Countries',   label: 'Worldwide coverage' },
];

const CREDIT_CARDS = [
  {
    name: 'Chase Sapphire Preferred®',
    bank: 'Chase',
    gradient: 'linear-gradient(135deg, #0f3460 0%, #1a5c8a 55%, #0b2545 100%)',
    network: 'VISA',
    badge: 'Best for Hotels',
    hotelMult: 2,
    pointValue: 1.25,
    pointName: 'points',
    bonus: '60,000 points',
    bonusValue: '≈ $750 in travel',
    bonusSpend: '$4,000 in 3 months',
    fee: '$95 / year',
    url: 'https://creditcards.chase.com/travel-credit-cards/sapphire/preferred',
  },
  {
    name: 'Capital One Venture',
    bank: 'Capital One',
    gradient: 'linear-gradient(135deg, #8b1a2e 0%, #c41230 50%, #6b1220 100%)',
    network: 'VISA',
    badge: 'Simplest Rewards',
    hotelMult: 2,
    pointValue: 1.0,
    pointName: 'miles',
    bonus: '75,000 miles',
    bonusValue: '≈ $750 in travel',
    bonusSpend: '$4,000 in 3 months',
    fee: '$95 / year',
    url: 'https://www.capitalone.com/credit-cards/venture/',
  },
  {
    name: 'Amex Gold Card',
    bank: 'American Express',
    gradient: 'linear-gradient(135deg, #6b4510 0%, #c8963c 45%, #d4a843 70%, #9a7020 100%)',
    network: 'AMEX',
    badge: 'Biggest Bonus',
    hotelMult: 2,
    pointValue: 1.0,
    pointName: 'points',
    bonus: '60,000 points',
    bonusValue: '≈ $600 in travel',
    bonusSpend: '$6,000 in 6 months',
    fee: '$250 / year',
    url: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  },
];

const TRAVEL_TOOLS = [
  {
    icon: '🛡️',
    name: 'SafetyWing Nomad Insurance',
    tagline: 'Medical & travel coverage in 180+ countries',
    badge: 'Most Flexible',
    highlight: 'From $56 / 4 weeks',
    bullets: ['Emergency medical & hospital', 'Trip interruption', 'Works while you travel'],
    url: 'https://safetywing.com/',
    color: '#4f46e5',
  },
  {
    icon: '📱',
    name: 'Airalo eSIM',
    tagline: 'Stay connected anywhere — no SIM swapping',
    badge: 'Best for Asia',
    highlight: 'From $5 / week',
    bullets: ['Data in 200+ countries', 'Instant activation', 'No roaming fees'],
    url: 'https://www.airalo.com/',
    color: '#0ea5e9',
  },
  {
    icon: '🎟️',
    name: 'Klook Activities',
    tagline: 'Tours, transfers & experiences at your destination',
    badge: 'Top in Asia',
    highlight: 'Save up to 30%',
    bullets: ['Airport transfers', 'Day tours & excursions', 'Attraction tickets'],
    url: 'https://www.klook.com/',
    color: '#f97316',
  },
];

export default function HomePage() {
  const [results, setResults]           = useState<CitySearchResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [progress, setProgress]         = useState(0);
  const [searchValues, setSearchValues] = useState<SearchValues | null>(null);
  const [agodaUpdating, setAgodaUpdating] = useState(false);
  const [agodaPrices, setAgodaPrices]   = useState<Record<string, AgodaPriceEntry> | null>(null);
  const [userCountry, setUserCountry]   = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserCountry().then(code => setUserCountry(code ?? 'unknown'));
  }, []);

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
            Find a cheaper hotel price
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
            <HotelGrid
              initialData={results}
              location={searchValues.location || searchValues.query}
              checkin={searchValues.checkin}
              checkout={searchValues.checkout}
              adults={searchValues.adults}
              agodaPrices={agodaPrices}
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

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-navy leading-tight">{s.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* US: credit card recommendations — non-US: travel tools */}
            {userCountry !== null && (
              <section className="mt-4">
                {userCountry === 'US' ? (
                  <>
                    <div className="mb-5">
                      <h2 className="text-xl font-bold text-navy">Stack points on top of savings</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Use the right travel card when you book — earn points that pay for future trips
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {CREDIT_CARDS.map(card => {
                        const exampleNight = 150;
                        const pts = exampleNight * card.hotelMult;
                        const val = ((pts * card.pointValue) / 100).toFixed(2);
                        return (
                          <div key={card.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            {/* Card artwork */}
                            <div className="relative mx-4 mt-4 rounded-xl overflow-hidden shadow-lg"
                              style={{ background: card.gradient, aspectRatio: '1.586' }}>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                              {/* Chip */}
                              <div className="absolute top-4 left-4 w-9 h-6 rounded-md"
                                style={{ background: 'linear-gradient(135deg,#d4a843,#f0cd7b,#b8872a)' }} />
                              {/* Contactless */}
                              <div className="absolute top-[18px] left-[54px] text-white/40 text-base leading-none">)))</div>
                              {/* Number */}
                              <div className="absolute bottom-8 left-4 text-white/70 text-[11px] tracking-[0.12em] font-mono">
                                •••• •••• •••• 4242
                              </div>
                              {/* Network */}
                              <div className="absolute bottom-3 right-4 text-white/90 text-xs font-bold tracking-wide">
                                {card.network}
                              </div>
                              {/* Bank */}
                              <div className="absolute bottom-3 left-4 text-white/55 text-[10px]">{card.bank}</div>
                            </div>

                            <div className="p-4 flex flex-col flex-1">
                              {/* Badge + name */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                                  {card.badge}
                                </span>
                              </div>
                              <h3 className="font-bold text-navy text-sm leading-tight">{card.name}</h3>

                              {/* Hotel points callout */}
                              <div className="mt-3 bg-teal/5 border border-teal/15 rounded-xl p-3">
                                <p className="text-[10px] font-semibold text-teal uppercase tracking-wide mb-1">
                                  On a ${exampleNight} hotel booking
                                </p>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-bold text-navy">{pts} {card.pointName}</span>
                                  <span className="text-xs text-gray-500">≈ ${val} extra back</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {card.hotelMult}× on hotels · stacks with Cheapstay savings
                                </p>
                              </div>

                              {/* Welcome bonus */}
                              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">
                                  Welcome bonus
                                </p>
                                <p className="text-sm font-bold text-amber-900">{card.bonus} <span className="font-normal text-amber-700 text-xs">({card.bonusValue})</span></p>
                                <p className="text-[11px] text-amber-600">after {card.bonusSpend}</p>
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 mt-4">
                                <span className="text-xs text-gray-400">{card.fee}</span>
                                <a href={card.url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-bold text-teal hover:underline transition-colors">
                                  Apply now →
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3 text-center">
                      We may earn a commission if you apply through our links, at no cost to you.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <h2 className="text-xl font-bold text-navy">Smart travel essentials</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Everything you need before and during your trip</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {TRAVEL_TOOLS.map(tool => (
                        <div key={tool.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                          {/* Icon header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ background: tool.color + '18' }}>
                              {tool.icon}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ color: tool.color, background: tool.color + '18' }}>
                                {tool.badge}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-bold text-navy text-sm leading-tight">{tool.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5 mb-3">{tool.tagline}</p>

                          {/* Highlight price */}
                          <div className="rounded-xl p-3 mb-3" style={{ background: tool.color + '0f' }}>
                            <p className="text-base font-bold" style={{ color: tool.color }}>{tool.highlight}</p>
                          </div>

                          {/* Bullets */}
                          <ul className="space-y-1.5 mb-4 flex-1">
                            {tool.bullets.map(b => (
                              <li key={b} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tool.color }} />
                                {b}
                              </li>
                            ))}
                          </ul>

                          <a href={tool.url} target="_blank" rel="noopener noreferrer"
                            className="mt-auto block text-center text-xs font-bold py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                            style={{ background: tool.color }}>
                            Learn more →
                          </a>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3 text-center">
                      We may earn a commission if you book through our links, at no cost to you.
                    </p>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

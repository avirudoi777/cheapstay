'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SearchBar, { type SearchValues } from '@/components/SearchBar';
import FlightSearchBar, { AIRPORTS } from '@/components/FlightSearchBar';
import HotelGrid from '@/components/HotelGrid';
import { searchCity, getSuggestions, getUserCountry } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import type { CitySearchResponse } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import VisaBanner from '@/components/VisaBanner';
import FlightResults from '@/components/FlightResults';

const DESTINATIONS = [
  { city: 'Bangkok',   country: 'Thailand',  flag: '🇹🇭', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=200&fit=crop&auto=format', savings: 35 },
  { city: 'Bali',      country: 'Indonesia', flag: '🇮🇩', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=200&fit=crop&auto=format', savings: 28 },
  { city: 'Tokyo',     country: 'Japan',     flag: '🇯🇵', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop&auto=format', savings: 22 },
  { city: 'Dubai',     country: 'UAE',       flag: '🇦🇪', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop&auto=format', savings: 25 },
  { city: 'Singapore', country: 'Singapore', flag: '🇸🇬', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=200&fit=crop&auto=format', savings: 20 },
  { city: 'Las Vegas', country: 'USA',       flag: '🇺🇸', img: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=400&h=200&fit=crop&auto=format', savings: 18 },
];

function defaultDates() {
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 7);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { checkin: fmt(checkin), checkout: fmt(checkout) };
}

const SAVINGS_STACK = [
  {
    icon: '🔍',
    title: 'Multi-source price comparison',
    desc: 'We search Agoda and Booking.com simultaneously and surface the lowest available rate for every hotel.',
    badge: 'Save up to 40%',
    featured: true,
  },
  {
    icon: '💸',
    title: 'Cashback on top',
    desc: 'TopCashback and Rakuten pay you extra % back on every booking automatically.',
    badge: 'Save 3–8% more',
    featured: false,
  },
  {
    icon: '💳',
    title: 'Right credit card',
    desc: '2–5x points on travel with Chase Sapphire, Amex Gold or Capital One Venture.',
    badge: 'Earn 2–5x points',
    featured: false,
  },
  {
    icon: '🏨',
    title: 'Check direct too',
    desc: 'Sometimes booking direct with the hotel beats every OTA price — we remind you.',
    badge: 'Sometimes cheapest',
    featured: false,
  },
];

const VPN_CARDS = [
  {
    name: 'NordVPN',
    price: '$3.99/mo',
    label: 'Top pick',
    featured: true,
    features: ['Thailand server', 'Fast & reliable', 'All devices', '30-day money back'],
    url: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=151019&url_id=902',
  },
  {
    name: 'ExpressVPN',
    price: '$6.67/mo',
    label: 'Also great',
    featured: false,
    features: ['Thailand server', 'Ultra-fast speeds', 'All devices', '30-day money back'],
    url: '#',
  },
  {
    name: 'Surfshark',
    price: '$2.49/mo',
    label: 'Budget pick',
    featured: false,
    features: ['Thailand server', 'Unlimited devices', 'Budget-friendly', '30-day money back'],
    url: '#',
  },
];

const CREDIT_CARDS = [
  {
    name: 'Chase Sapphire Preferred®',
    bank: 'Chase',
    cardImage: '/cards/chase-sapphire.png',
    badge: 'Best for Hotels',
    hotelMult: 2,
    pointValue: 1.25,
    pointName: 'points',
    bonus: '60,000 points',
    bonusValue: '≈ $750 in travel',
    bonusSpend: '$4,000 in 3 months',
    fee: '$95 / year',
    foreignFee: 'None',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    categories: ['hotels', 'no-fees'],
    advantages: ['2x on hotels & dining', 'No foreign transaction fees', 'Trip cancellation coverage'],
  },
  {
    name: 'Capital One Venture',
    bank: 'Capital One',
    cardImage: '/cards/venture.png',
    badge: 'Simplest Rewards',
    hotelMult: 2,
    pointValue: 1.0,
    pointName: 'miles',
    bonus: '75,000 miles',
    bonusValue: '≈ $750 in travel',
    bonusSpend: '$4,000 in 3 months',
    fee: '$95 / year',
    foreignFee: 'None',
    url: 'https://www.capitalone.com/credit-cards/venture/',
    categories: ['hotels', 'no-fees'],
    advantages: ['2x miles on everything', 'No foreign transaction fees', 'Transfer to 15+ partners'],
  },
  {
    name: 'Amex Gold Card',
    bank: 'American Express',
    cardImage: '/cards/amex-gold.png',
    badge: 'Biggest Bonus',
    hotelMult: 2,
    pointValue: 1.0,
    pointName: 'points',
    bonus: '60,000 points',
    bonusValue: '≈ $600 in travel',
    bonusSpend: '$6,000 in 6 months',
    fee: '$250 / year',
    foreignFee: 'None',
    url: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
    categories: ['flights', 'no-fees'],
    advantages: ['4x on restaurants worldwide', 'No foreign transaction fees', '$120 dining credit/year'],
  },
];

const FLIGHT_TIPS = [
  {
    icon: '✈️',
    title: 'Priceline 24hr free cancel',
    desc: 'US law gives you 24 hours to cancel any flight for free if booked 7+ days before departure. We highlight Priceline deals that qualify automatically.',
    tag: 'Auto-flagged in results',
    featured: true,
  },
  {
    icon: '📅',
    title: 'Best day to book',
    desc: 'Tuesday and Wednesday flights are typically 10–15% cheaper. Set your alerts for mid-week drops.',
    tag: 'Price calendar view',
    featured: false,
  },
  {
    icon: '🔔',
    title: 'Price drop alerts',
    desc: 'Set an alert for your route and we notify you when the price drops — so you book at the right moment.',
    tag: 'Coming soon',
    featured: false,
  },
  {
    icon: '🛡️',
    title: 'Card travel protections',
    desc: 'Chase and Amex cards include flight delay and trip cancellation coverage. We remind you which card to use at checkout.',
    tag: 'Smart card reminder',
    featured: false,
  },
];

const BLOG_POSTS = [
  {
    slug: 'same-hotel-two-prices',
    title: 'I booked the same Bangkok hotel twice — $240 on US IP, $141 on Thai IP. Here\'s exactly how I did it.',
    category: 'Booking hack',
    readTime: 8,
    featured: true,
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=400&fit=crop&auto=format',
  },
  {
    slug: 'three-cards-i-always-travel-with',
    title: 'The 3 cards I always travel with (and which one I use for each booking)',
    category: 'Credit cards',
    readTime: 5,
    featured: false,
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'priceline-24hr-cancellation',
    title: 'Priceline\'s 24-hour cancellation: the flight hack most people miss',
    category: 'Flights',
    readTime: 4,
    featured: false,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'tokyo-sixty-per-night',
    title: 'Tokyo on $60/night: the best value hotels I actually stayed in',
    category: 'Hotel reviews',
    readTime: 6,
    featured: false,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'when-booking-direct-beats-agoda',
    title: 'When booking direct beats Agoda — my rule of thumb',
    category: 'Booking hacks',
    readTime: 3,
    featured: false,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=240&fit=crop&auto=format',
  },
];

const TRAVEL_GEAR = [
  { name: 'Away Carry-On', tagline: 'Hard-shell carry-on with built-in battery', badge: 'Best Carry-On', price: 'From $295', color: '#0f766e', img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=240&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=away+carry+on+luggage&tag=cheapstay-20' },
  { name: 'Packing Cubes Set', tagline: 'Organize your bag and pack twice as much', badge: 'Traveler Favorite', price: 'From $25', color: '#7c3aed', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=240&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=packing+cubes+travel&tag=cheapstay-20' },
  { name: 'Universal Travel Adapter', tagline: 'Works in 150+ countries — one plug does all', badge: 'Must-Have', price: 'From $18', color: '#b45309', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=240&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=universal+travel+adapter+usb-c&tag=cheapstay-20' },
  { name: 'Noise-Cancelling Headphones', tagline: 'Survive long flights and noisy hotel lobbies', badge: 'Long-Haul Essential', price: 'From $149', color: '#1d4ed8', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=240&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=noise+cancelling+headphones+travel&tag=cheapstay-20' },
  { name: 'Travel Pharmacy Kit', tagline: 'Antidiarrheal, antacid, antihistamine — all in one', badge: 'Peace of Mind', price: 'From $15', color: '#dc2626', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=240&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=travel+medicine+kit+pharmacy&tag=cheapstay-20' },
  { name: 'Sleep Travel Kit', tagline: 'Eye mask, earplugs & neck pillow combo', badge: 'Sleep Better', price: 'From $20', color: '#475569', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=travel+sleep+kit+eye+mask+neck+pillow&tag=cheapstay-20' },
];

const BLOG_FILTERS = ['All posts', 'Booking hacks', 'Hotel reviews', 'Countries', 'Asia', 'Middle East', 'Europe', 'Credit cards', 'Flights'];

export default function HomePage() {
  const [results, setResults]           = useState<CitySearchResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [progress, setProgress]         = useState(0);
  const [searchValues, setSearchValues] = useState<SearchValues | null>(null);
  const [bookingDone, setBookingDone]   = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef  = useRef<HTMLDivElement>(null);
  const [passportCodes, setPassportCodes] = useState<string[]>([]);

  // Hero tab
  const [activeTab, setActiveTab] = useState<'hotel' | 'flight'>('hotel');

  // Flight search state
  const [flightSearch, setFlightSearch] = useState<{
    fromCode: string; toCode: string;
    fromName: string; toName: string;
    depart: string; ret: string; adults: number;
  } | null>(null);
  const flightResultsRef = useRef<HTMLDivElement>(null);

  function handleFlightSearch(from: string, to: string, depart: string, ret: string, adults = 1) {
    const codeMatch = (s: string) => s.match(/\(([A-Z]{3})\)/)?.[1] ?? '';
    const nameOf    = (s: string) => s.replace(/\s*\([A-Z]{3}\).*/, '').trim();

    // Try to resolve plain-text city names (e.g. "Beijing" with no code selected)
    function resolveAirport(raw: string): { code: string; name: string } | null {
      const code = codeMatch(raw);
      if (code) return { code, name: nameOf(raw) || code };
      const lq = raw.toLowerCase().trim();
      if (!lq) return null;
      const match = AIRPORTS.find(a =>
        a.name.toLowerCase().includes(lq) ||
        a.code.toLowerCase() === lq ||
        a.country.toLowerCase() === lq
      );
      return match ? { code: match.code, name: match.name } : null;
    }

    const fromRes = resolveAirport(from);
    const toRes   = resolveAirport(to);

    if (!fromRes || !toRes) {
      // Still unknown — open Aviasales with text search so user stays in the ecosystem
      const url = `https://www.aviasales.com/?marker=537802`;
      window.open(url, '_blank', 'noopener');
      return;
    }

    setFlightSearch({
      fromCode: fromRes.code, toCode: toRes.code,
      fromName: fromRes.name, toName: toRes.name,
      depart, ret, adults,
    });
    setTimeout(() => flightResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  // Credit card filter
  const [cardFilter, setCardFilter] = useState<'all' | 'hotels' | 'flights' | 'no-fees'>('all');

  // Blog filter
  const [blogFilter, setBlogFilter] = useState('All posts');

  // Savings calculator
  const [calcPrice, setCalcPrice]       = useState(150);
  const [calcNights, setCalcNights]     = useState(3);
  const [calcCashback, setCalcCashback] = useState(5);

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    getUserCountry().catch(() => null);
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await createClient()
        .from('user_profiles')
        .select('passport_nationality, passport_nationalities')
        .eq('id', data.user.id)
        .single();
      if (profile?.passport_nationalities?.length) {
        setPassportCodes(profile.passport_nationalities);
      } else if (profile?.passport_nationality) {
        setPassportCodes([profile.passport_nationality]);
      }
    });
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
    setBookingDone(false);
    setBookingCount(0);
    setSearchValues(v);
    startProgress();
    try {
      let searchLocation = v.location || v.query;

      if (v.mode === 'hotel' && !v.location) {
        const SKIP = new Set(['hotel', 'hotels', 'resort', 'resorts', 'inn', 'suites', 'suite', 'lodge', 'hostel', 'motel', 'boutique', 'palace']);
        const stripped = v.query.replace(/\s+by\s+.*/i, '').trim();
        const words = stripped.split(/\s+/).filter(w => w.length > 1 && !/^\d+$/.test(w) && !SKIP.has(w.toLowerCase()));
        const candidates = [
          words[words.length - 1],
          words.slice(-2).join(' '),
          words[words.length - 2],
          stripped,
        ].filter((t, i, a) => t && t.length > 1 && a.indexOf(t) === i);

        for (const term of candidates) {
          try {
            const sugs = await getSuggestions(term);
            const city = sugs.find(s => s.is_city)?.name || sugs.find(s => !s.is_city && s.city)?.city;
            if (city) { searchLocation = city; setSearchValues({ ...v, location: city }); break; }
          } catch { /* try next */ }
        }
      }

      const hotelNameParam = v.mode === 'hotel' ? v.query.replace(/\s+by\s+.*/i, '').trim() : undefined;
      const nights = Math.max(1, Math.round((new Date(v.checkout).getTime() - new Date(v.checkin).getTime()) / 86400000));
      analytics.search(searchLocation, v.checkin, v.checkout, nights, v.adults);

      const resp = await searchCity({
        location: searchLocation,
        checkin: v.checkin,
        checkout: v.checkout,
        adults: v.adults,
        offset: 0,
        limit: 20,
        force_refresh: v.forceRefresh,
        hotel_name: hotelNameParam,
        booking_only: false,
      });
      if (!resp.hotels?.length) {
        setError('No hotels found. Try different dates or destination.');
        return;
      }
      setResults(resp);
      setBookingDone(true);
      setBookingCount(resp.hotels?.length ?? 0);
      finishProgress();
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed.');
      finishProgress();
      setLoading(false);
    }
  }

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');
    try {
      const supabase = createClient();
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: newsletterEmail });
      if (error && !error.message.includes('duplicate')) throw error;
      setNewsletterStatus('done');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  }

  const filteredCards = CREDIT_CARDS.filter(c =>
    cardFilter === 'all' ? true :
    cardFilter === 'no-fees' ? c.foreignFee === 'None' :
    c.categories.includes(cardFilter)
  );

  const calcOriginal = calcPrice * calcNights;
  const calcThaiIP   = Math.round(calcOriginal * 0.70);
  const calcSaved    = calcOriginal - Math.round(calcThaiIP * (1 - calcCashback / 100));

  return (
    <>
      {/* Top progress bar */}
      {progress > 0 && (
        <div className="fixed top-14 left-0 right-0 h-1 z-50 bg-gray-100">
          <div className="h-full transition-all duration-200 rounded-full"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1D9E75, #1A73E8)' }} />
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#0a1628' }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/hero.jpg" alt="Hotel view" fill className="object-cover" priority />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Compare Agoda &amp; Booking.com — find the lowest price instantly
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Stop overpaying for hotels.<br className="hidden sm:block" />
            <span style={{ color: '#1D9E75' }}>Save up to 40%</span> by comparing the right prices.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-white/70 max-w-2xl mx-auto">
            We search Agoda and Booking.com simultaneously and show you the lowest available rate — no sign-up required.
          </p>

          {/* 3-step flow */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
            {[
              { n: '1', text: 'Search any destination worldwide' },
              { n: '2', text: 'Compare prices across Agoda & Booking.com' },
              { n: '3', text: 'Click Book → go straight to the cheapest option' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: '#1D9E75', color: 'white' }}>{step.n}</span>
                  {step.text}
                </div>
                {i < 2 && <span className="text-white/30 hidden sm:block mx-1">→</span>}
              </div>
            ))}
          </div>

          {/* Hotel / Flight tabs */}
          <div className="mt-8">
            <div className="flex gap-1 mb-4 justify-center">
              {(['hotel', 'flight'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-5 py-2 rounded-full text-sm font-bold transition-all"
                  style={activeTab === tab
                    ? { background: '#1D9E75', color: 'white' }
                    : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  {tab === 'hotel' ? '🏨 Hotels' : '✈️ Flights'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 text-left">
              {activeTab === 'hotel' ? (
                <SearchBar onSearch={handleSearch} loading={loading} />
              ) : (
                <FlightSearchBar onSearch={handleFlightSearch} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Savings bar ───────────────────────────────────────────────────── */}
      <div style={{ background: '#0f1f3d' }} className="py-3 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-center">
            {[
              'Agoda + Booking.com compared side by side',
              'Real-time prices, updated constantly',
              'No sign-up required',
              'Up to 40% cheaper than booking directly',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: '#1D9E75' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Flight results ────────────────────────────────────────────── */}
      {flightSearch && (
        <div ref={flightResultsRef}>
          <FlightResults
            fromCode={flightSearch.fromCode}
            toCode={flightSearch.toCode}
            fromName={flightSearch.fromName}
            toName={flightSearch.toName}
            depart={flightSearch.depart}
            ret={flightSearch.ret}
            adults={flightSearch.adults}
            onClear={() => setFlightSearch(null)}
            passportCodes={passportCodes}
          />
        </div>
      )}

      {/* ── Search results / destinations ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-teal border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-navy font-semibold text-base">Searching hotels in {searchValues?.location || searchValues?.query}…</p>
              <p className="text-gray-400 text-sm mt-1">Comparing prices across Agoda & Booking.com</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <p className="text-center text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl py-4 px-6 mt-4">{error}</p>
        )}

        {bookingDone && !loading && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-teal">{bookingCount} hotels found · Best prices</span>
            </div>
          </div>
        )}

        {results && searchValues && (
          <div ref={resultsRef} className="mt-2">
            {passportCodes.length > 0 && (
              <VisaBanner
                passportCodes={passportCodes}
                city={searchValues.location || searchValues.query}
              />
            )}
            <HotelGrid
              initialData={results}
              location={searchValues.location || searchValues.query}
              checkin={searchValues.checkin}
              checkout={searchValues.checkout}
              adults={searchValues.adults}
              agodaPrices={null}
            />
          </div>
        )}

        {!results && !loading && (
          <section className="py-8">
            <h2 className="text-xl font-bold text-navy mb-1">Popular Destinations</h2>
            <p className="text-sm text-gray-400 mb-4">Average savings vs. booking on US IP</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {DESTINATIONS.map(d => (
                <button key={d.city} onClick={() => {
                  analytics.destinationClick(d.city);
                  const { checkin, checkout } = defaultDates();
                  handleSearch({ query: d.city, location: d.city, mode: 'city', checkin, checkout, adults: 2, rooms: 1, forceRefresh: false });
                }}
                  className="relative overflow-hidden rounded-2xl h-28 sm:h-32 group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 text-left">
                  <img src={d.img} alt={d.city} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  {/* Savings badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: '#1D9E75', color: 'white' }}>
                    -{d.savings}%
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                    <div className="text-base leading-none mb-0.5">{d.flag}</div>
                    <div className="text-sm font-bold leading-tight">{d.city}</div>
                    <div className="text-[10px] text-white/70">{d.country}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── How it works — 3-layer savings stack ─────────────────────────── */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-navy">Stack 3 layers of savings on every booking</h2>
            <p className="text-gray-400 text-sm mt-2">Most travelers leave all three on the table. You don&apos;t have to.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAVINGS_STACK.map((card, i) => (
              <div key={i} className={`rounded-2xl p-5 flex flex-col ${card.featured ? 'border-2 shadow-lg' : 'bg-white border border-gray-100 shadow-sm'}`}
                style={card.featured ? { borderColor: '#1D9E75', background: '#f0fdf9' } : {}}>
                <div className="text-3xl mb-3">{card.icon}</div>
                {card.featured && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-2"
                    style={{ background: '#1D9E75', color: 'white' }}>Featured</span>
                )}
                <h3 className="font-bold text-navy text-sm mb-1">{card.title}</h3>
                <p className="text-xs text-gray-500 flex-1">{card.desc}</p>
                <div className="mt-3 text-xs font-bold px-2.5 py-1 rounded-full self-start"
                  style={{ background: card.featured ? '#1D9E75' : '#E1F5EE', color: card.featured ? 'white' : '#0F6E56' }}>
                  {card.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Savings calculator ────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-navy">See how much you could save</h2>
            <p className="text-gray-400 text-sm mt-2">Adjust the sliders to estimate your savings</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-navy">Hotel price per night</label>
                <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>${calcPrice}</span>
              </div>
              <input type="range" min={50} max={500} step={10} value={calcPrice}
                onChange={e => setCalcPrice(Number(e.target.value))}
                className="w-full accent-teal" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>$50</span><span>$500</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-navy">Number of nights</label>
                <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>{calcNights} nights</span>
              </div>
              <input type="range" min={1} max={14} step={1} value={calcNights}
                onChange={e => setCalcNights(Number(e.target.value))}
                className="w-full accent-teal" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>1 night</span><span>14 nights</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-navy">Cashback rate</label>
                <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>{calcCashback}%</span>
              </div>
              <input type="range" min={2} max={10} step={1} value={calcCashback}
                onChange={e => setCalcCashback(Number(e.target.value))}
                className="w-full accent-teal" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>2%</span><span>10%</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <div className="text-xs text-gray-400 mb-1">Original price</div>
                <div className="text-lg font-bold text-navy">${calcOriginal}</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#E1F5EE' }}>
                <div className="text-xs mb-1" style={{ color: '#0F6E56' }}>With CheapStay</div>
                <div className="text-lg font-bold" style={{ color: '#1D9E75' }}>${calcThaiIP}</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#fff7ed' }}>
                <div className="text-xs text-orange-500 mb-1">Total you save</div>
                <div className="text-lg font-bold text-orange-600">${calcSaved}</div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            Already booked a trip?{' '}
            <Link href="/overpaid-calculator" className="text-teal font-semibold hover:underline">
              See how much you overpaid →
            </Link>
          </p>
        </div>
      </section>

      {/* ── VPN section ───────────────────────────────────────────────────── */}
      <section style={{ background: '#0a1628' }} className="py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-white">Browse privately & securely while traveling</h2>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              A VPN protects your connection on hotel & airport WiFi. Takes 5 minutes to set up, works on every device.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VPN_CARDS.map(vpn => (
              <div key={vpn.name} className={`rounded-2xl p-5 flex flex-col ${vpn.featured ? 'border-2' : 'border border-white/10'}`}
                style={{ background: vpn.featured ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.05)', borderColor: vpn.featured ? '#1D9E75' : undefined }}>
                {vpn.featured && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-3"
                    style={{ background: '#1D9E75', color: 'white' }}>Top pick</span>
                )}
                <h3 className="font-extrabold text-white text-lg mb-0.5">{vpn.name}</h3>
                <p className="text-sm font-bold mb-4" style={{ color: '#1D9E75' }}>{vpn.price}</p>
                <ul className="space-y-2 flex-1 mb-5">
                  {vpn.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ color: '#1D9E75' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={vpn.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => analytics.vpnAffiliateClick(vpn.name.toLowerCase().replace(/\s+/g, ''), 'homepage_vpn_section')}
                  className="block text-center py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                  style={vpn.featured
                    ? { background: '#1D9E75', color: 'white' }
                    : { background: 'transparent', color: '#1D9E75', border: '1px solid #1D9E75' }}>
                  Get {vpn.name} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Credit cards ─────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-navy">Stack points on top of savings</h2>
              <p className="text-sm text-gray-400 mt-1">Use the right travel card when you book — earn points that pay for future trips</p>
            </div>
            <span className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
              🇺🇸 Recommended for US citizens
            </span>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {([['all', 'All cards'], ['hotels', 'Best for hotels'], ['flights', 'Best for flights'], ['no-fees', 'No foreign fees']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setCardFilter(id)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={cardFilter === id
                  ? { background: '#1D9E75', color: 'white' }
                  : { background: '#f3f4f6', color: '#374151' }}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {filteredCards.map(card => {
              const exampleNight = 150;
              const pts = exampleNight * card.hotelMult;
              const val = ((pts * card.pointValue) / 100).toFixed(2);
              return (
                <div key={card.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-center bg-gray-50 px-8 py-6">
                    <img src={card.cardImage} alt={card.name}
                      className="w-full max-w-[260px] rounded-xl shadow-xl object-contain" style={{ aspectRatio: '1.586' }} />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-2 py-0.5 rounded-full self-start mb-1">{card.badge}</span>
                    <h3 className="font-bold text-navy text-sm leading-tight mb-1">{card.name}</h3>

                    <div className="mt-2 bg-teal/5 border border-teal/15 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-teal uppercase tracking-wide mb-1">On a ${exampleNight} hotel booking</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-navy">{pts} {card.pointName}</span>
                        <span className="text-xs text-gray-500">≈ ${val} extra back</span>
                      </div>
                    </div>

                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Welcome bonus</p>
                      <p className="text-sm font-bold text-amber-900">{card.bonus} <span className="font-normal text-amber-700 text-xs">({card.bonusValue})</span></p>
                    </div>

                    <ul className="mt-3 space-y-1 flex-1">
                      {card.advantages.map(a => (
                        <li key={a} className="flex items-center gap-2 text-xs text-gray-600">
                          <span style={{ color: '#1D9E75' }}>✓</span>{a}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                      <span className="text-xs text-gray-400">{card.fee} · Foreign fee: <span className="text-green-600 font-semibold">{card.foreignFee}</span></span>
                      <a href={card.url} target="_blank" rel="noopener noreferrer"
                        onClick={() => analytics.creditCardClick(card.name, card.bank)}
                        className="text-xs font-bold text-teal hover:underline">Apply now →</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 text-center">We may earn a commission if you apply through our links, at no cost to you.</p>
        </div>
      </section>

      {/* ── Flight tips ───────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-navy">Book flights smarter too</h2>
            <p className="text-gray-400 text-sm mt-2">The same hacks that work on hotels apply to flights — plus a few extras.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FLIGHT_TIPS.map((tip, i) => (
              <article key={i} className={`rounded-2xl p-5 flex flex-col ${tip.featured ? 'border-2 shadow-md' : 'bg-white border border-gray-100 shadow-sm'}`}
                style={tip.featured ? { borderColor: '#1D9E75', background: '#f0fdf9' } : {}}>
                <div className="text-2xl mb-3">{tip.icon}</div>
                <h3 className="font-bold text-navy text-sm mb-2">{tip.title}</h3>
                <p className="text-xs text-gray-500 flex-1">{tip.desc}</p>
                <span className="mt-3 text-[10px] font-bold px-2.5 py-1 rounded-full self-start"
                  style={{ background: '#E1F5EE', color: '#0F6E56' }}>{tip.tag}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog section ─────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-navy">Real tips from a full-time traveler</h2>
            <p className="text-gray-400 text-sm mt-2">50+ countries, hundreds of hotels — every article is written from lived experience, not theory.</p>
          </div>

          {/* Author bar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-gray-50 rounded-2xl p-5 mb-8">
            <Image src="/avi-profile.jpg" alt="Avi" width={48} height={48}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-navy text-sm">Avi — Founder &amp; full-time traveler</p>
              <p className="text-xs text-gray-400 mt-0.5 max-w-lg">Been living in hotels across Asia, Middle East &amp; Europe for years. CheapStay started because I got tired of paying too much.</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
                {['50+ countries', '500+ hotels stayed', 'Saved $40k+ on bookings'].map(s => (
                  <span key={s} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#0F6E56' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Filter tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {BLOG_FILTERS.map(f => (
              <button key={f} onClick={() => setBlogFilter(f)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={blogFilter === f
                  ? { background: '#1D9E75', color: 'white' }
                  : { background: '#f3f4f6', color: '#374151' }}>
                {f}
              </button>
            ))}
          </div>

          {/* Blog posts grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Featured post — spans 2 cols */}
            <article className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group">
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img src={BLOG_POSTS[0].img} alt={BLOG_POSTS[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#1D9E75', color: 'white' }}>{BLOG_POSTS[0].category}</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-navy text-base leading-snug group-hover:text-teal transition-colors">{BLOG_POSTS[0].title}</h3>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{BLOG_POSTS[0].readTime} min read</span>
                  <Link href={`/blog/${BLOG_POSTS[0].slug}`} className="text-xs font-bold text-teal hover:underline">Read more →</Link>
                </div>
              </div>
            </article>

            {/* Regular posts */}
            {BLOG_POSTS.slice(1).map(post => (
              <article key={post.slug} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group">
                <div className="relative h-36 overflow-hidden">
                  <img src={post.img} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#1D9E75', color: 'white' }}>{post.category}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-navy text-xs leading-snug flex-1 group-hover:text-teal transition-colors">{post.title}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{post.readTime} min read</span>
                    <Link href={`/blog/${post.slug}`} className="text-[10px] font-bold text-teal hover:underline">Read →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-navy text-lg mb-1">Get the weekly travel hack</h3>
            <p className="text-sm text-gray-400 mb-5">No spam. Unsubscribe anytime.</p>
            {newsletterStatus === 'done' ? (
              <p className="text-sm font-semibold" style={{ color: '#1D9E75' }}>You&apos;re in! Check your inbox.</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                <button type="submit" disabled={newsletterStatus === 'loading'}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#1D9E75' }}>
                  {newsletterStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
            )}
            {newsletterStatus === 'error' && <p className="text-xs text-red-500 mt-2">Something went wrong. Try again.</p>}
          </div>
        </div>
      </section>

      {/* ── Travel gear ───────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-navy">Travel gear worth packing</h2>
              <p className="text-sm text-gray-400 mt-0.5">Tried-and-tested items that frequent travelers actually use</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 whitespace-nowrap">🛒 Amazon picks</span>
              <Link href="/shop" className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal border border-teal/20 whitespace-nowrap hover:bg-teal/20 transition-colors">View full shop →</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TRAVEL_GEAR.map(item => (
              <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                onClick={() => analytics.travelGearClick(item.name, item.badge)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="relative h-28 bg-gray-100 overflow-hidden">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full self-start mb-1.5"
                    style={{ color: item.color, background: item.color + '18' }}>{item.badge}</span>
                  <h3 className="font-bold text-navy text-xs leading-tight mb-1 group-hover:text-teal transition-colors">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 leading-snug mb-2 flex-1">{item.tagline}</p>
                  <div className="text-xs font-bold" style={{ color: item.color }}>{item.price}</div>
                  <div className="text-[10px] text-gray-400 mt-1">View on Amazon →</div>
                </div>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 text-center">
            As an Amazon Associate we earn from qualifying purchases, at no extra cost to you.
          </p>
        </div>
      </section>

      {/* ── Consult CTA ──────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl overflow-hidden" style={{ background: '#0a1628' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {/* Photo side */}
              <div className="relative h-56 sm:h-auto min-h-[220px]">
                <Image
                  src="/avi-singapore.jpg"
                  alt="Avi traveling"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent, #0a1628)' }} />
                {/* Profile pill overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/30">
                    <Image src="/avi-profile.jpg" alt="Avi" fill className="object-cover object-top" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold leading-none">Avi</p>
                    <p className="text-white/50 text-[10px]">50+ countries · Full-time traveler</p>
                  </div>
                </div>
              </div>
              {/* Text side */}
              <div className="p-7 sm:p-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-4 w-fit"
                  style={{ background: 'rgba(29,158,117,0.2)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>
                  1-on-1 Consultation
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2 leading-snug">
                  Need help planning your trip?
                </h2>
                <p className="text-white/50 text-sm mb-5 leading-relaxed">
                  Book a 1-hour call with me. Route planning, hotel picks, visa tips, and how to save 30–40% on every booking.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {['Route planning', 'Hotel picks', 'Visa advice', 'Booking hacks'].map(tag => (
                    <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/consult"
                  className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white w-fit transition-opacity hover:opacity-90"
                  style={{ background: '#1D9E75' }}>
                  Book a call — $49 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Affiliate disclosure ──────────────────────────────────────────── */}
      <div className="text-center py-4 px-4 text-[11px] text-gray-400">
        CheapStay earns a small commission when you book through our links — at no extra cost to you. This is how we keep the site free.
      </div>
    </>
  );
}

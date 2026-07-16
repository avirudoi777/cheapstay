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
import DuffelStaysSection from '@/components/DuffelStaysSection';

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
  // ExpressVPN/Surfshark: re-add once affiliate programs approved
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
  {
    slug: 'bangkok-vs-chiang-mai',
    title: 'Bangkok vs Chiang Mai: which is actually cheaper for long stays?',
    category: 'Destinations',
    readTime: 7,
    featured: false,
    img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'japan-budget-travel',
    title: 'Japan on a budget: the complete cost breakdown for 2 weeks',
    category: 'Destinations',
    readTime: 8,
    featured: false,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'best-months-fly-southeast-asia',
    title: 'The best months to fly to Southeast Asia — and the ones to avoid',
    category: 'Flights',
    readTime: 6,
    featured: false,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'jakarta-underrated-city',
    title: "Jakarta: Southeast Asia's most underrated city — and I'm writing this from there",
    category: 'Destinations',
    readTime: 7,
    featured: false,
    img: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'long-flight-ideas',
    title: '14 things to do on a long flight — including a few that might actually improve your life',
    category: 'Travel hacks',
    readTime: 8,
    featured: false,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=240&fit=crop&auto=format',
  },
  {
    slug: 'anytime-fitness-global-hack',
    title: 'The Anytime Fitness hack every traveler should know: sign up cheap, train anywhere',
    category: 'Travel hacks',
    readTime: 5,
    featured: false,
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=240&fit=crop&auto=format',
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

// ── Hotel source toggle — change to 'liteapi' to restore Agoda/Booking.com ──
const HOTEL_SOURCE: 'duffel' | 'liteapi' = 'liteapi';

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
  const [expiringPassports, setExpiringPassports] = useState<{ country: string; expiry: string; expired: boolean }[]>([]);
  const [passportBannerDismissed, setPassportBannerDismissed] = useState(false);

  // Hero tab
  const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'car'>('flight');

  // Flight search state
  const [flightSearch, setFlightSearch] = useState<{
    fromCode: string; toCode: string;
    fromName: string; toName: string;
    depart: string; ret: string; adults: number; children: number; infants: number;
    cabinClass: string;
  } | null>(null);
  const flightResultsRef = useRef<HTMLDivElement>(null);

  function handleFlightSearch(from: string, to: string, depart: string, ret: string, adults = 1, children = 0, infants = 0, cabinClass = 'economy') {
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
      depart, ret, adults, children, infants, cabinClass,
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
        .select('passport_nationality, passport_nationalities, traveler_profile')
        .eq('id', data.user.id)
        .single();
      if (profile?.passport_nationalities?.length) {
        setPassportCodes(profile.passport_nationalities);
      } else if (profile?.passport_nationality) {
        setPassportCodes([profile.passport_nationality]);
      }
      // Check passport expiry dates from traveler_profile
      const passports: { country: string; expiry: string }[] = (profile?.traveler_profile as { passports?: { country: string; expiry: string }[] } | null)?.passports ?? [];
      const now = new Date();
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      const flagged = passports.filter(p => {
        if (!p.expiry) return false;
        const exp = new Date(p.expiry + 'T12:00:00');
        return exp <= sixMonths;
      }).map(p => ({
        country: p.country,
        expiry: p.expiry,
        expired: new Date(p.expiry + 'T12:00:00') < now,
      }));
      if (flagged.length > 0) setExpiringPassports(flagged);
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
    setError('');
    setSearchValues(v);

    if (HOTEL_SOURCE === 'duffel') {
      // DuffelStaysSection handles its own search — just set params and scroll
      const nights = Math.max(1, Math.round((new Date(v.checkout).getTime() - new Date(v.checkin).getTime()) / 86400000));
      analytics.search(v.location || v.query, v.checkin, v.checkout, nights, v.adults);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      return;
    }

    setLoading(true);
    setResults(null);
    setBookingDone(false);
    setBookingCount(0);
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

  const calcOriginal  = calcPrice * calcNights;
  const calcThaiIP    = Math.round(calcOriginal * 0.70);
  const calcCashbackAmt = Math.round(calcThaiIP * calcCashback / 100);
  const calcNetCost   = calcThaiIP - calcCashbackAmt;
  const calcSaved     = calcOriginal - calcNetCost;

  return (
    <>
      {/* Top progress bar */}
      {progress > 0 && (
        <div className="fixed top-14 left-0 right-0 h-1 z-50 bg-surface-container">
          <div className="h-full bg-primary transition-all duration-200 rounded-full"
            style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-[85vh] min-h-[560px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-pro-navy/50 z-10" />
          <Image src="/hero.jpg" alt="Travel" fill className="object-cover" priority />
        </div>
        <div className="relative z-20 w-full max-w-container-max mx-auto px-gutter text-white">
          <div className="max-w-3xl space-y-stack-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-blue/20 border border-sky-blue/30 backdrop-blur-md rounded-full text-sky-blue font-label-bold text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Visa, vaccine &amp; layover info — before you book
            </div>

            <h1 className="font-display-lg text-display-lg leading-tight">
              Know what you need before you fly. <br />
              <span className="text-sky-blue">Book it once you do.</span>
            </h1>

            <p className="font-body-lg text-body-lg text-white/90 max-w-xl">
              We check passport, visa, and vaccine requirements for your route — plus real layover and airport tips — then let you book the flight right here.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-white/80 font-metadata text-sm">
              {[
                { n: '1', text: 'Search your route' },
                { n: '2', text: 'See exactly what you need' },
                { n: '3', text: 'Book directly — no extra tabs' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white flex-shrink-0">{step.n}</span>
                    {step.text}
                  </div>
                  {i < 2 && <span className="material-symbols-outlined opacity-50 text-lg hidden sm:block">arrow_forward</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Search widget — floating over hero ───────────────────────────── */}
      <section className="relative z-30 -mt-16 sm:-mt-20 px-4 sm:px-gutter max-w-container-max mx-auto">
        <div className="search-glass concierge-shadow rounded-xl p-5 sm:p-8 border border-border-subtle">
          <div className="flex gap-4 mb-6 border-b border-border-subtle">
            {(['flight', 'hotel', 'car'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 font-label-bold text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}>
                <span className="material-symbols-outlined text-lg">
                  {tab === 'hotel' ? 'hotel' : tab === 'flight' ? 'flight' : 'directions_car'}
                </span>
                {tab === 'hotel' ? 'Hotels' : tab === 'flight' ? 'Flights' : 'Cars'}
              </button>
            ))}
          </div>

          <div className="text-left">
            {activeTab === 'hotel' ? (
              <SearchBar onSearch={handleSearch} loading={loading} />
            ) : activeTab === 'flight' ? (
              <FlightSearchBar onSearch={handleFlightSearch} />
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-on-surface-variant mb-1">Compare rental cars from major companies worldwide.</p>
                <p className="text-xs text-on-surface-variant/70 mb-5">Enterprise, Hertz, Avis, Sixt and more — pickup at airport or city.</p>
                <a href="https://getrentacar.tpo.lv/Xdm1FCMq" target="_blank" rel="noopener noreferrer"
                  className="inline-block px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-primary transition-opacity hover:opacity-90">
                  Search rental cars →
                </a>
                <p className="text-[11px] text-on-surface-variant/70 mt-3">Opens GetRentacar.com · Affiliate link</p>
              </div>
            )}
          </div>

          {/* Contextual note */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dashed border-border-subtle text-metadata">
            <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
              <span className="flex items-center gap-1 text-savings-green"><span className="material-symbols-outlined text-[18px]">verified</span> Visa &amp; vaccine checked</span>
              <span className="flex items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">airplane_ticket</span> Direct booking, no redirect</span>
            </div>
            <div className="bg-surface-container px-4 py-2 rounded-full text-on-surface-variant font-medium">
              <span className="text-primary font-bold">Pro Tip:</span> Hotel prices from a Thai IP — up to 40% less
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/consult"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-border-subtle hover:border-primary hover:text-primary transition-all">
              <span className="material-symbols-outlined text-lg">support_agent</span> Or talk to me directly →
            </Link>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Route planning, visa tips, best prices. 1-on-1 with Avi — $49.
            </p>
          </div>
        </div>
      </section>

      {/* ── Passport expiry warning banner ───────────────────────────── */}
      {expiringPassports.length > 0 && !passportBannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${expiringPassports.some(p => p.expired) ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <span className="text-lg flex-shrink-0 mt-0.5">{expiringPassports.some(p => p.expired) ? '🚨' : '⚠️'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${expiringPassports.some(p => p.expired) ? 'text-red-700' : 'text-amber-700'}`}>
                {expiringPassports.some(p => p.expired) ? 'Passport expired' : 'Passport expiring soon'}
              </p>
              <p className={`text-xs mt-0.5 ${expiringPassports.some(p => p.expired) ? 'text-red-600' : 'text-amber-600'}`}>
                {expiringPassports.map(p => `${p.country} (${p.expiry})`).join(', ')} —{' '}
                {expiringPassports.some(p => p.expired)
                  ? 'you may not be able to board. '
                  : 'many countries require 6+ months validity. '}
                <Link href="/account" className="underline font-semibold">Update in your profile →</Link>
              </p>
            </div>
            <button onClick={() => setPassportBannerDismissed(true)} className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0 mt-0.5">×</button>
          </div>
        </div>
      )}

      {/* ── Flight results ────────────────────────────────────────────── */}
      {flightSearch && (
        <div ref={flightResultsRef}>
          <FlightResults
            key={`${flightSearch.fromCode}-${flightSearch.toCode}-${flightSearch.depart}-${flightSearch.ret}-${flightSearch.adults}-${flightSearch.children}-${flightSearch.infants}-${flightSearch.cabinClass}`}
            fromCode={flightSearch.fromCode}
            toCode={flightSearch.toCode}
            fromName={flightSearch.fromName}
            toName={flightSearch.toName}
            depart={flightSearch.depart}
            ret={flightSearch.ret}
            adults={flightSearch.adults}
            children={flightSearch.children}
            infants={flightSearch.infants}
            cabinClass={flightSearch.cabinClass}
            onClear={() => setFlightSearch(null)}
            passportCodes={passportCodes}
          />
        </div>
      )}

      {/* ── Search results / destinations ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">

        {/* Duffel hotel results — active when HOTEL_SOURCE === 'duffel' */}
        {HOTEL_SOURCE === 'duffel' && searchValues && (
          <div ref={resultsRef} className="mt-2">
            {passportCodes.length > 0 && (
              <VisaBanner
                passportCodes={passportCodes}
                city={searchValues.location || searchValues.query}
              />
            )}
            <DuffelStaysSection
              location={searchValues.location || searchValues.query}
              checkin={searchValues.checkin}
              checkout={searchValues.checkout}
              adults={searchValues.adults}
              isPrimary
            />
          </div>
        )}

        {/* Liteapi (Agoda / Booking.com) results — active when HOTEL_SOURCE === 'liteapi' */}
        {HOTEL_SOURCE === 'liteapi' && (
          <>
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
          </>
        )}

        {!searchValues && !loading && (
          <section className="py-10">
            <div className="mb-stack-md">
              <h2 className="font-headline-lg text-headline-lg text-pro-navy">Popular Destinations</h2>
              <p className="font-body-md text-on-surface-variant">Average savings vs. booking on US IP</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {DESTINATIONS.map(d => (
                <button key={d.city} onClick={() => {
                  analytics.destinationClick(d.city);
                  const { checkin, checkout } = defaultDates();
                  handleSearch({ query: d.city, location: d.city, mode: 'city', checkin, checkout, adults: 2, rooms: 1, forceRefresh: false });
                }}
                  className="group relative overflow-hidden rounded-xl h-32 sm:h-40 bg-pro-navy concierge-shadow transition-all hover:-translate-y-1 text-left cursor-pointer">
                  <img src={d.img} alt={d.city} className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-2 right-2 bg-savings-green text-white text-[10px] font-bold px-2 py-1 rounded-full">-{d.savings}%</div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="flex items-center gap-1 text-[11px] opacity-80"><span className="material-symbols-outlined text-[13px]">location_on</span> {d.country}</div>
                    <div className="font-headline-md text-[16px] sm:text-[18px]">{d.city}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── What CheapStay does ───────────────────────────────────────────── */}
      <section className="bg-surface-container-low py-section-gap px-4 sm:px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-pro-navy">Everything you need, before and after you book</h2>
            <p className="font-body-md text-on-surface-variant">Flights, cars, visa requirements, and a real human if you need one.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'flight',
                iconColor: 'text-primary',
                iconBg: 'bg-primary/10',
                iconBgHover: 'group-hover:bg-primary',
                title: 'Book flights',
                desc: 'Search and book flights directly — seats, baggage, and cancellation policy all shown before you pay. No redirects.',
                badge: 'Live now',
                href: '/',
                featured: true,
              },
              {
                icon: 'directions_car',
                iconColor: 'text-on-secondary-container',
                iconBg: 'bg-on-secondary-container/10',
                iconBgHover: 'group-hover:bg-on-secondary-container',
                title: 'Rent a car',
                desc: 'Compare rental car prices from major companies worldwide. Pick up at the airport or in the city.',
                badge: 'Live now',
                href: '/cars',
                featured: false,
              },
              {
                icon: 'description',
                iconColor: 'text-sky-blue',
                iconBg: 'bg-sky-blue/10',
                iconBgHover: 'group-hover:bg-sky-blue',
                title: 'Visa & entry requirements',
                desc: 'Check what you need before you fly — visa rules, vaccine certificates, and arrival tips for your destination.',
                badge: '8 countries covered',
                href: '/fly-to',
                featured: false,
              },
              {
                icon: 'support_agent',
                iconColor: 'text-alert-orange',
                iconBg: 'bg-alert-orange/10',
                iconBgHover: 'group-hover:bg-alert-orange',
                title: 'Book a call with Avi',
                desc: 'Want to save 30–40% on your next hotel? I\'ll walk you through Thai IP pricing, cashback stacking, and the right credit card. 1-on-1, 45 minutes, $49.',
                badge: '$49 · Book now',
                href: '/consult',
                featured: false,
              },
            ].map((card, i) => (
              <a key={i} href={card.href}
                className="group p-8 bg-white rounded-xl border border-border-subtle concierge-shadow hover:border-primary transition-all flex flex-col">
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center ${card.iconColor} mb-6 ${card.iconBgHover} group-hover:text-white transition-all`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                {card.featured && (
                  <div className="inline-block px-2 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded mb-4 self-start">FEATURED</div>
                )}
                <h3 className="font-headline-md text-[18px] mb-3">{card.title}</h3>
                <p className="font-body-md text-on-surface-variant text-sm leading-relaxed mb-6 flex-1">{card.desc}</p>
                <span className={`${card.iconColor} font-label-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all`}>
                  {card.badge} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── VPN section ───────────────────────────────────────────────────── */}
      <section className="max-w-container-max mx-auto px-4 sm:px-gutter py-section-gap">
        <div className="bg-pro-navy rounded-2xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          <div className="relative z-10 w-full md:w-1/2 space-y-6">
            <div className="inline-block px-3 py-1 bg-savings-green/20 text-savings-green font-label-bold rounded-full text-xs">TOP PICK FOR TRAVELERS</div>
            <h2 className="font-display-lg text-[32px] sm:text-[40px] text-white leading-tight">Browse privately &amp; securely while traveling</h2>
            <p className="font-body-md text-white/70">A VPN protects your connection on hotel &amp; airport WiFi. Takes 5 minutes to set up, works on every device.</p>
          </div>
          <div className="relative z-10 w-full md:w-1/2 flex justify-center">
            {VPN_CARDS.map(vpn => (
              <div key={vpn.name} className="bg-surface-container-lowest p-8 rounded-xl w-full max-w-sm border border-white/10 concierge-shadow">
                {vpn.featured && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-savings-green/20 text-savings-green mb-3">Top pick</span>
                )}
                <div className="flex items-center justify-between mb-6">
                  <div className="font-headline-md text-pro-navy text-lg">{vpn.name}</div>
                  <div className="text-primary font-bold">{vpn.price}</div>
                </div>
                <ul className="space-y-2 mb-6">
                  {vpn.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-savings-green text-[16px]">check_circle</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={vpn.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => analytics.vpnAffiliateClick(vpn.name.toLowerCase().replace(/\s+/g, ''), 'homepage_vpn_section')}
                  className="block text-center py-3 rounded-lg font-label-bold text-sm bg-primary text-white hover:shadow-lg transition-all">
                  Get {vpn.name} →
                </a>
                <p className="text-center text-metadata text-on-surface-variant mt-4">Save 68% + 3 months extra</p>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        </div>
      </section>

      {/* ── Credit cards ─────────────────────────────────────────────────── */}
      <section className="bg-surface py-section-gap px-4 sm:px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-pro-navy">Stack points on top of savings</h2>
              <p className="font-body-md text-on-surface-variant mt-1">Use the right travel card when you book — earn points that pay for future trips</p>
            </div>
            <span className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-blue/10 text-tertiary border border-sky-blue/20 whitespace-nowrap">
              🇺🇸 Recommended for US citizens
            </span>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {([['all', 'All cards'], ['hotels', 'Best for hotels'], ['flights', 'Best for flights'], ['no-fees', 'No foreign fees']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setCardFilter(id)}
                className={`px-4 py-1.5 rounded-full font-label-bold text-xs transition-all ${
                  cardFilter === id ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {filteredCards.map(card => {
              const exampleNight = 150;
              const pts = exampleNight * card.hotelMult;
              const val = ((pts * card.pointValue) / 100).toFixed(2);
              return (
                <div key={card.name} className="bg-white rounded-xl border border-border-subtle concierge-shadow overflow-hidden flex flex-col">
                  <div className="flex items-center justify-center bg-surface-container-low px-8 py-6">
                    <img src={card.cardImage} alt={card.name}
                      className="w-full max-w-[260px] rounded-xl shadow-xl object-contain" style={{ aspectRatio: '1.586' }} />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mb-1">{card.badge}</span>
                    <h3 className="font-headline-md text-[16px] leading-tight mb-1">{card.name}</h3>

                    <div className="mt-2 bg-primary/5 border border-primary/15 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">On a ${exampleNight} hotel booking</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-pro-navy">{pts} {card.pointName}</span>
                        <span className="text-xs text-on-surface-variant">≈ ${val} extra back</span>
                      </div>
                    </div>

                    <div className="mt-2 bg-alert-orange/5 border border-alert-orange/15 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-alert-orange uppercase tracking-wide mb-0.5">Welcome bonus</p>
                      <p className="text-sm font-bold text-pro-navy">{card.bonus} <span className="font-normal text-on-surface-variant text-xs">({card.bonusValue})</span></p>
                    </div>

                    <ul className="mt-3 space-y-1 flex-1">
                      {card.advantages.map(a => (
                        <li key={a} className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-savings-green text-[16px]">check</span>{a}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                      <span className="text-xs text-on-surface-variant">{card.fee} · Foreign fee: <span className="text-savings-green font-semibold">{card.foreignFee}</span></span>
                      <a href={card.url} target="_blank" rel="noopener noreferrer"
                        onClick={() => analytics.creditCardClick(card.name, card.bank)}
                        className="text-xs font-bold text-primary hover:underline">Apply now →</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-on-surface-variant/60 mt-3 text-center">We may earn a commission if you apply through our links, at no cost to you.</p>
        </div>
      </section>

      {/* ── Flight tips ───────────────────────────────────────────────────── */}
      <section className="bg-surface-container-low py-section-gap px-4 sm:px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-headline-lg text-headline-lg text-pro-navy">Book flights smarter too</h2>
            <p className="font-body-md text-on-surface-variant mt-2">The same hacks that work on hotels apply to flights — plus a few extras.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLIGHT_TIPS.map((tip, i) => (
              <article key={i} className={`rounded-xl p-5 flex flex-col concierge-shadow ${tip.featured ? 'border-2 border-primary bg-primary/5' : 'bg-white border border-border-subtle'}`}>
                <div className="text-2xl mb-3">{tip.icon}</div>
                <h3 className="font-headline-md text-[15px] mb-2">{tip.title}</h3>
                <p className="text-xs text-on-surface-variant flex-1">{tip.desc}</p>
                <span className="mt-3 text-[10px] font-bold px-2.5 py-1 rounded-full self-start bg-primary/10 text-primary">{tip.tag}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder section ──────────────────────────────────────────────── */}
      <section className="max-w-container-max mx-auto px-4 sm:px-gutter py-section-gap">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-2xl -rotate-2" />
              <Image src="/avi-profile.jpg" alt="Avi, Founder of CheapStay" width={400} height={500}
                className="relative rounded-2xl w-full h-[400px] sm:h-[500px] object-cover object-top concierge-shadow" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-xl concierge-shadow">
                <div className="font-headline-md text-[18px] text-pro-navy">Avi</div>
                <div className="text-sm text-on-surface-variant">Founder &amp; full-time traveler</div>
                <div className="flex gap-4 mt-3 text-[11px] font-bold uppercase tracking-tight text-primary">
                  <span>50+ Countries</span>
                  <span>500+ Hotels</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 space-y-8">
            <div className="space-y-4">
              <h2 className="font-headline-lg text-headline-lg text-pro-navy">Real tips from a full-time traveler</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Been living in hotels across Asia, Middle East &amp; Europe for years. CheapStay started because I got tired of paying too much for the same room. No corporate fluff, just lived experience.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              <div className="bg-white p-6 rounded-xl border border-border-subtle flex items-start gap-4">
                <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">payments</span>
                <div>
                  <h4 className="font-headline-md text-[16px] mb-1">Saved $40k+</h4>
                  <p className="text-sm text-on-surface-variant">On personal travel bookings using these hacks.</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-border-subtle flex items-start gap-4">
                <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">verified</span>
                <div>
                  <h4 className="font-headline-md text-[16px] mb-1">Verified Advice</h4>
                  <p className="text-sm text-on-surface-variant">Every guide is written by me, not AI or ghostwriters.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {['#BookingHacks', '#HotelReviews', '#CreditCards', '#DigitalNomad'].map(tag => (
                <span key={tag} className="px-4 py-2 bg-surface-container rounded-full text-xs font-bold text-on-surface-variant">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog section ─────────────────────────────────────────────────── */}
      <section className="bg-surface-container-low py-section-gap px-4 sm:px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-headline-lg text-headline-lg text-pro-navy">Latest Travel Hacks</h2>
            <p className="font-body-md text-on-surface-variant mt-2">50+ countries, hundreds of hotels — every article is written from lived experience, not theory.</p>
          </div>

          {/* Filter tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {BLOG_FILTERS.map(f => (
              <button key={f} onClick={() => setBlogFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  blogFilter === f ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container'
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* Blog posts grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured post — spans 2 cols */}
            <article className="sm:col-span-2 bg-white rounded-xl border border-border-subtle concierge-shadow overflow-hidden flex flex-col group">
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img src={BLOG_POSTS[0].img} alt={BLOG_POSTS[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-white">{BLOG_POSTS[0].category}</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-headline-md text-[18px] leading-snug group-hover:text-primary transition-colors">{BLOG_POSTS[0].title}</h3>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">{BLOG_POSTS[0].readTime} min read</span>
                  <Link href={`/blog/${BLOG_POSTS[0].slug}`} className="text-xs font-bold text-primary hover:underline">Read more →</Link>
                </div>
              </div>
            </article>

            {/* Regular posts */}
            {BLOG_POSTS.slice(1).map(post => (
              <article key={post.slug} className="bg-white rounded-xl border border-border-subtle concierge-shadow overflow-hidden flex flex-col group">
                <div className="relative h-36 overflow-hidden">
                  <img src={post.img} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">{post.category}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-headline-md text-[13px] leading-snug flex-1 group-hover:text-primary transition-colors">{post.title}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant">{post.readTime} min read</span>
                    <Link href={`/blog/${post.slug}`} className="text-[10px] font-bold text-primary hover:underline">Read →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-10 bg-white rounded-xl border border-border-subtle p-6 text-center">
            <h3 className="font-headline-md text-[18px] mb-1">Get the weekly travel hack</h3>
            <p className="text-sm text-on-surface-variant mb-5">No spam. Unsubscribe anytime.</p>
            {newsletterStatus === 'done' ? (
              <p className="text-sm font-semibold text-savings-green">You&apos;re in! Check your inbox.</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="submit" disabled={newsletterStatus === 'loading'}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm bg-primary transition-opacity hover:opacity-90 disabled:opacity-60">
                  {newsletterStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
            )}
            {newsletterStatus === 'error' && <p className="text-xs text-error mt-2">Something went wrong. Try again.</p>}
          </div>
        </div>
      </section>

      {/* ── Travel gear ───────────────────────────────────────────────────── */}
      <section className="max-w-container-max mx-auto px-4 sm:px-gutter py-section-gap">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
          <div className="space-y-2">
            <h2 className="font-headline-lg text-headline-lg text-pro-navy">Travel gear worth packing</h2>
            <p className="font-body-md text-on-surface-variant">Tried-and-tested items that frequent travelers actually use</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-full bg-alert-orange/10 text-alert-orange border border-alert-orange/20 whitespace-nowrap">Amazon picks</span>
            <Link href="/shop" className="self-start px-4 py-2 bg-pro-navy text-white rounded-lg font-label-bold text-xs whitespace-nowrap hover:opacity-90 transition-opacity">View full shop →</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {TRAVEL_GEAR.map(item => (
            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
              onClick={() => analytics.travelGearClick(item.name, item.badge)}
              className="group block">
              <div className="aspect-square bg-white rounded-xl border border-border-subtle p-2 mb-3 concierge-shadow group-hover:border-primary transition-all overflow-hidden">
                <div className="w-full h-full bg-surface rounded flex items-center justify-center overflow-hidden">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-tighter mb-1" style={{ color: item.color }}>{item.badge}</div>
              <h4 className="text-sm font-bold text-pro-navy mb-1">{item.name}</h4>
              <div className="text-metadata text-on-surface-variant">{item.price}</div>
            </a>
          ))}
        </div>
        <p className="text-center text-metadata text-on-surface-variant/60 mt-8 italic">
          As an Amazon Associate we earn from qualifying purchases, at no extra cost to you.
        </p>
      </section>

      {/* ── Consult CTA ──────────────────────────────────────────────────── */}
      <section className="py-section-gap px-4 sm:px-gutter bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden bg-pro-navy">
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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-pro-navy" />
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-4 w-fit bg-savings-green/20 text-savings-green border border-savings-green/30">
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
                    <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/consult"
                  className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white w-fit bg-primary transition-opacity hover:opacity-90">
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

function CarSearchWidget() {
  const [pickup, setPickup] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; city?: string; country?: string }[]>([]);
  const [showSug, setShowSug] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sugRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = new Date(); p.setDate(p.getDate() + 7);
    const d = new Date(); d.setDate(d.getDate() + 14);
    const fmt = (x: Date) => x.toISOString().split('T')[0];
    setPickupDate(fmt(p));
    setDropoffDate(fmt(d));
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!inputRef.current?.contains(e.target as Node) && !sugRef.current?.contains(e.target as Node))
        setShowSug(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleChange(v: string) {
    setPickup(v);
    if (v.length < 2) { setSuggestions([]); setShowSug(false); return; }
    try {
      const items = await getSuggestions(v);
      setSuggestions(items.slice(0, 8));
      setShowSug(items.length > 0);
    } catch { setSuggestions([]); }
  }

  function selectSuggestion(s: { name: string; city?: string }) {
    setPickup(s.city ? `${s.name}, ${s.city}` : s.name);
    setShowSug(false);
  }

  const today = new Date().toISOString().split('T')[0];

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup.trim()) return;
    const dest = `https://www.getrentacar.com/en/search/?pickUpLocName=${encodeURIComponent(pickup.trim())}&pickUpDate=${pickupDate}&returnDate=${dropoffDate}`;
    window.open(`https://getrentacar.tpo.lv/Xdm1FCMq?u=${encodeURIComponent(dest)}`, '_blank', 'noopener');
  }

  return (
    <form onSubmit={search} className="space-y-4">
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pickup location</label>
        <input ref={inputRef} type="text" value={pickup}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSug(true)}
          placeholder="City or airport (e.g. Bangkok, Tokyo)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-text" />
        {showSug && suggestions.length > 0 && (
          <div ref={sugRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                <span className="text-gray-400">📍</span>
                <span className="font-medium text-gray-900">{s.name}</span>
                {s.city && <span className="text-gray-400 text-xs">{s.city}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pickup date</label>
          <input type="date" value={pickupDate} min={today} onChange={e => setPickupDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 cursor-pointer" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Drop-off date</label>
          <input type="date" value={dropoffDate} min={pickupDate || today} onChange={e => setDropoffDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 cursor-pointer" />
        </div>
      </div>
      <button type="submit"
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-primary transition-opacity hover:opacity-90">
        Search rental cars →
      </button>
    </form>
  );
}

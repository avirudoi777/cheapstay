'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import VisaBanner from '@/components/VisaBanner';
import { getLayoverGuide, parseLayoverMinutes, LAYOVER_GUIDE_THRESHOLD_MIN } from '@/lib/layover-guides';
import { flagEmoji, COUNTRIES } from '@/lib/visa-data';
import PhoneInput from '@/components/PhoneInput';
import { createClient } from '@/lib/supabase/client';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface SegmentAmenity { desc: string; cost: string }
function fmtCabin(c: string) {
  return c === 'premium_economy' ? 'Premium Economy'
    : c === 'business' ? 'Business'
    : c === 'first' ? 'First Class'
    : 'Economy';
}

interface Segment {
  depCode: string; depCity: string; depAt: string;
  arrCode: string; arrCity: string; arrAt: string;
  airline: string; airlineCode: string; flightNumber: string;
  duration: string; aircraft: string; layoverAfter: string;
  cabinClass?: string;
  baggage?: { checkedBags: number; carryOn: number };
  segmentId?: string;
  amenities?: {
    food?: SegmentAmenity | null;
    drink?: SegmentAmenity | null;
    entertainment?: SegmentAmenity | null;
    wifi?: SegmentAmenity | null;
    power?: SegmentAmenity | null;
    seat?: { type: string; pitch: string | null } | null;
  } | null;
}
export interface DuffelService {
  id: string;
  type: 'baggage' | 'seat' | string;
  maximumQuantity: number;
  totalAmount: number;
  totalCurrency: string;
  passengerIds: string[];
  segmentIds: string[];
  metadata: Record<string, unknown>;
}
export interface DuffelPassenger {
  id: string;
  type: 'adult' | 'child' | 'infant_without_seat';
}
export interface DuffelOffer {
  id: string; expiresAt: string;
  totalAmount: number; totalCurrency: string; totalDuration: string;
  passengerIds: string[];
  passengers: DuffelPassenger[];
  segments: Segment[];
  availableServices: DuffelService[];
  conditions?: {
    refundBeforeDeparture?: {
      allowed: boolean;
      penaltyAmount?: string | null;
      penaltyCurrency?: string | null;
    } | null;
  } | null;
  paymentRequirements?: {
    requiresInstantPayment: boolean;
    priceGuaranteeExpiresAt?: string | null;
    paymentRequiredBy?: string | null;
  } | null;
}
interface SelectedService { serviceId: string; quantity: number; }
interface SeatElement {
  type: string; designator?: string;
  available_services?: { id: string; passenger_id: string; total_amount: string; total_currency: string }[];
  disclosures?: string[];
}
interface SeatRow { sections: { elements: SeatElement[] }[] }
interface SeatCabin { cabinClass: string; cabinClassName?: string; rows: SeatRow[]; wings?: { first_row_index: number; last_row_index: number } }
interface SeatMap { segmentId: string; cabins: SeatCabin[] }
interface PassengerForm {
  title: string; givenName: string; familyName: string;
  gender: string; bornOn: string; email: string; phoneNumber: string;
  passportNumber: string; passportExpiry: string; passportCountry: string;
}
interface CardForm {
  name: string; number: string; expiry: string; cvc: string;
}
interface SavedPassport {
  id: string; country: string; label: string; passportNumber: string; passportExpiry: string;
}
interface CompanionProfile {
  id: string; nickname: string; title: string; givenName: string; familyName: string;
  gender: string; bornOn: string; phone: string; passports: SavedPassport[];
  isChild?: boolean;
}
interface TravelerProfile {
  title: string; givenName: string; familyName: string; gender: string;
  bornOn: string; phone: string; passports: SavedPassport[]; email: string;
  companions?: CompanionProfile[];
}

interface Props {
  fromCode: string; toCode: string;
  fromName: string; toName: string;
  depart: string; ret: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  onClear: () => void;
  passportCodes: string[];
}

/* ─── Airport → country mapping for smart passport pre-selection ────────── */
const AIRPORT_COUNTRY: Record<string, string> = {
  JFK:'US',LAX:'US',ORD:'US',MIA:'US',SFO:'US',DFW:'US',ATL:'US',BOS:'US',SEA:'US',IAH:'US',DEN:'US',LAS:'US',MCO:'US',
  YYZ:'CA',YVR:'CA',YUL:'CA',YYC:'CA',
  GRU:'BR',GIG:'BR',BSB:'BR',SSA:'BR',FOR:'BR',
  BOG:'CO',MDE:'CO', EZE:'AR',AEP:'AR', LIM:'PE', SCL:'CL', UIO:'EC', ASU:'PY', MVD:'UY',
  MEX:'MX',CUN:'MX',GDL:'MX',MTY:'MX',
  LHR:'GB',LGW:'GB',MAN:'GB',EDI:'GB',STN:'GB',
  CDG:'FR',ORY:'FR',NCE:'FR',LYS:'FR',
  FRA:'DE',MUC:'DE',BER:'DE',DUS:'DE',HAM:'DE',
  AMS:'NL', MAD:'ES',BCN:'ES',AGP:'ES',VLC:'ES',
  FCO:'IT',MXP:'IT',NAP:'IT',VCE:'IT',
  ZRH:'CH',GVA:'CH', VIE:'AT', BRU:'BE',
  CPH:'DK', OSL:'NO', ARN:'SE', HEL:'FI',
  WAW:'PL', PRG:'CZ', BUD:'HU', ATH:'GR', LIS:'PT',
  IST:'TR',SAW:'TR',
  DXB:'AE',AUH:'AE',SHJ:'AE', DOH:'QA', KWI:'KW', BAH:'BH', MCT:'OM', RUH:'SA',JED:'SA',
  TLV:'IL',
  BKK:'TH',DMK:'TH',HKT:'TH',CNX:'TH',
  SIN:'SG', KUL:'MY',PEN:'MY', CGK:'ID',DPS:'ID', MNL:'PH',CEB:'PH',
  HAN:'VN',SGN:'VN', REP:'KH',PNH:'KH',
  NRT:'JP',HND:'JP',KIX:'JP',FUK:'JP', ICN:'KR',GMP:'KR',
  PEK:'CN',PVG:'CN',CAN:'CN',SZX:'CN',CTU:'CN', HKG:'HK', TPE:'TW',
  BOM:'IN',DEL:'IN',BLR:'IN',MAA:'IN',HYD:'IN', CMB:'LK',
  JNB:'ZA',CPT:'ZA', NBO:'KE', ADD:'ET', LOS:'NG', CAI:'EG', CMN:'MA',
  SYD:'AU',MEL:'AU',BNE:'AU',PER:'AU', AKL:'NZ',
};

/* ─── Pricing ────────────────────────────────────────────────────────────── */
const SERVICE_FEE = 10;
const DUFFEL_FEE_RATE = 0.029;
function calcGross(base: number, extras = 0) {
  return Math.round(((base + extras + SERVICE_FEE) / (1 - DUFFEL_FEE_RATE)) * 100) / 100;
}

/* ─── Formatters ─────────────────────────────────────────────────────────── */
function fmtTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtPrice(amt: number, cur: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amt);
}
function fmtCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

/* ─── Credit card affiliate offers ──────────────────────────────────────── */
interface CardOffer {
  name: string;
  issuer: string;
  icon: string;         // emoji fallback
  cardArt?: string;     // path under /cards/ for real card image
  // CSS gradient card art fallback (used when no cardArt image)
  cardGradient?: string;
  cardTextColor?: string;
  headline: string;
  bonus: string;
  url: string;
  highlight?: string;
}

const CARD_DB: Record<string, CardOffer> = {
  chase_sapphire_preferred: {
    name: 'Chase Sapphire Preferred®',
    issuer: 'chase',
    icon: '💎',
    cardArt: '/cards/chase-sapphire.png',
    headline: 'Earn 3x points on travel · transfer to 14 airlines 1:1',
    bonus: '60,000 bonus points after $4k spend in 3 months',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
    highlight: 'Best overall',
  },
  chase_sapphire_reserve: {
    name: 'Chase Sapphire Reserve®',
    issuer: 'chase',
    icon: '🖤',
    cardGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    cardTextColor: '#C4A84F',
    headline: 'Earn 3x on travel + $300 travel credit · Priority Pass lounge',
    bonus: '60,000 bonus points after $4k spend in 3 months',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
    highlight: 'Premium',
  },
  united_explorer: {
    name: 'United℠ Explorer Card',
    issuer: 'chase',
    icon: '✈️',
    cardGradient: 'linear-gradient(135deg, #003087 0%, #0052a3 60%, #1a6fc4 100%)',
    cardTextColor: '#ffffff',
    headline: 'Earn 2x miles on United · free first checked bag',
    bonus: '60,000 bonus miles after $3k spend',
    url: 'https://creditcards.chase.com/travel-credit-cards/united/explorer',
    highlight: 'United flyers',
  },
  united_club_infinite: {
    name: 'United Club℠ Infinite Card',
    issuer: 'chase',
    icon: '🛋️',
    cardGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #003087 100%)',
    cardTextColor: '#C4A84F',
    headline: '4x miles on United + United Club lounge membership',
    bonus: '80,000 bonus miles after $5k spend',
    url: 'https://creditcards.chase.com/travel-credit-cards/united/club-infinite',
    highlight: 'United premium',
  },
  amex_platinum: {
    name: 'The Platinum Card® from Amex',
    issuer: 'amex',
    icon: '⬛',
    cardGradient: 'linear-gradient(135deg, #8e9eab 0%, #b8c6cf 30%, #d4dfe6 60%, #a8b8c3 100%)',
    cardTextColor: '#1a1a1a',
    headline: '5x points on flights · transfer to 20+ airlines · 1,400+ lounges',
    bonus: '80,000 Membership Rewards points after $8k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
    highlight: 'Best lounge access',
  },
  amex_gold: {
    name: 'Amex Gold Card®',
    issuer: 'amex',
    icon: '🟡',
    cardArt: '/cards/amex-gold.png',
    headline: '3x points on flights · transfer to Delta, Air France, and more',
    bonus: '60,000 Membership Rewards points after $6k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  },
  delta_gold: {
    name: 'Delta SkyMiles® Gold Amex',
    issuer: 'amex',
    icon: '🔵',
    cardGradient: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0059b3 100%)',
    cardTextColor: '#E8B84B',
    headline: '2x miles on Delta purchases · free first checked bag',
    bonus: '40,000 bonus miles after $2k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-gold-american-express-card/',
    highlight: 'Delta flyers',
  },
  delta_platinum: {
    name: 'Delta SkyMiles® Platinum Amex',
    issuer: 'amex',
    icon: '🔷',
    cardGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #003366 100%)',
    cardTextColor: '#C0C0C0',
    headline: '3x miles on Delta · companion certificate · upgrade priority',
    bonus: '50,000 bonus miles after $3k spend',
    url: 'https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-platinum-american-express-card/',
    highlight: 'Delta premium',
  },
  citi_aadvantage: {
    name: 'Citi® / AAdvantage® Platinum Select®',
    issuer: 'citi',
    icon: '🔴',
    cardGradient: 'linear-gradient(135deg, #C00 0%, #e00020 50%, #cc0000 100%)',
    cardTextColor: '#ffffff',
    headline: '2x miles on American Airlines · free first checked bag',
    bonus: '50,000 bonus miles after $2.5k spend',
    url: 'https://www.citi.com/credit-cards/citi-aadvantage-platinum-select-credit-card',
    highlight: 'American Airlines',
  },
  barclays_aviator: {
    name: 'AAdvantage® Aviator® Red',
    issuer: 'barclays',
    icon: '🔺',
    cardGradient: 'linear-gradient(135deg, #8B0000 0%, #c0392b 50%, #a93226 100%)',
    cardTextColor: '#ffffff',
    headline: '2x miles on American Airlines · companion certificate',
    bonus: '60,000 bonus miles after first purchase',
    url: 'https://cards.barclaycardus.com/banking/cards/aadvantage-aviator-red-world-elite-mastercard/',
    highlight: 'AA — easy bonus',
  },
  southwest_priority: {
    name: 'Southwest Rapid Rewards® Priority',
    issuer: 'chase',
    icon: '🟧',
    cardGradient: 'linear-gradient(135deg, #304CB2 0%, #1a2d6e 40%, #E31837 100%)',
    cardTextColor: '#ffffff',
    headline: '3x points on Southwest · 7,500 bonus points each anniversary',
    bonus: '50,000 bonus points after $1k spend',
    url: 'https://creditcards.chase.com/travel-credit-cards/southwest-airlines/priority',
    highlight: 'Southwest',
  },
  british_airways: {
    name: 'British Airways Visa Signature®',
    issuer: 'chase',
    icon: '🇬🇧',
    cardGradient: 'linear-gradient(135deg, #002147 0%, #003580 50%, #004aad 100%)',
    cardTextColor: '#ffffff',
    headline: '3x Avios on BA · works on American Airlines + Iberia',
    bonus: '85,000 Avios after $5k spend in 3 months',
    url: 'https://creditcards.chase.com/travel-credit-cards/british-airways',
    highlight: 'Oneworld',
  },
};

// Airline IATA code → card keys to show (first 2 shown by default)
const AIRLINE_CARDS: Record<string, string[]> = {
  UA: ['united_explorer', 'chase_sapphire_preferred', 'united_club_infinite'],
  DL: ['delta_gold', 'delta_platinum', 'amex_platinum'],
  AA: ['citi_aadvantage', 'barclays_aviator', 'chase_sapphire_preferred'],
  WN: ['southwest_priority', 'chase_sapphire_preferred'],
  B6: ['chase_sapphire_preferred', 'amex_gold'],              // JetBlue
  AS: ['chase_sapphire_preferred', 'amex_platinum'],          // Alaska
  BA: ['british_airways', 'chase_sapphire_preferred'],
  IB: ['british_airways', 'chase_sapphire_preferred'],        // Iberia (Avios)
  QF: ['british_airways', 'amex_platinum'],                   // Qantas
  EK: ['amex_platinum', 'chase_sapphire_preferred'],
  SQ: ['amex_platinum', 'chase_sapphire_preferred'],
  AF: ['amex_gold', 'chase_sapphire_preferred'],
  KL: ['amex_gold', 'chase_sapphire_preferred'],
  LH: ['amex_platinum', 'chase_sapphire_preferred'],
  OS: ['amex_platinum', 'chase_sapphire_preferred'],          // Austrian (LH group)
  LX: ['amex_platinum', 'chase_sapphire_preferred'],          // Swiss (LH group)
  TK: ['amex_gold', 'chase_sapphire_preferred'],
  MH: ['amex_platinum', 'chase_sapphire_preferred'],
  CX: ['amex_platinum', 'chase_sapphire_preferred'],          // Cathay
  NH: ['amex_platinum', 'chase_sapphire_preferred'],          // ANA
  JL: ['amex_platinum', 'chase_sapphire_preferred'],          // JAL
};
const DEFAULT_CARDS = ['chase_sapphire_preferred', 'amex_gold'];

function getCardOffers(airlineCodes: string[]): CardOffer[] {
  for (const code of airlineCodes) {
    const keys = AIRLINE_CARDS[code.toUpperCase()];
    if (keys) return keys.slice(0, 2).map(k => CARD_DB[k]).filter(Boolean);
  }
  return DEFAULT_CARDS.map(k => CARD_DB[k]);
}

const ISSUER_STYLE: Record<string, { bg: string; color: string }> = {
  chase: { bg: '#EFF6FF', color: '#1D4ED8' },
  amex: { bg: '#F0FDF4', color: '#15803D' },
  citi: { bg: '#FFF7ED', color: '#C2410C' },
  barclays: { bg: '#FDF4FF', color: '#7E22CE' },
};

/* ─── Input helpers ──────────────────────────────────────────────────────── */
const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition bg-white';
const selectCls = inputCls + ' appearance-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

/* ─── Route map SVG ──────────────────────────────────────────────────────── */
function RouteMap({ fromCode, toCode, fromName, toName, stops = [], duration }: {
  fromCode: string; toCode: string; fromName: string; toName: string;
  stops?: string[]; duration?: string;
}) {
  const W = 500, H = 130;
  const depX = 70, arrX = 430, baseY = 95, cpY = 28; // cpY = Bezier control point Y

  // Place dots ON the actual quadratic Bezier curve (not the control point apex)
  const stopPoints = stops.map((code, i) => {
    const t = (i + 1) / (stops.length + 1);
    const cx = (1-t)*(1-t)*depX + 2*(1-t)*t*250 + t*t*arrX;
    const cy = (1-t)*(1-t)*baseY + 2*(1-t)*t*cpY  + t*t*baseY;
    return { code, cx, cy };
  });

  // Bezier midpoint for the plane icon (t=0.5 → y≈62)
  const planeY = 0.25*baseY + 0.5*cpY + 0.25*baseY;

  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg, #0a1628, #0f2547)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={`M ${depX} ${baseY} Q 250 ${cpY} ${arrX} ${baseY}`}
          stroke="rgba(29,158,117,0.15)" strokeWidth="8" fill="none" />
        <path d={`M ${depX} ${baseY} Q 250 ${cpY} ${arrX} ${baseY}`}
          stroke="rgba(29,158,117,0.6)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        {/* Plane only on direct flights — stop dots replace it on connecting flights */}
        {stops.length === 0 && (
          <text x="250" y={planeY - 4} textAnchor="middle" fontSize="18">✈️</text>
        )}
        {stopPoints.map(({ code, cx, cy }) => (
          <g key={code}>
            <circle cx={cx} cy={cy} r="6" fill="rgba(255,200,50,0.9)" />
            <circle cx={cx} cy={cy} r="10" fill="none" stroke="rgba(255,200,50,0.3)" strokeWidth="1.5" />
            {/* Label above the dot — dot is on the arc so label sits in clear space */}
            <text x={cx} y={cy - 13} textAnchor="middle" fontSize="10" fill="rgba(255,220,60,1)" fontWeight="bold">{code}</text>
          </g>
        ))}
        <circle cx={depX} cy={baseY} r="6" fill="#1D9E75" />
        <circle cx={depX} cy={baseY} r="10" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x={depX} y={baseY + 18} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">{fromCode}</text>
        <circle cx={arrX} cy={baseY} r="6" fill="#1A73E8" />
        <circle cx={arrX} cy={baseY} r="10" fill="none" stroke="#1A73E8" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x={arrX} y={baseY + 18} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">{toCode}</text>
      </svg>
      {/* Caption bar — duration lives here, not in the SVG, so it never collides with stop codes */}
      <div className="px-5 pb-4 flex items-center justify-between -mt-1">
        <p className="text-xs text-gray-400">{fromName}</p>
        <div className="text-center">
          {duration && <p className="text-[11px] font-semibold text-gray-300">{duration}</p>}
          {stops.length > 0 && <p className="text-[10px] text-yellow-400 font-semibold">{stops.length} stop{stops.length > 1 ? 's' : ''}</p>}
        </div>
        <p className="text-xs text-gray-400">{toName}</p>
      </div>
    </div>
  );
}

/* ─── Airline logo ───────────────────────────────────────────────────────── */
function AirlineLogo({ code, name }: { code: string; name: string }) {
  return (
    <img
      src={`https://images.kiwi.com/airlines/64/${code}.png`}
      alt={name}
      width={32} height={32}
      className="rounded-lg object-contain flex-shrink-0"
      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 3 }}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.style.display = 'none';
        img.nextElementSibling?.classList.remove('hidden');
      }}
    />
  );
}

/* ─── Skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="space-y-1.5"><div className="h-5 w-12 bg-gray-100 rounded" /><div className="h-3 w-10 bg-gray-100 rounded" /></div>
          <div className="h-3 w-28 bg-gray-100 rounded" />
          <div className="space-y-1.5"><div className="h-5 w-12 bg-gray-100 rounded" /><div className="h-3 w-10 bg-gray-100 rounded" /></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-7 w-20 bg-gray-100 rounded" /><div className="h-10 w-24 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
const EMPTY_FORM: PassengerForm = {
  title: 'mr', givenName: '', familyName: '', gender: 'm',
  bornOn: '', email: '', phoneNumber: '', passportNumber: '', passportExpiry: '', passportCountry: '',
};
const EMPTY_CARD: CardForm = { name: '', number: '', expiry: '', cvc: '' };

export default function FlightResults({ fromCode, toCode, fromName, toName, depart, ret, adults = 1, children = 0, infants = 0, cabinClass = 'economy', onClear, passportCodes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Baked in at build time via next.config — no async fetch race
  const duffelTestMode = process.env.NEXT_PUBLIC_DUFFEL_TEST_MODE === 'true';

  // ── Search state
  const [offers, setOffers] = useState<DuffelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Date price strip
  const [activeDate, setActiveDate] = useState(depart);
  const [chipPrices, setChipPrices] = useState<Record<string, number | null>>({});
  const [chipCurrency, setChipCurrency] = useState('USD');
  const prefetchingDates = useRef<Set<string>>(new Set());

  // Reset strip when a new search comes in from the search bar
  useEffect(() => {
    setActiveDate(depart);
    setChipPrices({});
    prefetchingDates.current.clear();
  }, [depart, fromCode, toCode]);

  // ── Filters
  const [filterStops, setFilterStops] = useState<Set<number>>(new Set());
  const [filterAirlines, setFilterAirlines] = useState<Set<string>>(new Set());
  const [filterBaggage, setFilterBaggage] = useState(false);
  const [showAllAirlines, setShowAllAirlines] = useState(false);

  // ── Sidebar details toggle
  const [sidebarDetailsOpen, setSidebarDetailsOpen] = useState(false);

  // ── Saved traveler profile
  const [savedProfile, setSavedProfile] = useState<TravelerProfile | null>(null);
  const [selectedPassportId, setSelectedPassportId] = useState('');

  // ── Booking state
  const [selectedOffer, setSelectedOffer] = useState<DuffelOffer | null>(null);
  const [bookStep, setBookStep] = useState<'passenger' | 'extras' | 'payment' | 'confirmed'>('passenger');
  const [forms, setForms] = useState<PassengerForm[]>([EMPTY_FORM]);
  const [formErrors, setFormErrors] = useState<Partial<PassengerForm>[]>([{}]);
  const [selectedPassportIds, setSelectedPassportIds] = useState<string[]>(['']);
  const [cardForm, setCardForm] = useState<CardForm>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<Partial<CardForm>>({});
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmation, setConfirmation] = useState<{ reference: string; amount: number; currency: string; held?: boolean; paymentRequiredBy?: string } | null>(null);
  const [savePassenger, setSavePassenger] = useState(false);
  const [holdMode, setHoldMode] = useState(false);
  // Live countdown for offer expiry
  const [offerSecsLeft, setOfferSecsLeft] = useState<number | null>(null);
  // Add-on services
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [seatMaps, setSeatMaps] = useState<SeatMap[] | null>(null);
  const [seatMapsLoading, setSeatMapsLoading] = useState(false);
  // Per-passenger seat selection: { [segmentId_passengerId]: serviceId }
  const [seatSelections, setSeatSelections] = useState<Record<string, string>>({});

  // Load saved traveler profile for form pre-fill
  useEffect(() => {
    fetch('/api/profile/traveler')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setSavedProfile(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setSearchError(''); setOffers([]);
    fetch('/api/flights/duffel-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: fromCode, destination: toCode, departureDate: activeDate, returnDate: ret || undefined, adults, children, infants, cabinClass }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) { setSearchError(json.detail || 'No flights found for this route.'); }
        else if (!json.offers?.length) { setSearchError('No flights found for this route and date.'); }
        else {
          setOffers(json.offers);
          setChipCurrency(json.offers[0]?.totalCurrency ?? 'USD');
          const minRaw = Math.min(...(json.offers as DuffelOffer[]).map((o: DuffelOffer) => o.totalAmount));
          setChipPrices(prev => ({ ...prev, [activeDate]: calcGross(minRaw) }));
        }
      })
      .catch(() => setSearchError('Search failed — please try again.'))
      .finally(() => setLoading(false));
  }, [fromCode, toCode, activeDate, ret]);

  // Pre-fetch surrounding date prices in the background once main results arrive
  useEffect(() => {
    if (!offers.length || !depart) return;
    const base = new Date(depart + 'T12:00:00Z');
    if (isNaN(base.getTime())) return;
    [-2, -1, 1, 2].forEach(offset => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + offset);
      const iso = d.toISOString().slice(0, 10);
      // Keep trip duration the same for round-trip searches
      let prefetchRet: string | undefined;
      if (ret) {
        const rd = new Date(ret + 'T12:00:00');
        rd.setUTCDate(rd.getUTCDate() + offset);
        prefetchRet = rd.toISOString().slice(0, 10);
      }
      if (prefetchingDates.current.has(iso)) return;
      prefetchingDates.current.add(iso);
      fetch('/api/flights/duffel-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: fromCode, destination: toCode, departureDate: iso, returnDate: prefetchRet, adults, children, infants, cabinClass }),
      })
        .then(r => r.json())
        .then(json => {
          const minPrice = json.offers?.length
            ? calcGross(Math.min(...(json.offers as DuffelOffer[]).map((o: DuffelOffer) => o.totalAmount)))
            : null;
          setChipPrices(prev => ({ ...prev, [iso]: minPrice }));
        })
        .catch(() => {})
        .finally(() => prefetchingDates.current.delete(iso));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  // Clear booking state when user triggers a new search from the search bar
  useEffect(() => {
    setSelectedOffer(null);
    setBookingError('');
    setBookStep('passenger');
  }, [fromCode, toCode, depart]);

  const [offerRefreshing, setOfferRefreshing] = useState(false);

  // Live countdown for selected offer
  useEffect(() => {
    if (!selectedOffer?.expiresAt) { setOfferSecsLeft(null); return; }
    function tick() {
      const secs = Math.floor((new Date(selectedOffer!.expiresAt).getTime() - Date.now()) / 1000);
      setOfferSecsLeft(Math.max(0, secs));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selectedOffer]);

  // Browser back button: push history entry on booking start, clear state on popstate
  useEffect(() => {
    if (!selectedOffer) return;
    const handlePop = () => { setSelectedOffer(null); setBookingError(''); };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [selectedOffer]);

  // Auto-load seat map when an offer is selected
  useEffect(() => {
    if (!selectedOffer) return;
    setSeatMapsLoading(true);
    fetch(`/api/flights/seat-map?offerId=${selectedOffer.id}`)
      .then(r => r.json())
      .then(d => { setSeatMaps(d.maps ?? []); })
      .catch(() => { setSeatMaps([]); })
      .finally(() => { setSeatMapsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOffer?.id]);

  // Derived filter data
  const allAirlines = useMemo(() => {
    const map = new Map<string, string>();
    offers.forEach(o => o.segments.forEach(s => map.set(s.airline, s.airlineCode)));
    return Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const stops = offer.segments.length - 1;
      if (filterStops.size > 0 && !filterStops.has(stops >= 2 ? 2 : stops)) return false;
      if (filterAirlines.size > 0 && !offer.segments.some(s => filterAirlines.has(s.airline))) return false;
      if (filterBaggage && !offer.segments.every(s => (s.baggage?.checkedBags ?? 0) > 0)) return false;
      return true;
    });
  }, [offers, filterStops, filterAirlines, filterBaggage]);

  const hasActiveFilters = filterStops.size > 0 || filterAirlines.size > 0 || filterBaggage;

  const bestPriceDate = useMemo(() => {
    const loaded = (Object.entries(chipPrices) as [string, number | null][]).filter(([, v]) => v != null) as [string, number][];
    if (!loaded.length) return null;
    return loaded.reduce((best, cur) => cur[1] < best[1] ? cur : best)[0];
  }, [chipPrices]);

  function startBooking(offer: DuffelOffer) {
    window.history.pushState({ cheapstayBooking: true }, '');
    setSelectedOffer(offer);
    setBookStep('passenger');
    setCardForm(EMPTY_CARD); setCardErrors({});
    setBookingError(''); setConfirmation(null);
    setSelectedServices([]); setSeatMaps(null); setSeatSelections({});

    const numPax = offer.passengerIds.length;
    if (savedProfile) {
      const destCountry = AIRPORT_COUNTRY[toCode.toUpperCase()] ?? '';
      const best = savedProfile.passports.find(p => p.country === destCountry)
        ?? savedProfile.passports[0];
      const firstForm: PassengerForm = {
        title: savedProfile.title || 'mr',
        givenName: savedProfile.givenName || '',
        familyName: savedProfile.familyName || '',
        gender: savedProfile.gender || 'm',
        bornOn: savedProfile.bornOn || '',
        email: savedProfile.email || '',
        phoneNumber: savedProfile.phone || '',
        passportNumber: best?.passportNumber || '',
        passportExpiry: best?.passportExpiry || '',
        passportCountry: best?.country || '',
      };
      // Additional passengers inherit email + phone from lead so the family shares one contact
      const newForms = [firstForm, ...Array.from({ length: numPax - 1 }, () => ({
        ...EMPTY_FORM,
        email: savedProfile.email || '',
        phoneNumber: savedProfile.phone || '',
      }))];
      setForms(newForms);
      setSelectedPassportIds([best?.id || '', ...Array(numPax - 1).fill('')]);
    } else {
      setForms(Array.from({ length: numPax }, () => ({ ...EMPTY_FORM })));
      setSelectedPassportIds(Array(numPax).fill(''));
    }
    setFormErrors(Array.from({ length: numPax }, () => ({})));
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  function updatePassenger(idx: number, key: keyof PassengerForm, val: string) {
    setForms(fs => fs.map((f, i) => {
      if (i === idx) return { ...f, [key]: val };
      // Cascade email/phone changes from lead pax to all others (family shares one contact)
      if (idx === 0 && (key === 'email' || key === 'phoneNumber')) return { ...f, [key]: val };
      return f;
    }));
    // Remove the key entirely (not just set to '') so hasAnyError check works correctly
    setFormErrors(es => es.map((e, i) => {
      if (i !== idx) return e;
      const { [key]: _removed, ...rest } = e;
      return rest as Partial<PassengerForm>;
    }));
  }
  function updateCard(key: keyof CardForm, val: string) {
    setCardForm(f => ({ ...f, [key]: val }));
    setCardErrors(e => ({ ...e, [key]: '' }));
  }

  function selectPassportForPax(idx: number, p: SavedPassport) {
    setSelectedPassportIds(ids => ids.map((id, i) => i === idx ? p.id : id));
    setForms(fs => fs.map((f, i) => i === idx ? { ...f, passportNumber: p.passportNumber, passportExpiry: p.passportExpiry, passportCountry: p.country } : f));
    setFormErrors(es => es.map((e, i) => { if (i !== idx) return e; const { passportNumber: _a, passportExpiry: _b, passportCountry: _c, ...rest } = e; return rest as Partial<PassengerForm>; }));
  }

  function validateForms(): boolean {
    const depDate = selectedOffer?.segments[0]?.depAt ? new Date(selectedOffer.segments[0].depAt) : null;

    const allErrs = forms.map((form, idx) => {
      const errs: Partial<PassengerForm> = {};
      if (!form.givenName.trim())       errs.givenName = 'Required';
      if (!form.familyName.trim())      errs.familyName = 'Required';

      if (!form.bornOn) {
        errs.bornOn = 'Required';
      } else if (depDate) {
        const born = new Date(form.bornOn);
        const ageYears = (depDate.getTime() - born.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const paxType = selectedOffer?.passengers?.[idx]?.type ?? 'adult';
        if (ageYears < 0) {
          errs.bornOn = 'Date of birth cannot be after the travel date';
        } else if (paxType === 'infant_without_seat' && ageYears >= 2) {
          errs.bornOn = 'Infant must be under 2 years old at time of travel';
        } else if (paxType === 'child' && (ageYears < 2 || ageYears >= 12)) {
          errs.bornOn = 'Child must be 2–11 years old at time of travel';
        } else if (paxType === 'adult' && ageYears < 12) {
          errs.bornOn = 'Adult passenger must be 12 or older at time of travel';
        }
      }

      if (!form.passportNumber.trim())  errs.passportNumber = 'Required';
      if (!form.passportExpiry)         errs.passportExpiry = 'Required';
      if (!form.passportCountry.trim()) errs.passportCountry = 'Required';
      // Email and phone only required for the lead passenger (idx 0)
      if (idx === 0) {
        if (!form.email.includes('@'))  errs.email = 'Valid email required';
        if (!form.phoneNumber.trim())   errs.phoneNumber = 'Required';
      }
      return errs;
    });
    setFormErrors(allErrs);
    return allErrs.every(e => Object.keys(e).length === 0);
  }

  function validateCard(): boolean {
    const errs: Partial<CardForm> = {};
    if (!cardForm.name.trim()) errs.name = 'Required';
    if (cardForm.number.replace(/\s/g, '').length !== 16) errs.number = '16-digit card number required';
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) errs.expiry = 'Format: MM/YY';
    if (cardForm.cvc.length < 3) errs.cvc = '3-digit code required';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function confirmBooking() {
    if (!selectedOffer || (!duffelTestMode && !validateCard())) return;
    setBooking(true); setBookingError('');

    try {
      const offer = selectedOffer;
      const extrasTotal = selectedServices.reduce((sum, ss) => {
        const svc = offer.availableServices.find(s => s.id === ss.serviceId);
        return sum + (svc ? svc.totalAmount * ss.quantity : 0);
      }, 0);
      let paymentIntentId = '';
      let grossAmount = calcGross(offer.totalAmount, extrasTotal);

      if (!duffelTestMode) {
        // Live mode: create payment intent + confirm card
        const piRes = await fetch('/api/flights/duffel-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: (offer.totalAmount + extrasTotal).toFixed(2), currency: offer.totalCurrency }),
        });
        const pi = await piRes.json();
        if (pi.error) throw new Error(pi.detail || pi.error);
        grossAmount = pi.grossAmount;

        const [expMonth, expYearShort] = cardForm.expiry.split('/');
        const confirmRes = await fetch(`https://api.duffel.com/air/payment_intents/${pi.paymentIntentId}/actions/confirm`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${pi.clientToken}`, 'Duffel-Version': 'v2', 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: {
            card_number: cardForm.number.replace(/\s/g, ''),
            expiry_month: expMonth, expiry_year: '20' + expYearShort,
            cvc: cardForm.cvc, name: cardForm.name,
          }}),
        });
        if (!confirmRes.ok) {
          const err = await confirmRes.json();
          throw new Error(err?.errors?.[0]?.message || 'Card was declined');
        }
        paymentIntentId = pi.paymentIntentId;
      }

      // Book the offer that was presented to the user — no re-search, which
      // would create a new offer_request and invalidate this offer's ID in Duffel
      const orderRes = await fetch('/api/flights/duffel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          paymentIntentId,
          amount: offer.totalAmount.toFixed(2),
          currency: offer.totalCurrency,
          passengers: forms.map((f, i) => ({ ...f, passengerId: offer.passengerIds[i] })),
          services: selectedServices,
          hold: holdMode,
        }),
      });
      const order = await orderRes.json();
      if (order.error) {
        if (order.error === 'offer_expired') {
          throw new Error('This offer is no longer available (sold out or expired). Please go back and search again.');
        }
        // Airline doesn't support holds for this fare class (e.g. Business on some carriers).
        // Switch to instant mode and prompt the user to pay normally.
        if (order.error === 'hold_not_supported') {
          setHoldMode(false);
          throw new Error('This airline doesn\'t support seat holds for this fare. Switched to instant payment — click Pay to confirm your booking.');
        }
        const detail: string = order.detail || order.error || '';
        if (detail.toLowerCase().includes('internal_error') || detail.toLowerCase().includes('internal error')) {
          throw new Error('__retryable__The airline system had a temporary error. Please try again — this usually resolves on the next attempt.');
        }
        throw new Error(detail);
      }

      setConfirmation({
        reference: order.bookingReference,
        amount: grossAmount,
        currency: offer.totalCurrency,
        held: order.status === 'held',
        paymentRequiredBy: order.paymentRequirements?.requires_payment_by ?? order.paymentRequirements?.payment_required_by,
      });
      setBookStep('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Save booking client-side as belt-and-suspenders (server-side save may fail if cookie not forwarded)
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('no user session — skipping client-side save');
        const fs = offer.segments[0];
        const ls = offer.segments[offer.segments.length - 1];
        await supabase.from('flight_bookings').insert({
          user_id: user.id,
          passenger_email: forms[0]?.email ?? null,
          duffel_order_id: order.orderId,
          booking_reference: order.bookingReference,
          status: 'confirmed',
          origin_code: fs.depCode,
          origin_city: fs.depCity,
          destination_code: ls.arrCode,
          destination_city: ls.arrCity,
          departure_at: fs.depAt,
          arrival_at: ls.arrAt,
          airline: fs.airline,
          cabin_class: fs.cabinClass ?? null,
          total_amount: grossAmount,
          currency: offer.totalCurrency,
          passengers_count: forms.length,
          passenger_names: forms.map(f => `${f.givenName} ${f.familyName}`),
        });
      } catch { /* best-effort */ }

      // Save passenger profiles if checkbox was checked
      if (savePassenger) {
        try {
          const tpRes = await fetch('/api/profile/traveler');
          const existing = tpRes.ok ? await tpRes.json() : {};
          const lead = forms[0];
          const newCompanions: CompanionProfile[] = forms.slice(1).map(f => ({
            id: crypto.randomUUID(),
            nickname: `${f.givenName} ${f.familyName}`.trim(),
            title: f.title,
            givenName: f.givenName,
            familyName: f.familyName,
            gender: f.gender,
            bornOn: f.bornOn,
            phone: f.phoneNumber,
            passports: f.passportNumber ? [{
              id: crypto.randomUUID(),
              country: f.passportCountry || '',
              label: f.passportCountry || '',
              passportNumber: f.passportNumber,
              passportExpiry: f.passportExpiry,
            }] : [],
          }));
          // Merge: keep existing companions, update by name match or append
          const mergedCompanions: CompanionProfile[] = [...(existing.companions ?? [])];
          for (const nc of newCompanions) {
            const idx = mergedCompanions.findIndex(c =>
              c.givenName?.toLowerCase() === nc.givenName.toLowerCase() &&
              c.familyName?.toLowerCase() === nc.familyName.toLowerCase()
            );
            if (idx >= 0) mergedCompanions[idx] = { ...mergedCompanions[idx], ...nc, id: mergedCompanions[idx].id };
            else mergedCompanions.push(nc);
          }
          await fetch('/api/profile/traveler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: existing.title || lead.title,
              givenName: lead.givenName || existing.givenName || '',
              familyName: lead.familyName || existing.familyName || '',
              gender: lead.gender || existing.gender || 'm',
              bornOn: lead.bornOn || existing.bornOn || '',
              phone: lead.phoneNumber || existing.phone || '',
              passports: (() => {
                if (!lead.passportNumber) return existing.passports ?? [];
                const existingPassports = existing.passports ?? [];
                const newPassport = { id: crypto.randomUUID(), country: lead.passportCountry || '', label: lead.passportCountry || '', passportNumber: lead.passportNumber, passportExpiry: lead.passportExpiry };
                const idx = existingPassports.findIndex((p: { country: string; id?: string }) => p.country === lead.passportCountry);
                if (idx >= 0) {
                  // Update the matching country passport, keep all others
                  return existingPassports.map((p: { country: string; id?: string }, i: number) => i === idx ? { ...p, ...newPassport, id: p.id ?? newPassport.id } : p);
                }
                return [...existingPassports, newPassport];
              })(),
              companions: mergedCompanions,
            }),
          });
        } catch { /* best-effort */ }
      }
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  const departDate = depart ? new Date(depart + 'T12:00') : null;
  const departLabel = departDate && !isNaN(departDate.getTime())
    ? departDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  /* ── BOOKING VIEW ──────────────────────────────────────────────────────── */
  if (selectedOffer && bookStep !== 'confirmed') {
    const offer = selectedOffer;
    const extrasTotal = selectedServices.reduce((sum, ss) => {
      const svc = offer.availableServices.find(s => s.id === ss.serviceId);
      return sum + (svc ? svc.totalAmount * ss.quantity : 0);
    }, 0);
    const gross = calcGross(offer.totalAmount, extrasTotal);
    const processingFee = parseFloat((gross - offer.totalAmount - extrasTotal - SERVICE_FEE).toFixed(2));
    const firstSeg = offer.segments[0];
    const lastSeg = offer.segments[offer.segments.length - 1];
    const secsLeft = offerSecsLeft;
    const countdownStr = secsLeft !== null
      ? `${String(Math.floor(secsLeft / 60)).padStart(2, '0')}:${String(secsLeft % 60).padStart(2, '0')}`
      : '';
    const isExpiringSoon = secsLeft !== null && secsLeft < 600;
    const isExpired = secsLeft !== null && secsLeft <= 0;

    // ── Extras helpers (used in extras step) ───────────────────────
    function setQty(serviceId: string, qty: number) {
      setSelectedServices(prev => {
        const without = prev.filter(s => s.serviceId !== serviceId);
        return qty > 0 ? [...without, { serviceId, quantity: qty }] : without;
      });
    }
    function getQty(serviceId: string) {
      return selectedServices.find(s => s.serviceId === serviceId)?.quantity ?? 0;
    }
    function toggleService(serviceId: string) {
      setSelectedServices(prev =>
        prev.find(s => s.serviceId === serviceId)
          ? prev.filter(s => s.serviceId !== serviceId)
          : [...prev, { serviceId, quantity: 1 }]
      );
    }
    function selectSeat(segId: string, paxId: string, svcId: string) {
      const key = `${segId}_${paxId}`;
      setSeatSelections(prev => {
        const prev_svcId = prev[key];
        const newSel = { ...prev, [key]: prev_svcId === svcId ? '' : svcId };
        // Use ALL previously selected seat IDs (from the seat map) as the set to clear —
        // offer.availableServices does not contain seat map IDs, so using that would leave
        // stale IDs in selectedServices and cause Duffel "duplicate services" errors.
        const prevSeatServiceIds = Object.values(prev).filter(Boolean);
        const seatSvcIds = Object.values(newSel).filter(Boolean);
        setSelectedServices(prev2 => [
          ...prev2.filter(s => !prevSeatServiceIds.includes(s.serviceId)),
          ...seatSvcIds.map(id => ({ serviceId: id, quantity: 1 })),
        ]);
        return newSel;
      });
    }

    const baggageServices = offer.availableServices.filter(s => s.type === 'baggage');
    const seatServices = offer.availableServices.filter(s => s.type === 'seat');
    const otherServices = offer.availableServices.filter(s => s.type !== 'baggage' && s.type !== 'seat');

    return (
      <div ref={containerRef} className="mt-4 mb-12" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
        {/* Countdown banner */}
        {(offerRefreshing || booking) ? (
          <div className="w-full py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-semibold" style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE' }}>
            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            <span style={{ color: '#1D4ED8' }}>{offerRefreshing ? 'Getting latest price…' : 'Processing payment…'}</span>
          </div>
        ) : secsLeft !== null && (
          <div className="w-full py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-semibold"
            style={{ background: isExpired ? '#FFFBEB' : isExpiringSoon ? '#FFFBEB' : '#FFF7ED', borderBottom: `1px solid ${isExpired ? '#FCD34D' : isExpiringSoon ? '#FCD34D' : '#FED7AA'}` }}>
            <span>🕐</span>
            <span style={{ color: isExpired ? '#92400E' : isExpiringSoon ? '#92400E' : '#C2410C' }}>
              {isExpired ? 'Price may have updated — click Pay to confirm latest price' : 'Offer locked — seats may sell out!'}
            </span>
            {!isExpired && <span className="font-mono font-extrabold text-base tabular-nums" style={{ color: isExpiringSoon ? '#DC2626' : '#EA580C' }}>{countdownStr}</span>}
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
          {/* Back link */}
          <button onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-5 cursor-pointer">
            ← Back to results
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ── LEFT COLUMN: forms ───────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Contact details — passenger step only */}
              {bookStep === 'passenger' && savedProfile && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">For all bookings</p>
                  <p className="text-lg font-extrabold text-gray-900 mb-0.5">Contact details</p>
                  <p className="text-sm text-gray-500 mb-4">This is where your confirmation will be sent</p>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div>
                      <p className="font-semibold text-gray-900">{savedProfile.givenName} {savedProfile.familyName}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{savedProfile.email}{savedProfile.phone ? ` · ${savedProfile.phone}` : ''}</p>
                    </div>
                    <a href="/account" target="_blank" className="text-xs font-bold flex items-center gap-1" style={{ color: '#1A73E8' }}>
                      ✏️ Edit
                    </a>
                  </div>
                </div>
              )}

              {/* Passenger forms — passenger step only */}
              {bookStep === 'passenger' && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">✈️ Flight(s)</p>
                {forms.map((paxForm, idx) => {
                  const paxErrors = formErrors[idx] ?? {};
                  const destCountry = AIRPORT_COUNTRY[toCode.toUpperCase()] ?? '';
                  const paxType = offer.passengers?.[idx]?.type ?? 'adult';
                  const isInfant = paxType === 'infant_without_seat';
                  const isChild = paxType === 'child';
                  const paxTypeLabel = isInfant ? '👶 Infant (under 2)' : isChild ? '🧒 Child (2–11)' : '🧑 Adult (12+)';
                  return (
                    <div key={idx} className={idx > 0 ? 'border-t border-gray-100 pt-5 mt-5' : ''}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-lg font-extrabold text-gray-900">Passenger {idx + 1}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: isInfant ? '#FEF3C7' : isChild ? '#EFF6FF' : '#F0FDF4', color: isInfant ? '#92400E' : isChild ? '#1D4ED8' : '#15803D' }}>
                          {paxTypeLabel}
                        </span>
                      </div>
                      {isInfant && (
                        <div className="flex items-start gap-2 rounded-xl p-3 mb-3" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
                          <span className="text-base">👶</span>
                          <div>
                            <p className="text-xs font-bold text-amber-800">Infant travels on an adult&apos;s lap</p>
                            <p className="text-[11px] text-amber-700">No separate seat is included. Infant must be under 2 years old for the entire journey. A birth certificate may be required at check-in.</p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mb-1">Passenger details must match your passport or photo ID</p>
                      <p className="text-xs font-semibold mb-4" style={{ color: '#DC2626' }}>*Required field</p>

                      {/* Saved passenger select */}
                      {savedProfile && (savedProfile.passports.length > 0 || savedProfile.givenName) && (() => {
                        // Block the entire saved profile if any other passenger is already using it
                        // (same person can't fly twice on the same booking)
                        const profileTakenByOther = selectedPassportIds.some(
                          (id, i) => i !== idx && id !== '' && id !== '__manual__'
                        );
                        if (profileTakenByOther) return null; // only "new passenger" option shown below
                        return (
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Select passenger</label>
                            <select
                              value={selectedPassportIds[idx] ?? ''}
                              onChange={e => {
                                const p = savedProfile.passports.find(p => p.id === e.target.value);
                                if (p) selectPassportForPax(idx, p);
                                else setSelectedPassportIds(ids => ids.map((id, i) => i === idx ? '' : id));
                              }}
                              className={selectCls + ' w-full'}>
                              {savedProfile.passports.map((p, pi) => {
                                const label = pi === 0 && savedProfile.passports.length === 1
                                  ? `${savedProfile.givenName} ${savedProfile.familyName}${p.country ? ` — ${flagEmoji(p.country)} ${p.country}` : ''}`
                                  : `${savedProfile.givenName} ${savedProfile.familyName} — ${flagEmoji(p.country)} ${p.country}${p.country === destCountry ? ' ★ Best' : ''}`;
                                return <option key={p.id} value={p.id}>{label}</option>;
                              })}
                              <option value="">Enter new passenger details</option>
                            </select>
                          </div>
                        );
                      })()}

                      {/* Fill from saved companion (passenger 2+) */}
                      {idx > 0 && savedProfile?.companions && savedProfile.companions.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Fill from saved traveler</label>
                          <div className="flex gap-2 flex-wrap">
                            {savedProfile.companions.map(c => (
                              <button key={c.id} type="button"
                                onClick={() => {
                                  const best = c.passports.find(p => p.country === destCountry) ?? c.passports[0];
                                  updatePassenger(idx, 'title', c.title || 'mr');
                                  updatePassenger(idx, 'givenName', c.givenName);
                                  updatePassenger(idx, 'familyName', c.familyName);
                                  updatePassenger(idx, 'gender', c.gender || 'm');
                                  updatePassenger(idx, 'bornOn', c.bornOn || '');
                                  updatePassenger(idx, 'phoneNumber', c.phone || '');
                                  if (best) {
                                    updatePassenger(idx, 'passportNumber', best.passportNumber || '');
                                    updatePassenger(idx, 'passportExpiry', best.passportExpiry || '');
                                    updatePassenger(idx, 'passportCountry', best.country || '');
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition hover:opacity-80"
                                style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D' }}>
                                <span>{(c.givenName[0] || '?').toUpperCase()}</span>
                                {c.givenName} {c.familyName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gender */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Gender *</label>
                        <div className="flex items-center gap-4">
                          {[['m', 'Male'], ['f', 'Female']] .map(([val, label]) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name={`gender-${idx}`} value={val} checked={paxForm.gender === val}
                                onChange={() => updatePassenger(idx, 'gender', val)}
                                className="w-4 h-4 accent-teal-600" />
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <Field label="First and middle name *">
                          <input
                            data-error={paxErrors.givenName ? 'true' : undefined}
                            value={paxForm.givenName} onChange={e => updatePassenger(idx, 'givenName', e.target.value)} placeholder="As on passport"
                            className={inputCls + (paxErrors.givenName ? ' border-red-400' : '')} />
                          {paxErrors.givenName && <p className="text-xs text-red-500 mt-0.5">{paxErrors.givenName}</p>}
                        </Field>
                        <Field label="Last name *">
                          <input value={paxForm.familyName} onChange={e => updatePassenger(idx, 'familyName', e.target.value)} placeholder="As on passport" className={inputCls} />
                          {paxErrors.familyName && <p className="text-xs text-red-500 mt-0.5">{paxErrors.familyName}</p>}
                        </Field>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="col-span-1">
                          <Field label="Title">
                            <select value={paxForm.title} onChange={e => updatePassenger(idx, 'title', e.target.value)} className={selectCls}>
                              <option value="mr">Mr</option><option value="ms">Ms</option>
                              <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                            </select>
                          </Field>
                        </div>
                        <div className="col-span-3">
                          <Field label="Date of birth *">
                            <input type="date" value={paxForm.bornOn} onChange={e => updatePassenger(idx, 'bornOn', e.target.value)}
                              className={inputCls + (paxErrors.bornOn ? ' border-red-400' : '')} />
                            {paxErrors.bornOn && <p className="text-xs text-red-500 mt-0.5">{paxErrors.bornOn}</p>}
                          </Field>
                        </div>
                      </div>

                      {/* Nationality */}
                      <div className="mb-3">
                        <Field label="Nationality *">
                          <select
                            value={paxForm.passportCountry}
                            onChange={e => updatePassenger(idx, 'passportCountry', e.target.value)}
                            className={selectCls + ' w-full'}
                            disabled={!!(savedProfile && selectedPassportIds[idx] && selectedPassportIds[idx] !== '__manual__' && selectedPassportIds[idx] !== '')}>
                            <option value="">Select nationality…</option>
                            {COUNTRIES.map(c => (
                              <option key={c.code} value={c.code}>
                                {flagEmoji(c.code)} {c.name}{c.code === destCountry ? ' ★ Best for this route' : ''}
                              </option>
                            ))}
                          </select>
                          {paxErrors.passportCountry && <p className="text-xs text-red-500 mt-0.5">{paxErrors.passportCountry}</p>}
                        </Field>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <Field label="Passport number *">
                          <input value={paxForm.passportNumber} onChange={e => updatePassenger(idx, 'passportNumber', e.target.value.toUpperCase())}
                            placeholder="AB1234567" className={inputCls} style={{ textTransform: 'uppercase' }} />
                          {paxErrors.passportNumber && <p className="text-xs text-red-500 mt-0.5">{paxErrors.passportNumber}</p>}
                        </Field>
                        <Field label="Passport expiry *">
                          <input type="date" value={paxForm.passportExpiry} onChange={e => updatePassenger(idx, 'passportExpiry', e.target.value)} className={inputCls} />
                          {paxErrors.passportExpiry && <p className="text-xs text-red-500 mt-0.5">{paxErrors.passportExpiry}</p>}
                        </Field>
                      </div>

                      {idx === 0 ? (
                        <>
                          <Field label="Email *">
                            <input type="email" value={paxForm.email} onChange={e => updatePassenger(idx, 'email', e.target.value)} placeholder="Confirmation sent here" className={inputCls} />
                            {paxErrors.email && <p className="text-xs text-red-500 mt-0.5">{paxErrors.email}</p>}
                          </Field>
                          <div className="mt-3">
                            <Field label="Phone (with country code) *">
                              <PhoneInput value={paxForm.phoneNumber} onChange={v => updatePassenger(idx, 'phoneNumber', v)} required />
                              {paxErrors.phoneNumber && <p className="text-xs text-red-500 mt-0.5">{paxErrors.phoneNumber}</p>}
                            </Field>
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-1">
                          📧 Confirmation will be sent to {forms[0].email || 'lead passenger email'}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Save checkbox */}
                <div className="border-t border-gray-100 mt-5 pt-4 flex items-start gap-3">
                  <input type="checkbox" id="savePassenger" checked={savePassenger} onChange={e => setSavePassenger(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-teal-600 cursor-pointer flex-shrink-0" />
                  <label htmlFor="savePassenger" className="text-xs text-gray-600 cursor-pointer">
                    Save/update passenger info for future bookings.{' '}
                    <a href="/account" target="_blank" className="font-semibold underline" style={{ color: '#1A73E8' }}>See Privacy Policy</a>.
                  </label>
                </div>
              </div>}

              {/* China travel tips banner */}
              {bookStep === 'passenger' && AIRPORT_COUNTRY[toCode.toUpperCase()] === 'CN' && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0f172a 100%)', border: '1.5px solid rgba(139,92,246,0.4)' }}>
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-base font-extrabold text-white">🇨🇳 Flying to China — read before you land</p>
                    <p className="text-xs mt-0.5" style={{ color: '#C4B5FD' }}>These are things most travellers only learn the hard way.</p>
                  </div>
                  <div className="px-5 pb-4 space-y-3 mt-2">
                    {/* VPN — most critical */}
                    <a href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=151019&url_id=902" target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 rounded-xl px-4 py-3.5 transition hover:opacity-90"
                      style={{ background: 'rgba(74,0,224,0.25)', border: '1.5px solid rgba(139,92,246,0.5)' }}>
                      <span className="text-xl mt-0.5">🔒</span>
                      <div className="flex-1">
                        <p className="text-sm font-extrabold text-white">Get NordVPN now — before you fly</p>
                        <p className="text-xs mt-0.5" style={{ color: '#C4B5FD' }}>Google, WhatsApp, Instagram &amp; most Western apps are blocked. <strong className="text-white">You cannot download a VPN once inside China.</strong> Install it on your phone before boarding.</p>
                        <p className="text-xs mt-1.5 font-bold" style={{ color: '#A78BFA' }}>Get NordVPN → usually 70% off + 3 months free</p>
                      </div>
                    </a>
                    <div className="space-y-2.5">
                      <div className="flex gap-3">
                        <span className="text-base mt-0.5">💳</span>
                        <div>
                          <p className="text-sm font-bold text-white">Cash &amp; payments</p>
                          <p className="text-xs mt-0.5" style={{ color: '#A7F3D0' }}>Most shops, restaurants, and taxis only accept WeChat Pay or Alipay — credit cards rarely work outside 5-star hotels. Link your international card to WeChat Pay before you land.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-base mt-0.5">📱</span>
                        <div>
                          <p className="text-sm font-bold text-white">Must-have apps</p>
                          <p className="text-xs mt-0.5" style={{ color: '#A7F3D0' }}>WeChat (messaging + payments), DiDi (rides — only Uber-like option), Baidu Maps (works without VPN), Alipay (backup payments).</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-base mt-0.5">💵</span>
                        <div>
                          <p className="text-sm font-bold text-white">ATMs</p>
                          <p className="text-xs mt-0.5" style={{ color: '#A7F3D0' }}>ICBC and Bank of China ATMs at airports accept Visa/Mastercard. Withdraw enough cash for your first day.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Baggage included — always visible on passenger step */}
              {bookStep === 'passenger' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-sm font-extrabold text-gray-900 mb-3">🧳 What&apos;s included in this fare</p>
                  <div className="space-y-3">
                    {offer.segments.map((seg, i) => {
                      const b = seg.baggage;
                      return (
                        <div key={i} className={i > 0 ? 'border-t border-gray-100 pt-3' : ''}>
                          {offer.segments.length > 1 && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                              {seg.depCode} → {seg.arrCode} · {seg.airline}
                            </p>
                          )}
                          <div className="flex items-center gap-5 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className={b && b.carryOn > 0 ? 'text-emerald-500 font-bold text-sm' : 'text-gray-300 text-sm'}>
                                {b && b.carryOn > 0 ? '✓' : '✗'}
                              </span>
                              <span className={b && b.carryOn > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}>
                                {b && b.carryOn > 0 ? `${b.carryOn} carry-on` : 'No carry-on'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className={b && b.checkedBags > 0 ? 'text-emerald-500 font-bold text-sm' : 'text-gray-300 text-sm'}>
                                {b && b.checkedBags > 0 ? '✓' : '✗'}
                              </span>
                              <span className={b && b.checkedBags > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}>
                                {b && b.checkedBags > 0 ? `${b.checkedBags} checked bag${b.checkedBags > 1 ? 's' : ''}` : 'No checked bag'}
                              </span>
                              {(!b || b.checkedBags === 0) && (() => {
                                const hasBagSvc = baggageServices.some(s => s.segmentIds.includes(seg.segmentId ?? ''));
                                return hasBagSvc ? (
                                  <button
                                    onClick={() => {
                                      const el = document.getElementById('extras-section');
                                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
                                    style={{ background: '#E6F7F1', color: '#1D9E75' }}>
                                    + Add below
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-gray-400">— add at check-in or via airline</span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {offer.segments.some(s => !s.baggage?.checkedBags) && baggageServices.length === 0 && (
                    <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
                      <p className="text-xs font-bold text-amber-800">🧳 Need to add checked baggage?</p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        This airline doesn&apos;t sell extra bags through our platform. Add them on the airline&apos;s website after booking — always much cheaper than paying at the airport desk.
                      </p>
                    </div>
                  )}
                  {offer.segments.some(s => !s.baggage?.checkedBags) && baggageServices.length > 0 && (
                    <p className="text-[10px] text-amber-600 mt-2.5">💡 Adding baggage online is cheaper than at the airport.</p>
                  )}
                </div>
              )}

              {/* Cancellation policy card — always shown */}
              {bookStep === 'passenger' && (() => {
                const r = offer.conditions?.refundBeforeDeparture;
                const free    = r?.allowed && !r.penaltyAmount;
                const fee     = r?.allowed && r.penaltyAmount;
                const noRefund = r && !r.allowed;
                const unknown  = !r;
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-sm font-extrabold text-gray-900 mb-3">🔄 Cancellation policy</p>
                    <div className="flex items-start gap-3 p-3 rounded-xl"
                      style={free    ? { background: '#ECFDF5', border: '1px solid #BBF7D0' }
                           : fee     ? { background: '#FFFBEB', border: '1px solid #FCD34D' }
                           : noRefund ? { background: '#FEF2F2', border: '1px solid #FECACA' }
                                      : { background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span className="text-xl flex-shrink-0">
                        {free ? '✅' : fee ? '⚠️' : noRefund ? '❌' : 'ℹ️'}
                      </span>
                      <div>
                        <p className="text-sm font-bold"
                          style={{ color: free ? '#15803D' : fee ? '#92400E' : noRefund ? '#DC2626' : '#475569' }}>
                          {free     ? 'Free cancellation before departure'
                          : fee     ? `Refundable — ${r!.penaltyCurrency ?? ''} ${r!.penaltyAmount} cancellation fee`
                          : noRefund ? 'Non-refundable fare'
                                     : 'Cancellation policy not provided by airline'}
                        </p>
                        <p className="text-[11px] mt-0.5 text-gray-500">
                          {free     ? 'You can cancel this booking and receive a full refund before departure.'
                          : fee     ? 'A cancellation fee applies if you cancel before departure.'
                          : noRefund ? 'This ticket cannot be cancelled or refunded. Consider travel insurance.'
                                     : 'This airline does not publish cancellation terms via our system. Contact the airline directly or check your confirmation email for fare rules.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Payment form (shown after passenger step) */}
              {bookStep === 'payment' && (
                <div className="space-y-4">
                  {/* Passenger summaries */}
                  {forms.map((paxForm, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Passenger {idx + 1}</p>
                          <p className="font-bold text-gray-900">{cap(paxForm.title)} {cap(paxForm.givenName)} {cap(paxForm.familyName)}</p>
                          {idx === 0 && <p className="text-xs text-gray-500 mt-0.5">{paxForm.email} · {paxForm.phoneNumber}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">Passport {paxForm.passportNumber} · {flagEmoji(paxForm.passportCountry)} {paxForm.passportCountry} · Expires {paxForm.passportExpiry}</p>
                        </div>
                        <button onClick={() => setBookStep('passenger')} className="text-xs font-bold underline flex-shrink-0" style={{ color: '#1D9E75' }}>Edit</button>
                      </div>
                    </div>
                  ))}

                  {/* Test mode banner — replaces card form */}
                  {duffelTestMode && (
                    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                      <span className="text-xl flex-shrink-0">🧪</span>
                      <div>
                        <p className="text-sm font-bold text-blue-800">Test mode — no real payment needed</p>
                        <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">Duffel test balance is unlimited. Click Pay to complete a real test booking with a real confirmation number — no card required.</p>
                      </div>
                    </div>
                  )}

                  {/* Card form — live mode only */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4" style={{ display: duffelTestMode ? 'none' : undefined }}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Payment card</p>
                    <Field label="Name on card">
                      <input value={cardForm.name} onChange={e => updateCard('name', e.target.value)} placeholder="John Smith" className={inputCls} />
                      {cardErrors.name && <p className="text-xs text-red-500 mt-0.5">{cardErrors.name}</p>}
                    </Field>
                    <Field label="Card number">
                      <input value={cardForm.number} onChange={e => updateCard('number', fmtCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456" maxLength={19} className={inputCls + ' font-mono tracking-wider'} />
                      {cardErrors.number && <p className="text-xs text-red-500 mt-0.5">{cardErrors.number}</p>}
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Expiry (MM/YY)">
                        <input value={cardForm.expiry} onChange={e => updateCard('expiry', fmtExpiry(e.target.value))}
                          placeholder="06/28" maxLength={5} className={inputCls + ' font-mono'} />
                        {cardErrors.expiry && <p className="text-xs text-red-500 mt-0.5">{cardErrors.expiry}</p>}
                      </Field>
                      <Field label="CVV">
                        <input value={cardForm.cvc} onChange={e => updateCard('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123" maxLength={4} className={inputCls + ' font-mono'} type="password" />
                        {cardErrors.cvc && <p className="text-xs text-red-500 mt-0.5">{cardErrors.cvc}</p>}
                      </Field>
                    </div>
                    <p className="text-[10px] text-gray-400">🔒 Card processed securely by Duffel Payments. We never store your card details.</p>
                  </div>

                  {bookingError && (
                    <div className="rounded-xl px-4 py-3 text-sm text-red-700 font-semibold flex flex-col gap-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <div className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{bookingError.replace('__retryable__', '')}</span>
                      </div>
                      {bookingError.includes('no longer available') && (
                        <button
                          onClick={() => { setSelectedOffer(null); setBookingError(''); }}
                          className="self-start text-xs font-bold underline text-red-700 hover:text-red-900"
                        >
                          ← Search again
                        </button>
                      )}
                      {bookingError.startsWith('__retryable__') && (
                        <button
                          onClick={() => { setBookingError(''); confirmBooking(); }}
                          className="self-start text-xs font-bold underline text-red-700 hover:text-red-900"
                        >
                          ↻ Try again
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setBookStep('passenger')}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                      ← Back
                    </button>
                    <button onClick={confirmBooking} disabled={booking}
                      className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ background: holdMode ? 'linear-gradient(135deg, #1A73E8, #6366F1)' : 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                      {booking
                        ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
                        : holdMode ? '⏳ Hold seat (pay later) →' : `Pay ${fmtPrice(gross, offer.totalCurrency)} →`
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Extras — baggage (only when airline offers paid bags) */}
              {bookStep === 'passenger' && offer.availableServices.length > 0 && (
                <div id="extras-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-base font-extrabold text-gray-900">Add extras (optional)</p>
                      <p className="text-xs text-gray-400 mt-0.5">Extra baggage</p>
                    </div>
                    {extrasTotal > 0 && (
                      <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#E6F7F1', color: '#1D9E75' }}>
                        +{fmtPrice(extrasTotal, offer.totalCurrency)}
                      </span>
                    )}
                  </div>

                  {baggageServices.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-bold text-gray-700 mb-3">🧳 Extra baggage</p>
                      <div className="space-y-2">
                        {baggageServices.map(svc => {
                          const qty = getQty(svc.id);
                          return (
                            <div key={svc.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-bold text-gray-800">{svc.metadata?.maximumWeightKg ? `${svc.metadata.maximumWeightKg}kg bag` : 'Checked bag'}</p>
                                <p className="text-sm font-bold mt-0.5" style={{ color: '#1D9E75' }}>+{fmtPrice(svc.totalAmount, svc.totalCurrency)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setQty(svc.id, Math.max(0, qty - 1))}
                                  className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                                  style={{ background: qty > 0 ? '#E6F7F1' : '#F3F4F6', color: qty > 0 ? '#1D9E75' : '#9CA3AF' }}>−</button>
                                <span className="w-4 text-center text-sm font-bold tabular-nums">{qty}</span>
                                <button onClick={() => setQty(svc.id, qty + 1)}
                                  className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                                  style={{ background: '#E6F7F1', color: '#1D9E75' }}>+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Seat selection — always shown on passenger step */}
              {bookStep === 'passenger' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-base font-extrabold text-gray-900">💺 Seat selection</p>
                      <p className="text-xs text-gray-400 mt-0.5">Optional — choose your seat before booking</p>
                    </div>
                    {Object.keys(seatSelections).length > 0 && (() => {
                      const selectedCount = Object.values(seatSelections).filter(Boolean).length;
                      const legCount = seatMaps?.length ?? 1;
                      const paxCount = offer.passengerIds.length;
                      const label = legCount > 1
                        ? `${selectedCount / paxCount} of ${legCount} legs seated`
                        : `${selectedCount} seat${selectedCount > 1 ? 's' : ''} selected`;
                      return (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#E6F7F1', color: '#1D9E75' }}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                  {seatMapsLoading && (
                    <p className="text-xs text-gray-400">Checking seat availability…</p>
                  )}
                  {!seatMapsLoading && seatMaps && seatMaps.length === 0 && (
                    <p className="text-sm text-gray-500">Seat selection isn&apos;t available for this flight. You can choose your seat during online check-in.</p>
                  )}
                  {!seatMapsLoading && seatMaps && seatMaps.length > 0 && (
                    <div className="mt-4 space-y-5">
                      {seatMaps.map(sm => {
                        const seg = offer.segments.find(s => s.segmentId === sm.segmentId);
                        const cabin = sm.cabins[0];
                        if (!cabin) return null;
                        const cabinLabel = fmtCabin(seg?.cabinClass ?? cabin.cabinClass);
                        const smIdx = seatMaps!.indexOf(sm);
                        return (
                          <div key={sm.segmentId}>
                            {seatMaps!.length > 1 && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#0F172A', color: 'white' }}>
                                  LEG {smIdx + 1}
                                </span>
                                <p className="text-sm font-bold text-gray-800">
                                  {seg ? `${seg.depCode} → ${seg.arrCode}` : `Segment ${smIdx + 1}`}
                                </p>
                                <span className="text-xs text-gray-400">{cabinLabel}</span>
                              </div>
                            )}
                            {seatMaps!.length === 1 && (
                              <p className="text-xs font-bold text-gray-500 mb-3">
                                {seg ? `${seg.depCode} → ${seg.arrCode} · ${cabinLabel}` : `Segment 1 · ${cabinLabel}`}
                              </p>
                            )}
                            {offer.passengerIds.map((paxId, pi) => (
                              <div key={paxId} className="mb-4">
                                {offer.passengerIds.length > 1 && (
                                  <p className="text-xs font-semibold text-gray-400 mb-2">Passenger {pi + 1}</p>
                                )}
                                <div className="overflow-x-auto">
                                  <div className="inline-block">
                                    {cabin.rows.map((row, ri) => (
                                      <div key={ri} className="flex gap-1 mb-1">
                                        {row.sections.map((sec, si) => (
                                          <div key={si} className="flex gap-1">
                                            {si > 0 && <div className="w-5" />}
                                            {sec.elements.map((el, ei) => {
                                              if (el.type !== 'seat') return <div key={ei} className="w-8 h-8" />;
                                                              const paxSvc = el.available_services?.find(a => a.passenger_id === paxId);
                                              const available = !!paxSvc;
                                              const mapKey = `${sm.segmentId}_${paxId}`;
                                              const selected = !!paxSvc?.id && seatSelections[mapKey] === paxSvc.id;
                                              const seatPrice = paxSvc ? parseFloat(paxSvc.total_amount) : 0;
                                              const isSeatPaid = seatPrice > 0;
                                              return (
                                                <button key={ei} disabled={!available}
                                                  onClick={() => paxSvc && selectSeat(sm.segmentId, paxId, paxSvc.id)}
                                                  title={`${el.designator ?? ''}${paxSvc ? ` · ${isSeatPaid ? '+' + fmtPrice(seatPrice, paxSvc.total_currency) : 'Free'}` : ''}`}
                                                  className="w-8 h-8 rounded flex flex-col items-center justify-center transition-colors gap-0"
                                                  style={{
                                                    background: selected ? (isSeatPaid ? '#D97706' : '#1D9E75') : available ? (isSeatPaid ? '#FFFBEB' : '#E6F7F1') : '#F3F4F6',
                                                    color: selected ? 'white' : available ? (isSeatPaid ? '#B45309' : '#1D9E75') : '#D1D5DB',
                                                    border: selected ? `1.5px solid ${isSeatPaid ? '#D97706' : '#1D9E75'}` : available ? `1px solid ${isSeatPaid ? '#FDE68A' : '#A7F3D0'}` : '1px solid #E5E7EB',
                                                    cursor: available ? 'pointer' : 'not-allowed',
                                                  }}>
                                                  <span className="text-[10px] font-bold leading-none">{el.designator?.replace(/\d+/, '') ?? ''}</span>
                                                  {available && seatPrice > 0 && <span className="text-[7px] leading-none opacity-80">+${Math.round(seatPrice)}</span>}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#E6F7F1', border: '1px solid #A7F3D0' }} /> Available</span>
                        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#1D9E75' }} /> Selected</span>
                        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }} /> Taken</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Airport lounges — inline below extras on passenger step */}
              {bookStep === 'passenger' && (() => {
                // Only show lounges for departure + layover airports — not the final destination
                const allCodes = Array.from(new Set(offer.segments.map(s => s.depCode)));
                const airports = allCodes
                  .map(code => ({ code, guide: getLayoverGuide(code) }))
                  .filter(({ guide }) => guide?.lounges);
                if (!airports.length) return null;

                const parseLounges = (raw: string) =>
                  raw.split(/;\s*(?=[A-Z])/).map(entry => {
                    const name = entry.replace(/\s*\(.*/, '').trim();
                    const detail = entry.match(/\(([^)]+)\)/)?.[1] ?? '';
                    const price = detail.match(/~?\$\d+/)?.[0] ?? '';
                    const is24h = detail.toLowerCase().includes('24h');
                    const hasShower = detail.toLowerCase().includes('shower');
                    const payAtDoor = detail.toLowerCase().includes('pay');
                    const includesFood = /food|buffet|meal/i.test(detail);
                    return { name, price, is24h, hasShower, payAtDoor, includesFood };
                  });

                return (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E3A5F' }}>
                    {/* Header */}
                    <div className="relative overflow-hidden" style={{ minHeight: 80 }}>
                      {(() => {
                        const withImg = airports.find(a => a.guide?.cityImage);
                        if (!withImg?.guide?.cityImage) return null;
                        return (
                          <img
                            src={`https://images.unsplash.com/${withImg.guide.cityImage}?auto=format&fit=crop&w=700&q=80`}
                            alt={withImg.guide.city}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ opacity: 0.22 }}
                          />
                        );
                      })()}
                      <div className="relative px-5 pt-4 pb-4" style={{ background: 'linear-gradient(135deg, rgba(15,41,66,0.97) 0%, rgba(26,60,94,0.93) 100%)' }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-extrabold text-white">🛋️ Airport Lounges on your route</p>
                            <p className="text-[11px] mt-0.5" style={{ color: '#93C5FD' }}>
                              Rest, eat and freshen up at your airports — no Priority Pass needed
                            </p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ml-3"
                            style={{ background: '#1D4ED8', color: '#BFDBFE', border: '1px solid #2563EB' }}>
                            ONLY ON CHEAPSTAY
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Per-airport cards */}
                    <div className="p-4 space-y-4" style={{ background: '#F8FAFC' }}>
                      {airports.map(({ code, guide }) => {
                        const isLayover = offer.segments.slice(0, -1).some(s => s.arrCode === code);
                        const isArrival = offer.segments[offer.segments.length - 1].arrCode === code;
                        const role = isArrival ? 'Arrival' : isLayover ? 'Layover' : 'Departure';
                        const roleColor = isLayover ? { bg: '#FEF9C3', text: '#92400E' } : isArrival ? { bg: '#EFF6FF', text: '#1D4ED8' } : { bg: '#ECFDF5', text: '#15803D' };
                        const lounges = parseLounges(guide!.lounges!);
                        return (
                          <div key={code} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            {guide!.cityImage ? (
                              <div className="relative h-24 overflow-hidden">
                                <img
                                  src={`https://images.unsplash.com/${guide!.cityImage}?auto=format&fit=crop&w=700&h=150&q=80`}
                                  alt={guide!.city}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%)' }} />
                                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                                  <span className="text-xl">{guide!.flag}</span>
                                  <div>
                                    <p className="text-base font-extrabold text-white leading-none">{guide!.city}</p>
                                    <p className="text-[10px] text-white/60">{code} · {role}</p>
                                  </div>
                                  <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: roleColor.bg, color: roleColor.text }}>{role}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <span className="text-xl">{guide!.flag}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-900">{guide!.city} <span className="text-gray-400 font-normal text-xs">({code})</span></p>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: roleColor.bg, color: roleColor.text }}>{role}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 truncate">{guide!.airport}</p>
                                </div>
                              </div>
                            )}
                            <div className="p-3 space-y-2">
                              {lounges.map((l, li) => (
                                <div key={li} className="flex items-start justify-between gap-3 py-2 px-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #EEF2F7' }}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900">{l.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {l.payAtDoor && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FEF9C3', color: '#92400E' }}>💳 Walk-in</span>}
                                      {l.is24h && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>🕐 24h</span>}
                                      {l.hasShower && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#F0F9FF', color: '#0369A1' }}>🚿 Shower</span>}
                                      {l.includesFood && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FFF7ED', color: '#C2410C' }}>🍽️ Food</span>}
                                    </div>
                                  </div>
                                  {l.price && (
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-lg font-extrabold" style={{ color: '#1D9E75' }}>{l.price}</span>
                                      <p className="text-[9px] text-gray-400 leading-none mt-0.5">per person</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Layover tips — only for stopovers, not departure airport */}
                            {isLayover && guide!.tips.length > 0 && (
                              <div className="px-3 pb-3" style={{ borderTop: '1px solid #EEF2F7' }}>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide pt-2.5 mb-2">
                                  🗺️ How to spend your time in {guide!.city}
                                </p>
                                <div className="space-y-1.5">
                                  {guide!.tips.slice(0, 3).map((tip, ti) => (
                                    <div key={ti} className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                                      <span className="text-sm flex-shrink-0 mt-0.5">{tip.icon}</span>
                                      <div>
                                        <p className="text-[11px] font-bold text-gray-800">{tip.title}</p>
                                        <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{tip.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Continue button on passenger step */}
              {bookStep === 'passenger' && (() => {
                const hasAnyError = formErrors.some(e => Object.keys(e).length > 0);
                const missingFields = formErrors.flatMap((e, idx) =>
                  Object.entries(e).map(([field]) => {
                    const fieldNames: Record<string, string> = {
                      givenName: 'First name', familyName: 'Last name', bornOn: 'Date of birth',
                      email: 'Email', phoneNumber: 'Phone', passportNumber: 'Passport number',
                      passportExpiry: 'Passport expiry', passportCountry: 'Nationality',
                    };
                    return `Passenger ${idx + 1}: ${fieldNames[field] ?? field}`;
                  })
                );
                return (
                  <div className="space-y-2">
                    {hasAnyError && (
                      <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                        <div>
                          <p className="text-xs font-bold text-red-700">Please fill in all required fields</p>
                          <ul className="mt-1 space-y-0.5">
                            {missingFields.map((f, i) => (
                              <li key={i} className="text-[11px] text-red-600">• {f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (validateForms()) setBookStep('payment');
                        else {
                          // Scroll to first error
                          setTimeout(() => {
                            const el = document.querySelector('[data-error="true"]');
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }
                      }}
                      className="w-full py-4 rounded-2xl text-sm font-bold text-white transition"
                      style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)', opacity: 1 }}>
                      {extrasTotal > 0 ? `Continue with +${fmtPrice(extrasTotal, offer.totalCurrency)} →` : 'Continue to payment →'}
                    </button>
                    {offer.paymentRequirements && !offer.paymentRequirements.requiresInstantPayment && (
                      <button
                        onClick={() => {
                          if (!validateForms()) return;
                          setHoldMode(true);
                          setBookStep('payment');
                        }}
                        title={offer.paymentRequirements.paymentRequiredBy ? `Pay by ${new Date(offer.paymentRequirements.paymentRequiredBy).toLocaleDateString()}` : undefined}
                        className="w-full py-3 rounded-2xl text-sm font-bold border-2 transition"
                        style={{ borderColor: '#1A73E8', color: '#1A73E8', background: 'white' }}>
                        ⏳ Hold seat — pay later{offer.paymentRequirements.paymentRequiredBy ? ` (by ${new Date(offer.paymentRequirements.paymentRequiredBy).toLocaleDateString()})` : ''}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── EXTRAS STEP (kept for type compat but never rendered) ── */}
            {bookStep === 'extras' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-lg font-extrabold text-gray-900">Customize your trip</p>
                    </div>
                  </div>

                  {/* BAGGAGE */}
                  {baggageServices.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-bold text-gray-700 mb-3">🧳 Extra baggage</p>
                      <div className="space-y-3">
                        {baggageServices.map(svc => {
                          const meta = svc.metadata as { maximum_weight_kg?: number; bag_type?: string };
                          const label = meta.bag_type === 'checked'
                            ? `${meta.maximum_weight_kg ?? '?'}kg checked bag`
                            : meta.bag_type === 'carry_on'
                            ? `Carry-on${meta.maximum_weight_kg ? ` (${meta.maximum_weight_kg}kg)` : ''}`
                            : 'Extra bag';
                          const segLabel = svc.segmentIds.length === offer.segments.length
                            ? 'All segments'
                            : svc.segmentIds.map(id => offer.segments.find(s => s.segmentId === id)?.depCode ?? id).join(' → ');
                          const qty = getQty(svc.id);
                          return (
                            <div key={svc.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-bold text-gray-800">🧳 {label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{segLabel} · {svc.passengerIds.length} passenger{svc.passengerIds.length > 1 ? 's' : ''}</p>
                                <p className="text-sm font-extrabold mt-1" style={{ color: '#1D9E75' }}>{fmtPrice(svc.totalAmount, svc.totalCurrency)} each</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <button onClick={() => setQty(svc.id, Math.max(0, qty - 1))}
                                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-base font-bold transition-colors"
                                  style={{ borderColor: qty > 0 ? '#1D9E75' : '#E2E8F0', color: qty > 0 ? '#1D9E75' : '#9CA3AF', background: qty > 0 ? '#E6F7F1' : 'white' }}>
                                  −
                                </button>
                                <span className="w-6 text-center text-base font-extrabold text-gray-900">{qty}</span>
                                <button onClick={() => setQty(svc.id, Math.min(svc.maximumQuantity, qty + 1))}
                                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-base font-bold transition-colors"
                                  style={{ borderColor: qty < svc.maximumQuantity ? '#1D9E75' : '#E2E8F0', color: qty < svc.maximumQuantity ? '#1D9E75' : '#9CA3AF', background: qty < svc.maximumQuantity ? '#E6F7F1' : 'white' }}>
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SEAT SELECTION */}
                  {offer.segments.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-bold text-gray-700 mb-3">💺 Seat selection</p>
                      {seatMapsLoading && (
                        <p className="text-xs text-gray-400">Checking seat availability…</p>
                      )}
                      {!seatMapsLoading && seatMaps && seatMaps.length === 0 && (
                        <p className="text-sm text-gray-500">Seat selection isn&apos;t available for this flight. You can choose your seat during online check-in.</p>
                      )}
                      {!seatMapsLoading && seatMaps && seatMaps.length > 0 && (
                        <div className="mt-4 space-y-5">
                          {seatMaps.map(sm => {
                            const seg = offer.segments.find(s => s.segmentId === sm.segmentId);
                            const cabin = sm.cabins[0];
                            if (!cabin) return null;
                            const cabinLabel = fmtCabin(seg?.cabinClass ?? cabin.cabinClass);
                            return (
                              <div key={sm.segmentId}>
                                <p className="text-xs font-bold text-gray-500 mb-3">
                                  {seg ? `${seg.depCode} → ${seg.arrCode} · ${cabinLabel}` : `Segment ${seatMaps!.indexOf(sm) + 1} · ${cabinLabel}`}
                                </p>
                                {offer.passengerIds.map((paxId, pi) => (
                                  <div key={paxId} className="mb-4">
                                    {offer.passengerIds.length > 1 && (
                                      <p className="text-xs font-semibold text-gray-400 mb-2">Passenger {pi + 1}</p>
                                    )}
                                    <div className="overflow-x-auto">
                                      <div className="inline-block min-w-full">
                                        {cabin.rows.map((row, ri) => (
                                          <div key={ri} className="flex gap-1 mb-1">
                                            {row.sections.map((sec, si) => (
                                              <div key={si} className="flex gap-1">
                                                {si > 0 && <div className="w-5" />}
                                                {sec.elements.map((el, ei) => {
                                                  if (el.type !== 'seat') return <div key={ei} className="w-8 h-8" />;
                                                  const paxSvc = el.available_services?.find(a => a.passenger_id === paxId);
                                                  const available = !!paxSvc;
                                                  const key = `${sm.segmentId}_${paxId}`;
                                                  const selected = !!paxSvc?.id && seatSelections[key] === paxSvc.id;
                                                  const price = paxSvc ? parseFloat(paxSvc.total_amount) : 0;
                                                  const isPaid = price > 0;
                                                  return (
                                                    <button key={ei} disabled={!available}
                                                      onClick={() => paxSvc && selectSeat(sm.segmentId, paxId, paxSvc.id)}
                                                      title={el.designator + (el.disclosures?.length ? ` · ${el.disclosures[0]}` : '') + (price ? ` · +${fmtPrice(price, paxSvc?.total_currency ?? offer.totalCurrency)}` : ' · Free')}
                                                      className="w-8 h-8 rounded flex flex-col items-center justify-center transition-colors gap-0"
                                                      style={{
                                                        background: selected ? (isPaid ? '#D97706' : '#1D9E75') : available ? (isPaid ? '#FFFBEB' : '#E6F7F1') : '#F3F4F6',
                                                        color: selected ? 'white' : available ? (isPaid ? '#B45309' : '#1D9E75') : '#D1D5DB',
                                                        border: selected ? `1.5px solid ${isPaid ? '#D97706' : '#1D9E75'}` : available ? `1px solid ${isPaid ? '#FDE68A' : '#A7F3D0'}` : '1px solid #E5E7EB',
                                                        cursor: available ? 'pointer' : 'not-allowed',
                                                      }}>
                                                      <span className="text-[10px] font-bold leading-none">{el.designator?.replace(/\d+/, '') ?? ''}</span>
                                                      {available && price > 0 && <span className="text-[7px] leading-none opacity-80">+${Math.round(price)}</span>}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            ))}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {(() => {
                                      const key = `${sm.segmentId}_${paxId}`;
                                      const selSvcId = seatSelections[key];
                                      if (!selSvcId) return null;
                                      let designator = '', price = 0, currency = offer.totalCurrency;
                                      for (const row of cabin.rows) for (const sec of row.sections) for (const el of sec.elements) {
                                        const svc = el.available_services?.find(a => a.id === selSvcId);
                                        if (svc) { designator = el.designator ?? ''; price = parseFloat(svc.total_amount); currency = svc.total_currency; }
                                      }
                                      return <p className="text-xs font-semibold mt-1" style={{ color: '#1D9E75' }}>✓ Seat {designator} · +{fmtPrice(price, currency)}</p>;
                                    })()}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#E6F7F1', border: '1px solid #A7F3D0' }} /> Free</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }} /> Paid</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#1D9E75' }} /> Selected</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }} /> Taken</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OTHER SERVICES */}
                  {otherServices.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-3">🎁 Other add-ons</p>
                      <div className="space-y-2">
                        {otherServices.map(svc => {
                          const added = !!selectedServices.find(s => s.serviceId === svc.id);
                          return (
                            <div key={svc.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-bold text-gray-800 capitalize">{svc.type.replace(/_/g, ' ')}</p>
                                <p className="text-sm font-bold mt-0.5" style={{ color: '#1D9E75' }}>{fmtPrice(svc.totalAmount, svc.totalCurrency)}</p>
                              </div>
                              <button onClick={() => toggleService(svc.id)}
                                className="text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                                style={added
                                  ? { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
                                  : { background: '#E6F7F1', color: '#1D9E75', border: '1px solid #A7F3D0' }}>
                                {added ? '− Remove' : '+ Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {baggageServices.length === 0 && seatServices.length === 0 && otherServices.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No add-ons available for this flight.</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setBookStep('passenger')}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                    ← Back
                  </button>
                  <button onClick={() => setBookStep('payment')}
                    className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                    {extrasTotal > 0 ? `Continue with +${fmtPrice(extrasTotal, offer.totalCurrency)} →` : 'Skip → Continue to payment'}
                  </button>
                </div>
              </div>
            )}

            {/* ── RIGHT COLUMN: summary + conditions ───────────────────── */}
            <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4">
              {/* Flight card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-gray-900 mb-0.5">{fromCode} to {toCode}</p>
                <p className="text-xs text-gray-400 mb-3">✈️ FLIGHT · {[
                  offer.passengers.filter(p => p.type === 'adult').length > 0 && `${offer.passengers.filter(p => p.type === 'adult').length} adult${offer.passengers.filter(p => p.type === 'adult').length > 1 ? 's' : ''}`,
                  offer.passengers.filter(p => p.type === 'child').length > 0 && `${offer.passengers.filter(p => p.type === 'child').length} child${offer.passengers.filter(p => p.type === 'child').length > 1 ? 'ren' : ''}`,
                  offer.passengers.filter(p => p.type === 'infant_without_seat').length > 0 && `${offer.passengers.filter(p => p.type === 'infant_without_seat').length} infant${offer.passengers.filter(p => p.type === 'infant_without_seat').length > 1 ? 's' : ''}`,
                ].filter(Boolean).join(' · ')}</p>
                <div className="space-y-3 mb-3">
                  {offer.segments.map((seg, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-semibold text-gray-400 mb-1">
                        {i === 0 ? `Depart · ${new Date(seg.depAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}` : `Connection`}
                      </p>
                      <div className="flex items-center gap-2">
                        <AirlineLogo code={seg.airlineCode} name={seg.airline} />
                        <span className="hidden" aria-hidden />
                        <div className="flex-1">
                          <p className="text-sm font-extrabold text-gray-900">
                            {seg.depCode} {fmtTime(seg.depAt)} → {seg.arrCode} {fmtTime(seg.arrAt)}
                          </p>
                          <p className="text-[10px] text-gray-400">{seg.airline} · {seg.flightNumber}{seg.aircraft ? ` · ${seg.aircraft}` : ''}</p>
                          {seg.amenities && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {seg.amenities.food && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: seg.amenities.food.cost === 'free' ? '#ECFDF5' : '#F1F5F9', color: seg.amenities.food.cost === 'free' ? '#15803D' : '#64748B' }}>🍽️ {seg.amenities.food.cost === 'free' ? 'Meal free' : 'Meal paid'}</span>}
                              {seg.amenities.drink && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: seg.amenities.drink.cost === 'free' ? '#ECFDF5' : '#F1F5F9', color: seg.amenities.drink.cost === 'free' ? '#15803D' : '#64748B' }}>🍸 {seg.amenities.drink.cost === 'free' ? 'Drinks free' : 'Drinks paid'}</span>}
                              {seg.amenities.entertainment && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: seg.amenities.entertainment.cost === 'free' ? '#ECFDF5' : '#F1F5F9', color: seg.amenities.entertainment.cost === 'free' ? '#15803D' : '#64748B' }}>🎬 {seg.amenities.entertainment.cost === 'free' ? 'Entertainment free' : 'Entertainment paid'}</span>}
                              {seg.amenities.wifi && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: seg.amenities.wifi.cost === 'free' ? '#ECFDF5' : '#F1F5F9', color: seg.amenities.wifi.cost === 'free' ? '#15803D' : '#64748B' }}>📶 {seg.amenities.wifi.cost === 'free' ? 'WiFi free' : 'WiFi paid'}</span>}
                              {seg.amenities.power && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>🔌 Power</span>}
                              {seg.amenities.seat?.type && seg.amenities.seat.type !== 'standard' && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>💺 {seg.amenities.seat.type.replace(/_/g, ' ')}{seg.amenities.seat.pitch ? ` ${seg.amenities.seat.pitch}"` : ''}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {seg.layoverAfter && (
                        <div className="mt-2 ml-10">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: '#FEF9C3', color: '#92400E' }}>
                            Layover {offer.segments[i + 1]?.depCode} · {seg.layoverAfter}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setSidebarDetailsOpen(o => !o)}
                  className="text-xs font-semibold flex items-center gap-1 cursor-pointer w-full py-2 px-3 rounded-xl border transition-colors"
                  style={{ color: '#1A73E8', borderColor: '#BFDBFE', background: sidebarDetailsOpen ? '#EFF6FF' : '#F8FAFF' }}>
                  {sidebarDetailsOpen ? '▲' : '▼'} {sidebarDetailsOpen ? 'Hide' : 'View'} flight details &amp; policies
                </button>

                {sidebarDetailsOpen && (
                  <div className="mt-3 space-y-3 text-xs">
                    {/* Per-segment baggage */}
                    <div>
                      <p className="font-bold text-gray-600 mb-1.5">🧳 Baggage allowance</p>
                      {offer.segments.map((seg, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-gray-500">{seg.depCode} → {seg.arrCode} <span className="text-gray-400">({seg.airline})</span></span>
                          <span className="font-semibold text-gray-700">
                            {seg.baggage?.carryOn ? `1 carry-on` : 'No carry-on'}
                            {seg.baggage?.checkedBags ? ` + ${seg.baggage.checkedBags} checked` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Fare conditions */}
                    <div>
                      <p className="font-bold text-gray-600 mb-1.5">📋 Fare conditions</p>
                      {(() => {
                        const r = (offer as DuffelOffer & { conditions?: { refund_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string } } }).conditions?.refund_before_departure;
                        if (!r) return <p className="text-gray-400">Fare rules not available — check with airline.</p>;
                        return (
                          <div className="rounded-lg px-3 py-2" style={r.allowed ? { background: '#ECFDF5', color: '#166534' } : { background: '#FEF2F2', color: '#991B1B' }}>
                            {r.allowed
                              ? r.penalty_amount
                                ? `Refundable with ${r.penalty_currency ?? ''} ${r.penalty_amount} cancellation fee`
                                : 'Free cancellation before departure'
                              : 'Non-refundable fare — no refund if cancelled'}
                          </div>
                        );
                      })()}
                    </div>
                    <p className="text-gray-400 leading-relaxed">Name changes are not permitted after booking. Ensure all passenger names match travel documents exactly.</p>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-gray-900 mb-3">Price breakdown</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{offer.passengers.length === 1 ? 'Fare' : `Fare (${offer.passengers.length} passengers)`}</span>
                    <span className="font-semibold">{fmtPrice(offer.totalAmount, offer.totalCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Base fare</span>
                    <span>{fmtPrice(offer.totalAmount - (offer.totalAmount * 0.2), offer.totalCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Taxes and fees</span>
                    <span>{fmtPrice(offer.totalAmount * 0.2, offer.totalCurrency)}</span>
                  </div>
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-xs font-semibold" style={{ color: '#1D9E75' }}>
                      <span>Add-ons</span>
                      <span>+{fmtPrice(extrasTotal, offer.totalCurrency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Service fee</span>
                    <span>{fmtPrice(SERVICE_FEE, offer.totalCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Processing (2.9%)</span>
                    <span>{fmtPrice(processingFee, offer.totalCurrency)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold" style={{ color: '#DC2626' }}>{fmtPrice(gross, offer.totalCurrency)}</span>
                </div>
              </div>

              {/* Credit card / miles offer */}
              {(() => {
                const airlineCodes = [...new Set(offer.segments.map(s => s.airlineCode))];
                const cards = getCardOffers(airlineCodes);
                const estPoints = Math.round(gross * 3); // 3x on travel for Chase/Amex
                return (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #C7D2FE', background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)' }}>
                    <div className="px-4 pt-4 pb-2">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-sm font-extrabold" style={{ color: '#1E40AF' }}>✨ Earn miles on this booking</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>SAVE MORE</span>
                      </div>
                      <p className="text-[11px]" style={{ color: '#3730A3' }}>
                        {offer.totalCurrency === 'USD'
                          ? `Pay $${Math.round(gross).toLocaleString()} and earn ~${estPoints.toLocaleString()} points — worth ~$${Math.round(estPoints * 0.015).toLocaleString()} in future travel`
                          : `The right card earns miles on every dollar spent`}
                      </p>
                    </div>
                    <div className="px-3 pb-3 space-y-2">
                      {cards.map((card, i) => {
                        const issuerStyle = ISSUER_STYLE[card.issuer] ?? { bg: '#F1F5F9', color: '#475569' };
                        return (
                          <a key={i} href={card.url} target="_blank" rel="noopener noreferrer sponsored"
                            className="flex items-start gap-3 bg-white rounded-xl px-3 py-3 shadow-sm transition hover:shadow-md"
                            style={{ border: '1px solid #E0E7FF' }}>
                            {/* Card art — real image or CSS gradient card */}
                            <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-md"
                              style={{ width: 72, height: 46 }}>
                              {card.cardArt ? (
                                <img
                                  src={card.cardArt}
                                  alt={card.name}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    // Fallback to gradient on load error
                                    const t = e.currentTarget;
                                    t.style.display = 'none';
                                    if (t.parentElement) {
                                      t.parentElement.style.background = card.cardGradient ?? '#1A3A5C';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full relative flex flex-col justify-between p-1.5"
                                  style={{ background: card.cardGradient ?? '#1A3A5C' }}>
                                  {/* Chip */}
                                  <div className="w-5 h-3.5 rounded-sm opacity-80"
                                    style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F0E68C 50%, #B8960C 100%)' }} />
                                  {/* Card name */}
                                  <p className="text-[7px] font-bold leading-none truncate"
                                    style={{ color: card.cardTextColor ?? '#fff' }}>
                                    {card.name.replace(/®/g, '').split(' ').slice(0, 3).join(' ')}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[11px] font-extrabold text-gray-900 leading-snug">{card.name}</p>
                                {card.highlight && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: issuerStyle.bg, color: issuerStyle.color }}>
                                    {card.highlight}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{card.headline}</p>
                              <p className="text-[10px] font-semibold mt-1" style={{ color: '#15803D' }}>🎁 {card.bonus}</p>
                            </div>
                            <span className="text-xs font-bold flex-shrink-0 mt-1" style={{ color: '#1D4ED8' }}>Apply →</span>
                          </a>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-center pb-2" style={{ color: '#94A3B8' }}>
                      Affiliate links — we may earn a commission at no cost to you
                    </p>
                  </div>
                );
              })()}

              {/* Booking conditions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-gray-900 mb-3">Booking conditions</p>
                <div className="space-y-2.5 text-xs text-gray-500">
                  {[
                    'Passenger(s) are responsible for ensuring that all necessary travel documents are valid and available upon travel.',
                    'Please ensure that your contact information in your booking is correct. We cannot be held responsible for issues related to inaccurate contact details.',
                    'If the airline(s) makes changes to your flight(s), the airline is responsible for the change. We will do our best to notify you of any changes.',
                    'Cancellation and refund policies are set by the airline. Please check the fare rules before booking.',
                    'Name corrections may not be possible after booking. Ensure passenger names match travel documents exactly.',
                    'By completing this booking you agree to our Terms of Service and the airline\'s conditions of carriage.',
                  ].map((cond, i) => (
                    <p key={i} className="flex gap-2">
                      <span className="text-gray-300 flex-shrink-0">•</span>
                      <span>{cond}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── CONFIRMATION VIEW ───────────────────────────────────────────────────── */
  if (bookStep === 'confirmed' && confirmation && selectedOffer) {
    const firstSeg = selectedOffer.segments[0];
    const lastSeg  = selectedOffer.segments[selectedOffer.segments.length - 1];
    const isHeld   = !!confirmation.held;

    // Format hold expiry into human-readable string + urgency flag
    let holdExpiryLabel = '';
    let holdExpiryUrgent = false;
    if (isHeld && confirmation.paymentRequiredBy) {
      const exp = new Date(confirmation.paymentRequiredBy);
      const diffMs = exp.getTime() - Date.now();
      const diffH = diffMs / 3600000;
      holdExpiryUrgent = diffH < 4;
      if (diffH < 1) {
        holdExpiryLabel = `${Math.max(1, Math.round(diffMs / 60000))} minutes`;
      } else if (diffH < 24) {
        const h = Math.floor(diffH);
        const m = Math.round((diffH - h) * 60);
        holdExpiryLabel = `${h}h${m > 0 ? ` ${m}m` : ''}`;
      } else {
        holdExpiryLabel = exp.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
          ' at ' + exp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
    }

    const cabin = firstSeg.cabinClass ?? 'economy';
    const isBusinessOrFirst = cabin === 'business' || cabin === 'first';
    const cabinLabel = cabin === 'first' ? 'First Class' : cabin === 'business' ? 'Business' : cabin === 'premium_economy' ? 'Premium Economy' : 'Economy';

    // Theme: amber=held, gold=business/first, green=economy confirmed
    const accentRgb    = isHeld ? '217,119,6' : isBusinessOrFirst ? '212,175,55'  : '29,158,117';
    const accentHex    = isHeld ? '#D97706'    : isBusinessOrFirst ? '#D4AF37'     : '#1D9E75';
    const bgGradient   = isHeld
      ? 'linear-gradient(160deg, #1a1200 0%, #2d1f00 60%, #1a1200 100%)'
      : isBusinessOrFirst
      ? cabin === 'first'
        ? 'linear-gradient(160deg, #0d0618 0%, #1a0b2e 50%, #0f1a10 100%)'
        : 'linear-gradient(160deg, #0f0d00 0%, #1f1800 50%, #0a1628 100%)'
      : 'linear-gradient(160deg, #0a1628 0%, #0f2e4a 60%, #0d3d2e 100%)';

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 mt-8 mb-16">

        {/* Boarding-pass card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: bgGradient }}>

          {/* Top section — route + status icon */}
          <div className="px-8 pt-8 pb-6 text-center">
            {/* Icon — larger + gold for Business/First */}
            <div className={`${isBusinessOrFirst ? 'w-16 h-16' : 'w-14 h-14'} rounded-full flex items-center justify-center mx-auto mb-5`}
              style={{
                background: `rgba(${accentRgb},${isBusinessOrFirst ? '0.22' : '0.18'})`,
                border: `${isBusinessOrFirst ? '2px' : '1.5px'} solid rgba(${accentRgb},${isBusinessOrFirst ? '0.6' : '0.4'})`,
                boxShadow: isBusinessOrFirst ? `0 0 32px rgba(${accentRgb},0.25)` : 'none',
              }}>
              <span style={{ fontSize: isBusinessOrFirst ? 28 : 22 }}>
                {isHeld ? '⏳' : isBusinessOrFirst ? '✦' : '✓'}
              </span>
            </div>
            <p className="font-bold tracking-widest uppercase mb-1"
              style={{ fontSize: isBusinessOrFirst ? 11 : 10, color: `rgba(${accentRgb},0.95)` }}>
              {isHeld ? 'Seat held — payment pending' : isBusinessOrFirst ? `${cabinLabel} confirmed` : 'Booking confirmed'}
            </p>
            <h2 className="font-extrabold text-white mb-1"
              style={{ fontSize: isBusinessOrFirst ? 26 : 22 }}>
              {fromName} → {toName}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {firstSeg.airline} · {fmtDate(depart + 'T12:00')}
            </p>
            {/* Cabin pill — more prominent for premium cabins */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full"
              style={{
                background: `rgba(${accentRgb},${isBusinessOrFirst ? '0.25' : '0.15'})`,
                border: `1px solid rgba(${accentRgb},${isBusinessOrFirst ? '0.55' : '0.35'})`,
                boxShadow: isBusinessOrFirst ? `0 0 16px rgba(${accentRgb},0.2)` : 'none',
              }}>
              {isBusinessOrFirst && <span style={{ color: accentHex, fontSize: 12 }}>✦</span>}
              <span className="font-bold tracking-wide" style={{ fontSize: isBusinessOrFirst ? 13 : 11, color: accentHex }}>{cabinLabel}</span>
            </div>
          </div>

          {/* Tear-line divider */}
          <div className="relative flex items-center px-0 my-0">
            <div className="w-6 h-6 rounded-full flex-shrink-0 -ml-3" style={{ background: '#F8FAFC' }} />
            <div className="flex-1 border-t-2 border-dashed mx-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <div className="w-6 h-6 rounded-full flex-shrink-0 -mr-3" style={{ background: '#F8FAFC' }} />
          </div>

          {/* Reference + details */}
          <div className="px-8 pt-6 pb-8">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Booking reference</p>
            <p className="text-5xl font-extrabold tracking-widest mb-5" style={{
              color: isBusinessOrFirst ? accentHex : 'white',
              textShadow: `0 0 40px rgba(${accentRgb},${isBusinessOrFirst ? '0.7' : '0.5'})`,
              letterSpacing: '0.15em',
            }}>
              {confirmation.reference}
            </p>

            {/* 3-col detail row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>From</p>
                <p className="text-sm font-bold text-white">{firstSeg.depCode}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{firstSeg.depCity}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Duration</p>
                <p className="text-sm font-bold text-white">{selectedOffer.totalDuration}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {selectedOffer.segments.length > 1 ? `${selectedOffer.segments.length - 1} stop` : 'Direct'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>To</p>
                <p className="text-sm font-bold text-white">{lastSeg.arrCode}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{lastSeg.arrCity}</p>
              </div>
            </div>

            {/* Cabin class row — clearly labeled */}
            <div className="flex items-center justify-between mb-5 py-2.5 px-3 rounded-xl"
              style={{ background: `rgba(${accentRgb},0.12)`, border: `1px solid rgba(${accentRgb},0.3)` }}>
              <p className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Cabin class</p>
              <p className="text-sm font-extrabold" style={{ color: accentHex }}>
                {isBusinessOrFirst ? '✦ ' : ''}{cabinLabel}
              </p>
            </div>

            {/* Passenger + price row */}
            <div className="flex items-center justify-between py-4 px-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Passenger</p>
                <p className="text-sm font-semibold text-white">{cap(forms[0]?.givenName)} {cap(forms[0]?.familyName)}{forms.length > 1 ? ` +${forms.length - 1}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {isHeld ? 'Amount due' : 'Total paid'}
                </p>
                <p className="text-lg font-extrabold" style={{ color: accentHex }}>{fmtPrice(confirmation.amount, confirmation.currency)}</p>
              </div>
            </div>

            {/* Hold expiry banner */}
            {isHeld && (
              <div className="mt-4 rounded-xl px-4 py-3" style={{
                background: holdExpiryUrgent ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)',
                border: `1px solid ${holdExpiryUrgent ? 'rgba(220,38,38,0.3)' : 'rgba(217,119,6,0.3)'}`,
              }}>
                {holdExpiryLabel ? (
                  <>
                    <p className="text-xs font-bold text-center" style={{ color: holdExpiryUrgent ? '#FCA5A5' : '#FCD34D' }}>
                      ⚠️ Hold expires in {holdExpiryLabel}
                    </p>
                    <p className="text-[10px] text-center mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Your seat is not confirmed until payment is complete
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-center" style={{ color: '#FCD34D' }}>
                    ⚠️ Seat held — pay before the deadline to confirm
                  </p>
                )}
              </div>
            )}

            <p className="text-[10px] text-center mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {isHeld ? `Reference: ${confirmation.reference}` : `Confirmation sent to ${forms[0]?.email}`}
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-4 space-y-2.5">
          <button onClick={() => window.location.href = '/bookings'}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: isHeld ? 'linear-gradient(135deg, #D97706, #B45309)' : accentHex }}>
            {isHeld ? 'Pay now to confirm seat →' : 'View my bookings →'}
          </button>
          <button onClick={onClear}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors"
            style={{ color: 'rgba(100,116,139,1)', background: 'white', border: '1.5px solid #E2E8F0' }}>
            Search another flight
          </button>
        </div>
      </div>
    );
  }

  /* ── RESULTS LIST VIEW ───────────────────────────────────────────────────── */
  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>{fromName}</span><span className="text-gray-300">→</span><span>{toName}</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {departLabel}{ret && ` · Return ${new Date(ret + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
            {!ret && ' · One way'} · {[
              adults > 0 && `${adults} adult${adults !== 1 ? 's' : ''}`,
              children > 0 && `${children} child${children !== 1 ? 'ren' : ''}`,
              infants > 0 && `${infants} infant${infants !== 1 ? 's' : ''}`,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button onClick={onClear}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200">
          ✕ New search
        </button>
      </div>

      {/* Visa banner */}
      <div className="mb-5"><VisaBanner passportCodes={passportCodes} city={toName} /></div>

      {/* Date price strip */}
      {(() => {
        const baseDate = depart ? new Date(depart + 'T12:00:00Z') : null;
        if (!baseDate || isNaN(baseDate.getTime())) return null;
        const chips = [-2, -1, 0, 1, 2].map(offset => {
          const d = new Date(baseDate);
          d.setUTCDate(d.getUTCDate() + offset);
          const iso = d.toISOString().slice(0, 10);
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          return { iso, label };
        });
        return (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {chips.map(({ iso, label }) => {
              const isActive = iso === activeDate;
              const isBest = iso === bestPriceDate;
              const price = chipPrices[iso];
              const isLoading = (iso === activeDate && loading) || (iso !== activeDate && chipPrices[iso] === undefined && prefetchingDates.current.has(iso));
              const borderColor = isActive ? '#1A73E8' : isBest ? '#16A34A' : '#E5E7EB';
              const bgColor = isActive ? '#EEF4FE' : isBest ? '#F0FDF4' : '#FFFFFF';
              const labelColor = isActive ? '#1A73E8' : isBest ? '#16A34A' : '#374151';
              const priceColor = isActive ? '#1A73E8' : isBest ? '#15803D' : '#111827';
              return (
                <button
                  key={iso}
                  onClick={() => { if (iso !== activeDate) setActiveDate(iso); }}
                  className="flex-shrink-0 rounded-xl px-3.5 py-2.5 text-left transition-all cursor-pointer"
                  style={{ border: `${isActive || isBest ? '2px' : '1.5px'} solid ${borderColor}`, background: bgColor, minWidth: 90 }}
                >
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold" style={{ color: labelColor }}>{label}</p>
                    {isBest && !isActive && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: '#DCFCE7', color: '#15803D' }}>Best</span>}
                  </div>
                  {isLoading ? (
                    <div className="h-3 w-14 bg-gray-200 rounded animate-pulse mt-1" />
                  ) : price != null ? (
                    <p className="text-[12px] font-bold mt-0.5" style={{ color: priceColor }}>
                      {!isActive && '~'}{price.toLocaleString('en-US', { style: 'currency', currency: chipCurrency, maximumFractionDigits: 0 })}
                    </p>
                  ) : (
                    <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>See prices</p>
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}

      <div className="flex gap-5 items-start">
        {/* ── Filter sidebar (desktop only) */}
        {!loading && !searchError && offers.length > 0 && (
          <div className="hidden lg:block w-56 flex-shrink-0 space-y-5 sticky top-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">

              {/* Recommended */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">Recommended</p>
                  {filterBaggage && (
                    <button onClick={() => setFilterBaggage(false)} className="text-[11px] font-bold cursor-pointer" style={{ color: '#1A73E8' }}>Clear</button>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterBaggage} onChange={e => setFilterBaggage(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#1D9E75' }} />
                  <span className="text-sm text-gray-700">Checked baggage included</span>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">Stops</p>
                  {filterStops.size > 0 && (
                    <button onClick={() => setFilterStops(new Set())} className="text-[11px] font-bold cursor-pointer" style={{ color: '#1A73E8' }}>Clear</button>
                  )}
                </div>
                {[{ label: 'Direct', val: 0 }, { label: '1 Stop', val: 1 }, { label: '2 Stops+', val: 2 }].map(({ label, val }) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input type="checkbox"
                      checked={filterStops.has(val)}
                      onChange={() => {
                        setFilterStops(prev => {
                          const next = new Set(prev);
                          next.has(val) ? next.delete(val) : next.add(val);
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#1D9E75' }} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {/* Airlines */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">Airlines</p>
                  {filterAirlines.size > 0 && (
                    <button onClick={() => setFilterAirlines(new Set())} className="text-[11px] font-bold cursor-pointer" style={{ color: '#1A73E8' }}>Clear</button>
                  )}
                </div>
                <label className="flex items-center justify-between gap-2 mb-3 cursor-pointer">
                  <span className="text-sm text-gray-600">Select all airlines</span>
                  <div
                    onClick={() => setFilterAirlines(new Set())}
                    className="w-10 h-5 rounded-full cursor-pointer transition-colors flex items-center px-0.5"
                    style={{ background: filterAirlines.size === 0 ? '#6B7280' : '#1D9E75' }}>
                    <div className="w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: filterAirlines.size === 0 ? 'translateX(18px)' : 'translateX(0)' }} />
                  </div>
                </label>
                {(showAllAirlines ? allAirlines : allAirlines.slice(0, 5)).map(airline => (
                  <label key={airline} className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input type="checkbox"
                      checked={filterAirlines.has(airline)}
                      onChange={() => {
                        setFilterAirlines(prev => {
                          const next = new Set(prev);
                          next.has(airline) ? next.delete(airline) : next.add(airline);
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#1D9E75' }} />
                    <span className="text-sm text-gray-700 truncate">{airline}</span>
                  </label>
                ))}
                {allAirlines.length > 5 && (
                  <button onClick={() => setShowAllAirlines(v => !v)}
                    className="text-[11px] font-bold mt-1 cursor-pointer flex items-center gap-1"
                    style={{ color: '#1A73E8' }}>
                    {showAllAirlines ? '↑ Show less' : `↓ Show ${allAirlines.length - 5} more`}
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterStops(new Set()); setFilterAirlines(new Set()); setFilterBaggage(false); }}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition"
                  style={{ background: '#FEF2F2', color: '#DC2626' }}>
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Main results column */}
        <div className="flex-1 min-w-0">

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <svg className="animate-spin w-3.5 h-3.5" style={{ color: '#1D9E75' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Searching live flights…
          </p>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Error */}
      {!loading && searchError && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-2xl mb-2">✈️</p>
          <p className="font-bold text-gray-700 mb-1">No flights found</p>
          <p className="text-sm text-gray-400">{searchError}</p>
        </div>
      )}

      {/* Flight cards */}
      {!loading && !searchError && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400">
              {hasActiveFilters ? `${filteredOffers.length} of ${offers.length}` : offers.length} flight{offers.length !== 1 ? 's' : ''} · prices include all fees
            </p>
          </div>
          {filteredOffers.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-sm font-bold text-gray-600">No flights match your filters</p>
              <button onClick={() => { setFilterStops(new Set()); setFilterAirlines(new Set()); setFilterBaggage(false); }}
                className="mt-2 text-xs font-bold cursor-pointer" style={{ color: '#1A73E8' }}>
                Clear all filters
              </button>
            </div>
          )}
          {filteredOffers.map(offer => {
            const gross = calcGross(offer.totalAmount);
            const isExpanded = expanded === offer.id;
            const stops = offer.segments.length - 1;
            const firstSeg = offer.segments[0];
            const lastSeg = offer.segments[offer.segments.length - 1];
            const depDate = new Date(firstSeg.depAt);
            const arrDate = new Date(lastSeg.arrAt);
            const daysDiff = Math.floor((arrDate.getTime() - depDate.getTime()) / 86400000);
            const uniqueAirlines = [...new Map(offer.segments.map(s => [s.airlineCode, s.airline])).entries()];
            const marketingAirline = firstSeg;

            return (
              <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                {/* ── Top bar: airline + cabin ── */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <div className="flex items-center gap-2.5">
                    <AirlineLogo code={marketingAirline.airlineCode} name={marketingAirline.airline} />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{marketingAirline.airline}</p>
                      {uniqueAirlines.length > 1 && (
                        <p className="text-[11px] text-gray-400">
                          operated by {uniqueAirlines.filter(([code]) => code !== marketingAirline.airlineCode).map(([, name]) => name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>{fmtCabin(firstSeg.cabinClass ?? 'economy')}</span>
                </div>

                {/* ── Main row: times + price ── */}
                <div className="px-5 py-4 flex items-center gap-3 sm:gap-5">
                  {/* Departure */}
                  <div className="flex-shrink-0">
                    <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tabular-nums leading-tight">{fmtTime(firstSeg.depAt)}</p>
                    <p className="text-sm font-bold text-gray-600 mt-0.5">{firstSeg.depCode}</p>
                    <p className="text-[11px] text-gray-400">{fmtDate(firstSeg.depAt)}</p>
                  </div>

                  {/* Center: duration + stops */}
                  <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0 px-1">
                    <p className="text-xs font-semibold text-gray-400">{offer.totalDuration}</p>
                    <div className="flex items-center w-full gap-1.5">
                      <div className="h-px flex-1" style={{ background: '#CBD5E1' }} />
                      {stops === 0
                        ? <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                            style={{ background: '#ECFDF5', color: '#15803D' }}>Direct</span>
                        : <button onClick={() => setExpanded(isExpanded ? null : offer.id)}
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                            style={{ background: '#FEF9C3', color: '#92400E' }}>
                            {stops} stop{stops > 1 ? 's' : ''} <span>{isExpanded ? '▲' : '▼'}</span>
                          </button>
                      }
                      <div className="h-px flex-1" style={{ background: '#CBD5E1' }} />
                    </div>
                    <p className="text-[10px] text-gray-400">{offer.segments[0].airline}</p>
                  </div>

                  {/* Arrival */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tabular-nums leading-tight">
                      {fmtTime(lastSeg.arrAt)}
                      {daysDiff > 0 && <sup className="text-sm font-extrabold" style={{ color: '#EF4444', verticalAlign: 'super', fontSize: '0.55em' }}>+{daysDiff}</sup>}
                    </p>
                    <p className="text-sm font-bold text-gray-600 mt-0.5">{lastSeg.arrCode}</p>
                    <p className="text-[11px] text-gray-400">{fmtDate(lastSeg.arrAt)}</p>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-14 flex-shrink-0" style={{ background: '#E2E8F0' }} />

                  {/* Price + Book */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">{offer.totalCurrency}</p>
                    <p className="text-3xl font-extrabold tabular-nums leading-tight" style={{ color: '#DC2626' }}>
                      {Math.round(gross).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 mb-2.5">all fees included</p>
                    <button onClick={() => startBooking(offer)}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap hover:opacity-90 transition-opacity"
                      style={{ background: '#1D9E75' }}>
                      Book →
                    </button>
                  </div>
                </div>

                {/* Mobile: price + book row */}
                <div className="sm:hidden px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#DC2626' }}>{fmtPrice(gross, offer.totalCurrency)}</p>
                    <p className="text-[10px] text-gray-400">all fees included</p>
                  </div>
                  <button onClick={() => startBooking(offer)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: '#1D9E75' }}>
                    Book →
                  </button>
                </div>

                {/* Expand/collapse button for direct flights */}
                {stops === 0 && (
                  <button onClick={() => setExpanded(isExpanded ? null : offer.id)}
                    className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    style={{ borderTop: '1px solid #F8FAFC' }}>
                    {isExpanded ? '▲ Hide itinerary' : '▼ Show itinerary'}
                  </button>
                )}

                {/* ── Expanded timeline ── */}
                {isExpanded && (
                  <div className="px-6 py-6" style={{ borderTop: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                    {offer.segments.map((seg, i) => {
                      const depDay = fmtDate(seg.depAt);
                      const arrDay = fmtDate(seg.arrAt);
                      return (
                        <div key={i}>
                          {/* Segment timeline */}
                          <div className="flex gap-5">
                            {/* Timeline dots + line */}
                            <div className="flex flex-col items-center flex-shrink-0 pt-1.5" style={{ width: 20 }}>
                              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: '#1D9E75', border: '3px solid #A7F3D0' }} />
                              <div className="flex-1 w-0.5 my-1.5" style={{ background: '#E2E8F0', minHeight: 100 }} />
                              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: i < offer.segments.length - 1 ? '#64748B' : '#1D9E75', border: `3px solid ${i < offer.segments.length - 1 ? '#CBD5E1' : '#A7F3D0'}` }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-3">
                              {/* Departure node */}
                              <div className="flex items-baseline gap-2.5 mb-1">
                                <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">{fmtTime(seg.depAt)}</p>
                                <p className="text-sm text-gray-400">{depDay}</p>
                              </div>
                              <p className="text-base font-bold text-gray-800 mb-0.5">{seg.depCity} <span className="text-gray-400 font-semibold">({seg.depCode})</span></p>

                              {/* Flight details */}
                              <div className="my-4 pl-4 py-3 rounded-xl" style={{ borderLeft: '3px solid #E2E8F0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <AirlineLogo code={seg.airlineCode} name={seg.airline} />
                                  <span className="text-sm font-bold text-gray-800">{seg.airline}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {fmtCabin(seg.cabinClass ?? 'economy')} · {seg.flightNumber}{seg.aircraft ? ` · ${seg.aircraft}` : ''} · {seg.duration}
                                </p>
                                {seg.baggage && (seg.baggage.checkedBags > 0 || seg.baggage.carryOn > 0) && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {seg.baggage.carryOn > 0 && `🎒 Carry-on included`}
                                    {seg.baggage.carryOn > 0 && seg.baggage.checkedBags > 0 && ' · '}
                                    {seg.baggage.checkedBags > 0 && `🧳 ${seg.baggage.checkedBags} checked bag${seg.baggage.checkedBags > 1 ? 's' : ''} included`}
                                  </p>
                                )}
                                {seg.amenities && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {seg.aircraft && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#475569' }}>
                                        ✈️ {seg.aircraft}
                                      </span>
                                    )}
                                    {seg.amenities.seat?.type && seg.amenities.seat.type !== 'standard' && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#475569' }}>
                                        💺 {seg.amenities.seat.type.replace(/_/g, ' ')}
                                        {seg.amenities.seat.pitch ? ` · ${seg.amenities.seat.pitch}"` : ''}
                                      </span>
                                    )}
                                    {seg.amenities.wifi && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: seg.amenities.wifi.cost === 'free' ? '#ECFDF5' : '#F8FAFC', color: seg.amenities.wifi.cost === 'free' ? '#15803D' : '#64748B' }}>
                                        📶 {seg.amenities.wifi.desc} {seg.amenities.wifi.cost === 'free' ? '(Free)' : '(Paid)'}
                                      </span>
                                    )}
                                    {seg.amenities.entertainment && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: seg.amenities.entertainment.cost === 'free' ? '#ECFDF5' : '#F8FAFC', color: seg.amenities.entertainment.cost === 'free' ? '#15803D' : '#64748B' }}>
                                        🎬 {seg.amenities.entertainment.desc} {seg.amenities.entertainment.cost === 'free' ? '(Free)' : '(Paid)'}
                                      </span>
                                    )}
                                    {seg.amenities.food && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: seg.amenities.food.cost === 'free' ? '#ECFDF5' : '#F8FAFC', color: seg.amenities.food.cost === 'free' ? '#15803D' : '#64748B' }}>
                                        🍽️ {seg.amenities.food.desc} {seg.amenities.food.cost === 'free' ? '(Free)' : '(Paid)'}
                                      </span>
                                    )}
                                    {seg.amenities.drink && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: seg.amenities.drink.cost === 'free' ? '#ECFDF5' : '#F8FAFC', color: seg.amenities.drink.cost === 'free' ? '#15803D' : '#64748B' }}>
                                        🍸 {seg.amenities.drink.desc} {seg.amenities.drink.cost === 'free' ? '(Free)' : '(Paid)'}
                                      </span>
                                    )}
                                    {seg.amenities.power && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F8FAFC', color: '#64748B' }}>
                                        🔌 {seg.amenities.power.desc} {seg.amenities.power.cost === 'free' ? '(Free)' : '(Paid)'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Arrival node */}
                              <div className="flex items-baseline gap-2.5 mb-1">
                                <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">{fmtTime(seg.arrAt)}</p>
                                <p className="text-sm text-gray-400">{arrDay}</p>
                              </div>
                              <p className="text-base font-bold text-gray-800">{seg.arrCity} <span className="text-gray-400 font-semibold">({seg.arrCode})</span></p>
                            </div>
                          </div>

                          {/* Layover bubble */}
                          {seg.layoverAfter && (() => {
                            const nextCode = offer.segments[i + 1]?.depCode ?? '';
                            const mins = parseLayoverMinutes(seg.layoverAfter);
                            const guide = mins >= LAYOVER_GUIDE_THRESHOLD_MIN ? getLayoverGuide(nextCode) : null;
                            return (
                              <div className="flex gap-5 my-4">
                                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                                  <div className="flex-1 w-0.5" style={{ background: '#FDE68A' }} />
                                </div>
                                <div className="flex-1">
                                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold mb-2"
                                    style={{ background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' }}>
                                    🚶 {seg.layoverAfter} layover · {nextCode}
                                  </div>
                                  {guide && (
                                    <div className="rounded-xl p-3 space-y-2" style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                                      <p className="text-xs font-bold text-gray-700">{guide.flag} {guide.city} — quick tips</p>
                                      {guide.tips.slice(0, 2).map((tip, ti) => (
                                        <p key={ti} className="text-[11px] text-gray-500">
                                          {tip.icon} <span className="font-semibold">{tip.title}</span> — {tip.desc.slice(0, 80)}
                                        </p>
                                      ))}
                                      <a href="https://saily.com/" target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border mt-1"
                                        style={{ color: '#1D9E75', borderColor: '#1D9E75' }}>
                                        📶 Get eSIM for {nextCode}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* ── Airport lounges in expanded card ──────────────── */}
                    {(() => {
                    // Only departure + layover airports — not the final destination
                    const allCodes = Array.from(new Set(offer.segments.map(s => s.depCode)));
                    const airports = allCodes
                      .map(code => ({ code, guide: getLayoverGuide(code) }))
                      .filter(({ guide }) => guide?.lounges);
                    if (!airports.length) return null;

                    const parseLoungesInline = (raw: string) =>
                      raw.split(/;\s*(?=[A-Z])/).map(entry => {
                        const name = entry.replace(/\s*\(.*/, '').trim();
                        const detail = entry.match(/\(([^)]+)\)/)?.[1] ?? '';
                        const price = detail.match(/~?\$\d+/)?.[0] ?? '';
                        const is24h = detail.toLowerCase().includes('24h');
                        const hasShower = detail.toLowerCase().includes('shower');
                        const payAtDoor = detail.toLowerCase().includes('pay');
                        const includesFood = /food|buffet|meal/i.test(detail);
                        return { name, price, is24h, hasShower, payAtDoor, includesFood };
                      });

                    return (
                      <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #1E3A5F' }}>
                        {/* Header */}
                        <div className="relative overflow-hidden" style={{ minHeight: 90 }}>
                          {/* City image backdrop (first airport with image) */}
                          {(() => {
                            const withImg = airports.find(a => a.guide?.cityImage);
                            if (!withImg?.guide?.cityImage) return null;
                            return (
                              <img
                                src={`https://images.unsplash.com/${withImg.guide.cityImage}?auto=format&fit=crop&w=700&q=80`}
                                alt={withImg.guide.city}
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ opacity: 0.28 }}
                              />
                            );
                          })()}
                          <div className="relative px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, rgba(15,41,66,0.96) 0%, rgba(26,60,94,0.92) 100%)' }}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-extrabold text-white">🛋️ Airport Lounges on this route</p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#93C5FD' }}>
                                  Rest, eat and freshen up at your airports — no Priority Pass needed
                                </p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2"
                                style={{ background: '#1D4ED8', color: '#BFDBFE', border: '1px solid #2563EB' }}>
                                ONLY ON CHEAPSTAY
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Per-airport lounge cards */}
                        <div className="p-3 space-y-3" style={{ background: '#F8FAFC' }}>
                          {airports.map(({ code, guide }, ai) => {
                            const isLayover = offer.segments.slice(0, -1).some(s => s.arrCode === code);
                            const isArrival = offer.segments[offer.segments.length - 1].arrCode === code;
                            const role = isArrival ? 'Arrival' : isLayover ? 'Layover' : 'Departure';
                            const roleColor = isLayover
                              ? { bg: '#FEF9C3', text: '#92400E' }
                              : isArrival
                              ? { bg: '#EFF6FF', text: '#1D4ED8' }
                              : { bg: '#ECFDF5', text: '#15803D' };
                            const lounges = parseLoungesInline(guide!.lounges!);

                            return (
                              <div key={code} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                {/* Airport row with optional city image strip */}
                                {guide!.cityImage && (
                                  <div className="relative h-20 overflow-hidden">
                                    <img
                                      src={`https://images.unsplash.com/${guide!.cityImage}?auto=format&fit=crop&w=600&h=120&q=80`}
                                      alt={guide!.city}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 100%)' }} />
                                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                                      <span className="text-lg">{guide!.flag}</span>
                                      <div>
                                        <p className="text-sm font-extrabold text-white leading-none">{guide!.city}</p>
                                        <p className="text-[10px] text-white/70">{code} · {guide!.airport}</p>
                                      </div>
                                      <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: roleColor.bg, color: roleColor.text }}>
                                        {role}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {!guide!.cityImage && (
                                  <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <span className="text-lg">{guide!.flag}</span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900">{code}</p>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                          style={{ background: roleColor.bg, color: roleColor.text }}>{role}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400">{guide!.airport}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Lounge list */}
                                <div className="p-3 space-y-2">
                                  {lounges.map((l, li) => (
                                    <div key={li} className="flex items-start justify-between gap-3 py-2 px-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #EEF2F7' }}>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{l.name}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {l.payAtDoor && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FEF9C3', color: '#92400E' }}>💳 Walk-in</span>}
                                          {l.is24h && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>🕐 24h</span>}
                                          {l.hasShower && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#F0F9FF', color: '#0369A1' }}>🚿 Shower</span>}
                                          {l.includesFood && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FFF7ED', color: '#C2410C' }}>🍽️ Food</span>}
                                        </div>
                                      </div>
                                      {l.price && (
                                        <div className="text-right flex-shrink-0">
                                          <span className="text-base font-extrabold" style={{ color: '#1D9E75' }}>{l.price}</span>
                                          <p className="text-[9px] text-gray-400">per person</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {/* Layover tips — only for stopovers */}
                                {isLayover && guide!.tips.length > 0 && (
                                  <div className="px-3 pb-3" style={{ borderTop: '1px solid #EEF2F7' }}>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide pt-2.5 mb-2">
                                      🗺️ How to spend your time in {guide!.city}
                                    </p>
                                    <div className="space-y-1.5">
                                      {guide!.tips.slice(0, 3).map((tip, ti) => (
                                        <div key={ti} className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                                          <span className="text-sm flex-shrink-0 mt-0.5">{tip.icon}</span>
                                          <div>
                                            <p className="text-[11px] font-bold text-gray-800">{tip.title}</p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{tip.desc}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </div>{/* end main results column */}
      </div>{/* end flex wrapper */}
    </div>
  );
}

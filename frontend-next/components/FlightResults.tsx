'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import VisaBanner from '@/components/VisaBanner';
import { getLayoverGuide, parseLayoverMinutes, LAYOVER_GUIDE_THRESHOLD_MIN } from '@/lib/layover-guides';
import { flagEmoji } from '@/lib/visa-data';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface SegmentAmenity { desc: string; cost: string }
interface Segment {
  depCode: string; depCity: string; depAt: string;
  arrCode: string; arrCity: string; arrAt: string;
  airline: string; airlineCode: string; flightNumber: string;
  duration: string; aircraft: string; layoverAfter: string;
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
interface TravelerProfile {
  title: string; givenName: string; familyName: string; gender: string;
  bornOn: string; phone: string; passports: SavedPassport[]; email: string;
}

interface Props {
  fromCode: string; toCode: string;
  fromName: string; toName: string;
  depart: string; ret: string;
  adults?: number;
  children?: number;
  infants?: number;
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

export default function FlightResults({ fromCode, toCode, fromName, toName, depart, ret, adults = 1, children = 0, infants = 0, onClear, passportCodes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Search state
  const [offers, setOffers] = useState<DuffelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Filters
  const [filterStops, setFilterStops] = useState<Set<number>>(new Set());
  const [filterAirlines, setFilterAirlines] = useState<Set<string>>(new Set());
  const [filterBaggage, setFilterBaggage] = useState(false);
  const [showAllAirlines, setShowAllAirlines] = useState(false);

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
  const [confirmation, setConfirmation] = useState<{ reference: string; amount: number; currency: string } | null>(null);
  const [savePassenger, setSavePassenger] = useState(false);
  // Live countdown for offer expiry
  const [offerSecsLeft, setOfferSecsLeft] = useState<number | null>(null);
  // Add-on services
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [seatMaps, setSeatMaps] = useState<SeatMap[] | null>(null);
  const [seatMapsLoading, setSeatMapsLoading] = useState(false);
  const [seatMapsOpen, setSeatMapsOpen] = useState(false);
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
      body: JSON.stringify({ origin: fromCode, destination: toCode, departureDate: depart, returnDate: ret || undefined, adults, children, infants }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) setSearchError(json.detail || 'No flights found for this route.');
        else if (!json.offers?.length) setSearchError('No flights found for this route and date.');
        else setOffers(json.offers);
      })
      .catch(() => setSearchError('Search failed — please try again.'))
      .finally(() => setLoading(false));
  }, [fromCode, toCode, depart, ret]);

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

  function startBooking(offer: DuffelOffer) {
    window.history.pushState({ cheapstayBooking: true }, '');
    setSelectedOffer(offer);
    setBookStep('passenger');
    setCardForm(EMPTY_CARD); setCardErrors({});
    setBookingError(''); setConfirmation(null);
    setSelectedServices([]); setSeatMaps(null); setSeatMapsOpen(false); setSeatSelections({});

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
      const newForms = [firstForm, ...Array.from({ length: numPax - 1 }, () => ({ ...EMPTY_FORM, email: savedProfile.email || '' }))];
      setForms(newForms);
      setSelectedPassportIds([best?.id || '', ...Array(numPax - 1).fill('')]);
    } else {
      setForms(Array.from({ length: numPax }, () => ({ ...EMPTY_FORM })));
      setSelectedPassportIds(Array(numPax).fill(''));
    }
    setFormErrors(Array.from({ length: numPax }, () => ({})));
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updatePassenger(idx: number, key: keyof PassengerForm, val: string) {
    setForms(fs => fs.map((f, i) => i === idx ? { ...f, [key]: val } : f));
    setFormErrors(es => es.map((e, i) => i === idx ? { ...e, [key]: '' } : e));
  }
  function updateCard(key: keyof CardForm, val: string) {
    setCardForm(f => ({ ...f, [key]: val }));
    setCardErrors(e => ({ ...e, [key]: '' }));
  }

  function selectPassportForPax(idx: number, p: SavedPassport) {
    setSelectedPassportIds(ids => ids.map((id, i) => i === idx ? p.id : id));
    setForms(fs => fs.map((f, i) => i === idx ? { ...f, passportNumber: p.passportNumber, passportExpiry: p.passportExpiry, passportCountry: p.country } : f));
    setFormErrors(es => es.map((e, i) => i === idx ? { ...e, passportNumber: '', passportExpiry: '', passportCountry: '' } : e));
  }

  function validateForms(): boolean {
    const allErrs = forms.map(form => {
      const errs: Partial<PassengerForm> = {};
      if (!form.givenName.trim())       errs.givenName = 'Required';
      if (!form.familyName.trim())      errs.familyName = 'Required';
      if (!form.email.includes('@'))    errs.email = 'Valid email required';
      if (!form.bornOn)                 errs.bornOn = 'Required';
      if (!form.phoneNumber.trim())     errs.phoneNumber = 'Required';
      if (!form.passportNumber.trim())  errs.passportNumber = 'Required';
      if (!form.passportExpiry)         errs.passportExpiry = 'Required';
      if (!form.passportCountry.trim()) errs.passportCountry = 'Required (2-letter, e.g. US)';
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
    if (!selectedOffer || !validateCard()) return;

    // Check offer hasn't expired before hitting Duffel
    if (selectedOffer.expiresAt && new Date(selectedOffer.expiresAt) < new Date()) {
      setBookingError('OFFER_EXPIRED');
      return;
    }

    setBooking(true); setBookingError('');
    try {
      const extrasTotal = selectedServices.reduce((sum, ss) => {
        const svc = selectedOffer.availableServices.find(s => s.id === ss.serviceId);
        return sum + (svc ? svc.totalAmount * ss.quantity : 0);
      }, 0);
      const piRes = await fetch('/api/flights/duffel-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: (selectedOffer.totalAmount + extrasTotal).toFixed(2), currency: selectedOffer.totalCurrency }),
      });
      const pi = await piRes.json();
      if (pi.error) {
        const piMsg = pi.detail || pi.error;
        if (piMsg.toLowerCase().includes('does not exist') || piMsg.toLowerCase().includes('not exist')) throw new Error('OFFER_EXPIRED');
        throw new Error(piMsg);
      }

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
        const cardMsg = err?.errors?.[0]?.message || 'Card was declined';
        if (cardMsg.toLowerCase().includes('does not exist') || cardMsg.toLowerCase().includes('not exist')) throw new Error('OFFER_EXPIRED');
        throw new Error(cardMsg);
      }

      const orderRes = await fetch('/api/flights/duffel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: selectedOffer.id,
          paymentIntentId: pi.paymentIntentId,
          passengers: forms.map((f, i) => ({ ...f, passengerId: selectedOffer.passengerIds[i] })),
          services: selectedServices,
        }),
      });
      const order = await orderRes.json();
      if (order.error) {
        const msg = order.detail || order.error;
        // Duffel "does not exist" = offer expired between search and checkout
        if (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('not exist')) {
          throw new Error('OFFER_EXPIRED');
        }
        throw new Error(msg);
      }

      setConfirmation({ reference: order.bookingReference, amount: pi.grossAmount, currency: selectedOffer.totalCurrency });
      setBookStep('confirmed');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  const departLabel = new Date(depart + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

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
    function loadSeatMaps() {
      if (seatMaps) { setSeatMapsOpen(o => !o); return; }
      setSeatMapsLoading(true);
      fetch(`/api/flights/seat-map?offerId=${offer.id}`)
        .then(r => r.json())
        .then(d => { if (d.maps) setSeatMaps(d.maps); })
        .catch(() => {})
        .finally(() => { setSeatMapsLoading(false); setSeatMapsOpen(true); });
    }
    function selectSeat(segId: string, paxId: string, svcId: string) {
      const key = `${segId}_${paxId}`;
      setSeatSelections(prev => {
        const prev_svcId = prev[key];
        const newSel = { ...prev, [key]: prev_svcId === svcId ? '' : svcId };
        const allSeatServiceIds = offer.availableServices.filter(s => s.type === 'seat').map(s => s.id);
        const seatSvcIds = Object.values(newSel).filter(Boolean);
        setSelectedServices(prev2 => [
          ...prev2.filter(s => !allSeatServiceIds.includes(s.serviceId)),
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
        {secsLeft !== null && (
          <div className="w-full py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-semibold"
            style={{ background: isExpired ? '#FEF2F2' : isExpiringSoon ? '#FFFBEB' : '#FFF7ED', borderBottom: `1px solid ${isExpired ? '#FECACA' : isExpiringSoon ? '#FCD34D' : '#FED7AA'}` }}>
            <span>{isExpired ? '❌' : '🕐'}</span>
            <span style={{ color: isExpired ? '#B91C1C' : isExpiringSoon ? '#92400E' : '#C2410C' }}>
              {isExpired ? 'This offer has expired — please pick a fresh flight' : `These deals may not last!`}
            </span>
            {!isExpired && <span className="font-mono font-extrabold text-base tabular-nums" style={{ color: isExpiringSoon ? '#DC2626' : '#EA580C' }}>{countdownStr}</span>}
            {isExpired && (
              <button onClick={() => window.history.back()}
                className="ml-2 text-xs font-bold px-3 py-1 rounded-lg text-white"
                style={{ background: '#1D9E75' }}>
                ← Back to flights
              </button>
            )}
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

              {/* Contact details */}
              {savedProfile && (
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

              {/* Passenger forms */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
                      {savedProfile && (savedProfile.passports.length > 0 || savedProfile.givenName) && (
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
                            {savedProfile.givenName && (
                              <option value={savedProfile.passports[0]?.id ?? 'profile'}>
                                {savedProfile.givenName} {savedProfile.familyName}
                                {savedProfile.passports[0] ? ` — ${flagEmoji(savedProfile.passports[0].country)} ${savedProfile.passports[0].country}` : ''}
                              </option>
                            )}
                            {savedProfile.passports.slice(1).map(p => (
                              <option key={p.id} value={p.id}>
                                {savedProfile.givenName} {savedProfile.familyName} — {flagEmoji(p.country)} {p.country} passport{p.country === destCountry ? ' ★ Best' : ''}
                              </option>
                            ))}
                            <option value="">Create new passenger</option>
                          </select>
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
                          <input value={paxForm.givenName} onChange={e => updatePassenger(idx, 'givenName', e.target.value)} placeholder="As on passport" className={inputCls} />
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
                            <input type="date" value={paxForm.bornOn} onChange={e => updatePassenger(idx, 'bornOn', e.target.value)} className={inputCls} />
                            {paxErrors.bornOn && <p className="text-xs text-red-500 mt-0.5">{paxErrors.bornOn}</p>}
                          </Field>
                        </div>
                      </div>

                      {/* Nationality — passport dropdown only when a saved passport is selected; text input otherwise */}
                      <div className="mb-3">
                        <Field label="Nationality *">
                          {savedProfile && savedProfile.passports.length > 0 && selectedPassportIds[idx] !== '' && selectedPassportIds[idx] !== '__manual__' ? (
                            <select
                              value={selectedPassportIds[idx] ?? ''}
                              onChange={e => {
                                if (e.target.value === '__manual__') {
                                  setSelectedPassportIds(ids => ids.map((id, i) => i === idx ? '__manual__' : id));
                                  setForms(fs => fs.map((f, i) => i === idx ? { ...f, passportCountry: '', passportNumber: '', passportExpiry: '' } : f));
                                } else {
                                  const p = savedProfile.passports.find(p => p.id === e.target.value);
                                  if (p) selectPassportForPax(idx, p);
                                }
                              }}
                              className={selectCls + ' w-full'}>
                              {savedProfile.passports.map(p => (
                                <option key={p.id} value={p.id}>
                                  {flagEmoji(p.country)} {p.country}{p.country === destCountry ? ' ★ Best for this route' : ''}
                                </option>
                              ))}
                              <option value="__manual__">Enter manually…</option>
                            </select>
                          ) : (
                            <input value={paxForm.passportCountry} onChange={e => updatePassenger(idx, 'passportCountry', e.target.value.toUpperCase())}
                              placeholder="e.g. US, TH, GB" maxLength={2} className={inputCls} />
                          )}
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

                      {idx === 0 && (
                        <>
                          <Field label="Email *">
                            <input type="email" value={paxForm.email} onChange={e => updatePassenger(idx, 'email', e.target.value)} placeholder="Confirmation sent here" className={inputCls} />
                            {paxErrors.email && <p className="text-xs text-red-500 mt-0.5">{paxErrors.email}</p>}
                          </Field>
                          <div className="mt-3">
                            <Field label="Phone (with country code) *">
                              <input type="tel" value={paxForm.phoneNumber} onChange={e => updatePassenger(idx, 'phoneNumber', e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
                              {paxErrors.phoneNumber && <p className="text-xs text-red-500 mt-0.5">{paxErrors.phoneNumber}</p>}
                            </Field>
                          </div>
                        </>
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
              </div>

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

              {/* ── Payment form (shown after passenger step) */}
              {bookStep === 'payment' && (
                <div className="space-y-4">
                  {/* Passenger summaries */}
                  {forms.map((paxForm, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Passenger {idx + 1}</p>
                          <p className="font-bold text-gray-900">{paxForm.title.charAt(0).toUpperCase() + paxForm.title.slice(1)} {paxForm.givenName} {paxForm.familyName}</p>
                          {idx === 0 && <p className="text-xs text-gray-500 mt-0.5">{paxForm.email} · {paxForm.phoneNumber}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">Passport {paxForm.passportNumber} · {flagEmoji(paxForm.passportCountry)} {paxForm.passportCountry} · Expires {paxForm.passportExpiry}</p>
                        </div>
                        <button onClick={() => setBookStep('passenger')} className="text-xs font-bold underline flex-shrink-0" style={{ color: '#1D9E75' }}>Edit</button>
                      </div>
                    </div>
                  ))}

                  {/* Card form */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
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
                    bookingError === 'OFFER_EXPIRED' ? (
                      <div className="rounded-xl px-4 py-4 text-sm" style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
                        <p className="font-bold text-amber-800 mb-1">⏰ This offer has expired</p>
                        <p className="text-amber-700 text-xs mb-3">Flight prices are live and lock for ~30 minutes. This one timed out while you were filling in details.</p>
                        <button onClick={() => { setSelectedOffer(null); setBookingError(''); }}
                          className="text-xs font-bold px-4 py-2 rounded-xl text-white"
                          style={{ background: '#1D9E75' }}>
                          ← Pick a fresh flight
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl px-4 py-3 text-sm text-red-700 font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        ⚠️ {bookingError}
                      </div>
                    )
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setBookStep('passenger')}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                      ← Back
                    </button>
                    <button onClick={confirmBooking} disabled={booking}
                      className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                      {booking
                        ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
                        : `Pay ${fmtPrice(gross, offer.totalCurrency)} →`
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Extras inline — shown below passenger form before payment */}
              {bookStep === 'passenger' && offer.availableServices.length > 0 && (
                <div id="extras-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-base font-extrabold text-gray-900">Add extras (optional)</p>
                      <p className="text-xs text-gray-400 mt-0.5">Extra baggage or seat selection</p>
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

                  {(seatServices.length > 0 || offer.segments.length > 0) && (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-2">💺 Seat selection</p>
                      <button onClick={loadSeatMaps} disabled={seatMapsLoading}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2"
                        style={{ borderColor: '#1D9E75', color: seatMapsOpen ? 'white' : '#1D9E75', background: seatMapsOpen ? '#1D9E75' : 'white' }}>
                        {seatMapsLoading ? 'Loading…' : seatMapsOpen ? '▲ Hide seat map' : '💺 Choose your seats'}
                      </button>
                      {seatMapsOpen && seatMaps && (
                        <div className="mt-3 space-y-4">
                          {seatMaps.map(sm => {
                            const seg = offer.segments.find(s => s.segmentId === sm.segmentId);
                            const cabin = sm.cabins[0];
                            if (!cabin) return null;
                            return (
                              <div key={sm.segmentId}>
                                <p className="text-xs font-bold text-gray-500 mb-2">
                                  {seg ? `${seg.depCode} → ${seg.arrCode}` : sm.segmentId}
                                </p>
                                {offer.passengerIds.map((paxId, pi) => (
                                  <div key={paxId} className="mb-3">
                                    {offer.passengerIds.length > 1 && <p className="text-xs text-gray-400 mb-1">Passenger {pi + 1}</p>}
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
                                                  const key = `${sm.segmentId}_${paxId}`;
                                                  const selected = seatSelections[key] === paxSvc?.id;
                                                  return (
                                                    <button key={ei} disabled={!available}
                                                      onClick={() => paxSvc && selectSeat(sm.segmentId, paxId, paxSvc.id)}
                                                      title={el.designator ?? ''}
                                                      className="w-8 h-8 rounded text-[10px] font-bold flex items-center justify-center"
                                                      style={{
                                                        background: selected ? '#1D9E75' : available ? '#E6F7F1' : '#F3F4F6',
                                                        color: selected ? 'white' : available ? '#1D9E75' : '#D1D5DB',
                                                        border: selected ? '1.5px solid #1D9E75' : available ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                                                        cursor: available ? 'pointer' : 'not-allowed',
                                                      }}>
                                                      {el.designator?.replace(/\d+/, '') ?? ''}
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
                        </div>
                      )}
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
              {bookStep === 'passenger' && (
                <button onClick={() => { if (validateForms()) setBookStep('payment'); }}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                  {extrasTotal > 0 ? `Continue with +${fmtPrice(extrasTotal, offer.totalCurrency)} →` : 'Continue to payment →'}
                </button>
              )}
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
                  {(seatServices.length > 0 || offer.segments.length > 0) && (
                    <div className="mb-5">
                      <p className="text-sm font-bold text-gray-700 mb-3">💺 Seat selection</p>
                      <button onClick={loadSeatMaps} disabled={seatMapsLoading}
                        className="w-full py-3 px-4 rounded-xl text-sm font-bold border-2 transition-colors flex items-center justify-center gap-2"
                        style={{ borderColor: '#1D9E75', color: seatMapsOpen ? 'white' : '#1D9E75', background: seatMapsOpen ? '#1D9E75' : 'white' }}>
                        {seatMapsLoading
                          ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Loading seat map…</>
                          : seatMapsOpen ? '▲ Hide seat map' : '💺 Choose your seats'}
                      </button>
                      {seatMapsOpen && seatMaps && (
                        <div className="mt-4 space-y-5">
                          {seatMaps.map(sm => {
                            const seg = offer.segments.find(s => s.segmentId === sm.segmentId);
                            const cabin = sm.cabins[0];
                            if (!cabin) return null;
                            return (
                              <div key={sm.segmentId}>
                                <p className="text-xs font-bold text-gray-500 mb-3">
                                  {seg ? `${seg.depCode} → ${seg.arrCode} · ${cabin.cabinClassName ?? cabin.cabinClass}` : sm.segmentId}
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
                                                  const selected = seatSelections[key] === paxSvc?.id;
                                                  const price = paxSvc ? parseFloat(paxSvc.total_amount) : 0;
                                                  return (
                                                    <button key={ei} disabled={!available}
                                                      onClick={() => paxSvc && selectSeat(sm.segmentId, paxId, paxSvc.id)}
                                                      title={el.designator + (el.disclosures?.length ? ` · ${el.disclosures[0]}` : '') + (price ? ` · ${fmtPrice(price, offer.totalCurrency)}` : '')}
                                                      className="w-8 h-8 rounded text-[10px] font-bold flex items-center justify-center transition-colors"
                                                      style={{
                                                        background: selected ? '#1D9E75' : available ? '#E6F7F1' : '#F3F4F6',
                                                        color: selected ? 'white' : available ? '#1D9E75' : '#D1D5DB',
                                                        border: selected ? '1.5px solid #1D9E75' : available ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                                                        cursor: available ? 'pointer' : 'not-allowed',
                                                      }}>
                                                      {el.designator?.replace(/\d+/, '') ?? ''}
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
                          <div className="flex gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#E6F7F1', border: '1px solid #A7F3D0' }} /> Available</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#1D9E75' }} /> Selected</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded inline-block" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }} /> Taken</span>
                          </div>
                        </div>
                      )}
                      {seatMapsOpen && !seatMaps && !seatMapsLoading && (
                        <p className="text-xs text-gray-400 mt-2 text-center">Seat map not available for this flight.</p>
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
                <a href="#" onClick={e => { e.preventDefault(); setBookStep('passenger'); }}
                  className="text-xs font-semibold flex items-center gap-1" style={{ color: '#1A73E8' }}>
                  View flight details &amp; policies ›
                </a>
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
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6 mb-12">
        <RouteMap
          fromCode={selectedOffer.segments[0].depCode}
          toCode={selectedOffer.segments[selectedOffer.segments.length - 1].arrCode}
          fromName={fromName} toName={toName}
          stops={selectedOffer.segments.slice(1).map(s => s.depCode)}
          duration={selectedOffer.totalDuration}
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: '#F0FBF7' }}>✅</div>
          <h2 className="text-2xl font-extrabold text-gray-900">Booking confirmed!</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Confirmation sent to {forms[0]?.email}</p>

          <div className="rounded-2xl p-6 text-left mb-4" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Booking reference</p>
            <p className="text-4xl font-extrabold tracking-widest text-gray-900 mb-3">{confirmation.reference}</p>
            <p className="text-sm text-gray-600">{fmtPrice(confirmation.amount, confirmation.currency)} · {fromName} → {toName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(depart + 'T12:00')} · {forms[0]?.givenName} {forms[0]?.familyName}{forms.length > 1 ? ` + ${forms.length - 1} more` : ''}</p>
          </div>

          <button onClick={onClear}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#1D9E75' }}>
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
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>Economy</span>
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
                                  Economy · {seg.flightNumber}{seg.aircraft ? ` · ${seg.aircraft}` : ''} · {seg.duration}
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

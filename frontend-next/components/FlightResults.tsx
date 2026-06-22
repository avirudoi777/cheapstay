'use client';
import { useEffect, useRef, useState } from 'react';
import VisaBanner from '@/components/VisaBanner';
import { getLayoverGuide, parseLayoverMinutes, LAYOVER_GUIDE_THRESHOLD_MIN } from '@/lib/layover-guides';
import { flagEmoji } from '@/lib/visa-data';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Segment {
  depCode: string; depCity: string; depAt: string;
  arrCode: string; arrCity: string; arrAt: string;
  airline: string; airlineCode: string; flightNumber: string;
  duration: string; aircraft: string; layoverAfter: string;
  baggage?: { checkedBags: number; carryOn: number };
}
export interface DuffelOffer {
  id: string; expiresAt: string;
  totalAmount: number; totalCurrency: string; totalDuration: string;
  passengerIds: string[]; segments: Segment[];
}
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
function calcGross(base: number) {
  return Math.round(((base + SERVICE_FEE) / (1 - DUFFEL_FEE_RATE)) * 100) / 100;
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

export default function FlightResults({ fromCode, toCode, fromName, toName, depart, ret, adults = 1, onClear, passportCodes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Search state
  const [offers, setOffers] = useState<DuffelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Saved traveler profile
  const [savedProfile, setSavedProfile] = useState<TravelerProfile | null>(null);
  const [selectedPassportId, setSelectedPassportId] = useState('');

  // ── Booking state
  const [selectedOffer, setSelectedOffer] = useState<DuffelOffer | null>(null);
  const [bookStep, setBookStep] = useState<'passenger' | 'payment' | 'confirmed'>('passenger');
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
      body: JSON.stringify({ origin: fromCode, destination: toCode, departureDate: depart, returnDate: ret || undefined, adults }),
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

  function startBooking(offer: DuffelOffer) {
    setSelectedOffer(offer);
    setBookStep('passenger');
    setCardForm(EMPTY_CARD); setCardErrors({});
    setBookingError(''); setConfirmation(null);

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
      const piRes = await fetch('/api/flights/duffel-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedOffer.totalAmount.toFixed(2), currency: selectedOffer.totalCurrency }),
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
    const gross = calcGross(offer.totalAmount);
    const processingFee = parseFloat((gross - offer.totalAmount - SERVICE_FEE).toFixed(2));
    const firstSeg = offer.segments[0];
    const lastSeg = offer.segments[offer.segments.length - 1];
    const secsLeft = offerSecsLeft;
    const countdownStr = secsLeft !== null
      ? `${String(Math.floor(secsLeft / 60)).padStart(2, '0')}:${String(secsLeft % 60).padStart(2, '0')}`
      : '';
    const isExpiringSoon = secsLeft !== null && secsLeft < 600;
    const isExpired = secsLeft !== null && secsLeft <= 0;

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
              <button onClick={() => { setSelectedOffer(null); setBookingError(''); }}
                className="ml-2 text-xs font-bold px-3 py-1 rounded-lg text-white"
                style={{ background: '#1D9E75' }}>
                ← Back to flights
              </button>
            )}
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
          {/* Back link */}
          <button onClick={() => setSelectedOffer(null)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-5">
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
                  return (
                    <div key={idx} className={idx > 0 ? 'border-t border-gray-100 pt-5 mt-5' : ''}>
                      <p className="text-lg font-extrabold text-gray-900 mb-0.5">
                        Passenger {idx + 1}: (Adult, 18 years or older)
                      </p>
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

                      {/* Nationality / passport */}
                      <div className="mb-3">
                        <Field label="Nationality *">
                          {savedProfile && savedProfile.passports.length > 1 && (
                            <select
                              value={selectedPassportIds[idx] ?? ''}
                              onChange={e => {
                                const p = savedProfile.passports.find(p => p.id === e.target.value);
                                if (p) selectPassportForPax(idx, p);
                              }}
                              className={selectCls + ' w-full mb-2'}>
                              <option value="">Select nationality</option>
                              {savedProfile.passports.map(p => (
                                <option key={p.id} value={p.id}>
                                  {flagEmoji(p.country)} {p.country}{p.country === destCountry ? ' ★ Best for this route' : ''}
                                </option>
                              ))}
                            </select>
                          )}
                          <input value={paxForm.passportCountry} onChange={e => updatePassenger(idx, 'passportCountry', e.target.value.toUpperCase())}
                            placeholder="e.g. US, TH, GB" maxLength={2} className={inputCls} />
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

              {/* Continue button on passenger step */}
              {bookStep === 'passenger' && (
                <button onClick={() => { if (validateForms()) setBookStep('payment'); }}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                  Continue to payment →
                </button>
              )}
            </div>

            {/* ── RIGHT COLUMN: summary + conditions ───────────────────── */}
            <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4">
              {/* Flight card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-gray-900 mb-0.5">{fromCode} to {toCode}</p>
                <p className="text-xs text-gray-400 mb-3">✈️ FLIGHT · {offer.passengerIds.length} adult{offer.passengerIds.length > 1 ? 's' : ''}</p>
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

              {/* Baggage */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-gray-900 mb-3">🧳 Baggage allowance</p>
                {offer.segments.map((seg, i) => {
                  const b = seg.baggage;
                  const segLabel = offer.segments.length > 1 ? `Segment ${i + 1}: ${seg.depCode}→${seg.arrCode}` : `${seg.depCode} → ${seg.arrCode}`;
                  return (
                    <div key={i} className={i > 0 ? 'border-t border-gray-100 pt-2 mt-2' : ''}>
                      {offer.segments.length > 1 && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{segLabel}</p>
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={b && b.carryOn > 0 ? 'text-emerald-600' : 'text-gray-400'}>
                            {b && b.carryOn > 0 ? '✓' : '✗'}
                          </span>
                          <span className={b && b.carryOn > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}>
                            {b && b.carryOn > 0 ? `${b.carryOn} carry-on bag included` : 'No carry-on included'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={b && b.checkedBags > 0 ? 'text-emerald-600' : 'text-gray-400'}>
                            {b && b.checkedBags > 0 ? '✓' : '✗'}
                          </span>
                          <span className={b && b.checkedBags > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}>
                            {b && b.checkedBags > 0 ? `${b.checkedBags} checked bag${b.checkedBags > 1 ? 's' : ''} included` : 'No checked bag — pay at airport'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {offer.segments.every(s => !s.baggage?.checkedBags) && (
                  <p className="text-[10px] text-gray-400 mt-2">Tip: buying checked baggage at the airport costs more than pre-purchasing online.</p>
                )}
              </div>

              {/* Price breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-gray-900 mb-3">Price breakdown</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Adult</span>
                    <span className="font-semibold">{fmtPrice(offer.totalAmount, offer.totalCurrency)} x {offer.passengerIds.length}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Base fare</span>
                    <span>{fmtPrice(offer.totalAmount - (offer.totalAmount * 0.2), offer.totalCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Taxes and fees</span>
                    <span>{fmtPrice(offer.totalAmount * 0.2, offer.totalCurrency)}</span>
                  </div>
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

              {/* Airport lounges in layover airports */}
              {offer.segments.some(seg => seg.layoverAfter) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-sm font-extrabold text-gray-900 mb-3">🛋️ Airport Lounges</p>
                  {offer.segments.map((seg, i) => {
                    if (!seg.layoverAfter) return null;
                    const nextCode = offer.segments[i + 1]?.depCode ?? '';
                    const guide = getLayoverGuide(nextCode);
                    if (!guide?.lounges) return null;
                    return (
                      <div key={i} className="mb-3">
                        <p className="text-xs font-bold text-gray-700 mb-1">{guide.flag} {nextCode} — {guide.airport}</p>
                        <p className="text-xs text-gray-500 mb-2">{guide.lounges}</p>
                        <a href="https://www.prioritypass.com/en/single-visit" target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                          style={{ background: '#1A3C5E' }}>
                          🛋️ Get lounge access
                        </a>
                      </div>
                    );
                  })}
                  {offer.segments.every(seg => !seg.layoverAfter || !getLayoverGuide(offer.segments[offer.segments.indexOf(seg) + 1]?.depCode ?? '')?.lounges) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Access 1,600+ airport lounges worldwide with Priority Pass.</p>
                      <a href="https://www.prioritypass.com/en/single-visit" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: '#1A3C5E' }}>
                        🛋️ Browse lounges
                      </a>
                    </div>
                  )}
                </div>
              )}
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
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>{fromName}</span><span className="text-gray-300">→</span><span>{toName}</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {departLabel}{ret && ` · Return ${new Date(ret + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
            {!ret && ' · One way'} · {adults} adult{adults !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={onClear}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200">
          ✕ New search
        </button>
      </div>

      {/* Visa banner */}
      <div className="mb-5"><VisaBanner passportCodes={passportCodes} city={toName} /></div>

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
          <p className="text-xs font-semibold text-gray-400">{offers.length} flight{offers.length !== 1 ? 's' : ''} · prices include all fees</p>
          {offers.map(offer => {
            const gross = calcGross(offer.totalAmount);
            const isExpanded = expanded === offer.id;
            const stops = offer.segments.length - 1;
            const firstSeg = offer.segments[0];
            const lastSeg = offer.segments[offer.segments.length - 1];

            return (
              <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Times + airline logo */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Airline logo */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <AirlineLogo code={firstSeg.airlineCode} name={firstSeg.airline} />
                      <span className="hidden" aria-hidden="true" />
                    </div>

                    <div className="text-center flex-shrink-0">
                      <p className="text-xl font-extrabold text-gray-900 tabular-nums">{fmtTime(firstSeg.depAt)}</p>
                      <p className="text-xs font-bold text-gray-500">{firstSeg.depCode}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-0.5 px-1">
                      <p className="text-[11px] text-gray-400 font-medium">{offer.totalDuration}</p>
                      <div className="flex items-center w-full gap-1">
                        <div className="h-px flex-1 bg-gray-200" />
                        {stops === 0
                          ? <span className="text-[10px] font-semibold text-emerald-600 whitespace-nowrap px-1.5 py-0.5 rounded-full bg-emerald-50">Direct</span>
                          : <button onClick={() => setExpanded(isExpanded ? null : offer.id)}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: '#FEF9C3', color: '#92400E' }}>
                              {stops} stop{stops > 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                            </button>
                        }
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      <p className="text-[10px] text-gray-400">{firstSeg.airline}</p>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <p className="text-xl font-extrabold text-gray-900 tabular-nums">{fmtTime(lastSeg.arrAt)}</p>
                      <p className="text-xs font-bold text-gray-500">{lastSeg.arrCode}</p>
                    </div>
                  </div>

                  {/* Price + book */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{fmtPrice(gross, offer.totalCurrency)}</p>
                      <p className="text-[10px] text-gray-400">all fees included</p>
                    </div>
                    <button onClick={() => startBooking(offer)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                      Book →
                    </button>
                  </div>
                </div>

                {/* Expanded itinerary */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                    <RouteMap
                      fromCode={firstSeg.depCode}
                      toCode={lastSeg.arrCode}
                      fromName={fromName} toName={toName}
                      stops={offer.segments.slice(1).map(s => s.depCode)}
                      duration={offer.totalDuration}
                    />
                    {offer.segments.map((seg, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-3 text-sm">
                          <AirlineLogo code={seg.airlineCode} name={seg.airline} />
                          <div className="text-center w-12 flex-shrink-0">
                            <p className="font-extrabold tabular-nums">{fmtTime(seg.depAt)}</p>
                            <p className="text-[11px] font-bold text-gray-500">{seg.depCode}</p>
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <p className="text-[10px] text-gray-400">{seg.duration}</p>
                            <div className="w-full h-px bg-gray-200 my-0.5" />
                            <p className="text-[10px] text-gray-400">{seg.airline} · {seg.flightNumber}</p>
                          </div>
                          <div className="text-center w-12 flex-shrink-0">
                            <p className="font-extrabold tabular-nums">{fmtTime(seg.arrAt)}</p>
                            <p className="text-[11px] font-bold text-gray-500">{seg.arrCode}</p>
                          </div>
                        </div>
                        {seg.layoverAfter && (() => {
                          const nextCode = offer.segments[i + 1]?.depCode ?? '';
                          const mins = parseLayoverMinutes(seg.layoverAfter);
                          const guide = mins >= LAYOVER_GUIDE_THRESHOLD_MIN ? getLayoverGuide(nextCode) : null;
                          return (
                            <div className="mt-2 mb-1">
                              <div className="flex justify-center mb-2">
                                <span className="text-[11px] font-semibold px-3 py-1 rounded-lg" style={{ background: '#FEF9C3', color: '#92400E' }}>
                                  🚶 Layover in {nextCode} · {seg.layoverAfter}
                                </span>
                              </div>
                              {guide && (
                                <div className="rounded-xl p-3 mx-1 space-y-2" style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                                  <p className="text-[11px] font-bold text-gray-600">{guide.flag} {guide.airport} layover tips</p>
                                  <div className="space-y-1">
                                    {guide.tips.slice(0, 2).map((tip, ti) => (
                                      <p key={ti} className="text-[10px] text-gray-500">{tip.icon} <span className="font-semibold">{tip.title}</span> — {tip.desc.slice(0, 60)}…</p>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <a href="https://www.prioritypass.com/en/single-visit" target="_blank" rel="noopener noreferrer"
                                      className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg text-white" style={{ background: '#1A3C5E' }}>
                                      🛋️ Lounge access
                                    </a>
                                    <a href="https://saily.com/" target="_blank" rel="noopener noreferrer"
                                      className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg border" style={{ color: '#1D9E75', borderColor: '#1D9E75' }}>
                                      📶 eSIM
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

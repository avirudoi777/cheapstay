'use client';
import { useEffect, useState } from 'react';
import VisaBanner from '@/components/VisaBanner';
import { getLayoverGuide, parseLayoverMinutes, LAYOVER_GUIDE_THRESHOLD_MIN } from '@/lib/layover-guides';
import { flagEmoji } from '@/lib/visa-data';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Segment {
  depCode: string; depCity: string; depAt: string;
  arrCode: string; arrCity: string; arrAt: string;
  airline: string; airlineCode: string; flightNumber: string;
  duration: string; aircraft: string; layoverAfter: string;
}
export interface DuffelOffer {
  id: string; expiresAt: string;
  totalAmount: number; totalCurrency: string; totalDuration: string;
  passengerId: string; segments: Segment[];
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
  onClear: () => void;
  passportCodes: string[];
}

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
  const depX = 70, arrX = 430, baseY = 95, arcY = 28;

  const stopPoints = stops.map((code, i) => {
    const t = (i + 1) / (stops.length + 1);
    const cx = depX + (arrX - depX) * t;
    const cy = baseY - (baseY - arcY) * Math.sin(Math.PI * t);
    return { code, cx, cy };
  });

  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg, #0a1628, #0f2547)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={`M ${depX} ${baseY} Q 250 ${arcY} ${arrX} ${baseY}`}
          stroke="rgba(29,158,117,0.15)" strokeWidth="8" fill="none" />
        <path d={`M ${depX} ${baseY} Q 250 ${arcY} ${arrX} ${baseY}`}
          stroke="rgba(29,158,117,0.6)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        <text x="245" y="52" textAnchor="middle" fontSize="18">✈️</text>
        {stopPoints.map(({ code, cx, cy }) => (
          <g key={code}>
            <circle cx={cx} cy={cy} r="4" fill="rgba(255,200,50,0.8)" />
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="9" fill="rgba(255,200,50,0.9)" fontWeight="bold">{code}</text>
          </g>
        ))}
        <circle cx={depX} cy={baseY} r="6" fill="#1D9E75" />
        <circle cx={depX} cy={baseY} r="10" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x={depX} y={baseY + 18} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">{fromCode}</text>
        <circle cx={arrX} cy={baseY} r="6" fill="#1A73E8" />
        <circle cx={arrX} cy={baseY} r="10" fill="none" stroke="#1A73E8" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x={arrX} y={baseY + 18} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">{toCode}</text>
        {duration && <text x="250" y={arcY - 6} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">{duration}</text>}
      </svg>
      <div className="px-5 pb-4 flex justify-between -mt-2">
        <p className="text-xs text-gray-400">{fromName}</p>
        {stops.length > 0 && <p className="text-[10px] text-yellow-500 font-semibold">{stops.length} stop{stops.length > 1 ? 's' : ''}</p>}
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

export default function FlightResults({ fromCode, toCode, fromName, toName, depart, ret, onClear, passportCodes }: Props) {
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
  const [form, setForm] = useState<PassengerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<PassengerForm>>({});
  const [cardForm, setCardForm] = useState<CardForm>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<Partial<CardForm>>({});
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmation, setConfirmation] = useState<{ reference: string; amount: number; currency: string } | null>(null);

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
      body: JSON.stringify({ origin: fromCode, destination: toCode, departureDate: depart, returnDate: ret || undefined }),
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

  function startBooking(offer: DuffelOffer) {
    setSelectedOffer(offer);
    setBookStep('passenger');
    setFormErrors({});
    setCardForm(EMPTY_CARD); setCardErrors({});
    setBookingError(''); setConfirmation(null);

    if (savedProfile) {
      const firstPassport = savedProfile.passports[0];
      setForm({
        title:           savedProfile.title || 'mr',
        givenName:       savedProfile.givenName || '',
        familyName:      savedProfile.familyName || '',
        gender:          savedProfile.gender || 'm',
        bornOn:          savedProfile.bornOn || '',
        email:           savedProfile.email || '',
        phoneNumber:     savedProfile.phone || '',
        passportNumber:  firstPassport?.passportNumber || '',
        passportExpiry:  firstPassport?.passportExpiry || '',
        passportCountry: firstPassport?.country || '',
      });
      setSelectedPassportId(firstPassport?.id || '');
    } else {
      setForm(EMPTY_FORM);
      setSelectedPassportId('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function update(key: keyof PassengerForm, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErrors(e => ({ ...e, [key]: '' }));
  }
  function updateCard(key: keyof CardForm, val: string) {
    setCardForm(f => ({ ...f, [key]: val }));
    setCardErrors(e => ({ ...e, [key]: '' }));
  }

  function selectPassport(p: SavedPassport) {
    setSelectedPassportId(p.id);
    setForm(f => ({ ...f, passportNumber: p.passportNumber, passportExpiry: p.passportExpiry, passportCountry: p.country }));
    setFormErrors(e => ({ ...e, passportNumber: '', passportExpiry: '', passportCountry: '' }));
  }

  function validateForm(): boolean {
    const errs: Partial<PassengerForm> = {};
    if (!form.givenName.trim())       errs.givenName = 'Required';
    if (!form.familyName.trim())      errs.familyName = 'Required';
    if (!form.email.includes('@'))    errs.email = 'Valid email required';
    if (!form.bornOn)                 errs.bornOn = 'Required';
    if (!form.phoneNumber.trim())     errs.phoneNumber = 'Required';
    if (!form.passportNumber.trim())  errs.passportNumber = 'Required';
    if (!form.passportExpiry)         errs.passportExpiry = 'Required';
    if (!form.passportCountry.trim()) errs.passportCountry = 'Required (2-letter, e.g. US)';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
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
    setBooking(true); setBookingError('');
    try {
      const piRes = await fetch('/api/flights/duffel-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedOffer.totalAmount.toFixed(2), currency: selectedOffer.totalCurrency }),
      });
      const pi = await piRes.json();
      if (pi.error) throw new Error(pi.detail || pi.error);

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

      const orderRes = await fetch('/api/flights/duffel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: selectedOffer.id, paymentIntentId: pi.paymentIntentId, passenger: { ...form, passengerId: selectedOffer.passengerId } }),
      });
      const order = await orderRes.json();
      if (order.error) throw new Error(order.detail || order.error);

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

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6 mb-12">
        {/* Back link */}
        <button onClick={() => setSelectedOffer(null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-5">
          ← Back to results
        </button>

        {/* Route map */}
        <RouteMap
          fromCode={offer.segments[0].depCode}
          toCode={offer.segments[offer.segments.length - 1].arrCode}
          fromName={fromName} toName={toName}
          stops={offer.segments.slice(1).map(s => s.depCode)}
          duration={offer.totalDuration}
        />

        {/* Flight summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Your flight</p>
          {offer.segments.map((seg, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 text-sm py-1">
                <div className="text-center w-14 flex-shrink-0">
                  <p className="text-lg font-extrabold tabular-nums">{fmtTime(seg.depAt)}</p>
                  <p className="text-xs font-bold text-gray-500">{seg.depCode}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-[10px] text-gray-400">{seg.duration}</p>
                  <div className="w-full h-px bg-gray-200 my-0.5" />
                  <p className="text-[10px] text-gray-400">{seg.airline} · {seg.flightNumber}</p>
                </div>
                <div className="text-center w-14 flex-shrink-0">
                  <p className="text-lg font-extrabold tabular-nums">{fmtTime(seg.arrAt)}</p>
                  <p className="text-xs font-bold text-gray-500">{seg.arrCode}</p>
                </div>
              </div>
              {seg.layoverAfter && (() => {
                const nextCode = offer.segments[i + 1]?.depCode ?? '';
                const mins = parseLayoverMinutes(seg.layoverAfter);
                const guide = mins >= LAYOVER_GUIDE_THRESHOLD_MIN ? getLayoverGuide(nextCode) : null;
                return (
                  <div className="my-3">
                    <div className="flex justify-center mb-3">
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-lg" style={{ background: '#FEF9C3', color: '#92400E' }}>
                        🚶 Layover in {nextCode} · {seg.layoverAfter}
                      </span>
                    </div>
                    {guide && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div className="flex items-center gap-2">
                          <span>{guide.flag}</span>
                          <p className="text-xs font-bold text-gray-700">{guide.airport} · {seg.layoverAfter} to explore</p>
                        </div>
                        {guide.transitVisa && (
                          <p className="text-[11px] text-blue-600 font-semibold">🛂 {guide.transitVisa}</p>
                        )}
                        <div className="grid grid-cols-1 gap-1.5">
                          {guide.tips.slice(0, 3).map((tip, ti) => (
                            <div key={ti} className="flex items-start gap-2">
                              <span className="text-sm flex-shrink-0">{tip.icon}</span>
                              <div>
                                <p className="text-xs font-bold text-gray-700">{tip.title}</p>
                                <p className="text-[11px] text-gray-500">{tip.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Revenue: lounge access + eSIM */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a href="https://www.prioritypass.com/en/single-visit"
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white text-center justify-center"
                            style={{ background: '#1A3C5E' }}>
                            🛋️ Lounge access
                          </a>
                          <a href="https://saily.com/"
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border justify-center"
                            style={{ color: '#1D9E75', borderColor: '#1D9E75' }}>
                            📶 Get local eSIM
                          </a>
                        </div>
                        {guide.lounges && (
                          <p className="text-[10px] text-gray-400">Lounges: {guide.lounges}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">{fmtDate(depart + 'T12:00')} · {fmtTime(firstSeg.depAt)} → {fmtTime(lastSeg.arrAt)}</p>
            <p className="text-lg font-extrabold text-gray-900">{fmtPrice(gross, offer.totalCurrency)}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Passenger details', 'Review & pay'].map((label, i) => {
            const active = (bookStep === 'passenger' && i === 0) || (bookStep === 'payment' && i === 1);
            const done = bookStep === 'payment' && i === 0;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${active || done ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                  style={active || done ? { background: '#1D9E75' } : {}}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {i < 1 && <div className="w-6 h-px bg-gray-200 ml-1" />}
              </div>
            );
          })}
        </div>

        {/* ── Passenger form */}
        {bookStep === 'passenger' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs text-gray-500">Details must match your passport exactly.</p>

            {/* Passport selector — shown when user has 2+ passports saved */}
            {savedProfile && savedProfile.passports.length > 1 && (
              <div className="rounded-xl p-4" style={{ background: '#F0FBF7', border: '1px solid #1D9E75' }}>
                <p className="text-xs font-bold text-gray-700 mb-2.5">Which passport are you traveling with?</p>
                <div className="flex flex-col gap-2">
                  {savedProfile.passports.map(p => (
                    <button key={p.id} type="button" onClick={() => selectPassport(p)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${selectedPassportId === p.id ? 'border-teal bg-white shadow-sm' : 'border-gray-200 bg-white/60 hover:border-teal/50'}`}>
                      <span className="text-2xl">{flagEmoji(p.country)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{p.label || p.country}</p>
                        <p className="text-[11px] text-gray-400">Expires {p.passportExpiry || 'N/A'}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedPassportId === p.id ? 'border-teal' : 'border-gray-300'}`}>
                        {selectedPassportId === p.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1D9E75' }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Title">
                <select value={form.title} onChange={e => update('title', e.target.value)} className={selectCls}>
                  <option value="mr">Mr</option><option value="ms">Ms</option>
                  <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                </select>
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={e => update('gender', e.target.value)} className={selectCls}>
                  <option value="m">Male</option><option value="f">Female</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input value={form.givenName} onChange={e => update('givenName', e.target.value)} placeholder="As on passport" className={inputCls} />
                {formErrors.givenName && <p className="text-xs text-red-500 mt-0.5">{formErrors.givenName}</p>}
              </Field>
              <Field label="Last name">
                <input value={form.familyName} onChange={e => update('familyName', e.target.value)} placeholder="As on passport" className={inputCls} />
                {formErrors.familyName && <p className="text-xs text-red-500 mt-0.5">{formErrors.familyName}</p>}
              </Field>
            </div>

            <Field label="Date of birth">
              <input type="date" value={form.bornOn} onChange={e => update('bornOn', e.target.value)} className={inputCls} />
              {formErrors.bornOn && <p className="text-xs text-red-500 mt-0.5">{formErrors.bornOn}</p>}
            </Field>

            <Field label="Email">
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Confirmation sent here" className={inputCls} />
              {formErrors.email && <p className="text-xs text-red-500 mt-0.5">{formErrors.email}</p>}
            </Field>

            <Field label="Phone (with country code)">
              <input type="tel" value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
              {formErrors.phoneNumber && <p className="text-xs text-red-500 mt-0.5">{formErrors.phoneNumber}</p>}
            </Field>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-700 mb-3">Passport</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Passport number">
                    <input value={form.passportNumber} onChange={e => update('passportNumber', e.target.value)}
                      placeholder="AB1234567" className={inputCls} style={{ textTransform: 'uppercase' }} />
                    {formErrors.passportNumber && <p className="text-xs text-red-500 mt-0.5">{formErrors.passportNumber}</p>}
                  </Field>
                  <Field label="Country (2-letter)">
                    <input value={form.passportCountry} onChange={e => update('passportCountry', e.target.value.toUpperCase())}
                      placeholder="US" maxLength={2} className={inputCls} />
                    {formErrors.passportCountry && <p className="text-xs text-red-500 mt-0.5">{formErrors.passportCountry}</p>}
                  </Field>
                </div>
                <Field label="Passport expiry">
                  <input type="date" value={form.passportExpiry} onChange={e => update('passportExpiry', e.target.value)} className={inputCls} />
                  {formErrors.passportExpiry && <p className="text-xs text-red-500 mt-0.5">{formErrors.passportExpiry}</p>}
                </Field>
              </div>
            </div>

            <button onClick={() => { if (validateForm()) setBookStep('payment'); }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-2"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
              Continue to payment →
            </button>
          </div>
        )}

        {/* ── Review & Pay */}
        {bookStep === 'payment' && (
          <div className="space-y-4">
            {/* Passenger summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Passenger</p>
                  <p className="font-bold text-gray-900">{form.title.charAt(0).toUpperCase() + form.title.slice(1)} {form.givenName} {form.familyName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{form.email} · {form.phoneNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Passport {form.passportNumber} · Expires {form.passportExpiry}</p>
                </div>
                <button onClick={() => setBookStep('passenger')} className="text-xs font-bold underline" style={{ color: '#1D9E75' }}>Edit</button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Price breakdown</p>
              <div className="flex justify-between text-sm text-gray-600"><span>Base fare</span><span>{fmtPrice(offer.totalAmount, offer.totalCurrency)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Service fee</span><span>{fmtPrice(SERVICE_FEE, offer.totalCurrency)}</span></div>
              <div className="flex justify-between text-xs text-gray-400"><span>Processing (2.9%)</span><span>{fmtPrice(processingFee, offer.totalCurrency)}</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold text-gray-900">
                <span>Total charged</span>
                <span className="text-xl">{fmtPrice(gross, offer.totalCurrency)}</span>
              </div>
            </div>

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
              <div className="rounded-xl px-4 py-3 text-sm text-red-700 font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                ⚠️ {bookingError}
              </div>
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
          <p className="text-sm text-gray-500 mt-1 mb-6">Confirmation sent to {form.email}</p>

          <div className="rounded-2xl p-6 text-left mb-4" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Booking reference</p>
            <p className="text-4xl font-extrabold tracking-widest text-gray-900 mb-3">{confirmation.reference}</p>
            <p className="text-sm text-gray-600">{fmtPrice(confirmation.amount, confirmation.currency)} · {fromName} → {toName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(depart + 'T12:00')} · {form.givenName} {form.familyName}</p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <span>{fromName}</span><span className="text-gray-300">→</span><span>{toName}</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {departLabel}{ret && ` · Return ${new Date(ret + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
            {!ret && ' · One way'} · 1 adult
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
                  {/* Times */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-center flex-shrink-0">
                      <p className="text-xl font-extrabold text-gray-900 tabular-nums">{fmtTime(firstSeg.depAt)}</p>
                      <p className="text-xs font-bold text-gray-500">{firstSeg.depCode}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-0.5 px-2">
                      <p className="text-[11px] text-gray-400">{offer.totalDuration}</p>
                      <div className="flex items-center w-full gap-1">
                        <div className="h-px flex-1 bg-gray-200" />
                        {stops === 0
                          ? <span className="text-[10px] text-gray-400 whitespace-nowrap">Direct</span>
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

'use client';
import { useState, useEffect, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Segment {
  depCode: string; depCity: string; depAt: string;
  arrCode: string; arrCity: string; arrAt: string;
  airline: string; airlineCode: string; flightNumber: string;
  duration: string; aircraft: string; layoverAfter: string;
}
interface DuffelOffer {
  id: string; expiresAt: string;
  totalAmount: number; totalCurrency: string; totalDuration: string;
  passengerId: string; segments: Segment[];
}
interface PassengerForm {
  title: string; givenName: string; familyName: string;
  gender: string; bornOn: string; email: string; phoneNumber: string;
  passportNumber: string; passportExpiry: string; passportCountry: string;
}

interface Props {
  isOpen: boolean; onClose: () => void;
  origin: string; destination: string;
  departureDate: string; returnDate?: string;
  fromName: string; toName: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', opts);
}
const fmtTime  = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate  = (iso: string) => fmt(iso, { day: 'numeric', month: 'short' });
const fmtPrice = (amt: number, cur: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amt);

const STEPS = ['Select flight', 'Passengers', 'Review', 'Confirmed'];

const EMPTY_FORM: PassengerForm = {
  title: 'mr', givenName: '', familyName: '', gender: 'm',
  bornOn: '', email: '', phoneNumber: '', passportNumber: '',
  passportExpiry: '', passportCountry: '',
};

/* ─── Itinerary card ─────────────────────────────────────────────────────── */
function ItineraryCard({ offer, selected, onSelect }: { offer: DuffelOffer; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 transition-all p-4 ${selected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-gray-900">{fmtPrice(offer.totalAmount, offer.totalCurrency)}</span>
          <span className="text-xs text-gray-400">· {offer.totalDuration}</span>
          <span className="text-xs text-gray-400">· {offer.segments.length === 1 ? 'Direct' : `${offer.segments.length - 1} stop${offer.segments.length > 2 ? 's' : ''}`}</span>
        </div>
        {selected && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>Selected ✓</span>}
      </div>

      {offer.segments.map((seg, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-extrabold tabular-nums w-11">{fmtTime(seg.depAt)}</span>
            <span className="font-bold text-gray-800 w-10">{seg.depCode}</span>
            <div className="flex-1 flex items-center gap-1 px-1">
              <div className="h-px flex-1 bg-gray-300" />
              <span className="text-[10px] text-gray-400">{seg.duration}</span>
              <div className="h-px flex-1 bg-gray-300" />
            </div>
            <span className="font-bold text-gray-800 w-10 text-right">{seg.arrCode}</span>
            <span className="font-extrabold tabular-nums w-11 text-right">{fmtTime(seg.arrAt)}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5 mb-1 pl-1">
            {seg.airline} · {seg.flightNumber} {seg.aircraft && `· ${seg.aircraft}`}
          </div>
          {seg.layoverAfter && (
            <div className="flex items-center gap-1.5 my-2 pl-1">
              <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: '#F1F5F9', color: '#64748B' }}>
                🚶 Layover in {offer.segments[i + 1]?.depCode} · {seg.layoverAfter}
              </div>
            </div>
          )}
        </div>
      ))}

      <p className="text-[10px] text-gray-300 mt-2">Offer expires {fmt(offer.expiresAt, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
    </button>
  );
}

/* ─── Input helpers ──────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition bg-white';
const selectCls = inputCls + ' appearance-none';

/* ─── Main modal ─────────────────────────────────────────────────────────── */
export default function FlightBookingModal({ isOpen, onClose, origin, destination, departureDate, returnDate, fromName, toName }: Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [offers, setOffers] = useState<DuffelOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<DuffelOffer | null>(null);
  const [form, setForm] = useState<PassengerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<PassengerForm>>({});
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmation, setConfirmation] = useState<{ reference: string; amount: number; currency: string } | null>(null);

  const searchFlights = useCallback(() => {
    setLoadingOffers(true);
    setOffersError('');
    setOffers([]);
    setSelectedOffer(null);
    fetch('/api/flights/duffel-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, departureDate, returnDate }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) setOffersError(json.detail || json.error);
        else if (!json.offers?.length) setOffersError('No flights found for this route and date.');
        else { setOffers(json.offers); setSelectedOffer(json.offers[0]); }
      })
      .catch(() => setOffersError('Search failed. Please try again.'))
      .finally(() => setLoadingOffers(false));
  }, [origin, destination, departureDate, returnDate]);

  useEffect(() => {
    if (isOpen) {
      setStep(0); setForm(EMPTY_FORM); setFormErrors({});
      setBookingError(''); setConfirmation(null);
      searchFlights();
    }
  }, [isOpen, searchFlights]);

  function update(key: keyof PassengerForm, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErrors(e => ({ ...e, [key]: '' }));
  }

  function validateForm(): boolean {
    const errs: Partial<PassengerForm> = {};
    if (!form.givenName.trim())    errs.givenName = 'Required';
    if (!form.familyName.trim())   errs.familyName = 'Required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (!form.bornOn)              errs.bornOn = 'Required';
    if (!form.phoneNumber.trim())  errs.phoneNumber = 'Required';
    if (!form.passportNumber.trim()) errs.passportNumber = 'Required';
    if (!form.passportExpiry)      errs.passportExpiry = 'Required';
    if (!form.passportCountry.trim()) errs.passportCountry = 'Required (2-letter code, e.g. US)';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function confirmBooking() {
    if (!selectedOffer) return;
    setBooking(true);
    setBookingError('');
    try {
      const res = await fetch('/api/flights/duffel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: selectedOffer.id,
          offerAmount: selectedOffer.totalAmount.toFixed(2),
          offerCurrency: selectedOffer.totalCurrency,
          passenger: { ...form, passengerId: selectedOffer.passengerId },
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.detail || json.error);
      setConfirmation({ reference: json.bookingReference, amount: json.totalAmount, currency: json.currency });
      setStep(3);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl flex flex-col max-h-[95dvh] overflow-hidden shadow-2xl"
        style={{ borderRadius: '24px 24px 0 0' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-extrabold text-gray-900">{fromName} → {toName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(departureDate + 'T12:00')} · Economy · 1 adult</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition text-lg">✕</button>
          </div>

          {/* Step indicator — hide on confirmed */}
          {step < 3 && (
            <div className="flex items-center gap-1">
              {STEPS.slice(0, 3).map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${i < step ? 'text-white' : i === step ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={i <= step ? { background: '#1D9E75' } : {}}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-[11px] font-semibold ${i === step ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                  {i < 2 && <div className="w-4 h-px bg-gray-200 mx-1" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── STEP 0: Select flight ── */}
          {step === 0 && (
            <div className="space-y-3">
              {loadingOffers && (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <svg className="animate-spin w-4 h-4" style={{ color: '#1D9E75' }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Searching live flights…
                  </div>
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-2xl border border-gray-100 p-4 animate-pulse space-y-2">
                      <div className="flex justify-between"><div className="h-5 w-20 bg-gray-100 rounded" /><div className="h-4 w-16 bg-gray-100 rounded" /></div>
                      <div className="h-4 bg-gray-100 rounded" /><div className="h-3 w-32 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              )}
              {offersError && (
                <div className="py-6 text-center">
                  <p className="text-2xl mb-2">✈️</p>
                  <p className="text-sm font-bold text-gray-700 mb-1">No live flights found</p>
                  <p className="text-xs text-gray-500 mb-4">{offersError}</p>
                  <button onClick={searchFlights}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white mr-2"
                    style={{ background: '#1D9E75' }}>
                    Try again
                  </button>
                </div>
              )}
              {!loadingOffers && !offersError && offers.map(offer => (
                <ItineraryCard key={offer.id} offer={offer}
                  selected={selectedOffer?.id === offer.id}
                  onSelect={() => setSelectedOffer(offer)} />
              ))}
            </div>
          )}

          {/* ── STEP 1: Passenger details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 -mt-1">Details must match your passport exactly.</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Title">
                  <select value={form.title} onChange={e => update('title', e.target.value)} className={selectCls}>
                    <option value="mr">Mr</option><option value="ms">Ms</option>
                    <option value="mrs">Mrs</option><option value="miss">Miss</option>
                    <option value="dr">Dr</option>
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
                  <input value={form.givenName} onChange={e => update('givenName', e.target.value)}
                    placeholder="As on passport" className={inputCls} />
                  {formErrors.givenName && <p className="text-xs text-red-500 mt-0.5">{formErrors.givenName}</p>}
                </Field>
                <Field label="Last name">
                  <input value={form.familyName} onChange={e => update('familyName', e.target.value)}
                    placeholder="As on passport" className={inputCls} />
                  {formErrors.familyName && <p className="text-xs text-red-500 mt-0.5">{formErrors.familyName}</p>}
                </Field>
              </div>

              <Field label="Date of birth">
                <input type="date" value={form.bornOn} onChange={e => update('bornOn', e.target.value)} className={inputCls} />
                {formErrors.bornOn && <p className="text-xs text-red-500 mt-0.5">{formErrors.bornOn}</p>}
              </Field>

              <Field label="Email">
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder="Ticket confirmation sent here" className={inputCls} />
                {formErrors.email && <p className="text-xs text-red-500 mt-0.5">{formErrors.email}</p>}
              </Field>

              <Field label="Phone number (with country code)">
                <input type="tel" value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)}
                  placeholder="+1 555 000 0000" className={inputCls} />
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
                    <Field label="Issuing country (2-letter)">
                      <input value={form.passportCountry} onChange={e => update('passportCountry', e.target.value.toUpperCase())}
                        placeholder="US" maxLength={2} className={inputCls} />
                      {formErrors.passportCountry && <p className="text-xs text-red-500 mt-0.5">{formErrors.passportCountry}</p>}
                    </Field>
                  </div>
                  <Field label="Passport expiry date">
                    <input type="date" value={form.passportExpiry} onChange={e => update('passportExpiry', e.target.value)} className={inputCls} />
                    {formErrors.passportExpiry && <p className="text-xs text-red-500 mt-0.5">{formErrors.passportExpiry}</p>}
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 2 && selectedOffer && (
            <div className="space-y-4">
              {/* Flight summary */}
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Your flight</p>
                {selectedOffer.segments.map((seg, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 text-sm py-1">
                      <span className="font-extrabold tabular-nums">{fmtTime(seg.depAt)}</span>
                      <span className="font-bold">{seg.depCode}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">{seg.duration}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="font-bold">{seg.arrCode}</span>
                      <span className="font-extrabold tabular-nums">{fmtTime(seg.arrAt)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-1">{seg.airline} · {seg.flightNumber}</p>
                    {seg.layoverAfter && (
                      <p className="text-[11px] text-amber-600 font-semibold mb-2">Layover in {selectedOffer.segments[i+1]?.depCode} · {seg.layoverAfter}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Passenger summary */}
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Passenger</p>
                <p className="text-sm font-bold text-gray-900">{form.title.charAt(0).toUpperCase() + form.title.slice(1)} {form.givenName} {form.familyName}</p>
                <p className="text-xs text-gray-500">{form.email} · {form.phoneNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5">Passport {form.passportNumber} · Expires {form.passportExpiry}</p>
              </div>

              {/* Price */}
              <div className="rounded-2xl p-4" style={{ background: '#F0FBF7', border: '1.5px solid #1D9E75' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Total price</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                      {fmtPrice(selectedOffer.totalAmount, selectedOffer.totalCurrency)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Includes all taxes and fees</p>
                  </div>
                  <span className="text-3xl">✈️</span>
                </div>
              </div>

              {bookingError && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-700 font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  ⚠️ {bookingError}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Confirmed ── */}
          {step === 3 && confirmation && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto" style={{ background: '#F0FBF7' }}>✅</div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">Booking confirmed!</p>
                <p className="text-sm text-gray-500 mt-1">A confirmation has been sent to {form.email}</p>
              </div>
              <div className="rounded-2xl p-5 text-left" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Booking reference</p>
                <p className="text-3xl font-extrabold tracking-widest text-gray-900">{confirmation.reference}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {fmtPrice(confirmation.amount, confirmation.currency)} · {fromName} → {toName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(departureDate + 'T12:00')} · {form.givenName} {form.familyName}</p>
              </div>
              <p className="text-xs text-gray-400">Keep your booking reference handy for check-in and airport queries.</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-gray-100 space-y-2">
          {step === 0 && !loadingOffers && !offersError && (
            <button
              disabled={!selectedOffer}
              onClick={() => setStep(1)}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
              Continue with {selectedOffer ? fmtPrice(selectedOffer.totalAmount, selectedOffer.totalCurrency) : '…'} →
            </button>
          )}

          {step === 1 && (
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">← Back</button>
              <button onClick={() => { if (validateForm()) setStep(2); }}
                className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white transition-opacity"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                Review booking →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">← Back</button>
              <button onClick={confirmBooking} disabled={booking}
                className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                {booking ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Booking…</>
                ) : (
                  `Confirm & Pay ${selectedOffer ? fmtPrice(selectedOffer.totalAmount, selectedOffer.totalCurrency) : ''}`
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: '#1D9E75' }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { prebookRate, bookHotel } from '@/lib/api';
import type { Hotel } from '@/lib/types';

interface Props {
  hotel: Hotel;
  open: boolean;
  onClose: () => void;
  /** Pre-fill from Supabase user */
  userEmail?: string;
  userFullName?: string;
}

type Step = 'loading' | 'confirm' | 'guest' | 'booking' | 'done' | 'error';

export default function BookingModal({ hotel, open, onClose, userEmail = '', userFullName = '' }: Props) {
  const [step, setStep] = useState<Step>('loading');
  const [prebookData, setPrebookData] = useState<Record<string, unknown> | null>(null);
  const [prebookId, setPrebookId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingResult, setBookingResult] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill name from Supabase user metadata
  useEffect(() => {
    if (userFullName) {
      const parts = userFullName.trim().split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' ') ?? '');
    }
    if (userEmail) setEmail(userEmail);
  }, [userFullName, userEmail]);

  // Kick off prebook when modal opens
  useEffect(() => {
    if (!open || !hotel.offer_id) return;
    setStep('loading');
    setPrebookData(null);
    setPrebookId('');
    setBookingResult(null);
    setErrorMsg('');

    prebookRate(hotel.offer_id)
      .then((data) => {
        setPrebookData(data);
        const id = (data.prebookId ?? data.id ?? '') as string;
        setPrebookId(id);
        setStep('confirm');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || 'Failed to fetch booking details. Please try again.');
        setStep('error');
      });
  }, [open, hotel.offer_id]);

  async function handleBook() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    setStep('booking');
    try {
      const result = await bookHotel(prebookId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setBookingResult(result);
      setStep('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Booking failed. Please try again.');
      setStep('error');
    }
  }

  if (!open) return null;

  // Extract price details from prebook response
  const finalPrice = prebookData
    ? ((prebookData.retailRate as Record<string, unknown>)?.total as Array<Record<string, unknown>>)?.[0]?.amount as number | undefined
    : null;
  const currency = prebookData
    ? ((prebookData.retailRate as Record<string, unknown>)?.total as Array<Record<string, unknown>>)?.[0]?.currency as string | undefined ?? 'USD'
    : 'USD';
  const cancelPolicies = prebookData
    ? (prebookData.cancellationPolicies as Record<string, unknown>)?.cancelPolicyInfos as Array<Record<string, unknown>> | undefined
    : null;
  const freeCancellation = cancelPolicies && cancelPolicies.length > 0;

  const bookingId = bookingResult
    ? (bookingResult.bookingId ?? bookingResult.id ?? '') as string
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-[11px] font-semibold text-teal uppercase tracking-wider">CheapStay · Thai pricing</p>
            <h2 className="text-base font-bold text-navy leading-tight">{hotel.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors text-lg">×</button>
        </div>

        <div className="px-6 py-5">

          {/* LOADING */}
          {step === 'loading' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Locking in your Thai rate…</p>
            </div>
          )}

          {/* CONFIRM */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-teal/5 rounded-xl border border-teal/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price per night</span>
                  <span className="text-base font-bold text-navy">${hotel.price ? Math.round(hotel.price) : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{hotel.nights} night{hotel.nights !== 1 ? 's' : ''}</span>
                  {finalPrice != null ? (
                    <span className="text-base font-bold text-navy">${Math.round(finalPrice)} {currency}</span>
                  ) : (
                    <span className="text-base font-bold text-navy">${hotel.total_price ? Math.round(hotel.total_price) : '—'}</span>
                  )}
                </div>
                {freeCancellation && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-teal/20">
                    <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-semibold text-teal">Free cancellation</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-400 bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
                <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This is a sandbox booking — no real charge. Production bookings use your Liteapi account credit.</span>
              </div>

              <button onClick={() => setStep('guest')}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-primary)' }}>
                Continue to Guest Details →
              </button>
            </div>
          )}

          {/* GUEST DETAILS */}
          {step === 'guest' && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleBook(); }}>
              <p className="text-sm font-semibold text-navy">Guest information</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">First name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Last name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep('confirm')}
                  className="flex-1 py-3 rounded-xl font-bold text-navy text-sm border border-gray-200 hover:border-teal transition-colors">
                  ← Back
                </button>
                <button type="submit"
                  disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-primary)' }}>
                  Confirm Booking →
                </button>
              </div>
            </form>
          )}

          {/* BOOKING IN PROGRESS */}
          {step === 'booking' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Confirming your booking…</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Booking confirmed!</h3>
                <p className="text-sm text-gray-500 mt-1">{hotel.name}</p>
              </div>
              {bookingId && (
                <div className="w-full bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Booking ID</p>
                  <p className="text-sm font-mono font-bold text-navy break-all">{bookingId}</p>
                </div>
              )}
              <p className="text-xs text-gray-400">A confirmation email has been sent to {email}.</p>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-primary)' }}>
                Done
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-50 rounded-xl border border-red-100 p-4">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700">Something went wrong</p>
                  <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-gray-600 text-sm border border-gray-200 hover:border-gray-300 transition-colors">
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

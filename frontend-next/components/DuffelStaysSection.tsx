'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DuffelRoom {
  id: string;
  name: string;
  beds: string;
  totalAmount: number;
  currency: string;
  rateId: string;
  freeCancellation: boolean;
  photos: string[];
}

interface DuffelResult {
  id: string;
  searchId: string;
  accommodation: {
    id: string;
    name: string;
    starRating: number | null;
    photo: string | null;
    address: string | null;
    city: string | null;
    amenities: string[];
    checkInTime: string | null;
    checkOutTime: string | null;
  };
  cheapestTotal: number;
  currency: string;
  cheapestRateId: string;
  rooms: DuffelRoom[];
}

interface QuoteData {
  quoteId: string;
  totalAmount: number;
  currency: string;
  expiresAt: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  accommodation: { name: string; address: string | null };
  rooms: { name: string; beds: string; freeCancellation: boolean; cancellationPenalty: string | null }[];
}

function StarRating({ value }: { value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className="w-3 h-3" fill={i < value ? '#F59E0B' : 'none'} stroke="#F59E0B" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

function fmtPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function DuffelBookingModal({
  result, checkin, checkout, onClose,
}: {
  result: DuffelResult;
  checkin: string;
  checkout: string;
  onClose: () => void;
}) {
  const nights = Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));
  const [step, setStep] = useState<'rooms' | 'quote' | 'guest' | 'booking' | 'done' | 'error'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<DuffelRoom>(result.rooms[0] ?? { id: '', name: 'Room', beds: '', totalAmount: result.cheapestTotal, currency: result.currency, rateId: result.cheapestRateId, freeCancellation: false, photos: [] });
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bornOn, setBornOn] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState('');
  const [bookingRef, setBookingRef] = useState('');

  // Pre-fill from logged-in user
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata ?? {};
      setGivenName(meta.given_name ?? meta.full_name?.split(' ')[0] ?? '');
      setFamilyName(meta.family_name ?? meta.full_name?.split(' ').slice(1).join(' ') ?? '');
      setEmail(data.user.email ?? '');
    });
  }, []);

  async function getQuote() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/stays/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResultId: result.id, roomRateId: selectedRoom.rateId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.detail ?? data.error ?? 'Quote failed');
      setQuote(data);
      setStep('guest');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Quote failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  async function confirmBooking() {
    if (!quote) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/stays/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.quoteId, guest: { givenName, familyName, email, phone, bornOn } }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.detail ?? data.error ?? 'Booking failed');
      setOrderId(data.orderId ?? '');
      setBookingRef(data.bookingReference ?? '');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Booking failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  const pricePerNight = fmtPrice(selectedRoom.totalAmount / nights, selectedRoom.currency);
  const totalPrice = fmtPrice(selectedRoom.totalAmount, selectedRoom.currency);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <p className="font-bold text-gray-900 text-sm">{result.accommodation.name}</p>
            <p className="text-xs text-gray-400">{checkin} → {checkout} · {nights} night{nights !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-lg font-bold">×</button>
        </div>

        <div className="p-5">
          {/* Step: room selection */}
          {step === 'rooms' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select a room</p>
              {result.rooms.length === 0 && (
                <div className="space-y-3">
                  <div className="border border-teal rounded-xl p-4">
                    <p className="font-semibold text-sm text-gray-900">Standard Room</p>
                    <p className="text-xs text-gray-400 mt-0.5">{pricePerNight}/night · {totalPrice} total</p>
                  </div>
                </div>
              )}
              {result.rooms.map(room => (
                <div key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className="border rounded-xl p-4 cursor-pointer transition-all"
                  style={{ borderColor: selectedRoom.id === room.id ? '#1D9E75' : '#E5E7EB', background: selectedRoom.id === room.id ? '#F0FBF7' : 'white' }}>
                  {room.photos[0] && (
                    <img src={room.photos[0]} alt={room.name} className="w-full h-28 object-cover rounded-lg mb-3" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{room.name}</p>
                      {room.beds && <p className="text-xs text-gray-400 mt-0.5">{room.beds}</p>}
                      {room.freeCancellation && (
                        <p className="text-[11px] text-green-600 font-medium mt-1">✓ Free cancellation</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">{fmtPrice(room.totalAmount / nights, room.currency)}<span className="text-xs font-normal text-gray-400">/night</span></p>
                      <p className="text-xs text-gray-400">{fmtPrice(room.totalAmount, room.currency)} total</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setStep('quote'); getQuote(); }}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                {loading ? 'Locking rate…' : `Continue · ${totalPrice} total`}
              </button>
            </div>
          )}

          {/* Step: loading quote */}
          {step === 'quote' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-teal animate-spin" />
              <p className="text-sm text-gray-500">Locking your rate…</p>
            </div>
          )}

          {/* Step: guest details */}
          {step === 'guest' && quote && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-gray-900">{quote.accommodation.name}</p>
                {quote.rooms[0] && <p className="text-xs text-gray-500 mt-0.5">{quote.rooms[0].name}</p>}
                <p className="text-xs text-gray-500 mt-1">{quote.checkInDate} → {quote.checkOutDate}</p>
                <p className="font-bold text-teal mt-2">{fmtPrice(quote.totalAmount, quote.currency)} total</p>
                {quote.rooms[0]?.freeCancellation && (
                  <p className="text-[11px] text-green-600 mt-1">✓ Free cancellation</p>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead guest details</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">First name</label>
                  <input value={givenName} onChange={e => setGivenName(e.target.value)}
                    placeholder="John"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Last name</label>
                  <input value={familyName} onChange={e => setFamilyName(e.target.value)}
                    placeholder="Doe"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Phone (optional)</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555 555 5555"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Date of birth (optional)</label>
                  <input type="date" value={bornOn} onChange={e => setBornOn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              </div>

              <button
                onClick={() => { setStep('booking'); confirmBooking(); }}
                disabled={!givenName || !familyName || !email || loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                {loading ? 'Booking…' : `Confirm booking · ${fmtPrice(quote.totalAmount, quote.currency)}`}
              </button>
            </div>
          )}

          {/* Step: booking in progress */}
          {step === 'booking' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-teal animate-spin" />
              <p className="text-sm text-gray-500">Confirming your booking…</p>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#F0FBF7' }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1D9E75" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Booking confirmed!</p>
                {bookingRef && <p className="text-sm text-gray-500 mt-1">Reference: <span className="font-mono font-semibold">{bookingRef}</span></p>}
                {orderId && <p className="text-xs text-gray-400 mt-0.5">Order ID: {orderId}</p>}
                <p className="text-xs text-gray-400 mt-2">Confirmation sent to {email}</p>
              </div>
              <button onClick={onClose} className="px-6 py-2 rounded-xl font-bold text-white text-sm" style={{ background: '#1D9E75' }}>
                Done
              </button>
            </div>
          )}

          {/* Step: error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <p className="font-bold text-gray-900">Something went wrong</p>
                <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setStep('rooms'); setErrorMsg(''); }} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50">
                  Try again
                </button>
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DuffelStaysSectionProps {
  location: string;
  checkin: string;
  checkout: string;
  adults: number;
  isPrimary?: boolean;
}

export default function DuffelStaysSection({ location, checkin, checkout, adults, isPrimary = false }: DuffelStaysSectionProps) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error' | 'empty'>('loading');
  const [results, setResults] = useState<DuffelResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingTarget, setBookingTarget] = useState<DuffelResult | null>(null);
  const nights = Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));

  useEffect(() => {
    setStatus('loading');
    setResults([]);
    fetch('/api/stays/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, checkin, checkout, adults }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.detail ?? data.error);
        const list: DuffelResult[] = data.results ?? [];
        setResults(list);
        setStatus(list.length === 0 ? 'empty' : 'done');
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Search failed';
        // Duffel Stays not enabled on this account — hide silently in primary mode
        if (isPrimary && (msg.toLowerCase().includes('feature') || msg.toLowerCase().includes('not available') || msg.toLowerCase().includes('not enabled'))) {
          setStatus('empty');
          return;
        }
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [location, checkin, checkout, adults]);

  if (status === 'error') {
    return (
      <div className={isPrimary ? 'mt-2' : 'mt-8'}>
        {!isPrimary && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🏨</span>
            <h2 className="font-bold text-navy text-lg">More hotels via Duffel</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">BETA</span>
          </div>
        )}
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{errorMsg}</p>
      </div>
    );
  }

  if (status === 'empty') return null;

  return (
    <div className={isPrimary ? 'mt-2' : 'mt-8'}>
      {!isPrimary && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🏨</span>
          <h2 className="font-bold text-navy text-lg">More hotels via Duffel</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">BETA</span>
          {status === 'loading' && (
            <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-teal animate-spin" />
          )}
        </div>
      )}

      {status === 'loading' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.slice(0, 9).map(r => {
            const pricePerNight = r.cheapestTotal / nights;
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {r.accommodation.photo ? (
                  <img src={r.accommodation.photo} alt={r.accommodation.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl">🏨</div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{r.accommodation.name}</p>
                      <StarRating value={r.accommodation.starRating} />
                    </div>
                  </div>
                  {r.accommodation.address && (
                    <p className="text-[11px] text-gray-400 mt-1 truncate">📍 {r.accommodation.address}</p>
                  )}
                  {r.accommodation.amenities.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{r.accommodation.amenities.slice(0, 3).join(' · ')}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 text-lg leading-none">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency, maximumFractionDigits: 0 }).format(pricePerNight)}
                      </p>
                      <p className="text-[11px] text-gray-400">/ night · {new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency, maximumFractionDigits: 0 }).format(r.cheapestTotal)} total</p>
                    </div>
                    <button
                      onClick={() => setBookingTarget(r)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex-shrink-0"
                      style={{ background: '#1D9E75' }}>
                      Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bookingTarget && (
        <DuffelBookingModal
          result={bookingTarget}
          checkin={checkin}
          checkout={checkout}
          onClose={() => setBookingTarget(null)}
        />
      )}
    </div>
  );
}

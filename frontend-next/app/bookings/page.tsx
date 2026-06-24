'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface CancellationPolicy {
  allowed: boolean;
  penalty_amount: number | null;
  penalty_currency: string | null;
}

interface FlightBooking {
  id: string;
  duffel_order_id: string;
  booking_reference: string;
  status: 'confirmed' | 'cancelled';
  origin_code: string;
  origin_city: string;
  destination_code: string;
  destination_city: string;
  departure_at: string;
  arrival_at: string;
  airline: string;
  total_amount: number;
  currency: string;
  passengers_count: number;
  passenger_names: string[];
  cancellation_policy: CancellationPolicy | null;
  created_at: string;
}

function cancellationBadge(policy: CancellationPolicy | null) {
  if (!policy) return null;
  if (!policy.allowed) return { label: 'Non-refundable', bg: '#FEE2E2', color: '#DC2626', icon: '✗' };
  if (!policy.penalty_amount) return { label: 'Free cancellation', bg: '#ECFDF5', color: '#15803D', icon: '✓' };
  const fee = fmtPrice(policy.penalty_amount, policy.penalty_currency ?? 'USD');
  return { label: `Cancel for ${fee} fee`, bg: '#FFFBEB', color: '#B45309', icon: '~' };
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Cancel state
  const [cancelling, setCancelling] = useState<string | null>(null); // bookingId
  const [cancelQuote, setCancelQuote] = useState<{
    cancellationId: string;
    refundAmount: number;
    refundCurrency: string;
    bookingId: string;
  } | null>(null);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setAuthChecked(true);
      if (!user) { router.push('/auth'); return; }
      // Query Supabase directly — avoids server-side auth issues with the API route
      const { data } = await supabase
        .from('flight_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setBookings(data);
      setLoading(false);
    });
  }, [router]);

  async function requestCancelQuote(booking: FlightBooking) {
    setCancelling(booking.id);
    setCancelError('');
    try {
      const res = await fetch('/api/flights/duffel-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote', orderId: booking.duffel_order_id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.detail || data.error);
      setCancelQuote({
        cancellationId: data.cancellationId,
        refundAmount: data.refundAmount,
        refundCurrency: data.refundCurrency,
        bookingId: booking.id,
      });
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not get cancellation quote.');
    } finally {
      setCancelling(null);
    }
  }

  async function confirmCancel() {
    if (!cancelQuote) return;
    setCancelConfirming(true);
    setCancelError('');
    try {
      const res = await fetch('/api/flights/duffel-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          cancellationId: cancelQuote.cancellationId,
          bookingId: cancelQuote.bookingId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.detail || data.error);
      setBookings(prev => prev.map(b =>
        b.id === cancelQuote.bookingId ? { ...b, status: 'cancelled' } : b
      ));
      setCancelQuote(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setCancelConfirming(false);
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-400">Loading your bookings…</p>
        </div>
      </div>
    );
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.departure_at) >= new Date());
  const past = bookings.filter(b => b.status === 'confirmed' && new Date(b.departure_at) < new Date());
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
            ← Back to search
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your flight bookings made through CheapStay</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {bookings.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-4xl mb-3">✈️</p>
            <p className="text-base font-bold text-gray-700">No bookings yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Your flight bookings will appear here</p>
            <button onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#1D9E75' }}>
              Search flights →
            </button>
          </div>
        )}

        {upcoming.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Upcoming</p>
            <div className="space-y-3">
              {upcoming.map(b => <BookingCard key={b.id} booking={b} onCancel={() => requestCancelQuote(b)} cancelling={cancelling === b.id} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Past trips</p>
            <div className="space-y-3">
              {past.map(b => <BookingCard key={b.id} booking={b} onCancel={() => requestCancelQuote(b)} cancelling={cancelling === b.id} />)}
            </div>
          </section>
        )}

        {cancelled.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Cancelled</p>
            <div className="space-y-3 opacity-60">
              {cancelled.map(b => <BookingCard key={b.id} booking={b} onCancel={() => {}} cancelling={false} />)}
            </div>
          </section>
        )}
      </div>

      {/* Cancel quote modal */}
      {cancelQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <p className="text-lg font-extrabold text-gray-900 mb-1">Cancel this booking?</p>
            <p className="text-sm text-gray-500 mb-4">This cannot be undone. Here&apos;s what Duffel confirmed you&apos;ll get back:</p>

            <div className="rounded-xl p-4 mb-4" style={{ background: cancelQuote.refundAmount > 0 ? '#ECFDF5' : '#FEF2F2' }}>
              {cancelQuote.refundAmount > 0 ? (
                <div>
                  <p className="text-2xl font-extrabold" style={{ color: '#1D9E75' }}>
                    {fmtPrice(cancelQuote.refundAmount, cancelQuote.refundCurrency)} refund
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Returned to your original payment method within 5–10 business days</p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-bold" style={{ color: '#DC2626' }}>No refund</p>
                  <p className="text-xs text-gray-500 mt-0.5">This fare is non-refundable. You will not receive any money back.</p>
                </div>
              )}
            </div>

            {cancelError && (
              <p className="text-xs text-red-600 mb-3">⚠️ {cancelError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setCancelQuote(null); setCancelError(''); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                Keep booking
              </button>
              <button onClick={confirmCancel} disabled={cancelConfirming}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                style={{ background: '#DC2626' }}>
                {cancelConfirming ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel error toast */}
      {cancelError && !cancelQuote && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg z-50">
          ⚠️ {cancelError}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b, onCancel, cancelling }: {
  booking: FlightBooking;
  onCancel: () => void;
  cancelling: boolean;
  // onCancel/cancelling kept for compat but cancel is now on manage page
}) {
  const isPast = new Date(b.departure_at) < new Date();
  const isCancelled = b.status === 'cancelled';
  const badge = cancellationBadge(b.cancellation_policy);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Route header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xl font-extrabold text-gray-900">
                {b.origin_code} → {b.destination_code}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`}
                style={isCancelled
                  ? { background: '#FEE2E2', color: '#DC2626' }
                  : isPast
                  ? { background: '#F3F4F6', color: '#6B7280' }
                  : { background: '#ECFDF5', color: '#15803D' }}>
                {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed ✓'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {b.origin_city} → {b.destination_city}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {b.airline} · {fmtDate(b.departure_at)} · {fmtTime(b.departure_at)}
            </p>
            {badge && !isCancelled && (
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.icon} {badge.label}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-extrabold" style={{ color: '#DC2626' }}>
              {fmtPrice(b.total_amount, b.currency)}
            </p>
            <p className="text-[10px] text-gray-400">{b.passengers_count} passenger{b.passengers_count > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Passengers */}
        {b.passenger_names?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {b.passenger_names.map((name, i) => (
              <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#F1F5F9', color: '#475569' }}>
                👤 {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Booking ref</p>
          <p className="text-sm font-extrabold text-gray-900 font-mono tracking-wide">{b.booking_reference}</p>
        </div>
        <Link href={`/bookings/${b.id}`}
          className="text-xs font-bold px-4 py-2 rounded-lg transition"
          style={{ color: '#1D9E75', background: '#ECFDF5', border: '1px solid #BBF7D0' }}>
          Manage →
        </Link>
      </div>
    </div>
  );
}

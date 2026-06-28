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
  status: 'confirmed' | 'cancelled' | 'held';
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

  const fetchBookings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setAuthChecked(true);
    if (!user) { router.push('/auth/login'); return; }
    const { data } = await supabase
      .from('flight_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    // Deduplicate by duffel_order_id — keep the most recent record per order
    const seen = new Set<string>();
    const deduped = data.filter(b => {
      const key = b.duffel_order_id || b.booking_reference;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setBookings(deduped);
    setLoading(false);

    // Background-sync: check Duffel status for confirmed bookings and fix stale Supabase records.
    // Runs after rendering so the user sees bookings immediately, then statuses correct themselves.
    const confirmed = deduped.filter(b => b.status === 'confirmed' && b.duffel_order_id);
    if (confirmed.length === 0) return;
    const results = await Promise.allSettled(
      confirmed.map(b =>
        fetch('/api/flights/duffel-order-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: b.duffel_order_id }),
        }).then(r => r.json()).then(order => ({ booking: b, status: order?.status as string | undefined }))
      )
    );
    const updates: string[] = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const { booking, status } = r.value;
      if (status && status !== booking.status) {
        updates.push(booking.duffel_order_id);
        // Persist fix in Supabase via sync action
        fetch('/api/flights/duffel-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', bookingId: booking.id, status, orderId: booking.duffel_order_id }),
        }).catch(() => {});
      }
    }
    if (updates.length > 0) {
      // Build a map of orderId → corrected status, then patch local state
      const statusMap = new Map<string, FlightBooking['status']>();
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value.status) continue;
        statusMap.set(r.value.booking.duffel_order_id, r.value.status as FlightBooking['status']);
      }
      setBookings(prev => prev.map(b =>
        statusMap.has(b.duffel_order_id) ? { ...b, status: statusMap.get(b.duffel_order_id)! } : b
      ));
    }
  };

  useEffect(() => {
    fetchBookings();
    // Refetch when user returns to this tab — catches cancellations made on detail page
    const onFocus = () => fetchBookings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const held = bookings.filter(b => b.status === 'held');
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

        {held.length > 0 && (
          <section>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-3">⏳ Held — payment required</p>
            <div className="space-y-3">
              {held.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Upcoming</p>
            <div className="space-y-3">
              {upcoming.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Past trips</p>
            <div className="space-y-3">
              {past.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {cancelled.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Cancelled</p>
            <div className="space-y-3 opacity-60">
              {cancelled.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking: b }: { booking: FlightBooking }) {
  const isPast = new Date(b.departure_at) < new Date();
  const isCancelled = b.status === 'cancelled';
  const isHeld = b.status === 'held';
  const badge = cancellationBadge(b.cancellation_policy);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Route header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                {b.origin_code}
                <span className="flex items-center gap-1 text-gray-300 font-normal">
                  <svg className="w-4 h-4" style={{ color: '#1D9E75' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5z"/>
                  </svg>
                </span>
                {b.destination_code}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`}
                style={isCancelled
                  ? { background: '#FEE2E2', color: '#DC2626' }
                  : isHeld
                  ? { background: '#FEF3C7', color: '#B45309' }
                  : isPast
                  ? { background: '#F3F4F6', color: '#6B7280' }
                  : { background: '#ECFDF5', color: '#15803D' }}>
                {isCancelled ? 'Cancelled' : isHeld ? '⏳ Held' : isPast ? 'Completed' : 'Confirmed ✓'}
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
              <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: '#F1F5F9', color: '#475569' }}>
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

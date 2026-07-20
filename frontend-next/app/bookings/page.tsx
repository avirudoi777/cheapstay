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
  cabin_class: string | null;
  cancellation_policy: CancellationPolicy | null;
  created_at: string;
}

function cancellationBadge(policy: CancellationPolicy | null) {
  if (!policy) return null;
  if (!policy.allowed) return { label: 'Non-refundable', className: 'bg-error/10 text-error', icon: 'block' };
  if (!policy.penalty_amount) return { label: 'Free cancellation', className: 'bg-savings-green/10 text-savings-green', icon: 'check_circle' };
  const fee = fmtPrice(policy.penalty_amount, policy.penalty_currency ?? 'USD');
  return { label: `Cancel for ${fee} fee`, className: 'bg-alert-orange/10 text-alert-orange', icon: 'info' };
}

function fmtCabin(c: string | null) {
  const map: Record<string, string> = { economy: 'Economy', premium_economy: 'Premium Economy', business: 'Business', first: 'First Class' };
  if (!c) return 'Economy';
  return map[c] ?? c.replace('_', ' ');
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
function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
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
        // Update directly from browser client (has auth session, bypasses any server-side key issues)
        supabase.from('flight_bookings').update({ status }).eq('duffel_order_id', booking.duffel_order_id).then(() => {});
        supabase.from('flight_bookings').update({ status }).eq('id', booking.id).then(() => {});
        // Also call server sync as fallback (uses admin client for rows with null user_id)
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
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm text-on-surface-variant">Loading your bookings…</p>
        </div>
      </div>
    );
  }

  const held = bookings.filter(b => b.status === 'held');
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.departure_at) >= new Date());
  const past = bookings.filter(b => b.status === 'confirmed' && new Date(b.departure_at) < new Date());
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <div className="bg-white border-b border-border-subtle">
        <div className="max-w-container-max mx-auto px-gutter py-6">
          <button onClick={() => router.push('/')} className="text-sm text-on-surface-variant hover:text-pro-navy mb-4 flex items-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to search
          </button>
          <h1 className="font-headline-lg text-headline-lg text-pro-navy">My Bookings</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Your flight bookings made through CheapStay</p>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-gutter py-stack-md">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border-subtle pro-shadow p-10 text-center max-w-3xl mx-auto">
            <span className="material-symbols-outlined text-primary text-5xl mb-3">flight</span>
            <p className="text-base font-bold text-pro-navy">No bookings yet</p>
            <p className="text-sm text-on-surface-variant mt-1 mb-5">Your flight bookings will appear here</p>
            <button onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity cursor-pointer">
              Search flights →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Bookings list */}
            <div className="lg:col-span-2 space-y-8">
              {held.length > 0 && (
                <section>
                  <p className="font-label-bold text-label-bold text-alert-orange uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Held — payment required
                  </p>
                  <div className="space-y-3">
                    {held.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </section>
              )}

              {upcoming.length > 0 && (
                <section>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-3">Upcoming</p>
                  <div className="space-y-3">
                    {upcoming.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-3">Past trips</p>
                  <div className="space-y-3">
                    {past.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </section>
              )}

              {cancelled.length > 0 && (
                <section>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-3">Cancelled</p>
                  <div className="space-y-3 opacity-60">
                    {cancelled.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl pro-shadow border border-border-subtle flex gap-4 items-start">
                <div className="bg-sky-blue/10 p-3 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-sky-blue" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base text-pro-navy mb-1">Avi&apos;s Pro Tip</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Online check-in usually opens 24 hours before departure — set a reminder so you can lock in a
                    free seat before the airline starts charging for the good ones.
                  </p>
                </div>
              </div>

              <Link href="/consult" className="block bg-white rounded-xl border border-border-subtle p-5 pro-shadow hover:shadow-md transition-shadow group">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">call</span>
                </div>
                <h4 className="text-pro-navy font-headline-md text-lg mb-1">Need help with a booking?</h4>
                <p className="text-on-surface-variant text-sm mb-4">Book a 1-on-1 call with Avi for route planning and booking hacks.</p>
                <span className="text-primary font-label-bold text-sm flex items-center gap-1">
                  Book a call <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
              </Link>

              <Link href="/shop" className="block bg-white rounded-xl border border-border-subtle p-5 pro-shadow hover:shadow-md transition-shadow group">
                <div className="bg-tertiary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-tertiary">luggage</span>
                </div>
                <h4 className="text-pro-navy font-headline-md text-lg mb-1">Shop travel gear</h4>
                <p className="text-on-surface-variant text-sm mb-4">Avi&apos;s picks for luggage, tech, and travel essentials.</p>
                <span className="text-tertiary font-label-bold text-sm flex items-center gap-1">
                  Browse the shop <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
              </Link>
            </div>
          </div>
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
  const isPremium = b.cabin_class === 'business' || b.cabin_class === 'first';
  const isFirst = b.cabin_class === 'first';
  const daysOut = daysUntil(b.departure_at);

  const statusClass = isCancelled
    ? 'bg-error/10 text-error'
    : isHeld
    ? 'bg-alert-orange/10 text-alert-orange'
    : isPast
    ? 'bg-surface-container text-on-surface-variant'
    : isPremium
    ? ''
    : 'bg-savings-green/10 text-savings-green';

  return (
    <div className={`rounded-2xl overflow-hidden ${isPremium && !isCancelled ? '' : 'bg-white border border-border-subtle pro-shadow'}`}
      style={isPremium && !isCancelled
        ? {
            background: isFirst
              ? 'linear-gradient(135deg, #0d0618 0%, #1a0b2e 100%)'
              : 'linear-gradient(135deg, #0f0d00 0%, #1a1500 100%)',
            border: `1.5px solid ${isFirst ? 'rgba(139,92,246,0.45)' : 'rgba(212,175,55,0.45)'}`,
            boxShadow: `0 4px 24px ${isFirst ? 'rgba(139,92,246,0.15)' : 'rgba(212,175,55,0.12)'}`,
          }
        : undefined}>

      {/* Premium banner */}
      {isPremium && !isCancelled && (
        <div className="px-5 pt-3 pb-0 flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ color: isFirst ? '#A78BFA' : '#D4AF37', fontSize: 14 }}>stars</span>
          <p className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: isFirst ? '#A78BFA' : '#D4AF37' }}>
            {isFirst ? 'First Class' : 'Business Class'}
          </p>
        </div>
      )}

      {/* Route header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <p className={`text-xl font-extrabold flex items-center gap-2 ${isPremium && !isCancelled ? '' : 'text-pro-navy'}`}
                style={{ color: isPremium && !isCancelled ? '#fff' : undefined }}>
                {b.origin_code}
                <span className="material-symbols-outlined text-[18px]" style={{ color: isPremium && !isCancelled ? (isFirst ? '#A78BFA' : '#D4AF37') : 'var(--color-primary)' }}>
                  flight_takeoff
                </span>
                {b.destination_code}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}
                style={isPremium && !isCancelled ? { background: isFirst ? 'rgba(139,92,246,0.2)' : 'rgba(212,175,55,0.2)', color: isFirst ? '#C4B5FD' : '#D4AF37' } : undefined}>
                {isCancelled ? 'Cancelled' : isHeld ? 'Held' : isPast ? 'Completed' : 'Confirmed'}
              </span>
              {!isPast && !isCancelled && (
                <span className="text-[10px] font-semibold text-on-surface-variant" style={isPremium ? { color: 'rgba(255,255,255,0.4)' } : undefined}>
                  {daysOut === 0 ? 'Today' : daysOut === 1 ? 'Tomorrow' : daysOut > 0 ? `In ${daysOut} days` : ''}
                </span>
              )}
            </div>
            <p className={`text-sm ${isPremium && !isCancelled ? '' : 'text-on-surface-variant'}`}
              style={{ color: isPremium && !isCancelled ? 'rgba(255,255,255,0.55)' : undefined }}>
              {b.origin_city} → {b.destination_city}
            </p>
            <p className={`text-xs mt-0.5 flex items-center gap-1.5 flex-wrap ${isPremium && !isCancelled ? '' : 'text-outline'}`}
              style={{ color: isPremium && !isCancelled ? 'rgba(255,255,255,0.4)' : undefined }}>
              <span>{b.airline}</span>
              {!isPremium && fmtCabin(b.cabin_class) && (
                <span className="font-semibold px-1.5 py-0.5 rounded text-[10px] bg-surface-container-low text-on-surface-variant">
                  {fmtCabin(b.cabin_class)}
                </span>
              )}
              <span>· {fmtDate(b.departure_at)} · {fmtTime(b.departure_at)}</span>
            </p>
            {badge && !isCancelled && (
              <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.className}`}>
                <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                {badge.label}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-xl font-extrabold ${isPremium && !isCancelled ? '' : 'text-primary'}`}
              style={{ color: isPremium && !isCancelled ? (isFirst ? '#C4B5FD' : '#D4AF37') : undefined }}>
              {fmtPrice(b.total_amount, b.currency)}
            </p>
            <p className={`text-[10px] ${isPremium && !isCancelled ? '' : 'text-outline'}`}
              style={{ color: isPremium && !isCancelled ? 'rgba(255,255,255,0.4)' : undefined }}>
              {b.passengers_count} passenger{b.passengers_count > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Passengers */}
        {b.passenger_names?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {b.passenger_names.map((name, i) => (
              <span key={i} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize flex items-center gap-1 ${isPremium && !isCancelled ? '' : 'bg-surface-container-low text-on-surface-variant'}`}
                style={isPremium && !isCancelled ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' } : undefined}>
                <span className="material-symbols-outlined text-[13px]">person</span>
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className={`px-5 py-3 flex items-center justify-between ${isPremium && !isCancelled ? '' : 'bg-surface-container-low border-t border-border-subtle'}`}
        style={isPremium && !isCancelled
          ? { background: 'rgba(0,0,0,0.25)', borderTop: `1px solid ${isFirst ? 'rgba(139,92,246,0.25)' : 'rgba(212,175,55,0.25)'}` }
          : undefined}>
        <div>
          <p className={`text-[10px] uppercase tracking-wide ${isPremium && !isCancelled ? '' : 'text-outline'}`}
            style={{ color: isPremium && !isCancelled ? 'rgba(255,255,255,0.35)' : undefined }}>
            Booking ref
          </p>
          <p className={`text-sm font-extrabold font-mono tracking-wide ${isPremium && !isCancelled ? '' : 'text-pro-navy'}`}
            style={{ color: isPremium && !isCancelled ? '#fff' : undefined }}>
            {b.booking_reference}
          </p>
        </div>
        <Link href={`/bookings/${b.id}`}
          className={`text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1 ${isPremium && !isCancelled ? '' : 'text-primary bg-primary/10 border border-primary/20'}`}
          style={isPremium && !isCancelled
            ? { color: isFirst ? '#C4B5FD' : '#D4AF37', background: isFirst ? 'rgba(139,92,246,0.18)' : 'rgba(212,175,55,0.15)', border: `1px solid ${isFirst ? 'rgba(139,92,246,0.35)' : 'rgba(212,175,55,0.35)'}` }
            : undefined}>
          Manage <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

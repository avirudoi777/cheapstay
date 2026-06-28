'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLayoverGuide } from '@/lib/layover-guides';
import { getArrivalTips } from '@/lib/arrival-tips';
import { getAppMeta, getVisaNotice, LIMO_SERVICES } from '@/lib/transport-tips';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  cancellation_policy: { allowed: boolean; penalty_amount: number | null; penalty_currency: string | null } | null;
  created_at: string;
}

interface DuffelPassenger {
  id: string;
  title: string;
  given_name: string;
  family_name: string;
  gender: string;
  born_on: string;
  email: string;
  phone_number?: string;
  identity_documents: {
    type: string;
    unique_identifier: string;
    expires_on: string;
    issuing_country_code: string;
  }[];
}

interface DuffelOrder {
  id: string;
  booking_reference: string;
  status: string;
  total_amount: string;
  total_currency: string;
  passengers: DuffelPassenger[];
  slices: {
    segments: {
      origin: { iata_code: string; name: string; city_name?: string; terminal?: string };
      destination: { iata_code: string; name: string; city_name?: string; terminal?: string };
      departing_at: string;
      arriving_at: string;
      marketing_carrier: { iata_code: string; name: string };
      operating_carrier?: { iata_code: string; name: string };
      aircraft?: { name: string };
      cabin_class?: string;
      duration?: string;
    }[];
  }[];
  conditions: {
    refund_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string };
    change_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string };
  };
  services?: { id: string; type: string; quantity: number; metadata?: Record<string, unknown> }[];
  payment_requirements?: {
    requires_payment_by?: string;
    payment_required_by?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const fmtPrice = (n: number, cur: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);

function parseDuration(iso?: string) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  const h = parseInt(m[1] ?? '0');
  const min = parseInt(m[2] ?? '0');
  return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}`.trim() : `${min}m`;
}

function countryName(code: string) {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; }
  catch { return code; }
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManageBookingPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [booking, setBooking] = useState<FlightBooking | null>(null);
  const [order, setOrder] = useState<DuffelOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Cancel state — simplified: modal → quote+confirm in one shot, no router.refresh()
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [cancelRefund, setCancelRefund] = useState<{ amount: number; currency: string } | null>(null);
  const [cancelError, setCancelError] = useState('');

  // Post-booking bags state
  const [bagServices, setBagServices] = useState<{
    id: string; totalAmount: number; totalCurrency: string;
    maxWeightKg: number | null; maxQuantity: number;
    passengerIds: string[]; segmentIds: string[];
  }[]>([]);
  const [bagSelections, setBagSelections] = useState<Record<string, number>>({});
  const [bagsLoading, setBagsLoading] = useState(false);
  const [bagsChecked, setBagsChecked] = useState(false);
  const [bagsSaving, setBagsSaving] = useState(false);
  const [bagsDone, setBagsDone] = useState(false);
  const [bagsError, setBagsError] = useState('');

  // Name correction state
  const [nameFormOpen, setNameFormOpen] = useState(false);
  const [nameUnavailable, setNameUnavailable] = useState(false);
  const [namePassengerId, setNamePassengerId] = useState('');
  const [nameFields, setNameFields] = useState({ given_name: '', family_name: '', phone_number: '' });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameDone, setNameDone] = useState(false);
  const [nameError, setNameError] = useState('');

  // Pay held order state
  const [payHeldLoading, setPayHeldLoading] = useState(false);
  const [payHeldDone, setPayHeldDone] = useState(false);
  const [payHeldError, setPayHeldError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth'); return; }
      const { data } = await supabase.from('flight_bookings').select('*').eq('id', id).single();
      if (!data) { router.push('/bookings'); return; }
      setBooking(data);
      setLoading(false);

      // Fetch full Duffel order for passenger details
      setOrderLoading(true);
      try {
        const res = await fetch('/api/flights/duffel-order-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.duffel_order_id }),
        });
        const json = await res.json();
        if (res.ok) setOrder(json);
        else setOrderError(json.error ?? 'Could not load full order details');
      } catch {
        setOrderError('Could not reach Duffel');
      } finally {
        setOrderLoading(false);
      }

      // Auto-check bag availability (skip for cancelled/held)
      if (data.status !== 'cancelled' && data.status !== 'held') {
        setBagsLoading(true);
        try {
          const bagRes = await fetch(`/api/flights/duffel-post-book-bags?orderId=${data.duffel_order_id}`);
          const bagData = await bagRes.json();
          if (bagRes.ok) setBagServices(bagData.services ?? []);
        } catch {
          // silently ignore — bags section shows "contact airline"
        } finally {
          setBagsLoading(false);
          setBagsChecked(true);
        }
      }
    });
  }, [id, router]);

  async function cancelBooking() {
    if (!booking) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      // Step 1: get cancellationId from Duffel (required to confirm)
      // Also send bookingId so the route can fix a stale Supabase record if already cancelled
      const quoteRes = await fetch('/api/flights/duffel-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote', orderId: booking.duffel_order_id, bookingId: booking.id }),
      });
      const quote = await quoteRes.json();

      // Duffel already cancelled this order (Supabase had a stale status) — treat as success
      if (quote.alreadyCancelled) {
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev);
        setCancelDone(true);
        setShowCancelModal(false);
        return;
      }

      if (quote.error) throw new Error(quote.detail || quote.error);

      // Step 2: confirm the cancellation
      const confirmRes = await fetch('/api/flights/duffel-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', cancellationId: quote.cancellationId, bookingId: booking.id }),
      });
      const confirmed = await confirmRes.json();
      if (confirmed.error) throw new Error(confirmed.detail || confirmed.error);

      // Update local state only — no router.refresh() to avoid race where
      // Supabase hasn't propagated the new status yet and the page re-mounts
      // showing the old confirmed state
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setCancelRefund({ amount: quote.refundAmount, currency: quote.refundCurrency });
      setCancelDone(true);
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  }

  async function addBags() {
    if (!booking) return;
    const toAdd = Object.entries(bagSelections).filter(([, q]) => q > 0).map(([id, quantity]) => ({ serviceId: id, quantity }));
    if (!toAdd.length) return;
    setBagsSaving(true); setBagsError('');
    try {
      const res = await fetch('/api/flights/duffel-post-book-bags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: booking.duffel_order_id, bookingId: booking.id, services: toAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add bags');
      setBagsDone(true); setBagSelections({});
    } catch (err) {
      setBagsError(err instanceof Error ? err.message : 'Could not add bags.');
    } finally {
      setBagsSaving(false);
    }
  }

  async function saveNameCorrection() {
    if (!booking || !namePassengerId) return;
    setNameSaving(true); setNameError('');
    try {
      const fields: Record<string, string> = {};
      if (nameFields.given_name.trim()) fields.given_name = nameFields.given_name.trim();
      if (nameFields.family_name.trim()) fields.family_name = nameFields.family_name.trim();
      if (nameFields.phone_number.trim()) fields.phone_number = nameFields.phone_number.trim();
      const res = await fetch('/api/flights/duffel-change-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'patch', orderId: booking.duffel_order_id, passengerId: namePassengerId, fields }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg: string = data.error ?? 'Update failed';
        if (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('not found')) {
          setNameUnavailable(true); setNameFormOpen(false);
          return;
        }
        throw new Error(msg);
      }
      setNameDone(true); setNameFormOpen(false);
      // Refresh order data
      const orderRes = await fetch('/api/flights/duffel-order-detail', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: booking.duffel_order_id }),
      });
      if (orderRes.ok) setOrder(await orderRes.json());
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setNameSaving(false);
    }
  }

  async function payHeldOrder() {
    if (!booking) return;
    setPayHeldLoading(true); setPayHeldError('');
    try {
      const res = await fetch('/api/flights/duffel-pay-held', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: booking.duffel_order_id,
          bookingId: booking.id,
          amount: booking.total_amount.toString(),
          currency: booking.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Payment failed');
      setBooking(prev => prev ? { ...prev, status: 'confirmed' } : prev);
      setPayHeldDone(true);
    } catch (err) {
      setPayHeldError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setPayHeldLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!booking) return null;

  const isCancelled = booking.status === 'cancelled' || cancelDone;
  const isHeld = booking.status === 'held' && !cancelDone;
  const isPast = new Date(booking.departure_at) < new Date();
  const canCancel = !isCancelled && !isHeld && !isPast;

  // Derive cancellation policy display
  const cp = booking.cancellation_policy;
  const cancelPolicyLabel = !cp ? null
    : !cp.allowed ? { text: 'Non-refundable', color: '#DC2626', bg: '#FEF2F2' }
    : cp.penalty_amount ? { text: `Cancel fee: ${fmtPrice(cp.penalty_amount, cp.penalty_currency ?? 'USD')}`, color: '#B45309', bg: '#FFFBEB' }
    : { text: 'Free cancellation', color: '#15803D', bg: '#ECFDF5' };

  const firstSeg = order?.slices?.[0]?.segments?.[0];
  const allSegs = order?.slices?.flatMap(s => s.segments) ?? [];
  const lastSeg = allSegs[allSegs.length - 1];

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/bookings')}
            className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 transition">
            ← My Bookings
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Route header ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {booking.origin_code} → {booking.destination_code}
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={isCancelled
                    ? { background: '#FEE2E2', color: '#DC2626' }
                    : isHeld
                    ? { background: '#FEF3C7', color: '#B45309' }
                    : isPast
                    ? { background: '#F3F4F6', color: '#6B7280' }
                    : { background: '#ECFDF5', color: '#15803D' }}>
                  {isCancelled ? 'Cancelled' : isHeld ? '⏳ Held — pay to confirm' : isPast ? 'Completed' : 'Confirmed ✓'}
                </span>
              </div>
              <p className="text-base text-gray-500">{booking.origin_city} → {booking.destination_city}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {booking.airline} · {fmtDate(booking.departure_at)}
              </p>
              {!isCancelled && !isPast && (() => {
                const diff = new Date(booking.departure_at).getTime() - Date.now();
                const totalH = Math.floor(diff / 3_600_000);
                const days = Math.floor(totalH / 24);
                const hours = totalH % 24;
                const mins = Math.floor((diff % 3_600_000) / 60_000);
                const isToday = days === 0;
                const isTomorrow = days === 1;
                const isUrgent = days < 2;
                const label = isToday
                  ? `Today · departing in ${hours}h ${mins}m`
                  : isTomorrow
                  ? `Tomorrow · departing in ${hours}h ${mins}m`
                  : `Departing in ${days} day${days !== 1 ? 's' : ''}, ${hours}h`;
                return (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1 rounded-full"
                    style={isUrgent
                      ? { background: '#FEF3C7', color: '#B45309' }
                      : { background: '#ECFDF5', color: '#15803D' }}>
                    {isUrgent ? '⏱' : '✈'} {label}
                  </span>
                );
              })()}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-extrabold" style={{ color: '#DC2626' }}>
                {fmtPrice(booking.total_amount, booking.currency)}
              </p>
              <p className="text-xs text-gray-400">{booking.passengers_count} passenger{booking.passengers_count > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* ── Booking reference ───────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
          <div className="px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#94A3B8' }}>Booking Reference</p>
            <p className="text-4xl font-black tracking-[0.12em]" style={{ color: '#F0FDF4', fontFamily: 'monospace' }}>
              {booking.booking_reference}
            </p>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>
              Order ID: {booking.duffel_order_id}
            </p>
          </div>
          <div className="border-t px-6 py-3 flex items-center justify-between" style={{ borderColor: '#1E293B', background: 'rgba(0,0,0,0.2)' }}>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Booked {fmtDate(booking.created_at)}
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Use this reference at the airport
            </p>
          </div>
        </div>

        {/* ── Flight details ──────────────────────────────────────────── */}
        <Section title="Flight Details">
          {orderLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1D9E75', borderTopColor: 'transparent' }} />
              Loading live flight details…
            </div>
          )}
          {orderError && !orderLoading && (
            <p className="text-sm text-gray-400">Could not load live details — showing saved info.</p>
          )}
          {allSegs.length > 0 ? (
            <div className="space-y-5">
              {allSegs.map((seg, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 border-t border-dashed border-amber-200" />
                      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#FFFBEB', color: '#B45309' }}>
                        Layover · {seg.origin.city_name ?? seg.origin.iata_code}
                      </span>
                      <div className="flex-1 border-t border-dashed border-amber-200" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    {/* Dep */}
                    <div className="flex-1">
                      <p className="text-2xl font-extrabold text-gray-900">{fmtTime(seg.departing_at)}</p>
                      <p className="text-sm font-bold text-gray-700">{seg.origin.iata_code}</p>
                      <p className="text-xs text-gray-400">{seg.origin.city_name ?? seg.origin.name}</p>
                      {seg.origin.terminal && <p className="text-xs text-gray-400">Terminal {seg.origin.terminal}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(seg.departing_at)}</p>
                    </div>
                    {/* Duration */}
                    <div className="text-center pt-2">
                      {parseDuration(seg.duration) && (
                        <p className="text-xs text-gray-400">{parseDuration(seg.duration)}</p>
                      )}
                      <div className="flex items-center gap-1 my-1">
                        <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: '#1D9E75' }} />
                        <div className="w-10 h-px" style={{ background: '#1D9E75' }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: '#1D9E75' }} />
                      </div>
                      <p className="text-[10px] text-gray-400">{seg.marketing_carrier.iata_code}</p>
                    </div>
                    {/* Arr */}
                    <div className="flex-1 text-right">
                      <p className="text-2xl font-extrabold text-gray-900">{fmtTime(seg.arriving_at)}</p>
                      <p className="text-sm font-bold text-gray-700">{seg.destination.iata_code}</p>
                      <p className="text-xs text-gray-400">{seg.destination.city_name ?? seg.destination.name}</p>
                      {seg.destination.terminal && <p className="text-xs text-gray-400">Terminal {seg.destination.terminal}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(seg.arriving_at)}</p>
                    </div>
                  </div>
                  {/* Segment meta */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#F1F5F9', color: '#475569' }}>
                      ✈ {seg.marketing_carrier.name}
                    </span>
                    {seg.operating_carrier && seg.operating_carrier.iata_code !== seg.marketing_carrier.iata_code && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#F1F5F9', color: '#475569' }}>
                        Operated by {seg.operating_carrier.name}
                      </span>
                    )}
                    {seg.aircraft && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#F1F5F9', color: '#475569' }}>
                        {seg.aircraft.name}
                      </span>
                    )}
                    {seg.cabin_class && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: '#F1F5F9', color: '#475569' }}>
                        {seg.cabin_class.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : !orderLoading && (
            /* Fallback to saved data */
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-2xl font-extrabold text-gray-900">{fmtTime(booking.departure_at)}</p>
                <p className="text-sm font-bold text-gray-700">{booking.origin_code}</p>
                <p className="text-xs text-gray-400">{booking.origin_city}</p>
                <p className="text-xs text-gray-400">{fmtDate(booking.departure_at)}</p>
              </div>
              <div className="text-center pt-2">
                <div className="flex items-center gap-1 my-1">
                  <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: '#1D9E75' }} />
                  <div className="w-10 h-px" style={{ background: '#1D9E75' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#1D9E75' }} />
                </div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-2xl font-extrabold text-gray-900">{fmtTime(booking.arrival_at)}</p>
                <p className="text-sm font-bold text-gray-700">{booking.destination_code}</p>
                <p className="text-xs text-gray-400">{booking.destination_city}</p>
                <p className="text-xs text-gray-400">{fmtDate(booking.arrival_at)}</p>
              </div>
            </div>
          )}
        </Section>

        {/* ── Payment ─────────────────────────────────────────────────── */}
        <Section title="Payment">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Flight fare</span>
              <span className="text-sm text-gray-900 font-semibold">
                {fmtPrice(Math.max(0, booking.total_amount - 10), booking.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Service fee</span>
              <span className="text-sm text-gray-900 font-semibold">{fmtPrice(10, booking.currency)}</span>
            </div>
            {order?.services && order.services.length > 0 && order.services.map((svc, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-500 capitalize">
                  {svc.type === 'baggage' ? `Extra bag ×${svc.quantity}` : svc.type}
                </span>
                <span className="text-sm text-gray-500">included</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
              <span className="text-base font-extrabold text-gray-900">Total paid</span>
              <span className="text-xl font-extrabold" style={{ color: '#1D9E75' }}>
                {fmtPrice(booking.total_amount, booking.currency)}
              </span>
            </div>
          </div>
        </Section>

        {/* ── Passengers ──────────────────────────────────────────────── */}
        <Section title={`Passengers · ${booking.passengers_count}`}>
          {orderLoading && (
            <p className="text-sm text-gray-400">Loading passenger details…</p>
          )}
          {(order?.passengers ?? []).length > 0 ? (
            <div className="space-y-4">
              {order!.passengers.map((p, i) => (
                <PassengerCard key={p.id} passenger={p} index={i} />
              ))}
              <div className="rounded-xl p-3 flex gap-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span className="text-sm">ℹ️</span>
                <p className="text-xs text-gray-500">
                  To change passenger details (name, passport), contact the airline directly using booking reference{' '}
                  <span className="font-bold text-gray-700">{booking.booking_reference}</span>.
                </p>
              </div>
            </div>
          ) : !orderLoading && (
            <div className="space-y-3">
              {booking.passenger_names.map((name, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: '#1D9E75' }}>
                    {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 capitalize">{name}</p>
                    <p className="text-xs text-gray-400">Passenger {i + 1}</p>
                  </div>
                </div>
              ))}
              {orderError && <p className="text-xs text-gray-400 mt-2">Full passport details unavailable — could not load order from Duffel.</p>}
            </div>
          )}
        </Section>

        {/* ── Cancellation ────────────────────────────────────────────── */}
        <Section title="Cancellation">
          {cancelDone ? (
            <div className="space-y-4">
              <div className="rounded-xl p-5 text-center" style={{ background: '#ECFDF5' }}>
                <p className="text-2xl mb-1">✅</p>
                <p className="text-base font-extrabold" style={{ color: '#15803D' }}>Booking cancelled</p>
                <p className="text-xs text-gray-500 mt-1">
                  {cancelRefund && cancelRefund.amount > 0
                    ? `Your refund of ${fmtPrice(cancelRefund.amount, cancelRefund.currency)} will appear within 5–10 business days.`
                    : 'If eligible, your refund will appear within 5–10 business days.'}
                </p>
              </div>
              <button onClick={() => router.push('/bookings')}
                className="w-full py-3 rounded-xl text-sm font-bold transition"
                style={{ background: '#1D9E75', color: '#fff' }}>
                ← Back to My Bookings
              </button>
            </div>
          ) : isCancelled ? (
            <div className="rounded-xl p-4 text-center" style={{ background: '#FEF2F2' }}>
              <p className="text-base font-bold" style={{ color: '#DC2626' }}>This booking has been cancelled</p>
              <p className="text-xs text-gray-500 mt-1">If eligible, your refund will appear within 5–10 business days.</p>
            </div>
          ) : isPast ? (
            <p className="text-sm text-gray-400">This flight has already departed. Cancellations are no longer available.</p>
          ) : cp?.allowed === false ? (
            <div className="rounded-xl px-4 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-bold" style={{ color: '#DC2626' }}>Non-refundable fare</p>
              <p className="text-xs text-gray-500 mt-0.5">This ticket cannot be cancelled for a refund. Contact the airline for exceptions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cancelPolicyLabel && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: cancelPolicyLabel.bg }}>
                  <span className="text-sm font-bold" style={{ color: cancelPolicyLabel.color }}>{cancelPolicyLabel.text}</span>
                </div>
              )}
              <button onClick={() => { setCancelError(''); setShowCancelModal(true); }}
                className="w-full py-3 rounded-xl text-sm font-bold transition"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA' }}>
                Cancel booking
              </button>
            </div>
          )}
        </Section>

        {/* ── Cancel confirm modal ─────────────────────────────────────── */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowCancelModal(false); }}>
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-5">
                <p className="text-base font-extrabold text-gray-900 mb-1">Cancel this booking?</p>
                <p className="text-sm text-gray-500">
                  {booking!.origin_code} → {booking!.destination_code} · {fmtDate(booking!.departure_at)}
                </p>
                {cancelPolicyLabel && (
                  <div className="mt-4 rounded-xl px-4 py-3" style={{ background: cancelPolicyLabel.bg }}>
                    <p className="text-sm font-bold" style={{ color: cancelPolicyLabel.color }}>{cancelPolicyLabel.text}</p>
                    {cp?.penalty_amount && (
                      <p className="text-xs text-gray-500 mt-0.5">This fee will be deducted from your refund.</p>
                    )}
                    {!cp?.penalty_amount && cp?.allowed && (
                      <p className="text-xs text-gray-500 mt-0.5">You will receive a full refund within 5–10 business days.</p>
                    )}
                  </div>
                )}
                {cancelError && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-xl px-3 py-2">⚠️ {cancelError}</p>}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowCancelModal(false)} disabled={cancelLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                  Never mind
                </button>
                <button onClick={cancelBooking} disabled={cancelLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                  style={{ background: '#DC2626' }}>
                  {cancelLoading ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Change conditions (from Duffel) ─────────────────────────── */}
        {order?.conditions?.change_before_departure && (
          <Section title="Change Policy">
            <div className="flex items-center gap-2">
              {order.conditions.change_before_departure.allowed ? (
                <>
                  <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>Changes allowed</span>
                  {order.conditions.change_before_departure.penalty_amount && (
                    <span className="text-sm text-gray-500">
                      · fee {fmtPrice(parseFloat(order.conditions.change_before_departure.penalty_amount), order.conditions.change_before_departure.penalty_currency ?? booking.currency)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm font-bold" style={{ color: '#DC2626' }}>No changes permitted</span>
              )}
            </div>
            {order.conditions.change_before_departure.allowed && (
              <p className="text-xs text-gray-400 mt-2">
                To change your flights, contact the airline with reference {booking.booking_reference}.
              </p>
            )}
          </Section>
        )}

        {/* ── Pay Now — held orders ───────────────────────────────────── */}
        {isHeld && !payHeldDone && (() => {
          const rawExpiry = order?.payment_requirements?.requires_payment_by
            ?? order?.payment_requirements?.payment_required_by;
          let expiryLabel = '';
          let isUrgent = false;
          if (rawExpiry) {
            const exp = new Date(rawExpiry);
            const diffMs = exp.getTime() - Date.now();
            const diffH = diffMs / 3600000;
            isUrgent = diffH < 4;
            if (diffH < 0) {
              expiryLabel = 'EXPIRED';
            } else if (diffH < 1) {
              expiryLabel = `${Math.max(1, Math.round(diffMs / 60000))} minutes remaining`;
            } else if (diffH < 24) {
              const h = Math.floor(diffH);
              const m = Math.round((diffH - h) * 60);
              expiryLabel = `${h}h ${m > 0 ? m + 'm' : ''} remaining`.trim();
            } else {
              expiryLabel = 'Pay by ' + exp.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
                ' at ' + exp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            }
          }
          return (
            <Section title="Complete Your Booking">
              <div className="rounded-xl p-4 mb-4" style={{
                background: isUrgent ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${isUrgent ? '#FECACA' : '#FDE68A'}`,
              }}>
                <p className="text-sm font-bold" style={{ color: isUrgent ? '#991B1B' : '#92400E' }}>
                  {isUrgent ? '🚨' : '⏳'} Your seat is held — payment required to confirm
                </p>
                {expiryLabel && (
                  <p className="text-base font-extrabold mt-1" style={{ color: isUrgent ? '#DC2626' : '#D97706' }}>
                    {expiryLabel}
                  </p>
                )}
                {!expiryLabel && (
                  <p className="text-xs mt-1" style={{ color: isUrgent ? '#991B1B' : '#92400E' }}>
                    Check your booking confirmation email for the payment deadline.
                  </p>
                )}
                <p className="text-xs mt-1.5" style={{ color: isUrgent ? '#B91C1C' : '#A16207' }}>
                  Airlines release held seats automatically once the deadline passes.
                </p>
              </div>
              <p className="text-lg font-extrabold text-gray-900 mb-4">{fmtPrice(booking.total_amount, booking.currency)}</p>
              {payHeldError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{payHeldError}</p>}
              <button onClick={payHeldOrder} disabled={payHeldLoading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                style={{ background: isUrgent ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'linear-gradient(135deg, #D97706, #B45309)' }}>
                {payHeldLoading ? 'Processing…' : `Pay ${fmtPrice(booking.total_amount, booking.currency)} → Confirm seat`}
              </button>
            </Section>
          );
        })()}
        {payHeldDone && (
          <Section title="Complete Your Booking">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-green-700">Payment confirmed!</p>
                <p className="text-xs text-gray-400">Your booking is now confirmed.</p>
              </div>
            </div>
          </Section>
        )}

        {/* ── Add bags (post-booking) ──────────────────────────────────── */}
        {!isCancelled && !isHeld && (
          <Section title="Add Checked Baggage">
            {bagsDone ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <p className="text-sm font-bold text-green-700">Bags added to your booking.</p>
              </div>
            ) : bagsLoading ? (
              <p className="text-xs text-gray-400">Checking availability…</p>
            ) : bagsChecked && bagServices.length === 0 ? (
              <p className="text-sm text-gray-500">
                Extra bags aren&apos;t available for this booking through Duffel. To add baggage, contact the airline directly.
              </p>
            ) : bagsChecked && bagServices.length > 0 ? (
              <div className="space-y-2">
                {bagServices.map(svc => {
                  const qty = bagSelections[svc.id] ?? 0;
                  return (
                    <div key={svc.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{svc.maxWeightKg ? `${svc.maxWeightKg}kg bag` : 'Checked bag'}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: '#1D9E75' }}>+{fmtPrice(svc.totalAmount, svc.totalCurrency)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBagSelections(s => ({ ...s, [svc.id]: Math.max(0, (s[svc.id] ?? 0) - 1) }))}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 hover:border-teal transition">−</button>
                        <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                        <button onClick={() => setBagSelections(s => ({ ...s, [svc.id]: Math.min(svc.maxQuantity, (s[svc.id] ?? 0) + 1) }))}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 hover:border-teal transition">+</button>
                      </div>
                    </div>
                  );
                })}
                {bagsError && <p className="text-sm text-red-500">{bagsError}</p>}
                {Object.values(bagSelections).some(q => q > 0) && (
                  <button onClick={addBags} disabled={bagsSaving}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white mt-2 transition disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
                    {bagsSaving ? 'Adding…' : `Add bags · ${fmtPrice(Object.entries(bagSelections).reduce((sum, [id, qty]) => sum + (bagServices.find(s => s.id === id)?.totalAmount ?? 0) * qty, 0), bagServices[0]?.totalCurrency ?? booking.currency)}`}
                  </button>
                )}
              </div>
            ) : null}
          </Section>
        )}

        {/* ── Name correction ──────────────────────────────────────────── */}
        {!isCancelled && order && order.passengers.length > 0 && (
          <Section title="Passenger Name Correction">
            {nameDone ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <p className="text-sm font-bold text-green-700">Passenger details updated.</p>
              </div>
            ) : nameUnavailable ? (
              <p className="text-sm text-gray-500">
                Name changes aren&apos;t available for this booking through Duffel. Please contact the airline directly to make corrections.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">Fix a typo in a passenger&apos;s name or update their phone number. Subject to airline approval.</p>
                {!nameFormOpen ? (
                  <div className="space-y-2">
                    {order.passengers.map(p => (
                      <button key={p.id} onClick={() => {
                        setNamePassengerId(p.id);
                        setNameFields({ given_name: p.given_name, family_name: p.family_name, phone_number: p.phone_number ?? '' });
                        setNameFormOpen(true);
                      }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-teal/40 transition text-left">
                        <span className="text-sm font-semibold text-gray-800 capitalize">{p.given_name} {p.family_name}</span>
                        <span className="text-xs text-teal font-semibold">Edit →</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">First name</label>
                        <input value={nameFields.given_name} onChange={e => setNameFields(f => ({ ...f, given_name: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Last name</label>
                        <input value={nameFields.family_name} onChange={e => setNameFields(f => ({ ...f, family_name: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Phone number</label>
                      <input type="tel" value={nameFields.phone_number} onChange={e => setNameFields(f => ({ ...f, phone_number: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                    </div>
                    {nameError && <p className="text-sm text-red-500">{nameError}</p>}
                    <div className="flex gap-2">
                      <button onClick={saveNameCorrection} disabled={nameSaving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                        style={{ background: '#1D9E75' }}>
                        {nameSaving ? 'Saving…' : 'Save changes'}
                      </button>
                      <button onClick={() => setNameFormOpen(false)}
                        className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        {/* ── Destination tips ────────────────────────────────────────── */}
        <DestinationTipsSection
          destinationCode={booking.destination_code}
          destinationCity={booking.destination_city}
          originCode={booking.origin_code}
          order={order}
        />

        <div className="pb-8" />
      </div>
    </div>
  );
}

// ── App logo with fallback ────────────────────────────────────────────────────

function AppLogo({ name, logoUrl, borderColor }: { name: string; logoUrl: string; borderColor: string }) {
  const [stage, setStage] = useState<'clearbit' | 'favicon' | 'letter'>('clearbit');
  const domain = logoUrl ? logoUrl.split('/').pop() ?? '' : '';
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';

  if (!logoUrl || stage === 'letter') {
    return (
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: borderColor }}>
        <span className="text-2xl font-black text-white">{name[0]}</span>
      </div>
    );
  }

  const src = stage === 'clearbit' ? logoUrl : faviconUrl;
  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ background: '#fff' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name}
        onError={() => setStage(prev => prev === 'clearbit' ? (faviconUrl ? 'favicon' : 'letter') : 'letter')}
        className="w-10 h-10 object-contain" />
    </div>
  );
}

// ── Destination tips section ──────────────────────────────────────────────────

function DestinationTipsSection({
  destinationCode,
  destinationCity,
  originCode,
  order,
}: {
  destinationCode: string;
  destinationCity: string;
  originCode: string;
  order: DuffelOrder | null;
}) {
  const guide = getLayoverGuide(destinationCode);
  const arrival = getArrivalTips(destinationCode);
  const originGuide = getLayoverGuide(originCode);

  // Detect layovers: intermediate airports between segments
  const layovers: { code: string; name: string; durationMin: number }[] = [];
  if (order) {
    for (const slice of order.slices) {
      const segs = slice.segments;
      for (let i = 0; i < segs.length - 1; i++) {
        const dep = new Date(segs[i + 1].departing_at).getTime();
        const arr = new Date(segs[i].arriving_at).getTime();
        const durationMin = Math.round((dep - arr) / 60000);
        layovers.push({
          code: segs[i + 1].origin.iata_code,
          name: segs[i + 1].origin.city_name ?? segs[i + 1].origin.name,
          durationMin,
        });
      }
    }
  }

  if (!guide && !arrival && !originGuide && layovers.length === 0) return null;

  const rideApps = arrival?.rideShare.apps ?? [];
  const CHINA_AIRPORTS = new Set(['PEK', 'PVG', 'SHA', 'CAN', 'SZX', 'CTU', 'XIY', 'HGH', 'WUH', 'CKG', 'KMG', 'MFM']);
  const showVpnPromo = CHINA_AIRPORTS.has(destinationCode.toUpperCase());
  const limoServices = LIMO_SERVICES[destinationCode.toUpperCase()] ?? [];
  const visaNotice = getVisaNotice(destinationCode);

  return (
    <>
      {/* ── Origin airport lounge info ───────────────── */}
      {originGuide && originGuide.lounges && (
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}>
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{originGuide.flag}</span>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                Before you fly · {originCode}
              </p>
            </div>
            <p className="text-xl font-extrabold text-white">Lounges in {originGuide.city}</p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>{originGuide.airport}</p>
          </div>
          <div className="px-6 pb-5 space-y-4">
            <div className="flex gap-3">
              <span className="text-base flex-shrink-0 mt-0.5">🛋️</span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>Available lounges</p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{originGuide.lounges}</p>
              </div>
            </div>
            {/* Lounge access CTA */}
            <a href="https://www.dragonpass.com/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-4 transition hover:opacity-90"
              style={{ background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)' }}>
              <span className="text-2xl">🎫</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#34D399' }}>Buy lounge access — from $35</p>
                <p className="text-xs mt-0.5" style={{ color: '#6EE7B7' }}>
                  DragonPass lets you book day-pass access to 1,300+ airport lounges worldwide. No membership needed.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#1D9E75', color: '#fff' }}>
                Book →
              </span>
            </a>
            {/* Priority Pass upsell */}
            <a href="https://www.prioritypass.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-4 transition hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-2xl">✈️</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>Priority Pass — unlimited lounge access</p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  Fly frequently? Priority Pass gives unlimited access to 1,300+ lounges worldwide for ~$99/year.
                </p>
              </div>
              <span className="text-xs font-bold" style={{ color: '#94A3B8' }}>→</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Layover tips ─────────────────────────────── */}
      {layovers.map(lv => {
        const lvGuide = getLayoverGuide(lv.code);
        if (!lvGuide) return null;
        const h = Math.floor(lv.durationMin / 60);
        const m = lv.durationMin % 60;
        const durationStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
        return (
          <div key={lv.code} className="rounded-2xl overflow-hidden shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}>
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{lvGuide.flag}</span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                  Layover · {lv.code} · {durationStr}
                </p>
              </div>
              <p className="text-xl font-extrabold text-white">{lvGuide.city}</p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>{lvGuide.airport}</p>
            </div>

            {lvGuide.transitVisa && (
              <div className="mx-6 mb-3 rounded-lg px-3 py-2" style={{ background: '#0F2722' }}>
                <p className="text-xs font-semibold" style={{ color: '#34D399' }}>
                  ✈ Visa: {lvGuide.transitVisa}
                </p>
              </div>
            )}

            <div className="px-6 pb-5 space-y-3">
              {lvGuide.tips.slice(0, lv.durationMin < 180 ? 2 : 4).map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{tip.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
              {lvGuide.lounges && (
                <div className="flex gap-3 pt-1 border-t border-slate-700">
                  <span className="text-base flex-shrink-0 mt-0.5">🛋️</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#E2E8F0' }}>Lounges</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{lvGuide.lounges}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Visa / Entry Notice ──────────────────────── */}
      {visaNotice && (
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: visaNotice.urgency === 'required' ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)' : 'linear-gradient(135deg, #78350F 0%, #92400E 100%)' }}>
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="text-base font-extrabold text-white">{visaNotice.title}</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#FCA5A5' }}>{visaNotice.requirement}</p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: '#FEE2E2' }}>{visaNotice.description}</p>
                {visaNotice.deadline && (
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#FCD34D' }}>⏱ {visaNotice.deadline}</p>
                )}
                <a href={visaNotice.applyUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                  style={{ background: '#DC2626', color: '#fff' }}>
                  Apply now →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Destination tips — horizontal scroll cards ─ */}
      {(guide || arrival) && (
        <div className="space-y-4">

          {/* Section header */}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{guide?.flag ?? '🌍'}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Suggested for your trip</p>
                <p className="text-xl font-extrabold text-gray-900">{destinationCity}</p>
              </div>
            </div>
            {arrival?.cityIntro && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{arrival.cityIntro}</p>
            )}
          </div>

          {/* ── Horizontal scroll row ────────────────── */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}>

            {/* Ride-share app cards — one per app */}
            {rideApps.map(appName => {
              const meta = getAppMeta(appName);
              return (
                <a key={appName} href={meta.downloadUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 flex flex-col rounded-2xl p-4 active:scale-95 transition-transform"
                  style={{ width: 200, minHeight: 230, background: meta.bgColor, border: `1.5px solid ${meta.borderColor}` }}>
                  <AppLogo name={appName} logoUrl={meta.logoUrl} borderColor={meta.borderColor} />
                  <p className="text-base font-extrabold text-white leading-tight mt-3">{appName}</p>
                  <p className="text-[11px] font-semibold mt-0.5 leading-snug" style={{ color: meta.accentColor }}>
                    {meta.tagline}
                  </p>
                  <p className="text-xs mt-2 leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {meta.description}
                  </p>
                  <div className="mt-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <p className="text-xs font-bold text-white text-center">Download →</p>
                  </div>
                </a>
              );
            })}

            {/* Limo / VIP cards */}
            {limoServices.map(limo => (
              <a key={limo.name} href={limo.url} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex flex-col rounded-2xl p-4 active:scale-95 transition-transform"
                style={{ width: 200, minHeight: 230, background: '#0A0A0A', border: '1.5px solid rgba(234,179,8,0.45)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'rgba(234,179,8,0.15)' }}>
                  🚘
                </div>
                <p className="text-base font-extrabold text-white leading-tight mt-3">{limo.name}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#EAB308' }}>{limo.tagline}</p>
                <p className="text-xs mt-2 leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  {limo.description}
                </p>
                <p className="text-xs font-bold mt-1" style={{ color: '#86EFAC' }}>{limo.estimatedCost}</p>
                <div className="mt-3 py-2 rounded-xl" style={{ background: 'rgba(234,179,8,0.14)' }}>
                  <p className="text-xs font-bold text-center" style={{ color: '#EAB308' }}>Book →</p>
                </div>
              </a>
            ))}

            {/* Transit card */}
            {arrival?.transit && (
              <div className="flex-shrink-0 flex flex-col rounded-2xl p-4"
                style={{ width: 200, minHeight: 230, background: '#0F172A', border: '1.5px solid rgba(99,102,241,0.45)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  🚇
                </div>
                <p className="text-base font-extrabold text-white leading-tight mt-3">{arrival.transit.name}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#A5B4FC' }}>
                  {arrival.transit.cost} · {arrival.transit.time}
                </p>
                <p className="text-xs mt-2 leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  {arrival.transit.note ?? ''}
                </p>
              </div>
            )}

            {/* SIM card */}
            {arrival?.sim && (
              <div className="flex-shrink-0 flex flex-col rounded-2xl p-4"
                style={{ width: 200, minHeight: 230, background: '#0F172A', border: '1.5px solid rgba(16,185,129,0.45)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  📱
                </div>
                <p className="text-base font-extrabold text-white leading-tight mt-3">Local SIM</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#34D399' }}>Buy at the airport</p>
                <p className="text-xs mt-2 leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  {arrival.sim}
                </p>
              </div>
            )}

            {/* NordVPN — China only */}
            {showVpnPromo && (
              <a href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=151019&url_id=902" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex flex-col rounded-2xl p-4 active:scale-95 transition-transform"
                style={{ width: 200, minHeight: 230, background: '#1E0546', border: '1.5px solid rgba(139,92,246,0.55)' }}>
                <AppLogo name="NordVPN" logoUrl="https://logo.clearbit.com/nordvpn.com" borderColor="rgba(139,92,246,0.45)" />
                <p className="text-base font-extrabold text-white leading-tight mt-3">NordVPN</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#C4B5FD' }}>Required for China</p>
                <p className="text-xs mt-2 leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Google, WhatsApp &amp; Instagram are blocked. Install before landing — can&apos;t download inside China.
                </p>
                <div className="mt-3 py-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.28)' }}>
                  <p className="text-xs font-bold text-center" style={{ color: '#E9D5FF' }}>70% off + 3mo free →</p>
                </div>
              </a>
            )}

          </div>

          {/* Pickup note */}
          {arrival && (
            <div className="flex items-start gap-1.5 px-1">
              <span className="text-xs mt-0.5 flex-shrink-0">📍</span>
              <p className="text-xs text-gray-500 leading-relaxed">
                {arrival.rideShare.pickupNote}{' · '}
                <span className="font-semibold text-gray-700">{arrival.rideShare.estimatedCost}</span>
              </p>
            </div>
          )}

          {/* Watch out */}
          {arrival?.watchOut && (
            <div className="flex gap-2 items-start rounded-xl px-4 py-3"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-xs leading-relaxed text-amber-800">{arrival.watchOut}</p>
            </div>
          )}

          {/* Local Know-How */}
          {guide && guide.tips.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Local Know-How</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {guide.tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{tip.title}</p>
                      <p className="text-xs mt-0.5 text-gray-500">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}

// ── Passenger card ────────────────────────────────────────────────────────────

function PassengerCard({ passenger: p, index }: { passenger: DuffelPassenger; index: number }) {
  const [expanded, setExpanded] = useState(true);

  const initials = `${p.given_name[0]}${p.family_name[0]}`.toUpperCase();
  const doc = p.identity_documents?.[0];

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: '#1D9E75' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 capitalize">
            {p.title ? p.title.charAt(0).toUpperCase() + p.title.slice(1) + ' ' : ''}{p.given_name} {p.family_name}
          </p>
          <p className="text-xs text-gray-400">Passenger {index + 1}</p>
        </div>
        <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-50">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Gender" value={p.gender === 'm' ? 'Male' : p.gender === 'f' ? 'Female' : p.gender} />
            <Field label="Date of birth" value={p.born_on ? new Date(p.born_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
            <Field label="Email" value={p.email} />
            <Field label="Phone" value={p.phone_number ?? '—'} />
          </div>

          {doc && (
            <div className="rounded-xl p-3 mt-1" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Travel Document</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <Field label="Type" value={doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} />
                <Field label="Number" value={doc.unique_identifier} mono />
                <Field label="Country" value={countryName(doc.issuing_country_code)} />
                <Field label="Expires" value={doc.expires_on ? new Date(doc.expires_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-sm text-gray-800 font-medium mt-0.5 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

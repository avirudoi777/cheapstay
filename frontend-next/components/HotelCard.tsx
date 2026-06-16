'use client';
import { useState, memo } from 'react';
import Image from 'next/image';
import type { Hotel } from '@/lib/types';
import AuthModal from './AuthModal';
import { createClient } from '@/lib/supabase/client';

const StarSVG = ({ filled }: { filled: boolean }) => (
  <svg className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function ratingLabel(score: string | null): string {
  const n = parseFloat(score ?? '');
  if (n >= 9.5) return 'Exceptional';
  if (n >= 9.0) return 'Wonderful';
  if (n >= 8.5) return 'Excellent';
  if (n >= 8.0) return 'Very Good';
  if (n >= 7.5) return 'Good';
  if (n >= 7.0) return 'Pleasant';
  return 'Okay';
}

function ratingBg(score: string | null): string {
  const n = parseFloat(score ?? '');
  if (n >= 8.5) return 'bg-teal';
  if (n >= 7.5) return 'bg-emerald-500';
  if (n >= 6.5) return 'bg-amber-500';
  return 'bg-gray-400';
}

function HotelCardInner({ h }: { h: Hotel }) {
  const [showAuth, setShowAuth] = useState(false);

  const best       = h.best_platform || 'booking';
  const bestUrl    = best === 'agoda'
    ? (h.agoda_url ?? h.booking_url ?? '#')
    : (h.booking_url ?? h.agoda_url ?? '#');

  const agodaPrice   = h.agoda_price;
  const bookingPrice = h.booking_price ?? (best === 'booking' ? h.price : null);
  const bestPrice    = best === 'agoda' ? agodaPrice : bookingPrice;
  const hasBoth      = agodaPrice != null && bookingPrice != null;
  const saving       = hasBoth ? Math.round(Math.abs(bookingPrice! - agodaPrice!)) : 0;
  const hasAnyPrice  = bestPrice != null;

  async function handleBook(e: React.MouseEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setShowAuth(true); return; }
    await supabase.from('booking_clicks').insert({
      user_id: user.id,
      hotel_name: h.name,
      platform: best,
      price: h.price,
      destination: h.location,
    });
    window.open(bestUrl, '_blank', 'noopener,noreferrer');
  }

  const starCount = h.stars ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">

      {/* ── Photo ─────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {h.image_url ? (
          <Image src={h.image_url} alt={h.name} fill sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-5xl opacity-30">🏨</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {hasBoth && saving >= 1 && (
            <span className="bg-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              Save ${saving}/night
            </span>
          )}
          {h.deal_badge === 'hot' && !hasBoth && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">🔥 Hot deal</span>
          )}
        </div>

        {/* Heart */}
        <button className="absolute top-3 right-3 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors text-xs shadow">
          ♡
        </button>

        {/* Stars on photo (bottom-left overlay) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarSVG key={i} filled={i < starCount} />
          ))}
          {starCount === 0 && (
            <span className="text-white/60 text-[10px] font-medium ml-1">Hotel</span>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">

        {/* Hotel name */}
        <a href={bestUrl} target="_blank" rel="noopener noreferrer"
          className="font-bold text-navy text-base leading-snug hover:text-teal transition-colors line-clamp-2 mb-1">
          {h.name}
        </a>

        {/* Location */}
        {h.location && (
          <p className="text-xs text-gray-400 mb-2.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {h.location}
          </p>
        )}

        {/* Rating + reviews */}
        {h.rating && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded-md ${ratingBg(h.rating)}`}>
              {h.rating}
            </span>
            <span className="text-xs font-semibold text-gray-700">
              {h.review_label || ratingLabel(h.rating)}
            </span>
            {h.review_count && (
              <span className="text-[11px] text-gray-400">· {h.review_count} reviews</span>
            )}
          </div>
        )}

        {/* Amenity pills */}
        {h.amenities && h.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {h.amenities.slice(0, 3).map(a => (
              <span key={a} className="text-[10px] bg-slate-50 border border-slate-100 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 my-3" />

        {/* Price section */}
        {hasAnyPrice ? (
          <>
            {/* Hero price */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Best price / night</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-black leading-none" style={{ color: '#0d9488' }}>
                    ${Math.round(bestPrice!)}
                  </span>
                  {h.total_price != null && (
                    <span className="text-[11px] text-gray-400">${Math.round(h.total_price)} total</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full mb-0.5" style={{ color: '#0d9488', background: 'rgba(13,148,136,0.1)' }}>
                via {best === 'agoda' ? 'Agoda' : 'Booking.com'}
              </span>
            </div>

            {/* Platform comparison — 2-col, Agoda invisible when no price */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className={`rounded-xl border p-2.5 ${
                agodaPrice != null
                  ? best === 'agoda' ? 'border-teal/30 bg-teal/5' : 'border-gray-100 bg-gray-50'
                  : 'invisible'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1">
                  Agoda {best === 'agoda' && agodaPrice != null && (
                    <span className="bg-teal text-white px-1 rounded ml-0.5 text-[8px]">BEST</span>
                  )}
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {agodaPrice != null ? `$${Math.round(agodaPrice)}` : '—'}
                  <span className="text-[10px] font-normal text-gray-400">/night</span>
                </p>
              </div>
              <div className={`rounded-xl border p-2.5 ${
                bookingPrice != null
                  ? best === 'booking' ? 'border-teal/30 bg-teal/5' : 'border-gray-100 bg-gray-50'
                  : 'border-gray-100 bg-gray-50'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-1">
                  Booking {best === 'booking' && bookingPrice != null && (
                    <span className="bg-teal text-white px-1 rounded ml-0.5 text-[8px]">BEST</span>
                  )}
                </p>
                {bookingPrice != null ? (
                  <p className="text-sm font-bold text-gray-800">
                    ${Math.round(bookingPrice)}
                    <span className="text-[10px] font-normal text-gray-400">/night</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Unavailable</p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No price state */
          <div className="mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Price unavailable</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Click to see current rates</p>
            </div>
          </div>
        )}

        {/* Push button to bottom */}
        <div className="flex-1 min-h-[4px]" />

        {/* Book button */}
        <button onClick={handleBook}
          className="w-full text-sm font-bold text-white rounded-xl py-3 cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
          {hasAnyPrice
            ? `Book on ${best === 'agoda' ? 'Agoda' : 'Booking.com'} →`
            : 'Check availability →'}
        </button>

        {/* Secondary link — invisible preserves height when only one platform */}
        <div className={!hasBoth ? 'invisible' : undefined}>
          <a
            href={best === 'agoda' ? (h.booking_url ?? '#') : (h.agoda_url ?? '#')}
            target="_blank" rel="noopener noreferrer"
            className="block text-center text-xs text-gray-400 hover:text-navy transition-colors mt-2">
            Also on {best === 'agoda' ? 'Booking.com' : 'Agoda'} →
          </a>
        </div>
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onContinue={() => { setShowAuth(false); window.open(bestUrl, '_blank', 'noopener,noreferrer'); }}
        hotelName={h.name}
      />
    </div>
  );
}

const HotelCard = memo(HotelCardInner);
export default HotelCard;

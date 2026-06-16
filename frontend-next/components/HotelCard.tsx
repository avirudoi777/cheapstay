'use client';
import { useState, memo } from 'react';
import Image from 'next/image';
import type { Hotel } from '@/lib/types';
import AuthModal from './AuthModal';
import { createClient } from '@/lib/supabase/client';

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

function ratingColor(score: string | null): string {
  const n = parseFloat(score ?? '');
  if (n >= 8.5) return 'bg-teal text-white';
  if (n >= 7.5) return 'bg-emerald-500 text-white';
  if (n >= 6.5) return 'bg-amber-500 text-white';
  return 'bg-gray-400 text-white';
}

function Stars({ count }: { count: number | null }) {
  if (!count || count < 1 || count > 5) return null;
  return (
    <div className="flex items-center gap-0.5 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < count ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] text-gray-400 ml-1">{count}-star</span>
    </div>
  );
}

function HotelCardInner({ h }: { h: Hotel }) {
  const [showAuth, setShowAuth] = useState(false);
  const best = h.best_platform || 'booking';
  const bestUrl = best === 'agoda' ? (h.agoda_url ?? h.booking_url ?? '#') : (h.booking_url ?? h.agoda_url ?? '#');

  const agodaPrice = h.agoda_price;
  const bookingPrice = h.booking_price ?? (best === 'booking' ? h.price : null);
  const hasBoth = agodaPrice != null && bookingPrice != null;
  const saving = hasBoth ? Math.round(Math.abs(bookingPrice! - agodaPrice!)) : 0;
  const cheaperPlatform = hasBoth ? (agodaPrice! < bookingPrice! ? 'Agoda' : 'Booking.com') : null;
  const bestPrice = best === 'agoda' ? agodaPrice : bookingPrice;

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">

      {/* Photo */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {h.image_url ? (
          <Image src={h.image_url} alt={h.name} fill sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">🏨</div>
        )}
        {/* Bottom gradient for photo depth */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Deal badge */}
        {h.deal_badge === 'hot' && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">🔥 Hot deal</div>
        )}
        {h.deal_badge === 'deal' && (
          <div className="absolute top-3 left-3 bg-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">✦ Great deal</div>
        )}

        {/* Savings badge — overlaid on photo */}
        {hasBoth && saving >= 1 && (
          <div className="absolute bottom-2.5 left-3 bg-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Save ${saving}/night
          </div>
        )}

        <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors text-sm shadow-sm">
          ♡
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">

        {/* Stars */}
        <Stars count={h.stars} />

        {/* Hotel name */}
        <a href={bestUrl} target="_blank" rel="noopener noreferrer"
          className="font-bold text-navy text-[15px] leading-snug hover:text-teal transition-colors line-clamp-2 mb-1.5">
          {h.name}
        </a>

        {/* Location */}
        {h.location && (
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1 leading-tight">
            <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            {h.location}
          </p>
        )}

        {/* Rating row */}
        {h.rating && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${ratingColor(h.rating)}`}>{h.rating}</span>
            <span className="text-xs font-semibold text-gray-700">{h.review_label || ratingLabel(h.rating)}</span>
            {h.review_count && <span className="text-[11px] text-gray-400">· {h.review_count} reviews</span>}
          </div>
        )}

        {/* Amenity pills */}
        {h.amenities && h.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {h.amenities.slice(0, 3).map(a => (
              <span key={a} className="text-[10px] bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 my-3" />

        {/* Hero best price */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Best price / night</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-teal leading-none">
                {bestPrice != null ? `$${Math.round(bestPrice)}` : '—'}
              </span>
              {h.total_price != null && (
                <span className="text-[11px] text-gray-400 ml-1">${Math.round(h.total_price)} total</span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-teal bg-teal/10 px-2 py-1 rounded-full">
            {best === 'agoda' ? 'Agoda' : 'Booking.com'}
          </span>
        </div>

        {/* Platform comparison — 2 cols, fixed height, invisible preserves space */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Agoda — invisible when no price to prevent layout shift */}
          <div className={`rounded-xl p-2.5 border transition-colors ${
            agodaPrice != null
              ? best === 'agoda' ? 'border-teal/30 bg-teal/5' : 'border-gray-100 bg-gray-50'
              : 'invisible'
          }`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1 flex items-center gap-1">
              Agoda {best === 'agoda' && <span className="bg-teal text-white px-1 rounded text-[8px]">BEST</span>}
            </p>
            <p className="text-sm font-bold text-gray-800">
              {agodaPrice != null ? `$${Math.round(agodaPrice)}` : '—'}
              <span className="text-[10px] font-normal text-gray-400">/night</span>
            </p>
          </div>

          {/* Booking.com */}
          <div className={`rounded-xl p-2.5 border transition-colors ${
            bookingPrice != null
              ? best === 'booking' ? 'border-teal/30 bg-teal/5' : 'border-gray-100 bg-gray-50'
              : 'border-gray-100 bg-gray-50'
          }`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-1 flex items-center gap-1">
              Booking {best === 'booking' && bookingPrice != null && <span className="bg-teal text-white px-1 rounded text-[8px]">BEST</span>}
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

        {/* Spacer — pushes button to bottom regardless of content above */}
        <div className="flex-1 min-h-[4px]" />

        {/* Book button */}
        <button onClick={handleBook}
          className="w-full text-sm font-bold text-white rounded-xl py-3 cursor-pointer transition-opacity hover:opacity-90 mt-1"
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
          Book on {best === 'agoda' ? 'Agoda' : 'Booking.com'} →
        </button>

        {/* Secondary link — invisible when no both prices (preserves space) */}
        <div className={!hasBoth ? 'invisible' : undefined}>
          {best === 'agoda' ? (
            <a href={h.booking_url ?? '#'} target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-gray-400 hover:text-navy transition-colors mt-2">
              Also on Booking.com →
            </a>
          ) : (
            <a href={h.agoda_url ?? '#'} target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-gray-400 hover:text-navy transition-colors mt-2">
              Also on Agoda →
            </a>
          )}
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

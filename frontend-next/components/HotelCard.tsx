'use client';
import { useState } from 'react';
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

function Stars({ count }: { count: number | null }) {
  if (!count || count < 1 || count > 5) return null;
  return (
    <div className="text-amber-400 text-xs tracking-wide mb-1">
      {'★'.repeat(count)}
      <span className="text-gray-200">{'★'.repeat(5 - count)}</span>
    </div>
  );
}

interface PriceRowProps {
  platform: string;
  price: number;
  isBest: boolean;
}
function PriceRow({ platform, price, isBest }: PriceRowProps) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${isBest ? 'bg-teal/10 border border-teal/30' : 'bg-gray-50'}`}>
      <span className={`font-medium ${isBest ? 'text-navy' : 'text-gray-600'}`}>{platform}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${isBest ? 'text-navy' : 'text-gray-700'}`}>${Math.round(price)}/night</span>
        {isBest && <span className="text-[10px] bg-teal text-white font-bold px-1.5 py-0.5 rounded-full">Best</span>}
      </div>
    </div>
  );
}

export default function HotelCard({ h }: { h: Hotel }) {
  const [showAuth, setShowAuth] = useState(false);
  const url = h.booking_url ?? '#';
  const hasAgoda = h.agoda_price != null;
  const hasHL = h.hl_price != null;
  const hasBooking = h.best_platform === 'booking' && h.price != null;
  const nights = h.nights || 1;
  const best = h.best_platform || 'agoda';

  async function handleBook(e: React.MouseEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowAuth(true);
      return;
    }
    // Log booking click then open URL
    await supabase.from('booking_clicks').insert({
      user_id: user.id,
      hotel_name: h.name,
      platform: best,
      price: h.price,
      destination: h.location,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {h.image_url ? (
          <Image
            src={h.image_url}
            alt={h.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">🏨</div>
        )}

        {/* Deal badge */}
        {h.deal_badge === 'hot' && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">🔥 Hot deal</div>
        )}
        {h.deal_badge === 'deal' && (
          <div className="absolute top-3 left-3 bg-teal text-white text-xs font-bold px-2 py-1 rounded-full shadow">✦ Great deal</div>
        )}

        {/* Save */}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors text-sm shadow">
          ♡
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <Stars count={h.stars} />

        <a href={url} target="_blank" rel="noopener noreferrer"
          className="font-semibold text-navy text-sm leading-snug hover:text-teal transition-colors line-clamp-2 mb-1">
          {h.name}
        </a>

        {h.location && (
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <span>📍</span>{h.location}
          </p>
        )}

        {h.review_snippet && (
          <p className="text-xs text-gray-500 italic line-clamp-2 mb-2">"{h.review_snippet}"</p>
        )}

        {h.amenities && h.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {h.amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}

        {/* Rating */}
        {h.rating && (
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-navy text-white text-xs font-bold px-2 py-1 rounded-lg">{h.rating}</span>
            <span className="text-xs font-medium text-gray-700">{h.review_label || ratingLabel(h.rating)}</span>
            {h.review_count && <span className="text-xs text-gray-400">· {h.review_count} reviews</span>}
          </div>
        )}

        <div className="mt-auto space-y-1.5 pt-3 border-t border-gray-100">
          {hasAgoda && hasHL ? (
            <>
              <PriceRow platform="Agoda" price={h.agoda_price!} isBest={best === 'agoda'} />
              <PriceRow platform="Hotellook" price={h.hl_price!} isBest={best === 'hotellook'} />
            </>
          ) : hasAgoda || hasHL || hasBooking ? (
            <div className="flex items-baseline gap-1">
              {h.original_price && (
                <span className="text-xs text-gray-400 line-through">{h.original_price}</span>
              )}
              <span className="text-2xl font-bold text-navy">
                ${Math.round(hasAgoda ? h.agoda_price! : hasHL ? h.hl_price! : h.price!)}
              </span>
              <span className="text-xs text-gray-500">/night</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Price unavailable</p>
          )}

          {h.total_price != null && (
            <p className="text-xs text-gray-400">${Math.round(h.total_price)} total for {nights} night{nights !== 1 ? 's' : ''}</p>
          )}

          <button onClick={handleBook}
            className="w-full text-center text-sm font-semibold text-white bg-navy hover:bg-navy-light rounded-xl py-2.5 transition-colors mt-2">
            {best === 'hotellook' ? 'Book on Hotellook →' : best === 'booking' ? 'Book on Booking.com →' : 'Book on Agoda →'}
          </button>

          {best === 'booking' && h.agoda_url && (
            <a href={h.agoda_url} target="_blank" rel="noopener noreferrer"
              className="block text-center text-xs text-gray-400 hover:text-navy transition-colors mt-1">
              Also search on Agoda →
            </a>
          )}
        </div>
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onContinue={() => { setShowAuth(false); window.open(url, '_blank', 'noopener,noreferrer'); }}
        hotelName={h.name}
      />
    </div>
  );
}

'use client';
import type { CardOffer } from '@/lib/card-offers';
import { ISSUER_STYLE } from '@/lib/card-offers';

export default function CardOfferCard({ card }: { card: CardOffer }) {
  const issuerStyle = ISSUER_STYLE[card.issuer] ?? { bg: '#F1F5F9', color: '#475569' };

  return (
    <a href={card.url} target="_blank" rel="noopener noreferrer sponsored"
      className="flex items-start gap-3 bg-white rounded-xl px-3 py-3 border border-border-subtle transition hover:shadow-md">
      {/* Card art — real image or CSS gradient card */}
      <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-md" style={{ width: 72, height: 46 }}>
        {card.cardArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.cardArt}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={e => {
              const t = e.currentTarget;
              t.style.display = 'none';
              if (t.parentElement) t.parentElement.style.background = card.cardGradient ?? '#1A3A5C';
            }}
          />
        ) : (
          <div className="w-full h-full relative flex flex-col justify-between p-1.5" style={{ background: card.cardGradient ?? '#1A3A5C' }}>
            <div className="w-5 h-3.5 rounded-sm opacity-80"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F0E68C 50%, #B8960C 100%)' }} />
            <p className="text-[7px] font-bold leading-none truncate" style={{ color: card.cardTextColor ?? '#fff' }}>
              {card.name.replace(/®/g, '').split(' ').slice(0, 3).join(' ')}
            </p>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] font-extrabold text-pro-navy leading-snug">{card.name}</p>
          {card.highlight && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: issuerStyle.bg, color: issuerStyle.color }}>
              {card.highlight}
            </span>
          )}
        </div>
        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-snug">{card.headline}</p>
        <p className="text-[10px] font-semibold mt-1 text-savings-green flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">card_giftcard</span>
          {card.bonus}
        </p>
      </div>
      <span className="text-xs font-bold flex-shrink-0 mt-1 text-tertiary">Apply →</span>
    </a>
  );
}

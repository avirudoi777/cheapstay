'use client';

interface Props {
  name: string;
  category: 'ride-share' | 'payment' | 'maps';
  note: string;
  url: string;
}

const CATEGORY_LABEL: Record<Props['category'], string> = {
  'ride-share': 'Ride-share',
  payment: 'Payment',
  maps: 'Navigation',
};
const CATEGORY_ICON: Record<Props['category'], string> = {
  'ride-share': 'directions_car',
  payment: 'contactless',
  maps: 'map',
};

export default function LocalAppCard({ name, category, note, url }: Props) {
  const domain = (() => {
    try { return new URL(url).hostname; } catch { return ''; }
  })();
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="bg-pro-navy p-6 rounded-xl text-white pro-shadow flex gap-4 items-start hover:opacity-90 transition-opacity">
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconUrl}
            alt={name}
            className="w-8 h-8 object-contain"
            onError={e => {
              const t = e.currentTarget;
              t.style.display = 'none';
              const fallback = t.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'block';
            }}
          />
        ) : null}
        <span className="material-symbols-outlined text-teal-accent text-2xl" style={{ display: faviconUrl ? 'none' : 'block' }}>
          {CATEGORY_ICON[category]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-headline-md text-sm text-sky-blue">{name}</h3>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wide">{CATEGORY_LABEL[category]}</span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed">{note}</p>
      </div>
      <span className="material-symbols-outlined text-white/40 flex-shrink-0">open_in_new</span>
    </a>
  );
}

'use client';
import { useState } from 'react';
import type { FilterState } from '@/lib/types';
import { EMPTY_FILTERS } from '@/lib/types';

const tog = (set: Set<number>, v: number): Set<number> => {
  const s = new Set(set);
  s.has(v) ? s.delete(v) : s.add(v);
  return s;
};

function Section({ title, badge = 0, children }: { title: string; badge?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-navy tracking-tight">{title}</span>
          {badge > 0 && (
            <span className="text-[10px] font-bold bg-teal/15 text-teal-dark px-1.5 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div style={{ maxHeight: open ? '500px' : '0', opacity: open ? 1 : 0, overflow: 'hidden', transition: 'max-height .25s ease, opacity .2s ease' }}>
        <div className="px-5 pb-4">{children}</div>
      </div>
    </div>
  );
}

function RadioRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-1.5 group text-left">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-teal' : 'border-gray-300 group-hover:border-teal'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-teal" />}
      </div>
      <span className={`text-[13px] transition-colors ${selected ? 'text-navy font-semibold' : 'text-gray-600 group-hover:text-navy'}`}>{label}</span>
    </button>
  );
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  totalResults: number;
}

export default function FilterSidebar({ filters, onChange, totalResults }: FilterSidebarProps) {
  const active =
    (filters.sort !== 'best' ? 1 : 0) +
    filters.stars.size +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < Infinity ? 1 : 0);

  const upd = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col sticky top-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-navy">Filter results</h2>
          {totalResults > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{totalResults.toLocaleString()} properties</p>
          )}
        </div>
        <button onClick={() => onChange({ ...EMPTY_FILTERS, stars: new Set() })}
          className={`text-xs font-semibold transition-all ${active > 0 ? 'text-teal hover:text-teal-dark' : 'text-gray-300 pointer-events-none'}`}>
          Clear all
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>

        {/* Sort */}
        <Section title="Sort by" badge={filters.sort !== 'best' ? 1 : 0}>
          {([
            ['best', 'Best match'],
            ['price_asc', 'Price: Low → High'],
            ['price_desc', 'Price: High → Low'],
            ['rating', 'Top rated'],
          ] as const).map(([v, label]) => (
            <RadioRow key={v} label={label} selected={filters.sort === v} onClick={() => upd({ sort: v })} />
          ))}
        </Section>

        {/* Budget */}
        <Section title="Budget per night" badge={filters.minPrice > 0 || filters.maxPrice < Infinity ? 1 : 0}>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input type="number" placeholder="0" min={0} value={filters.minPrice || ''}
                onChange={e => upd({ minPrice: Number(e.target.value) || 0 })}
                className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
            </div>
            <span className="text-gray-300 text-sm">–</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input type="number" placeholder="any" min={0} value={filters.maxPrice === Infinity ? '' : filters.maxPrice}
                onChange={e => upd({ maxPrice: e.target.value ? Number(e.target.value) : Infinity })}
                className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
            </div>
          </div>
        </Section>

        {/* Star rating */}
        <Section title="Star rating" badge={filters.stars.size}>
          <div className="flex flex-wrap gap-2">
            {[5, 4, 3, 2, 1].map(s => (
              <button key={s} onClick={() => upd({ stars: tog(filters.stars, s) })}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${filters.stars.has(s) ? 'bg-navy text-white border-navy shadow-sm' : 'bg-white text-amber-400 border-gray-200 hover:border-amber-300'}`}>
                {'★'.repeat(s)}
              </button>
            ))}
          </div>
        </Section>

        {/* Guest rating */}
        <Section title="Guest rating" badge={filters.minRating > 0 ? 1 : 0}>
          {([
            [0, 'Any rating'],
            [6, '6+ Good'],
            [7, '7+ Very Good'],
            [8, '8+ Excellent'],
          ] as const).map(([v, label]) => (
            <RadioRow key={v} label={label} selected={filters.minRating === v} onClick={() => upd({ minRating: v })} />
          ))}
        </Section>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-white py-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #1a3a6b 100%)' }}>
          {totalResults.toLocaleString()} results
          {active > 0 && (
            <span className="bg-teal text-navy text-[10px] font-extrabold px-2 py-0.5 rounded-full">{active} filters</span>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useRef } from 'react';
import type { FilterState } from '@/lib/types';
import { EMPTY_FILTERS } from '@/lib/types';

const tog = (set: Set<number>, v: number): Set<number> => {
  const s = new Set(set);
  s.has(v) ? s.delete(v) : s.add(v);
  return s;
};

const BUDGET_MAX = 1000;

function BudgetSlider({ min, max, onMin, onMax }: {
  min: number; max: number;
  onMin: (v: number) => void; onMax: (v: number) => void;
}) {
  const minPct = (min / BUDGET_MAX) * 100;
  const maxVal = max >= Infinity ? BUDGET_MAX : Math.min(max, BUDGET_MAX);
  const maxPct = (maxVal / BUDGET_MAX) * 100;

  return (
    <div className="pt-2 pb-1">
      {/* Labels */}
      <div className="flex justify-between mb-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center min-w-[72px]">
          <div className="text-[10px] text-gray-400 font-medium">Min</div>
          <div className="text-sm font-bold text-navy">${min}</div>
        </div>
        <div className="flex items-center text-gray-300 text-lg font-light">—</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-center min-w-[72px]">
          <div className="text-[10px] text-gray-400 font-medium">Max</div>
          <div className="text-sm font-bold text-navy">{max >= Infinity ? 'Any' : `$${max}`}</div>
        </div>
      </div>

      {/* Slider track */}
      <div className="relative h-10 flex items-center select-none">
        {/* Background track */}
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
        {/* Active range */}
        <div className="absolute h-1.5 rounded-full"
          style={{
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            background: 'linear-gradient(90deg, #00C9B1, #1A73E8)',
          }} />
        {/* Min thumb input */}
        <input
          type="range" min={0} max={BUDGET_MAX} step={10} value={min}
          onChange={e => {
            const v = Math.min(Number(e.target.value), maxVal - 10);
            onMin(Math.max(0, v));
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal
            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: min >= BUDGET_MAX - 100 ? 5 : 3 }}
        />
        {/* Max thumb input */}
        <input
          type="range" min={0} max={BUDGET_MAX} step={10} value={maxVal}
          onChange={e => {
            const v = Math.max(Number(e.target.value), min + 10);
            onMax(v >= BUDGET_MAX ? Infinity : v);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-teal
            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
        <span>$0</span>
        <span>${BUDGET_MAX}+</span>
      </div>
    </div>
  );
}

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
  const searchRef = useRef<HTMLInputElement>(null);

  const active =
    (filters.sort !== 'best' ? 1 : 0) +
    filters.stars.size +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < Infinity ? 1 : 0) +
    (filters.hotelSearch ? 1 : 0);

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

        {/* Hotel name search */}
        <Section title="Search by name" badge={filters.hotelSearch ? 1 : 0}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="e.g. Marriott, Hilton…"
              value={filters.hotelSearch}
              onChange={e => upd({ hotelSearch: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal
                placeholder:text-gray-300 transition-all"
            />
            {filters.hotelSearch && (
              <button onClick={() => { upd({ hotelSearch: '' }); searchRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </Section>

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
          <BudgetSlider
            min={filters.minPrice}
            max={filters.maxPrice}
            onMin={v => upd({ minPrice: v })}
            onMax={v => upd({ maxPrice: v })}
          />
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

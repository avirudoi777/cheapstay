'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import HotelCard from './HotelCard';
import FilterSidebar from './FilterSidebar';
import { searchCity } from '@/lib/api';
import type { Hotel, CitySearchResponse, FilterState } from '@/lib/types';
import { EMPTY_FILTERS } from '@/lib/types';

const CITY_PAGE = 20;

function applyFilters(hotels: Hotel[], f: FilterState): Hotel[] {
  let list = hotels.filter(h => {
    if (f.stars.size > 0 && !f.stars.has(h.stars ?? 0)) return false;
    const p = h.price;
    if (f.minPrice > 0 && p != null && p < f.minPrice) return false;
    if (f.maxPrice < Infinity && p != null && p > f.maxPrice) return false;
    if (f.minRating > 0 && (!parseFloat(h.rating ?? '') || parseFloat(h.rating ?? '') < f.minRating)) return false;
    return true;
  });
  if (f.sort === 'price_asc') list = [...list].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  else if (f.sort === 'price_desc') list = [...list].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  else if (f.sort === 'rating') list = [...list].sort((a, b) => (parseFloat(b.rating ?? '') || 0) - (parseFloat(a.rating ?? '') || 0));
  return list;
}

interface HotelGridProps {
  initialData: CitySearchResponse;
  location: string;
  checkin: string;
  checkout: string;
  adults: number;
}

export default function HotelGrid({ initialData, location, checkin, checkout, adults }: HotelGridProps) {
  const [hotels, setHotels]           = useState<Hotel[]>(initialData.hotels);
  const [totalAgoda, setTotalAgoda]   = useState(initialData.total_agoda);
  const [offset, setOffset]           = useState(initialData.offset + initialData.hotels.length);
  const [hasMore, setHasMore]         = useState(initialData.has_more);
  const [loading, setLoading]         = useState(false);
  const [filters, setFilters]         = useState<FilterState>({ ...EMPTY_FILTERS, stars: new Set() });
  const [rendered, setRendered]       = useState(CITY_PAGE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = applyFilters(hotels, filters);
  const visible  = filtered.slice(0, rendered);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const resp = await searchCity({ location, checkin, checkout, adults, offset, limit: CITY_PAGE });
      if (resp.hotels.length > 0) {
        setHotels(prev => [...prev, ...resp.hotels]);
        setOffset(o => o + resp.hotels.length);
        setHasMore(resp.has_more);
        setRendered(r => r + resp.hotels.length);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, location, checkin, checkout, adults]);

  // IntersectionObserver sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      if (rendered < filtered.length) {
        setRendered(r => r + CITY_PAGE);
      } else if (hasMore) {
        loadMore();
      }
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rendered, filtered.length, hasMore, loadMore]);

  // Reset rendered count when filters change
  useEffect(() => { setRendered(CITY_PAGE); }, [filters]);

  const nights = Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));

  return (
    <div>
      {/* Results header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">
            {(totalAgoda || hotels.length).toLocaleString()} properties in {location.split(',')[0]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {nights} night{nights !== 1 ? 's' : ''} · sorted by best match
            {hotels.length < totalAgoda && (
              <span className="text-teal ml-2">· {hotels.length} loaded</span>
            )}
          </p>
        </div>
        {/* Mobile filter toggle */}
        <button onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-navy hover:border-teal transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="10" y2="18" />
          </svg>
          Filters
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar — desktop inline, mobile drawer */}
        <div className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={setFilters} totalResults={filtered.length} />
        </div>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative ml-auto w-80 max-w-full h-full bg-white overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="font-bold text-navy">Filters</span>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-navy">✕</button>
              </div>
              <FilterSidebar filters={filters} onChange={f => { setFilters(f); }} totalResults={filtered.length} />
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {visible.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">No hotels match these filters.</p>
              <button onClick={() => setFilters({ ...EMPTY_FILTERS, stars: new Set() })}
                className="mt-3 text-sm text-teal hover:text-teal-dark font-semibold">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((h, i) => <HotelCard key={`${h.name}-${i}`} h={h} />)}
            </div>
          )}

          {/* Sentinel + spinner */}
          <div ref={sentinelRef} className="h-1 mt-4" />
          {loading && (
            <div className="flex items-center justify-center gap-3 py-8 text-gray-400 text-sm">
              <svg className="w-5 h-5 animate-spin text-teal" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading more hotels…
            </div>
          )}
          {!hasMore && hotels.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-6">All {hotels.length} loaded hotels shown</p>
          )}
        </div>
      </div>
    </div>
  );
}

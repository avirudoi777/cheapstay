'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getSuggestions } from '@/lib/api';
import type { Suggestion } from '@/lib/types';

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmt(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Calendar ──────────────────────────────────────────────────────────────────

interface CalendarProps {
  checkin: string;
  checkout: string;
  onSelect: (ci: string, co: string, done?: boolean) => void;
}

function Calendar({ checkin, checkout, onSelect }: CalendarProps) {
  const today = toDateStr(new Date());
  const [viewYear, setViewYear] = useState(() => {
    const d = checkin ? new Date(checkin + 'T12:00:00') : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = checkin ? new Date(checkin + 'T12:00:00') : new Date();
    return d.getMonth();
  });
  const [hover, setHover] = useState('');
  const [picking, setPicking] = useState<'ci' | 'co'>(checkin ? 'co' : 'ci');

  function handleDay(ds: string) {
    if (ds < today) return;
    if (picking === 'ci' || ds <= checkin) {
      onSelect(ds, '');
      setPicking('co');
    } else {
      onSelect(checkin, ds, true);
    }
  }

  function renderMonth(year: number, month: number) {
    const firstDow = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const label = new Date(year, month).toLocaleString('en', { month: 'long', year: 'numeric' });
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= days; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    const effectiveEnd = hover && picking === 'co' && hover > checkin ? hover : checkout;

    return (
      <div>
        <div className="text-sm font-semibold text-navy text-center mb-3">{label}</div>
        <div className="grid grid-cols-7 text-[11px] text-gray-400 text-center mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((ds, i) => {
            if (!ds) return <div key={i} />;
            const isPast = ds < today;
            const isCi = ds === checkin;
            const isCo = ds === checkout;
            const inRange = checkin && effectiveEnd && ds > checkin && ds < effectiveEnd;
            return (
              <button key={ds} type="button" disabled={isPast}
                onClick={() => handleDay(ds)}
                onMouseEnter={() => setHover(ds)}
                onMouseLeave={() => setHover('')}
                className={[
                  'h-8 w-full text-sm rounded-lg transition-all',
                  isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                  isCi || isCo ? 'bg-navy text-white font-semibold' : '',
                  inRange ? 'bg-teal/20 text-navy rounded-none' : '',
                  !isCi && !isCo && !inRange && !isPast ? 'hover:bg-teal/20' : '',
                ].filter(Boolean).join(' ')}
              >
                {parseInt(ds.split('-')[2])}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50"
      style={{ width: 'min(700px, 95vw)' }}>
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 text-sm border-b border-gray-100 pb-3">
        <button type="button" onClick={() => setPicking('ci')}
          className={`flex-1 p-2 rounded-xl text-left transition-all ${picking === 'ci' ? 'bg-teal/10 border border-teal/30' : 'hover:bg-gray-50'}`}>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Check-in</div>
          <div className="font-semibold text-navy">{checkin ? fmt(checkin) : '—'}</div>
        </button>
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <button type="button" onClick={() => checkin && setPicking('co')}
          className={`flex-1 p-2 rounded-xl text-left transition-all ${picking === 'co' ? 'bg-teal/10 border border-teal/30' : 'hover:bg-gray-50'}`}>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Check-out</div>
          <div className="font-semibold text-navy">{checkout ? fmt(checkout) : '—'}</div>
        </button>
      </div>
      {/* Calendars */}
      <div className="flex items-start justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 grid grid-cols-2 gap-8 px-2">
          {renderMonth(viewYear, viewMonth)}
          {renderMonth(nextYear, nextMonthIdx)}
        </div>
        <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Prices shown in USD · per night</span>
        <button type="button" onClick={() => onSelect(checkin, checkout, true)}
          disabled={!checkin || !checkout}
          className="bg-navy disabled:bg-gray-200 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-navy-light">
          Done
        </button>
      </div>
    </div>
  );
}

// ── GuestPicker ───────────────────────────────────────────────────────────────

function GuestPicker({ adults, rooms, onChange, onClose }: {
  adults: number; rooms: number;
  onChange: (a: number, r: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 w-72">
      {[
        { label: 'Adults', sub: 'Age 18+', val: adults, setVal: (v: number) => onChange(v, rooms), min: 1, max: 9 },
        { label: 'Rooms', sub: 'Max 4 per booking', val: rooms, setVal: (v: number) => onChange(adults, v), min: 1, max: 4 },
      ].map(row => (
        <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div>
            <div className="text-sm font-semibold text-navy">{row.label}</div>
            <div className="text-xs text-gray-400">{row.sub}</div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => row.setVal(Math.max(row.min, row.val - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-teal hover:text-teal transition-colors">−</button>
            <span className="w-5 text-center font-semibold text-navy">{row.val}</span>
            <button type="button" onClick={() => row.setVal(Math.min(row.max, row.val + 1))}
              className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-teal hover:text-teal transition-colors">+</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={onClose}
        className="w-full bg-navy text-white font-semibold py-2.5 rounded-xl text-sm mt-3 hover:bg-navy-light transition-colors">
        Done
      </button>
    </div>
  );
}

// ── SearchBar ─────────────────────────────────────────────────────────────────

export interface SearchValues {
  query: string;
  location: string;
  mode: 'city' | 'hotel';
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
  forceRefresh: boolean;
}

interface SearchBarProps {
  onSearch: (v: SearchValues) => void;
  loading?: boolean;
  initialValues?: Partial<SearchValues>;
}

export default function SearchBar({ onSearch, loading = false, initialValues }: SearchBarProps) {
  const today = toDateStr(new Date());
  const defaultCi = toDateStr(new Date(Date.now() + 30 * 86400000));
  const defaultCo = toDateStr(new Date(Date.now() + 33 * 86400000));

  const [query, setQuery]         = useState(initialValues?.query ?? '');
  const [location, setLocation]   = useState(initialValues?.location ?? '');
  const [mode, setMode]           = useState<'city' | 'hotel'>(initialValues?.mode ?? 'hotel');
  const [checkin, setCheckin]     = useState(initialValues?.checkin ?? defaultCi);
  const [checkout, setCheckout]   = useState(initialValues?.checkout ?? defaultCo);
  const [adults, setAdults]       = useState(initialValues?.adults ?? 2);
  const [rooms, setRooms]         = useState(initialValues?.rooms ?? 1);
  const [forceRefresh, setForceRefresh] = useState(false);

  const [showCal, setShowCal]     = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSug, setShowSug]     = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowCal(false);
        setShowGuests(false);
        setShowSug(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setShowSug(false); return; }
    debounceRef.current = setTimeout(async () => {
      const items = await getSuggestions(q);
      setSuggestions(items);
      setShowSug(items.length > 0);
    }, 350);
  }, []);

  function handleQueryChange(v: string) {
    setQuery(v);
    setMode('hotel');
    setLocation('');
    fetchSuggestions(v);
  }

  function pickSuggestion(s: Suggestion) {
    if (s.is_city) {
      setQuery(s.name);
      setMode('city');
      setLocation(s.city || s.name);
    } else {
      setQuery(s.city ? `${s.name} ${s.city}` : s.name);
      setMode('hotel');
      setLocation(s.city || '');  // store city so hotel-name searches know where to look
    }
    setSuggestions([]);
    setShowSug(false);
  }

  function handleDateSelect(ci: string, co: string, done?: boolean) {
    setCheckin(ci);
    setCheckout(co);
    if (done && ci && co) setShowCal(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !checkin || !checkout) return;
    onSearch({ query: query.trim(), location, mode, checkin, checkout, adults, rooms, forceRefresh });
    setShowCal(false);
    setShowGuests(false);
    setShowSug(false);
  }

  const nights = checkin && checkout
    ? Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))
    : 0;

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={submit} autoComplete="off">
        {/* Destination input */}
        <div className="relative mb-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Where are you going?</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={query} onChange={e => handleQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              placeholder="City or hotel — e.g. Bangkok or Mandarin Oriental"
              required
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all" />
          </div>

          {/* Suggestions */}
          {showSug && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {suggestions.slice(0, 8).map((s, i) => (
                <li key={i}>
                  <button type="button" onClick={() => pickSuggestion(s)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <span className="text-lg mt-0.5">{s.is_city ? '🏙️' : '🏨'}</span>
                    <div>
                      <div className="text-sm font-semibold text-navy">{s.name}</div>
                      {(s.city || s.country) && (
                        <div className="text-xs text-gray-400">{[s.city, s.country].filter(Boolean).join(', ')}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date + guests + search */}
        <div className="flex items-stretch gap-2 relative">
          {/* Check-in pill */}
          <button type="button" onClick={() => { setShowCal(true); setShowGuests(false); }}
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all text-left ${showCal ? 'border-teal ring-2 ring-teal/20 bg-teal/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Check-in</div>
              <div className="text-sm font-semibold text-navy truncate">{checkin ? fmt(checkin) : 'Select date'}</div>
            </div>
          </button>

          <div className="w-px bg-gray-200 self-stretch my-1" />

          {/* Check-out pill */}
          <button type="button" onClick={() => { setShowCal(true); setShowGuests(false); }}
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all text-left ${showCal ? 'border-teal ring-2 ring-teal/20 bg-teal/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Check-out{nights > 0 && <span className="ml-1 normal-case">· {nights}n</span>}</div>
              <div className="text-sm font-semibold text-navy truncate">{checkout ? fmt(checkout) : 'Select date'}</div>
            </div>
          </button>

          <div className="w-px bg-gray-200 self-stretch my-1" />

          {/* Guests pill */}
          <div className="relative flex-shrink-0">
            <button type="button" onClick={() => { setShowGuests(g => !g); setShowCal(false); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${showGuests ? 'border-teal ring-2 ring-teal/20 bg-teal/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Guests</div>
                <div className="text-sm font-semibold text-navy whitespace-nowrap">{adults} Adult{adults !== 1 ? 's' : ''} · {rooms} Room{rooms !== 1 ? 's' : ''}</div>
              </div>
            </button>
            {showGuests && (
              <GuestPicker adults={adults} rooms={rooms}
                onChange={(a, r) => { setAdults(a); setRooms(r); }}
                onClose={() => setShowGuests(false)} />
            )}
          </div>

          {/* Search button */}
          <button type="submit" disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-teal hover:bg-teal-dark disabled:bg-gray-300 text-white font-bold rounded-xl transition-all text-sm flex-shrink-0 shadow-sm">
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            {loading ? 'Searching…' : 'Search'}
          </button>

          {/* Calendar dropdown */}
          {showCal && (
            <Calendar checkin={checkin} checkout={checkout}
              onSelect={handleDateSelect} />
          )}
        </div>

        {/* Force refresh */}
        <div className="mt-3 flex items-center gap-2">
          <input type="checkbox" id="force-refresh" checked={forceRefresh} onChange={e => setForceRefresh(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-teal cursor-pointer" />
          <label htmlFor="force-refresh" className="text-xs text-gray-400 cursor-pointer select-none">Force fresh search</label>
        </div>
      </form>
    </div>
  );
}

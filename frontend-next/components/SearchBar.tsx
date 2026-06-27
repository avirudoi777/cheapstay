'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getSuggestions } from '@/lib/api';
import type { Suggestion } from '@/lib/types';

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Calendar (portal — renders at body level, never clipped) ──────────────────

interface CalendarProps {
  checkin: string;
  checkout: string;
  anchor: DOMRect;
  onSelect: (ci: string, co: string, done?: boolean) => void;
  onClose: () => void;
}

function Calendar({ checkin, checkout, anchor, onSelect, onClose }: CalendarProps) {
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
  const [picking, setPicking] = useState<'ci' | 'co'>(checkin && !checkout ? 'co' : 'ci');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);


  function handleDay(ds: string) {
    if (ds < today) return;
    if (picking === 'ci' || ds <= checkin) {
      onSelect(ds, '');
      setPicking('co');
    } else {
      onSelect(checkin, ds, true);
      setPicking('ci');
    }
  }

  function renderMonth(year: number, month: number) {
    const firstDow = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleString('en', { month: 'long' });
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= days; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    const effectiveEnd = hover && picking === 'co' && hover > checkin ? hover : checkout;

    return (
      <div className="flex-1 min-w-0">
        <div className="text-center mb-4">
          <span className="text-sm font-extrabold text-gray-900">{monthName}</span>
          <span className="text-sm font-medium text-gray-400 ml-1.5">{year}</span>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="h-8 flex items-center justify-center text-[11px] font-bold text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((ds, i) => {
            if (!ds) return <div key={i} className="h-10" />;
            const isPast = ds < today;
            const isCi = ds === checkin;
            const isCo = ds === checkout;
            const isToday = ds === today;
            const inRange = !!(checkin && effectiveEnd && ds > checkin && ds < effectiveEnd);
            const isRangeStart = isCi && !!effectiveEnd;
            const isRangeEnd = isCo && !!checkin;

            return (
              <div key={ds}
                className={[
                  'relative h-10 flex items-center justify-center',
                  inRange ? 'bg-teal/10' : '',
                  isRangeStart ? 'rounded-l-full bg-teal/10' : '',
                  isRangeEnd ? 'rounded-r-full bg-teal/10' : '',
                ].filter(Boolean).join(' ')}>
                <button
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDay(ds)}
                  onMouseEnter={() => setHover(ds)}
                  onMouseLeave={() => setHover('')}
                  className={[
                    'w-9 h-9 rounded-full text-sm flex items-center justify-center transition-all relative z-10 font-medium',
                    isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                    (isCi || isCo) ? 'text-white font-bold' : '',
                    (!isCi && !isCo && !isPast) ? 'hover:bg-gray-100' : '',
                    isToday && !isCi && !isCo ? 'font-extrabold text-teal' : '',
                    !isCi && !isCo && inRange ? 'text-gray-800' : '',
                    !isCi && !isCo && !inRange && !isPast && !isToday ? 'text-gray-700' : '',
                  ].filter(Boolean).join(' ')}
                  style={(isCi || isCo) ? { background: '#1D9E75' } : {}}>
                  {parseInt(ds.split('-')[2])}
                </button>
              </div>
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

  const nights = checkin && checkout
    ? Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))
    : 0;

  const left = Math.min(anchor.left, window.innerWidth - 660 - 16);
  const top = anchor.bottom + 8;

  return createPortal(
    <div ref={ref}
      style={{ position: 'fixed', top, left, width: 660, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex border-b border-gray-100">
        <button type="button" onClick={() => setPicking('ci')}
          className={`flex-1 px-6 py-4 text-left transition-colors ${picking === 'ci' ? 'border-b-2' : 'hover:bg-gray-50'}`}
          style={picking === 'ci' ? { borderBottomColor: '#1D9E75' } : {}}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Check-in</div>
          <div className={`text-base font-extrabold ${checkin ? 'text-gray-900' : 'text-gray-300'}`}>
            {checkin ? fmtShort(checkin) : 'Select date'}
          </div>
        </button>
        <div className="flex items-center px-4">
          <div className="w-6 h-px bg-gray-200" />
        </div>
        <button type="button" onClick={() => checkin && setPicking('co')}
          className={`flex-1 px-6 py-4 text-left transition-colors ${picking === 'co' ? 'border-b-2' : 'hover:bg-gray-50'}`}
          style={picking === 'co' ? { borderBottomColor: '#1D9E75' } : {}}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Check-out
            {nights > 0 && (
              <span className="ml-2 normal-case font-bold px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                {nights} night{nights !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className={`text-base font-extrabold ${checkout ? 'text-gray-900' : 'text-gray-300'}`}>
            {checkout ? fmtShort(checkout) : 'Select date'}
          </div>
        </button>
      </div>

      {/* Grid */}
      <div className="p-6">
        <div className="flex items-start gap-2">
          <button type="button" onClick={prevMonth}
            className="mt-0.5 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex flex-1 gap-8">
            {renderMonth(viewYear, viewMonth)}
            {renderMonth(nextYear, nextMonthIdx)}
          </div>
          <button type="button" onClick={nextMonth}
            className="mt-0.5 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => { onSelect('', ''); setPicking('ci'); }}
            className="text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors">
            Clear dates
          </button>
          <button type="button"
            onClick={() => checkin && checkout && onClose()}
            disabled={!checkin || !checkout}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#1D9E75' }}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── GuestPicker ───────────────────────────────────────────────────────────────

function GuestPicker({ adults, rooms, onChange, onClose, anchor }: {
  adults: number; rooms: number;
  onChange: (a: number, r: number) => void;
  onClose: () => void;
  anchor: DOMRect;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const right = window.innerWidth - anchor.right;
  const top = anchor.bottom + 8;

  return createPortal(
    <div ref={ref}
      style={{ position: 'fixed', top, right, width: 288, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
      {[
        { label: 'Adults', sub: 'Age 18+', val: adults, setVal: (v: number) => onChange(v, rooms), min: 1, max: 9 },
        { label: 'Rooms', sub: 'Max 4 per booking', val: rooms, setVal: (v: number) => onChange(adults, v), min: 1, max: 4 },
      ].map(row => (
        <div key={row.label} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
          <div>
            <div className="text-sm font-semibold text-gray-800">{row.label}</div>
            <div className="text-xs text-gray-400">{row.sub}</div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => row.setVal(Math.max(row.min, row.val - 1))}
              disabled={row.val <= row.min}
              className="w-8 h-8 rounded-full border-2 border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-teal hover:text-teal transition-colors disabled:opacity-30">−</button>
            <span className="w-5 text-center font-bold text-gray-800 text-sm">{row.val}</span>
            <button type="button" onClick={() => row.setVal(Math.min(row.max, row.val + 1))}
              disabled={row.val >= row.max}
              className="w-8 h-8 rounded-full border-2 border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-teal hover:text-teal transition-colors disabled:opacity-30">+</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={onClose}
        className="w-full bg-teal text-white font-bold py-2.5 rounded-xl text-sm mt-4 hover:bg-teal-dark transition-colors">
        Done
      </button>
    </div>,
    document.body
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
  const defaultCi = toDateStr(new Date(Date.now() + 30 * 86400000));
  const defaultCo = toDateStr(new Date(Date.now() + 33 * 86400000));

  const [query, setQuery]       = useState(initialValues?.query ?? '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [mode, setMode]         = useState<'city' | 'hotel'>(initialValues?.mode ?? 'hotel');
  const [checkin, setCheckin]   = useState(initialValues?.checkin ?? defaultCi);
  const [checkout, setCheckout] = useState(initialValues?.checkout ?? defaultCo);
  const [adults, setAdults]     = useState(initialValues?.adults ?? 2);
  const [rooms, setRooms]       = useState(initialValues?.rooms ?? 1);
  const [forceRefresh, setForceRefresh] = useState(false);

  const [calAnchor, setCalAnchor]       = useState<DOMRect | null>(null);
  const [guestAnchor, setGuestAnchor]   = useState<DOMRect | null>(null);
  const [suggestions, setSuggestions]   = useState<Suggestion[]>([]);
  const [showSug, setShowSug]           = useState(false);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef      = useRef<HTMLDivElement>(null);
  const dateBtnRef   = useRef<HTMLButtonElement>(null);
  const guestBtnRef  = useRef<HTMLButtonElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const sugListRef   = useRef<HTMLUListElement | null>(null);
  const [inputAnchor, setInputAnchor] = useState<DOMRect | null>(null);

  // Close suggestion dropdown on outside click — must also exclude the portal list
  useEffect(() => {
    function handler(e: MouseEvent) {
      const inWrap = wrapRef.current?.contains(e.target as Node);
      const inSug  = sugListRef.current?.contains(e.target as Node);
      if (!inWrap && !inSug) {
        setShowSug(false);
        setInputAnchor(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reposition calendar on scroll — close only if button scrolls off screen
  useEffect(() => {
    if (!calAnchor) return;
    function handleScroll() {
      if (!dateBtnRef.current) return;
      const rect = dateBtnRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setCalAnchor(null);
      } else {
        setCalAnchor(rect);
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [calAnchor]);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setShowSug(false); return; }
    debounceRef.current = setTimeout(async () => {
      const items = await getSuggestions(q);
      setSuggestions(items);
      setShowSug(true);
    }, 180);
  }, []);

  function handleQueryChange(v: string) {
    setQuery(v);
    setMode('hotel');
    setLocation('');
    if (inputRef.current) setInputAnchor(inputRef.current.getBoundingClientRect());
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
      setLocation(s.city || '');
    }
    setSuggestions([]);
    setShowSug(false);
    setInputAnchor(null);
  }

  function openCal() {
    if (dateBtnRef.current) setCalAnchor(dateBtnRef.current.getBoundingClientRect());
    setGuestAnchor(null);
  }

  function openGuests() {
    if (guestBtnRef.current) setGuestAnchor(guestBtnRef.current.getBoundingClientRect());
    setCalAnchor(null);
  }

  function handleDateSelect(ci: string, co: string, done?: boolean) {
    setCheckin(ci);
    setCheckout(co);
    if (done && ci && co) setCalAnchor(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !checkin || !checkout) return;
    onSearch({ query: query.trim(), location, mode, checkin, checkout, adults, rooms, forceRefresh });
    setCalAnchor(null);
    setGuestAnchor(null);
    setShowSug(false);
  }

  const nights = checkin && checkout
    ? Math.max(0, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000))
    : 0;

  const dateLabel = checkin && checkout
    ? `${fmtShort(checkin)} – ${fmtShort(checkout)}`
    : checkin ? `${fmtShort(checkin)} – Add checkout` : 'Add dates';

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={submit} autoComplete="off">

        {/* ── Destination ── */}
        <div className="mb-2">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (inputRef.current) setInputAnchor(inputRef.current.getBoundingClientRect());
                if (suggestions.length > 0) setShowSug(true);
              }}
              placeholder="Where are you going?"
              required
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-gray-200 text-base font-medium placeholder-gray-400 focus:outline-none focus:border-teal transition-all bg-white"
            />
          </div>
        </div>

        {/* ── Dates + Guests + Search ── */}
        <div className="flex items-stretch gap-2">

          {/* Date range button */}
          <button ref={dateBtnRef} type="button"
            onClick={openCal}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left bg-white ${calAnchor ? 'border-teal' : 'border-gray-200 hover:border-gray-300'}`}>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Dates{nights > 0 && <span className="ml-1 normal-case font-semibold text-teal">· {nights} night{nights !== 1 ? 's' : ''}</span>}
              </div>
              <div className="text-sm font-semibold text-gray-800 truncate">{dateLabel}</div>
            </div>
          </button>

          {/* Guests button */}
          <button ref={guestBtnRef} type="button"
            onClick={openGuests}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all bg-white flex-shrink-0 ${guestAnchor ? 'border-teal' : 'border-gray-200 hover:border-gray-300'}`}>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Guests</div>
              <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                {adults} Adult{adults !== 1 ? 's' : ''} · {rooms} Room{rooms !== 1 ? 's' : ''}
              </div>
            </div>
          </button>

          {/* Search button */}
          <button type="submit" disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-teal hover:bg-teal-dark disabled:bg-gray-300 text-white font-bold rounded-2xl transition-all text-sm flex-shrink-0 shadow-md">
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            <span className="hidden sm:inline">{loading ? 'Searching…' : 'Search'}</span>
          </button>
        </div>

        {/* Force refresh */}
        <div className="mt-3 flex items-center gap-2">
          <input type="checkbox" id="force-refresh" checked={forceRefresh} onChange={e => setForceRefresh(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-teal cursor-pointer" />
          <label htmlFor="force-refresh" className="text-xs text-gray-400 cursor-pointer select-none">Force fresh search</label>
        </div>
      </form>

      {/* Portals — rendered at document.body, never clipped by overflow:hidden parents */}
      {showSug && suggestions.length > 0 && inputAnchor && createPortal(
        <ul ref={sugListRef}
          onMouseDown={e => e.preventDefault()}
          style={{ position: 'fixed', top: inputAnchor.bottom + 4, left: inputAnchor.left, width: inputAnchor.width, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {suggestions.slice(0, 8).map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => pickSuggestion(s)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                  {s.is_city ? '🏙️' : '🏨'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{s.name}</div>
                  {(s.city || s.country) && (
                    <div className="text-xs text-gray-400">{[s.city, s.country].filter(Boolean).join(', ')}</div>
                  )}
                </div>
              </button>
            </li>
          ))}
          {query.trim().length >= 3 && (
            <li>
              <button type="button" onClick={() => {
                setShowSug(false); setInputAnchor(null);
                onSearch({ query: query.trim(), location, mode, checkin, checkout, adults, rooms, forceRefresh });
              }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal/5 border-t border-gray-100 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 text-sm">🔍</div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Search &ldquo;{query.trim()}&rdquo;</div>
                  <div className="text-xs text-gray-400">Find the best price</div>
                </div>
              </button>
            </li>
          )}
        </ul>,
        document.body
      )}
      {calAnchor && (
        <Calendar
          checkin={checkin}
          checkout={checkout}
          anchor={calAnchor}
          onSelect={handleDateSelect}
          onClose={() => setCalAnchor(null)}
        />
      )}
      {guestAnchor && (
        <GuestPicker
          adults={adults}
          rooms={rooms}
          anchor={guestAnchor}
          onChange={(a, r) => { setAdults(a); setRooms(r); }}
          onClose={() => setGuestAnchor(null)}
        />
      )}
    </div>
  );
}

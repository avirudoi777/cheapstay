'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ── Airport autocomplete data ──────────────────────────────────────────────────
const AIRPORTS = [
  { code: 'BKK', name: 'Bangkok', country: 'Thailand' },
  { code: 'DMK', name: 'Bangkok Don Mueang', country: 'Thailand' },
  { code: 'DPS', name: 'Bali', country: 'Indonesia' },
  { code: 'NRT', name: 'Tokyo Narita', country: 'Japan' },
  { code: 'HND', name: 'Tokyo Haneda', country: 'Japan' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore' },
  { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'DXB', name: 'Dubai', country: 'UAE' },
  { code: 'AUH', name: 'Abu Dhabi', country: 'UAE' },
  { code: 'LHR', name: 'London Heathrow', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick', country: 'UK' },
  { code: 'CDG', name: 'Paris', country: 'France' },
  { code: 'AMS', name: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt', country: 'Germany' },
  { code: 'BCN', name: 'Barcelona', country: 'Spain' },
  { code: 'FCO', name: 'Rome', country: 'Italy' },
  { code: 'IST', name: 'Istanbul', country: 'Turkey' },
  { code: 'JFK', name: 'New York JFK', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles', country: 'USA' },
  { code: 'ORD', name: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', country: 'USA' },
  { code: 'LAS', name: 'Las Vegas', country: 'USA' },
  { code: 'SYD', name: 'Sydney', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne', country: 'Australia' },
  { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong' },
  { code: 'ICN', name: 'Seoul', country: 'South Korea' },
  { code: 'PVG', name: 'Shanghai', country: 'China' },
  { code: 'DEL', name: 'Delhi', country: 'India' },
  { code: 'BOM', name: 'Mumbai', country: 'India' },
  { code: 'HAN', name: 'Hanoi', country: 'Vietnam' },
  { code: 'SGN', name: 'Ho Chi Minh City', country: 'Vietnam' },
  { code: 'CGK', name: 'Jakarta', country: 'Indonesia' },
  { code: 'MNL', name: 'Manila', country: 'Philippines' },
  { code: 'CNX', name: 'Chiang Mai', country: 'Thailand' },
  { code: 'HKT', name: 'Phuket', country: 'Thailand' },
  { code: 'CAI', name: 'Cairo', country: 'Egypt' },
  { code: 'JNB', name: 'Johannesburg', country: 'South Africa' },
  { code: 'GRU', name: 'São Paulo', country: 'Brazil' },
  { code: 'MEX', name: 'Mexico City', country: 'Mexico' },
  { code: 'YYZ', name: 'Toronto', country: 'Canada' },
  { code: 'MLE', name: 'Maldives', country: 'Maldives' },
];

type Airport = typeof AIRPORTS[number];

function searchAirports(q: string): Airport[] {
  if (q.length < 2) return [];
  const lq = q.toLowerCase();
  return AIRPORTS.filter(a =>
    a.name.toLowerCase().includes(lq) ||
    a.code.toLowerCase().includes(lq) ||
    a.country.toLowerCase().includes(lq)
  ).slice(0, 6);
}

// ── Mini date picker ───────────────────────────────────────────────────────────
function toStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmtDate(s: string) {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface DatePickerProps {
  label: string;
  value: string;
  minDate?: string;
  onChange: (v: string) => void;
}

function DatePicker({ label, value, minDate, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value + 'T12:00:00') : new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value + 'T12:00:00') : new Date()).getMonth());
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const today = toStr(new Date());
  const min = minDate || today;

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (popRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) setAnchor(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  }

  function selectDay(ds: string) {
    onChange(ds);
    setOpen(false);
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en', { month: 'long', year: 'numeric' });
  const cells: (string | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  const popup = open && anchor && typeof window !== 'undefined' ? createPortal(
    <div ref={popRef}
      style={{
        position: 'fixed',
        top: anchor.bottom + 6,
        left: Math.min(anchor.left, window.innerWidth - 300 - 16),
        width: 300,
        zIndex: 9999,
      }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-900">{monthLabel}</span>
        <button type="button" onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="h-7 flex items-center justify-center text-[10px] font-bold text-gray-400">{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((ds, i) => {
          if (!ds) return <div key={i} className="h-9" />;
          const disabled = ds < min;
          const selected = ds === value;
          const isToday = ds === today;
          return (
            <button key={ds} type="button" disabled={disabled}
              onClick={() => selectDay(ds)}
              className={[
                'h-9 w-full rounded-full text-xs flex items-center justify-center transition-all font-medium',
                disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                selected ? 'text-white font-bold' : '',
                !selected && !disabled && isToday ? 'font-extrabold' : '',
                !selected && !disabled ? 'hover:bg-gray-100' : '',
                !selected && !disabled && !isToday ? 'text-gray-700' : '',
                !selected && isToday ? 'text-teal' : '',
              ].filter(Boolean).join(' ')}
              style={selected ? { background: '#1D9E75' } : {}}>
              {parseInt(ds.split('-')[2])}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <button ref={btnRef} type="button" onClick={toggle}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-teal/30 hover:border-gray-300 transition-colors"
        style={value ? { color: '#111' } : { color: '#9ca3af' }}>
        {value ? fmtDate(value) : 'Select date'}
      </button>
      {popup}
    </div>
  );
}

// ── Airport autocomplete input ─────────────────────────────────────────────────
function AirportInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    const results = searchAirports(v);
    setSuggestions(results);
    if (results.length && inputRef.current) setAnchor(inputRef.current.getBoundingClientRect());
    else setAnchor(null);
  }

  function select(a: Airport) {
    const display = `${a.name} (${a.code})`;
    setQuery(display);
    onChange(display);
    setSuggestions([]);
    setAnchor(null);
  }

  function handleBlur(e: React.FocusEvent) {
    if (listRef.current?.contains(e.relatedTarget as Node)) return;
    setSuggestions([]);
    setAnchor(null);
  }

  const dropdown = anchor && suggestions.length > 0 && typeof window !== 'undefined'
    ? createPortal(
        <ul ref={listRef} onMouseDown={e => e.preventDefault()}
          style={{ position: 'fixed', top: anchor.bottom + 4, left: anchor.left, width: anchor.width, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {suggestions.map(a => (
            <li key={a.code} onMouseDown={() => select(a)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
              <span className="text-xs font-bold w-9 flex-shrink-0" style={{ color: '#1D9E75' }}>{a.code}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-none">{a.name}</p>
                <p className="text-xs text-gray-400">{a.country}</p>
              </div>
            </li>
          ))}
        </ul>,
        document.body
      )
    : null;

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input ref={inputRef} type="text" value={query} onChange={handleChange} onBlur={handleBlur}
        placeholder="City or airport" autoComplete="off"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 hover:border-gray-300 transition-colors" />
      {dropdown}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface FlightSearchBarProps {
  onSearch: (from: string, to: string, depart: string, ret: string) => void;
}

export default function FlightSearchBar({ onSearch }: FlightSearchBarProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depart, setDepart] = useState('');
  const [ret, setRet] = useState('');

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: '#E1F5EE', color: '#0F6E56' }}>
        ✈️ Priceline 24hr free cancellation shown automatically
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AirportInput label="FROM" value={from} onChange={setFrom} />
        <AirportInput label="TO" value={to} onChange={setTo} />
        <DatePicker label="DEPART" value={depart} onChange={setDepart} />
        <DatePicker label="RETURN" value={ret} minDate={depart || undefined} onChange={setRet} />
      </div>
      <button type="button" onClick={() => onSearch(from, to, depart, ret)}
        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
        Search Flights →
      </button>
    </div>
  );
}

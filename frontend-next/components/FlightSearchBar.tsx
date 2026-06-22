'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ── Airport autocomplete data ──────────────────────────────────────────────────
export const AIRPORTS = [
  // Southeast Asia
  { code: 'BKK', name: 'Bangkok', country: 'Thailand' },
  { code: 'DMK', name: 'Bangkok Don Mueang', country: 'Thailand' },
  { code: 'HKT', name: 'Phuket', country: 'Thailand' },
  { code: 'CNX', name: 'Chiang Mai', country: 'Thailand' },
  { code: 'USM', name: 'Koh Samui', country: 'Thailand' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore' },
  { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'PEN', name: 'Penang', country: 'Malaysia' },
  { code: 'DPS', name: 'Bali', country: 'Indonesia' },
  { code: 'CGK', name: 'Jakarta', country: 'Indonesia' },
  { code: 'SUB', name: 'Surabaya', country: 'Indonesia' },
  { code: 'LOP', name: 'Lombok', country: 'Indonesia' },
  { code: 'MNL', name: 'Manila', country: 'Philippines' },
  { code: 'CEB', name: 'Cebu', country: 'Philippines' },
  { code: 'HAN', name: 'Hanoi', country: 'Vietnam' },
  { code: 'SGN', name: 'Ho Chi Minh City', country: 'Vietnam' },
  { code: 'DAD', name: 'Da Nang', country: 'Vietnam' },
  { code: 'RGN', name: 'Yangon', country: 'Myanmar' },
  { code: 'BKI', name: 'Kota Kinabalu', country: 'Malaysia' },
  { code: 'REP', name: 'Siem Reap', country: 'Cambodia' },
  { code: 'PNH', name: 'Phnom Penh', country: 'Cambodia' },
  { code: 'VTE', name: 'Vientiane', country: 'Laos' },
  // East Asia
  { code: 'NRT', name: 'Tokyo Narita', country: 'Japan' },
  { code: 'HND', name: 'Tokyo Haneda', country: 'Japan' },
  { code: 'KIX', name: 'Osaka', country: 'Japan' },
  { code: 'ITM', name: 'Osaka Itami', country: 'Japan' },
  { code: 'CTS', name: 'Sapporo', country: 'Japan' },
  { code: 'OKA', name: 'Okinawa', country: 'Japan' },
  { code: 'FUK', name: 'Fukuoka', country: 'Japan' },
  { code: 'NGO', name: 'Nagoya', country: 'Japan' },
  { code: 'ICN', name: 'Seoul Incheon', country: 'South Korea' },
  { code: 'GMP', name: 'Seoul Gimpo', country: 'South Korea' },
  { code: 'PUS', name: 'Busan', country: 'South Korea' },
  { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong' },
  { code: 'MFM', name: 'Macau', country: 'Macau' },
  { code: 'TPE', name: 'Taipei', country: 'Taiwan' },
  { code: 'KHH', name: 'Kaohsiung', country: 'Taiwan' },
  { code: 'PEK', name: 'Beijing Capital', country: 'China' },
  { code: 'PKX', name: 'Beijing Daxing', country: 'China' },
  { code: 'PVG', name: 'Shanghai Pudong', country: 'China' },
  { code: 'SHA', name: 'Shanghai Hongqiao', country: 'China' },
  { code: 'CAN', name: 'Guangzhou', country: 'China' },
  { code: 'SZX', name: 'Shenzhen', country: 'China' },
  { code: 'CTU', name: 'Chengdu', country: 'China' },
  { code: 'KMG', name: 'Kunming', country: 'China' },
  { code: 'XIY', name: "Xi'an", country: 'China' },
  { code: 'URC', name: 'Urumqi', country: 'China' },
  // South Asia
  { code: 'DEL', name: 'Delhi', country: 'India' },
  { code: 'BOM', name: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Bangalore', country: 'India' },
  { code: 'MAA', name: 'Chennai', country: 'India' },
  { code: 'CCU', name: 'Kolkata', country: 'India' },
  { code: 'HYD', name: 'Hyderabad', country: 'India' },
  { code: 'COK', name: 'Kochi', country: 'India' },
  { code: 'GOI', name: 'Goa', country: 'India' },
  { code: 'CMB', name: 'Colombo', country: 'Sri Lanka' },
  { code: 'KTM', name: 'Kathmandu', country: 'Nepal' },
  { code: 'DAC', name: 'Dhaka', country: 'Bangladesh' },
  // Middle East
  { code: 'DXB', name: 'Dubai', country: 'UAE' },
  { code: 'AUH', name: 'Abu Dhabi', country: 'UAE' },
  { code: 'SHJ', name: 'Sharjah', country: 'UAE' },
  { code: 'DOH', name: 'Doha', country: 'Qatar' },
  { code: 'RUH', name: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'JED', name: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'MCT', name: 'Muscat', country: 'Oman' },
  { code: 'KWI', name: 'Kuwait City', country: 'Kuwait' },
  { code: 'BAH', name: 'Bahrain', country: 'Bahrain' },
  { code: 'AMM', name: 'Amman', country: 'Jordan' },
  { code: 'BEY', name: 'Beirut', country: 'Lebanon' },
  { code: 'TLV', name: 'Tel Aviv', country: 'Israel' },
  // Europe
  { code: 'LHR', name: 'London Heathrow', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick', country: 'UK' },
  { code: 'STN', name: 'London Stansted', country: 'UK' },
  { code: 'LTN', name: 'London Luton', country: 'UK' },
  { code: 'MAN', name: 'Manchester', country: 'UK' },
  { code: 'EDI', name: 'Edinburgh', country: 'UK' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', country: 'France' },
  { code: 'ORY', name: 'Paris Orly', country: 'France' },
  { code: 'NCE', name: 'Nice', country: 'France' },
  { code: 'AMS', name: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt', country: 'Germany' },
  { code: 'MUC', name: 'Munich', country: 'Germany' },
  { code: 'BER', name: 'Berlin', country: 'Germany' },
  { code: 'HAM', name: 'Hamburg', country: 'Germany' },
  { code: 'BCN', name: 'Barcelona', country: 'Spain' },
  { code: 'MAD', name: 'Madrid', country: 'Spain' },
  { code: 'PMI', name: 'Mallorca', country: 'Spain' },
  { code: 'AGP', name: 'Malaga', country: 'Spain' },
  { code: 'FCO', name: 'Rome', country: 'Italy' },
  { code: 'MXP', name: 'Milan Malpensa', country: 'Italy' },
  { code: 'VCE', name: 'Venice', country: 'Italy' },
  { code: 'NAP', name: 'Naples', country: 'Italy' },
  { code: 'ATH', name: 'Athens', country: 'Greece' },
  { code: 'HER', name: 'Heraklion Crete', country: 'Greece' },
  { code: 'IST', name: 'Istanbul', country: 'Turkey' },
  { code: 'SAW', name: 'Istanbul Sabiha', country: 'Turkey' },
  { code: 'AYT', name: 'Antalya', country: 'Turkey' },
  { code: 'LIS', name: 'Lisbon', country: 'Portugal' },
  { code: 'OPO', name: 'Porto', country: 'Portugal' },
  { code: 'ZRH', name: 'Zurich', country: 'Switzerland' },
  { code: 'GVA', name: 'Geneva', country: 'Switzerland' },
  { code: 'VIE', name: 'Vienna', country: 'Austria' },
  { code: 'PRG', name: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', name: 'Budapest', country: 'Hungary' },
  { code: 'WAW', name: 'Warsaw', country: 'Poland' },
  { code: 'KRK', name: 'Krakow', country: 'Poland' },
  { code: 'BRU', name: 'Brussels', country: 'Belgium' },
  { code: 'CPH', name: 'Copenhagen', country: 'Denmark' },
  { code: 'ARN', name: 'Stockholm', country: 'Sweden' },
  { code: 'OSL', name: 'Oslo', country: 'Norway' },
  { code: 'HEL', name: 'Helsinki', country: 'Finland' },
  { code: 'DUB', name: 'Dublin', country: 'Ireland' },
  { code: 'SVO', name: 'Moscow Sheremetyevo', country: 'Russia' },
  { code: 'LED', name: 'St Petersburg', country: 'Russia' },
  { code: 'OTP', name: 'Bucharest', country: 'Romania' },
  { code: 'SOF', name: 'Sofia', country: 'Bulgaria' },
  { code: 'SKG', name: 'Thessaloniki', country: 'Greece' },
  // Africa
  { code: 'CAI', name: 'Cairo', country: 'Egypt' },
  { code: 'HRG', name: 'Hurghada', country: 'Egypt' },
  { code: 'SSH', name: 'Sharm El Sheikh', country: 'Egypt' },
  { code: 'JNB', name: 'Johannesburg', country: 'South Africa' },
  { code: 'CPT', name: 'Cape Town', country: 'South Africa' },
  { code: 'NBO', name: 'Nairobi', country: 'Kenya' },
  { code: 'MBA', name: 'Mombasa', country: 'Kenya' },
  { code: 'DAR', name: 'Dar es Salaam', country: 'Tanzania' },
  { code: 'JRO', name: 'Kilimanjaro', country: 'Tanzania' },
  { code: 'ZNZ', name: 'Zanzibar', country: 'Tanzania' },
  { code: 'LOS', name: 'Lagos', country: 'Nigeria' },
  { code: 'ABV', name: 'Abuja', country: 'Nigeria' },
  { code: 'ACC', name: 'Accra', country: 'Ghana' },
  { code: 'ADD', name: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'CMN', name: 'Casablanca', country: 'Morocco' },
  { code: 'RAK', name: 'Marrakech', country: 'Morocco' },
  { code: 'TUN', name: 'Tunis', country: 'Tunisia' },
  { code: 'MRU', name: 'Mauritius', country: 'Mauritius' },
  // Americas
  { code: 'JFK', name: 'New York JFK', country: 'USA' },
  { code: 'EWR', name: 'New York Newark', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles', country: 'USA' },
  { code: 'ORD', name: 'Chicago', country: 'USA' },
  { code: 'MDW', name: 'Chicago Midway', country: 'USA' },
  { code: 'MIA', name: 'Miami', country: 'USA' },
  { code: 'FLL', name: 'Fort Lauderdale', country: 'USA' },
  { code: 'MCO', name: 'Orlando', country: 'USA' },
  { code: 'TPA', name: 'Tampa', country: 'USA' },
  { code: 'ATL', name: 'Atlanta', country: 'USA' },
  { code: 'BOS', name: 'Boston', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', country: 'USA' },
  { code: 'SJC', name: 'San Jose', country: 'USA' },
  { code: 'SEA', name: 'Seattle', country: 'USA' },
  { code: 'LAS', name: 'Las Vegas', country: 'USA' },
  { code: 'DEN', name: 'Denver', country: 'USA' },
  { code: 'DFW', name: 'Dallas', country: 'USA' },
  { code: 'IAH', name: 'Houston', country: 'USA' },
  { code: 'PHX', name: 'Phoenix', country: 'USA' },
  { code: 'PHL', name: 'Philadelphia', country: 'USA' },
  { code: 'IAD', name: 'Washington DC Dulles', country: 'USA' },
  { code: 'DCA', name: 'Washington DC Reagan', country: 'USA' },
  { code: 'MSP', name: 'Minneapolis', country: 'USA' },
  { code: 'DTW', name: 'Detroit', country: 'USA' },
  { code: 'HNL', name: 'Honolulu', country: 'USA' },
  { code: 'YYZ', name: 'Toronto', country: 'Canada' },
  { code: 'YVR', name: 'Vancouver', country: 'Canada' },
  { code: 'YUL', name: 'Montreal', country: 'Canada' },
  { code: 'YYC', name: 'Calgary', country: 'Canada' },
  { code: 'GRU', name: 'São Paulo', country: 'Brazil' },
  { code: 'GIG', name: 'Rio de Janeiro', country: 'Brazil' },
  { code: 'BSB', name: 'Brasília', country: 'Brazil' },
  { code: 'EZE', name: 'Buenos Aires', country: 'Argentina' },
  { code: 'SCL', name: 'Santiago', country: 'Chile' },
  { code: 'BOG', name: 'Bogotá', country: 'Colombia' },
  { code: 'MDE', name: 'Medellín', country: 'Colombia' },
  { code: 'LIM', name: 'Lima', country: 'Peru' },
  { code: 'CUN', name: 'Cancun', country: 'Mexico' },
  { code: 'MEX', name: 'Mexico City', country: 'Mexico' },
  { code: 'GDL', name: 'Guadalajara', country: 'Mexico' },
  { code: 'PTY', name: 'Panama City', country: 'Panama' },
  // Oceania
  { code: 'SYD', name: 'Sydney', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne', country: 'Australia' },
  { code: 'BNE', name: 'Brisbane', country: 'Australia' },
  { code: 'PER', name: 'Perth', country: 'Australia' },
  { code: 'ADL', name: 'Adelaide', country: 'Australia' },
  { code: 'AKL', name: 'Auckland', country: 'New Zealand' },
  { code: 'CHC', name: 'Christchurch', country: 'New Zealand' },
  // Islands / Resorts
  { code: 'MLE', name: 'Maldives', country: 'Maldives' },
  { code: 'PPT', name: 'Tahiti', country: 'French Polynesia' },
  { code: 'NAN', name: 'Fiji', country: 'Fiji' },
  { code: 'PUJ', name: 'Punta Cana', country: 'Dominican Republic' },
  { code: 'MBJ', name: 'Montego Bay Jamaica', country: 'Jamaica' },
  { code: 'NAS', name: 'Nassau Bahamas', country: 'Bahamas' },
  { code: 'GPA', name: 'Patras', country: 'Greece' },
];

type Airport = typeof AIRPORTS[number];

function searchAirports(q: string): Airport[] {
  if (q.length < 1) return [];
  const lq = q.toLowerCase();
  const exact = AIRPORTS.filter(a => a.code.toLowerCase() === lq);
  const starts = AIRPORTS.filter(a =>
    a.code.toLowerCase() !== lq && (
      a.name.toLowerCase().startsWith(lq) ||
      a.country.toLowerCase().startsWith(lq)
    )
  );
  const rest = AIRPORTS.filter(a =>
    a.code.toLowerCase() !== lq &&
    !a.name.toLowerCase().startsWith(lq) &&
    !a.country.toLowerCase().startsWith(lq) && (
      a.name.toLowerCase().includes(lq) ||
      a.country.toLowerCase().includes(lq)
    )
  );
  return [...exact, ...starts, ...rest].slice(0, 8);
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
  onSearch: (from: string, to: string, depart: string, ret: string, adults: number, children: number, infants: number) => void;
}

export default function FlightSearchBar({ onSearch }: FlightSearchBarProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depart, setDepart] = useState('');
  const [ret, setRet] = useState('');
  const [tripType, setTripType] = useState<'round' | 'oneway'>('round');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [paxOpen, setPaxOpen] = useState(false);

  function handleSearch() {
    onSearch(from, to, depart, tripType === 'round' ? ret : '', adults, children, infants);
  }

  const totalPax = adults + children + infants;
  const paxLabel = [
    `${adults} ${adults === 1 ? 'Adult' : 'Adults'}`,
    children > 0 ? `${children} ${children === 1 ? 'Child' : 'Children'}` : null,
    infants > 0 ? `${infants} ${infants === 1 ? 'Infant' : 'Infants'}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      {/* Trip type + passenger row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: '#f1f5f9' }}>
          {([['round', 'Round trip'], ['oneway', 'One way']] as const).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setTripType(val)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={tripType === val
                ? { background: '#1D9E75', color: '#fff' }
                : { color: '#6b7280' }}>
              {label}
            </button>
          ))}
        </div>
        {/* Passenger selector */}
        <div className="relative">
          <button type="button" onClick={() => setPaxOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700"
            style={{ background: '#f1f5f9' }}>
            👤 {paxLabel}
            <span className="text-gray-400">{paxOpen ? '▲' : '▼'}</span>
          </button>
          {paxOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 rounded-2xl shadow-lg p-4 w-64"
              style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              {([
                { label: 'Adults', sub: 'Age 12+', val: adults, set: (n: number) => { setAdults(n); if (infants > n) setInfants(n); }, min: 1, max: 6 },
                { label: 'Children', sub: 'Age 2–11', val: children, set: setChildren, min: 0, max: 6 },
                { label: 'Infants', sub: 'Under 2, on lap', val: infants, set: (n: number) => setInfants(Math.min(n, adults)), min: 0, max: adults },
              ] as const).map(row => (
                <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{row.label}</p>
                    <p className="text-[10px] text-gray-400">{row.sub}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => row.set(Math.max(row.min, row.val - 1))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                      style={{ color: row.val > row.min ? '#1D9E75' : '#9ca3af', background: row.val > row.min ? '#e6f7f1' : '#f9fafb' }}>
                      −
                    </button>
                    <span className="text-sm font-bold text-gray-800 w-4 text-center">{row.val}</span>
                    <button type="button" onClick={() => row.set(Math.min(row.max, row.val + 1))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                      style={{ color: row.val < row.max ? '#1D9E75' : '#9ca3af', background: row.val < row.max ? '#e6f7f1' : '#f9fafb' }}>
                      +
                    </button>
                  </div>
                </div>
              ))}
              {infants > 0 && (
                <p className="text-[10px] text-amber-600 mt-2">👶 Infants travel on an adult&apos;s lap — no seat included. Max 1 infant per adult.</p>
              )}
              <button type="button" onClick={() => setPaxOpen(false)}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#1D9E75' }}>
                Done · {totalPax} passenger{totalPax !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`grid gap-3 ${tripType === 'round' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <AirportInput label="FROM" value={from} onChange={setFrom} />
        <AirportInput label="TO" value={to} onChange={setTo} />
        <DatePicker label="DEPART" value={depart} onChange={setDepart} />
        {tripType === 'round' && (
          <DatePicker label="RETURN" value={ret} minDate={depart || undefined} onChange={setRet} />
        )}
      </div>
      <button type="button" onClick={handleSearch}
        className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
        Search Flights →
      </button>
    </div>
  );
}

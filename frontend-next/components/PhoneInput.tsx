'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DIAL_CODES = [
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'IL', name: 'Israel', dial: '+972' },
  { code: 'TH', name: 'Thailand', dial: '+66' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'MY', name: 'Malaysia', dial: '+60' },
  { code: 'ID', name: 'Indonesia', dial: '+62' },
  { code: 'PH', name: 'Philippines', dial: '+63' },
  { code: 'VN', name: 'Vietnam', dial: '+84' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' },
  { code: 'TW', name: 'Taiwan', dial: '+886' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'PK', name: 'Pakistan', dial: '+92' },
  { code: 'BD', name: 'Bangladesh', dial: '+880' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94' },
  { code: 'NP', name: 'Nepal', dial: '+977' },
  { code: 'AE', name: 'UAE', dial: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'QA', name: 'Qatar', dial: '+974' },
  { code: 'KW', name: 'Kuwait', dial: '+965' },
  { code: 'BH', name: 'Bahrain', dial: '+973' },
  { code: 'OM', name: 'Oman', dial: '+968' },
  { code: 'JO', name: 'Jordan', dial: '+962' },
  { code: 'LB', name: 'Lebanon', dial: '+961' },
  { code: 'EG', name: 'Egypt', dial: '+20' },
  { code: 'TR', name: 'Turkey', dial: '+90' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'BE', name: 'Belgium', dial: '+32' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'AT', name: 'Austria', dial: '+43' },
  { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'FI', name: 'Finland', dial: '+358' },
  { code: 'PL', name: 'Poland', dial: '+48' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420' },
  { code: 'HU', name: 'Hungary', dial: '+36' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'GR', name: 'Greece', dial: '+30' },
  { code: 'RO', name: 'Romania', dial: '+40' },
  { code: 'RU', name: 'Russia', dial: '+7' },
  { code: 'UA', name: 'Ukraine', dial: '+380' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'ET', name: 'Ethiopia', dial: '+251' },
  { code: 'MA', name: 'Morocco', dial: '+212' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'CO', name: 'Colombia', dial: '+57' },
  { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'PE', name: 'Peru', dial: '+51' },
];

function flagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function parsePhone(full: string): { dial: string; number: string } {
  if (!full) return { dial: '+1', number: '' };
  const match = DIAL_CODES.sort((a, b) => b.dial.length - a.dial.length)
    .find(d => full.startsWith(d.dial));
  if (match) return { dial: match.dial, number: full.slice(match.dial.length).trim() };
  if (full.startsWith('+')) {
    const spaceIdx = full.indexOf(' ');
    if (spaceIdx > 0) return { dial: full.slice(0, spaceIdx), number: full.slice(spaceIdx + 1) };
  }
  return { dial: '+1', number: full.replace(/^\+1/, '') };
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, className = '', required }: Props) {
  const parsed = parsePhone(value);
  const [dial, setDial] = useState(parsed.dial);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Sync if value changes externally (profile load)
  useEffect(() => {
    const p = parsePhone(value);
    setDial(p.dial);
    setNumber(p.number);
  }, [value]);

  function emit(d: string, n: string) {
    onChange(n ? `${d}${n}` : '');
  }

  function selectDial(d: string) {
    setDial(d);
    setOpen(false);
    setSearch('');
    emit(d, number);
  }

  function openDropdown() {
    if (btnRef.current) setAnchor(btnRef.current.getBoundingClientRect());
    setOpen(true);
    setSearch('');
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', handler); };
  }, [open]);

  const filtered = search
    ? DIAL_CODES.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.dial.includes(search) ||
        d.code.toLowerCase().includes(search.toLowerCase())
      )
    : DIAL_CODES;

  const selectedCountry = DIAL_CODES.find(d => d.dial === dial) ?? DIAL_CODES[0];

  return (
    <div className={`flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal/30 focus-within:border-teal transition-all ${className}`}>
      {/* Dial code button */}
      <button ref={btnRef} type="button" onClick={openDropdown}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0 text-sm font-semibold text-gray-700">
        <span className="text-base leading-none">{flagEmoji(selectedCountry.code)}</span>
        <span>{selectedCountry.dial}</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={e => { setNumber(e.target.value); emit(dial, e.target.value); }}
        placeholder="2144146487"
        required={required}
        className="flex-1 px-3 py-2 text-sm bg-white focus:outline-none text-gray-900 font-medium min-w-0"
      />

      {/* Dropdown portal */}
      {open && anchor && typeof window !== 'undefined' && createPortal(
        <div ref={dropRef}
          style={{ position: 'fixed', top: anchor.bottom + 4, left: anchor.left, width: 280, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search country or code…"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(d => (
              <button key={d.code} type="button" onClick={() => selectDial(d.dial)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors ${d.dial === dial ? 'bg-teal/5' : ''}`}>
                <span className="text-lg leading-none flex-shrink-0">{flagEmoji(d.code)}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{d.name}</span>
                <span className="text-xs font-bold text-gray-400 flex-shrink-0">{d.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No results</p>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

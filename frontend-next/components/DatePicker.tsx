'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TEAL = '#1D9E75';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseISO(s: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return { y: +match[1], m: +match[2] - 1, d: +match[3] };
}
function fmtDisplay(s: string) {
  const p = parseISO(s);
  if (!p) return '';
  return new Date(p.y, p.m, p.d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function todayP() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, min, max, placeholder = 'Select date', className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const maxP = max ? parseISO(max) : null;
  const today = todayP();

  function openPicker() {
    if (!btnRef.current) return;
    setAnchor(btnRef.current.getBoundingClientRect());
    setOpen(true);
  }

  const minISO = min ?? '0001-01-01';
  const maxISO = max ?? '9999-12-31';
  const minYear = parseISO(min ?? '')?.y ?? today.y - 120;
  const maxYear = parseISO(max ?? '')?.y ?? today.y + 20;
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const valP = parseISO(value);
  const initY = valP?.y ?? maxP?.y ?? today.y;
  const initM = valP?.m ?? (maxP ? maxP.m : today.m);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openPicker}
        className={`${className} text-left flex items-center justify-between`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? fmtDisplay(value) : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {open && anchor && typeof window !== 'undefined' && createPortal(
        <Popover
          anchor={anchor}
          initY={initY} initM={initM}
          value={value}
          onSelect={(iso) => { onChange(iso); setOpen(false); }}
          onClose={() => setOpen(false)}
          minISO={minISO} maxISO={maxISO}
          years={years}
          today={today}
        />,
        document.body
      )}
    </>
  );
}

function Popover({ anchor, initY, initM, value, onSelect, onClose, minISO, maxISO, years, today }: {
  anchor: DOMRect;
  initY: number; initM: number;
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  minISO: string; maxISO: string;
  years: number[];
  today: { y: number; m: number; d: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [viewY, setViewY] = useState(initY);
  const [viewM, setViewM] = useState(initM);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('scroll', onClose, { passive: true });
    return () => window.removeEventListener('scroll', onClose);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const calW = 312;
  const calH = 370;
  const left = Math.min(Math.max(8, anchor.left), window.innerWidth - calW - 8);
  const spaceBelow = window.innerHeight - anchor.bottom;
  const top = spaceBelow < calH + 12 ? Math.max(8, anchor.top - calH - 8) : anchor.bottom + 8;

  const firstDow = new Date(viewY, viewM, 1).getDay();
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (viewM === 0) { setViewM(11); setViewY(y => y - 1); } else setViewM(m => m - 1); };
  const nextMonth = () => { if (viewM === 11) { setViewM(0); setViewY(y => y + 1); } else setViewM(m => m + 1); };

  return (
    <div ref={ref}
      style={{ position: 'fixed', top, left, width: calW, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 select-none">

      {/* Header: prev / month+year selects / next */}
      <div className="flex items-center gap-1 mb-3">
        <button type="button" onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 shrink-0 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 flex-1 justify-center">
          <select value={viewM} onChange={e => setViewM(+e.target.value)}
            className="text-sm font-bold text-gray-900 bg-gray-50 rounded-lg px-2 py-1 border-0 outline-none cursor-pointer">
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={viewY} onChange={e => setViewY(+e.target.value)}
            className="text-sm font-bold text-gray-900 bg-gray-50 rounded-lg px-2 py-1 border-0 outline-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 shrink-0 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="h-7 flex items-center justify-center text-[10px] font-bold text-gray-400">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="h-9" />;
          const iso = toISO(viewY, viewM, d);
          const disabled = iso < minISO || iso > maxISO;
          const isSelected = iso === value;
          const isToday = viewY === today.y && viewM === today.m && d === today.d;
          return (
            <div key={i} className="h-9 flex items-center justify-center">
              <button type="button" disabled={disabled} onClick={() => onSelect(iso)}
                className={[
                  'w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors',
                  disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100',
                  isSelected ? 'text-white font-bold' : '',
                  isToday && !isSelected ? 'font-extrabold' : '',
                ].filter(Boolean).join(' ')}
                style={{
                  background: isSelected ? TEAL : undefined,
                  color: !isSelected && isToday ? TEAL : undefined,
                }}>
                {d}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-2 pt-2.5 border-t border-gray-100">
        {value
          ? <button type="button" onClick={() => { onSelect(''); onClose(); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">Clear</button>
          : <span />
        }
        <button type="button" onClick={onClose}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">Close</button>
      </div>
    </div>
  );
}

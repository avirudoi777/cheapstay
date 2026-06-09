import { useState, useCallback, useMemo } from 'react';

// ── Static data ──────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { id: 'hotel',     label: 'Hotel',              count: 842 },
  { id: 'apartment', label: 'Apartment / Flat',   count: 234 },
  { id: 'serviced',  label: 'Serviced Apartment', count: 127 },
  { id: 'hostel',    label: 'Hostel',              count: 89  },
  { id: 'guest',     label: 'Guesthouse',          count: 156 },
  { id: 'house',     label: 'Entire House',        count: 43  },
];

const NEIGHBORHOODS = [
  { id: 'sukhumvit', label: 'Sukhumvit',           count: 412 },
  { id: 'silom',     label: 'Silom / Sathorn',     count: 198 },
  { id: 'ratchada',  label: 'Ratchada',            count: 87  },
  { id: 'siam',      label: 'Siam / Pratunam',     count: 134 },
  { id: 'riverside', label: 'Riverside',           count: 76  },
  { id: 'china',     label: 'Chinatown',           count: 45  },
  { id: 'ari',       label: 'Ari / Phahon Yothin', count: 63  },
];

const DISTANCES = [
  { id: 'center', label: 'Inside city center' },
  { id: '2km',    label: '< 2 km from center' },
  { id: '5km',    label: '2 – 5 km' },
  { id: '10km',   label: '5 – 10 km' },
  { id: 'far',    label: '> 10 km' },
];

const AMENITIES = [
  { id: 'ac',      label: 'Air conditioning' },
  { id: 'fridge',  label: 'Refrigerator' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'washer',  label: 'Washing Machine' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'coffee',  label: 'Coffee maker' },
];

const FACILITIES = [
  { id: 'pool',    label: 'Swimming Pool' },
  { id: 'gym',     label: 'Gym / Fitness' },
  { id: 'wifi',    label: 'Internet / WiFi' },
  { id: 'parking', label: 'Car Park' },
  { id: 'shuttle', label: 'Airport Transfer' },
];

const SPECIALS = [
  { id: 'workation', label: 'Workation Friendly' },
  { id: 'cancel',    label: 'Free Cancellation' },
  { id: 'pay_now',   label: 'Pay Now' },
  { id: 'no_cc',     label: 'No Credit Card' },
];

export const EMPTY_FILTERS = {
  budget: [0, 500],
  stars: [],
  guestRating: 'any',
  propertyTypes: [],
  neighborhoods: [],
  distances: [],
  amenities: [],
  facilities: [],
  specials: [],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const tog = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

const countActive = f => {
  let n = 0;
  if (f.budget[0] > 0 || f.budget[1] < 500) n++;
  n += f.stars.length;
  if (f.guestRating !== 'any') n++;
  n += f.propertyTypes.length + f.neighborhoods.length + f.distances.length
     + f.amenities.length + f.facilities.length + f.specials.length;
  return n;
};

// ── DualRangeSlider ──────────────────────────────────────────────────────────

function DualRangeSlider({ min, max, value, onChange }) {
  const [lo, hi] = value;
  const pct = v => ((v - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {[
          { val: lo, setVal: v => onChange([Math.min(v, hi - 1), hi]) },
          { val: hi, setVal: v => onChange([lo, Math.max(v, lo + 1)]) },
        ].map(({ val, setVal }, i) => (
          <>
            {i === 1 && <span key="sep" className="text-gray-300 text-sm">–</span>}
            <div key={i} className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">$</span>
              <input
                type="number" value={val} min={min} max={max}
                onChange={e => setVal(Number(e.target.value))}
                className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
            </div>
          </>
        ))}
      </div>

      <div className="relative h-6 flex items-center mx-1">
        <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            left: `${pct(lo)}%`,
            width: `${pct(hi) - pct(lo)}%`,
            background: 'linear-gradient(90deg, #00C9B1, #1A73E8)',
          }}
        />
        <input type="range" min={min} max={max} value={lo}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - 5), hi])}
          style={{ WebkitAppearance: 'none', appearance: 'none', background: 'transparent',
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: lo > max - 20 ? 5 : 3 }}
        />
        <input type="range" min={min} max={max} value={hi}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + 5)])}
          style={{ WebkitAppearance: 'none', appearance: 'none', background: 'transparent',
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 4 }}
        />
        {[lo, hi].map((v, i) => (
          <div key={i}
            className="absolute w-5 h-5 bg-white border-2 border-teal rounded-full shadow-md pointer-events-none"
            style={{ left: `${pct(v)}%`, transform: 'translateX(-50%)', zIndex: 6 }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium px-0.5">
        <span>$0</span><span>$500+</span>
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

function Section({ title, badge = 0, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-navy tracking-tight">{title}</span>
          {badge > 0 && (
            <span className="text-[10px] font-bold bg-teal/10 text-teal-dark px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </span>
          )}
        </div>
        <svg
          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div style={{
        maxHeight: open ? '600px' : '0',
        opacity: open ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
      }}>
        <div className="px-5 pb-4">{children}</div>
      </div>
    </div>
  );
}

// ── CheckRow ─────────────────────────────────────────────────────────────────

function CheckRow({ label, count, checked, onChange }) {
  return (
    <button onClick={onChange} className="w-full flex items-center gap-3 py-1.5 group text-left">
      <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
        checked ? 'bg-navy border-navy' : 'border-gray-300 group-hover:border-teal'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-[13px] flex-1 transition-colors ${
        checked ? 'text-navy font-semibold' : 'text-gray-600 group-hover:text-navy'
      }`}>{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-gray-400 font-medium tabular-nums">{count.toLocaleString()}</span>
      )}
    </button>
  );
}

// ── RadioRow ─────────────────────────────────────────────────────────────────

function RadioRow({ label, selected, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-1.5 group text-left">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? 'border-teal' : 'border-gray-300 group-hover:border-teal'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-teal" />}
      </div>
      <span className={`text-[13px] transition-colors ${
        selected ? 'text-navy font-semibold' : 'text-gray-600 group-hover:text-navy'
      }`}>{label}</span>
    </button>
  );
}

// ── FilterSidebar (default export) ───────────────────────────────────────────

/**
 * @param {object} props
 * @param {function} props.onChange   — called with the full filter object on every change
 * @param {number}  [props.totalResults=0]  — property count to show in the footer button
 */
export default function FilterSidebar({ onChange, totalResults = 0 }) {
  const [f, setF] = useState(EMPTY_FILTERS);
  const active = useMemo(() => countActive(f), [f]);

  const upd = useCallback((key, val) => {
    setF(prev => {
      const next = { ...prev, [key]: val };
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const clear = () => { setF(EMPTY_FILTERS); onChange?.(EMPTY_FILTERS); };

  return (
    <div className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col"
      style={{ maxHeight: 'calc(100vh - 4rem)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-navy tracking-tight">Filter results</h2>
          {totalResults > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
              {totalResults.toLocaleString()} properties found
            </p>
          )}
        </div>
        <button
          onClick={clear}
          className={`text-xs font-semibold transition-all ${
            active > 0 ? 'text-teal hover:text-teal-dark' : 'text-gray-300 pointer-events-none'
          }`}
        >
          Clear all
        </button>
      </div>

      {/* Scrollable filter list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>

        <Section title="Budget per night" badge={f.budget[0] > 0 || f.budget[1] < 500 ? 1 : 0}>
          <DualRangeSlider min={0} max={500} value={f.budget}
            onChange={v => upd('budget', v)} />
        </Section>

        <Section title="Star rating" badge={f.stars.length}>
          <div className="flex flex-wrap gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s}
                onClick={() => upd('stars', tog(f.stars, s))}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  f.stars.includes(s)
                    ? 'bg-navy text-white border-navy shadow-sm'
                    : 'bg-white text-amber-400 border-gray-200 hover:border-amber-300'
                }`}
              >
                {'★'.repeat(s)}
              </button>
            ))}
            <button
              onClick={() => upd('stars', tog(f.stars, 'luxe'))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                f.stars.includes('luxe')
                  ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                  : 'bg-amber-50 text-amber-500 border-amber-200 hover:border-amber-300'
              }`}
            >
              ✦ Luxe
            </button>
          </div>
        </Section>

        <Section title="Guest rating" badge={f.guestRating !== 'any' ? 1 : 0}>
          {[
            { id: 'any', label: 'Any rating' },
            { id: '6',   label: '6+  Good' },
            { id: '7',   label: '7+  Very Good' },
            { id: '8',   label: '8+  Excellent' },
          ].map(opt => (
            <RadioRow key={opt.id} label={opt.label}
              selected={f.guestRating === opt.id}
              onClick={() => upd('guestRating', opt.id)} />
          ))}
        </Section>

        <Section title="Property type" badge={f.propertyTypes.length}>
          {PROPERTY_TYPES.map(pt => (
            <CheckRow key={pt.id} label={pt.label} count={pt.count}
              checked={f.propertyTypes.includes(pt.id)}
              onChange={() => upd('propertyTypes', tog(f.propertyTypes, pt.id))} />
          ))}
        </Section>

        <Section title="Neighborhood" badge={f.neighborhoods.length}>
          {NEIGHBORHOODS.map(n => (
            <CheckRow key={n.id} label={n.label} count={n.count}
              checked={f.neighborhoods.includes(n.id)}
              onChange={() => upd('neighborhoods', tog(f.neighborhoods, n.id))} />
          ))}
        </Section>

        <Section title="Distance to center" badge={f.distances.length}>
          {DISTANCES.map(d => (
            <CheckRow key={d.id} label={d.label}
              checked={f.distances.includes(d.id)}
              onChange={() => upd('distances', tog(f.distances, d.id))} />
          ))}
        </Section>

        <Section title="Room amenities" badge={f.amenities.length}>
          {AMENITIES.map(a => (
            <CheckRow key={a.id} label={a.label}
              checked={f.amenities.includes(a.id)}
              onChange={() => upd('amenities', tog(f.amenities, a.id))} />
          ))}
        </Section>

        <Section title="Property facilities" badge={f.facilities.length}>
          {FACILITIES.map(fac => (
            <CheckRow key={fac.id} label={fac.label}
              checked={f.facilities.includes(fac.id)}
              onChange={() => upd('facilities', tog(f.facilities, fac.id))} />
          ))}
        </Section>

        <Section title="Special filters" badge={f.specials.length}>
          <div className="flex flex-wrap gap-2">
            {SPECIALS.map(sp => (
              <button key={sp.id}
                onClick={() => upd('specials', tog(f.specials, sp.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  f.specials.includes(sp.id)
                    ? 'bg-teal text-white border-teal shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-teal hover:text-teal-dark'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0 rounded-b-2xl">
        <button
          className="w-full flex items-center justify-center gap-2.5 text-white text-sm font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #1a3a6b 100%)' }}
        >
          Show {totalResults > 0 ? `${totalResults.toLocaleString()} ` : ''}results
          {active > 0 && (
            <span className="bg-teal text-navy text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-tight">
              {active} active
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES, flagEmoji } from '@/lib/visa-data';
import { analytics } from '@/lib/analytics';

const STYLES = [
  { id: 'beach',     label: 'Beach & Islands',   icon: 'beach_access' },
  { id: 'city',      label: 'City Breaks',        icon: 'location_city' },
  { id: 'culture',   label: 'Culture & History',  icon: 'museum' },
  { id: 'adventure', label: 'Adventure',          icon: 'hiking' },
  { id: 'nature',    label: 'Nature & Wildlife',  icon: 'forest' },
  { id: 'luxury',    label: 'Luxury Escapes',     icon: 'diamond' },
];

const REGIONS = [
  { id: 'sea',    label: 'Southeast Asia', icon: '🇹🇭' },
  { id: 'east',   label: 'East Asia',      icon: '🇯🇵' },
  { id: 'europe', label: 'Europe',         icon: '🇫🇷' },
  { id: 'middle', label: 'Middle East',    icon: '🇦🇪' },
  { id: 'aus',    label: 'Australia / NZ', icon: '🇦🇺' },
  { id: 'us',     label: 'Americas',       icon: '🇺🇸' },
];

const BUDGETS = [
  { id: 'budget',  label: 'Budget',    desc: 'Under $50/night',    icon: 'savings' },
  { id: 'mid',     label: 'Mid-range', desc: '$50–$150/night',     icon: 'payments' },
  { id: 'luxury',  label: 'Luxury',    desc: '$150+/night',        icon: 'diamond' },
];

const PREFS = [
  { key: 'deals', label: 'New hotel deals',      desc: 'Price drops and limited-time offers', icon: 'local_offer' },
  { key: 'hacks', label: 'Booking hacks & tips',  desc: 'Weekly travel saving tricks',         icon: 'tips_and_updates' },
] as const;

const STEP_LABELS = ['Style', 'Regions', 'Budget', 'Passport', 'Alerts'];
const STEP_ICONS  = ['flight', 'public', 'payments', 'badge', 'notifications'];

const PRO_TIPS = [
  "I always pick 2–3 styles, not just one — I layer deals across all of them so you don't miss a flash sale in a category you'd actually enjoy.",
  "Southeast Asia and Eastern Europe give the best luxury-per-dollar. If you're flexible, add a region you wouldn't normally consider — some of my best 5-star finds under $60/night came from there.",
  "Set your budget to what you'd normally pay, not your dream trip — I'll surface deals that beat that price for destinations you already care about.",
  "Dual citizen? Add both passports. Sometimes one gets you visa-free entry and the other unlocks a cheaper flight route — I do this myself before every trip.",
  "I personally review every deal alert before it goes out. Turn both on — the booking hacks alone have saved readers hundreds per trip.",
];

function StepHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-2">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
      </div>
      <h2 className="font-headline-md text-headline-md text-pro-navy">{title}</h2>
      <p className="text-on-surface-variant text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function ProTip({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-5 flex gap-4 items-start"
      style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-navy-light))' }}>
      <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-sky-blue flex-shrink-0">
        <Image src="/avi-profile.jpg" alt="Avi" fill sizes="44px" className="object-cover object-top" />
      </div>
      <div>
        <p className="text-sky-blue font-label-bold text-label-bold mb-1">Avi&apos;s Pro Tip</p>
        <p className="text-white/90 text-sm italic leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function CountryCombobox({ value, onChange, exclude = [], placeholder = 'Search your country…' }: {
  value: string;
  onChange: (code: string) => void;
  exclude?: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pool = COUNTRIES.filter(c => !exclude.includes(c.code));
  const filtered = query.length >= 1
    ? pool.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : pool.slice(0, 8);

  function select(code: string) {
    onChange(code);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="relative">
      <input ref={inputRef} type="text"
        value={open ? query : ''}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        placeholder={placeholder}
        className="w-full border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
      />
      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-border-subtle overflow-hidden z-50 max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-on-surface-variant">No countries found</li>
          ) : filtered.map(c => (
            <li key={c.code}
              onMouseDown={() => select(c.code)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface cursor-pointer">
              <span className="text-lg">{flagEmoji(c.code)}</span>
              <span className="text-sm font-semibold text-pro-navy">{c.name}</span>
              <span className="text-xs text-on-surface-variant ml-auto">{c.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]               = useState(0);
  const [styles, setStyles]           = useState<string[]>([]);
  const [regions, setRegions]         = useState<string[]>([]);
  const [budget, setBudget]           = useState('mid');
  const [trips, setTrips]             = useState(2);
  const [passports, setPassports]     = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);
  const [wantsDeals, setWantsDeals]   = useState(true);
  const [wantsHacks, setWantsHacks]   = useState(true);

  function toggleStyle(id: string) {
    setStyles(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  function toggleRegion(id: string) {
    setRegions(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id]);
  }

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.all([
        supabase.from('user_profiles').upsert({
          id: user.id,
          travel_styles: styles,
          preferred_regions: regions,
          budget_range: budget,
          trips_per_year: trips,
          passport_nationality: passports[0] || null,
          passport_nationalities: passports.length ? passports : null,
          onboarding_done: true,
        }),
        supabase.from('user_preferences').upsert({
          user_id: user.id,
          wants_deals: wantsDeals,
          wants_hacks: wantsHacks,
        }),
      ]);
    }
    analytics.onboardingComplete(styles.join(','), budget, trips, passports.length > 0);
    router.push('/');
    router.refresh();
  }

  async function saveAndExit() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        travel_styles: styles,
        preferred_regions: regions,
        budget_range: budget,
        trips_per_year: trips,
        passport_nationality: passports[0] || null,
        passport_nationalities: passports.length ? passports : null,
        onboarding_done: false,
      });
    }
    analytics.onboardingSkipped(step + 1);
    router.push('/');
    router.refresh();
  }

  const steps = [
    // Step 0 — travel style
    <div key="style" className="space-y-6">
      <StepHeader icon={STEP_ICONS[0]} title="What kind of traveller are you?" subtitle="Pick all that apply" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STYLES.map(s => {
          const active = styles.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggleStyle(s.id)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border-subtle hover:border-primary/50 text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-3xl">{s.icon}</span>
              <span className="font-metadata text-metadata font-bold text-center leading-tight">{s.label}</span>
            </button>
          );
        })}
      </div>
      <ProTip text={PRO_TIPS[0]} />
      <button onClick={() => setStep(1)} disabled={styles.length === 0}
        className="w-full py-3 rounded-xl font-bold text-white text-sm bg-primary disabled:opacity-40 transition-opacity hover:opacity-90">
        Next →
      </button>
    </div>,

    // Step 1 — regions
    <div key="region" className="space-y-6">
      <StepHeader icon={STEP_ICONS[1]} title="Where do you love to go?" subtitle="Pick your favourite regions" />
      <div className="flex flex-wrap gap-2">
        {REGIONS.map(r => {
          const active = regions.includes(r.id);
          return (
            <button key={r.id} onClick={() => toggleRegion(r.id)}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${active ? 'bg-primary text-white' : 'bg-white border border-border-subtle text-on-surface-variant hover:border-primary hover:text-primary'}`}>
              <span>{r.icon}</span>
              <span className="font-metadata text-metadata">{r.label}</span>
              <span className="material-symbols-outlined text-sm">{active ? 'close' : 'add'}</span>
            </button>
          );
        })}
      </div>
      <ProTip text={PRO_TIPS[1]} />
      <div className="flex gap-2">
        <button onClick={() => setStep(0)}
          className="flex-1 py-3 rounded-xl font-bold text-pro-navy text-sm border border-border-subtle hover:border-primary transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(2)} disabled={regions.length === 0}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-primary disabled:opacity-40 transition-opacity hover:opacity-90">
          Next →
        </button>
      </div>
    </div>,

    // Step 2 — budget + trips
    <div key="budget" className="space-y-6">
      <StepHeader icon={STEP_ICONS[2]} title="What's your travel budget?" subtitle="We'll highlight the best deals for you" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BUDGETS.map(b => {
          const active = budget === b.id;
          return (
            <button key={b.id} onClick={() => setBudget(b.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-primary bg-primary/5' : 'border-border-subtle hover:border-primary/50'}`}>
              <span className={`material-symbols-outlined text-2xl ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{b.icon}</span>
              <div>
                <div className={`text-sm font-bold ${active ? 'text-primary' : 'text-pro-navy'}`}>{b.label}</div>
                <div className="text-xs text-on-surface-variant">{b.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <label className="font-label-bold text-label-bold text-on-surface-variant">Trips per year</label>
        <div className="flex items-center gap-4">
          <button onClick={() => setTrips(t => Math.max(1, t - 1))}
            className="w-9 h-9 rounded-full border border-border-subtle hover:border-primary flex items-center justify-center text-pro-navy font-bold transition-colors">−</button>
          <span className="text-xl font-bold text-pro-navy w-6 text-center">{trips}</span>
          <button onClick={() => setTrips(t => Math.min(20, t + 1))}
            className="w-9 h-9 rounded-full border border-border-subtle hover:border-primary flex items-center justify-center text-pro-navy font-bold transition-colors">+</button>
        </div>
      </div>

      <ProTip text={PRO_TIPS[2]} />

      <div className="flex gap-2">
        <button onClick={() => setStep(1)}
          className="flex-1 py-3 rounded-xl font-bold text-pro-navy text-sm border border-border-subtle hover:border-primary transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(3)}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-primary transition-opacity hover:opacity-90">
          Next →
        </button>
      </div>
    </div>,

    // Step 3 — passport
    <div key="passport" className="space-y-6">
      <StepHeader icon={STEP_ICONS[3]} title="What passport do you travel on?" subtitle="Have two passports? Add both — we'll show the best entry option" />

      {/* Selected chips */}
      {passports.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {passports.map(code => (
            <div key={code} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/5 border border-primary text-primary">
              <span className="text-base">{flagEmoji(code)}</span>
              <span>{COUNTRIES.find(c => c.code === code)?.name}</span>
              <button type="button" onClick={() => setPassports(p => p.filter(x => x !== code))}
                className="ml-1 font-bold hover:opacity-60">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add combobox — hide when 2 selected */}
      {passports.length < 2 && (
        <CountryCombobox
          value=""
          exclude={passports}
          onChange={code => { if (code) setPassports(p => [...p, code]); }}
          placeholder={passports.length === 0 ? 'Search your country…' : '+ Add second passport'}
        />
      )}

      <ProTip text={PRO_TIPS[3]} />

      <div className="flex gap-2">
        <button onClick={() => setStep(2)}
          className="flex-1 py-3 rounded-xl font-bold text-pro-navy text-sm border border-border-subtle hover:border-primary transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(4)}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-primary transition-opacity hover:opacity-90">
          {passports.length > 0 ? 'Next →' : 'Skip for now →'}
        </button>
      </div>
    </div>,

    // Step 4 — notification preferences
    <div key="prefs" className="space-y-6">
      <StepHeader icon={STEP_ICONS[4]} title="What do you want to hear about?" subtitle="We'll only send what you care about" />
      <div className="space-y-3">
        {PREFS.map(opt => {
          const value = opt.key === 'deals' ? wantsDeals : wantsHacks;
          const set = opt.key === 'deals' ? setWantsDeals : setWantsHacks;
          return (
            <button key={opt.key} onClick={() => set(v => !v)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${value ? 'border-primary bg-primary/5' : 'border-border-subtle hover:border-primary/50'}`}>
              <span className={`material-symbols-outlined text-2xl ${value ? 'text-primary' : 'text-on-surface-variant'}`}>{opt.icon}</span>
              <div className="flex-1">
                <div className={`text-sm font-bold ${value ? 'text-primary' : 'text-pro-navy'}`}>{opt.label}</div>
                <div className="text-xs text-on-surface-variant">{opt.desc}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${value ? 'bg-primary border-primary' : 'border-border-subtle'}`}>
                {value && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
        <button onClick={() => { setWantsDeals(true); setWantsHacks(true); }}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${wantsDeals && wantsHacks ? 'border-primary bg-primary/5' : 'border-border-subtle hover:border-primary/50'}`}>
          <span className={`material-symbols-outlined text-2xl ${wantsDeals && wantsHacks ? 'text-primary' : 'text-on-surface-variant'}`}>auto_awesome</span>
          <div className="flex-1">
            <div className={`text-sm font-bold ${wantsDeals && wantsHacks ? 'text-primary' : 'text-pro-navy'}`}>Both <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-1">Recommended</span></div>
            <div className="text-xs text-on-surface-variant">Get the full CheapStay experience</div>
          </div>
        </button>
      </div>

      <ProTip text={PRO_TIPS[4]} />

      <div className="flex gap-2">
        <button onClick={() => setStep(3)}
          className="flex-1 py-3 rounded-xl font-bold text-pro-navy text-sm border border-border-subtle hover:border-primary transition-colors">
          ← Back
        </button>
        <button onClick={finish} disabled={saving}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-primary disabled:opacity-60 transition-opacity hover:opacity-90">
          {saving ? 'Saving…' : 'Start exploring 🚀'}
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-surface px-4 sm:px-gutter py-10 sm:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Image src="/logo.png" alt="Cheapstay" width={120} height={32} className="h-8 w-auto" style={{ width: 'auto' }} />
          <button onClick={saveAndExit} disabled={saving}
            className="font-label-bold text-label-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save & Exit'}
          </button>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">Step {step + 1} of 5</p>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i <= step ? 'text-white' : 'bg-surface-container text-on-surface-variant'}`}
                  style={i <= step ? { background: 'var(--color-primary)' } : {}}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-semibold hidden sm:block ${i === step ? 'text-pro-navy' : 'text-on-surface-variant'}`}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${i < step ? 'bg-primary' : 'bg-border-subtle'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-border-subtle">
          {steps[step]}
        </div>
      </div>
    </div>
  );
}

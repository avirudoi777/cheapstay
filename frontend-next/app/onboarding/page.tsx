'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const STYLES = [
  { id: 'beach',     label: 'Beach & Islands', icon: '🏖️' },
  { id: 'city',      label: 'City Breaks',     icon: '🏙️' },
  { id: 'culture',   label: 'Culture & History', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure',        icon: '🏔️' },
  { id: 'nature',    label: 'Nature & Wildlife', icon: '🌿' },
  { id: 'luxury',    label: 'Luxury Escapes',   icon: '✨' },
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
  { id: 'budget',  label: 'Budget',    desc: 'Under $50/night',    icon: '💚' },
  { id: 'mid',     label: 'Mid-range', desc: '$50–$150/night',     icon: '💛' },
  { id: 'luxury',  label: 'Luxury',    desc: '$150+/night',        icon: '💎' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [styles, setStyles]       = useState<string[]>([]);
  const [regions, setRegions]     = useState<string[]>([]);
  const [budget, setBudget]       = useState('mid');
  const [trips, setTrips]         = useState(2);
  const [saving, setSaving]       = useState(false);
  const [wantsDeals, setWantsDeals] = useState(true);
  const [wantsHacks, setWantsHacks] = useState(true);

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
          onboarding_done: true,
        }),
        supabase.from('user_preferences').upsert({
          user_id: user.id,
          wants_deals: wantsDeals,
          wants_hacks: wantsHacks,
        }),
      ]);
    }
    router.push('/');
    router.refresh();
  }

  const steps = [
    // Step 0 — travel style
    <div key="style" className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-3">✈️</div>
        <h2 className="text-xl font-bold text-navy">What kind of traveller are you?</h2>
        <p className="text-gray-400 text-sm mt-1">Pick all that apply</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map(s => (
          <button key={s.id} onClick={() => toggleStyle(s.id)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${styles.includes(s.id) ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-teal/50'}`}>
            <span className="text-2xl">{s.icon}</span>
            <span className={`text-sm font-semibold ${styles.includes(s.id) ? 'text-teal-dark' : 'text-navy'}`}>{s.label}</span>
          </button>
        ))}
      </div>
      <button onClick={() => setStep(1)} disabled={styles.length === 0}
        className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
        Next →
      </button>
    </div>,

    // Step 1 — regions
    <div key="region" className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-3">🌍</div>
        <h2 className="text-xl font-bold text-navy">Where do you love to go?</h2>
        <p className="text-gray-400 text-sm mt-1">Pick your favourite regions</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {REGIONS.map(r => (
          <button key={r.id} onClick={() => toggleRegion(r.id)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${regions.includes(r.id) ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-teal/50'}`}>
            <span className="text-2xl">{r.icon}</span>
            <span className={`text-sm font-semibold ${regions.includes(r.id) ? 'text-teal-dark' : 'text-navy'}`}>{r.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setStep(0)}
          className="flex-1 py-3 rounded-xl font-bold text-navy text-sm border border-gray-200 hover:border-teal transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(2)} disabled={regions.length === 0}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
          Next →
        </button>
      </div>
    </div>,

    // Step 2 — budget + trips
    <div key="budget" className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-3">💰</div>
        <h2 className="text-xl font-bold text-navy">What&apos;s your travel budget?</h2>
        <p className="text-gray-400 text-sm mt-1">We&apos;ll highlight the best deals for you</p>
      </div>
      <div className="space-y-2">
        {BUDGETS.map(b => (
          <button key={b.id} onClick={() => setBudget(b.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${budget === b.id ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-teal/50'}`}>
            <span className="text-2xl">{b.icon}</span>
            <div>
              <div className={`text-sm font-bold ${budget === b.id ? 'text-teal-dark' : 'text-navy'}`}>{b.label}</div>
              <div className="text-xs text-gray-400">{b.desc}</div>
            </div>
            {budget === b.id && (
              <div className="ml-auto w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">How many trips per year?</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setTrips(t => Math.max(1, t - 1))}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-teal flex items-center justify-center text-navy font-bold transition-colors">−</button>
          <span className="text-2xl font-bold text-navy w-8 text-center">{trips}</span>
          <button onClick={() => setTrips(t => Math.min(20, t + 1))}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-teal flex items-center justify-center text-navy font-bold transition-colors">+</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setStep(1)}
          className="flex-1 py-3 rounded-xl font-bold text-navy text-sm border border-gray-200 hover:border-teal transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(3)}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
          Next →
        </button>
      </div>
    </div>,

    // Step 3 — notification preferences
    <div key="prefs" className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-3">🔔</div>
        <h2 className="text-xl font-bold text-navy">What do you want to hear about?</h2>
        <p className="text-gray-400 text-sm mt-1">We&apos;ll only send what you care about</p>
      </div>
      <div className="space-y-3">
        {[
          { key: 'deals', label: 'New hotel deals', desc: 'Price drops and limited-time offers', icon: '🏨', value: wantsDeals, set: setWantsDeals },
          { key: 'hacks', label: 'Booking hacks & tips', desc: 'Weekly travel saving tricks', icon: '💡', value: wantsHacks, set: setWantsHacks },
        ].map(opt => (
          <button key={opt.key} onClick={() => opt.set(v => !v)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${opt.value ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-teal/50'}`}>
            <span className="text-2xl">{opt.icon}</span>
            <div className="flex-1">
              <div className={`text-sm font-bold ${opt.value ? 'text-teal-dark' : 'text-navy'}`}>{opt.label}</div>
              <div className="text-xs text-gray-400">{opt.desc}</div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${opt.value ? 'bg-teal border-teal' : 'border-gray-300'}`}>
              {opt.value && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
        <button onClick={() => { setWantsDeals(true); setWantsHacks(true); }}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${wantsDeals && wantsHacks ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-teal/50'}`}>
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <div className={`text-sm font-bold ${wantsDeals && wantsHacks ? 'text-teal-dark' : 'text-navy'}`}>Both <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal/10 text-teal ml-1">Recommended</span></div>
            <div className="text-xs text-gray-400">Get the full CheapStay experience</div>
          </div>
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setStep(2)}
          className="flex-1 py-3 rounded-xl font-bold text-navy text-sm border border-gray-200 hover:border-teal transition-colors">
          ← Back
        </button>
        <button onClick={finish} disabled={saving}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
          {saving ? 'Saving…' : 'Start exploring 🚀'}
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/logo.png" alt="Cheapstay" width={120} height={32} className="h-8 w-auto mx-auto mb-4" />
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-teal' : i < step ? 'w-6 bg-teal/40' : 'w-6 bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Step {step + 1} of 4</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {steps[step]}
        </div>
      </div>
    </div>
  );
}

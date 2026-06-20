'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { COUNTRIES, flagEmoji } from '@/lib/visa-data';

const STYLES = [
  { id: 'beach',     label: 'Beach & Islands',   icon: '🏖️' },
  { id: 'city',      label: 'City Breaks',        icon: '🏙️' },
  { id: 'culture',   label: 'Culture & History',  icon: '🏛️' },
  { id: 'adventure', label: 'Adventure',           icon: '🏔️' },
  { id: 'nature',    label: 'Nature & Wildlife',  icon: '🌿' },
  { id: 'luxury',    label: 'Luxury Escapes',     icon: '✨' },
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
  { id: 'budget', label: 'Budget',    desc: 'Under $50/night',  icon: '💚' },
  { id: 'mid',    label: 'Mid-range', desc: '$50–$150/night',   icon: '💛' },
  { id: 'luxury', label: 'Luxury',    desc: '$150+/night',      icon: '💎' },
];

export default function AccountPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser]           = useState<User | null>(null);
  const [displayName, setName]    = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [styles, setStyles]       = useState<string[]>([]);
  const [regions, setRegions]     = useState<string[]>([]);
  const [budget, setBudget]       = useState('mid');
  const [trips, setTrips]         = useState(2);
  const [passport, setPassport]   = useState('');
  const [passportQ, setPassportQ] = useState('');
  const [passportOpen, setPassportOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUser(data.user);
      const meta = data.user.user_metadata;
      setName(meta?.full_name || meta?.name || '');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        setStyles(profile.travel_styles || []);
        setRegions(profile.preferred_regions || []);
        setBudget(profile.budget_range || 'mid');
        setTrips(profile.trips_per_year || 2);
        setAvatarUrl(profile.avatar_url || meta?.avatar_url || '');
        if (profile.passport_nationality) {
          setPassport(profile.passport_nationality);
          const c = COUNTRIES.find(x => x.code === profile.passport_nationality);
          if (c) setPassportQ(c.name);
        }
      } else {
        setAvatarUrl(meta?.avatar_url || '');
      }
    });
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError('');
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError('Upload failed: ' + uploadError.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithBust = publicUrl + '?t=' + Date.now();
      setAvatarUrl(urlWithBust);
      const { error: dbError } = await supabase.from('user_profiles').upsert({ id: user.id, avatar_url: publicUrl });
      if (dbError) setError('Save failed: ' + dbError.message);
    }
    e.target.value = '';
    setUploading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl.split('?')[0] || null,
      travel_styles: styles,
      preferred_regions: regions,
      budget_range: budget,
      trips_per_year: trips,
      passport_nationality: passport || null,
      onboarding_done: true,
    });
    await supabase.auth.updateUser({ data: { full_name: displayName } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleStyle(id: string) {
    setStyles(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  function toggleRegion(id: string) {
    setRegions(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id]);
  }

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header banner */}
      <div className="h-28 w-full" style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #00C9B1 100%)' }} />

      <div className="max-w-2xl mx-auto px-4 -mt-14">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-gradient-to-br from-teal to-blue-500 flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white text-2xl font-bold">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal text-white shadow flex items-center justify-center hover:bg-teal-dark transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + email */}
            <div className="flex-1 pb-1">
              <p className="text-xs text-gray-400 mb-1 font-medium">DISPLAY NAME</p>
              <input
                value={displayName}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full text-lg font-bold text-navy bg-transparent border-b-2 border-gray-100 focus:border-teal focus:outline-none pb-0.5 transition-colors"
              />
              <p className="text-sm text-gray-400 mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Passport */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
            <span>🛂</span> Passport nationality
          </h3>
          <p className="text-xs text-gray-400 mb-3">Used to show visa and vaccination requirements when you search</p>
          <div className="relative">
            <div className="relative">
              {passport && !passportOpen && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                  {flagEmoji(passport)}
                </span>
              )}
              <input type="text"
                value={passportOpen ? passportQ : (passport ? (COUNTRIES.find(c => c.code === passport)?.name ?? passportQ) : passportQ)}
                onFocus={() => { setPassportOpen(true); setPassportQ(''); }}
                onBlur={() => setTimeout(() => setPassportOpen(false), 150)}
                onChange={e => { setPassportQ(e.target.value); setPassportOpen(true); }}
                placeholder="Search your country..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-colors"
                style={{ paddingLeft: passport && !passportOpen ? '2.5rem' : '1rem' }}
              />
            </div>
            {passportOpen && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-48 overflow-y-auto">
                {(passportQ.length >= 1
                  ? COUNTRIES.filter(c => c.name.toLowerCase().includes(passportQ.toLowerCase())).slice(0, 8)
                  : COUNTRIES.slice(0, 8)
                ).map(c => (
                  <li key={c.code}
                    onMouseDown={() => { setPassport(c.code); setPassportQ(c.name); setPassportOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer list-none">
                    <span className="text-lg">{flagEmoji(c.code)}</span>
                    <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{c.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Travel style */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span>✈️</span> Travel style
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLES.map(s => (
              <button key={s.id} onClick={() => toggleStyle(s.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${styles.includes(s.id) ? 'border-teal bg-teal/5' : 'border-gray-100 hover:border-teal/40'}`}>
                <span className="text-xl">{s.icon}</span>
                <span className={`text-xs font-semibold leading-tight ${styles.includes(s.id) ? 'text-teal-dark' : 'text-navy'}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span>🌍</span> Favourite regions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REGIONS.map(r => (
              <button key={r.id} onClick={() => toggleRegion(r.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${regions.includes(r.id) ? 'border-teal bg-teal/5' : 'border-gray-100 hover:border-teal/40'}`}>
                <span className="text-xl">{r.icon}</span>
                <span className={`text-xs font-semibold ${regions.includes(r.id) ? 'text-teal-dark' : 'text-navy'}`}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget + trips */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <span>💰</span> Budget & frequency
          </h3>
          <div className="space-y-2 mb-5">
            {BUDGETS.map(b => (
              <button key={b.id} onClick={() => setBudget(b.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${budget === b.id ? 'border-teal bg-teal/5' : 'border-gray-100 hover:border-teal/40'}`}>
                <span className="text-xl">{b.icon}</span>
                <div className="flex-1">
                  <div className={`text-sm font-bold ${budget === b.id ? 'text-teal-dark' : 'text-navy'}`}>{b.label}</div>
                  <div className="text-xs text-gray-400">{b.desc}</div>
                </div>
                {budget === b.id && (
                  <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Trips per year</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setTrips(t => Math.max(1, t - 1))}
                className="w-9 h-9 rounded-full border border-gray-200 hover:border-teal flex items-center justify-center text-navy font-bold transition-colors">−</button>
              <span className="text-2xl font-bold text-navy w-8 text-center">{trips}</span>
              <button onClick={() => setTrips(t => Math.min(20, t + 1))}
                className="w-9 h-9 rounded-full border border-gray-200 hover:border-teal flex items-center justify-center text-navy font-bold transition-colors">+</button>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 shadow-md"
          style={{ background: saved ? '#00C9B1' : 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>

        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-navy transition-colors">← Back to search</Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { COUNTRIES, flagEmoji } from '@/lib/visa-data';

interface TravPassport {
  id: string;
  country: string;
  label: string;
  passportNumber: string;
  passportExpiry: string;
}

interface CompanionData {
  id: string;
  nickname: string;
  title: string;
  givenName: string;
  familyName: string;
  gender: string;
  bornOn: string;
  phone: string;
  passports: TravPassport[];
  isChild?: boolean;
}

const EMPTY_COMPANION: CompanionData = {
  id: '', nickname: '', title: 'mr', givenName: '', familyName: '',
  gender: 'm', bornOn: '', phone: '', passports: [], isChild: false,
};

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
  const [addPassportQ, setAddQ]         = useState('');
  const [addPassportOpen, setAddOpen]   = useState(false);
  const [expandedPassportId, setExpandedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  // Traveler profile — personal info
  const [givenName, setGivenName]     = useState('');
  const [familyName, setFamilyName]   = useState('');
  const [travTitle, setTravTitle]     = useState('mr');
  const [travGender, setTravGender]   = useState('m');
  const [bornOn, setBornOn]           = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // Traveler profile — passports (up to 3)
  const [travPassports, setTravPassports] = useState<TravPassport[]>([]);
  // Travel companions
  const [companions, setCompanions] = useState<CompanionData[]>([]);
  const [companionForm, setCompanionForm] = useState<CompanionData | null>(null); // null = closed, {} = add new
  // Delete account
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
      } else {
        setAvatarUrl(meta?.avatar_url || '');
      }

      // Build legacy passport list from existing nationality data
      const legacyCodes: string[] = profile?.passport_nationalities?.length
        ? profile.passport_nationalities
        : profile?.passport_nationality ? [profile.passport_nationality] : [];
      const legacyPassports = legacyCodes.slice(0, 3).map((code: string) => ({
        id: code + '_legacy', country: code, label: code, passportNumber: '', passportExpiry: '',
      }));

      // Load traveler profile (sensitive fields decrypted server-side)
      try {
        const tpRes = await fetch('/api/profile/traveler');
        if (tpRes.ok) {
          const tp = await tpRes.json();
          if (tp.givenName)  setGivenName(tp.givenName);
          if (tp.familyName) setFamilyName(tp.familyName);
          if (tp.title)      setTravTitle(tp.title);
          if (tp.gender)     setTravGender(tp.gender);
          if (tp.bornOn)     setBornOn(tp.bornOn);
          if (tp.phone)      setPhoneNumber(tp.phone);
          // Use saved passports if available, otherwise fall back to legacy nationality chips
          setTravPassports(tp.passports?.length ? tp.passports : legacyPassports);
          if (tp.companions?.length) setCompanions(tp.companions);
        } else {
          // API unavailable (traveler_profile column may not exist yet) — load legacy
          if (legacyPassports.length) setTravPassports(legacyPassports);
        }
      } catch {
        if (legacyPassports.length) setTravPassports(legacyPassports);
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
    setError('');
    const supabase = createClient();

    const nationalities = travPassports.filter(p => p.country).map(p => p.country);
    const payload: Record<string, unknown> = {
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl.split('?')[0] || null,
      travel_styles: styles,
      preferred_regions: regions,
      budget_range: budget,
      trips_per_year: trips,
      onboarding_done: true,
    };
    // Only write nationality fields if we actually have passport data — never null out existing data
    if (nationalities.length) {
      payload.passport_nationality = nationalities[0];
      payload.passport_nationalities = nationalities;
    }

    const { error: upsertError } = await supabase.from('user_profiles').upsert(payload);

    if (upsertError) {
      if (upsertError.message.includes('passport_nationalities')) {
        const { error: fallbackError } = await supabase.from('user_profiles').upsert({
          ...payload, passport_nationalities: undefined,
        });
        if (fallbackError) { setError(fallbackError.message); setSaving(false); return; }
      } else {
        setError(upsertError.message);
        setSaving(false);
        return;
      }
    }

    // Save traveler profile (encrypted fields handled server-side)
    try {
      const tpSaveRes = await fetch('/api/profile/traveler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: travTitle, givenName, familyName, gender: travGender,
          bornOn, phone: phoneNumber, passports: travPassports, companions,
        }),
      });
      if (!tpSaveRes.ok) {
        const tpErr = await tpSaveRes.json().catch(() => ({}));
        // If column doesn't exist yet, show a helpful reminder
        if (tpErr.error?.includes('traveler_profile') || tpErr.error?.includes('column')) {
          setError('Run the Supabase migration first: ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS traveler_profile JSONB;');
          setSaving(false); return;
        }
        if (tpErr.error) { setError('Flight profile: ' + tpErr.error); setSaving(false); return; }
      }
    } catch {
      // Silently ignore network errors for the secondary save — main profile already saved
    }

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

        {/* Passports — combined nationality + flight details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
            <span>🛂</span> Passports
          </h3>
          <p className="text-xs text-gray-400 mb-4">Click a passport to add your number — used for visa checks and auto-fills booking forms</p>

          {/* Passport cards */}
          <div className="space-y-2 mb-3">
            {travPassports.map(p => {
              const country = COUNTRIES.find(c => c.code === p.country);
              const isOpen = expandedPassportId === p.id;
              return (
                <div key={p.id} className="rounded-2xl border overflow-hidden transition-all"
                  style={{ borderColor: isOpen ? '#1D9E75' : '#E5E7EB' }}>
                  {/* Header row — always visible */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    style={{ background: isOpen ? '#F0FBF7' : '#FAFAFA' }}
                    onClick={() => setExpandedId(isOpen ? null : p.id)}>
                    <span className="text-2xl flex-shrink-0">{flagEmoji(p.country)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{country?.name ?? p.country}</p>
                      {p.passportNumber
                        ? <p className="text-[11px] text-gray-400">···{p.passportNumber.slice(-4)} · Exp {p.passportExpiry || 'N/A'}</p>
                        : <p className="text-[11px] text-teal-600 font-medium">Tap to add passport number →</p>
                      }
                    </div>
                    <span className="text-xs text-gray-400">{isOpen ? '▲' : '▼'}</span>
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setTravPassports(ps => ps.filter(x => x.id !== p.id)); if (isOpen) setExpandedId(null); }}
                      className="text-gray-300 hover:text-red-400 transition-colors font-bold text-base leading-none ml-1">
                      ×
                    </button>
                  </div>
                  {/* Expandable detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t space-y-3" style={{ borderColor: '#D1FAE5' }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Passport number</label>
                          <input value={p.passportNumber}
                            onChange={e => setTravPassports(ps => ps.map(x => x.id === p.id ? { ...x, passportNumber: e.target.value.toUpperCase() } : x))}
                            placeholder="AB1234567"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 font-mono uppercase" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Expiry date</label>
                          <input type="date" value={p.passportExpiry}
                            onChange={e => setTravPassports(ps => ps.map(x => x.id === p.id ? { ...x, passportExpiry: e.target.value } : x))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400">🔒 Passport number stored encrypted · saved when you click Save changes below</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add passport country search */}
          {travPassports.length < 3 && (
            <div className="relative">
              <input type="text"
                value={addPassportOpen ? addPassportQ : ''}
                onFocus={() => { setAddOpen(true); setAddQ(''); }}
                onBlur={() => setTimeout(() => setAddOpen(false), 150)}
                onChange={e => { setAddQ(e.target.value); setAddOpen(true); }}
                placeholder={travPassports.length === 0 ? '+ Add your passport country…' : '+ Add another passport'}
                className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-colors text-gray-500 bg-gray-50"
              />
              {addPassportOpen && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-48 overflow-y-auto">
                  {(addPassportQ.length >= 1
                    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(addPassportQ.toLowerCase()) && !travPassports.find(p => p.country === c.code)).slice(0, 8)
                    : COUNTRIES.filter(c => !travPassports.find(p => p.country === c.code)).slice(0, 8)
                  ).map(c => (
                    <li key={c.code}
                      onMouseDown={() => {
                        const newId = c.code + '_' + Date.now();
                        setTravPassports(ps => [...ps, { id: newId, country: c.code, label: c.name, passportNumber: '', passportExpiry: '' }]);
                        setExpandedId(newId);
                        setAddQ(''); setAddOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer list-none">
                      <span className="text-lg">{flagEmoji(c.code)}</span>
                      <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{c.code}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Flight profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
            <span>🪪</span> Flight profile
          </h3>
          <p className="text-xs text-gray-400 mb-4">Fill once — auto-fills the booking form when you search for flights</p>

          {/* Personal info */}
          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                <select value={travTitle} onChange={e => setTravTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 appearance-none">
                  <option value="mr">Mr</option><option value="ms">Ms</option>
                  <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                <select value={travGender} onChange={e => setTravGender(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 appearance-none">
                  <option value="m">Male</option><option value="f">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">First name</label>
                <input value={givenName} onChange={e => setGivenName(e.target.value)}
                  placeholder="As on passport"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Last name</label>
                <input value={familyName} onChange={e => setFamilyName(e.target.value)}
                  placeholder="As on passport"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date of birth</label>
              <input type="date" value={bornOn} onChange={e => setBornOn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone (with country code)</label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
          </div>

        </div>

        {/* Travel companions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
            <span>👨‍👩‍👧</span> Travel companions
          </h3>
          <p className="text-xs text-gray-400 mb-4">Save profiles for family members or frequent travel partners — auto-fills their details during booking</p>

          {companions.length > 0 && (
            <div className="space-y-2 mb-3">
              {companions.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-sm font-bold text-teal flex-shrink-0">
                    {(c.givenName[0] || c.nickname[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{c.givenName} {c.familyName}</p>
                      {c.isChild && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">Child</span>}
                    </div>
                    {c.nickname && c.nickname !== `${c.givenName} ${c.familyName}`.trim() && (
                      <p className="text-xs text-gray-400">{c.nickname}</p>
                    )}
                    {c.bornOn && <p className="text-xs text-gray-400">{new Date(c.bornOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  </div>
                  <button onClick={() => setCompanionForm({ ...c })}
                    className="text-xs text-teal font-semibold px-2 py-1 rounded-lg hover:bg-teal/5 transition">Edit</button>
                  <button onClick={() => setCompanions(prev => prev.filter(x => x.id !== c.id))}
                    className="text-xs text-red-400 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition">Remove</button>
                </div>
              ))}
            </div>
          )}

          {companionForm !== null ? (
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-3">
              <p className="text-xs font-bold text-teal uppercase tracking-wide">{companionForm.id ? 'Edit companion' : 'Add companion'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                  <select value={companionForm.title} onChange={e => setCompanionForm(f => f && ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 appearance-none">
                    <option value="mr">Mr</option><option value="ms">Ms</option>
                    <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                  <select value={companionForm.gender} onChange={e => setCompanionForm(f => f && ({ ...f, gender: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 appearance-none">
                    <option value="m">Male</option><option value="f">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">First name</label>
                  <input value={companionForm.givenName} onChange={e => setCompanionForm(f => f && ({ ...f, givenName: e.target.value }))}
                    placeholder="As on passport"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Last name</label>
                  <input value={companionForm.familyName} onChange={e => setCompanionForm(f => f && ({ ...f, familyName: e.target.value }))}
                    placeholder="As on passport"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date of birth</label>
                <input type="date" value={companionForm.bornOn} onChange={e => setCompanionForm(f => f && ({ ...f, bornOn: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input type="checkbox" checked={!!companionForm.isChild}
                    onChange={e => setCompanionForm(f => f && ({ ...f, isChild: e.target.checked }))}
                    className="sr-only" />
                  <div className={`w-10 h-6 rounded-full transition-colors ${companionForm.isChild ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${companionForm.isChild ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">This is a child</p>
                  <p className="text-xs text-gray-400">Marks this traveller as a child passenger (under 12) during booking</p>
                </div>
              </label>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone (optional)</label>
                <input type="tel" value={companionForm.phone} onChange={e => setCompanionForm(f => f && ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => {
                  if (!companionForm.givenName || !companionForm.familyName) return;
                  const id = companionForm.id || crypto.randomUUID();
                  const updated = { ...companionForm, id, nickname: companionForm.nickname || `${companionForm.givenName} ${companionForm.familyName}`.trim() };
                  setCompanions(prev => {
                    const idx = prev.findIndex(c => c.id === id);
                    return idx >= 0 ? prev.map(c => c.id === id ? updated : c) : [...prev, updated];
                  });
                  setCompanionForm(null);
                }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: '#1D9E75' }}>
                  Save companion
                </button>
                <button onClick={() => setCompanionForm(null)}
                  className="py-2 px-4 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCompanionForm({ ...EMPTY_COMPANION })}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:border-teal hover:text-teal transition">
              + Add companion
            </button>
          )}
          <p className="text-xs text-gray-400 mt-3 text-center">Companions are saved when you click &quot;Save changes&quot; below</p>
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

        {/* Danger zone */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h3 className="text-sm font-bold text-red-600 mb-1">Danger zone</h3>
          <p className="text-xs text-gray-400 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
          <button onClick={() => setDeleteModal(true)}
            className="w-full py-2.5 rounded-xl border border-red-300 text-sm font-semibold text-red-500 hover:bg-red-50 transition">
            Delete my account
          </button>
        </div>

        {/* Delete confirmation modal */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-gray-900 text-center mb-2">Delete account?</h4>
              <p className="text-sm text-gray-500 text-center mb-5">This will permanently delete your account, profile, and all booking history. There is no undo.</p>
              {deleteError && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{deleteError}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setDeleteModal(false); setDeleteError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={async () => {
                  setDeleting(true); setDeleteError('');
                  try {
                    const res = await fetch('/api/account/delete', { method: 'DELETE' });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  } catch (e) {
                    setDeleteError(e instanceof Error ? e.message : 'Something went wrong');
                    setDeleting(false);
                  }
                }} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting…</> : 'Yes, delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

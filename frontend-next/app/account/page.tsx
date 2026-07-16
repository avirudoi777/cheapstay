'use client';
import { useState, useEffect, useRef } from 'react';
import DatePicker from '@/components/DatePicker';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { COUNTRIES, flagEmoji } from '@/lib/visa-data';
import PhoneInput from '@/components/PhoneInput';

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

function passportExpiryStatus(expiry: string): 'expired' | 'soon' | 'ok' | 'none' {
  if (!expiry) return 'none';
  const exp = new Date(expiry + 'T12:00:00');
  const now = new Date();
  if (exp < now) return 'expired';
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (exp <= sixMonths) return 'soon';
  return 'ok';
}

const EMPTY_COMPANION: CompanionData = {
  id: '', nickname: '', title: 'mr', givenName: '', familyName: '',
  gender: 'm', bornOn: '', phone: '', passports: [], isChild: false,
};

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
  { id: 'budget', label: 'Budget',    desc: 'Under $50/night', icon: 'savings' },
  { id: 'mid',    label: 'Mid-range', desc: '$50–$150/night',  icon: 'payments' },
  { id: 'luxury', label: 'Luxury',    desc: '$150+/night',     icon: 'diamond' },
];

export default function AccountPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const addPassportRef = useRef<HTMLInputElement>(null);

  const [user, setUser]           = useState<User | null>(null);
  const [displayName, setName]    = useState('');
  // Read cached avatar immediately so it shows before getUser() resolves
  const [avatarUrl, setAvatarUrl] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('cs_avatar') || '') : ''
  );
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
  const [travLoading, setTravLoading] = useState(true);
  // Delete account
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    // getSession() reads from local storage/cookies — near-instant, no server round-trip.
    // Use it to show avatar & name before getUser() (which verifies via server) completes.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const meta = session.user.user_metadata;
      if (meta?.full_name || meta?.name) setName(meta.full_name || meta.name || '');
      const metaAvatar = meta?.avatar_url || '';
      if (metaAvatar) { setAvatarUrl(metaAvatar); localStorage.setItem('cs_avatar', metaAvatar); }
    });

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUser(data.user);
      const meta = data.user.user_metadata;
      setName(meta?.full_name || meta?.name || '');
      const metaAvatar = meta?.avatar_url || '';
      if (metaAvatar) { setAvatarUrl(metaAvatar); localStorage.setItem('cs_avatar', metaAvatar); }

      // Fetch both in parallel — cuts load time roughly in half
      const [{ data: profile }, tpRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', data.user.id).single(),
        fetch('/api/profile/traveler').catch(() => null),
      ]);

      if (profile) {
        setStyles(profile.travel_styles || []);
        setRegions(profile.preferred_regions || []);
        setBudget(profile.budget_range || 'mid');
        setTrips(profile.trips_per_year || 2);
        // Override with custom avatar from Supabase storage if set
        if (profile.avatar_url) { setAvatarUrl(profile.avatar_url); localStorage.setItem('cs_avatar', profile.avatar_url); }
      }

      // Build legacy passport list from existing nationality data
      const legacyCodes: string[] = profile?.passport_nationalities?.length
        ? profile.passport_nationalities
        : profile?.passport_nationality ? [profile.passport_nationality] : [];
      const legacyPassports = legacyCodes.slice(0, 3).map((code: string) => ({
        id: code + '_legacy', country: code, label: code, passportNumber: '', passportExpiry: '',
      }));

      // Process traveler profile (sensitive fields decrypted server-side)
      try {
        if (tpRes?.ok) {
          const tp = await tpRes.json();
          if (tp.givenName)  setGivenName(tp.givenName);
          if (tp.familyName) setFamilyName(tp.familyName);
          if (tp.title)      setTravTitle(tp.title);
          if (tp.gender)     setTravGender(tp.gender);
          if (tp.bornOn)     setBornOn(tp.bornOn);
          if (tp.phone)      setPhoneNumber(tp.phone);
          setTravPassports(tp.passports?.length ? tp.passports : legacyPassports);
          if (tp.companions?.length) setCompanions(tp.companions);
        } else {
          if (legacyPassports.length) setTravPassports(legacyPassports);
        }
      } catch {
        if (legacyPassports.length) setTravPassports(legacyPassports);
      }
      setTravLoading(false);
    });
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Show local preview immediately — no waiting for upload
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
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
      setAvatarUrl('');
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithBust = publicUrl + '?t=' + Date.now();
      setAvatarUrl(urlWithBust);
      localStorage.setItem('cs_avatar', urlWithBust);
      const { error: dbError } = await supabase.from('user_profiles').upsert({ id: user.id, avatar_url: urlWithBust });
      if (dbError) setError('Save failed: ' + dbError.message);
    }
    URL.revokeObjectURL(localPreview);
    e.target.value = '';
    setUploading(false);
  }

  async function handleSave() {
    if (!user) return;
    setError('');
    // Block save if any passport with a number has an expired expiry date
    const expiredPassports = travPassports.filter(p => p.passportNumber && p.passportExpiry && passportExpiryStatus(p.passportExpiry) === 'expired');
    if (expiredPassports.length > 0) {
      const names = expiredPassports.map(p => COUNTRIES.find(c => c.code === p.country)?.name ?? p.country).join(', ');
      setError(`Passport expired: ${names}. Please update the expiry date or remove it before saving.`);
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const nationalities = travPassports.filter(p => p.country).map(p => p.country);
    const payload: Record<string, unknown> = {
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl || null,
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
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

  const EXPIRY_TOKENS: Record<'expired' | 'soon' | 'ok', { border: string; bg: string; badgeBg: string; badgeText: string }> = {
    expired: { border: 'var(--color-error)',         bg: 'rgba(186,26,26,0.05)',   badgeBg: 'rgba(186,26,26,0.1)',   badgeText: 'var(--color-error)' },
    soon:    { border: 'var(--color-alert-orange)',  bg: 'rgba(249,115,22,0.05)',  badgeBg: 'rgba(249,115,22,0.1)',  badgeText: 'var(--color-alert-orange)' },
    ok:      { border: 'var(--color-border-subtle)', bg: '#ffffff',                badgeBg: 'rgba(34,197,94,0.1)',   badgeText: 'var(--color-savings-green)' },
  };

  return (
    <div className="min-h-screen bg-surface-container-low pb-section-gap">
      <div className="max-w-container-max mx-auto px-4 sm:px-gutter pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

          {/* Side navigation */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-border-subtle sticky top-24">
              <nav className="flex flex-col gap-1">
                <span className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary font-bold">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  <span className="font-body-md text-body-md">My Profile</span>
                </span>
                <Link href="/bookings" className="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">confirmation_number</span>
                  <span className="font-body-md text-body-md">My Bookings</span>
                </Link>
                <div className="h-px bg-border-subtle my-2" />
                <button onClick={handleSignOut} className="flex items-center gap-3 p-3 rounded-lg text-error hover:bg-error/5 transition-colors text-left">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-body-md text-body-md">Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-8">

            {/* Profile header */}
            <section className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-border-subtle">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-primary/20 shadow-md overflow-hidden bg-gradient-to-br from-primary to-tertiary flex items-center justify-center relative">
                    <span className="text-white text-2xl font-bold absolute select-none">{initials}</span>
                    {avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover absolute inset-0 transition-opacity duration-150"
                        style={{ opacity: 0 }}
                        referrerPolicy="no-referrer"
                        ref={el => { if (el?.complete && el.naturalHeight > 0) el.style.opacity = '1'; }}
                        onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                        onError={() => setAvatarUrl('')}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-pro-navy text-white p-2 rounded-full border-2 border-white hover:bg-primary transition-colors disabled:opacity-60"
                  >
                    {uploading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <span className="material-symbols-outlined text-sm">edit</span>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <div className="flex-grow text-center sm:text-left w-full">
                  <label className="block font-label-bold text-metadata text-on-surface-variant uppercase tracking-wider mb-1">Display name</label>
                  <input
                    value={displayName}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="font-headline-lg text-headline-lg text-pro-navy bg-transparent border-b-2 border-border-subtle focus:border-primary focus:outline-none pb-1 transition-colors w-full sm:max-w-sm"
                  />
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">{user.email}</p>
                </div>
              </div>
            </section>

            {/* Travel documents (passports) */}
            <section className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-border-subtle">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-headline-md text-headline-md text-pro-navy">Travel Documents</h2>
                {!travLoading && travPassports.length < 3 && (
                  <button onClick={() => { setAddOpen(true); addPassportRef.current?.focus(); }}
                    className="text-primary hover:underline font-label-bold text-label-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add document
                  </button>
                )}
              </div>
              <p className="font-body-md text-sm text-on-surface-variant mb-5">Click a passport to add your number — used for visa checks and auto-fills booking forms.</p>

              {travLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md animate-pulse">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-surface-container-low rounded-xl" />)}
                </div>
              )}

              {!travLoading && (
                <div className="space-y-3 mb-4">
                  {travPassports.map(p => {
                    const country = COUNTRIES.find(c => c.code === p.country);
                    const isOpen = expandedPassportId === p.id;
                    const status = passportExpiryStatus(p.passportExpiry);
                    const tokens = EXPIRY_TOKENS[status === 'none' ? 'ok' : status];
                    return (
                      <div key={p.id} className="rounded-xl border overflow-hidden transition-all"
                        style={{ borderColor: tokens.border }}>
                        <div className="flex items-start justify-between gap-4 p-5 cursor-pointer"
                          style={{ background: tokens.bg }}
                          onClick={() => setExpandedId(isOpen ? null : p.id)}>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-sky-blue/10">
                              {flagEmoji(p.country)}
                            </div>
                            <div>
                              <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-1">{country?.name ?? p.country}</p>
                              {p.passportNumber ? (
                                <>
                                  <h3 className="font-headline-md text-[18px] text-pro-navy mb-1">···{p.passportNumber.slice(-4)}</h3>
                                  <p className="font-metadata text-metadata" style={{ color: status === 'ok' || status === 'none' ? 'var(--color-on-surface-variant)' : tokens.badgeText }}>
                                    {status === 'expired' ? 'Expired' : status === 'soon' ? 'Expiring soon' : `Expires: ${p.passportExpiry}`}
                                  </p>
                                </>
                              ) : (
                                <p className="font-metadata text-metadata text-primary">Tap to add passport number →</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p.passportNumber && (
                              <span className="px-2 py-1 font-metadata text-[11px] rounded uppercase font-bold"
                                style={{ background: tokens.badgeBg, color: tokens.badgeText }}>
                                {status === 'expired' ? 'Expired' : status === 'soon' ? 'Soon' : 'Valid'}
                              </span>
                            )}
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setTravPassports(ps => ps.filter(x => x.id !== p.id)); if (isOpen) setExpandedId(null); }}
                              className="text-on-surface-variant hover:text-error transition-colors">
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="px-5 pb-5 pt-4 border-t space-y-3" style={{ borderColor: tokens.border }}>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-label-bold text-metadata text-on-surface-variant mb-1">Passport number</label>
                                <input value={p.passportNumber}
                                  onChange={e => setTravPassports(ps => ps.map(x => x.id === p.id ? { ...x, passportNumber: e.target.value.toUpperCase() } : x))}
                                  placeholder="AB1234567"
                                  className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent font-mono uppercase" />
                              </div>
                              <div>
                                <label className="block font-label-bold text-metadata text-on-surface-variant mb-1">Expiry date</label>
                                <DatePicker value={p.passportExpiry}
                                  onChange={v => setTravPassports(ps => ps.map(x => x.id === p.id ? { ...x, passportExpiry: v } : x))}
                                  min={new Date().toISOString().slice(0,10)} placeholder="Expiry date"
                                  className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent" />
                              </div>
                            </div>
                            <p className="font-metadata text-[11px] text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              Passport number stored encrypted · saved when you click Save preferences below
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!travLoading && travPassports.length < 3 && (
                <div className="relative">
                  <input ref={addPassportRef} type="text"
                    value={addPassportOpen ? addPassportQ : ''}
                    onFocus={() => { setAddOpen(true); setAddQ(''); }}
                    onBlur={() => setTimeout(() => setAddOpen(false), 150)}
                    onChange={e => { setAddQ(e.target.value); setAddOpen(true); }}
                    placeholder={travPassports.length === 0 ? '+ Add your passport country…' : '+ Add another passport'}
                    className="w-full border border-dashed border-border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent transition-colors text-on-surface-variant bg-surface-container-low"
                  />
                  {addPassportOpen && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-border-subtle overflow-hidden z-50 max-h-48 overflow-y-auto">
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
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low cursor-pointer list-none">
                          <span className="text-lg">{flagEmoji(c.code)}</span>
                          <span className="text-sm font-semibold text-pro-navy">{c.name}</span>
                          <span className="text-xs text-on-surface-variant ml-auto">{c.code}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            {/* Personal details */}
            <section className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-border-subtle">
              <h2 className="font-headline-md text-headline-md text-pro-navy mb-1">Personal Details</h2>
              <p className="font-body-md text-sm text-on-surface-variant mb-6">Fill once — auto-fills the booking form when you search for flights.</p>

              {travLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md animate-pulse">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <div className="space-y-1.5">
                    <label className="block font-label-bold text-label-bold text-on-surface-variant">Title</label>
                    <select value={travTitle} onChange={e => setTravTitle(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                      <option value="mr">Mr</option><option value="ms">Ms</option>
                      <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-bold text-label-bold text-on-surface-variant">Gender</label>
                    <select value={travGender} onChange={e => setTravGender(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                      <option value="m">Male</option><option value="f">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-bold text-label-bold text-on-surface-variant">First name (as on passport)</label>
                    <input value={givenName} onChange={e => setGivenName(e.target.value)} placeholder="As on passport"
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-bold text-label-bold text-on-surface-variant">Last name (as on passport)</label>
                    <input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="As on passport"
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-bold text-label-bold text-on-surface-variant">Date of birth</label>
                    <DatePicker value={bornOn} onChange={setBornOn}
                      max={new Date().toISOString().slice(0,10)} placeholder="Date of birth"
                      className="w-full bg-white border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-bold text-label-bold text-on-surface-variant">Phone number</label>
                    <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
                  </div>
                </div>
              )}
            </section>

            {/* Travel companions */}
            <section className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-border-subtle">
              <h2 className="font-headline-md text-headline-md text-pro-navy mb-1">Travel Companions</h2>
              <p className="font-body-md text-sm text-on-surface-variant mb-6">Save profiles for family members or frequent travel partners — auto-fills their details during booking.</p>

              {companions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {companions.map(c => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border-subtle px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {(c.givenName[0] || c.nickname[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-pro-navy capitalize">{c.givenName} {c.familyName}</p>
                          {c.isChild && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-blue/10 text-tertiary">Child</span>}
                        </div>
                        {c.nickname && c.nickname !== `${c.givenName} ${c.familyName}`.trim() && (
                          <p className="text-xs text-on-surface-variant">{c.nickname}</p>
                        )}
                        {c.bornOn && <p className="text-xs text-on-surface-variant">{new Date(c.bornOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      </div>
                      <button onClick={() => setCompanionForm({ ...c })}
                        className="text-xs text-primary font-semibold px-2 py-1 rounded-lg hover:bg-primary/5 transition">Edit</button>
                      <button onClick={() => setCompanions(prev => prev.filter(x => x.id !== c.id))}
                        className="text-xs text-error font-semibold px-2 py-1 rounded-lg hover:bg-error/5 transition">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {companionForm !== null ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">{companionForm.id ? 'Edit companion' : 'Add companion'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Title</label>
                      <select value={companionForm.title} onChange={e => setCompanionForm(f => f && ({ ...f, title: e.target.value }))}
                        className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent appearance-none">
                        <option value="mr">Mr</option><option value="ms">Ms</option>
                        <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Gender</label>
                      <select value={companionForm.gender} onChange={e => setCompanionForm(f => f && ({ ...f, gender: e.target.value }))}
                        className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent appearance-none">
                        <option value="m">Male</option><option value="f">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">First name</label>
                      <input value={companionForm.givenName} onChange={e => setCompanionForm(f => f && ({ ...f, givenName: e.target.value }))}
                        placeholder="As on passport"
                        className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Last name</label>
                      <input value={companionForm.familyName} onChange={e => setCompanionForm(f => f && ({ ...f, familyName: e.target.value }))}
                        placeholder="As on passport"
                        className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Date of birth</label>
                    <DatePicker value={companionForm.bornOn} onChange={v => setCompanionForm(f => f && ({ ...f, bornOn: v }))}
                      max={new Date().toISOString().slice(0,10)} placeholder="Date of birth"
                      className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Passport (optional, but speeds up booking)</label>
                    <div className="grid grid-cols-[1fr_1.4fr_1.2fr] gap-2">
                      <select
                        value={companionForm.passports[0]?.country ?? ''}
                        onChange={e => setCompanionForm(f => {
                          if (!f) return f;
                          const country = e.target.value;
                          const existing = f.passports[0];
                          const next = { id: existing?.id || 'p1', country, label: country, passportNumber: existing?.passportNumber ?? '', passportExpiry: existing?.passportExpiry ?? '' };
                          return { ...f, passports: country ? [next] : [] };
                        })}
                        className="w-full border border-border-subtle rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent appearance-none">
                        <option value="">Country</option>
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
                      </select>
                      <input value={companionForm.passports[0]?.passportNumber ?? ''}
                        onChange={e => setCompanionForm(f => {
                          if (!f) return f;
                          const existing = f.passports[0];
                          const next = { id: existing?.id || 'p1', country: existing?.country ?? '', label: existing?.label ?? '', passportNumber: e.target.value.toUpperCase(), passportExpiry: existing?.passportExpiry ?? '' };
                          return { ...f, passports: [next] };
                        })}
                        placeholder="Passport number"
                        className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent font-mono uppercase" />
                      <DatePicker value={companionForm.passports[0]?.passportExpiry ?? ''}
                        onChange={v => setCompanionForm(f => {
                          if (!f) return f;
                          const existing = f.passports[0];
                          const next = { id: existing?.id || 'p1', country: existing?.country ?? '', label: existing?.label ?? '', passportNumber: existing?.passportNumber ?? '', passportExpiry: v };
                          return { ...f, passports: [next] };
                        })}
                        min={new Date().toISOString().slice(0,10)} placeholder="Expiry date"
                        className="w-full border border-border-subtle rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent" />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Stored encrypted · auto-fills this companion&apos;s passport during booking
                    </p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" checked={!!companionForm.isChild}
                        onChange={e => setCompanionForm(f => f && ({ ...f, isChild: e.target.checked }))}
                        className="sr-only" />
                      <div className={`w-10 h-6 rounded-full transition-colors ${companionForm.isChild ? 'bg-tertiary' : 'bg-surface-container'}`} />
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${companionForm.isChild ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-pro-navy">This is a child</p>
                      <p className="text-xs text-on-surface-variant">Marks this traveller as a child passenger (under 12) during booking</p>
                    </div>
                  </label>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone (optional)</label>
                    <PhoneInput value={companionForm.phone} onChange={v => setCompanionForm(f => f && ({ ...f, phone: v }))} />
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
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-primary transition hover:opacity-90">
                      Save companion
                    </button>
                    <button onClick={() => setCompanionForm(null)}
                      className="py-2.5 px-4 rounded-lg text-sm font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCompanionForm({ ...EMPTY_COMPANION })}
                  className="w-full py-3 rounded-lg border border-dashed border-border-subtle text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add companion
                </button>
              )}
              <p className="text-xs text-on-surface-variant mt-3 text-center">Companions are saved when you click &quot;Save preferences&quot; below.</p>
            </section>

            {/* Travel style & preferences */}
            <section className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-border-subtle">
              <h2 className="font-headline-md text-headline-md text-pro-navy mb-8">Travel Style &amp; Preferences</h2>
              <div className="space-y-10">
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-4">Travel style</p>
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
                </div>

                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-4">Favorite regions</p>
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
                </div>

                <div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-4">Budget &amp; frequency</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
                </div>
              </div>
            </section>

            {error && (
              <p className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-4 py-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              <button onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-8 py-3 text-on-surface-variant hover:text-pro-navy transition-colors font-label-bold text-label-bold">
                Discard changes
              </button>
              <button onClick={handleSave} disabled={saving}
                className="w-full sm:w-auto bg-pro-navy text-white px-10 py-3 rounded-lg font-label-bold text-label-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save preferences'}
                {!saving && !saved && <span className="material-symbols-outlined text-teal-accent">arrow_forward</span>}
              </button>
            </div>

            <div className="text-center">
              <Link href="/" className="text-xs text-on-surface-variant hover:text-pro-navy transition-colors">← Back to search</Link>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-xl shadow-sm border border-error/20 p-6 sm:p-8">
              <h3 className="font-headline-md text-[16px] text-error mb-1">Danger zone</h3>
              <p className="text-xs text-on-surface-variant mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
              <button onClick={() => setDeleteModal(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-error/30 text-sm font-semibold text-error hover:bg-error/5 transition">
                Delete my account
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
            </div>
            <h4 className="text-base font-bold text-pro-navy text-center mb-2">Delete account?</h4>
            <p className="text-sm text-on-surface-variant text-center mb-5">This will permanently delete your account, profile, and all booking history. There is no undo.</p>
            {deleteError && <p className="text-xs text-error bg-error/5 rounded-lg px-3 py-2 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteModal(false); setDeleteError(''); }}
                className="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition">
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
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-error hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting…</> : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const FOUNDER_EMAIL = 'avirudoi@gmail.com';

interface Advisory {
  id: string;
  title: string;
  message: string;
  affected_airports: string[];
  link_url: string | null;
  is_active: boolean;
  created_at: string;
}

const inputCls = 'w-full h-11 px-3.5 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-white';

export default function AdminAdvisoriesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [airports, setAirports] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  async function loadAdvisories() {
    setLoading(true);
    const res = await fetch('/api/admin/travel-advisories');
    if (res.ok) {
      const data = await res.json();
      setAdvisories(data.advisories ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return; }
      if (user.email !== FOUNDER_EMAIL) { router.replace('/'); return; }
      setAuthorized(true);
      setChecking(false);
      loadAdvisories();
    });
  }, []);

  async function createAdvisory() {
    setError('');
    if (!title.trim() || !message.trim()) { setError('Title and message are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/travel-advisories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          affectedAirports: airports.split(',').map(s => s.trim()).filter(Boolean),
          linkUrl: linkUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create advisory');
      setAdvisories(prev => [data.advisory, ...prev]);
      setTitle(''); setMessage(''); setAirports(''); setLinkUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create advisory');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setError('');
    setAdvisories(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
    const res = await fetch(`/api/admin/travel-advisories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    if (!res.ok) {
      // Revert the optimistic update — the write didn't actually happen server-side.
      setAdvisories(prev => prev.map(a => a.id === id ? { ...a, is_active: current } : a));
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to update advisory — it was not changed.');
    }
  }

  async function deleteAdvisory(id: string) {
    setError('');
    const removed = advisories.find(a => a.id === id);
    setAdvisories(prev => prev.filter(a => a.id !== id));
    const res = await fetch(`/api/admin/travel-advisories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      // Revert — the row is still in the database, don't let the UI lie about it.
      if (removed) setAdvisories(prev => [...prev, removed].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to delete advisory — it still exists.');
    }
  }

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      <div className="bg-white border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="font-headline-lg text-headline-lg text-pro-navy">Travel Advisories</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Shown on flight search results for matching routes. Only add something here if it&apos;s real and current —
            this is displayed as verified information, not a guess.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* New advisory form */}
        <div className="bg-white rounded-xl border border-border-subtle pro-shadow p-5 space-y-3">
          <p className="font-label-bold text-label-bold text-pro-navy uppercase tracking-widest mb-1">New advisory</p>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Flight disruptions in the Middle East" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="What's actually happening, in plain language."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-white resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Affected airports (IATA codes, comma-separated)</label>
            <input value={airports} onChange={e => setAirports(e.target.value)} placeholder="DXB, AUH, DOH, TLV, BEY, AMM" className={inputCls + ' font-mono'} />
            <p className="text-[11px] text-outline mt-1">Banner shows when a searched route&apos;s origin or destination matches any of these codes.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Link URL (optional)</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className={inputCls} />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button onClick={createAdvisory} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer">
            {saving ? 'Adding…' : 'Add advisory'}
          </button>
        </div>

        {/* Existing advisories */}
        <div>
          <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mb-3">
            {loading ? 'Loading…' : `${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'}`}
          </p>
          <div className="space-y-3">
            {advisories.map(a => (
              <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.is_active ? 'border-border-subtle' : 'border-border-subtle opacity-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-pro-navy">{a.title}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{a.message}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.affected_airports.map(code => (
                        <span key={code} className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant">{code}</span>
                      ))}
                    </div>
                    {a.link_url && <p className="text-xs text-tertiary mt-1 truncate">{a.link_url}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(a.id, a.is_active)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${a.is_active ? 'bg-primary' : 'bg-surface-container'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${a.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <button onClick={() => deleteAdvisory(a.id)} className="text-outline hover:text-error transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && advisories.length === 0 && (
              <p className="text-sm text-outline">No advisories yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

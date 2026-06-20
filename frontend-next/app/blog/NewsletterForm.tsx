'use client';
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data?.error ?? 'Something went wrong');
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch (err) {
      setErrMsg('Network error — please try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="py-2">
        <p className="text-lg font-bold text-white mb-1">✓ You're in!</p>
        <p className="text-white/60 text-sm">First travel hack lands in your inbox next week.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-teal"
        />
        <button type="submit" disabled={status === 'loading'}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: '#1D9E75' }}>
          {status === 'loading' ? 'Subscribing…' : 'Subscribe free'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-3 text-center">
          {errMsg || 'Something went wrong — please try again.'}
        </p>
      )}
    </div>
  );
}

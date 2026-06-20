'use client';
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <p className="text-teal font-bold text-sm">
        ✓ You're in! First issue lands in your inbox next week.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
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
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-1 sm:mt-0 absolute -bottom-6 left-0 right-0 text-center">
          Something went wrong — try again.
        </p>
      )}
    </form>
  );
}

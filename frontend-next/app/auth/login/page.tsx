'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleButton from '@/components/GoogleButton';
import { analytics } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    analytics.login('email');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_done')
        .eq('id', user.id)
        .single();
      if (!profile?.onboarding_done) {
        router.push('/onboarding');
        return;
      }
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Cheapstay" width={140} height={36} className="h-9 w-auto mx-auto" /></Link>
          <h1 className="text-2xl font-bold text-navy mt-4">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your Cheapstay account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Google */}
          <GoogleButton label="Sign in with Google" />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-primary)' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          No account?{' '}
          <Link href="/auth/signup" className="text-teal font-semibold hover:text-teal-dark">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

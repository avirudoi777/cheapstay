'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleButton from '@/components/GoogleButton';
import AuthHeroPanel from '@/components/AuthHeroPanel';
import { analytics } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-6rem)] bg-surface-container-lowest">
      <AuthHeroPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile py-12 md:p-12 lg:p-24">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-stack-md text-center">
            <Link href="/"><Image src="/logo.png" alt="CheapStay" width={140} height={36} className="h-9 w-auto mx-auto" /></Link>
          </div>

          <div className="mb-stack-md">
            <h1 className="font-headline-lg text-headline-lg text-pro-navy mb-2">Welcome back</h1>
            <p className="text-on-surface-variant font-body-md">Sign in to access your travel hacks and saved deals.</p>
          </div>

          {error && <p className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-3.5 py-2.5 mb-6">{error}</p>}

          <div className="space-y-6">
            <GoogleButton label="Sign in with Google" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-metadata">
                <span className="px-3 bg-surface-container-lowest text-outline uppercase tracking-widest font-metadata">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="email" className="block font-label-bold text-pro-navy">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3 py-3 bg-white border border-border-subtle rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block font-label-bold text-pro-navy">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Your password"
                    className="block w-full pl-10 pr-10 py-3 bg-white border border-border-subtle rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition-all" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-pro-navy">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-lg font-label-bold text-white bg-teal-accent hover:bg-primary shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60">
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>}
              </button>
            </form>
          </div>

          <p className="mt-10 text-center text-body-md text-on-surface-variant">
            Don&apos;t have an account?
            <Link href="/auth/signup" className="font-label-bold text-primary hover:text-teal-accent transition-colors ml-1">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

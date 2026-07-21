'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import GoogleButton from '@/components/GoogleButton';
import AuthHeroPanel from '@/components/AuthHeroPanel';
import { analytics } from '@/lib/analytics';

export default function SignupPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    analytics.signUp('email');
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-6rem)] bg-surface-container-lowest">
        <AuthHeroPanel />
        <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile py-12 md:p-12 lg:p-24">
          <div className="w-full max-w-md text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 inline-block">mark_email_read</span>
            <h2 className="font-headline-lg text-headline-lg text-pro-navy mb-2">Check your email</h2>
            <p className="text-on-surface-variant font-body-md">We sent a confirmation link to <strong className="text-pro-navy">{email}</strong>. Click it to activate your account.</p>
          </div>
        </div>
      </div>
    );
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
            <h1 className="font-headline-lg text-headline-lg text-pro-navy mb-2">Create your account</h1>
            <p className="text-on-surface-variant font-body-md">Find cheaper hotels every time you travel.</p>
          </div>

          {error && <p className="text-sm text-error bg-error/5 border border-error/20 rounded-lg px-3.5 py-2.5 mb-6">{error}</p>}

          <div className="space-y-6">
            <GoogleButton label="Sign up with Google" />

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
                <label htmlFor="name" className="block font-label-bold text-pro-navy">Full name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">person</span>
                  </div>
                  <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required
                    placeholder="John Smith"
                    className="block w-full pl-10 pr-3 py-3 bg-white border border-border-subtle rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition-all" />
                </div>
              </div>

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
                    placeholder="Min 8 characters" minLength={8}
                    className="block w-full pl-10 pr-10 py-3 bg-white border border-border-subtle rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition-all" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-pro-navy">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-lg font-label-bold text-white bg-teal-accent hover:bg-primary shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create account'}
                {!loading && <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>}
              </button>
            </form>
          </div>

          <p className="mt-10 text-center text-body-md text-on-surface-variant">
            Already have an account?
            <Link href="/auth/login" className="font-label-bold text-primary hover:text-teal-accent transition-colors ml-1">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void; // called when user wants to proceed without login
  hotelName?: string;
}

export default function AuthModal({ open, onClose, onContinue, hotelName }: AuthModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,31,61,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Gradient header */}
        <div className="relative px-6 pt-6 pb-8 text-white"
          style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #00C9B1 100%)' }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Image src="/s_logo.png" alt="Cheapstay" width={36} height={36} className="mb-3 opacity-90" />
          <h2 className="text-lg font-bold leading-tight">
            {hotelName ? `Save the best deal for` : 'Sign in to unlock more'}
          </h2>
          {hotelName && (
            <p className="text-sm text-white/75 mt-0.5 truncate">{hotelName}</p>
          )}
          <p className="text-xs text-white/60 mt-2">
            Track your bookings, save favourites and get personalised hotel picks.
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Google sign-in */}
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Email options */}
          <div className="flex gap-2">
            <Link href="/auth/login"
              className="flex-1 text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
              Sign up free
            </Link>
          </div>

          {/* Skip */}
          <button onClick={onContinue}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1">
            Continue as guest (booking won&apos;t be saved)
          </button>
        </div>
      </div>
    </div>
  );
}

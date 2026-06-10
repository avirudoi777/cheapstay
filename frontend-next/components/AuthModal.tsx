'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GoogleButton from './GoogleButton';

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
          <GoogleButton label="Continue with Google" />

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

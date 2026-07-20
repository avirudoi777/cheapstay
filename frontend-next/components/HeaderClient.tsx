'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const FOUNDER_EMAIL = 'avirudoi@gmail.com';

export default function HeaderClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl]       = useState('');
  const [menuOpen, setMenuOpen]         = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    async function loadUser(u: import('@supabase/supabase-js').User) {
      const meta = u.user_metadata ?? {};
      const fallback = meta.avatar_url || meta.picture || '';
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', u.id)
        .single();
      setAvatarUrl(profile?.avatar_url || fallback);
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUser(data.user); loadUser(data.user); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUser(session.user);
      else setAvatarUrl('');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* Nav links — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-2 mr-6">
        <Link href="/blog" className="font-body-md text-sm text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-lg transition-colors">Blog</Link>
        <Link href="/shop" className="font-body-md text-sm text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-lg transition-colors">Shop</Link>
        <Link href="/consult" className="font-body-md text-sm text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-lg transition-colors">Book a call</Link>
      </nav>
      <div className="flex items-center gap-2">
        {user ? (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-surface-container transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : initials}
              </div>
              <span className="text-sm font-semibold text-on-surface hidden sm:block">
                {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-white rounded-xl concierge-shadow border border-border-subtle py-1 z-50">
                <div className="px-4 py-2.5 border-b border-border-subtle">
                  <p className="text-xs font-bold text-on-surface truncate">{user.user_metadata?.full_name || 'Traveller'}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                </div>
                <Link href="/account" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My profile
                </Link>
                <Link href="/bookings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My bookings
                </Link>
                {user.email === FOUNDER_EMAIL && (
                  <Link href="/admin/advisories" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    Admin
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/auth/login"
              className="px-4 py-2 font-label-bold text-sm text-on-surface-variant hover:text-primary transition-all">
              Sign In
            </Link>
            <Link href="/auth/signup"
              className="px-6 py-2 bg-primary text-white rounded-lg font-label-bold text-sm hover:shadow-lg transition-all">
              Sign up
            </Link>
          </>
        )}
      </div>
    </>
  );
}

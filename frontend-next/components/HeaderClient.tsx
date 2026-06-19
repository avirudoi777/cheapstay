'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';


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
      <nav className="hidden md:flex items-center gap-1 mr-4">
        {[
          { href: '/#how-it-works', label: 'The hack' },
          { href: '/vpn-guide', label: 'VPN guide' },
          { href: '/blog', label: 'Blog' },
          { href: '/shop', label: 'Shop' },
        ].map(link => (
          <Link key={link.href} href={link.href}
            className="text-xs font-semibold text-gray-500 hover:text-navy px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {user ? (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full text-white text-xs font-bold shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0"
                style={!avatarUrl ? { background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' } : undefined}>
                {avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : initials}
              </div>
              <span className="text-sm font-semibold text-navy hidden sm:block">
                {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-navy truncate">{user.user_metadata?.full_name || 'Traveller'}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
                <Link href="/account" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-navy transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My profile
                </Link>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
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
              className="text-xs font-semibold text-gray-600 hover:text-navy px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="text-xs font-bold text-white px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </>
  );
}

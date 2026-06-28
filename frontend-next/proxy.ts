import { NextResponse, type NextRequest } from 'next/server';

// Lightweight middleware — auth checks happen client-side via Supabase browser client.
// Only redirect /account if no session cookie present (rough check, not cryptographic).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/account')) {
    const hasSession = request.cookies.getAll().some(c =>
      c.name.includes('auth-token') || c.name.includes('sb-')
    );
    if (!hasSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};

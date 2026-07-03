import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/email-templates';

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_done')
          .eq('id', user.id)
          .single();

        // !profile = no profile row = brand new user. Send welcome email before redirect.
        // Must await — Vercel kills the function the moment the response is sent.
        if (!profile && user.email) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
          await sendEmail({ to: user.email, ...welcomeEmail({ name }) });
        }

        if (!profile?.onboarding_done) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}

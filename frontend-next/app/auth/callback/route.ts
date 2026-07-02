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
      console.log('[callback] user:', user?.id, 'email:', user?.email, 'created_at:', user?.created_at);

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_done')
          .eq('id', user.id)
          .single();

        const ageMs = user.created_at ? Date.now() - new Date(user.created_at).getTime() : Infinity;
        const isNewUser = ageMs < 120_000;
        console.log('[callback] ageMs:', ageMs, 'isNewUser:', isNewUser, 'hasEmail:', !!user.email);

        if (isNewUser && user.email) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const result = await sendEmail({ to: user.email, ...welcomeEmail({ name }) });
          console.log('[callback] welcome email result:', JSON.stringify(result));
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

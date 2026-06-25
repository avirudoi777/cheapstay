import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Use the user's own session to delete their rows (service_role lacks table grants;
    // user's JWT has RLS-allowed DELETE on their own rows)
    await supabase.from('flight_bookings').delete().eq('user_id', user.id);
    await supabase.from('booking_clicks').delete().eq('user_id', user.id);
    await supabase.from('user_preferences').delete().eq('user_id', user.id);
    await supabase.from('user_profiles').delete().eq('id', user.id);

    // Admin client needed only to delete the auth user itself
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Auth deleteUser error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

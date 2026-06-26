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

    // CASCADE DELETE on FK constraints handles related rows automatically.
    // If this still fails, run in Supabase SQL editor:
    //   DO $$ DECLARE r RECORD; BEGIN FOR r IN SELECT tc.table_name, kcu.column_name, tc.constraint_name
    //   FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu
    //   ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    //   JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    //   JOIN information_schema.key_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    //   WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'auth' AND ccu.table_name = 'users'
    //   AND tc.table_schema = 'public' LOOP EXECUTE format(
    //   'ALTER TABLE public.%I DROP CONSTRAINT %I; ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE;',
    //   r.table_name, r.constraint_name, r.table_name, r.constraint_name, r.column_name); END LOOP; END $$;
    await admin.from('flight_bookings').delete().eq('user_id', user.id);
    await admin.from('booking_clicks').delete().eq('user_id', user.id);
    await admin.from('user_preferences').delete().eq('user_id', user.id);
    await admin.from('user_profiles').delete().eq('id', user.id);

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

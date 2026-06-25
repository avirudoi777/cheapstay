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

    // Delete user data from all tables first (FK constraints block auth deletion otherwise)
    const cleanupResults: Record<string, string> = {};
    const tables: { table: string; col: string }[] = [
      { table: 'flight_bookings', col: 'user_id' },
      { table: 'booking_clicks', col: 'user_id' },
      { table: 'user_preferences', col: 'user_id' },
      { table: 'user_profiles', col: 'id' },
    ];
    for (const { table, col } of tables) {
      const { error: delErr } = await admin.from(table).delete().eq(col, user.id);
      if (delErr) cleanupResults[table] = delErr.message;
    }
    console.log('Account delete cleanup:', cleanupResults);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Auth deleteUser error:', error);
      return NextResponse.json({ error: error.message, cleanup: cleanupResults }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

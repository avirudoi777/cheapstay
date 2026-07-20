import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key);
}

// GET /api/travel-advisories — public, returns active advisories only.
// Used by the flight-results banner; no auth required to read.
export async function GET() {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ advisories: [] });

  const { data, error } = await admin
    .from('travel_advisories')
    .select('id, title, message, affected_airports, link_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ advisories: [] });
  return NextResponse.json({ advisories: data ?? [] });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const FOUNDER_EMAIL = 'avirudoi@gmail.com';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key);
}

async function requireFounder() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== FOUNDER_EMAIL) return null;
  return user;
}

// GET /api/admin/travel-advisories — founder-only, lists all advisories (active + inactive)
export async function GET() {
  const user = await requireFounder();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  const { data, error } = await admin
    .from('travel_advisories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advisories: data ?? [] });
}

// POST /api/admin/travel-advisories — founder-only, create a new advisory
export async function POST(req: NextRequest) {
  const user = await requireFounder();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const title = (body.title ?? '').trim();
  const message = (body.message ?? '').trim();
  const affectedAirports: string[] = Array.isArray(body.affectedAirports) ? body.affectedAirports : [];
  const linkUrl = (body.linkUrl ?? '').trim() || null;

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  const { data, error } = await admin
    .from('travel_advisories')
    .insert({
      title,
      message,
      affected_airports: affectedAirports.map(c => c.toUpperCase()),
      link_url: linkUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advisory: data });
}

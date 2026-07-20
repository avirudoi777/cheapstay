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

interface Props { params: Promise<{ id: string }> }

// PATCH /api/admin/travel-advisories/[id] — founder-only, update fields (e.g. toggle is_active)
export async function PATCH(req: NextRequest, { params }: Props) {
  const user = await requireFounder();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === 'string') updates.title = body.title.trim();
  if (typeof body.message === 'string') updates.message = body.message.trim();
  if (Array.isArray(body.affectedAirports)) updates.affected_airports = body.affectedAirports.map((c: string) => c.toUpperCase());
  if (typeof body.linkUrl === 'string') updates.link_url = body.linkUrl.trim() || null;
  if (typeof body.isActive === 'boolean') updates.is_active = body.isActive;

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  const { data, error } = await admin
    .from('travel_advisories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advisory: data });
}

// DELETE /api/admin/travel-advisories/[id] — founder-only
export async function DELETE(req: NextRequest, { params }: Props) {
  const user = await requireFounder();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  const { error } = await admin.from('travel_advisories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

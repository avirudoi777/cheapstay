import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptField, decryptField } from '@/lib/profile-crypto';
import { randomUUID } from 'crypto';

interface PassportRaw {
  id: string;
  country: string;
  label: string;
  number_enc: string;
  expiry: string;
}
interface TravelerProfileRaw {
  title?: string;
  given_name?: string;
  family_name?: string;
  gender?: string;
  born_on_enc?: string;
  phone?: string;
  passports?: PassportRaw[];
}

/* ── GET: fetch & decrypt traveler profile ───────────────────────────────── */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: row } = await supabase
    .from('user_profiles')
    .select('traveler_profile')
    .eq('id', user.id)
    .single();

  const raw = ((row?.traveler_profile ?? {}) as TravelerProfileRaw);

  const passports = (raw.passports ?? []).slice(0, 3).map(p => ({
    id: p.id,
    country: p.country ?? '',
    label: p.label ?? p.country ?? '',
    passportNumber: p.number_enc ? (decryptField(p.number_enc) || '') : '',
    passportExpiry: p.expiry ?? '',
  }));

  return NextResponse.json({
    title:      raw.title ?? 'mr',
    givenName:  raw.given_name ?? '',
    familyName: raw.family_name ?? '',
    gender:     raw.gender ?? 'm',
    bornOn:     raw.born_on_enc ? (decryptField(raw.born_on_enc) || '') : '',
    phone:      raw.phone ?? '',
    passports,
    email:      user.email ?? '',
  });
}

/* ── POST: encrypt & save traveler profile ───────────────────────────────── */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json() as {
    title: string; givenName: string; familyName: string; gender: string;
    bornOn: string; phone: string;
    passports: { id?: string; country: string; label: string; passportNumber: string; passportExpiry: string }[];
  };

  const passports: PassportRaw[] = (body.passports ?? []).slice(0, 3).map(p => ({
    id: p.id || randomUUID(),
    country: (p.country ?? '').toUpperCase(),
    label: p.label || (p.country ?? '').toUpperCase(),
    number_enc: p.passportNumber ? encryptField(p.passportNumber) : '',
    expiry: p.passportExpiry ?? '',
  }));

  const travelerProfile: TravelerProfileRaw = {
    title:       body.title || 'mr',
    given_name:  body.givenName || undefined,
    family_name: body.familyName || undefined,
    gender:      body.gender || 'm',
    born_on_enc: body.bornOn ? encryptField(body.bornOn) : undefined,
    phone:       body.phone || undefined,
    passports,
  };

  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, traveler_profile: travelerProfile });
  if (error) {
    // Column likely not created yet — tell the user exactly what SQL to run
    const msg = error.message.includes('traveler_profile') || error.message.includes('column')
      ? 'traveler_profile column missing — run migration: ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS traveler_profile JSONB;'
      : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

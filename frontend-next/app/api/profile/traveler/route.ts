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
interface CompanionRaw {
  id: string;
  nickname: string;
  title?: string;
  given_name?: string;
  family_name?: string;
  gender?: string;
  born_on_enc?: string;
  phone?: string;
  passports?: PassportRaw[];
  is_child?: boolean;
}
interface TravelerProfileRaw {
  title?: string;
  given_name?: string;
  family_name?: string;
  gender?: string;
  born_on_enc?: string;
  phone?: string;
  passports?: PassportRaw[];
  companions?: CompanionRaw[];
}

function decodePassports(passports: PassportRaw[] = []) {
  return passports.slice(0, 3).map(p => ({
    id: p.id,
    country: p.country ?? '',
    label: p.label ?? p.country ?? '',
    passportNumber: p.number_enc ? (decryptField(p.number_enc) || '') : '',
    passportExpiry: p.expiry ?? '',
  }));
}

function encodePassports(
  passports: { id?: string; country: string; label: string; passportNumber: string; passportExpiry: string }[]
): PassportRaw[] {
  return (passports ?? []).slice(0, 3).map(p => ({
    id: p.id || randomUUID(),
    country: (p.country ?? '').toUpperCase(),
    label: p.label || (p.country ?? '').toUpperCase(),
    number_enc: p.passportNumber ? encryptField(p.passportNumber) : '',
    expiry: p.passportExpiry ?? '',
  }));
}

/* ── GET: fetch & decrypt traveler profile + companions ─────────────────── */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: row } = await supabase
    .from('user_profiles')
    .select('traveler_profile, display_name')
    .eq('id', user.id)
    .single();

  const raw = ((row?.traveler_profile ?? {}) as TravelerProfileRaw);

  // Fall back to display_name (or auth metadata) when name fields not yet saved
  const displayName: string = (row as { display_name?: string } | null)?.display_name
    || (user.user_metadata?.full_name as string | undefined)
    || '';
  const [firstWord = '', ...restWords] = displayName.trim().split(/\s+/);
  const givenFallback = firstWord;
  const familyFallback = restWords.join(' ');

  const companions = (raw.companions ?? []).map(c => ({
    id: c.id,
    nickname: c.nickname ?? '',
    title:      c.title ?? 'mr',
    givenName:  c.given_name ?? '',
    familyName: c.family_name ?? '',
    gender:     c.gender ?? 'm',
    bornOn:     c.born_on_enc ? (decryptField(c.born_on_enc) || '') : '',
    phone:      c.phone ?? '',
    passports:  decodePassports(c.passports),
    isChild:    c.is_child ?? false,
  }));

  return NextResponse.json({
    title:      raw.title ?? 'mr',
    givenName:  raw.given_name ?? givenFallback,
    familyName: raw.family_name ?? familyFallback,
    gender:     raw.gender ?? 'm',
    bornOn:     raw.born_on_enc ? (decryptField(raw.born_on_enc) || '') : '',
    phone:      raw.phone ?? '',
    passports:  decodePassports(raw.passports),
    email:      user.email ?? '',
    companions,
  });
}

/* ── POST: encrypt & save traveler profile + companions ─────────────────── */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await req.json() as {
      title: string; givenName: string; familyName: string; gender: string;
      bornOn: string; phone: string;
      passports: { id?: string; country: string; label: string; passportNumber: string; passportExpiry: string }[];
      companions?: {
        id?: string; nickname: string; title: string; givenName: string; familyName: string;
        gender: string; bornOn: string; phone: string; isChild?: boolean;
        passports: { id?: string; country: string; label: string; passportNumber: string; passportExpiry: string }[];
      }[];
    };

    const encKey = (process.env.PROFILE_ENCRYPTION_KEY ?? '').trim();
    if (!encKey) {
      return NextResponse.json({ error: 'PROFILE_ENCRYPTION_KEY is empty in Vercel env vars.' }, { status: 500 });
    }
    if (encKey.length !== 64) {
      return NextResponse.json(
        { error: `PROFILE_ENCRYPTION_KEY is ${encKey.length} chars — needs to be exactly 64.` },
        { status: 500 }
      );
    }

    const companions: CompanionRaw[] = (body.companions ?? []).map(c => ({
      id: c.id || randomUUID(),
      nickname: c.nickname || `${c.givenName} ${c.familyName}`.trim(),
      title:       c.title || 'mr',
      given_name:  c.givenName || undefined,
      family_name: c.familyName || undefined,
      gender:      c.gender || 'm',
      born_on_enc: c.bornOn ? encryptField(c.bornOn) : undefined,
      phone:       c.phone || undefined,
      passports:   encodePassports(c.passports ?? []),
      is_child:    c.isChild ?? false,
    }));

    // Read existing profile so we can preserve fields not included in this save (e.g. phone)
    const { data: existingRow } = await supabase
      .from('user_profiles').select('traveler_profile').eq('id', user.id).single();
    const existingRaw = ((existingRow?.traveler_profile ?? {}) as TravelerProfileRaw);

    const travelerProfile: TravelerProfileRaw = {
      title:       body.title || 'mr',
      given_name:  body.givenName || undefined,
      family_name: body.familyName || undefined,
      gender:      body.gender || 'm',
      born_on_enc: body.bornOn ? encryptField(body.bornOn) : undefined,
      // Preserve existing phone if no new value supplied — prevents accidental wipe
      phone:       body.phone || existingRaw.phone || undefined,
      passports:   encodePassports(body.passports ?? []),
      companions,
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, traveler_profile: travelerProfile });
    if (error) {
      const msg = error.message.includes('traveler_profile') || error.message.includes('column')
        ? 'traveler_profile column missing — run: ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS traveler_profile JSONB;'
        : error.message;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

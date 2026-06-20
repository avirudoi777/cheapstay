import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email });

  if (error) {
    console.error('newsletter insert error:', error);
    if (error.code === '23505') {
      // duplicate — treat as success
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

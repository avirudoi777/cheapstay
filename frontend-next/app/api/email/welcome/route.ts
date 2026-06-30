import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/email-templates';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { email, name } = await req.json() as { email?: string; name?: string };
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const result = await sendEmail({ to: email, ...welcomeEmail({ name: name ?? '' }) });
  return NextResponse.json(result);
}

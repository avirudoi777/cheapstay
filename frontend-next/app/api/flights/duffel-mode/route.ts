import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DUFFEL_LIVE_API_KEY || process.env.DUFFEL_TEST_API_KEY || process.env.DUFFEL_API_KEY
    ?? '';
  const testMode = process.env.DUFFEL_TEST_MODE === 'true' || !key.startsWith('duffel_live_');
  return NextResponse.json({ testMode });
}

import { NextResponse } from 'next/server';

export async function GET() {
  const testMode = !process.env.DUFFEL_LIVE_API_KEY;
  return NextResponse.json({ testMode });
}

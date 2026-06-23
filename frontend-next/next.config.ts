import type { NextConfig } from 'next';

// DUFFEL_TEST_MODE=true in Vercel overrides everything; otherwise infer from key prefix
const duffelKey = process.env.DUFFEL_LIVE_API_KEY
  ?? process.env.DUFFEL_TEST_API_KEY
  ?? process.env.DUFFEL_API_KEY
  ?? '';
const duffelTestMode =
  process.env.DUFFEL_TEST_MODE === 'true' || !duffelKey.startsWith('duffel_live_');

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DUFFEL_TEST_MODE: String(duffelTestMode),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.agoda.net' },
      { protocol: 'https', hostname: '**.agoda.com' },
      { protocol: 'https', hostname: '**.akamaized.net' },
      { protocol: 'https', hostname: 'pictures.hotellook.com' },
      { protocol: 'https', hostname: '**.hotellook.com' },
      { protocol: 'http',  hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

// Detect test mode at build time by checking the key prefix — avoids async fetch race on payment step
const duffelKey = process.env.DUFFEL_LIVE_API_KEY
  ?? process.env.DUFFEL_TEST_API_KEY
  ?? process.env.DUFFEL_API_KEY
  ?? '';
const duffelTestMode = !duffelKey.startsWith('duffel_live_');

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

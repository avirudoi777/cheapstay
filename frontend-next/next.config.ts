import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/bookings', '/auth', '/onboarding', '/api/'],
    },
    sitemap: 'https://www.cheapstay.co/sitemap.xml',
  };
}

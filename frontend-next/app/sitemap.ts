import type { MetadataRoute } from 'next';

const BLOG_SLUGS = [
  'same-hotel-two-prices',
  'three-cards-i-always-travel-with',
  'priceline-24hr-cancellation',
  'tokyo-sixty-per-night',
  'when-booking-direct-beats-agoda',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url: `https://cheapstay.co/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: 'https://cheapstay.co',                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: 'https://cheapstay.co/blog',                  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: 'https://cheapstay.co/vpn-guide',             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://cheapstay.co/cashback',              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://cheapstay.co/destinations',          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: 'https://cheapstay.co/shop',                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: 'https://cheapstay.co/overpaid-calculator',   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://cheapstay.co/consult',               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://cheapstay.co/about',                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://cheapstay.co/contact',               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://cheapstay.co/privacy',               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    ...blogPosts,
  ];
}

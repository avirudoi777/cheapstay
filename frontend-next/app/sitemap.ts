import type { MetadataRoute } from 'next';

const BASE = 'https://www.cheapstay.co';

const BLOG_SLUGS = [
  'same-hotel-two-prices',
  'three-cards-i-always-travel-with',
  'priceline-24hr-cancellation',
  'tokyo-sixty-per-night',
  'when-booking-direct-beats-agoda',
  'bangkok-vs-chiang-mai',
  'japan-budget-travel',
  'best-months-fly-southeast-asia',
  'jakarta-underrated-city',
  'anytime-fitness-global-hack',
];

const CITY_SLUGS = [
  'bangkok', 'bali', 'tokyo', 'singapore',
  'chiang-mai', 'phuket', 'kuala-lumpur', 'ho-chi-minh-city',
];

// Destination requirements pages (fly-to)
const FLY_TO_SLUGS = [
  'thailand', 'japan', 'indonesia', 'vietnam', 'uae', 'singapore', 'india', 'south-korea',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map(slug => ({
    url: `${BASE}/hotels/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const flyToPages: MetadataRoute.Sitemap = FLY_TO_SLUGS.map(slug => ({
    url: `${BASE}/fly-to/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    { url: `${BASE}`,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${BASE}/blog`,                 lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/vpn-guide`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/cashback`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/destinations`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/shop`,                 lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/overpaid-calculator`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/consult`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/terms`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE}/privacy`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    ...flyToPages,
    ...blogPosts,
    ...cityPages,
  ];
}

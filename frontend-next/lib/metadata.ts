import type { Metadata } from 'next';

const BASE_URL = 'https://www.cheapstay.co';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=630&fit=crop&auto=format';

export function buildPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${BASE_URL}${path}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'CheapStay',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

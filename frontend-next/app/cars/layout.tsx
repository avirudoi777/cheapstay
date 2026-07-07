import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Rent a Car — Compare Prices Worldwide',
  description: 'Compare car rental prices from Enterprise, Hertz, Avis, Sixt and more. Find the cheapest rental car for your next trip.',
  path: '/cars',
});

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

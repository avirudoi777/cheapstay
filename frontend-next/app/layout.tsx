import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import HeaderClient from '@/components/HeaderClient';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://cheapstay.co'),
  title: {
    default: 'CheapStay — Compare Cheap Hotel Prices | Agoda vs Booking.com',
    template: '%s | CheapStay',
  },
  description: 'Find the cheapest hotel prices by comparing Agoda and Booking.com in real-time. Save money on every booking — Bangkok, Bali, Tokyo and 190+ destinations worldwide.',
  keywords: ['cheap hotels', 'cheapstay', 'hotel price comparison', 'Agoda vs Booking.com', 'cheap stay', 'best hotel deals', 'Bangkok cheap hotels', 'Asia hotel prices'],
  authors: [{ name: 'CheapStay', url: 'https://cheapstay.co' }],
  creator: 'CheapStay',
  openGraph: {
    title: 'CheapStay — Compare Cheap Hotel Prices',
    description: 'Find the cheapest hotel prices by comparing Agoda and Booking.com side by side in real-time. Always get the best rate.',
    url: 'https://cheapstay.co',
    siteName: 'CheapStay',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CheapStay — Hotel Price Comparison' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CheapStay — Find the Cheapest Hotel Price',
    description: 'Compare Agoda and Booking.com side by side. Always find the best rate.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://cheapstay.co',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://cheapstay.co/#website',
      url: 'https://cheapstay.co',
      name: 'CheapStay',
      description: 'Compare cheap hotel prices across Agoda and Booking.com in real-time.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://cheapstay.co/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://cheapstay.co/#organization',
      name: 'CheapStay',
      url: 'https://cheapstay.co',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cheapstay.co/logo.png',
        width: 200,
        height: 60,
      },
      description: 'Hotel price comparison tool that finds the cheapest rate across Agoda and Booking.com.',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="icon" type="image/png" href="/s_logo.png" />
        <link rel="apple-touch-icon" href="/s_logo.png" />
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Travelpayouts affiliate tracking */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var s=document.createElement("script");s.async=1;s.src='https://tpembars.com/NTM4MTk3.js?t=538197';document.head.appendChild(s);})();` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">

        {/* Google Analytics 4 — set NEXT_PUBLIC_GA_ID in Vercel env vars */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
            `}</Script>
          </>
        )}

        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="CheapStay — Hotel Price Comparison" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <HeaderClient />
          </div>
        </header>

        <div className="bg-teal/10 border-b border-teal/20 text-center py-1.5 text-xs text-teal font-medium tracking-wide">
          Beta — We&apos;re still testing. Always confirm the final price at checkout.
        </div>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-gray-100 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="CheapStay" width={100} height={28} className="h-7 w-auto opacity-80" />
              <span className="text-xs text-gray-400">© 2026 CheapStay</span>
            </div>
            <nav className="flex items-center gap-4 text-xs text-gray-400">
              <Link href="/privacy" className="hover:text-navy transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/about" className="hover:text-navy transition-colors">About</Link>
              <span>·</span>
              <Link href="/contact" className="hover:text-navy transition-colors">Contact</Link>
            </nav>
            <p className="text-xs text-gray-400">Compare cheap hotel prices worldwide</p>
          </div>
        </footer>

        {/* Vercel Analytics — page views & web vitals */}
        <Analytics />
      </body>
    </html>
  );
}

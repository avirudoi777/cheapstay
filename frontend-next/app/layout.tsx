import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import HeaderClient from '@/components/HeaderClient';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-4N9WY15BK2';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cheapstay.co'),
  title: {
    default: 'CheapStay — Know What You Need Before You Fly',
    template: '%s | CheapStay',
  },
  description: 'Check passport, visa, and vaccine requirements for your route, plus real layover and airport tips — then book flights, hotels, and cars in one place.',
  keywords: ['visa requirements', 'passport requirements', 'travel vaccine requirements', 'layover guide', 'airport tips', 'flight booking', 'hotel price comparison', 'car rental search', 'travel hacks', 'entry requirements by country', 'transit visa', 'cashback travel', 'best travel credit cards'],
  authors: [{ name: 'Avi', url: 'https://www.cheapstay.co/about' }],
  creator: 'CheapStay',
  openGraph: {
    title: 'CheapStay — Know What You Need Before You Fly',
    description: 'Check passport, visa, and vaccine requirements for your route, plus real layover and airport tips — then book flights, hotels, and cars in one place.',
    url: 'https://www.cheapstay.co',
    siteName: 'CheapStay',
    type: 'website',
    locale: 'en_US',
    images: [{ url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=630&fit=crop&auto=format', width: 1200, height: 630, alt: 'CheapStay — Know What You Need Before You Fly' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CheapStay — Know What You Need Before You Fly',
    description: 'Check passport, visa, and vaccine requirements for your route, plus real layover and airport tips — then book flights, hotels, and cars in one place.',
    images: ['https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=630&fit=crop&auto=format'],
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
    canonical: 'https://www.cheapstay.co',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.cheapstay.co/#website',
      url: 'https://www.cheapstay.co',
      name: 'CheapStay',
      description: 'Passport, visa, and vaccine requirements plus flight, hotel, and car booking — everything you need to know before you fly',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://www.cheapstay.co/search?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.cheapstay.co/#organization',
      name: 'CheapStay',
      url: 'https://www.cheapstay.co',
      logo: 'https://www.cheapstay.co/logo.png',
      sameAs: ['https://www.facebook.com/profile.php?id=61591071667374'],
    },
    {
      '@type': 'Person',
      name: 'Avi',
      jobTitle: 'Full-time traveler & founder of CheapStay',
      description: 'Full-time traveler who has visited nearly 50 countries. Founded CheapStay to share insider booking hacks.',
      url: 'https://www.cheapstay.co/about',
      sameAs: ['https://www.facebook.com/profile.php?id=61591071667374'],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I book hotels cheaper using a VPN?',
          acceptedAnswer: { '@type': 'Answer', text: 'Set your VPN to a Thailand server before searching on Agoda or Booking.com. Thai IP addresses are shown prices 20-40% lower than US or European IPs — for hotels anywhere in the world.' },
        },
        {
          '@type': 'Question',
          name: 'Is using a VPN to find cheaper hotel prices legal?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes, using a VPN is completely legal in most countries. You are simply browsing the internet from a different location. CheapStay teaches you how to find the best publicly available price.' },
        },
        {
          '@type': 'Question',
          name: 'Which is cheaper — Agoda or Booking.com?',
          acceptedAnswer: { '@type': 'Answer', text: 'It depends on the destination and dates. CheapStay compares both in real time so you always see the lowest price. In Asia, Agoda is often cheaper. In Europe, Booking.com tends to win.' },
        },
        {
          '@type': 'Question',
          name: 'What credit card is best for hotel bookings?',
          acceptedAnswer: { '@type': 'Answer', text: 'Chase Sapphire Preferred earns 2x points on hotels with no foreign fees — best for most travelers. Amex Gold has the biggest welcome bonus. Capital One Venture is the simplest — 2x miles on everything.' },
        },
        {
          '@type': 'Question',
          name: 'Can I get cashback on hotel bookings?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes. TopCashback and Rakuten offer 3–8% cashback on Agoda and Booking.com. Stack this with Thai IP pricing and a travel credit card for maximum savings.' },
        },
      ],
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
        {/* Travelpayouts Drive affiliate tracking — source 537802 */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var script=document.createElement("script");script.async=1;script.src='https://tpembars.com/NTM3ODAy.js?t=537802';document.head.appendChild(script);})();` }} />
        {/* Microsoft Clarity — heatmaps & session recordings */}
        <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x9y4hja5ui");` }} />
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

        <footer className="bg-white border-t border-gray-100 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Guides</p>
                <div className="space-y-2">
                  <Link href="/fly-to" className="block text-xs text-gray-400 hover:text-navy transition-colors">Travel requirements by country</Link>
                  <Link href="/vpn-guide" className="block text-xs text-gray-400 hover:text-navy transition-colors">How to use a VPN for cheaper hotels</Link>
                  <Link href="/cashback" className="block text-xs text-gray-400 hover:text-navy transition-colors">Cashback guide</Link>
                  <Link href="/blog" className="block text-xs text-gray-400 hover:text-navy transition-colors">Travel hacks &amp; tips</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Destinations</p>
                <div className="space-y-2">
                  <Link href="/destinations" className="block text-xs text-gray-400 hover:text-navy transition-colors">Popular destinations</Link>
                  <Link href="/hotels/bangkok" className="block text-xs text-gray-400 hover:text-navy transition-colors">Bangkok hotels</Link>
                  <Link href="/hotels/bali" className="block text-xs text-gray-400 hover:text-navy transition-colors">Bali hotels</Link>
                  <Link href="/hotels/tokyo" className="block text-xs text-gray-400 hover:text-navy transition-colors">Tokyo hotels</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Shop</p>
                <div className="space-y-2">
                  <Link href="/shop" className="block text-xs text-gray-400 hover:text-navy transition-colors">Travel gear</Link>
                  <Link href="/cars" className="block text-xs text-gray-400 hover:text-navy transition-colors">Rent a car</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Company</p>
                <div className="space-y-2">
                  <Link href="/about" className="block text-xs text-gray-400 hover:text-navy transition-colors">About</Link>
                  <Link href="/consult" className="block text-xs font-semibold hover:opacity-80 transition-colors" style={{ color: '#1D9E75' }}>📞 Book a call with Avi</Link>
                  <Link href="/contact" className="block text-xs text-gray-400 hover:text-navy transition-colors">Contact</Link>
                  <Link href="/privacy" className="block text-xs text-gray-400 hover:text-navy transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="block text-xs text-gray-400 hover:text-navy transition-colors">Terms of Service</Link>
                  <a href="https://www.facebook.com/profile.php?id=61591071667374" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                    Facebook
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="CheapStay" width={100} height={28} className="h-7 w-auto opacity-80" />
                <span className="text-xs text-gray-400">© 2026 CheapStay</span>
              </div>
              <p className="text-xs text-gray-400">Know what you need before you fly · Flights, hotels & cars</p>
            </div>
            <p className="text-[11px] text-gray-300 text-center mt-4">
              Some links on this site are affiliate links — we may earn a commission at no extra cost to you.{' '}
              <Link href="/terms" className="underline hover:text-gray-400 transition-colors">Terms</Link>
              {' · '}
              <Link href="/privacy" className="underline hover:text-gray-400 transition-colors">Privacy</Link>
            </p>
          </div>
        </footer>

        {/* Dev mode badge — hidden automatically when DUFFEL_LIVE_API_KEY is set */}
        {process.env.NEXT_PUBLIC_DUFFEL_TEST_MODE === 'true' && (
          <div style={{
            position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999,
            background: '#F59E0B', color: '#1C1917',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
            padding: '5px 10px', borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            pointerEvents: 'none', userSelect: 'none',
          }}>
            TEST MODE
          </div>
        )}

      </body>
    </html>
  );
}

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
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet" />
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

        <header className="bg-surface sticky top-0 z-40 shadow-sm">
          <div className="max-w-container-max mx-auto px-gutter h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="CheapStay — Hotel Price Comparison" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <HeaderClient />
          </div>
        </header>

        <div className="bg-primary/10 border-b border-primary/20 text-center py-1.5 text-xs text-primary font-medium tracking-wide">
          Beta — We&apos;re still testing. Always confirm the final price at checkout.
        </div>

        <main className="flex-1">{children}</main>

        <footer className="w-full bg-pro-navy mt-8">
          <div className="max-w-container-max mx-auto px-gutter py-section-gap">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-12 border-b border-white/10">
              <div className="col-span-2 sm:col-span-1 space-y-3">
                <div className="text-lg font-bold text-white">CheapStay.co</div>
                <p className="text-xs text-white/50 leading-relaxed max-w-[220px]">Know what you need before you fly — passport, visa &amp; vaccine checks, plus real booking hacks from a full-time traveler.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-sky-blue uppercase tracking-widest mb-3">Guides</p>
                <div className="space-y-2.5">
                  <Link href="/fly-to" className="block text-xs text-white/70 hover:text-white transition-colors">Travel requirements by country</Link>
                  <Link href="/vpn-guide" className="block text-xs text-white/70 hover:text-white transition-colors">How to use a VPN for cheaper hotels</Link>
                  <Link href="/cashback" className="block text-xs text-white/70 hover:text-white transition-colors">Cashback guide</Link>
                  <Link href="/blog" className="block text-xs text-white/70 hover:text-white transition-colors">Travel hacks &amp; tips</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-sky-blue uppercase tracking-widest mb-3">Destinations</p>
                <div className="space-y-2.5">
                  <Link href="/destinations" className="block text-xs text-white/70 hover:text-white transition-colors">Popular destinations</Link>
                  <Link href="/hotels/bangkok" className="block text-xs text-white/70 hover:text-white transition-colors">Bangkok hotels</Link>
                  <Link href="/hotels/bali" className="block text-xs text-white/70 hover:text-white transition-colors">Bali hotels</Link>
                  <Link href="/hotels/tokyo" className="block text-xs text-white/70 hover:text-white transition-colors">Tokyo hotels</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-sky-blue uppercase tracking-widest mb-3">Company</p>
                <div className="space-y-2.5">
                  <Link href="/about" className="block text-xs text-white/70 hover:text-white transition-colors">About</Link>
                  <Link href="/shop" className="block text-xs text-white/70 hover:text-white transition-colors">Travel gear</Link>
                  <Link href="/cars" className="block text-xs text-white/70 hover:text-white transition-colors">Rent a car</Link>
                  <Link href="/consult" className="block text-xs font-semibold text-sky-blue hover:opacity-80 transition-colors">Book a call with Avi</Link>
                  <Link href="/contact" className="block text-xs text-white/70 hover:text-white transition-colors">Contact</Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>© 2026 CheapStay.co</span>
                <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
              </div>
              <a href="https://www.facebook.com/profile.php?id=61591071667374" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-sky-blue transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              </a>
            </div>
            <p className="text-[11px] text-white/30 text-center mt-4">
              Some links on this site are affiliate links — we may earn a commission at no extra cost to you.
            </p>
          </div>
        </footer>

        {/* Book a call FAB — sitewide */}
        <Link href="/consult"
          className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full concierge-shadow flex items-center justify-center group hover:pr-6 transition-all duration-300">
          <span className="material-symbols-outlined text-[22px]">support_agent</span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold text-sm">Book a call with Avi</span>
        </Link>

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

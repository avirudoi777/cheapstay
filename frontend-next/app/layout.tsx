import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';
import HeaderClient from '@/components/HeaderClient';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Cheapstay — Always the cheapest hotel price',
  description: 'Compare hotel prices across Agoda, Hotellook and more. Always find the cheapest rate with Cheapstay.',
  keywords: 'cheap hotels, hotel price comparison, Agoda prices, hotel deals',
  openGraph: {
    title: 'Cheapstay — Always the cheapest hotel price',
    description: 'Compare hotel prices and find the best deal every time.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="icon" type="image/png" href="/s_logo.png" />
        <link rel="apple-touch-icon" href="/s_logo.png" />
        {/* Travelpayouts Drive — affiliate tracking & verification */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var s=document.createElement("script");s.async=1;s.src='https://tpembars.com/NTM3ODAy.js?t=537802';document.head.appendChild(s);})();` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Cheapstay" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <HeaderClient />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-gray-100 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Cheapstay" width={100} height={28} className="h-7 w-auto opacity-80" />
              <span className="text-xs text-gray-400">Powered by Cheapstay</span>
            </div>
            <nav className="flex items-center gap-4 text-xs text-gray-400">
              <Link href="/privacy" className="hover:text-navy transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/about" className="hover:text-navy transition-colors">About</Link>
              <span>·</span>
              <a href="mailto:support@cheapstay.co" className="hover:text-navy transition-colors">Contact</a>
            </nav>
            <p className="text-xs text-gray-400">© 2026 Cheapstay. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

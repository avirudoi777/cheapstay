import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Travel Requirements by Country — Visa, Vaccines & Arrival Tips',
  description: 'Entry requirements, visa rules, vaccine certificates, and arrival tips for popular flight destinations. Know what you need before you book.',
  path: '/fly-to',
});

const DESTINATIONS = [
  {
    slug: 'thailand',
    name: 'Thailand',
    flag: '🇹🇭',
    airport: 'BKK · Suvarnabhumi',
    summary: 'Visa-free for 60+ nationalities · No vaccines required · Grab available at BKK',
  },
  {
    slug: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    airport: 'NRT / HND · Tokyo',
    summary: 'Visa-free for 68+ nationalities · No vaccines required · N\'EX train from Narita',
  },
  {
    slug: 'indonesia',
    name: 'Indonesia (Bali)',
    flag: '🇮🇩',
    airport: 'DPS · Ngurah Rai',
    summary: 'Visa on arrival available · Check yellow fever rules · Grab from airport',
  },
];

export default function FlyToIndexPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-extrabold text-navy mb-2">Travel requirements by country</h1>
        <p className="text-gray-500 text-sm mb-10">
          Visa rules, vaccine requirements, and arrival tips — verified before you book.
          Content marked <span className="bg-amber-100 text-amber-800 px-1 rounded text-xs font-mono">[VERIFY]</span> is pending human review.
        </p>

        <div className="space-y-3">
          {DESTINATIONS.map(d => (
            <Link key={d.slug} href={`/fly-to/${d.slug}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-teal/40 hover:shadow-sm transition-all group">
              <span className="text-3xl flex-shrink-0">{d.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy text-sm group-hover:text-teal transition-colors">{d.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{d.airport}</p>
                <p className="text-xs text-gray-500 mt-1">{d.summary}</p>
              </div>
              <span className="text-gray-300 group-hover:text-teal transition-colors text-sm">→</span>
            </Link>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-10">
          More destinations coming soon.{' '}
          <Link href="/consult" className="text-teal hover:underline font-semibold">
            Need a specific country? Book a call →
          </Link>
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';
import { FLY_TO } from '@/lib/fly-to-data';

export const metadata: Metadata = buildPageMetadata({
  title: 'Travel Requirements by Country — Visa, Vaccines & Arrival Tips',
  description: 'Entry requirements, visa rules, vaccine certificates, and arrival tips for popular flight destinations. Know what you need before you book.',
  path: '/fly-to',
});

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
          {Object.entries(FLY_TO).map(([slug, dest]) => (
            <Link key={slug} href={`/fly-to/${slug}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-teal/40 hover:shadow-sm transition-all group">
              <span className="text-3xl flex-shrink-0">{dest.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-navy text-sm group-hover:text-teal transition-colors">{dest.name}</p>
                  {dest.last_verified
                    ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">Verified</span>
                    : <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Pending review</span>
                  }
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{dest.airportName}</p>
                {dest.last_verified && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last verified: {new Date(dest.last_verified).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
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

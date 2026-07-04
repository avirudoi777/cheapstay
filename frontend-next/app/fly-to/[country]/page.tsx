import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/metadata';
import { FLY_TO } from '@/lib/fly-to-data';

export const revalidate = 86400;

interface Props { params: Promise<{ country: string }> }

export async function generateStaticParams() {
  return Object.keys(FLY_TO).map(country => ({ country }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const dest = FLY_TO[country];
  if (!dest) return {};
  return buildPageMetadata({
    title: `Flying to ${dest.name} — Entry Requirements, Visa & Travel Tips`,
    description: `Visa requirements, health certificates, airport arrival tips and flight search for ${dest.name}. Everything you need before you fly.`,
    path: `/fly-to/${country}`,
    image: dest.img,
  });
}

export default async function FlyToPage({ params }: Props) {
  const { country } = await params;
  const dest = FLY_TO[country];
  if (!dest) notFound();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dest.faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const verifiedDate = dest.last_verified
    ? new Date(dest.last_verified).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dest.img} alt={dest.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-white/70 text-xs mb-1">Travel requirements</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {dest.flag} Flying to {dest.name}
            </h1>
            <p className="text-white/80 text-sm mt-1">Visa · Health · Arrival · Flights</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Verify disclaimer + last verified date */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div className="text-xs text-amber-800 leading-relaxed space-y-1">
            <p>
              <strong>Content under review.</strong> Entry requirements and health rules change frequently.
              Information marked <code className="bg-amber-100 px-1 rounded">[VERIFY]</code> has not yet been
              confirmed against authoritative sources. Do not rely on this page for travel decisions until
              verified content is published. Always check{' '}
              <a href="https://www.iatatravelcentre.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">IATA Travel Centre</a>
              {' '}and your government&apos;s travel advisory.
            </p>
            <p className="text-amber-700">
              {verifiedDate
                ? <>Last verified: <strong>{verifiedDate}</strong>{dest.recheck_note ? ` · ${dest.recheck_note}` : ''}</>
                : 'Last verified: not yet reviewed — treat all content as unconfirmed.'
              }
            </p>
            {dest.sources.length > 0 && (
              <p>
                Sources:{' '}
                {dest.sources.map((url, i) => (
                  <span key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline">{new URL(url).hostname}</a>
                    {i < dest.sources.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        {/* Search flights CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-navy text-sm">Search flights to {dest.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">Compare prices across all airlines · seats & baggage included</p>
          </div>
          <Link href={`/?to=${dest.airportCode}`}
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #00C9B1, #1A73E8)' }}>
            Search flights →
          </Link>
        </div>

        {/* Entry requirements */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <span>🛂</span> Entry requirements
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Visa-free entry">{dest.entry.visaFreeCountries}</Row>
            <Row label="Visa on arrival">{dest.entry.visaOnArrival}</Row>
            <Row label="e-Visa">{dest.entry.evisa}</Row>
            <Row label="Passport validity">{dest.entry.passportValidity}</Row>
            <Note>{dest.entry.notes}</Note>
          </div>
        </section>

        {/* Health & vaccines */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <span>💉</span> Health & vaccine requirements
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Recommended vaccines">{dest.health.vaccines}</Row>
            <Row label="Yellow fever">{dest.health.yellowFever}</Row>
            <Row label="Malaria">{dest.health.malaria}</Row>
            <Note>{dest.health.notes}</Note>
          </div>
        </section>

        {/* Arrival tips */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <span>✈️</span> Arriving at {dest.airportName}
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Currency">{dest.arrival.currency}</Row>
            <Row label="SIM card">{dest.arrival.simCard}</Row>
            <Row label="Transport">{dest.arrival.transport}</Row>
            <Row label="Customs">{dest.arrival.customs}</Row>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-base font-bold text-navy mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {dest.faqs.map(({ q, a }, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-100 group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-navy list-none">
                  {q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs ml-3 flex-shrink-0">▼</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom flight CTA */}
        <div className="bg-navy rounded-2xl p-6 text-center">
          <p className="text-white font-bold mb-1">Ready to book your flight to {dest.name}?</p>
          <p className="text-white/60 text-xs mb-4">Compare prices · baggage included · cancel if eligible</p>
          <Link href={`/?to=${dest.airportCode}`}
            className="inline-block text-sm font-bold text-navy bg-white px-6 py-2.5 rounded-xl transition-opacity hover:opacity-90">
            Search flights to {dest.name} →
          </Link>
        </div>

      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
      <span className="text-gray-400 font-medium text-xs pt-0.5">{label}</span>
      <span className="text-gray-700">{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{children}</p>;
}

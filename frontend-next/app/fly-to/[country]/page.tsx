import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/metadata';
import { FLY_TO } from '@/lib/fly-to-data';
import { FLY_TO_HOTEL_MAP } from '@/lib/fly-to-hotel-map';
import { CARD_DB, DEFAULT_CARDS } from '@/lib/card-offers';
import WeatherClock from '@/components/WeatherClock';
import CardOfferCard from '@/components/CardOfferCard';

export const revalidate = 86400;

interface Props { params: Promise<{ country: string }> }

const AVI_TIPS: Record<string, string> = {
  thailand: "Land at Suvarnabhumi and skip the taxi queue — the Airport Rail Link is faster and a fraction of the cost. I use it every time I fly into Bangkok.",
  japan: "Japan is still cash-heavy outside the big cities — I always grab yen from a 7-Eleven ATM right at the airport before I even find my hotel.",
  indonesia: "Flying into Bali? Use Grab or a Bluebird taxi from the airport, never an unlicensed driver in the parking lot — I learned that one the expensive way.",
  vietnam: "Ho Chi Minh City and Hanoi feel completely different from each other — if it's your first trip, I'd pick one and go deep rather than rushing both.",
  uae: "Dubai Metro from the airport is genuinely the fastest way into the city during traffic hours — skip the taxi queue if you're headed anywhere near Downtown.",
  singapore: "Don't rush through Changi. If you've got a layover, Jewel's Rain Vortex and the early baggage-storage counter are worth the detour before you clear immigration.",
  india: "Get your SIM at the dedicated airport telecom counter, not from a street vendor — bring your passport and a photo, it's a 15-minute process that saves you a headache later.",
  'south-korea': "Download KakaoMap or Naver Map before you land — Google Maps directions barely work in Korea, and it's the one thing that catches first-time visitors off guard.",
};

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

  const hotelMatch = FLY_TO_HOTEL_MAP[country];
  const aviPhoto = country === 'singapore' ? '/avi-singapore.jpg' : '/avi-profile.jpg';
  const cards = DEFAULT_CARDS.map(k => CARD_DB[k]);

  return (
    <main className="min-h-screen bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dest.img} alt={dest.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-white/70 text-xs mb-1">Travel requirements</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {dest.flag} Flying to {dest.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <p className="text-white/80 text-sm">Visa · Health · Arrival · Flights</p>
              <WeatherClock timezone={dest.timezone} lat={dest.lat} lng={dest.lng} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

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

        {/* Avi's Insider Hack */}
        <section className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start"
          style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-navy-light))' }}>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-sky-blue flex-shrink-0">
            <Image src={aviPhoto} alt="Avi" fill sizes="96px" className="object-cover object-top" />
          </div>
          <div>
            <p className="text-sky-blue font-label-bold text-label-bold mb-2">Avi&apos;s Insider Tip</p>
            <p className="text-white/90 text-sm sm:text-base italic leading-relaxed">{AVI_TIPS[country]}</p>
          </div>
        </section>

        {/* Travel Essentials bento */}
        <section>
          <h2 className="font-headline-md text-headline-md text-pro-navy mb-4">Travel essentials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-border-subtle">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">password</span>
              </div>
              <h3 className="font-headline-md text-base text-pro-navy mb-2">Visa-free entry</h3>
              <p className="text-sm text-on-surface-variant">{dest.entry.visaFreeCountries}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-border-subtle">
              <div className="w-10 h-10 bg-tertiary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-tertiary">medical_services</span>
              </div>
              <h3 className="font-headline-md text-base text-pro-navy mb-2">Health &amp; vaccines</h3>
              <p className="text-sm text-on-surface-variant">{dest.health.yellowFever}</p>
            </div>
            <div className="bg-pro-navy p-5 rounded-xl text-white">
              <div className="w-10 h-10 bg-teal-accent rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white">gavel</span>
              </div>
              <h3 className="font-headline-md text-base text-sky-blue mb-2">Customs</h3>
              <p className="text-sm text-white/80">{dest.arrival.customs}</p>
            </div>
          </div>
        </section>

        {/* Entry requirements (full detail) */}
        <section className="bg-white rounded-2xl border border-border-subtle p-6">
          <h2 className="text-base font-bold text-pro-navy mb-4 flex items-center gap-2">
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

        {/* Health & vaccines (full detail) */}
        <section className="bg-white rounded-2xl border border-border-subtle p-6">
          <h2 className="text-base font-bold text-pro-navy mb-4 flex items-center gap-2">
            <span>💉</span> Health &amp; vaccine requirements
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Recommended vaccines">{dest.health.vaccines}</Row>
            <Row label="Yellow fever">{dest.health.yellowFever}</Row>
            <Row label="Malaria">{dest.health.malaria}</Row>
            <Note>{dest.health.notes}</Note>
          </div>
        </section>

        {/* Local apps */}
        {dest.localApps && dest.localApps.length > 0 && (
          <section>
            <h2 className="font-headline-md text-headline-md text-pro-navy mb-4">Essential local apps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dest.localApps.map(app => (
                <div key={app.name} className="bg-white p-5 rounded-xl border border-border-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {app.category === 'ride-share' ? 'directions_car' : app.category === 'payment' ? 'contactless' : 'map'}
                    </span>
                    <h3 className="font-headline-md text-sm text-pro-navy">{app.name}</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant">{app.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Arrival & Connectivity */}
        <section className="bg-white rounded-2xl border border-border-subtle p-6">
          <h2 className="text-base font-bold text-pro-navy mb-4 flex items-center gap-2">
            <span>✈️</span> Arriving at {dest.airportName}
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Currency">{dest.arrival.currency}</Row>
            <Row label="SIM card">{dest.arrival.simCard}</Row>
            <Row label="Transport">{dest.arrival.transport}</Row>
          </div>
        </section>

        {/* Search flights CTA */}
        <div className="bg-white rounded-2xl border border-border-subtle p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-pro-navy text-sm">Search flights to {dest.name}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Compare prices across all airlines · seats &amp; baggage included</p>
          </div>
          <Link href={`/?to=${dest.airportCode}`}
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90 whitespace-nowrap bg-primary">
            Search flights →
          </Link>
        </div>

        {/* Search hotels CTA — only when a matching /hotels/[city] page exists */}
        {hotelMatch && (
          <div className="bg-white rounded-2xl border border-border-subtle p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-pro-navy text-sm">Cheap hotels in {hotelMatch.cityName}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Real prices, sorted by best value</p>
            </div>
            <Link href={`/hotels/${hotelMatch.citySlug}`}
              className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: 'var(--color-tertiary)' }}>
              View hotels →
            </Link>
          </div>
        )}

        {/* Real card offers */}
        <section className="rounded-2xl overflow-hidden border border-tertiary/20 bg-gradient-to-br from-sky-blue/10 to-primary/5">
          <div className="px-5 pt-5 pb-2">
            <p className="text-sm font-extrabold text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Cards travelers use for trips like this
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">The right travel card earns miles on every dollar you spend on this trip.</p>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {cards.map(card => <CardOfferCard key={card.name} card={card} />)}
          </div>
          <p className="text-[9px] text-center pb-3 text-outline">
            Affiliate links — we may earn a commission at no cost to you
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-base font-bold text-pro-navy mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {dest.faqs.map(({ q, a }, i) => (
              <details key={i} className="bg-white rounded-xl border border-border-subtle group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-pro-navy list-none">
                  {q}
                  <span className="text-on-surface-variant group-open:rotate-180 transition-transform text-xs ml-3 flex-shrink-0">▼</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom flight CTA */}
        <div className="bg-pro-navy rounded-2xl p-6 text-center">
          <p className="text-white font-bold mb-1">Ready to book your flight to {dest.name}?</p>
          <p className="text-white/60 text-xs mb-4">Compare prices · baggage included · cancel if eligible</p>
          <Link href={`/?to=${dest.airportCode}`}
            className="inline-block text-sm font-bold text-pro-navy bg-white px-6 py-2.5 rounded-xl transition-opacity hover:opacity-90">
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
      <span className="text-on-surface-variant font-medium text-xs pt-0.5">{label}</span>
      <span className="text-pro-navy/80">{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{children}</p>;
}

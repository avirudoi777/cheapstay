import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/metadata';

export const revalidate = 86400; // rebuild once per day

/* ─── Destination data ───────────────────────────────────────────────────── */

interface DestinationData {
  name: string;
  capital: string;
  flag: string;
  airportCode: string;
  airportName: string;
  img: string;
  entry: {
    visaFreeCountries: string;        // who gets visa-free
    visaOnArrival: string;            // who gets VOA
    evisa: string;                    // e-visa availability
    passportValidity: string;         // minimum validity required
    notes: string;                    // [VERIFY] placeholder
  };
  health: {
    vaccines: string;                 // required / recommended
    yellowFever: string;              // required from which countries
    malaria: string;                  // risk level / prophylaxis
    notes: string;                    // [VERIFY] placeholder
  };
  arrival: {
    currency: string;
    simCard: string;
    transport: string;
    customs: string;
  };
  faqs: { q: string; a: string }[];
}

const DESTINATIONS: Record<string, DestinationData> = {
  thailand: {
    name: 'Thailand',
    capital: 'Bangkok',
    flag: '🇹🇭',
    airportCode: 'BKK',
    airportName: 'Suvarnabhumi Airport (BKK)',
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=600&fit=crop&auto=format',
    entry: {
      visaFreeCountries: '[VERIFY: confirm current visa-exempt list — approx. 60+ nationalities including US, UK, EU, AU as of mid-2025]',
      visaOnArrival: '[VERIFY: confirm VOA eligibility — historically ~20 nationalities including India, China]',
      evisa: '[VERIFY: Thailand e-Visa available via official Thai e-Visa portal — confirm current supported nationalities]',
      passportValidity: '[VERIFY: typically 6 months beyond arrival date — confirm current requirement]',
      notes: '⚠️ Entry rules change frequently. Always verify at the official Royal Thai Embassy website or IATA Travel Centre before booking.',
    },
    health: {
      vaccines: '[VERIFY: routine vaccines (MMR, Hepatitis A/B, Typhoid) generally recommended — confirm with your doctor or travel clinic]',
      yellowFever: '[VERIFY: Yellow fever vaccination certificate may be required if arriving from a yellow-fever-endemic country — confirm current list]',
      malaria: '[VERIFY: malaria risk varies by region — low risk in Bangkok/tourist areas, higher in some border regions — check CDC/WHO maps]',
      notes: '⚠️ Health requirements are sourced from WHO and CDC. Always verify current requirements with your doctor and official government sources before travel.',
    },
    arrival: {
      currency: 'Thai Baht (THB). ATMs widely available. Best rates from Superrich or Vasu exchange booths in Bangkok.',
      simCard: 'DTAC, AIS, and True Move H SIM cards available at the airport arrivals hall (approx. 300–500 THB for 7–15 days unlimited data).',
      transport: 'Suvarnabhumi: Airport Rail Link (45 min to city, 45 THB) or metered taxi (300–500 THB to city, expressway toll extra). Grab available.',
      customs: '200 cigarettes or 250g tobacco duty-free. 1 litre alcohol. Declare cash over 450,000 THB.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Thailand?', a: '[VERIFY] Many nationalities can enter Thailand visa-free for 30–60 days. Check the official Thai Embassy website for your passport.' },
      { q: 'Do I need any vaccinations for Thailand?', a: '[VERIFY] No vaccinations are legally required for most travelers, but Hepatitis A, Typhoid, and routine vaccines are commonly recommended. Yellow fever certificate required if arriving from endemic countries.' },
      { q: 'Is yellow fever vaccination required for Thailand?', a: '[VERIFY] Yellow fever vaccination proof is required only if you are arriving from a country with risk of yellow fever transmission. Confirm the current list with Thai authorities.' },
      { q: 'What is the cheapest way to get from Suvarnabhumi airport to Bangkok?', a: 'The Airport Rail Link is the fastest and cheapest — 45 THB to Phaya Thai station, about 30 minutes. Metered taxis cost around 300–500 THB plus expressway tolls.' },
      { q: 'Can I get a SIM card at Bangkok airport?', a: 'Yes — AIS, DTAC, and True Move H all have counters in the arrivals hall at both Suvarnabhumi and Don Mueang. Tourist SIMs with unlimited data typically cost 300–500 THB.' },
    ],
  },

  japan: {
    name: 'Japan',
    capital: 'Tokyo',
    flag: '🇯🇵',
    airportCode: 'NRT',
    airportName: 'Narita International Airport (NRT) / Haneda Airport (HND)',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop&auto=format',
    entry: {
      visaFreeCountries: '[VERIFY: approx. 68 nationalities including US, UK, most EU, AU, CA enter visa-free — confirm current list at Japan Ministry of Foreign Affairs]',
      visaOnArrival: '[VERIFY: Japan does not offer visa on arrival — travelers not on the visa-exempt list must apply in advance]',
      evisa: '[VERIFY: Japan e-Visa available for some nationalities — check Japan e-Visa portal for eligibility]',
      passportValidity: '[VERIFY: passport must be valid for the duration of stay — confirm current requirement]',
      notes: '⚠️ Always verify at Japan Ministry of Foreign Affairs or IATA Travel Centre. Rules changed post-COVID and may continue to change.',
    },
    health: {
      vaccines: '[VERIFY: no vaccines legally required — Hepatitis A/B, Japanese Encephalitis (for rural/extended stays) commonly recommended]',
      yellowFever: '[VERIFY: yellow fever vaccination certificate not typically required for Japan — confirm current status]',
      malaria: '[VERIFY: Japan is considered malaria-free — no prophylaxis needed for most travelers]',
      notes: '⚠️ Verify current health entry requirements at Japan Ministry of Health and WHO before travel.',
    },
    arrival: {
      currency: 'Japanese Yen (JPY). Japan is still largely cash-based. ATMs at 7-Eleven and Japan Post accept foreign cards reliably.',
      simCard: 'IIJ, Mobal, and airport SIM vending machines available at Narita and Haneda arrivals. IC Card (Suica/Pasmo) recommended for transit.',
      transport: 'Narita: Narita Express (N\'EX) to Shinjuku ~90 min (3,070 JPY) or Limousine Bus (~90 min, ~3,200 JPY). Haneda: monorail to Hamamatsucho ~20 min (500 JPY).',
      customs: '200 cigarettes or 50 cigars duty-free. 3 bottles (760ml each) alcohol. Declare cash over 1 million JPY.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Japan?', a: '[VERIFY] Many nationalities — including US, UK, EU — can visit Japan visa-free for up to 90 days. Check Japan\'s Ministry of Foreign Affairs for your specific passport.' },
      { q: 'Do I need any vaccinations for Japan?', a: '[VERIFY] No vaccinations are legally required to enter Japan. Routine vaccines and Hepatitis A are commonly recommended. Japanese Encephalitis vaccine is sometimes recommended for rural or extended stays.' },
      { q: 'Is Japan safe to visit?', a: 'Japan consistently ranks among the safest countries in the world. Crime rates are very low. The main risks for travelers are earthquakes and typhoons (seasonal).' },
      { q: 'Can I use my credit card in Japan?', a: 'Japan is still heavily cash-based, especially outside major cities and tourist areas. Always carry cash. 7-Eleven ATMs and Japan Post ATMs reliably accept foreign Visa/Mastercard.' },
      { q: 'What is the cheapest way from Narita airport to Tokyo?', a: 'The Narita Express (N\'EX) is the most convenient at around 3,070 JPY. The Keisei Skyliner is slightly cheaper (2,570 JPY). Highway buses (~1,000–1,500 JPY) are cheapest but slower.' },
    ],
  },

  indonesia: {
    name: 'Indonesia',
    capital: 'Jakarta',
    flag: '🇮🇩',
    airportCode: 'DPS',
    airportName: 'Ngurah Rai International Airport, Bali (DPS)',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=600&fit=crop&auto=format',
    entry: {
      visaFreeCountries: '[VERIFY: Indonesia offers visa-free entry to approx. 169 nationalities for 30 days — confirm at Indonesia immigration website]',
      visaOnArrival: '[VERIFY: Visa on Arrival available at major entry points for many nationalities — approx. USD 35 for 30 days, extendable once]',
      evisa: '[VERIFY: Indonesia e-VOA (electronic Visa on Arrival) available at molina.imigrasi.go.id — confirm current eligibility and pricing]',
      passportValidity: '[VERIFY: passport must be valid for at least 6 months beyond arrival — confirm current requirement]',
      notes: '⚠️ Indonesia immigration rules change. Verify at the official Directorate General of Immigration website or IATA Travel Centre.',
    },
    health: {
      vaccines: '[VERIFY: Hepatitis A, Typhoid, Rabies (for extended rural stays) commonly recommended — confirm with travel clinic]',
      yellowFever: '[VERIFY: yellow fever certificate required if arriving from a yellow-fever-endemic country — confirm current country list]',
      malaria: '[VERIFY: malaria risk exists in some outer islands (Papua, Maluku) but Bali is generally considered low risk — check CDC/WHO maps]',
      notes: '⚠️ Always check current health requirements with WHO, CDC, and your own doctor before traveling.',
    },
    arrival: {
      currency: 'Indonesian Rupiah (IDR). ATMs widely available in Bali and Jakarta. Avoid money changers on the street — use banks or official changers.',
      simCard: 'Telkomsel (most reliable coverage), XL, and Indosat SIM cards available at airport arrivals. Tourist SIM with 5–15GB data approx. 50,000–100,000 IDR.',
      transport: 'Bali (DPS): Metered taxi (Bluebird recommended) or Grab to Kuta ~150,000 IDR (20 min), Seminyak ~200,000 IDR. Pre-arranged hotel transfers also common.',
      customs: '200 cigarettes or 25 cigars duty-free. 1 litre alcohol (must be declared). Declare cash over USD 100,000.',
    },
    faqs: [
      { q: 'Do I need a visa to visit Bali / Indonesia?', a: '[VERIFY] Many nationalities can get a Visa on Arrival (VOA) at Bali airport for approximately USD 35 for 30 days, extendable once. Some nationalities qualify for visa-free entry. Check Indonesia\'s official immigration site.' },
      { q: 'Do I need vaccinations for Indonesia / Bali?', a: '[VERIFY] No vaccinations are legally required for most travelers. Hepatitis A, Typhoid, and routine vaccines are commonly recommended. Rabies vaccine is recommended for long-term or rural travel. Always confirm with your doctor.' },
      { q: 'Is Bali safe for tourists?', a: 'Bali is generally very safe for tourists. The main issues are traffic accidents (renting a scooter without experience is risky), petty theft in crowded areas, and the occasional scam around currency exchange.' },
      { q: 'What is the best SIM card for Bali?', a: 'Telkomsel (Simpati/As) has the best coverage across Bali including areas outside Kuta/Seminyak. Available at the airport arrivals hall for approximately 100,000–150,000 IDR with 10–15GB data.' },
      { q: 'How do I get from Bali airport to Seminyak or Ubud?', a: 'Use Grab (app-based, fixed price) or Bluebird metered taxis — avoid unlicensed drivers outside. Seminyak is about 20 minutes (~200,000 IDR), Ubud about 1.5 hours (~350,000–450,000 IDR).' },
    ],
  },
};

/* ─── Page ───────────────────────────────────────────────────────────────── */

interface Props { params: Promise<{ country: string }> }

export async function generateStaticParams() {
  return Object.keys(DESTINATIONS).map(country => ({ country }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const dest = DESTINATIONS[country];
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
  const dest = DESTINATIONS[country];
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

        {/* Verify disclaimer */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Content under review.</strong> Entry requirements and health rules change frequently.
            Information marked <code className="bg-amber-100 px-1 rounded">[VERIFY]</code> has not yet been
            confirmed against authoritative sources. Do not rely on this page for travel decisions until
            verified content is published. Always check{' '}
            <a href="https://www.iatatravelcentre.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">IATA Travel Centre</a>
            {' '}and your government&apos;s travel advisory.
          </p>
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
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Visa-free entry</span>
              <span className="text-gray-700">{dest.entry.visaFreeCountries}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Visa on arrival</span>
              <span className="text-gray-700">{dest.entry.visaOnArrival}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">e-Visa</span>
              <span className="text-gray-700">{dest.entry.evisa}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Passport validity</span>
              <span className="text-gray-700">{dest.entry.passportValidity}</span>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{dest.entry.notes}</p>
          </div>
        </section>

        {/* Health & vaccines */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <span>💉</span> Health & vaccine requirements
          </h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Recommended vaccines</span>
              <span className="text-gray-700">{dest.health.vaccines}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Yellow fever</span>
              <span className="text-gray-700">{dest.health.yellowFever}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Malaria</span>
              <span className="text-gray-700">{dest.health.malaria}</span>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{dest.health.notes}</p>
          </div>
        </section>

        {/* Arrival tips */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <span>✈️</span> Arriving at {dest.airportName}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Currency</span>
              <span className="text-gray-700">{dest.arrival.currency}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">SIM card</span>
              <span className="text-gray-700">{dest.arrival.simCard}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Transport</span>
              <span className="text-gray-700">{dest.arrival.transport}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-400 font-medium text-xs pt-0.5">Customs</span>
              <span className="text-gray-700">{dest.arrival.customs}</span>
            </div>
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

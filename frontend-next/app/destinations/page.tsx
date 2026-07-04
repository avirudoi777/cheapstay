import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Popular Hotel Destinations — Compare Prices & Save | CheapStay',
  description: 'Find the cheapest hotel prices in Bangkok, Bali, Tokyo, Singapore, Chiang Mai, and more. Compare Agoda vs Booking.com with Thai-market pricing.',
  keywords: ['cheap hotels Bangkok', 'cheap hotels Bali', 'cheap hotels Tokyo', 'cheap hotels Singapore', 'hotel price comparison Asia', 'best hotel deals Asia'],
  openGraph: {
    title: 'Popular Hotel Destinations — Compare Prices & Save',
    description: 'Find the cheapest hotel prices in Bangkok, Bali, Tokyo, Singapore and more. Agoda vs Booking.com comparison.',
    url: 'https://cheapstay.co/destinations',
  },
  alternates: { canonical: 'https://cheapstay.co/destinations' },
};

const DESTINATIONS = [
  {
    city: 'Bangkok',
    country: 'Thailand',
    flag: '🇹🇭',
    avg_price: 42,
    saving: 38,
    desc: 'Asia\'s best value capital. World-class hotels for a fraction of Western prices.',
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&h=400&fit=crop&auto=format',
    search: 'Bangkok',
    tags: ['Best for Thai IP', 'Budget-friendly', 'Street food'],
  },
  {
    city: 'Bali',
    country: 'Indonesia',
    flag: '🇮🇩',
    avg_price: 55,
    saving: 31,
    desc: 'Villas with private pools at resort prices. Ubud and Seminyak are the sweet spots.',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop&auto=format',
    search: 'Bali',
    tags: ['Private villas', 'Digital nomad', 'Nature'],
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    avg_price: 68,
    saving: 22,
    desc: 'Surprisingly affordable. Dormy Inn chain is the best value per night in Asia.',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop&auto=format',
    search: 'Tokyo',
    tags: ['Business hotels', 'Onsen included', 'Great transit'],
  },
  {
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    avg_price: 110,
    saving: 19,
    desc: 'Pricier than the rest of Asia but Thai IP still cuts 15–20% off OTA rates.',
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&h=400&fit=crop&auto=format',
    search: 'Singapore',
    tags: ['Luxury value', 'Short stays', 'Layover hub'],
  },
  {
    city: 'Chiang Mai',
    country: 'Thailand',
    flag: '🇹🇭',
    avg_price: 28,
    saving: 35,
    desc: 'The digital nomad capital of Southeast Asia. Incredible value, slow pace.',
    img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=400&fit=crop&auto=format',
    search: 'Chiang Mai',
    tags: ['Nomad hotspot', 'Monthly stays', 'Mountains'],
  },
  {
    city: 'Phuket',
    country: 'Thailand',
    flag: '🇹🇭',
    avg_price: 62,
    saving: 33,
    desc: 'Beach resorts at Thai IP prices. Patong for nightlife, Kata for families.',
    img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&h=400&fit=crop&auto=format',
    search: 'Phuket',
    tags: ['Beaches', 'Resorts', 'Family-friendly'],
  },
  {
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    flag: '🇲🇾',
    avg_price: 38,
    saving: 27,
    desc: 'KL has some of the best luxury-for-less hotels in Southeast Asia.',
    img: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&h=400&fit=crop&auto=format',
    search: 'Kuala Lumpur',
    tags: ['City breaks', 'Luxury value', 'Food scene'],
  },
  {
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    flag: '🇻🇳',
    avg_price: 35,
    saving: 29,
    desc: 'Vietnam\'s most dynamic city with boutique hotels at backpacker prices.',
    img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop&auto=format',
    search: 'Ho Chi Minh City',
    tags: ['Boutique hotels', 'Street food', 'History'],
  },
];

const REGIONS = ['All', 'Thailand', 'Southeast Asia', 'East Asia'];

export default function DestinationsPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section style={{ background: '#0a1628' }} className="py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Find cheap hotels in the world&apos;s best destinations
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto">
            Compare Agoda and Booking.com prices — fetched from Bangkok servers so you always see the lowest available rate.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full">Agoda vs Booking.com</span>
            <span className="text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full">Thai-market pricing</span>
            <span className="text-xs bg-white/10 text-white/70 px-3 py-1.5 rounded-full">Save up to 40%</span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Savings explainer */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg" style={{ background: '#E1F5EE' }}>💡</div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-0.5">Why our prices are lower</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              CheapStay fetches prices from a Bangkok server — the same IP a Thai local would use. Agoda and Booking.com show lower rates to Thai users. The &quot;saving vs US price&quot; figures below show the typical gap we see.
            </p>
          </div>
        </div>

        {/* Destinations grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {DESTINATIONS.map(dest => (
            <Link key={dest.city} href={`/?destination=${encodeURIComponent(dest.search)}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow flex flex-col group">
              <div className="relative aspect-[4/3]">
                <Image src={dest.img} alt={`Cheap hotels in ${dest.city}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-extrabold text-base leading-none">{dest.flag} {dest.city}</p>
                  <p className="text-white/70 text-xs">{dest.country}</p>
                </div>
                <div className="absolute top-3 right-3 bg-teal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Save {dest.saving}%
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-gray-500 mb-3 leading-relaxed flex-1">{dest.desc}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {dest.tags.map(t => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400">From </span>
                    <span className="text-base font-extrabold text-gray-900">${dest.avg_price}</span>
                    <span className="text-xs text-gray-400">/night</span>
                  </div>
                  <span className="text-xs font-bold text-teal group-hover:underline">Search →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Fly-to cross-links */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-navy mb-1">Before you fly</h2>
          <p className="text-xs text-gray-400 mb-4">Visa rules, vaccine requirements &amp; airport arrival tips for these destinations.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { slug: 'thailand', name: 'Thailand', flag: '🇹🇭', verified: true },
              { slug: 'japan', name: 'Japan', flag: '🇯🇵', verified: true },
              { slug: 'indonesia', name: 'Indonesia (Bali)', flag: '🇮🇩', verified: true },
              { slug: 'vietnam', name: 'Vietnam', flag: '🇻🇳', verified: true },
              { slug: 'singapore', name: 'Singapore', flag: '🇸🇬', verified: true },
              { slug: 'uae', name: 'UAE (Dubai)', flag: '🇦🇪', verified: true },
              { slug: 'india', name: 'India', flag: '🇮🇳', verified: true },
              { slug: 'south-korea', name: 'South Korea', flag: '🇰🇷', verified: true },
            ].map(d => (
              <Link key={d.slug} href={`/fly-to/${d.slug}`}
                className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-3.5 py-3 hover:border-teal/40 hover:shadow-sm transition-all group">
                <span className="text-xl flex-shrink-0">{d.flag}</span>
                <span className="text-xs font-semibold text-navy group-hover:text-teal transition-colors">{d.name}</span>
                <span className="text-gray-300 group-hover:text-teal transition-colors text-xs ml-auto">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: '#0a1628' }}>
          <h2 className="text-xl font-extrabold text-white mb-2">Don&apos;t see your destination?</h2>
          <p className="text-white/60 text-sm mb-6">Search any hotel worldwide — we compare Agoda and Booking.com from a Bangkok IP.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1D9E75' }}>
            Search any destination →
          </Link>
        </div>
      </div>
    </main>
  );
}

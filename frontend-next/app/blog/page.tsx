import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import NewsletterForm from './NewsletterForm';

export const metadata: Metadata = {
  title: 'Travel Hacks & Tips | CheapStay Blog',
  description: 'Real tips from a full-time traveler — 50+ countries, hundreds of hotels. Booking hacks, hotel reviews, VPN guides, credit card strategies.',
};

const POSTS = [
  {
    slug: 'same-hotel-two-prices',
    title: 'I booked the same Bangkok hotel twice — $240 on US IP, $141 on Thai IP. Here\'s exactly how I did it.',
    excerpt: 'Same hotel, same dates, same room type. The only difference was my IP address. Here\'s the full breakdown of what I found and exactly how to replicate it.',
    category: 'Booking hack',
    readTime: 8,
    featured: true,
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=400&fit=crop&auto=format',
  },
  {
    slug: 'three-cards-i-always-travel-with',
    title: 'The 3 cards I always travel with (and which one I use for each booking)',
    excerpt: 'After years of full-time travel, I\'ve narrowed it down to 3 cards. Here\'s exactly which one I use for hotels, flights, and everyday spending abroad.',
    category: 'Credit cards',
    readTime: 5,
    featured: false,
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&h=360&fit=crop&auto=format',
  },
  {
    slug: 'priceline-24hr-cancellation',
    title: 'Priceline\'s 24-hour cancellation: the flight hack most people miss',
    excerpt: 'US law gives you 24 hours to cancel any flight booked 7+ days out — for free. Here\'s how to use it to lock in a price while you compare options.',
    category: 'Flights',
    readTime: 4,
    featured: false,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=360&fit=crop&auto=format',
  },
  {
    slug: 'tokyo-sixty-per-night',
    title: 'Tokyo on $60/night: the best value hotels I actually stayed in',
    excerpt: 'Tokyo has a reputation for being expensive. It isn\'t — if you know where to look. These are the hotels I personally stayed in and would book again.',
    category: 'Hotel reviews',
    readTime: 6,
    featured: false,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=360&fit=crop&auto=format',
  },
  {
    slug: 'when-booking-direct-beats-agoda',
    title: 'When booking direct beats Agoda — my rule of thumb',
    excerpt: 'Agoda and Booking.com are usually cheapest. But not always. Here\'s the simple check I do before every booking that\'s saved me hundreds of dollars.',
    category: 'Booking hacks',
    readTime: 3,
    featured: false,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=360&fit=crop&auto=format',
  },
];

const FILTERS = ['All posts', 'Booking hacks', 'Hotel reviews', 'Flights', 'Credit cards', 'Countries'];

const CATEGORY_COLORS: Record<string, string> = {
  'Booking hack': '#1D9E75',
  'Booking hacks': '#1D9E75',
  'Credit cards': '#1A73E8',
  'Flights': '#7c3aed',
  'Hotel reviews': '#b45309',
  'Countries': '#dc2626',
};

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured)!;
  const rest = POSTS.filter(p => !p.featured);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section style={{ background: '#0a1628' }} className="py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Real tips from a full-time traveler
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto">
            50+ countries, hundreds of hotels — every article is written from lived experience, not theory.
          </p>

          {/* Author bar */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: '#1D9E75' }}>AV</div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">Avi — Founder & full-time traveler</div>
              <div className="text-xs text-white/50">50+ countries · 500+ hotels · Saved $40k+ on bookings</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map(f => (
            <Link key={f} href={f === 'All posts' ? '/blog' : `/blog?category=${encodeURIComponent(f)}`}
              className="px-4 py-2 rounded-full text-xs font-bold border transition-all bg-white border-gray-200 text-gray-600 hover:border-teal hover:text-teal">
              {f}
            </Link>
          ))}
        </div>

        {/* Featured post */}
        <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-8 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative aspect-[4/3] sm:aspect-auto">
              <Image src={featured.img} alt={featured.title} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <span className="absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                style={{ background: CATEGORY_COLORS[featured.category] ?? '#1D9E75' }}>
                {featured.category}
              </span>
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold mb-3 px-2.5 py-1 rounded-full w-fit"
                style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                ⭐ Featured
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug mb-3">
                <Link href={`/blog/${featured.slug}`} className="hover:text-teal transition-colors">
                  {featured.title}
                </Link>
              </h2>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{featured.readTime} min read</span>
                <Link href={`/blog/${featured.slug}`}
                  className="text-xs font-bold text-teal hover:underline flex items-center gap-1">
                  Read article →
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Post grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {rest.map(post => (
            <article key={post.slug}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
              <div className="relative aspect-[16/9]">
                <Image src={post.img} alt={post.title} fill className="object-cover" unoptimized />
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: CATEGORY_COLORS[post.category] ?? '#6b7280' }}>
                  {post.category}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 flex-1">
                  <Link href={`/blog/${post.slug}`} className="hover:text-teal transition-colors">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{post.readTime} min read</span>
                  <Link href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-teal hover:underline">
                    Read →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="rounded-2xl p-8 text-center" style={{ background: '#0a1628' }}>
          <h2 className="text-xl font-extrabold text-white mb-2">Get the weekly travel hack</h2>
          <p className="text-white/60 text-sm mb-6">One email per week. Real tips, no filler. Unsubscribe anytime.</p>
          <NewsletterForm />
        </div>
      </div>
    </main>
  );
}

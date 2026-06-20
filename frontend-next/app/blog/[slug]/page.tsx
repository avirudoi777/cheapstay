import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const POSTS: Record<string, {
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  img: string;
  content: string | null;
}> = {
  'same-hotel-two-prices': {
    title: 'I booked the same Bangkok hotel twice — $240 on US IP, $141 on Thai IP. Here\'s exactly how I did it.',
    excerpt: 'Same hotel, same dates, same room type. The only difference was my IP address.',
    category: 'Booking hack',
    readTime: 8,
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=600&fit=crop&auto=format',
    content: `
I've been traveling full-time for years and I track every booking obsessively. So when I noticed a price gap between what my US-based friend paid vs what I was seeing from Bangkok, I decided to test it properly.

## The experiment

Same hotel: Avani+ Riverside Bangkok. Same dates: 3 nights in March. Same room: Superior King.

- **US IP (New York VPN):** $240 total
- **Thai IP (Bangkok, no VPN):** $141 total

That's a **41% difference** on the exact same booking.

## Why this happens

Booking platforms use dynamic pricing based on dozens of signals. One of the biggest is your IP address — it tells them your likely purchasing power and local market expectations. Thai users see Thai-market prices. US users see US-market prices.

This isn't illegal. It's the same reason a flight from Bangkok to London costs less when booked in Thailand than when booked in the US.

## How to replicate it

1. **Get a VPN** — NordVPN is what I use. Connect to a Thailand server (Bangkok specifically).
2. **Clear your cookies** — or open an incognito/private window. This prevents the booking site from recognizing your account history.
3. **Search on Agoda or Booking.com** while connected to the Thai server.
4. **Book and pay** — you can use any credit card, no Thai card needed.

That's it. The price you see with a Thai IP is the price you pay.

## Does it work for hotels outside Thailand?

Yes. I've tested it for hotels in Japan, Bali, Vietnam, and even Europe. Thai IP pricing is lower across the board — not just for Thai hotels.

## Does it always work?

Not always. Some hotels have rate parity agreements. Some OTAs are getting better at detecting VPNs. But in my experience, it works roughly 70-80% of the time, and the savings when it does work are significant.

## What VPN I use

I've used NordVPN for 3 years. It's fast, has reliable Thai servers, and hasn't been blocked by Agoda in my experience. [Get it here](https://go.nordvpn.net/aff_c?offer_id=15&aff_id=112618) — they usually have a deal running.

## Try it yourself

Use CheapStay to compare Agoda and Booking.com prices instantly — it fetches prices server-side from a Bangkok IP so you see Thai-market rates without needing a VPN yourself.
    `.trim(),
  },
  'three-cards-i-always-travel-with': {
    title: 'The 3 cards I always travel with (and which one I use for each booking)',
    excerpt: 'After years of full-time travel, I\'ve narrowed it down to 3 cards.',
    category: 'Credit cards',
    readTime: 5,
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=600&fit=crop&auto=format',
    content: null,
  },
  'priceline-24hr-cancellation': {
    title: 'Priceline\'s 24-hour cancellation: the flight hack most people miss',
    excerpt: 'US law gives you 24 hours to cancel any flight booked 7+ days out — for free.',
    category: 'Flights',
    readTime: 4,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=600&fit=crop&auto=format',
    content: null,
  },
  'tokyo-sixty-per-night': {
    title: 'Tokyo on $60/night: the best value hotels I actually stayed in',
    excerpt: 'Tokyo has a reputation for being expensive. It isn\'t — if you know where to look.',
    category: 'Hotel reviews',
    readTime: 6,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop&auto=format',
    content: null,
  },
  'when-booking-direct-beats-agoda': {
    title: 'When booking direct beats Agoda — my rule of thumb',
    excerpt: 'Agoda and Booking.com are usually cheapest. But not always.',
    category: 'Booking hacks',
    readTime: 3,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop&auto=format',
    content: null,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Booking hack': '#1D9E75',
  'Booking hacks': '#1D9E75',
  'Credit cards': '#1A73E8',
  'Flights': '#7c3aed',
  'Hotel reviews': '#b45309',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.img] },
  };
}

export function generateStaticParams() {
  return Object.keys(POSTS).map(slug => ({ slug }));
}

function renderContent(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xl font-extrabold text-gray-900 mt-8 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} className="text-gray-600 text-sm leading-relaxed ml-4 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="text-gray-600 text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }
  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} className="text-teal underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
    }
    return part;
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const catColor = CATEGORY_COLORS[post.category] ?? '#6b7280';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero image */}
      <div className="relative w-full h-64 sm:h-80">
        <Image src={post.img} alt={post.title} fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-2xl mx-auto">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white mb-3 inline-block"
              style={{ background: catColor }}>
              {post.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">{post.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#1D9E75' }}>AV</div>
          <div>
            <div className="text-sm font-bold text-gray-900">Avi</div>
            <div className="text-xs text-gray-400">{post.readTime} min read · Full-time traveler, 50+ countries</div>
          </div>
        </div>

        {/* Content */}
        {post.content ? (
          <article className="space-y-1">
            {renderContent(post.content)}
          </article>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">✍️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Full article coming soon</h2>
            <p className="text-sm text-gray-500 mb-6">Subscribe below to get it in your inbox the moment it's live.</p>
            <Link href="/blog" className="text-sm font-bold text-teal hover:underline">← Back to all articles</Link>
          </div>
        )}

        {/* CTA */}
        {post.content && (
          <div className="mt-10 p-6 rounded-2xl text-center" style={{ background: '#0a1628' }}>
            <p className="text-white font-bold mb-1">See Thai-market hotel prices right now</p>
            <p className="text-white/50 text-xs mb-4">No VPN needed — CheapStay fetches from Bangkok servers</p>
            <Link href="/" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#1D9E75' }}>
              Search hotels →
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← All articles</Link>
        </div>
      </div>
    </main>
  );
}

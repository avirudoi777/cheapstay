import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogScrollTracker from '@/components/BlogScrollTracker';

const POSTS: Record<string, {
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  img: string;
  content: string;
}> = {
  'same-hotel-two-prices': {
    title: "I booked the same Bangkok hotel twice — $240 on US IP, $141 on Thai IP. Here's exactly how I did it.",
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

Not always. Some hotels have rate parity agreements. Some OTAs are getting better at detecting VPNs. But in my experience, it works roughly 70–80% of the time, and the savings when it does work are significant.

## What VPN I use

I've used NordVPN for 3 years. It's fast, has reliable Thai servers, and hasn't been blocked by Agoda in my experience. [Get NordVPN here](https://go.nordvpn.net/aff_c?offer_id=15&aff_id=151019&url_id=902) — they usually have a deal running.

## Try it yourself

Use CheapStay to compare Agoda and Booking.com prices instantly — it fetches prices server-side from a Bangkok IP so you see Thai-market rates without needing a VPN yourself.
    `.trim(),
  },
  'three-cards-i-always-travel-with': {
    title: 'The 3 cards I always travel with (and which one I use for each booking)',
    excerpt: "After years of full-time travel, I've narrowed it down to 3 cards.",
    category: 'Credit cards',
    readTime: 5,
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=600&fit=crop&auto=format',
    content: `
I used to carry five travel cards and obsessively calculate which earned the most on every purchase. Now I carry three and I've stopped thinking about it. Here's the setup.

## Card 1: Chase Sapphire Preferred — my default hotel card

**Why:** 2x points on all travel including hotels. No foreign transaction fees. Points transfer to 14 airline and hotel partners at 1:1 — including Air France, United, Hyatt, and Marriott. 60,000 point sign-up bonus (worth ~$750 in travel).

**When I use it:** Every hotel booking, every flight, every Agoda and Booking.com payment.

**The math:** A $200 hotel stay earns 400 points. Worth ~$5–8 in travel depending on how you redeem. Not exciting on its own, but it stacks over hundreds of nights.

## Card 2: Amex Gold — for food and daily spend abroad

**Why:** 4x at restaurants worldwide (not just the US). 4x at US supermarkets. $120 dining credit per year. The welcome bonus is the biggest I've seen — regularly 60,000–90,000 points.

**When I use it:** Every restaurant, every cafe, every street food stall that takes cards. Also groceries when I'm staying in an apartment.

**The math:** At 4x on a $50 dinner, that's 200 Amex points. Transfer to Air France Flying Blue or Avianca LifeMiles and those points can be worth 2–3 cents each. That $50 dinner earned ~$4–6 in flights.

## Card 3: Capital One Venture — the no-brainer catch-all

**Why:** 2x miles on every purchase, full stop. No categories. No thinking. Miles can be used as statement credit against any travel purchase at 1 cent each.

**When I use it:** Anything that doesn't fit the other two — transport, tours, random purchases. Also useful when merchants don't accept Amex.

**The math:** Dead simple. $1 spent = 2 miles = 2 cents in travel credit.

## How I stack this with hotel hacks

The best move is combining these cards with Thai IP pricing (see my other post) and cashback portals. A $150 hotel booking through Rakuten at 5% cashback = $7.50 back. Paid with Chase Sapphire = 300 points (~$4.50). Total: ~$12 saved on a $150 booking. Every time.

## The card I don't carry

I stopped carrying airline-specific cards (United, Delta, etc.) because they lock you into one ecosystem. The flexible points from Chase and Amex are worth more because you can transfer to whichever partner has the best redemption for your route.

## Bottom line

- **Hotels & travel:** Chase Sapphire Preferred
- **Food:** Amex Gold
- **Everything else:** Capital One Venture

If you only get one, get the Chase Sapphire Preferred. It's the most versatile travel card I've used.
    `.trim(),
  },
  'priceline-24hr-cancellation': {
    title: "Priceline's 24-hour cancellation: the flight hack most people miss",
    excerpt: 'US law gives you 24 hours to cancel any flight booked 7+ days out — for free.',
    category: 'Flights',
    readTime: 4,
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=600&fit=crop&auto=format',
    content: `
Most people don't know this exists. US DOT regulation 14 CFR 259.5 requires all airlines to either hold a reservation at the quoted price for 24 hours without payment, or allow free cancellation within 24 hours of purchase — as long as the booking is made at least 7 days before departure.

## How to use this as a price-lock strategy

The trick is to use this rule to book now and decide later.

**Step 1:** Find a flight you like at a good price. Book it. Pay for it.

**Step 2:** Keep searching. Check Google Flights, Skyscanner, the airline direct. Check the same flight the next morning when sale prices sometimes update.

**Step 3:** If you find a better price within 24 hours, cancel the first booking (free) and rebook at the lower price.

**Step 4:** If you don't find better — you already have the ticket.

## The practical version

I use this every time I book a flight more than a week out. I book the best price I find, then spend 30 minutes the next morning checking if prices dropped overnight. About 30% of the time I find something better.

## Which airlines honor this

All US airlines by law. For international airlines operating to/from the US, they also must comply. That covers most major carriers.

**Airlines that are easy about it:** United, Delta, American, Southwest, JetBlue, Alaska.

**Watch out for:** Budget carriers like Spirit and Frontier sometimes make cancellation harder than it should be — read the cancellation flow carefully.

## The 7-day rule

This only applies to bookings made **at least 7 days before departure**. Last-minute bookings don't qualify. Plan accordingly.

## What about Priceline specifically

Priceline is my preferred OTA for this because their cancellation flow is fast and the refund usually hits within 3–5 business days. Expedia works too. Booking direct with the airline is the most reliable.

## Stack it with price alerts

Set a Google Flights price alert for the route before you book. If the alert emails you a drop within your 24-hour window, you know to cancel and rebook. I've saved $60–$180 doing this.

## The one thing to check

Some fares are marked "non-refundable" even on Priceline. For those, the 24-hour rule still applies — US law overrides the fare rules for the first 24 hours. But after 24 hours, those fares are genuinely non-refundable. Don't miss the window.
    `.trim(),
  },
  'tokyo-sixty-per-night': {
    title: 'Tokyo on $60/night: the best value hotels I actually stayed in',
    excerpt: "Tokyo has a reputation for being expensive. It isn't — if you know where to look.",
    category: 'Hotel reviews',
    readTime: 6,
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop&auto=format',
    content: `
Tokyo is one of my favorite cities to stay in precisely because of how good the value is at the mid-range level. $60–80/night in Tokyo gets you something that would cost $150–200 in London or New York. Here are the properties I've personally stayed in.

## Why Tokyo is cheaper than its reputation

The reputation comes from the bubble era of the 1980s and 90s. Modern Tokyo has:

- Intense hotel competition (thousands of properties)
- A historically weak yen (great for USD/EUR travelers right now)
- A culture of obsessive quality at every price point
- Capsule hotels and business hotels that punch above their price

## The neighborhoods to focus on

**Shinjuku:** Convenient, great transit connections, never boring. Slightly pricier but worth it for first-time visitors.

**Asakusa:** Old Tokyo feel, near Senso-ji temple, slightly cheaper than Shinjuku. My personal favorite.

**Akihabara:** Central, cheap, close to everything. Not as atmospheric but excellent value.

**Avoid:** Shibuya for budget stays — you pay for the address.

## Hotels I actually stayed in

### Dormy Inn Asakusa (around $65–75/night)

The Dormy Inn chain is the best kept secret in Japanese business hotel travel. They have natural hot spring baths (onsen) on the top floor included in the price, a ramen service at 21:30 (free), fast wifi, and rooms that are small but immaculately designed.

The Asakusa location puts you 5 minutes from the temple and 15 minutes by metro from anywhere in the city.

**Would I stay again:** Yes, every time I'm in Tokyo.

### Khaosan Tokyo Kabuki (around $45–55/night)

A hostel-hotel hybrid in Asakusa. Private rooms available from $45. The building itself is a renovated old structure with character. Communal spaces are social without being rowdy. Japanese breakfast included.

**Best for:** Solo travelers who want their own room but like meeting people.

### Via Inn Akihabara (around $60–70/night)

Standard business hotel, exceptional location. Everything works perfectly. Rooms are tiny (that's Tokyo) but the bed is good, the shower is strong, and checkout is 11am. Close to JR Akihabara for easy airport access.

**Best for:** Transit stops, short trips, anyone who just needs a clean reliable base.

## How I search for Tokyo hotels

I always compare Agoda vs Booking.com side by side — Tokyo is one of the cities where the price gap between the two is most consistent. Agoda usually wins by $5–15/night for the same property. Over a week, that's a meaningful difference.

I also search from a Thai IP (using CheapStay or a VPN) which drops prices another 10–15% on most Tokyo properties compared to searching from a US or European IP.

## The $60/night formula

Thai IP pricing + Agoda comparison + Asakusa or Akihabara location = consistently under $70/night for a decent private room in central Tokyo. I've done it 4 times in the last 2 years.
    `.trim(),
  },
  'when-booking-direct-beats-agoda': {
    title: 'When booking direct beats Agoda — my rule of thumb',
    excerpt: 'Agoda and Booking.com are usually cheapest. But not always.',
    category: 'Booking hacks',
    readTime: 3,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop&auto=format',
    content: `
I default to Agoda for Asia and Booking.com for Europe. But there's a specific check I do before every booking that has saved me money on dozens of trips.

## The 3-minute check

Before I confirm any booking on an OTA, I open the hotel's own website and check the direct rate. Takes 3 minutes. Here's what I look for:

**Book direct if:**
- The hotel's website matches or beats the OTA price AND offers a free amenity (breakfast, late checkout, room upgrade, parking)
- You're booking a long stay (5+ nights) — hotels are more likely to negotiate or match
- You're booking a boutique or independent property (they give up 15–20% commission to OTAs — they'd rather give you 10% off direct)
- The hotel has a "best rate guarantee" — click it, they mean it

**Stick with Agoda/Booking.com if:**
- The OTA is cheaper with no extras from the hotel
- You're booking a chain hotel (Marriott, Hilton, IHG) — their loyalty programs are better than any direct rate
- You need flexibility and the OTA has better cancellation terms

## The boutique hotel trick

Independent hotels hate paying 15–20% commission to OTAs. If you email them directly before booking and say "I'm ready to book 4 nights, can you match the Agoda price and add breakfast?", a surprising number will say yes. I do this for any stay over $100/night at an independent property.

The worst they say is no. The best result I've had was a $120/night villa in Bali that became $95/night + breakfast + airport transfer by asking.

## Chain hotels: always book direct

For Marriott, Hilton, Hyatt, IHG — book through the chain's own site or app. The points you earn on direct bookings are worth more than the marginal price difference you might find on an OTA. And you get status perks (room upgrades, late checkout) that OTA bookings don't get.

## My actual rule

OTA first, then a 3-minute check on the hotel's direct site. If the hotel is independent and the direct rate is within $10 of the OTA, I book direct and ask for one extra perk. If it's a chain, I book direct regardless. Everything else, Agoda wins.
    `.trim(),
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
    authors: [{ name: 'Avi', url: 'https://www.cheapstay.co/about' }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.img],
      type: 'article',
      authors: ['Avi'],
      url: `https://www.cheapstay.co/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.img],
    },
    alternates: { canonical: `https://www.cheapstay.co/blog/${slug}` },
  };
}

export function generateStaticParams() {
  return Object.keys(POSTS).map(slug => ({ slug }));
}

function renderContent(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inList = false;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length) {
      elements.push(<ul key={key++} className="space-y-2 my-3 ml-4">{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={key++} className="text-xl font-extrabold text-gray-900 mt-10 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={key++} className="text-base font-bold text-gray-900 mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('- ')) {
      inList = true;
      listItems.push(<li key={key++} className="text-gray-600 text-sm leading-relaxed list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={key++} className="h-2" />);
    } else {
      flushList();
      elements.push(<p key={key++} className="text-gray-600 text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushList();
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

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.img,
    author: {
      '@type': 'Person',
      name: 'Avi',
      url: 'https://www.cheapstay.co/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CheapStay',
      url: 'https://www.cheapstay.co',
    },
    url: `https://www.cheapstay.co/blog/${slug}`,
    mainEntityOfPage: `https://www.cheapstay.co/blog/${slug}`,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#1D9E75' }}>AV</div>
          <div>
            <div className="text-sm font-bold text-gray-900">Avi</div>
            <div className="text-xs text-gray-400">{post.readTime} min read · Full-time traveler, 50+ countries</div>
          </div>
        </div>

        <article className="space-y-1">
          {renderContent(post.content)}
        </article>

        <BlogScrollTracker title={post.title} slug={slug} />

        <div className="mt-10 p-6 rounded-2xl text-center" style={{ background: '#0a1628' }}>
          <p className="text-white font-bold mb-1">Find the cheapest hotel price right now</p>
          <p className="text-white/50 text-xs mb-4">Compare Agoda vs Booking.com — Thai-market prices, no VPN needed</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1D9E75' }}>
            Search hotels →
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← All articles</Link>
        </div>
      </div>
    </main>
  );
}

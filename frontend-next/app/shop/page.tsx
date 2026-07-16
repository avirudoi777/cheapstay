import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Travel Shop — Gear Worth Packing',
  description: 'Curated travel gear for nomads and frequent travelers. Luggage, tech, health kits and more — all with Amazon affiliate links.',
};

const CATEGORIES = [
  {
    id: 'luggage',
    title: 'Luggage & Bags',
    icon: '🧳',
    items: [
      { name: 'Away Carry-On', desc: 'Hard-shell carry-on with built-in USB battery. TSA-approved, lifetime warranty. The gold standard for frequent flyers.', price: 'From $295', bestFor: 'Frequent flyers', img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=away+carry+on+luggage&tag=cheapstay-20' },
      { name: 'Packing Cubes Set (6-piece)', desc: 'Compress clothes, stay organized, and never dig through your bag again. Game-changer for any trip length.', price: 'From $25', bestFor: 'All travelers', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=packing+cubes+travel+set&tag=cheapstay-20' },
      { name: 'Compression Bags', desc: 'Vacuum-seal clothes to half their size. Essential for long trips or bulky items like jackets.', price: 'From $12', bestFor: 'Long trips', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=travel+compression+bags+packing&tag=cheapstay-20' },
    ],
  },
  {
    id: 'tech',
    title: 'Tech & Power',
    icon: '🔌',
    items: [
      { name: 'Noise-Cancelling Headphones', desc: 'Survive long-haul flights and noisy hotel lobbies. Sony WH-1000XM5 or Bose QC45 — both excellent.', price: 'From $149', bestFor: 'Long-haul travelers', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=noise+cancelling+headphones+sony+bose&tag=cheapstay-20' },
      { name: 'Universal Travel Adapter', desc: 'Works in 150+ countries. USB-A + USB-C ports built in. One adapter that does everything.', price: 'From $18', bestFor: 'International travelers', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=universal+travel+adapter+usb-c+international&tag=cheapstay-20' },
      { name: 'Power Bank 20,000mAh', desc: 'Charge your phone 5+ times. Fast-charge capable. Airlines allow up to 100Wh (most 20k banks qualify).', price: 'From $35', bestFor: 'Long travel days', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=power+bank+20000mah+fast+charge+travel&tag=cheapstay-20' },
    ],
  },
  {
    id: 'health',
    title: 'Health & Comfort',
    icon: '💊',
    items: [
      { name: 'Travel Pharmacy Kit', desc: 'Antidiarrheal, antacid, antihistamine, ibuprofen — everything you need for common travel illness. I never leave without this.', price: 'From $15', bestFor: 'Asia & developing countries', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=travel+medicine+kit+antidiarrheal&tag=cheapstay-20' },
      { name: 'Sleep Travel Kit', desc: 'Contoured eye mask, foam earplugs, and memory foam neck pillow. The trifecta for sleeping anywhere.', price: 'From $20', bestFor: 'Red-eye flights & noisy hotels', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=travel+sleep+kit+eye+mask+neck+pillow+earplugs&tag=cheapstay-20' },
      { name: 'Quick-Dry Travel Towel', desc: 'Microfiber, dries in 30 minutes. Half the weight of a regular towel. Hostels, beaches, and budget hotels all covered.', price: 'From $15', bestFor: 'Budget & hostel travelers', img: 'https://images.unsplash.com/photo-1531825253887-cc82f6b58c2b?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=quick+dry+travel+microfiber+towel&tag=cheapstay-20' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: '🔒',
    items: [
      { name: 'RFID Travel Wallet', desc: 'Blocks card skimmers. Fits passport, cards, and cash. Slim enough for a front pocket.', price: 'From $20', bestFor: 'Busy airports & tourist areas', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=rfid+travel+wallet+passport&tag=cheapstay-20' },
      { name: 'TSA-Approved Luggage Locks', desc: '3-digit combo locks that TSA can open if needed. Keeps honest people honest on shared transport.', price: 'From $10', bestFor: 'Checked luggage', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format', url: 'https://www.amazon.com/s?k=tsa+approved+luggage+lock+combination&tag=cheapstay-20' },
    ],
  },
];

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-xs text-gray-400 hover:text-navy transition-colors mb-3 inline-block">← Back to search</Link>
        <h1 className="text-3xl font-extrabold text-navy">Travel gear worth packing</h1>
        <p className="text-gray-400 mt-2 max-w-xl">
          Curated by a full-time traveler with 500+ hotel stays. Every item here is something I actually use or would recommend without hesitation.
        </p>
      </div>

      {/* Category nav */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map(cat => (
          <a key={cat.id} href={`#${cat.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-navy hover:bg-teal/10 hover:text-teal transition-colors">
            {cat.icon} {cat.title}
          </a>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-16">
        {CATEGORIES.map(cat => (
          <section key={cat.id} id={cat.id}>
            <h2 className="text-xl font-bold text-navy mb-6 flex items-center gap-2">
              <span>{cat.icon}</span> {cat.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.items.map(item => (
                <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    <img src={item.img} alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-navy text-sm group-hover:text-teal transition-colors">{item.name}</h3>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{item.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 flex-1 leading-relaxed">{item.desc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                        Best for: {item.bestFor}
                      </span>
                      <span className="text-xs font-bold text-gray-400 group-hover:text-teal transition-colors">View on Amazon →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-400 mt-12 text-center border-t border-gray-100 pt-6">
        As an Amazon Associate we earn from qualifying purchases at no extra cost to you.
      </p>
    </div>
  );
}

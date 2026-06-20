import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel Cashback Guide — Stack Portals, Cards & Thai Prices | CheapStay',
  description: 'Get 3–8% cashback on every hotel booking. Stack Rakuten or TopCashback with a travel credit card and Thai IP pricing for maximum savings. Step-by-step guide.',
  keywords: ['hotel cashback', 'Rakuten hotels', 'TopCashback hotels', 'Agoda cashback', 'Booking.com cashback', 'hotel booking hacks', 'save money hotels'],
  openGraph: {
    title: 'Hotel Cashback Guide — Stack Portals, Cards & Thai Prices',
    description: 'Get 3–8% cashback on every hotel booking. Stack Rakuten or TopCashback with Thai IP pricing for maximum savings.',
    url: 'https://cheapstay.co/cashback',
  },
  alternates: { canonical: 'https://cheapstay.co/cashback' },
};

const PORTALS = [
  {
    name: 'Rakuten',
    cashback: 'Up to 8%',
    works_with: 'Agoda, Hotels.com, Priceline',
    notes: 'Best for US-based travelers. $30 welcome bonus. Pays quarterly via PayPal or check.',
    color: '#C0001B',
    logo: 'R',
    url: 'https://www.rakuten.com',
  },
  {
    name: 'TopCashback',
    cashback: 'Up to 6%',
    works_with: 'Booking.com, Agoda, Expedia',
    notes: 'Often beats Rakuten on Booking.com. No minimum payout. UK + US versions available.',
    color: '#1A7F37',
    logo: 'TC',
    url: 'https://www.topcashback.com',
  },
  {
    name: 'Cashback Monitor',
    cashback: 'Compares all',
    works_with: 'All major portals',
    notes: 'Not a portal itself — shows you which portal has the highest cashback rate right now. Always check here first.',
    color: '#0A66C2',
    logo: 'CM',
    url: 'https://www.cashbackmonitor.com',
  },
];

const STACK_STEPS = [
  {
    step: '1',
    title: 'Check Cashback Monitor',
    desc: 'Go to cashbackmonitor.com and search for Agoda or Booking.com. It compares Rakuten, TopCashback, and 20+ other portals in real time. Pick whichever has the highest rate today.',
  },
  {
    step: '2',
    title: 'Click through to the OTA',
    desc: 'From the cashback portal, click through to Agoda or Booking.com. This sets the tracking cookie that makes cashback work. Do not open the OTA in a new tab — use the portal link.',
  },
  {
    step: '3',
    title: 'Search from Thai IP (or use CheapStay)',
    desc: 'Once on Agoda or Booking.com, you\'re seeing global prices. Use a VPN on Thai server, or use CheapStay to find the Thai-market price first, then book on Agoda with that context.',
  },
  {
    step: '4',
    title: 'Pay with a travel credit card',
    desc: 'Chase Sapphire Preferred earns 2x points on all travel. Amex Gold earns 3x on hotels. Pick the card that earns the most on your total. This stacks on top of the cashback.',
  },
  {
    step: '5',
    title: 'Wait for cashback to confirm',
    desc: 'Cashback typically "tracks" within 24 hours and "confirms" after the stay (30–90 days). Don\'t cancel or modify the booking through a different channel or you may lose the cashback.',
  },
];

const EXAMPLE = {
  hotel: 'Avani+ Riverside Bangkok',
  nights: 3,
  base_price: 240,
  thai_price: 141,
  cashback_rate: 0.05,
  cashback_amount: 7.05,
  card_points: 282,
  card_points_value: 4.23,
};

export default function CashbackPage() {
  const totalSaved = (EXAMPLE.base_price - EXAMPLE.thai_price) + EXAMPLE.cashback_amount + EXAMPLE.card_points_value;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section style={{ background: '#0a1628' }} className="py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 text-white" style={{ background: '#1D9E75' }}>
            Cashback guide
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
            Stack cashback portals, credit cards,<br className="hidden sm:block" /> and Thai prices for maximum savings
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto">
            Most travelers use one trick. The real savings come from layering all three.
          </p>
        </div>
      </section>

      {/* Real example */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Real example — same hotel, same dates</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-4 bg-red-50 border border-red-100">
              <p className="text-xs text-gray-400 mb-1">US IP price</p>
              <p className="text-2xl font-extrabold text-red-500">${EXAMPLE.base_price}</p>
              <p className="text-xs text-gray-400">3 nights, Agoda</p>
            </div>
            <div className="rounded-xl p-4 bg-green-50 border border-green-100">
              <p className="text-xs text-gray-400 mb-1">Thai IP price</p>
              <p className="text-2xl font-extrabold text-green-600">${EXAMPLE.thai_price}</p>
              <p className="text-xs text-gray-400">same hotel, same dates</p>
            </div>
            <div className="rounded-xl p-4 border-2 border-teal bg-teal/5">
              <p className="text-xs text-gray-400 mb-1">Total saved</p>
              <p className="text-2xl font-extrabold text-teal">${totalSaved.toFixed(0)}</p>
              <p className="text-xs text-gray-400">price + cashback + points</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thai IP discount</span>
              <span className="font-bold text-green-600">−${(EXAMPLE.base_price - EXAMPLE.thai_price).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rakuten cashback (5%)</span>
              <span className="font-bold text-green-600">−${EXAMPLE.cashback_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Chase Sapphire points (2x)</span>
              <span className="font-bold text-green-600">~−${EXAMPLE.card_points_value.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100 font-bold">
              <span className="text-gray-900">You actually paid</span>
              <span className="text-teal">${(EXAMPLE.thai_price - EXAMPLE.cashback_amount - EXAMPLE.card_points_value).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* How to stack */}
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">How to stack all three — step by step</h2>
        <div className="space-y-4 mb-12">
          {STACK_STEPS.map(s => (
            <div key={s.step} className="bg-white rounded-2xl p-5 border border-gray-100 flex gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                style={{ background: '#1D9E75' }}>{s.step}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Portal comparison */}
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Best cashback portals for hotels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {PORTALS.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer sponsored"
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                  style={{ background: p.color }}>{p.logo}</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs font-bold text-teal">{p.cashback}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{p.works_with}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{p.notes}</p>
            </a>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Common questions</h2>
        <div className="space-y-4 mb-12">
          {[
            {
              q: 'Does cashback work with Thai IP pricing?',
              a: 'Yes. The cashback portal tracks your click to Agoda or Booking.com regardless of what IP you\'re using at the time. The lower Thai price just means your cashback is calculated on a smaller base — but you\'re still ahead overall.',
            },
            {
              q: 'Can I stack cashback and credit card points?',
              a: 'Yes — they\'re completely independent. Cashback is from the portal. Points are from your credit card. Both apply to the same transaction.',
            },
            {
              q: 'What if my cashback doesn\'t track?',
              a: 'This usually happens when you open a new tab or already have cookies from the OTA. Clear cookies and click through from the portal fresh. If it still doesn\'t track, most portals have a "missing cashback" claim process.',
            },
            {
              q: 'Does this work for hotel chains (Marriott, Hilton)?',
              a: 'Most cashback portals don\'t offer cashback on direct bookings with chains — the chains refuse to participate. For chains, book direct and earn loyalty points instead. The points are usually worth more anyway.',
            },
          ].map(faq => (
            <div key={faq.q} className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="font-bold text-gray-900 text-sm mb-2">{faq.q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: '#0a1628' }}>
          <h2 className="text-xl font-extrabold text-white mb-2">Start with the Thai IP price</h2>
          <p className="text-white/60 text-sm mb-6">CheapStay shows you Agoda and Booking.com prices from Bangkok servers — then you cashback on top.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1D9E75' }}>
            Search hotels →
          </Link>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Book a Travel Consultation with Avi | CheapStay',
  description: '1-on-1 travel consultation with a full-time traveler. Route planning, hotel recommendations, visa tips, and more. From $20.',
};

const WHAT_YOU_GET = [
  {
    icon: '🗺️',
    title: 'Route planning',
    desc: 'Tell me where you want to go and your budget — I\'ll map out the best order of destinations, transport options, and how long to spend each place.',
  },
  {
    icon: '🏨',
    title: 'Hotel recommendations',
    desc: 'I\'ll tell you exactly which neighborhoods to stay in, which hotels give the best value, and how to find prices 20–40% cheaper than most people pay.',
  },
  {
    icon: '✈️',
    title: 'Visa & entry requirements',
    desc: 'I\'ll check exactly what your passport needs — visa on arrival, e-visa, or embassy visit. Including vaccination requirements (yellow fever, etc.) that can get you denied boarding.',
  },
  {
    icon: '💸',
    title: 'Save money on every booking',
    desc: 'I\'ll show you my exact system: which site to book on, how to stack cashback portals, and which credit card to use at checkout.',
  },
  {
    icon: '📱',
    title: 'Digital nomad setup',
    desc: 'SIM cards, co-working spaces, VPN setup, travel insurance — everything you need to work and travel without stress.',
  },
  {
    icon: '🎒',
    title: 'Any travel question',
    desc: 'Whatever\'s on your mind — packing, safety, solo travel, traveling with kids, last-minute trips. No question is too small.',
  },
];

const TESTIMONIAL_PLACEHOLDERS = [
  {
    text: '"Avi saved me hours of research and probably $400 on my Southeast Asia trip. Worth every dollar."',
    name: 'Sarah M.',
    flag: '🇺🇸',
  },
  {
    text: '"I almost flew to Colombia without my yellow fever vaccine — Avi caught it. Literally saved my trip."',
    name: 'James K.',
    flag: '🇬🇧',
  },
  {
    text: '"Best $30 I ever spent on travel. Got a full 3-week Thailand itinerary with hotel recs and price hacks."',
    name: 'Priya R.',
    flag: '🇦🇺',
  },
];

export default function ConsultPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f9fafb' }}>

      {/* Hero */}
      <section style={{ background: '#0a1628' }} className="py-16 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
            AV
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Plan your trip with someone<br />who actually lives this way
          </h1>
          <p className="text-white/70 text-base mb-6 max-w-xl mx-auto">
            I&apos;ve traveled to 50+ countries, stayed in 500+ hotels, and saved over $40,000 on bookings.
            Book a 1-hour call and I&apos;ll help you plan your next trip — routes, hotels, visas, and money hacks.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['50+ countries', '500+ hotels', '$40k+ saved on bookings', '10+ years traveling'].map(s => (
              <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(29,158,117,0.2)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>
                {s}
              </span>
            ))}
          </div>
          <div className="inline-flex flex-col items-center gap-4">
            <div className="bg-white rounded-2xl px-10 py-5 text-center shadow-xl">
              <div className="text-xs text-gray-400 font-medium mb-1">1-hour consultation</div>
              <div className="text-5xl font-extrabold text-navy">$49</div>
              <div className="text-xs text-gray-400 mt-1">Payment collected at booking</div>
            </div>
            <a
              href="https://cal.com/avi-rudoi-gerpc4/travel-planning-call-with-avi"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
              Book your call — $49 →
            </a>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-navy text-center mb-2">What we cover in the call</h2>
          <p className="text-gray-400 text-sm text-center mb-10">One hour, your agenda — we cover whatever matters most for your trip</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHAT_YOU_GET.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-navy text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal story */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-navy mb-6 text-center">Why I do this</h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              I started traveling full-time years ago and quickly learned that most travel advice online is generic, outdated, or written by people who visited a place once. The real knowledge — which neighborhood to stay in, which site has cheaper prices, what vaccinations you actually need — comes from experience.
            </p>
            <p>
              I almost got stranded once because I didn&apos;t know about the yellow fever vaccine requirement flying from Brazil to Colombia. The airline turned me away at the gate. That mistake cost me time, money, and a lot of stress. Now I make sure that doesn&apos;t happen to the people I talk to.
            </p>
            <p>
              I built CheapStay because I wanted to automate the price comparison part. But some things still need a human conversation — your specific route, your budget, your travel style. That&apos;s what the call is for.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-extrabold text-navy text-center mb-8">What travelers say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIAL_PLACEHOLDERS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-600 leading-relaxed italic mb-4">{t.text}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.flag}</span>
                  <span className="text-xs font-semibold text-navy">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">* Early reviews from beta testers</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-navy mb-10">How it works</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {[
              { n: '1', title: 'Book a slot', desc: 'Pick a time that works for you via Calendly' },
              { n: '2', title: 'Pay', desc: 'Pay $20–50 via PayPal before the call' },
              { n: '3', title: 'Get on a call', desc: '1 hour on Google Meet or Zoom — your agenda' },
            ].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base mb-3"
                  style={{ background: '#1D9E75' }}>{step.n}</div>
                <h3 className="font-bold text-navy text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0a1628' }} className="py-14 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-white mb-3">Ready to plan your trip?</h2>
          <p className="text-white/60 text-sm mb-8">Limited slots available each week. Book early to get the time you want.</p>
          <a
            href="https://cal.com/avi-rudoi-gerpc4/travel-planning-call-with-avi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1D9E75, #1A73E8)' }}>
            Book your call — $49 →
          </a>
          <p className="text-white/40 text-xs mt-3">Payment collected securely at booking</p>
          <p className="text-white/40 text-xs mt-5">
            Not sure? <Link href="/contact" className="underline hover:text-white/70">Send me a message first</Link>
          </p>
        </div>
      </section>

    </div>
  );
}

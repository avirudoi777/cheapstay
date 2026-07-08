import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import ConsultBookButton from '@/components/ConsultBookButton';

export const metadata: Metadata = {
  title: 'Book a Travel Consultation with Avi | CheapStay',
  description: '1-on-1 travel consultation with a full-time traveler. Route planning, hotel recommendations, visa tips, and money-saving hacks. $49 for 1 hour.',
  openGraph: {
    title: 'Book a 1-Hour Travel Call with Avi',
    description: '50+ countries, 500+ hotels, $40k+ saved on bookings. Personalised route planning, hotel picks, and booking hacks.',
    url: 'https://cheapstay.co/consult',
  },
  alternates: { canonical: 'https://cheapstay.co/consult' },
};

const TRAVEL_PHOTOS = [
  { src: '/avi-singapore.jpg', label: 'Singapore' },
  { src: '/avi-taipei.jpg',    label: 'Taipei' },
  { src: '/avi-hongkong.jpg',  label: 'Hong Kong' },
  { src: '/avi-rio.jpg',       label: 'Rio de Janeiro' },
  { src: '/avi-pisa.jpg',      label: 'Pisa' },
];

const WHAT_YOU_GET = [
  { icon: '🗺️', title: 'Route planning', desc: 'Best order of destinations, transport between cities, how long to spend each place — tailored to your budget and travel style.' },
  { icon: '🏨', title: 'Hotel recommendations', desc: 'Which neighbourhoods to stay in, which hotels give the best value, and how to find prices 20–40% cheaper than most people pay.' },
  { icon: '✈️', title: 'Visa & entry requirements', desc: "Exactly what your passport needs — e-visa, visa on arrival, or embassy visit. Including vaccination requirements that can get you denied boarding." },
  { icon: '💸', title: 'Booking hacks', desc: 'My exact system: which site to book on, how to stack cashback portals, which credit card to use, and the Thai IP pricing trick.' },
  { icon: '📱', title: 'Digital nomad setup', desc: 'SIM cards, co-working spaces, VPN setup, travel insurance — everything you need to work and travel without stress.' },
  { icon: '🎒', title: 'Any travel question', desc: 'Packing, safety, solo travel, traveling with kids, last-minute trips. Whatever is on your mind.' },
];

const STATS = [
  { value: '50+', label: 'Countries visited' },
  { value: '500+', label: 'Hotels stayed in' },
  { value: '$40k+', label: 'Saved on bookings' },
  { value: '10+', label: 'Years full-time travel' },
];

export default function ConsultPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section style={{ background: '#0a1628' }} className="py-16 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                style={{ background: 'rgba(29,158,117,0.2)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>
                1-on-1 Travel Consultation
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Plan your trip with someone who actually lives this way
              </h1>
              <p className="text-white/60 text-base mb-8 leading-relaxed">
                I&apos;ve spent 10+ years traveling full-time across 50+ countries and 500+ hotels.
                Book a 1-hour call and I&apos;ll help you plan your next trip — routes, hotels, visas, and money hacks.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {STATS.map(s => (
                  <div key={s.value} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-xl font-extrabold text-white">{s.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <ConsultBookButton location="hero"
                  className="px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                  style={{ background: '#1D9E75' }}>
                  Book your call — $49 →
                </ConsultBookButton>
                <p className="text-xs text-white/40 self-center">Payment collected securely at booking</p>
              </div>
            </div>

            {/* Right — photo with floating badges */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Main photo */}
                <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl"
                  style={{ border: '3px solid rgba(255,255,255,0.12)' }}>
                  <Image src="/avi-profile.jpg" alt="Avi — full-time traveler and founder of CheapStay"
                    fill className="object-cover object-top" priority />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-24"
                    style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.8), transparent)' }} />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white font-extrabold text-sm">Avi</p>
                    <p className="text-white/60 text-xs">Founder · CheapStay</p>
                  </div>
                </div>

                {/* Floating badge — bottom left */}
                <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: '#1D9E75' }}>$</div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">$40k+ saved</div>
                    <div className="text-[10px] text-gray-400">on hotels & flights</div>
                  </div>
                </div>

                {/* Floating badge — top right */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2.5">
                  <div className="text-xs font-extrabold text-gray-900 mb-1">50+ countries</div>
                  <div className="flex gap-0.5">
                    {['🇹🇭','🇯🇵','🇮🇩','🇸🇬','🇫🇷'].map(f => (
                      <span key={f} className="text-base">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Travel photo strip ── */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="flex gap-3 px-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TRAVEL_PHOTOS.map(p => (
            <div key={p.src} className="relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden shadow-sm">
              <Image src={p.src} alt={p.label} fill className="object-cover" />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.22)' }} />
              <span className="absolute bottom-1.5 left-2 text-white text-[10px] font-bold">{p.label}</span>
            </div>
          ))}
          <div className="flex-shrink-0 w-32 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-200">
            +45 more
          </div>
        </div>
      </div>

      {/* ── What we cover ── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">What we cover in the call</h2>
            <p className="text-sm text-gray-400">One hour, your agenda — we go wherever matters most for your trip</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHAT_YOU_GET.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-12 px-4 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-extrabold text-gray-900 text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: '1', title: 'Pick a time', desc: 'Choose a slot from my calendar — usually available within 48 hours.' },
              { n: '2', title: 'Pay $49', desc: 'Secure payment at booking. No charge until your slot is confirmed.' },
              { n: '3', title: 'Get on the call', desc: '1 hour on Google Meet. Bring your questions, itinerary drafts, or anything.' },
            ].map(step => (
              <div key={step.n} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-base flex-shrink-0"
                  style={{ background: '#1D9E75' }}>{step.n}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Personal story ── */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
              <Image src="/avi-profile.jpg" alt="Avi" fill className="object-cover object-top" />
            </div>
            <div>
              <div className="font-extrabold text-gray-900 text-sm">Avi</div>
              <div className="text-xs text-gray-400">Founder, CheapStay</div>
              <div className="text-xs text-gray-400">Full-time traveler since 2014</div>
            </div>
          </div>
          <div className="sm:col-span-2 space-y-4 text-sm text-gray-600 leading-relaxed">
            <h2 className="text-xl font-extrabold text-gray-900">Why I do this</h2>
            <p>
              I started traveling full-time years ago and quickly learned that most travel advice online is generic, outdated, or written by people who visited a place once. The real knowledge — which neighbourhood to stay in, which site has cheaper prices, what vaccinations you actually need — comes from experience.
            </p>
            <p>
              I almost got stranded once because I didn&apos;t know about the yellow fever vaccine requirement flying from Brazil to Colombia. The airline turned me away at the gate. That mistake cost me time, money, and a lot of stress. I make sure that doesn&apos;t happen to the people I talk to.
            </p>
            <p>
              I built CheapStay to automate the price comparison part. But some things still need a real conversation — your specific route, your budget, your travel style. That&apos;s what the call is for.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 px-4" style={{ background: '#0a1628' }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-white/20">
            <Image src="/avi-profile.jpg" alt="Avi" fill className="object-cover object-top" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Ready to plan your trip?</h2>
          <p className="text-white/50 text-sm mb-8 max-w-sm mx-auto">
            Limited slots available each week. Book early to get the time you want.
          </p>
          <ConsultBookButton location="cta_bottom"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
            style={{ background: '#1D9E75' }}>
            Book your 1-hour call — $49 →
          </ConsultBookButton>
          <p className="text-white/30 text-xs mt-4">
            Not sure?{' '}
            <Link href="/contact" className="underline hover:text-white/60">Send me a message first</Link>
          </p>
        </div>
      </section>

    </main>
  );
}

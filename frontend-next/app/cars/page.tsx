'use client';
import { useState } from 'react';
import Link from 'next/link';

const AFFILIATE_BASE = 'https://getrentacar.tpo.lv/Xdm1FCMq';

// GetRentacar.com via Travelpayouts affiliate deeplink
function buildSearchUrl(pickup: string, pickupDate: string, dropoffDate: string) {
  const dest = `https://www.getrentacar.com/en/search/?pickUpLocName=${encodeURIComponent(pickup)}&pickUpDate=${pickupDate}&returnDate=${dropoffDate}`;
  return `${AFFILIATE_BASE}?u=${encodeURIComponent(dest)}`;
}

function defaultDates() {
  const pickup = new Date();
  pickup.setDate(pickup.getDate() + 7);
  const dropoff = new Date(pickup);
  dropoff.setDate(dropoff.getDate() + 7);
  return {
    pickup: pickup.toISOString().split('T')[0],
    dropoff: dropoff.toISOString().split('T')[0],
  };
}

const POPULAR = [
  { city: 'Bangkok', country: 'Thailand', flag: '🇹🇭' },
  { city: 'Bali', country: 'Indonesia', flag: '🇮🇩' },
  { city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪' },
  { city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩' },
];

const TIPS = [
  { icon: '💳', title: 'Book with a travel card', body: 'Chase Sapphire and Amex cards include collision damage waiver for rental cars — you may not need to buy extra insurance from the counter.' },
  { icon: '🔍', title: 'Compare before the counter', body: 'Prices on the rental company\'s website are often higher than pre-booking online. Always compare first.' },
  { icon: '📋', title: 'Read the fuel policy', body: 'Full-to-full is standard and fair. Avoid "full-to-empty" — you\'ll pay the rental company\'s inflated fuel rates.' },
  { icon: '🚗', title: 'Check what\'s included', body: 'Confirm unlimited mileage, what insurance is covered, and whether a young driver fee applies if you\'re under 25.' },
];

export default function CarsPage() {
  const dates = defaultDates();
  const [pickup, setPickup] = useState('');
  const [pickupDate, setPickupDate] = useState(dates.pickup);
  const [dropoffDate, setDropoffDate] = useState(dates.dropoff);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup.trim()) return;
    window.open(buildSearchUrl(pickup.trim(), pickupDate, dropoffDate), '_blank', 'noopener');
  }

  function quickSearch(city: string) {
    window.open(buildSearchUrl(city, pickupDate, dropoffDate), '_blank', 'noopener');
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section style={{ background: 'var(--color-pro-navy)' }} className="py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(29,158,117,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(29,158,117,0.3)' }}>
            🚗 Powered by GetRentacar.com
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Rent a car anywhere in the world
          </h1>
          <p className="text-white/60 text-sm max-w-xl mx-auto">
            Compare prices from all major rental companies — Enterprise, Hertz, Avis, Sixt and more. No hidden fees.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Search form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pickup location</label>
              <input
                type="text"
                value={pickup}
                onChange={e => setPickup(e.target.value)}
                placeholder="City, airport, or address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-text"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pickup date</label>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setPickupDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Drop-off date</label>
                <input
                  type="date"
                  value={dropoffDate}
                  min={pickupDate}
                  onChange={e => setDropoffDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-pointer"
                />
              </div>
            </div>
            <button type="submit"
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}>
              Search rental cars →
            </button>
          </form>
        </div>

        {/* Popular destinations */}
        <div>
          <h2 className="text-base font-bold text-navy mb-4">Popular destinations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POPULAR.map(d => (
              <button key={d.city} onClick={() => quickSearch(d.city)}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3.5 hover:border-teal/40 hover:shadow-sm transition-all text-left group cursor-pointer">
                <span className="text-2xl flex-shrink-0">{d.flag}</span>
                <div>
                  <p className="text-sm font-semibold text-navy group-hover:text-teal transition-colors">{d.city}</p>
                  <p className="text-xs text-gray-400">{d.country}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-base font-bold text-navy mb-4">Before you rent</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPS.map(tip => (
              <div key={tip.title} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-navy mb-1">{tip.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duffel coming soon notice */}
        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="text-blue-500 text-lg flex-shrink-0">🔧</span>
          <div className="text-xs text-blue-800 leading-relaxed">
            <strong>Inline booking coming soon.</strong> Car rentals currently open on Rentalcars.com.
            We&apos;re working on bringing the full booking experience inline — same as flights.
          </div>
        </div>

        {/* Affiliate disclosure */}
        <p className="text-[11px] text-gray-400 text-center">
          Car rental prices are provided by GetRentacar.com via Travelpayouts. CheapStay may earn a commission if you book — at no extra cost to you.{' '}
          <Link href="/terms" className="underline">Terms</Link>
        </p>

      </div>
    </main>
  );
}

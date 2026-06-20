'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

const STEPS = [
  { id: 1, title: 'Choose your VPN' },
  { id: 2, title: 'Download & install' },
  { id: 3, title: 'Connect to Thailand' },
  { id: 4, title: 'Open booking site' },
  { id: 5, title: 'Compare savings' },
];

const VPNS = [
  {
    name: 'NordVPN',
    price: '$3.99/mo',
    label: 'Top pick',
    featured: true,
    features: ['Thailand server', 'Fast & reliable', 'All devices', '30-day money back'],
    url: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=112618',
    color: '#4687FF',
  },
  {
    name: 'ExpressVPN',
    price: '$6.67/mo',
    label: 'Also great',
    featured: false,
    features: ['Thailand server', 'Ultra-fast speeds', 'All devices', '30-day money back'],
    url: '#',
    color: '#DA3940',
  },
  {
    name: 'Surfshark',
    price: '$2.49/mo',
    label: 'Budget pick',
    featured: false,
    features: ['Thailand server', 'Unlimited devices', 'Budget-friendly', '30-day money back'],
    url: '#',
    color: '#1AB5E8',
  },
];

const PLATFORMS: Record<string, { name: string; icon: string; url: Record<string, string> }> = {
  NordVPN: {
    name: 'NordVPN',
    icon: '🔵',
    url: {
      Mac: 'https://nordvpn.com/download/mac/',
      Windows: 'https://nordvpn.com/download/windows/',
      iPhone: 'https://apps.apple.com/app/nordvpn-ike-unlimited-vpn/id905953485',
      Android: 'https://play.google.com/store/apps/details?id=com.nordvpn.android',
    },
  },
  ExpressVPN: {
    name: 'ExpressVPN',
    icon: '🔴',
    url: {
      Mac: 'https://www.expressvpn.com/vpn-software/vpn-mac',
      Windows: 'https://www.expressvpn.com/vpn-software/vpn-windows',
      iPhone: 'https://apps.apple.com/app/expressvpn-vpn-privacy-security/id886492891',
      Android: 'https://play.google.com/store/apps/details?id=com.expressvpn.vpn',
    },
  },
  Surfshark: {
    name: 'Surfshark',
    icon: '🔷',
    url: {
      Mac: 'https://surfshark.com/download/macos',
      Windows: 'https://surfshark.com/download/windows',
      iPhone: 'https://apps.apple.com/app/surfshark-secure-vpn/id1400929787',
      Android: 'https://play.google.com/store/apps/details?id=com.surfshark.vpnclient.android',
    },
  },
};

export default function VpnGuidePage() {
  const [step, setStep] = useState(1);
  const [selectedVpn, setSelectedVpn] = useState('NordVPN');
  const [selectedPlatform, setSelectedPlatform] = useState('Mac');

  // Persist progress
  useEffect(() => {
    const saved = localStorage.getItem('vpn-guide-step');
    const savedVpn = localStorage.getItem('vpn-guide-vpn');
    if (saved) setStep(parseInt(saved));
    if (savedVpn) setSelectedVpn(savedVpn);
  }, []);

  function goTo(n: number) {
    setStep(n);
    localStorage.setItem('vpn-guide-step', String(n));
  }

  function next() { if (step < 5) goTo(step + 1); }
  function back() { if (step > 1) goTo(step - 1); }

  function pickVpn(name: string) {
    setSelectedVpn(name);
    localStorage.setItem('vpn-guide-vpn', name);
  }

  const downloadUrl = PLATFORMS[selectedVpn]?.url[selectedPlatform] ?? '#';

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section style={{ background: '#0a1628' }} className="py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>
            🛡️ Free guide — takes 5 minutes
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Set up your VPN to unlock<br />
            <span style={{ color: '#1D9E75' }}>Thai IP hotel prices</span>
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Thai IP users see 20–40% lower hotel prices on Agoda and Booking.com worldwide. Follow these 5 steps to access them.
          </p>
        </div>
      </section>

      {/* Progress bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1">
                <button onClick={() => goTo(s.id)}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-all ${
                    step === s.id ? 'text-white shadow-md' : step > s.id ? 'text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                  style={step >= s.id ? { background: '#1D9E75' } : {}}>
                  {step > s.id ? '✓' : s.id}
                </button>
                <span className={`text-xs font-semibold hidden sm:block ${step === s.id ? 'text-gray-800' : 'text-gray-400'}`}>
                  {s.title}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full" style={{ background: step > s.id ? '#1D9E75' : '#e5e7eb' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* ── Step 1: Choose VPN ── */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Step 1: Choose your VPN</h2>
            <p className="text-gray-500 text-sm mb-6">All three have Thailand servers. NordVPN is the fastest and most reliable — we use it ourselves.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {VPNS.map(vpn => (
                <button key={vpn.name} type="button" onClick={() => pickVpn(vpn.name)}
                  className={`rounded-2xl p-5 text-left border-2 transition-all ${
                    selectedVpn === vpn.name ? 'border-teal shadow-md bg-teal/5' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  {vpn.featured && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 text-white" style={{ background: '#1D9E75' }}>
                      ⭐ Top pick
                    </span>
                  )}
                  <div className="text-lg font-extrabold text-gray-900 mb-0.5">{vpn.name}</div>
                  <div className="text-sm font-bold mb-3" style={{ color: '#1D9E75' }}>{vpn.price}</div>
                  <ul className="space-y-1.5">
                    {vpn.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {selectedVpn === vpn.name && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-teal">
                      <div className="w-4 h-4 rounded-full bg-teal flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 mb-6">
              💡 <strong>Tip:</strong> You can try any VPN free for 30 days and cancel if you don't like it. No risk.
            </div>
          </div>
        )}

        {/* ── Step 2: Download ── */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Step 2: Download & install {selectedVpn}</h2>
            <p className="text-gray-500 text-sm mb-6">Select your device below, then click the download button.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {['Mac', 'Windows', 'iPhone', 'Android'].map(p => (
                <button key={p} type="button" onClick={() => setSelectedPlatform(p)}
                  className={`rounded-xl py-3 px-4 border-2 text-sm font-semibold transition-all ${
                    selectedPlatform === p ? 'border-teal bg-teal/5 text-teal' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}>
                  {p === 'Mac' && '🍎'} {p === 'Windows' && '🪟'} {p === 'iPhone' && '📱'} {p === 'Android' && '🤖'} {p}
                </button>
              ))}
            </div>

            <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 mb-6"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #0f766e)' }}>
              ⬇️ Download {selectedVpn} for {selectedPlatform}
            </a>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
              <strong className="text-gray-800 block mb-2">After downloading:</strong>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Open the installer and follow the setup wizard</li>
                <li>Create your account (or sign in if you already have one)</li>
                <li>Launch the app — you'll see the main VPN dashboard</li>
                <li>Come back here and click Next when done</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Step 3: Connect to Thailand ── */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Step 3: Connect to Thailand</h2>
            <p className="text-gray-500 text-sm mb-6">
              Open your {selectedVpn} app and connect to a Thailand server. This makes your device appear to be in Bangkok.
            </p>

            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center mb-6">
              <div className="text-5xl mb-4">🇹🇭</div>
              <div className="text-lg font-bold text-gray-800 mb-2">Connect to Thailand</div>
              <div className="text-sm text-gray-500 max-w-sm mx-auto">
                In your {selectedVpn} app, search for <strong>"Thailand"</strong> or <strong>"Bangkok"</strong> in the server list and tap Connect.
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { step: '1', text: `Open the ${selectedVpn} app on your device` },
                { step: '2', text: 'Tap the search bar or "All locations"' },
                { step: '3', text: 'Type "Thailand" and select a Bangkok server' },
                { step: '4', text: 'Tap Connect and wait for the green Connected status' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: '#1D9E75' }}>{s.step}</div>
                  <p className="text-sm text-gray-700">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 text-sm text-teal-800">
              ✅ <strong>You'll know it worked</strong> when the app shows a green "Connected" badge and a Bangkok IP address.
            </div>
          </div>
        )}

        {/* ── Step 4: Open booking site ── */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Step 4: Open your booking site</h2>
            <p className="text-gray-500 text-sm mb-6">
              While connected to Thailand, open Agoda or Booking.com in a <strong>fresh browser window</strong> (not a cached tab). You'll now see Thai IP prices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <a href="https://www.agoda.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white border-2 border-gray-200 hover:border-orange-400 rounded-2xl p-5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🟠</div>
                <div>
                  <div className="font-bold text-gray-800 group-hover:text-orange-500 transition-colors">Open Agoda →</div>
                  <div className="text-xs text-gray-400">Best for Asia — often cheapest</div>
                </div>
              </a>
              <a href="https://www.booking.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">🔵</div>
                <div>
                  <div className="font-bold text-gray-800 group-hover:text-blue-500 transition-colors">Open Booking.com →</div>
                  <div className="text-xs text-gray-400">Best for Europe & worldwide</div>
                </div>
              </a>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 mb-4">
              ⚠️ <strong>Important:</strong> Open a fresh incognito/private window to avoid cached prices from before you connected the VPN.
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
              <strong className="text-gray-800">What to look for:</strong> Search for any hotel and compare the price to what you normally see. Bangkok hotels typically drop 30–40%. London hotels typically drop 15–20%.
            </div>
          </div>
        )}

        {/* ── Step 5: Compare savings ── */}
        {step === 5 && (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
                style={{ background: 'rgba(29,158,117,0.1)' }}>🎉</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">You're set up!</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Every time you search on CheapStay while connected to Thailand, you'll see the Thai IP price automatically — no extra steps needed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: '🏨', label: 'Bangkok hotels', saving: 'Avg 35% cheaper' },
                { icon: '🌴', label: 'Bali hotels', saving: 'Avg 28% cheaper' },
                { icon: '🗼', label: 'Tokyo hotels', saving: 'Avg 22% cheaper' },
              ].map(d => (
                <div key={d.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
                  <div className="text-3xl mb-2">{d.icon}</div>
                  <div className="font-bold text-gray-800 text-sm mb-1">{d.label}</div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                    {d.saving}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Next: search with your Thai IP prices</h3>
              <Link href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1D9E75, #0f766e)' }}>
                Search hotels on CheapStay →
              </Link>
            </div>

            <div className="text-center">
              <button type="button" onClick={() => { goTo(1); localStorage.removeItem('vpn-guide-step'); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline transition-colors">
                Restart the guide
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button type="button" onClick={back} disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm transition-all hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed">
            ← Back
          </button>

          <div className="text-xs text-gray-400">Step {step} of {STEPS.length}</div>

          {step < 5 ? (
            <button type="button" onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #0f766e)' }}>
              Next →
            </button>
          ) : (
            <Link href="/"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #0f766e)' }}>
              Start saving →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

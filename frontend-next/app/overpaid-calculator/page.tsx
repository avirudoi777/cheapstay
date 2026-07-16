'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function OverpaidCalculatorPage() {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [nights, setNights] = useState('');
  const [paidPerNight, setPaidPerNight] = useState('');

  const total = parseFloat(paidPerNight) * parseInt(nights) || 0;
  const thaiPrice = total * 0.72; // 28% average saving
  const cashback = thaiPrice * 0.05;
  const overpaid = total - thaiPrice - cashback;

  function reset() {
    setStep(1);
    setDestination('');
    setNights('');
    setPaidPerNight('');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section style={{ background: 'var(--color-pro-navy)' }} className="py-12 px-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">How much did you overpay?</h1>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          Enter your last hotel booking and we'll show you what you could have paid with Thai IP pricing and cashback.
        </p>
      </section>

      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${step >= s ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                style={step >= s ? { background: 'var(--color-primary)' } : {}}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 flex-1 rounded transition-colors ${step > s ? 'bg-teal' : 'bg-gray-200'}`} style={step > s ? { background: 'var(--color-primary)' } : {}} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

          {step === 1 && (
            <>
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">Where did you stay?</h2>
              <p className="text-xs text-gray-400 mb-5">City or country — any destination works</p>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="e.g. Bangkok, Bali, Tokyo..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
              <button onClick={() => destination.trim() && setStep(2)}
                disabled={!destination.trim()}
                className="mt-4 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                style={{ background: 'var(--color-primary)' }}>
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">How many nights?</h2>
              <p className="text-xs text-gray-400 mb-5">Total nights of your stay</p>
              <input
                type="number"
                min="1"
                value={nights}
                onChange={e => setNights(e.target.value)}
                placeholder="e.g. 3"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={() => parseInt(nights) > 0 && setStep(3)}
                  disabled={!nights || parseInt(nights) < 1}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--color-primary)' }}>
                  Next →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">What did you pay per night?</h2>
              <p className="text-xs text-gray-400 mb-5">In USD — approximate is fine</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="1"
                  value={paidPerNight}
                  onChange={e => setPaidPerNight(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={() => parseFloat(paidPerNight) > 0 && setStep(4)}
                  disabled={!paidPerNight || parseFloat(paidPerNight) < 1}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--color-primary)' }}>
                  Calculate →
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="text-center mb-6">
                <p className="text-xs text-gray-400 mb-1">For your {nights}-night stay in {destination}</p>
                <p className="text-4xl font-extrabold text-red-500 mb-1">${overpaid.toFixed(0)}</p>
                <p className="text-sm font-bold text-gray-600">overpaid vs Thai IP + cashback</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 rounded-xl bg-red-50">
                  <span className="text-sm text-gray-600">What you paid</span>
                  <span className="font-bold text-red-500">${total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
                  <span className="text-sm text-gray-600">Thai IP price (est. −28%)</span>
                  <span className="font-bold text-green-600">${thaiPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
                  <span className="text-sm text-gray-600">Cashback (est. 5%)</span>
                  <span className="font-bold text-green-600">−${cashback.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border-2 border-teal">
                  <span className="text-sm font-bold text-gray-900">You could have paid</span>
                  <span className="font-extrabold text-teal text-lg">${(thaiPrice - cashback).toFixed(0)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mb-5">
                Estimates based on average 28% Thai IP saving and 5% Rakuten cashback. Your results may vary.
              </p>

              <div className="flex flex-col gap-3">
                <Link href="/vpn-guide"
                  className="w-full py-3 rounded-xl text-sm font-bold text-white text-center transition-opacity"
                  style={{ background: 'var(--color-primary)' }}>
                  Don't overpay next time — Set up VPN in 5 min →
                </Link>
                <Link href="/"
                  className="w-full py-3 rounded-xl text-sm font-bold text-center border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Search hotels with Thai prices →
                </Link>
                <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Start over
                </button>
              </div>
            </>
          )}
        </div>

        {step < 4 && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Uses average Thai IP savings data from 1,000+ hotel comparisons.
          </p>
        )}
      </div>
    </main>
  );
}

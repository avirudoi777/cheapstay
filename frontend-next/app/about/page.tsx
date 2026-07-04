import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'About CheapStay — Built by a traveler, for travelers',
  description: 'CheapStay is built by Avi, a solo founder who has traveled to nearly 50 countries over the last 4 years while working remotely. Here is the story behind it.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">

      {/* Founder intro */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-navy mb-4">Built by a traveler, for travelers</h1>
        <div className="flex items-start gap-5 bg-gray-50 rounded-2xl p-6">
          <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden shadow-md">
            <Image src="/avi.jpg" alt="Avi — Founder of CheapStay" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-navy text-base">Avi — Founder</p>
            <p className="text-xs text-gray-400 mb-2">~50 countries · 4 years of remote work · Bangkok-based</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Hey, I&apos;m Avi. I built CheapStay myself — it&apos;s just me. I&apos;ve been traveling full-time
              for the last four years while working remotely, and I&apos;ve visited almost 50 countries doing it.
              I love travel, sport, and the freedom of building your own life on your own terms.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 text-gray-600 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-navy mb-2">Why I built this</h2>
          <p>
            After years of booking hotels and flights across Southeast Asia, Europe, the Middle East, and beyond,
            I kept running into the same frustration: the &quot;best price&quot; shown on any single site is
            almost never the actual best price. The same room on Agoda can be 20–40% cheaper when searched
            from a Thai IP. Stack a cashback portal on top of that, pay with the right credit card, and
            you&apos;re regularly saving 30–50% compared to what most people pay.
          </p>
          <p className="mt-3">
            I was doing all of this manually — VPN, five tabs, mental maths — every single booking. So I built
            a tool that does it automatically. That&apos;s CheapStay.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">What CheapStay does</h2>
          <ul className="space-y-2 list-disc list-inside marker:text-teal">
            <li>Searches hotel prices from a Thai IP to surface geo-based discounts</li>
            <li>Compares Agoda, Booking.com and more in a single search</li>
            <li>Books flights through a global search — seats, baggage, cancellation all in one place</li>
            <li>Shows destination tips, lounge access info, and transit guides for your airport</li>
            <li>Saves your passport details so checkout is fast every time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">The philosophy</h2>
          <p>
            I believe you don&apos;t need to be rich to travel well. You just need to know how the system works.
            Most booking platforms are designed to make you pay more, not less. CheapStay is the opposite —
            it&apos;s built to find the lowest price and be honest about how it makes money (affiliate
            commissions, never inflated prices).
          </p>
          <p className="mt-3">
            Remote work gave me freedom. Travel gave me perspective. CheapStay is my way of sharing both.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">Get in touch</h2>
          <p>
            I read every email personally. Questions, feedback, or just want to talk travel —{' '}
            <a href="mailto:support@cheapstay.co" className="text-teal font-semibold hover:underline">support@cheapstay.co</a>
            {' '}or{' '}
            <Link href="/consult" className="text-teal font-semibold hover:underline">book a call with me directly</Link>.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="https://www.facebook.com/profile.php?id=61591071667374" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Follow on Facebook
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}

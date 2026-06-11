import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'About — Cheapstay' };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <Image src="/logo.png" alt="Cheapstay" width={140} height={36} className="h-10 w-auto mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-navy mb-3">Why we built Cheapstay</h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Because booking a hotel shouldn&apos;t require switching VPNs, opening five tabs, and doing mental maths.
        </p>
      </div>

      <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-navy mb-2">The problem</h2>
          <p>
            Hotel prices vary enormously depending on where you search from. The same room on Agoda can be 20–40% cheaper
            when searched from a Thai IP than from a European or American one. Add cashback portals like TopCashBack and
            credit card rewards on top of that, and the &quot;best price&quot; shown on any single site is rarely the
            actual best price you can pay.
          </p>
          <p className="mt-3">
            Most travellers either don&apos;t know this or don&apos;t have the time to optimise every booking. We do it automatically.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">What Cheapstay does</h2>
          <ul className="space-y-2 list-disc list-inside marker:text-teal">
            <li>Searches hotel prices from a Thai IP to capture geo-based discounts</li>
            <li>Compares Agoda, Hotellook and more in a single search</li>
            <li>Shows the net effective price after cashback and card rewards</li>
            <li>Saves your favourite hotels and booking history</li>
            <li>Learns your travel style to surface deals you&apos;ll actually care about</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">Our promise</h2>
          <p>
            We make money through affiliate commissions when you click through to book — we never inflate prices or hide
            cheaper options to earn more. The cheapest deal always comes first, full stop.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-navy mb-2">Get in touch</h2>
          <p>
            Questions, feedback, or partnership enquiries —{' '}
            <Link href="/contact" className="text-teal font-semibold hover:underline">contact us here</Link> or email{' '}
            <a href="mailto:support@cheapstay.co" className="text-teal font-semibold hover:underline">support@cheapstay.co</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

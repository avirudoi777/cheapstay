import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'CheapStay terms of service — how our flight and hotel booking platform works, and what we are and are not responsible for.',
  path: '/terms',
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-navy mb-2">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-navy mb-2">Terms of Service</h1>
      <p className="text-xs text-gray-400 mb-10">Last updated: 4 July 2026</p>

      <Section title="1. Who we are">
        <p>
          CheapStay (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a travel booking platform that helps you
          search and book flights and compare hotel prices. We are not an airline, hotel, or travel agent —
          we are a technology platform that connects you to third-party booking providers.
        </p>
      </Section>

      <Section title="2. Flights — how bookings work">
        <p>
          Flight bookings made through CheapStay are processed by <strong>Duffel</strong>, a licensed travel
          technology company. When you complete a flight booking, you are entering into a contract with the
          airline — not with CheapStay. Duffel acts as the ticketing agent on your behalf.
        </p>
        <p>
          Prices and seat availability are live and can change up until the moment your booking is confirmed.
          The price displayed is an estimate; the final price is confirmed at checkout. We are not responsible
          for price changes that occur between search and booking.
        </p>
        <p>
          You are responsible for ensuring all passenger details (name, passport number, date of birth) are
          entered accurately. Errors in passenger details may result in denied boarding and are not eligible
          for refund.
        </p>
      </Section>

      <Section title="3. Cancellations and refunds">
        <p>
          Cancellation and refund eligibility is determined by the airline&apos;s fare rules, not by CheapStay.
          We will submit cancellation requests on your behalf via Duffel. Refunds, if applicable, are
          processed by the airline and may take 5–15 business days to appear on your statement.
        </p>
        <p>
          Non-refundable fares cannot be cancelled for a refund. If your fare is non-refundable, the
          &quot;Cancel booking&quot; option will not be available in your account.
        </p>
        <p>
          CheapStay does not charge its own cancellation fees. Any fees shown are airline fees passed through
          directly.
        </p>
      </Section>

      <Section title="4. Airline schedule changes">
        <p>
          Airlines occasionally change or cancel flights after booking. We will notify you of changes we
          become aware of, but we cannot guarantee notification of all changes. You are responsible for
          checking your booking status before travel. CheapStay is not liable for losses resulting from
          airline-initiated schedule changes, cancellations, or delays.
        </p>
      </Section>

      <Section title="5. Hotels and price comparison">
        <p>
          Hotel prices shown on CheapStay are fetched in real time from third-party providers including
          Agoda, Booking.com, and others. Prices are for informational purposes and may differ from what
          you see on the provider&apos;s own site due to caching, currency conversion, or rate changes.
          Always confirm the final price before completing a booking on the provider&apos;s site.
        </p>
      </Section>

      <Section title="6. Affiliate links">
        <p>
          Some links on CheapStay — including links to NordVPN, hotel booking sites, and other travel
          products — are affiliate links. This means we may earn a commission if you make a purchase after
          clicking. This does not affect the price you pay. We only recommend products we believe are
          genuinely useful to travelers.
        </p>
      </Section>

      <Section title="7. Travel documents and visa">
        <p>
          You are solely responsible for ensuring you hold valid travel documents (passport, visa, entry
          permits) for your destination and any transit countries. CheapStay provides general travel
          information as a courtesy only — it is not a substitute for official government guidance.
        </p>
      </Section>

      <Section title="8. Your account">
        <p>
          You are responsible for keeping your account credentials secure. You must not share your account
          or use it on behalf of another person without their consent. We reserve the right to suspend or
          terminate accounts that violate these terms or are used fraudulently.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          CheapStay is a platform intermediary. To the maximum extent permitted by law, we are not liable
          for: losses caused by airline or hotel actions; inaccurate prices or availability shown by
          third-party providers; losses arising from incorrect passenger details entered by the user; or
          any indirect, incidental, or consequential damages.
        </p>
        <p>
          Our total liability to you for any claim arising from use of our service is limited to the amount
          you paid CheapStay directly (excluding amounts paid to airlines or hotels).
        </p>
      </Section>

      <Section title="10. Changes to these terms">
        <p>
          We may update these terms from time to time. The &quot;last updated&quot; date at the top of this
          page reflects the most recent version. Continued use of CheapStay after changes are posted
          constitutes your acceptance of the revised terms.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these terms? Email{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>.
        </p>
      </Section>
    </div>
  );
}

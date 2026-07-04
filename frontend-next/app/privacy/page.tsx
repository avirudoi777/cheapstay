import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'CheapStay privacy policy — what data we collect, how we use it, and your rights.',
  path: '/privacy',
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-navy mb-2">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-navy mb-2">Privacy Policy</h1>
      <p className="text-xs text-gray-400 mb-10">Last updated: 4 July 2026</p>

      <Section title="1. Who we are">
        <p>
          CheapStay (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a travel booking platform for
          flights and hotel price comparison. This policy explains what data we collect, how we use it,
          and your rights.
        </p>
      </Section>

      <Section title="2. Data we collect">
        <p><strong>Account data:</strong> name, email address, and optionally a profile photo when you sign up.</p>
        <p><strong>Travel profile:</strong> travel preferences, frequent flyer numbers, and budget range that you set in your account.</p>
        <p>
          <strong>Passport and identity data:</strong> if you enter passport details for flight bookings
          (passport number, nationality, date of birth), these are encrypted using AES-256-GCM before
          being stored. We cannot read the raw values — only your device can decrypt them for autofill.
        </p>
        <p><strong>Flight booking data:</strong> passenger names, contact details, selected flights, seat selections, and booking references for flights booked through CheapStay.</p>
        <p><strong>Search history:</strong> hotel and flight searches you perform, used to personalise results and improve the service.</p>
        <p><strong>Technical data:</strong> IP address, browser type, and pages visited, collected automatically for security and analytics.</p>
        <p><strong>Session recordings:</strong> we use Microsoft Clarity to record anonymised user sessions (mouse movements, clicks, scrolls) to understand how people use the site. No payment card or passport data is captured in recordings.</p>
      </Section>

      <Section title="3. How we use your data">
        <ul className="list-disc list-inside space-y-1 marker:text-teal">
          <li>To process and manage flight bookings on your behalf</li>
          <li>To provide and improve the hotel search service</li>
          <li>To autofill passenger details at checkout (passport data stays on your device)</li>
          <li>To send transactional emails (booking confirmations, cancellations, account alerts)</li>
          <li>To personalise deal recommendations based on your preferences</li>
          <li>To detect and prevent fraud or abuse</li>
          <li>To comply with legal obligations</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>
      </Section>

      <Section title="4. Cookies and tracking">
        <p>
          We use strictly necessary cookies for authentication sessions. We also use analytics cookies
          via Google Analytics 4 to understand which features and routes are most popular. Microsoft
          Clarity uses cookies for session recording. You can disable cookies in your browser settings,
          though this will affect login functionality.
        </p>
      </Section>

      <Section title="5. Third-party services">
        <p>
          CheapStay uses the following third-party services which may process your data under their own
          privacy policies:
        </p>
        <ul className="list-disc list-inside space-y-1 marker:text-teal">
          <li><strong>Supabase</strong> — authentication and database hosting</li>
          <li><strong>Vercel</strong> — website hosting and CDN</li>
          <li><strong>Duffel</strong> — flight search and booking (passenger data is shared with Duffel and the airline to complete your booking)</li>
          <li><strong>Resend</strong> — transactional email delivery</li>
          <li><strong>Google Analytics 4</strong> — usage analytics</li>
          <li><strong>Microsoft Clarity</strong> — anonymised session recordings and heatmaps</li>
          <li><strong>Agoda / Booking.com</strong> — hotel pricing data via affiliate links</li>
          <li><strong>Travelpayouts / NordVPN</strong> — affiliate tracking for recommended products</li>
          <li><strong>Google OAuth</strong> — optional sign-in via your Google account</li>
        </ul>
      </Section>

      <Section title="6. Affiliate disclosure">
        <p>
          Some links on CheapStay are affiliate links — we may earn a commission if you purchase after
          clicking. This does not affect the price you pay and does not influence which products we recommend.
          See our <a href="/terms" className="text-teal hover:underline">Terms of Service</a> for more detail.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          We retain your account data for as long as your account is active. Flight booking records are
          retained for 7 years for legal and accounting purposes. Search history is retained for 12 months.
          You may request deletion of your account and associated data at any time by emailing{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>{' '}
          — note that booking records required for legal compliance cannot be deleted early.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Depending on your location you may have rights to access, correct, export, or delete your
          personal data. To exercise any of these rights please contact us at{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this policy from time to time. The &quot;last updated&quot; date at the top of
          this page will reflect any changes. Continued use of CheapStay after changes are posted
          constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For any privacy-related questions email{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>.
        </p>
      </Section>
    </div>
  );
}

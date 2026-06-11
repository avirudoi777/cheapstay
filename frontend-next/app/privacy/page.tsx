export const metadata = { title: 'Privacy Policy — Cheapstay' };

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
      <p className="text-xs text-gray-400 mb-10">Last updated: 1 June 2026</p>

      <Section title="1. Who we are">
        <p>
          Cheapstay (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a hotel price comparison service. This policy
          explains what data we collect, how we use it, and your rights.
        </p>
      </Section>

      <Section title="2. Data we collect">
        <p><strong>Account data:</strong> when you sign up we store your name, email address, and (optionally) a profile photo.</p>
        <p><strong>Preferences:</strong> travel style, preferred regions, and budget range that you set during onboarding or in your profile.</p>
        <p><strong>Search history:</strong> the hotel searches you perform, used to personalise results and improve the service.</p>
        <p><strong>Booking clicks:</strong> when you click through to Agoda or other partners, we record the hotel and timestamp to track your booking history.</p>
        <p><strong>Technical data:</strong> IP address, browser type, and pages visited, collected automatically for security and analytics.</p>
      </Section>

      <Section title="3. How we use your data">
        <ul className="list-disc list-inside space-y-1 marker:text-teal">
          <li>To provide and improve the hotel search service</li>
          <li>To personalise deal recommendations based on your preferences</li>
          <li>To send transactional emails (booking confirmations, account alerts)</li>
          <li>To detect and prevent fraud or abuse</li>
          <li>To comply with legal obligations</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>
      </Section>

      <Section title="4. Cookies">
        <p>
          We use strictly necessary cookies for authentication sessions. We may also use analytics cookies (e.g. to
          understand which searches are most popular). You can disable cookies in your browser settings, though this
          may affect login functionality.
        </p>
      </Section>

      <Section title="5. Third-party services">
        <p>
          Cheapstay uses the following third-party services which may process your data under their own privacy policies:
        </p>
        <ul className="list-disc list-inside space-y-1 marker:text-teal">
          <li><strong>Supabase</strong> — authentication and database hosting (EU region)</li>
          <li><strong>Vercel</strong> — website hosting and CDN</li>
          <li><strong>Agoda / Hotellook</strong> — hotel pricing data via affiliate links</li>
          <li><strong>Travelpayouts</strong> — affiliate tracking</li>
          <li><strong>Google OAuth</strong> — optional sign-in via your Google account</li>
        </ul>
      </Section>

      <Section title="6. Data retention">
        <p>
          We retain your account data for as long as your account is active. Search history is retained for 12 months.
          You may request deletion of your account and all associated data at any time by emailing{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          Depending on your location you may have rights to access, correct, export, or delete your personal data.
          To exercise any of these rights please contact us at{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          We may update this policy from time to time. The &quot;last updated&quot; date at the top of this page will
          reflect any changes. Continued use of Cheapstay after changes are posted constitutes acceptance of the
          revised policy.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          For any privacy-related questions email{' '}
          <a href="mailto:support@cheapstay.co" className="text-teal hover:underline">support@cheapstay.co</a>.
        </p>
      </Section>
    </div>
  );
}

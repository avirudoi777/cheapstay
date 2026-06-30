import { Resend } from 'resend';

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

const FROM = 'CheapStay <support@cheapstay.co>';

// Best-effort send — callers should never let an email failure block the
// underlying action (signup, booking, cancellation all succeed regardless).
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.error('RESEND_API_KEY not set — skipping email:', subject, 'to', to);
    return { sent: false, error: 'no_api_key' };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error('Resend send error:', error.message);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error('Email send threw:', err);
    return { sent: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

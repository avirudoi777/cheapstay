const SITE_URL = 'https://cheapstay.co';
const NAVY = '#0F1F3D';
const TEAL = '#1D9E75';

function layout(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">CheapStay</span>
        </td></tr>
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#FAFBFC;border-top:1px solid #EEF1F5;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">CheapStay · cheapstay.co</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">Questions? Reply to this email or reach us at support@cheapstay.co</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${TEAL};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;margin-top:8px;">${label}</a>`;
}

export function welcomeEmail({ name }: { name: string }): { subject: string; html: string } {
  const subject = `Welcome to CheapStay${name ? `, ${name}` : ''}!`;
  const html = layout(
    'Compare Agoda + Booking.com side by side, real-time prices, up to 40% cheaper.',
    `
    <h1 style="margin:0 0 16px;font-size:22px;color:${NAVY};">Welcome${name ? `, ${name}` : ''} 👋</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
      Your account is ready. CheapStay compares Agoda and Booking.com side by side so you always see the cheaper rate — no sign-up required to search, but your account saves passport details, travel companions, and booking history.
    </p>
    <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.8;color:#475569;">
      <li>Real-time prices, updated constantly</li>
      <li>Up to 40% cheaper than booking directly</li>
      <li>Save passenger &amp; passport details for faster checkout</li>
    </ul>
    ${button('Start searching →', SITE_URL)}
    `
  );
  return { subject, html };
}

export interface BookingEmailData {
  bookingReference: string;
  passengerNames: string[];
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departureAt: string;
  airline: string;
  totalAmount: number;
  currency: string;
  bookingId?: string;
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtMoney(n: number, cur: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${cur} ${n.toFixed(0)}`;
  }
}

export function bookingConfirmationEmail(d: BookingEmailData): { subject: string; html: string } {
  const subject = `Booking confirmed — ${d.originCode} → ${d.destinationCode} (${d.bookingReference})`;
  const link = d.bookingId ? `${SITE_URL}/bookings/${d.bookingId}` : `${SITE_URL}/bookings`;
  const printLink = d.bookingId ? `${SITE_URL}/bookings/${d.bookingId}?print=1` : `${SITE_URL}/bookings`;
  const html = layout(
    `Your flight ${d.originCode} → ${d.destinationCode} is confirmed. Reference ${d.bookingReference}.`,
    `
    <div style="display:inline-block;background:#E8F8F2;color:${TEAL};font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:16px;letter-spacing:0.03em;">✓ CONFIRMED</div>
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:${NAVY};">Your booking is confirmed</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;">Booking reference: <strong style="color:${NAVY};letter-spacing:0.05em;">${d.bookingReference}</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:14px;margin-bottom:20px;border:1px solid #EEF1F5;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:${NAVY};">${d.originCode} &nbsp;→&nbsp; ${d.destinationCode}</p>
        <p style="margin:0 0 2px;font-size:13px;color:#64748B;">${d.originCity} to ${d.destinationCity}</p>
        <p style="margin:0;font-size:13px;color:#64748B;">${fmtDate(d.departureAt)} · ${d.airline}</p>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Passengers</p>
          <p style="margin:0;font-size:14px;color:#1E293B;">${d.passengerNames.join(', ')}</p>
        </td>
        <td style="width:50%;vertical-align:top;text-align:right;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Total paid</p>
          <p style="margin:0;font-size:20px;font-weight:800;color:${NAVY};">${fmtMoney(d.totalAmount, d.currency)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:10px;">
          <a href="${link}" style="display:inline-block;background:${TEAL};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:13px 22px;border-radius:10px;">View booking details →</a>
        </td>
        <td>
          <a href="${printLink}" style="display:inline-block;background:#F1F5F9;color:${NAVY};font-weight:700;font-size:14px;text-decoration:none;padding:13px 22px;border-radius:10px;">🖨 Print</a>
        </td>
      </tr>
    </table>
    `
  );
  return { subject, html };
}

export interface CancellationEmailData {
  bookingReference: string;
  originCode: string;
  destinationCode: string;
  refundAmount?: number;
  refundCurrency?: string;
}

export function cancellationEmail(d: CancellationEmailData): { subject: string; html: string } {
  const subject = `Booking cancelled — ${d.bookingReference}`;
  const hasRefund = !!d.refundAmount && d.refundAmount > 0;
  const html = layout(
    `Your booking ${d.bookingReference} has been cancelled.`,
    `
    <h1 style="margin:0 0 4px;font-size:22px;color:${NAVY};">Booking cancelled</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#94A3B8;">Reference <strong style="color:${NAVY};">${d.bookingReference}</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0;font-size:16px;font-weight:800;color:${NAVY};">${d.originCode} → ${d.destinationCode}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748B;">This trip has been cancelled and is no longer active.</p>
      </td></tr>
    </table>

    ${hasRefund
      ? `<p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Refund</p>
         <p style="margin:0 0 20px;font-size:18px;font-weight:800;color:${TEAL};">${fmtMoney(d.refundAmount!, d.refundCurrency || 'USD')}</p>
         <p style="margin:-12px 0 20px;font-size:13px;color:#64748B;">Refunds typically take 5–10 business days to appear on your statement.</p>`
      : `<p style="margin:0 0 20px;font-size:13px;color:#64748B;">This fare was non-refundable, so no refund was issued.</p>`
    }

    ${button('View your bookings →', `${SITE_URL}/bookings`)}
    `
  );
  return { subject, html };
}

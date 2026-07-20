const SITE_URL = 'https://www.cheapstay.co';
const NAVY = '#0F172A';
const TEAL = '#006a61';
const TEAL_ACCENT = '#00A698';

function layout(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">CheapStay</span>
        </td></tr>
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:24px 32px;background:${NAVY};">
          <p style="margin:0 0 10px;font-size:12px;color:rgba(255,255,255,0.5);">CheapStay · cheapstay.co</p>
          <p style="margin:0 0 14px;font-size:12px;color:rgba(255,255,255,0.5);">Questions? Reply to this email or reach us at support@cheapstay.co</p>
          <p style="margin:0;font-size:12px;">
            <a href="${SITE_URL}/privacy" style="color:${TEAL_ACCENT};text-decoration:none;">Privacy Policy</a>
            <span style="color:rgba(255,255,255,0.2);"> &middot; </span>
            <a href="${SITE_URL}/terms" style="color:${TEAL_ACCENT};text-decoration:none;">Terms of Service</a>
            <span style="color:rgba(255,255,255,0.2);"> &middot; </span>
            <a href="mailto:support@cheapstay.co" style="color:${TEAL_ACCENT};text-decoration:none;">Support</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const style = variant === 'primary'
    ? `background:${TEAL_ACCENT};color:#ffffff;`
    : `background:#F1F5F9;color:${NAVY};`;
  return `<a href="${href}" style="display:inline-block;${style}font-weight:700;font-size:14px;text-decoration:none;padding:13px 24px;border-radius:10px;">${label}</a>`;
}

export function welcomeEmail({ name }: { name: string }): { subject: string; html: string } {
  const subject = `Welcome to CheapStay${name ? `, ${name}` : ''}!`;
  const html = layout(
    'Find cheap flights, hotel deals, and travel tools — all in one place.',
    `
    <h1 style="margin:0 0 16px;font-size:22px;color:${NAVY};">Welcome${name ? `, ${name}` : ''} 👋</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
      Your CheapStay account is ready. We help travellers find cheaper flights and hotel deals — your account saves your passport details, travel companions, and booking history so checkout is faster every time.
    </p>
    <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.8;color:#475569;">
      <li>✈️ Search &amp; book flights with real-time prices</li>
      <li>🏨 Browse hotel deals and go straight to checkout</li>
      <li>🛂 Save passenger details once, auto-fill every booking</li>
      <li>💺 Seat selection, baggage, trip management — all in one place</li>
    </ul>
    ${button('Start exploring →', SITE_URL)}
    <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">If this ends up in Promotions, move it to your inbox so you never miss a booking confirmation.</p>
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
  bookingId?: string;         // Supabase UUID — preferred
  duffelOrderId?: string;     // Duffel order ID — fallback when UUID not available yet
  arrivalAt?: string;         // Real when available from the Duffel order's last segment
  originTerminal?: string;    // Duffel doesn't always return this — only render if present
  destinationTerminal?: string;
  cabinClass?: string;        // 'economy' | 'premium_economy' | 'business' | 'first'
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
function fmtCabin(c?: string): string | null {
  const map: Record<string, string> = { economy: 'Economy', premium_economy: 'Premium Economy', business: 'Business', first: 'First Class' };
  return c ? (map[c] ?? null) : null;
}
function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}&rsquo;` : `${name}&rsquo;s`;
}

export function bookingConfirmationEmail(d: BookingEmailData): { subject: string; html: string } {
  const subject = `Booking confirmed — ${d.originCode} → ${d.destinationCode} (${d.bookingReference})`;
  const link = d.bookingId ? `${SITE_URL}/bookings/${d.bookingId}` : `${SITE_URL}/bookings`;
  const printLink = d.bookingId ? `${SITE_URL}/bookings/${d.bookingId}?print=1` : `${SITE_URL}/bookings`;
  const cabin = fmtCabin(d.cabinClass);

  const html = layout(
    `Your flight ${d.originCode} → ${d.destinationCode} is confirmed. Reference ${d.bookingReference}.`,
    `
    <div style="display:inline-block;background:rgba(34,197,94,0.12);color:#15803D;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:16px;letter-spacing:0.03em;">&#10003; CONFIRMED</div>
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:${NAVY};">Your booking is confirmed</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;">Booking reference: <strong style="color:${NAVY};letter-spacing:0.05em;">${d.bookingReference}</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:14px;margin-bottom:20px;border:1px solid #EEF1F5;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:${NAVY};">${d.originCode} &nbsp;&#8594;&nbsp; ${d.destinationCode}</p>
        <p style="margin:0;font-size:13px;color:#64748B;">${d.originCity} to ${d.destinationCity} &middot; ${d.airline}</p>
      </td></tr>
      <tr><td style="padding:0 22px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #EEF1F5;padding-top:16px;">
          <tr>
            <td style="width:50%;vertical-align:top;padding-top:16px;">
              <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Departure</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:${NAVY};">${fmtDate(d.departureAt)}</p>
              ${d.originTerminal ? `<p style="margin:2px 0 0;font-size:12px;color:#64748B;">Terminal ${d.originTerminal}</p>` : ''}
            </td>
            <td style="width:50%;vertical-align:top;padding-top:16px;text-align:right;">
              <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Arrival</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:${NAVY};">${d.arrivalAt ? fmtDate(d.arrivalAt) : '&mdash;'}</p>
              ${d.destinationTerminal ? `<p style="margin:2px 0 0;font-size:12px;color:#64748B;">Terminal ${d.destinationTerminal}</p>` : ''}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Passenger${d.passengerNames.length > 1 ? 's' : ''}</p>
          <p style="margin:0;font-size:14px;color:#1E293B;">${d.passengerNames.join(', ')}</p>
          ${cabin ? `<p style="margin:2px 0 0;font-size:12px;color:#64748B;">${cabin}</p>` : ''}
        </td>
        <td style="width:50%;vertical-align:top;text-align:right;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Total paid</p>
          <p style="margin:0;font-size:20px;font-weight:800;color:${NAVY};">${fmtMoney(d.totalAmount, d.currency)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="width:40px;padding:16px 0 16px 18px;vertical-align:top;">
          <div style="width:28px;height:28px;background:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">&#128161;</div>
        </td>
        <td style="padding:16px 18px 16px 10px;">
          <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:${NAVY};">Avi's Pro Tip</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#334155;">Online check-in usually opens 24 hours before departure — download ${d.airline ? possessive(d.airline) : "the airline&rsquo;s"} app now so you can check in the moment it opens and grab a free seat before they start charging for the good ones.</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:10px;">${button('View booking details &#8594;', link)}</td>
        <td>${button('&#128424; Print', printLink, 'secondary')}</td>
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
  bookingId?: string;
}

export function cancellationEmail(d: CancellationEmailData): { subject: string; html: string } {
  const subject = `Booking cancelled — ${d.originCode} → ${d.destinationCode} (${d.bookingReference})`;
  const hasRefund = !!d.refundAmount && d.refundAmount > 0;
  const link = d.bookingId ? `${SITE_URL}/bookings/${d.bookingId}` : `${SITE_URL}/bookings`;
  const html = layout(
    `Your ${d.originCode} → ${d.destinationCode} booking has been cancelled. Ref: ${d.bookingReference}.`,
    `
    <div style="display:inline-block;background:#FEF2F2;color:#DC2626;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:16px;letter-spacing:0.03em;">✕ CANCELLED</div>
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:${NAVY};">Your booking has been cancelled</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;">Reference: <strong style="color:${NAVY};letter-spacing:0.05em;">${d.bookingReference}</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:14px;margin-bottom:20px;border:1px solid #EEF1F5;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:${NAVY};">${d.originCode} &nbsp;→&nbsp; ${d.destinationCode}</p>
        <p style="margin:0;font-size:13px;color:#64748B;">This booking is no longer active.</p>
      </td></tr>
    </table>

    ${hasRefund
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
           <tr>
             <td style="vertical-align:top;">
               <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Refund amount</p>
               <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:${TEAL};">${fmtMoney(d.refundAmount!, d.refundCurrency || 'USD')}</p>
               <p style="margin:0;font-size:12px;color:#94A3B8;">Typically 5–10 business days to appear on your statement.</p>
             </td>
           </tr>
         </table>`
      : `<p style="margin:0 0 20px;font-size:13px;color:#64748B;">This fare was non-refundable — no refund will be issued.</p>`
    }

    ${button('View booking details →', link)}
    `
  );
  return { subject, html };
}

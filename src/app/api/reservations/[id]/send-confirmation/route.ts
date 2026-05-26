import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMail } from '@/lib/mailer';
import type { Reservation } from '@/types';

function escHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtDate(d: string | undefined | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return d; }
}

function paymentLabel(status: string): string {
  switch (status) {
    case 'paid':    return 'PAID IN FULL';
    case 'partial': return 'DEPOSIT PAID';
    case 'overdue': return 'PAYMENT OVERDUE';
    default:        return 'PAY ON ARRIVAL';
  }
}

function buildConfirmationHtml(r: Reservation): string {
  const client       = r.client;
  const balance      = Math.max(0, r.total_cost - r.total_paid);
  const pyLabel      = paymentLabel(r.payment_status);
  const destinations = r.destinations?.join(', ') || 'Sri Lanka';
  const paxParts: string[] = [];
  if (r.num_adults)   paxParts.push(`${r.num_adults} Adult${r.num_adults > 1 ? 's' : ''}`);
  if (r.num_children) paxParts.push(`${r.num_children} Child${r.num_children > 1 ? 'ren' : ''}`);
  if (r.num_infants)  paxParts.push(`${r.num_infants} Infant${r.num_infants > 1 ? 's' : ''}`);
  const pax = paxParts.join(' · ') || '—';

  const arrivalLocation  = r.airport_arrival  ?? 'Colombo Bandaranaike International Airport';
  const departLocation   = r.airport_departure ?? arrivalLocation;

  const openingHoursRows = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ].map(day => `
      <tr>
        <td style="padding:5px 16px;border-bottom:1px solid #F0EBE0;font-size:12px;color:#8a8070;width:40%;">${day}</td>
        <td style="padding:5px 16px;border-bottom:1px solid #F0EBE0;font-size:12px;color:#1a1410;">00:00 – 24:00</td>
      </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Booking Confirmation — ${escHtml(r.reference)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F2EB;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EB;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- ── HEADER ── -->
  <tr><td style="background:#080808;padding:28px 36px;">
    <table width="100%"><tr>
      <td>
        <p style="color:#C9A84C;font-size:9px;letter-spacing:4px;text-transform:uppercase;margin:0 0 4px;">Into the Wild</p>
        <p style="font-family:Georgia,serif;font-size:24px;color:#F2EDE4;margin:0;letter-spacing:3px;">SAMSARA</p>
        <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:4px 0 0;">Sri Lanka's Luxury Travel Experience</p>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <p style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin:0 0 4px;">ORDER</p>
        <p style="font-size:15px;font-weight:700;color:#C9A84C;margin:0;">${escHtml(r.reference)}</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- ── PAYMENT BANNER ── -->
  <tr><td style="background:${r.payment_status === 'paid' ? '#2D6A2D' : r.payment_status === 'overdue' ? '#9B2020' : '#C9A84C'};padding:10px 36px;">
    <p style="font-size:11px;font-weight:700;color:#ffffff;margin:0;letter-spacing:2px;text-align:center;">${escHtml(pyLabel)}</p>
  </td></tr>

  <!-- ── BOOKING CONFIRMATION NUMBER ── -->
  <tr><td style="padding:28px 36px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #EDE8DC;border-radius:3px;">
      <tr><td style="padding:16px 22px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 6px;">Booking Confirmation Number</p>
        <p style="font-family:Georgia,serif;font-size:22px;color:#1a1410;margin:0;letter-spacing:2px;">${escHtml(r.reference)}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- ── TRIP DETAILS ── -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 12px;">Trip Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:40%;font-size:11px;color:#8a8070;">Start Date</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(fmtDate(r.arrival_date))}</td>
      </tr>
      ${r.flight_arrival ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Arrival Flight</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(r.flight_arrival)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">End Date</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(fmtDate(r.departure_date))}</td>
      </tr>
      ${r.flight_departure ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Departure Flight</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(r.flight_departure)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Destinations</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(destinations)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Travellers</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(pax)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Travel Type</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;text-transform:capitalize;">${escHtml((r.travel_purpose ?? 'leisure').replace(/_/g, ' '))}</td>
      </tr>
      ${r.budget_range ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Budget Range</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(r.budget_range)}</td>
      </tr>` : ''}
    </table>
  </td></tr>

  <!-- ── PAYMENT SUMMARY ── -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 12px;">Payment Summary</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:40%;font-size:11px;color:#8a8070;">Package Total</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;text-align:right;">${escHtml(r.currency)} ${r.total_cost.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Amount Paid</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#2D6A2D;text-align:right;">${escHtml(r.currency)} ${r.total_paid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:#1a1410;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Total ${escHtml(pyLabel)}</td>
        <td style="padding:14px 16px;background:#1a1410;text-align:right;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#E2C97E;">${escHtml(r.currency)} ${balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
          <span style="font-size:9px;color:rgba(255,255,255,0.3);margin-left:4px;">${escHtml(pyLabel)}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ── ARRIVAL LOCATION ── -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 12px;">Arrival Location</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:40%;font-size:11px;color:#8a8070;">Airport / Pickup</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(arrivalLocation)}</td>
      </tr>
      ${r.airport_departure && r.airport_departure !== arrivalLocation ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Departure Airport</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(departLocation)}</td>
      </tr>` : ''}
    </table>

    <div style="margin-top:12px;background:#FAFAF6;border:1px solid #EDE8DC;border-radius:3px;padding:14px 16px;">
      <p style="font-size:11px;color:#8a8070;margin:0 0 6px;">Location Address</p>
      <p style="font-size:13px;color:#1a1410;margin:0 0 10px;line-height:1.6;">
        Samsara Travel &amp; Tours<br>
        Colombo Bandaranaike International Airport<br>
        Canada Friendship Rd, Katunayake 11450<br>
        Sri Lanka
      </p>
      <p style="font-size:11px;color:#8a8070;margin:0 0 2px;">Location Telephone</p>
      <p style="font-size:13px;color:#1a1410;margin:0;">
        <a href="tel:+94715858966" style="color:#B8902A;text-decoration:none;">+94 71 585 8966</a>
      </p>
    </div>
  </td></tr>

  <!-- ── OPENING HOURS ── -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 12px;">Opening Hours</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      ${openingHoursRows}
    </table>
    <p style="font-size:11px;color:#b0a898;margin:8px 0 0;">Please note that in the event that your booking falls outside branch opening hours, your booking may be subject to an out-of-hours surcharge.</p>
  </td></tr>

  <!-- ── MEET & GREET NOTE ── -->
  <tr><td style="padding:20px 36px 0;">
    <div style="background:#FAFAF6;border-left:3px solid #C9A84C;padding:14px 18px;border-radius:0 3px 3px 0;">
      <p style="font-size:12px;color:#5a5248;margin:0;line-height:1.7;">
        Samsara is located at <strong>Airport and Aviation Services (Sri Lanka) (Private) Limited</strong>, Canada Friendship Rd, Katunayake 11450. Upon arrival, please proceed to the <strong>3rd counter</strong>, where a Samsara representative will meet you. For further assistance, contact us on <a href="tel:+94715858966" style="color:#B8902A;text-decoration:none;">+94 71 585 8966</a>
      </p>
    </div>
  </td></tr>

  <!-- ── CUSTOMER DETAILS ── -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 12px;">Customer Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:40%;font-size:11px;color:#8a8070;">Customer Name</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;font-weight:600;color:#1a1410;">${escHtml(client?.full_name ?? '—')}</td>
      </tr>
      ${r.flight_arrival ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Flight Number</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(r.flight_arrival)}</td>
      </tr>` : `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Flight Number</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#8a8070;">—</td>
      </tr>`}
      ${client?.date_of_birth ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Date of Birth</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(client.date_of_birth)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Contact Number 1</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">
          <a href="tel:${escHtml(client?.phone ?? '')}" style="color:#B8902A;text-decoration:none;">${escHtml(client?.phone ?? '—')}</a>
        </td>
      </tr>
      ${client?.whatsapp ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Contact Number 2</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">
          <a href="tel:${escHtml(client.whatsapp)}" style="color:#B8902A;text-decoration:none;">${escHtml(client.whatsapp)}</a>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Email</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">
          <a href="mailto:${escHtml(client?.email ?? '')}" style="color:#B8902A;text-decoration:none;">${escHtml(client?.email ?? '—')}</a>
        </td>
      </tr>
      ${client?.nationality ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Nationality</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(client.nationality)}</td>
      </tr>` : ''}
      ${client?.passport_number ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Passport Number</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(client.passport_number)}</td>
      </tr>` : ''}
      ${client?.dietary_restrictions ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;vertical-align:top;">Dietary / Special</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(client.dietary_restrictions)}</td>
      </tr>` : ''}
    </table>
  </td></tr>

  <!-- ── FOOTER ── -->
  <tr><td style="padding:24px 36px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #EDE8DC;border-radius:3px;">
      <tr><td style="padding:14px 18px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 6px;">Need Assistance?</p>
        <p style="font-size:13px;color:#5a5248;margin:0;">
          Contact us at <a href="mailto:hello@samsaratravels.com" style="color:#B8902A;text-decoration:none;">hello@samsaratravels.com</a>
          &nbsp;·&nbsp;
          <a href="tel:+94715858966" style="color:#B8902A;text-decoration:none;">+94 71 585 8966</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 36px;background:#080808;">
    <table width="100%"><tr>
      <td>
        <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin:0 0 2px;">SAMSARA</p>
        <p style="font-size:10px;color:rgba(255,255,255,0.25);margin:0;">Into the Wild · Sri Lanka</p>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <p style="font-size:10px;color:rgba(255,255,255,0.2);margin:0;">Ref: <strong style="color:rgba(255,255,255,0.4);">${escHtml(r.reference)}</strong></p>
      </td>
    </tr></table>
    <p style="font-size:10px;color:rgba(255,255,255,0.15);margin:12px 0 0;">This is an automated booking confirmation. Please retain this email for your records. Reply to this email or contact hello@samsaratravels.com for any amendments.</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json({ success: false, error: 'Email (SMTP) not configured' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({})) as { to?: string };

    const sb = createAdminClient();
    const { data, error } = await sb
      .from('reservations')
      .select('*, client:clients(*), payments(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    const r = data as Reservation;
    const recipientEmail = body.to?.trim() || r.client?.email;

    if (!recipientEmail) {
      return NextResponse.json({ success: false, error: 'No recipient email — client has no email on file' }, { status: 400 });
    }

    const html    = buildConfirmationHtml(r);
    const subject = `Booking Confirmation — ${r.reference} | Samsara Travel`;

    await sendMail({ to: recipientEmail, subject, html, replyTo: process.env.EMAIL_USER });

    return NextResponse.json({ success: true, sentTo: recipientEmail, reference: r.reference });
  } catch (err) {
    console.error('send-confirmation error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

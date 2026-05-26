import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMail } from '@/lib/mailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ─── TYPES ──────────────────────────────────────────────────────── */

interface InboundBooking {
  source: 'experiences' | 'feeling-engine';
  type: 'purchase' | 'save';
  experienceId?: string;
  experienceTitle?: string;
  experienceLocation?: string;
  experienceDuration?: string;
  experiencePrice?: number;
  itineraryTitle?: string;
  itineraryDestination?: string;
  itineraryDuration?: string;
  addOnsTotal?: number;
  selectedAddOnsDetails?: Array<{ id: string; name: string; price: number }>;
  travelerCount?: number;
  total: number;
  form: {
    fullName: string;
    email: string;
    phone: string;
    travelers: string;
    travelDate: string;
    returnDate?: string;
    durationDays?: number;
    pickupLocation?: string;
    dropoffLocation?: string;
    budgetPreference?: string;
    specialRequests?: string;
    bookingNotes?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    selectedAddOns?: string[];
    notes?: string;
  };
}

// Trip end date: explicit return date wins; otherwise derive from the duration
// (a "7 Days" trip = arrival + 6 nights); falls back to a same-day trip.
function computeDepartureDate(arrival: string, returnDate?: string, durationDays?: number): string {
  if (returnDate) return returnDate;
  if (durationDays && durationDays > 1) {
    const d = new Date(arrival);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + (durationDays - 1));
      return d.toISOString().slice(0, 10);
    }
  }
  return arrival;
}

/* ─── STAFF NOTIFICATION EMAIL ───────────────────────────────────── */

async function sendStaffNotificationEmail(booking: InboundBooking, ref: string, reservationId: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { skipped: true, reason: 'Gmail SMTP not configured' };
  }

  // Collect recipients: DB department emails + STAFF_NOTIFICATION_EMAILS env var
  const staffEmails: string[] = [];
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from('email_recipients')
      .select('email')
      .eq('type', 'department')
      .eq('is_active', true);
    if (data) staffEmails.push(...data.map((r: { email: string }) => r.email));
  } catch (err) {
    console.warn('Could not fetch department email recipients:', err);
  }

  const envEmails = (process.env.STAFF_NOTIFICATION_EMAILS ?? '')
    .split(',').map(e => e.trim()).filter(Boolean);
  envEmails.forEach(e => { if (!staffEmails.includes(e)) staffEmails.push(e); });

  if (staffEmails.length === 0) return { skipped: true, reason: 'No staff recipients configured' };

  const isExp = booking.source === 'experiences';
  const title = isExp ? booking.experienceTitle : booking.itineraryTitle;
  const location = isExp ? booking.experienceLocation : booking.itineraryDestination;
  const addOns = booking.selectedAddOnsDetails ?? [];

  function fmtDate(d: string) {
    if (!d) return 'Not specified';
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  }

  const rmsUrl = process.env.NEXT_PUBLIC_RMS_URL ?? 'http://localhost:3001';

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>New Booking — ${ref}</title></head>
<body style="margin:0;padding:0;background:#F0F0F0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

  <tr><td style="background:#0C0C0C;padding:20px 32px;">
    <table width="100%"><tr>
      <td>
        <p style="color:#C9A84C;font-size:9px;letter-spacing:4px;text-transform:uppercase;margin:0 0 3px;">SAMSARA RMS</p>
        <p style="font-size:18px;font-weight:700;color:#ffffff;margin:0;">New Booking Received</p>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <p style="font-size:10px;color:rgba(255,255,255,0.4);margin:0 0 2px;">Reference</p>
        <p style="font-size:18px;font-weight:700;color:#C9A84C;margin:0;">${ref}</p>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#C9A84C;padding:8px 32px;">
    <p style="font-size:11px;font-weight:700;color:#0C0C0C;margin:0;letter-spacing:1px;">
      ACTION REQUIRED — Contact client within 24 hours
    </p>
  </td></tr>

  <tr><td style="padding:24px 32px 0;">
    <p style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin:0 0 10px;">Client</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;border-radius:4px;">
      <tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;width:34%;font-size:11px;color:#999;">Full Name</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;font-weight:600;color:#111;">${booking.form.fullName}</td></tr>
      <tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:11px;color:#999;">Email</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;"><a href="mailto:${booking.form.email}" style="color:#C9A84C;text-decoration:none;">${booking.form.email}</a></td></tr>
      <tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:11px;color:#999;">Phone</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;"><a href="tel:${booking.form.phone}" style="color:#C9A84C;text-decoration:none;">${booking.form.phone}</a></td></tr>
      <tr><td style="padding:9px 14px;font-size:11px;color:#999;">Travellers</td>
          <td style="padding:9px 14px;font-size:13px;color:#111;">${booking.form.travelers}</td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:18px 32px 0;">
    <p style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin:0 0 10px;">Trip</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;border-radius:4px;">
      <tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;width:34%;font-size:11px;color:#999;">${isExp ? 'Experience' : 'Itinerary'}</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;font-weight:600;color:#111;">${title ?? '—'}</td></tr>
      <tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:11px;color:#999;">Location</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;">${location ?? 'Sri Lanka'}</td></tr>
      <tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:11px;color:#999;">Travel Date</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;">${fmtDate(booking.form.travelDate)}</td></tr>
      ${booking.form.pickupLocation ? `<tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:11px;color:#999;">Pickup</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;">${booking.form.pickupLocation}</td></tr>` : ''}
      ${booking.form.specialRequests ? `<tr><td style="padding:9px 14px;font-size:11px;color:#999;vertical-align:top;">Requests</td>
          <td style="padding:9px 14px;font-size:13px;color:#111;">${booking.form.specialRequests}</td></tr>` : ''}
    </table>
  </td></tr>

  <tr><td style="padding:18px 32px 0;">
    <p style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin:0 0 10px;">Pricing</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;border-radius:4px;">
      ${isExp && booking.experiencePrice ? `<tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;width:34%;font-size:11px;color:#999;">Base Price</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;text-align:right;">$${booking.experiencePrice} × ${booking.form.travelers}</td></tr>` : ''}
      ${addOns.map((a: { name: string; price: number }) => `<tr><td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:11px;color:#999;">${a.name}</td>
          <td style="padding:9px 14px;border-bottom:1px solid #F5F5F5;font-size:13px;color:#111;text-align:right;">$${a.price}</td></tr>`).join('')}
      <tr><td style="padding:11px 14px;background:#0C0C0C;font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:1px;text-transform:uppercase;">Total</td>
          <td style="padding:11px 14px;background:#0C0C0C;font-size:18px;font-weight:700;color:#C9A84C;text-align:right;">$${booking.total.toLocaleString()} USD</td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 32px;">
    <a href="${rmsUrl}/reservations/${reservationId}" style="display:inline-block;padding:11px 26px;background:#C9A84C;color:#0C0C0C;font-size:12px;font-weight:700;letter-spacing:1px;text-decoration:none;border-radius:3px;">
      OPEN IN RMS →
    </a>
    <p style="font-size:11px;color:#BBBBBB;margin:10px 0 0;">Submitted: ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
  </td></tr>

  <tr><td style="padding:14px 32px;background:#F7F7F7;border-top:1px solid #EBEBEB;">
    <p style="font-size:10px;color:#BBBBBB;margin:0;">Samsara RMS · Automated notification · Do not reply to this email</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  return sendMail({
    to: staffEmails,
    subject: `[New Booking] ${ref} — ${booking.form.fullName} · $${booking.total.toLocaleString()} USD`,
    html,
    replyTo: booking.form.email,
  });
}

/* ─── CUSTOMER CONFIRMATION EMAIL ────────────────────────────────── */

function escHtml(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function sendConfirmationEmail(booking: InboundBooking, ref: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { skipped: true, reason: 'Gmail SMTP not configured' };
  }

  const isExp      = booking.source === 'experiences';
  const title      = isExp ? booking.experienceTitle : booking.itineraryTitle;
  const location   = isExp ? booking.experienceLocation : booking.itineraryDestination;
  const duration   = isExp ? booking.experienceDuration : booking.itineraryDuration;
  const pickup     = booking.form.pickupLocation ?? 'Colombo Bandaranaike International Airport';
  const addOns     = booking.selectedAddOnsDetails ?? [];

  function fmtDate(d: string | undefined) {
    if (!d) return 'To be confirmed';
    try { return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  }

  const addOnRows = addOns.map(a => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">${escHtml(a.name)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;text-align:right;">$${escHtml(a.price)}</td>
      </tr>`).join('');

  const openingRows = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => `
      <tr>
        <td style="padding:5px 16px;border-bottom:1px solid #F0EBE0;font-size:12px;color:#8a8070;width:40%;">${day}</td>
        <td style="padding:5px 16px;border-bottom:1px solid #F0EBE0;font-size:12px;color:#1a1410;">00:00 – 24:00</td>
      </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Booking Confirmation — ${escHtml(ref)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F2EB;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EB;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:#080808;padding:26px 36px;">
    <table width="100%"><tr>
      <td>
        <p style="color:#C9A84C;font-size:9px;letter-spacing:4px;text-transform:uppercase;margin:0 0 4px;">Into the Wild</p>
        <p style="font-family:Georgia,serif;font-size:22px;color:#F2EDE4;margin:0;letter-spacing:3px;">SAMSARA</p>
        <p style="font-size:11px;color:rgba(255,255,255,0.3);margin:3px 0 0;">Sri Lanka's Luxury Travel Experience</p>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <p style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin:0 0 3px;">ORDER</p>
        <p style="font-size:14px;font-weight:700;color:#C9A84C;margin:0;">${escHtml(ref)}</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- PAY ON ARRIVAL BANNER -->
  <tr><td style="background:#C9A84C;padding:10px 36px;">
    <p style="font-size:11px;font-weight:700;color:#080808;margin:0;letter-spacing:2px;text-align:center;">PAY ON ARRIVAL</p>
  </td></tr>

  <!-- BOOKING CONFIRMATION NUMBER -->
  <tr><td style="padding:24px 36px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #EDE8DC;border-radius:3px;">
      <tr><td style="padding:14px 20px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 5px;">Booking Confirmation Number</p>
        <p style="font-family:Georgia,serif;font-size:20px;color:#1a1410;margin:0;letter-spacing:1px;">${escHtml(ref)}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- TRIP DETAILS -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 10px;">Trip Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:38%;font-size:11px;color:#8a8070;">Start Date</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(fmtDate(booking.form.travelDate))}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">${isExp ? 'Experience' : 'Itinerary'}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;font-weight:600;color:#1a1410;">${escHtml(title ?? '—')}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Location</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(location ?? 'Sri Lanka')}</td>
      </tr>
      ${duration ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Duration</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(duration)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Travellers</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(booking.form.travelers)}</td>
      </tr>
      ${booking.form.budgetPreference ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Budget</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(booking.form.budgetPreference)}</td>
      </tr>` : ''}
      ${booking.form.specialRequests ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;vertical-align:top;">Special Requests</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(booking.form.specialRequests)}</td>
      </tr>` : ''}
    </table>
  </td></tr>

  <!-- PAYMENT SUMMARY -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 10px;">Payment Summary</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      ${isExp && booking.experiencePrice ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:38%;font-size:11px;color:#8a8070;">Base Price</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;text-align:right;">$${escHtml(booking.experiencePrice)} × ${escHtml(booking.form.travelers)}</td>
      </tr>` : ''}
      ${addOnRows}
      <tr>
        <td style="padding:14px 16px;background:#1a1410;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Total to Pay on Arrival</td>
        <td style="padding:14px 16px;background:#1a1410;text-align:right;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#E2C97E;">$${booking.total.toLocaleString()}</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.3);margin-left:4px;">USD · PAY ON ARRIVAL</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- LOCATION DETAILS -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 10px;">Location Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:38%;font-size:11px;color:#8a8070;">Pickup Location</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">${escHtml(pickup)}</td>
      </tr>
    </table>

    <div style="margin-top:10px;background:#FAFAF6;border:1px solid #EDE8DC;border-radius:3px;padding:14px 16px;">
      <p style="font-size:11px;color:#8a8070;margin:0 0 5px;">Location Address</p>
      <p style="font-size:13px;color:#1a1410;margin:0 0 12px;line-height:1.7;">
        Airport and Aviation Services Limited<br>
        Canada Friendship Rd<br>
        Katunayake 11450
      </p>
      <p style="font-size:11px;color:#8a8070;margin:0 0 3px;">Location Telephone</p>
      <p style="font-size:13px;color:#1a1410;margin:0;">
        <a href="tel:+94715858966" style="color:#B8902A;text-decoration:none;">+94 71 585 8966</a>
      </p>
    </div>
  </td></tr>

  <!-- OPENING HOURS -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 10px;">Opening Hours</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      ${openingRows}
    </table>
    <p style="font-size:11px;color:#b0a898;margin:8px 0 0;">Please note that in the event that your booking falls outside branch opening hours, an out-of-hours surcharge may apply.</p>
  </td></tr>

  <!-- MEET & GREET -->
  <tr><td style="padding:16px 36px 0;">
    <div style="background:#FAFAF6;border-left:3px solid #C9A84C;padding:12px 16px;border-radius:0 3px 3px 0;">
      <p style="font-size:12px;color:#5a5248;margin:0;line-height:1.7;">
        Samsara is located at <strong>Airport and Aviation Services (Sri Lanka) (Private) Limited</strong>, Canada Friendship Rd, Katunayake 11450. Upon arrival, please proceed to the <strong>3rd counter</strong>, where a Samsara representative will meet you. For further assistance, contact us on <a href="tel:+94715858966" style="color:#B8902A;text-decoration:none;">+94 71 585 8966</a>
      </p>
    </div>
  </td></tr>

  <!-- CUSTOMER DETAILS -->
  <tr><td style="padding:20px 36px 0;">
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 10px;">Customer Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8DC;border-radius:3px;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;width:38%;font-size:11px;color:#8a8070;">Customer Name</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;font-weight:600;color:#1a1410;">${escHtml(booking.form.fullName)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Flight Number</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#8a8070;">—</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Age</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#8a8070;">—</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Contact Number 1</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">
          <a href="tel:${escHtml(booking.form.phone)}" style="color:#B8902A;text-decoration:none;">${escHtml(booking.form.phone)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Contact Number 2</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#8a8070;">—</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:11px;color:#8a8070;">Email</td>
        <td style="padding:10px 16px;border-bottom:1px solid #F0EBE0;font-size:13px;color:#1a1410;">
          <a href="mailto:${escHtml(booking.form.email)}" style="color:#B8902A;text-decoration:none;">${escHtml(booking.form.email)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:11px;color:#8a8070;">Address</td>
        <td style="padding:10px 16px;font-size:13px;color:#8a8070;">—</td>
      </tr>
    </table>
  </td></tr>

  <!-- ONLINE CHECK-IN CTA -->
  <tr><td style="padding:20px 36px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1410;border-radius:3px;overflow:hidden;">
      <tr><td style="padding:20px 24px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;margin:0 0 6px;">Skip the Queue</p>
        <p style="font-family:Georgia,serif;font-size:16px;color:#F2EDE4;margin:0 0 6px;">Complete your online check-in</p>
        <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0 0 16px;line-height:1.6;">
          Save time on arrival — submit your personal details, flight information, and documents now.
        </p>
        <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:3000'}/check-in?ref=${escHtml(ref)}"
           style="display:inline-block;background:#C9A84C;color:#080808;text-decoration:none;padding:11px 22px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">
          CHECK IN ONLINE →
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:20px 36px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #EDE8DC;border-radius:3px;">
      <tr><td style="padding:14px 18px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 5px;">Need Assistance?</p>
        <p style="font-size:13px;color:#5a5248;margin:0;">
          <a href="mailto:hello@samsaratravels.com" style="color:#B8902A;text-decoration:none;">hello@samsaratravels.com</a>
          &nbsp;·&nbsp;
          <a href="tel:+94715858966" style="color:#B8902A;text-decoration:none;">+94 71 585 8966</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:14px 36px;background:#080808;">
    <table width="100%"><tr>
      <td>
        <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin:0 0 2px;">SAMSARA</p>
        <p style="font-size:10px;color:rgba(255,255,255,0.25);margin:0;">Into the Wild · Sri Lanka</p>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <p style="font-size:10px;color:rgba(255,255,255,0.2);margin:0;">Ref: <strong style="color:rgba(255,255,255,0.4);">${escHtml(ref)}</strong></p>
      </td>
    </tr></table>
    <p style="font-size:10px;color:rgba(255,255,255,0.15);margin:10px 0 0;line-height:1.6;">This is an automated booking confirmation. Please retain this email for your records. Reply or contact hello@samsaratravels.com for any amendments.</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;

  return sendMail({
    to: booking.form.email,
    subject: `Booking Confirmation — ${ref} | Samsara Travel`,
    html,
  });
}

/* ─── ROUTE HANDLER ──────────────────────────────────────────────── */

function dbTimeout<T>(query: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(query),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DB_TIMEOUT: ${label} exceeded ${ms}ms`)), ms)
    ),
  ]);
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const ms = () => `${Date.now() - t0}ms`;

  try {
    const booking: InboundBooking = await req.json();

    const { form, source, total, type } = booking;

    if (!form?.fullName?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing required field: fullName' }, { status: 400 });
    }
    if (!form?.email?.trim() || !EMAIL_RE.test(form.email.trim())) {
      return NextResponse.json({ success: false, error: 'Missing or invalid email address' }, { status: 400 });
    }
    if (typeof total !== 'number' || total < 0) {
      return NextResponse.json({ success: false, error: 'Invalid total amount' }, { status: 400 });
    }

    console.log(`[BOOKING] ▶ ${form.email} — request received`);

    const sb = createAdminClient();

    // ── 1. Upsert Client ──────────────────────────────────────────────
    let clientId: string;

    const { data: existingClient } = await dbTimeout(
      sb.from('clients').select('id').eq('email', form.email.trim().toLowerCase()).maybeSingle(),
      12000, 'client lookup'
    );
    console.log(`[BOOKING] client lookup: ${ms()}`);

    if (existingClient?.id) {
      clientId = existingClient.id as string;
      await dbTimeout(
        sb.from('clients').update({ full_name: form.fullName, phone: form.phone }).eq('id', clientId),
        8000, 'client update'
      );
    } else {
      const { data: newClient, error: clientErr } = await dbTimeout(
        sb.from('clients').insert({
          full_name:        form.fullName,
          email:            form.email.trim().toLowerCase(),
          phone:            form.phone,
          nationality:      'Unknown',
          is_vip:           false,
          is_repeat_client: false,
          notes:            form.specialRequests ?? null,
        }).select('id').single(),
        8000, 'client insert'
      );

      if (clientErr || !newClient) {
        console.error(`[BOOKING] client insert error (${ms()}):`, clientErr);
        return NextResponse.json({ success: false, error: 'Failed to create client' }, { status: 500 });
      }
      clientId = newClient.id as string;
    }
    console.log(`[BOOKING] client upsert done: ${ms()}`);

    // ── 2. Generate Reference ─────────────────────────────────────────
    const year  = new Date().getFullYear();
    const seq   = Math.floor(Math.random() * 9000) + 1000;
    const ref   = `${source === 'feeling-engine' ? 'SAM' : 'ITW'}-${year}-${seq}`;

    // ── 3. Build destinations array ───────────────────────────────────
    const destinations: string[] = [];
    if (booking.experienceLocation) destinations.push(booking.experienceLocation);
    else if (booking.itineraryDestination) destinations.push(booking.itineraryDestination);
    if (destinations.length === 0) destinations.push('Sri Lanka');

    // ── 4. Internal notes payload ─────────────────────────────────────
    const internalNotes = JSON.stringify({
      web_booking:   true,
      source,
      type,
      experience:    booking.experienceTitle ?? booking.itineraryTitle,
      pickup:        form.pickupLocation,
      budget:        form.budgetPreference,
      add_ons:       booking.selectedAddOnsDetails?.map(a => a.name) ?? [],
      submitted_at:  new Date().toISOString(),
    });

    // ── 5. Create Reservation ─────────────────────────────────────────
    const arrivalDate   = form.travelDate || new Date().toISOString().slice(0, 10);
    const departureDate = computeDepartureDate(arrivalDate, form.returnDate, form.durationDays);
    const experienceTitle = booking.experienceTitle ?? booking.itineraryTitle ?? null;

    // Columns guaranteed to exist (schema.sql).
    const baseRow = {
      reference:      ref,
      status:         'enquiry',
      client_id:      clientId,
      travel_purpose: 'leisure',
      arrival_date:   arrivalDate,
      departure_date: departureDate,
      num_adults:     parseInt(form.travelers) || 1,
      num_children:   0,
      num_infants:    0,
      destinations,
      budget_range:   form.budgetPreference ?? null,
      currency:       'USD',
      total_cost:     total,
      total_paid:     0,
      commission_amount: 0,
      payment_status: 'pending',
      assigned_staff: 'Web Booking',
      internal_notes: internalNotes,
      is_vip:         false,
      special_occasions: [],
    };

    // Structured columns added by booking-fields.sql — kept in sync with the form.
    const extendedRow = {
      ...baseRow,
      pickup_location:         form.pickupLocation ?? null,
      dropoff_location:        form.dropoffLocation ?? null,
      special_requests:        form.specialRequests ?? null,
      booking_notes:           form.bookingNotes ?? form.notes ?? null,
      experience_title:        experienceTitle,
      emergency_contact_name:  form.emergencyContactName ?? null,
      emergency_contact_phone: form.emergencyContactPhone ?? null,
    };

    let { data: reservation, error: resErr } = await dbTimeout(
      sb.from('reservations').insert(extendedRow).select('id, reference').single(),
      8000, 'reservation insert'
    );

    // Reliability: if booking-fields.sql hasn't been run, the structured columns
    // don't exist yet — never break the booking. Fall back to base columns and
    // preserve the structured data inside internal_notes.
    if (resErr && /column .* does not exist|could not find the .* column|schema cache/i.test(resErr.message ?? '')) {
      console.warn('[BOOKING] booking-fields columns missing — run booking-fields.sql. Falling back.');
      const fallbackNotes = JSON.stringify({
        ...JSON.parse(internalNotes),
        dropoff:           form.dropoffLocation,
        special_requests:  form.specialRequests,
        booking_notes:     form.bookingNotes ?? form.notes,
        emergency_contact: form.emergencyContactName
          ? { name: form.emergencyContactName, phone: form.emergencyContactPhone }
          : undefined,
      });
      ({ data: reservation, error: resErr } = await dbTimeout(
        sb.from('reservations').insert({ ...baseRow, internal_notes: fallbackNotes }).select('id, reference').single(),
        8000, 'reservation insert (fallback)'
      ));
    }

    if (resErr || !reservation) {
      console.error(`[BOOKING] reservation insert error (${ms()}):`, resErr);
      return NextResponse.json({ success: false, error: 'Failed to create reservation' }, { status: 500 });
    }
    console.log(`[BOOKING] reservation created: ${ms()} — ref ${ref}`);

    console.log(`\n=== WEB BOOKING → RMS ===\n  Ref: ${ref}\n  Client: ${form.fullName} <${form.email}>\n  Source: ${source}\n  Total: $${total}\n=========================\n`);

    // ── 6 & 7. Fire emails in background ─────────────────────────────
    Promise.allSettled([
      sendConfirmationEmail(booking, ref).catch(err =>
        console.error('[BOOKING] customer email error:', err instanceof Error ? err.message : err)
      ),
      sendStaffNotificationEmail(booking, ref, reservation.id).catch(err =>
        console.error('[BOOKING] staff email error:', err instanceof Error ? err.message : err)
      ),
    ]);

    console.log(`[BOOKING] ✓ response sent: ${ms()}`);
    return NextResponse.json({
      success: true,
      reservation: {
        bookingRef:    ref,
        reservationId: reservation.id,
        status:        'enquiry',
        emailStatus:   'queued',
      },
    });

  } catch (err) {
    const msg = String(err);
    const isDbTimeout = msg.startsWith('Error: DB_TIMEOUT') || msg.includes('DB_TIMEOUT');
    console.error(`[BOOKING] ✗ error after ${Date.now() - t0}ms:`, msg);
    return NextResponse.json({
      success: false,
      error: isDbTimeout
        ? 'Database is warming up — please try again in 30 seconds.'
        : 'Internal server error',
    }, { status: isDbTimeout ? 503 : 500 });
  }
}

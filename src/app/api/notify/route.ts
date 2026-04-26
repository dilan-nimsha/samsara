import { NextRequest, NextResponse } from 'next/server';

type NotifyPayload = {
  type: 'email' | 'whatsapp' | 'both';
  to_email?: string;
  to_phone?: string;
  client_name: string;
  subject: string;
  message: string;
  reservation_reference?: string;
};

// ─── EMAIL via Resend ─────────────────────────────────────────────────────────
async function sendEmail(payload: NotifyPayload) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0D0D0D;font-family:Georgia,serif">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px">
        <div style="text-align:center;margin-bottom:32px">
          <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0">SAMSARA TRAVEL</p>
        </div>
        <div style="background:#141414;border:1px solid rgba(255,255,255,0.06);padding:40px;border-radius:4px">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">Dear ${payload.client_name}</p>
          <div style="color:rgba(242,237,228,0.85);font-size:15px;line-height:1.8;white-space:pre-line">${payload.message}</div>
          ${payload.reservation_reference ? `
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)">
            <p style="color:rgba(255,255,255,0.3);font-size:11px;letter-spacing:2px">BOOKING REFERENCE</p>
            <p style="color:#C9A84C;font-size:16px;font-weight:bold;margin:4px 0 0">${payload.reservation_reference}</p>
          </div>` : ''}
        </div>
        <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin-top:24px">
          Samsara Travel · Sri Lanka's Luxury Travel Experience
        </p>
      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: 'Samsara Travel <hello@samsara.travel>',
    to: payload.to_email!,
    subject: payload.subject,
    html,
  });
}

// ─── WHATSAPP via Twilio ──────────────────────────────────────────────────────
async function sendWhatsApp(payload: NotifyPayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

  const body = `*SAMSARA TRAVEL*\n\nDear ${payload.client_name},\n\n${payload.message}${payload.reservation_reference ? `\n\n*Booking Reference:* ${payload.reservation_reference}` : ''}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:${payload.to_phone}`,
        Body: body,
      }),
    }
  );
  return res.json();
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload: NotifyPayload = await req.json();

    const results: Record<string, unknown> = {};

    if ((payload.type === 'email' || payload.type === 'both') && payload.to_email) {
      results.email = await sendEmail(payload);
    }

    if ((payload.type === 'whatsapp' || payload.type === 'both') && payload.to_phone) {
      results.whatsapp = await sendWhatsApp(payload);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// ─── NOTIFICATION TEMPLATES ───────────────────────────────────────────────────
export const TEMPLATES = {
  enquiry_received: (name: string) => ({
    subject: 'We\'ve received your enquiry — Samsara Travel',
    message: `Thank you for reaching out to Samsara Travel.\n\nWe've received your travel enquiry and our team will review the details carefully. You can expect to hear from us within 24 hours with a personalised response.\n\nWe look forward to crafting your perfect Sri Lanka journey.`,
  }),
  booking_confirmed: (name: string, ref: string, dates: string) => ({
    subject: `Your trip is confirmed — ${ref}`,
    message: `Wonderful news! Your Sri Lanka journey has been confirmed.\n\nYour travel dates: ${dates}\n\nYour dedicated travel consultant will be in touch shortly with your full itinerary and pre-departure information. In the meantime, if you have any questions please don't hesitate to reach out.`,
  }),
  payment_received: (name: string, amount: string) => ({
    subject: 'Payment received — Samsara Travel',
    message: `We've received your payment of ${amount}.\n\nThank you — your booking is now fully secured. Your complete itinerary and all travel documents will be sent to you closer to your departure date.`,
  }),
  trip_reminder: (name: string, days: number, ref: string) => ({
    subject: `Your Sri Lanka journey begins in ${days} days`,
    message: `Your much-anticipated Sri Lanka journey is just ${days} days away.\n\nPlease ensure you have:\n• Valid passport (6+ months validity)\n• Travel insurance documents\n• Any required visa approvals\n\nYour itinerary and all vouchers have been attached to this email. We wish you a wonderful journey.`,
  }),
  post_trip_feedback: (name: string) => ({
    subject: 'How was your Sri Lanka journey?',
    message: `Welcome home! We hope your Sri Lanka journey with Samsara was everything you dreamed of and more.\n\nWe'd love to hear about your experience. Your feedback helps us continue crafting exceptional journeys for travellers like you.\n\nSimply reply to this email or follow the link below to share your thoughts.`,
  }),
};

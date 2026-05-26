import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

export async function GET() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json({ error: 'EMAIL_USER or EMAIL_PASS not set' }, { status: 500 });
  }

  const staffEmails = (process.env.STAFF_NOTIFICATION_EMAILS ?? '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (staffEmails.length === 0) {
    return NextResponse.json({ error: 'No recipients configured in STAFF_NOTIFICATION_EMAILS' }, { status: 400 });
  }

  try {
    const result = await sendMail({
      to: staffEmails,
      subject: 'Samsara RMS — Email Test',
      html: '<p style="font-family:Arial;font-size:14px;">Test email from <strong>Samsara RMS</strong>. Staff notifications are working.</p>',
    });

    return NextResponse.json({ success: true, to: staffEmails, messageId: result.messageId });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

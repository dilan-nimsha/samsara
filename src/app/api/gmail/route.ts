import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';

export async function GET() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json({ success: false, error: 'Gmail credentials not configured', emails: [] });
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: false,
  });

  try {
    await client.connect();

    const emails: {
      uid: number;
      subject: string;
      from: string;
      fromEmail: string;
      date: string;
      preview: string;
      unread: boolean;
      hasAttachment: boolean;
    }[] = [];

    const lock = await client.getMailboxLock('INBOX');

    try {
      const status = await client.status('INBOX', { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) {
        return NextResponse.json({ success: true, emails: [] });
      }

      // Fetch the latest 30 messages
      const start = Math.max(1, total - 29);
      const range = `${start}:${total}`;

      const messages: typeof emails = [];

      for await (const msg of client.fetch(range, {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        bodyParts: ['TEXT'],
      })) {
        const envelope = msg.envelope;
        if (!envelope) continue;

        const fromAddr   = envelope.from?.[0] as Record<string, string> | undefined;
        const fromName   = fromAddr?.name ?? fromAddr?.mailbox ?? 'Unknown';
        const fromEmail  = fromAddr?.mailbox && fromAddr?.host
          ? `${fromAddr.mailbox}@${fromAddr.host}` : '';

        const hasAttach = !!(msg.bodyStructure &&
          'childNodes' in msg.bodyStructure &&
          (msg.bodyStructure as { childNodes?: { disposition?: string }[] }).childNodes?.some(
            n => n.disposition?.toLowerCase() === 'attachment'
          ));

        let preview = '';
        if (msg.bodyParts) {
          const textPart = msg.bodyParts.get('TEXT');
          if (textPart) {
            preview = Buffer.from(textPart).toString('utf8').slice(0, 120).replace(/\s+/g, ' ').trim();
          }
        }

        messages.push({
          uid:           msg.uid,
          subject:       envelope.subject ?? '(no subject)',
          from:          fromName,
          fromEmail,
          date:          envelope.date?.toISOString() ?? new Date().toISOString(),
          preview,
          unread:        !msg.flags?.has('\\Seen'),
          hasAttachment: hasAttach,
        });
      }

      // Return newest first
      emails.push(...messages.reverse());
    } finally {
      lock.release();
    }

    await client.logout();

    return NextResponse.json({
      success: true,
      emails,
    });

  } catch (err) {
    try { await client.logout(); } catch { /* ignore */ }
    return NextResponse.json({ success: false, error: String(err), emails: [] }, { status: 500 });
  }
}

import nodemailer from 'nodemailer';

export function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST  ?? 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const transport = createTransport();
  return transport.sendMail({
    from:    process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
    to:      Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
    subject: opts.subject,
    html:    opts.html,
    replyTo: opts.replyTo,
  });
}

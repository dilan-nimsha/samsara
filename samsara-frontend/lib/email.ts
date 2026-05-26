import nodemailer from "nodemailer";
import type { ReservationRecord } from "./db";
import { buildEmailHtml } from "./emailTemplate";

function isConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   ?? "smtp.gmail.com",
    port:   Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });
}

export async function sendBookingConfirmation(
  r: ReservationRecord
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: "Email credentials not configured (EMAIL_USER / EMAIL_PASS missing)" };
  }

  const isPurchase = r.type === "purchase";
  const subject = isPurchase
    ? `Booking Confirmed — ${r.bookingRef} | Samsara Into the Wild`
    : `Enquiry Saved — ${r.bookingRef} | Samsara Into the Wild`;

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from:    `"Samsara Travels" <${process.env.EMAIL_FROM ?? process.env.EMAIL_USER}>`,
      to:      r.form.email,
      subject,
      html:    buildEmailHtml(r),
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

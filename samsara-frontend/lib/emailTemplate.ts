import type { ReservationRecord } from "./db";

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function fmtDate(d: string) {
  if (!d) return "To be confirmed";
  try { return new Date(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}

export function buildEmailHtml(r: ReservationRecord): string {
  const isExperience = r.source === "experiences";
  const title        = isExperience ? (r.experienceTitle ?? "Experience") : (r.itineraryTitle ?? "Bespoke Itinerary");
  const location     = isExperience ? (r.experienceLocation ?? "Sri Lanka") : (r.itineraryDestination ?? "Sri Lanka");
  const duration     = isExperience ? (r.experienceDuration ?? "") : (r.itineraryDuration ?? "");
  const isPurchase   = r.type === "purchase";
  const statusLabel  = isPurchase ? "Purchase Submitted" : "Enquiry Saved";
  const addOns       = r.selectedAddOnsDetails ?? [];

  const rows = [
    ["Full Name",        r.form.fullName],
    ["Email",            r.form.email],
    ["Phone",            r.form.phone],
    ["Travellers",       r.form.travelers],
    ["Travel Date",      fmtDate(r.form.travelDate)],
    r.form.pickupLocation ? ["Pickup Location", r.form.pickupLocation] : null,
    r.form.budgetPreference ? ["Budget Preference", r.form.budgetPreference] : null,
    r.form.specialRequests ? ["Special Requests", r.form.specialRequests] : null,
    r.form.notes ? ["Notes", r.form.notes] : null,
  ].filter(Boolean) as [string, string][];

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;font-family:Arial,sans-serif;font-size:13px;color:#8B8070;width:38%;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;font-family:Arial,sans-serif;font-size:13px;color:#2C2620;vertical-align:top;">${value}</td>
    </tr>`).join("");

  const addOnsHtml = addOns.length > 0 ? `
    <tr>
      <td colspan="2" style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
        <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8B8070;margin:0 0 6px;">Add-ons</p>
        ${addOns.map(a => `<p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2620;margin:2px 0;">${a.name} — <span style="color:#B8902A;">${fmt(a.price)}</span></p>`).join("")}
      </td>
    </tr>` : "";

  const nextSteps = isPurchase ? [
    "Our team reviews availability for your chosen experience and dates",
    "A dedicated coordinator contacts you within 24 hours via email or phone",
    "We confirm all logistical details and any special requirements",
    "Payment is arranged securely upon final confirmation",
    "You receive a complete experience brief before your departure",
  ] : [
    "Your enquiry has been logged with reference " + r.bookingRef,
    "Our team reviews your preferences within 48 hours",
    "We contact you to discuss dates, options and custom pricing",
    "We build a bespoke package tailored to your vision",
  ];

  const nextStepsHtml = nextSteps.map((s, i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F5F2EB;vertical-align:top;width:28px;">
        <span style="font-family:Arial,sans-serif;font-size:11px;color:#B8902A;font-weight:700;">${i + 1}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #F5F2EB;">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#5C5248;margin:0;line-height:1.6;">${s}</p>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booking Confirmed — ${r.bookingRef}</title>
</head>
<body style="margin:0;padding:0;background:#F5F2EB;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EB;">
<tr><td align="center" style="padding:32px 16px;">

<!-- Card -->
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:2px;overflow:hidden;">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background:#080808;padding:32px 40px;">
      <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin:0 0 6px;">Into the Wild</p>
      <p style="font-family:Georgia,serif;font-size:30px;font-weight:400;color:#F2EDE4;margin:0;letter-spacing:2px;">SAMSARA</p>
    </td>
  </tr>

  <!-- ── HERO BANNER ── -->
  <tr>
    <td style="background:#111111;padding:40px;text-align:center;border-bottom:2px solid #C9A84C;">
      <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin:0 0 14px;">
        ${statusLabel}
      </p>
      <p style="font-family:Georgia,serif;font-size:36px;font-weight:400;color:#E2C97E;margin:0 0 10px;letter-spacing:1px;">
        ${r.bookingRef}
      </p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#A89F92;margin:0;">
        Thank you, <strong style="color:#F2EDE4;">${r.form.fullName.split(" ")[0]}</strong>. Your adventure is being arranged.
      </p>
    </td>
  </tr>

  <!-- ── EXPERIENCE SUMMARY ── -->
  <tr>
    <td style="padding:36px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E8E3D8;border-radius:2px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 6px;">${isExperience ? "Your Experience" : "Your Itinerary"}</p>
            <p style="font-family:Georgia,serif;font-size:22px;color:#1A1410;margin:0 0 6px;">${title}</p>
            <p style="font-family:Arial,sans-serif;font-size:12px;color:#8B8070;margin:0;">
              ◎ ${location}${duration ? " &nbsp;·&nbsp; " + duration : ""}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── GUEST DETAILS ── -->
  <tr>
    <td style="padding:32px 40px 0;">
      <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 16px;">Guest Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${rowsHtml}
      </table>
    </td>
  </tr>

  <!-- ── PRICE BREAKDOWN ── -->
  <tr>
    <td style="padding:32px 40px 0;">
      <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 16px;">Price Breakdown</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;font-family:Arial,sans-serif;font-size:13px;color:#8B8070;width:38%;">Base Price</td>
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;font-family:Arial,sans-serif;font-size:13px;color:#2C2620;">
            ${fmt(isExperience ? (r.experiencePrice ?? 0) : r.total)} ${r.travelerCount && r.travelerCount > 1 ? "× " + r.travelerCount + " travellers" : ""}
          </td>
        </tr>
        ${addOnsHtml}
        <tr>
          <td colspan="2" style="padding:14px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1410;border-radius:2px;">
              <tr>
                <td style="padding:14px 20px;">
                  <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B8070;margin:0;">Total Estimated Investment</p>
                </td>
                <td style="padding:14px 20px;text-align:right;">
                  <p style="font-family:Georgia,serif;font-size:24px;color:#E2C97E;margin:0;font-weight:400;">${fmt(r.total)} <span style="font-family:Arial,sans-serif;font-size:11px;color:#8B8070;">USD</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#B0A898;margin:8px 0 0;line-height:1.6;">
        No payment is collected at this stage. Final pricing is confirmed by our team before any charges.
      </p>
    </td>
  </tr>

  <!-- ── WHAT HAPPENS NEXT ── -->
  <tr>
    <td style="padding:32px 40px 0;">
      <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 16px;">What Happens Next</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${nextStepsHtml}
      </table>
    </td>
  </tr>

  <!-- ── CONTACT ── -->
  <tr>
    <td style="padding:32px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #E8E3D8;border-radius:2px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 10px;">Need Help?</p>
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#5C5248;margin:0 0 6px;line-height:1.6;">
              Our team is here to help. Reply to this email or reach us at:
            </p>
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#2C2620;margin:0;">
              <a href="mailto:hello@samsaratravels.com" style="color:#B8902A;text-decoration:none;">hello@samsaratravels.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="padding:40px;border-top:1px solid #E8E3D8;margin-top:32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8902A;margin:0 0 4px;">SAMSARA</p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#B0A898;margin:0;line-height:1.6;">
              Into the Wild · Sri Lanka
            </p>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#C8BFB0;margin:0;line-height:1.8;">
              Booking Reference<br>
              <strong style="color:#8B8070;letter-spacing:1px;">${r.bookingRef}</strong>
            </p>
          </td>
        </tr>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:10px;color:#C8BFB0;margin:20px 0 0;line-height:1.6;">
        You received this email because a booking was made with this email address.
        This is an automated confirmation — please do not reply directly to this message.
        Instead, contact us at hello@samsaratravels.com.
      </p>
    </td>
  </tr>

</table>
<!-- /Card -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}

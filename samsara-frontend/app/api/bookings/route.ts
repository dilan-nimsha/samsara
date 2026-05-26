import { NextRequest, NextResponse } from "next/server";

const RMS_URL = process.env.RMS_URL ?? "http://localhost:3001";

function makeFallbackRef() {
  return "ITW-" + Date.now().toString(36).toUpperCase() + "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase();
}

/* ─── POST — forward to samsara-rms ─────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let rmsRes: Response;
    try {
      rmsRes = await fetch(`${RMS_URL}/api/bookings/inbound`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
        signal:  controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!rmsRes.ok) {
      const body = await rmsRes.text().catch(() => "");
      console.error(`RMS responded with ${rmsRes.status}:`, body);
      return NextResponse.json({
        success: false,
        error: `Booking system error (${rmsRes.status}). Please try again or contact us directly.`,
        _rmsStatus: rmsRes.status,
        _rmsBody: body,
      }, { status: 502 });
    }

    const data = await rmsRes.json() as {
      success: boolean;
      reservation?: {
        bookingRef: string;
        reservationId: string;
        status: string;
        emailStatus: string;
        emailError?: string;
      };
      error?: string;
    };

    if (!data.success) {
      console.error("RMS booking error:", data.error);
      return NextResponse.json({
        success: false,
        error: data.error ?? "Booking could not be saved. Please try again.",
      }, { status: rmsRes.status === 503 ? 503 : 502 });
    }

    return NextResponse.json({ success: true, reservation: data.reservation });

  } catch (err) {
    const isTimeout = String(err).includes("abort");
    console.error("Booking proxy error:", err);
    return NextResponse.json({
      success: false,
      error: isTimeout
        ? "Booking system timed out. Please try again."
        : "Could not reach booking system. Please try again.",
      _rmsError: String(err),
    }, { status: 503 });
  }
}

/* ─── GET — list all web bookings from rms ───────────────────────── */

export async function GET() {
  try {
    const res  = await fetch(`${RMS_URL}/api/bookings`);
    const data = await res.json() as { success: boolean; reservations?: unknown[] };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, reservations: [] });
  }
}

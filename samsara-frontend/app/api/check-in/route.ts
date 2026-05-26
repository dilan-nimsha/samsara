import { NextRequest, NextResponse } from "next/server";

const RMS_URL = process.env.RMS_URL ?? "http://localhost:3001";

/* ─── GET — look up booking by reference ─────────────────────────────── */
export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ success: false, error: "Missing booking reference" }, { status: 400 });
  }
  try {
    const res = await fetch(`${RMS_URL}/api/check-in?ref=${encodeURIComponent(ref)}`, {
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, error: "Could not reach booking system" }, { status: 503 });
  }
}

/* ─── POST — submit check-in data ────────────────────────────────────── */
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
      rmsRes = await fetch(`${RMS_URL}/api/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await rmsRes.json();
    return NextResponse.json(data, { status: rmsRes.ok ? 200 : rmsRes.status });
  } catch (err) {
    const isTimeout = String(err).includes("abort");
    return NextResponse.json({
      success: false,
      error: isTimeout ? "Request timed out. Please try again." : "Could not reach booking system.",
    }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // In production this would insert into a database.
    // For now we return the payload with a server timestamp and booking reference.
    const ref = "ITW-" + Date.now().toString(36).toUpperCase() + "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const reservation = {
      ...body,
      bookingRef: ref,
      serverTimestamp: new Date().toISOString(),
      status: body.type === "purchase" ? "pending_payment" : "pending",
      paymentStatus: "unpaid",
    };

    // Log to server console so the "reservation team" can see it
    console.log("\n=== NEW RESERVATION ===");
    console.log(JSON.stringify(reservation, null, 2));
    console.log("=======================\n");

    return NextResponse.json({ success: true, reservation });
  } catch (err) {
    console.error("Reservation error:", err);
    return NextResponse.json({ success: false, error: "Failed to process reservation" }, { status: 500 });
  }
}

export async function GET() {
  // In production this would query the database.
  // The admin dashboard reads from localStorage client-side.
  return NextResponse.json({ message: "Reservation system active" });
}

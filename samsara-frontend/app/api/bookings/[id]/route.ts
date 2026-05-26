import { NextRequest, NextResponse } from "next/server";
import { updateRecord, deleteRecord } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

/* ─── PATCH — update booking status / payment ────────────────────── */

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const allowed = ["status", "paymentStatus", "emailStatus"];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const updated = updateRecord(id, patch as Parameters<typeof updateRecord>[1]);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, reservation: updated });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}

/* ─── DELETE — remove booking ────────────────────────────────────── */

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ok = deleteRecord(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete booking" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { getFleetAssignments, getResourceAssignments, insertFleetAssignment, deleteFleetAssignment } from '@/lib/supabase/queries';
import { findConflicts, type ResourceType } from '@/lib/fleet/availability';

const RESOURCE_TYPES: ResourceType[] = ['vehicle', 'driver', 'guide'];

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const assignments = await getFleetAssignments({
      date:          p.get('date') ?? undefined,
      resourceId:    p.get('resource_id') ?? undefined,
      reservationId: p.get('reservation_id') ?? undefined,
    });
    return NextResponse.json({ success: true, assignments });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), assignments: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only operational staff may assign fleet/guides.
    const profile = await getProfile();
    if (!profile || !['admin', 'ops', 'finance'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json() as Record<string, unknown>;
    const resource_type = body.resource_type as ResourceType;
    const resource_id   = typeof body.resource_id === 'string' ? body.resource_id : '';
    const start_date    = typeof body.start_date === 'string' ? body.start_date : '';
    const end_date      = typeof body.end_date === 'string' && body.end_date ? body.end_date : start_date;

    if (!RESOURCE_TYPES.includes(resource_type) || !resource_id || !start_date) {
      return NextResponse.json({ success: false, error: 'resource_type, resource_id and start_date are required' }, { status: 400 });
    }
    if (end_date < start_date) {
      return NextResponse.json({ success: false, error: 'end_date cannot be before start_date' }, { status: 400 });
    }

    const reservationId = typeof body.reservation_id === 'string' ? body.reservation_id : null;

    // ── One resource of each type per booking ──
    if (reservationId) {
      const forRes = await getFleetAssignments({ reservationId });
      if (forRes.some(a => a.resource_type === resource_type)) {
        return NextResponse.json({
          success: false,
          error: `This booking already has a ${resource_type} assigned — remove it first to reassign.`,
        }, { status: 409 });
      }
    }

    // ── Anti double-booking guard ──
    // Pull this resource's overlapping assignments and run the pure conflict test.
    const existing  = await getResourceAssignments(resource_type, resource_id, start_date, end_date);
    const conflicts = findConflicts(existing, resource_type, resource_id, start_date, end_date);
    if (conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        error: `This ${resource_type} is already booked for ${conflicts[0].start_date}${conflicts[0].end_date !== conflicts[0].start_date ? `–${conflicts[0].end_date}` : ''}.`,
        conflicts,
      }, { status: 409 });
    }

    const assignment = await insertFleetAssignment({
      reservation_id:   reservationId,
      resource_type, resource_id, start_date, end_date,
      pickup_time:      typeof body.pickup_time === 'string' ? body.pickup_time : null,
      pickup_location:  typeof body.pickup_location === 'string' ? body.pickup_location : null,
      dropoff_location: typeof body.dropoff_location === 'string' ? body.dropoff_location : null,
      flight_number:    typeof body.flight_number === 'string' ? body.flight_number : null,
      pax_count:        Number(body.pax_count) || 0,
      notes:            typeof body.notes === 'string' ? body.notes : null,
    });
    return NextResponse.json({ success: true, assignment });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile || !['admin', 'ops', 'finance'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    await deleteFleetAssignment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

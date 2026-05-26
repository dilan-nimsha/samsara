import { NextRequest, NextResponse } from 'next/server';
import { getVehicles, getDrivers, getGuides, getFleetAssignments } from '@/lib/supabase/queries';
import { coversDate, type Assignment, type ResourceType } from '@/lib/fleet/availability';

// GET /api/fleet/availability?date=YYYY-MM-DD
// Returns each vehicle/driver/guide flagged busy/free for the given date,
// with the conflicting assignment when busy.
export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const [vehicles, drivers, guides, assignments] = await Promise.all([
      getVehicles(), getDrivers(), getGuides(), getFleetAssignments({ date }),
    ]);

    const busy = new Map<string, Assignment>();
    for (const a of assignments) {
      if (coversDate(a, date)) busy.set(`${a.resource_type}:${a.resource_id}`, a);
    }

    const mark = (type: ResourceType, list: { id: string }[]) =>
      list.map(r => {
        const a = busy.get(`${type}:${r.id}`) ?? null;
        return { id: r.id, busy: !!a, assignment: a };
      });

    return NextResponse.json({
      success:  true,
      date,
      vehicles: mark('vehicle', vehicles),
      drivers:  mark('driver',  drivers),
      guides:   mark('guide',   guides),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), vehicles: [], drivers: [], guides: [] }, { status: 500 });
  }
}

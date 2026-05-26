import { NextRequest, NextResponse } from 'next/server';
import { getVehicles, getDrivers, createVehicle, createDriver } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const [vehicles, drivers] = await Promise.all([getVehicles(), getDrivers()]);
    return NextResponse.json({ success: true, vehicles, drivers });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err), vehicles: [], drivers: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const str  = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const kind = str(body.kind) || 'vehicle';

    if (kind === 'driver') {
      const full_name = str(body.driver_name) || str(body.full_name);
      if (!full_name) return NextResponse.json({ success: false, error: 'Driver name is required' }, { status: 400 });
      const driver = await createDriver({
        full_name,
        phone:          str(body.phone) || '—',
        license_number: str(body.license) || str(body.license_number) || undefined,
        languages:      [],
        is_available:   true,
      });
      return NextResponse.json({ success: true, driver });
    }

    // default: vehicle
    const registration = str(body.registration);
    if (!registration) return NextResponse.json({ success: false, error: 'Registration is required' }, { status: 400 });
    const vehicle = await createVehicle({
      type:            (str(body.type) || 'van') as never,
      registration,
      make:            str(body.make),
      model:           str(body.model),
      year:            Number(body.year) || undefined,
      capacity_adults: Number(body.capacity) || 0,
      is_available:    true,
      owner:           'own_fleet',
    });
    return NextResponse.json({ success: true, vehicle });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

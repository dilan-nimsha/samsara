import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Reservation } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const sb = createAdminClient();

    const { data, error } = await sb
      .from('reservations')
      .select('*, client:clients(*), accommodations(*), itinerary_days(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, reservation: data as Reservation });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Reservation } from '@/types';

export async function GET() {
  try {
    const sb = createAdminClient();

    const { data, error } = await sb
      .from('reservations')
      .select('*, client:clients(*)')
      .eq('assigned_staff', 'Web Booking')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, reservations: (data ?? []) as Reservation[] });
  } catch (err) {
    console.error('Bookings GET error:', err);
    return NextResponse.json({ success: false, reservations: [] });
  }
}

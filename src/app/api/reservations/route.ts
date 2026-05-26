import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createReservation, createClient_, logActivity } from '@/lib/supabase/queries';
import { getProfile } from '@/lib/auth';

export async function GET() {
  try {
    // App-layer RBAC: scope results to the caller's role / station / partner.
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ success: false, reservations: [], error: 'Unauthorized' }, { status: 401 });
    }

    const sb = createAdminClient();
    let query = sb
      .from('reservations')
      .select('*, client:clients(*)')
      .order('created_at', { ascending: false });

    if (profile.role === 'partner' || profile.role === 'agent') {
      // Partners/agents see ONLY their own bookings.
      if (!profile.partner_id) {
        return NextResponse.json({ success: true, reservations: [] });
      }
      query = query.eq('partner_id', profile.partner_id);
    } else if ((profile.role === 'ops' || profile.role === 'finance') && profile.station) {
      // Station-bound staff see only reservations touching their station.
      query = query.contains('destinations', [profile.station]);
    }
    // admin (and station-less HQ staff) see everything.

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, reservations: data ?? [] });
  } catch (err) {
    return NextResponse.json({ success: false, reservations: [], error: String(err) }, { status: 500 });
  }
}

function genReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand  = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `SAM-${stamp}${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const str  = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

    const arrival_date   = str(body.arrival_date);
    const departure_date = str(body.departure_date);
    if (!arrival_date || !departure_date) {
      return NextResponse.json({ success: false, error: 'Arrival and departure dates are required' }, { status: 400 });
    }

    // A reservation needs a client: use the selected one, or create it inline.
    let client_id = str(body.client_id);
    if (!client_id) {
      const full_name = str(body.full_name);
      const email     = str(body.email);
      if (!full_name || !email) {
        return NextResponse.json({ success: false, error: 'Select a client, or enter the client name and email' }, { status: 400 });
      }
      const client = await createClient_({
        full_name, email,
        phone:       str(body.phone),
        nationality: str(body.nationality) || undefined,
      });
      client_id = client.id;
    }

    const reference = genReference();
    const reservation = await createReservation({
      reference,
      status:            'enquiry',
      client_id,
      partner_id:        str(body.partner_id) || undefined,
      partner_reference: str(body.partner_reference) || undefined,
      travel_purpose:    (str(body.travel_purpose) || 'leisure') as never,
      arrival_date,
      departure_date,
      num_adults:        Number(body.num_adults) || 1,
      num_children:      Number(body.num_children) || 0,
      num_infants:       Number(body.num_infants) || 0,
      destinations:      Array.isArray(body.destinations) ? body.destinations as string[] : [],
      currency:          (str(body.currency) || 'GBP') as never,
      budget_range:      str(body.budget_range) || undefined,
      assigned_staff:    str(body.assigned_staff) || undefined,
      internal_notes:    str(body.internal_notes) || undefined,
      commission_amount: Number(body.commission) || 0,
    });

    await logActivity({
      reservation_id: reservation.id,
      actor: str(body.assigned_staff) || 'System',
      action: 'created',
      summary: `Reservation ${reference} created`,
    });

    return NextResponse.json({ success: true, reservation });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

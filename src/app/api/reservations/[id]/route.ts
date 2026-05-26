import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/supabase/queries';
import { evaluateTransition, STATUS_LABELS, type LifecycleReservation } from '@/lib/reservations/lifecycle';
import type { ReservationStatus } from '@/types';

const VALID_STATUSES: ReservationStatus[] = [
  'enquiry', 'under_review', 'confirmed', 'invoice_sent',
  'paid', 'trip_active', 'completed', 'cancelled', 'feedback_pending',
];

// Human-readable labels for edited fields, used in the audit trail.
const FIELD_LABELS: Record<string, string> = {
  arrival_date:   'Arrival date',
  departure_date: 'Departure date',
  num_adults:     'Adults',
  num_children:   'Children',
  num_infants:    'Infants',
  internal_notes: 'Internal notes',
  client_name:    'Client name',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from('reservations')
      .select('*, client:clients(*), payments(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, reservation: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json() as Record<string, unknown>;
    const sb = createAdminClient();
    const actor = typeof body.actor === 'string' && body.actor.trim() ? body.actor.trim() : 'System';

    // Load the current reservation once: needed to validate status transitions
    // against the lifecycle gates and to record before/after values in the audit log.
    const { data: current, error: loadErr } = await sb
      .from('reservations')
      .select('status, client_id, arrival_date, departure_date, total_cost, total_paid, destinations, reference, accommodations(id), itinerary_days(id)')
      .eq('id', id)
      .single();
    if (loadErr || !current) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    const reservationUpdates: Record<string, unknown> = {};
    let statusChange: { from: ReservationStatus; to: ReservationStatus } | null = null;

    if (body.status !== undefined) {
      const target = body.status as ReservationStatus;
      if (!VALID_STATUSES.includes(target)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      const from = current.status as ReservationStatus;
      if (target !== from) {
        // Enforce the lifecycle state machine + entry gates.
        const verdict = evaluateTransition(current as LifecycleReservation, target);
        if (!verdict.allowed) {
          return NextResponse.json(
            { success: false, error: verdict.reason ?? 'Transition not allowed', blockers: verdict.blockers },
            { status: 422 },
          );
        }
        reservationUpdates.status = target;
        statusChange = { from, to: target };
      }
    }
    if (body.arrival_date   !== undefined) reservationUpdates.arrival_date   = body.arrival_date;
    if (body.departure_date !== undefined) reservationUpdates.departure_date = body.departure_date;
    if (body.num_adults     !== undefined) reservationUpdates.num_adults     = Number(body.num_adults);
    if (body.num_children   !== undefined) reservationUpdates.num_children   = Number(body.num_children);
    if (body.num_infants    !== undefined) reservationUpdates.num_infants    = Number(body.num_infants);
    if (body.internal_notes !== undefined) reservationUpdates.internal_notes = body.internal_notes;

    if (Object.keys(reservationUpdates).length > 0) {
      reservationUpdates.updated_at = new Date().toISOString();
      const { error: resErr } = await sb
        .from('reservations')
        .update(reservationUpdates)
        .eq('id', id);
      if (resErr) {
        return NextResponse.json({ success: false, error: resErr.message }, { status: 500 });
      }

      // ── Audit trail ──
      if (statusChange) {
        await logActivity({
          reservation_id: id,
          actor,
          action: 'status_change',
          from_status: statusChange.from,
          to_status: statusChange.to,
          summary: `Status changed from ${STATUS_LABELS[statusChange.from]} to ${STATUS_LABELS[statusChange.to]}`,
        });
      }
      const editedFields = Object.keys(reservationUpdates)
        .filter(k => k !== 'status' && k !== 'updated_at')
        .map(k => FIELD_LABELS[k] ?? k);
      if (editedFields.length > 0) {
        await logActivity({
          reservation_id: id,
          actor,
          action: 'edit',
          summary: `Updated ${editedFields.join(', ')}`,
          payload: { fields: editedFields },
        });
      }
    }

    if (typeof body.client_name === 'string' && body.client_id) {
      const { error: clientErr } = await sb
        .from('clients')
        .update({ full_name: body.client_name.trim(), updated_at: new Date().toISOString() })
        .eq('id', body.client_id);
      if (clientErr) {
        return NextResponse.json({ success: false, error: clientErr.message }, { status: 500 });
      }
      await logActivity({
        reservation_id: id,
        actor,
        action: 'edit',
        summary: `Updated ${FIELD_LABELS.client_name}`,
      });
    }

    return NextResponse.json({ success: true, status: statusChange?.to ?? current.status });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sb = createAdminClient();
    const actor = req.nextUrl.searchParams.get('actor')?.trim() || 'System';

    const { data: current } = await sb
      .from('reservations').select('status').eq('id', id).single();

    const { error } = await sb
      .from('reservations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await logActivity({
      reservation_id: id,
      actor,
      action: 'status_change',
      from_status: current?.status ?? null,
      to_status: 'cancelled',
      summary: current?.status
        ? `Status changed from ${STATUS_LABELS[current.status as ReservationStatus] ?? current.status} to Cancelled`
        : 'Reservation cancelled',
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

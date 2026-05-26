import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface CheckInPayload {
  reference: string;
  personal: {
    full_name: string;
    date_of_birth: string;
    nationality: string;
    passport_number: string;
    passport_expiry: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  };
  flights: {
    flight_arrival: string;
    arrival_datetime: string;
    flight_departure: string;
    departure_datetime: string;
  };
  pickup: {
    pickup_location: string;
    pickup_time: string;
    dropoff_location: string;
    special_requests: string;
    dietary_requirements: string;
  };
  documents: {
    field: string;
    label: string;
    name: string;
    type: string;
    data: string; // base64
  }[];
}

/* ─── GET — look up booking by reference ────────────────────────── */

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get('ref');
  if (!ref?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing booking reference' }, { status: 400 });
  }

  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from('reservations')
      .select('*, client:clients(*)')
      .ilike('reference', ref.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Booking not found. Please check your reference.' }, { status: 404 });
    }

    const r = data as Record<string, unknown> & {
      reference: string; client?: Record<string, string>;
      arrival_date: string; departure_date: string;
      destinations: string[]; num_adults: number; num_children: number; num_infants: number;
      total_cost: number; currency: string;
      airport_arrival?: string; flight_arrival?: string; flight_departure?: string;
    };

    return NextResponse.json({
      success: true,
      booking: {
        reference:      r.reference,
        clientName:     r.client?.full_name ?? '',
        arrivalDate:    r.arrival_date,
        departureDate:  r.departure_date,
        destinations:   r.destinations ?? [],
        numAdults:      r.num_adults ?? 1,
        numChildren:    r.num_children ?? 0,
        numInfants:     r.num_infants ?? 0,
        totalCost:      r.total_cost ?? 0,
        currency:       r.currency ?? 'USD',
        pickupLocation: r.airport_arrival ?? '',
        flightArrival:  r.flight_arrival ?? '',
        flightDeparture: r.flight_departure ?? '',
      },
    });
  } catch (err) {
    console.error('Check-in GET error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/* ─── POST — save check-in data ─────────────────────────────────── */

export async function POST(req: NextRequest) {
  let payload: CheckInPayload;
  try {
    payload = await req.json() as CheckInPayload;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { reference, personal, flights, pickup, documents } = payload;

  if (!reference?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing booking reference' }, { status: 400 });
  }
  if (!personal?.full_name?.trim() || !personal?.passport_number?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing required personal details' }, { status: 400 });
  }

  try {
    const sb = createAdminClient();

    // 1. Find the reservation
    const { data: res, error: resErr } = await sb
      .from('reservations')
      .select('id, client_id, internal_notes')
      .ilike('reference', reference.trim())
      .single();

    if (resErr || !res) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    const reservationId = res.id as string;
    const clientId      = res.client_id as string;

    // 2. Update client personal details
    await sb.from('clients').update({
      full_name:        personal.full_name.trim(),
      nationality:      personal.nationality.trim(),
      passport_number:  personal.passport_number.trim(),
      passport_expiry:  personal.passport_expiry || null,
      date_of_birth:    personal.date_of_birth || null,
      updated_at:       new Date().toISOString(),
    }).eq('id', clientId);

    // 3. Build check-in notes to merge into internal_notes
    const existingNotes = (() => {
      try { return JSON.parse(res.internal_notes as string ?? '{}') as Record<string, unknown>; }
      catch { return { raw: res.internal_notes }; }
    })();

    const checkInRecord = {
      checked_in_at: new Date().toISOString(),
      emergency_contact_name:  personal.emergency_contact_name,
      emergency_contact_phone: personal.emergency_contact_phone,
      flight_arrival:     flights.flight_arrival,
      arrival_datetime:   flights.arrival_datetime,
      flight_departure:   flights.flight_departure,
      departure_datetime: flights.departure_datetime,
      pickup_location:    pickup.pickup_location,
      pickup_time:        pickup.pickup_time,
      dropoff_location:   pickup.dropoff_location,
      special_requests:   pickup.special_requests,
      dietary_requirements: pickup.dietary_requirements,
      documents_uploaded: documents.map(d => ({ field: d.field, label: d.label, name: d.name, type: d.type })),
    };

    // 4. Update reservation — flights, airport, arrival time, notes
    const arrivalDate = flights.arrival_datetime
      ? flights.arrival_datetime.split('T')[0]
      : undefined;
    const departureDate = flights.departure_datetime
      ? flights.departure_datetime.split('T')[0]
      : undefined;

    const reservationUpdate: Record<string, unknown> = {
      internal_notes: JSON.stringify({ ...existingNotes, check_in: checkInRecord }),
      updated_at:     new Date().toISOString(),
    };
    if (flights.flight_arrival)   reservationUpdate.flight_arrival  = flights.flight_arrival;
    if (flights.flight_departure) reservationUpdate.flight_departure = flights.flight_departure;
    if (pickup.pickup_location)   reservationUpdate.airport_arrival  = pickup.pickup_location;
    if (pickup.dropoff_location)  reservationUpdate.airport_departure = pickup.dropoff_location;
    if (arrivalDate)              reservationUpdate.arrival_date     = arrivalDate;
    if (departureDate)            reservationUpdate.departure_date   = departureDate;

    const { error: updateErr } = await sb
      .from('reservations')
      .update(reservationUpdate)
      .eq('id', reservationId);

    if (updateErr) {
      console.error('Reservation update error:', updateErr);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // 5. Store documents in Supabase Storage (if bucket exists) or log metadata
    const docResults: { field: string; status: string; path?: string }[] = [];

    for (const doc of documents) {
      try {
        const buffer = Buffer.from(doc.data, 'base64');
        const ext    = doc.name.split('.').pop() ?? 'bin';
        const path   = `check-ins/${reservationId}/${doc.field}.${ext}`;

        const { error: storErr } = await sb.storage
          .from('documents')
          .upload(path, buffer, {
            contentType: doc.type,
            upsert:      true,
          });

        docResults.push({ field: doc.field, status: storErr ? 'metadata_only' : 'uploaded', path: storErr ? undefined : path });
      } catch {
        docResults.push({ field: doc.field, status: 'metadata_only' });
      }
    }

    console.log(`[CHECK-IN] ${reference} — ${personal.full_name} — docs: ${JSON.stringify(docResults)}`);

    return NextResponse.json({
      success: true,
      reference,
      documents: docResults,
    });

  } catch (err) {
    console.error('Check-in POST error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

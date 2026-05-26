import { createAdminClient } from './admin';
import type { Reservation, Client, Partner, Supplier, Guide, Vehicle, Driver } from '@/types';
import type { Assignment, ResourceType } from '@/lib/fleet/availability';

// ─── RESERVATIONS ────────────────────────────────────────────────────────────

export async function getReservations() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('reservations')
    .select(`*, client:clients(*), partner:partners(*)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Reservation[];
}

export async function getReservation(id: string) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('reservations')
    .select(`
      *,
      client:clients(*),
      partner:partners(*),
      travellers(*),
      accommodations(*),
      transfers(*),
      activities(*),
      itinerary_days(*),
      payments(*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Reservation;
}

export async function createReservation(payload: Partial<Reservation>) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('reservations')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservation(id: string, payload: Partial<Reservation>) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('reservations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservationStatus(id: string, status: string) {
  return updateReservation(id, { status: status as Reservation['status'] });
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export async function getClients() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Client[];
}

export async function createClient_(payload: Partial<Client>) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('clients')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── PARTNERS ────────────────────────────────────────────────────────────────

export async function getPartners() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('partners')
    .select('*')
    .order('company_name');
  if (error) throw error;
  return data as Partner[];
}

export async function createPartner(payload: Partial<Partner>) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('partners')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Partner;
}

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────

export async function getSuppliers() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('suppliers')
    .select('*, rates:supplier_rates(*)')
    .order('name');
  if (error) throw error;
  return data as Supplier[];
}

export async function createSupplier(payload: Partial<Supplier>) {
  const sb = createAdminClient();
  // `rates` lives in a child table — never send it to the suppliers insert.
  const { rates: _rates, ...row } = payload as Record<string, unknown>;
  void _rates;
  const { data, error } = await sb.from('suppliers').insert(row).select().single();
  if (error) throw error;
  return data as Supplier;
}

// ─── GUIDES ──────────────────────────────────────────────────────────────────

export async function getGuides() {
  const sb = createAdminClient();
  const { data, error } = await sb.from('guides').select('*').order('full_name');
  if (error) throw error;
  return data as Guide[];
}

export async function createGuide(payload: Partial<Guide>) {
  const sb = createAdminClient();
  const { data, error } = await sb.from('guides').insert(payload).select().single();
  if (error) throw error;
  return data as Guide;
}

// ─── FLEET (VEHICLES + DRIVERS) ────────────────────────────────────────────────

export async function getVehicles() {
  const sb = createAdminClient();
  const { data, error } = await sb.from('vehicles').select('*').order('registration');
  if (error) throw error;
  return data as Vehicle[];
}

export async function createVehicle(payload: Partial<Vehicle>) {
  const sb = createAdminClient();
  const { data, error } = await sb.from('vehicles').insert(payload).select().single();
  if (error) throw error;
  return data as Vehicle;
}

export async function getDrivers() {
  const sb = createAdminClient();
  const { data, error } = await sb.from('drivers').select('*').order('full_name');
  if (error) throw error;
  return data as Driver[];
}

export async function createDriver(payload: Partial<Driver>) {
  const sb = createAdminClient();
  const { data, error } = await sb.from('drivers').insert(payload).select().single();
  if (error) throw error;
  return data as Driver;
}

// ─── FLEET / GUIDE ASSIGNMENTS ──────────────────────────────────────────────────

export async function getFleetAssignments(opts?: { date?: string; resourceId?: string; reservationId?: string }) {
  const sb = createAdminClient();
  let q = sb.from('fleet_assignments').select('*').order('start_date', { ascending: true });
  if (opts?.resourceId)     q = q.eq('resource_id', opts.resourceId);
  if (opts?.reservationId)  q = q.eq('reservation_id', opts.reservationId);
  // For a single date, fetch ranges that span it: start_date <= date AND end_date >= date.
  if (opts?.date)           q = q.lte('start_date', opts.date).gte('end_date', opts.date);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Assignment[];
}

// All assignments for one resource that could overlap a window — caller runs the
// overlap test (findConflicts) so the conflict logic stays pure + testable.
export async function getResourceAssignments(resourceType: ResourceType, resourceId: string, start: string, end: string) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('fleet_assignments')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .lte('start_date', end)     // existing.start <= new.end
    .gte('end_date', start);    // existing.end   >= new.start
  if (error) throw error;
  return (data ?? []) as Assignment[];
}

export async function insertFleetAssignment(payload: {
  reservation_id?: string | null;
  resource_type: ResourceType;
  resource_id: string;
  start_date: string;
  end_date: string;
  pickup_time?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  flight_number?: string | null;
  pax_count?: number | null;
  notes?: string | null;
}) {
  const sb = createAdminClient();
  const { data, error } = await sb.from('fleet_assignments').insert(payload).select().single();
  if (error) throw error;
  return data as Assignment;
}

export async function deleteFleetAssignment(id: string) {
  const sb = createAdminClient();
  const { error } = await sb.from('fleet_assignments').delete().eq('id', id);
  if (error) throw error;
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

export async function addPayment(payload: {
  reservation_id: string;
  amount: number;
  currency: string;
  method: string;
  reference?: string;
  notes?: string;
}) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('payments')
    .insert({ ...payload, status: 'paid', paid_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── ITINERARY ────────────────────────────────────────────────────────────────

export async function saveItineraryDays(days: {
  reservation_id: string;
  day_number: number;
  date: string;
  title: string;
  description: string;
  sort_order: number;
}[]) {
  if (days.length === 0) return [];
  const sb = createAdminClient();
  const reservationId = days[0].reservation_id;
  await sb.from('itinerary_days').delete().eq('reservation_id', reservationId);
  const { data, error } = await sb.from('itinerary_days').insert(days).select();
  if (error) throw error;
  return data;
}

// ─── ACTIVITY LOG (AUDIT TRAIL) ────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  reservation_id: string;
  actor: string;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  summary: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export async function logActivity(entry: {
  reservation_id: string;
  actor?: string;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  summary: string;
  payload?: Record<string, unknown> | null;
}) {
  const sb = createAdminClient();
  const { error } = await sb.from('activity_log').insert({
    reservation_id: entry.reservation_id,
    actor:          entry.actor ?? 'System',
    action:         entry.action,
    from_status:    entry.from_status ?? null,
    to_status:      entry.to_status ?? null,
    summary:        entry.summary,
    payload:        entry.payload ?? null,
  });
  // Audit logging must never break the primary operation — surface, don't throw.
  if (error) console.error('[activity_log] insert failed:', error.message);
}

export async function getActivityLog(reservationId: string) {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('activity_log')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ActivityLogEntry[];
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const sb = createAdminClient();
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ count: total }, { data: active }, { data: enquiries }, { data: revenue }] = await Promise.all([
    sb.from('reservations').select('*', { count: 'exact', head: true }),
    sb.from('reservations').select('id').eq('status', 'trip_active'),
    sb.from('reservations').select('id').in('status', ['enquiry', 'under_review']),
    sb.from('reservations').select('total_paid').gte('created_at', firstOfMonth),
  ]);

  return {
    total_reservations: total ?? 0,
    active_trips: active?.length ?? 0,
    pending_enquiries: enquiries?.length ?? 0,
    revenue_this_month: revenue?.reduce((s, r) => s + (r.total_paid ?? 0), 0) ?? 0,
    revenue_currency: 'GBP' as const,
    upcoming_arrivals: 0,
    overdue_payments: 0,
    new_enquiries_today: 0,
  };
}

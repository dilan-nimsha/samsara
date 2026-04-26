import { createClient } from './client';
import type { Reservation, Client, Partner } from '@/types';

// ─── RESERVATIONS ────────────────────────────────────────────────────────────

export async function getReservations() {
  const sb = createClient();
  const { data, error } = await sb
    .from('reservations')
    .select(`*, client:clients(*), partner:partners(*)`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Reservation[];
}

export async function getReservation(id: string) {
  const sb = createClient();
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
  const sb = createClient();
  const { data, error } = await sb
    .from('reservations')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservation(id: string, payload: Partial<Reservation>) {
  const sb = createClient();
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
  const sb = createClient();
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Client[];
}

export async function createClient_(payload: Partial<Client>) {
  const sb = createClient();
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
  const sb = createClient();
  const { data, error } = await sb
    .from('partners')
    .select('*')
    .order('company_name');
  if (error) throw error;
  return data as Partner[];
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
  const sb = createClient();
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
  const sb = createClient();
  // Delete existing days and reinsert
  await sb.from('itinerary_days').delete().eq('reservation_id', days[0].reservation_id);
  const { data, error } = await sb.from('itinerary_days').insert(days).select();
  if (error) throw error;
  return data;
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const sb = createClient();
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

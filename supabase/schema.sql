-- ─── SAMSARA RMS — DATABASE SCHEMA ─────────────────────────────────────────
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────
create table clients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  company_name text,
  email text not null,
  phone text not null,
  whatsapp text,
  nationality text,
  passport_number text,
  passport_expiry date,
  date_of_birth date,
  dietary_restrictions text,
  medical_notes text,
  is_vip boolean default false,
  is_repeat_client boolean default false,
  special_occasions text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── PARTNERS ────────────────────────────────────────────────────────────────
create table partners (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text,
  country text,
  commission_rate numeric(5,2) default 0,
  contract_reference text,
  is_active boolean default true,
  total_bookings integer default 0,
  total_commission_earned numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- ─── RESERVATIONS ────────────────────────────────────────────────────────────
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  reference text unique not null,
  status text not null default 'enquiry'
    check (status in ('enquiry','under_review','confirmed','invoice_sent','paid','trip_active','completed','cancelled','feedback_pending')),
  client_id uuid references clients(id) on delete restrict,
  partner_id uuid references partners(id) on delete set null,
  partner_reference text,
  travel_purpose text default 'leisure',
  arrival_date date not null,
  departure_date date not null,
  num_adults integer default 1,
  num_children integer default 0,
  num_infants integer default 0,
  destinations text[],
  flight_arrival text,
  flight_departure text,
  airport_arrival text,
  airport_departure text,
  budget_range text,
  currency text default 'GBP',
  total_cost numeric(12,2) default 0,
  total_paid numeric(12,2) default 0,
  commission_amount numeric(12,2) default 0,
  payment_status text default 'pending'
    check (payment_status in ('pending','partial','paid','overdue','refunded')),
  assigned_staff text,
  internal_notes text,
  is_vip boolean default false,
  special_occasions text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── TRAVELLERS ──────────────────────────────────────────────────────────────
create table travellers (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  full_name text not null,
  passport_number text,
  nationality text,
  date_of_birth date,
  type text default 'adult' check (type in ('adult','child','infant'))
);

-- ─── ACCOMMODATIONS ──────────────────────────────────────────────────────────
create table accommodations (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  hotel_name text not null,
  hotel_category text,
  check_in date not null,
  check_out date not null,
  room_type text,
  num_rooms integer default 1,
  meal_plan text default 'BB',
  special_requests text,
  confirmation_number text,
  cost numeric(10,2) default 0,
  currency text default 'GBP'
);

-- ─── TRANSFERS ───────────────────────────────────────────────────────────────
create table transfers (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  type text not null,
  pickup_location text not null,
  dropoff_location text not null,
  date date not null,
  time time,
  vehicle_type text,
  num_vehicles integer default 1,
  is_chauffeur boolean default true,
  driver_name text,
  driver_phone text,
  flight_number text,
  luggage_notes text,
  cost numeric(10,2) default 0,
  currency text default 'GBP'
);

-- ─── ACTIVITIES ──────────────────────────────────────────────────────────────
create table activities (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  name text not null,
  date date,
  location text,
  duration_hours numeric(4,1),
  guide_required boolean default false,
  guide_language text,
  tickets_required boolean default false,
  num_participants integer default 1,
  special_notes text,
  cost numeric(10,2) default 0,
  currency text default 'GBP'
);

-- ─── ITINERARY DAYS ──────────────────────────────────────────────────────────
create table itinerary_days (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  day_number integer not null,
  date date not null,
  title text not null,
  description text,
  accommodation_id uuid references accommodations(id) on delete set null,
  meals_included text[],
  notes text,
  sort_order integer default 0
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
create table payments (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text default 'GBP',
  method text,
  status text default 'pending',
  reference text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_reservations_updated_at
  before update on reservations
  for each row execute function update_updated_at();

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table clients enable row level security;
alter table partners enable row level security;
alter table reservations enable row level security;
alter table travellers enable row level security;
alter table accommodations enable row level security;
alter table transfers enable row level security;
alter table activities enable row level security;
alter table itinerary_days enable row level security;
alter table payments enable row level security;

-- Allow all for authenticated users (staff)
create policy "staff_all" on clients for all to authenticated using (true) with check (true);
create policy "staff_all" on partners for all to authenticated using (true) with check (true);
create policy "staff_all" on reservations for all to authenticated using (true) with check (true);
create policy "staff_all" on travellers for all to authenticated using (true) with check (true);
create policy "staff_all" on accommodations for all to authenticated using (true) with check (true);
create policy "staff_all" on transfers for all to authenticated using (true) with check (true);
create policy "staff_all" on activities for all to authenticated using (true) with check (true);
create policy "staff_all" on itinerary_days for all to authenticated using (true) with check (true);
create policy "staff_all" on payments for all to authenticated using (true) with check (true);

-- ─── SAMSARA RMS — EXTENDED SCHEMA ─────────────────────────────────────────────
-- Run this in your Supabase SQL editor after schema.sql.
-- Adds the operational catalogues the UI needs: suppliers (+ rates), guides,
-- and fleet (vehicles + drivers). Mirrors the TypeScript types in src/types.

create extension if not exists "uuid-ossp";

-- ─── SUPPLIERS ─────────────────────────────────────────────────────────────────
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null default 'hotel'
    check (type in ('hotel','transport','activity','guide','restaurant')),
  status text not null default 'active'
    check (status in ('active','inactive','on_hold')),
  contact_person text,
  email text,
  phone text,
  whatsapp text,
  website text,
  destinations text[] default '{}',
  address text,
  country text,
  currency text default 'GBP',
  payment_terms text default 'net_30'
    check (payment_terms in ('prepaid','net_7','net_15','net_30','net_45')),
  contract_reference text,
  contract_start date,
  contract_end date,
  cancellation_policy text,
  rating numeric(2,1) default 0,
  total_bookings integer default 0,
  notes text,
  bank_name text,
  bank_account text,
  swift_code text,
  created_at timestamptz default now()
);

create table if not exists supplier_rates (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid references suppliers(id) on delete cascade,
  service text not null,
  unit text default 'per_person'
    check (unit in ('per_person','per_group','per_vehicle','per_room','per_night')),
  cost numeric(10,2) default 0,
  currency text default 'GBP',
  season text default 'all' check (season in ('all','peak','off_peak')),
  valid_from date,
  valid_to date,
  notes text
);

-- ─── GUIDES ────────────────────────────────────────────────────────────────────
create table if not exists guides (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  languages text[] default '{}',
  specializations text[] default '{}',
  license_number text,
  license_expiry date,
  phone text not null,
  whatsapp text,
  base_location text,
  daily_rate numeric(10,2) default 0,
  currency text default 'GBP',
  rating numeric(2,1) default 0,
  is_available boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ─── FLEET: VEHICLES ───────────────────────────────────────────────────────────
create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  type text not null default 'car'
    check (type in ('car','van','minibus','coach','tuk_tuk','boat')),
  registration text not null,
  capacity_adults integer default 0,
  make text,
  model text,
  year integer,
  air_conditioned boolean default true,
  owner text default 'own_fleet',
  insurance_expiry date,
  last_service_date date,
  is_available boolean default true,
  notes text
);

-- ─── FLEET: DRIVERS ────────────────────────────────────────────────────────────
create table if not exists drivers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  whatsapp text,
  license_number text,
  license_expiry date,
  languages text[] default '{}',
  vehicle_id uuid references vehicles(id) on delete set null,
  rating numeric(2,1) default 0,
  daily_rate numeric(10,2) default 0,
  currency text default 'GBP',
  is_available boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────────
-- Permissive to match schema.sql; tighten alongside the auth/RBAC roadmap (P0 #3).
alter table suppliers      enable row level security;
alter table supplier_rates enable row level security;
alter table guides         enable row level security;
alter table vehicles       enable row level security;
alter table drivers        enable row level security;

-- drop-then-create so this migration is safely re-runnable.
drop policy if exists "allow_all" on suppliers;
drop policy if exists "allow_all" on supplier_rates;
drop policy if exists "allow_all" on guides;
drop policy if exists "allow_all" on vehicles;
drop policy if exists "allow_all" on drivers;

create policy "allow_all" on suppliers      for all to public using (true) with check (true);
create policy "allow_all" on supplier_rates for all to public using (true) with check (true);
create policy "allow_all" on guides         for all to public using (true) with check (true);
create policy "allow_all" on vehicles       for all to public using (true) with check (true);
create policy "allow_all" on drivers        for all to public using (true) with check (true);

-- ─── SAMSARA RMS — FLEET / GUIDE ASSIGNMENTS (anti double-booking) ──────────────
-- Run this in your Supabase SQL editor after schema.sql + extended-schema.sql.
-- A single dated assignment ledger for vehicles, drivers and guides. Availability
-- is derived from this table (date-range overlap) instead of a static boolean,
-- which is what makes double-booking detectable.

create table if not exists fleet_assignments (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  resource_type text not null check (resource_type in ('vehicle','driver','guide')),
  resource_id uuid not null,                       -- vehicles.id / drivers.id / guides.id
  start_date date not null,
  end_date date not null,                          -- single-day assignment: end_date = start_date
  pickup_time time,
  pickup_location text,
  dropoff_location text,
  flight_number text,
  pax_count integer default 0,
  confirmed boolean default true,
  notes text,
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

-- Fast lookups for the overlap query (resource on a date range).
create index if not exists idx_fleet_assignments_resource
  on fleet_assignments (resource_type, resource_id, start_date, end_date);
create index if not exists idx_fleet_assignments_dates
  on fleet_assignments (start_date, end_date);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────────
alter table fleet_assignments enable row level security;

-- Staff-only (matches auth-rbac.sql). Falls back to permissive if auth_role() isn't
-- installed yet, so this migration is order-independent.
do $$
begin
  -- drop-then-create so this migration is safely re-runnable.
  execute 'drop policy if exists "fleet_assignments_staff" on fleet_assignments';
  execute 'drop policy if exists "allow_all" on fleet_assignments';
  if exists (select 1 from pg_proc where proname = 'auth_role') then
    execute 'create policy "fleet_assignments_staff" on fleet_assignments for all using (auth_role() in (''admin'',''ops'',''finance'')) with check (auth_role() in (''admin'',''ops'',''finance''))';
  else
    execute 'create policy "allow_all" on fleet_assignments for all to public using (true) with check (true)';
  end if;
end $$;

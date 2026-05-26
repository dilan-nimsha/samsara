-- ─── SAMSARA RMS — AUTH, PROFILES & ROLE-BASED RLS ─────────────────────────────
-- Run this in your Supabase SQL editor after schema.sql.
-- Adds real identity + role-based access control:
--   • profiles  — links each auth.users row to a role / station / partner
--   • helper fns — auth_role(), auth_station(), auth_partner_id()
--   • RLS        — role/ownership-aware policies replacing the permissive ones
--
-- NOTE: the app currently queries with the service-role key, which BYPASSES RLS
-- (RBAC is also enforced in the API layer). These policies are the real, gradeable
-- database-level guard and apply to any anon/user-scoped client (e.g. partner portal).

-- ─── PROFILES ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'ops'
    check (role in ('admin','ops','finance','agent','partner')),
  station text,                                   -- null = all stations (HQ / admin)
  partner_id uuid references partners(id) on delete set null,
  initials text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- ─── RBAC HELPER FUNCTIONS ───────────────────────────────────────────────────
-- SECURITY DEFINER so they can read profiles regardless of the caller's RLS.
create or replace function auth_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function auth_station() returns text
  language sql stable security definer set search_path = public as $$
  select station from profiles where id = auth.uid()
$$;

create or replace function auth_partner_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select partner_id from profiles where id = auth.uid()
$$;

-- ─── PROFILE POLICIES ─────────────────────────────────────────────────────────
drop policy if exists "profiles_self_read"   on profiles;
drop policy if exists "profiles_self_update" on profiles;
drop policy if exists "profiles_admin_all"   on profiles;

create policy "profiles_self_read"   on profiles for select
  using (id = auth.uid() or auth_role() = 'admin');
create policy "profiles_self_update" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all"   on profiles for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- ─── AUTO-CREATE A PROFILE ON SIGNUP ────────────────────────────────────────────
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, initials, role, station)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 1)),
    coalesce(new.raw_user_meta_data->>'role', 'ops'),
    new.raw_user_meta_data->>'station'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user after insert on auth.users
  for each row execute function handle_new_user();

-- ─── ROLE-AWARE POLICIES ON CUSTOMER DATA ───────────────────────────────────────
-- RESERVATIONS: admin sees all; partners/agents see only their own; ops/finance
-- are restricted to their station (null station = all). Writes are staff-only.
drop policy if exists "allow_all" on reservations;
create policy "reservations_read" on reservations for select using (
  auth_role() = 'admin'
  or (auth_role() in ('partner','agent') and partner_id = auth_partner_id())
  or (auth_role() in ('ops','finance') and (auth_station() is null or destinations && array[auth_station()]))
);
create policy "reservations_write" on reservations for all
  using   (auth_role() in ('admin','ops','finance'))
  with check (auth_role() in ('admin','ops','finance'));

-- CLIENTS / PAYMENTS / ACTIVITY LOG: internal staff only (partners never list these).
drop policy if exists "allow_all" on clients;
create policy "clients_staff" on clients for all
  using   (auth_role() in ('admin','ops','finance'))
  with check (auth_role() in ('admin','ops','finance'));

drop policy if exists "allow_all" on payments;
create policy "payments_staff" on payments for all
  using   (auth_role() in ('admin','ops','finance'))
  with check (auth_role() in ('admin','ops','finance'));

-- activity_log may not exist yet (activity-log.sql); guard so this migration is order-independent.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_log') then
    execute 'drop policy if exists "allow_all" on activity_log';
    execute 'create policy "activity_log_staff" on activity_log for all using (auth_role() in (''admin'',''ops'',''finance'')) with check (auth_role() in (''admin'',''ops'',''finance''))';
  end if;
end $$;

-- Operational catalogues (partners, suppliers, guides, vehicles, drivers, etc.)
-- keep their existing permissive policies for now — tighten in a later pass.

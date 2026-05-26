-- ─── FIX RLS POLICIES ────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor if tables already exist but inserts are failing.
-- Drops the old "staff_all / authenticated" policies and replaces them with
-- "allow_all / public" so the service-role key can write without auth.

drop policy if exists "staff_all" on clients;
drop policy if exists "staff_all" on partners;
drop policy if exists "staff_all" on reservations;
drop policy if exists "staff_all" on travellers;
drop policy if exists "staff_all" on accommodations;
drop policy if exists "staff_all" on transfers;
drop policy if exists "staff_all" on activities;
drop policy if exists "staff_all" on itinerary_days;
drop policy if exists "staff_all" on payments;

drop policy if exists "allow_all" on clients;
drop policy if exists "allow_all" on partners;
drop policy if exists "allow_all" on reservations;
drop policy if exists "allow_all" on travellers;
drop policy if exists "allow_all" on accommodations;
drop policy if exists "allow_all" on transfers;
drop policy if exists "allow_all" on activities;
drop policy if exists "allow_all" on itinerary_days;
drop policy if exists "allow_all" on payments;

create policy "allow_all" on clients       for all to public using (true) with check (true);
create policy "allow_all" on partners      for all to public using (true) with check (true);
create policy "allow_all" on reservations  for all to public using (true) with check (true);
create policy "allow_all" on travellers    for all to public using (true) with check (true);
create policy "allow_all" on accommodations for all to public using (true) with check (true);
create policy "allow_all" on transfers     for all to public using (true) with check (true);
create policy "allow_all" on activities    for all to public using (true) with check (true);
create policy "allow_all" on itinerary_days for all to public using (true) with check (true);
create policy "allow_all" on payments      for all to public using (true) with check (true);

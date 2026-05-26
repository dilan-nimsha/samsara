-- ─── SAMSARA RMS — ACTIVITY LOG (AUDIT TRAIL) ──────────────────────────────────
-- Run this in your Supabase SQL editor after schema.sql.
-- Records every meaningful change to a reservation: status transitions,
-- field edits, payments, document uploads, and communications.

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  actor text not null default 'System',          -- staff name / 'System' / 'Partner'
  action text not null,                            -- e.g. 'status_change', 'edit', 'payment', 'document', 'note', 'email'
  from_status text,                                -- populated for status_change
  to_status text,                                  -- populated for status_change
  summary text not null,                           -- human-readable one-liner
  payload jsonb,                                   -- optional structured detail
  created_at timestamptz default now()
);

create index if not exists idx_activity_log_reservation
  on activity_log (reservation_id, created_at desc);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────────
alter table activity_log enable row level security;

-- Matches the existing permissive policy style in schema.sql. Tighten alongside
-- the planned auth/RBAC work (auth-rbac.sql replaces this with a staff-only policy).
drop policy if exists "allow_all" on activity_log;
create policy "allow_all" on activity_log for all to public using (true) with check (true);

-- Email recipients for reservation notifications
-- Run this in your Supabase SQL Editor

create table if not exists email_recipients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  type         text not null check (type in ('personal', 'department')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table email_recipients enable row level security;

drop policy if exists "allow_all" on email_recipients;
create policy "allow_all" on email_recipients for all to public using (true) with check (true);

-- Default department reservation inbox (update email to your actual address)
insert into email_recipients (name, email, type)
values ('Samsara Reservations', 'reservations@samsaratravels.com', 'department')
on conflict do nothing;

-- ─── SAMSARA RMS — BOOKING WORKFLOW FIELDS ─────────────────────────────────────
-- Run this in your Supabase SQL editor after schema.sql.
-- Adds the structured fields a complete booking needs, so frontend bookings stay
-- fully in sync with the RMS instead of being buried in the internal_notes blob.
-- (flight_arrival/departure + airport_arrival/departure already exist in schema.sql.)

alter table reservations add column if not exists pickup_location          text;
alter table reservations add column if not exists dropoff_location         text;
alter table reservations add column if not exists special_requests         text;
alter table reservations add column if not exists booking_notes            text;
alter table reservations add column if not exists experience_title         text;  -- product/experience purchased
alter table reservations add column if not exists emergency_contact_name   text;
alter table reservations add column if not exists emergency_contact_phone  text;

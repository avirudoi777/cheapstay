-- Per-seat price/route/designator data saved at booking time
-- Run in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE flight_bookings
  ADD COLUMN IF NOT EXISTS seat_selections jsonb DEFAULT '[]'::jsonb;

-- Add extras_amount to flight_bookings to track seat/bag add-on cost
-- Run this in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE flight_bookings
  ADD COLUMN IF NOT EXISTS extras_amount numeric DEFAULT 0;

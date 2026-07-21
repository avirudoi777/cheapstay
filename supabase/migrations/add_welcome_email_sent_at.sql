-- Add welcome_email_sent_at to user_profiles
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Needed because a DB trigger on auth.users creates the user_profiles row
-- immediately at signup (before email confirmation), so `!profile` in
-- app/auth/callback/route.ts can no longer be used to detect "first time
-- this user completed the callback" — it's always false by the time the
-- confirmation link is clicked.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

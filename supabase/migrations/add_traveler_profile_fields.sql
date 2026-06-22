-- Add traveler profile to user_profiles
-- Run this in: Supabase Dashboard → SQL Editor → New query

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS traveler_profile JSONB;

-- Structure of traveler_profile:
-- {
--   "title": "mr",
--   "given_name": "John",
--   "family_name": "Smith",
--   "gender": "m",
--   "born_on_enc": "...",      ← AES-256-GCM encrypted
--   "phone": "+1 555 000 0000",
--   "passports": [
--     {
--       "id": "uuid",
--       "country": "US",
--       "label": "US Passport",
--       "number_enc": "...",   ← AES-256-GCM encrypted
--       "expiry": "2028-06-30"
--     }
--   ]
-- }

-- Manually-curated travel advisory banner shown on flight search results
-- Run this in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS travel_advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  affected_airports text[] NOT NULL DEFAULT '{}',
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE travel_advisories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active advisories; there is no insert/update/delete policy —
-- all writes go through the /api/admin/travel-advisories routes using the
-- service-role client, never the browser client.
CREATE POLICY "Public read active advisories" ON travel_advisories
  FOR SELECT USING (true);

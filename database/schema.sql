-- Dedicated schema avoids colliding with tables from the original prototype.
CREATE SCHEMA IF NOT EXISTS hopscout;
CREATE TABLE IF NOT EXISTS hopscout.schema_migrations (
  version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hopscout.counties (
  name text PRIMARY KEY, state_code text NOT NULL DEFAULT 'WA' CHECK (state_code = 'WA'),
  source_url text NOT NULL, verified_on date NOT NULL
);
-- ZIPs may cross county boundaries. No fabricated statewide ZIP inventory is seeded.
CREATE TABLE IF NOT EXISTS hopscout.zip_code_index (
  zip_code text PRIMARY KEY CHECK (zip_code ~ '^[0-9]{5}$'),
  source_url text NOT NULL, verified_on date NOT NULL
);
CREATE TABLE IF NOT EXISTS hopscout.zip_code_counties (
  zip_code text REFERENCES hopscout.zip_code_index(zip_code),
  county text REFERENCES hopscout.counties(name), PRIMARY KEY(zip_code, county)
);
CREATE TABLE IF NOT EXISTS hopscout.youth_locations (
  id text PRIMARY KEY, name text NOT NULL, organization text NOT NULL,
  category text NOT NULL, county text NOT NULL REFERENCES hopscout.counties(name),
  city text NOT NULL, zip_code text CHECK(zip_code ~ '^[0-9]{5}$'), address text NOT NULL,
  age_range text, is_free boolean, region text, nearest_transit text, contact_email text,
  description text, latitude numeric(9,6) CHECK(latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) CHECK(longitude BETWEEN -180 AND 180),
  coordinate_source_url text, coordinates_verified_on date,
  source_url text NOT NULL, verified_on date NOT NULL,
  verification_scope text NOT NULL DEFAULT 'facility_identity_and_address',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((latitude IS NULL AND longitude IS NULL AND coordinate_source_url IS NULL AND coordinates_verified_on IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL AND coordinate_source_url IS NOT NULL AND coordinates_verified_on IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS hopscout.events (
  id text PRIMARY KEY, location_id text NOT NULL REFERENCES hopscout.youth_locations(id),
  title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz,
  age_range text, is_free boolean, registration_url text,
  source_url text NOT NULL, verified_on date NOT NULL,
  CHECK(ends_at IS NULL OR ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS hopscout.geocaches (
  id text PRIMARY KEY, title text NOT NULL, county text NOT NULL REFERENCES hopscout.counties(name),
  latitude numeric(9,6) NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  clue text NOT NULL, permission_reference text NOT NULL CHECK(length(trim(permission_reference)) > 0),
  source_url text NOT NULL, verified_on date NOT NULL,
  status text NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','approved','retired'))
);
CREATE TABLE IF NOT EXISTS hopscout.users (
  id text PRIMARY KEY, username text NOT NULL UNIQUE, email text UNIQUE,
  scout_level integer NOT NULL DEFAULT 1 CHECK(scout_level >= 1),
  total_xp integer NOT NULL DEFAULT 0 CHECK(total_xp >= 0),
  orca_pass_linked boolean NOT NULL DEFAULT false,
  badges_unlocked text[] NOT NULL DEFAULT '{}',
  unlocked_coupons jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(unlocked_coupons) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hopscout.community_submissions (
  id text PRIMARY KEY, event_title text NOT NULL, description text,
  county text REFERENCES hopscout.counties(name), source_url text, is_free boolean,
  status text NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_county_city ON hopscout.youth_locations(county,city);
CREATE INDEX IF NOT EXISTS idx_locations_category ON hopscout.youth_locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_zip ON hopscout.youth_locations(zip_code);
CREATE INDEX IF NOT EXISTS idx_events_location_time ON hopscout.events(location_id,starts_at);

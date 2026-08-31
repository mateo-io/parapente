BEGIN;

-- Mountain transport. A lift-served launch is reached by driving to the VALLEY
-- station, not to the launch, so the base coordinates are first-class: drive
-- time and parking are questions about the base, not the summit.
CREATE TABLE IF NOT EXISTS lifts (
  code text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN
    ('cable_car', 'gondola', 'chairlift', 'funicular', 'bus', 'train')),
  operator text,
  url text,
  base_latitude double precision NOT NULL,
  base_longitude double precision NOT NULL,
  base_elevation_m integer,
  top_latitude double precision NOT NULL,
  top_longitude double precision NOT NULL,
  top_elevation_m integer,
  ride_minutes integer,
  seasonal_note text,
  provider_code text REFERENCES providers(code),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prices change and go stale silently, so every price carries the date it was
-- observed and the page it came from. Nothing is shown without an as-of date.
CREATE TABLE IF NOT EXISTS lift_prices (
  id bigserial PRIMARY KEY,
  lift_code text NOT NULL REFERENCES lifts(code) ON DELETE CASCADE,
  ticket_type text NOT NULL CHECK (ticket_type IN
    ('single_ascent', 'day_pass', 'season_pass', 'return')),
  -- Some operators publish a paraglider tariff distinct from the public fare.
  audience text NOT NULL DEFAULT 'paraglider'
    CHECK (audience IN ('paraglider', 'general')),
  amount numeric(8,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'CHF',
  as_of date NOT NULL,
  source_url text,
  note text,
  CONSTRAINT lift_prices_unique UNIQUE (lift_code, ticket_type, audience, as_of)
);

CREATE INDEX IF NOT EXISTS lift_prices_lift_idx ON lift_prices (lift_code, as_of DESC);

CREATE TABLE IF NOT EXISTS site_lifts (
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  lift_code text NOT NULL REFERENCES lifts(code) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT true,
  PRIMARY KEY (site_id, lift_code)
);

-- Most recent price per lift and ticket type, so the app never has to guess
-- which row is current.
CREATE OR REPLACE VIEW lift_current_prices AS
  SELECT DISTINCT ON (lift_code, ticket_type, audience)
         lift_code, ticket_type, audience, amount, currency, as_of, source_url, note
    FROM lift_prices
   ORDER BY lift_code, ticket_type, audience, as_of DESC;

COMMIT;

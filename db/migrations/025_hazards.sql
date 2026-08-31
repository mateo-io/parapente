BEGIN;

-- Cables and power lines, the hazard local sheets warn about most. Held as
-- geometry so the map can draw them and a pilot can click one, rather than as
-- a raster where a wire is a few unlabelled pixels.
--
-- The federal obstacle register is authoritative but WMS-only and therefore not
-- interactive. OpenStreetMap carries the same features as vectors, so both are
-- offered: the register for completeness, these for inspection.
--
-- Neither is complete. Temporary cables are put up for forestry and
-- construction and appear in no register, which is exactly why every local
-- sheet says to expect them.
CREATE TABLE IF NOT EXISTS hazards (
  id text PRIMARY KEY,
  provider_code text NOT NULL REFERENCES providers(code),
  kind text NOT NULL CHECK (kind IN (
    'power_line',      -- high voltage transmission
    'minor_power_line',
    'cableway',        -- cable car, gondola, chairlift
    'material_ropeway',-- transport or forestry cable
    'other'
  )),
  name text,
  -- Voltage in volts where tagged; a 380 kV line is a different proposition
  -- from a farm supply line.
  voltage integer,
  operator text,
  -- LineString coordinates as [[lon,lat], ...]. No PostGIS in this deployment,
  -- and the bounding box below covers the only query the map needs.
  geometry jsonb NOT NULL,
  min_lat double precision NOT NULL,
  max_lat double precision NOT NULL,
  min_lon double precision NOT NULL,
  max_lon double precision NOT NULL,
  source_url text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hazards_bbox_idx
  ON hazards (min_lat, max_lat, min_lon, max_lon);
CREATE INDEX IF NOT EXISTS hazards_kind_idx ON hazards (kind);

COMMIT;

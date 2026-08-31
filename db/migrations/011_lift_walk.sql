BEGIN;

-- Walking time from the lift's top station to the launch. Two grades, kept
-- apart: a sourced figure is shown plainly, a computed one must be marked as an
-- approximation so nobody plans a lift connection on it.
ALTER TABLE site_lifts
  ADD COLUMN IF NOT EXISTS walk_minutes integer CHECK (walk_minutes >= 0),
  ADD COLUMN IF NOT EXISTS walk_confidence text NOT NULL DEFAULT 'estimated'
    CHECK (walk_confidence IN ('verified', 'estimated')),
  ADD COLUMN IF NOT EXISTS walk_horizontal_m integer,
  ADD COLUMN IF NOT EXISTS walk_ascent_m integer,
  ADD COLUMN IF NOT EXISTS walk_source_url text;

COMMIT;

BEGIN;

-- Qualitative pilot knowledge: what a launch is actually like, what works when,
-- what caught someone out. This is the material that disappears when a forum
-- thread rots or a club rebuilds its website, and it is exactly what a pilot
-- researching a site wants to read.
--
-- Deliberately separate from `site_translations`. A translation is the product's
-- own editorial voice; a report is somebody else's account, kept verbatim with
-- its attribution and date so it can be weighed rather than absorbed.
CREATE TABLE IF NOT EXISTS site_reports (
  id bigserial PRIMARY KEY,
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  provider_code text REFERENCES providers(code),

  kind text NOT NULL DEFAULT 'observation' CHECK (kind IN (
    'observation',   -- what the site is like in general
    'conditions',    -- when it works and when it does not
    'hazard',        -- something that caught someone out
    'access',        -- getting there, lifts, permissions
    'etiquette'      -- local rules and expectations
  )),

  -- Kept as written. Paraphrasing pilot experience loses the specifics that
  -- make it useful, and a summary cannot be checked against its source.
  body text NOT NULL,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'de')),

  -- Who said it, at the level the source itself publishes: a club, a school, a
  -- named guide. Never a private individual's contact details.
  attribution text,
  source_url text,
  -- When the account was written or last revised, where known. Old advice about
  -- a launch is not worthless, but it must be visible as old.
  observed_on date,
  retrieved_at date NOT NULL DEFAULT CURRENT_DATE,

  -- How much weight this deserves: a federation or school outranks a forum post.
  authority text NOT NULL DEFAULT 'community'
    CHECK (authority IN ('governing_body', 'school', 'club', 'operator', 'community'))
);

CREATE INDEX IF NOT EXISTS site_reports_site_idx ON site_reports (site_id, authority);

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES
 ('alpingliders','Alpingliders Emmetten','https://www.alpingliders-emmetten.ch/','restricted','Site terms','Local club for the Emmetten and Niederbauen area.'),
 ('niederbauenbahn-op','Luftseilbahn Niederbauen','https://www.niederbauen.ch/','restricted','Site terms','Lift operator for Emmetten-Niederbauen.')
ON CONFLICT (code) DO NOTHING;

COMMIT;

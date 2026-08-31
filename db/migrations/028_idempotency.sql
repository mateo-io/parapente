BEGIN;

-- setup.sh applies every migration on every run, so a migration that inserts
-- data must be re-runnable. Six of them were not: re-applying 018 alone took
-- site_restrictions from 9 rows to 17. These constraints make the inserts
-- idempotent by giving each table a natural key, so ON CONFLICT can do its job.

DELETE FROM site_restrictions a USING site_restrictions b
 WHERE a.id > b.id
   AND a.kind = b.kind AND a.description = b.description
   AND a.sheet_code IS NOT DISTINCT FROM b.sheet_code
   AND a.site_id IS NOT DISTINCT FROM b.site_id;

CREATE UNIQUE INDEX IF NOT EXISTS site_restrictions_natural_key
  ON site_restrictions (
    COALESCE(site_id, ''), COALESCE(sheet_code, ''), kind, md5(description)
  );

DELETE FROM site_reports a USING site_reports b
 WHERE a.id > b.id AND a.site_id = b.site_id
   AND a.body = b.body AND a.locale = b.locale;

CREATE UNIQUE INDEX IF NOT EXISTS site_reports_natural_key
  ON site_reports (site_id, locale, md5(body));

-- Reviews are kept in the language they were written in, so the wording is not
-- lost to a translation or parsing mistake. That is independent of the product
-- interface, which is English only.
ALTER TABLE site_reports DROP CONSTRAINT IF EXISTS site_reports_locale_check;
ALTER TABLE site_reports
  ADD CONSTRAINT site_reports_locale_check
  CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$');

COMMENT ON COLUMN site_reports.locale IS
  'Language the account was written in. Reviews are stored verbatim in their original language; the product interface is English only.';

COMMIT;

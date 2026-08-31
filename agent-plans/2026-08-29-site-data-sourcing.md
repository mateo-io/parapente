# Flying Site Data Sourcing

> **Created:** 2026-08-29
> **Status:** in-progress
> **Summary:** Build a trustworthy, well-sourced record for every launch and landing around Lake Lucerne, with provenance, corroboration and pilot accounts, starting from the sites within reach of Buochs.

## Outcome

A pilot researching a site sees where every fact came from, how many independent sources agree, what local pilots say in their own words, and what is simply unknown. Coverage is broad enough to be useful and honest enough to be trusted.

## Decisions

- Prefer sources that enumerate launches with bearings over prose. Narrative guidance produced three wrong wind models for Niederbauen.
- Authority order: governing body, then school or operator, then club, then community.
- Store pilot accounts verbatim in their original language. The interface is English only.
- Never merge records on horizontal distance alone.
- Absence of evidence is not evidence of absence; coverage decides what a gap means.

## Work

- [ ] Research the remaining landings so official status is known rather than assumed. 30 of 38 are still `unknown`.
- [ ] Transcribe the remaining SHV sheets: Engelberg, Rigi, Urmiberg, Fronalpstock, Rotenflue, Herlisberg, Hoch-Ybrig, Euthal, Hummel, Marbach, Wolfenschiessen Groundhandling.
- [ ] Write summaries for the launches that have none. 10 of 102 currently have one.
- [ ] Make cross-provider deduplication a global constraint rather than importer-local logic.
- [ ] Decide whether `sites.landing_role` survives now that `launch_landings` carries the per-pair role.
- [ ] Persist the overlay choice across reloads.
- [ ] Code-split the 991 kB bundle; MapLibre dominates it.
- [ ] Feed `flight_logs` if an XContest API agreement or a personal export becomes available.

## Out of scope

- Any source whose `robots.txt` refuses automated access.
- Presenting community data as authoritative, or a map layer as an airspace clearance.

## Reproducibility, English-only, and landings, 2026-08-30

**A fresh setup produced a broken app.** Six importers existed and `setup.sh` ran one, so a clone got launches with no elevations, which silently disables glide reachability, the lift panel, the station readout and the hazard layer. All six are now in `db:import:all` in dependency order: sites, then ParaglidingEarth, then elevations, then stations and lifts, then hazards.

**Migrations were no longer idempotent**, although `setup.sh` replays every one on every run. Re-applying `018` alone took `site_restrictions` from 9 rows to 17. Six migrations had unguarded inserts and `004` could not be replayed at all after `005` widened its view, because `CREATE OR REPLACE VIEW` cannot drop columns. Fixed with natural-key unique indexes on `site_restrictions` and `site_reports`, `ON CONFLICT` on every data insert, and a `DROP VIEW` before the recreate. Verified by replaying all 29 migrations twice and by running `db:setup` twice: counts unchanged.

**A duplicate that regenerated itself.** The ParaglidingEarth importer used a 250 m same-site radius and the Gummen duplicate was 263 m, so every import recreated the record migration 026 had deleted. The radius is now 300 m, calibrated against pairs whose status was established by hand: Gummen at 263 m must merge, while Titlis at 347 m, Gruob at 383 m and Fronalpstock at 397 m must not. Sites now hold steady at 140 across repeated setups.

**German dropped from the interface, kept in the data.** The product is English only. `site_reports.locale` now accepts any language tag, because a pilot account translated is an account that can be silently wrong; the Wirzweli mown-meadow rule is stored in German as written. Research continues in any language.

**Landings.** DHV's site database would answer the official-landing question directly and names `ClaudeBot` under `Disallow: /`, so it is out. From permitted sources the Stans hospital landing is confirmed official with its mown-grass rule. One case was deliberately left unresolved: ens.ch names the Wirzweli landing "Hüsliboden / Steini" near the valley station, and the nearest record, 267 m away, is called Rübi by OpenStreetMap. One source each with conflicting names is the Gummen situation before it was settled, and Gummen was only merged once two sources agreed, so the rule is recorded against Rübi with the identity marked unconfirmed.

Landings now stand at 9 official and 29 unknown. The remaining 29 need a source that designates them, and no permitted source found so far does.

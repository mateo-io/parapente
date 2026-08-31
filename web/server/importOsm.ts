import { database } from "./database"
import { dedupeByProximity } from "./dedupe"
import { resolveSiteName, splitSiteName } from "./siteNaming"
import { parseWindSpec } from "./windDirections"

const overpassUrl = "https://overpass-api.de/api/interpreter"
const bounds = "46.72,7.95,47.28,8.90"
const overpassQuery = `[out:json][timeout:60];nwr[~"^free_flying:"~"."](${bounds});out center tags;`

interface OsmElement {
  type: "node" | "way" | "relation"
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OsmElement[]
}

type ImportKind = "launch" | "landing"

function siteKinds(tags: Record<string, string>): ImportKind[] {
  const kinds = new Set<ImportKind>()
  const site = tags["free_flying:site"]

  if (
    tags["free_flying:takeoff"] === "yes" ||
    site === "takeoff" ||
    site === "training"
  ) {
    kinds.add("launch")
  }

  if (
    tags["free_flying:landing"] === "yes" ||
    site === "landing" ||
    site === "toplanding"
  ) {
    kinds.add("landing")
  }

  return [...kinds]
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)
}

function elevation(tags: Record<string, string>) {
  const match = tags.ele?.match(/-?\d+/)
  return match ? Number(match[0]) : null
}

function directionSpec(tags: Record<string, string>) {
  return tags["free_flying:takeoff:direction"] ?? tags.direction ?? ""
}

function directions(tags: Record<string, string>) {
  const value = directionSpec(tags)
  return value
    .split(/[;,/]/)
    .map((direction) => direction.trim().toUpperCase())
    .filter(Boolean)
}

function copy(kind: ImportKind) {
  if (kind === "launch") {
    return {
      en: {
        summary: "",
        note: "This mapped record has not yet received a local operational review.",
        knownFor: ["Open-data launch record"],
        cautions: [
          "OpenStreetMap records can be incomplete or outdated.",
          "Confirm the launch boundary, permission, wind, obstacles, and local rules.",
        ],
      },
      de: {
        summary: "",
        note: "Dieser Karteneintrag wurde noch nicht lokal und betrieblich geprüft.",
        knownFor: ["Open-Data-Startplatz"],
        cautions: [
          "OpenStreetMap-Einträge können unvollständig oder veraltet sein.",
          "Startfläche, Erlaubnis, Wind, Hindernisse und lokale Regeln bestätigen.",
        ],
      },
    }
  }

  return {
    en: {
      summary: "",
      note: "This mapped record has not yet received a local operational review.",
      knownFor: ["Open-data landing record"],
      cautions: [
        "OpenStreetMap records can be incomplete or outdated.",
        "Confirm the landing boundary, crops, permission, obstacles, and local rules.",
      ],
    },
    de: {
      summary: "",
      note: "Dieser Karteneintrag wurde noch nicht lokal und betrieblich geprüft.",
      knownFor: ["Open-Data-Landeplatz"],
      cautions: [
        "OpenStreetMap-Einträge können unvollständig oder veraltet sein.",
        "Landefläche, Bewuchs, Erlaubnis, Hindernisse und lokale Regeln bestätigen.",
      ],
    },
  }
}

async function existingImportCount() {
  const result = await database.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM sites WHERE source_kind = 'openstreetmap'",
  )
  return Number(result.rows[0]?.count ?? 0)
}

async function run() {
  let payload: OverpassResponse

  try {
    const url = new URL(overpassUrl)
    url.searchParams.set("data", overpassQuery)
    const response = await fetch(url, {
      headers: { "User-Agent": "parapente-local-development/0.1" },
    })

    if (!response.ok) {
      throw new Error(`Overpass returned ${response.status}`)
    }

    payload = (await response.json()) as OverpassResponse
  } catch (error) {
    const count = await existingImportCount()
    if (count > 0) {
      console.warn(
        `OpenStreetMap refresh unavailable; keeping ${count} previously imported records.`,
      )
      return
    }
    throw error
  }

  const client = await database.connect()
  let imported = 0
  let skippedNearReviewed = 0
  let skippedDuplicates = 0
  let removedDuplicates = 0

  const duplicateKeys = new Set<string>()

  // OpenStreetMap carries some fields twice (two polygons over one meadow), so
  // near-coincident points of the same kind are collapsed before insert. The
  // discarded record is kept as a source so its OSM id is still traceable.
  const dropped = new Map<string, string[]>()
  {
    const candidates: {
      key: string
      kind: string
      latitude: number
      longitude: number
      name: string
      richness: number
    }[] = []

    for (const element of payload.elements) {
      const tags = element.tags ?? {}
      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      if (lat == null || lon == null) continue
      for (const kind of siteKinds(tags)) {
        candidates.push({
          key: `${element.type}:${element.id}:${kind}`,
          kind,
          latitude: lat,
          longitude: lon,
          name:
            splitSiteName(tags.name ?? tags["name:de"] ?? "").name ?? "",
          // More tags means a more completely described record.
          richness: Object.keys(tags).length,
        })
      }
    }

    for (const group of dedupeByProximity(candidates)) {
      if (!group.merged.length) continue
      dropped.set(
        group.kept.key,
        group.merged.map((m) => m.key),
      )
      for (const merged of group.merged) duplicateKeys.add(merged.key)
    }
  }

  // Stripping the category word can make two launches on the same hill read
  // identically ("Brienzer Rothorn" twice). Count the cleaned names first so the
  // compass qualifier can be kept only where it is actually doing work.
  const nameUses = new Map<string, number>()
  for (const element of payload.elements) {
    const tags = element.tags ?? {}
    if (element.lat == null && element.center?.lat == null) continue
    const cleaned = splitSiteName(tags.name ?? tags["name:de"] ?? "").name
    if (!cleaned) continue
    const kindCount = siteKinds(tags).length
    if (kindCount === 0) continue
    nameUses.set(cleaned, (nameUses.get(cleaned) ?? 0) + kindCount)
  }

  try {
    await client.query("BEGIN")

    for (const element of payload.elements) {
      const tags = element.tags ?? {}
      const latitude = element.lat ?? element.center?.lat
      const longitude = element.lon ?? element.center?.lon

      if (latitude == null || longitude == null) continue

      for (const kind of siteKinds(tags)) {
        const nearbyReviewed = await client.query(
          `
            SELECT 1
            FROM sites
            WHERE kind = $1
              AND data_status = 'reviewed'
              AND abs(latitude - $2) < 0.0012
              AND abs(longitude - $3) < 0.0018
            LIMIT 1
          `,
          [kind, latitude, longitude],
        )

        if (nearbyReviewed.rowCount) {
          skippedNearReviewed += 1
          continue
        }

        const sourceRecordId = `${element.type}:${element.id}:${kind}`

        // Folded into a nearby duplicate by the dedupe pass above.
        if (duplicateKeys.has(sourceRecordId)) {
          skippedDuplicates += 1
          continue
        }
        const id = `osm-${element.type}-${element.id}-${kind}`
        const fallbackName =
          kind === "launch"
            ? `Mapped launch ${element.id}`
            : `Mapped landing ${element.id}`
        const rawName = tags.name ?? tags["name:de"] ?? fallbackName
        const { name: cleanedName, qualifier } = splitSiteName(rawName)
        const baseName = resolveSiteName(
          rawName,
          tags["addr:city"] ?? tags.place ?? null,
          fallbackName,
        )
        const needsQualifier =
          !!cleanedName && !!qualifier && (nameUses.get(cleanedName) ?? 0) > 1
        const name = needsQualifier ? `${baseName} ${qualifier}` : baseName
        const slug = `${slugify(name) || "mapped-site"}-${element.id}-${kind}`
        const text = copy(kind)
        const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`

        await client.query(
          `
            INSERT INTO sites (
              id, slug, kind, data_status, latitude, longitude, elevation_m,
              launch_directions, access_type, source_label, source_url,
              source_kind, source_record_id, reviewed_at
            ) VALUES (
              $1, $2, $3, 'mapped', $4, $5, $6, $7, $8,
              'OpenStreetMap contributors', $9, 'openstreetmap', $10, CURRENT_DATE
            )
            ON CONFLICT (id) DO UPDATE SET
              slug = EXCLUDED.slug,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              -- OpenStreetMap rarely carries an ele tag, while the swisstopo backfill
              -- does. Overwriting with EXCLUDED wiped every filled elevation on
              -- each import and silently disabled glide reachability.
              elevation_m = COALESCE(EXCLUDED.elevation_m, sites.elevation_m),
              launch_directions = EXCLUDED.launch_directions,
              access_type = EXCLUDED.access_type,
              source_url = EXCLUDED.source_url,
              source_record_id = EXCLUDED.source_record_id,
              reviewed_at = EXCLUDED.reviewed_at,
              updated_at = now()
          `,
          [
            id,
            slug,
            kind,
            latitude,
            longitude,
            elevation(tags),
            directions(tags),
            tags.access ?? null,
            sourceUrl,
            sourceRecordId,
          ],
        )

        for (const locale of ["en", "de"] as const) {
          await client.query(
            `
              INSERT INTO site_translations (
                site_id, locale, name, locality, summary, access_detail,
                terrain, research_note, known_for, cautions
              ) VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, $8)
              ON CONFLICT (site_id, locale) DO UPDATE SET
                name = EXCLUDED.name,
                locality = EXCLUDED.locality,
                summary = EXCLUDED.summary,
                research_note = EXCLUDED.research_note,
                known_for = EXCLUDED.known_for,
                cautions = EXCLUDED.cautions
            `,
            [
              id,
              locale,
              name,
              tags["addr:city"] ?? tags.place ?? null,
              (locale === "de"
                ? tags["description:de"] ?? tags.description
                : tags["description:en"] ?? tags.description) ??
                text[locale].summary,
              text[locale].note,
              text[locale].knownFor,
              text[locale].cautions,
            ],
          )
        }

        for (const mergedKey of dropped.get(sourceRecordId) ?? []) {
          const [type, osmId] = mergedKey.split(":")
          await client.query(
            `INSERT INTO site_sources (site_id, provider_code, confirms, label, url)
             VALUES ($1, 'osm', 'location', $2, $3)
             ON CONFLICT (site_id, provider_code, confirms) DO NOTHING`,
            [
              id,
              `OpenStreetMap ${type}/${osmId} (duplicate of this site)`,
              `https://www.openstreetmap.org/${type}/${osmId}`,
            ],
          )
        }

        // Wind windows are rebuilt from the source spec on every import so a
        // corrected OpenStreetMap tag removes stale arcs instead of adding to
        // them. Landings have no launch window.
        await client.query(
          `DELETE FROM site_wind_windows WHERE site_id = $1 AND provider_code = 'osm'`,
          [id],
        )

        if (kind === "launch") {
          for (const arc of parseWindSpec(directionSpec(tags))) {
            await client.query(
              `
                INSERT INTO site_wind_windows (
                  site_id, from_deg, to_deg, quality, provider_code
                ) VALUES ($1, $2, $3, 'preferred', 'osm')
                ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING
              `,
              [id, arc.fromDeg, arc.toDeg],
            )
          }
        }

        imported += 1
      }
    }

    // Earlier imports created rows that the dedupe pass now folds away. Remove
    // them so a duplicate already in the table does not survive forever.
    if (duplicateKeys.size) {
      const removal = await client.query(
        `DELETE FROM sites
          WHERE provider_code = 'osm'
            AND source_record_id = ANY($1::text[])`,
        [[...duplicateKeys]],
      )
      removedDuplicates = removal.rowCount ?? 0
    }

    await client.query("COMMIT")
    console.log(
      `Imported ${imported} OpenStreetMap sites; skipped ${skippedNearReviewed} near reviewed records, ${skippedDuplicates} duplicates, removed ${removedDuplicates} stale duplicate rows.`,
    )
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

run()
  .then(() => database.end())
  .catch(async (error: unknown) => {
    console.error("OpenStreetMap import failed", error)
    await database.end()
    process.exitCode = 1
  })

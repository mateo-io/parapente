import { database } from "./database"

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

function directions(tags: Record<string, string>) {
  const value =
    tags["free_flying:takeoff:direction"] ?? tags.direction ?? ""
  return value
    .split(/[;,/]/)
    .map((direction) => direction.trim().toUpperCase())
    .filter(Boolean)
}

function copy(kind: ImportKind, name: string) {
  if (kind === "launch") {
    return {
      en: {
        summary: `${name} is mapped as a paragliding launch in OpenStreetMap.`,
        note: "This mapped record has not yet received a local operational review.",
        knownFor: ["Open-data launch record"],
        cautions: [
          "OpenStreetMap records can be incomplete or outdated.",
          "Confirm the launch boundary, permission, wind, obstacles, and local rules.",
        ],
      },
      de: {
        summary: `${name} ist in OpenStreetMap als Gleitschirm-Startplatz erfasst.`,
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
      summary: `${name} is mapped as a paragliding landing area in OpenStreetMap.`,
      note: "This mapped record has not yet received a local operational review.",
      knownFor: ["Open-data landing record"],
      cautions: [
        "OpenStreetMap records can be incomplete or outdated.",
        "Confirm the landing boundary, crops, permission, obstacles, and local rules.",
      ],
    },
    de: {
      summary: `${name} ist in OpenStreetMap als Gleitschirm-Landeplatz erfasst.`,
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
        const id = `osm-${element.type}-${element.id}-${kind}`
        const fallbackName =
          kind === "launch"
            ? `Mapped launch ${element.id}`
            : `Mapped landing ${element.id}`
        const name = tags.name ?? tags["name:de"] ?? fallbackName
        const slug = `${slugify(name) || "mapped-site"}-${element.id}-${kind}`
        const text = copy(kind, name)
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
              elevation_m = EXCLUDED.elevation_m,
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
              text[locale].summary,
              text[locale].note,
              text[locale].knownFor,
              text[locale].cautions,
            ],
          )
        }

        imported += 1
      }
    }

    await client.query("COMMIT")
    console.log(
      `Imported ${imported} OpenStreetMap sites; skipped ${skippedNearReviewed} near reviewed records.`,
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

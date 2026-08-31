import { database } from "./database"

/**
 * Imports cables and power lines from OpenStreetMap as vectors.
 *
 * The federal obstacle register (ch.bazl.luftfahrthindernis) is authoritative
 * but WMS-only, so it can be drawn and not inspected. These vectors make the
 * same hazards clickable, with voltage and operator where OSM carries them.
 *
 * Neither source is complete: temporary cables for forestry and construction
 * appear in no register, which is why every local sheet warns to expect them.
 */

const OVERPASS = "https://overpass-api.de/api/interpreter"

/** Lake Lucerne and the Engelberg valley. */
const BBOX = "46.75,8.15,47.10,8.70"

interface OsmWay {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

function kindFor(tags: Record<string, string>) {
  if (tags.power === "line") return "power_line"
  if (tags.power === "minor_line") return "minor_power_line"
  const aerial = tags.aerialway
  if (!aerial) return "other"
  if (["goods", "material_line", "zip_line"].includes(aerial)) return "material_ropeway"
  return "cableway"
}

async function run() {
  const query = `[out:json][timeout:120];
(
  way["power"~"^(line|minor_line)$"](${BBOX});
  way["aerialway"](${BBOX});
);
out geom;`

  // Overpass rejects requests without an identifying User-Agent.
  const response = await fetch(OVERPASS, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "parapente/0.1 (personal flying-site research)",
      Accept: "application/json",
    },
    body: new URLSearchParams({ data: query }).toString(),
  })
  if (!response.ok) throw new Error(`Overpass ${response.status}`)

  const { elements = [] } = (await response.json()) as { elements?: OsmWay[] }

  let imported = 0
  let skipped = 0

  for (const way of elements) {
    const geometry = way.geometry ?? []
    if (geometry.length < 2) { skipped += 1; continue }

    const tags = way.tags ?? {}
    const coords = geometry.map((p) => [p.lon, p.lat])
    const lats = geometry.map((p) => p.lat)
    const lons = geometry.map((p) => p.lon)

    const voltage = Number(String(tags.voltage ?? "").split(";")[0])

    await database.query(
      `INSERT INTO hazards (id, provider_code, kind, name, voltage, operator,
         geometry, min_lat, max_lat, min_lon, max_lon, source_url)
       VALUES ($1,'osm',$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         kind = EXCLUDED.kind, name = EXCLUDED.name, voltage = EXCLUDED.voltage,
         operator = EXCLUDED.operator, geometry = EXCLUDED.geometry,
         min_lat = EXCLUDED.min_lat, max_lat = EXCLUDED.max_lat,
         min_lon = EXCLUDED.min_lon, max_lon = EXCLUDED.max_lon,
         fetched_at = now()`,
      [
        `osm-way-${way.id}`,
        kindFor(tags),
        tags.name ?? tags.ref ?? null,
        Number.isFinite(voltage) && voltage > 0 ? voltage : null,
        tags.operator ?? null,
        JSON.stringify(coords),
        Math.min(...lats), Math.max(...lats),
        Math.min(...lons), Math.max(...lons),
        `https://www.openstreetmap.org/way/${way.id}`,
      ],
    )
    imported += 1
  }

  console.log(`Hazards: ${imported} imported, ${skipped} without geometry.`)
  await database.end()
}

void run()

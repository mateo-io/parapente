import express from "express"

import { database } from "./database"
import { parseSiteQuery } from "./siteQuery"

const app = express()
const port = Number(process.env.PARAPENTE_API_PORT ?? 8787)

app.disable("x-powered-by")

app.get("/api/health", async (_request, response, next) => {
  try {
    const result = await database.query<{
      total: string
      launches: string
      landings: string
      reviewed_through: string | null
    }>(`
      SELECT
        count(*)::text AS total,
        count(*) FILTER (WHERE kind = 'launch')::text AS launches,
        count(*) FILTER (WHERE kind = 'landing')::text AS landings,
        max(reviewed_at)::text AS reviewed_through
      FROM sites
      WHERE region_code = 'lake-lucerne'
    `)

    response.json({ ok: true, database: "parapente", ...result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.get("/api/sites", async (request, response, next) => {
  try {
    const { locale, kinds, bounds, search } = parseSiteQuery(
      request.query as Record<string, string | string[] | undefined>,
    )
    const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bounds
    const result = await database.query(
      `
        SELECT
          s.id,
          s.slug,
          s.kind,
          s.data_status AS "dataStatus",
          s.canton,
          s.latitude,
          s.longitude,
          s.elevation_m AS "elevationM",
          s.launch_directions AS "launchDirections",
          s.pilot_level AS "pilotLevel",
          s.access_type AS "accessType",
          s.source_label AS "sourceLabel",
          s.source_url AS "sourceUrl",
          s.source_kind AS "sourceKind",
          s.reviewed_at::text AS "reviewedAt",
          COALESCE(localized.name, english.name, s.slug) AS name,
          COALESCE(localized.locality, english.locality) AS locality,
          COALESCE(localized.summary, english.summary, '') AS summary,
          COALESCE(localized.access_detail, english.access_detail) AS "accessDetail",
          COALESCE(localized.terrain, english.terrain) AS terrain,
          COALESCE(localized.research_note, english.research_note) AS "researchNote",
          COALESCE(localized.known_for, english.known_for, '{}') AS "knownFor",
          COALESCE(localized.cautions, english.cautions, '{}') AS cautions
        FROM sites s
        LEFT JOIN site_translations localized
          ON localized.site_id = s.id AND localized.locale = $1
        LEFT JOIN site_translations english
          ON english.site_id = s.id AND english.locale = 'en'
        WHERE s.region_code = 'lake-lucerne'
          AND s.kind = ANY($2::text[])
          AND s.longitude BETWEEN $3 AND $5
          AND s.latitude BETWEEN $4 AND $6
          AND (
            $7::text IS NULL
            OR COALESCE(localized.name, english.name, s.slug) ILIKE '%' || $7 || '%'
            OR COALESCE(localized.locality, english.locality, '') ILIKE '%' || $7 || '%'
          )
        ORDER BY
          CASE s.data_status WHEN 'reviewed' THEN 0 ELSE 1 END,
          name
        LIMIT 1000
      `,
      [
        locale,
        kinds,
        minLongitude,
        minLatitude,
        maxLongitude,
        maxLatitude,
        search ?? null,
      ],
    )

    response.json({
      data: result.rows,
      meta: {
        locale,
        count: result.rowCount ?? 0,
        bounds,
        kinds,
        freshness: "research_snapshot",
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get("/api/sites/:slug", async (request, response, next) => {
  try {
    const locale = request.query.lang === "de" ? "de" : "en"
    const result = await database.query(
      `
        SELECT
          s.id,
          s.slug,
          s.kind,
          s.data_status AS "dataStatus",
          s.canton,
          s.latitude,
          s.longitude,
          s.elevation_m AS "elevationM",
          s.launch_directions AS "launchDirections",
          s.pilot_level AS "pilotLevel",
          s.access_type AS "accessType",
          s.source_label AS "sourceLabel",
          s.source_url AS "sourceUrl",
          s.source_kind AS "sourceKind",
          s.reviewed_at::text AS "reviewedAt",
          COALESCE(localized.name, english.name, s.slug) AS name,
          COALESCE(localized.locality, english.locality) AS locality,
          COALESCE(localized.summary, english.summary, '') AS summary,
          COALESCE(localized.access_detail, english.access_detail) AS "accessDetail",
          COALESCE(localized.terrain, english.terrain) AS terrain,
          COALESCE(localized.research_note, english.research_note) AS "researchNote",
          COALESCE(localized.known_for, english.known_for, '{}') AS "knownFor",
          COALESCE(localized.cautions, english.cautions, '{}') AS cautions
        FROM sites s
        LEFT JOIN site_translations localized
          ON localized.site_id = s.id AND localized.locale = $1
        LEFT JOIN site_translations english
          ON english.site_id = s.id AND english.locale = 'en'
        WHERE s.slug = $2
        LIMIT 1
      `,
      [locale, request.params.slug],
    )

    if (!result.rows[0]) {
      response.status(404).json({ error: "site_not_found" })
      return
    }

    response.json({ data: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    void _next
    console.error("Parapente API error", error)
    response.status(500).json({ error: "local_api_unavailable" })
  },
)

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Parapente API ready at http://127.0.0.1:${port}`)
})

function shutdown() {
  server.close(() => {
    void database.end().finally(() => process.exit(0))
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

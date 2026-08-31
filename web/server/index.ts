import express from "express"

import { database } from "./database"
import { parseSiteQuery } from "./siteQuery"
import { WIND_ATTRIBUTION, fetchWind } from "./windFeed"
import { STATION_ATTRIBUTION, fetchStationReading } from "./stationFeed"
import { FORECAST_ATTRIBUTION, fetchStationForecasts } from "./forecastFeed"

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
          s.launch_sections AS "launchSections",
          COALESCE(w.windows, '[]'::json) AS "windWindows",
          COALESCE(cov.covered_degrees, 0)::float AS "windCoverageDegrees",
          COALESCE(cov.preferred_degrees, 0)::float AS "windPreferredDegrees",
          COALESCE(corr.source_count, 0)::int AS "sourceCount",
          COALESCE(rc.completeness, 'unknown') AS "flightCoverage",
          COALESCE(src.sources, '[]'::json) AS "sources",
          st.station AS "station",
          s.landing_role AS "landingRole",
          COALESCE(pair.pairings, '[]'::json) AS "pairings",
          COALESCE(rep.reports, '[]'::json) AS "reports",
          lf.lift AS "lift",
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
          LEFT JOIN LATERAL (
            SELECT json_agg(
                     json_build_object(
                       'fromDeg', ww.from_deg::float,
                       'toDeg', ww.to_deg::float,
                       'quality', ww.quality
                     ) ORDER BY ww.from_deg
                   ) AS windows
              FROM site_wind_windows ww
             WHERE ww.site_id = s.id
          ) w ON true
          LEFT JOIN site_wind_coverage cov ON cov.site_id = s.id
          LEFT JOIN site_corroboration corr ON corr.site_id = s.id
          LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object(
                     'kind', r.kind,
                     'body', r.body,
                     'attribution', r.attribution,
                     'sourceUrl', r.source_url,
                     'authority', r.authority,
                     'observedOn', r.observed_on
                   ) ORDER BY
                     CASE r.authority
                       WHEN 'governing_body' THEN 0 WHEN 'school' THEN 1
                       WHEN 'club' THEN 2 WHEN 'operator' THEN 3 ELSE 4 END,
                     r.kind) AS reports
              FROM site_reports r
             WHERE r.site_id = s.id AND r.locale = $1
          ) rep ON true
          LEFT JOIN region_coverage rc
            ON rc.region_code = s.region_code AND rc.provider_code = 'curated'
          LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object(
                     'otherSlug', other.slug,
                     'otherName', COALESCE(otr.name, ote.name),
                     'role', ll.role,
                     'conditionNote', ll.condition_note,
                     'sourceUrl', ll.source_url,
                     'flightCount', COALESCE(f.flight_count, 0)
                   )) AS pairings
              FROM launch_landings ll
              JOIN sites other
                ON other.id = CASE WHEN ll.launch_id = s.id THEN ll.landing_id ELSE ll.launch_id END
              LEFT JOIN site_translations otr
                ON otr.site_id = other.id AND otr.locale = $1
              LEFT JOIN site_translations ote
                ON ote.site_id = other.id AND ote.locale = 'en'
              LEFT JOIN launch_landing_flights f
                ON f.launch_site_id = ll.launch_id AND f.landing_site_id = ll.landing_id
             WHERE ll.launch_id = s.id OR ll.landing_id = s.id
          ) pair ON true
          LEFT JOIN LATERAL (
            SELECT json_build_object(
                     'code', l.code,
                     'name', l.name,
                     'kind', l.kind,
                     'url', l.url,
                     'rideMinutes', l.ride_minutes,
                     'walkMinutes', sl.walk_minutes,
                     'walkConfidence', sl.walk_confidence,
                     'walkHorizontalM', sl.walk_horizontal_m,
                     'walkAscentM', sl.walk_ascent_m,
                     'seasonalNote', l.seasonal_note,
                     'baseLatitude', l.base_latitude,
                     'baseLongitude', l.base_longitude,
                     'baseElevationM', l.base_elevation_m,
                     'topElevationM', l.top_elevation_m,
                     'prices', COALESCE((
                       SELECT json_agg(json_build_object(
                                'ticketType', p.ticket_type,
                                'audience', p.audience,
                                'amount', p.amount::float,
                                'currency', p.currency,
                                'asOf', p.as_of,
                                'sourceUrl', p.source_url,
                                'note', p.note
                              ) ORDER BY p.amount)
                         FROM lift_current_prices p
                        WHERE p.lift_code = l.code
                     ), '[]'::json)
                   ) AS lift
              FROM site_lifts sl
              JOIN lifts l ON l.code = sl.lift_code
             WHERE sl.site_id = s.id AND sl.is_primary
             LIMIT 1
          ) lf ON true
          LEFT JOIN LATERAL (
            SELECT json_build_object(
                     'code', ws.code,
                     'latitude', ws.latitude,
                     'longitude', ws.longitude,
                     'elevationM', ws.elevation_m,
                     'distanceKm', ss.distance_km::float,
                     'elevationDeltaM', ss.elevation_delta_m
                   ) AS station
              FROM site_stations ss
              JOIN weather_stations ws ON ws.code = ss.station_code
             WHERE ss.site_id = s.id AND ss.is_primary
             LIMIT 1
          ) st ON true
          LEFT JOIN LATERAL (
            SELECT json_agg(
                     json_build_object(
                       'label', ss.label,
                       'url', ss.url,
                       'confirms', ss.confirms,
                       'providerCode', ss.provider_code
                     ) ORDER BY ss.provider_code, ss.confirms
                   ) AS sources
              FROM site_sources ss
             WHERE ss.site_id = s.id
          ) src ON true
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
          s.launch_sections AS "launchSections",
          COALESCE(w.windows, '[]'::json) AS "windWindows",
          COALESCE(cov.covered_degrees, 0)::float AS "windCoverageDegrees",
          COALESCE(cov.preferred_degrees, 0)::float AS "windPreferredDegrees",
          COALESCE(corr.source_count, 0)::int AS "sourceCount",
          COALESCE(rc.completeness, 'unknown') AS "flightCoverage",
          COALESCE(src.sources, '[]'::json) AS "sources",
          st.station AS "station",
          s.landing_role AS "landingRole",
          COALESCE(pair.pairings, '[]'::json) AS "pairings",
          COALESCE(rep.reports, '[]'::json) AS "reports",
          lf.lift AS "lift",
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
          LEFT JOIN LATERAL (
            SELECT json_agg(
                     json_build_object(
                       'fromDeg', ww.from_deg::float,
                       'toDeg', ww.to_deg::float,
                       'quality', ww.quality
                     ) ORDER BY ww.from_deg
                   ) AS windows
              FROM site_wind_windows ww
             WHERE ww.site_id = s.id
          ) w ON true
          LEFT JOIN site_wind_coverage cov ON cov.site_id = s.id
          LEFT JOIN site_corroboration corr ON corr.site_id = s.id
          LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object(
                     'kind', r.kind,
                     'body', r.body,
                     'attribution', r.attribution,
                     'sourceUrl', r.source_url,
                     'authority', r.authority,
                     'observedOn', r.observed_on
                   ) ORDER BY
                     CASE r.authority
                       WHEN 'governing_body' THEN 0 WHEN 'school' THEN 1
                       WHEN 'club' THEN 2 WHEN 'operator' THEN 3 ELSE 4 END,
                     r.kind) AS reports
              FROM site_reports r
             WHERE r.site_id = s.id AND r.locale = $1
          ) rep ON true
          LEFT JOIN region_coverage rc
            ON rc.region_code = s.region_code AND rc.provider_code = 'curated'
          LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object(
                     'otherSlug', other.slug,
                     'otherName', COALESCE(otr.name, ote.name),
                     'role', ll.role,
                     'conditionNote', ll.condition_note,
                     'sourceUrl', ll.source_url,
                     'flightCount', COALESCE(f.flight_count, 0)
                   )) AS pairings
              FROM launch_landings ll
              JOIN sites other
                ON other.id = CASE WHEN ll.launch_id = s.id THEN ll.landing_id ELSE ll.launch_id END
              LEFT JOIN site_translations otr
                ON otr.site_id = other.id AND otr.locale = $1
              LEFT JOIN site_translations ote
                ON ote.site_id = other.id AND ote.locale = 'en'
              LEFT JOIN launch_landing_flights f
                ON f.launch_site_id = ll.launch_id AND f.landing_site_id = ll.landing_id
             WHERE ll.launch_id = s.id OR ll.landing_id = s.id
          ) pair ON true
          LEFT JOIN LATERAL (
            SELECT json_build_object(
                     'code', l.code,
                     'name', l.name,
                     'kind', l.kind,
                     'url', l.url,
                     'rideMinutes', l.ride_minutes,
                     'walkMinutes', sl.walk_minutes,
                     'walkConfidence', sl.walk_confidence,
                     'walkHorizontalM', sl.walk_horizontal_m,
                     'walkAscentM', sl.walk_ascent_m,
                     'seasonalNote', l.seasonal_note,
                     'baseLatitude', l.base_latitude,
                     'baseLongitude', l.base_longitude,
                     'baseElevationM', l.base_elevation_m,
                     'topElevationM', l.top_elevation_m,
                     'prices', COALESCE((
                       SELECT json_agg(json_build_object(
                                'ticketType', p.ticket_type,
                                'audience', p.audience,
                                'amount', p.amount::float,
                                'currency', p.currency,
                                'asOf', p.as_of,
                                'sourceUrl', p.source_url,
                                'note', p.note
                              ) ORDER BY p.amount)
                         FROM lift_current_prices p
                        WHERE p.lift_code = l.code
                     ), '[]'::json)
                   ) AS lift
              FROM site_lifts sl
              JOIN lifts l ON l.code = sl.lift_code
             WHERE sl.site_id = s.id AND sl.is_primary
             LIMIT 1
          ) lf ON true
          LEFT JOIN LATERAL (
            SELECT json_build_object(
                     'code', ws.code,
                     'latitude', ws.latitude,
                     'longitude', ws.longitude,
                     'elevationM', ws.elevation_m,
                     'distanceKm', ss.distance_km::float,
                     'elevationDeltaM', ss.elevation_delta_m
                   ) AS station
              FROM site_stations ss
              JOIN weather_stations ws ON ws.code = ss.station_code
             WHERE ss.site_id = s.id AND ss.is_primary
             LIMIT 1
          ) st ON true
          LEFT JOIN LATERAL (
            SELECT json_agg(
                     json_build_object(
                       'label', ss.label,
                       'url', ss.url,
                       'confirms', ss.confirms,
                       'providerCode', ss.provider_code
                     ) ORDER BY ss.provider_code, ss.confirms
                   ) AS sources
              FROM site_sources ss
             WHERE ss.site_id = s.id
          ) src ON true
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

/**
 * Live wind for one point. The response carries its observation time and source
 * so the client can show freshness and never present it as a site assessment.
 */
app.get("/api/wind", async (request, response) => {
  const latitude = Number(request.query.lat)
  const longitude = Number(request.query.lon)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    response.status(400).json({ error: "lat and lon are required" })
    return
  }

  try {
    const reading = await fetchWind(latitude, longitude)
    if (!reading) {
      response.status(502).json({ error: "no current wind reading available" })
      return
    }
    response.json({ data: reading, meta: { attribution: WIND_ATTRIBUTION } })
  } catch {
    response.status(502).json({ error: "wind provider unavailable" })
  }
})

/** All stations, for the optional "show every station" layer. */
app.get("/api/stations", async (_request, response) => {
  const { rows } = await database.query(
    `SELECT code, latitude, longitude, elevation_m AS "elevationM"
       FROM weather_stations ORDER BY code`,
  )
  response.json({ data: rows, meta: { attribution: STATION_ATTRIBUTION } })
})

/**
 * Live reading for one station. Carries its own observation time; a station is
 * not the site, so the caller must show distance and height difference too.
 */
app.get("/api/stations/:code/reading", async (request, response) => {
  const code = String(request.params.code).toLowerCase()
  if (!/^[a-z0-9]{2,6}$/.test(code)) {
    response.status(400).json({ error: "invalid station code" })
    return
  }

  try {
    const reading = await fetchStationReading(code)
    if (!reading) {
      response.status(502).json({ error: "no current station reading" })
      return
    }
    response.json({ data: reading, meta: { attribution: STATION_ATTRIBUTION } })
  } catch {
    response.status(502).json({ error: "station provider unavailable" })
  }
})

app.get("/api/flyability", async (_request, response, next) => {
  try {
    const { rows } = await database.query<{ code: string; latitude: number; longitude: number }>(`
      SELECT DISTINCT ws.code, ws.latitude, ws.longitude
      FROM weather_stations ws JOIN site_stations ss ON ss.station_code = ws.code
      JOIN sites s ON s.id = ss.site_id WHERE s.kind = 'launch'
      ORDER BY ws.code
    `)
    response.json({ data: await fetchStationForecasts(rows), meta: { attribution: FORECAST_ATTRIBUTION, note: "Station-coordinate forecast-direction matching only; not a launch decision." } })
  } catch (error) { next(error) }
})

/**
 * Cables and power lines as GeoJSON, filtered to a bounding box. Returned as
 * geometry rather than a raster so the map can make each one inspectable.
 */
app.get("/api/hazards", async (request, response) => {
  const nums = ["minLat", "maxLat", "minLon", "maxLon"].map((key) =>
    Number(request.query[key]),
  )
  if (nums.some((value) => !Number.isFinite(value))) {
    response.status(400).json({ error: "minLat, maxLat, minLon, maxLon required" })
    return
  }
  const [minLat, maxLat, minLon, maxLon] = nums as [number, number, number, number]

  const { rows } = await database.query(
    `SELECT id, kind, name, voltage, operator, geometry, source_url AS "sourceUrl"
       FROM hazards
      WHERE max_lat >= $1 AND min_lat <= $2
        AND max_lon >= $3 AND min_lon <= $4
      LIMIT 4000`,
    [minLat, maxLat, minLon, maxLon],
  )

  response.json({
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: { type: "LineString", coordinates: row.geometry },
      properties: {
        kind: row.kind,
        name: row.name,
        voltage: row.voltage,
        operator: row.operator,
        sourceUrl: row.sourceUrl,
      },
    })),
    meta: {
      attribution: "OpenStreetMap contributors (ODbL)",
      note: "Temporary cables are not mapped. Expect wires that are in no register.",
    },
  })
})

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

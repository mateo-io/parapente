import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  CheckCircle2,
  CloudSun,
  Database,
  ExternalLink,
  Flag,
  Cable,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Layers,
  MapPin,
  Mountain,
  Search,
  ShieldAlert,
  X,
} from "lucide-react"
import { Link, useLoaderData, useRevalidator } from "react-router-dom"

import { Brand } from "@/components/Brand"
import { LakeLucerneMap } from "@/features/spots/LakeLucerneMap"
import { loadMapSites } from "@/features/spots/mapLoader"
import { OVERLAYS } from "@/features/spots/basemap"
import { filterByForecastMatch, type ForecastHorizon } from "@/features/spots/forecastFilter"
import { useForecasts } from "@/features/spots/useForecasts"
import { WindRose } from "@/features/spots/WindRose"
import {
  bearingForSector,
  COMPASS_SECTORS,
  filterByWind,
  type CompassSector,
} from "@/features/spots/windFilter"
import { launchesReaching, reachableLandings } from "@/features/spots/glide"
import type { StationPoint } from "@/features/spots/stationLayers"
import { useLiveWind } from "@/features/spots/useLiveWind"
import type { OverlayId } from "@/features/spots/basemap"
import {
  countSitesByKind,
  filterMapSites,
} from "@/features/spots/mapFilters"
import { spotRepository } from "@/features/spots/repository"
import type {
  FlyingSite,
  MapFilters,
  SiteKind,
} from "@/features/spots/types"
import { copy } from "@/i18n/mapCopy"

interface MapLoaderData {
  sites: FlyingSite[]
  dataUnavailable: boolean
}

export async function loader() {
  return loadMapSites(() => spotRepository.list()) satisfies Promise<MapLoaderData>
}

const initialKinds: SiteKind[] = ["launch", "landing"]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`))
}

export default function ExplorePage() {
  const initial = useLoaderData() as MapLoaderData
  const revalidator = useRevalidator()
  const [sites, setSites] = useState(initial.sites)
  const [filters, setFilters] = useState<MapFilters>({
    query: "",
    kinds: initialKinds,
  })
  const [selectedSlug, setSelectedSlug] = useState<string>()

  // Navigating to this route again (the home link) does not remount the page,
  // so loader data copied into state on first render would otherwise go stale
  // and leave the switcher disagreeing with the URL.
  useEffect(() => {
    setSites(initial.sites)
  }, [initial])
  const [overlays, setOverlays] = useState<OverlayId[]>([])
  const [windSector, setWindSector] = useState<CompassSector | null>(null)
  const [forecastHorizons, setForecastHorizons] = useState<ForecastHorizon[]>([0, 2, 4])
  const [stations, setStations] = useState<StationPoint[]>([])
  const [showAllStations, setShowAllStations] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/stations")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload?.data) setStations(payload.data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  const forecasts = useForecasts()
  const visibleSites = useMemo(
    () => filterByForecastMatch(
      filterByWind(
        filterMapSites(sites, filters),
        windSector == null ? null : bearingForSector(windSector),
      ),
      forecasts,
      forecastHorizons,
    ),
    [filters, sites, forecasts, windSector, forecastHorizons],
  )
  const counts = useMemo(() => countSitesByKind(sites), [sites])
  const selectedSite = sites.find((site) => site.slug === selectedSlug)
  const glideLegs = useMemo(
    () => (selectedSite ? reachableLandings(selectedSite, sites) : []),
    [selectedSite, sites],
  )
  const inboundLegs = useMemo(
    () => (selectedSite ? launchesReaching(selectedSite, sites) : []),
    [selectedSite, sites],
  )
  const liveWind = useLiveWind(
    selectedSite?.latitude,
    selectedSite?.longitude,
  )
  const searchResults = filters.query.trim()
    ? visibleSites.slice(0, 7)
    : []

  function toggleOverlay(id: OverlayId) {
    setOverlays((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function toggleKind(kind: SiteKind) {
    setFilters((current) => ({
      ...current,
      kinds: current.kinds.includes(kind)
        ? current.kinds.filter((item) => item !== kind)
        : [...current.kinds, kind],
    }))
  }


  return (
    <section className="map-experience">
      <LakeLucerneMap
        sites={visibleSites}
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
        overlays={overlays}
        stations={stations}
        showAllStations={showAllStations}
      />

      {initial.dataUnavailable ? (
        <section className="map-data-unavailable" role="status">
          <ShieldAlert size={18} aria-hidden="true" />
          <div>
            <strong>{"Local site data is unavailable."}</strong>
            <p>{"Check that the local API and PostgreSQL are running, then retry. No site conditions are being shown."}</p>
          </div>
          <button type="button" onClick={() => revalidator.revalidate()}>
            {revalidator.state === "loading" ? "Retrying…" : "Retry"}
          </button>
        </section>
      ) : null}

      <header className="map-header">
        <Brand />

        {/* Reserved. Intended for wind and weather at the selected site. */}
        <div className="map-header__slot" />
      </header>

      <div className="map-search-wrap">
        <label className="map-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{copy.searchLabel}</span>
          <input
            type="search"
            value={filters.query}
            placeholder={copy.searchPlaceholder}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                query: event.currentTarget.value,
              }))
            }
          />
          {filters.query ? (
            <button
              type="button"
              aria-label={copy.clearSearch}
              onClick={() =>
                setFilters((current) => ({ ...current, query: "" }))
              }
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : (
            <kbd>⌘K</kbd>
          )}
        </label>

        {filters.query ? (
          <div className="search-results">
            {searchResults.length ? (
              searchResults.map((site) => (
                <button
                  type="button"
                  key={site.id}
                  onClick={() => {
                    setSelectedSlug(site.slug)
                    setFilters((current) => ({ ...current, query: "" }))
                  }}
                >
                  <span className={`result-dot result-dot--${site.kind}`} />
                  <span>
                    <strong>{site.name}</strong>
                    <small>
                      {[site.locality, site.elevationM ? `${site.elevationM} m` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              ))
            ) : (
              <p>{copy.noResults}</p>
            )}
          </div>
        ) : null}
      </div>

      <aside className="wind-filter" aria-label="Potentially suitable forecast windows">
        <div className="wind-filter__heading">
          <span>{"Launch works in"}</span>
          {windSector ? (
            <button
              type="button"
              className="wind-filter__clear"
              onClick={() => setWindSector(null)}
            >
              {"Clear"}
            </button>
          ) : null}
        </div>
        <div className="wind-filter__grid" aria-label="Filter launches by supported wind direction">
          {COMPASS_SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              className={windSector === sector ? "is-active" : ""}
              aria-pressed={windSector === sector}
              onClick={() => setWindSector((current) => current === sector ? null : sector)}
            >
              {sector}
            </button>
          ))}
        </div>

        <div className="wind-filter__heading wind-filter__heading--forecast">
          <span>{"Potentially suitable"}</span>
        </div>
        {[{ value: 0, label: "Now" }, { value: 2, label: "In 2 hours" }, { value: 4, label: "In 4 hours" }].map(({ value, label }) => (
          <label key={value} className="forecast-filter-option"><input type="checkbox" checked={forecastHorizons.includes(value as ForecastHorizon)} onChange={() => setForecastHorizons((current) => current.includes(value as ForecastHorizon) ? current.filter((item) => item !== value) : [...current, value as ForecastHorizon])} /> {label}</label>
        ))}
        <p className="wind-filter__result"><small>{"Station-coordinate forecast direction only—not a launch decision."}</small></p>
      </aside>

      {sidebarOpen ? (
      <aside id="map-sidebar" className="layer-control" aria-label={copy.layers}>
        <div className="layer-control__heading">
          <span>{copy.layers}</span>
          <span className="layer-control__heading-actions">
            <small>{visibleSites.length} {copy.visible}</small>
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={copy.closeSidebar}
              aria-expanded="true"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </span>
        </div>
        <button
          type="button"
          className={filters.kinds.includes("launch") ? "is-active" : ""}
          aria-pressed={filters.kinds.includes("launch")}
          onClick={() => toggleKind("launch")}
        >
          <span className="layer-icon layer-icon--launch"><Mountain size={16} /></span>
          <span><strong>{copy.launch}</strong><small>{counts.launch}</small></span>
          <CheckCircle2 size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={filters.kinds.includes("landing") ? "is-active" : ""}
          aria-pressed={filters.kinds.includes("landing")}
          onClick={() => toggleKind("landing")}
        >
          <span className="layer-icon layer-icon--landing"><Flag size={16} /></span>
          <span><strong>{copy.landing}</strong><small>{counts.landing}</small></span>
          <CheckCircle2 size={16} aria-hidden="true" />
        </button>
        <button type="button" className="is-disabled" disabled>
          <span className="layer-icon layer-icon--weather"><CloudSun size={16} /></span>
          <span><strong>{copy.weather}</strong><small>{copy.soon}</small></span>
        </button>

        <div className="layer-control__heading layer-control__heading--terrain">
          <span>{copy.stations}</span>
        </div>
        <button
          type="button"
          className={showAllStations ? "is-active" : ""}
          aria-pressed={showAllStations}
          onClick={() => setShowAllStations((current) => !current)}
        >
          <span className="layer-icon layer-icon--weather"><CloudSun size={16} /></span>
          <span>
            <strong>{copy.allStations}</strong>
            <small>{copy.allStationsHint}</small>
          </span>
          <CheckCircle2 size={16} aria-hidden="true" />
        </button>

        <div className="layer-control__heading layer-control__heading--terrain">
          <span>{copy.terrain}</span>
        </div>
        {OVERLAYS.map((overlay) => {
          const active = overlays.includes(overlay.id)
          return (
            <button
              key={overlay.id}
              type="button"
              className={active ? "is-active" : ""}
              aria-pressed={active}
              title={overlay.caption}
              onClick={() => toggleOverlay(overlay.id)}
            >
              <span className="layer-icon layer-icon--terrain">
                <Layers size={16} />
              </span>
              <span>
                <strong>{overlay.label}</strong>
                <small>{overlay.caption}</small>
              </span>
              <CheckCircle2 size={16} aria-hidden="true" />
            </button>
          )
        })}
      </aside>
      ) : (
        <button
          type="button"
          className="sidebar-reopen"
          aria-controls="map-sidebar"
          aria-expanded="false"
          onClick={() => setSidebarOpen(true)}
        >
          {copy.sidebar} <ChevronLeft size={15} aria-hidden="true" />
        </button>
      )}

      {selectedSite ? (
        <aside className="site-drawer" aria-live="polite">
          <button
            className="site-drawer__close"
            type="button"
            aria-label={copy.close}
            onClick={() => setSelectedSlug(undefined)}
          >
            <X size={18} aria-hidden="true" />
          </button>

          <div className="site-drawer__topline">
            <span className={`site-kind site-kind--${selectedSite.kind}`}>
              {selectedSite.kind === "launch" ? copy.launch : copy.landing}
            </span>
            {selectedSite.kind === "landing" &&
            selectedSite.landingRole !== "unknown" ? (
              <span className={`landing-role landing-role--${selectedSite.landingRole}`}>
                {copy[`landing_${selectedSite.landingRole}` as keyof typeof copy]}
              </span>
            ) : null}
            <span className={`data-status data-status--${selectedSite.dataStatus}`}>
              {selectedSite.dataStatus === "reviewed" ? copy.reviewed : copy.mapped}
            </span>
          </div>

          <p className="site-drawer__location">
            <MapPin size={14} aria-hidden="true" />
            {[selectedSite.locality, selectedSite.canton].filter(Boolean).join(" · ") || copy.region}
          </p>
          <h1>{selectedSite.name}</h1>
          {selectedSite.summary ? (
            <p className="site-drawer__summary">{selectedSite.summary}</p>
          ) : (
            <p className="site-drawer__summary site-drawer__summary--empty">
              {copy.noDescription}
            </p>
          )}

          {selectedSite.sourceCount <= 1 ? (
            <div className="single-source-warning">
              <ShieldAlert size={17} aria-hidden="true" />
              <div>
                <strong>{copy.singleSource}</strong>
                <span>{copy.singleSourceDetail}</span>
                {selectedSite.sources[0]?.url ? (
                  <a
                    href={selectedSite.sources[0].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedSite.sources[0].label} <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="corroborated-note">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>
                {copy.corroborated.replace(
                  "{n}",
                  String(selectedSite.sourceCount),
                )}
              </span>
            </div>
          )}

          {selectedSite.launchSections?.length ? (
            <section className="site-drawer__sections" aria-label="Launch sections">
              <div className="site-drawer__sections-heading">
                <span>{"Launch sections"}</span>
                <small>{"One launch area"}</small>
              </div>
              <p>{"Named parts of this launch. General access, landing, airspace, and cautions still apply to all of them."}</p>
              <div className="site-drawer__sections-list">
                {selectedSite.launchSections.map((section) => (
                  <details key={section.id} className="drawer-launch-section">
                    <summary>
                      <span>
                        <strong>{section.name}</strong>
                        <small>{section.windDirections.preferred.length ? `Preferred: ${section.windDirections.preferred.join(" · ")}` : "Direction not recorded"}</small>
                      </span>
                      <span className="drawer-launch-section__summary-end">
                        {section.evidenceStatus === "historical" ? <em>{"Historical detail"}</em> : null}
                        <ChevronDown aria-hidden="true" size={16} />
                      </span>
                    </summary>
                    <div className="drawer-launch-section__body">
                      <p>{section.description}</p>
                      {section.windDirections.acceptable.length ? <p><strong>{"Also recorded:"}</strong>{` ${section.windDirections.acceptable.join(" · ")}`}</p> : null}
                      {section.evidenceNote ? <p className="drawer-launch-section__evidence">{section.evidenceNote}</p> : null}
                      {section.cautions.map((caution) => <p key={caution} className="drawer-launch-section__caution">{caution}</p>)}
                      <p className="drawer-launch-section__source">
                        {section.source.url ? <a href={section.source.url} target="_blank" rel="noreferrer">{section.source.label}</a> : section.source.label}
                        {section.source.reviewedAt ? ` · reviewed ${formatDate(section.source.reviewedAt)}` : null}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {selectedSite.lift ? (
            <section className="site-drawer__lift">
              <h3>{copy.liftAccess}</h3>
              <p className="lift-name">
                <Cable size={16} aria-hidden="true" />
                <span>
                  {selectedSite.lift.url ? (
                    <a href={selectedSite.lift.url} target="_blank" rel="noreferrer">
                      {selectedSite.lift.name} <ExternalLink size={12} />
                    </a>
                  ) : (
                    selectedSite.lift.name
                  )}
                  <small>
                    {selectedSite.lift.baseElevationM != null &&
                    selectedSite.lift.topElevationM != null
                      ? `${selectedSite.lift.baseElevationM} m → ${selectedSite.lift.topElevationM} m`
                      : null}
                    {selectedSite.lift.rideMinutes
                      ? ` · ${selectedSite.lift.rideMinutes} min`
                      : ""}

                  </small>
                </span>
                {selectedSite.lift.walkMinutes != null ? (
                  <span
                    className={`walk-badge walk-badge--${selectedSite.lift.walkConfidence}`}
                    title={
                      selectedSite.lift.walkConfidence === "estimated"
                        ? copy.walkEstimated
                        : undefined
                    }
                  >
                    <Footprints size={13} aria-hidden="true" />
                    {selectedSite.lift.walkConfidence === "estimated" ? "~" : ""}
                    {selectedSite.lift.walkMinutes}′
                  </span>
                ) : null}
              </p>

              {selectedSite.lift.prices.length ? (
                <ul className="lift-prices">
                  {selectedSite.lift.prices.map((price) => (
                    <li key={`${price.ticketType}-${price.asOf}`}>
                      <span className="lift-prices__label">
                        {copy[price.ticketType as keyof typeof copy] ??
                          price.ticketType}
                      </span>
                      <span className="lift-prices__amount">
                        {price.currency} {price.amount.toFixed(2)}
                      </span>
                      <small>
                        {copy.asOf} {formatDate(price.asOf)}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="lift-prices__caveat">{copy.priceCaveat}</p>

              {selectedSite.lift.seasonalNote ? (
                <p className="lift-prices__caveat">
                  {selectedSite.lift.seasonalNote}
                </p>
              ) : null}
            </section>
          ) : null}

          {selectedSite.reports?.length ? (
            <section className="site-drawer__reports">
              <h3>{copy.pilotNotes}</h3>
              <ul className="report-list">
                {selectedSite.reports.map((report, index) => (
                  <li key={index} className={`report-list__item report-list__item--${report.kind}`}>
                    <p>{report.body}</p>
                    <footer>
                      <span className={`report-authority report-authority--${report.authority}`}>
                        {copy[`authority_${report.authority}` as keyof typeof copy] ??
                          report.authority}
                      </span>
                      {report.sourceUrl ? (
                        <a href={report.sourceUrl} target="_blank" rel="noreferrer">
                          {report.attribution ?? copy.source}{" "}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span>{report.attribution}</span>
                      )}
                    </footer>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {selectedSite.pairings?.length ? (
            <section className="site-drawer__pairings">
              <h3>
                {selectedSite.kind === "launch"
                  ? copy.officialLandings
                  : copy.officialFor}
              </h3>
              <ul className="pairing-list">
                {selectedSite.pairings.map((pairing) => (
                  <li key={pairing.otherSlug}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(pairing.otherSlug)}
                    >
                      <span className={`landing-role landing-role--${pairing.role}`}>
                        {copy[`landing_${pairing.role}` as keyof typeof copy] ??
                          pairing.role}
                      </span>
                      <span className="pairing-list__name">
                        {pairing.otherName}
                        {pairing.conditionNote ? (
                          <small>{pairing.conditionNote}</small>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {selectedSite.kind === "landing" && inboundLegs.length ? (
            <section className="site-drawer__glide">
              <h3>{copy.launchesReaching}</h3>
              <p className="site-drawer__glide-note">{copy.glideNote}</p>
              <ul className="glide-list">
                {inboundLegs.map((leg) => (
                  <li key={leg.landing.slug} className={`glide-list__item glide-list__item--${leg.band}`}>
                    <button type="button" onClick={() => setSelectedSlug(leg.landing.slug)}>
                      <span className="glide-list__ratio">
                        {leg.requiredRatio.toFixed(1)}:1
                      </span>
                      <span className="glide-list__name">
                        {leg.landing.name}
                        <small>
                          {(leg.horizontalM / 1000).toFixed(1)} km · −{Math.round(leg.verticalM)} m
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {selectedSite.kind === "launch" && glideLegs.length ? (
            <section className="site-drawer__glide">
              <h3>{copy.reachableLandings}</h3>
              <p className="site-drawer__glide-note">{copy.glideNote}</p>
              <ul className="glide-list">
                {glideLegs.map((leg) => (
                  <li key={leg.landing.slug} className={`glide-list__item glide-list__item--${leg.band}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(leg.landing.slug)}
                    >
                      <span className="glide-list__ratio">
                        {leg.requiredRatio.toFixed(1)}:1
                      </span>
                      <span className="glide-list__name">
                        {leg.landing.name}
                        <small>
                          {(leg.horizontalM / 1000).toFixed(1)} km ·{" "}
                          −{Math.round(leg.verticalM)} m
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {selectedSite.kind === "launch" ? (
            <section className="site-drawer__wind">
              <h3>{copy.windDirections}</h3>
              <WindRose
                windows={selectedSite.windWindows}
                windBearing={liveWind.wind?.bearingDeg ?? null}
                                label={copy.windDirections}
              />
              {selectedSite.station ? (
                <p className="site-drawer__station">
                  <strong>
                    {copy.nearestStation}: {selectedSite.station.code.toUpperCase()}
                  </strong>
                  <small>
                    {selectedSite.station.distanceKm.toFixed(1)} km
                    {selectedSite.station.elevationDeltaM != null
                      ? ` · ${selectedSite.station.elevationDeltaM > 0 ? "+" : ""}${selectedSite.station.elevationDeltaM} m`
                      : ""}
                    {" · "}
                    {copy.stationSource}
                  </small>
                  {selectedSite.station.elevationDeltaM != null &&
                  Math.abs(selectedSite.station.elevationDeltaM) >= 400 ? (
                    <small className="site-drawer__station-caveat">
                      {copy.stationFarBelow}
                    </small>
                  ) : null}
                </p>
              ) : null}

              {liveWind.wind ? (
                <p className="site-drawer__wind-now">
                  <strong>
                    {Math.round(liveWind.wind.speedKmh)} km/h
                  </strong>
                  {liveWind.wind.gustKmh != null
                    ? ` · ${copy.gusts} ${Math.round(liveWind.wind.gustKmh)} km/h`
                    : ""}
                  <small>
                    {copy.observedAt}{" "}
                    {new Date(liveWind.wind.observedAt).toLocaleTimeString(
                      "en-GB",
                      { hour: "2-digit", minute: "2-digit" },
                    )}{" "}
                    · {copy.windSource}
                  </small>
                </p>
              ) : (
                <p className="site-drawer__wind-now">
                  <small>
                    {liveWind.state === "loading"
                      ? copy.windLoading
                      : copy.windUnavailable}
                  </small>
                </p>
              )}
            </section>
          ) : null}

          {selectedSite.dataStatus === "mapped" ? (
            <div className="mapped-warning">
              <ShieldAlert size={17} aria-hidden="true" />
              <span>{copy.mappedExplanation}</span>
            </div>
          ) : null}

          <dl className="site-facts">
            <div>
              <dt>{copy.altitude}</dt>
              <dd>{selectedSite.elevationM ? `${selectedSite.elevationM} m` : copy.notRecorded}</dd>
            </div>
            <div>
              <dt>{copy.directions}</dt>
              <dd>{selectedSite.launchDirections.length ? selectedSite.launchDirections.join(" · ") : copy.notRecorded}</dd>
            </div>
            <div>
              <dt>{copy.access}</dt>
              <dd>{selectedSite.accessType || copy.notRecorded}</dd>
            </div>
          </dl>

          {selectedSite.cautions.length ? (
            <div className="drawer-cautions">
              <span>{copy.knownCautions}</span>
              <ul>
                {selectedSite.cautions.slice(0, 2).map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="source-line">
            <span><Database size={14} aria-hidden="true" /> {copy.source}</span>
            <strong>{selectedSite.sourceLabel}</strong>
            <small>{copy.checked} · {formatDate(selectedSite.reviewedAt)}</small>
          </div>

          <div className="drawer-actions">
            <a href={selectedSite.sourceUrl} target="_blank" rel="noreferrer">
              {copy.openSource} <ExternalLink size={14} aria-hidden="true" />
            </a>
            <Link to={`/spots/${selectedSite.slug}`}>
              {copy.researchBrief} <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      ) : null}

    </section>
  )
}

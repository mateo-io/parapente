import { useMemo, useState } from "react"
import {
  ArrowUpRight,
  CheckCircle2,
  CloudSun,
  Database,
  ExternalLink,
  Flag,
  Languages,
  Layers,
  MapPin,
  Mountain,
  Search,
  ShieldAlert,
  X,
} from "lucide-react"
import {
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router-dom"

import { Brand } from "@/components/Brand"
import { LakeLucerneMap } from "@/features/spots/LakeLucerneMap"
import { OVERLAYS } from "@/features/spots/basemap"
import type { OverlayId } from "@/features/spots/basemap"
import {
  countSitesByKind,
  filterMapSites,
} from "@/features/spots/mapFilters"
import { spotRepository } from "@/features/spots/repository"
import type {
  FlyingSite,
  MapFilters,
  MapLocale,
  SiteKind,
} from "@/features/spots/types"
import { mapCopy } from "@/i18n/mapCopy"

interface MapLoaderData {
  sites: FlyingSite[]
  locale: MapLocale
}

export async function loader({ request }: LoaderFunctionArgs) {
  const locale: MapLocale = new URL(request.url).searchParams.get("lang") === "de"
    ? "de"
    : "en"
  const sites = await spotRepository.list({ locale })
  return { sites, locale } satisfies MapLoaderData
}

const initialKinds: SiteKind[] = ["launch", "landing"]

function formatDate(value: string, locale: MapLocale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`))
}

export default function ExplorePage() {
  const initial = useLoaderData() as MapLoaderData
  const [locale, setLocale] = useState(initial.locale)
  const [sites, setSites] = useState(initial.sites)
  const [filters, setFilters] = useState<MapFilters>({
    query: "",
    kinds: initialKinds,
  })
  const [selectedSlug, setSelectedSlug] = useState<string>()
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const [overlays, setOverlays] = useState<OverlayId[]>([])
  const copy = mapCopy[locale]
  const visibleSites = useMemo(
    () => filterMapSites(sites, filters),
    [filters, sites],
  )
  const counts = useMemo(() => countSitesByKind(sites), [sites])
  const selectedSite = sites.find((site) => site.slug === selectedSlug)
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

  async function changeLanguage(nextLocale: MapLocale) {
    if (nextLocale === locale || isChangingLanguage) return
    setIsChangingLanguage(true)

    try {
      const translatedSites = await spotRepository.list({ locale: nextLocale })
      setSites(translatedSites)
      setLocale(nextLocale)
      const url = new URL(window.location.href)
      url.searchParams.set("lang", nextLocale)
      window.history.replaceState(null, "", url)
    } finally {
      setIsChangingLanguage(false)
    }
  }

  return (
    <section className="map-experience">
      <LakeLucerneMap
        sites={visibleSites}
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
        overlays={overlays}
      />

      <header className="map-header">
        <Brand />

        <div className="map-title">
          <span>{copy.pilotMap}</span>
          <strong>{copy.region}</strong>
          <small>{copy.regionNative}</small>
        </div>

        <div className="language-switcher" aria-label={copy.language}>
          <Languages size={15} aria-hidden="true" />
          <button
            type="button"
            className={locale === "en" ? "is-active" : ""}
            onClick={() => void changeLanguage("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={locale === "de" ? "is-active" : ""}
            onClick={() => void changeLanguage("de")}
          >
            DE
          </button>
        </div>
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

      <aside className="layer-control" aria-label={copy.layers}>
        <div className="layer-control__heading">
          <span>{copy.layers}</span>
          <small>{visibleSites.length} {copy.visible}</small>
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
              title={overlay.caption[locale]}
              onClick={() => toggleOverlay(overlay.id)}
            >
              <span className="layer-icon layer-icon--terrain">
                <Layers size={16} />
              </span>
              <span>
                <strong>{overlay.label[locale]}</strong>
                <small>{overlay.caption[locale]}</small>
              </span>
              <CheckCircle2 size={16} aria-hidden="true" />
            </button>
          )
        })}
      </aside>

      <div className="map-snapshot">
        <span className="snapshot-pulse" />
        <span>
          <strong>{copy.researchSnapshot}</strong>
          <small>{copy.allAroundLake}</small>
        </span>
      </div>

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
            <span className={`data-status data-status--${selectedSite.dataStatus}`}>
              {selectedSite.dataStatus === "reviewed" ? copy.reviewed : copy.mapped}
            </span>
          </div>

          <p className="site-drawer__location">
            <MapPin size={14} aria-hidden="true" />
            {[selectedSite.locality, selectedSite.canton].filter(Boolean).join(" · ") || copy.region}
          </p>
          <h1>{selectedSite.name}</h1>
          <p className="site-drawer__summary">{selectedSite.summary}</p>

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
            <small>{copy.checked} · {formatDate(selectedSite.reviewedAt, locale)}</small>
          </div>

          <div className="drawer-actions">
            <a href={selectedSite.sourceUrl} target="_blank" rel="noreferrer">
              {copy.openSource} <ExternalLink size={14} aria-hidden="true" />
            </a>
            <Link to={`/spots/${selectedSite.slug}?lang=${locale}`}>
              {copy.researchBrief} <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      ) : null}

      <footer className="map-footer">
        <span><Database size={13} aria-hidden="true" /> {copy.localDatabase}</span>
        <span>{sites.length} {copy.mappedSites}</span>
        <span>{copy.openMapData}</span>
        <p>{copy.safety}</p>
      </footer>
    </section>
  )
}

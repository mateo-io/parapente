import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Database,
  ChevronDown,
  ExternalLink,
  Flag,
  MapPin,
  Mountain,
  ShieldCheck,
} from "lucide-react"
import {
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router-dom"

import { spotRepository } from "@/features/spots/repository"
import type { FlyingSite, } from "@/features/spots/types"
import { copy } from "@/i18n/mapCopy"

interface DetailLoaderData {
  site: FlyingSite
}

export async function loader({ params }: LoaderFunctionArgs) {
  const site = params.slug
    ? await spotRepository.findBySlug(params.slug)
    : undefined

  if (!site) throw new Response("Flying site not found", { status: 404 })
  return { site } satisfies DetailLoaderData
}

export default function SpotDetailsPage() {
  const { site } = useLoaderData() as DetailLoaderData

  return (
    <article className="research-page">
      <div className="research-page__breadcrumb">
        <Link to="/">
          <ArrowLeft size={15} aria-hidden="true" />
          {"Back to map"}
        </Link>
        <span>{copy.researchSnapshot}</span>
      </div>

      <header className="research-hero">
        <div>
          <div className="research-hero__badges">
            <span className={`site-kind site-kind--${site.kind}`}>
              {site.kind === "launch" ? copy.launch : copy.landing}
            </span>
            <span className={`data-status data-status--${site.dataStatus}`}>
              {site.dataStatus === "reviewed" ? copy.reviewed : copy.mapped}
            </span>
          </div>
          <p className="research-location">
            <MapPin size={15} aria-hidden="true" />
            {[site.locality, site.canton].filter(Boolean).join(" · ") || copy.region}
          </p>
          <h1>{site.name}</h1>
          <p>{site.summary}</p>
        </div>
        <div className="coordinate-panel">
          {site.kind === "launch" ? <Mountain aria-hidden="true" /> : <Flag aria-hidden="true" />}
          <small>{"Mapped coordinate"}</small>
          <strong>{site.latitude.toFixed(5)}° N</strong>
          <strong>{site.longitude.toFixed(5)}° E</strong>
          <span>{"Not for navigation"}</span>
        </div>
      </header>

      <div className="research-layout">
        <main>
          {site.dataStatus === "mapped" ? (
            <section className="mapped-banner">
              <AlertTriangle aria-hidden="true" />
              <div>
                <strong>{copy.mapped}</strong>
                <p>{copy.mappedExplanation}</p>
              </div>
            </section>
          ) : null}

          <dl className="research-facts">
            <div><dt>{copy.altitude}</dt><dd>{site.elevationM ? `${site.elevationM} m` : copy.notRecorded}</dd></div>
            <div><dt>{copy.directions}</dt><dd>{site.launchDirections.length ? site.launchDirections.join(" · ") : copy.notRecorded}</dd></div>
            <div><dt>{copy.access}</dt><dd>{site.accessType || copy.notRecorded}</dd></div>
            <div><dt>{copy.checked}</dt><dd>{site.reviewedAt}</dd></div>
          </dl>

          <section className="research-section">
            <span>{"Research note"}</span>
            <h2>{"What this record establishes."}</h2>
            <p>{site.researchNote || site.summary}</p>
            {site.terrain || site.accessDetail ? (
              <div className="research-notes-grid">
                {site.terrain ? <div><strong>{"Terrain"}</strong><p>{site.terrain}</p></div> : null}
                {site.accessDetail ? <div><strong>{"Access detail"}</strong><p>{site.accessDetail}</p></div> : null}
              </div>
            ) : null}
          </section>

          {site.launchSections?.length ? (
            <section className="research-section launch-sections">
              <span>{"Launch sections"}</span>
              <h2>{"One launch area, direction-specific sections."}</h2>
              <p>{"These are named parts of the Niederbauen launch area, not separate flying sites. Shared access, landings, airspace, and general cautions above still apply."}</p>
              <div className="launch-sections__list">
                {site.launchSections.map((section) => (
                  <details key={section.id} className="launch-section">
                    <summary>
                      <span>
                        <strong>{section.name}</strong>
                        <small>{section.windDirections.preferred.length ? `Preferred: ${section.windDirections.preferred.join(" · ")}` : "Direction not recorded"}</small>
                      </span>
                      <span className="launch-section__summary-end">
                        {section.evidenceStatus === "historical" ? <em>{"Historical detail"}</em> : null}
                        <ChevronDown aria-hidden="true" size={18} />
                      </span>
                    </summary>
                    <div className="launch-section__body">
                      <p>{section.description}</p>
                      {section.windDirections.acceptable.length ? <p><strong>{"Also recorded:"}</strong>{` ${section.windDirections.acceptable.join(" · ")}`}</p> : null}
                      {section.evidenceNote ? <p className="launch-section__evidence"><strong>{"Evidence note:"}</strong>{` ${section.evidenceNote}`}</p> : null}
                      {section.cautions.length ? (
                        <ul className="caution-list">
                          {section.cautions.map((caution) => <li key={caution}><AlertTriangle size={17} aria-hidden="true" /> {caution}</li>)}
                        </ul>
                      ) : null}
                      <p className="launch-section__source">
                        {section.source.url ? <a href={section.source.url} target="_blank" rel="noreferrer">{section.source.label}</a> : section.source.label}
                        {section.source.reviewedAt ? ` · reviewed ${section.source.reviewedAt}` : null}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="research-section">
            <span>{copy.knownCautions}</span>
            <h2>{"Resolve locally before flying."}</h2>
            <ul className="caution-list">
              {(site.cautions.length ? site.cautions : [copy.safety]).map((caution) => (
                <li key={caution}><AlertTriangle size={17} aria-hidden="true" /> {caution}</li>
              ))}
            </ul>
          </section>
        </main>

        <aside className="research-source">
          <Database aria-hidden="true" />
          <span>{copy.source}</span>
          <h2>{site.sourceLabel}</h2>
          <p>{site.sourceKind} · {site.reviewedAt}</p>
          <a href={site.sourceUrl} target="_blank" rel="noreferrer">
            {copy.openSource} <ExternalLink size={15} aria-hidden="true" />
          </a>
          <div>
            <ShieldCheck aria-hidden="true" />
            <strong>{"Not a launch clearance"}</strong>
            <p>{copy.safety}</p>
          </div>
        </aside>
      </div>

      <Link className="research-page__map-link" to={`/`}>
        {"Explore more around the lake"}
        <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}

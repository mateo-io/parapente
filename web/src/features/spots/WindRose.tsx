import { useId } from "react"

import type { WindWindow } from "./types"
import { CENTRE, INNER, OUTER, SIZE, bandPath, polar } from "./windRoseGeometry"

/**
 * A compass rose showing the two bands a pilot actually reasons about: the
 * narrow direction a site is best in, and the wider range it still works in.
 * A live wind bearing is drawn as a needle so the question "does it work right
 * now" is answered by looking, not by reading numbers.
 *
 * Bearings are compass degrees (0 = north, clockwise). SVG angles run
 * counter-clockwise from the positive x axis, hence the -90 offset.
 */

interface WindRoseProps {
  windows: WindWindow[]
  /** Live wind bearing in degrees, or null when no reading is available. */
  windBearing?: number | null
  label?: string
}

const CARDINALS: { label: string; bearing: number }[] = [
  { label: "N", bearing: 0 },
  { label: "E", bearing: 90 },
  { label: "S", bearing: 180 },
  { label: "W", bearing: 270 },
]

export function WindRose({
  windows,
  windBearing,
  label,
}: WindRoseProps) {
  const titleId = useId()
  const preferred = windows.filter((w) => w.quality === "preferred")
  const acceptable = windows.filter((w) => w.quality === "acceptable")

  const preferredLabel = "Preferred"
  const acceptableLabel = "Acceptable"
  const noDataLabel = "No published wind data"

  if (!windows.length) {
    return (
      <div className="wind-rose wind-rose--empty">
        <p>{noDataLabel}</p>
      </div>
    )
  }

  const needle = windBearing == null ? null : polar(windBearing, OUTER + 10)

  return (
    <figure className="wind-rose">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-labelledby={titleId}
        className="wind-rose__svg"
      >
        <title id={titleId}>
          {label ?? ("Wind directions")}
        </title>

        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={OUTER}
          className="wind-rose__plate"
        />

        {acceptable.map((w, i) => (
          <path
            key={`a-${i}`}
            d={bandPath(w.fromDeg, w.toDeg, OUTER, INNER)}
            className="wind-rose__band wind-rose__band--acceptable"
          />
        ))}
        {preferred.map((w, i) => (
          <path
            key={`p-${i}`}
            d={bandPath(w.fromDeg, w.toDeg, OUTER, INNER)}
            className="wind-rose__band wind-rose__band--preferred"
          />
        ))}

        {CARDINALS.map(({ label: name, bearing }) => {
          const at = polar(bearing, OUTER + 17)
          return (
            <text
              key={name}
              x={at.x}
              y={at.y}
              className="wind-rose__cardinal"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {name}
            </text>
          )
        })}

        {needle ? (
          <g className="wind-rose__needle">
            <line
              x1={CENTRE}
              y1={CENTRE}
              x2={needle.x}
              y2={needle.y}
              strokeLinecap="round"
            />
            <circle cx={needle.x} cy={needle.y} r={5} />
          </g>
        ) : null}
      </svg>

      <figcaption className="wind-rose__legend">
        <span className="wind-rose__key wind-rose__key--preferred">
          {preferredLabel}
        </span>
        <span className="wind-rose__key wind-rose__key--acceptable">
          {acceptableLabel}
        </span>
        {windBearing != null ? (
          <span className="wind-rose__key wind-rose__key--now">
            {"Now"} {Math.round(windBearing)}°
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}

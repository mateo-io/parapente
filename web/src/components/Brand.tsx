import { Link, useSearchParams } from "react-router-dom"

export function Brand() {
  const [searchParams] = useSearchParams()
  const lang = searchParams.get("lang")

  // Going home must not silently switch the pilot's language back to English.
  const to = lang ? `/?lang=${encodeURIComponent(lang)}` : "/"

  return (
    <Link className="brand" to={to} aria-label="Parapente home">
      <span className="brand__mark" aria-hidden="true">
        <span />
      </span>
      <span>parapente</span>
    </Link>
  )
}

import { Link } from "react-router-dom"

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Parapente home">
      <span className="brand__mark" aria-hidden="true">
        <span />
      </span>
      <span>parapente</span>
    </Link>
  )
}

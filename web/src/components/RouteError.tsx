import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Link, useRouteError } from "react-router-dom"

export function RouteError() {
  const error = useRouteError()

  if (import.meta.env.DEV) console.error(error)

  return (
    <section className="message-page">
      <span className="message-page__icon">
        <AlertTriangle aria-hidden="true" />
      </span>
      <p className="eyebrow">Route interrupted</p>
      <h1>We lost the lift on that one.</h1>
      <p>Try the Lucerne explorer again. Your filters will be easy to rebuild.</p>
      <Link className="button button--dark" to="/">
        <ArrowLeft size={16} aria-hidden="true" /> Back to explore
      </Link>
    </section>
  )
}

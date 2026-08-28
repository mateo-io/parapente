import { ArrowLeft, MapPinned } from "lucide-react"
import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <section className="message-page">
      <span className="message-page__icon">
        <MapPinned aria-hidden="true" />
      </span>
      <p className="eyebrow">404 · Off the map</p>
      <h1>That ridge is not in this field guide.</h1>
      <p>Return to Lucerne and pick up the trail from there.</p>
      <Link className="button button--dark" to="/">
        <ArrowLeft size={16} aria-hidden="true" /> Back to explore
      </Link>
    </section>
  )
}

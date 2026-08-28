import { ArrowLeft } from "lucide-react"
import { Link, Outlet, useLocation } from "react-router-dom"

import { Brand } from "./Brand"

export function AppShell() {
  const location = useLocation()
  const isMap = location.pathname === "/"

  return (
    <div className={`app-shell${isMap ? " app-shell--map" : ""}`}>
      {!isMap ? (
        <header className="site-header">
          <Brand />
          <Link className="header-back" to="/">
            <ArrowLeft size={15} aria-hidden="true" /> Back to map
          </Link>
        </header>
      ) : null}

      <main className="app-main">
        <Outlet />
      </main>

      {!isMap ? (
        <footer className="site-footer">
          <Brand />
          <p>
            Discovery, not a flight briefing. Verify every site and condition with
            official and local sources before flying.
          </p>
          <span>Lake Lucerne research map · 2026</span>
        </footer>
      ) : null}
    </div>
  )
}

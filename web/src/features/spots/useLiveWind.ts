import { useEffect, useState } from "react"

export interface LiveWind {
  bearingDeg: number
  speedKmh: number
  gustKmh: number | null
  observedAt: string
  provider: string
}

/**
 * Current wind for one point. Returns null until a real reading arrives; the
 * caller must treat null as "unknown", never as calm, and must show
 * `observedAt` so a stale reading is visible as stale.
 */
export function useLiveWind(latitude?: number, longitude?: number) {
  const [wind, setWind] = useState<LiveWind | null>(null)
  const [state, setState] = useState<"idle" | "loading" | "error" | "ready">(
    "idle",
  )

  useEffect(() => {
    if (latitude == null || longitude == null) {
      setWind(null)
      setState("idle")
      return
    }

    const controller = new AbortController()
    setState("loading")

    fetch(`/api/wind?lat=${latitude}&lon=${longitude}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (controller.signal.aborted) return
        const reading = payload?.data ?? null
        setWind(reading)
        setState(reading ? "ready" : "error")
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("error")
      })

    return () => controller.abort()
  }, [latitude, longitude])

  return { wind, state }
}

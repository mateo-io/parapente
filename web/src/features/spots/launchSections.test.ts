import { describe, expect, it } from "vitest"

import { normalizeLaunchSections } from "./launchSections"

describe("normalizeLaunchSections", () => {
  it("keeps complete source-backed launch sections", () => {
    expect(normalizeLaunchSections([{
      id: "north",
      name: "North",
      evidenceStatus: "current",
      description: "Large launch section.",
      windDirections: { preferred: ["N"], acceptable: ["NE"] },
      cautions: ["Avalanche risk."],
      source: { label: "Local school", url: "https://example.test", reviewedAt: "2026-08-30" },
    }])).toEqual([{
      id: "north",
      name: "North",
      evidenceStatus: "current",
      description: "Large launch section.",
      windDirections: { preferred: ["N"], acceptable: ["NE"] },
      cautions: ["Avalanche risk."],
      evidenceNote: undefined,
      source: { label: "Local school", url: "https://example.test", reviewedAt: "2026-08-30" },
    }])
  })

  it("does not expose incomplete operational data", () => {
    expect(normalizeLaunchSections([{ id: "north", name: "North" }, "bad"])).toEqual([])
  })
})

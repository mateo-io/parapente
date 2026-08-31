import { describe, expect, it } from "vitest"

import { DUPLICATE_RADIUS_M, dedupeByProximity, distanceMetres } from "./dedupe"

const zugA = { key: "a", kind: "landing", latitude: 47.150012, longitude: 8.513622, name: "Zug Oberwil", richness: 5 }
const zugB = { key: "b", kind: "landing", latitude: 47.149778, longitude: 8.513618, name: "Oberwil", richness: 4 }
// Real pairs that must stay separate.
const gruob = { key: "gruob", kind: "landing", latitude: 46.9555411, longitude: 8.5204223, name: "Gruob", richness: 3 }
const emmetten = { key: "emmetten", kind: "landing", latitude: 46.95785, longitude: 8.51667, name: "Emmetten", richness: 9 }

describe("distanceMetres", () => {
  it("measures the verified real-world pairs", () => {
    expect(distanceMetres(zugA.latitude, zugA.longitude, zugB.latitude, zugB.longitude))
      .toBeLessThan(40)
    expect(distanceMetres(gruob.latitude, gruob.longitude, emmetten.latitude, emmetten.longitude))
      .toBeGreaterThan(350)
  })
})

describe("dedupeByProximity", () => {
  it("collapses the duplicated Zug Oberwil field and keeps the richer record", () => {
    const groups = dedupeByProximity([zugA, zugB])
    expect(groups).toHaveLength(1)
    expect(groups[0]!.kept.key).toBe("a")
    expect(groups[0]!.merged.map((m) => m.key)).toEqual(["b"])
  })

  it("keeps Gruob and the Emmetten main landing separate", () => {
    const groups = dedupeByProximity([gruob, emmetten])
    expect(groups).toHaveLength(2)
  })

  it("never merges across kinds", () => {
    const launch = { ...zugB, key: "l", kind: "launch" }
    expect(dedupeByProximity([zugA, launch])).toHaveLength(2)
  })

  it("keeps the threshold clear of the nearest real distinct pair", () => {
    expect(DUPLICATE_RADIUS_M).toBeLessThan(350)
    expect(DUPLICATE_RADIUS_M).toBeGreaterThan(40)
  })

  it("keeps two differently named launches on one hill apart", () => {
    // Brienzer Rothorn south-east and north-east are 87 m apart and are
    // genuinely different launches. Distance alone would wrongly merge them.
    const se = { key: "se", kind: "launch", latitude: 46.787, longitude: 8.0455, name: "Brienzer Rothorn Südost", richness: 4 }
    const ne = { key: "ne", kind: "launch", latitude: 46.7877, longitude: 8.0459, name: "Brienzer Rothorn Nordost", richness: 4 }
    expect(distanceMetres(se.latitude, se.longitude, ne.latitude, ne.longitude)).toBeLessThan(150)
    expect(dedupeByProximity([se, ne])).toHaveLength(2)
  })

  it("merges same-named launches that are close together", () => {
    // The two Urmiberg S launches are 72 m apart and identically named.
    const a = { key: "a", kind: "launch", latitude: 47.0121938, longitude: 8.5904216, name: "Urmiberg S", richness: 5 }
    const b = { key: "b", kind: "launch", latitude: 47.0122999, longitude: 8.5913524, name: "Urmiberg S", richness: 3 }
    expect(dedupeByProximity([a, b])).toHaveLength(1)
  })

  it("collapses a chain of near points into one group", () => {
    const mid = { key: "m", kind: "landing", latitude: 47.1499, longitude: 8.51362, name: "Oberwil", richness: 1 }
    expect(dedupeByProximity([zugA, mid, zugB])).toHaveLength(1)
  })
})

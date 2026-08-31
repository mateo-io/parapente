/**
 * Parser for SHV/FSVL flying-area information sheets.
 *
 * The sheets are map posters with a text layer, so the extracted text is
 * fragmented label soup rather than clean prose. Fields are therefore matched
 * individually and anything unrecognised is left out rather than guessed at:
 * this is safety-critical data from the governing body, and a wrong wind
 * direction or a missed landing ban is worse than a missing one.
 */

export interface SheetSite {
  label?: string
  name: string
  elevationM?: number
  latitude?: number
  longitude?: number
}

export interface SheetFacts {
  areaName?: string
  publishedOn?: string
  launches: SheetSite[]
  landings: SheetSite[]
  windDirection?: string
  difficulty?: "easy" | "medium" | "hard"
  activeSeason?: string
  access?: string
  wingTypes: string[]
  notes: string[]
  radioFrequencies: string[]
}

const DIFFICULTY: Record<string, "easy" | "medium" | "hard"> = {
  leicht: "easy",
  einfach: "easy",
  mittel: "medium",
  schwer: "hard",
  schwierig: "hard",
}

/** `Name 1 Klewenalp, 1599 m` or `A Schützenhaus, 485 m`. */
const SITE_LINE = /(?:^|\s)([0-9A-Z])?\s*([A-ZÄÖÜ][\wÄÖÜäöüß.'/ -]{2,40}?),\s*(\d{3,4})\s*m\b/g

/** `Koordinaten 46.9403, 8.4760` and the tabular `Name 46.9403, 8.476`. */
const COORD = /(-?\d{2}\.\d{3,7})\s*,\s*(-?\d{1,2}\.\d{3,7})/g

export function parseSheet(text: string): SheetFacts {
  const flat = text.replace(/\s+/g, " ")

  const facts: SheetFacts = {
    launches: [],
    landings: [],
    wingTypes: [],
    notes: [],
    radioFrequencies: [],
  }

  facts.areaName = flat.match(/Fluggebiet\s+([\wÄÖÜäöüß.\- ]{3,40}?)(?=\s{2}|\s[A-Z]{2,}|$)/)?.[1]?.trim()

  const created = flat.match(/Erstellt am (\d{4})-(\d{2})-(\d{2})/)
  if (created) facts.publishedOn = `${created[1]}-${created[2]}-${created[3]}`

  const wind = flat.match(/Windrichtung\s+([NSEWO][NSEWO\-–/ ]{0,12}?)(?=\s+[A-ZÄÖÜ][a-zäöü]|$)/)
  if (wind) facts.windDirection = wind[1]!.trim()

  const diff = flat.match(/Schwierigkeit\s+([A-Za-zäöü]+)/)
  const mapped = diff && DIFFICULTY[diff[1]!.toLowerCase()]
  if (mapped) facts.difficulty = mapped

  const season = flat.match(/Aktiv\s+([A-Za-zäöü]{3,10}\s*[-–]\s*[A-Za-zäöü]{3,10})/)
  if (season) facts.activeSeason = season[1]!.replace(/\s*[-–]\s*/, "-")

  const access = flat.match(/Zugang\s+([^]{5,160}?)(?=\s+Aktiv|\s+Besonderheiten|\s+Kategorie|$)/)
  if (access) facts.access = access[1]!.trim()

  if (/Gleitschirm/i.test(flat)) facts.wingTypes.push("paraglider")
  if (/Delta|Hängegleiter/i.test(flat)) facts.wingTypes.push("hangglider")

  const special = flat.match(/Besonderheiten\s+([^]{5,300}?)(?=\s+Zusatzinformationen|\s+LANDEPL|\s+STARTPL|$)/)
  if (special) facts.notes.push(special[1]!.trim())

  for (const m of flat.matchAll(/\b1[12]\d\.\d{2,3}\b/g)) {
    if (!facts.radioFrequencies.includes(m[0])) facts.radioFrequencies.push(m[0])
  }

  // Named points with an altitude, split by which section they appear in.
  const startIdx = flat.indexOf("STARTPL")
  const landIdx = flat.indexOf("LANDEPL")

  for (const m of flat.matchAll(SITE_LINE)) {
    const at = m.index ?? 0
    const site: SheetSite = {
      label: m[1],
      name: m[2]!.trim(),
      elevationM: Number(m[3]),
    }
    if (/^(Massstab|Erstellt|Koordinaten|Kategorie)/i.test(site.name)) continue

    const isLanding = landIdx >= 0 && at > landIdx && (startIdx < 0 || landIdx > startIdx)
    if (isLanding) facts.landings.push(site)
    else facts.launches.push(site)
  }

  // Attach coordinates positionally: the sheets list them in the same order.
  const coords = [...flat.matchAll(COORD)].map((m) => ({
    latitude: Number(m[1]),
    longitude: Number(m[2]),
  }))
  const swiss = coords.filter(
    (c) => c.latitude > 45.5 && c.latitude < 48 && c.longitude > 5.5 && c.longitude < 10.6,
  )

  const all = [...facts.launches, ...facts.landings]
  for (const [i, site] of all.entries()) {
    const coord = swiss[i]
    if (coord) Object.assign(site, coord)
  }

  return facts
}

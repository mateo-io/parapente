/**
 * OpenStreetMap names for flying sites usually repeat the category the point
 * already carries: "Gleitschirm Landeplatz Rübi" is a landing called Rübi. The
 * kind is shown by the marker and the filters, so the stored name keeps only
 * the part that identifies the place.
 */

/** Category words, longest first so multi-word prefixes match before their parts. */
// Wing types (Delta, Hängegleiter) are deliberately NOT listed: they identify
// which aircraft a site is for and often tell two launches on one hill apart.
const CATEGORY_TERMS = [
  "gleitschirm-startplatz",
  "gleitschirm-landeplatz",
  "gleitschirm startplatz",
  "gleitschirm landeplatz",
  "aussenlandeplatz",
  "notlandeplatz",
  "hauptlandeplatz",
  "offizieller landeplatz",
  "landeplatz",
  "startplatz",
  "gleitschirm",
  "paragliding take-off",
  "paragliding takeoff",
  "paragliding landing",
  "take-off",
  "takeoff",
  "landing",
  "launch",
]

/**
 * German and English compass tokens that trail a category word, as in
 * "Startplatz SO-SW". The bearing belongs in the wind model, not the name.
 */
const COMPASS_TAIL =
  /[\s(]*\b(?:[NSEWO]{1,3}|N[OEW]|S[OEW])(?:\s*[-–/]\s*(?:[NSEWO]{1,3}|N[OEW]|S[OEW]))*\b[\s)]*$/i

function stripCategoryTerms(value: string) {
  let result = value

  for (const term of CATEGORY_TERMS) {
    // Remove the term wherever it appears as a whole word, not only as a prefix,
    // so "Hofstetter Gummen Startplatz S" and "Landeplatz Goldau" both reduce.
    const pattern = new RegExp(
      `(^|[\\s(·,-])${term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(?=$|[\\s)·,-])`,
      "gi",
    )
    result = result.replace(pattern, "$1")
  }

  return result
}

function tidy(value: string) {
  return value
    .replace(/\(\s*\)/g, " ")
    .replace(/\s*[·,-]\s*$/g, "")
    .replace(/^\s*[·,-]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

/**
 * Returns the identifying part of a raw site name, or undefined when the raw
 * name was nothing but category words and there is no place left to show.
 */
/**
 * Splits a raw name into the identifying part and the compass qualifier that
 * was removed. Several launches often share one hill and are told apart only by
 * that bearing, so the caller can put it back when the bare name collides.
 */
export function splitSiteName(rawName: string): {
  name: string | undefined
  qualifier: string | undefined
} {
  if (!rawName.trim()) return { name: undefined, qualifier: undefined }

  const withoutCategory = tidy(stripCategoryTerms(rawName))
  const match = withoutCategory.match(COMPASS_TAIL)
  const qualifier = match?.[0]?.replace(/[\s()]/g, "") || undefined
  const name = cleanSiteName(rawName)

  return { name, qualifier }
}

export function cleanSiteName(rawName: string): string | undefined {
  if (!rawName.trim()) return undefined

  let result = tidy(stripCategoryTerms(rawName))
  result = tidy(result.replace(COMPASS_TAIL, ""))

  // A name that was only category words leaves nothing identifying behind.
  if (!result || !/[a-zà-öø-ÿ]/i.test(result)) return undefined

  return result
}

/**
 * Resolves the name to store. Falls back to the locality, then to a stable
 * label, so a point whose OSM name carried no place is still addressable.
 */
export function resolveSiteName(
  rawName: string,
  locality: string | null | undefined,
  fallback: string,
): string {
  return cleanSiteName(rawName) || tidy(locality ?? "") || fallback
}

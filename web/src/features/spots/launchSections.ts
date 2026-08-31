import type { LaunchSection, LaunchSectionSource } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function source(value: unknown): LaunchSectionSource | undefined {
  if (!isRecord(value) || typeof value.label !== "string") return undefined

  return {
    label: value.label,
    url: typeof value.url === "string" ? value.url : undefined,
    reviewedAt: typeof value.reviewedAt === "string" ? value.reviewedAt : undefined,
  }
}

function evidenceStatus(value: unknown): LaunchSection["evidenceStatus"] {
  return value === "current" || value === "corroborated" || value === "historical"
    ? value
    : undefined
}

/**
 * The API boundary receives JSONB as unknown data. Discard malformed entries
 * rather than showing a partial operational instruction as site fact.
 */
export function normalizeLaunchSections(value: unknown): LaunchSection[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((section) => {
    if (!isRecord(section) || typeof section.id !== "string" || typeof section.name !== "string" || typeof section.description !== "string") {
      return []
    }

    const directions = isRecord(section.windDirections)
      ? {
          preferred: strings(section.windDirections.preferred),
          acceptable: strings(section.windDirections.acceptable),
        }
      : { preferred: [], acceptable: [] }
    const sectionSource = source(section.source)

    if (!sectionSource) return []

    return [{
      id: section.id,
      name: section.name,
      evidenceStatus: evidenceStatus(section.evidenceStatus),
      description: section.description,
      windDirections: directions,
      cautions: strings(section.cautions),
      evidenceNote: typeof section.evidenceNote === "string" ? section.evidenceNote : undefined,
      source: sectionSource,
    }]
  })
}

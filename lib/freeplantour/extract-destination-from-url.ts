import { isSupportedLocale } from './locales'

// Minor connector words that stay lowercase when they are not the first
// word of a humanized destination name (e.g. "miranda-de-ebro" -> "Miranda
// de Ebro", but "la-rioja" -> "La Rioja" since "la" is the first word).
const MINOR_WORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'el',
  'du',
  'des',
  'le',
  'les',
  'en',
  'y',
  'e',
  'da',
  'do',
  'das',
  'dos',
  'di',
  'von',
  'van',
  'and',
  'und',
  'et'
])

// Trip-itinerary slug patterns, one per supported source language. Each
// captures the destination slug that follows the "N-day trip to" phrasing.
// The day-count and singular/plural forms are matched generically so
// counts beyond the CLAUDE.md examples (1/2/3 days) still resolve.
const TRIP_PATTERNS: RegExp[] = [
  // Spanish: viaje-de-3-dias-a-, viaje-de-1-dia-a-
  /^viaje-de-\d+-dias?-a-(.+)$/,
  // English: 3-day-trip-to-, 1-day-trip-to-
  /^\d+-day-trip-to-(.+)$/,
  // French: voyage-de-3-jours-a-
  /^voyage-de-\d+-jours?-a-(.+)$/,
  // Portuguese: viagem-de-3-dias-para-
  /^viagem-de-\d+-dias?-para-(.+)$/,
  // Italian: viaggio-di-3-giorni-a-
  /^viaggio-di-\d+-giorni-a-(.+)$/,
  // German: 3-tage-reise-nach-
  /^\d+-tage-reise-nach-(.+)$/
]

function extractTripDestinationSlug(slug: string): string | null {
  for (const pattern of TRIP_PATTERNS) {
    const match = slug.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  return null
}

function humanizeSlug(slug: string): string | null {
  const cleaned = slug.trim().replace(/^-+|-+$/g, '')
  if (!cleaned) return null

  const words = cleaned.split('-').filter(Boolean)
  if (words.length === 0) return null

  return words
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (index > 0 && MINOR_WORDS.has(lower)) {
        return lower
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

/**
 * Extracts a human-readable destination name from a FreePlanTour URL
 * pathname, e.g. "/es/miranda-de-ebro" -> "Miranda de Ebro", or
 * "/en/1780650079749/3-day-trip-to-miranda-de-ebro" -> "Miranda de Ebro".
 *
 * Returns null when the pathname does not contain a destination segment
 * (e.g. "/", "/es", or "/es/12345" with no trailing slug).
 */
export function extractDestinationFromUrl(pathname: string): string | null {
  if (!pathname) return null

  const cleanPath = pathname.split('?')[0]?.split('#')[0] ?? ''
  const segments = cleanPath.split('/').filter(Boolean)
  if (segments.length === 0) return null

  let index = 0
  if (isSupportedLocale(segments[0])) {
    index += 1
  }

  if (segments[index] && /^\d+$/.test(segments[index])) {
    index += 1
  }

  const slug = segments[index]
  if (!slug) return null

  const tripDestinationSlug = extractTripDestinationSlug(slug)
  return humanizeSlug(tripDestinationSlug ?? slug)
}

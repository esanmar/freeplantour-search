import {
  extractDestinationFromUrl,
  extractItineraryIdFromUrl
} from './extract-destination-from-url'
import { extractLocaleFromUrl } from './language'
import { FreePlanTourExplicitParams } from './parse-query-params'

export type ResolvedFreePlanTourContext = {
  destination?: string
  locale?: string
  itineraryId?: string
  currentUrl?: string
}

function pathnameOf(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url).pathname
  } catch {
    // Not an absolute URL (e.g. already a bare pathname) — use as-is.
    return url
  }
}

/**
 * Resolves the assistant's destination/locale/itinerary/source-URL context,
 * preferring explicit query parameters and falling back to parsing a URL
 * (the page the assistant is embedded in, or the page it was linked from)
 * for whichever fields the explicit parameters didn't provide. Generic —
 * only assumes the FreePlanTour URL *shape* (/{locale}/{itineraryId}/{slug}),
 * never a specific domain.
 */
export function resolveFreePlanTourContext(params: {
  explicit?: FreePlanTourExplicitParams
  fallbackUrl?: string
}): ResolvedFreePlanTourContext {
  const { explicit, fallbackUrl } = params
  const fallbackPath = pathnameOf(fallbackUrl)

  return {
    destination:
      explicit?.destination ??
      extractDestinationFromUrl(fallbackPath) ??
      undefined,
    locale:
      explicit?.language ?? extractLocaleFromUrl(fallbackPath) ?? undefined,
    itineraryId:
      explicit?.itineraryId ??
      extractItineraryIdFromUrl(fallbackPath) ??
      undefined,
    currentUrl: explicit?.sourceUrl ?? fallbackUrl ?? undefined
  }
}

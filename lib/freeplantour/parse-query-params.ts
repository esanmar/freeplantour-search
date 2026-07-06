/**
 * The four query parameters a host page can append to hand off context to
 * the assistant explicitly, e.g.
 * "?destination=Miranda%20de%20Ebro&language=es&itineraryId=1780650079749&sourceUrl=https://...".
 * This is the "preferred" method — generic, works regardless of the host
 * page's own URL shape — and always wins over URL-based fallback parsing
 * when present.
 */
export type FreePlanTourExplicitParams = {
  destination?: string
  language?: string
  itineraryId?: string
  sourceUrl?: string
}

/** The shape Next.js's async `searchParams` page prop resolves to. */
export type NextSearchParams = Record<string, string | string[] | undefined>

function clean(value: string | undefined | null): string | undefined {
  return value && value.trim() ? value : undefined
}

function getParam(
  params: URLSearchParams | NextSearchParams,
  key: string
): string | undefined {
  if (params instanceof URLSearchParams) {
    return clean(params.get(key))
  }
  const value = params[key]
  return clean(Array.isArray(value) ? value[0] : value)
}

/**
 * Reads the explicit context query parameters from a query string, a
 * URLSearchParams instance (client-side, `window.location.search`), or
 * Next.js's parsed `searchParams` page prop (server-side). Missing/empty
 * parameters resolve to undefined rather than an empty string, so callers
 * can cleanly fall back to URL parsing per field.
 */
export function parseFreePlanTourQueryParams(
  search: string | URLSearchParams | NextSearchParams
): FreePlanTourExplicitParams {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search

  return {
    destination: getParam(params, 'destination'),
    language: getParam(params, 'language'),
    itineraryId: getParam(params, 'itineraryId'),
    sourceUrl: getParam(params, 'sourceUrl')
  }
}

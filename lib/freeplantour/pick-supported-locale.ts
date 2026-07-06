import { isSupportedLocale } from './locales'

/**
 * Returns the first candidate that resolves to a supported locale code,
 * trying each in order (e.g. explicit param, URL-derived locale, browser
 * language). Candidates may be full language tags (e.g. "es-ES"); only the
 * primary subtag is compared. Returns undefined when none match.
 */
export function pickSupportedLocale(
  ...candidates: (string | null | undefined)[]
): string | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue
    const primary = candidate.split('-')[0]?.toLowerCase()
    if (primary && isSupportedLocale(primary)) {
      return primary
    }
  }
  return undefined
}

/**
 * Parses an HTTP `Accept-Language` header into an ordered list of primary
 * language tags (ignoring q-values — order in the header already reflects
 * preference), e.g. "es-ES,es;q=0.9,en;q=0.8" -> ["es-ES", "es", "en"].
 */
export function parseAcceptLanguageHeader(header?: string | null): string[] {
  if (!header) return []
  return header
    .split(',')
    .map(part => part.split(';')[0]?.trim())
    .filter((value): value is string => Boolean(value))
}

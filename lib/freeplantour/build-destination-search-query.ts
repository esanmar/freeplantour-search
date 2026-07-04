// Locales whose search phrasing reads more naturally with the destination
// prepended (no connector word) rather than appended with an "in"-style
// connector, e.g. "Miranda de Ebro 子供 観光" rather than
// "子供 in Miranda de Ebro".
const PREPEND_LOCALES = new Set(['ja', 'zh', 'tw', 'ko'])

// Locale-appropriate connector word meaning "in"/"at", used when appending
// the destination to the end of the query.
const CONNECTOR_BY_LOCALE: Record<string, string> = {
  es: 'en',
  en: 'in',
  fr: 'à',
  de: 'in',
  it: 'a',
  pt: 'em',
  ca: 'a',
  eu: 'in',
  ga: 'in',
  ru: 'в',
  ar: 'في',
  hi: 'में'
}

/**
 * Makes a search query destination-aware: ensures the destination name is
 * present in the query text, so the search provider never runs a generic,
 * destination-less search for a query like "restaurantes" or "what to see
 * in one day".
 *
 * This is a deterministic safety net, not the primary mechanism for query
 * quality — the researcher's system prompt already instructs the model to
 * phrase destination-aware queries itself (and to enrich them naturally,
 * e.g. "restaurantes" -> "mejores restaurantes en Miranda de Ebro", or
 * extracting keywords for CJK queries). This function guarantees the
 * destination is present even if the model's query omits it, without
 * duplicating it when the model already included it.
 */
export function buildDestinationSearchQuery(params: {
  userMessage: string
  destination: string
  locale?: string
}): string {
  const userMessage = params.userMessage.trim()
  const destination = params.destination.trim()

  if (!destination) return userMessage
  if (!userMessage) return destination

  const alreadyIncludesDestination = userMessage
    .toLowerCase()
    .includes(destination.toLowerCase())
  if (alreadyIncludesDestination) return userMessage

  const lang = params.locale?.toLowerCase()

  if (lang && PREPEND_LOCALES.has(lang)) {
    return `${destination} ${userMessage}`
  }

  const connector = (lang && CONNECTOR_BY_LOCALE[lang]) || 'in'
  return `${userMessage} ${connector} ${destination}`
}

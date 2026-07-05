import { isSupportedLocale } from './locales'

// Human-readable language names for the page-locale fallback line in the
// system prompt. Note: "ga" is used here for Galician per the FreePlanTour
// URL scheme (paired with "eu" Basque and "ca" Catalan as Spain's other
// co-official languages), even though ISO 639-1 assigns "ga" to Irish and
// "gl" to Galician — the URL locale segment is FreePlanTour's own scheme,
// not raw ISO codes.
const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ca: 'Catalan',
  eu: 'Basque',
  ga: 'Galician',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  tw: 'Chinese (Traditional)',
  hi: 'Hindi',
  ar: 'Arabic',
  ru: 'Russian'
}

/**
 * Extracts the page locale from a FreePlanTour URL pathname, e.g.
 * "/es/miranda-de-ebro" -> "es". Returns null when the first path segment
 * isn't one of FreePlanTour's supported locale codes.
 */
export function extractLocaleFromUrl(pathname: string): string | null {
  if (!pathname) return null

  const cleanPath = pathname.split('?')[0]?.split('#')[0] ?? ''
  const [firstSegment] = cleanPath.split('/').filter(Boolean)
  if (!firstSegment) return null

  const lower = firstSegment.toLowerCase()
  return isSupportedLocale(lower) ? lower : null
}

/**
 * Builds the language-handling instruction block for the travel system
 * prompt. Detection itself is delegated to the model (LLMs are reliable at
 * identifying the language of a short message); this only encodes the
 * priority rules from CLAUDE.md: latest user message language first, page
 * locale as a fallback when unclear, English as the last resort, and never
 * overriding a clearly-different user language with the page locale.
 */
export function getLanguageInstruction(locale?: string): string {
  const pageLanguageName = locale
    ? LANGUAGE_NAMES[locale.toLowerCase()]
    : undefined

  const fallbackLine =
    pageLanguageName && locale
      ? `If the language is unclear, respond using the page locale: ${pageLanguageName} ("${locale.toLowerCase()}"). If both are unclear, respond in English.`
      : 'If the language is unclear, respond in English.'

  return `Language:
- Always respond in the same language as the latest user message.
- ${fallbackLine}
- Never force the response into the page locale when the user has clearly written in a different language.
- If the user switches language mid-conversation, continue in the new language from that point on.`
}

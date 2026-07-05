// Locale segments FreePlanTour uses as the first path segment on
// destination pages, e.g. /es/miranda-de-ebro, /ja/miranda-de-ebro.
// Shared between the destination extractor and the locale/language helper
// so the two never drift apart.
export const SUPPORTED_LOCALES = [
  'es',
  'en',
  'fr',
  'de',
  'it',
  'pt',
  'ca',
  'eu',
  'ga',
  'ja',
  'ko',
  'zh',
  'tw',
  'hi',
  'ar',
  'ru'
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES)

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALE_SET.has(value.toLowerCase())
}

import { describe, expect, it } from 'vitest'

import {
  parseAcceptLanguageHeader,
  pickSupportedLocale
} from './pick-supported-locale'

describe('pickSupportedLocale', () => {
  it('picks the first supported candidate', () => {
    expect(pickSupportedLocale(undefined, 'xx', 'es')).toBe('es')
  })

  it('matches only the primary subtag of a full language tag', () => {
    expect(pickSupportedLocale('es-ES')).toBe('es')
  })

  it('returns undefined when nothing matches', () => {
    expect(pickSupportedLocale('xx', 'yy-ZZ', null, undefined)).toBeUndefined()
  })

  it('prefers earlier candidates over later ones', () => {
    expect(pickSupportedLocale('en', 'es')).toBe('en')
  })
})

describe('parseAcceptLanguageHeader', () => {
  it('extracts primary tags in order, ignoring q-values', () => {
    expect(parseAcceptLanguageHeader('es-ES,es;q=0.9,en;q=0.8')).toEqual([
      'es-ES',
      'es',
      'en'
    ])
  })

  it('returns an empty array for a missing header', () => {
    expect(parseAcceptLanguageHeader(null)).toEqual([])
    expect(parseAcceptLanguageHeader(undefined)).toEqual([])
  })
})

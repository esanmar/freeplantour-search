import { describe, expect, it } from 'vitest'

import { extractLocaleFromUrl, getLanguageInstruction } from './language'

describe('extractLocaleFromUrl', () => {
  it('extracts the Spanish locale', () => {
    expect(extractLocaleFromUrl('/es/miranda-de-ebro')).toBe('es')
  })

  it('extracts the English locale', () => {
    expect(extractLocaleFromUrl('/en/bilbao')).toBe('en')
  })

  it('extracts the French locale', () => {
    expect(extractLocaleFromUrl('/fr/ezcaray')).toBe('fr')
  })

  it('extracts the Japanese locale', () => {
    expect(extractLocaleFromUrl('/ja/miranda-de-ebro')).toBe('ja')
  })

  it('extracts the Chinese locale', () => {
    expect(extractLocaleFromUrl('/zh/miranda-de-ebro')).toBe('zh')
  })

  it('extracts the Basque locale', () => {
    expect(extractLocaleFromUrl('/eu/bilbao')).toBe('eu')
  })

  it('extracts the Catalan locale', () => {
    expect(extractLocaleFromUrl('/ca/bilbao')).toBe('ca')
  })

  it('extracts the Galician locale', () => {
    expect(extractLocaleFromUrl('/ga/bilbao')).toBe('ga')
  })

  it('extracts the Portuguese locale', () => {
    expect(
      extractLocaleFromUrl(
        '/pt/1780650079749/viagem-de-3-dias-para-miranda-de-ebro'
      )
    ).toBe('pt')
  })

  it('extracts the Italian locale', () => {
    expect(
      extractLocaleFromUrl(
        '/it/1780650079749/viaggio-di-3-giorni-a-miranda-de-ebro'
      )
    ).toBe('it')
  })

  it('extracts the German locale', () => {
    expect(
      extractLocaleFromUrl('/de/1780650079749/3-tage-reise-nach-miranda-de-ebro')
    ).toBe('de')
  })

  it('is case-insensitive', () => {
    expect(extractLocaleFromUrl('/ES/bilbao')).toBe('es')
  })

  it('returns null when the first segment is not a supported locale', () => {
    expect(extractLocaleFromUrl('/bilbao')).toBeNull()
  })

  it('returns null for the root path', () => {
    expect(extractLocaleFromUrl('/')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractLocaleFromUrl('')).toBeNull()
  })
})

describe('getLanguageInstruction', () => {
  it('always instructs to respond in the latest user message language', () => {
    const instruction = getLanguageInstruction()
    expect(instruction).toContain(
      'Always respond in the same language as the latest user message.'
    )
  })

  it('falls back to English when no locale is given', () => {
    const instruction = getLanguageInstruction()
    expect(instruction).toContain(
      'If the language is unclear, respond in English.'
    )
  })

  it('includes the page locale fallback with the human-readable language name', () => {
    const instruction = getLanguageInstruction('es')
    expect(instruction).toContain('Spanish')
    expect(instruction).toContain('"es"')
  })

  it('includes the Japanese page-locale fallback', () => {
    const instruction = getLanguageInstruction('ja')
    expect(instruction).toContain('Japanese')
  })

  it('never forces the page locale over a clearly different user language', () => {
    const instruction = getLanguageInstruction('es')
    expect(instruction).toContain(
      'Never force the response into the page locale'
    )
  })

  it('instructs to follow the user if they switch language mid-conversation', () => {
    const instruction = getLanguageInstruction('en')
    expect(instruction).toContain('switches language mid-conversation')
  })

  it('falls back to English for an unrecognized locale code', () => {
    const instruction = getLanguageInstruction('xx')
    expect(instruction).toContain('respond in English')
  })
})

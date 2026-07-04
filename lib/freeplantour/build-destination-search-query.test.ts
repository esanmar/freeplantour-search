import { describe, expect, it } from 'vitest'

import { buildDestinationSearchQuery } from './build-destination-search-query'

describe('buildDestinationSearchQuery', () => {
  it('appends the destination to an English query with an "in" connector', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'what to see in one day',
        destination: 'Miranda de Ebro',
        locale: 'en'
      })
    ).toBe('what to see in one day in Miranda de Ebro')
  })

  it('appends the destination to a Spanish query with an "en" connector', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'restaurantes',
        destination: 'Miranda de Ebro',
        locale: 'es'
      })
    ).toBe('restaurantes en Miranda de Ebro')
  })

  it('prepends the destination for a Japanese query (no connector word)', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: '子供と何をする',
        destination: 'Miranda de Ebro',
        locale: 'ja'
      })
    ).toBe('Miranda de Ebro 子供と何をする')
  })

  it('prepends the destination for a Chinese query', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: '亲子活动',
        destination: 'Bilbao',
        locale: 'zh'
      })
    ).toBe('Bilbao 亲子活动')
  })

  it('handles a short generic query with no locale (defaults to "in")', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'museums',
        destination: 'Bilbao'
      })
    ).toBe('museums in Bilbao')
  })

  it('does not duplicate the destination when the query already includes it', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'best museums in Bilbao',
        destination: 'Bilbao',
        locale: 'en'
      })
    ).toBe('best museums in Bilbao')
  })

  it('is case-insensitive when checking for an already-included destination', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'best museums in BILBAO',
        destination: 'Bilbao',
        locale: 'en'
      })
    ).toBe('best museums in BILBAO')
  })

  it('returns the trimmed user message unchanged when destination is empty', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: '  museums  ',
        destination: ''
      })
    ).toBe('museums')
  })

  it('returns the destination when the user message is empty', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: '   ',
        destination: 'Bilbao'
      })
    ).toBe('Bilbao')
  })

  it('uses the French connector', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'que faire un jour',
        destination: 'Ezcaray',
        locale: 'fr'
      })
    ).toBe('que faire un jour à Ezcaray')
  })

  it('uses the German connector', () => {
    expect(
      buildDestinationSearchQuery({
        userMessage: 'Museen',
        destination: 'Bilbao',
        locale: 'de'
      })
    ).toBe('Museen in Bilbao')
  })
})

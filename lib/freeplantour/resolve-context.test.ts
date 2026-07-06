import { describe, expect, it } from 'vitest'

import { resolveFreePlanTourContext } from './resolve-context'

describe('resolveFreePlanTourContext', () => {
  it('prefers explicit params over URL fallback parsing', () => {
    const result = resolveFreePlanTourContext({
      explicit: {
        destination: 'Miranda de Ebro',
        language: 'es',
        itineraryId: '1780650079749',
        sourceUrl:
          'https://www.freeplantour.com/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
      },
      fallbackUrl: 'https://www.freeplantour.com/en/999/bilbao'
    })

    expect(result).toEqual({
      destination: 'Miranda de Ebro',
      locale: 'es',
      itineraryId: '1780650079749',
      currentUrl:
        'https://www.freeplantour.com/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
    })
  })

  it('falls back to parsing the URL when no explicit params are given', () => {
    const result = resolveFreePlanTourContext({
      fallbackUrl:
        'https://www.freeplantour.com/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
    })

    expect(result).toEqual({
      destination: 'Miranda de Ebro',
      locale: 'es',
      itineraryId: '1780650079749',
      currentUrl:
        'https://www.freeplantour.com/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
    })
  })

  it('fills in only the missing fields from the URL fallback', () => {
    const result = resolveFreePlanTourContext({
      explicit: { destination: 'Custom Name' },
      fallbackUrl:
        'https://www.freeplantour.com/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
    })

    expect(result.destination).toBe('Custom Name')
    expect(result.locale).toBe('es')
    expect(result.itineraryId).toBe('1780650079749')
  })

  it('returns all-undefined fields when nothing is available', () => {
    expect(resolveFreePlanTourContext({})).toEqual({
      destination: undefined,
      locale: undefined,
      itineraryId: undefined,
      currentUrl: undefined
    })
  })

  it('accepts a bare pathname (no origin) as the fallback URL', () => {
    const result = resolveFreePlanTourContext({
      fallbackUrl: '/es/miranda-de-ebro'
    })

    expect(result.destination).toBe('Miranda de Ebro')
    expect(result.locale).toBe('es')
  })
})

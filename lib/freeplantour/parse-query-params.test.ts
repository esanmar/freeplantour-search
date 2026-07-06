import { describe, expect, it } from 'vitest'

import { parseFreePlanTourQueryParams } from './parse-query-params'

describe('parseFreePlanTourQueryParams', () => {
  it('reads all four explicit params from a query string', () => {
    const result = parseFreePlanTourQueryParams(
      '?destination=Miranda%20de%20Ebro&language=es&itineraryId=1780650079749&sourceUrl=https%3A%2F%2Fwww.freeplantour.com%2Fes%2F1780650079749%2Fviaje-de-3-dias-a-miranda-de-ebro'
    )

    expect(result).toEqual({
      destination: 'Miranda de Ebro',
      language: 'es',
      itineraryId: '1780650079749',
      sourceUrl:
        'https://www.freeplantour.com/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
    })
  })

  it('accepts a URLSearchParams instance directly', () => {
    const params = new URLSearchParams({ destination: 'Bilbao' })
    expect(parseFreePlanTourQueryParams(params).destination).toBe('Bilbao')
  })

  it('returns undefined fields when params are missing', () => {
    expect(parseFreePlanTourQueryParams('')).toEqual({
      destination: undefined,
      language: undefined,
      itineraryId: undefined,
      sourceUrl: undefined
    })
  })

  it('treats an empty param value as missing', () => {
    expect(
      parseFreePlanTourQueryParams('?destination=').destination
    ).toBeUndefined()
  })

  it("accepts Next.js's parsed searchParams object shape", () => {
    const result = parseFreePlanTourQueryParams({
      destination: 'Bilbao',
      language: ['es', 'en'],
      other: 'ignored'
    })
    expect(result.destination).toBe('Bilbao')
    expect(result.language).toBe('es')
    expect(result.itineraryId).toBeUndefined()
  })
})

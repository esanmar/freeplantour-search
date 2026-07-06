import { describe, expect, it } from 'vitest'

import {
  extractDestinationFromUrl,
  extractItineraryIdFromUrl
} from './extract-destination-from-url'

describe('extractDestinationFromUrl', () => {
  it('extracts a simple destination with a Spanish locale prefix', () => {
    expect(extractDestinationFromUrl('/es/miranda-de-ebro')).toBe(
      'Miranda de Ebro'
    )
  })

  it('extracts a simple destination with an English locale prefix', () => {
    expect(extractDestinationFromUrl('/en/bilbao')).toBe('Bilbao')
  })

  it('extracts a simple destination with a French locale prefix', () => {
    expect(extractDestinationFromUrl('/fr/ezcaray')).toBe('Ezcaray')
  })

  it('extracts a destination from a Japanese locale prefix', () => {
    expect(extractDestinationFromUrl('/ja/miranda-de-ebro')).toBe(
      'Miranda de Ebro'
    )
  })

  it('extracts a destination from a Chinese locale prefix', () => {
    expect(extractDestinationFromUrl('/zh/miranda-de-ebro')).toBe(
      'Miranda de Ebro'
    )
  })

  it('handles the Spanish 3-day itinerary URL with a numeric id', () => {
    expect(
      extractDestinationFromUrl(
        '/es/1776191501388/viaje-de-3-dias-a-miranda-de-ebro'
      )
    ).toBe('Miranda de Ebro')
  })

  it('handles the English 3-day-trip itinerary URL with a numeric id', () => {
    expect(
      extractDestinationFromUrl(
        '/en/1780650079749/3-day-trip-to-miranda-de-ebro'
      )
    ).toBe('Miranda de Ebro')
  })

  it('handles the French voyage-de itinerary URL', () => {
    expect(
      extractDestinationFromUrl(
        '/fr/1780650079749/voyage-de-3-jours-a-miranda-de-ebro'
      )
    ).toBe('Miranda de Ebro')
  })

  it('handles the Portuguese viagem-de itinerary URL', () => {
    expect(
      extractDestinationFromUrl(
        '/pt/1780650079749/viagem-de-3-dias-para-miranda-de-ebro'
      )
    ).toBe('Miranda de Ebro')
  })

  it('handles the Italian viaggio-di itinerary URL', () => {
    expect(
      extractDestinationFromUrl(
        '/it/1780650079749/viaggio-di-3-giorni-a-miranda-de-ebro'
      )
    ).toBe('Miranda de Ebro')
  })

  it('handles the German Tage-Reise itinerary URL', () => {
    expect(
      extractDestinationFromUrl(
        '/de/1780650079749/3-tage-reise-nach-miranda-de-ebro'
      )
    ).toBe('Miranda de Ebro')
  })

  it('handles a Spanish 1-day (singular) itinerary slug', () => {
    expect(extractDestinationFromUrl('/es/123/viaje-de-1-dia-a-bilbao')).toBe(
      'Bilbao'
    )
  })

  it('handles a Spanish 2-day itinerary slug', () => {
    expect(extractDestinationFromUrl('/es/456/viaje-de-2-dias-a-bilbao')).toBe(
      'Bilbao'
    )
  })

  it('handles an English 1-day-trip itinerary slug', () => {
    expect(
      extractDestinationFromUrl('/en/789/1-day-trip-to-san-sebastian')
    ).toBe('San Sebastian')
  })

  it('title-cases a two-word destination with no connector words', () => {
    expect(extractDestinationFromUrl('/en/san-sebastian')).toBe('San Sebastian')
  })

  it('capitalizes a leading minor word ("la")', () => {
    expect(extractDestinationFromUrl('/es/la-rioja')).toBe('La Rioja')
  })

  it('lowercases a mid-slug minor word ("de")', () => {
    expect(
      extractDestinationFromUrl('/en/1780650079749/3-day-trip-to-la-rioja')
    ).toBe('La Rioja')
  })

  it('supports the Basque (eu) locale prefix', () => {
    expect(extractDestinationFromUrl('/eu/miranda-de-ebro')).toBe(
      'Miranda de Ebro'
    )
  })

  it('supports the Catalan (ca) locale prefix', () => {
    expect(extractDestinationFromUrl('/ca/bilbao')).toBe('Bilbao')
  })

  it('supports the Galician (ga) locale prefix', () => {
    expect(extractDestinationFromUrl('/ga/bilbao')).toBe('Bilbao')
  })

  it('supports the Korean (ko) locale prefix', () => {
    expect(extractDestinationFromUrl('/ko/bilbao')).toBe('Bilbao')
  })

  it('supports the Hindi (hi) locale prefix', () => {
    expect(extractDestinationFromUrl('/hi/bilbao')).toBe('Bilbao')
  })

  it('supports the Arabic (ar) locale prefix', () => {
    expect(extractDestinationFromUrl('/ar/bilbao')).toBe('Bilbao')
  })

  it('supports the Russian (ru) locale prefix', () => {
    expect(extractDestinationFromUrl('/ru/bilbao')).toBe('Bilbao')
  })

  it('supports the Taiwanese (tw) locale prefix', () => {
    expect(extractDestinationFromUrl('/tw/bilbao')).toBe('Bilbao')
  })

  it('falls back to the raw slug when no trip pattern matches after a numeric id', () => {
    expect(extractDestinationFromUrl('/es/12345/bilbao')).toBe('Bilbao')
  })

  it('is case-insensitive for the locale segment', () => {
    expect(extractDestinationFromUrl('/ES/bilbao')).toBe('Bilbao')
  })

  it('strips a trailing slash', () => {
    expect(extractDestinationFromUrl('/es/bilbao/')).toBe('Bilbao')
  })

  it('strips a query string', () => {
    expect(extractDestinationFromUrl('/es/bilbao?ref=homepage')).toBe('Bilbao')
  })

  it('strips a hash fragment', () => {
    expect(extractDestinationFromUrl('/es/bilbao#section')).toBe('Bilbao')
  })

  it('works without a locale prefix at all', () => {
    expect(extractDestinationFromUrl('/bilbao')).toBe('Bilbao')
  })

  it('returns null for the root path', () => {
    expect(extractDestinationFromUrl('/')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractDestinationFromUrl('')).toBeNull()
  })

  it('returns null for a locale-only path with no destination segment', () => {
    expect(extractDestinationFromUrl('/es')).toBeNull()
    expect(extractDestinationFromUrl('/es/')).toBeNull()
  })

  it('returns null when a numeric id is present but no destination slug follows', () => {
    expect(extractDestinationFromUrl('/es/1776191501388')).toBeNull()
  })
})

describe('extractItineraryIdFromUrl', () => {
  it('extracts the itinerary id after a locale segment', () => {
    expect(
      extractItineraryIdFromUrl(
        '/es/1780650079749/viaje-de-3-dias-a-miranda-de-ebro'
      )
    ).toBe('1780650079749')
  })

  it('extracts the itinerary id with no locale prefix', () => {
    expect(extractItineraryIdFromUrl('/1780650079749/bilbao')).toBe(
      '1780650079749'
    )
  })

  it('returns null when there is no numeric segment', () => {
    expect(extractItineraryIdFromUrl('/es/miranda-de-ebro')).toBeNull()
  })

  it('returns null for the root path', () => {
    expect(extractItineraryIdFromUrl('/')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractItineraryIdFromUrl('')).toBeNull()
  })
})

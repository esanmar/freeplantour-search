import { describe, expect, it } from 'vitest'

import { buildTravelSystemPrompt } from './travel-system-prompt'

describe('buildTravelSystemPrompt', () => {
  it('includes the destination', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Miranda de Ebro' })
    expect(prompt).toContain('Current destination: Miranda de Ebro')
    expect(prompt).toContain('what to see and do in Miranda de Ebro')
  })

  it('includes the current date when provided', () => {
    const prompt = buildTravelSystemPrompt({
      destination: 'Bilbao',
      currentDate: '2026-07-04'
    })
    expect(prompt).toContain('Current date: 2026-07-04')
  })

  it('falls back to today\'s date when currentDate is not provided', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain(`Current date: ${new Date().toLocaleDateString()}`)
  })

  it('falls back to "unknown" for the current URL when not provided', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain('Current page URL: unknown')
  })

  it('includes the current URL when provided', () => {
    const prompt = buildTravelSystemPrompt({
      destination: 'Bilbao',
      currentUrl: 'https://freeplantour.com/en/bilbao'
    })
    expect(prompt).toContain(
      'Current page URL: https://freeplantour.com/en/bilbao'
    )
  })

  it('identifies as FreePlanTour Assistant, not Morphic', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain(
      'You are FreePlanTour Assistant, an AI travel assistant integrated into FreePlanTour.'
    )
    expect(prompt).not.toContain('You are Morphic')
  })

  it('instructs the model never to mention or claim to be Morphic', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain('Do not mention Morphic.')
    expect(prompt).toContain('Do not say you are Morphic.')
  })

  it('includes the language rule', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao', locale: 'es' })
    expect(prompt).toContain(
      'Always respond in the same language as the latest user message.'
    )
    expect(prompt).toContain('Spanish')
  })

  it('includes the freshness rule', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain(
      'Use web search for events, schedules, opening hours, prices, temporary closures, transport updates, restaurants, current recommendations or anything likely to change.'
    )
  })

  it('includes the grounding rule against fabricating citations', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain('Do not fabricate citations.')
  })

  it('includes the scope-redirect rule with the destination interpolated', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).toContain(
      'I can help you better with plans, visits and itineraries in Bilbao.'
    )
  })

  it('omits the internal context block when not provided', () => {
    const prompt = buildTravelSystemPrompt({ destination: 'Bilbao' })
    expect(prompt).not.toContain('FreePlanTour destination content:')
  })

  it('omits the internal context block when it is an empty string', () => {
    const prompt = buildTravelSystemPrompt({
      destination: 'Bilbao',
      internalContextBlock: ''
    })
    expect(prompt).not.toContain('FreePlanTour destination content:')
  })

  it('appends the internal context block when provided', () => {
    const prompt = buildTravelSystemPrompt({
      destination: 'Bilbao',
      internalContextBlock:
        'FreePlanTour destination content:\n- Itinerary: "3 days in Bilbao" — https://freeplantour.com/en/123/3-day-trip-to-bilbao'
    })
    expect(prompt).toContain('FreePlanTour destination content:')
    expect(prompt).toContain('3 days in Bilbao')
  })
})

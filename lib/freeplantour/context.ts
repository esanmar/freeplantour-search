export type DestinationItinerary = {
  title: string
  url: string
  language?: string
  days?: number
}

export type DestinationActivity = {
  title: string
  url?: string
  description?: string
}

export type DestinationContext = {
  destination: string
  summary?: string
  itineraries?: DestinationItinerary[]
  activities?: DestinationActivity[]
}

/**
 * Internal FreePlanTour context layer for a destination. Currently a stub
 * that always returns empty arrays — no fake/hardcoded data is fabricated,
 * per the grounding rules in the travel system prompt. Once connected, the
 * researcher prompt should only include this context when non-empty (see
 * TODO in lib/agents/researcher.ts / travel-system-prompt.ts).
 *
 * TODO: connect to FreePlanTour Firestore/API.
 * TODO: prioritize published itineraries for this destination.
 * TODO: include activities, guides and destination page URLs.
 */
export async function getDestinationContext(params: {
  destination: string
  locale?: string
  /** FreePlanTour itinerary id, when the assistant was opened from a specific itinerary page. */
  itineraryId?: string
}): Promise<DestinationContext> {
  return {
    destination: params.destination,
    itineraries: [],
    activities: []
  }
}

/**
 * Formats a DestinationContext into a prompt-ready block, or an empty
 * string when there's nothing to include — the system prompt should only
 * mention internal FreePlanTour content when it's actually available, never
 * an empty "no content found" section.
 */
export function formatDestinationContextForPrompt(
  context: DestinationContext
): string {
  const itineraries = context.itineraries ?? []
  const activities = context.activities ?? []

  if (!context.summary && itineraries.length === 0 && activities.length === 0) {
    return ''
  }

  const lines: string[] = ['FreePlanTour destination content:']

  if (context.summary) {
    lines.push(`- Summary: ${context.summary}`)
  }
  for (const itinerary of itineraries) {
    const days = itinerary.days ? ` (${itinerary.days} days)` : ''
    lines.push(`- Itinerary: "${itinerary.title}"${days} — ${itinerary.url}`)
  }
  for (const activity of activities) {
    const url = activity.url ? ` — ${activity.url}` : ''
    lines.push(`- Activity: "${activity.title}"${url}`)
  }

  return lines.join('\n')
}

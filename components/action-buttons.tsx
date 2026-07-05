'use client'

import {
  IconBabyCarriage as BabyCarriage,
  IconGift as Gift,
  IconMapPin as MapPin,
  IconRoute as Route,
  IconToolsKitchen2 as ToolsKitchen,
  type TablerIcon
} from '@tabler/icons-react'

import { captureClient } from '@/lib/analytics/posthog-client'
import { cn } from '@/lib/utils'

interface TravelSuggestion {
  icon: TablerIcon
  key: string
  getLabel: (destination?: string) => string
}

// Destination-aware travel suggestions shown in the empty state. Falls back
// to a generic phrasing (no destination name) when none is known yet.
function buildSuggestions(locale?: string): TravelSuggestion[] {
  const isSpanish = locale?.slice(0, 2).toLowerCase() === 'es'

  if (isSpanish) {
    return [
      {
        icon: MapPin,
        key: 'see-one-day',
        getLabel: destination =>
          destination
            ? `¿Qué puedo ver en ${destination} en un día?`
            : '¿Qué puedo ver en un día?'
      },
      {
        icon: Route,
        key: 'itinerary-2-day',
        getLabel: destination =>
          destination
            ? `Hazme una ruta de 2 días por ${destination}`
            : 'Hazme una ruta de 2 días'
      },
      {
        icon: BabyCarriage,
        key: 'with-kids',
        getLabel: destination =>
          destination
            ? `¿Qué puedo hacer con niños en ${destination}?`
            : '¿Qué puedo hacer con niños?'
      },
      {
        icon: Gift,
        key: 'free-plans',
        getLabel: destination =>
          destination
            ? `Planes gratis en ${destination}`
            : 'Planes gratis en este destino'
      },
      {
        icon: ToolsKitchen,
        key: 'restaurants',
        getLabel: destination =>
          destination
            ? `Restaurantes recomendados en ${destination}`
            : 'Restaurantes recomendados'
      }
    ]
  }

  return [
    {
      icon: MapPin,
      key: 'see-one-day',
      getLabel: destination =>
        destination
          ? `What can I see in ${destination} in one day?`
          : 'What can I see in one day?'
    },
    {
      icon: Route,
      key: 'itinerary-2-day',
      getLabel: destination =>
        destination
          ? `Create a 2-day itinerary for ${destination}`
          : 'Create a 2-day itinerary'
    },
    {
      icon: BabyCarriage,
      key: 'with-kids',
      getLabel: destination =>
        destination
          ? `What can I do with kids in ${destination}?`
          : 'What can I do with kids?'
    },
    {
      icon: Gift,
      key: 'free-plans',
      getLabel: destination =>
        destination
          ? `Free things to do in ${destination}`
          : 'Free things to do here'
    },
    {
      icon: ToolsKitchen,
      key: 'restaurants',
      getLabel: destination =>
        destination
          ? `Recommended restaurants in ${destination}`
          : 'Recommended restaurants'
    }
  ]
}

interface ActionButtonsProps {
  onSelectPrompt: (prompt: string) => void
  destination?: string
  locale?: string
  className?: string
}

export function ActionButtons({
  onSelectPrompt,
  destination,
  locale,
  className
}: ActionButtonsProps) {
  const suggestions = buildSuggestions(locale)

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-xl flex-col gap-1 px-2',
        className
      )}
    >
      {suggestions.map(suggestion => {
        const label = suggestion.getLabel(destination)
        const Icon = suggestion.icon
        return (
          <button
            key={suggestion.key}
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
              'transition-colors duration-[140ms] ease-[var(--motion-ease-out)] hover:bg-muted'
            )}
            onClick={() => {
              captureClient('example_prompt_clicked', {
                category: suggestion.key,
                prompt: label
              })
              onSelectPrompt(label)
            }}
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="line-clamp-2">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

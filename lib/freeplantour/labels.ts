export type FreePlanTourLabels = {
  button: string
  empty: string
  closeLabel: string
  placeholder: string
}

// Only English/Spanish fallbacks are hardcoded here per the modal spec.
// Full multilingual response handling (matching the user's message language)
// is implemented at the prompt level, not in this static UI copy.
const LABEL_SETS = {
  en: {
    button: 'Ask about this destination',
    closeLabel: 'Close assistant',
    withDestination: {
      empty: 'Ask me what to see, where to go, or how to plan your visit.',
      placeholder: 'Ask what to see, where to eat, or how to plan your visit'
    },
    withoutDestination: {
      empty:
        "Tell me which destination you're visiting and I'll help you plan your trip.",
      placeholder: 'Which destination are you visiting?'
    }
  },
  es: {
    button: 'Preguntar sobre este destino',
    closeLabel: 'Cerrar asistente',
    withDestination: {
      empty: 'Pregúntame qué ver, dónde ir o cómo planear tu visita.',
      placeholder: 'Pregunta qué ver, dónde comer o cómo organizar tu visita'
    },
    withoutDestination: {
      empty:
        'Dime qué destino estás visitando y te ayudaré a planear tu viaje.',
      placeholder: '¿Qué destino estás visitando?'
    }
  }
} as const

/**
 * Returns the FreePlanTour widget's static UI copy for a given locale,
 * varying the empty-state/placeholder text depending on whether a
 * destination was actually detected — when it wasn't, the copy asks the
 * user which destination they need help with instead of assuming one.
 */
export function getFreePlanTourLabels(
  locale?: string,
  hasDestination = true
): FreePlanTourLabels {
  const lang = locale?.slice(0, 2).toLowerCase()
  const set = lang === 'es' ? LABEL_SETS.es : LABEL_SETS.en
  const variant = hasDestination ? set.withDestination : set.withoutDestination

  return {
    button: set.button,
    closeLabel: set.closeLabel,
    ...variant
  }
}

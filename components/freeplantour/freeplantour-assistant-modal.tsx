'use client'

import { useState } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { IconMessage, IconX } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

import { Chat } from '@/components/chat'

export type FreePlanTourAssistantModalProps = {
  destination?: string
  locale?: string
  currentUrl?: string
  initialOpen?: boolean
  className?: string
}

type Labels = {
  button: string
  empty: string
  closeLabel: string
}

// Only English/Spanish fallbacks are hardcoded here per the modal spec.
// Full multilingual response handling (matching the user's message language)
// is implemented at the prompt level, not in this static UI copy.
const LABELS: Record<'en' | 'es', Labels> = {
  en: {
    button: 'Ask about this destination',
    empty: 'Ask me what to see, where to go, or how to plan your visit.',
    closeLabel: 'Close assistant'
  },
  es: {
    button: 'Preguntar sobre este destino',
    empty: 'Pregúntame qué ver, dónde ir o cómo planear tu visita.',
    closeLabel: 'Cerrar asistente'
  }
}

function getLabels(locale?: string): Labels {
  const lang = locale?.slice(0, 2).toLowerCase()
  return lang === 'es' ? LABELS.es : LABELS.en
}

// The modal deliberately does not mount SidebarProvider/LibraryProvider/
// ArtifactRoot: those wrap children in a forced h-[100dvh] container and add
// sidebar/library/inspector chrome meant for the full app shell, not a
// compact embedded widget. `useArtifact`/`useLibrary` degrade to inert
// no-ops without those providers (see their context files), so <Chat> still
// renders safely standalone here.
export function FreePlanTourAssistantModal({
  destination,
  locale,
  currentUrl,
  initialOpen = false,
  className
}: FreePlanTourAssistantModalProps) {
  const [open, setOpen] = useState(initialOpen)

  const labels = getLabels(locale)
  const triggerLabel = destination
    ? `${labels.button} — ${destination}`
    : labels.button
  const headerTitle = destination
    ? `FreePlanTour · ${destination}`
    : 'FreePlanTour Assistant'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className={cn(
            'fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97] sm:bottom-6 sm:right-6',
            open && 'sr-only',
            className
          )}
        >
          <IconMessage className="size-5" aria-hidden="true" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </button>
      </DialogPrimitive.Trigger>

      {/* forceMount keeps <Chat> mounted while the modal is visually closed,
          so an accidental Escape/backdrop dismiss never drops the
          in-progress conversation (visibility toggled via data-state). */}
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-black/50',
            'data-[state=closed]:hidden',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={e => {
            // Avoid stealing focus into the middle of chat history; let the
            // composer be reached via normal tab order instead.
            e.preventDefault()
          }}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden bg-background shadow-2xl',
            'data-[state=closed]:hidden',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'inset-0',
            'sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(720px,85vh)] sm:w-[min(420px,calc(100vw-3rem))] sm:rounded-xl sm:border'
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <DialogPrimitive.Title className="truncate text-sm font-semibold">
              {headerTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={labels.closeLabel}
              className="rounded-sm p-1.5 text-muted-foreground opacity-80 transition-opacity hover:opacity-100 hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconX className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            {labels.empty}
          </DialogPrimitive.Description>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Chat
              key={`${destination ?? 'unknown-destination'}:${currentUrl ?? ''}`}
              isGuest
              libraryAvailable={false}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

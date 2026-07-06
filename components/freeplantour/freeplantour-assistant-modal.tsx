'use client'

import { useEffect, useState } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { IconMessage, IconX } from '@tabler/icons-react'

import { getFreePlanTourLabels } from '@/lib/freeplantour/labels'
import { parseFreePlanTourQueryParams } from '@/lib/freeplantour/parse-query-params'
import { pickSupportedLocale } from '@/lib/freeplantour/pick-supported-locale'
import { resolveFreePlanTourContext } from '@/lib/freeplantour/resolve-context'
import { cn } from '@/lib/utils'

import { Chat } from '@/components/chat'

export type FreePlanTourAssistantModalProps = {
  destination?: string
  locale?: string
  currentUrl?: string
  itineraryId?: string
  initialOpen?: boolean
  className?: string
}

// The modal deliberately does not mount SidebarProvider/LibraryProvider/
// ArtifactRoot: those wrap children in a forced h-[100dvh] container and add
// sidebar/library/inspector chrome meant for the full app shell, not a
// compact embedded widget. `useArtifact`/`useLibrary` degrade to inert
// no-ops without those providers (see their context files), so <Chat> still
// renders safely standalone here.
export function FreePlanTourAssistantModal({
  destination: destinationProp,
  locale: localeProp,
  currentUrl: currentUrlProp,
  itineraryId: itineraryIdProp,
  initialOpen = false,
  className
}: FreePlanTourAssistantModalProps) {
  const [open, setOpen] = useState(initialOpen)

  // Explicit props always win (a host page may already know the destination
  // from its own data). Otherwise the modal computes it from the current
  // page: first from its own query string (?destination=&language=&
  // itineraryId=&sourceUrl=), then by parsing the URL itself, then — for
  // locale only — the browser's own language. Recomputed on every open/close
  // toggle (not just on mount) as a pragmatic way to pick up client-side
  // navigation between destination pages without wiring up a full
  // router/history listener.
  const [computed, setComputed] = useState<{
    destination?: string
    locale?: string
    currentUrl?: string
    itineraryId?: string
  }>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const resolved = resolveFreePlanTourContext({
      explicit: parseFreePlanTourQueryParams(window.location.search),
      fallbackUrl: window.location.href
    })
    const locale =
      resolved.locale ??
      pickSupportedLocale(navigator.language, ...(navigator.languages ?? []))
    // Deliberately deferred to an effect rather than computed during render:
    // computing this from window.location on the first render would mismatch
    // the server-rendered (window-less) markup and trigger a hydration
    // warning. This runs once after mount, then again on each open/close
    // toggle, updating state exactly once per trigger — not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComputed({ ...resolved, locale })
  }, [open])

  const destination = destinationProp ?? computed.destination
  const locale = localeProp ?? computed.locale
  const currentUrl = currentUrlProp ?? computed.currentUrl
  const itineraryId = itineraryIdProp ?? computed.itineraryId

  const labels = getFreePlanTourLabels(locale, Boolean(destination))
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
              destination={destination}
              locale={locale}
              currentUrl={currentUrl}
              itineraryId={itineraryId}
              emptyStatePlaceholder={labels.placeholder}
              emptyStateHeading={labels.empty}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

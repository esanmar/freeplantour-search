'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type ProcessHeaderProps = {
  label: ReactNode
  meta?: ReactNode
  onInspect?: () => void
  isLoading?: boolean
  ariaExpanded?: boolean
  className?: string
}

export function ProcessHeader({
  label,
  meta,
  onInspect,
  isLoading,
  ariaExpanded,
  className
}: ProcessHeaderProps) {
  const sharedClassName = cn(
    'flex items-center justify-between w-full min-w-0 text-left text-xs text-muted-foreground transition-colors',
    onInspect && 'hover:text-foreground cursor-pointer',
    isLoading && 'animate-pulse',
    className
  )

  const content = (
    <>
      <div className="min-w-0 max-w-full flex-1 overflow-hidden">{label}</div>
      {meta ? (
        <span className="shrink-0 ml-2 text-xs text-muted-foreground flex items-center gap-1">
          {meta}
        </span>
      ) : null}
    </>
  )

  // No onInspect means there's nowhere for a click to go (e.g. no artifact
  // panel mounted, as in the FreePlanTour modal) — render as a plain,
  // non-interactive header rather than a button that looks clickable but
  // silently does nothing.
  if (!onInspect) {
    return <div className={sharedClassName}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onInspect}
      aria-expanded={ariaExpanded}
      className={sharedClassName}
    >
      {content}
    </button>
  )
}

export default ProcessHeader

/**
 * Example integrations for embedding the FreePlanTour assistant modal on a
 * destination page. Not part of the app's routing — kept under examples/
 * for reference when wiring the modal into freeplantour.com.
 *
 * The modal computes destination/locale/currentUrl itself from the current
 * URL when no props are given (see lib/freeplantour/extract-destination-from-url.ts
 * and lib/freeplantour/language.ts), so the simplest integration is just
 * dropping <FreePlanTourAssistantModal /> onto the page with no props at
 * all. The examples below show that simple case plus a more explicit
 * App Router variant for when the host page already has the destination
 * name from its own data (e.g. a CMS lookup by slug), which is more
 * reliable than re-deriving it from the URL slug.
 */

import { extractDestinationFromUrl } from '@/lib/freeplantour/extract-destination-from-url'
import { extractLocaleFromUrl } from '@/lib/freeplantour/language'

import { FreePlanTourAssistantModal } from '@/components/freeplantour/freeplantour-assistant-modal'

/**
 * Simplest integration: the modal figures out the destination/locale from
 * the current URL on its own. Works as a plain client component dropped
 * into any page.
 */
export function SimpleIntegrationExample() {
  return (
    <>
      <main>{/* FreePlanTour destination page content */}</main>
      <FreePlanTourAssistantModal />
    </>
  )
}

/**
 * Explicit-props variant of the same simple integration, for a framework
 * that isn't Next.js App Router (or a client component that wants to
 * compute the values itself rather than relying on the modal's internal
 * fallback) — reuses the same extractor utilities the modal uses
 * internally.
 */
export function ExplicitPropsIntegrationExample() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const destination = extractDestinationFromUrl(pathname) ?? 'this destination'
  const locale = extractLocaleFromUrl(pathname) ?? undefined

  return (
    <>
      <main>{/* FreePlanTour destination page content */}</main>
      <FreePlanTourAssistantModal
        destination={destination}
        locale={locale}
        currentUrl={typeof window !== 'undefined' ? window.location.href : undefined}
      />
    </>
  )
}

/**
 * Next.js App Router variant: a destination page Server Component that
 * already has the destination name and locale from its own route params /
 * CMS lookup (e.g. app/[locale]/[slug]/page.tsx), rather than re-deriving
 * it from the URL slug. This is the more reliable option when the host
 * page's own data is authoritative — e.g. a destination whose display name
 * doesn't match its slug 1:1, or an itinerary page where the slug encodes a
 * trip pattern rather than the plain destination name.
 *
 * Renders a client component for the modal itself, since it needs
 * useState/useEffect and reads window.location as a fallback.
 */
export default async function AppRouterDestinationPageExample({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  // In a real integration this would come from a CMS/DB lookup keyed by
  // `slug`, not from re-slugifying the URL — shown here as a stand-in.
  const destination = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <>
      <main>{/* FreePlanTour destination page content for {destination} */}</main>
      <FreePlanTourAssistantModal destination={destination} locale={locale} />
    </>
  )
}

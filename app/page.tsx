import { headers } from 'next/headers'

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { getFreePlanTourLabels } from '@/lib/freeplantour/labels'
import {
  NextSearchParams,
  parseFreePlanTourQueryParams
} from '@/lib/freeplantour/parse-query-params'
import {
  parseAcceptLanguageHeader,
  pickSupportedLocale
} from '@/lib/freeplantour/pick-supported-locale'
import { resolveFreePlanTourContext } from '@/lib/freeplantour/resolve-context'
import { getModelSelectorData } from '@/lib/model-selector/get-model-selector-data'

import { Chat } from '@/components/chat'

export default async function Page({
  searchParams
}: {
  searchParams: Promise<NextSearchParams>
}) {
  const userId = await getCurrentUserId()
  const isCloudDeployment = process.env.MORPHIC_CLOUD_DEPLOYMENT === 'true'
  const libraryAvailable = process.env.ENABLE_AUTH !== 'false'
  const modelSelectorData = await getModelSelectorData()

  // Preferred: explicit ?destination=&language=&itineraryId=&sourceUrl=
  // query params, appended by the linking FreePlanTour page. Fallback: parse
  // the referring page's own URL (Referer header) for a plain link with no
  // params — same generic /{locale}/{itineraryId}/{slug} parser the embedded
  // widget uses on its own host page.
  const explicit = parseFreePlanTourQueryParams(await searchParams)
  const headerList = await headers()
  const fallbackUrl =
    explicit.sourceUrl ?? headerList.get('referer') ?? undefined
  const resolved = resolveFreePlanTourContext({ explicit, fallbackUrl })
  const locale =
    resolved.locale ??
    pickSupportedLocale(
      ...parseAcceptLanguageHeader(headerList.get('accept-language'))
    )
  const labels = getFreePlanTourLabels(locale, Boolean(resolved.destination))

  return (
    <Chat
      isGuest={!userId}
      isCloudDeployment={isCloudDeployment}
      libraryAvailable={libraryAvailable}
      modelSelectorData={modelSelectorData}
      destination={resolved.destination}
      locale={locale}
      currentUrl={resolved.currentUrl}
      itineraryId={resolved.itineraryId}
      emptyStatePlaceholder={labels.placeholder}
      emptyStateHeading={labels.empty}
    />
  )
}

# FreePlanTour Assistant

An AI travel assistant, embedded as a modal/widget on FreePlanTour
destination pages, that detects the destination from the current URL and
answers tourism/travel-planning questions in the user's own language, using
fresh web search with cited sources when the answer needs current
information.

## Local development

```bash
bun install
cp .env.local.example .env.local
bun dev
```

Visit http://localhost:3000. The homepage runs the same chat used inside the
modal (minus the modal chrome), so it's the fastest way to test prompt/search
changes before wiring up the embed.

## Required variables

At minimum, set **one AI provider** and **one search provider**, plus the
guest-chat flag the modal depends on:

```bash
# One AI provider (see "AI provider setup" below for the rest)
OPENAI_API_KEY=your_openai_key

# One search provider (see "Search provider setup" below for the rest)
TAVILY_API_KEY=your_tavily_key

# REQUIRED for the embedded modal specifically — see below
ENABLE_GUEST_CHAT=true
```

`DATABASE_URL` is also required for local development (chat history
persistence for the authenticated app), but the modal itself uses the guest
(ephemeral, no-DB) code path — see [Known limitations](#known-limitations).

### Why `ENABLE_GUEST_CHAT=true` is required

Visitors on a FreePlanTour destination page have no Supabase session — every
request the modal sends is a "guest" request
(`app/api/chat/route.ts`). Without `ENABLE_GUEST_CHAT=true`, the API responds
`401 Unauthorized` to every guest request and the modal cannot answer
anything. This is the one setting that's easy to miss because the rest of
the app (the authenticated chat page) works without it.

## AI provider setup

Set **at least one** of these (see `.env.local.example` for exact variable
names and where to get each key):

- `OPENAI_API_KEY` — OpenAI
- `ANTHROPIC_API_KEY` — Anthropic Claude
- `GOOGLE_GENERATIVE_AI_API_KEY` — Google Gemini
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway (unified access to multiple providers)
- `OLLAMA_BASE_URL` — self-hosted Ollama models
- `OPENAI_COMPATIBLE_API_KEY` + `OPENAI_COMPATIBLE_API_BASE_URL` — any
  OpenAI-compatible endpoint (DeepSeek, Moonshot, Zhipu, etc.)

The model actually used is selected via `lib/model-selector` / the
`searchMode` cookie; no FreePlanTour-specific model configuration is needed
beyond having a provider key set.

## Search provider setup

Set **at least one**. The travel prompt's freshness/citation rules
(`lib/freeplantour/travel-system-prompt.ts`) depend on real web search being
available — without a search provider, the assistant cannot verify current
information (events, hours, prices) and will say so rather than guessing.

- `TAVILY_API_KEY` — default provider
- `EXA_API_KEY` — alternative neural search
- `FIRECRAWL_API_KEY` — alternative web scraping/extraction
- `BRAVE_SEARCH_API_KEY` — optional, adds video/image search
- SearXNG (self-hosted) — no API key needed; see `SEARXNG_API_URL` and
  related vars in `.env.local.example`. This is what Docker Compose uses by
  default.

## Optional variables

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` /
  `SUPABASE_SECRET_KEY` — enables the authenticated chat page and chat
  history persistence. Not required for the guest-only modal.
- `R2_*` / `S3_ENDPOINT` — file upload storage. The modal doesn't expose file
  upload (hidden for guests, see Loop 10 in `WORKLOG.md`), so this isn't
  needed for the modal specifically.
- `GUEST_CHAT_DAILY_LIMIT` — caps how many messages a single guest can send
  per day. Recommended for a public embed to prevent abuse.
- `MORPHIC_CLOUD_DEPLOYMENT=true` + `UPSTASH_REDIS_REST_URL` +
  `UPSTASH_REDIS_REST_TOKEN` — enables Redis-backed guest rate limiting.
  Without these, guest rate limiting is a no-op — fine for local testing, but
  set these before putting the modal on a real public page.
- `ENABLE_LANGFUSE_TRACING` + `LANGFUSE_*` — request tracing/observability.
- `NEXT_PUBLIC_POSTHOG_KEY` + `POSTHOG_*` — product analytics.

## How to run locally

```bash
bun install
cp .env.local.example .env.local   # fill in the required vars above
bun dev
```

Visit http://localhost:3000 and try the destination questions from the
[manual QA checklist](../WORKLOG.md) once Loop 15 is complete, or ask
anything travel-related directly on the homepage.

## How to test

```bash
bun test          # vitest run
bun run typecheck  # tsc --noEmit
bun lint           # eslint .
```

FreePlanTour-specific unit tests live under `lib/freeplantour/*.test.ts`
(destination extraction, locale/language handling, destination-aware search
query building). See `WORKLOG.md` for the status of each loop's test
coverage and whether it has actually been executed in this environment.

## How to embed the modal

```tsx
import { FreePlanTourAssistantModal } from '@/components/freeplantour/freeplantour-assistant-modal'

export default function DestinationPage() {
  return (
    <>
      <main>{/* destination page content */}</main>
      <FreePlanTourAssistantModal />
    </>
  )
}
```

With no props, the modal computes `destination`/`locale`/`currentUrl` itself
from `window.location` (see `lib/freeplantour/extract-destination-from-url.ts`
and `lib/freeplantour/language.ts`). Pass them explicitly if the host page
already has more accurate destination data (e.g. from its own CMS):

```tsx
<FreePlanTourAssistantModal
  destination="Miranda de Ebro"
  locale="es"
  currentUrl={typeof window !== 'undefined' ? window.location.href : undefined}
/>
```

See `examples/freeplantour-page-integration.tsx` (added in a later loop) for
a fuller integration example.

## How to connect future Firestore/API context

`lib/freeplantour/context.ts`'s `getDestinationContext()` is a stub that
always returns empty `itineraries`/`activities` arrays — no fake data is
returned. To connect it to a real source later:

1. Replace the body of `getDestinationContext` with a real Firestore/API
   call, keeping the same `DestinationContext` return shape.
2. Nothing else needs to change — `lib/agents/researcher.ts` already awaits
   `getDestinationContext` and includes the result in the system prompt via
   `formatDestinationContextForPrompt` whenever it returns non-empty data
   (see the TODOs left in `context.ts`).

## Known limitations

- The modal's destination/locale/URL are re-derived from `window.location`
  on mount and on every open/close toggle, not via a full router/history
  listener — a client-side SPA navigation to a different destination while
  the modal stays open won't update until the next toggle (see Loop 7 in
  `WORKLOG.md`).
- `ChatMessages`' desktop layout sizes its latest-message area against the
  viewport (`calc(100dvh - 196px)`), not the modal's own ~720px container,
  which can add extra internal scroll rather than a perfectly tight fit on
  desktop (see Loop 3 in `WORKLOG.md`).
- `getDestinationContext()` is currently a stub returning empty data — no
  FreePlanTour itineraries/activities are surfaced to the assistant yet.
- Morphic's original circular logo mark (not text) still appears as the
  assistant avatar and empty-state icon; left as-is per an explicit product
  decision (see Loop 10 in `WORKLOG.md`).

## Legal

This project is adapted from [Morphic](https://github.com/miurla/morphic)
and keeps the original license requirements. It is licensed under the
Apache License 2.0 — see the [LICENSE](../LICENSE) file for details,
including the original copyright notice. No original Morphic authorship is
claimed; only user-facing branding was replaced (see Loop 2 in
`WORKLOG.md` for the full list of changes and what was intentionally kept).

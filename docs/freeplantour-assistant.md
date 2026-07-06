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

For the FreePlanTour guest modal — the actual deliverable of this project —
set **one AI provider** and **one search provider**. Guest chat is always
enabled (there is no flag to turn it off — a visitor with no session is
simply served the ephemeral guest path) and no sign-in/registration flow
exists anywhere in the app. **A database is not required** for this use
case:

```bash
# One AI provider (see "AI provider setup" below for the rest)
OPENAI_API_KEY=your_openai_key

# One search provider (see "Search provider setup" below for the rest)
TAVILY_API_KEY=your_tavily_key
```

`DATABASE_URL` is required only if you also want saved/persisted chats,
message feedback, or the library (file/notes) feature — i.e. the
authenticated, Morphic-style app that sits alongside the modal. See "Why
`DATABASE_URL` is now optional for the guest modal" below.

### Why `DATABASE_URL` is now optional for the guest modal

Earlier versions of this doc said `DATABASE_URL` was required to build the
app **at all**, based on a real failed Vercel deployment. That was true at
the time: `lib/db/index.ts` used to throw at **module-evaluation time**
(top-level code, not inside a function) if no database env var was set, and
`app/api/chat/route.ts` — shared by both the authenticated app and the
guest/modal path — statically imported a chain that reached it, so Next.js's
build-time page-data collection crashed regardless of which runtime branch
would actually execute.

**This has been fixed.** `lib/db/index.ts` now exports `isDatabaseConfigured()`
and a lazy `getDb()` instead of an eagerly-created client — the database
connection is only created the first time a DB-backed function is actually
*called*, never merely imported. Since the guest/modal chat path
(`create-ephemeral-chat-stream-response.ts`) never calls any DB function,
it now works — and the app now builds — with no database configured at all.

Routes that genuinely need a database handle a missing one gracefully at
runtime instead of crashing:
- `GET /api/chats` and `POST /api/feedback` (when a `messageId` is given)
  return `503 { "error": "Database is not configured" }`.
- `GET /search/[id]` renders a plain explanatory message instead of
  throwing.

**If you do want saved chats, feedback, or the library feature:** any
Postgres works — Vercel Postgres, Neon, Supabase, or a local instance.
Docker Compose provisions one automatically (see `docker-compose.yaml`).
Set `DATABASE_URL` (and optionally `DATABASE_RESTRICTED_URL` for a
row-level-security-scoped connection) and those features activate
automatically — no other configuration is needed.

### Why there is no sign-in/registration flow

Visitors on a FreePlanTour destination page have no Supabase session — every
request the modal sends is a "guest" request (`app/api/chat/route.ts`), and
the API always accepts it. There is no `ENABLE_GUEST_CHAT` flag, no login
page, and no "create a guest account" step anywhere on the chat path — the
app never redirects to `/auth/*` and never blocks a guest's first message.
`ENABLE_AUTH`/Supabase remain available as an **optional**, separate feature
for anyone who wants a multi-user deployment with saved chat history
alongside the anonymous modal; they are not needed for, and never gate, the
FreePlanTour guest experience.

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

- `DATABASE_URL` (and optionally `DATABASE_RESTRICTED_URL`) — enables saved
  chats, message feedback, and the library (file/notes) feature. Not
  required for the guest-only modal; see "Why `DATABASE_URL` is now
  optional for the guest modal" above.
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
- ~~`DATABASE_URL` is a hard build-time dependency~~ — **fixed.**
  `lib/db/index.ts` now lazily creates its connection via `getDb()`/
  `isDatabaseConfigured()` instead of connecting/throwing at module-load
  time, and `/api/chats`, `/api/feedback`, and `/search/[id]` all handle a
  missing database gracefully at runtime instead of crashing the build. See
  the git history / WORKLOG addendum for the before/after.

## Legal

This project is adapted from [Morphic](https://github.com/miurla/morphic)
and keeps the original license requirements. It is licensed under the
Apache License 2.0 — see the [LICENSE](../LICENSE) file for details,
including the original copyright notice. No original Morphic authorship is
claimed; only user-facing branding was replaced (see Loop 2 in
`WORKLOG.md` for the full list of changes and what was intentionally kept).

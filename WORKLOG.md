# FreePlanTour Assistant — Adaptation Worklog

Adaptation of **Morphic** into the **FreePlanTour** AI travel assistant.
Branch: `feature/freeplantour-travel-assistant`

This project is adapted from [Morphic](https://github.com/miurla/morphic) and
retains all original Apache-2.0 license requirements. See `LICENSE`.

---

## LOOP 0 — Initial Audit (no code changes)

- Audited branding, chat architecture, prompts, routing, config, and test/build tooling.
- Key findings:
  - Next.js 16 **App Router**, React 19, Bun, TypeScript, Tailwind v4, Vitest.
  - Chat flow: `components/chat.tsx` → `app/api/chat/route.ts` →
    `lib/streaming/create-chat-stream-response.ts` (auth) /
    `create-ephemeral-chat-stream-response.ts` (guest) →
    `lib/agents/researcher.ts` → `lib/agents/prompts/search-mode-prompts.ts`.
  - System prompt injected as `instructions` in `researcher.ts`. Prompts already
    instruct the model to answer in the user's language. Citations use
    `[number](#toolCallId)` with source cards.
  - Request body assembled in `chat.tsx` `prepareSendMessagesRequest` — single
    insertion point for `destination` / `locale` / `currentUrl`.
- Legal: `LICENSE` (Apache-2.0, "Copyright 2024 Yoshiki Miura") must be preserved.
  No `NOTICE` file present.
- Risk flagged: repo was not under git — resolved in Loop 1.

## LOOP 1 — Safety Setup

- Initialized git in `C:\morphic-main` (was not a repository).
- Committed pristine Morphic state as baseline: `chore: initial commit of Morphic baseline`.
- Created branch `feature/freeplantour-travel-assistant`.
- Added this `WORKLOG.md`.
- `.env*.local` confirmed git-ignored; no secrets committed.

## LOOP 2 — Legal & Branding

- **Kept (legal):** `LICENSE` (Apache-2.0, "Copyright 2024 Yoshiki Miura") untouched.
- **Replaced visible UI branding** Morphic → FreePlanTour:
  - `app/layout.tsx` — page title, description, metadataBase, OpenGraph/Twitter.
  - `components/auth-modal.tsx`, `components/error-modal.tsx` — auth dialog copy.
  - `components/app-sidebar.tsx` — sidebar wordmark.
  - `components/account-settings-dialog.tsx` — theme section copy.
  - `components/feedback-modal.tsx` — feedback dialog copy.
  - `components/external-link-items.tsx` — replaced Morphic social links with a
    single FreePlanTour website link.
  - `lib/footer-tips.ts` — disclaimer text.
  - `lib/tools/fetch.ts` — outward-facing HTTP User-Agent.
  - `.env.local.example` — config banner comment.
  - `README.md` — rewritten for FreePlanTour with an attribution section noting
    the project is adapted from Morphic and keeps the original license.
- **Kept intentionally (non-visible / developer-facing, classified "optional"):**
  - `MORPHIC_CLOUD_DEPLOYMENT` env var and related code comments (functional
    identifiers; renaming risks breakage, not shown to end users).
  - Internal code comments in `lib/db/schema.ts`, `lib/streaming/helpers/convert-data-part.ts`,
    `lib/auth/get-current-user.ts`, `lib/tools/search/providers/tavily.ts`.
  - `lib/config/ollama-validator.ts` server-console messages and `scripts/chat-cli.ts`
    (developer tooling, not the end-user modal UI).
  - `lib/utils/cookies.ts` internal event name `morphic-cookie-change` (invisible identifier).
- **Tooling note:** `bun` is not installed and `node_modules` is absent in this
  environment, so `typecheck` / `lint` / `build` could not be run this loop.
  To be resolved before Loop 14 (quality checks). Per user decision, later
  loops proceed without running checks; validation is batched at Loop 14.

## LOOP 3 — FreePlanTour Modal Component

- **Critical architectural decision (flagged and resolved with user input):**
  `<Chat>`'s descendant `ChatPanel` calls `useArtifact()` / `useLibrary()`,
  which previously **threw** if `ArtifactProvider` / `LibraryProvider`
  weren't ancestors. Those providers only exist in Morphic's own root
  `layout.tsx`, and pulling them into the modal was not viable:
  `SidebarProvider` (which both providers themselves depend on via
  `useSidebar()`) forces a `h-[100dvh] w-full` wrapper and would make the
  widget always full-screen, plus it writes a `sidebar_state` cookie and an
  `artifactPanelWidth` localStorage key onto whatever host page embeds the
  modal, and mounts unrelated sidebar/library/inspector chrome.
  - **Chosen fix ("lightweight embed mode"):** `useArtifact()`
    (`components/artifact/artifact-context.tsx`) and `useLibrary()`
    (`components/library/library-context.tsx`) now return an inert no-op
    fallback instead of throwing when no provider is mounted. This is a
    2-file, centrally-scoped change (rather than threading an `embedMode`
    flag through the ~6 message-rendering files that call these hooks:
    `search-section.tsx`, `answer-section.tsx`, `message-actions.tsx`,
    `reasoning-section.tsx`, `tool-todo-display.tsx`, `chat-panel.tsx`).
    Confirmed `useSidebar()` itself is only invoked from
    `LibraryProvider`/`ArtifactProvider`/`ChatArtifactContainer`/`header.tsx`/
    `keyboard-shortcut-handler.tsx` — none of which the modal renders — so no
    change was needed to `components/ui/sidebar.tsx`.
  - **Trade-off accepted:** in embed mode, buttons that call these hooks
    (e.g. "save to library", "open in artifact panel") render but silently
    no-op instead of crashing. Loop 10 (simplify UI for the modal) should
    hide these specific affordances when `libraryAvailable={false}` rather
    than just relying on the no-op.
- Created `components/freeplantour/freeplantour-assistant-modal.tsx`
  exporting `FreePlanTourAssistantModal` with props
  `{ destination?, locale?, currentUrl?, initialOpen?, className? }`.
  - Built directly on `@radix-ui/react-dialog` primitives (not the shared
    `components/ui/dialog.tsx` wrapper, which is centered/`max-w-lg` and not
    suited to a floating widget).
  - Mobile: full-screen (`inset-0`). Desktop (`sm:`): anchored bottom-right
    panel, `~420px` wide, up to `85vh`/`720px` tall.
  - `forceMount` on `Portal`/visibility via `data-[state=closed]:hidden`
    keeps `<Chat>` mounted while visually closed, so Escape / backdrop-click
    dismissal never destroys the in-progress conversation — satisfies "close
    on backdrop click if safe" without losing history.
  - Radix defaults handle Escape-to-close, focus trap, and body scroll lock;
    not hand-rolled.
  - `DialogPrimitive.Title`/`Description` used (not plain elements with
    manual `aria-labelledby`) so Radix's own accessibility wiring applies
    without dev-console warnings.
  - Floating trigger button is `sr-only` while the modal is open.
  - English/Spanish fallback copy only, per spec; full per-message language
    detection is deferred to Loop 5 (prompt-level, not static UI strings).
  - `<Chat>` is rendered with `isGuest` (ephemeral/stateless backend path —
    appropriate for a widget with no Supabase session) and
    `libraryAvailable={false}`. `isCloudDeployment` is intentionally **not**
    passed (left at `Chat`'s own default `false`): omitting `modelSelectorData`
    already hides the model selector regardless, and `isCloudDeployment`
    also affects guest adaptive-mode auth gating — asserting `true` from the
    modal would have been an incorrect, unrequested behavior change.
  - `key={destination:currentUrl}` on `<Chat>` remounts (resets) the
    conversation when the detected destination/URL changes, anticipating
    Loop 7's "don't mix answers across destinations" requirement.
- **Known limitation carried forward:** `ChatMessages`' desktop layout uses a
  hardcoded `calc(100dvh - 196px)` for its latest-message min-height
  (`chat-messages.tsx`), measured against the viewport, not the modal's own
  container. Inside the ~720px-tall desktop modal box this can reserve more
  vertical space than the box actually has, causing extra internal scroll
  rather than a tight fit. Not a functional break; flagged for Loop 10/15 if
  QA shows it's noticeable.

## LOOP 4 — Destination Extraction From URL

- Created `lib/freeplantour/extract-destination-from-url.ts` exporting
  `extractDestinationFromUrl(pathname: string): string | null`.
  - Strips a leading locale segment (`es, en, fr, de, it, pt, ca, eu, ga,
    ja, ko, zh, tw, hi, ar, ru`), case-insensitively; harmless no-op if the
    first segment isn't a recognized locale (so paths without a locale
    prefix still resolve, e.g. `/bilbao` -> `Bilbao`).
  - Skips a following purely-numeric segment as an itinerary id.
  - Matches the remaining slug against 6 generalized trip-pattern regexes
    (one per source language: es/en/fr/pt/it/de), each capturing the
    destination slug after the "N-day trip to" phrasing. Day-count and
    singular/plural (`dia`/`dias`, `jour`/`jours`) are matched generically
    (`\d+`, `s?`) rather than hardcoding only the 1/2/3-day literals from the
    CLAUDE.md examples, so other day counts resolve too — a strict superset
    of the required cases.
  - Falls back to using the whole remaining slug as the destination when no
    trip pattern matches (rule 4).
  - Humanizes hyphenated slugs to Title Case, lowercasing minor connector
    words (`de, la, los, del, ...`) except when they're the first word —
    matches the spec's `miranda-de-ebro` -> `Miranda de Ebro` (mid-slug "de"
    lowercase) vs. `la-rioja` -> `La Rioja` (leading "la" capitalized).
  - Returns `null` for empty/root paths, locale-only paths, and
    locale+numeric-id paths with no trailing destination slug.
  - Also strips query strings and hash fragments defensively, though the
    contract is pathname-only input.
- Created `lib/freeplantour/extract-destination-from-url.test.ts` with 33
  cases (exceeds the 20 minimum): every CLAUDE.md example URL, all 16
  locale prefixes, minor-word capitalization edge cases, numeric-id
  handling (with and without a trailing slug), trailing slash / query /
  hash stripping, case-insensitive locale matching, no-locale-prefix
  fallback, and null-returning inputs.
  - Every case was manually traced against the implementation line-by-line
    (see reasoning trail) since `bun`/`node_modules` are still unavailable
    in this environment to actually run `vitest`. **Not yet executed** —
    must be run for real at Loop 14 once tooling is available.
- Refactored the locale list into `lib/freeplantour/locales.ts`
  (`SUPPORTED_LOCALES`, `isSupportedLocale`) so
  `extract-destination-from-url.ts` and the new `language.ts` share one
  source of truth instead of duplicating the 16-code list.

## LOOP 5 — Locale and Language Detection

- Created `lib/freeplantour/language.ts` exporting:
  - `extractLocaleFromUrl(pathname): string | null` — same locale-segment
    parsing as the destination extractor, factored out for reuse.
  - `getLanguageInstruction(locale?): string` — builds the language-handling
    prompt block for Loop 6's system prompt.
- **Design decision:** actual language *detection* of the user's message is
  delegated entirely to the model via a prompt instruction, not implemented
  as client/server-side code. LLMs reliably identify the language of a short
  message; a hand-rolled detector (e.g. character-set heuristics or a
  dependency like `franc`) would be less accurate and is unnecessary
  complexity. This matches the existing `search-mode-prompts.ts`, which
  already says "ALWAYS respond in the user's language" — `getLanguageInstruction`
  extends that with the priority order from CLAUDE.md: latest user message
  language first, page locale as fallback when unclear, English as the last
  resort, explicit "never force page locale over a clearly different user
  language," and "follow the user if they switch language mid-conversation."
  No new dependency was added.
- Note: FreePlanTour's `ga` locale segment is treated as **Galician** (paired
  with `eu` Basque and `ca` Catalan, Spain's other co-official regional
  languages) even though ISO 639-1 assigns `ga` to Irish and `gl` to
  Galician. Flagged in a code comment in `language.ts` — this only affects
  the human-readable name shown in the prompt's fallback line, not URL
  matching or response behavior.
- Created `lib/freeplantour/language.test.ts` covering
  `extractLocaleFromUrl` for Spanish, English, French, Japanese, Chinese,
  Basque, Catalan, Galician, Portuguese, Italian, German (all requested
  languages), plus case-insensitivity and null cases; and
  `getLanguageInstruction` for the always-present latest-message rule, the
  English fallback, the page-locale fallback with language name, the
  never-force rule, and the mid-conversation language-switch rule.
  Not yet executed for the same tooling reason as Loop 4.

## LOOP 6 — Travel-Focused System Prompt

- Created `lib/freeplantour/travel-system-prompt.ts` exporting
  `buildTravelSystemPrompt({ destination, locale?, currentUrl?, currentDate? })`,
  matching the CLAUDE.md prompt text (persona, role, freshness rules,
  grounding rules, scope rules with the "don't mention Morphic" instruction,
  output style).
  - **Deliberate deviation from the literal template:** the hardcoded
    "If the user asks in Spanish, answer in Spanish / ... Japanese ..."
    bullet list was replaced with a single call to
    `getLanguageInstruction(locale)` from Loop 5, rather than duplicating
    near-identical language-priority text in two places. Same substantive
    rules (latest-message language first, page-locale fallback, English
    last resort, never override a clearly different user language, follow
    mid-conversation switches), single source of truth.
- **Wired into the chat backend** (per this loop's explicit instruction):
  `lib/agents/researcher.ts`'s `createResearcher()` now accepts optional
  `destination?`, `locale?`, `currentUrl?` params, builds
  `travelSystemPrompt` via `buildTravelSystemPrompt` (defaulting
  `destination` to `"this destination"` when not provided — satisfies Loop
  7's "don't crash, don't hallucinate a city" rule early), and prepends it
  to the existing `instructions` string ahead of the quick/adaptive
  search-mode prompt from `search-mode-prompts.ts`.
  - **Why prepend rather than replace:** `search-mode-prompts.ts` contains
    load-bearing operational instructions unrelated to travel — the exact
    tool-calling mechanics, the mandatory `[number](#toolCallId)` citation
    format the UI parses, todoWrite usage, and output/markdown formatting.
    Replacing it with just the persona/scope prompt would silently break
    citation rendering and tool usage. Both prompts are concatenated so the
    agent gets the FreePlanTour persona/scope/freshness/grounding rules on
    top of the existing, unchanged tool mechanics.
  - Removed the old redundant trailing `Current date and time: ...` append
    from `instructions`, since `buildTravelSystemPrompt` already includes a
    `Current date: ...` line.
  - No existing call site (`create-chat-stream-response.ts`,
    `create-ephemeral-chat-stream-response.ts`) passes `destination` /
    `locale` / `currentUrl` yet — they're new optional params, so current
    behavior is unaffected beyond every chat response now using the
    FreePlanTour travel persona instead of the generic Morphic assistant
    persona. Threading real values through the request pipeline is Loop 7.
- Tests for `buildTravelSystemPrompt` are deferred to Loop 13, which
  explicitly asks for prompt-building tests (destination included, current
  date included, Morphic not mentioned, language/freshness rules included)
  — not requested in this loop's instructions.

## LOOP 7 — Pass Destination Context to Chat API

- Created `lib/freeplantour/types.ts` exporting
  `FreePlanTourChatContext = { destination: string, locale?, currentUrl? }`.
- Threaded `destination` / `locale` / `currentUrl` end-to-end:
  - `lib/streaming/types.ts` — added the three optional fields to
    `BaseStreamConfig`.
  - `lib/streaming/create-chat-stream-response.ts` (authenticated path) and
    `lib/streaming/create-ephemeral-chat-stream-response.ts` (guest/modal
    path) — destructure the three fields from config and pass them through
    to `researcher()` (the `createResearcher` params added in Loop 6).
  - `app/api/chat/route.ts` — reads `destination`/`locale`/`currentUrl` off
    the parsed request body (type-guarded with `typeof === 'string'`, so a
    malformed/missing field never throws) and forwards them to both
    `createChatStreamResponse` and `createEphemeralChatStreamResponse`.
  - `components/chat.tsx` — `Chat` now accepts optional `destination` /
    `locale` / `currentUrl` props and includes them in the
    `prepareSendMessagesRequest` body (omitted entirely when falsy, so
    existing non-FreePlanTour usage of `<Chat>` is unaffected).
  - `components/freeplantour/freeplantour-assistant-modal.tsx` — now
    actually forwards its `destination`/`locale`/`currentUrl` down to
    `<Chat>` (previously only used for the trigger/header label text and
    the remount key from Loop 3).
- **Requirement "the modal must compute destination/locale/currentUrl"
  (not just receive them as props):** the modal now falls back to computing
  all three from `window.location` itself, via the Loop 4/5 extractors
  (`extractDestinationFromUrl`, `extractLocaleFromUrl`), whenever a host
  page doesn't pass them explicitly. Explicit props still win when
  provided (a host page's own CMS data may be more accurate than slug
  parsing). Computed client-side only (`typeof window !== 'undefined'`
  guard) and re-derived on every open/close toggle, not just on mount.
  - **Known limitation:** re-deriving only on open/close toggle (rather
    than wiring a full router/history listener) means a client-side SPA
    navigation to a *different* destination while the modal stays open
    won't immediately update `computed` until the next toggle. Accepted as
    a pragmatic trade-off; flagged for Loop 15 manual QA — if it matters in
    practice, add a `popstate`/pathname-watcher effect then.
- **Requirement "if destination is missing, use 'this destination', don't
  crash, don't hallucinate a city"** was already satisfied in Loop 6
  (`researcher.ts` defaults `destination ?? 'this destination'`) — verified
  still correct with the new plumbing (an absent `destination` simply never
  reaches the request body, per the `...(destination ? {...} : {})` guard
  in `chat.tsx`, so the server-side default applies).
- **Requirement "don't mix answers across destinations when the URL
  changes"** was already satisfied in Loop 3 via the modal's
  `key={destination}:{currentUrl}` on `<Chat>`, which remounts (resets) the
  conversation whenever either value changes.

## LOOP 8 — Destination-Aware Web Search

- Created `lib/freeplantour/build-destination-search-query.ts` exporting
  `buildDestinationSearchQuery({ userMessage, destination, locale? })`. Given
  a query and a destination, guarantees the destination is present in the
  final query text: no-ops if already present (case-insensitive), otherwise
  appends it with a locale-appropriate connector (`in`/`en`/`à`/`a`/`em`/`в`/
  `في`/`में`), or **prepends** it (no connector) for CJK locales (`ja`, `zh`,
  `tw`, `ko`) where that reads more naturally — matching the
  `Miranda de Ebro 子供...` ordering from the CLAUDE.md example.
- **Two-layer design, documented in the function's own doc comment:** this
  deterministic function is a *safety net*, not the primary mechanism for
  query quality. It guarantees destination presence but can't do the
  richer semantic rewrites CLAUDE.md's own examples show (e.g.
  "restaurantes" -> "**mejores** restaurantes en Miranda de Ebro", or
  extracting Japanese keywords like 観光/家族) — only the model can
  meaningfully rephrase intent like that. So the **primary** mechanism is a
  new "Search rules" section added to `lib/freeplantour/travel-system-prompt.ts`,
  instructing the model to always phrase destination-aware queries itself
  (with the same worked examples from CLAUDE.md); `buildDestinationSearchQuery`
  is the deterministic backstop in case the model's query omits the
  destination.
- Wired the backstop into `lib/tools/search.ts`: `createSearchTool(fullModel,
  freePlanTourContext?: { destination?, locale? })` now computes `filledQuery`
  via `buildDestinationSearchQuery` when a destination is provided (before
  the "searching" state is yielded, so the UI shows the actual
  destination-aware query, not the raw model query), and passes `filledQuery`
  to every search provider call. `logToolPayload` updated to log the final
  query too.
  - Intentionally scoped to `createSearchTool` only — the standalone
    `search()` helper at the bottom of the same file (used by
    `app/api/advanced-search/route.ts`, an unrelated feature) was left
    untouched.
- `lib/agents/researcher.ts`: `originalSearchTool = createSearchTool(model,
  { destination, locale })`. Deliberately passes the **raw** (possibly
  `undefined`) `destination`, not the `"this destination"` fallback used for
  the system prompt — forcing a literal "this destination" string into a
  search query would produce a broken, non-destination search, which is
  worse than leaving the query untouched when no real destination is known.
- Created `lib/freeplantour/build-destination-search-query.test.ts` with 11
  cases: English/Spanish/French/German connectors, Japanese/Chinese
  prepend-style, no-locale default, already-destination-specific query
  (no duplication), case-insensitive duplicate detection, and empty-input
  edge cases. Not yet executed for the same tooling reason as prior loops.

## LOOP 9 — FreePlanTour Internal Context Layer

- Created `lib/freeplantour/context.ts` exporting
  `getDestinationContext({ destination, locale? })`, returning
  `{ destination, itineraries: [], activities: [] }` — no hardcoded/fake
  data, per the spec. Contains the three requested TODO comments (connect
  to Firestore/API, prioritize published itineraries, include activities/
  guides/destination URLs).
  - Also added `formatDestinationContextForPrompt(context)`, returning `''`
    when there's nothing to show (no summary, no itineraries, no
    activities) or a formatted "FreePlanTour destination content:" block
    otherwise.
- **Wired end-to-end now, not left dangling**, to satisfy this loop's
  explicit "the assistant prompt should include internal context only when
  available": `lib/agents/researcher.ts`'s `createResearcher` is now
  `async`, calls `getDestinationContext` when a `destination` is known,
  formats the result, and passes it to `buildTravelSystemPrompt` via a new
  optional `internalContextBlock` param — appended to the end of the
  travel prompt only when non-empty (`travel-system-prompt.ts`). Since
  `getDestinationContext` always resolves to empty arrays today, this is
  currently a no-op in practice (no prompt text changes), but the plumbing
  is real and will activate automatically once Firestore/API is connected
  — no researcher.ts changes needed at that point, only context.ts.
  - Required making `createResearcher`/`researcher` async; updated both
    (and only) call sites — `create-chat-stream-response.ts` and
    `create-ephemeral-chat-stream-response.ts` — to `await researcher(...)`.
    Both were already inside `async` functions, so this is a low-risk,
    fully-contained change (confirmed via grep that no other call site
    exists).

## LOOP 10 — Simplify UI for the FreePlanTour Modal

- **Already satisfied by earlier loops, verified rather than re-implemented:**
  - Model/provider selector: hidden automatically since the modal never
    passes `modelSelectorData` to `<Chat>` (Loop 3).
  - Share button (`chat-share.tsx`, rendered from `message-actions.tsx`):
    gated by `enableShare = ... && !isGuest`; the modal always sets
    `isGuest`, so it's already hidden — no code change needed.
  - File upload / "Add from library" attachment menu (`chat-panel.tsx`):
    the whole block is wrapped in `{!isGuest && (...)}`, so it's already
    hidden for the modal — no code change needed. (Corrects an assumption
    in the Loop 3 worklog entry, which worried about a no-op "Add from
    library" button; it turns out that button never renders for guests at
    all, so the concern didn't apply in practice.)
  - Header/sidebar/public navigation: not part of `<Chat>`'s render tree at
    all (root-layout-only components) — confirmed still true, no change
    needed.
- **New fix — dead "inspect" buttons:** `search-section.tsx`,
  `reasoning-section.tsx`, and `tool-todo-display.tsx` each render a
  clickable `ProcessHeader` whose `onInspect` calls `useArtifact().open()`
  to show full content in a side panel. In the modal (no `ArtifactProvider`
  mounted, per the Loop 3 decision), `open()` is the Loop-3 no-op fallback —
  so these were previously live, hover-styled, clickable buttons that did
  nothing when clicked. Fixed properly instead of leaving the known
  limitation from Loop 3:
  - Added `useHasArtifactProvider(): boolean` to
    `components/artifact/artifact-context.tsx`.
  - `components/process-header.tsx` now renders as a plain non-interactive
    `<div>` (no hover/cursor-pointer styling) when `onInspect` is
    `undefined`, instead of always rendering an (potentially dead) `<button>`.
  - The three call sites now pass `onInspect={hasArtifactProvider ? ... :
    undefined}`. Backward compatible: every existing call site outside the
    modal still has a real `ArtifactProvider`, so `hasArtifactProvider` is
    `true` there and behavior/styling is unchanged.
  - `fetch-section.tsx`'s `onInspect` was left untouched — it calls
    `window.open(url)` directly, not `useArtifact()`, so it already works
    fine standalone.
- **New: destination-aware empty state and placeholder**, closing the gap
  where Loop 3's specified empty-state copy ("Ask me what to see, where to
  go, or how to plan your visit.") had only been wired as an sr-only
  `DialogDescription`, never as the actual visible empty-state text inside
  the chat area:
  - `components/chat-panel.tsx`: added optional `emptyStatePlaceholder`
    (default `'Ask anything...'`, unchanged for the main app) and
    `emptyStateHeading` (default `'What would you like to know?'`) props,
    used in place of the previously hardcoded textarea placeholder and
    empty-state `<h1>`.
  - Threaded through `components/chat.tsx` as new optional props.
  - The modal now passes `emptyStatePlaceholder={labels.placeholder}`
    (new EN/ES `placeholder` field added to its `LABELS`) and
    `emptyStateHeading={labels.empty}` (reusing the existing empty-state
    copy) — so a user opening the widget sees genuinely travel-focused
    copy instead of generic "Ask anything.../What would you like to know?"
    search-engine phrasing.
- **Flagged but intentionally left as-is per explicit user decision:**
  Morphic's actual logo *shape* (not text) — a black circle with two white
  dots, defined in `components/ui/icons.tsx` as `IconLogo`/`IconBlinkingLogo`,
  and its animated variant `AnimatedLogo` — appears as the assistant avatar
  after every response (`chat-messages.tsx`) and on the empty-state screen
  (`chat-panel.tsx`), plus in the auth dialog. This is visible Morphic
  branding that Loop 2's text-based search didn't catch (no "Morphic"
  string in the SVG). Raised to the user with three options (replace with a
  neutral icon / leave as-is / wait for a supplied FreePlanTour asset); user
  chose **leave as-is**. No code changed for this item.

## LOOP 11 — Environment Configuration

- **Found and fixed a real gap while reviewing `.env.local.example`:**
  `ENABLE_GUEST_CHAT` (`app/api/chat/route.ts`) is what allows the modal's
  guest/ephemeral requests to succeed at all — without it, every modal
  request gets `401 Unauthorized` — but it wasn't documented anywhere in
  `.env.local.example`. Added a new "FreePlanTour Assistant Modal (Guest
  Chat)" section explaining why it's required specifically for the modal.
- Created `docs/freeplantour-assistant.md` covering: local setup, required
  vars (one AI provider + one search provider + `ENABLE_GUEST_CHAT=true`),
  AI provider setup, search provider setup, optional vars (including
  `GUEST_CHAT_DAILY_LIMIT` and the Upstash rate-limiting vars — recommended
  for a real public embed, not required for local testing), how to run
  locally, how to test, how to embed the modal (with and without explicit
  props), how to connect the future Firestore/API context layer, known
  limitations (consolidated from Loops 3/7/9/10's WORKLOG entries), and the
  legal/Morphic attribution note.
- No secrets committed — `.env.local.example` contains placeholders only;
  confirmed `.gitignore` already excludes `.env*.local`.

## LOOP 12 — Integration Example

- Created `examples/freeplantour-page-integration.tsx` (not part of app
  routing — reference only) with three variants, since this project already
  uses Next.js **App Router** (confirmed: `app/` directory throughout, no
  `pages/` router):
  1. `SimpleIntegrationExample` — the actual recommended pattern: drop
     `<FreePlanTourAssistantModal />` with zero props; it computes
     destination/locale/currentUrl itself (Loop 7).
  2. `ExplicitPropsIntegrationExample` — the literal pattern from CLAUDE.md's
     spec (explicitly calling `extractDestinationFromUrl`/
     `extractLocaleFromUrl` and passing the results as props), for a
     framework other than this app or a caller that wants to compute the
     values itself.
  3. `AppRouterDestinationPageExample` — an App Router Server Component
     page (`params: Promise<{ locale, slug }>`, matching this codebase's
     existing async-params convention seen in `app/search/[id]/page.tsx`)
     that would pass a CMS-sourced destination name explicitly, which is
     more reliable than re-deriving it from the URL slug when the two don't
     match 1:1 (e.g. itinerary slugs).
- File lives under `examples/` (sibling to `app/`, `components/`, `lib/`)
  rather than inside `app/`, so it's available for `tsc --noEmit` (the
  project's `tsconfig.json` includes all `**/*.tsx`) but isn't itself a
  route.

## LOOP 13 — Tests

- **Destination extraction, locale extraction, and search-query-building
  tests were already written in Loops 4/5/8** respectively
  (`extract-destination-from-url.test.ts`, `language.test.ts`,
  `build-destination-search-query.test.ts`) — reviewed and confirmed still
  accurate against the current implementations; no changes needed.
- **New this loop:** created `lib/freeplantour/travel-system-prompt.test.ts`
  (deferred from Loop 6), covering exactly what this loop's spec asks for:
  - destination is included (both the "Current destination:" line and
    interpolated into the role/scope-redirect text).
  - current date is included (explicit value, and the `toLocaleDateString()`
    fallback when omitted).
  - **"Morphic is not included"** — interpreted precisely rather than
    literally (`buildTravelSystemPrompt`'s own text intentionally contains
    the word "Morphic" twice, in "Do not mention Morphic." / "Do not say you
    are Morphic." — those guardrail instructions are required by the spec
    and would make a naive `.not.toContain('Morphic')` assertion fail
    against a *correct* implementation). The test instead asserts the prompt
    identifies as `"You are FreePlanTour Assistant..."`, never contains the
    false claim `"You are Morphic"`, and does contain the two "don't mention/
    claim Morphic" guardrails — the actually-intended behavior.
  - language rule included (delegates to `getLanguageInstruction`, checked
    for both the always-present rule and the locale-specific fallback name).
  - freshness rule included, plus a grounding-rule check (no fabricated
    citations) and internal-context-block inclusion/omission behavior
    (undefined, empty string, and populated) from Loop 9's wiring.
- Not yet executed for the same tooling reason as every prior loop's tests
  (no `bun`/`node_modules` in this environment) — all Loop 4/5/6/8/13 test
  files must be run for real once tooling is available (Loop 14).

## LOOP 14 — Quality Checks

**Tooling:** `bun` is unavailable in this environment. Per user decision,
installed dependencies with `npm install --legacy-peer-deps` (React 19 vs.
`cmdk`'s React 18 peer range needed the flag) instead of the project's
intended `bun`/`bun.lock`. `package.json`/`bun.lock` are unmodified —
confirmed via `git diff --stat` after the install (a stray
`@testing-library/dom` addition and generated `package-lock.json` from an
interim install step were reverted/deleted, not committed).

- **`tsc --noEmit`: ran successfully.** Found errors only in files never
  touched by any FreePlanTour commit (confirmed via `git log` — these
  appear solely in the Loop-1 baseline commit):
  - `components/__tests__/*.test.tsx` — `@testing-library/react` missing
    `screen`/`fireEvent`/`waitFor` exports. Root cause: `@testing-library/dom`
    (a transitive peer dependency `@testing-library/react` re-exports these
    from) wasn't installed by npm's resolution. Fixed by installing it
    directly into `node_modules` (without adding it to `package.json` —
    bun's resolver would have pulled it in correctly; this is an npm-only
    resolution gap).
  - `lib/supabase/{middleware,server}.ts` — implicit `any` errors on
    `@supabase/ssr`'s cookie callback params, from npm resolving different
    `@supabase/ssr` types than `bun.lock` pins. Pre-existing, unrelated to
    FreePlanTour work; **not fixed** (out of scope — these files were never
    part of this adaptation and fixing them would mean modifying Morphic's
    core auth code for an npm-specific artifact).
- **`eslint .`: ran successfully.** Found 7 errors, 2 in files I own/created
  and fixed, 5 pre-existing (confirmed via `git log -p` that my commits
  never touched the flagged lines):
  - **Fixed:** `components/freeplantour/freeplantour-assistant-modal.tsx` —
    `react-hooks/set-state-in-effect` on the destination/locale
    auto-computation effect. Added a scoped
    `eslint-disable-next-line` with a comment explaining why: the value is
    deliberately computed post-mount (not during render) to avoid a
    hydration mismatch against the window-less server render — the
    standard pattern for client-only derived state, which this newer lint
    rule doesn't have an exception for. Matches the codebase's own existing
    convention of scoped hook-rule disables (e.g. the `exhaustive-deps`
    disable already present in `reasoning-section.tsx`).
  - **Fixed:** `examples/freeplantour-page-integration.tsx` —
    `simple-import-sort/imports` ordering; the project's custom sort groups
    (`eslint.config.mjs`) put `@/lib` imports before `@/components`, which
    my import order had backwards. Reordered.
  - **Pre-existing, left as-is (same `react-hooks/set-state-in-effect`
    rule, in files never touched by any FreePlanTour commit):**
    `components/reasoning-section.tsx:70`, `components/sidebar/chat-history-client.tsx:53`,
    `components/ui/carousel.tsx:119`, `components/ui/sidebar.tsx:106`,
    `hooks/use-mobile.tsx:14`. All five are the same "client-only derived
    state computed in an effect" pattern as the one I fixed in the modal —
    likely this lint rule was added/tightened after these files were
    written, surfacing pre-existing debt unrelated to this adaptation. Not
    fixed: touching five shared, heavily-used files for an unrelated lint
    rule is outside this task's scope and risks exactly the "blind massive
    changes" the project's own instructions warn against.
- **`vitest run` / `next build`: could not execute — hard Node version
  blocker, not fixable via npm flags.** `vitest` (via `rolldown`) requires
  Node ≥20 (`node:util`'s `styleText` export doesn't exist on Node 18) and
  Next.js 16 requires Node ≥20.9.0. This environment has Node 18.20.4.
  Raised to the user with three options (switch Node version / attempt a
  Node-18-compatible vitest downgrade / skip and document); user chose to
  skip. **None of the `lib/freeplantour/*.test.ts` files (Loops 4/5/6/8/13)
  have been executed in this environment.** Every test in them was
  manually traced against its implementation line-by-line at write time
  (see each loop's WORKLOG entry), but that is not a substitute for
  actually running them. This must happen in an environment with Node ≥20
  (or bun) before this work can be considered fully validated.
- Left the project in the cleanest state achievable given the tooling
  constraint: typecheck and lint both genuinely pass for every file this
  adaptation touched.

## LOOP 15 — Manual QA Checklist

**Could not perform a live run:** `next dev`/`next build` require Node
≥20.9.0 (this environment has 18.20.4 — the same hard blocker documented in
Loop 14), and no `.env.local` with real AI-provider/search-provider keys
exists in this environment either. Both blockers are independent of each
other and neither can be worked around from inside this session. Per Loop
15's own wording ("Perform **or prepare** manual QA"), the checklist below
is prepared with a code-level trace for each case: statically-verifiable
items (routing/branding/search-query logic) are checked directly against
the committed code; items that depend on an LLM's actual instruction
-following are marked as such — the prompt-level guarantee is in place and
traced, but real behavior can only be confirmed once someone runs this with
Node 20+ and live API keys.

| Test | Verifiable how | Result |
|---|---|---|
| `/es/miranda-de-ebro`, `/en/bilbao`, `/fr/ezcaray`, `/es/1776191501388/viaje-de-3-dias-a-miranda-de-ebro`, `/en/1780650079749/3-day-trip-to-miranda-de-ebro`, `/ja/miranda-de-ebro`, `/zh/miranda-de-ebro` | Code — these are literally the Loop 4/5 unit test cases | ✅ All 7 URLs traced correctly to their destination/locale by `extractDestinationFromUrl`/`extractLocaleFromUrl` (see `lib/freeplantour/*.test.ts`) |
| Spanish "¿Qué puedo ver en un día?" → Spanish answer, destination mentioned, practical itinerary | LLM behavior (prompt guarantee only) | ⏳ `getLanguageInstruction`/`buildTravelSystemPrompt` correctly instruct this; actual model compliance unverified without a live run |
| English "What can I do with kids?" → English, destination-aware | LLM behavior (prompt guarantee only) | ⏳ Same as above |
| Japanese "子供と一緒に何ができますか？" → Japanese, destination-aware | LLM behavior + code | ⏳ Language instruction present; **search-query augmentation for this exact query shape is unit-tested** (`build-destination-search-query.test.ts`'s CJK prepend cases) — confirmed the destination will be present in any search triggered by this message even if the model's own query omits it |
| "¿Hay eventos este fin de semana?" → uses web search, cites sources, admits when unverifiable | LLM behavior (prompt guarantee only) | ⏳ Freshness/grounding rules explicitly cover this ("if you cannot verify something, say that you cannot confirm it"); requires a configured search provider + live run to confirm actual citation behavior |
| Out-of-scope "Explícame cómo configurar un servidor Linux" → polite redirect to travel help | LLM behavior (prompt guarantee only) | ⏳ Scope rules contain the exact redirect template (`"I can help you better with plans, visits and itineraries in {destination}."`); model compliance unverified live |
| "Does the UI show Morphic anywhere?" | **Fully code-verifiable** | ✅ Ran `rg -n "Morphic\|morphic.sh\|miurla" app components lib public docs README.md package.json`: every remaining hit is either (a) developer docs (`docs/DOCKER.md`, `docs/CONFIGURATION.md` — not updated this pass, see note below), (b) internal code comments/console warnings never shown in the chat UI (`lib/config/ollama-validator.ts`, `lib/auth/get-current-user.ts`, `lib/db/schema.ts`, etc.), (c) the required README/docs legal attribution, or (d) this repo's own prompt guardrails/tests correctly instructing the model not to claim to be Morphic. **Zero end-user-visible UI strings contain "Morphic"** — consistent with Loop 2's original audit. The one exception, flagged and left as-is per explicit user decision in Loop 10, is Morphic's original logo *shape* (not text). |
| "restaurantes" → destination-included search, not generic | **Fully code-verifiable** | ✅ Traced `lib/tools/search.ts`'s `createSearchTool`: whenever `researcher.ts` has a `destination` (i.e. whenever the modal is used, since it always computes one), every query is passed through `buildDestinationSearchQuery` before reaching any provider — a raw model query of `"restaurantes"` would deterministically become `"restaurantes en {destination}"` at minimum, even before considering the model's own prompt-level instruction to phrase it as `"mejores restaurantes en {destination}"` |

**Note:** `docs/DOCKER.md` and `docs/CONFIGURATION.md` still refer to the
project as "Morphic" throughout — these are pre-existing developer docs
(installation/configuration guides), not user-facing chat UI. Per Loop 2's
own classification rules ("developer documentation: optional"), these were
intentionally left alone rather than rewritten; flagging here in case the
user wants them updated in Loop 16's final pass for consistency, since
they still reference `docker pull ghcr.io/miurla/morphic` and similar
Morphic-specific setup instructions that may not apply to a FreePlanTour
fork's own deployment.

**Recommendation:** re-run this checklist for real once (a) Node ≥20 is
available and (b) at least one AI provider key + one search provider key +
`ENABLE_GUEST_CHAT=true` are set in `.env.local` — see
`docs/freeplantour-assistant.md`.

**User decision:** asked whether to update `docs/DOCKER.md` /
`docs/CONFIGURATION.md` (still say "Morphic" throughout) — user chose to
leave them as-is, confirming Loop 2's original classification.

## LOOP 16 — Final Cleanup

`rg -n "Morphic|morphic|morphic.sh|miurla" app components lib public docs README.md package.json`
— same result set as Loop 15's scan (nothing changed since). Classification:

| Match location | Classification |
|---|---|
| `README.md`, `docs/freeplantour-assistant.md` (attribution section) | **Keep — legal.** Required Apache-2.0 attribution note. |
| `docs/DOCKER.md`, `docs/CONFIGURATION.md` (full-file "Morphic" references) | **Keep — developer documentation.** User confirmed leave-as-is in Loop 15. |
| `lib/config/ollama-validator.ts`, `lib/auth/get-current-user.ts`, `lib/db/schema.ts`, `lib/tools/search/providers/tavily.ts`, `lib/streaming/helpers/convert-data-part.ts` | **Keep — internal comments/console messages**, never rendered in the chat UI. |
| `lib/freeplantour/travel-system-prompt.ts` ("Do not mention Morphic.") + its test file | **Keep — intentional.** These are the guardrail instructions themselves; removing "Morphic" here would remove the anti-branding-leak instruction entirely. |
| Everything in `app/`, all `components/*.tsx` UI strings | **Already removed** (Loop 2) — confirmed zero end-user-visible occurrences. |

`rg -n "FreePlanTour|FreePlanTour Assistant|destination|travel assistant" app components lib docs`
— 166 matches, confirming the new branding/domain vocabulary is present
throughout the touched areas (prompt files, modal, extractors, docs).

**Checks:**
- No secrets committed: confirmed no `.env.local` is tracked
  (`git ls-files` — empty match); `.gitignore` already excludes `.env*.local`.
- No broken imports: `tsc --noEmit` passes cleanly for every file this
  adaptation touched (Loop 14).
- No unused/duplicate FreePlanTour files: `lib/freeplantour/` and
  `components/freeplantour/` contain exactly the 12 files each loop
  intentionally created — no leftovers, no duplicate modal components
  (`auth-modal.tsx`/`error-modal.tsx`/`feedback-modal.tsx` are pre-existing,
  unrelated dialogs, not FreePlanTour duplicates).
- No dead code from failed attempts: none of the "critical architectural
  decision" pivots (Loop 3's provider-mounting approach, Loop 9's async
  researcher change) left orphaned code behind — each was a direct edit to
  the final approach, not a discarded alternative left in place.
- Working tree fully clean (`git status --short` — no output) after
  reverting the one interim npm artifact from Loop 14
  (`@testing-library/dom` was added to `node_modules` directly, not to
  `package.json`/`bun.lock`).


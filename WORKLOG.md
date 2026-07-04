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


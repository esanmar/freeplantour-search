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
  To be resolved before Loop 14 (quality checks).


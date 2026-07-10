# Todo

## task-bright-builds-deep-review | 2026-06-20 19:14 CDT | Whole-repo Bright Builds deep review

- [x] Read local Bright Builds entrypoints: `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, and `bright-builds-rules.audit.md`.
- [x] Read pinned canonical standards at commit `05f8d7a6c9c2e157ec4f922a05273e72dab97676`: index, architecture, code shape, verification, testing, operability, local guidance, and TypeScript/JavaScript.
- [x] Follow sync-first workflow: `git fetch origin`, then `git pull --rebase`.
- [x] Prepare dependencies with `bun install --frozen-lockfile`.
- [x] Run baseline verification with `bun run verify`.
- [x] Audit Bright Builds managed-file posture without editing managed files.
- [x] Audit architecture, code shape, testing, operability, TS/JS guidance, and local guidance.
- [x] Create bounded remediation task blocks for compliance and refactoring follow-up.

### Findings-First Audit Summary

- [must] Runtime provenance is not yet in a stable product-wide surface. `BuildInfoPanel` renders only on the home route through `src/routes/HomePage.tsx`, so the quiz route does not expose version, commit, and build time in normal product chrome.
- [must] The provenance copy action is not the required concise one-line summary. `buildInfoSummary` in `src/services/buildInfo.ts` returns a multi-line string even though the operability standard requires a copyable one-line summary that includes the exact commit when available.
- [must] `QuoteState` in `src/domain/quoteCache.ts` allows illegal state combinations such as `status: "ready"` with `currentQuote: null`, or `status: "error"` with stale quote fields. The architecture standard requires making illegal states unrepresentable when TypeScript can model them.
- [must] Some pure or boundary decision helpers do not have focused tests, especially build provenance summary behavior and fresh API quote parsing. Existing tests are strong for pricing, formatting, quote cache status, quiz generation, timeline layout, and route behavior.
- [should] `src/styles/global.css` is 954 lines, above the Bright Builds file-size refactor trigger of roughly 628 lines.
- [should] `HomePage` and `QuizPage` are oversized route functions. `HomePage` is roughly 240 lines and `QuizPage` is roughly 176 lines, both above the function refactor trigger of roughly 161 lines.
- [should] `AGENTS.md` has no repo-local guidance outside the managed Bright Builds block. README documents Bun install and verification, but the agent entrypoint does not capture those recurring workflow facts.
- [may] There are a few compatibility-looking aliases or unused exports that can be simplified after confirming they are not intentionally public internal API: `satsToBtc`, `satsToApproxUsdCents`, `deriveQuoteSummary`, `formatAbsoluteTimestamp`, `quoteToDerivedMetrics`, and `stale-cache`.

### Findings Not Raised

- No active local standards overrides were found. `standards-overrides.md` still contains only placeholder template rows.
- No project-owned Python automation was found in this Bun-friendly TS/JS repo.
- No project-owned class inheritance was found.
- Tests sampled across domain, routes, and timeline components use clear Arrange, Act, Assert structure.
- Managed Bright Builds files were not edited during this audit.

### Verification Evidence

- Sync: `git fetch origin`; `git pull --rebase` reported already up to date.
- Install: `bun install --frozen-lockfile` completed successfully with Bun `1.3.9`.
- Baseline: `bun run verify` passed lint, typecheck, 8 Vitest files, 31 tests, and production build.

### Residual Risk

- This audit did not perform a browser visual pass; no repo-supported browser or E2E command exists yet.
- Managed file drift was reviewed by markers, audit manifest, and workflow posture, not by re-running the upstream installer or auto-update helper.
- `standards-overrides.md` was intentionally not changed. Any real exception should be approved and recorded separately.

## task-bright-builds-must-operability-state | 2026-06-20 19:14 CDT | Fix must-level operability and state-model findings

- [x] Move build provenance from the home route into stable product chrome, preferably the footer/app shell, so both `/` and `/quiz` expose version, commit, and build time.
- [x] Change `buildInfoSummary` to return one line, for example `version=0.1.0 commit=<full-sha-or-Unavailable> builtAt=<timestamp-or-Unavailable>`.
- [x] Preserve visible `Unavailable` fallback text for missing version, commit, and build timestamp fields.
- [x] Add focused tests for `buildInfoSummary` and the route-wide build provenance surface.
- [x] Refactor `QuoteState` into a discriminated union so ready/error/loading states encode their valid quote, error, and stale-field combinations.
- [x] Update quote store, home page, quiz page, and tests to consume the discriminated state without widening back to invalid nullable combinations.
- [x] Verify with `bun run verify` plus targeted tests for build info and quote state behavior.

### Completion Review

- Completed 2026-06-20 19:27 CDT.
- Evidence: `BuildInfoPanel` now renders through `AppShell`/`SiteFooter`; `buildInfoSummary` is one line; `QuoteState` is a loading/ready/error discriminated union.
- Verification: `bun run typecheck`, `bun run lint`, `bun run test`, and final `bun run verify` passed.

## task-bright-builds-ui-code-shape | 2026-06-20 19:14 CDT | Split oversized UI and stylesheet surfaces

- [x] Split `src/styles/global.css` into responsibility-focused CSS files while keeping `src/styles/global.css` as the single imported entrypoint.
- [x] Use stable groups for the split: base, layout, shared surfaces/buttons, timeline, quiz, build info, footer, and responsive rules.
- [x] Extract `HomePage` sections into named components or small helpers for hero, quote reference, quick anchors, timeline intro, method, and provenance removal.
- [x] Extract `QuizPage` flow/panel pieces so route-level code owns orchestration while display subcomponents own rendering.
- [x] Keep route paths, visible behavior, and public app behavior unchanged.
- [x] Verify with `bun run verify` and route/component tests that cover desktop and mobile timeline behavior.

### Completion Review

- Completed 2026-06-20 19:27 CDT.
- Evidence: `src/styles/global.css` is now an import entrypoint; the largest split stylesheet is `src/styles/timeline.css` at 289 lines.
- Evidence: `HomePage` now delegates to `HomePageSections`; `QuizPage` delegates rendering to `QuizPageView`.
- Verification: route/component tests passed during implementation; final `bun run verify` passed.

## task-bright-builds-domain-modeling-tests | 2026-06-20 19:14 CDT | Tighten domain invariants and pure-helper coverage

- [x] Add unit tests for `parseFreshQuoteFromApi`, including invalid quote rejection and missing API timestamp fallback behavior.
- [x] Review domain primitives that carry invariants, especially sats, USD cents, BTC/USD quote values, and quiz choices.
- [x] Introduce branded types, parsers, factories, or discriminated shapes only where they remove real invalid states or repeated validation.
- [x] Consider tightening `QuizQuestion` so the correct choice cannot drift from the choices list, or document why runtime construction is sufficient.
- [x] Remove unused compatibility aliases/exports after an `rg` reference check, or document why each alias is intentionally retained.
- [x] Verify with `bun run verify` and focused domain tests.

### Completion Review

- Completed 2026-06-20 19:27 CDT.
- Evidence: added focused `parseFreshQuoteFromApi` tests; `QuoteState` was the high-value discriminated shape; no extra branded primitives were introduced where they would only add ceremony.
- Decision: `QuizQuestion` keeps runtime construction plus focused tests because TypeScript cannot cheaply prove "exactly one correct choice from this shuffled list" without a heavier tuple/dependent model.
- Evidence: removed unused `satsToBtc`, `satsToApproxUsdCents`, `deriveQuoteSummary`, `formatAbsoluteTimestamp`, `quoteToDerivedMetrics`, and `stale-cache`.
- Verification: `rg` found no remaining references to those removed exports; final `bun run verify` passed.

## task-bright-builds-local-guidance | 2026-06-20 19:14 CDT | Add concise repo-local workflow guidance

- [x] Add a `## Repo-Local Guidance` section outside the managed block in `AGENTS.md`.
- [x] Include durable local facts: Bun is the package manager, dependencies install with `bun install --frozen-lockfile`, verification runs with `bun run verify`, and GitHub Pages builds use `PAGES_BASE_PATH=/thinking-in-sats/`.
- [x] State that no repo-supported browser/E2E command exists yet, so browser-level checks are manual unless a future task adds tooling.
- [x] Leave `standards-overrides.md` unchanged unless a concrete, approved exception exists.
- [x] Verify the diff does not edit the managed Bright Builds block.

### Completion Review

- Completed 2026-06-20 19:27 CDT.
- Evidence: `AGENTS.md` now has concise repo-local guidance after the managed Bright Builds block.
- Verification: `standards-overrides.md` remains unchanged; final diff review confirms managed Bright Builds block text was not edited.

## task-desktop-timeline-geometry | 2026-07-10 11:05 | Repair desktop vertical sats line

- [x] Reproduce the desktop geometry failures with a deterministic browser signal.
- [x] Add failing regression tests for the shared logarithmic domain and dense placement behavior.
- [x] Implement a unified timeline layout model and repair desktop rendering.
- [x] Verify desktop geometry at the breakpoint boundary and representative desktop widths.
- [x] Run `bun run verify` and review the final diff.

### Completion review

- Completed 2026-07-10 11:23 CDT.
- Root causes: the scale had no resolved height; marker and item positions used different logarithmic domains; global normalized spacing could not fit 32 cards; connectors mixed stage-relative and card-relative coordinates.
- Evidence: desktop geometry passed at 1121, 1280, 1440, and 1920 px with 32 in-bounds cards, seven distinct ticks, zero same-lane overlaps, and connector endpoints within 1 px.
- Mobile controls passed at 1120, 768, and 390 px with no overlap or horizontal overflow.
- Verification: `git diff --check` and `bun run verify` passed; 13 test files and 47 tests are green.

## task-desktop-timeline-breaks | 2026-07-10 11:38 | Compress sparse desktop timeline ranges

- [x] Confirm automatic break behavior, a 30rem inclusive threshold, an 8rem target, and spine zigzag styling.
- [x] Add failing unit tests for break detection, compression, protected decade markers, and capacity safeguards.
- [x] Implement piecewise axis compression and decorative desktop zigzags.
- [x] Raise decade labels above chart lines without changing card-badge layering.
- [x] Verify desktop and mobile geometry, then run `bun run verify` and review the final diff.

### Completion review

- At a fixed $100k quote, the layout produces the expected three breaks and compresses the desktop stage to about 264.7rem.
- Desktop geometry passed at 1121, 1280, 1440, and 1920 px with 32 in-bounds cards, zero same-lane overlaps, three visible zigzags, and connector endpoints within 1 px.
- Mobile controls passed at 1120, 768, and 390 px with list flow unchanged, no breaks or connectors, and no overlap or horizontal overflow.
- Visual review confirmed opaque spine interruptions and decade-label pills above crossing lines. `git diff --check` and `bun run verify` passed; 14 test files and 57 tests are green.

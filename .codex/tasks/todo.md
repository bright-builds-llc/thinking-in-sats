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

## task-homepage-content-hierarchy | 2026-07-10 14:20 | Simplify homepage content hierarchy

- [x] Remove the featured-anchor and total-item chips from the hero.
- [x] Replace the hero introduction with the approved educational copy.
- [x] Remove the “Main visualization” eyebrow.
- [x] Move the three explanatory cards below the vertical sats line.
- [x] Add regression coverage and run `bun run verify`.

### Completion review

- The hero now uses the approved copy and no longer renders either item-count chip.
- The vertical sats line no longer has a “Main visualization” eyebrow, and the three explanatory cards are the final homepage section beneath the line.
- Regression coverage verifies the copy, removed labels, retired Method pane, and section order. `git diff --check` and `bun run verify` passed; 14 test files and 61 tests are green.

## task-explore-prices-navigation | 2026-07-10 14:36 | Restore hero timeline navigation

- [x] Reproduce the broken Explore control with a deterministic regression test.
- [x] Restore scrolling to the vertical sats line without conflicting with hash routing.
- [x] Rename the control to “Explore prices in sats.”
- [x] Run focused checks and `bun run verify`.

### Completion review

- Root cause: `HashRouter` and the raw `#timeline` anchor both used the URL fragment, so the in-page link did not reliably own scrolling.
- The hero now uses a dedicated “Explore prices in sats” button that explicitly scrolls `#timeline` into view and respects reduced-motion preferences.
- The red/green regression test passes. Browser verification reached `timelineTop ≈ 0` while preserving `#/`; `git diff --check` and `bun run verify` passed with 14 test files and 62 tests.

## task-timeline-document-scroll | 2026-07-10 14:41 | Remove nested vertical timeline scrolling

- [x] Reproduce and identify the timeline element that owns vertical overflow.
- [x] Keep horizontal timeline overflow available without creating a vertical scroll container.
- [x] Verify the document remains the only vertical scrolling surface.
- [x] Run `bun run verify` and review the final diff.

### Completion review

- Root cause: positioned timeline content extended 15px beyond the stage; because the horizontal shell computed `overflow-y: auto`, 7px became a user-scrollable nested vertical range.
- Clipping only the inner stage’s vertical paint overflow preserves horizontal overflow while reducing the shell’s vertical range to zero.
- Browser verification passed at 1121, 1280, 1440, and 1920px. A wheel gesture over the line moved the document 600px while the shell stayed at `scrollTop = 0`.
- The repo has no supported browser-test harness, so the CSS invariant is documented beside the rule and verified with the deterministic browser measurement. `git diff --check` and `bun run verify` passed with 14 test files and 62 tests.

## task-randomized-quiz-session | 2026-07-10 15:00 | Add bounded random quiz sessions and results

- [x] Randomize quiz items without repeats for each session.
- [x] Cap each session at 10 questions or the number of available items.
- [x] Track correct answers and show a polished completion screen with score and percentage.
- [x] Add native sharing with a clipboard fallback and a fresh-session restart action.
- [x] Add regression coverage, browser-check the completion flow, and run `bun run verify`.

### Completion review

- The old quiz randomized answer choices but used a deterministic item sequence. Sessions now use a Fisher–Yates shuffle, contain no repeated items, and stop at 10 questions or the available item count.
- Correct answers accumulate through the round. The completion screen shows the exact score, percentage, tailored encouragement, a challenge prompt, Share, and Play again.
- Sharing uses the native share sheet when available and copies the score challenge plus `#/quiz` link otherwise. Restart creates a fresh randomized session.
- Browser verification completed 10 unique questions, matched the displayed score to observed answers, and passed desktop/mobile layout checks with no horizontal overflow. `git diff --check` and `bun run verify` passed with 16 test files and 69 tests.

## task-quiz-score-effects | 2026-07-10 15:35 | Add score halo and high-score lightning

- [x] Add a circular animated halo around every completion score.
- [x] Adapt procedural branched lightning from thunderhead-storm-lab for scores above 8/10.
- [x] Disable score-screen animation for reduced-motion users.
- [x] Change perfect-score encouragement to “Perfect score! Now you're Thinking In Sats!”
- [x] Add regression coverage, browser-check the high-score experience on desktop/mobile, and run `bun run verify`.

### Completion review

- Every completion score now has a rotating outer ring and softly pulsing second halo. Scores of 9/10 and 10/10 add a decorative canvas with randomized jagged paths, branches, layered glow, and brief screen flashes adapted from the local storm-lab technique.
- The procedural effect has no added dependency, stays behind the score content, and is hidden for reduced-motion users; the halo also becomes static under reduced motion.
- Component coverage verifies the halo, the inclusive 9/10 activation boundary, the exact perfect-score message, and reduced-motion behavior.
- Browser verification passed at 1280px and 390px with active lightning, centered halo, correct perfect-score copy, and no horizontal overflow. Reduced-motion emulation reported hidden lightning and no halo animations. `git diff --check` and `bun run verify` passed with 17 test files and 73 tests.

## task-quiz-answer-report | 2026-07-10 15:51 | Add a learn-from-mistakes quiz report

- [x] Preserve each completed question, selected answer, and correct answer through the round.
- [x] Add an accessible expandable report beneath the completion score.
- [x] Clearly distinguish correct answers from questions worth revisiting.
- [x] Include the selected range, correct range, and approximate USD anchor for every item.
- [x] Add regression coverage, browser-check desktop/mobile behavior, and run `bun run verify`.

### Completion review

- Each submitted answer is now stored as a typed record containing its question number, item snapshot, selected choice, correct choice, and outcome. The score is derived from that same history so the completion total and report cannot diverge.
- A collapsed native details card beneath the score opens into the full ordered round. Each entry shows the item context, learner choice, correct price range, BTC values, approximate dollar anchor, and a clear Correct or Review this one state.
- Play again clears the prior answer history along with the score. Regression coverage verifies exact answer preservation, ordered report rendering, result labels, dollar anchors, collapsed-by-default behavior, and restart cleanup.
- Browser verification passed with ten entries and a 5/5 correct-versus-missed split at 1280px and 390px. Mobile answer comparisons stack to one column, and neither viewport has horizontal overflow. `git diff --check` and `bun run verify` passed with 17 test files and 74 tests.

## task-footer-build-run-link | 2026-07-10 16:02 | Link Pages build timestamps to GitHub Actions

- [x] Derive an exact GitHub Actions run URL only for GitHub Pages builds.
- [x] Carry the optional run URL through the build provenance model.
- [x] Link the Built timestamp when a run URL exists and keep local timestamps plain.
- [x] Add focused regression coverage and run `bun run verify`.

### Completion review

- Pages builds now combine `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, and `GITHUB_RUN_ID` into the exact Actions run URL only when `PAGES_BASE_PATH` is present. Missing or malformed build metadata safely produces no URL.
- The optional run URL travels through the existing Vite build constants and `BuildInfo` model. The footer renders the Built timestamp as an accessible external link when available and plain text otherwise.
- A simulated Pages production build embedded `https://github.com/bright-builds-llc/thinking-in-sats/actions/runs/123456789`; the subsequent normal build contained no Actions run URL.
- Focused domain and footer coverage passes. `git diff --check` and `bun run verify` passed with 18 test files and 79 tests.

## task-global-lightning-easter-egg | 2026-07-10 16:19 | Add a five-tap lightning easter egg

- [x] Recognize five qualifying pointer taps inside a rolling 800ms window.
- [x] Ignore drags, long presses, secondary buttons, and multi-touch without blocking page interactions.
- [x] Emit a gravity-driven spinning lightning emoji from every qualifying tap.
- [x] Flash a procedural full-viewport lightning bolt when the gesture completes.
- [x] Provide reduced-motion fallbacks for both effects.
- [x] Add regression coverage, browser-check controls/desktop/mobile, and run `bun run verify`.

### Completion review

- A passive capture-phase pointer observer now recognizes five primary taps within an inclusive rolling 800ms window. It never prevents default behavior or stops propagation, and the visual overlay itself uses `pointer-events: none`.
- Pointer candidates are rejected after more than 12px of travel, more than 600ms, a non-primary button, concurrent pointers, cancellation, or window blur. Regression coverage exercises all of these boundaries plus a real button click that still fires exactly once.
- Every qualifying pointer tap emits a capped decorative ⚡ particle with randomized horizontal velocity, upward launch, continuous spin, and 940px/s² gravity. Five taps reuse the procedural branched renderer from the quiz celebration for a full-viewport strike.
- Browser verification passed at 1280×900 and 390×844: mouse and touch-style sequences each produced five particles and an active canvas matching the viewport, a drag produced zero particles, the menu still opened normally, and mobile had no horizontal overflow. Measured particle positions rose from 401px to a 310px apex before falling to 717px while rotating.
- Reduced-motion mode shows brief static emoji hints and one subdued 0.58-opacity bolt without flight or flicker. `git diff --check` and `bun run verify` passed with 20 test files and 92 tests.

## task-five-finger-lightning | 2026-07-10 16:32 | Add five-finger lightning gestures

- [x] Trigger the viewport strike when a fifth valid touch contact lands.
- [x] Emit one particle per qualifying finger in multi-touch groups without advancing the rapid-tap counter.
- [x] Preserve native scrolling, pinching, buttons, and the existing five-rapid-taps gesture.
- [x] Reduce emoji size and raise the maximum spin rate to 1,440 degrees per second.
- [x] Add regression coverage, browser-check mobile behavior, and run `bun run verify`.

### Completion review

- The passive observer now groups concurrent `pointerType: "touch"` contacts. It evaluates the group exactly once when active contacts first reach five and triggers immediately only when every contact remains within the 12px and 600ms tap boundaries.
- Clean fingers in any multi-touch group emit independently at their release coordinates. Multi-touch groups never contribute to the rolling rapid-tap counter, while single mouse, pen, and touch input retain the existing five-in-800ms behavior.
- Canceled, dragged, and long-held fingers emit nothing without suppressing qualifying siblings. Extra contacts after the fifth do not retrigger the strike, and blur still clears all gesture state.
- Particle sizing is now `clamp(0.72rem, 1.6vw, 1rem)`, and randomized spin magnitude spans 420–1,440 degrees per second. Reduced-motion particles remain static.
- Browser verification at 390×844 confirmed the fourth contact stayed inactive, the fifth activated before release, five releases produced five particles, the computed font size was 11.52px, `touch-action` remained `auto`, controls still worked, and there was no horizontal overflow. A moved two-finger gesture emitted nothing; reduced motion produced five static particles.
- `git diff --check` and `bun run verify` passed with 22 test files and 98 tests.

## task-background-only-lightning | 2026-07-10 17:02 | Restrict lightning gestures to page backgrounds

- [x] Define explicit background and header gesture regions.
- [x] Exclude panels, cards, footer content, and interactive header controls from particles and strikes.
- [x] Apply the same eligibility rule to rapid taps and multi-finger groups.
- [x] Add regression coverage for eligible and excluded targets.
- [x] Browser-check background/header/panel behavior and run `bun run verify`.

### Completion review

- Background eligibility is now explicit rather than inferred from card class names. The shell, page-layout gaps, and non-interactive header content are eligible; foreground descendants, footer content, links, buttons, and other header controls are not.
- Eligibility is captured on `pointerdown` and shared by emoji emission, the rolling five-tap counter, and five-finger validation. A foreground contact neither emits nor advances a gesture, and one foreground finger invalidates the group when it first reaches five contacts.
- Browser verification at 390×844 confirmed one header-copy click emitted a particle, panel and Menu clicks emitted none, the Menu still worked, and five rapid shell-background clicks emitted five particles plus the full-screen strike without horizontal overflow.
- Focused coverage passed with 19 tests. `git diff --check` and `bun run verify` passed with 22 test files and 102 tests.

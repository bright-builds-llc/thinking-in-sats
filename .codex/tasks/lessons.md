## lesson-hash-router-page-anchor | 2026-07-10 14:39

- What went wrong: The hero used `#timeline` for in-page navigation even though `HashRouter` already owns the URL fragment, so the control did not reliably scroll to the timeline.
- Preventive rule: In hash-routed apps, implement same-page scrolling explicitly and cover the click-to-target behavior with a regression test.
- Trigger signal: Treat any standalone fragment link such as `href="#section"` as a routing conflict when the application URL already uses `#/...` routes.

## lesson-overflow-axis-coupling | 2026-07-10 14:43

- What went wrong: The horizontal timeline shell used `overflow-x: auto`, which computed the vertical axis to `auto`; positioned-card paint overflow then created a 7px nested vertical scroll range.
- Preventive rule: For horizontal-only scroll shells, measure both computed overflow axes and clip descendant paint overflow before it reaches the shell.
- Trigger signal: Investigate any horizontal shell where `scrollHeight > clientHeight`, even by only a few pixels, or where assigning `scrollTop` succeeds.

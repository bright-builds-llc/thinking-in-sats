# Standards Overrides

Use this file to record deliberate deviations from the canonical coding and architecture standards.

## Active overrides

| Standard | Local decision | Rationale | Owner | Review date |
| --- | --- | --- | --- | --- |
| `standards/core/operability.md` runtime provenance copy action | Footer build info omits a copy summary control and links the short commit hash to the exact GitHub commit instead. | The footer should stay quieter for this small app while still exposing version, build time, and the exact source commit through the link target. | `thinking-in-sats maintainers` | `2026-12-21` |

## Notes

- Prefer narrow, explicit exceptions over broad "this repo is different" statements.
- If local verification is intentionally hook-owned or leaves heavy suites to CI, record that explicitly here.
- Revisit overrides periodically instead of letting them become permanent by accident.
- If an override becomes common across many repos, move it back upstream into the canonical standards repo.

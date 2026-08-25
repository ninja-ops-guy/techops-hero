# TechOps Hero — Runtime Authority Map

**Status:** production consolidation guardrail
**Canon source:** Story Bible v1.2 / `PRODUCTION_BASELINE_v1.2.md`

The repository contains a long historical hook stack. Those files are still allowed to provide mechanics, rendering, content, and compatibility behavior, but they are no longer allowed to become new authorities for campaign meaning.

## Canonical authority

| Concern | Authority | Rule |
|---|---|---|
| Opening campaign state | `campaign_act1.js` | Owns canonical Day 1 flags, ticket ownership, evidence perspective, Sector 04 eligibility, Tuesday transition, and save migration. |
| Full campaign facts/order | `campaign_story.js` | Owns act prerequisites, produced facts, endings, and hard campaign progression semantics. |
| Scene schema | `campaign_scene_schema.js` | Validates authored scene IDs, speakers, text limits, state writes, branches, and dead-end protection. |
| Runtime adapter | `campaign_runtime.js` | Bridges systems to canonical campaign state; must not invent parallel story state. |
| Day 1 presentation/world | `campaign_native_act1.js` | Owns authored standup/workstation/ticket presentation and base-runtime gating. |
| Campaign assets | `campaign_assets.js` | Owns canonical campaign asset IDs and filenames. |
| Sector 04 semantics | `campaign_sector04.js` | Owns mission understanding/suppression/dependency/verification semantics. |
| Sector 04 browser bridge | `campaign_sector04_runtime.js` | Adapts Sector 04 semantics into the Night Walker browser runtime and recovery path. |

## Historical providers

`game.js`, `night_hooks.js`, `office_hooks.js`, `org_hooks.js`, and `v53_hooks.js` through `v737_hooks.js` remain production dependencies where they provide mechanics or rendering that has not yet been absorbed into stable modules.

They are **providers, not canon authorities**. In particular, new production work must not place any of the following exclusively inside a historical version hook:

- campaign reveal state;
- character identity knowledge;
- ending eligibility;
- authoritative ticket ownership;
- Evidence/Trust campaign gates;
- MORNINGSTAR prerequisite state;
- Felicia playable eligibility;
- K reveal/personhood state;
- final epilogue routing.

The static browser contract now requires the final historical hook (`v737_hooks.js`) to load before `campaign_act1.js`, and prevents another `_hooks.js` entry from loading after `campaign_native_act1.js`. This gives the canonical campaign layer final authority over the composed runtime.

## Consolidation strategy

Historical hooks should be retired by behavior cluster, not by version number alone. A hook may be removed only after its surviving behaviors have an explicit destination and regression coverage.

1. **Inventory** — identify every wrapper/global mutation performed by the hook.
2. **Classify** — mark each behavior as `retain`, `absorb`, `replace`, or `delete`.
3. **Absorb** — move production behavior into a stable named module grouped by concern.
4. **Prove parity** — run existing campaign/static/night/mobile regressions plus a targeted test for the absorbed behavior.
5. **Remove one hook at a time** — do not batch-delete the historical stack.
6. **Verify Pages** — confirm the deployed entrypoint still loads all required payloads.

## Stable module targets

Future consolidation should converge toward named concern modules rather than new numbered hooks:

- `runtime_day.js` — ordinary day simulation and movement integration
- `runtime_night.js` — Night Walker engine integration
- `runtime_ui.js` — HUD/dialog/panel/touch presentation
- `runtime_audio.js` — music, duck/resume, SFX, ambient state
- `runtime_characters.js` — character rendering/action-state adapters
- `runtime_world.js` — room/map/prop/world transitions
- `campaign_*` — authored campaign semantics and presentation

These target names describe destination architecture; they should only be created when an existing production behavior is actually being absorbed.

## No-new-hook rule

Do not add `v738_hooks.js`, `v739_hooks.js`, or another numbered production hook. New work must either extend the existing canonical module responsible for that concern or create a stable concern module with an explicit authority boundary and tests.

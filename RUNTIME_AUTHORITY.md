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
| Good Dogs home opening | `good_dogs_home_scene.js` / `good_boys_button_hard_fix.js` | Title mode selection and domestic prologue; the ship movie remains owned by M2 boarding. |
| Good Dogs co-op | `good_dogs_coop.js` | Independent local input and pair mechanisms; consumes `cinematic_systems.js` puzzle definitions and the existing pair damage/step provider. |
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

## Contextual Night Crawler combat

`night_combat.js` owns street attack phases, grabs, throws, stun and finite air juggles. The existing `night_hooks.js` step calls it directly and retains locomotion, district travel and enemy AI outside reaction states. Contact resolves augments and KO rewards once; `night_reference_visuals.js` consumes presentation poses. Good Dogs, Sector 04 and Waldo's property are excluded.

`night_combat_input.js` owns double-tap/flick detection and the optional touch
controls. It calls the same combat service for dash/grab and queues explicit jump
edges; it cannot move enemies or award hits. `night_move_visuals.js` samples that
service's paused simulation clock and draws `night_move_atlas.js` frames through
the stable reference renderer. It owns no damage, input listener or frame loop.

`runtime_scene_art.js` supplies passive background, ground, platform and property
prop layers at existing render call sites. Its five scene bindings are presentation
only. `good_dogs_home_scene.js` retains the domestic prologue/garage handoff; no
campaign progression or collision authority is transferred to the art module.
See `docs/VISUAL_COMBAT_INTEGRATION.md` for capture provenance and acceptance scope.

## Street combat feedback and next-shift continuity

`runtime_hud.js` is a passive CSS-space presentation service called directly by
the existing Night render owner. It combines street status, messages, combat
instructions and `runtime_combat_audio.js` captions without a new frame loop.
Its viewport geometry also supports the existing Good Dogs single-HUD owner.
It does not own input, health, world coordinates, saves or story progression;
Good Dogs, Sector 04 and Waldo remain excluded from its Night renderer.

The standup board reads canonical ticket records and confirmation flags. Its
scrollable DOM presentation cannot assign tickets; the existing dialogue remains
the sole owner of standup choices. Shared v725 cinematic controls read the
owner's presentation snapshot and dispatch to that owner, without a second clock.

`runtime_combat_audio.js` owns only the street-combat SFX bus and its volume/caption
preferences. `night_combat.js` emits semantic events directly; `night_hooks.js`
provides actual incoming block contacts and access through the existing Charger
menu. The new service never owns damage, rewards, a frame loop, or soundtrack
playback. Good Dogs, Sector 04 and Waldo are excluded.

`campaign_act1.js` owns the deterministic Tuesday handoff and independently recorded
ordinary-ticket follow-up outcomes in the existing campaign save. The native Act I
adapter owns contact/workstation presentation. Historical `ticketRecord` and
current-service presentation remain separate: later verification cannot rewrite
the original casebook's outcome, completion owner, or evidence provenance.
See `docs/GAMEPLAY_FEEDBACK_WORKDAY_PASS_2026-09-12.md` for scope and validation limits.

# PR #59 review guide

> Generated from `review_contracts.json`. Edit the inventory, then run `node scripts/generate_review_guide.js`.

## Logical review map

| Domain | Files | Primary tests |
| --- | --- | --- |
| Cinematic and mode ownership | `production_title_experience.js`<br>`production_mode_router.js`<br>`runtime_mode_shell.js`<br>`production_runtime_safety.js`<br>`runtime_night.js` | `test_production_title_experience.js`<br>`test_runtime_mode_shell.js`<br>`test_production_runtime_safety.js`<br>`test_night_lifecycle.js` |
| Day persistence and operations loop | `game.js` | `test_game_resume_checkpoint.js`<br>`test_difficulty_contract.js`<br>`test_ticket_lifecycle_contract.js` |
| Canonical campaign continuity | `campaign_story.js`<br>`campaign_act1.js`<br>`campaign_act2.js`<br>`morningstar_build.js`<br>`morningstar_swarm_runtime.js`<br>`swarm_doctrine.js` | `test_story_authority_firewall.js`<br>`test_campaign_ordered_act4_progression.js`<br>`test_campaign_save_reload.js` |
| Good Dogs co-op and authored media | `good_dogs_cutscenes_v2_2.js`<br>`good_dogs_coop.js`<br>`good_boys_progression_authority.js`<br>`good_boys_earthfall_ending.js`<br>`good_boys_button_hard_fix.js` | `test_review_contracts.js`<br>`test_good_dogs_coop.js`<br>`test_good_dogs_state_integrity.js`<br>`test_good_dogs_route_contract.js` |

## Failure-mode contracts

| ID | Failure mode | Invariant | Executable test | Spot check |
| --- | --- | --- | --- | --- |
| `GD_CODEC_CAPABILITY` | An environment without an H.264 decoder attempts the authored movie and enters a retry or autoplay loop. | Playback eligibility is decided from MediaSource.isTypeSupported and HTMLMediaElement.canPlayType, never a user-agent string; unsupported environments remain at a visible PLAY/SKIP recovery surface. | `test_review_contracts.js#GD_CODEC_CAPABILITY` | Stub both capability probes as unsupported; confirm no media source is loaded, VIDEO UNSUPPORTED — SKIP is visible, and campaign state is unchanged. |
| `GD_NO_INVISIBLE_ADVANCE` | Media failure or missing decode advances the campaign without a completed movie or deliberate skip. | Only COMPLETED or USER_SKIPPED may settle a cutscene; capability failure is non-terminal and cannot write watched state. | `test_review_contracts.js#GD_NO_INVISIBLE_ADVANCE` | Open a cutscene with both probes unsupported and verify its promise remains pending until the explicit SKIP control is used. |
| `GD_SKIP_IDEMPOTENT` | A double tap, keyboard event, or late ended event applies cutscene completion more than once. | The first terminal event owns settlement; every later skip or completion event is a no-op and produces no second state write. | `test_review_contracts.js#GD_SKIP_IDEMPOTENT` | Trigger skip twice and then emit ended; verify one result, one state write, and the same narrative state as a single skip. |
| `CANONICAL_STORY_NON_BYPASS` | A historical Felicia confrontation, boss, unlock, or day-ending route re-enters canonical Story Bible mode. | Canonical story mode fails closed across every historical route and Felicia becomes playable only after the ordered Act VI Duet reward. | `test_story_authority_firewall.js#canonical-firewall` | Load canonical mode with legacy Felicia save keys and call public legacy scene APIs; no retired scene, reward, or durable unlock may fire. |
| `MODE_SHELL_SINGLE_OWNER` | Day, Night, and Good Dogs retain duplicate presentation or input ownership after a handoff. | The production bootstrap installs one runtime mode shell and repeated enter/exit calls restore the exact owned surface and input snapshot once. | `test_runtime_mode_shell.js#single-owner` | Enter and exit Night twice from both title and Day; confirm one shell install, no held input, no duplicate blockers, and exact Day restoration. |

## Deletion and retirement ledger

| ID | Removed or retired | Why | Resurrection check |
| --- | --- | --- | --- |
| `RETIRED_FELICIA_VILLAIN_ROUTES` | Early Felicia confrontation, secret-boss unlock, premature playable selection, and historical ending schedules in canonical mode. | They conflict with the Story Bible v1.2 trust-to-alliance arc and ordered Act VI Duet reward. | `test_story_authority_firewall.js#canonical-firewall` |
| `RETIRED_LEGACY_EARTHFALL_REPLAY` | Automatic b736m8 canvas finale replay from completed standalone Good Dogs resumes. | The authored Earthfall authority owns completion, persistence, replay, and return-to-title semantics. | `test_review_contracts.js#RETIRED_LEGACY_EARTHFALL_REPLAY` |
| `RETIRED_DUPLICATE_MODE_OWNERSHIP` | Independent mode handoff writes that left Day UI, held input, or ARIA blockers active beneath Night or Good Dogs. | One reversible mode shell must own presentation and input boundaries. | `test_review_contracts.js#RETIRED_DUPLICATE_MODE_OWNERSHIP` |

## Approval boundary

Do not merge until the named remote checks in the PR description are successful and every contract above has an executable test reference. Physical-device and licensed-browser media certification remain separate release gates.

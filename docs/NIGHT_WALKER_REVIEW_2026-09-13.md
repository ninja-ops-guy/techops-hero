# Night Walker review — 13 September 2026

## Evidence and release status

Reviewed the deployed `https://ninja-ops-guy.github.io/techops-hero/` through real title/difficulty/dialog/keyboard interaction and inspected the repository against `DOC_AUTHORITY.md`, `PRODUCTION_BASELINE_v1.2.md`, `RUNTIME_AUTHORITY.md`, and `VISUAL_REFERENCE_STANDARD.md`. The canonical production baseline, rather than historical roadmap promises, determines the findings below.

At review time Pages had deployed main `9c2e85bbe9c47c98bf0d4902e618ab2eaa0aad2c`. Draft PR #49 remained unmerged, so its traffic travel and outdoor building entrances were not live. This review extends that PR; it does not deploy it.

**Actual live reproduction:** select NIGHT CRAWLER, then Intern. The Day Shift CIO Dispatch / Clock in dialog persists over the Night street. The Charger and E DRIVE prompt are visible behind it. Dismissing the lingering dialog and pressing E opens the Charger menu. This establishes a dialog/input blocker; it does not establish that every vehicle problem has the same cause. A live screenshot was inspected during reproduction; no screenshot file is attached to this report and no invented frame is presented as evidence.

**CI evidence on the previous PR head:** Night lifecycle, runtime bot, and Night combat integration workflows passed. Merge Gate failed in Chromium-touch: the third airborne contact was classified as a launcher after a grounded recovery frame erased an already engaged follow target. The event trace included rising kick, air, air kick, then launcher. This is a separate input/physics defect from the car blocker.

## Bible comparison and implementation map

| Priority | Bible requirement / observed gap | Change in this PR | Remaining acceptance / work | Responsible files |
| --- | --- | --- | --- | --- |
| P0 | Night launch must reach interactive gameplay; Day Dispatch obstructed the live car | Suppress Day welcome at its source for pending or mounted Night; contextual attack opens the Charger owner directly | Fresh deployed iPhone launch and vehicle acceptance | `game.js`, `night_combat_input.js`, `test_night_campaign.js` |
| P1 | Cars remain outdoors; travel is playable | Retains PR49's traffic avoidance, curbside arrival, physical Foundry door, interior encounter preservation and car exclusion | Merge/deploy, then manual visual acceptance; authored facade and civilian-car art remain unapproved | `night_travel.js`, `night_hooks.js`, `v733_hooks.js`, `runtime_scene_art.js` |
| P1 | Night recontextualizes the Day investigation instead of functioning as a disconnected brawler | Persistent next-objective button and journal read canonical progress: opening, Impossible Access, Sector 04, Tuesday, badge, daylight meeting, verified trace, rooftop and Duet guidance | Full campaign remains a Day/Night spine. District completion alone deliberately cannot finish chapters | `night_campaign.js`, `runtime_night.js`, `gameplay_recording_cohesion.js` |
| P1 | Sector 04: Observe → Fight → Insight → Dependency → Environmental Action → Verify | Preserves existing adapter and same-encounter journal resume; Tuesday returns restore Act II contacts | Recheck the complete story encounter after deployment; not rewritten as ordinary combat | `campaign_sector04_runtime.js`, `runtime_night.js`, `night_campaign.js` |
| P1 | Rooftop corroboration must be earned and precede recognition | Spatial Downtown stairwell; bounded rooftop encounter; clear security and observe two separate points for 1.5 seconds each; movement away interrupts; both observations persist canonical evidence | Functional investigation uses existing Downtown scenery and runtime markers. It still needs an authored violin performance, audio/signal choreography, foreground cables, cinematic handoff and approved environment composition. This is not final visual acceptance | `night_campaign.js`, `night_hooks.js`, `campaign_act2.js` |
| P1 | No menu-only rooftop proof or premature identity | Day rooftop contact routes to Night instead of awarding evidence by clicking “Observe”; pre-reveal identity presentation is hidden. Recognition is explicit, uses canonical prerequisites, and does not unlock free play | Existing saves with already-earned evidence are retained; no migration fabricates or revokes progress | `campaign_native_act2.js`, `night_campaign.js`, `campaign_act2.js` |
| P1 | Evidence and Trust stay separate; daylight meeting before operational recognition; Duet is sole free-play gate | New route requires badge proof, daylight meeting and verified MORNINGSTAR trace. Rooftop observations change Evidence only; recognition grants the existing bounded support policy | Parts in Motion component missions and the actual Duet companion encounter still require end-to-end campaign integration; a semantic gate is not a fully authored mission | `night_campaign.js`, `campaign_act2.js`, `campaign_native_act2.js` |
| P1 | Reachable, readable phone controls | Ordinary Night uses a movement pad with 52–60 px targets and one two-column action cluster with 62–72 px targets. ATTACK changes to DRIVE / ENTER / EXIT / INSPECT by context. JUMP, KICK and MORE share that cluster. Extra grab/dash/block controls are optional | Physical iPhone Safari portrait/landscape and safe-area acceptance pending. Sector 04 and Good Dogs retain their distinct control owners and need their own consolidation review | `night_combat_input.js`, `night_mobile_visual_cohesion.js`, `scripts/night_combat_bot.mjs` |
| P1 | Movement-based combos and reachable air chains | Keeps double-tap left/right dash, attack-after-dash grab, directional throws and explicit jump follow. Grounded recovery no longer loses engaged air follow; cap and landing recovery remain bounded | Latest browser CI must confirm the previous Chromium-touch failure is resolved | `night_combat.js`, `test_night_follow_window.js`, `test_night_movement_combos.js` |
| P1 | Continuous campaign through rescue, Ghost Fork, Watchdog, ORPHEUS and printer ending | Journal points back to existing eligible campaign owners without inventing completions | Existing Good Dogs and later chapter modules are present, but the ordinary Night district loop is not a continuous playable implementation of all later chapters. Needs authored entry/exit routing, objective persistence, companion transitions and checkpoint replay coverage. K identity remains gated; ORPHEUS must remain a moral decision, not a replacement boss | `campaign_story.js`, `chapters_vii_x.js`, `campaign_completion_runtime.js`, Good Dogs runtime modules |
| P2 | Cohesive presentation, no misleading exit/HUD | Rooftop hides the street exit arrow/car/lane marks and uses mission HUD labels; messages have visible lifetimes | Rooftop markers and recycled Downtown scenery require art review; ordinary street status cannot stand in for mission feedback | `night_hooks.js`, `night_campaign.js` |

## Controls

- Move/aim with the larger directional pad.
- Double-tap left or right to dash; attack during the dash to grab a nearby eligible enemy.
- Direction aims throws; JUMP explicitly follows an airborne target.
- ATTACK is the contextual vehicle/door/inspection button when grounded at the relevant location.
- MORE exposes optional direct controls. Existing button identities and input listeners are retained across mode changes.
- Travel has its own lane controls and simulation owner. Mission transport and Good Dogs flight are separate systems.

## Validation

The local aggregate production gate passes, including the new campaign regression suite and the existing travel, lifecycle, combat, save/reload, identity, runtime ownership, assets and quarantine suites. New coverage checks the Day/Night launch guard, direct car dispatch and dialog blocking, prerequisite order, spatial entry, mode isolation, guard clearing, interrupted/paused observations, two-point evidence persistence, explicit recognition, unchanged trust/free-play gates, retry after failed storage, restoration of the original street encounter and Sector 04 continuity.

The lifecycle browser test also exercises rooftop entry, two real timed interactions, recognition and the retained Duet gate; its prerequisite/security fixtures are explicitly labeled and are not a combat playthrough claim.

The first browser run of this revision caught the later recording stylesheet placing the tutorial toast over Up at 320 px. The fix moves that passive hint above the pad and disables its pointer interception.

The existing browser combat acceptance test now requires action targets at least 62 px, movement targets at least 52 px, no intersecting control rectangles, viewport containment and reachable hit targets at 320 px and 390 px portrait and 844 px landscape. These updated browser assertions have not been run locally: Cloud Browser previously rejected the local preview under its URL policy, and no workaround was used. Ordinary repository CI remains the browser gate. Physical-device testing is not claimed.

This review is not a comprehensive screenshot crawl of every mode or late-game segment. No new concept art, overpaint, animation atlas or screenshot has been invented or included. See `docs/qa-night-travel/README.md` for the prior travel implementation's scope and limits.

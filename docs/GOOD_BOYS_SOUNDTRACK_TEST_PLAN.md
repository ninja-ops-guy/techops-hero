# GOOD BOYS soundtrack — implementation roadmap and testing plan

**Status:** planned; all runtime milestones below are unimplemented by this documentation change.
**Spec:** [GOOD_BOYS_DIEGETIC_SOUNDTRACK_SPEC.md](GOOD_BOYS_DIEGETIC_SOUNDTRACK_SPEC.md).
**Base:** `a7fa4066a4945bbcdc9d3e1259f61f2c18e3223b`.
**Branch:** `testing/good-boys-diegetic-soundtrack-spec`.

## Branch and release rules

This branch contains a design package only. It does not modify `index.html`, production saves, assets, workflow definitions, or deployed gameplay. Implementation should continue on this branch or a child branch after reconciling changes from main. Never force-push over another contributor's work.

The implementation needs an explicit default-off feature flag and a disposable testing save namespace. URL/query entry alone cannot authorize importing test progress into canonical saves. Provide two launch paths: isolated episode fixtures for scene debugging and a normal-player integrated route proving all prerequisite handoffs. The latter is required for release; a fixture walkthrough alone is insufficient.

Before any preview deployment, inspect the repository's current publishing triggers and use an isolated preview destination. A branch push is not evidence of a deployed test build. Merge/deployment require a later implementation release decision and passing production gates, not this spec commit.

## Delivery milestones

| ID | Priority | Work | Dependency | Exit evidence |
|---|---|---|---|---|
| GB-00 | P0 | Inventory masters/art; define scene IDs and validated state schema; capture current route/actor/audio ownership; prepare disposable save fixtures | Spec | Asset ledger, no invented timestamps, migration/ownership contract review |
| GB-01 | P0 | Build Cell 118 counting/scratches and Politely slice; pause/return M4 safely; gesture-driven audio, mute/retry, cue lifecycle | GB-00 | Real keyboard/touch count, save/reload, QTE assist, return to same M4 checkpoint without leaked state |
| GB-02 | P1 | Block/clock, local memory loop, zero-G, sleep, radio, Earth inspection | GB-01 | Clock solved with partial collection; repeated detection preserves tallies; no 90-minute wait; muted radio solvable |
| GB-03 | P1 | M5/M6 K interactions, keypad, approach choice, human pair traversal, dog boss handoff | GB-02 | Both routes; solo AI and local co-op; actual dog tandem victory; no actor/input duplication |
| GB-04 | P1 | Playable M8 descent, viewport hand, optional transmission, property landing and gas-station coda | GB-03 | All four return; failure/retry and skip-safe presentation; completion committed once |
| GB-05 | P1 | Album reward/MUSIC/standup playback; tally callback and sleep dialogue in Ghost Fork | GB-04 | 117/118 boundary, replay collection, no premature identity reveal, opening MUSIC contract preserved |
| GB-06 | P1 | Bind mastered tracks/markers and approved art; visual/audio/accessibility/performance pass | GB-01–05, approved assets | Measured cue drift, phone mix review, real screenshots and physical-device route |
| GB-07 | P0 release gate | Full integrated regression, failures, reloads, cross-browser and physical iPhone acceptance | GB-06 | Reproducible artifact bundle on candidate SHA and no outstanding blockers |

P0 labels identify foundations or release blockers; they do not imply later milestones can run before their dependencies. Deliver the Cell 118 slice first, then finish the whole arc before claiming the EP is integrated.

## Acceptance matrix

Every row is a planned requirement, not a report of tests already run.

| ID | Scenario / action | Required result |
|---|---|---|
| ST-01 | Feature off: new game, Good Dogs, Day/Night switches | Existing route and input/audio ownership unchanged |
| ST-02 | Enter interlude before versus after M4 reveal | Before rejected; after cleanly pauses M4 with one owner |
| ST-03 | Inspect/scratch duplicate bolt repeatedly, reload | Distinct count unchanged; set persists; no duplicate tick on save replay |
| ST-04 | Finish with 117 versus 118 scratched IDs | Reward locked at 117, eligible at 118 only with completion prerequisites |
| ST-05 | Use accessible panel counting | Same unique IDs and scratch semantics, no rapid-click requirement |
| ST-06 | Proceed after minimum count tutorial | All remaining story scenes accessible; missing collection can be replayed |
| ST-07 | Fail Smile repeatedly; use extended/auto assist | Bounded oxygen, no hardlock, assist preserves eligibility |
| ST-08 | Clock entry wrong, repeated 1, hint, muted play | `1 → 1 → 8` works with confirmation and clue; all other entries recover |
| ST-09 | Detect K before and after clock solve | Local loop only; scratches/clues/solved shaft retained, no canonical rollback |
| ST-10 | Pause/background during orbit/QTE | No hidden simulation advance or retroactive failure |
| ST-11 | Attempt sleep 0, 1, 3, 4 times | Flag only on attempt; completed interruption increments capped fatigue; no movement penalty |
| ST-12 | Solve radio with audio off | Equivalent visible clue/signal; memory flag granted through interaction |
| ST-13 | Earth inspection before/after Ghost Fork | House marker only in eligible replay context, no dependency cycle |
| ST-14 | Finish recollection with coordinates | Returns to captured M4 rescue checkpoint; no `k_freed` or `waldo_freed` from recollection |
| ST-15 | Attempt M5 exit without Index defeat or Access Node seizure | Existing gate rejects; no lyric/puzzle bypass |
| ST-16 | Wire and fire escape routes, fail keypad | Both recoverable; one Warden activation; correct inspected code unlocks |
| ST-17 | Miss catch, separate actors, switch control, disconnect pad | Safe pair recovery; no infinite throw loop, offscreen death, stuck input |
| ST-18 | Human pair → dog boss → all aboard | Correct identity/atlas/control prompt; no lingering human controls |
| ST-19 | Track ends or boss cutscene skipped while Warden alive | No victory; real dog tandem finisher still required |
| ST-20 | Reentry fail/retry and hand inspection | Checkpoint recovery; safe inspection; no replay of outbound ship/crash |
| ST-21 | Send/not-send/retry anonymous transmission | Once at most; no identity/Trust/evidence grant; both reach Ghost Fork normally |
| ST-22 | Homecoming/coda skip, double input, reload during finish | One completion, all four accounted for, no duplicate ending or mission 9 |
| ST-23 | Inspect tallies / recognition with and without sleep | Actual partial/full pattern; optional sleep line only after eligible recognition |
| ST-24 | Album during future standup, pause/exit, required Red in Mirror | Correct music resumes/ducks; no duplicate player, false opening flags or early timers |
| ST-25 | All three main endings after interlude | Ordinary printer epilogue intact; no ORPHEUS sting |
| ST-26 | Media 404, decode rejection, autoplay denial, slow download | Clear retry/mute path; no false success, stalled gameplay, or fake source binding |
| ST-27 | Seek/pause/resume across cue, exit with delayed callback | No repeated progression action; stale callback cannot affect another scene |
| ST-28 | Nested dialogue/pause ducking, change music volume | Restores user's current volume once after final duck reason releases |
| ST-29 | Save throws/returns failure at every handoff | Candidate rollback; visible retry; old committed checkpoint remains valid |
| ST-30 | Missing/old/malformed/newer-version save data | Safe defaults/migration or explicit unsupported-version recovery; no invented rewards |
| ST-31 | Portrait/landscape, safe areas, keyboard/gamepad/touch | Every interaction reachable; controls ≥48 CSS px; no HUD/actor overlap |
| ST-32 | Reduced motion/flash, captions, hold-toggle, assisted traversal | Complete arc and collection without audio-only or flash/timing dependency |
| ST-33 | 30/60/120 Hz, app interruption, repeated entry/exit | Stable mechanics; no growing timers/listeners/audio sources or camera drift |

## Automation integration

Extend existing behavior-focused tests, adding new named soundtrack tests only for new contracts. Useful existing regressions include:

- `test_good_dogs_state_integrity.js`, `test_good_dogs_bible_contract.js`, `test_good_dogs_route_contract.js`.
- `test_good_boys_completion_authority.js`, `test_good_boys_compositor_ownership.js`, `test_good_boys_world_isolation.js`, `test_good_boys_ui_ownership.js`.
- `test_good_dogs_coop.js`, `test_good_boys_combat_contract.js`.
- `test_campaign_opening_acceptance.js`, `test_static_entrypoint_integrity.js`.

Use a controllable clock and media adapter for unit-level cue lifecycle tests. Inject realistic save/media failures and stale asynchronous callbacks. Assert outcomes and owner cleanup, not just source substrings. Keep authored marker validation separate from simulated playback; mock audio cannot prove actual mix, decode or lyric sync.

Browser routes should extend the existing tooling where appropriate: `scripts/good_dogs_route_driver.mjs`, `scripts/good_boys_progression_bot.mjs`, `scripts/good_dogs_coop_bot.mjs`, `scripts/presentation_slice_bot.mjs`, and `scripts/late_game_mobile_bot.mjs`. Inspect each tool's current interface before running or extending it. Reuse `scripts/production_release_gate.js` and the current Campaign Contracts workflow as release gates; do not assume a docs-only push runs gameplay CI.

For implementation CI, update path filters to include the actual new cue manifest, audio integration module, tests, and assets. New files outside existing globs must not evade checks. Test both disabled and enabled feature configurations.

## Browser and human validation

Run the normal-player integrated route in Chromium, Firefox, and WebKit. Record browser/OS versions, candidate commit, master hashes, viewport and input type. Mobile emulation is supplementary. Physical iPhone Safari must validate touch, audio gesture unlock, rotation, app background/return, media interruptions, and the full M1→M8 route. Run a physical Android Chrome touch/audio smoke pass as well.

Separate results as: static contract, simulated interaction, fixture route, real-input integrated route, physical-device acceptance, and listening/visual review. A green fixture route cannot be summarized as “all gameplay verified.” Failures need the exact checkpoint, save fixture, reproduction input, observed/expected result, and evidence path.

Capture real screenshots/video of: ceiling; wall tally; camera QTE; rain memory; clock; 1984 silhouette; vent/Earth; sleep; radio; occupancy/keypad; handshake; human traversal; dog boss handoff; Warden arena; reentry; hand insert; property arrival; gas station; reflection; MUSIC album; Ghost Fork tally/recognition. Include portrait and landscape where composition changes materially. Do not manufacture screenshots or call approved concept art runtime evidence.

For audio, record the measured playback timestamp and marker crossing alongside screen capture. Review intelligibility and ducking on phone speakers/headphones, source continuity, clipping, and the intended muffled→full→radio→clear arc. Target caption drift within ±150 ms in steady playback; pause/seek recovery must not fire obsolete cues. Any exceptions need explicit evidence and correction before claiming exact sync.

## Release-blocking conditions

- Wrong actor, premature K identity reveal, displaced dog rescue, missing canonical M5/M6/M7 condition, duplicate completion, lost collection, invalid save promotion, or any softlock.
- Production audio bound by guessed name/time; missing masters presented as complete; overlapping players; unrecoverable media failure.
- Daytime weather/HUD/messages in orbit; unreadable required controls; inaccessible audio-only puzzle; flashing implementation contrary to settings.
- Placeholder art presented as final, absent physical iPhone acceptance, or a fixture-only claim of full route readiness.

Complete the plan with a small evidence index listing test ID, outcome, candidate SHA, browser/device, master hashes, screenshot/trace/log paths, and remaining defects. Keep unrun cases visibly unrun. This specification branch needs documentation/path/whitespace verification only; runtime tests become necessary when runtime behavior changes.

# Hold the Way Home — first playable response area

Owner approved the November 22 scenario specification and implementation in the
same conversation. Merge and deployment remain separately gated. This is a
game-only later defense of a surviving occupied pocket, not a replacement for
the comic's destruction or the already ruined streets in RT/LQ.

Approval source: [Low-Quarter-First-Playable-Siege-Review.md](https://chatgpt.com/library?file_id=libfile_fde3_f-d1729d670aa48191b98af32f6f6052aa_ffd948f5b8cc819189458c50cefab7ab&account_id=personal).
Authoring sources: current Story Bible v2.1 working copy version 12 (Nov 15
C01–36), Chorus-08 RT-01–07/LQ-02–03D, later outline version 5 and the approved
PR #152 contracts at `7c6e76977743bee48e6ce22e1bfa63cb50d78bf9`.

## Play

Complete the original ending and epilogue, open the LQ board and choose **Enter
Hold the Way Home**. Standalone modes cannot begin it. Save & return leaves the
mission checkpoint in the canonical campaign save. Re-enter through the same
board; a closed result stays closed.

Walk with arrows/A-D or the pointer controls. Hold E/Interact at a marker or
neighbor. Strike with J, guard with K, jump with Space. Pause and focus loss stop
the mission clock. The interface names nearby tasks and preserves the latest
observed consequence. Choice dialogs, focus containment and the pause controls
also work by keyboard. Touch layout/pointer acceptance is emulation; physical
iPhone Safari and simultaneous native touches need separate checks.

1. Collect the newly sourced coupling, fit it, load-test external power and run
   an unoccupied instrumented transfer. The old spare remains consumed.
2. Compare the optical trace with the independent lookout; visit every occupied
   doorway in each sector, return to its survey marker and deliver the warning.
3. Repair/load-test local services, arrange care/relief and test both outbound
   lanes. Speak to all residents individually and honor their choices.
4. At approaches, perform the selected ending's command encounters. Hold each
   test long enough for two local endpoint acknowledgments. Under Control,
   invoke the independent stop while a resident and attendant visibly cross;
   wait for both to reach safety before recording the correction.
5. Issue deployment orders and wait for real post arrivals. Confirm readiness.
   Preparation does not consume the assault window.
6. Physical crossing/flight/landing produces the approaches, services, shelters
   and departure fronts. Save the exposed human picket if possible, clear ramp
   attackers, seal unloading access, restore damaged distribution and hold.
7. If actual infected contact assimilates the picket, replace lost capacity,
   observe the bounded old-route attack and close that lane. The tested
   alternative remains usable. Cutting the landed relay stops new uploads and
   Sudo orders, not local facts or an already issued attack.
8. After each front resolves, physically revisit its doorways and perform the
   final local sweep. After the final hold, compare all four sweeps with the
   resident, shelter and receiving records. Explicitly confirm closeout.

For transport, escort consenting residents to their **origin-sector** gate.
They follow while K remains near them; walking ahead without them leaves them
behind. Inspect an available carrier to begin witnessed loading. Six resident
seats plus the separately accommodated driver/attendant are respected. Two
receivers check the actual bay handoff. The carrier and **both** crew physically
return before reuse. Visit receiving care along the screened ground route if
desired; it stays in the same realm, not aboard the ship. A physically
intercepted convoy remains interrupted/unresolved and its resources reserved.
No new recovery authority was added.

## Authored scope and resources

| Sector | Source anchor / layout | Required posts | Strength |
| --- | --- | --- | --- |
| Approaches | Handrail, street bend, proposed cleared apron and relay spur | a_screen, a_bend | 10 |
| Services | Secondary room and proposed repair lane | s_room, s_supply | 8 |
| Shelters | Occupied block and proposed rear courtyard | l_entry, l_rear | 8 |
| Departure | Proposed transfer court and outbound lane | d_gate, d_lane | 8 |

48 individually addressable residents: twelve in each sector. These are **not**
the entire neighborhood or realm population. Existing Earth residents and Mara
are not reused. Nera is the approved later local liaison; her presence does not
settle Mara's fate. K is the on-foot player, Iona works on the local services
signal line, other crew remain at their established stations. Dialogue labels
for new neighbors/staff are role descriptions rather than invented final names.

Eight strength-4 military detachments, a strength-2 human signal picket, two
strength-4 reserves and two optional strength-4 robot sections are local-realm
coalition resources. Strength denotes supported defensive capacity, not a head
count or the ability to personally kill the entire army. Units have one active
assignment and count only at the physical post. Reserve 1 can replace the lost
approaches capacity; reserve 2 can reinforce a selected sector's rear post.

Shutdown uses military-only coverage, independent records, local power/radios,
coalition agreement, relief and tested local command. No Orpheus reactivation.
Control tests Orpheus plus external stop, audit, civilian veto and actual harmful
order correction. The stopped services robot is replaced with military coverage;
the departure robot can contribute after command tests. Open Network earns
cooperation, tests shared coordination and exercises disconnected local fallback.
Neither retained coordinator certifies its own outcomes. The original endings,
eligibility, achievements and low-trust Control consequence are unchanged.

## Encounters and bounded adaptation

The approved game operation allocates four 60,000 manifest estimates, 240,000
combined, displayed as “hundreds of thousands.” This operation-specific content
number is not the old 200,000 test fixture or a universal canon population.
Each group includes accompanying hulls; the foreground landing is not a tiny
shuttle carrying 60,000. The current presentation is a readable code-art
blockout with K's existing `assets/v736/k_action_atlas.png`. It is not final
environment, ship-capacity, new character likeness or animation certification.

Proposed mission timing is retained: landings at 120/360/600/840 simulation
seconds, 20-second physical flight, 240-second Hopper recovery, final hold no
earlier than 1080. Time stops during preparation/pause/dialogs; no wall-clock
progress occurs on reload. Six/24-hour return accounting is separate from this
local assault clock. The access bridge visibly sources a new part and tests the
two-ended route instead of recycling the spent spare or invoking the Hopper.

Local active threats are capped at sixteen. Actual combat, movement, allied
range/fire, barrier/service damage and sealed unloading paths determine local
resolution. Distant formations are scenery and never produce receipts.

Only witnessed physical assimilation of the individual human picket acquires
`a_route_v1`, `a_bend_v1`, `s_isolation_v1`. A missing signal is not assimilation.
The first scenario uses only the old route for its teaching attack; the other
bounded facts remain known locally without becoming unrestricted enemy sensing.
Upload takes twenty local seconds and a Sudo order another ten. If the relay is
cut before delivery, local acquired knowledge can still direct the flank. No
new fallback, private thought, future choice or automatic fact refresh appears.
Reserve arrival restores actual defense strength; the lost picket stays lost.

## Interfaces, evidence and saves

- `campaign_low_quarter_scenario.js` registers `lq_hold_01:r1` through the existing
  siege/rescue authorities. Its approval declaration now follows explicit owner
  approval; it is not independent proof by itself.
- `campaign_low_quarter_mission.js` implements bounded world steps, collision/
  range combat, locations, hold interactions, independent local observations,
  actor/vehicle travel, access/command tests, source-bound events and phases.
  Normal players have no UI for arbitrary events or victory flags.
- `campaign_low_quarter_play.js` mounts the mission inside the real campaign,
  isolates its controls, reuses the K asset, saves milestones and unfinished
  world state and restores the prior surface when closed. Shared campaign maintenance parks unrelated
  Day/late-game installers while the siege owns the scene; periodic canonical
  validation remains and ordinary maintenance resumes on return.
- `campaign_low_quarter_runtime.js` retains inspection and irreversible
  closeout; entry/resume is available only after the original epilogue.
- `campaign_late_game_bootstrap.js` loads content, mission and play surface after
  rescue/siege authority. Cache references use `20261122-hold-r1`.

Optional `state.lowQuarterMission` schema 1 stores the world clock, position,
live threats, repairs, source observations, dialogue, actor travel, escorts,
carrier reservations and unfinished actions. It uses `TechOpsCampaign.save` and
`TechOpsLowQuarter.transact`; no second localStorage key or outcome owner.
Rescue schema 1 and siege schema 1, revision pinning, run identity, exact
`rescueCount`, unique event IDs, dual-count closeout and immutable results remain
authoritative. Failed persistence reloads the last durable world checkpoint.
Unknown/missing mission revisions preserve data and block only the unavailable
operation. Legacy saves remain unassessed rather than receiving success.

Physical producers bind real completed world conditions to the authored local
instrument record and independent witness. The validator still cannot prove a
trusted adapter's external truth. Source strings or a checksum do not certify
actual art, combat performance or a military event outside this single-player
world. Receiving care stays outside direct assault in this authored operation;
the current authority has no general receiving-safety invalidation extension.

Result presentation is limited to the surveyed area. `district_saved` does not
claim all of the Low Quarter saved, kill the distributed Chorus, resolve Iona's
campaign, grant Malar access or remove separate later-space preparation gates.

## Qualification

`test_campaign_low_quarter_mission.js` starts from a declared completed-epilogue
fixture and uses ordinary bounded movement, interaction, combat and dialogue
inputs for all mission events. It covers three no-assimilation full saves,
avoidable assimilation/countermeasure/relief, eight real transport trips for all
48 residents, refusal, proximity, preparation pause, reload, failed persistence
and future schemas. This is simulation acceptance, not browser playthrough.

`scripts/low_quarter_play_browser.mjs` opens the real game's board and attempts
the complete four-sector mission under all three endings plus emulated touch
layout. Only the pre-mission completed epilogue is seeded. Mission progression
uses keyboard/dialogue/pointer controls and Playwright virtual time in bounded
250ms frames feeding the unchanged 100ms world steps, with no
injected mission receipts, positions or health. Screenshots, errors and results
are retained by `.github/workflows/low-quarter-play.yml` against the exact head.
The browser path checks all-shelter rescue; full eight-trip transport is covered
by simulation and still needs browser/device traversal.

The full local Chromium executable is blocked before any page by process-singleton
socket denial. The installed Chromium 140 headless shell launches and is an
available local browser path; qualify its actual results separately. Do not
claim browser acceptance from local simulation results. Hosted
outcomes must be read at the actual candidate head, including failures. The
earlier PR #152 board fixture pass does not qualify this mission. Physical phone
performance, full transport browser play, native multitouch, final art/likeness
and measured production frame-time remain explicit release qualifications.

## Related opening review

Draft [PR #153](https://github.com/ninja-ops-guy/techops-hero/pull/153), created
during this implementation, provides a separately approved tab-local opening
review with twelve people and Iona as its playable actor. It stops before final
wave/district resolution. This scenario supplies the approved complete
48-resident response area, K as its player, canonical entry and final closeout.
Both reuse #150/#152 authority. Their physical producer layers, population,
force tuning and save revisions are alternatives, not cumulative counts or
interchangeable histories. Reconcile board/bootstrap integration and physical
producer ownership before merge. No source on #153 was overwritten, merged or
claimed as this scenario's qualification.

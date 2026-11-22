# First Warning / Hold the Service Road

Creator-approved scope, November 22, 2026. This is an opt-in playable opening review, stacked on PR #152. It does not replace the rescue/siege authorities, register a complete district in the live campaign, merge, deploy or revise the comic. Review entry: `low-quarter-review.html`, also linked from the existing LQ board.

## Play and controls

Select an explicit eligible Orpheus ending setup, then Begin review. This setup is not an earned full campaign playthrough. The later K/Iona bodily-return bridge remains unauthored in the game. Iona is playable; K accompanies her; the ship crew remains offsite. All on-ground local supporting actors are provisional game content, not named comic cast.

A/D or arrows move, Space jumps, J strikes, E uses the first nearby interaction. Each nearby object also has a labeled button. Touch uses held direction controls, Jump, Strike and Interact. Repairs require remaining beside the device through its test interval. Travel buttons start actual timed trips; arriving in a sector does not grant its objectives. Escort teams to a sector's post at x=820 before assigning them. Residents must consent and walk to the van. The work and objective text explain prerequisites; the journal records observed consequences.

Warning: first ship at **15:00 logical operation time**. Prepare before 14:00 to commit deployment with at least a minute of final approach. This is a fixed schedule, not a player-readiness timer. Missing preparations halt this bounded review with no defense success rather than silently granting readiness. No failure declares missing residents dead. Pause, hidden tabs and dialogs stop simulation; opening the observation journal does not stop it. UI pause and loss of focus clear held inputs. All time is saved simulation time, not wall-clock elapsed while away.

Reference path: lookout → watch → four sector warnings; restore power/radio and shelter ventilation/care; staff the rota; load-test each sector, Services last; complete the ending's command drill; escort four military teams to their posts; commit approach deployment; contain eighteen breached infected; close the ingress gate; escort consenting residents and dispatch a real vehicle; physically follow its route and let the independent yard medic accept care. A convoy may leave before the breach if the player prepares it earlier. No order or cinematic marks a person safe.

## Authoritative versus provisional

The Story Bible v2.1 working copy version 12, November 15 C01–C36, governs the return and limited memory. Later approved creator direction governs ships, mass assault, physical assimilation and Sudo's command relay. Game full-rescue branches remain separate from the reader-comic ruined return. Iona's AeroTech campaign, the wider Chorus, later space preparation and Malar's separate gates remain intact.

Approved prototype staging: approaches/freight road; service-room vicinity (not identified as Mara's workshop); shelter courtyard; departure road; and a local receiving yard reached by road, not a new realm crossing. Twelve opening residents do not constitute the district census. To keep the existing rescue API's per-sector manifest truthful, eight transport residents are physically on the departure road and four shelter residents in the courtyard. The original scope's tentative three-per-sector starting distribution is not used. No cross-sector passenger teleport or rescue-authority change was introduced to force that distribution into one manifest.

Military tuning: four initial four-person teams and two reserve teams, strength 2 each; one strength-2 robot with central/distributed command capability. One post per sector requires strength 2. Robots are unqualified for independent Shutdown command in this revision, so Shutdown uses military replacements. Units physically follow before post assignment; a lost team remains unavailable. These strengths qualify this bounded opening only, not the whole army.

Travel links in logical seconds: approaches/services 20, services/shelters 15, services/departure 25, shelters/departure 20. The eight-seat vehicle takes 90 seconds to reach the receiving yard, then 15 seconds of witnessed care. Crew and vehicle remain reserved on an interrupted trip. No recovery scenario or unearned return is offered.

The scenario reserves 80,000 + 160,000 infected as a **provisional review force budget**, not an exact canonical population. First landing at tick 900, continuation landing reserved at 7200 (Hopper recovery minimum 180). The review stops before the continuation. Eighteen infected, at most six active, represent the breached lane. Defeating them seals that breach; it never emits `resolve_wave`. Other landing fronts are unverified, so the full wave remains unresolved.

## Three command exercises

- Shutdown: independently held dispatch records, repaired/tested power, manual radio challenge, human rota, military coalition and observed moving-team drill. No Orpheus reactivation. Robot contribution is rejected; military teams remain available.
- Control: actual Orpheus test-team movement, an externally operated stop while it is moving, independent log comparison, a resident's veto and challenge to premature gate closure. The safe alternate must be physically cleared. These checks do not rewrite the earlier low-trust ending.
- Open Network: shelter cooperation, physical team dispatch, isolation of the coordinator and completed local return drill, then restored shared coordination. The fallback movement completes before its receipts appear.

## Physical evidence and adaptation

`campaign_low_quarter_operation.js` simulates movement, tests, team drills/positions, resident consent/following, transport progress, combat and defender exposure. Completed transitions create scoped/versioned producer observations. It calls the existing rescue/siege event APIs. It never sets their outcome flags. The existing authorities continue to enforce scope, chronology, command modes, receipts and independently evaluated safety.

Local officers/witnesses and separate instruments provide the observation sources. The playable actor and command coordinator are not independent outcome verifiers. Source strings alone are not the producer: the operation retains actual timed load/drill/route/care observations and their source links. This is single-player simulation provenance, not external anti-cheat or authenticated human testimony.

An exposed approach team can be physically overwhelmed by active breached infected when Iona leaves them unsupported. Its unavailable-unit receipt precedes witnessed assimilation. All six military teams begin with a bounded briefing of service-road v1; the actual team physically assigned to the approach is the exposure source, regardless of its ID. A robot loss removes defense strength but supplies no human memory. Upload waits 10 seconds; returned Sudo orders wait another 5. Actual raiders then traverse the approaches/services/departure links before threatening a service-road convoy. Cutting that route requires a cleared alternate and a fresh closure receipt. A convoy using the alternate is not attacked using unlearned knowledge. Cutting the road does not erase the acquired fact. Prevent the loss and there is no acquisition, forced casualty or substitute scripted upload. Relay boarding/cutting is outside the playable opening; no relay-cut receipt is emitted.

## Persistence and scope

The review page passes **sessionStorage** to the existing `TechOpsCampaign` serializer using its existing key. It never reads/writes the ordinary localStorage campaign slot. This tab-local review survives reload; closing the tab can discard it. It is a review playthrough, not a second canonical campaign-save owner. No new permanent storage key, native Night checkpoint or polling timer is added. The animation-frame loop owns the explicit review scene. Ordinary production bootstrap does not load/register this partial scenario.

`lowQuarterOperation` contains the additive versioned physical state. Producer actions and emitted receipts persist in the same campaign object. Every save validates both authorities and the opening boundary. Save failure rolls back to the last committed snapshot and pauses. Future opening revisions preserve their data and block review resume; ordinary campaign state is unaffected. The operation does not change any existing ending, achievement, standalone Iona depot run or closeout result.

The opening checkpoint requires 8 independently received evacuees, 4 verified sheltered residents, all four defensive posts, a sealed breach and responses to issued adaptation. It leaves `lowQuarter.phase=active`, `result=null`, no whole-district roster/sweep receipts and no resolved waves. It awards no district-save, deep-space or Malar permission. No final closeout UI is exposed in this review. The ordinary LQ board's existing confirmed-closeout behavior is unchanged.

## Acceptance and remaining work

Run `node test_campaign_low_quarter_operation.js`, the existing rescue and siege suites, and `npm test`. `npm run test:browser:low-quarter-operation` exercises actual keyboard/pointer controls under all three endings at desktop/touch widths, real serialized reload/resume and an ordinary-save sentinel. Its virtual browser clock advances the simulation; it does not inject operation progress or receipts. Screenshots and a playthrough receipt are retained. Virtual-time acceptance is not a wall-clock performance benchmark or physical iPhone test.

No local browser pass is claimed when Chromium cannot create its process-singleton socket. Hosted exact-head results must be inspected before claiming browser qualification. The pre-existing board fixture tests still do not qualify the opening and the opening does not qualify a full district rescue.

Remaining: final character/terrain art, broader physical observer-injury scenarios, further combat tuning, local transport recovery, complete district census and geography, later waves and relay access, full mission closeout, natural campaign return integration and physical-device acceptance. Merge/deployment remain separately owner-gated.

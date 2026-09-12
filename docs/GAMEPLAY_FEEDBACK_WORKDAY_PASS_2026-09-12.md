# Gameplay-first pass: fighting feedback and next-shift continuity

## Delivery status and provenance

This document describes the original locally prepared gameplay patch. Its source
is now included in the quality integration; current delivery and validation scope
is in `QUALITY_INTEGRATION_2026-09-12.md`. Publication is not a merge or deployment.
It is based on `ninja-ops-guy/techops-hero` main at
`31cdf77264d657e0a43c291b163e143546dd0325`, after PRs #20 and #22 merged.
That was the original preparation base. The integration preserves main
`8004cef72a33b466285076f25af64a5f0570e6b5`, including the later Night flow and mobile UI.

The source was retrieved from that commit's successful GitHub Pages build, run
`34682207037`, artifact `10293194634`. The downloaded artifact SHA-256 was verified:
`0b95d81250b9e43d8299c92423ad957c6359792342ed5204a3465c084c4d3c3b`.
The local Git baseline is a reconstructed checkout of that artifact, not the original
remote commit object. The delivery manifest records original and resulting bytes
for each changed file. Applying the patch to a different source revision requires review.

## Roadmap selection

The pass extends the existing merged combat and investigation work instead of
creating a competing combat engine, numbered hook, story director, or asset source.
It targets repeat exposure: how street fights sound, how work survives the next
morning, whether investigations can lose their phase, and whether ordinary
interactions can bypass the evidence loop when a module fails.

| Area | Implemented here | Explicit boundary |
| --- | --- | --- |
| Fighting feedback | Event-driven sound for swings, misses, grabs, jab/cross, launchers, air hits, throws, crowd/wall impacts, slam, guard, block, hurt, lost grip and knockout | Normal Night Crawler streets; no invented parry mechanic; Good Dogs, Sector 04 and Waldo keep their own combat/audio authorities |
| Audio control and accessibility | Off/quiet/standard/full combat volume, opt-in compact captions, existing master mute, bounded voices and hidden-page silence | Music playback is untouched; final perceived mix still needs listening on actual hardware |
| Persistent workday consequences | Deterministic Day 1 to Tuesday handoff for Shipping and Plating, with separate recheck, service-gap, outcome-conflict and carryover paths | Not a full procedural or late-campaign recurrence system; partial verification alone is never called a proven recurrence |
| Playable follow-ups | Requester observation, technical observation, supported hypothesis, remediation where needed, post-fix check and real-task confirmation | Original ticket/owner/outcome/evidence records are not overwritten |
| Reachability and presentation | Tuesday contacts, workstation QUEUE/TEAMS links, casebook links, save-resume contact placement, current-service visuals separated from historical visuals | No new approved artwork or cinematic asset claim |
| Investigation integrity | Phase-preserving evidence review, diagnostic-clue requirements, idempotent actions, stale-callback recovery, fail-closed ordinary contact routing | Existing canonical resolver remains the closure authority; accepted old-save progress is not retroactively erased |

## Where to play the additions

### Street fighting

Fight normally in Night Crawler. Sound is driven by actual combat events; it does
not apply damage or award money. A swing is not a hit. Guarded hits do not stack
an extra generic hit sound. Enemy chip-damage blocks and incoming damage use their
own cues. The existing rhythm, grab/throw, finite juggle and reward rules remain.

Open **the Charger menu -> Combat sound & captions**, or
**Mike's workstation -> Combat sound & captions**. The five existing workstation
tabs are unchanged. Captions can remain on with combat volume off. They occupy
space below the timing meter; the existing message panel moves below them.

The audio service is `runtime_combat_audio.js`, loaded before `night_combat.js`.
It reuses the classic-script `AC` context and respects `sfxMuted`. It owns a
separate gain/compressor bus, not the soundtrack. Context creation/resume is lazy
and gesture-driven. A suspended context drops old actions instead of playing a
backlog after resume. Each voice lasts at most approximately 205 ms, at most eight
voices are active, and identical crowd contacts are limited to one per 25 ms of
simulation time. Higher-priority knockout/finisher/hurt cues survive low-priority
voice pressure. Sources and intermediate nodes are disconnected when done.
Noise is deterministic and does not consume the game's reward RNG.

### Player choices that create real follow-up work

These paths are reachable from normal Shipping/Plating contact interaction; they
do not require a developer-seeded weak outcome. At supported remediation, choose
**Use a temporary workaround and hand off**, read its explicit limitations, then
apply/test it and have the requester confirm limited service. Shipping uses the
authorized lead's own session; Plating starts the integration dependency manually
without claiming durable startup recovery. The saved closure is **partial/degraded**,
and the next shift gets the corresponding repair investigation.

After a full remediation and technical check, **Record reported restoration;
recheck next shift** offers a separate confirmation screen. A requester report is
recorded as **partial verification / restored outcome**, not witnessed end-to-end
proof. Tuesday gets a recheck. The original **Requester confirms restored** path
still gives strong verification and avoids invented next-day busywork.

The casebook records the actual workaround/report choice as a bounded event.
Workaround verification survives a cold reload, and previewing/declining either
choice is read-only. The automated UI tests traverse both tickets through both
choices, then through their resulting Tuesday follow-up, without calling the
canonical resolver to seed the partial closure.

### Tuesday handoff

After the canonical, verified Sector 04 -> Tuesday boundary, open
**Mike's workstation -> QUEUE**, **TEAMS -> Review shift handoff**, or talk to the
Shipping/Plating contact. A Day 1 casebook record links to its separate next-shift
follow-up. Resuming a previously constructed Tuesday world installs the contacts
without resetting the map or campaign. The old Day 1 Security Ops contact is not
carried into this new contact set.

The state is stored in `workdayContinuity.day2` inside the existing campaign save:

- Strong verification plus a restored, consistent outcome carries forward without
  manufacturing more work or a reward.
- Partial/incomplete verification creates a recheck. New observations establish
  the next-shift path; the old gap is not asserted to be a returned fault.
- Recorded degraded/unmet service creates an authored service-gap follow-up.
  Shipping tests the approved next-shift queue entitlement; Plating tests whether
  the integration dependency returns across a controlled restart.
- Conflicting old outcome records remain preserved. A new explicit outcome can be
  established without silently selecting or rewriting one of the old claims.
- Unclosed work resumes the original investigation. A subsequent closure stays
  with its recorded owner; it does not acquire invented firsthand provenance.

Requester plus technical observations are both required. Reviewing the previous
handoff does not count as an independent technical observation. Unsupported
hypotheses are nonterminal. Repair cases require another technical check after
the repair. Only requester task confirmation completes the new follow-up.
There is no random re-roll, duplicate payout, automatic reopening of verified
work, or ordinary follow-up path for the Impossible Access evidence.

A read-only visit cannot create or mutate a handoff. Old Tuesday saves without
this extension get a deterministic read model; the snapshot is committed on their
first explicit follow-up action. The normal new Tuesday boundary snapshots once.
Repeated transition calls cannot reset progress or rewind a later chapter.

Current-day service visuals may show a newly restored line or successful label.
A historical CASEBOOK dialog still uses the original Day 1 state and visual
status. The new result never makes a degraded original record appear historically
verified.

### Day 1 investigation repairs

Evidence review no longer changes a post-remediation phase back to `gather`.
The review screen offers **Resume current step**. Duplicate evidence, supported
hypotheses, repairs and technical checks do not grow history or regress a phase.
Mutation callbacks reload current state and handle stale/double taps or failed
storage without synthesizing another closure.

A fresh supported Shipping conclusion requires the queue authorization trace plus
another observation. Plating requires the actual integration-service observation
plus another observation. Merely collecting two nondiagnostic clues no longer
unlocks the exact cause. The true hypothesis is not marked wrong while awaiting
that clue, and the player has a route back to the remaining observations.

An unloaded or malformed investigation module cannot cause the ordinary world
interaction to fall through to the legacy instant-resolution path. It shows an
unavailable message and leaves the ticket open.

## Automated validation

The unchanged source passed its original 57-suite aggregate gate before editing.
The new aggregate gate contains **61 suites**, retaining the Mike action-atlas
quarantine check. No suite or failure-enforcement step was removed.

Four added suites contain **98 focused tests**:

| Suite | Tests | Coverage |
| --- | ---: | --- |
| `test_runtime_combat_audio.js` | 28 | Real combat-event wiring with instrumented WebAudio; cue identity, bounded voices, cleanup/failure handling, shared context, gesture/resume behavior, hidden page, master mute, captions, mode exclusion, unchanged reward RNG |
| `test_campaign_workday_followups.js` | 26 | Both tickets across all six verification/outcome combinations; phase gates, atomic errors, read-only migration, independent provenance, repeat transitions, duplicate actions and per-phase reload |
| `test_campaign_workday_followups_ui.js` | 24 | Actual native interaction handlers and dialog callbacks, contact placement/resume, workstation links, complete repair/recheck flows, stale callbacks, current versus historical visuals, storage failures and carryover attribution |
| `test_campaign_investigation_integrity.js` | 20 | Read-only records, diagnostic-clue requirements, phase-preserving review, idempotency, stale callbacks, unloaded/malformed module failure paths |

Existing investigation fixtures were updated to include the newly required actual
Plating diagnostic clue. Cache assertions were updated to the explicit new build
keys, not relaxed to accept any version. The static entrypoint test also verifies
the new service's load order and bootstrap/cache continuity.

Run from the repository root:

```sh
node scripts/production_release_gate.js
```

These are Node/VM, instrumented-WebAudio, source/static and existing local contract
checks. A test named "browser entrypoint" verifies source wiring; it is **not** a
real browser playthrough. The local result does not certify WebKit/Chromium/Firefox
rendering, iPhone touch interaction, audible mix quality, controller behavior,
full unassisted campaign traversal, or hardware performance.

## Release acceptance still required

Run the repository's existing browser/runtime workflows on the applied patch head.
On a real iPhone Safari and desktop browser, verify first-gesture audio, the master
mute, combat volume/captions, background/resume without late bursts, Charger-menu
navigation, and that the user's music is neither replaced nor interrupted.
Play the authored opening and Tuesday handoff without developer fast-forward.
Exercise a resumed in-progress case and confirm its exact phase survives reload.
Continue Good Dogs traversal to ensure the deliberately untouched mode still uses
its current music, controls, campaign and cinematic ownership.

Approved dog walk/landing art, missing orbital compositions, full procedural
recurrence, and device-based frame-pacing measurements remain outside this pass.
No unclassified action atlas was enabled and no visual/device acceptance evidence
was fabricated.

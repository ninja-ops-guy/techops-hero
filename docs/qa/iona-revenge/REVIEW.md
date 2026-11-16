# Iona revenge campaign review — 2026-11-16

Verdict: **PROVISIONAL**. Mission logic passes the focused suites; browser, visual and physical-device acceptance remain open.

## Source and correction scope

Narrative authority: `TechOps-Hero-Iona-Script-and-Game-Decision.md`, Library version **16**, modified 2026-11-16 16:35:57 UTC, 62,023 bytes. Source identity: `libfile_fde3_f-c4c09d7221d48191be893643238dacc7_ffd948f5b8cc819189458c50cefab7ab`. This is the current script, not certification of a published comic edition or its images.

The game’s historical Iona viewpoint is after Red’s arrest and before the Volume V voice-window contact. Red/K remains offstage; the director supplies a North Intake lead, and the research authorizer remains unknown. Changes are limited to mission staging, progression checks and test fixtures. Existing Guided Music assignments and Iona’s primary drummer identity remain intact. No artist stems were added.

| Script anchor | Mission behavior |
| --- | --- |
| Ledger recovery / 38–41 | Mara receives the ledger at the open west gate before Iona pursues the director. Iona does not escort Mara out of the archive. |
| 39A | Iona remains in her passage while the freed pair drop the sandbag on the security side. |
| 39B | Iona returns the first officer through the access gate, takes the keys, shuts and locks the gate with all three officers beyond it, and checks the latch. Completing this action closes the gallery route for this run; the west freight route remains available. |
| 40A | The separate records shutter closes after the gate lock. The fourth officer comes from the archive side; no pursuer crosses the locked gate. |
| 46–47A | The newly arriving patrol officer is distinct from the older injured officer. The older officer begins following on the stairs, continues through the fire-door room and reaches the west line as the same escort. Iona cuts her caught jacket hem while he pulls her forearm. |
| 48–51 | The freed pair’s return and the older officer’s witnessed crossing precede the final count. A missing/distant escort cannot complete the handoff; the all-clear requires both the secured ledger and that handoff. The burn requires the all-clear. |

The generic pixel scenes and dialogue express these events. This review does not certify bespoke lock, sandbag, officer or fire-door animations, character likeness, or individually simulated crossings for every background officer. The locked route is a gameplay boundary for the remainder of the expedition, not a claim that the officers can never reopen the gate in the story.

## Verified

- `node test_living_world.js`: 13 checks; all 29 chapter objective sequences reachable.
- `node test_living_world_progression.js`: 14 checks, including gate closure, serialized resume, fresh replay, west-route access, remote-escort refusal, ledger prerequisite and burn prerequisite.
- `node test_field_score.js`: 25 checks.
- JavaScript syntax checks and `git diff --check`.

## Browser attempt and remaining acceptance

Both `node scripts/field_score_browser.mjs` and `node scripts/iona_revenge_browser.mjs` were attempted. Chromium failed before loading a page: `chrome/browser/process_singleton_posix.cc:297`, `socket() failed: Operation not permitted (1)`. There is no browser PASS, screenshot review, listening acceptance or physical-phone result from these attempts.

The new Iona browser harness declares prerequisite, checkpoint-position, escort-position and cleared-combat fixtures. It is intended to exercise production objective dialogs, timed work and save/resume in desktop, portrait and landscape contexts; it is not a normal-controls traversal/combat playthrough. Run it in an environment that permits Chromium startup, then inspect its screenshots. The soundtrack browser fixture now targets the depot-heist cue instead of the superseded Countermeasure cue and uses synthetic tones only.

Before release: complete those browser runs; inspect the game presentation against the current script and approved artwork; perform ordinary movement/combat and physical-device testing; reconcile any saved review runs from older drafts whose numeric objective indices predate this ordering. Start a fresh/revisited depot mission for the current review. No save migration from superseded draft ordering is certified here.

No merge or deployment is part of this review.

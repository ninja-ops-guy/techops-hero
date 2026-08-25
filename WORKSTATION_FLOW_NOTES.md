# Canonical Workstation Flow

This note records the implemented Story Bible v1.2 opening behavior. It is descriptive only; runtime authority remains `campaign_act1.js` and native presentation/runtime bridging remains `campaign_native_act1.js`.

## Flow

`standup -> workstation checked -> MUSIC / Red in the Mirror -> COMPANY / Felicia profile -> Engineering the Human Connection -> explicit CLOCK IN -> day_work_unlocked`

The workstation exposes five authored surfaces: `QUEUE`, `TEAMS`, `ALERTS`, `COMPANY`, and `MUSIC`.

## Runtime guarantees

- Opening the workstation does not start Day 1 work.
- Red in the Mirror is ordinary listening and does not create ORPHEUS investigation evidence.
- Felicia's company profile must be found before the company video can complete.
- Video completion and deliberate skip both commit `felicia_video_watched`; neither automatically commits `day_work_unlocked`.
- `day_work_unlocked` requires completed standup, workstation check, Red in the Mirror, Felicia blog/profile, and company video state.
- Day 1 campaign ticket resolution, Impossible Access evidence, and Sector 04 are rejected before `day_work_unlocked`.
- Delegating Impossible Access to Security produces delegated evidence perspective rather than silently converting it to firsthand.
- v1 saves migrate forward, while v2 saves preserve canonical partial progress without re-inferring it from compatibility aliases.
- Reload is covered at each workstation boundary through Tuesday Morning.
- Positive base-runtime clock advancement is frozen during canonical Day 1 until explicit CLOCK IN.
- Because `game.js::advanceClock(min)` is not called while the gate is locked, procedural ticket age, reputation penalties, major-incident declaration, cascades, and the 17:00 force-end cannot occur before CLOCK IN.
- Procedural ticket NPCs, unresolved ticket portals, and broken ticket devices are blocked before CLOCK IN and route the player back toward standup/workstation.
- Ambient NPC conversation and non-work exploration remain available while the shift is paused.
- After CLOCK IN, the original base `advanceClock(min)` and `interact()` paths resume unchanged.

## Verification

Campaign contracts run #64 passed the complete existing suite after the workstation/save-reload conversion. The semantic migration regression then verified that v2 compatibility aliases cannot silently re-unlock Day 1 after reload.

Campaign contracts run #70 passed after the runtime gate landed. Its dedicated `test_campaign_day1_runtime_gate.js` proves that before CLOCK IN no base clock call occurs and therefore no ticket aging, reputation penalty, incident declaration, cascade, or 17:00 force-end can fire; it also proves procedural work is blocked while ambient interaction still falls through, and that the untouched base behavior resumes after `day_work_unlocked`.

## Next integration target

Run the canonical minimum-interaction opening against the deployed browser build on both desktop and mobile: new run -> standup -> workstation -> MUSIC -> COMPANY -> CLOCK IN -> ordinary ticket -> Impossible Access -> Sector 04 -> Tuesday Morning. Treat any mismatch between semantic state, visible HUD clock, touch controls, dialog layering, or production asset presentation as a release blocker.

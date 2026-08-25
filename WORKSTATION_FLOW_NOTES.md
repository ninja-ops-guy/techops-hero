# Canonical Workstation Flow

This note records the implemented Story Bible v1.2 opening behavior. It is descriptive only; runtime authority remains `campaign_act1.js` and native presentation remains `campaign_native_act1.js`.

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

## Verification

Campaign contracts run #64 passed the complete existing suite after the workstation/save-reload conversion. The subsequent semantic regression also verifies that v2 compatibility aliases cannot silently re-unlock Day 1 after reload.

## Next integration target

The base roguelite clock currently advances through `game.js::advanceClock(min)`, which increments `S.clock`, ages every unresolved procedural ticket, can reduce department reputation, declares major incidents at age thresholds, cascades ignored problems, and can force-end the day at 17:00.

Production integration should route those base-runtime effects through the canonical `day_work_unlocked` gate inside the existing native campaign authority. Until explicit CLOCK IN, movement and authored opening interactions should remain available, but procedural ticket work and positive clock aging should not advance. After CLOCK IN, the existing clock/incident/cascade behavior should resume unchanged.

# Canonical Workstation Flow

This note records the implemented Story Bible v1.2 opening behavior. It is descriptive only; runtime authority remains `campaign_act1.js` and native presentation remains `campaign_native_act1.js`.

## Flow

`standup -> workstation checked -> MUSIC / Red in the Mirror -> COMPANY / Felicia profile -> Engineering the Human Connection -> explicit CLOCK IN -> day_work_unlocked`

The workstation exposes five authored surfaces: `QUEUE`, `TEAMS`, `ALERTS`, `COMPANY`, and `MUSIC`.

## Runtime guarantees

- Opening the workstation does not start the Day 1 clock.
- Red in the Mirror is ordinary listening and does not create ORPHEUS investigation evidence.
- Felicia's company profile must be found before the company video can complete.
- Video completion and deliberate skip both commit `felicia_video_watched`; neither automatically commits `day_work_unlocked`.
- `day_work_unlocked` requires completed standup, workstation check, Red in the Mirror, Felicia blog/profile, and company video state.
- Day 1 campaign ticket resolution, Impossible Access evidence, and Sector 04 are rejected before `day_work_unlocked`.
- Delegating Impossible Access to Security produces delegated evidence perspective rather than silently converting it to firsthand.
- Reload is covered at each workstation boundary through Tuesday Morning.

## Next integration target

The base roguelite clock currently advances through `game.js::advanceClock(min)`, which ages all open procedural tickets and can declare incidents or cascade neglected problems. Production integration should route that behavior through the canonical `day_work_unlocked` gate inside the existing native campaign authority rather than creating a new parallel state authority.

# Day 1 Clock Gate Follow-up

The semantic and native campaign layers now prevent campaign ticket work before `day_work_unlocked`, but the base roguelite runtime still initializes procedural tickets and `S.clock = 09:00` in `game.js::setupDay()` and ages every open base ticket in `game.js::advanceClock(min)`.

The next consolidation change should stay inside the existing native campaign integration rather than adding another story/runtime authority:

- Pause positive `advanceClock(min)` effects during canonical Day 1 until `day_work_unlocked` is true.
- Prevent base/procedural ticket interactions from resolving before the canonical workstation opening is complete.
- Preserve movement, standup, workstation, menu, and non-work exploration while the shift is paused.
- Resume the normal clock/aging/incident/cascade logic unchanged after explicit CLOCK IN.
- Add regression coverage that proves no ticket age, reputation penalty, major incident, cascade, or 17:00 force-end can occur before CLOCK IN.
- Verify the same minimum-interaction flow on desktop and mobile.

# Guided combat practice

Training now includes six selectable drills: contact, timed combo, launcher, directional throw, slide cancel and character special. Enter Combat Lab → Training → choose a fighter → Run Menu → Guided combat drills.

Each drill explains its inputs, resets the practice target and player position, and waits for an actual combat event. Contact requires damage; rhythm additionally requires a timed combo; launch requires a launcher hit; throwing requires throw damage; slide cancel requires the existing deliberate cancellation window; a special requires actual damage from a character move. Casting, whiffing and paused input do not complete drills. Misses prompt the player to close distance and face the target.

A completion screen offers the next drill, retry, drill selection or free practice. The run menu can repeat instructions, restart or stop a drill. The special drill supplies practice focus; other drills do not. Resetting the target clears the current drill. Arena never runs the coach.

The coach consumes the existing combat events and existing lab after-step callback. It owns no timer, listener, physics loop or campaign reward. Drill state lives only inside the temporary Combat Lab session. Saves and leaving the lab retain the original street checkpoint, not exercise progress. Lessons use the same character presets and equipped moves as practice.

Validation: eight contract groups cover all six real combat paths, rejection/retry and Arena/street isolation. Production-page browser checks cover menu entry, real contact, next-drill reset, actual special contact and leaving without XP across desktop, portrait and landscape. The browser uses only a safe-street fixture to enter practice; exercise positions/focus are set by the real lesson setup. Launcher, rhythm, throw and slide completion are exercised by the combat contract tests, not claimed as physical-device acceptance. No full-campaign replay or physical-iPhone test is claimed.

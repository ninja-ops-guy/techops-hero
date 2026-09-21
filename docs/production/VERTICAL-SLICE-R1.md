# TechOps Hero — Vertical Slice R1
Status: Reference-quality certification target

## Purpose
Create one canonical end-to-end sequence at final intended quality. Once certified, this slice becomes the comparison baseline for the remainder of the game.

## Slice
**AeroTech arrival → orientation/standup → office exploration → NPC conversation → Mike's desk/workstation → representative ticket → investigation/evidence → resolution/verification → consequence → departure/transition → Night launch/menu → Night traversal/investigation → representative combat/contextual encounter → objective resolution → recovery/return.**

## Acceptance beats
1. **Arrival** — clean load, correct state, readable objective, no prototype UI.
2. **Standup** — canonical workplace presentation; dialogue/camera/input ownership clean.
3. **Explore** — movement, collision, prompts and environmental hierarchy are immediately legible.
4. **Talk** — NPC interaction opens dialogue only; correct facing/pose; exit restores control.
5. **Desk** — workstation prompt exists only at Mike's desk/capability zone; separate command from talk.
6. **Ticket** — task is understandable, grounded in TechOps causality and exposes evidence rather than arbitrary answer selection.
7. **Investigation** — Observe → Investigate → Hypothesize → Execute → Verify is represented in player-facing feedback.
8. **Resolution** — success/failure is verified and consequence is visible.
9. **Transition** — Day state hands off exactly once; no leaked HUD/input/audio.
10. **Night launch** — authored cinema and player choices may wait indefinitely without watchdog failure.
11. **Night play** — HUD safe areas, pointer/touch targets and shared controls remain stable across frames.
12. **Encounter** — combat/contextual actions are readable, responsive and visually coherent.
13. **Return** — objective state persists; recovery/return cannot duplicate rewards/events.
14. **Reload** — save during supported checkpoints and reload into a valid equivalent state.

## Required platforms/input
Certification matrix must include the project's supported desktop browser path and supported mobile/touch path. Keyboard, pointer/touch and any declared controller support must be exercised where applicable. Orientation-specific mobile support must be tested only where declared supported.

## Visual certification
Capture fixed checkpoints for arrival, standup, NPC talk, desk, workstation, investigation, Day→Night, Night menu, encounter and return. Review for scale, palette, pixel treatment, UI hierarchy, concept-art leakage and animation state.

## Negative-path certification
- Interact with NPC while near but not at desk: workstation must not open.
- Attempt workstation away from desk: rejected/no prompt.
- Hold pointer press across a render: menu target remains valid.
- Pause during authored Night wait: no false timeout.
- Reload around Day/Night handoff: no duplicated transition.
- Lose focus/resume: input ownership recovers.
- Unsupported media capability: deterministic fallback rather than UA-specific assumption.
- Rapid repeated interact: no duplicate dialogue/workstation/event.
- Save/reload after resolution: consequence remains canonical.

## Freeze rule
After certification, changes affecting the slice require regression evidence against these checkpoints. The slice is a quality oracle, not a demo branch allowed to drift independently.

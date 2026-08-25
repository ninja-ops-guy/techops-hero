# TechOps Hero — Known Issues / Release Blockers

This list is intentionally stricter than deterministic CI. A green test suite does not close a visual/device issue without matching acceptance evidence.

## Release blockers

### Physical-device evidence pending

- Main campaign: current production SHA must complete New Run -> Tuesday on iPhone Safari.
- Main campaign: same SHA must complete New Run -> Tuesday on desktop Chromium.
- Good Boys: current SHA must complete The Incident -> playable breach -> Cell 118 on iPhone Safari.
- Screenshots/tester output must be retained for the accepted SHA.

### Good Boys animation source gap

The shipped `KATRIN_MANCHEZ` atlas has verified idle/action/shield/hit/down/leap/roll frames, but it does not contain a verified dedicated walk/run row matching the newest approved concept sheets. Production intentionally uses conservative locomotion rather than mislabeling attack or knockdown art as walking.

Required closeout: extract/author transparent walk/run/true air-dash frames from approved reference material, classify them semantically, then wire and regression-test them.

### Mike action atlas source gap

`MIKE_ACTIONS` contains 182 frame-coordinate records but no confirmed renderable source payload. The atlas is quarantined and cannot become gameplay-ready until the real image source is recovered and visually classified. Only provenance-backed classifications may be approved.

### Historical hook tower

The static entrypoint still carries a large compatibility stack of historical `vXX_hooks.js` files. Stable production concern modules own new behavior, but remaining required legacy behavior has not yet been fully absorbed/retired.

Required closeout: profile dependency order, move still-required behavior into stable modules, remove dead hooks in small regression-protected batches.

## Accepted temporary fallbacks — not final art

- The Charger runtime silhouette is a compatibility fallback until a verified production four-door Charger sprite is integrated.
- Good Boys orbital stage geometry uses the shared Night engine's continuous floor plus authored raised routes and breach hazard zones. This preserves engine stability while requiring boost/air-dash traversal; a future Night-physics refactor may support true floor holes.
- Static performance budgets are enforced, but real-device first-playable time, long-frame, memory, thermal and image-decode measurements are still required before final release.

## Non-negotiable visual failures

Any of the following reopens release readiness immediately:

- Mike appears as the playable body in Good Boys.
- Day Shift or generic Night HUD bleeds into Good Boys.
- Good Boys starts in Suburbs / Dead Satellite rather than the canon orbital incident.
- Katrin/Manchez color identity swaps (Katrin blue, Manchez amber/orange).
- Night Walker uses Day Shift poses for attacks or blocks.
- the production car reads as a two-door coupe rather than a modern four-door Charger.
- a random Good Boys gameplay screenshot cannot be recognized as belonging to the approved concept-art gameplay language.

# TechOps Hero — Known Issues / Release Blockers

This list is intentionally stricter than deterministic CI. A green test suite does not close a visual/device issue without matching acceptance evidence.

## Release blockers

### Physical-device evidence pending

- Main campaign: current production SHA must complete New Run -> Tuesday on iPhone Safari.
- Main campaign: same SHA must complete New Run -> Tuesday on desktop Chromium.
- Good Dogs: current SHA must complete playable M1 property discovery -> M2 Hidden Bay / BOARD -> decoded GD_CUT_01 -> cockpit interaction -> decoded GD_CUT_02 -> playable flight -> crash -> M3 breach -> Cell 118 on iPhone Safari.
- Screenshots/tester output must be retained for the accepted SHA.

### Remaining animation source gaps

The supplied-art integration now provides and wires verified Katrin/Manchez run and airborne-dash sequences, the reviewed Mike combat/traversal atlas, masked Waldo, orbital props, and the production four-door Charger. Those assets are generated, approved, wired, and automatically decoded in Chrome/WebKit, but still require physical-device acceptance on the release SHA.

Still missing are complete alternating walk/contact cycles for both dogs, distinct start/stop and landing poses, and a distinct Mike dash that does not reuse a strike. Required closeout: author transparent source frames from approved reference material, classify them semantically, then wire and regression-test them. Do not regenerate the run, airborne dash, Charger, masked Waldo, or already integrated combat/traversal atlases.

### Mike action atlas source gap

`MIKE_ACTIONS` contains 182 frame-coordinate records but no confirmed renderable source payload. The atlas is quarantined and cannot become gameplay-ready until the real image source is recovered and visually classified. Only provenance-backed classifications may be approved.

### Historical hook tower

The static entrypoint still carries a large compatibility stack of historical `vXX_hooks.js` files. Stable production concern modules own new behavior, but remaining required legacy behavior has not yet been fully absorbed/retired.

Required closeout: profile dependency order, move still-required behavior into stable modules, remove dead hooks in small regression-protected batches.

## Accepted temporary fallbacks — not final art

- Good Dogs M3 uses an authored mixed-media backplate over the shared Night engine's continuous floor and stage geometry. M4–M7 still use orbital-tile generated environment fallbacks pending the layer-manifest pipeline described in `CINEMATIC_COHESION_V1.md`.
- Static performance budgets are enforced, but real-device first-playable time, long-frame, memory, thermal and image-decode measurements are still required before final release.

## Non-negotiable visual failures

Any of the following reopens release readiness immediately:

- Mike appears as the playable body in Good Boys.
- Day Shift or generic Night HUD bleeds into Good Boys.
- Good Dogs skips Waldo's House or the Hidden Bay and begins at the cockpit, flight, or prison.
- Katrin/Manchez color identity swaps (Katrin blue, Manchez amber/orange).
- Night Walker uses Day Shift poses for attacks or blocks.
- the production car reads as a two-door coupe rather than a modern four-door Charger.
- a random Good Boys gameplay screenshot cannot be recognized as belonging to the approved concept-art gameplay language.

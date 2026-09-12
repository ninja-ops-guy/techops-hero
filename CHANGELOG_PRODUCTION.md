# TechOps Hero — Production Changelog

## Cinematic Cohesion v1 — 2026-09-11

- Restored the canonical fresh Good Dogs route: playable M1 → playable M2 → BOARD → GD_CUT_01 → cockpit → GD_CUT_02 → playable flight → authored crash → M3.
- Added explicit completion contracts for M1–M7; enemy clear alone no longer advances story objectives that require investigation, interaction, rescue, control, tandem defeat, or shuttle arrival.
- Added an immutable 42-space level registry spanning 8 Good Dogs missions, 12 Night Crawler streets, 17 ticket worlds, and 5 Day/story spaces.
- Added passive presentation, deterministic camera, and semantic animation services without adding a draw/step/progression owner.
- Added a palette-quantized authored M3 Orbital Prison Breach backplate and production-asset registration.
- Quarantined mislabeled dog idle crops and retained honest source-art gaps for dedicated locomotion.
- Retired the production-loaded direct-to-M2 intro and duplicate ship-approach wrapper; startup count contracts from 266 to 265 scripts.
- Expanded the deterministic release gate from 44 to 46 suites with cinematic-system and Good Dogs route contracts.
- Added `CINEMATIC_COHESION_V1.md` as the campaign walkthrough, exact level inventory, mixed-media specification, and bounded swarm backlog.

## Production v1.2 — release-candidate line

### Canon / campaign

- Consolidated Story Bible v1.2 opening state and save migration.
- Added playable workstation QUEUE / TEAMS / ALERTS / COMPANY / MUSIC flow.
- Preserved ordinary Red in the Mirror listening without premature K investigation state.
- Company video corruption/skip/music state is deterministic and recoverable.
- Canonical Day 1 ticket spine: Shipping Cannot Print, Plating Offline, Impossible Access.
- Sector 04 production loop requires Observe -> Fight -> Insight -> Dependency -> Environmental Action -> Verify before Tuesday transition.
- Acts II–III semantic proof covers badge cloner, daylight Felicia, MORNINGSTAR, rooftop violin and The Violinist reveal.
- Evidence and Trust are separate state channels.
- Felicia companion support is bounded after reveal; free-play is locked until Duet Protocol.

### Good Boys / 118–1984

- Good Boys is a Katrin + Manchez linked-pair campaign; Mike cannot become the playable co-op body.
- Replaced legacy Suburbs / Dead Satellite opening with the canon orbital incident.
- Added 3x boost jump, 2x air dash, partner throw/catch, Swap, Sync/Tandem and gated K Support.
- Added concept-art HUD authority with persistent blue Katrin / amber Manchez status.
- Added Arrival -> Hull Breach -> Detention -> Cell 118 -> K Support -> Cell 1984 -> Escape -> Earthfall progression.
- Added authored orbital platform routes, breach hazards, Cell 118/1984 landmarks, maintenance shuttle landmarks and foreground depth treatment on the shared Night engine.
- Added mobile-safe runtime handoff that waits for Night state initialization before starting co-op gameplay.

### Visual authority

- Night Walker production rendering is separated from the Day Shift atlas.
- Modern four-door Charger proportions are enforced in runtime/reference contracts; final verified sprite remains pending.
- Mike 182-frame action atlas remains quarantined until its missing source image is recovered and visually classified.
- Added `VISUAL_REFERENCE_STANDARD.md` and `DOC_AUTHORITY.md` to prevent historical prototype art/readiness claims from overriding current reference authority.

### QA / release engineering

- Campaign Contracts now gates opening, Acts II–III, Sector 04, save/reload, browser/static integrity, mobile production contract, Night, Good Dogs and co-op asset authority.
- Added `node scripts/production_release_gate.js` as a single local aggregate release command.
- Added structural startup/performance budget regression.
- Added `PRODUCTION_READINESS.md`, `RELEASE_POLICY.md` and `KNOWN_ISSUES.md`.

### Still open before final release

- Physical iPhone Safari and desktop Chromium acceptance evidence on the final candidate SHA.
- Dedicated verified Katrin/Manchez walk/run/air-dash frames from approved concept art.
- Real-device performance measurements and remaining legacy-hook reduction.
- Final production Charger sprite.
- Recovery/classification of the Mike 182-frame action source.

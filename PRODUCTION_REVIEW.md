# TechOps Hero — Production Readiness Review

**Updated:** 2026-08-24  
**Authority:** `PRODUCTION_BASELINE_v1.2.md` + TechOps Hero Story Bible v1.2  
**Runtime:** v7.37 with Campaign Director, native Day 1 integration, Sector 04 runtime, and Good Dogs runtime asset integration

## Verdict

The repository is **feature-rich and testable, but not yet production-final under Story Bible v1.2**.

The current build has substantial systems, art, campaign adapters, Night Walker combat, Sector 04 contracts, Good Dogs content, and static-entrypoint coverage. However, the Story Bible changes the release bar: production readiness is now judged first by the canonical opening, reveal timing, state authority, verification loop, and New Game -> Tuesday resilience—not by the amount of late-game content already present.

This supersedes older statements that the project was globally "ship-ready" based on earlier v6/v7 scope.

## What is already strong

- Campaign Director exists as an executable contract (`campaign_act1.js`).
- Canonical Day 1 ticket templates exist for Shipping, Plating, and Impossible Access.
- Ticket ownership is explicit and validated before standup completion.
- Evidence provenance/perspective exists for the Impossible Access thread.
- Sector 04 already distinguishes suppression-by-damage from permanent resolution-by-understanding.
- Sector 04 has a dedicated runtime bridge and no-softlock/static-entrypoint tests.
- Campaign assets have explicit IDs and deterministic runtime bindings.
- Good Dogs production art is now wired into runtime atlas paths rather than relying on procedural placeholders.
- Static entrypoint integrity prevents duplicate/missing campaign script authorities.

## P0 production gaps

### 1. Opening state semantics need normalization

Story Bible v1.2 names these canonical states:

`standup_started`, `ticket_assignments_confirmed`, `standup_completed`, `workstation_checked`, `red_in_mirror_heard`, `felicia_blog_found`, `felicia_video_watched`, `day_work_unlocked`.

The current Campaign Director uses older camelCase/combined flags and treats workstation completion too coarsely. The next compatibility-safe migration should expose the canonical semantic states without invalidating existing saves.

### 2. Workstation is still too much of a shortcut

The canonical opening requires a playable first-person workstation with QUEUE / TEAMS / ALERTS / COMPANY / MUSIC. Red in the Mirror is ordinary listening; the Felicia video begins from the company surface; ORPHEUS corruption is brief; music ducks and resumes; ticket timers begin only after the sequence commits.

Current adapters compress several of those beats into one completion call. That is suitable for contract scaffolding, not final presentation.

### 3. `day_work_unlocked` must become authoritative

Normal work/timers should have one explicit campaign gate. The workstation sequence—not merely opening a desk dialog—must be what unlocks Day 1.

### 4. Native Day 1 needs full journey regression

The repository has contract tests, but production gating must cover the complete player journey:

- desktop minimum-interaction path
- mobile minimum-interaction path
- skip path
- save/reload at every boundary
- firsthand and delegated Impossible Access ownership
- procedural noncritical tickets around the canonical three
- Sector 04 completion and direct Tuesday transition

### 5. Scene-schema validation is still missing

Required validator coverage: duplicate IDs, unknown speakers, text overflow, missing required state writes, invalid branches, dead-end objectives, and non-replay/skip semantics.

## P1 story-system proof before more endgame expansion

The next campaign tranche should prove the Bible's Acts II–III systems before more spectacle is added:

- badge-cloner investigation
- first daylight Felicia conversation after the company video
- MORNINGSTAR traces and component ledger
- rooftop violin investigation
- The Violinist reveal
- Evidence and Trust as separate variables
- companion AI with bounded, legible support behavior
- delegation changing perspective without breaking authored progression

Good Dogs Protocol, Ghost Fork, Watchdog, ORPHEUS WAKES, and the three endings remain canon, but their presence does not waive the opening and Acts II–III gates.

## Architecture consolidation target

Canonical campaign authority should converge on the campaign modules, not continue to spread across version hooks:

- `campaign_act1.js` — semantic Campaign Director / Day 1 contract
- `campaign_runtime.js` — adapter only
- `campaign_native_act1.js` — native Day 1 world integration
- `campaign_sector04.js` — Sector 04 mission semantics
- `campaign_sector04_runtime.js` — Night Walker/browser bridge
- `campaign_assets.js` — campaign asset authority

Historical `vXX_hooks.js` remain valid providers of mechanics and assets, but new canon state should not exist only inside them.

## Release gate

Do not call the project production-ready until the first 30–45 minutes satisfy Story Bible v1.2 with final-quality interaction, art scale, state semantics, reveal timing, verification, reload/skip behavior, and mobile/desktop traversal.

The canonical production checklist now lives in `PRODUCTION_BASELINE_v1.2.md`.

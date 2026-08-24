# TechOps Hero — Production Baseline v1.2

**Status:** canonical production source of truth
**Baseline date:** 2026-08-24
**Runtime line:** v7.37 + Campaign Director / Sector 04 integration

## North star

TechOps Hero is an aerospace IT role-playing game about competence under pressure. The production rule is simple: authored beats determine meaning; systems determine how the player reaches them. Every ticket must begin with a human need, technical work must be coherent enough to reward attention, verification must prove the real outcome, and Night Walker must recontextualize the daytime system rather than become a disconnected brawler.

The **TechOps Hero Story Bible v1.2** is authoritative for story order, reveal timing, character identity, campaign state, cutscene language, mission requirements, and release quality gates. Older roadmap/review documents are historical unless this file explicitly adopts them.

## Canonical opening contract

A canonical New Game must preserve this authored spine while allowing procedural work around it:

`standup -> workstation -> Red in the Mirror -> Felicia company video -> Shipping Cannot Print -> Plating Offline -> Impossible Access Event -> Sector 04 -> Tuesday / Ghost Frequency`

Required persistent campaign state for the opening:

- `ticket_assignments_confirmed`
- `standup_completed`
- `workstation_checked`
- `red_in_mirror_heard`
- `felicia_blog_found`
- `felicia_video_watched`
- `day_work_unlocked`

`standup_started` is transient. Ticket timers must not begin before the workstation sequence commits `day_work_unlocked`.

Compatibility aliases may exist in legacy runtime code, but the names above are the canonical semantic contract and new systems/tests should target them.

## Hard continuity gates

1. The company-blog video precedes Mike's first office conversation with Felicia.
2. Mike first meets Felicia socially in daylight and operationally at night.
3. Night Walker never names Felicia before Mike recognizes her.
4. Felicia support is earned and her playable state cannot precede Duet Protocol in a canonical save.
5. MORNINGSTAR is progressive; capabilities cannot appear before their component/story prerequisites.
6. Daytime ticket ownership remains authoritative after standup, including delegation and evidence perspective.
7. K the EMRLD remains visually anonymous to Mike until Ghost Fork. His catalogue is thematic/personal foreshadowing, not an ORPHEUS evidence channel.
8. Watchdog is the action climax. ORPHEUS WAKES is the moral climax, not another conventional boss fight.
9. All endings return to the ordinary printer epilogue. The final printer is not an ORPHEUS sting.

## Production chapter order

### P0 — opening vertical slice

The first 30–45 minutes must feel like the finished game before late-game spectacle receives additional production time.

- Campaign Director and authoritative ticket ownership
- First-person workstation experience: QUEUE / TEAMS / ALERTS / COMPANY / MUSIC
- Diegetic Red in the Mirror playback with duck/resume behavior
- Engineering the Human Connection company video with brief recoverable ORPHEUS corruption
- Shipping Cannot Print: ordinary, human-first, verification-gated
- Plating Offline: production pressure, multiple plausible hypotheses, practitioner reasoning
- Impossible Access Event: contradiction documented without premature conspiracy framing
- Sector 04: Observe -> Fight -> Insight -> Dependency -> Environmental Action -> Verify
- Direct cut to Tuesday / Ghost Frequency with no soft-lock

### P1 — Acts II–III proof

Do not expand endgame until these are mechanically proven:

- badge-cloner investigation
- first daylight Felicia conversation
- MORNINGSTAR traces and component ledger
- rooftop violin investigation
- The Violinist reveal
- Evidence and Trust tracked separately
- companion AI that creates openings/protects evidence rather than blindly obeying
- campaign gating that survives delegation, reload, skip, and procedural ticket variance

### P2 — later campaign

Good Dogs Protocol, Ghost Fork, Watchdog, ORPHEUS WAKES, and all three endings remain valid canon, but their implementation must not weaken P0/P1 continuity or reveal timing.

## Runtime consolidation rules

The repo currently contains a long version-hook history. New production work should reduce authority fragmentation rather than add another parallel implementation.

- `campaign_act1.js` is the semantic Campaign Director for the canonical opening.
- `campaign_runtime.js` is an adapter, not a second story authority.
- `campaign_native_act1.js` owns native Day 1 world integration.
- `campaign_sector04.js` owns Sector 04 mission semantics.
- `campaign_sector04_runtime.js` owns browser/night-engine bridging.
- `campaign_assets.js` owns campaign asset IDs.
- historical `vXX_hooks.js` may provide mechanics/assets, but new canonical state must not be hidden exclusively inside a version hook.
- Every production asset must have one authoritative runtime binding and a deterministic fallback only when the production payload cannot decode.
- Do not introduce duplicate local script entrypoints, duplicate asset authorities, or story state that exists only in UI text.

## Mission definition of done

Every major mission must identify:

- human need
- visible symptom
- operational context
- competing hypotheses
- evidence
- authoritative day owner and resulting perspective
- Night manifestation
- meaningful choice
- verification condition
- persistent consequence
- recontextualization
- campaign beat eligibility
- hide/reveal rules
- systemic compatibility with delegation/procedural play

A cutscene is production-ready only when its trigger is reload-safe, its UI reveals only what the viewpoint character knows, its assets match gameplay scale/style, skip commits required state, the next objective is mechanically valid, and automated tests cover trigger/completion/reload/skip/non-replay.

## CI / release gates

A production candidate is not green unless automation verifies at minimum:

- every active standup ticket has exactly one owner
- workstation cannot soft-lock or start timers early
- canonical Day 1 always contains Shipping, Plating, and Impossible Access while allowing noncritical procedural tickets
- Felicia cannot spawn before the company-video state is complete
- Night Walker cannot identify Felicia before the reveal
- Insight can expose dependencies and combat-only play cannot bypass required verification
- aircraft capabilities obey component/story prerequisites
- Felicia playability remains locked until Duet Protocol
- save/reload works at every cutscene boundary and campaign transition
- Red in the Mirror can play without exposing K or creating investigation state
- K is established as a person before K the EMRLD recognition
- K self-designation survives Watchdog/reload
- all three endings return safely to the ordinary printer epilogue
- static entrypoint integrity and campaign asset contracts remain green
- mobile and desktop minimum-interaction paths reach Tuesday Morning

## Current consolidation priorities

1. Normalize Campaign Director opening flags to the Story Bible v1.2 semantic contract while preserving save compatibility.
2. Replace the desk-like workstation shortcut with the authored first-person workstation flow and explicit video-start/video-complete-or-skip state.
3. Make `day_work_unlocked` the single gate for ticket timers and ordinary Day 1 work.
4. Expand New Game -> Tuesday regression to desktop/mobile, reload, skip, delegated ownership, and minimum-interaction paths.
5. Add scene-schema validation for duplicate IDs, unknown speakers, text overflow, missing writes, invalid branches, and dead-end objectives.
6. Treat older `GAP_ANALYSIS.md`, `QA_REVIEW.md`, and version-specific readiness claims as historical evidence, not current release authority.

## Release definition

A build is **production-ready** when the first 30–45 minutes satisfy the canon and quality gates above without dev shortcuts, procedural fallbacks masquerading as final art, contradictory reveal timing, duplicate state authorities, or soft-lock paths. Late-game completeness is not a substitute for opening quality.

# TechOps Hero Campaign Integration Contract

This file tracks the boundary between authored campaign canon and runtime systems.

## Status language

- **Specified:** meaning, state, dependencies, and acceptance criteria exist.
- **Implemented:** executable code or assets exist.
- **Integrated:** reachable through normal play and using canonical state.
- **Validated:** deterministic tests and save/reload checks pass.
- **Polished:** presentation and accessibility match the production game.

Code or assets existing in the repository is not enough to claim integration.

## Architecture

`campaign_act1.js` owns the playable vertical-slice state contract: ticket ownership, evidence provenance, distinct verification and human outcomes, Sector 04 diagnosis, and the Tuesday Morning save boundary.

`campaign_story.js` owns campaign-wide authored meaning: act order, prerequisites, outputs, design laws, ORPHEUS signatures, K's personhood rule, the three endings, and canon-critical text. Gameplay hooks may deliver these beats, but must not redefine them.

## Integration laws

1. Every active ticket has exactly one owner before work begins.
2. Evidence, trust, team health, verification, and human outcome remain separate state domains.
3. Daytime knowledge changes what Mike can understand at night; it is not a magic key.
4. Damage suppresses a manifestation. Understanding its dependency and verifying restoration defeats it.
5. ORPHEUS predicts from recorded behavior and never reads live player input.
6. K's uncertainty concerns memory provenance, never the validity of his present experience or personhood.
7. No major manifestation may pass review as a generic monster with TechOps labels removed.
8. A feature is integrated only when reachable, persistent, presented, and deterministically testable.

## Delivery order

1. New Game through Tuesday Morning.
2. Ghost Frequency and provenance-aware identity investigation.
3. Parts in Motion evidence board and Violinist reveal.
4. Trust Is Earned and MORNINGSTAR construction.
5. MORNINGSTAR topology and recorded-behavior prediction.
6. Duet Protocol character switching and distributed authority.
7. Good Dogs Protocol, Cells 118/1984, K, Waldo, and WARDEN NULL.
8. Ghost Fork, Watchdog convergence, ORPHEUS Wakes, three endings, and epilogue.

## Current acceptance commands

```bash
node --check campaign_act1.js
node --check campaign_story.js
node test_campaign_act1.js
node test_campaign_story.js
```

Both contract suites must pass before campaign state changes merge.

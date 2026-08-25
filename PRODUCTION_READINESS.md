# TechOps Hero — Production Readiness

**Authority date:** 2026-08-25  
**Baseline:** Story Bible v1.2 / Production v1.2  
**Primary release tracker:** GitHub issue #4

This document is the current readiness snapshot. Historical “shippable” verdicts in older QA/gap documents do not certify the current build; see `DOC_AUTHORITY.md`.

## Release gate

Run the complete deterministic gate locally with:

```bash
node scripts/production_release_gate.js
```

GitHub Actions runs the same aggregate command after its named contract steps. A green deterministic gate is necessary but not sufficient for release: physical-device acceptance is also required.

## Proven production contracts

- Canonical Day 1 Story Bible state and save migration.
- Day work cannot advance before explicit canonical unlock.
- Playable workstation flow: QUEUE / TEAMS / ALERTS / COMPANY / MUSIC.
- Company-video skip/state/music semantics.
- Shipping, Plating and Impossible Access authored investigation rules.
- Sector 04 Observe -> Fight -> Insight -> Dependency -> Environmental Action -> Verify loop.
- Safe transition to Tuesday / Ghost Frequency.
- Acts II–III badge-cloner, Felicia daylight, MORNINGSTAR, rooftop violin and reveal-order proof.
- Evidence and Trust remain separate.
- Felicia support is bounded after The Violinist reveal; free-play remains locked until Duet Protocol.
- Scene-schema validation and static/browser entrypoint authority.
- Mike unclassified 182-frame action atlas remains quarantined until a real source is visually classified.
- Good Boys is a Katrin + Manchez linked-pair campaign with the approved orbital premise and concept-art gameplay loop.

## Release blockers still requiring evidence/work

### Physical-device acceptance

1. iPhone Safari: New Run -> Tuesday Morning on the current deployed commit.
2. Desktop Chromium: New Run -> Tuesday Morning on the same commit.
3. iPhone Safari: Good Boys -> The Incident -> playable hull breach -> Cell 118.
4. Capture screenshots plus tester output for each acceptance run.
5. Treat any visual mismatch, stuck transition, hidden input, overlay bleed or wrong character as a release blocker even if deterministic CI is green.

### Good Boys visual/gameplay completion

- Replace conservative neutral-frame locomotion with verified walk/run/dash frames extracted from the approved Katrin/Manchez reference sheets.
- Finish orbital gameplay geometry: catwalks, breach gaps, prison doors, consoles, maintenance structures, Cell 118/1984 landmarks, foreground occlusion, parallax and hazards that actually exercise boost/air-dash/throw/catch.
- Verify random gameplay screenshots remain recognizable as the supplied Good Boys concept art with labels hidden.

### Main-game visual completion

- Continue Night Walker asset replacement until daytime Mike frames never substitute for combat poses.
- Restore/classify the 182-frame Mike action source before enabling any additional action frames.
- Continue Sector 04/ordinary traversal density, foreground depth, sprite scale, lighting and camera polish against approved reference art.
- Complete Charger art replacement with a verified four-door Charger sprite; procedural silhouette remains fallback-only.

### Technical debt

- Reduce surviving historical hook layers by moving still-required behavior into stable concern modules.
- Do not create new numbered production hooks.
- Establish measured browser performance evidence: first playable time, transferred bytes, image decode failures, long frames, mobile memory/thermal stability.
- Maintain release packaging: build ID, changelog, known issues, save-version policy, rollback tag.

## Performance budgets

These are acceptance targets, not claims until measured on the deployed build:

| Metric | Target |
|---|---:|
| First playable, modern mobile Wi-Fi | <= 5 s |
| First playable, desktop broadband | <= 3 s |
| Main gameplay sustained frame rate | 50–60 fps preferred; no repeated >100 ms stalls |
| Input-to-visible-response | <= 100 ms for core mobile controls |
| Unhandled console errors | 0 |
| Required asset decode failures | 0 |
| Softlocks during acceptance routes | 0 |
| Save migration data loss | 0 |

## Release-candidate rule

A commit may be tagged as a release candidate only when:

1. `node scripts/production_release_gate.js` passes from a clean checkout.
2. Campaign Contracts passes on the same SHA.
3. GitHub Pages deploys the same SHA.
4. Physical-device acceptance evidence is collected against that SHA.
5. Issue #4 contains no unresolved P0 blocker.
6. Known remaining polish is documented and does not violate Story Bible or visual-reference authority.

# TechOps Hero — Production Readiness

**Authority date:** 2026-08-27  
**Baseline:** Story Bible v1.2 / Production v1.2  
**Primary release tracker:** GitHub issue #4

This document is the current readiness snapshot. Historical “shippable” verdicts in older QA/gap documents do not certify the current build; see `DOC_AUTHORITY.md`.

## Current readiness verdict

**Shipped-asset integration: COMPLETE by repository contract.** The production inventory currently covers every physical `.png` and `.json` under `assets/`: **76 PNGs + 2 JSON manifests = 78/78 physical assets**, plus 52 campaign payload parts and 39 runtime atlas/reference authorities. The registry now fails closed for script, image-decode and JSON-fetch failures; a file existing in the repository is no longer enough to count as integrated.

**Deterministic production contracts: GREEN on the current compositor workstream.** Campaign Contracts exercises syntax, campaign semantics, Good Boys, Sector 04, asset coverage, Night art authority, mobile contracts, the single-compositor contract, co-op UI and the aggregate release gate.

**Production release: NOT YET CERTIFIED.** Browser Runtime bot and real-device acceptance remain required. The last pre-snapshot browser run (`f8b49d4`, Runtime bot #71) still reproduced recursive Night rendering and a frozen Night Crawler; the compositor has since been changed to consume an immutable final parser-chain snapshot and must pass Runtime bot on the exact final SHA before release-candidate status.

Asset integration completeness and art completeness are separate claims. Do not mark missing/uncertified source art “integrated” by inventing mappings or procedural substitutes.

## Release gate

Run the complete deterministic gate locally with:

```bash
node scripts/production_release_gate.js
```

GitHub Actions runs the same aggregate command after its named contract steps. A green deterministic gate is necessary but not sufficient for release: Runtime bot and physical-device acceptance are also required.

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
- Complete physical production asset inventory: 78/78 PNG/JSON files registered and existence-gated.
- Asset registry load failures are tracked across script, PNG decode and JSON fetch categories.
- Root-level runtime atlas/reference authorities must be parser-loaded or production-registry-loaded.
- Mike unclassified 182-frame action atlas remains quarantined until a real source is visually classified.
- Night Walker key combat states are backed by the current static production 5x2 atlas rather than procedural player art.
- Good Boys is a Katrin + Manchez linked-pair campaign with the approved orbital premise and concept-art gameplay loop.
- Production compositor contract owns one stable Night draw/step authority and prefers the explicit final parser-chain snapshot.

## Remaining release gaps

### P0 — Browser/runtime acceptance

1. Runtime bot must pass WebKit and Chromium on the exact release SHA with zero first-party stack overflow, non-zero Night Crawler movement, playable Good Boys movement and successful Katrin/Manchez swap.
2. `wrapperGuard` / production compositor telemetry must report installed and aligned in the real browser, not only in VM contracts.
3. Unhandled first-party console errors must be zero. Third-party embed warnings may be separately documented but cannot hide first-party failures.

### P0 — Physical-device acceptance

1. iPhone Safari: New Run -> Tuesday Morning on the current deployed commit.
2. Desktop Chromium: New Run -> Tuesday Morning on the same commit.
3. iPhone Safari: Good Boys -> The Incident -> playable hull breach -> Cell 118.
4. Capture screenshots plus tester output for each acceptance run.
5. Treat any visual mismatch, stuck transition, hidden input, overlay bleed or wrong character as a release blocker even if deterministic CI is green.

### P1 — Verified art-source completion

- **Mike action atlas:** 182-frame metadata remains intentionally quarantined. Do not enable states until the real source payload is restored and frames are visually classified.
- **Katrin/Manchez locomotion:** shipped reference frames are integrated, but a verified dedicated walk/run/dash set is not yet certified. Do not relabel neutral/action frames merely to satisfy coverage.
- **Charger:** complete the replacement with a verified four-door Dodge Charger sprite; the procedural silhouette remains fallback-only.
- **Night Walker breadth:** key combat states have a production atlas, but continue reference review for any remaining daytime-Mike substitutions or missing transition frames.
- **Good Boys environments:** finish/verify orbital catwalks, breach gaps, prison doors, consoles, maintenance structures, Cell 118/1984 landmarks, foreground occlusion, parallax and hazards against approved concept art.
- **Main world polish:** continue Sector 04/ordinary traversal density, foreground depth, sprite scale, lighting and camera polish against approved reference art.

### P2 — Technical/release debt

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
| Unhandled first-party console errors | 0 |
| Required asset decode failures | 0 |
| Softlocks during acceptance routes | 0 |
| Save migration data loss | 0 |

## Release-candidate rule

A commit may be tagged as a release candidate only when:

1. `node scripts/production_release_gate.js` passes from a clean checkout.
2. Campaign Contracts passes on the same SHA.
3. Runtime bot passes WebKit + Chromium on the same SHA.
4. GitHub Pages deploys the same SHA.
5. Physical-device acceptance evidence is collected against that SHA.
6. Issue #4 contains no unresolved P0 blocker.
7. Known remaining polish is documented and does not violate Story Bible or visual-reference authority.

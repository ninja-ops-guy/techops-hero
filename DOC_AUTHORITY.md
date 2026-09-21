# TechOps Hero — Documentation Authority

This file resolves conflicts between historical review documents and the current Story Bible v1.2 production baseline.

## Current production authority

R1 convergence contracts are now the governing implementation layer. Story Bible v1.2 remains the canonical narrative/reveal baseline; the R1 contracts define how that canon is implemented, judged and certified.

In descending order when implementation guidance conflicts:

1. `docs/production/CONTENT-AUTHORITY-R1.md` — content classes, promotion rules, conflict resolution and concept-art quarantine.
2. `docs/production/PRODUCTION-BIBLE-R1.md` — current game pillars, interaction semantics, art/animation/UI/technical invariants and change control.
3. `PRODUCTION_BASELINE_v1.2.md` — canonical story/reveal/state baseline.
4. `docs/production/AAA-QUALITY-BAR-R1.md` — player-facing production-quality acceptance criteria and severity definitions.
5. `docs/production/VERTICAL-SLICE-R1.md` — reference-quality end-to-end slice and its required negative paths/checkpoints.
6. `docs/production/RELEASE-CERTIFICATION-R1.md` — release evidence and ship-gate contract.
7. `RUNTIME_AUTHORITY.md` — runtime ownership and no-new-numbered-hook policy.
8. `VISUAL_REFERENCE_STANDARD.md` — approved gameplay/reference-art visual contract where it does not conflict with R1 production authority.
9. `PRODUCTION_READINESS.md` — readiness snapshot and unresolved risks; it cannot override a newer R1 contract.
10. `CINEMATIC_COHESION_V1.md` — Good Dogs route/presentation implementation detail where still current.
11. `PRODUCTION_REVIEW.md` — consolidation review where it does not conflict with the authorities above.

## Historical / reference-only documents

The following are retained for archaeology and prior-version rationale, but are **not release-readiness authority**:

- `GAP_ANALYSIS.md` — historical v6.7 readiness/gap assessment. Its claims that the game was already content-complete/shippable and that the hook tower was an acceptable final architecture are superseded by Story Bible v1.2 consolidation and current mobile/reference QA.
- `QA_REVIEW.md` — historical v6.x/v7.x QA chronology. Individual fixed defects and implementation notes remain useful, but old “no P0 / shippable” verdicts do not override current production blockers.
- `CONSISTENCY.md` — historical system-consistency evidence unless a section is explicitly revalidated by the current Campaign Contracts workflow.
- `WORKSTATION_FLOW_NOTES.md` — implementation notes; canonical workstation behavior is owned by the current campaign modules and Story Bible v1.2.

## Rule

A historical document may explain *why* a system exists, but it cannot certify a current build. Current release claims require the R1 release-certification evidence set on one exact candidate head. Automated production gates remain necessary but cannot substitute for required physical-device, visual, performance, persistence or fresh-context human evidence.

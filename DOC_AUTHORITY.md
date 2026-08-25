# TechOps Hero — Documentation Authority

This file resolves conflicts between historical review documents and the current Story Bible v1.2 production baseline.

## Current production authority

In descending order when implementation guidance conflicts:

1. `PRODUCTION_BASELINE_v1.2.md` — canonical story/reveal/state baseline.
2. `RUNTIME_AUTHORITY.md` — production ownership and no-new-numbered-hook policy.
3. `VISUAL_REFERENCE_STANDARD.md` — approved gameplay/reference-art visual contract.
4. `PRODUCTION_READINESS.md` — current release gate, unresolved risks, and acceptance evidence.
5. `PRODUCTION_REVIEW.md` — current consolidation review where it does not conflict with the documents above.

## Historical / reference-only documents

The following are retained for archaeology and prior-version rationale, but are **not release-readiness authority**:

- `GAP_ANALYSIS.md` — historical v6.7 readiness/gap assessment. Its claims that the game was already content-complete/shippable and that the hook tower was an acceptable final architecture are superseded by Story Bible v1.2 consolidation and current mobile/reference QA.
- `QA_REVIEW.md` — historical v6.x/v7.x QA chronology. Individual fixed defects and implementation notes remain useful, but old “no P0 / shippable” verdicts do not override current production blockers.
- `CONSISTENCY.md` — historical system-consistency evidence unless a section is explicitly revalidated by the current Campaign Contracts workflow.
- `WORKSTATION_FLOW_NOTES.md` — implementation notes; canonical workstation behavior is owned by the current campaign modules and Story Bible v1.2.

## Rule

A historical document may explain *why* a system exists, but it cannot certify a current build. Current release claims require the production gate plus physical-device acceptance evidence on the current deployed head.

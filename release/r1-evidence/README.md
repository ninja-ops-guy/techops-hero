# TechOps Hero R1 release evidence

This directory documents the evidence format consumed by `npm run release:r1:assess -- --evidence-dir <dir>`.

The assessor is intentionally a **validator, not a test runner**. It must not manufacture physical-device, visual-art, performance or human-comprehension evidence.

## Candidate workflow

1. Freeze one candidate commit and record its full HEAD, tree and source fingerprint.
2. Deploy that immutable candidate and retain the deployed asset manifest.
3. Collect automated/browser evidence, human visual checkpoints, physical-device runs, performance profiles, unassisted playthroughs, the fresh-context vertical-slice playtest, known-issue disposition and rollback proof.
4. Put retained artifacts and one or more `*-report.json` files in the evidence directory.
5. Run the R1 assessor.
6. Any source-fingerprint change invalidates the evidence cycle. This is deliberately conservative: after a post-freeze code/content change, collect evidence again for the new candidate.

## Report envelope

Every report is schema version 1 and contains:

- `status: "passed"`;
- `source.head`, `source.tree`, and `source.fingerprint` matching the exact candidate;
- at least one retained artifact with SHA-256;
- one or more checks whose `id`, `profile`, and `evidence_type` are permitted by `release_certification.json`.

Reports with stale source identity, missing/modified artifacts, fixture-assisted human/physical evidence, or weak observations are rejected.

## R1-only qualification surfaces

The expanded inventory adds explicit gates for:

- candidate freeze identity;
- deployed build/asset identity;
- desktop + phone vertical-slice checkpoint captures;
- minimum keyboard/pointer/touch matrix;
- persistence boundaries;
- measured performance budgets;
- fresh-context human completion of the reference slice;
- severity-classified known issues with zero open P0/P1;
- tested rollback and forward-restore receipt.

Existing physical-device, decoded-cinematic, unassisted-route, soak and protected-CI gates remain mandatory.

## Retained artifacts

A check that references an artifact uses:

```json
{"artifact_path":"captures/standup.png","sha256":"<64 lowercase hex>"}
```

The path is relative to the evidence directory and must resolve inside it. The validator recalculates the file digest at assessment time.

## Human evidence

`visual-checkpoint` and `human-playtest` checks require `operator`, `device`, `browser`, and `fixture:false`. These fields are evidence metadata, not claims that automation reviewed the art or understood the game.

## Physical performance

Mobile `performance-profile` checks require `physical_device:true`. Desktop simulation cannot certify iPhone/Android performance.

## Relationship to production contracts

Issue #73 owns this harness. PR #64 establishes the R1 production/quality/vertical-slice contracts. If the contract PR changes required checkpoint semantics before merge, update `release_certification.json` and its regression tests together; never silently weaken the validator.

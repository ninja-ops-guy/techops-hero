# Combined open-PR integration acceptance — v1

## Provenance and scope

1. The integration base MUST be `main` commit `3f8e59cc1b8f4b6f2bc32f3bc2eab32d81f36f66`.
2. Every one of the 58 open PRs observed at the start MUST be classified as already included, ready/included in this integration, overlapping/superseded, or blocked/out of scope, with a reason and head SHA.
3. Included PRs MUST be integrated in dependency order. Stacked predecessors MUST NOT be counted twice when a later head contains them.
4. The result MUST remain a draft PR. No open PR or the integration PR MUST be merged by this task; the user retains the merge decision.

## Combined-tree correctness

5. The exact combined tree MUST pass JavaScript syntax checking and the repository production release gate. Individual PR checks are evidence only, not a substitute for these combined-tree runs.
6. The exact combined tree MUST exercise Day Shift and Doors, Night Walker, Good Boys, and save/Continue using the repository's production entry point and no fixture-only substitute.
7. Desktop Chromium and a touch-enabled mobile viewport MUST each exercise the focused journeys. Save/Continue MUST include reload or background/recovery evidence, not merely saving in memory.
8. Any failure MUST either be fixed and rerun on the combined tree or remain explicitly blocking; a failing focused gate MUST NOT be reported as passing.

## Evidence and publication

9. Every verification run MUST append a UTC timestamp, exact command, exit code, and produced values under `verifier/runs/`.
10. The draft PR body MUST identify the pinned base, integrated head, all included/excluded PRs and reasons, combined verification results, and remaining limitations.
11. Files published through GitHub MUST match the local tree; every pushed text-file blob SHA MUST be checked against local `git hash-object` output.
12. Desktop/touch emulation is not physical-device certification. No R1 or physical-device certification claim is permitted without separate evidence.

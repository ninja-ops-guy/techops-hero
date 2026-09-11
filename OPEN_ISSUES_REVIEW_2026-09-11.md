# TechOps Hero open-issue review — 2026-09-11

Reviewed main: `a7fc7c5eb33e479d73647c8f7c8484c818c40b69`.
Review branch: `fix/open-issues-20260911`. This is a repair candidate, not a release certification.

## Complete tracker inventory

| Tracker | Review result | Work in this branch / remaining requirement |
| --- | --- | --- |
| [#10 Runtime Bot regression](https://github.com/ninja-ops-guy/techops-hero/issues/10) | Issue body is an August 29 report; recent failures are in comments/runs. September 11 run 34562401394 reports GD_CUT_02 demux failure. Later runs pass. | Corrected media evidence attribution, compatible-file repeat-run integrity, failed-run selection, stale-SHA rejection, repair retention, and missing-report handling. Keep open until the candidate passes cross-browser checks repeatedly. |
| [#4 Production consolidation](https://github.com/ninja-ops-guy/techops-hero/issues/4) | Most deterministic requirements pass. Device/art certification and architecture cleanup remain open. | Unified remaining Good Boys attack entrypoints, fixed combo credit on whiffs, removed Charger/DRIVE/road markings from Good Boys, guarded district travel, updated readiness evidence, and expanded the aggregate gate. Item-by-item remainder below. |
| [PR #8 Playwright 1.55.1](https://github.com/ninja-ops-guy/techops-hero/pull/8) | Small compatible dependency update. | Incorporated the exact version bump, added a reproducible npm lockfile, switched Runtime bot to npm ci, and included lockfile changes in CI triggers. PR itself remains unmerged. |
| [PR #12 Good Ship / Good Dogs semantics](https://github.com/ninja-ops-guy/techops-hero/pull/12) | Conflicts with newer main. Its old opening/control files would replace later fixes if taken wholesale. | Ported the paired-combat implementation and contract, then consolidated additional attack callers. Current main already has supplied-asset flight and a newer cockpit → takeover → flight → crash → M3 opening. Semantic bridge/Mike Index changes remain a separate integration task; they conflict with main's current Access Core authority and need save/reload and full-campaign proof. No PR-only assets were deleted. |

## Confirmed fixes

- The repair script previously searched for the nearest MP4 around a demux string. Run 34600260241 re-encoded the crash clip although the reported failing source was the takeover clip; both already probed as H.264/yuv420p. Repairs now require an exact source in the failing structured record. Compatible files are reported for decoder/load investigation and remain byte-identical, including repeated runs.
- Successful bot runs no longer trigger automatic repair. Manual dispatch also checks the source run's result, repository, branch, event and exact checkout SHA. Stale failures do not mutate newer main.
- Repair patches, result JSON, summary and base SHA are uploaded before PR creation. One branch per source SHA prevents repeated branch creation. If PR creation is denied, the workflow retains the evidence and reports the denial; it does not change repository policy.
- Runtime bot emits a failure report even when browser setup fails before page handlers run. Empty browser/mode selections cannot report a successful zero-check run.
- Good Boys attacks use the paired-combat authority. Missing nmJab cannot fall back to interact or synthesized E; misses reset combo and earn no attack SYNC. The old director/mobile/gameplay entrypoints delegate to that same behavior.
- Visual browser review caught the Earth Charger and DRIVE prompt inside the orbital prison despite a green runtime test. The shared Night provider now excludes the car, district menu and street lane markings from Good Boys while preserving normal Night Crawler behavior.

## Issue #4 remainder

| Unchecked area | Disposition / next concrete evidence |
| --- | --- |
| New Run → Tuesday on physical iPhone Safari and desktop Chromium | Still open. Retain screenshots and telemetry from the exact deployed candidate; headless Chromium is not a physical-device acceptance run. |
| Good Boys through breach and Cell 118 on physical iPhone | Still open. Desktop Chromium progression reached Cell 118 and K reveal in this review; physical touch/Safari evidence is still required. |
| Dedicated Katrin/Manchez walk/run/dash frames | Blocked on approved, semantically verified source frames. Existing conservative locomotion remains; attack/down art was not relabeled as locomotion. |
| Environment density/parallax and concept-sheet likeness | Removed confirmed Earth-world leakage. Current browser screenshots and all eight background contracts were reviewed/tested, but concept-art likeness is not certified by those contracts. |
| Deployed first-playable, long frames, input latency, memory/thermal and decode measurements | Existing budgets remain. Collect on real devices and attach to the accepted SHA. Local WebKit could not launch because required system libraries are absent; package installation was blocked by the environment's user/group restrictions. |
| Historical hook tower | Consolidated redundant attack implementations into existing paired-combat authority. The broader provider stack remains; retire behavior clusters with parity tests, not blanket deletion. |
| Release/rollback tag | Intentionally pending the documented physical-device and exact-SHA gates. No release tag was created. |

The quarantined MIKE_ACTIONS payload and temporary Charger artwork fallback in `KNOWN_ISSUES.md` also remain source-art dependencies.

## Validation

- Baseline: 40-suite deterministic production gate passed.
- Repair candidate: 43-suite aggregate gate passed, including the new combat, world-isolation and repair-integrity tests.
- Chromium: Night Crawler and authored Good Boys opening/gameplay passed (0 failures; 4 external-media/network warnings in the local environment).
- Chromium: progression through M3, Cell 118, GD_CUT_04 and GD_CUT_05 passed.
- Chromium: all eight Good Boys background contracts passed.
- Workflow YAML parsing, embedded shell syntax and git diff whitespace checks passed.
- Final car-isolation visual recheck and GitHub PR CI results are recorded in the PR. Browser artifacts are retained by the existing Runtime bot workflow.
- These checks do not prove full M4–M8 gameplay, all endings, physical-device behavior, or production certification. The present progression bot stops after Cell 118; restore full Warden/Earthfall runtime coverage before claiming that chain is closed.

## Automation permission still required

[Runtime Fixer run 34600260241](https://github.com/ninja-ops-guy/techops-hero/actions/runs/34600260241) failed with: “GitHub Actions is not permitted to create or approve pull requests.” An owner must enable that repository setting if automatic repair PR creation is desired. This branch preserves failures and proposed patches for review without bypassing that restriction.

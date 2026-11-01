# R1 reconciliation evidence — November 1, 2026

Candidate PR: https://github.com/ninja-ops-guy/techops-hero/pull/93
Final source head: 229a9f686a09d7b8214ac62e2b6b710bbd497546
Final tree: 088ba7af2c23307bc103b76c6fabd1587d6760b6
Reconstructed application candidate: 6c498e33aa73af62a5a347dbc067ae04adfc7cea, tree b649d5fb1a879700e92cddeb3314ba08ce8d0faf (matches the recorded October 29 tree; old commit 33e7932 was not recovered).

The final commit changes only four CI workflows: supported runner images and exact-head checkout. No application or test assertion changes after 6c498e3.

## Local evidence mapping
- production.log: original published a7d79988b4048db030482dab33ddddd96ad1ab82, 112 suites PASS.
- published-production.log: fetched 6c498e3, 112 suites PASS.
- final-production.log: fetched 229a9f6, 112 suites PASS, syntax and quarantine PASS.
- final-night-contracts.log: 229a9f6, 70 diagnostics/driver tests PASS.
- baseline-night-retry: a7d7998, desktop Chromium, 10 checks PASS.
- candidate-night-retry: 6c498e3, desktop Chromium, 10 checks PASS.
- final-night: 229a9f6, desktop and touch Chromium, 10 and 12 checks PASS.
- day-report-summary.json: desktop/portrait/landscape, 18 checks PASS. Launched around the CI-only ref transition from 6c498e3 to 229a9f6; application and test bytes are identical across those refs. Do not describe this local Day run as a frozen-checkout identity proof. Hosted Day has its own exact-head workflow.
- baseline-night and candidate-night: initial full-Chromium launch failures before gameplay; retained rather than discarded. Retried using successfully installed Chromium headless shell without changing application/test code.

## Hosted evidence
- hosted-night-229a9f6.log: run 41357065406, explicit checkout 229a9f6; production gate and all three Night profiles PASS (Chromium desktop, Chromium touch, WebKit touch).
- initial-hosted-night.log: run 41356932775 on 6c498e3, production PASS then browser installation failure: Playwright 1.55.1 does not support ubuntu26.04-x64. Gameplay skipped.
- hosted-performance-install-failure.log: run 41357065288 on 229a9f6, separate unchanged performance workflow blocked by same runner incompatibility; missing-artifact failure is secondary.

The earlier desktop dash-grab timeout did not reproduce in the paired local run or final hosted Night matrix. This is not proof of long-term reliability or physical-device completion. No new Night gameplay regression observed in these runs. All browser combat tests use declared fixtures.

## Reconciliation
Day c6dec30f is an ancestor of a7d7998 and the final candidate. The three #92 cockpit/flight files and two #91 Night/Waldo files were already identical in a7d7998 and their source branch heads. #87 runtime diagnostics were also already identical. Missing #89 focus restoration, #90 keyboard exclusion, #88 regression coverage, and #87 debug workflow wiring were merged. Source parents #87–#92 were retained, without replaying the already integrated patches. #85 is not an ancestor by SHA; its integrated recovery lineage is retained through the published candidate and later #91/#92 file versions. Its historical backlog document was not imported. #86's corrected Day acceptance is present via c6dec30f and was not duplicated.

This evidence branch is separate from the candidate, so storing test results does not move the tested PR head. Full merge-gate status is recorded in PR #93 and its Actions runs. Issue #81 remains authoritative for physical devices, accessibility, human testing, deployment identity and governance. No deployment, merge, certification, or release authorization was performed.

# Companion staging validation — 2026-11-16

Implementation: [companion and care staging](../../../production/FIELDCRAFT-STAGING.md).

All 78 targeted browser checks passed: 26 each in desktop, portrait and landscape, with zero page errors. Six new groups per profile cover companion movement/ownership, pause/facing, room transitions, save/resume/street cleanup, read-only care inspection, and staging timing. Mobile movement uses emulated touch controls. Later-chapter prerequisites, objective/room positions and a stationary combat opponent are declared fixtures; these results do not establish a fresh full campaign traversal or physical-iPhone acceptance.

The production gate passed all 126 suites and syntax checks for 636 files. Source fingerprints bind these receipts to the implementation and test files. Commands: `node scripts/production_release_gate.js` and `FIELD_PORT=4213 FIELD_OUT_DIR=/tmp/staging-final node scripts/fieldcraft_browser.mjs`.

Visual review confirmed separate K/Mike rescue positions, Iona alongside K, and the care attendant beside the stretcher. Screenshots preserve actual UI, including limitations: the portrait camera at this inspection position crops the stretcher's left end and label; the landscape interaction overlay obscures part of the station. This is candidate staging, not final composition acceptance. Existing character likeness, dedicated care poses and responsive care-scene framing remain polish work.

The earlier full 27-chapter/11-chain run belongs to revision a181a58; it has not been repeated or relabeled for this revision. No merge, deployment, native-campaign qualification or physical-device test is claimed.

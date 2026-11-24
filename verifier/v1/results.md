# Combined verification results — v1

## Source identity

- Pinned base: `3f8e59cc1b8f4b6f2bc32f3bc2eab32d81f36f66` (`main`).
- Integrated source: #159 @ `7c6a59fac65dcbe165b477f802e224f29b7bc247`, then #165 @ `3550278242357f14a21aa1fbf2639ae2212f2a93` with the two workflow-file modifications left at their pinned-base versions.
- Local verification HEAD: `18853f4c439d6366dd1d873d45742dd4e12fb947`.
- Local verification source tree: `9d1a70696a4065cbbd3dbf9ed1297e18b3d21844`.
- Conflict resolution: unioned Night and Day suites in `scripts/production_release_gate.js`; retained both cache contracts in `test_static_entrypoint_integrity.js`; added an environment-selectable Chromium executable to `scripts/night_comic_browser.mjs`.

## Gates on the combined tree

| Gate | Result | Evidence |
| --- | --- | --- |
| Pinned-base production gate | PASS — 120 suites; 617 syntax files | `verifier/runs/2026-11-24T03-07-13Z-baseline-production-gate.md` |
| Final syntax | PASS — 625 files | `verifier/runs/2026-11-24T03-57-16Z-final-lint.md` |
| Final production gate | PASS — 124 suites; 625 syntax files | `verifier/runs/2026-11-24T03-57-24Z-final-production-gate.md` |
| Cross-mode production browser acceptance | PASS — 15 checks across desktop 1280×800, touch 390×844 and touch landscape 844×390; Day and Night reload/Continue plus Good Boys launch/movement | `verifier/runs/2026-11-24T03-37-31Z-combined-quality-desktop-touch-system-chromium.md` |
| Day Shift and Doors | PASS — desktop, ordinary-motion desktop, 390×844, 320×568 and 844×390; source unchanged during acceptance | `verifier/runs/2026-11-24T03-40-05Z-combined-day-doors-five-profiles.md` |
| Unassisted Day 1 Shipping route | PASS on desktop and 390×844 touch; 12 beats each, real controls/movement, no coordinate or progression fixtures | `verifier/runs/2026-11-24T03-44-11Z-combined-day-unassisted-desktop.md` and `verifier/runs/2026-11-24T03-44-50Z-combined-day-unassisted-portrait.md` |
| Night Walker comic/gameplay route | PASS on desktop and 320×740 reduced-motion touch; one Night entry, block/contact, Waldo porch reward persisted | `verifier/runs/2026-11-24T03-46-16Z-combined-night-comic-desktop.md` and `verifier/runs/2026-11-24T03-46-43Z-combined-night-comic-reduced.md` |
| Good Boys full route | PASS — real-input M1/M2, boarding, cockpit/flight/crash, later mission transition fixtures, Warden finisher and Earthfall; zero recorded failures | `verifier/runs/2026-11-24T03-47-34Z-combined-good-boys-full-route.md` |
| Open-PR accounting | PASS — 58/58 unique open PRs | `verifier/v1/pr-inventory.md` and `verifier/runs/2026-11-24T04-00-00Z-final-structure.md` |

The first browser invocation failed before launch because the pinned Playwright browser was absent. That failed run is retained at `verifier/runs/2026-11-24T03-36-29Z-combined-quality-desktop-touch.md`; all reported browser passes use system Chromium 151.0.7922.108. A baseline `npm ci` also failed on the persistent filesystem's symlink restriction; its record is retained and no test result is inferred from it.

## Boundaries

- Browser emulation is not physical-phone, native-multitouch, Safari/WebKit, thermal or sustained-performance certification.
- External audio was blocked; muted continuation and media decode paths were tested, not audible soundtrack quality.
- Day device acceptance uses declared approach fixtures; the separate unassisted Shipping playthroughs supply the no-teleport/no-progress-injection route evidence.
- The Good Boys full-route bot uses real input through M1/M2 and declared encounter fixtures later in the campaign; it is not an unassisted full-campaign human playtest.
- #162 is not included because its three new binary atlases cannot be safely created through the available inline publication path.
- #165's runtime/test content is included; its two workflow-file modifications remain at base versions because the available write path is not workflow-scoped.
- No R1 certification or merge approval is claimed. The user makes the merge decision.

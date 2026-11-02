# R1 workstation touch-target correction

Review: https://github.com/ninja-ops-guy/techops-hero/pull/93

- Original published candidate: `229a9f686a09d7b8214ac62e2b6b710bbd497546`, tree `088ba7af2c23307bc103b76c6fabd1587d6760b6`.
- Corrected published candidate: `b85d4186ecbc2f3c6a047a61b9974c98608a91f5`, tree `e20b3a464bab870be002fe36cecd6202c6c46a88`.
- Initial local correction commit: `6cd4114086347103af94a64803ed168896de599b`, identical corrected tree. The published commit was created through the GitHub connector because shell Git had no push credentials. Final validation was repeated from a clean detached checkout of the published SHA.

The production renderer creates Back to desktop in `.os-actions`. Its button already has `min-height:44px`. The parent `.os-window` used `day-focus-in`, which animates the individual CSS scale property from `.985` to `1`. Thus its nominal 44px button is rendered at approximately 43.34px during entrance. `transform:none` does not cancel the individual scale property. Portrait and short-landscape rules change layout and padding but do not remove that parent scaling.

The correction gives only `.os-window` a dedicated opacity-only entrance animation. Button size requirements, the shared independent touch-target assertion, other Day animations, and gameplay layouts remain unchanged.

The isolated regression uses the actual `runtime_day.js` desktop renderer and production CSS, with a declared proximity fixture. It samples the entrance animation at 0%, 25%, 50%, 75%, and 100%, and also checks reduced motion. Before the CSS change it fails at approximately 43.34px in all three profiles. Afterward it passes. The same helper is wired into the existing quality browser acceptance at the real workstation interaction, before the ordinary hit-test and click/tap. No tolerance was widened and no waiting was added to evade an undersized target.

Commands on the corrected published revision:

```sh
npm ci --offline
node scripts/test_workstation_touch_target_browser.mjs
npm test
QUALITY_PORT=4198 QUALITY_OUT_DIR=/tmp/r1-published-acceptance node scripts/quality_acceptance_browser.mjs
```

Environment: Ubuntu 24.04.3, repository-pinned Playwright 1.55.1, installed Chromium. Browser version and clean source fingerprint are recorded in the final report. The production gate passes all 112 suites plus syntax/quarantine. The original unmodified browser acceptance also passed locally on the baseline; that timing-sensitive pass does not contradict the hosted failure or the deterministic failing regression.

Retained here: raw regression and production logs, original/final quality JSON reports, final acceptance stdout, and computed-style/geometry JSON samples. Screenshots referenced by report hashes are not included in this text evidence snapshot.

Separate outstanding gates:
- Hosted Merge Gate: https://github.com/ninja-ops-guy/techops-hero/actions/runs/41385236575 (see retained snapshot; status may advance after capture).
- Performance workflow: https://github.com/ninja-ops-guy/techops-hero/actions/runs/41385236494 still fails at Install Chromium: `Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.55.1!` No performance workflow change is included.
- Physical-device certification and release authorization remain outstanding under issue #81. Browser viewport/touch emulation, fixture tests, and automated passes are not physical certification or release approval.

No merge or deployment was performed. PR #93 remains a draft.

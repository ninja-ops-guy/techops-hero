# Night Walker lifecycle — reviewed integration

This branch consolidates PR #24 with `main` at `8004cef72a33b466285076f25af64a5f0570e6b5`, including the merged PR #25 feature scope and the new Good Dogs reference UI. The production path has one `TechOpsNightRuntime` owner. The interval-based `TechOpsNightFlow` and PR #23's `TechOpsNightSession` are not loaded alongside it.

## Player path

Use the Charger to travel to Home Street. Approach the lit ground-level door at Mike's house, then use E, the interaction control, or Enter Mike's house. Sleep opens the existing v725 three-shot home/interior/morning scene. Stay out leaves the night active; walking to the map edge does not silently sleep. Existing after-hours maintenance/study and end-of-day reward review remain in the exit chain. Sleeping does not complete story objectives.

The visible CAMPAIGN [C] control and Charger entry delegate to the existing After Hours/Sector 04 campaign. Missing daytime prerequisites remain missing. A return to investigation preserves the recorded evidence and restores the original day clock. Sector 04 waits for the Night Drive attachment event, and continuing an active encounter does not reset it.

## Ownership

One in-game minute passes per five active gameplay seconds. Travel counts; dialogue, cinematics, menus, pause, game-over and hidden tabs do not. Deltas are bounded and invalid numbers are ignored. Midnight wraps the display without aging work tickets or incrementing the office day. Good Dogs and Waldo retain their existing loop ownership. Automatic street-time jumps are retired under the continuous owner.

Home scenes acquire the existing presentation director's blocking claim. Tests run the actual production guard against that claim: stale-dialog repair cannot clear the cinematic pause. Normal completion, skip, missing-renderer fallback and stale callbacks share a once-only settlement boundary. Night selection is cleared before the original exit chain to prevent immediate re-entry.

The main frame dispatches Night before legacy day step/draw wrappers. Day interactions and delayed announcements are explicitly mode-scoped rather than suppressed by matching their text. The Good Dogs opening wrapper keeps a local predecessor to avoid recursive guard composition.

The short landscape title is scrollable; acceptance uses a normal click or touch tap, not a forced click. Movement acceptance observes acknowledged input, an advancing production-step counter and actual position change, and reports all three when it fails.

## Validation and limits

`node scripts/production_release_gate.js` runs the existing aggregate gate plus 16 lifecycle regression groups. `test_runtime_night.js` remains a compatibility test entry and delegates to the replacement lifecycle suite rather than testing the retired heartbeat implementation.

`npm ci` and `npx playwright install --with-deps chromium firefox webkit`, then `node scripts/night_lifecycle_browser.mjs`, exercise the production page in Chromium, Firefox, WebKit and touch-enabled landscape WebKit. Story prerequisites and selected travel positions are explicit fixtures. The tests are not unassisted campaign completion or physical iPhone validation.

The workflow is read-only, disables persisted checkout credentials, preserves failures through `tee` using explicit pipefail, and captures tested commit/source hashes plus browser reports and screenshots. Local Chromium was blocked from accessing the local server by the execution environment; cross-browser outcomes must be read from this branch's CI, not inferred from Node tests.

PR #23's office follow-ups/shared-context audio and PR #26's presentation additions are separate review work. The directional combat package remains a separate integration until its production touch tests pass. Do not merge competing clocks or sound generators merely to resolve a textual conflict.

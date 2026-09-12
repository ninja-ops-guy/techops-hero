# Night Walker lifecycle and campaign return

## Player path

Use the Charger to travel to **Home Street**, then approach the lit door marked **Mike's House**. Press **E**, use the interaction control, or tap **Enter Mike's house**. Choose **Sleep — return to day mode** or **Stay out tonight**. Crossing the right edge is no longer an invisible sleep trigger.

Sleep uses a three-shot, letterboxed home/interior/morning sequence registered in the existing cinematic engine. It supports the engine's keyboard/touch skip plus an explicit accessible skip button. Normal completion and skipping share a once-only continuation. After-hours maintenance/study and the normal end-of-day reward choice remain intact; choosing a day-review reward starts the next daytime shift. Sleeping does **not** complete campaign objectives.

**CAMPAIGN [C]** is visible during Night gameplay and the Charger has a campaign entry. This connects to the existing **Chapter I — After Hours / Sector 04** encounter. The menu distinguishes the authored campaign from free roam. It exposes missing daytime prerequisites rather than fabricating evidence. Returning to daytime investigation restores the same campaign day and pre-night work clock. After the canonical terminal has completed Sector 04, its Tuesday action performs the actual runtime handoff to the next day.

## Ownership and timing

`runtime_night.js` is loaded once by `production_bootstrap.js`, after the existing authorities. The parser-time script count remains within the existing ceiling. It adds no interval or timer-driven maintenance owner.

The main frame dispatches Night Walker directly into the immutable `stepNM`/`drawNM` compositor. The legacy daytime `step`/`draw` chains therefore cannot emit office events or draw daytime weather over Night Walker. Good Dogs retains its existing frame path. Day-only interaction handlers also reject Night state, including office NPCs and inherited day-ticket portals. Canonical Sector 04 interaction remains available.

One in-game minute passes per **five active gameplay seconds**. Travel and combat count; dialogue, cinematics, menus, hidden documents and pause states do not. Frame deltas are bounded, so reopening a suspended tab does not fast-forward the night. The clock is monotonic across midnight and displayed modulo 24 hours. Automatic 20-minute per-street jumps are retired when this owner is present. Night advancement never ages work tickets or raises daytime incidents. A night clock checkpoint is retained in the existing game metadata, without introducing a second campaign save.

Delayed weather/week/day-theme notices capture their original state, day and mode generation. Switching modes or replacing a run invalidates them. Legitimate Night dialogue is not suppressed by matching words in its text.

## Transition invariants

The existing Night Crawler character selector is cleared before invoking the original exit chain, preventing its legacy automatic re-entry. Day HUD/controls are restored when the Night world detaches. Scene tokens are released on completion; duplicate and stale callbacks cannot settle another night or mutate a replacement run. Daytime investigation recovery keeps campaign evidence and choices; the Sector 04 renderer attaches after the Night Drive's entered event instead of assuming a synchronous launch.

## Validation

Run `node scripts/production_release_gate.js` for the production contract gate, including `test_night_lifecycle.js`. The new suite covers the night clock, pause/midnight semantics, mode isolation, house bounds, optional stay-out path, once-only sleep/skip/fallback, stale callbacks, campaign gating, recovery and asynchronous Sector 04 attachment.

Run `npm ci`, install the pinned Playwright browsers, then run `node scripts/night_lifecycle_browser.mjs`. This exercises Chromium, Firefox, WebKit and touch-enabled mobile WebKit against the actual served game. Browser artifacts are written to `artifacts/night-lifecycle/`; inspect the JSON status and screenshots rather than assuming a launched job passed. Desktop WebKit emulation is not a substitute for testing on a physical iPhone.

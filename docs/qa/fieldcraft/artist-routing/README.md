# Artist-score routing qualification — 16 November 2026

This candidate extends PR #131 on the PR #130 staging revision `0c7b983dd618aab06faff753b0b009de202cd330`. `source-sha256.json` identifies the tested production and fixture sources. The catalog still contains no artist audio exports.

Four targeted Node suites pass: 25 audio/cue/lifecycle checks, 27 fieldcraft checks, 13 Living World checks and 12 progression checks (77 total). Logs and their parsed summary are retained here. Syntax checks for both changed runtime modules and the browser script and `git diff --check` also pass.

The browser harness generates two-second stereo WAV tones in memory and serves a synthetic ready pack only inside its local test server. It tests the production audio module using real Web Audio decoding and trusted button clicks, on desktop and emulated portrait touch. Checks cover gesture gating, pending fallback, four shared source start times, pause, mute, rehearsal exclusivity, blur, buffer release and initial missing-file fallback. These tones are not song exports and are not added to `assets/music/`.

Reproduce from the repository root:

```sh
node test_field_score.js
node test_fieldcraft.js
node test_living_world.js
node test_living_world_progression.js
node scripts/field_score_browser.mjs
```

The recorded browser run uses Chromium Headless Shell 140 with `CHROMIUM_EXECUTABLE=/home/agent/.cache/ms-playwright/chromium_headless_shell-1193/chrome-linux/headless_shell`. Set this variable to an installed Chromium executable if the default Playwright browser is unavailable. The system Chromium wrapper could not launch in this environment; the installed headless shell completed both profiles.

This is targeted routing and audio transport evidence. It is not a full campaign browser playthrough, an artist listening review, codec qualification for MP3/OGG, WebKit/Safari acceptance, physical iPhone memory qualification, or release approval. No published song is adaptive yet.

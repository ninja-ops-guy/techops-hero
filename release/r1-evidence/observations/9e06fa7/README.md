# TechOps Hero R1 verification on November 6, 2026

Game commit `9e06fa74c5aca335b1b471b651dd722d49826fb3` has tree `049ddd067613c0e119ee6c39e7c9a66cdc0e05c9`. PR #93 tested this tree at `5bc54aaa4a2bb1795865c27b60c9e383665238d2`. The files in this directory record observations about the game commit. Run the game from that commit when reproducing the measurements.

## Deployment

All 520 entries in the repository's deterministic release manifest matched both the GitHub Pages artifact and the public HTTP response bytes. The sweep covered 41,176,061 bytes, including the nine shipping MP4s. The project root also returned the expected `index.html`. The manifest SHA-256 is `289d1e1cbae1902264cbbd05d9fc75095827f033a5cad41fe3a22d0ffdbd83f2`. Each public path was requested once between 16:49:08 and 16:55:28 UTC.

[Source manifest](pages/release-asset-manifest.json) · [Pages receipt](pages/receipt.json) · [Per-file HTTP results](pages/public-responses.json) · [Hosted deployment](https://github.com/ninja-ops-guy/techops-hero/actions/runs/42251935247/job/128009144564)

The Pages job bound deployment artifact `13520767313` to the merge SHA. The public project URL can change on later deployments. Candidate freeze, an immutable publicly addressable target and real-media playback remain separate checks in #81. The local deterministic production gate passed 114 suites on the clean merged source. [Gate log](local/production-gate.log)

## Night dash-grab

Each condition had ten fresh first attempts. Both browsers ran on Debian 13 with Playwright 1.55.1. The WebKit profile used an emulated iPhone 13. The production bot uses trusted keyboard taps and a punch to test this grab on both profiles. Each punch margin below was confirmed by the combat engine's successful grab event.

| Profile | Baseline failures | Smallest margin | Contention failures | Smallest margin |
|---|---:|---:|---:|---:|
| Desktop Chromium 140.0.7339.186 | 0/10 | 140.0 ms | 0/10 | 56.7 ms |
| Linux WebKit 26.0, touch profile | 0/10 | 290.0 ms | 0/10 | 290.0 ms |

The margin measures time remaining on the 340 ms **combat clock**. In the WebKit contention trials the wall-clock time from the second tap to the punch ranged from 204 to 532 ms. Each of those trials advanced the combat clock by 50 ms. To reproduce the load, the browser and driver shared two logical CPUs with one busy process pinned to each. The HTTP server ran on a third CPU. Baseline trials used the same affinity with the two added workers stopped.

The first setup produced 20 connection refusals before a game loaded. All original failed attempts were retained. The corrected setup launched the server and browsers in the same process tree and verified the index hash before either study. The two gameplay batches each ran their fixed 20-trial plan once.

[Night receipt](night/receipt.json) · [Chromium input and combat timestamps](night/chromium-observations.jsonl) · [WebKit input and combat timestamps](night/webkit-observations.jsonl) · [Eight offline scheduler controls](local/scheduler-controls.tap)

## Historical failures

- The [October macOS WebKit job](https://github.com/ninja-ops-guy/techops-hero/actions/runs/38358000737/job/115165288660) tested synthetic merge `358308b546320dba577684f9f774b9a3611c3093`. Its dash began at 155 ms, ended at 495 ms and produced a jab windup at 599 ms. That punch missed the deadline by 104 ms.
- Both scheduled runs on `9c8eb0509701026f276c66b9c9a99f529aabfc18` exited 124 at the 180-second suite limit. Each archived desktop Chromium trace records a successful `fromDash` predicate at `call@1191` and a later successful return-to-street menu click. The aggregate report was missing in both cases. The operation that consumed the remaining suite budget is still unknown. [First run](https://github.com/ninja-ops-guy/techops-hero/actions/runs/41602813022) · [Second run](https://github.com/ninja-ops-guy/techops-hero/actions/runs/41692752029)

The original Night trace, screenshots and runtime JSON from each November run were extracted after checking the full Actions ZIP against its published SHA-256. The retained failure archive also includes both compact triage ZIPs and all original local navigation failures. Archive SHA-256 is recorded in the Night receipt. [Historical evidence and per-file digests](night/hosted-history.json)

## Reproduction

Use a clean detached checkout of the game commit above named `source`, with a separate working directory for outputs. Install the repository's locked dependencies and required Playwright browser binaries. From `source`, run `node scripts/release_asset_manifest.mjs --out /absolute/path/to/release-asset-manifest.json`. The public comparison uses `python3 verify_live.py MANIFEST OUTPUT_JSON https://ninja-ops-guy.github.io/techops-hero/` with curl 8.3 or newer.

The [study kit](night/study-kit.zip) contains the actual observation program builder, the two Linux supervisors and their fixed plans. Extract it alongside `source`. Create `receipt/night` and `receipt/night-webkit` and place the generated manifest at `receipt/release-asset-manifest.json`. Run `python3 prepare_probe.py source rig`. The generated probe imports the stock diagnostics and preserves the original encounter setup, input sequence, staging guard, assertion and evidence capture. Its checksum and the unchanged segment checksum are in the kit.

Run `python3 run_trials.py` for Chromium. For WebKit, copy `rig/scripts/night_dash_probe.mjs` to `rig/scripts/night_dash_probe_webkit.mjs`, apply `patch rig/scripts/night_dash_probe_webkit.mjs < webkit-launch.patch`, then run `python3 run_webkit_trials.py`. Both supervisors require Linux affinity on CPUs 2, 3 and 4. Use a fresh output directory per batch and retain all first-attempt results. A comparable native macOS WebKit contention run is still required for the historical macOS failure.

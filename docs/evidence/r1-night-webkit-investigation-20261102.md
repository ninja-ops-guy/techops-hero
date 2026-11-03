# R1 intermittent WebKit Night reload investigation — 2026-11-02

Status: **confirmed intermittent WebKit page crash; native root cause unresolved. No fix claimed.**

## Evidence identities

All three ZIP archives were downloaded and their SHA-256 digests independently recomputed. Artifact tested-commit.txt and report.json were read directly, rather than relying on PR summaries.

| Execution | PR head | Tested merge | Outcome | Artifact |
|---|---|---|---|---|
| 41450347383 attempt 1 | 508bb557eeb0125947dfb8e173d92d83c0ba60d7 | c828811c07feab0bd64d19073f13d5528fda03be | WebKit desktop failed; other three profiles passed | 13143938918 |
| 41450347383 attempt 2 | 508bb557eeb0125947dfb8e173d92d83c0ba60d7 | c828811c07feab0bd64d19073f13d5528fda03be | All four profiles passed | 13143884257 |
| 41462681769 attempt 1 | fc3dd885770cb18661e44880618eaa814e477a1d | 18c752a54a16128e99b65e549136d8364b3b6115 | All four profiles passed with native diagnostics | 13150711179 |

Original failure: https://github.com/ninja-ops-guy/techops-hero/actions/runs/41450347383/attempts/1
Unchanged rerun: https://github.com/ninja-ops-guy/techops-hero/actions/runs/41450347383/attempts/2
Instrumented execution: https://github.com/ninja-ops-guy/techops-hero/actions/runs/41462681769

ZIP hashes, respectively:
- 2be911374c2755ae41d89c1481670a9fb3500d2980205d307d8f6dd70f016896
- 964ad9eaf6920ed985726cf7332556ff331d4311fae1cd94506c63687a012dd1
- bbd76478bf8c17b9a731ec8b544fedec18fe72da8cfd72747229c3e10afc275f

These are separate observations, not replacement results. GitHub currently lists artifact expiration on November 9; this report preserves identities and the decisive failure observations, not a permanent copy of every screenshot or ZIP.

## Original failure and event ordering

Desktop WebKit 26.0, viewport 1280×800, non-touch, completed six steps: launch; actual input/simulation movement; midnight clock isolation; day-render/input isolation; standalone menu isolation; cinematic Pause/Resume/Tab/Skip controls.

Failure string:
```
page.waitForFunction: Timeout 15000ms exceeded.
    at run (/home/runner/work/techops-hero/techops-hero/scripts/night_lifecycle_browser.mjs:153:152)
    at async file:///home/runner/work/techops-hero/techops-hero/scripts/night_lifecycle_browser.mjs:182:93
```

Retained events (UTC):
- 13:11:14.814 — page-crash, phase "standalone return-to-title reload".
- 13:11:14.824 — page-close, phase "test cleanup".
- 13:11:14.906 — browser-disconnected, phase "test cleanup".

JavaScript errors: []; failed first-party requests: []. State/startup evaluation could not access the renderer: "page.evaluate: Target crashed".

The stack points to the post-navigation bootstrap/title readiness wait. In the source sequence, the navigation promise is armed before the Skip click; the code awaits DOMContentLoaded navigation before this readiness assertion. Thus the evidence places the failure in the reload/startup interval, not an unarmed navigation wait. It does not identify an exact native fault instruction or prove whether the page crash preceded the readiness timeout internally. Page close/disconnect occurred during deliberate finally/browser.close cleanup and cannot be treated as proof of a spontaneous whole-browser exit.

Browser acceptance ran 13:09:34–13:11:38; the job completed normally as failed at 13:11:43, well before its deadline. No evidence identifies the outer timeout as the killer. Absence of pageerror/requestfailed does not exclude application-triggered native failure or incomplete bootstrap.

## Source review

Read runtime_night.js, night_hooks.js, v737_hooks.js, v725_hooks.js, production_bootstrap.js and the acceptance/diagnostic runners at fc3dd885.

The home path calls sleep → playTransition → exitNight(true). Transition completion has a completed-token guard and state/world identity checks. The runtime exit wrapper gates duplicate settlement with exitCommitted and records checkpoint completion before delegation. night_hooks.js clears Night state, restores the shell, writes the standalone result, clears launch selection and schedules location.reload after 120 ms. The v737 wrapper checks character selection before reentry; the runtime clears that selection first. These observations do not establish a duplicate-reload or reentry defect.

The harness holds the cinematic paused while arming navigation, then clicks the existing Skip control and awaits the original 15-second readiness condition. No timeout, retry, rendering or input workaround is justified by this investigation.

The three artifacts retain identical hashes:
- runtime_night.js: 474de014a5a3673306a95a07f586a29acb8e6a4baa2665fb82b3d20778f16a24
- scripts/night_lifecycle_browser.mjs: d351b0f18ea892c185a81656f5d9f9fe9661c7318130e1a6e7ea2a62b709b7b7
- production_bootstrap.js: 374b71ea27e00f75d09e6333a72630002ca25a8e473a4981d5baae31e343815e

The GitHub head comparison changes only the diagnostic workflow, wrapper, diagnostic tests and release-gate registration. It contains no application correction. Diagnostic wrapper hash: 1ff93c1065757fd3dae5b0b3189ace48d2556440115b4c1c919746caf77dafd2.

## Platform and native observations

All three job logs identify Ubuntu 24.04.5, runner image 20261025.353.1, provisioner 20261021.618, Node v22.23.4 and Playwright WebKit build v2203 (26.0). A broad OS/browser version mismatch is not supported. Identical image labels do not prove identical transient resource conditions.

Successful diagnostic run:
- Linux 7.0.0-1017-azure, x64; libc 2.39-0ubuntu8.9; GLib 2.80.0-6ubuntu3.10; GTK 3.24.41-4ubuntu1.3; GStreamer core 1.24.2-1ubuntu0.1.
- Four launched browser parent processes exited code 0, signal null, following graceful-close requests. These are not individual content-process termination receipts.
- Wrapper child exit code 0, signal null.
- 106 resource samples; all sampled inherited-cgroup memory-event counters zero.
- Maximum sampled inherited-cgroup memory.current: 4,531,142,656 bytes. This is broader than browser-only usage.
- Maximum summed sampled browser-descendant RSS: 1,282,592 KiB. RSS summation may double-count shared pages.
- Maximum sampled WPEWebProcess RSS: 1,064,732 KiB (~1.02 GiB), across the successful suite.
- Minimum sampled /dev/shm available: 8,379,863,040 bytes.
- Crash metadata explicitly not requested because acceptance succeeded.

Memory use merits observing on a failure, but these samples do not establish a leak or explain the earlier crash. One-second sampling can miss short peaks or short-lived children. No native stderr, termination signal/stack, or corresponding process/cgroup samples exist in the original failing artifact. Its passing rerun also lacks the later process-diagnostics files. Headless graphics/audio warnings and Firefox shutdown warnings in the successful native log are not causal evidence for the prior WebKit failure.

## Classification and next discriminating evidence

Strongest supported classification: **intermittent native WebKit page/renderer failure during standalone reload/startup, observed on Linux desktop emulation; cause undetermined**.

- Application defect: possible trigger, but no reproducible faulty application sequence established.
- Browser defect: plausible given the page-crash event and observed engine specificity, but no native stack or minimized reproducer proves an upstream WebKit defect.
- Environment/resource failure: possible, but original OOM/signal evidence is absent. The later no-OOM result cannot exonerate the failing environment.
- Simple navigation-listener race, JavaScript exception, failed-script request, or outer deadline termination: not supported by retained observations.

Local preflight found Playwright 1.62.1 expecting webkit-2336, with its executable absent; matching webkit-2203 is unavailable. No comparable browser reproduction was executed here. No hosted rerun or retry-until-pass was launched. This is an evidence/source investigation, not new execution qualification.

Next supported execution should use exact fc3dd885 or its recorded tested merge on Ubuntu 24.04 with the locked Playwright/browser build:
```sh
NIGHT_BROWSERS=webkit NIGHT_REPORT_DIR=artifacts/night-webkit-focused timeout 480s node scripts/night_lifecycle_diagnostics.mjs
```
Run once, preserve either result, and stop on failure. A desktop-only run isolates this path but does not replace the full four-profile gate or preserve its preceding-browser environment.

On recurrence, correlate page-crash timestamp with observed WPE content PID, signal/native stack or explicit unavailable reason, browser-parent exit, cgroup memory-event deltas, RSS and shared-memory observations. Preserve source hashes, commit/tree, runner/library versions and the failed report. The current wrapper can query only observed content PIDs; a process missed between samples may have no crash metadata.

To distinguish startup stall from crash onset, an additional diagnostic-only capture would need timestamped main-frame navigation/DOMContentLoaded/load and bootstrap milestones, plus reload-request count. Native metadata and a minimized failing path should precede a browser-specific workaround. If an application defect becomes reproducible, add a regression that fails on the unchanged candidate and passes with a targeted correction.

Acceptance thresholds and gameplay remain unchanged. Physical-device certification under issue #81 remains separate and is not established by these emulated browser results.

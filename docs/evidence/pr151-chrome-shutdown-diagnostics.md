# PR 151 Chrome shutdown investigation and diagnostic patch

Base: `9db1e42b8868a99e94e4f63bda8a8c5351c373ca` (PR 151).
Scope: observe shutdown and provide a blank-page reproduction. This patch does
not establish or fix the native shutdown cause.

## Verified original evidence

| Property | Night combat integration | Merge Gate browser acceptance |
| --- | --- | --- |
| Run | 45016104228 | 45016104244 |
| Job | 137188637526 | 137188637578 |
| Exact checkout | 9db1e42b8868a99e94e4f63bda8a8c5351c373ca | Same |
| OS | Ubuntu 24.04.5 | macOS 15.8.2, ARM64 |
| Node / Playwright | 22.23.5 / 1.55.1 | Same |
| Chromium selection | Bundled Chromium 140.0.7339.186, default headless shell | Installed Chrome 158.0.8127.37, channel chrome |
| Desktop browser close | About 33 ms | Exceeded 10,000 ms |
| Later profiles | Chromium touch and WebKit touch passed | Never launched |

Sources:
- https://github.com/ninja-ops-guy/techops-hero/actions/runs/45016104228/job/137188637526
- https://github.com/ninja-ops-guy/techops-hero/actions/runs/45016104244/job/137188637578
- https://github.com/ninja-ops-guy/techops-hero/actions/runs/45016104244/artifacts/14752018383

The downloaded artifact SHA-256 matched the upload log:
`2d93b388e7686ed03a6da1a78afe6d1922627b8dd1ec15c692ee140772893c23`.
The artifact's tested-commit.txt identifies the exact checkout above.

Desktop gameplay ended at 23.632 seconds; evidence capture ended at 25.488
seconds without capture errors. Context closure took about 58 ms. Browser closure
then timed out after about 10.005 seconds. The persisted result was false and
Node exited 1. No page exception was recorded. The trace stopped before cleanup.
The earlier passing Night Lifecycle step ignores BOT_CHROMIUM_CHANNEL, so it
cannot establish successful Chrome 158 cleanup.

Playwright 1.55.1 sends Browser.close over its default pipe transport, waits for
child-process closure and temporary-directory cleanup, and has a 30-second
close-or-kill fallback. The harness's 10-second deadline preempts that fallback.
Reference implementation:
- https://github.com/microsoft/playwright/blob/v1.55.1/packages/playwright-core/src/server/browserType.ts
- https://github.com/microsoft/playwright/blob/v1.55.1/packages/playwright-core/src/server/utils/processLauncher.ts
- https://github.com/microsoft/playwright/blob/v1.55.1/packages/playwright-core/src/server/chromium/chromium.ts

The original evidence does not identify whether Chrome remained alive, child
pipes remained open, transport disconnected late, or temporary cleanup stalled.
The large browser-version gap and differing headless implementation are
investigation targets, not demonstrated causes. The orphan GoogleUpdater noted
by runner cleanup is not sufficient evidence of causation.

## Changes

- Each profile's night-combat.json record gains shutdown metadata: Node,
  Playwright, OS/kernel version, runner image, architecture, Node PID, and explicit launch selections.
  A null executablePath means selection was delegated to Playwright; the
  pw:browser launch line supplies the resolved executable and browser PID.
- Record connection state, context count, and owned processes before context
  close, after context close, and after browser close succeeds or times out.
- Process queries have a 200 ms deadline and 1 MiB input cap; each snapshot
  retains at most 64 rows. No argv or environment is collected. Earlier browser
  PIDs and distinct process groups remain eligible in later snapshots, with
  provenance labels, to help locate reparented helpers. These are observations,
  not authority to signal processes; PID reuse remains a possible limitation.
- Record disconnected events. Observation errors remain failures and cannot
  replace an earlier gameplay error or skip either owned cleanup operation.
- Merge Gate's Night combat step enables pw:browser and tees combined output to
  night-combat-browser.log. Existing pipefail preserves both browser/harness
  failure and log-write failure. The pipeline waits for the log writer.
- The blank-page probe uses the same launch selection and 10-second close
  helper, optionally captures a trace, and persists shutdown-repro.json before
  exiting 1 on a cleanup timeout.

The context/browser close deadline remains 10 seconds; the suite timeout remains
300 seconds. Launch arguments, browser dependencies, browser channels, gameplay,
acceptance checks, and next-profile stopping behavior are unchanged.

## Focused reproduction, pending separate execution approval

Use the same macOS runner image as the failing gate and npm ci from the exact
revision being evaluated. The examples assume the portable timeout command is
available, as installed by Merge Gate. Each case gets a separate output path.
No game server is needed for the blank-page probe.

```bash
set -euo pipefail
mkdir -p /tmp/night-shutdown-chrome-plain
BOT_CHROMIUM_CHANNEL=chrome \
BOT_OUT_DIR=/tmp/night-shutdown-chrome-plain \
DEBUG=pw:browser \
timeout 60s node scripts/night_shutdown_repro.mjs 2>&1 \
  | tee /tmp/night-shutdown-chrome-plain/browser.log
```

Run a separate case with SHUTDOWN_TRACE=1 and a new output directory. Then
compare the same plain/trace cases with BOT_CHROMIUM_CHANNEL and
BOT_CHROMIUM_EXECUTABLE unset (bundled headless shell). An additional
BOT_CHROMIUM_CHANNEL=chromium case uses bundled full Chromium headless, helping
separate headless-shell behavior from the browser-version/channel difference.
For protocol-level evidence, use DEBUG=pw:browser,pw:protocol on the blank-page
probe; protocol logging is intentionally not enabled for the full gameplay gate.

For the full production-page comparison, start the existing exact-commit server
and invoke scripts/night_combat_bot.mjs with NIGHT_COMBAT_BROWSERS=chromium,
BOT_CHROMIUM_CHANNEL=chrome, DEBUG=pw:browser and a separate BOT_OUT_DIR. Compare
isolated execution against execution after the preceding Merge Gate suites.
Preserve every individual result; do not retry a failure into acceptance.

Interpretation:
- Close starts, launch PID remains alive at the deadline: native browser shutdown
  has not completed. Inspect stderr and an approved macOS stack sample next.
- Launch PID disappears but observed helpers/groups remain: investigate inherited
  pipes and process cleanup; ancestry observations alone do not prove open FDs.
- Process closure is logged, directory cleanup never finishes: investigate runner
  filesystem cleanup and Playwright's cleanup wait.
- Native cleanup completes but the promise/disconnection does not: inspect the
  Playwright transport/client boundary.

## Local validation

- 82 focused Node tests pass, including unresolved context/browser close,
  persistence before exit, no next-profile launch, primary-error preservation,
  diagnostic failure isolation, process-group retention and blank-page teardown.
- Full production gate passes: 121 suites, syntax checks across 623 files,
  and action-atlas quarantine. git diff --check passes. The shell logging
  pipeline was also checked to preserve a nonzero harness exit.
- The Linux blank-page browser attempt failed during launch: Chrome reported
  socket() failed: Operation not permitted. It persisted a failed report and
  emitted launch/termination logs. This is an environment restriction, not a
  reproduction or resolution of the macOS shutdown failure.
- macOS native reproduction and hosted workflow execution remain unperformed.

The patch is prepared locally. Publishing would potentially trigger consequential
workflows and requires separate owner approval; no merge or deployment is implied.

# TechOps Hero — R1 Performance Evidence

The deterministic production gate enforces structural ceilings. It does **not** prove real startup, input latency, sustained frame pacing, mobile memory, or thermals.

## Desktop collector

Run from a clean candidate checkout:

```bash
node scripts/performance_profile_browser.mjs
```

By default the collector starts the repository media server, launches a fresh Chromium context, records cold title readiness, starts an ordinary Day run through real UI controls, measures seven real keyboard movement responses, samples frame pacing, reloads for a warm-start measurement, and records first-party page/resource failures.

Output defaults to `/tmp/techops-performance-evidence`:

- `desktop-chromium-measurements.json` — raw measurements and limitations.
- `desktop-chromium-performance-report.json` — R1 evidence-envelope check for `performance_budget / desktop-chromium`.

The report is source-bound through full HEAD/tree/fingerprint and retains the measurement artifact SHA-256.

## What it can certify

After the R1 release assessor lands, the retained report can satisfy the **desktop-chromium** performance profile only when its observations meet the declared release budget. Collection success is not automatically budget success; the release assessor owns that decision.

## What it cannot certify

This collector is deliberately marked `physical_device:false`.

It cannot certify:

- iPhone Safari performance;
- Android Chrome performance;
- mobile memory pressure;
- thermal behavior;
- physical touch latency;
- 30-minute device soak stability.

Those require the physical-device evidence lanes defined by the R1 release contract. Emulated viewports must never be relabeled as phone evidence.

## Useful environment variables

- `PERF_BASE_URL` — profile an already-running immutable candidate instead of starting the local server.
- `PERF_OUT_DIR` — retained evidence directory.
- `PERF_OPERATOR` — evidence producer label.
- `PERF_DEVICE` — actual desktop runner identifier.
- `BOT_CHROMIUM_EXECUTABLE` — optional explicit Chromium binary.

When profiling a release candidate, preserve the output alongside the rest of that candidate's evidence bundle.

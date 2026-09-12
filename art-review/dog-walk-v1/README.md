# Dog walk generation review — not runtime approved

The user approved eight walk poses per dog (16 total) under `ART_GAPS_APPROVAL_BRIEF.md`. These were generated with the built-in image generation tool using the existing Katrin and Manchez atlases as identity references. The exact four prompts, including targeted corrections, are in `prompts.json`.

**Decision: QUARANTINED. Do not bind these frames to the game's walk state or claim the walk backlog is complete.** No production script, runtime atlas or combat/animation authority changed in this follow-up.

## Review findings

| Requirement | Finding |
| --- | --- |
| Identity | Katrin retains the black beanie, black clothing and blue pendant. Manchez retains the brown ushanka, blue hat badge, camouflage and orange pendant. |
| Eight distinct images each | Yes; 16 separate review derivatives are provided. Distinct pixels do not prove distinct valid gait phases. |
| Alternating support and passing | Fail. Katrin's hind legs remain substantially fixed across much of the cycle; forepaw reach/lift repeats without continuous rear-leg transfer. Manchez has more hind-leg variation, but support order and contact timing are uneven. |
| Body and foot stability | Requires correction. Fixed per-row source anchors and one scale per actor expose residual head/body drift; per-frame resizing was deliberately avoided. Foot sliding against world speed is not certified. |
| Transparency | The retained sources have actual alpha. The first Manchez output baked in a checkerboard; a targeted background edit corrected that. Fine edge fringes and low-alpha speckling remain and need cleanup. |
| Targeted gait correction | A second Katrin attempt still held the rear legs nearly fixed for much of the cycle and introduced a baked checkerboard. It was rejected, not substituted into the review set. |
| Runtime integration | Not approved. Existing walk fallback remains active; no footstep/contact markers have been invented. |
| Browser review | All 16 extracted frames decode in local Chromium 140.0.7339.186; eight native/2× dark/light canvases render, the frame-step control works, and there are no page errors. This is a viewer check, not a gait or cross-browser release certificate. |

## Files and reproduction

- `source/katrin-v1.png`: original alpha-bearing Katrin candidate.
- `source/manchez-alpha-v2.png`: Manchez candidate after the alpha correction.
- `frames/`: eight 160×128 PNGs per dog, for review only.
- `kat-review.png`, `man-review.png`: four-by-two review atlases.
- `manifest.json`: SHA-256 source/derivative hashes, exact reviewed crop rectangles, source anchors, uniform actor scales and logical foot pivot (80,124). `runtimeApproved` is false and contact events are empty.
- `index.html`: playback, pause, step, speed control, native/2× dark/light comparisons and numbered frame strips.
- `build.cjs`: deterministic nearest-neighbor crop/scale/padding only. It preserves alpha and never writes to `assets/handoff`. Requires `sharp` in the authoring environment; run `node art-review/dog-walk-v1/build.cjs` from the repository.

Serve the repository with `python3 scripts/media_http_server.py --port 8788 --bind 127.0.0.1`, then open `http://127.0.0.1:8788/art-review/dog-walk-v1/`. No generation service is involved in playback or extraction.

## Required correction before acceptance

Use the existing identity references and these candidates as visual references, then author the four limb tracks explicitly: near/far foreleg and near/far hindleg. Review the full eight-frame loop, especially frames 4→5 and 8→1, with a fixed torso and a moving ground reference. Correct contact ordering, hind-leg transfer, body drift and edge fringes. Only after that review should contact events be marked and the cycle tested in Chrome/WebKit at actual in-game walk speed. Generation approval does not waive this gate.

The previous production-code head `6394fe54a61d0a76c45711d7e2fee24cecf73e3a` passed the seven macOS Chrome/WebKit runtime gates. Those results apply to the existing runtime, not to these unbound candidates. Editable DCC scenes, other animation states and physical-device testing remain outside this 16-pose task.

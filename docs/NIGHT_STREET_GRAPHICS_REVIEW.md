# Night street graphics review — November 22, 2026

Baseline: main `3f8e59cc1b8f4b6f2bc32f3bc2eab32d81f36f66`.

## Findings and implementation

The live Downtown opening has a detailed painted neighborhood behind an almost
uniform asphalt plane and solid blue platform rectangles. This contrast makes
the playable layer look unfinished. This pass improves that layer for Downtown,
Wooster Square, Airport Road and Suburbs:

- World-anchored asphalt aggregate, tar seams and sparse broken reflections.
- A curb/contact edge, inset drain grates, worn lane markings and darker foreground.
- Metal service platforms with tread slots, edge highlights, fasteners and slim
  structural supports ending at the existing ground plane.
- District-colored reflections without flicker, blur or additional image assets.

The existing scene-art authority draws the new layers through the existing game
renderer. Ground rendering now asks that authority even when an older painted
backdrop owns the architecture. Ordinary legacy fallback remains available.
No new frame loop, renderer wrapper, event listener, dependency, download,
collision, combat or save-state changes. All added rendering is static and works
with reduced motion. Platform top edges remain at their actual collision y.

Authored Industrial/Long Wharf plates, Home/Waldo property alignment, Good Dogs,
Sector 04 and Night Walker campaign stages retain their layer ownership. No siege
branch was incorporated; its PR #153/#154 integration remains separate.

## Remaining graphics priorities

| Priority | Area | Evidence and next work |
| --- | --- | --- |
| Next | Character locomotion/start-stop/landings | Existing `ART_GAPS_APPROVAL_BRIEF.md` records missing reviewed poses and quarantined dog walk candidates. Requires source art review; do not relabel standing or attack frames as a walk. |
| Next | Siege environment/ship art | Open #154 explicitly identifies its current presentation as a code-art blockout. Review final terrain, ships and actor readability after the scenario integration choice. |
| Later | Cinematic/gameplay transitions and layered depth | Existing art brief calls for matched compositions and editable separated scene layers for M3/Sector 04. A single raster replacement does not satisfy those deliverables. |
| Qualification | Physical phone graphics/performance | Browser portrait inspection cannot certify native Safari, multitouch or sustained device performance. |

## Validation

- Full `npm test`: production gate PASS, including 121 registered suites and
  syntax checks for 618 JavaScript files.
- New `test_night_street_art.js`: 48 combinations of district, viewport width and
  camera; simulation immutability, canvas style restoration, world anchoring,
  scene isolation, platform/floor registration and viewport-bounded work.
- Existing visual-combat assets, Night runtime assets and compositor checks pass.
- Browser: real Night Crawler entry and resumed Downtown gameplay inspected
  before/after via normal mode/menu controls. This is local browser evidence,
  not hosted CI or earned full-campaign/device qualification.
- Portrait: resumed real Downtown gameplay in a 390 × 844 CSS-pixel iframe;
  inspected ground registration, actor visibility and platform composition.
  This checks responsive framing only, not native touch or iPhone Safari.

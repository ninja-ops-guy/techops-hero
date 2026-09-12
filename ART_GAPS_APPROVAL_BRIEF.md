# Art gaps requiring source work

This is a specification, not authorization to generate. The supplied archive has already been inspected and its usable poses integrated. No new generation is needed for the committed graphics pass. The following gaps prevent certifying the full animation and 3D backlog.

## First proposed art task: two grounded walk cycles

Produce eight distinct side-view walk poses for Katrin and eight for Manchez, using the supplied locomotion sheets and the integrated `assets/handoff/kat.png` and `man.png` as identity references. Preserve Katrin's black beanie and blue pendant; preserve Manchez's brown ushanka, camouflage clothing and orange details. Printed candidate-sheet labels do not override those identity references.

The cycle must show alternating support legs, contact, weight transfer and passing poses. Repeated standing poses, mirrored duplicates, running poses and attack poses do not satisfy walking. Keep a fixed side-view camera, consistent limb lengths, clothing, palette and lighting. Supply real transparency with no baked checkerboard, lettering, grid, shadows extending into neighboring cells or motion blur.

Runtime derivatives use 160 × 128 logical cells, a foot anchor at (80,124), and approximately 90-pixel standing height, matching the existing atlas. Source art can be larger but must preserve that scale and anchor after deterministic extraction. Every pose needs its own reviewed source rectangle; a visual grid alone is not a crop contract.

Acceptance requires dark/light background playback at native and 2× nearest-neighbor scale, continuous alternating contact, no foot sliding or body-size pumping, no clipped ears/tails/gear, and Chrome/WebKit decoding. The existing run and airborne dash remain separate states. Footstep events attach to reviewed contact frames, not an arbitrary timer.

Obtain user approval for this bounded 16-pose task before calling an image-generation tool. Review the result before replacing the current walk fallback; generation alone does not establish animation quality.

## Subsequent source tasks

| Gap | Required source | Acceptance |
|---|---|---|
| Start / stop | Separate weight-shift and braking poses for both dogs | Preserve control responsiveness and current collision; no relabeled attack frames |
| Landing | Light/heavy compression and recovery poses | Feet remain anchored; trigger once per contact; reduced motion supported |
| Mike dash | Anticipation, travel and recovery with Night identity locked to supplied Mike | Travel is not a punch; keep Day Shift art distinct |
| M3 / Sector 04 depth | Editable DCC scene, camera, lighting and separate far/back/mid/front layers | Match gameplay collision and horizon; retain readable sprite silhouettes; decode fallback |
| Cinematic handoff | Authored final-film and first-gameplay compositions | Match camera angle, landmark placement, palette and light direction |

A generated flat raster is not a Blender/DCC master or a depth-layer deliverable. Do not request a batch of 3D levels until M3, Sector 04 and one Night street pass the shared style comparison. Physical iPhone Safari and unassisted late-campaign play remain device/playtest work; artwork generation cannot complete them.

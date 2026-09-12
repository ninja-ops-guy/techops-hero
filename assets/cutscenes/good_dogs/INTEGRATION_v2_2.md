# TechOps Hero — Good Dogs Cutscene Integration v2.2

## Status
The MP4s in this package are the actual campaign footage with an offline retro-pixel treatment.
No images were regenerated.

## Recommended repository paths
- `assets/cutscenes/good_dogs/*.mp4`
- `good_dogs_cutscenes_v2_2.js`

Load the JS after the main game/campaign state scripts.

## Trigger calls
```js
await GoodDogsCutscenes.play("GD_CUT_02"); // after center-pilot interaction, before Good Ship Prison Run
await GoodDogsCutscenes.play("GD_CUT_04"); // after traversal setup; lands on Cell 118 terminal
await GoodDogsCutscenes.play("GD_CUT_05"); // K reveal
await GoodDogsCutscenes.play("GD_CUT_06"); // after K/Mike Index resolution
await GoodDogsCutscenes.play("GD_CUT_07"); // before Hold the Door
await GoodDogsCutscenes.play("GD_CUT_08"); // after Waldo freed
```

### Cell 118 cohesion
Do not insert a second Cell 118 establishing shot between GD_CUT_04 and GD_CUT_05.
GD_CUT_04 already finishes on the MIKE OLIVEFIELD terminal; cut/glitch directly into the K reveal.

## Pixel treatment
Each video is reduced to roughly one quarter resolution in each dimension and returned to its
native dimensions with nearest-neighbor scaling. This makes real motion read like chunky
game pixels without changing scene content or audio.

## Runtime safety
- skip button and Escape/Enter support
- media error auto-skips rather than soft-locking progression
- saves `S.meta.goodDogsCutscenes[id]` when `window.S` exists
- mobile `playsinline`
- no silent character-art fallback because these are fixed pre-rendered clips
- the opening no longer plays `GD_CUT_03`; crash is owned by `09_prison_crash_selected_pixel.mp4`

## Live repo note
This package is prepared for direct integration, but the GitHub connector was unavailable during
this pass, so no claim is made that these files have already been committed to the repository.

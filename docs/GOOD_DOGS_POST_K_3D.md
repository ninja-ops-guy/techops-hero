# After 118 — playable Access Core level

This level starts after K has been freed from Cell 118. It uses the previously authored Katrin, Manchez and K GLBs, dark industrial metal, amber lighting and green route-control accents.

## Canon and entry

The current authority is `PRODUCTION_BASELINE_v1.2.md`, with `cinematic_systems.js`, `good_boys_access_core_authority.js` and `good_boys_progression_authority.js` defining the shipped M5 contract. The older v1.1 corridor notes are not permission to omit the Mike Index.

1. K is already freed; the Cell 118 rescue is not replayed.
2. Defeat the Mike Index, a recorded-behavior containment projection. It is not Mike and does not read future input.
3. Clear the route security seeded by the existing Access Core authority.
4. Escort K to the Access Node and explicitly USE it in range.
5. Hand off to the existing Cell 1984 mission. Waldo remains imprisoned until that mission's release defense.

## Play the isolated level

From the repository root, run `python -m http.server 8080`, then open:

`http://localhost:8080/assets/good-dogs-3d/`

The review entry begins immediately after K's release. It has movement, triple jump, dash, strike, block, dog switching, partner AI, independent local P2 movement/strike, nearby revival, pause, retry, SFX, checkpoints and a final Route 1984 regroup. The keyboard bindings are shown on the start card. Touch buttons support held movement and clear on release/cancel/blur. Local P2 uses a keyboard: I/K move, T jump, R strike, U revive. This review does not implement network co-op.

The standalone checkpoint key is `techops.gooddogs.m5.review.v1`. It does not read or overwrite the main game save. A completed checkpoint resumes at the completion card; a dead checkpoint requires a retry. Browser storage failures are reported. The standalone harness deliberately contains simpler combat providers than the full game; it is not loaded by the production bootstrap.

## Production connection

`good_dogs_3d_presentation.js` is loaded once by the existing production bootstrap. The existing stable compositor calls its `draw()` directly; no wrapper or second animation loop is installed. It claims the frame only when both mission mirrors equal 5, K's rescue is present, the current Night world is active, and there is no blocking cinematic/dialogue/game-over state.

On asset loading, WebGL failure or context loss, the compositor continues through its existing native draw path. Other missions and Day Shift retain their renderer. The immutable native simulation, paired combat resolver, inputs, progression authority and soundtrack remain in control. The 3D layer does not write story flags, move authoritative actors, resolve damage or restart music. Its projectile visuals consume the existing pair's shot objects.

Production uses the native M5 completion/handoff timing after the Access Node; the standalone review adds an explicit walk to the Route 1984 door as its final inspection beat. It does not load M6 itself or mark Waldo rescued.

The world projects the native side-scroller's coordinates into a 3D corridor at 60 pixels per metre. Gameplay remains on the native traversal axis. This is a 3D presentation of the existing simulation, not an unrestricted first-person movement engine. The review's K observation camera does not transfer gameplay control to K. The retro button displays a pixelated orthographic version of the 3D scene; the main game's original sprite renderer remains its own renderer.

## Validation

- Six focused tests cover M5-only eligibility, blocked/modal states, Index/security/node gates, retry and checkpoint integrity, pause and past-only prediction, single compositor ownership, independent P2 motion and revival.
- Existing Access Core sequence, compositor, Good Dogs compositor ownership, completion ownership and combat separation tests pass.
- A Chromium software-WebGL playthrough used keyboard movement, strikes, dodge and USE to complete the level. It did not edit enemy HP or force progression. Early USE failed, the Index and security were defeated, the node was seized, the door required regrouping, and completion survived reload.
- The narrow-screen check exercised held pointer movement, independent P2 input, blur-to-pause, and restoring the co-op selection after reload.
- The completed run took about 46 seconds of simulated gameplay; this is not a device performance measurement.
- Real rendered screenshots and the browser report are in `docs/qa-good-dogs-3d/`. Desktop, retro cutaway, K observation and narrow-screen layouts were inspected. The narrow viewport has no horizontal overflow.

Run the focused tests with `node --test test_good_dogs_3d.mjs`. The portable browser script is `node scripts/check_good_dogs_3d.cjs` after installing the repository's Playwright dependency and Chromium browser.

The full deployed campaign has not been crawled on this branch, and physical iPhone/WebKit performance is not certified. This remains the accepted stylized prototype look, not photoreal cutscene reconstruction. The rigid prototype skin weights, fur geometry, simplified guards/Index projection and absence of production attack clips need a later art/optimization pass.

## Asset provenance

The GLBs come from `techops-hero-coop-3d-prototype.zip`, authored from the supplied prison references. Model identities and hashes are in `assets/good-dogs-3d/asset-manifest.json`. They retain the original 17-bone prototype rigs and material groups. Three.js 0.186.0 and its loader utilities are vendored with their MIT license. No runtime CDN or paid generation service is needed to open this level.

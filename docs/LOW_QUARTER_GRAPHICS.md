> **Style revision in progress:** This branch replaces the earlier hand-drawn character silhouettes and five procedural backdrops with a reference-led sprite and environment candidate. The old implementation notes below describe PR #161 and are historical for this branch. `docs/graphics/nightwalker-style-review.json` records the new sources and review status. K Terminal band art is the creator-designated style reference. Iona uses the located Nightwalker sheet; K uses a separate duo reference and newly generated walking frames. Supporting roles and variants, five backgrounds, interaction props and the independently positioned ship are newly generated review candidates. Their final visual acceptance, animation coverage, native-device performance, physical interaction registration, and wider Night Walker audit remain open. No gameplay authority changed.

# Low Quarter opening graphics

Graphics candidate for **First Warning / Hold the Service Road**, November 22, 2026. Stacked on PR #153 at `ab280596585f324ed36aad8314b97925a7dc27f1`. This changes the opening's presentation; it does not reconcile or replace PR #154's separate response-area mission. No merge/deployment approval is implied.

## What changed

The repeated rectangle streets and block figures are replaced with hand-authored Canvas pixel graphics. Each sector has its own skyline, masonry, windows, service architecture, civic lighting and foreground dressing: freight approach and gantry, service exchange and power cabinets, shelter courtyard and care canopy, departure road and controlled transport lane, and receiving yard with independent care shelter.

K and Iona have distinct pixel silhouettes, costumes and idle/walk/work/strike poses. The renderer follows actual movement direction and uses current K clear glasses, beanie, beard, headphones and sleeve patch; Iona retains short black hair, ear jewellery and dark practical workwear. Military helmets/vests, robot silhouette, civilian outfit variants, medical identification and infected damage detail distinguish roles without relying solely on color. A team glyph represents its authored team; no new individual defenders or strength values are inferred.

The ship has a damaged industrial silhouette and bounded infestation detail; the evacuation vehicle has windows, doors, wheels and an unmistakably separate civic silhouette. Nearby devices have distinct watch optics, dispatch boards, power/radio cabinets, ventilation, mechanical levers and care equipment. Verified interactions and occupied posts have restrained cues. Damage flashes follow actual HP reduction; no hitbox, attack timing or damage value is changed. Drawing issues no mission receipts.

The portrait camera uses a 600×420 logical view instead of shrinking the entire 960×420 field. Desktop retains 960×420. Both keep aspect ratio; this is camera framing only, not a change to world coordinates or travel time. Only the current nearby person/device receives a canvas label. The accessible DOM still supplies full objectives, actions and status; debug identifiers are removed from floating scene labels. Review CSS provides larger touch controls, focus rings and clearer task/route/interaction hierarchy. Short landscape uses a fixed viewport grid: scene and controls remain visible together while mission actions scroll in a separate side pane. Small canvas text is secondary; full objectives/actions stay in accessible DOM text. Work text uses the authored action name and the status shows a readable local clock.

## Sources and authority

`docs/graphics/low-quarter-scene-manifest.json` pins the actual inspected reference hashes and scope. Original Iona and K reference images and the prior Iona/Mara relay page were recovered and inspected; the latter guides Iona only, not a new Mara appearance. The older K game atlas was inspected but its dark lenses were not carried into this new rendering. The current clear-glasses correction overrides the older tinted reference. Old warm workwear colors do not override Iona's later dark-jacket instruction.

These are authored pixel renditions, not generated-image candidates or repainted source files. No new reference-image approval, definitive model sheet or production-generation-gate pass is claimed. **Creator acceptance of the new likenesses remains open.** Source photos/pages are not copied into the public repository; the manifest retains their filenames, hashes and bounded use. New pixel output must not silently replace the original identity anchors for later work.

This stays in the approved game's objective parallel-realm register. It adds no population count, named loss, memory access, equipment power, venue history or comic revision. `campaign_low_quarter_operation.js`, `campaign_low_quarter.js` and `campaign_chorus_siege.js` are unchanged; their exact protected hashes are pinned in the manifest.

## Runtime ownership and rendering cost

The renderer is read-only. Cached sector backgrounds are created once per sector, with no external art download, private timer, new heartbeat, storage key or simulation mutation. Cosmetic state is scoped to the run and resets on run changes; reduced motion suppresses nonessential fan/impact effects. Paused simulation time also pauses the poses. The new CSS is loaded only by the explicit opening review entrypoint.

One startup guard clamps a negative animation-frame delta to zero. A RAF callback's frame timestamp may precede the `performance.now()` taken during the launch click; the previous code could then reject the opening before play. The 320px browser fixture deliberately exercises an earlier frame timestamp. The maximum normal delta remains 50ms; authored mission schedules, collision, movement speed and combat parameters are unchanged.

## Verification

- `node test_low_quarter_graphics.js`: 40 frozen-state combinations of sector, viewport and reduced motion; drawing preserves the entire input state. Includes background reuse, deterministic rendering and CSS isolation checks.
- `node scripts/low_quarter_graphics_browser.mjs`: 20 explicitly labeled **graphics-only fixtures** across all five spaces at 1280×900, 320×740, 390×844 and 844×390. Checks no horizontal overflow, 44px minimum action controls, simultaneous short-landscape scene/controls, zero page/runtime errors, real pointer-held movement in the landscape layout, state immutability, bounded mean draw cost and the startup RAF guard. Screenshots inspect art/layout; these fixtures do not claim campaign progress.
- The existing six natural-input opening playthroughs remain separate acceptance: three endings at desktop/touch sizes, actual repairs/commands/combat/receiving, save/reload and ordinary-save isolation.
- The 14 operation tests, existing 58 rescue cases, 22 siege tests and full production gate remain required. Source-bound CI retains CSS, renderer, runtime and harness hashes.

The local 20-fixture run's worst **mean** draw cost was 1.420ms per draw (120 repeated draws per fixture, this headless machine). This is not a percentile, physical-phone FPS, touch latency, GPU-memory guarantee or device-performance qualification.

## Release status

**Implemented graphics candidate / visual review required.** Original character references and current costume rules are bound to the manifest; new likeness acceptance, physical iPhone/native Safari/multitouch and measured device frame-time remain release qualifications. The operation is still a twelve-person opening review; its graphics do not qualify a full district census, later wave content or PR #154 integration. Merge and deployment remain separately owner-gated.


## Approved siege choreography follow-up

The review pass now binds two existing K action cells to observed scene context. K uses the authored reaching pose when a consenting resident is physically following nearby, and the authored guard pose when an infected is near the active freight breach. Movement, consent, boarding, health, unit status, receipts and rescue outcomes remain owned by the operation authority. K's pose selection is a read-only projection.

The infected two-frame walk now advances from logical operation time rather than world position. The six-cell civilian walk candidate is used only for residents already following; a deterministic resident-ID phase prevents nearby walkers from stepping in unison. Reduced motion holds both locomotion cycles at their first cell. The browser fixture samples K's rescue and brace cells, samples two distinct civilian walk frames, and checks that rendering does not mutate operation state.

The candidate still needs review for resident waiting, shelter and boarding transitions, human defender reactions, crowd spacing, care equipment, landmark alignment and physical iPhone/Safari. The new mapping is review art and does not grant likeness or release approval.

> Controls updated by PR #29. See [directional controls](NIGHT_DIRECTIONAL_COMBAT.md). Up is aim; Space/JUMP jumps in ordinary Night. The historical rhythm/grab implementation below is retained for context.

# Night Crawler: contextual street combat

The street fight now has contact, timing and recovery. This applies to normal Night Crawler streets, including Mike's after-work run. Good Dogs, Sector 04 and Waldo's peaceful property retain their existing authorities.

## Player vocabulary

| Input / context | Result |
| --- | --- |
| Attack (E, existing touch action or controller A) | Wind-up → contact → recovery; a miss gives no combo credit |
| Walk toward an enemy within grabbing distance + attack | Grab; release movement, then choose a throw |
| Left / right while holding a grab | Directional throw; the body can strike other enemies or a wall |
| Up while holding a grab | Upward launch; jump follows into an air attack |
| Attack again during a grab | Throw in the held direction, or the facing direction when neutral |
| Three spaced, connected attacks | Jab → cross → rising finisher |
| Jump + attack near an airborne enemy | Air hit with brief lift; the third air hit forces a slam |
| Block (K / existing control) | Existing guard and chip-damage rules |

The gold meter teaches a broad beat window of 260–500 ms between attack presses. First contact occurs after 70 ms; recovery lasts 230 ms total. A single input can buffer in the last 65 ms of recovery. Early buffered presses retain their original timing and do not earn a perfect beat. Damage occurs once at contact; wind-up and misses do not earn hits or money.

Player motion and enemy reactions share a maximum 50 ms simulation step on ordinary streets. Slow render frames therefore cannot advance the player's jump faster than the launched enemy. Knockback integrates its decay over that step, preserving the same total push distance at different frame rates. A regression runs the actual Night step at 16, 100 and 250 ms render intervals and confirms both the three-beat ground chain and up-throw air follow-up remain reachable.

Stun cancels enemy wind-up for 240 ms, or 360 ms on paced hits. A grab lasts at most 1.6 seconds, and being hit releases it. Grabs require a grounded, non-hovering target; content may set `grabbable: false`. The initial walking direction does not immediately throw: release it, choose another direction, or press attack again. Air juggles are capped at three hits per launch, with a landing/recovery boundary before another launch.

Throws deal 24 damage sideways or 16 upward. Each other enemy can take body-collision damage once per flight; wall impact is also bounded. KO cash is awarded exactly once through the contact resolver. Existing Pivot, Orbital Trace, Telemetry, Intercept and Relay augments resolve on actual hit frames.

## Presentation and ownership

`night_combat.js` is called directly from `night_hooks.js`; it adds no update loop or attack listener. `v733_hooks.js` delegates its legacy immediate-damage augment branch to this contact-based path. The production bootstrap loads the service before freezing the existing compositor.

The graphics use the existing Night Walker combat atlas and approved locomotion art. Existing guard, light-strike, kick and hit poses are staged with anticipation, recoil and recovery transforms; enemies visibly tumble during flight. Stun pips, damage numbers, KO text, impact rings and the timing meter provide feedback. The message panel clears the timing meter. Reduced-motion mode suppresses extra body rotation, shifting and floating feedback.

These are in-engine sequences built from existing key poses, not newly authored grab/throw sprite sheets. No images were generated and no unclassified action atlas was enabled.

## Evidence and limits

- `test_night_combat.js`: contact timing, no mash duplication, whiffs, three-beat chain, all throw directions, grab expiry, stun interruption, finite air juggles, collision cash, pause and campaign isolation.
- `scripts/night_combat_bot.mjs`: Chrome desktop and iPhone-emulated WebKit, real attack/direction keys against clearly labeled encounter fixtures; screenshots of grabs, launch, air hit and the rising finisher.
- The existing release gate and cross-browser campaign/runtime checks remain required. Physical controller, touch ergonomics and hardware frame pacing still require playtesting.

Initial tuning is intentionally centralized in `RULES`; playtest adjustments should preserve confirmed-hit rewards, finite control loss, and the no-infinite-juggle boundary.

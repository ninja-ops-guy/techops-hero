# EAST SIDE — The Missing Chapter

Implementation target: TechOps Hero v7.38+  
Canon position: **Good Dogs Protocol -> EAST SIDE -> Ghost Fork**

## Runtime

`east_side.js` is a stable campaign concern, not a numbered hook. It uses the existing `S.meta` / `S.story.facts` save authority and the existing global save function.

The level is a 6 x 2-screen New Haven walk controlled as K. There is no combat API and combat keys are consumed while the interlude is active. Grounded movement is deliberately faster than Orbital movement; neither state has a sprint path.

### Canonical writes

Completion writes:

- `S.story.facts.k_landed = true`
- `S.story.facts.ghost_fork_unlocked = true`
- `S.story.facts.eastside_completed = true`
- `S.story.facts.k_headphones = true`

The same named facts are mirrored into `S.meta` for compatibility with older runtime readers.

New saves cannot play the v7.34 `gk1`–`gk6` Ghost Fork cinematics until EAST SIDE completes. Existing saves that already contain any `_v734gk*` progress are grandfathered so the DLC does not invalidate active campaigns.

## Playable beats

1. Bus stop / trash bottle.
2. Convenience store / red security camera.
3. Underpass / ventilation and Cell 118 memory language.
4. Dog park / three grounding interactions, each recording an invisible `Ghost` inventory count.
5. Gas station / optional enter-versus-pass choice.
6. Waldo's street / forced Orbital phase, amber porch light, four-knock interaction and 45-second recognition timeline.

Seven static pickups add lyric fragments and progressively increase Orbital pressure. Collecting all seven records `eastside_full_static_unlocked` and exposes the Full Static entry in the MUSIC surface.

The Orbital meter is deliberately not exported as a player-facing API or HUD element. Phase is communicated through screen treatment and behavior.

## Unlock / entry

Good Dogs semantic completion unlocks the chapter. `bg_noc.js` loads EAST SIDE immediately after `good_dogs_campaign_state.js`, before the downstream Good Dogs progression layer.

The runtime:

- schedules automatic entry once Good Dogs is complete and no active cinematic/dialog owns the screen;
- also wraps the existing workstation MUSIC dialog with a persistent **Play / Resume / Replay EAST SIDE** entry;
- blocks only new Ghost Fork `gk1`–`gk6` cinematics while the bridge is incomplete.

## Audio contract

The runtime expects these authored files:

- `assets/audio/eastside/eastside_grounded.ogg`
- `assets/audio/eastside/eastside_orbital.ogg`
- `assets/audio/eastside/static_burst.wav`
- `assets/audio/eastside/breathing_mechanical.wav`

These files are **not fabricated by the implementation**. If they are absent, the level remains playable but authored music/ambient playback cannot be certified.

Grounded and Orbital music layers share the same playback timestamp. Phase changes cross-select volume instead of restarting the song. Trauma anchors duck the deck and play the static sting; grounding restores the active layer from the same timestamp.

`TechOpsEastSide.setRefrainTimes([...])` accepts the final authored lyric timestamps in milliseconds. `refrainDue(previousMs, currentMs, 50)` provides the ±50 ms contract used by the visual pulse. No fake production timestamps are checked into source before the final master is supplied.

## Art / rendering

The runtime reuses the established v7.34 painted New Haven district backdrops through `NM_BG734` where those images are loaded. It falls back to a purpose-built pixel city composition rather than borrowing orbital-prison art.

K uses the existing `K_STUDIO` / `TO_K_STUDIO` identity when available, with a conservative procedural silhouette fallback. Waldo's recognition scene uses the same established clean-shaven/beanie silhouette language as his existing social-district implementation.

## Quality gate

`test_east_side.js` is part of the aggregate production release gate and covers:

- Good Dogs prerequisite and Ghost Fork gating;
- legacy-save compatibility;
- all seven static pickups and Full Static unlock;
- Orbital phase buildup and forced trauma anchors;
- grounding actions and all three dogs;
- gas-station choice persistence;
- empty-bottle inventory persistence;
- save/reload phase and pickup state;
- final canonical state writes;
- deterministic 45-second recognition timeline;
- ±50 ms refrain-sync utility;
- absence of combat actions from the chapter API;
- exact authored audio asset names;
- 6 x 2 map dimensions.

## Remaining production evidence

Before calling the chapter fully content-complete:

1. Supply and audition the four authored audio files.
2. Bind the final EAST SIDE refrain timestamps from the mastered track.
3. Run full browser traversal on desktop and iPhone Safari, including save/reload mid-Orbital.
4. Review the automatic post-credits handoff against the final Good Dogs credit timing.
5. Capture creative-review notes for alienation versus frustration, gas-station temptation, and four-knock feel.

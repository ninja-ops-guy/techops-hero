# TechOps Hero — AAA gameplay / map pass

Base reviewed: main `31cdf77264d657e0a43c291b163e143546dd0325`.

This pass prioritizes player comprehension and tactile feedback over adding more raw content. The game already has 42 registered playable spaces, mission-specific Good Dogs geometry, Day objective waypoints, Night hit-stop/telegraphs, camera profiles, and confirmed-hit FX. The highest-value gap is making those systems communicate their intent consistently during actual play.

## Implemented in this branch

### Mission navigation ribbon

Good Dogs now receives a production-owned presentation ribbon derived directly from `TechOpsLevelRegistry`. It shows the canonical mission number/name, canonical objective, next registered landmark, relative distance in stage coordinates, and route progress. No second mission database is introduced.

Near interactive registered landmarks, a compact `A / E` interaction prompt appears. It is presentation-only and never performs the interaction for the player.

The existing Day waypoint system remains authoritative for Day Shift and is not duplicated. When the normal Day quest tracker is active, this module stays out of the way.

### Night Crawler encounter readability

Night Crawler now gets a compact district/street combat ribbon showing remaining hostile count and a clear post-combat instruction. It reads the existing enemy list; it does not change enemy health, spawn state, district progression, or clear conditions.

### Semantic combat feedback

The production Night combat service already emits semantic events after confirmed combat outcomes. This pass consumes those events for an additional presentation layer:

- light contact feedback for jab/cross/air hits;
- heavier feedback for launcher/throw/wall/collision/slam/KO;
- distinct guard and whiff audio signatures;
- short impact-edge flash;
- optional vibration where the browser supports it.

Feedback is triggered from confirmed semantic events, not button presses. It respects the existing SFX volume and shake/reduced-motion settings. The layer never writes HP, alive state, kills, combo authority, saves, or progression.

### Mobile / accessibility behavior

The objective ribbon is safe-area aware. Mobile action prompts sit above the existing touch-control region. Reduced-motion removes animated impact feedback and UI transitions. The presentation remains pointer-transparent so it cannot steal gameplay input.

## Map review findings

The map/level structure is substantially stronger than the old roadmap implies. Day Shift already has pathfinding waypoints and onward department doors. Good Dogs has authored landmark metadata for every M1–M8 mission, but that information previously lived mostly in registry/runtime/test surfaces rather than continuously helping the player navigate. This pass closes that presentation gap without changing collision geometry.

The next map-quality gains should come from authored environment completion rather than more navigation code: M4–M7 still rely on orbital generated/fallback presentation, while the production docs require final layered compositions and match-frame proof. Those are art-production tasks and should not be faked with mislabeled existing assets.

## Remaining highest-value roadmap work

1. Physical-device acceptance for exact release SHA: main campaign and Good Dogs on iPhone Safari plus desktop Chromium.
2. Complete approved dog alternating walk/contact, start/stop and landing source art; keep existing quarantines until semantic review.
3. Finish authored M4–M7 orbital layer compositions and cinematic-to-gameplay match frames.
4. Continue staged retirement of the historical hook tower behind parity tests.
5. Measure real-device first-playable, long frames, memory, thermal behavior and decode cost.
6. Expand office memory/recurrence beyond the canonical Day 1 cases only after the existing evidence/outcome model remains authoritative.

## Acceptance contract

`test_production_gameplay_experience.js` verifies registry-derived navigation, semantic event consumption, accessibility/settings hooks, and presentation-only authority. It is included in the aggregate production release gate. Browser/device acceptance remains separate; this document does not claim physical-device certification.

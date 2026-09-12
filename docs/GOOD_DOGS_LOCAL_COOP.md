# Good Dogs: domestic opening and local co-op

The title's campaign button opens a single-player / local two-player selector.
A fresh campaign then plays three in-engine shots at Waldo's house, yard and
garage before M1. Continue and Skip both mount the property investigation.
The existing ship film (`GD_CUT_01`) belongs exclusively to M2 boarding, after
both hangar waves, the power interlock and the explicit Board action. The pilot,
`GD_CUT_02`, playable flight and crash retain their existing sequence before M3.
Mission resumes preserve the selected play mode and completed puzzle checkpoints.

## Playing together

This is local co-op on one shared keyboard and screen. The selector describes
that requirement. It does not advertise online play or gamepad support.

| Action | P1 — Katrin | P2 — Manchez |
| --- | --- | --- |
| Move | Left / Right | A / D |
| Jump | Up | W (up to three jumps) |
| Attack | E | F |
| Interact | E / existing touch USE | R (pair puzzles and revive) |
| Dash | Shift | V |
| Guard | K | S |
| Tandem finisher | G / SYNC, when ready | Alternating hits help build SYNC |

P1 leads the existing story interactions. P2 independently traverses, fights,
operates pair mechanisms and revives P1. Both use the existing pair health,
shared damage and campaign progression authorities. A downed player keeps their
character ownership; the other player has eight seconds to revive them. The
shared camera and separation limit keep both players on screen without dragging
an idle player. AI follow, automatic assist teleports, Swap and Partner Throw
are disabled in local mode. Blur and dialogs release second-player input.

Single player keeps the existing AI partner, Swap, touch controls and pair
abilities. On the first puzzle pad, USE tells the partner to stay; USE again
releases that command. Completing a mechanism restores normal following.

## Two pair puzzles

- **M1: garage twin latches.** One living, grounded dog on each pad continuously
  for 0.8 seconds opens the false wall. Regroup at the exit and USE to descend.
- **M2: launch power interlock.** Clear the hangar, hold the first pad, and have
  the other dog USE the console. Both must remain in place for 1.2 seconds.
  Losing contact resets the charge. The Board action remains unavailable until
  the power link is complete; the movie and progression gates also check it.

Definitions live in the immutable level registry. The pair step updates them;
the existing compositor draws their state. No additional polling game loop,
progression owner, damage resolver or numbered hook is introduced.

## Visual pass and source art

The prologue and M1 share the existing `waldo_house.png` and `waldo_garage.png`
architecture bands, cropped at draw time to exclude the reference HUD and baked
characters. Existing transparent handoff dog art supplies the foreground pair
and their matching idle poses. Runtime camera movement and atmosphere respect
the prologue's reduced-motion preference. No new images were generated. The
previously quarantined walk generation remains unbound.

## Verification

- `node scripts/production_release_gate.js`: includes the co-op contract suite.
- `node scripts/good_dogs_coop_bot.mjs`: Chrome and WebKit, independent input,
  all three home shots, cancellation/relaunch, both puzzles, P2 jump and attack,
  revive ownership, blur cleanup, and desktop/mobile screenshots.
- The dedicated local co-op M2 combat check uses a documented encounter fixture.
  The solo browser route clears both M2 waves and puzzles through real input.
- Existing Chrome/WebKit runtime and iPhone WebKit M1-to-M3 tests retain real
  decoded-frame requirements for both ship movies. Later progression retains
  its documented encounter fixtures. Emulation is not physical-device evidence.

The deployment must include `index.html` and both cache-versioned bootstrap
chains. Updating only the title script leaves stale mobile bootstrap URLs able
to request an earlier owner.

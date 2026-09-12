# Night Crawler: directional combat follow-up

Prepared against main `31cdf77264d657e0a43c291b163e143546dd0325`.
This document describes the patch, not a claim that it has been deployed.

## Controls (ordinary Night Crawler only)

| Action | Keyboard | Touch |
|---|---|---|
| Move / face left or right | A/D or left/right arrows | Joystick left/right |
| Punch; neutral paced chain | E | Existing PUNCH button |
| Uppercut launcher | W/up + E | Aim up + PUNCH |
| Low body strike | S/down + E | Aim down + PUNCH |
| Launching kick | J, optionally left/right | KICK, optionally aim left/right |
| Higher rising kick | W/up + J | Aim up + KICK |
| Low sweep / knockdown | S/down + J | Aim down + KICK |
| Grab a nearby grounded target | G | GRAB |
| Throw held target | Left/right; up launch; down slam | Aim selected direction |
| Confirm a throw | G, E or J during hold | GRAB, PUNCH or KICK during hold |
| Jump / jump follow-up | Space | JUMP |
| Air punches and kicks | E / J while airborne | PUNCH / KICK while airborne |
| Early air slam | Down + J while airborne | Aim down + KICK while airborne |
| Block / dash | Existing K / Shift | Existing BLOCK / DASH |

Up is attack aim, not jump, in ordinary Night Crawler with the new input adapter.
Good Dogs, Sector 04 and Waldo retain their existing input and combat owners.
A legacy direct call to `TechOpsNightCombat.attack(n, keys)` still supports
walk-toward + attack grabs; explicit new input uses separate punch/kick/grab actions.
Controller mappings have not been certified for this change.

## Grab defect

The old v55 joystick bridge injects `joy` into `keys` only while executing a
frame, then restores the keys. A touch attack outside that frame can therefore
read no direction even while the joystick is held. The new adapter snapshots
live joystick intent at the action edge. Explicit grab also works while standing
still in reach, using foot alignment rather than equal sprite heights.

Grab reach is 58 world units center-to-center, with an 18-unit feet tolerance.
Airborne, hovering, ungrabbable, dead and recovering targets are excluded. Holds
expire after 1.6 seconds or break on incoming damage/target removal. A confirmation
inside the initial 120 ms is buffered rather than silently discarded.

## Launch and air-combo rules

Uppercuts, rising kicks and neutral/side kicks launch on contact. A connected
launcher can cancel recovery into an explicitly requested jump. Tap-jump remains
queued during hit-stop; it is not lost between render frames. No auto-hop or
player/target teleport is used. Confirmed air hits supply a small forward drift
and lift. Each flight permits at most three follow-up hits, then forces descent.
Down-air kick ends the chain early with a slam. Another launcher cannot reset the
air-hit budget. Landing recovery prevents immediate re-grabs/relaunch loops.

Damage, hit sounds, combo credit and KO rewards are resolved on contact. Whiffs
give no combo credit; KO rewards are paid once. Approved existing art is reused
with pose staging. There are no newly authored punch/kick/grab sprite sheets.

## Ownership and installation

`night_combat.js` remains the sole street combat service; it owns no listener,
render loop or timer. `night_combat_input.js` owns input and touch controls. The
existing v55 frame bridge calls `runStep`, and the existing draw calls `sync`.
The production bootstrap loads the input adapter immediately after combat.
The installer rotates cache identifiers and updates the launch instructions.

The existing combat gate is retained. It additionally invokes
`test_night_directional_combat.js` and `test_night_directional_physics.js`.
The existing Chrome/WebKit combat bot uses explicit grab/jump inputs and receives
additional directional attack checks. Do not weaken existing CI checks to merge.

## Evidence and limitations

Locally observed: 33 focused checks, nine real extracted Night-step physics
sequences at 16/100/250 ms render intervals, and seven system-Chromium touch-input
fixture checks. The mobile fixture uses genuine browser touch events, including
two simultaneous touch pointers, but a fixture joystick and an isolated DOM.
It is not the full production page or a physical iPhone.

Not executed locally: complete production gate, full startup/historical wrapper
stack, updated repository Chrome/WebKit bot, physical iPhone/controller ergonomics.
Full Chrome and WebKit CI, preserved campaign gates, and touch layout inspection
on the actual game remain required before merge/deployment.

## Current lifecycle integration (PR #29)

E/Punch still opens Mike's house at the canonical doorway and the Charger near the parked car when no enemy is nearby. G/GRAB is independent of those context interactions. Menus, cinematics, hidden tabs, paused/game-over states, Good Dogs, Sector 04 and Waldo do not accept these street-combat actions. The consolidated Night lifecycle calls input cleanup and presentation through its existing hooks; no new clock or renderer loop is introduced.

### Standard-layout controller

In ordinary Night only: stick/D-pad aims and moves, A punches/interacts, Y kicks, LB grabs, RB jumps, B blocks and X dashes. Up is aim, not jump. Start retains its menu action; Y retains Teams outside ordinary Night. This reuses the existing gamepad poll and must still be physically playtested.

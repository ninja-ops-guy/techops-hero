# Night Crawler: directional combat follow-up

Prepared against main `a7fa4066a4945bbcdc9d3e1259f61f2c18e3223b`.
This document describes the patch, not a claim that it has been deployed.

## Controls (ordinary Night Crawler only)

| Action | Keyboard | Touch |
|---|---|---|
| Move / face left or right | A/D or left/right arrows | Joystick left/right |
| Punch; neutral paced chain | E | PUNCH / USE button |
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
`test_night_directional_combat.js`, `test_night_directional_physics.js`, and
`test_night_input_lifecycle.js`.
The existing Chrome/WebKit combat bot uses explicit grab/jump inputs and receives
additional directional attack checks. Do not weaken existing CI checks to merge.

## Lifecycle and interaction integration

E / touch PUNCH / USE calls the canonical `interact()` route first. Mike's house
still opens its Home menu; the Charger still opens its destination menu when
no nearby enemy owns the interaction. Only the resulting `nmJab` action is
labeled as a punch. This avoids intercepting Home or manufacturing another copy
of its interaction boundaries. GRAB and KICK remain dedicated combat actions.

Input and core reject actions while paused, hidden, game-over, in battle,
inside a dialog or behind a presentation claim. Driving still advances through
the existing frame. Space/Enter on a focused button retain native activation,
but the legacy gameplay key listener cannot also punch/jump. A consumed touch
cannot dispatch a second action via compatibility mouse/touch events after it
opens a dialog. No additional Night clock or renderer is introduced.

## Evidence and limitations

Locally observed on a hash-verified reconstruction of the current-main runtime:
58 aggregate production suites plus the unchanged atlas quarantine PASS. Within
that gate, 33 directional checks, nine extracted production-step air-combo
sequences at 16/100/250 ms frame intervals, and 19 new input/lifecycle integration
checks PASS. The 16 existing Night lifecycle regression groups still PASS.

Ten offline Chromium input fixtures PASS using real trusted touch input,
including simultaneous pointers on the actual game.js D-pad handlers, v55
bridge, current Night lifecycle and production compositor. Rendering is a
clearly labeled rectangle fixture, not the game's art or full historical stack.
The Home cinematic renderer is not tested by those offline fixtures.

The complete page could not be loaded locally: navigation to the test server
was denied with ERR_BLOCKED_BY_ADMINISTRATOR. The updated repository Chrome /
WebKit bot (now including Chromium simultaneous D-pad touches and WebKit touch
grab) is prepared but not run on that production page here. Physical iPhone,
controller, final sprite presentation and complete-page acceptance remain open.
Do not treat the local fixture evidence as certification or relax those gates.

PR #26 is a separate, concurrently changing audio/office quality branch. This
patch targets main after #24 and does not replay PR #23 or replace #26's sound
work. If #26 lands first, reconcile its semantic audio dispatch with these new
move types and rerun both feature suites; do not overwrite either combat core.

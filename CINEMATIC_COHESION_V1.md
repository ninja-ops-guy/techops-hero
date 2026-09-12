# TechOps Hero — Cinematic Cohesion v1

**Status:** foundation published in PR #15; supplied-art and backlog follow-up in validation
**Canonical player-facing campaign name:** **GOOD DOGS PROTOCOL**
**Runtime authority:** `cinematic_systems.js` + existing mode-specific engines
**Release rule:** presentation may observe gameplay events; it may not own damage, collision, progression, saves, or media retries.

## Outcome

This pass makes the story route and the verified route agree:

`M1 Waldo's House → M2 Hidden Bay → BOARD → GD_CUT_01 → cockpit pilot interaction → GD_CUT_02 → playable Good Ship flight → authored crash → M3 Hull Breach → M4 Cell 118 → M5 Access Core → M6 Cell 1984 → M7 Warden / shuttle → M8 Earthfall`

A fresh save starts at M1. A resume starts at the persisted mission. M2 stays persisted until the deck interaction, takeover film, playable flight, and crash all complete. Any failure leaves the player in M2 with a recoverable BOARD action.

The pass also establishes one immutable level registry, one passive presentation owner, common camera profiles, an animation-semantics controller, and an authored mixed-media M3 environment. The regular Day Shift and Night Crawler loops retain their mechanics, input, collision, and save behavior.

## Good Dogs campaign walkthrough

| Mission | Place | Playable verb | Completion evidence | Story purpose |
|---|---|---|---|---|
| M1 | Waldo's house, yard, porch, garage | Investigate | Trail complete, Hidden Bay explicitly entered, pair assembled | Establish absence and emotional stakes before spectacle |
| M2 | Waldo's concealed launch bay | Secure / board | Hangar clear and full board sequence complete | Turn a domestic mystery into an orbital rescue |
| M3 | Blacksite Meridian hull breach | Survive / breach | Prison breach operations complete | First hostile contact with the prison as a system |
| M4 | Detention Block 118 | Investigate / rescue | Three clues, cell opened, K revealed, ambush cleared | Establish K as a person, not a Mike substitute or state flag |
| M5 | ORPHEUS Access Core | Control | Security clear and Access Node explicitly seized | Let K materially change the route; attack the system, not symptoms |
| M6 | Surveillance Block 1984 | Defend / evade observation | Decrypt complete, uplink survives, final wave clear, Waldo free | Make surveillance and classification the threat language |
| M7 | Warden Core / shuttle bay | Boss / escape | Warden dies to actual tandem finisher and pair reaches shuttle | Resolve the linked-pair mechanic and reject the Warden's NULL classification |
| M8 | Waldo's house at dawn | Homecoming | Earthfall ending owns completion and unlock persistence | Close the circle at the place where the search began |

### Campaign consistency judgment

The route is narratively coherent because every escalation preserves the same question: do the heroes merely suppress a visible failure, or do they identify and sever the controlling system?

- M1 follows evidence instead of inventing a conclusion.
- M2 reveals hidden infrastructure beneath an ordinary home.
- M3 treats the prison as hostile architecture.
- M4 proves identity through observed evidence.
- M5 gives the rescued character agency through system control.
- M6 turns observation itself into pressure.
- M7 makes partnership—not individual power—the canonical solution.
- M8 returns everyone home and feeds K/Waldo continuity into the later main-story acts.

The previous contradictions are now removed from the production path: the title no longer bypasses M1/M2, M2 no longer carries the old three-uplink-tower objective, the title module no longer owns orbital flight, and the duplicate ship-approach wrapper is no longer loaded.

## Regular run walkthrough

The regular run remains a three-movement structure:

1. **Day Shift — operator / systems detective.** The player clocks in, receives a day modifier, walks the industrial/office spaces, interviews users, inspects evidence, chooses a root-cause approach, resolves tickets, documents work, and advances organizational story state.
2. **Ticket portals — technical metaphor.** A real failure becomes a memorable encounter space: DNS becomes the Labyrinth of Names, account lockout becomes the Identity Cathedral, VLAN failure becomes the Switching Maze, and so on. The underlying loop still rewards evidence, verification, and documentation rather than random fixes.
3. **Night Crawler — urban action release.** After leaving through the South Exit, the player enters New Haven, traverses/fights across two streets per district, uses the four-door Charger hub, earns resources, returns home, saves, and advances the day.

Authored main-story events interrupt the routine—Felicia, impossible access evidence, Sector 04, MORNINGSTAR, and ORPHEUS—but they use the same theme as the ticket loop: symptoms are not the controlling system. Good Dogs extends that theme into identity, surveillance, and rescue rather than behaving like disposable side content.

## Exact playable level inventory

`TechOpsLevelRegistry.validate()` reports **42 registered playable spaces**:

| Family | Count | Inventory |
|---|---:|---|
| Good Dogs | 8 | Waldo's House; Hidden Bay; Orbital Prison — Breach; Cell 118; Access Core; Cell 1984; Escape Velocity; Earthfall |
| Night Crawler | 12 | Downtown 1–2; Long Wharf 1–2; Industrial District 1–2; Wooster Square 1–2; Airport Road 1–2; Suburbs 1–2 |
| Ticket worlds | 17 | Paper Dimension; Tunnel Caverns; Labyrinth of Names; Identity Cathedral; Corrupted Network; Mail Kingdom; Kernel Forest; Motherboard Desert; RF Shadow Realm; Chain of Trust; Sector Wastes; Servicing Stack; ACL Abyss; Switching Maze; Tape Catacombs; Startup Swamp; The Root Directory |
| Day / story spaces | 5 | Factory Floor; Office; Engineering; IT Room; Sector 04 |

The count intentionally excludes the Charger/home hub, title screen, dialogue cards, cockpit interaction, playable flight, crash film, and other transition surfaces. Those are sequences or hubs, not independently registered levels.

## Cinematic and style system now in production

### Level registry

Every Good Dogs mission now exposes a canonical ID, ordinal, next mission, name, objective, zone, gameplay verb, stage geometry, encounter metadata, district, background, palette, light, camera profile, presentation profile, animation profile, checkpoint, cinematic entry/exit, acceptance test, and completion contract.

Legacy background, phase, sequence, stage, district, and encounter consumers project from this registry. Runtime consumers receive mutable clones; canon remains frozen.

### Presentation director

The presentation director provides mode-scoped, idempotent ownership for blocking films, cards, dialogue, travel, recovery, and Earthfall surfaces. It does not install a draw loop, observer, or timer and does not write campaign state.

### Camera director

The common camera API currently supplies:

- `day.grid`: restrained two-axis lookahead with 170 ms response;
- `night.street`: the same side-view anchor with 115 ms eased follow, 12 px lookahead and a bounded 20 px lag;
- `gooddogs.sideview`: 18 px directional lookahead, 125 ms exponential response, and a bounded 28 px lag.

Camera response is elapsed-time based and tested for effectively identical 60/120 Hz convergence. Reduced-motion mode removes lookahead. Hard mission handoffs reset camera history.

### Animation semantics

The controller chooses frames by actor state and source-approved meaning. It explicitly refuses to turn attack, crouch, heavy-hit, or knockdown poses into locomotion.

Katrin and Manchez currently have two verified idle frames plus hack, pounce, bark, roll, wall-hit, look, strike, crouch, leap, shield, and down poses. Five previously mislabeled “idle” crops per dog are quarantined from runtime metadata. The supplied September 11 handoff now supplies extracted run loops and airborne dash key poses. Slow walking still holds the two valid idle frames because the new walk row does not prove an alternating gait. Each actor uses a stable bottom-center anchor and separate source rectangles; no atlas coordinates were copied from the older sheets.

### M3 mixed-media vertical slice

M3 now has an authored 768×512 environment backplate at `assets/cinematic/m3_orbital_prison_breach.png`. It establishes:

- orange impact breach and broken hull on the entry side;
- cyan maintenance-airlock gameplay focus;
- red security door / Cell Block direction on the exit side;
- station superstructure, Earth, sparks, smoke, cable silhouettes, and foreground occlusion;
- a gameplay horizon aligned to the existing Night-engine floor;
- palette-quantized, nearest-neighbor rendering compatible with the pixel actors.

The existing generated orbital-tile scene remains a fail-closed decode fallback; successful authored-image decode replaces it and exposes visual-authority telemetry.

## Mixed-media 3D production specification

Use 3D as an authoring source, not as a new live runtime.

For each converted environment, deliver:

| Deliverable | Requirement |
|---|---|
| Master scene | Blender/DCC file with locked orthographic or low-perspective gameplay camera |
| Far layer | Sky, planet, skyline, distant station; parallax starting point 0.10 |
| Mid-far layer | Buildings / station structure; parallax 0.28 |
| Gameplay backplate | Room/corridor architecture aligned to existing collision; parallax 0.55 |
| Gameplay plane | Existing Canvas collision and pixel actors; coefficient 1.00 |
| Foreground layer | Pipes, railings, foliage, debris; coefficient 1.18 with bounded occlusion |
| FX masks | Emissive, fog, reflection, alarm, smoke, and light-volume masks |
| Optional depth | 16-bit depth map for particles/occlusion only; never gameplay collision |
| Match frame | A still proving the last cinematic frame and first gameplay frame share lens, horizon, lighting, and composition |

Render at a controlled internal resolution, quantize to the approved palette, use hard readable silhouettes, restrict bloom, and use nearest-neighbor runtime scaling. Photoreal materials, painterly blur, live-camera wobble, and collision derived from depth are out of scope.

M3 is the cosmic proof. Sector 04 is the required grounded proof. Do not scale to all levels until those two spaces and one Night Crawler street unmistakably share one visual grammar.

## Animation source-art specification

For each major actor, art delivery must include semantic contact/event markers and transitions, not merely more drawings:

| State | Minimum production requirement |
|---|---|
| Idle | 6–8 frame breathing/look cycle plus one low-frequency secondary idle |
| Walk | 8 grounded frames with labeled left/right foot contacts |
| Run | 8–10 frames with larger compression and distinct silhouette |
| Start / stop | 2–3 frame weight shift; 2–4 frame deceleration |
| Jump | Crouch, launch, ascent, apex, descent |
| Land | Light and heavy variants with impact marker |
| Dash | Anticipation, travel/smear, recovery |
| Attack | Windup, active hit interval, follow-through, recovery |
| Hit / down | Directional recoil and authored collapse |
| Interaction | Sniff, bark, hack/use terminal, look/react |
| Partner | Throw, catch, boost, revive, and tandem synchronized states |

Footstep audio fires on contact markers. Damage fires on the active frame. Dust fires on landing. Hit-stop and camera impulse fire on confirmed impact, never on button press.

## Swarm implementation backlog

The foundation lanes have landed in this pass; remaining lanes are bounded so multiple contributors can work without colliding in the historical hook tower.

| Lane | Ownership | Status / deliverable | Acceptance |
|---|---|---|---|
| S1 Canon authority | `cinematic_systems.js`, registry projections | **Landed** | One immutable registry; 42-space validation; no duplicated M1–M8 identity |
| S2 M1/M2 continuity | title, progression, M2 board/flight | **Landed** | Fresh M1; explicit Hidden Bay; explicit board; full media/flight/crash before M3 |
| S3 Animation source | new atlases/manifests only | **Partial art integration**: dog run/air-dash and Mike run/jump use extracted handoff poses; alternating walk and Mike dash remain unapproved | No pose relabeling; contact markers; semantic coverage test green |
| S4 Camera | camera consumers only | **Implemented**: eased, bounded Night/Good Dogs profiles; reduced motion and 60/120 Hz contract | Same API in Day, Night, Good Dogs; reduced-motion; no collision/input changes |
| S5 2.5D environments | DCC sources + layer manifests + renderer adapter | **Raster layering implemented**: existing prison props on M3–M7, Sector 04 and Industrial street; DCC masters and matched cinematic frames still absent | Stable mobile pacing; collision unchanged; match-frame proof; decode fallback |
| S6 Combat presentation | event subscribers / FX assets | **Implemented at confirmed-hit seams**: bounded impact particles/rings, existing hit-stop and directional recoil retained; no new damage authority | No damage/combo/SYNC rule change; FX only on confirmed events |
| S7 Level differentiation | mission encounter modules, one owner per mission | **Implemented**: mission objective gates; M6 visible sweeps slow decrypt while catwalk shelter restores it; M7 requires shuttle after real finisher | Each mission has a distinct tested verb and cannot auto-complete on enemy clear alone |
| S8 Main-run cohesion | Day/Night transition presentation | **Implemented**: common 180 ms entrance treatment on day dialogue/portals and Night travel; reduced-motion alternative; common Night actor/camera art | Regular run and Night Crawler remain fully playable; no Good Dogs state leakage |
| S9 Story continuity | player-facing strings + story-state tests | **Implemented with remaining art exclusions**: prison Waldo stays masked; outdated M2 coupler copy removed; unresolved blue-jacket actor excluded | GOOD DOGS everywhere player-facing; K never rendered as Mike; Act VII state intact |
| S10 Visual QA/performance | tests and evidence only | **In validation**: mandatory Chrome/WebKit asset decode/playback screenshots plus campaign/runtime gates; physical devices remain | Chrome + WebKit; decoded media evidence; screenshots; resume/replay; frame/memory report |

### Landing order and collision policy

1. S3 source manifests and S4 tuning may proceed in parallel.
2. S5 proves Sector 04 and one Night street before any batch conversion.
3. S6 consumes stable animation events; it does not invent a parallel combat loop.
4. S7 owns one mission module per change and never writes shared camera/animation core.
5. S8 follows successful three-space visual proof.
6. S10 reviews every landing, not a final batch.

No lane may independently wrap `drawNM`, `stepNM`, `game.js`, or campaign transitions. Shared-service changes require a dedicated contract test. Art lanes do not edit save/progression logic. Gameplay lanes do not rename or reinterpret atlas frames.

## Validation matrix

Automated acceptance requires:

- all root `test_*.js` / `test_*.mjs` suites;
- `node scripts/production_release_gate.js`;
- Chrome and WebKit Good Dogs M1→M3 runtime coverage;
- regular Day Shift smoke through South Exit;
- Night Crawler district/combat/Charger smoke;
- M3 authored-image decode and identity proof;
- save/reload at M1, M2 before boarding, M2 after a failed media attempt, M3, and campaign complete;
- no generic Night/day HUD leakage during Good Dogs;
- no retries or arbitrary wait inflation used to mask media decode failures.

Physical iPhone Safari remains a release-evidence requirement. Playwright WebKit is necessary cross-browser coverage, but it is not a substitute for final-device input, safe-area, decode, memory, and thermal validation.


## September 11 supplied-art follow-up

See `ART_HANDOFF_INTEGRATION.md` for exact sources, accepted/excluded poses, extraction, source hashes and remaining acceptance. Seven atlases total 585,070 bytes before any later extraction refinement. No new image generation was used in this follow-up. The existing M3 raster from the earlier foundation is retained. This is raster compositing, not a delivered Blender/DCC project.

PR #15 initial CI exposed an outgoing-runtime race in the M1→M2 browser driver and a stale GD_CUT_02 checksum inherited from before source restore commit 776df25. The driver now waits for a fresh runtime with cleared mission transients. The checksum remains mandatory and matches the restored committed master; the MP4 is unchanged. H.264 checks continue using Chrome and WebKit.

# Day field experience

Implementation candidate, not release certification.

## Narrative authority

This revision implements the spatial interaction and evidence-before-action rules in `docs/production/PRODUCTION-BIBLE-R1.md` and `AAA-QUALITY-BAR-R1.md`, under `DOC_AUTHORITY.md`. `PRODUCTION_BASELINE_v1.2.md` remains the narrative authority. No new lore, character identity, reveal, ending or campaign gate is introduced.

The opening remains standup → Mike's physical workstation → Red in the Mirror → Felicia company profile/video → explicit clock-in → Shipping → Plating → Impossible Access → Sector 04 → Tuesday. Routing guides this order; the existing campaign authorities decide progression and ownership. Optional service cases never award campaign evidence or unlock Night content.

Shipping remains a queue-authorization failure, not a stuck spooler. Plating remains a production integration dependency failure after restart, not broken PLC logic. Amit's ownership and the access investigation's delegated perspective are preserved. Music remains ordinary listening with no K identity reveal or ORPHEUS evidence.

## Player experience

- Top-down exploration locates people, equipment, and the route between them. Equipment exists before diagnosis.
- Talk establishes the human need. Mike must walk to a real device to inspect or use it. Standup and blocked work mark a route rather than opening his computer remotely.
- An explicit device interaction opens a close-up with physical inspection points. Each point records a concrete observation; clicking a part does not silently repair it.
- The local-screen view belongs to the current computer. Shipping's printer and dispatch workstation are separate stations. A service laptop is visibly staged beside the optional batch printer and access point for administration.
- Evidence supports or rules out hypotheses. A supported hypothesis and the relevant change authorization precede repair. Industrial cases require an operator-safe window; generic IT repairs never modify PLC logic, interlocks or process controls.
- Technical checks and requester task verification are distinct. Canonical closure returns to the requester. Optional cases explicitly invite the requester to the equipment to perform their task.
- Leaving returns control to the same world position. Entering a close-up never launches a portal battle or Night movement. Sector 04 still uses its existing authored transition after campaign eligibility.

The close-up is an inspection surface, not a new side-scrolling combat mode. The existing side-view story and Night scenes retain their owners and camera/collision rules. This avoids translating top-down coordinates into side-scrolling movement without an authored entrance.

## Ordinary device coverage

| Case | Physical context | Investigation |
| --- | --- | --- |
| Engineering laptop dock | Laptop and dock | Identify a loose uplink from physical and adapter evidence |
| Finance desktop | Workstation | Protect active work and coordinate a pending restart |
| Lobby signage | Display and mini PC | Distinguish healthy hardware from player authorization |
| Finance batch printer | Printer and service laptop | Identify a blocked job instead of blaming the healthy print engine |
| Packaging HMI | Controlled industrial cell | Restore a documented communication dependency under operator hold |
| Traceability scanner | Network-connected production device | Compare expected network assignment and observed connectivity |
| Engineering access point | AP and service laptop | Diagnose the PoE/link path before changing software |
| HR time clock | Attendance terminal | Diagnose time synchronization without rewriting attendance records |

Original corporate-OS notifications add workplace humor. They are secondary to actual evidence and do not change the cause or outcome.

## Runtime boundaries

`runtime_day_world.js` owns physical station metadata and passive BFS wayfinding. It preserves corridor connectivity and reachable approaches to every contact and station using the same occupancy rules as routing, exposes unavailable routes, and never teleports or writes campaign facts. Nearby target selection respects the marked destination and offers an explicit choice when people and equipment share an approach. It renders within the existing world transform. Canonical contacts no longer wander away from their recorded interaction positions.

`runtime_day_cases.js` is a pure ordinary-case state machine. Records persist in the existing `S.meta.dayCases` checkpoint. It rejects invalid surfaces, unsupported hypotheses, unauthorized repairs, and premature verification. Repeated accepted actions are idempotent.

`runtime_day.js` owns the device presentation and spatial admission checks. It reuses the existing dialogue/input owner, maintains keyboard focus, clears stale handlers, and releases control on exit. Canonical evidence and closure remain in `campaign_act1_investigations.js` and `campaign_act1.js`. Optional progress rolls back in memory if the checkpoint write fails.

`runtime_day_audio.js` owns semantic day SFX and volume ducking. It reuses the user's existing SoundCloud soundtrack and shared audio context, never creates another music loop, and respects mute, pause, and backgrounding. Morning listening waits for confirmed playback of the correct song. An explicit muted continuation records a separate accessibility choice; it never claims successful playback.

`runtime_day.css` provides responsive surfaces, large controls, visible focus, reduced motion, and restrained transition/evidence animation. Equipment drawings are technical interaction diagrams. No quarantined concept art is promoted.

## Verification boundary

The added suites exercise all ordinary cases, invalid transitions, stale inputs, off-device access, save failure, checkpoint reuse, 24 procedural layouts plus 60 layouts using real native contact placement, and audio ownership. Existing narrative, scene, persistence, Night, and Good Dogs suites remain release gates.

`scripts/day_device_acceptance_browser.mjs` captures desktop, portrait, compact, and landscape device flows. Its position fixtures are explicitly distinguished from an unassisted full campaign playthrough. The printer-to-workstation route is traversed with actual keyboard input and checked at every tile. Floor and side-view room owners are tested separately: frozen floor entry coordinates cannot authorize a workstation while Mike is inside a room. Browser captures, real SoundCloud playback, physical iPhone testing, performance evidence and human assessment remain separate requirements for an AAA-quality or release-ready claim.

The parser-time structural ceiling increases from 265 to 269 scripts for the four named Day concern modules, with a combined limit of 120 KiB and a 20 KiB stylesheet limit. The existing 40 MiB startup ceiling remains. This is an explicit scope allowance, not a claim of measured startup or frame-time performance; the exact-head performance evidence gate remains required.

## User review correction — September 28

The supplied screenshots exposed gaps in the first acceptance pass: ordinary coworkers were absent from target resolution, the physical desk duplicated the authored office desk, portrait side rooms cropped their environment, and the workstation remained a dialogue menu. The revised interaction resolver includes the existing NPC owners and never lets a stale device route outrank a nearby coworker. Station schema v3 reuses MIKE_DESK and migrates v2 props while preserving coworker approaches.

The existing Day presentation module now includes a simulated AeroDesk desktop with application icons, taskbar, application windows, minimize/maximize/close controls, local diagnostic results and explicit exit. Native campaign callbacks retain all progress authority. The opening company profile is renamed **People Behind the Flight** at the user's explicit direction. Its skippable timed shots retain Felicia, aircraft/field systems, violin and the brief ORPHEUS interruption without new lore. Existing production campaign media supplies these shots; no new concept sheet is introduced. The listening beat and clock-in have their own short scene presentations. These are in-engine sequences, not prerecorded video.

The music selection path now suppresses the base player's automatic READY playback and stays muted until PLAY reports the requested song ID. Tests cover a wrong current item before the correct confirmation. Live SoundCloud delivery/audibility is not certified by mocked playback tests.

The screenshot's placeholder forklift rectangle/anchor effects are removed, conversation actors are reduced to scene scale, room backgrounds fit the available viewport, and office coworkers use distinct stable existing atlas identities. The renderer still uses the existing authored asset family; these corrections do not establish AAA art certification.

The new desktop is part of runtime_day.js: startup remains four Day modules and within the existing 120 KiB combined JavaScript / 20 KiB CSS limits. Browser acceptance adds the simulated desktop, profile cutscene, original desk identity, and all four real coworker interaction handlers with a stale desk route.

## Dialogue and room-entry correction

The September 28 requester screenshot reproduced two intake defects: all users received the same four gauge-filling choices, and a generic filler render immediately replaced the authored answer. Intake now exposes incident-specific observation and preservation questions plus department-specific impact questions. Asked topics persist on the requester; revisits resume that conversation. Guessing no longer reveals the hidden root cause or awards unsupported confidence. The existing technical investigation remains the authority after intake.

Office coworkers now have distinct authored two-step topics: Nick (triage and handoff), Amit (production dependencies/change boundaries), Brandon (falsifiable tests), Daniel (mentoring and communication). Existing intern recruitment remains available. Department ambient conversations have work-specific topics and per-person memory. Repeat content is available explicitly as review instead of pretending it is a new exchange.

First entry into the IT room starts a four-speaker standup sequence. Timed shots and explicit advance share the dialogue owner; skipping goes to the assignment decision, not completed work. The intro checkpoint and canonical standup flags prevent replay after completion. The side-view room now contains Mike's desk at room-x .82 with a matching prompt and interaction radius. Side-view workstation admission uses that visible position rather than the frozen floor-entry coordinates; no teleport is involved.

The capture bot now enters the IT room, observes automatic standup, walks with keyboard input to the visible desk, and captures requester dialogue as well as inspections. It produces an annotated `visual-review.html` alongside screenshots and `report.json`. Priorities distinguish P0 spatial/story defects, P1 dialogue/interaction defects, and P2 art-direction debt. Pixel-density/lighting and cinematic-media consistency remain visual-review items, not automatic aesthetic passes.

### Captured review, 2026-09-29

Four-size Playwright capture on `5d435fb` passed the entry-triggered standup,
real keyboard approach to the side-room desk, simulated desktop, requester
conversation, and evidence/repair/human-verification paths. These are declared
fixture-assisted checks, not a full unassisted playthrough. Screens are in Actions
run 36500949726; `visual-review.html` gives side-by-side criteria and annotations.

Observed priorities against the production bible:

| Priority | Finding | Next acceptance target |
| --- | --- | --- |
| P1 | Portrait standup dialogue hides the crew; arrival overlays compete with the scene. | Speaker remains visible and arrival UI finishes before the scripted exchange. |
| P1 | Shipping scene composition places props/actor against unrelated background depth. | Background, actor feet and equipment share one authored scene coordinate system at all sizes. |
| P2 | Portrait side-room framing leaves a large empty upper area. | Camera framing keeps the room and active character prominent without cropping controls. |
| P2 | Detailed side backgrounds, simple floor props and vector inspections differ in pixel density and light. | One pixel grid, palette and light direction across the same device in all views. |
| P2 | Mike's visible foreground desk differs in detail from backdrop desks. | Replace it with an authored matching asset while preserving its interaction bounds. |

Immediate review fix: clamp workstation prompt inside narrow canvases; render
side-room backdrop with nearest-neighbor scaling. This removes extra interpolation,
but does not resolve underlying asset-style differences. No AAA art approval is claimed.

## Review-fix round — September 29 (capture-verified)

Capture bot now also drives the real Shipping requester dialog and captures the
authored act1-reference stage at all four sizes. Local four-viewport run: PASS,
0 page errors; evidence in `scripts/docs/qa-day-device-2026-09-29/` (40
screenshots + report.json + visual-review.html), inspected by hand.

Fixed against the production bible:

- **P1 — standup hid the crew / arrival overlays competed.** The scripted
  standup now runs as a framed mid-shot: `day-standup-open` lifts the room
  floor line to 62% while the exchange runs, caps the dialogue panel
  (38vh desktop / 34vh phone / 30vh compact / 46vh short-landscape), lays the
  Continue/Skip pair side-by-side on phones, and marks the current speaker
  (gold pointer + plate). The CLEAR HEAD / overslept status toast is queued
  after the arrival day card finishes instead of stacking on top of it.
- **P1 — Shipping stage floated actor/props.** The stage now measures the
  background art's last lit scanline (several boards carry baked letterbox
  bars, so fixed offsets could never align) and converts it to a
  `--a1-floor-bottom` custom property with true `background-size:cover` math,
  re-applied on resize. Actor, props, forklift/feed/eject motion and the
  status bar all share that measured floor at every viewport (observed
  3.5–4.3% across the four sizes). Behind-dialogue actor scale reduced to
  48% so the clerk matches the dock's perspective.
- **P1 — arrival card stacked under/over the route HUD.** While the arrival
  card holds the screen the body-level route HUD yields (`arrival-card-on`).
- **P1 — toasts obscured live dialogue.** `dlg()` now dismisses any live
  toast when the dialogue opens (the room-entry hint toast could cover the
  requester conversation).
- **P2 — portrait side-room framing.** Tall screens lift the floor line to
  68% (name plates clear the touch D-pad), the void above the backdrop reads
  as ceiling (gradient + light strips in the biome accent), and Mike's
  foreground desk is redrawn to match the room's authored palette (chair,
  two-tone desk, lit monitor, keyboard, mug, cable) with unchanged
  interaction bounds.
- **Hygiene.** The Good Boys handoff suppression matcher now recognises the
  renamed "People Behind the Flight" panel; REVIEW_GUIDE regenerated
  (review contracts PASS again).

Regression status: the four Day runtime suites, the capture bot (four
profiles), Night lifecycle (20 groups), Night combat (38 assertions) and the
syntax inventory all pass. Seven production-gate groups still fail — all
verified to fail identically on the pre-round branch head `8711c09`
(resume-checkpoint extraction, story-authority firewall, Good Dogs state
integrity, runtime autofix/triage, two Night suites); they are branch debt
outside this slice, not regressions from this round.

### Remaining P2 dispositions (explicit)

| Item | Disposition |
| --- | --- |
| Inspection diagrams read as vector art next to pixel scenes | Kept by design: the close-up is a technical interaction diagram, not in-world art (`runtime_day.css`). A palette/pixel-grid unification pass is deferred to a dedicated art milestone. |
| Company profile media is photoreal next to pixel characters | Kept as diegetic corporate media (an in-universe company video). Reframing it as pixel art would contradict the "existing production campaign media" authority. |
| Side voids beside the room backdrop on short-landscape viewports | Accepted for this slice: the authored backdrop is height-bound; filling the width would crop the authored furniture. Revisit with a wider room variant. |
| Pre-existing gate failures (7 groups, see above) | Tracked as branch debt; fixing save/checkpoint extraction and the Night suites belongs to a separate hardening slice. |

### 2026-10-03 — Authored scene coordinates, standup staging, music mapping

Acceptance-gaps round against the `TechOps Hero needs a` checklist
(section 1). All captures below in
`scripts/docs/qa-day-device-2026-09-29/`.

- **P1 — Shipping composition is now authored, not measured.** The rejected
  scanline heuristic is gone. `campaign_native_act1_visuals_impl.js` carries
  `SCENE_LAYOUT` (hand-authored floor line, actor spot, prop support
  surfaces against the 768x432 boards) plus `SPRITE_ANCHORS` (PIL-measured
  alpha bboxes that compensate transparent sprite padding — anchoring never
  trusts the raw image edge). Sprites live inside the `.a1-bg` element so
  they inherit its cover-crop window; sprite pixel density follows the
  background's displayed scale. The clerk stands at spot x 150/768 with feet
  on the y 400/432 floor line — in front of the clerk's own desk, clear of
  the forklift (x 330-560) and crate stack (x 500-640); the label printer
  sits on the desk front edge (x 210/768, surface y 319/432), occluding the
  monitor base. Narrow stage boxes crop toward an authored horizontal
  *story band* (desk + clerk + printer, x 100-430) instead of centering, so
  compact/landscape keep the staged figures visible while backdrop edges
  crop. The retired stopgap rule in `runtime_day.css` that hard-pinned the
  side-view actor (`height:29%!important; right:20%!important`) — the
  actual source of the clerk-over-forklift defect — is removed; inline
  anchored styles now win. Capture asserts the rendered feet fraction
  (0.927-0.941 vs authored 0.926) and the left-story-zone spot on every
  run, all four viewports.
- **P1 — Printer credibility** follows from the authored anchors above:
  support surface on the desk front edge, scale from the art's pixel
  density, spatial relationship to the standing clerk and the baked-in
  seated clerk (visible in the captures).
- **P1 — Standup staging.** Mike is held at an authored mark (left third)
  while `day-standup-open` holds, so he cannot occlude the speaker. The
  current speaker carries a floor spotlight + gold pointer; the rest of the
  crew dims to 55%. The arrival card is suppressed in itdept until
  `standup_completed`, so it no longer competes with the scripted sequence.
  The dept chip reports floor-wide open tickets (`N open on the floor`)
  and only says "all clear" when the whole floor is done — no more
  misleading all-clear while work is unresolved. Compact dialogue caps at
  30-34vh and `#dlg-text small` auxiliary print is hidden during standup,
  removing the awkward inner scroll.
- **P1 — Desk prompt pill.** "E — use Mike's workstation" / "E — talk to X"
  hints now ride a dark rounded pill (clamped to the canvas), legible on
  bright backdrops, portrait crops and small screens.
- **P1 — "Red in the Mirror" mapping, metadata level.** External soundtrack
  requests stay blocked; the capture drives the real MUSIC flow against a
  stub SoundCloud widget whose playlist carries a decoy track before the
  real entry, and asserts the recorded `trackId`/`title` match the playlist
  "Red in the Mirror" entry (id 7 in the stub). Audible playback remains
  explicitly uncertified. Note: `game.js` keeps `scWidget`/`scReady` as
  top-level `let` bindings and `SC.Widget.Events` lives on the constructor
  — stubs must model that integration surface, not `window.scWidget`.
- **Infrastructure.** `waitForServer()` now drains the fetch body; leaving
  it unconsumed tripped a Node 24 undici `assert(!this.paused)` crash when
  the server closed the socket. The Windows CRLF renorm from the test
  reconciliation round (core.autocrlf=false + `.gitattributes`) is part of
  this branch: production gate now fails only the two POSIX-only fixture
  groups (runtime autofix/triage embed `#!/bin/sh` stubs and a
  `C:\etc\passwd` symlink fixture), which pass in POSIX CI.

Regression status: four Day runtime suites PASS; capture bot PASS on all
four profiles (shipping anchor + music mapping asserted); production gate
fails only the two documented POSIX-only groups above.

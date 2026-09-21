# TechOps Hero — AAA Quality Bar R1
Status: Acceptance contract

"AAA" here is a production-quality target, not a claim about budget or studio size. A feature passes only when it is coherent, authored, responsive, stable and verified in context.

## Release-quality dimensions
### Gameplay coherence
PASS when a first-time player can predict what an interaction will do from the world/prompt, actions have causal feedback, and no unrelated subsystem activates.
BLOCKERS: NPC opens workstation; workstation works away from Mike's desk; hidden state changes without feedback; Day/Night control leakage.

### Visual cohesion
PASS when gameplay screenshots look like the same authored game across adjacent scenes: consistent scale, perspective, palette logic, lighting hierarchy, pixel treatment and UI language.
BLOCKERS: concept/spec sheets in gameplay; placeholder/debug art; mismatched sprite scale; accidental smoothing; illegible foreground/background separation.

### Animation/game feel
PASS when locomotion and interactions start/stop crisply, transitions do not pop into unrelated poses, attacks/actions communicate anticipation-impact-recovery, and control return is predictable.
BLOCKERS: wrong semantic pose, stuck animation, visual action preceding accepted input, large dead frames without authored intent.

### UI/UX
PASS when prompts are contextual, HUD hierarchy is readable, touch/pointer/keyboard/controller semantics agree, safe areas work, and menus survive render-frame changes.
BLOCKERS: unreachable controls, overlapping critical UI, stale hit targets, prompt/action mismatch.

### Narrative/cinematic
PASS when scene intent is understandable without developer knowledge, character continuity holds, cinematics own/release input explicitly, and skip/advance cannot corrupt progression.
BLOCKERS: softlock after cinematic; contradictory canon; timeout interrupts player-owned choice.

### Audio
PASS when music/ambience/SFX states match gameplay and transitions are clean; critical information is not audio-only.
BLOCKERS: overlapping state music, missing critical feedback, abrupt unintended restart, persistent audio from prior mode.

### Reliability
PASS when campaign paths survive reload, pause/resume, repeated transitions and supported input methods; errors recover or fail safely.
BLOCKERS: save corruption, progression softlock, unrecoverable black screen, duplicated campaign events.

### Performance
PASS requires captured evidence on the supported matrix for startup, frame pacing, memory and input response. No "works on dev machine" waiver.
BLOCKERS: sustained gameplay jank, runaway memory, input stalls, serial startup bottlenecks with safe bounded alternatives.

### Accessibility
PASS when critical text is readable, controls do not depend on one modality, critical cues have non-audio representation, and motion/flash/contrast are reviewed.
Any inaccessible progression gate is a release defect.

## Severity
P0 — data loss, security issue, hard crash/softlock on canonical path.
P1 — broken progression, major interaction semantics, unusable supported input/device, severe visual/cinematic break.
P2 — noticeable quality defect with workaround.
P3 — polish issue not materially harming comprehension/control.

R1 release requires: zero open P0/P1; P2s explicitly dispositioned; no known regression in the reference slice.

## Evidence required
A quality claim requires at least one appropriate artifact: automated test, deterministic replay, screenshot/video capture, performance trace, save/reload proof, or human playtest record. CI green is necessary but is not visual/gameplay certification.

## Definition of done
A system is done when implementation + negative paths + integration behavior + player-facing presentation + evidence all pass. "Implemented" alone is not done.

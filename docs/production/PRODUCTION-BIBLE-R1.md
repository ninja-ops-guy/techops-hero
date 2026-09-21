# TechOps Hero — Production Bible R1
Status: Governing production contract
Baseline: main as of 2026-09-21
Purpose: converge the existing game to a consistent premium-quality release without uncontrolled feature expansion.

## 1. Product identity
TechOps Hero is a narrative pixel-art action RPG built around the contrast between a grounded aerospace-factory IT day shift and a heightened Night Crawler campaign. IT operations are gameplay, not background decoration. Every ticket is a dungeon: observe, investigate, hypothesize, execute, verify.

The game must preserve four pillars:
1. **Authentic TechOps fantasy** — workplace incidents, systems, people, consequences and investigation must feel causally coherent.
2. **Day/Night contrast** — Day is readable, human and operational; Night is dangerous, kinetic and cinematic. They share story/state but must not leak presentation or controls into one another.
3. **Evidence before action** — investigation and player understanding precede resolution; arbitrary interaction is a defect.
4. **Character-driven escalation** — Mike, Felicia and the supporting cast carry the campaign; systems serve the story rather than replace it.

## 2. Authority order
When sources disagree, use this order:
1. Explicit current production contracts in `docs/production/`.
2. Current executable behavior that has passed release qualification.
3. Story Bible / canonical campaign documentation.
4. Current art and UX specifications.
5. Historical reviews, gap analyses and concept documents.
6. Unintegrated concept art.

A current implementation that contradicts a higher authority is a defect, not new canon. Concept/reference sheets are never gameplay assets unless explicitly promoted by a production contract.

## 3. Core player loop
### Day
Arrive → orient/standup → explore → converse → inspect → use Mike's workstation at Mike's desk → accept/investigate work → gather evidence → resolve/verify → experience consequences → transition out of work.

Interaction semantics are spatial and explicit:
- NPC = talk.
- Mike's desk/workstation = workstation.
- Board/prop = inspect/use.
- Movement never implicitly invokes a workstation or dialogue system.
- Prompts must describe the action that will actually occur.

### Night
Enter authored transition → player-owned menu/choice → traverse → investigate → engage/avoid → combat or contextual action → resolve objective → consequence/recovery → return.

Player-owned waits and authored cinematics are valid states and must never be treated as hung startup.

## 4. World and narrative
AeroTech/New Haven is a believable workplace first. Workspaces communicate purpose through layout, props, lighting and NPC behavior. Prototype/debug material must not appear diegetically.

Campaign continuity must preserve the established Mike/Felicia arc, Sector 04 material, Night Walker/Night Crawler progression, K/Waldo/orbital-detention material, Good Dogs content and established endings. New lore requires an explicit canon change.

## 5. Character rules
Mike is the player anchor: readable silhouette, consistent proportions, no accidental pose/state borrowing across interactions. Felicia must read as a distinct character rather than a functional quest terminal. NPCs require stable identity, interaction radius, facing/pose behavior and dialogue ownership.

Animation states must have explicit entry/exit conditions. Workstation, conversation, combat, traversal and cinematic poses may not silently substitute for one another.

## 6. Art direction
The target is authored, high-fidelity pixel art, not generic retro decoration.
- Preserve deliberate pixel edges; avoid unintended filtering/scaling blur.
- Character scale and perspective must remain consistent within a scene.
- Foreground, interactable and background silhouettes must be distinguishable at gameplay speed.
- Lighting supports navigation and mood without obscuring interaction-critical information.
- Props must belong to the world and communicate function.
- Concept sheets, labels, grids and production annotations are non-diegetic by default.
- VFX must clarify state/action before adding spectacle.

Every new asset requires: gameplay role, canonical location, scale reference, palette/lighting fit, animation requirements where applicable, and acceptance screenshot.

## 7. Animation
Animation quality is judged by readability, responsiveness, silhouette and continuity.
Required categories: idle, locomotion, turn/facing, interaction, workstation, dialogue, traversal, combat, hit/recovery, contextual action and cinematic transitions.
No animation may make the player appear to perform a different action from the one the game accepted.

## 8. UI/UX
HUD exists to communicate actionable state. It must not compete with characters or cinematics.
- Context prompts are proximity + capability gated.
- Keyboard, pointer/touch and supported controller actions map to the same semantic command.
- Safe areas resolve independently per axis.
- Menus retain valid pointer targets across render frames.
- Touch targets remain usable in portrait/landscape where those orientations are supported.
- Debug/diagnostic surfaces are hidden from production players unless intentionally exposed.

## 9. Audio and cinematics
Audio states follow gameplay states rather than timers alone. Music transitions must not fight dialogue/cinematics. Important actions require appropriate feedback.
Cinematics must define ownership of input. Skip/advance behavior must be deterministic. Camera movement must preserve orientation when control returns.

## 10. Technical invariants
- Day and Night lifecycle state is explicit.
- Save/load cannot create impossible campaign combinations.
- Input ownership is singular for a frame/state.
- Script/resource preloading may be concurrent, but execution order remains deterministic where required.
- Capability checks beat UA/version assumptions.
- Recovery paths preserve player progress where safe.
- Production errors fail visibly enough to diagnose without exposing developer UI to players.

## 11. Performance and accessibility
Performance budgets must be measured on the supported-device matrix, not inferred from desktop development hardware. Frame pacing, startup, memory and input latency are release criteria.
Accessibility includes remappable/alternative inputs where supported, readable text, contrast review, motion/flash review, audio-independent critical cues and no progression gate requiring a single inaccessible input modality.

## 12. Change control
Until R1 certification, default disposition for new feature ideas is **defer**. A change may enter the release lane only if it closes a documented quality/correctness gap, is required for the vertical slice, or fixes a release blocker.

The goal of R1 is not more TechOps Hero. It is one coherent TechOps Hero.

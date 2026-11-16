# Companion and care staging — November 16, 2026

Candidate implementation on PR #130, following the owner's instruction to continue. This pass stages the existing continuity; it does not change Chapter 39, the housing decision, chapter prerequisites, survivor outcomes or the ship's passenger count.

## What appears during play

- **Low Quarter return:** Iona accompanies K in every room, using the existing candidate Iona atlas. Her separate position follows ordinary movement along the floor. She pauses in dialogue, faces her walking direction, and arrives alongside K on room transitions. K remains the controlled character.
- **Factory rescue:** K appears by the specification-floor rescue route when Mike reaches the Tarin stage. The existing K atlas is reused; it remains subject to its previously documented clear-glasses/likeness review.
- **Billy's care:** the return area shows one supported stretcher and a care-watch attendant after Tarin has been reached. Approaching it offers a read-only care inspection. Tarin's escort and receiving handoff remain separate. The attendant represents the established crew's care role, not an added passenger.

## Ownership and persistence

Iona's companion renderer accepts only visual position/facing/movement fields. It does not select the protagonist, copy combat state, grant abilities, attack, or write a character record. The normal playable Iona renderer retains its actor-ownership guard.

The follower position is transient presentation state inside the current Night expedition marker. Room loads and chapter resumes restage the two established travelers together; this is not a saved NPC simulation. Existing chapter position, progress and save ownership remain unchanged. Leaving removes the presentation state from the street. The existing expedition step owns follower motion, so menus, pause and hidden-page handling freeze it without another animation or simulation loop.

These are visual/story staging additions. Existing route checks and completion requirements are unchanged. The companion is not a new rescue target; no injury, separation failure or random named death is introduced.

## Asset status

Iona and K use existing candidate art. Billy's stretcher and attendant are code-drawn scene markers, with labels and an inspectable care description. They establish placement and scene responsibility; final character likeness, dedicated care poses and commissioned animation remain production work. No new image was generated, commissioned or promoted to final art in this pass.

## Validation

The existing Iona contract now verifies passive rendering under K's control without mutating the active actor or combat state. The production-page browser suite adds normal movement, facing, menu pause, room transition, save/resume and street cleanup checks, plus care-inspection timing and absence of quest/knowledge grants. Later-chapter and position fixtures are explicitly declared. Screenshots cover Iona/K together, K's rescue position, and Billy's care station in desktop, portrait and landscape layouts. Final receipts are under `docs/qa/fieldcraft/staging/`.

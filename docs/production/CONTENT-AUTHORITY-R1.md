# TechOps Hero — Content Authority R1
Status: Canon/content governance

## Classes
**CANON** — approved story, character, world or gameplay truth.
**PRODUCTION** — approved implementation/art asset intended for shipped gameplay.
**REFERENCE** — concept/spec/reference material used to guide production.
**EXPERIMENTAL** — prototype or test content; never assumed shippable.
**DEPRECATED** — retained for history but must not drive new work.

## Promotion rule
REFERENCE or EXPERIMENTAL material becomes PRODUCTION only through an explicit change that names:
- source asset/document,
- intended gameplay location/use,
- scale/perspective requirements,
- required cleanup/cropping/animation,
- acceptance evidence,
- canon impact if any.

File presence is not approval. An image being in the repository does not authorize rendering it in the game.

## Conflict resolution
Production contracts > qualified executable behavior > canonical story docs > current art/UX specs > historical docs > loose concepts.
If qualified code and canon conflict, open a defect/change decision; do not silently rewrite canon.

## Gameplay-content guard
Spec sheets, turnaround sheets, contact sheets, annotations, grids, labels, developer screenshots and QA captures are non-diegetic unless a specific scene intentionally calls for them as an in-world object.

## Deprecation
Do not delete historical evidence merely to remove authority. Mark or relocate it and point to the superseding contract. This preserves provenance while preventing stale guidance from re-entering production.

## Review question
Before integrating any content ask: "Would a player believe this object exists here for a reason?" If the answer depends on knowing it was a development reference, it does not belong in gameplay.

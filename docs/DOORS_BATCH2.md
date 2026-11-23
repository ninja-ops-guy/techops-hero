# Doors app presentation — Batch 2

## Scope

Plating is the first presentation priority. Its authored HMI cabinet, local
Services dependency chain and Connection Test distinguish observed workstation
health, controller reachability, applied repair and verified integration session.
The existing persisted operator-hold flag is visible; the same transaction owner
still gates the service change. Technical success does not witness the operator's
production task or close the work order.

Security's Badge Log has a reader/door hardware-reference illustration and one
existing Event Log entry: 02:13, SECTOR04-EAST, ACCESS GRANTED. The access grant and
uncorroborated physical presence are presented separately. No badge identity,
cause, additional timestamp or resolution is added. Viewing the app is read-only;
the existing Review access event action owns the canonical partial badge fact.

Doors uses distinct application icons, its approved existing AeroTech crest,
station-specific desktop labels and Prompt input/output/error rows. Commands
remain local and whitelisted. Window controls, focus containment and keyboard
ownership are preserved. Plating/Security resources load on first station inspection, and Prompt loads on
first app entry, preserving the existing startup script and byte budgets. No new
game state, listener, frame loop or dependency is
introduced by the Plating and Security renderers.

Batch 1 owns Shipping, the laptop dock and shared completion layout. This branch
changes only their common shell appearance. Desk art, clerk matching and floor
props remain Batch 3. No sibling PR or siege implementation is included.

## Validation

The production gate registers the Plating, Security and shell contracts. Existing
Day integration loads the new helpers and continues to exercise failed-save hold
rollback, repair gating, requester closure and read-only Security navigation.

`Day device experience` checks out the pull request head. It runs the full Node
production gate and the fixture-assisted Day UI flow at 1280×800 desktop,
390×844 touch, 320×568 touch and 844×390 touch, with reduced motion. Coverage adds
all Plating stages through the real requester witness, the existing Security
clue, Prompt Enter/Run/error/cls/Tab/Shift+Tab/Escape, window controls, 44px targets,
unobscured control centers and horizontal-overflow checks.

Each browser report records head/tree/run/attempt and 17 source hashes before
and after the run, with screenshots and source-immutability enforcement. Approach
fixtures place Mike at authored walkable tiles; they never seed incident evidence,
repair, hold, test or closure outcomes. This is not a complete unassisted campaign
run, physical iPhone/Safari qualification or audible soundtrack certification.
Hosted results and exact candidate are recorded in the PR after execution.
If a station art resource fails to load, the existing equipment/app presentation
remains usable until reload. Prompt loading failures allow reopening the app.

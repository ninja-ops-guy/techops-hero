# TechOps Hero: feature roadmap review and next implementation lanes

Reviewed base: `2fec15c355a4f0838deb534b9ed7ba5910bfd1a5` (main, after PR #21).

This is a scoped feature audit, not release certification or a claim that every
historical feature has been exhaustively playtested. Story and release authority
remain in `DOC_AUTHORITY.md`, `PRODUCTION_BASELINE_v1.2.md`,
`RUNTIME_AUTHORITY.md`, and `PRODUCTION_READINESS.md`.

## The roadmap is not literally complete

The README's historical "every planned feature has shipped" statement does not
certify the current Story Bible baseline. `GAP_ANALYSIS.md` is useful for locating
ideas, but its old missing-feature list and shipping verdict are not current facts.
For example, recent Good Dogs chronology, local co-op, pair puzzles, durable saves,
and larger movement controls are already merged; do not implement them again.

The production baseline/readiness documents also identify existing Day 1,
Sector 04, Acts II–III, MORNINGSTAR, and Felicia progression contracts. These should
not be relabeled wholly absent based on old plans. Conversely, executable semantic
contracts are not proof of finished, unassisted, physical-device gameplay.

## Prioritized status

| Priority | Work | Evidence/status | Next action |
| --- | --- | --- | --- |
| P0 release | Unassisted opening and Good Dogs completion on physical devices | Still required by current readiness and recent merged PR scopes | Record exact-head iPhone Safari and desktop playthroughs; preserve failures, not only seeded encounters |
| P1 implemented here | Day 1 ticket-history review | Native QUEUE previously showed ownership only; canonical tickets, verificationHistory, humanOutcomes and source records already existed | Casebook exposes those records with an attention filter and bounded event review |
| P1 implemented here | Outcome-aware office follow-ups | Native TEAMS repeated fixed morning complaints; completed contacts always said "Already verified" | Shipping/Plating/Security now reference saved outcomes without inventing restoration or first-hand evidence |
| P1 in progress elsewhere | Contextual Night Crawler combat | PR #20 is open at review time; grabs, throws, rhythm and air follow-ups already have an implementation branch | Integrate and validate that work rather than duplicating it |
| P1 art | Dedicated dog walk/start/stop/landing animation | Current art review and recent PR scopes retain uncertified/quarantined walk candidates | Correct and visually review source poses before enabling them; do not relabel old frames |
| P1 presentation | Later orbital environments and film/gameplay continuity | KNOWN_ISSUES and CINEMATIC_COHESION_V1 retain fallback/pipeline work | Author/review the missing layer compositions and unassisted scene transitions |
| P2 systems | Measured mobile performance and hook consolidation | Current readiness retains device measurements and staged historical-hook retirement | Measure real devices; retire one behavior cluster with parity tests at a time |
| P2 extension | Full procedural/late-campaign office memory and recurrence investigation | Not implemented by this pass | Extend from explicit outcome records; keep provenance and reveal timing separate |

Prioritization used frequency of player exposure, connection to the core human-first
IT loop, current evidence of a gap, regression risk, and overlap with active work.
This pass selects two bounded gameplay improvements rather than manufacturing new
art, another boss, a second combat implementation, or a release-ready verdict.
Physical-device acceptance remains more urgent for release, but cannot be supplied
by a code change or a simulated input fixture.

## Implemented: ticket casebook

Open **Mike's workstation → QUEUE or TEAMS → Review ticket history**.

- Review the three canonical Day 1 cases, or filter to work needing attention.
- See assigned owner and recorded completion owner separately.
- See technical resolution, verification strength, and human outcome separately.
- Review recorded assignment, verification and closure events; at most eight are
  displayed, with the full count shown. Missing timestamps/history stay unknown.
- Inspect the badge report's saved source perspective without upgrading delegated
  work to first-hand knowledge. It remains documented/unresolved, never a closed
  printer-style ticket.
- Reopen a record after a save/reload to see fresh state. The read model also
  survives the canonical Tuesday transition without a new save namespace.

This is a Day 1 casebook, not a complete procedural ticket archive, an attack
reconstruction minigame, or a new re-verification mechanic. Existing workstation
navigation owns access; this change adds no global HUD control or new keybinding.

## Implemented: office follow-ups

TEAMS derives Shipping, Plating and Security updates from the same records. Revisiting
a completed Shipping/Plating contact shows a contextual follow-up and a record link.
Partial verification, degraded/unmet service, and conflicting outcomes remain
follow-up work; they cannot render as verified restoration. The wording does not
claim that Mike personally witnessed delegated work.

Revisiting an already documented badge report is read-only. It no longer replaces
its source perspective from the current owner or appends duplicate review events.
First-time evidence capture and ordinary ticket-resolution semantics are unchanged.

## Authority and compatibility

All behavior lives in the existing `campaign_native_act1.js` presentation authority.
There is no new numbered hook, duplicate story authority, asset, timer, reward path,
save version, or persistence namespace. The five workstation tabs remain unchanged.

The casebook reads allowlisted fields, not raw future-story history or the hidden
hypothesis catalogue. Strings from saved records are escaped before HTML rendering.
Corrupt/unavailable storage shows a recoverable message without replacing progress.
A read-only visit never clocks in, reopens/closes a ticket, writes evidence, or
changes the campaign's human outcome.

## Validation and remaining acceptance

`node test_campaign_casebook.js`: 20 focused executable tests pass locally, using
byte-verified copies of the actual Campaign Director and native adapter in isolated
VM contexts. Coverage includes UI callback reachability, the six valid
verification/outcome combinations, provenance, outcome conflicts, cold reload,
Tuesday persistence, stale callbacks, repeated reads, HTML escaping, old history,
and unavailable storage. Syntax checks pass.

`test_campaign_casebook.js` is included in the aggregate production release gate.
Full-repository CI and actual browser/device acceptance are separate requirements;
local VM callback tests do not establish layout, touch ergonomics, video decoding,
full campaign traversal, or production performance. No tests were relaxed and no
art quarantine was changed.

## Important remaining opening work

The native `resolveTicket` adapter still uses the existing direct strong/restored
completion path for a first-time Shipping/Plating contact. This pass fixes the
false repeat-visit claim and surfaces provenance; it does not replace that adapter
with a new multi-step investigation. A future opening-depth pass should establish
which live runtime route owns questioning, competing hypotheses, field verification
and persistence before changing it, then prove the full route with real input.
Do not call the new read-only casebook that missing investigation mechanic.

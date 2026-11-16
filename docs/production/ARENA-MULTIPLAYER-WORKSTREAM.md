# Night Walker multiplayer workstream

Dedicated parallel-agent session, started 2026-11-16. This workstream is separate
from the RESIDUAL room. StarNet remains offline and OpenBot is not represented as
a live deputy. No merge, deployment, public hosting, purchase, or release is
included. Existing PR #126, security, art and physical-device approval gates stay
in place.

## Exact input and ownership check

GitHub inspection established:

- Accepted main `932f5c19586cb157921a1db1ebfe25f3f13601c0`.
- Draft #135 `7fe5d31919bfe204e80c46b5dd74baaa65689cb0`, branch
  `codex/night-character-skills`.
- Draft #136 `bde9909f789fd8d24229d16d01c6681bc6757903`, branch
  `codex/arena-pvp-prototype`, already stacked on that #135 head.
- Fresh follow-up found sibling draft #137 at `db996700171acf904c28964620faecb2768b4056`,
  based on #135. Its seven changed files cover campaign special cancels/Uzi
  cover, cache references and documentation/tests; none overlap this Arena-owned
  foundation. It is not included here. Future move ports must reconcile those
  fixes and independently qualify the selected combined source.
- Both PRs had no GitHub assignees or discussion comments at inspection. That is
  not proof that the author has no local work. Existing branches are therefore
  preserved. Draft #138 at `2b886ed14cf5086546e16cf1559425acb1b35274` is preserved.
  This follow-up uses `codex/arena-core-contract` and only
  Arena-owned source, tests, qualification tooling and documentation.
- Open PRs #128–#135 and the separate #131/#134 lanes retain their existing
  source ownership. Campaign modules, save schema, story flags and approved
  canon assets are not edited by this foundation successor.

ORPHEUS is the integration owner. All shared simulation, network protocol and
server edits pass through this owner. No downstream agent may independently
change those interfaces. Integration is onto the isolated successor, never main.

| Actual lane | Owned files | Result / next dependency |
| --- | --- | --- |
| `arena_simulation` | `arena/simulation-regression.test.cjs`, combat migration contract | Numerical baseline, deterministic replay and slot-symmetry regressions; shared-core proposal awaits implementation |
| `arena_sessions` | `arena/session.test.cjs` | Lifecycle, terminal result/retention and stale input regressions |
| `arena_security` | `arena/security.test.cjs` | Local trust, budgets, body/schema/token and room-capacity regressions |
| `arena_experience` | `arena/client.js`, `arena/client.test.cjs`, experience acceptance plan | Input ownership, finite requests, transient-error recovery, phase-aware polling |
| `arena_independent_review` | Read-only independent inspection/tests | Reviews integrated source; findings return to integrator |
| ORPHEUS / integration | `arena/server.cjs`, `arena/simulation.cjs`, runner/package/workflow, workstream and qualification receipt | Combines reviewed changes and verifies exact combined source |

Each author used an isolated worktree/branch. Source hashes and retained negative
baseline results belong in the qualification receipt. A result from a sibling
branch is not an integrated PASS until rerun on the combined candidate.

## Backlog and dependency order

The table is a work queue, not a completion claim. The named lanes above are the
workers started for Wave 1; future-wave owners below are roles awaiting bounded
dispatch, not claims of active agents.

| ID | Wave / role | Scope and required evidence | State |
| --- | --- | --- | --- |
| 1 | W1 integrator + simulation | Pure fixed-step, multi-fighter rules shared through reviewed adapters; replay and campaign regression coverage | Versioned Node/browser Arena core and strict checkpoints implemented; campaign adapter remains separate |
| 2 | W2 moves | Directional light/heavy punches and kicks, aerials, launchers, grabs/throws, bounded juggles; both-slot parity/no infinite stun | Blocked on #1 interface and authored move data |
| 3 | W2 movement | Slides/cancels, gravity cancel, dash and aerial recovery; server-owned timing/resources | Blocked on #1; campaign behavior remains separate |
| 4 | W2 specials | Mike/K, Iona nunchucks/Uzi, Felicia violin/Kali; costs/ownership/collision/counterplay | Reference values inspected; PvP port awaits #1 |
| 5 | W2 network | Buffered frames, transport replacement, prediction/reconciliation/interpolation; evaluate rollback using impairment measurements | HTTP polling remains; versioned seven-control frame contract implemented; prediction/transport pending |
| 6 | W1 sessions, then W2 recovery | Leave/timeout outcomes, bounded cleanup, no duplicate seats; reconnect/seat recovery | Foundation repaired; authenticated reconnect still absent |
| 7 | W1 security, then W3 review | Validate actions/controls, origins/tokens/rates/replay; public admission and abuse limits | Local controls tested; public occupancy/load qualification open |
| 8 | W2 lobby | Selection/loadouts/readiness/private invites/results/rematches without developer tools | Prototype flow present; loadout and full flow qualification await #4/#6 |
| 9 | W1 baseline then W2 balance | Damage/reach/recovery/Focus/mobility/matchups; normalize campaign stats; Uzi vs Flurry | Equal-stat numerical baseline recorded; specials matchup data missing |
| 10 | W1 visual plan then art lane | Replace geometric fighters, readable windups/hits/block/warnings/player IDs; K clear glasses | Acceptance and asset plan only; creator visual approval required |
| 11 | W3 device/accessibility | Simultaneous touch, orientations, controller and HUD; physical iPhone separate | Input-source repair; full device/controller qualification open |
| 12 | W3 independent QA | Full matches/rematches, latency/jitter/loss/server stalls/room churn | Deterministic checkpoint/protocol checks plus Node/browser parity harness; real network/endurance outstanding |
| 13 | W3 operations | Packaging/TLS/origins/health/logs/capacity/costs/rollback | Local origin configuration and CI only; deployment not authorized |
| 14 | Integration + independent QA | One exact candidate, full regressions and preserved campaign saves | Core successor to draft #138 only; full multiplayer release remains HOLD |

## Next bounded dispatch

The bounded core contract in `ARENA-CORE-CONTRACT-V1.md` was independently
reviewed and frozen before implementation. It supersedes the broader migration
proposal for this extraction only. The current continuation has isolated owners:

| Lane | Exclusive files | Dependency / result |
| --- | --- | --- |
| Integration | `arena/simulation.cjs`, explicit server module routes, package/workflow, workstream | Same physics for legacy server and strict portable core; atomic checkpoints and deterministic events |
| Input | `arena/input-contract.js`, `arena/input-contract.test.cjs` | Frozen seven-key current-tick frame contract; both frames validate before normalization |
| Checkpoint review | `arena/core-checkpoint.test.cjs` | Independent malformed-data, clone, terminal and edge-history regressions |
| Replay review | `arena/core-replay.test.cjs` | Legacy/strict value parity, event identities and replay checkpoints |
| Browser parity | `scripts/arena_core_browser.mjs`, `arena/core-parity-fixtures.cjs` | Real Node/Chromium/WebKit execution of the same modules; no copied physics |
| Independent review | Read-only source and test review | Exact integrated candidate reviewed after authors finish |

No new campaign controls, specials, prediction, reconnect credentials or public
hosting are included. The raw HTTP render snapshot is deliberately not a restore
checkpoint. Strict restore validates data but grants no room/session authority.

Next: qualify this exact core successor, then reconcile #137's changed combat
source with authored move requirements before dispatching move/movement/special
ports. Session recovery and presentation planning remain independently assignable
only with exclusive files and current ownership checks. Campaign save/reward
code must stay outside portable rules. Integration owns shared runtime changes.

Every dispatch records: exact base/head, owned files, input/output contract,
acceptance command, reviewer, blocked dependency and next checkpoint. No ACK or
chat message counts as completed execution. Reports include actual logs, exit
codes and explicit local/browser/physical boundaries. Failure details are
preserved when corrected. Branch changes trigger dependency and overlap checks
before further edits.

No watcher or always-on agent is installed by this document. Continuation is via
this separate session's parent ORPHEUS task and actual delegated worker results.
The parent must arrange a supported follow-up if execution yields; a skill alone
does not monitor anything while inactive.

After stable and reviewed 1v1 only: plan 2v2, friendly fire, support roles,
pickups and Breach objectives. These are not in the current implementation.

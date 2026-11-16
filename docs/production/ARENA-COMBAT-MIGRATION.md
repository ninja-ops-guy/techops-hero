# Arena combat migration: Wave 1 contract and baseline

Status: **review proposal plus executable regression evidence**, November 16, 2026.
This file does not claim multiplayer move parity or release qualification.

## Reviewed revisions and ownership

- PR #136: `bde9909f789fd8d24229d16d01c6681bc6757903`.
  Source: `arena/simulation.cjs`, `arena/server.cjs`, `arena/client.js`,
  `arena/test.cjs`, `docs/production/ARENA-PVP-PROTOTYPE.md`.
- PR #135: `7fe5d31919bfe204e80c46b5dd74baaa65689cb0`.
  Source inspected through the GitHub connector: `night_combat.js`,
  `night_combat_input.js`, `night_hooks.js`, `night_progression.js`,
  `iona_nightwalker.js`, `test_night_directional_physics.js`,
  `test_night_movement_combos.js`, `docs/production/NIGHT-CHARACTER-SKILLS.md`.
- Regression lane branch: `codex/arena-wave1-simulation-tests`, based on the
  exact PR #136 revision above. This lane owns only
  `arena/simulation-regression.test.cjs` and this document.
- The parent integration owner is the sole editor of shared simulation,
  protocol, exported state and central scripts. Other lanes must declare their
  branch, dependency revision and file list before editing. File lists below
  are proposed boundaries, not grants to edit another lane's files.

No merge, deployment, paid asset generation or live-deputy activation is
part of this lane. Existing security, spending, release and PR #126 approval
gates remain in force. StarNet stays offline; OpenBot is not a qualified live
deputy. Campaign facts and save schema remain unchanged.

## Implemented in the pinned arena source

The arena core is a 60 Hz mutating state machine with no wall clock, random
numbers, campaign imports or storage calls. Inputs are allowlisted booleans.
Contacts are collected before damage resolution, allowing simultaneous damage
trades. The current server sends snapshots and the client renders those
snapshots; they do not yet execute one shared prediction implementation.

The four roster names have identical match statistics. There are no character
specials, directional move variants, grabs, throws, air juggle rules, slide,
gravity cancel, progression bonuses or focus spending in this arena revision.
Jumping players use the same punch/kick contacts as grounded players.

### Numerical 1v1 baseline

| Property | Current value / observed rule |
| --- | --- |
| Simulation | 60 ticks/s; exactly one step per `step` call |
| Stage | Width 960; fighter center clamped to x=20..940; feet at y=360 |
| Spawn | x=310 / 650; face=+1 / -1 |
| Health / focus | 100 HP; focus starts 0, clamps to 0..100 |
| Countdown / round | 180 ticks / 5,400 fight ticks (90 nominal seconds) |
| Match | First to two won rounds; tied HP produces a draw with no score |
| Run / block movement | 240 / 80 world units per second |
| Jump | Two jump edges per airborne sequence; each sets vy=-420 units/s |
| Gravity | +1,100 units/s², integrated before position each tick |
| Dash | 780 units/s for nine active ticks, 117 units total; cooldown set to 36 ticks |
| Light | 10 damage; contact on attack tick 7; reach <=62; cooldown set to 23 |
| Heavy | 18 damage; contact on attack tick 14; reach <=82; cooldown set to 38 |
| Contact geometry | Forward half-space; absolute feet-height gap <48 |
| Block | Front-facing only, no active attack or stun; 2 chip damage |
| Focus | Attacker +8 on hit / +2 on block; defender +4 on block / -15 on hit |
| Hit reaction | 12 stun ticks, attack cleared, horizontal velocity set to attacker face ×180 |
| Stun movement | Each subsequent stunned tick multiplies horizontal velocity by 0.8 |
| Reset | Round reset restores health/focus/position/input; preserves score and roster |

Startup includes the activation step. An attack remains present until the step
that decrements its cooldown to zero; input acceptance happens before that
clear. Thus fresh attacks cannot be accepted until tick 25 after a tick-1 light
or tick 40 after a tick-1 heavy, and require a new press edge. This is observed
behavior, not a balance recommendation. Held attacks do not repeat. The engine
has no body collision, dash invulnerability or separate block stun. Equal-health
draws can extend a match indefinitely.

### Independently reproduced defect

At the pinned PR #136 revision, place fighters at x=400/450 after countdown,
set both focus meters to the same value, press punch for both and step seven
frames. Health is `[90,90]` and stun is `[12,12]`, but focus differs by slot:

| Initial focus each | Actual focus | Proposed order-independent result |
| --- | --- | --- |
| 0 | [0,8] | [0,0] |
| 7 | [0,8] | [0,0] |
| 50 | [43,43] | [43,43] |
| 100 | [85,93] | [93,93] |

Cause: contact 0 awards its attacker and clamps its defender's loss before
contact 1 performs the reverse operations. Saturation therefore depends on
iteration order. Minimal remedy proposed to the integration owner: accumulate
focus deltas for each fighter, then clamp each meter once after all contacts.
For a trade the net delta is +8-15. Keep existing contact collection, damage,
block predicate, hit stun and interruption behavior unchanged. This test lane
does not edit the simulation implementation.

## Smallest safe shared-core boundary

Keep the standalone arena state authoritative. First extract/extend its pure
rules and state transitions, with a serializable ruleset that the server and
prediction client execute identically. Copy reviewed move definitions with
explicit provenance into arena-owned definitions; do not import the whole
campaign combat runtime or change the campaign to consume the new core in
this phase.

Direct campaign import is unsafe because:

- `night_combat.js` resolves the actor through game, Linked and Living World
  globals and reads progression and equipment at contact time.
- Combat uses millisecond timestamps while player/enemy movement uses
  60 Hz frame-unit velocities. Player physics is in `night_hooks.js`;
  action gestures and queued jumps are in `night_combat_input.js`.
- KO damage invokes random cash rewards, progression, clear checks, audio and
  presentation hooks. UI timers read performance/wall clocks.
- Target, grab, follow and multi-hit attack state contains object references;
  IDs are allocated from a module-global enemy counter.
- Blocking and hurt are asymmetric PvE rules; copying their values is not a
  validated PvP balance design.

The first extraction boundary is therefore **move selection + move data +
contact/reaction state**, with explicit fighter IDs, state-owned counters,
tick deadlines, and emitted events. Platform, movement, grab and projectile
state can then extend that same boundary. Rendering/audio/rewards remain
consumers of events, never callbacks inside a deterministic step.

## Proposed versioned interface

This API is a proposal for the integration owner; the pinned revision still
exports `HZ, KEYS, ROSTER, create, input, step, next` only.

```js
// All specs are validated before createMatch; 1v1 only in this phase.
createMatch({
  schemaVersion: 1,
  rulesetId: 'arena-v2',
  fighters: [
    {id: 0, character: 'mike', loadout: ['mike-breaker', 'mike-sweep']},
    {id: 1, character: 'k', loadout: ['k-rise', 'k-descent']}
  ]
}) -> MatchState

// Exactly one integer simulation tick; no caller dt or wall-clock dependency.
// Mutates state and returns a bounded list of events for this tick.
stepMatch(state, [inputForFighter0, inputForFighter1]) -> CombatEvent[]

// InputFrame: {tick, buttons}; tick must equal state.tick + 1.
// buttons is a validated bitmask of the following held controls:
// left, right, up, down, jump, light, heavy, block, dash, grab, special1, special2.
// Opposing directions cancel; actions use rising edges against state.previous.

snapshot(state) -> JSON-safe CompleteSnapshot
restore(CompleteSnapshot, expectedRulesetId) -> MatchState
nextRound(state) -> boolean
```

Rules to make this interface exact and reviewable:

1. Use stable fighter/entity IDs, integer ticks, a ruleset/version identifier,
   state-owned entity/event counters, and fixed iteration order. No closures,
   object references to another entity, DOM, save APIs, global equipment,
   random values or timestamps belong in a snapshot. Position and velocity
   units are explicitly world units and world units/second. Initial support
   can retain the current JS numeric integrator; cross-engine parity must be
   tested before claiming it. Fixed-point conversion is a separate decision.
2. A complete snapshot includes previous input buttons, pending attack state,
   timers, per-target hit counts, grapple relationships, cooldowns, focus,
   projectiles and round state. Public render snapshots may omit internals;
   prediction/rollback cannot restore from the current public snapshot, which
   strips previous inputs. Never include session bearer tokens in simulation
   snapshots or events.
3. The network layer owns packet sequence numbers, authenticated seat mapping,
   input queue bounds and late/duplicate/future frame policy. It supplies one
   frame per fighter per tick. Missing accepted frames use a documented neutral
   frame for the initial version. The client adapter retains a short tap for
   at least one frame and a release frame before another press. An HTTP send
   is not itself a simulation frame.
4. Each tick proceeds: normalize frames; decrement timers; accept actions;
   integrate all bodies; collect all contacts from the same state; resolve
   outcome deltas together; apply clamps and reactions; advance round state;
   emit events. The immediate Wave 1 focus fix changes only focus clamping;
   full simultaneous reaction priority is a later explicit contract.
5. Proposed action priority for conflicting new action edges: held grab throw,
   grab, special1, special2, heavy, light, dash, jump. Mutually exclusive
   actions accept at most one per tick. This is a proposal requiring integration
   review; it must not silently replace the current dash/jump/attack behavior.
6. Each `CombatEvent` has `{id, tick, type, sourceId, targetId?, moveId?, data}`.
   Event IDs remain stable during replay; effects consumers deduplicate them.
   Event payloads contain finite numbers and known enum values. They do not
   award campaign XP, money, inventory or story access.

One integration-owned CommonJS/browser-compatible module or deterministic
build artifact must execute the same rules in Node and browser. Avoid separate
client copies of formulas. Exposing a browser module needs a reviewed explicit
static route and CSP-compatible load path; it is not a reason to expose the
repository directory.

## Campaign move reference, not approved PvP balance

The following PR #135 values are raw campaign base values, before stat,
equipment and passive multipliers. `recovery` is the total attack duration
from activation, not a post-contact duration. They have not been ported to the
arena. Suggested time conversion for an initial port is `ceil(ms * 60 / 1000)`;
record each converted value and keep contact ordering. Do not scale distances
implicitly from the campaign's 1,800-unit stage to the arena's 960-unit stage.

| Move | Damage | Reach | Contact ms | Total duration ms | Focus |
| --- | ---: | ---: | --- | ---: | ---: |
| Jab / cross / launcher | 14 / 18 / 24 | 76 / 76 / 80 | 70 | 230 | 0 |
| Uppercut / low | 20 / 12 | 82 / 76 | 80 / 65 | 270 / 210 | 0 |
| Kick / rising kick / sweep | 22 / 26 / 16 | 104 / 94 / 96 | 100 / 110 / 90 | 300 / 320 / 300 | 0 |
| Air light / air kick / air slam / air down light | 14 / 18 / 22 / 12 | 112 / 102 / 98 / 96 | 70 / 70 / 85 / 50 | 230 / 230 / 260 / 180 | 0 |
| Iona bicycle kick | 6 per contact | 108 | 75,145,215 | 340 | 0 |
| Mike breaker / sweep | 32 / 26 | 105 / 115 | 170 / 140 | 500 / 450 | 30 / 35 |
| K rise / descent | 24 / 30 | 110 / 110 | 100 / 110 | 390 / 440 | 30 / 40 |
| Iona flurry / burst | 7 per contact | 135 / 380 | 80,150,220 / 100,190,280 | 410 / 530 | 30 / 50 |
| Felicia sweep / precision | 18 / 28 | 125 / 140 | 100 / 80 | 340 / 330 | 25 / 40 |
| Felicia violin notes | 9 per projectile | 420 travel | 100,230,360 releases | 580 | 35 |
| Felicia Kali missile | 52 | 550 target selection | 900 | 1,120 | 70 |

Additional migration constraints:

- Current campaign chain window is 900 ms, on-beat window 260..500 ms, attack
  buffer 65 ms, grab lifetime 1,600 ms, minimum hold before throw 120 ms,
  and a maximum of three follow-up aerial hits. Air hits must not reset when
  another launcher connects. An air grab consumes the remaining juggle and
  locks the target; landing clears the sequence after recovery.
- Throw base damage is 16 up / 22 down / 24 sideways; landing slam adds 8.
  Current crowd collision adds 18 and wall impact adds 8. These PvE collateral
  effects require deliberate team/friendly-fire rules before 2v2.
- Campaign dash is 9.5 units/frame with 10 frame duration, 42 frame cooldown
  and 12 frame invulnerability. Slide is 7.2 units/frame, 500 ms lifetime,
  100 ms cancel startup, 48 frame shared cooldown and no invulnerability.
  Gravity cancel lasts 180 ms, spends 60 frame dash cooldown, is once per
  airtime, and can cancel an attack only after confirmation and all contacts.
- Campaign player jump velocities -10.4 / -8.8 units/frame and gravity
  0.48 units/frame² differ materially from arena physics. At 60 Hz their
  converted values are -624 / -528 units/s and 1,728 units/s². Enemy aerial
  gravity is separately 0.43 units/frame² (1,548 units/s²).
- Campaign on-beat damage adds 3 to the first contact; light focus adds 8 plus
  4 on beat. Hurt subtracts 25 focus versus arena's 15. Character passives and
  saved stat bonuses must not leak into normalized online loadouts.
- Felicia notes travel at 700 units/s with swept collision and a maximum of
  six live notes. Kali locks a position at activation, telegraphs 900 ms, and
  hits within horizontal/vertical radii 85/60; moving away must avoid impact.
  Preserve these names and gameplay identities without claiming new canon.

## Dependencies and file boundaries by lane

| Lane | Owned files proposed for later implementation | Dependencies / acceptance |
| --- | --- | --- |
| Integration | `arena/simulation.cjs`, new `arena/protocol.cjs`, shared rules/state exports, central package/CI registration | Review all interface changes; integrate exact lane commits; no merge/deploy |
| Simulation regression (this lane) | `arena/simulation-regression.test.cjs`, this document | Exact PR #136 base; red tests become green only after reviewed core fix |
| Move kit | New `arena/moves.cjs`, `arena/moves.test.cjs` | Versioned core contract; directional/air/contact windows and grab/throw/juggle invariants; coordinate core hooks with integration |
| Movement | New `arena/movement.cjs`, `arena/movement.test.cjs` | Integration state/tick units; collision and cancel rules; no direct shared-file edits |
| Specials | New `arena/specials.cjs`, `arena/specials.test.cjs` | Move/reaction/juggle APIs; all four ownership/cost rules; Felicia projectile/telegraph contract |
| Session reliability / networking | `arena/server.cjs`, new session/input-queue tests; client transport adapter after file split | Protocol version and frame contract; one owner for server edits; integration reviews snapshots/tick scheduling |
| Lobby / mobile / accessibility | Client UI files after integration-approved split | Session states and input adapter; keyboard/touch equivalent intent; no campaign module imports |
| Balance | Review-only tables and reproducible match traces until approved tuning | Exact ruleset, all move data, exploit/advantage matrix; separate proposals from observed metrics |
| Visuals | Arena renderer/assets after client split | Event/pose contract; no hit rules in animation; spending approvals before asset generation |
| Security / endurance / operations | Bounded tests and documentation; source findings routed to owner | Exact assembled SHA, transport/schema limits, network faults, long-session bounds, hosting gate |

`arena/client.js` and `arena/server.cjs` are current monoliths and must not be
assigned to multiple simultaneous editors. Move definitions, protocol masks
and state schema also need one integration owner even when contributed by
specialists. Read-only review can proceed while dependent implementation waits.

## Acceptance and evidence ledger

Independently executed locally on PR #136 source
`bde9909f789fd8d24229d16d01c6681bc6757903` with the new regression file:

```sh
node --test arena/simulation-regression.test.cjs
```

Runtime: Node v24.22.1. The four pure simulation tests from the existing
`arena/test.cjs` also passed with its server test excluded by test-name pattern;
network/server acceptance belongs to the session lane. Syntax validation passed.

Observed: **14 tests; 11 pass; 3 fail**, all three failures are the focus
saturation cases above. No skipped/TODO tests. The suite verifies 1,200-tick
replay with complete JSON restore; identical roster base statistics; exact
countdown and fight clock; light/heavy startup and held-input bounds; front and
back block; reach/facing; movement/dash distance; single-hit focus; simultaneous
HP/stun/interruption; and draw/round reset. The red result is intentional proof
of a defect, not acceptance of the simulation. Integration must rerun this
suite and existing `node --test arena/test.cjs` on its exact corrected revision.

Future gates, not executed or claimed here:

1. **Core parity:** replay the same recorded frames in Node, Chromium and
   WebKit; compare complete state hashes each tick. Restore midway through a
   multi-hit, grab, projectile, hit stun and round transition. Swap player
   slots and reflect geometry; all combat outcomes must mirror.
2. **Moves:** all directional ground/air attacks; exact startup/active/recovery;
   hit/whiff/cancel; behind/out-of-range/vertical rejection; block and trade
   policy; grab versus grab/strike conflict; throw direction; three-hit juggle
   cap; no relaunch reset, infinite hold or repeated per-target hit.
3. **Movement:** two jumps; landing reset; dash/slide cooldown sharing; no
   gravity-cancel reset before landing; confirmed-hit cancel only; no extra
   jump or invulnerability; stage edges and platforms under replay.
4. **Specials:** all ownership, stance, focus and lock checks; whiff spends once;
   rejected action spends nothing; specials do not self-refund; per-target
   multi-hit bound; projectile swept collision; Kali telegraph and escape.
5. **Networking:** duplicate/stale/future/reordered input; short taps and
   release edges; input starvation; neutral on timeout; reconnect while in
   attack/grab/round transition; prediction correction without duplicate FX;
   measured latency/jitter/loss under documented conditions.
6. **Save/canon isolation:** byte-identical campaign storage sentinel around
   create/join/play/leave/reload; no campaign save writes or XP; existing
   production gate and save migration fixtures on assembled SHA. Campaign
   schema 6 and `techops_hero_campaign_v1_2` remain owned by campaign code.
7. **Release qualification:** exact commit plus reproducible logs, browser and
   physical-device evidence, no unresolved security blocker, release-policy
   gates satisfied and explicit approvals. Local unit success is insufficient.

Only after stable, qualified 1v1: design 2v2 fighter arrays/team IDs, friendly
fire policy, support roles, pickups and Breach objective state. Require bounded
entity counts, deterministic target ordering, assist attribution and separate
team fixtures before implementation. Do not generalize current two-slot
assumptions silently or describe this future plan as shipped behavior.

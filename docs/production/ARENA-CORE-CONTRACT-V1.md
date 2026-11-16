# Arena core contract v1 — FROZEN FOR IMPLEMENTATION

Reviewed candidate: `c028df9d235d45fe2cd115e809138b97cf3fd6a1`. Integration,
independent contract and security reviewers passed the bounded API/schema,
atomicity and legacy boundary; current-tick clarification below was approved.
**Frozen design; implementation and acceptance evidence remain pending.**
Baseline draft #138: `2b886ed14cf5086546e16cf1559425acb1b35274`, tree
`fd1eab42a4868545ca048493ed7643a64516cf9e`. #137 remains separate. This bounded
contract takes precedence over the broader migration proposal for core extraction.

## Scope and ownership

Exactly two normalized fighters (`mike`, `k`, `iona`, `felicia`), seven existing
controls, and #138 rules only. No balance, campaign or save changes. Directional
attacks, specials, grabs, loadouts, teams and all future fields are rejected.
Integration owns `arena/simulation.cjs` (UMD core, snapshot/events and legacy API).
After freeze, the session lane owns `arena/input-contract.js` (UMD definitions
and frame validation); independent test lane owns `scripts/arena_core_browser.mjs`
and separate tests. This lane owns only this document. No merge or deployment.

## Exact exports and interface

Input module: Node `require('./input-contract.js')`, browser
`globalThis.ArenaInputContract`. Export frozen `KEYS`, `BUTTONS`,
`ALL_BUTTONS_MASK=127`, and `normalizeFramePair(frames,tick,round)`.
KEYS order and BUTTONS values are `left:1,right:2,jump:4,punch:8,kick:16,block:32,dash:64`.
Normalization validates both frames before returning two fresh seven-boolean maps.
Arguments tick/round are current state values; expected frame tick is tick+1.
This helper itself preflights overflow (ERR_ARENA_COUNTER), even for [null,null].

Core: Node `require('./simulation.cjs')`, browser `globalThis.ArenaSimulation`.
Export `HZ=60`, `SCHEMA_VERSION=1`, `RULESET_ID='arena-138-v1'`, frozen `KEYS` and
`ROSTER`, the five strict functions below, and legacy `create,input,step,next`.
No exported mutable rule tables. Both environments execute these same modules.

```js
createMatch({schemaVersion:1, rulesetId:'arena-138-v1', matchId, characters})
  // -> Match; all five fields required; characters exactly two roster IDs
stepMatch(match, [frame0,frame1]) // mutates match.state; -> CombatEvent[]
snapshot(match)                 // -> validated, deeply detached Match
restore(snapshotValue)          // -> validated, deeply detached Match
nextRound(match)                // mutates only round-over state; -> boolean
```

`Match={schemaVersion:1,rulesetId:'arena-138-v1',matchId,state:State}` is an exact
envelope. `matchId` matches `^[A-Za-z0-9_-]{1,64}$`: caller-supplied public match
namespace, never a token or seat credential. A rematch requires a new matchId.
The core generates no randomness. Raw legacy state is not a strict checkpoint.

## Validation, errors and atomicity

A frame pair is a dense array of exactly two members in slot order, with no
extra own properties. Each member is explicit `null` (neutral/all false) or
exact `{tick,round,buttons}`. No omission or undefined. Required fields are safe
integers: tick=`state.tick+1`, round=`state.round`, buttons=0..127. No client slot,
seq, edge, position, damage, duration or future bits. `normalizeFramePair` also
validates its tick (safe integer >=0) and round (safe integer >=1) arguments.

All strict records are plain Object/null-prototype own-data records. Reject
unknown/missing keys, symbols, accessors, non-enumerable fields, custom prototypes,
inherited schema fields, sparse/extended arrays, wrong types, numeric strings,
boxed values, NaN and infinities. Reject array length before inspecting members.
Array length is the sole allowed non-enumerable own data field.
Inspect property descriptors before reading values; malformed ordinary accessor
objects must not execute getters. Proxies are outside the trusted in-process
contract: portable JS cannot guarantee no proxy traps. External data uses JSON.

Strict mutators require the envelope state property to be writable own data.
Nested state may be frozen: compute on a detached clone, validate the complete
prospective output, then replace match.state once. Object identity is not
guaranteed. Invalid prospective output throws ERR_ARENA_SCHEMA without mutation
or events. Snapshot/restore accept valid frozen data and return mutable copies.
Validate full match, both frames, destination and increments before computing.
Invalid seat 1 must not apply seat 0. Caller inputs never mutate.

Fixed error messages never echo payloads. Error codes: `ERR_ARENA_SCHEMA`
(TypeError, shape/type/version/state), `ERR_ARENA_FRAME` (RangeError, otherwise
valid tick/round mismatch), `ERR_ARENA_COUNTER` (RangeError, required increment
unsafe). No precedence promise for multiple simultaneous defects. Step requires
safe tick+1 even for two null frames or disconnected state. nextRound preflights
round+1 only when round-over. No arbitrary match-duration or draw-round cap.

## State schema and checkpoint invariants

Exact records; arrays exactly length two; finite numeric values. Integers unless
marked real. New createMatch/nextRound canonicalize both key maps to all seven
booleans, including false; legacy create's empty maps remain legacy-only.

```text
State = {tick,characters,scores,round,phase,remaining,roundTicks,winner,players,
         outcome?}
 tick: safe >=0; round: safe >=1; characters:[roster ID,roster ID]
 scores:[0..2,0..2]; winner:null|0|1
 phase:'countdown'|'fight'|'round-over'|'finished'|'disconnected'
 remaining:0..180; roundTicks:0..5400; players:[Fighter,Fighter]
 outcome: {reason:'leave'|'timeout',winner:null|0|1,matchComplete?:true}
Fighter = {character,x,y,vx,vy,face,hp,focus,jumps,cooldown,dashCooldown,stun,
           attack,previous,input}
 character:characters[slot]; face:-1|1; hp:even 0..100; focus:0..100; jumps:0..2
 x:real 20..940; y:real 199..360; vx:real -780..780; vy:real -420..600
 cooldown:0..38; dashCooldown:0..36; stun:0..12
 previous,input:exact {left,right,jump,punch,kick,block,dash:boolean}
 attack:null|{age,contact,damage,reach}
```

- Attack is light `(contact,damage,reach)=(7,10,62)`, age=1..23 and
  age+cooldown=24, or heavy `(14,18,82)`, age=1..38 and age+cooldown=39.
  Active attack requires stun=0 and hp>0. Null attack with cooldown>0 is valid.
- y=360 requires vy=0/jumps=0. y/vy limits are conservative envelopes for two
  -420 jumps with gravity 1100, not new physics clamps or stage boundaries.
- At most one score is 2; score sum<=round. Scores of 2 require finished or
  disconnected. Identity/order are fixed. Do not require previous===input.
- Countdown: remaining=1..180, roundTicks=5400, winner=null, score sum<round;
  fighter round-spawn defaults except input (previous all false). Fight:
  remaining=0, roundTicks=1..5400, HP>0 for both, winner=null, score sum<round.
- Round-over/finished: remaining=0, roundTicks=0..5399; roundTicks>0 requires
  at least one HP=0. Winner follows HP comparison. Round-over has no score=2;
  finished has a non-null winner with score=2. Any non-null round winner has
  score>=1; a drawn round requires score sum<round. Past winners are not inferred.
- Outcome exists exactly for disconnected. Its winner equals state.winner;
  optional matchComplete is true exactly when a score is 2, and that slot wins.
  Otherwise both scores<=1. Reject matchComplete:false/null and extra fields.
  Retain combat state/timers/history; never infer or restore the former phase.

These checks establish a coherent bounded checkpoint, not historical proof;
actual reachability requires trusted initial state plus accepted-frame replay.
Fabricated checkpoints may restore yet fail prospective-step validation (e.g.
y=199,vy=-420); valid reachable replay checkpoints must always advance.
Snapshots confer no authority. HTTP render snapshots omit characters, input,
previous and envelope and MUST be rejected, never repaired by guessed history.
No HTTP restore endpoint, bearer secrets, campaign globals or session restore.

## Step, rounds, compatibility and events

Preserve #138 equations and ordering, including summed focus deltas then one
clamp. Movement, jump, dash and attack checks retain their order; compatible
simultaneous actions remain allowed and kick edge wins over punch edge. Opposing
left/right cancel direction without changing face. No new action priority.

On the detached candidate, replace both inputs and run the shared internal
`stepRules(state)` operation; validate output before committing match.state. Countdown retains inputs without updating previous,
so a held action can edge on the first fight tick. Round-over/finished increment
tick and store inputs but do no simulation/events. Disconnected instead validates
then returns `[]` without changing anything, including tick and inputs.
nextRound returns false unchanged unless round-over; otherwise increment round,
preserve tick/scores/characters/matchId, reset fighters/history, remaining=180,
roundTicks=5400, winner=null and phase=countdown. Return true; no event.

Legacy exports keep raw state, existing argument/return shapes, normalization and
semantics unchanged. Legacy and strict stepping share the same internal rules;
strict wrappers add envelope, validation, canonical maps and event collection.
Legacy raw step(disconnected) retains its old tick increment; strict step freezes
it. #138's actual server already freezes disconnected rooms externally. Explicitly
test this distinction instead of claiming parity for every arbitrary raw call.
The existing server may write the exact disconnected/outcome overlay; wrapping
that data requires complete canonical maps, and restore never revives it.

The strict adapter supplies each frame from sampled held keys until #138 stale
release clears them; absence of a new 30 Hz HTTP request is not null/neutral at
60 Hz. Network seq, awaitingRelease, tokens, votes, rate limits and wall-clock
expiry stay outside state. Existing HTTP behavior must remain unchanged.

stepMatch emits at most three fresh detached events: up to two contacts in source
slot order, then one phase transition. No event history/counter in state. Header:
`{id,matchId,round,tick,ordinal,type}`, ordinal=0..2 in emitted order;
id=`${matchId}:${round}:${tick}:${ordinal}`. Exact variants:

```text
contact: header + {source:0|1,target:0|1,kind:'punch'|'kick',
                   blocked:boolean,damage:2|10|18}
phase:   header + {phase:'fight'|'round-over'|'finished',winner:null|0|1}
```

Source/target differ. Damage is rule amount before HP floor clamp. No event for
whiff, countdown decrement, terminal step, nextRound, create or restore. Same
state/frame gives identical events/IDs; new matchId prevents rematch collisions.
No secrets/campaign data or presentation callbacks in events/rules.

## Independent freeze and implementation acceptance

The reviews above authorize implementation of this exact bounded contract.
After implementation, record exact source/test commits and reproducible commands:

1. #138 tests and 14 regressions green; compare legacy/new admitted tapes for
   countdown, held inputs, simultaneous actions/trades, round transitions and
   rematches, with the disconnected raw-call exception checked separately.
2. Invalid second frame, unknown keys/bits, getters/read-only destination,
   wrong tick/round, sparse arrays, counter overflow, invalid attack/outcome and
   out-of-bounds prospective states reject atomically. Frozen restore data works.
3. Restore during startup, hit stun, held action, countdown and every terminal
   phase; no phantom edges/events/revival. HTTP projection restore rejects.
4. Node and Chromium execute identical modules/config/frames and compare full
   state/events after every tick, restore and nextRound; add WebKit when available
   and explicitly report absence. No copied client physics. Exported tables resist mutation.
5. Verify campaign/storage isolation. This does not qualify latency, physical
   devices, session recovery, public hosting, security signoff or release.

Publish concise evidence only, never raw local logs/private conversation paths.
Existing security, spending, release and PR #126 approval gates remain intact.

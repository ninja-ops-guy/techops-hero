# Directional Arena v2 — review implementation

Status: implemented in an unapplied review patch. Not merged, deployed, publicly hosted, or balance-certified.

## Source binding and reconciliation

| Source | Exact reviewed head | Relationship and treatment |
| --- | --- | --- |
| PR #135 | `7fe5d31919bfe204e80c46b5dd74baaa65689cb0` | Base move selection, raw move data, combo timing, launcher follow-up and juggle concepts inspected. No campaign runtime import. |
| PR #137 | `db996700171acf904c28964620faecb2768b4056` | Stacked on #135. Buffered intent captures input facing and original press time. Hurt interrupts it. Special/slide/gravity/Uzi fixes remain offline and are dependencies for a later special-move port. |
| PR #139 | `c137c8cead1e5fe6992b1fb3e9007bcfa1311776` | Patch base. Existing v1 simulation, input contract, client and tests remain intact. Server has an opt-in v2 path. |

Git merge-base of #137 and #139 is exactly the #135 head above. This is a semantic migration onto #139, not a merge of #137 into it. It deliberately keeps offline save/progression/equipment behavior on its own branch. The current source heads must be rechecked before applying the patch.

## Implemented behavior

All four roster identities share one normalized base kit, 100 HP, two jumps and zero starting Focus. No level, save, purchase, equipment, passive, reward, story flag or campaign import affects a match. Focus retains Arena's existing gain/loss/clamp behavior and cannot yet be spent.

Directional ground light/heavy, aerial light/heavy/down variants, a confirmed jab/cross/launcher rhythm chain, late attack buffering, launcher jump-cancel and three-hit aerial follow-up limit execute in the authoritative 60 Hz core. The client renders server state; it does not decide hits or predict them. The same UMD source executes in Node and the browser replay harness.

All timing below is in simulation ticks. Wall time is used only by the server's existing session/transport deadlines. Activation tick counts as attack age 1. Contact occurs once at `start + contactTick - 1`. An attack occupies ticks `start` through `start + durationTicks - 1`; a new action can start at `start + durationTicks`. Recovery is the total duration, not duration added after contact.

| Move | Base damage | Reach | Contact tick | Total ticks | Reaction |
| --- | ---: | ---: | ---: | ---: | --- |
| Jab | 14 | 76 | 5 | 14 | Hit stun |
| Cross | 18 | 76 | 5 | 14 | Hit stun |
| Launcher | 24 | 80 | 5 | 14 | Launch |
| Up light / uppercut | 20 | 82 | 5 | 17 | Launch |
| Down light / low | 12 | 76 | 4 | 13 | Ground-only target |
| Heavy / kick | 22 | 104 | 6 | 18 | Launch |
| Up heavy / rising kick | 26 | 94 | 7 | 20 | Launch |
| Down heavy / sweep | 16 | 96 | 6 | 18 | Longer stun; ground-only target |
| Air light | 14 | 112 | 5 | 14 | Air follow-up |
| Air heavy | 18 | 102 | 5 | 14 | Air follow-up |
| Air down heavy / slam | 22 | 98 | 6 | 16 | Downward finish |
| Air down light | 12 | 96 | 3 | 11 | Downward follow-up |

Damage/reach are campaign base values, proposed as an initial technical fixture, not proven competitive balance. Up aerial inputs use the ordinary shared aerial move; Iona's distinct bicycle kick is deferred with character moves. Horizontal direction selects facing. Opposing horizontal or vertical directions cancel each other.

The on-beat press gap is inclusively 16..30 ticks (260..500 ms converted to the 60 Hz grid). A prior confirmed contact must be younger than 54 ticks. Successful on-beat moves advance stage modulo three and add 3 damage to their contact. Whiffs, blocked contacts and being hurt clear the confirmed chain. Combo counting does not promise every link is an inescapable hit-stun combo.

A new light/heavy edge during the final four recovery ticks queues one action. This rounds the offline 65 ms buffer up to four ticks (66.67 ms), explicitly a quantization choice. The queue stores action, aim, input-facing and original press tick. Current posture is re-evaluated at activation, preventing a queued grounded move from ignoring a landing/jump. A queued action wins over a simultaneous fresh edge; block discards the queued action. Hurt, round reset, and terminal round transition clear it. Active attack facing stays locked even when a different facing is buffered.

With no attack/recovery, action priority is heavy, light, dash, jump. Only one starts per tick. A jump edge may cancel a grounded launcher only after its contact is confirmed and completed; the jump is player-requested and consumes the first jump. A missed or blocked launcher cannot cancel. No slide, gravity cancel, grab, throw, dash invulnerability or special is implemented.

## Physics, contact and reactions

Arena retains its 960-unit stage, floor 360, x bounds 20..940, run 240 units/s, block movement 80, jump -420 units/s and gravity 1100 units/s². This intentionally differs from Night Walker's 1800-unit stage, frame-unit movement and separate player/enemy gravity. Reach is not silently rescaled. Launcher velocities are explicitly converted from offline units/frame to units/s: launcher (84,-576), uppercut (54,-588), kick (108,-528), rising kick (60,-612), with horizontal sign taken from locked facing.

The core integrates both fighters before deciding contacts. It checks forward-facing horizontal reach and vertical feet gaps: low <18 with grounded target, downward <130 and target no more than 18 above, launcher <120, ordinary air <92, ordinary ground <65. Horizontal reach is inclusive. Air slam receives an explicit downward aiming constraint; this is a proposed Arena behavior change from the offline table, not unchanged parity. Provisional rendered rectangles are attack indicators, not exact collision visualizations.

All hit and block predicates are collected before damage. Front-facing block works when the defender has no active attack or hit stun and inflicts 2 chip; no parry or separate block stun has been added. Normal hit stun suppresses the next 15 ticks, on-beat hit stun 22, sweep 26. Damage, reactions and one net Focus delta are resolved per seat; simultaneous trades cannot depend on slot order. Focus is attacker +8 / defender -15 for a hit, attacker +2 / defender +4 for a block, clamped once after the batch.

Airborne follow-up contacts increment the defender's `airHits`, including a second launcher: no relaunch reset. The third follow-up or a slam locks further contacts and sends the target down. Landing plus completion of hit recovery resets the limit. A confirmed non-downward aerial follow-up supplies shared lift without snapping positions; a simultaneously hit attacker receives its own hit reaction instead. Tests include a reachable uppercut, jump-cancel, three successive aerial contacts, and rejected fourth contact without injected hit counts.

## Protocol and trust boundary

The old server mode stays the default. Local review starts with:

```sh
ARENA_ADVANCED_COMBAT=1 npm run arena:prototype
```

Advanced mode rejects any non-loopback bind, even with configured origins. This patch provides no public hosting switch. No listener was left running by the validation scripts.

Create/join require `protocol: 2` and `rulesetId: "arena-directional-v2"`. Input requests are authenticated by the existing bearer seat, and contain strictly validated `seq`, `round`, `buttons`, and an ordered `transitions` list. Clients never choose simulation ticks, positions, damage or target IDs. Additional top-level state claims are ignored; invalid button bits reject. V1 inputs cannot enter v2 matches. V1 checkpoints cannot be restored as v2.

| Bit | Intent |
| ---: | --- |
| 1 / 2 | Left / right |
| 4 | Jump |
| 8 / 16 | Light / heavy |
| 32 / 64 | Block / dash |
| 128 / 256 | Aim up / down |

The core consumes exactly two `{tick, round, buttons}` frames per step; each tick must equal the current tick plus one. Both frames validate before either fighter changes. Null core frames mean neutral input. The HTTP adapter differs deliberately: a bounded FIFO assigns accepted control transitions to successive server ticks, holding the last accepted controls when the queue empties. Each packet holds at most 16 transitions; each seat queues at most 32. Overflow, malformed packets, stale sequence or wrong round reject atomically. The client records both press and release, including multiple short taps in one 33 ms HTTP interval. This preserves distinct edges, but a gameplay action pressed outside a legal recovery/buffer window is still rejected by combat rules.

Input freshness uses the existing strict `>250 ms` default boundary. It is enforced at action time before a fresh request can refresh an expired queue, and at timer consumption. Expiration discards delayed transitions and neutralizes held controls. Held movement can resume on a fresh snapshot; expired action buttons require an explicitly received release before rearming. Countdown discards controls and the client polls until fight begins; opening attacks require a new post-countdown input. Round reset clears queues; round identity increases across rematches, rejecting delayed prior-round packets. The existing room/session deadline and origin/host protections are retained.

No reconnect, rollback, prediction, latency compensation, lossless event transport or internet impairment qualification is claimed. A bounded transition queue is not a deterministic network arrival schedule: deterministic replay uses the frames actually consumed by the server.

## Checkpoints and future extensions

Schema 2 snapshots contain complete simulation state: previous buttons, held buttons, locked attack and contact status, recovery/stun/dash deadlines, buffered intent and original press tick, last confirmed hit and press, combo stage/count, air-hit lock/count, both fighters, round and scores. They contain no tokens or campaign state. Validation rejects extra fields, non-data properties, non-finite scalars, invalid move IDs, impossible basic move/stage tuples, bad timer relationships, and unknown versions before mutation. Restore and step replace state atomically. Snapshot is a core API only; no HTTP restore endpoint exists.

Render snapshots omit previous/held controls, buffered opponent intent and original press times. Core events have deterministic match/round/tick/ordinal IDs, but are intentionally not exposed as a reliable HTTP event stream. Audio/effects would need bounded retention and acknowledgment/deduplication before relying on events over the network.

Stable seat IDs, serializable queued intent, tick-based recovery, confirmed-contact state, pure move definitions and atomic contact resolution establish the next extension boundary. Grabs/throws need explicit relationships and target locks; multi-hit specials need per-target contact indices; slides/gravity cancels need their own limited cancel windows; Focus costs and loadouts need normalized match-owned definitions. These are future mechanics, not dormant implemented features. A future schema/ruleset must explicitly add and validate them; unknown controls are rejected today.

## Validation and limits

Run `npm run test:arena`, `npm test`, and `npm run test:browser:arena-advanced` after applying in an approved isolated checkout. Browser validation requires the pinned Playwright 1.55.1 browsers and their OS libraries. The review environment used Chromium 140.0.7339.186 and WebKit 26.0; WebKit ran through a declared local launcher supplying downloaded Debian runtime libraries, with the same Playwright WebKit binary. The browser report records the override. No system installation or repository browser binary change is part of this patch.

The review bundle contains final logs, source SHA-256 values, the exact base revision, and an independent agent review receipt. Browser replay compares complete checkpoints and events for 18 tapes / 3,850 steps in each engine, restoring every 11 steps. Four actual two-client flows cover desktop keyboard and portrait browser touch taps in Chromium and WebKit, normal lobby admission, directional/ordinary contacts, matching HP on both clients, an airborne move, storage sentinels and leave handling. Declared replay fixtures set initial positions/postures; actual browser flows do not inject match state.

Provisional shapes, exact collision visualization, full move animation, sustained human balance, physical iPhone, network impairment, reconnect, security endurance and public-release qualification remain open. Passing this patch's tests supports repository review and further private qualification, not public release.

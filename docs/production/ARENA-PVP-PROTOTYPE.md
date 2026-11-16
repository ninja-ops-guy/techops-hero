# Private 1v1 Arena prototype

Run `npm run arena:prototype`, then open http://127.0.0.1:4260 in two independent browser sessions. Create a room in one and enter its code in the other. For a separately authorized trusted LAN trial, set `ARENA_HOST=0.0.0.0` and pin `ARENA_ALLOWED_ORIGINS=http://<actual-LAN-address>:4260` before starting. The origin must match the address clients use; no wildcard origins are accepted. Binding beyond loopback without explicit origins fails closed. This configuration is preparation, not authorization to expose the host. No public service is deployed. This standalone entry point is deliberately separate from the campaign and Combat Lab.

The server owns a 60-step simulation: movement, two jumps, dash, punch, kick, facing-sensitive block, hit stun, health, a 90-second round clock, first-to-two scoring and mutual-ready round transitions/rematches. Simultaneous contacts can trade. Four character names are selectable with identical stats and provisional geometric visuals. Focus accumulates but has no spend action yet. No campaign code or save APIs are loaded.

Private random room codes admit two seats; independent random bearer tokens own inputs. Clients send only allowlisted boolean controls with increasing sequence numbers. The server rejects stale inputs and unknown tokens, strips private inputs from snapshots, caps rooms/request bodies, clears controls after 250ms without input, and ends a match after 10 seconds without client contact. Leaving also ends it. A waiting creator's departure removes the room immediately. Active departures/timeouts freeze an explicit outcome; a finished match retains its earned winner and score. Terminal rooms expire after ten seconds regardless of polling; other idle rooms expire after two minutes. Stale controls require an explicit release before a held jump/attack/dash can trigger again. Disconnect recovery currently means creating another room; there is no seat-reclaim protocol.

## Validation

`npm run test:arena` includes the original five prototype groups plus the Wave 1 client, simulation, session and security regressions. The original groups cover deterministic replay, normalized stats, hits/blocks/misses, held-input bounds, simultaneous trades, two-jump limit, round/match transitions, room isolation, unauthorized/stale inputs and explicit disconnect.

`npm run test:browser:arena`: independent browser contexts create/join, move and attack through actual UI controls, win a round, mutually ready, verify reset health/score, leave and observe disconnect. Desktop keyboard and portrait on-screen buttons are exercised; portrait uses mouse pointer input, not physical touch. A local-storage sentinel remains unchanged. Results are in docs/qa/arena-pvp/results.json.

## Remaining before online release

This is a base-combat networking prototype, not parity with Night Walker combat. Character signatures (including Kali/violin), directional/aerial attacks, grabs, slides, gravity cancels, art and animations remain to migrate. There is no prediction, interpolation, rollback, production tick scheduler, matchmaking, account identity, reconnect, spectator mode, 2v2 or campaign co-op. HTTP snapshot polling is a temporary transport. Button press edges are retained until the next outgoing snapshot; this is not a frame-indexed input queue. Local request/admission/session rate limits, strict controls and pinned Host/Origin checks now have regression coverage. These do not establish internet latency/loss, sustained overload, public admission/occupancy protection, physical iPhone, or public-host security qualification. Public hosting requires TLS, origin configuration and service hardening. The server defaults to loopback and must not be exposed as a production service.

## Wave 1 continuation

See [multiplayer workstream](ARENA-MULTIPLAYER-WORKSTREAM.md), [combat migration boundary](ARENA-COMBAT-MIGRATION.md), and [experience acceptance](ARENA-EXPERIENCE-ACCEPTANCE.md). The dedicated Arena qualification workflow runs local protocol tests and isolated two-client browser acceptance on each candidate. Its software results are separate from device, network and release approval.

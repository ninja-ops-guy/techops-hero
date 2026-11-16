# Private 1v1 Arena prototype

Run `npm run arena:prototype`, then open http://127.0.0.1:4260 in two independent browser sessions. Create a room in one and enter its code in the other. For trusted LAN testing, run `ARENA_HOST=0.0.0.0 npm run arena:prototype` and open the host computer's LAN address on both devices. No public service is deployed. This standalone entry point is deliberately separate from the campaign and Combat Lab.

The server owns a 60-step simulation: movement, two jumps, dash, punch, kick, facing-sensitive block, hit stun, health, a 90-second round clock, first-to-two scoring and mutual-ready round transitions/rematches. Simultaneous contacts can trade. Four character names are selectable with identical stats and provisional geometric visuals. Focus accumulates but has no spend action yet. No campaign code or save APIs are loaded.

Private random room codes admit two seats; independent random bearer tokens own inputs. Clients send only allowlisted boolean controls with increasing sequence numbers. The server rejects stale inputs and unknown tokens, strips private inputs from snapshots, caps rooms/request bodies, clears controls after 250ms without input, and ends a match after 10 seconds without client contact. Leaving also ends it. Rooms expire after two idle minutes. Disconnect recovery currently means creating another room; there is no seat-reclaim protocol.

## Validation

`npm run test:arena`: five test groups cover deterministic replay, normalized stats, hits/blocks/misses, held-input bounds, simultaneous trades, two-jump limit, round/match transitions, room isolation, unauthorized/stale inputs and explicit disconnect.

`npm run test:browser:arena`: independent browser contexts create/join, move and attack through actual UI controls, win a round, mutually ready, verify reset health/score, leave and observe disconnect. Desktop keyboard and portrait on-screen buttons are exercised; portrait uses mouse pointer input, not physical touch. A local-storage sentinel remains unchanged. Results are in docs/qa/arena-pvp/results.json.

## Remaining before online release

This is a base-combat networking prototype, not parity with Night Walker combat. Character signatures (including Kali/violin), directional/aerial attacks, grabs, slides, gravity cancels, art and animations remain to migrate. There is no prediction, interpolation, rollback, production tick scheduler, matchmaking, account identity, reconnect, spectator mode, 2v2 or campaign co-op. HTTP snapshot polling is a temporary transport. Button press edges are retained until the next outgoing snapshot; this is not a frame-indexed input queue. No internet latency/loss, overload, abuse protection, physical iPhone, or public-host security qualification is claimed. Public hosting requires TLS, origin configuration and service hardening. The server defaults to loopback and must not be exposed as a production service.

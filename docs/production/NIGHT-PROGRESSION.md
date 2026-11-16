# Night Walker levels, stats and skills

Implemented November 16, 2026. Open **Run Menu → Stats & skills** (also available from Living World and standalone field-report journals). This is shared player training within the current saved Night profile, not separate character memories. It does not alter campaign prerequisites, Day statistics, Good Boys or Sector 04.

## Progression

Start at level 1. Level cap: 20. Advancing from level L costs `100 + 25 × (L − 1)` XP. Lifetime XP to level 20: 6,175. Each gained level grants two stat points; every even level grants one skill point. Points are derived from XP and allocations, rather than maintained in separate counters. Old saves start with baseline movement and existing moves intact.

First enemy defeats give 20 XP, street clears 100 XP and completed dangerous Living World chapters 200 XP. Street rewards are keyed by game day/district/street/enemy slot; expedition defeats by chapter/room/step/task/enemy slot. Field-report rewards additionally identify the report. Completion rewards are once per chapter in this profile. Quiet scenes and private rehearsals award nothing. Replay/reload cannot duplicate a recorded reward. No retroactive completion scan runs on old saves.

## Stats

| Stat | Effect per rank | Limit / cost |
|---|---|---|
| Strength | +6% player attack damage | 10 ranks; 1 point each |
| Speed | +3% running speed and acceleration | 10 ranks; 1 point each |
| Jump count | +1 jump, starting from 2 | 2 ranks; 3 points each; levels 5 and 10 |
| Dexterity | −2% attack recovery | 10 ranks; 1 point each |
| Intelligence | +20 ms timed combo input window | 10 ranks; 1 point each |

Recovery cannot end before the last contact plus 45 ms, preserving Iona's multi-contact move. Jump input is edge-triggered; landing resets the jump budget. Walking off a ledge consumes the ground jump after existing grace expires. Speed does not change the simulation clock or dash velocity.

## Learnable passive skills

Each costs one skill point and requires both level and stat rank. Existing active combat moves remain available.

| Skill | Requirements | Effect |
|---|---|---|
| Heavy hands | Level 3, Strength 2 | +15% attack damage, additive with strength |
| Fleet foot | Level 3, Speed 2 | −20% dash cooldown |
| Air control | Level 5, Jump rank 1 | +15% airborne acceleration |
| Flow state | Level 5, Dexterity 3 | Further −10% attack recovery |
| Combat insight | Level 5, Intelligence 3 | +100 ms combo input window |

A confirmed free reset refunds all allocated points and learned skills while preserving level, XP and reward history. Reset cancellation changes nothing. Maximum investment does not cover all stat ranks, allowing different builds; later skill additions can use surplus skill points.

## Persistence and limits

The versioned `meta.nightTraining` record travels with the existing profile/checkpoint. Upgrades, skills, resets and rewards save immediately and roll back on save failure. Malformed/overspent records disable training bonuses and show an error rather than deleting the record. Story completion is saved before its separate XP reward; a failed reward can be retried by reopening/replaying the completion action. A failed defeat reward is not queued in memory: replaying the encounter retries it. This is local-save validation, not an online anti-cheat service.

Validation: 12 progression contract groups including real combat contact, save failure, reward deduplication, isolation and jump limits; 24 production-page browser checks across three emulated layouts; all 127 production suites and 639 syntax checks pass. The browser suite explicitly seeds XP and positions to test allocation and jumps. It does not claim a fresh campaign playthrough, long-term balance certification or physical-iPhone testing. Evidence: `docs/qa/night-progression/`.

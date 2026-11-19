# TechOps Hero — State-machine inventory and transition contract

## Decision

Use a small, dependency-free registry around the existing runtime instead of migrating the game to a framework or duplicating state in a second store.

The game already has stable owners for campaign facts, combat, cinematics, audio, checkpoints, and presentation. A wholesale rewrite would risk those working contracts. The safe architecture is therefore:

1. **Explicit transition maps** for fragmented coordinators.
2. **Read-only projections** for state owned elsewhere.
3. **Compatibility-first instrumentation**: an unexpected edge is recorded, while the legacy target still runs.
4. **No new clock, frame loop, save write, DOM listener, or narrative authority.**

`runtime_state_machines.js` is the registry and inspection boundary. It does not become the owner of gameplay state.

## Audit boundary

The inventory includes production behavior with multiple stable modes and event-driven or guard-driven transitions. It excludes simple content flags, numeric progress counters, sprite-frame indexes, generated asset payloads, tests, and historical code paths that are not loaded.

Thirty-three machines were identified. Some were already explicit or validated; they are registered so one inspection surface covers the whole runtime. `Instrumented` means production transitions now pass through the registry. `Projected` means a read-only selector reports live global state. `Contextual` means the contract is registered, but a real record or actor is required for inspection; no current state is invented from globals.

## Inventory

| Machine | Current owner | States / lifecycle | Exposure |
|---|---|---|---|
| Title readiness | `production_title_experience.js` | loading → ready ⇄ launching / failed → retry | Instrumented |
| Night launch | `production_mode_router.js` | idle → intent → launch → start-run → dispatch → enter-requested → cinematic → mounting → ready / failed | Instrumented |
| Run lifecycle | `game.js` | title → difficulty → day ⇄ night → end-of-day → game-over / victory | Projected |
| Modal interaction | `game.js`, `cinematic_systems.js` | exploration ⇄ dialogue / panel / battle / end-of-day / cinematic / paused | Projected |
| Production bootstrap | `production_bootstrap.js`, `bg_noc.js` | idle → waiting → loading → ready / failed | Projected |
| Day/Night shell | `runtime_mode_shell.js` | day ⇄ night | Projected; already explicit |
| Presentation ownership | `cinematic_systems.js` | idle ⇄ claimed ⇄ blocked | Projected; already explicit |
| Delayed Day notice | `game.js` | scheduled → waiting → fired / expired | Contextual |
| Ticket lifecycle | `game.js` | queued → interviewed → diagnosed → portal-ready → in-battle → stabilized → verified → closed; escalation loop | Contextual |
| Battle workflow | `game.js` | observe ⇄ execute / hypothesis-choice → stabilized → verified → documented / lost | Contextual |
| Day device case | `runtime_day_cases.js` | inspect → authorize → remediate → technical → requester → complete | Contextual; already explicit |
| Campaign opening | `campaign_act1.js` | morning → workstation → day_shift ⇄ night_walker → complete | Projected; already explicit |
| Day 1 investigation | `campaign_act1_investigations.js` | gather → remediate → technical_check → human_verify / workaround_verify → complete | Projected; already explicit |
| Act IV Trust workflow | `campaign_act2.js` | observe → investigate → hypothesize → respond → report → technical_verify → requester_verify → complete | Projected; already explicit |
| West Annex investigation | `campaign_nightwalker.js` | briefing → investigate → hypothesize → insight_ready → relay_ready → verify → complete | Contextual; already explicit |
| Dead Air investigation | `campaign_dead_air.js` | briefing → triangulate → choose → verify → complete | Contextual; already explicit |
| Good Dogs mission | `good_boys_progression_authority.js` | m1 → m2 → m3 → m4 → m5 → m6 → m7 → m8 → complete | Projected; already explicit |
| Good Dogs objective | `production_gameplay_experience.js` | objective, security, interlock, investigation, release, combat, decrypt, boss, escape, home and recovery phases | Projected |
| Prison breach | `good_boys_prison_gameplay_v2.js` | breach → terminal → counterattack → exfil → complete | Projected; already explicit |
| Ship flight | `good_boys_ship_flight.js` | idle → loading → ready → flight → complete / cancelled / asset-error | Projected |
| Night player action | `night_combat.js` | idle ⇄ windup / recovery / grab / dash / stunned → down | Projected |
| Night enemy reaction | `night_combat.js` | grounded ⇄ held / airborne / stunned / recovering → down | Projected |
| Night travel | `runtime_night.js`, `night_hooks.js` | street ⇄ driving / transition / blocked → down | Projected |
| Night input | `night_combat_input.js` | idle ⇄ pressed / held / dash-armed / buffered / blocked | Contextual |
| Actor animation | `cinematic_systems.js` | idle ⇄ locomotion / air / dash / attack / block / hit → down | Contextual; already explicit |
| Checkpoint | `runtime_night.js`, `game.js` | empty ⇄ active / ready → complete; invalid / unavailable recovery | Projected; already explicit |
| Day audio playback | `runtime_day_audio.js` | idle → pending → playing; muted / not-found / unavailable / cancelled / error recovery | Projected |
| Music request | `game.js` | idle → loading → ready → requested → playing ⇄ paused; muted / unavailable | Contextual |
| Audio ducking | `runtime_day_audio.js` | clear ⇄ ducked, with nested release reasons | Projected |
| Asset loading | `cinematic_systems.js`, `production_asset_registry.js` | idle → loading → ready / missing / error → retry | Projected |
| Cutscene sequence | `good_dogs_cutscene_bridge.js` | idle → running → complete / media-wait-or-error / error | Projected |
| Cutscene playback | `good_dogs_cutscenes_v2_2.js` | idle → loading → playing ⇄ paused → completed / user-skipped; gesture / codec / error recovery | Projected |
| Save recovery | `game.js` | clean → migrated / backup-restored / backup-memory-only / quarantined / failed | Projected |

## UX, DX and AX effects

### Player experience

- Existing readable loading, ready, launching, failure, retry, and cancellation states keep one canonical transition path.
- Compatibility-first recording prevents the new layer from creating a soft lock or changing a game rule.
- Existing accessible status announcements, disabled controls, focus restoration, and explicit recovery actions remain in force.

### Developer experience

- Transition graphs name valid states and events beside the runtime, rather than hiding them across boolean combinations.
- `TechOpsStateMachineInstrumentation.transition()` provides a strict result for tests; `next()` provides the compatibility seam for the two legacy coordinators.
- Every finalized record distinguishes `contractTarget` from `effectiveTarget`. Compatibility records are complete before they enter history or reach listeners.
- Unexpected transitions include sequence, source, event, effective target, reason, details, and timestamp in a bounded history.
- The registry has no dependencies and does not alter save formats.

### Agent experience

In the browser console:

```js
// Serializable snapshot of every globally inspectable machine.
TechOpsStateMachines.inspect()

// Full contracts, including record-owned machines.
TechOpsStateMachines.inventory()

// Read one machine without changing it.
TechOpsStateMachines.read("night-launch")

// Inspect accepted and unexpected coordinator transitions.
TechOpsStateMachines.history()

// Evidence scope, truncation, initialization/reset and notification metadata.
TechOpsStateMachines.evidence()

// Observational cross-machine checks; these never rewrite runtime state.
TechOpsStateMachines.invariants()
```

Every inspection is read-only. The agent-facing object exports no transition or history-reset method. Production instrumentation is a separate capability, `TechOpsStateMachineInstrumentation`; history reset is private and not exported. This is capability separation for safe consumption, not a security boundary against arbitrary same-origin JavaScript.

`context-required` means the machine belongs to a record or actor, not that gameplay is broken. `registered: false` means live legacy state needs a contract review; it is not silently rewritten. `inspect().authority` is always `observational`.

Evidence is memory-only and scoped to the current page session. `evidence().truncated` and `dropped` reveal missing history; `oldestSequence`, `newestSequence`, and `nextSequence` identify the retained range. `resetCount` and `lastResetAt` distinguish initialization from later resets. `notificationErrors` records listener/dispatch failures without allowing them to change gameplay.

`contractTarget` is the target defined by the registered map, or `null` for an undocumented edge. `effectiveTarget` is the final compatibility result. Both are finalized before history recording and `CustomEvent` emission. A listener receives a defensive copy and cannot mutate the stored record.

## Migration policy

1. Register and test the existing behavior first.
2. Route coordinator writes through `next()` without changing their effects.
3. Compare unexpected-transition history with real acceptance paths.
4. Add missing legitimate edges or fix the incorrect writer in a separate, narrowly scoped change.
5. Only enforce a rejection after the affected flow has regression coverage and a player-visible recovery path.

Do not copy campaign, combat, cinematic, audio, or checkpoint state into the registry. Do not add a numbered hook for state management.

## Validation

`test_runtime_state_machines.js` verifies:

- all 33 unique contracts and their state references;
- complete title and Night launch paths;
- unexpected-transition compatibility behavior;
- serializable read-only inspection, bounded history, and truncation/reset metadata;
- finalized compatibility records and listener-exception isolation;
- the observational Night-ready/runtime-active cross-machine invariant;
- parser order and absence of registry-owned clocks, public reset authority, or save writes.

The production release gate includes this suite before the existing router and title regressions.

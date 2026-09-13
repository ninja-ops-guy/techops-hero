# Night travel and building entry

Requested behavior: keep the Charger outside buildings, require on-foot entry, and make district travel a traffic-avoidance minigame.

## Implemented flow

- Every ordinary Charger route, including Home and Waldo, starts an 18-second three-lane drive. Up/Down or W/S selects lanes; touch buttons do the same. Traffic waves leave a clear lane and adequate warning. Collisions reduce trip integrity and temporarily slow travel. Four impacts require Retry or Return; neither changes Mike's health, money, or destination progress.
- Successful arrival invokes the existing district loader and the existing vehicle wear logic once. Mission transport, Good Dogs flight, and Sector 04 are outside this system.
- Industrial is the ordinary Night district whose approved gameplay plate depicts an interior. Its arrival is now an outdoor frontage with the Charger at the curb. Mike must walk to the lit personnel door and interact before the interior enemies become active. The interior has a left-side exit and no Charger.
- Leaving and re-entering preserves the interior's enemies, damage, platforms, and stage; revisiting another district within the same night preserves its encounter. Completing Industrial returns Mike to the parking area. Other outdoor districts retain street arrivals. Home retains its existing house-door interaction and cinematic.
- The parked vehicle center moves from x=86 to x=150 to fit its approved silhouette; the arrival position is x=280, beside it. The car is absent from later combat blocks and reappears on the first block when the district is completed.
- Travel owns its simulation and canvas through the existing Night frame dispatcher, including Waldo departures. Outgoing combat AI, character overlays, campaign UI, and day notifications cannot run/render over it. Pause, dialogue, hidden-tab, and cinematic blocking still apply.

## Source ownership

| Area | Files |
| --- | --- |
| Traffic simulation, collision, lane controls, rendering | `night_travel.js` |
| District/door state, route callbacks, car placement | `night_hooks.js`, `v733_hooks.js`, `night_travel.js` |
| Frame ownership, clock, pause, HUD cleanup | `runtime_night.js` |
| E/A interaction priority | `night_combat_input.js` |
| Interior art exclusion from outdoor frontage | `runtime_scene_art.js` |
| Suppress platform overlay during travel | `recording_world_cohesion.js` |
| Loader and cache version | `production_bootstrap.js`, `bg_noc.js`, `index.html` |

## Validation and limits

- `node test_night_travel.js`: traffic collision, safe lanes at 20/30/60/120Hz, controls, repeat/retry/return, arrival idempotence, spatial doors, car exclusion, stage preservation, rendering balance.
- `node test_night_lifecycle.js`: real lifecycle dispatch isolates travel from street simulation, preserves raw steering, blocks campaign interruption, and respects pause/dialogue/game over, alongside existing lifecycle regressions.
- `node scripts/production_release_gate.js`: aggregate production gate passes locally.
- Existing `scripts/night_lifecycle_browser.mjs` now drives traffic using keyboard/touch input, checks Foundry exterior/interior and home arrival, and saves CI screenshots on Chromium, Firefox, WebKit, and WebKit mobile. Its model reads are telemetry; lane/progress/collision state is not set by the route driver. The existing initial character-position fixture is labeled in the test.
- Fresh manual browser visual acceptance was not completed: Cloud Browser's URL policy rejected the local file preview. No screenshots or physical-device acceptance are claimed for this change.
- The frontage is assembled from the existing city plate plus a brick facade/door; traffic uses drawn civilian sedans and the existing approved player Charger. These are functional runtime visuals, not newly approved concept art. No generated art or invented screenshots are included.
- Encounter snapshots last for the current Night object. This does not introduce a new cross-reload campaign/save format.

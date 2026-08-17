# TechOps Hero v6.0.1 — Final QA & Polish Review

**Date:** 2026-07-28 · **Scope:** full review pass v4.x → v6.0 (systems consistency, gameplay cohesion, Command Center, art direction, UI/UX, immersion, technical QA)
**Verdict:** shippable. Two P1 issues were found and **fixed in v6.0.1** (this patch). No P0 issues exist.

---

## 1. Technical QA — all green

| Check | Result |
|---|---|
| Regression suites (v4.3 → v6.0.1, 16 suites, 100+ assertions) | ✅ all passing |
| Page/console errors (desktop + mobile sessions) | ✅ zero |
| Save/load (Continue Run restores budget, day, certs, home upgrades, achievements, command-center state) | ✅ passing |
| Unlock gating (command center locked < Security Architect, procurement < day 4, mgmt perks by rank) | ✅ passing |
| Mobile (390×844 touch: joystick movement, phone panel fits viewport, dialogs fit, night-mode DASH/BLOCK buttons) | ✅ passing (after P1 fix below) |
| Push integrity (every file verified by git blob SHA1 vs local bytes) | ✅ clean |
| Dead refs / TODO / placeholder leftovers | ✅ none found |
| File inventory (33 files, all referenced in `index.html` load order) | ✅ no unused files |

## 2. Issues found & fixed in v6.0.1

### P1 — Mobile touch targets too small (FIXED)
Dialog and battle buttons measured **21px tall** on a 390px touch viewport — well under the ~44px touch-target guideline, making the phone/Teams UI and every dialog fiddly on phones.
**Fix:** coarse-pointer media query in `style.css` — dialog, battle, and EOD reward buttons now have a 40px minimum height with larger padding. Verified passing on the mobile suite.

### P1 — Command Center policy feedback was unquantified (FIXED)
The review brief called this out directly: *"Security +1"* tells the player nothing. The nightly sim also reported only the first event in a toast, with no "why / what could I have done differently."
**Fixes:**
- The policy panel now shows **quantified nightly projections**: `→ Tonight: 12% incident odds per site · wear up to 2% · recovery +6%`
- Committing a policy toasts the exact numbers (`🌐 Policy live: 12% incident odds, wear ≤2%, +6% nightly recovery.`)
- A **📋 LAST NIGHT report** now lives in the command center: per-site before→after health with the incident/wear/recovery breakdown, plus a contextual 💡 advice line ("More 🛡️ Security would cut incident odds.")
- Enterprise uptime is color-coded (green ≥80, amber ≥40, red below)

## 3. Consistency audit (v4.x → v6.0)

- **Rank ladder** — single source of truth (`RANKS` in game.js); every gate uses `rankIdx()`. Gates verified: scripting 1 · delegation 2 · standups/outage 3 · command center 6 · CIO aura 7. Terminology uses full rank names at gates, abbreviations only in flavor prose — consistent.
- **Progression connections** — XP → rank → console powers → command center → enterprise sim chain is logical; certs discount (study) feeds the cert shop; Bookshelf feeds both confidence and study; maintenance windows feed next-day ticket load; procurement feeds hw ticket spawn rates. No orphaned systems.
- **Terminology** — "budget" ($), "rep" per department, "stress/HP/XP", "ticket queue/board" used consistently. Day/night clock (09:00→16:00→night) consistent across v5.5 weather, v5.7 windows, v6.0 nightly sim.
- **No contradictions found** between helpdesk, combat, communication, org management, and enterprise layers. No abandoned features or outdated text.

## 4. Gameplay cohesion review

| Phase | Feel | Notes |
|---|---|---|
| Early (Help Desk Tech) | ✅ Teaches call → troubleshoot → battle loop; tech notes explain *why* | Tutorialization is diegetic, good |
| Mid (Senior → SysAdmin) | ✅ Console powers, trees, delegation layer in complexity gradually | Unlock toasts explain the "why" |
| Late (Infra/Security Eng) | ✅ VIP pressure, incidents, procurement politics — strategic choices | Maintenance windows punish skipping fairly |
| Endgame (Architect → CIO) | ✅ Command center reframes the game as portfolio management; night sim answers "what did my policy do" | v6.0.1 report loop closes the feedback gap |

Failure states teach rather than punish: failed changes explain rollback, wrong diagnoses show explanations, wrong evidence-board answers show reasoning. ✅

## 5. Priority-ranked remaining work

### P0 — must fix before release
- **None.** No broken mechanics, no save corruption paths, no console errors.

### P1 — major polish (done in v6.0.1)
- ~~Mobile touch targets~~ ✅
- ~~Quantified policy feedback + nightly report in Command Center~~ ✅

### P2 — quality-of-life (recommended next)
1. **Command Center visual upgrade** — canvas-rendered SOC wall (animated status lights, blinking site markers, connection pulses between sites) instead of dialog-only presentation; the dialog already carries the data, this is pure presentation layering
2. ~~Overnight events as phone notifications~~ ✅ **v7.17** — the NOC wires the LAST NIGHT report into the Teams phone every morning (chat toast + top entry + deep-link to the command center)
3. ~~EOD summary cross-links~~ ✅ **v7.17** — end-of-day carries color-coded enterprise uptime, outage count and the policy split
4. ~~Balance watch item~~ ✅ **v7.17** — nightly wear ceiling now grows with day count (+1 per 4 days, capped +5); full-security builds no longer strictly dominant

### P3 — future ideas (art & immersion plan)
1. **Character art variations** — the procedural sprite system (poses, emotes, equipment, rank gear) already supports layering; next step is role-specific sprite packs (Technician / Network Engineer / Security Analyst / Manager / Executive / Threat Actor / Vendor / End User) drawn from the same atlas pipeline, plus idle/work animation frames
2. **Environment depth pass** — parallax background layer for the office, ambient monitor glow (already partially in living-helpdesk), server-room blinking LEDs, cable dressing in more rooms
3. **Leadership emails & postmortems** — a morning inbox item (CFO note after procurement, CIO congrats after perfect uptime, PIR doc after major incidents) rendered in the phone UI
4. **SOC dashboard skin** — Fallout-style scanline/vignette CSS theme option for the command center dialog
5. **Audio pass** — the SoundCloud player exists; consider generated ambient loops (server fans at day, street rain at night)

## 6. Verdict

TechOps Hero v6.0.1 is a cohesive, contradiction-free build with a complete progression arc (call-taker → CIO → enterprise commander), 16 green test suites, and zero P0 defects. The P2/P3 items above are polish and presentation — the game underneath is done.

## v7.16 Addendum — Anti-Repetition Pass

The fresh pass found one P1 consistency defect and six repetition vectors, all fixed in v7.16:

- **P1 (fixed):** the five v5.3 ticket types (av_hdmi, av_teams, plant_scanner, label_printer, hw_replace) had no symptom quote — interviews rendered a literal `undefined` line.
- **Repetition (fixed):** single quotes per type, static symptom labels, one flag-down opener, a 16-name NPC pool, small ambient-chatter pools, and fixed decision-tree option order. All now rotate deterministically per day/occurrence (hash-seeded, no save bloat).

Suites: 11/11 green (v7.10/v7.15 retain their known headless timing flakes; game behavior correct).

## v7.17 Addendum — NOC Wire (P2 closeout)

Three of the four P2 quality-of-life items shipped: NOC phone channel, EOD cross-links, wear-scaling balance (13/13 new tests, 12/12 suites green). Remaining P2: the SOC-wall canvas command center (presentation layer) and the P3 art/immersion list.

## v7.19 Addendum — True Transparency (mobile sprite halo)

User-reported on iPhone: the player sprite showed a dark opaque box/halo and appeared to clip into NPCs ("the characters aren't transparent"). Root-caused to palette-PNG atlases with RGB(0,0,0) transparent entries (Safari interpolates palette alpha without premultiplication) plus the player being the only sprite drawn with bilinear smoothing. Fixed by re-encoding all five character/prop atlases as alpha-bled RGBA (opaque art byte-identical) and forcing nearest-neighbour in the player draw path. Regression guard: test-v719.js asserts all atlases ship as PNG colour type 6 and the smoothing guard is in the drawPlayer chain. 12/12 new tests; suites v7.10–v7.19 all green.

## v7.20 Addendum — Field Polish (annotated mobile pass)

Five on-device annotations addressed: (1) spawn could land outside the lobby — now deterministic lobby-centre-out; (2) remaining palette-PNG atlases (emblem, glitch, apt, emote) alpha-bled to RGBA like v7.19's five; (3) NPC sprites up to 40px with a 2-frame wander step; (4) all 40 scenic props inspectable with name + flavour; (5) Teams phone docked into the HUD column, 44px targets, toasts shifted left. Conversations: proximity decides face-to-face vs phone-call framing; per-department opener/reassure/demand/filler tables. 10/10 new tests (test-v720.js).

## v7.21 Addendum — Runtime Bleed (durable sprite-halo fix)

v7.19/v7.20 fixed the Safari palette-PNG black halo at the file level, but the fix was per-asset and expensive (5x payload), and any un-bled palette PNG already hosted (or added later) would regress. v7.21 moves the guarantee into the renderer: a `CanvasRenderingContext2D.drawImage` wrapper alpha-bleeds any decoded PNG data-URL image on first draw (multi-source BFS flood of opaque edge colours through transparent regions) and substitutes the bled canvas as the draw source thereafter; `dlg()` is wrapped to async-bleed DOM `<img>` embeds (title crest, dialog seals/portraits). Exactness: all atlases use binary alpha (0/255), so the getImageData/putImageData premultiplication round-trip is lossless. The repo keeps the compact palette atlas parts — runtime bleed supersedes the file-level RGBA re-encode, which remains harmless (idempotent) in the local tree. Regression guard: test-v721.js asserts the drawImage wrapper substitutes a bled canvas whose opaque art is pixel-identical (canvas readback is premultiplied, so transparent RGB always reads black in-page — the fix works because canvas sources are *sampled* premultiplied, bypassing Safari's palette-decode path), DOM embeds get swapped, and the game boots clean. 10/10 new tests; suites v7.10–v7.20 green.

## v7.22 Addendum — Night Drive (cinematic drive-home)

The 16:00 exit used to hard-cut from dialog to the night platformer. v7.22 wraps `enterNight` (the single choke point for the South Exit door and both v6.8 security sweeps) with a skippable, letterboxed five-shot cinematic — rainy AeroTech exit, dashboard wake, neon parallax drive, Iron & Tide standoff, BATTLE START — built entirely from procedural canvas + WebAudio (zero new assets; player frames ride the v7.21 bleed path). Reference-board corrections applied: legible-English neon only, canon Mike sprite, glitch-creature antagonist. World input is frozen (`inDialog`) during playback; E/Enter/Space/click skips; Felicia mode gets the Impreza variant. Regression guard: test-v722.js (10 tests) covers wrap, overlay lifecycle, input freeze, frame progression, skip-to-night, full playthrough, and error-free boot.

## v7.23 Addendum — The Line Goes Dark (critical-incident cinematic)

Sev-1 alerts used to be a bare banner. v7.23 wraps `sevBanner` (the single choke point for v5.3 anomaly detection, v5.4 escalation, and both v5.5 Friday-spike/tree-spawn alarms) with a skippable, letterboxed six-shot cinematic built from the CRITICAL INCIDENT reference board: line running → network down (red beacon + klaxon) → operators call Mike → rack trace with toner probe → ROGUE DHCP reveal (device ID 82:7A:AC:19:3F:2B, 192.168.50.143, UNAUTHORIZED) → cut/spark/resolve + a brand-new procedural watcher silhouette on the catwalk and a NEW CLUE strip. Discipline: world input frozen via `inDialog`; guards refuse to interrupt dialog, battle, night mode, or the v7.22 drive cinematic; the original banner always fires after skip or completion. All art procedural (robot arms, conveyor, racks, beacon, watcher) — zero new assets, no reused character sprites, emoji-free glyphs (the warning triangle is drawn). Audio synthesized (rumble, klaxon, spark, resolve hum) and volume-gated. Regression guard: test-v723.js (17 tests) covers wrap, guards, overlay lifecycle, input freeze/restore, frame progression, skip semantics, full playthrough, banner handoff, and error-free boot.

## v7.24 Addendum — Ghost in the Boot Drive
- **Wrap discipline:** outermost wrap of `checkDayEnd` (after v53/v56/v68/night_hooks); fires only when `s.meta.tree.cracked` and the day is actually ending, latches once per day via `s.meta._v724Day`, and always chains to the original day-end flow after skip or completion.
- **Guards:** never plays while `S.inDialog`, `S.inBattle`, `S.nightMode`, or an active v7.22/v7.23 cinematic; world input frozen via `S.inDialog = true` during play; capture-phase keydown swallows keys; skip via E / Enter / Space / Escape / click.
- **Canon art:** Mike drawn from `playerImg`/`PLAYER_ATLAS` (auto-bled by v7.21); supervisor is a new procedural silhouette (cap + hi-vis vest) — no Felicia reuse; every glyph drawn as shapes (no emoji in the art); AeroTech Mfg — Plant 7 naming.
- **Settings:** all audio through its own AudioContext with gain scaled by `V67SET.volSfx`.
- **Tests:** `test-v724.js` — 17/17 (install, wrap, title, guards, latch, skip, full playthrough, clean state, zero page errors); full 19-suite regression green with widened version regexes.

## v7.25 Addendum — Interactive Cinematic Pack (coffee / mentor / betrayal / city)

- **Wrap discipline**: `checkDayEnd` wrapped outermost (loads after `v724_hooks.js`); the original chain always runs after skip/completion, deferred via the engine callback. One cinematic per day via the `S.meta._v725Day` latch.
- **Guards**: no fire during dialog/battle/nightMode or while a v7.22/v7.23/v7.24 cinematic is active; requires the day to actually end (`ticketsDone >= ticketsTotal` or `force`).
- **Story order**: coffee (day >= 11) → mentor (day >= 12) → betrayal (day >= 14) → city (day > `_v725betrayalDay`). Betrayal's choice is stored in `S.meta._v725betrayal` (`"stop"`/`"follow"`); skipping betrayal before the choice leaves it unresolved and it re-arms the next day.
- **Interactivity**: choice shots pause the timeline; keys 1–3 or click pick an option; the overlay swallows all keys (capture phase) so gameplay stays frozen underneath; skip is disabled while a choice is on screen.
- **Canon art**: glyphs drawn as shapes (no emoji); Mike from the real player atlas; Felicia only via her own v6.4 atlas (`TO_FELICIA`/`FEL_ATLAS`); junior tech, CIO, and K are NEW procedural figures — no Felicia reuse; AeroTech / New Haven naming.
- **Settings**: all WebAudio gains scaled by `V67SET.volSfx`.
- **Tests**: `test-v725.js` — 19 asserts: install, registry, title/line3, day-gating, all four cinematics fire in order, both choice stores, once-per-day latch, city day-after rule, skip path, clean state, zero page errors.

## v7.26 Addendum — Story Pack II (racks / citylife / promotion)

- **No parallel framework**: scenes register into the v7.25 engine via `v725.register(id, {title, shots, cues})`; drawing reuses the exported helper kit `v725.h` (panels, figures, maps). The engine gained 4-option choice keys (1–4) and per-scene named audio cues.
- **Wrap discipline**: `checkDayEnd` wrapped outermost (after v7.25); original chain runs after skip/completion; one cinematic per day across both packs (v7.26 sets the v7.25 day latch when it plays).
- **Guards**: no fire during dialog/battle/nightMode or active v7.22–v7.25 cinematics; requires the day to actually end.
- **Story order**: racks (day >= 8) → coffee (11) → mentor (12) → citylife (13) → betrayal (14) → city (15+) → promotion (16). Skipping before a choice re-arms that scene the next day; later scenes wait.
- **Persisted choices**: `_v726racks` (trace/contain/confront) + unlock flag; `_v726evening` (home/gym/coffee/crawl) with rewards (HP +25, stress -10) applied **after** the day-end chain and exactly once (`_v726eveningPaid`); `_v726rollback` (global/staged) + `_v726adminII`.
- **Tests executed**: `test-v726.js` — 23/23 (install, registration, guards, all three scenes fire in order, choice stores, exactly-once rewards, unlock flags, once-per-day, skip path, clean state, zero page errors). Full 21-suite regression green (v7.10 east-door assert remains the documented headless timing flake — passes on rerun).

## v7.27 Addendum — Ride Along (the Charger & K's night run)

- **Edit, don't duplicate**: the v7.22 night drive's car draw was edited in place — the placeholder SUV became Mike's reference-faithful black Dodge Charger (slab body, hood scoop, green triple-tongue ghost flames, green wheel rings, full-width rear light bar, green underglow) inside the same `suv()` function; Felicia's Impreza branch untouched. The draw is exported as `v722.car` so K's cinematic reuses it instead of redrawing.
- **Registration, not a new framework**: K — THE NIGHT RUN is data on the shared v7.25 engine (`v725.register("krun", {title, shots, cues})`); the Mercedes, rain, and speed lines are new helpers in `v727_hooks.js` only.
- **Wrap discipline**: `checkDayEnd` wrapped outermost (after v7.26); the original chain always runs after skip/completion. One cinematic per day across all three packs — v7.27 sets `_v727Day` plus the v7.25/v7.26 latches when it plays.
- **Guards**: day >= 17 AND the city handoff (`_v725city`) required; no fire during dialog/battle/nightMode or active v7.22–v7.26 cinematics; requires the day to actually end. Skipping before the choice re-arms the next day.
- **Persisted choice**: `_v727krun` (`"shotgun"`/`"charger"`) changes shot 4's composition (riding with K vs following in the Charger) and the reward-card line. Reward `_v727kLine` (K — DIRECT LINE UNLOCKED) applies after the day-end chain, exactly once.
- **Tests executed**: `test-v727.js` — 19/19 (install, registration, exports, guards incl. the city-handoff requirement, choice hold, both branches, once-per-day, skip path, offscreen-canvas draw smoke for both cars, zero page errors). Full 22-suite regression green (older suites' version regexes widened to v7.27; v7.4/v7.5/v7.20 asserts are timing-flaky under parallel load and pass in isolation).

## v7.28 Addendum — Performance Pass

- **Root-caused, not guessed**: canvas-op counters + per-context attribution isolated the lag to (1) the minimap redrawing all 1,344 map cells per frame, (2) the tile layer's ~2,400 `px()` fillRects per frame, (3) the v7.6 light map building radial gradients per light per frame with an adaptive LOD that measured only its inner draw cost. fillRect 3,294 → ~600/frame (−82%); radial gradients 0; light-map ctx ≈0ms.
- **Fixes in place, no parallel systems**: minimap and tile layer cached to offscreen canvases inside `game.js`'s existing draw (keyed on the live `s.map` reference; tile cache refreshes on the 400ms blink quantum so monitor/LED blink survives; conveyors excluded — they animate at 120ms off live ticket state). `px()` retargets via `pxCtx` — one line. Light map stamps a cached glow blob at half-res; EMA now covers the whole wrapped frame.
- **Pixel-perfect kept**: the tile cache stamps with `imageSmoothingEnabled = false` (caught by test — the first version of the assertion sampled the wrong canvas and exposed that the unscaled cache would have blurred; fixed before ship).
- **Environment honesty**: absolute draw-ms in the sandbox swings ±30% run-to-run (2-core software rasterizer, shared with the platform browser); a same-machine A/B (stash fixes, re-measure, restore) proved the noise and confirmed the op-count wins are the durable fix.
- **Tests**: `test-v728.js` — 15 asserts: title/line3, both caches live and keyed to the map, amortized drawTile budget, blink-quantum refresh, conveyor overlay, zero per-frame gradients, fillRect budget, varied world pixels, pixel-perfect cache stamp, save still writes, movement with caches, zero page errors. Full 24-suite regression green.

## v7.29 Addendum — Signals from the Dark (story pack III)

- **No parallel framework**: all three boards register into the v7.25 engine; drawing reuses `v725.h` plus two new shared draws exported as `v729.eye` (ORPHEUS eye) and `v729.wave` (soundwave).
- **Wrap discipline**: `checkDayEnd` wrapped outermost (after v7.27); day-end chain runs first, rewards land on top exactly once; one cinematic per day across all four packs.
- **Guards**: day-gated chains — wires needs day>=9 + `_v726racks`; signal needs day>=15 + `_v725betrayal`; orpheus needs day>=18 + `_v727kLine`. Each negative gate is test-covered.
- **Suite maintenance**: v7.25/v7.26/v7.27 suites pre-resolve the v7.29 latches in their isolation blocks (a new outermost pack would otherwise steal their day slots — caught as a real regression, fixed in the suites, not the game).
- **Tests**: `test-v729.js` — 27 asserts: install, registration, exports, title/line3, all three day gates (negative + positive), three choice stores, exactly-once rewards (follow→trace flag, sign→night contract, stand-down→nothing), once-per-day latch across all packs, no refire, skip path, standalone draw execution, save persistence of the latches, clean state, zero page errors.
- **UAT**: `uat-v729.js` — 11 asserts on the production path (no dev flag): cold boot, world entry, movement, NPC dialog, save marker → reload → continue → restored, cinematic engine live, mobile viewport (390×844) canvas fit + dialog reachability, zero page errors. Cinematics screenshot-verified (traceroute, rooftop violin, ORPHEUS eye).
- **Known gap (definition of done)**: gamepad/controller input is still not implemented anywhere in the codebase — tracked as an open item, not claimed.

## v7.30 Addendum — Second Movement (gamepad + story pack IV)

- **Controller support (definition-of-done item closed)**: the pad polls inside the existing frame loop and writes the same `keys` object every system already reads — day movement, night crawl run/jump/dash/block all work with zero changes to those systems. Buttons are edge-triggered against the same functions the keyboard calls (`interact`, `openPanel`/`closePanel`, `phonePanel`, `toggleTwin`). A gold focus ring walks dialog/battle/EOD button lists (dpad/stick), A activates; v7.25-engine choices navigate by dpad and confirm with A through the engine's own key handler (out-of-range keys are engine-ignored). World keys are never written while a dialog, battle, panel, EOD screen or cinematic owns input.
- **Boards**: badge (day>=10 after `_v729wires`) and emerald (day>=19 after `_v729orpheus`) register on the shared v7.25 engine; choices persist in `S.meta` (`_v730badge` + per-choice flags, `_v730secondMovement` + `_v730secondMvmt`); rewards apply after the day-end chain, exactly once; one cinematic per day across all five packs (v7.30 latches its own and all earlier day flags).
- **Tests executed**: `test-v730.js` — 32/32 (title/line3, exports, step+loop wraps, mocked-pad detection, stick & dpad movement, panel open/close, A-interact with focus ring, battle action + win, pad-driven engine choice, save persistence, disconnect handling, both boards' negative gates, full playback through the real checkDayEnd choke with choices and exactly-once flags, zero page errors). Suite hardening note: earlier packs' day-gates are pre-latched in the board tests (standard isolation pattern).
- **Full regression**: 26/26 suites green.

## v7.31 Addendum — Night Shift (night-crawl rework)

- **Reference fidelity**: districts from the sheet's city locations (Downtown / Long Wharf / Industrial / Wooster / Airport / Suburbs + Home Street); enemies use the sheet roster (Street Thug, Corrupt Guard, Cyber Skimmer, Drone Operator, Elite Hunter) as night-glitch silhouettes with tint underglows; HUD carries the sheet's HP/FOCUS/COMBO/DANGER/district/time readouts; the Charger waits at the left end of every street as the hub.
- **Beat-'em-up mechanics**: hit-stop on connect (heavier on kills), jab chain (jab → jab → launcher sweep), guard blocks, skimmer blink-steps, drone-op mid-range zaps, hunter lunges, attack tokens cap simultaneous aggressors at 2, knockdown states, block chips at 25%. Rhythm-perfect timing system kept from v5.0.
- **Traversal**: E at the Charger opens the district map; a 1.5s in-engine drive transition; cleared districts lock out with a +$40 bonus; HOME STREET ends the night into the normal day-end flow; KO still limps home (+20 stress).
- **Performance**: same pass caught and fixed a real periodic hitch — the v7.28 tile cache rebuilt the full map every 400ms (12.5ms/1,318 drawTile calls spike); the quantum refresh now repaints only the ~30 blinking cells (measured 2.8ms/41 calls, steady with normal frames).
- **Tests executed**: `test-v731.js` — 29/29 (title/line3, district & archetype tables, night entry through the drive cinematic, car menu, district travel + roster, jab-chain kill with hit-stop and cash, finisher launch, attack-token cap, block chip, street/district progression, clear bonus, map lockout, home-street ending, KO path, tracker suppression/restore, zero page errors). Full regression: 27/27 suites green.

## v7.32 Addendum — Opening Theme

- **Menu music**: techops-theme.mp3 loops on the title screen; gesture-gated per browser autoplay policy; stops on run start (in-game music handoff), resumes on title return; wired into the existing music toggle and V67SET.volMusic slider. The file ships in-repo (2.9 MB).
- **Save hardening**: rotation lives in the storage layer (save()/load() are lexical consts and can't be wrapped) — every write rotates the previous blob to `techops_save_bak`; every read validates JSON and falls back to (then heals from) the backup. Covers both the missing-slot and corrupt-slot cases.
- **Scene validator**: `v732.validate()` walks the v7.25 registry (new read-only `defs()` accessor) and rejects duplicate ids, store-less choices, duration-less shots, choice-final scenes, and over-long captions. Runs automatically behind ?dev=1.
- **Tests executed**: `test-v732.js` — 16/16 (title/line3, exports, theme element/loop/src, play-on-gesture, stop-on-run-start, slider volume, mute toggle, backup rotation, corrupt-slot heal, validator clean + broken-scene rejection, asset served, zero page errors). Full 28-suite regression green.

## v7.33 Addendum — Friends in High Places

- **Social district discipline**: Waldo's Place rides the v7.31 Charger hub as a roster-empty district; E is social-only there (jab suppressed), the car menu/home flow are untouched, and no combat systems were duplicated — augments wrap `nmJab`/`drawNM` in place.
- **Stress/time truth**: the v7.33 stress effects only move the setupDay clock (08:30 clear-head / 09:30 burnout); a recovered block is possible once per day by construction, matching the brief's anti-exploit rule.
- **Car truth**: condition lives on `S.car` (persisted), degrades only on combat-district drives, breakdowns are capped by ROAD READY, and repairs are a coop minigame — maintenance never becomes busywork.
- **Asset pipeline**: four new production sheets (Waldo poses/actions, dialog UI kit, environment kit x4 incl. terrain grid) sliced to transparent frames with uniform cells + bottom-center pivots; shipped as split base64 payloads (`waldo_*`, `env_*`) with `.atlas.js` metadata; full frame zip delivered separately.
- **Caught by test**: the Waldo scene draw initially referenced the canvas size via an undefined `W` — the frame threw before mowing state could update; the mowing test caught it (fixed, suite green).
- **Tests executed**: `test-v733.js` — payload/exports, district menu, arrival, intro cinematic, mowing Q1 payout + exactly-once flags, porch story choice persistence, tracker choice (trace) + diagnostics upgrade, coop repair minigame (marker timing, mates-rates charge), Orbital Trace marking launched enemies, equip persistence, both stress tiers, Ghost Shift seed, save/reload survival, zero page errors.

## v7.34 Addendum — Ghost Fork

- **Bestiary, not fork**: NULL SHEPHERD is an NM_KINDS entry spawned through the stock nmSpawnEnemies wrap; teleport/beam/phase live in a stepNM post-wrap; the stock silhouette draw remains under his atlas frames as shadow.
- **Backdrops as a hook, not a rewrite**: one guarded branch in drawNM paints the decoded district image instead of the procedural sky layers; street, railing, lamps, HUD and every combat layer are untouched, and any missing payload falls back to the v7.31 look.
- **Chain discipline**: gk1..gk6 gate on the v7.33 ghost seed and days 20–25, latch all earlier packs' day flags when they play, and gk6 additionally requires the boss kill — tested negative and positive.
- **Caught by test**: the boss initially spawned without a `face`, so the beam column resolved to NaN and every frame threw inside the lamp-glow gradient — the beam test caught it (face now derived each tick).
- **Tests executed**: `test-v734.js` — 37/37 (payloads, registration, validator clean, draw smoke, seed gate, full mission chain in order, archive choice persisted, exactly-once rewards, gk6 boss gate, backdrop decode, boss spawn/teleport/beam/phase/defeat loot, companion unlock, decoy once-per-night, porch conversation, save/reload, zero page errors). Full battery green: regression 26/26, v733 29/29, v732 17/17, v731 29/29, v730 32/32, v729 27/27, uat 14/14.

## v7.35 Addendum — Good Dogs

- **Async-asset discipline**: data-URL Images decode asynchronously — first-use creation made the first dialog plate / dog draw silently miss. All v7.35 images are pre-warmed at load; the crop cache never stores a miss. Caught by the plate/dog tests.
- **Interception discipline**: v7.35's interact wrap is outermost; garage interior waits for the tracker quest (stock menu wins first), the den door sits clear of K's porch spot, and the dish queues quest offers before the market. The stuck-v723-overlay flake class is handled in-suite (clearBlockers pattern).
- **Canon patch verified by test**: archive crystal = recorded simulations, INSTALL/DESTROY/DIVIDE, "course: Earth", stories-not-memories.
- **Tests executed**: `test-v735.js` — 31/31 (registration, validator, draw smoke incl. key-art patches, plate injection, canon strings, dog/decoy atlas renders, den & garage interiors, parts→nowhere→party→brothers chain with persisted choices, rest-day block exactly-once, CLOSE AIR SUPPORT, save/reload, zero page errors). Full battery green: regression 27/27, v734 37/37, v733 29/29, v732 17/17, v731 29/29, v730 32/32, v729 27/27, uat 14/14.

## v7.36 Addendum — Full Wiring

- **Every payload accounted for**: felicia_music (signal close-up + encore), dogs_action (arrival bark + idles), portraits_ui (dialog busts), warden_null (boss), enemy_roster (archetype overlays), bg_shuttle_crew (alt title) wired; ui_lobby / mike_actions / interiors explicitly reserved in README (multiplayer / combat-depth / Hollow Network cycles).
- **Caught by test**: the style-rank wrap read NM.hp after a KO had nulled NM mid-step (v7.31 KO path) — the zero-page-errors assert caught it; the wrap now re-checks NM after the inner call. The v7.36 Felicia-portrait assert codified the yield rule (v7.7 wins when present).
- **Boss discipline**: Warden Null is an NM_KINDS entry + post-step wrap, same pattern as NULL SHEPHERD; the cage root restores pre-step position rather than touching input.
- **Tests executed**: `test-v736.js` — 28/28 (registration, validator, draw smoke incl. patched signal shot, alt title flag, portrait busts, roster render, style rank, dog bark, three quests with persisted choices + exactly-once skill unlocks, Warden spawn/teleport/laser/cage/defeat latch, save/reload, zero page errors). Full battery green incl. v731 KO path 29/29.

## v7.37 Addendum — Third Shift

- test-v737.js: 19 asserts (facility gate/drives/grade paths, dead drops + radio, EOD pose,
  persistence, zero errors). Two implementation bugs caught pre-ship: async Image decode on the
  EOD pose (warmed at load) and mission drive state not resetting on district reload.
- Version-lock: title regexes +37, line3 +THIRD SHIFT, regression +gs1 scene.
- Battery: regression 29/29, v731 29/29, v732 17/17, v729 27/27, v730 32/32, v733 29/29,
  v734 37/37, v735 31/31, v736 28/28, v737 19/19, uat 14/14.

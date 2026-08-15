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

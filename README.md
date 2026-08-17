# TechOps Hero v6.0 — ENTERPRISE COMMANDER

A persistent top-down action-RPG / IT operations simulator. You play a Help Desk Technician at AeroTech Mfg who fights escalating tech support tickets (calls, chats, portal submissions), builds skill with AI-verified interview/diagnosis mechanics, climbs the corporate ladder from Help Desk Technician to CIO, and ultimately commands AeroTech's global enterprise from a multi-site command center.

**Version 6.0.1 — ENTERPRISE COMMANDER** | Built on v5.9 Uptime Sunday, v5.8 Home Upgrades, v5.7 Environment & Infrastructure, v5.6 Reality Upgrades, v5.5 Launch Retrospective, v5.4 The Support Floor, v5.3 Smarter Tickets, v5.2 The Floor & The People, v5.1 The Streets, v5.0 Night Shift, v4.9 The Foundation, v4.8 The Building

## Quick Start

```bash
cd techops-hero
python3 -m http.server 8000
# open http://localhost:8000
```

Or deploy the folder to any static host — no build step, no dependencies.

## The Core Loop

1. **Work tickets** — Calls come in (ring, answer with E). Interviews use the v5.3 3-phase conversation engine (openers → probes with diminishing returns → conclusions); diagnose via 5-step guided diagnosis; fix via a turn-based portal battle
2. **Clock advances** — Interviews/diagnoses/battles/closes advance the work clock (09:00–16:00 shift)
3. **Exploration pays** — Tech Notes, the Troubleshooting Tree, and evidence boards give shortcuts on future tickets
4. **Climb the ladder** — XP → promotions (8 ranks: Help Desk Tech → CIO); cert shop, mentor feedback, knowledge board, department reputation
5. **Weather the chaos** — Server incidents, VIP tickets, Chaos Events, plant-critical safety tickets, radio hunt, marketplace
6. **Clock out at 16:00** — Finish your current ticket or Security walks you out at 16:59 (forced exit, +stress)
7. **Night shift** — Fight through 3 New Haven streets (+20 min each), come home to cooldowns & scavenging
8. **End of day** — Stats summary + choose a reward (Bonus Pay / Recovery / Next-day Head Start)
9. **Train & upgrade at home** — Spending time on house items unlocks permanent perks (meditation garden, server rack, bookshelf, garage boxing)
10. **Sunday strategy** — Deployment windows, planned maintenance, SLA tracking, and asset procurement on the house
11. **Command the enterprise** — From Security Architect: open the command center, watch 6 global sites, set the nightly policy, respond to incidents

## Feature History

### v6.0.1 — Enterprise Commander Patch
- **Command Center quantified feedback** — the policy panel shows exact nightly projections (incident odds per site, wear ceiling, recovery %); committing a policy toasts the exact numbers
- **Last Night report** — every morning (or on demand) the command center shows the previous night's per-site before→after health with incident/wear/recovery breakdown and a contextual 💡 advice line (more security vs more maintenance)
- **Mobile touch targets** — dialog/battle/EOD buttons are now ≥40px tall on coarse-pointer devices (was 21px — P1 fix from the final QA review)
- Enterprise uptime is color-coded in the command center (green ≥80 / amber ≥40 / red below)
- **Fix**: `nmCarMenu` on empty district no longer shows duplicated Home entry (v7.31 regression from empty Waldo roster)

### v6.0 — Enterprise Commander
- **Command Center** (🛰️) — security command center overlay (Security Architect+; CIO aura at CIO)
  - Multi-site world view: 6 sites (New Haven HQ, Austin, Frankfurt, Singapore, São Paulo, Tokyo) with health color coding and stats
  - Nightly simulation — each site rolls an incident risk (25% − 3%·security + 4%·wear) then health drift
  - Active incident row — site in trouble glows red; respond for cash or ignore for health damage; all sites restored at dawn
  - **Policy matrix** — split 10 points across Security / Maintenance / Training each night; changes take effect tonight
  - Command XP — earning points toward the next command rank (up to CTO at level 10)
  - Enterprise uptime, command rank, cash bonuses, stress impact
  - 7 new command achievements (FIRST SHIFT, SMOOTH OPERATOR, IRON CURTAIN, NIGHT WATCH, CRISIS AVERTED, FLEET COMMANDER, CTO)

### v5.9 — Uptime Sunday
- **SLA tracking** — 🏭 UPTIME panel tracks plant-critical response times with grade (A ≥90% within 20min, B ≥75%, C ≥50%, D else)
- **Plant vendor procurement** — after day 4, the plant vendor cart stocks servers (reduce HW tickets), UPS units (one-time outage prevention), spare laptops (reduce laptop tickets)
- **Vendor politics** — procurement reps push deals with trade-offs: 10% discount but +4 stress on delivery day

### v5.8 — Home Upgrades
- **Home training tree** — spending time on house items builds permanent perks
  - Zen Garden → MEDITATIVE MIND (stress decays 2× at home)
  - Server Rack → RACK WIZ (start day with +1 tech note)
  - Bookshelf → DEEP READS (books restore +6 confidence instead of +3)
  - Garage Bag → SPARRING STANCE (start day with +8 HP)
- **Upgrade UI** — new 🏠 HOME tab in the menu panel showing progress toward each perk

### v5.7 — Environment & Infrastructure
- **Weather system** — day weather (☀️ sunny / 🌧️ rainy / 🌫️ foggy) affects spawn rates and movement speed
- **Day/night cycle** — office ambient light shifts with the clock (bright morning → warm afternoon → dim evening)
- **Deployment windows** — change requests must be scheduled; failed changes block the window for 1 day
- **Maintenance mode** — scheduling maintenance on a dept reduces next-day ticket load there

### v5.6 — Reality Upgrades
- **Guided diagnosis** — 5-step diagnostic wizard (identify → isolate → test → fix → verify) replacing single-shot diagnosis
- **Smart fix suggestions** — battles suggest the optimal move based on ticket root cause
- **Ticket templates** — recurring ticket archetypes get pre-filled symptom text
- **Patch management** — HW tickets have a 20% chance to require a patch deploy step
- **Ticket aging** — tickets sit on the queue too long → SLA breach warnings

### v5.5 — Launch Retrospective
- **Chaos events** — 3 daily random events (printer jam, network hiccup, vendor call) with player choice
- **VIP tickets** — executives with 2× payout but 1.5× stress on failure
- **Ticket bundle** — related tickets group into a single visit
- **Mentor feedback** — Diana reviews your closes; good diagnoses earn bonus XP

### v5.4 — The Support Floor
- **Phone queue** — multiple calls ring simultaneously; missed calls become tickets
- **Colleague AI** — floor techs walk, chat, and take tickets off the queue
- **Break room** — coffee machine restores confidence; snack machine restores HP
- **Standing desk** — adjustable desk for posture XP trickle

### v5.3 — Smarter Tickets
- **3-phase interview engine** — openers set tone → probes gather info (diminishing returns) → conclusions (5 types with accuracy scoring)
- **Anomaly detection** — tree flags conflicting evidence; finding the anomaly reveals the real root cause
- **AI response cache** — identical interview questions return cached answers instantly
- **Ticket linking** — root-cause tickets chain; fixing the root clears the chain

### v5.2 — The Floor & The People
- **Department reputation** — each dept (Eng, Mkt, Sales, Fin, Ops, IT) tracks rep; high rep = tip bonuses, low rep = harder interviews
- **Cert shop** — buy IT certifications with tickets; certs unlock dialogue shortcuts and pay bumps
- **Knowledge board** — post solved tickets for passive XP
- **Team lunch** — Friday lunch event; attend for rep, skip for productivity

### v5.1 — The Streets
- **Night crawl** — 3 procedurally-lit New Haven streets with combat, loot, and NPCs
- **Street vendors** — buy consumables, sell scavenged parts
- **Apartment** — home base with bed (sleep to end night), computer (remote work), and fridge

### v5.0 — Night Shift
- **Night mode** — after 16:00, explore New Haven; rhythm-perfect combat timing, stress decay at home
- **Radio hunt** — hidden radio signals to triangulate for lore + cash
- **Marketplace** — buy/sell gear with dynamic pricing

### v4.9 — The Foundation
- **Save system** — auto-save every 30s, localStorage persistence, continue run on boot
- **Achievement system** — 47 achievements across 8 categories
- **Settings panel** — volume, difficulty, keybinding reference
- **Tech notes** — discoverable documentation that unlocks diagnosis shortcuts

### v4.8 — The Building
- **Full office map** — 12 rooms (help desk, engineering, marketing, sales, finance, ops, server room, break room, conference, lobby, roof, basement)
- **NPC system** — 18 named characters with schedules, dialogue trees, and quest hooks
- **Ticket queue** — visual queue with priority ordering and aging indicators
- **Battle system** — turn-based portal combat with confidence/uncertainty bars

## The Org Ladder

| Rank | Unlock |
|---|---|
| Help Desk Technician | — |
| Senior Technician | scripting shortcut (diagnose skip) |
| Systems Administrator | delegation (assign tickets to floor techs) |
| Infrastructure Engineer | standups, outage management |
| Security Engineer | VIP escort, incident response |
| Security Architect | **command center** — multi-site enterprise view |
| CIO | **CIO aura** — command center bonuses |
| CTO | enterprise rank ceiling (command XP level 10) |

## The Command Center

From Security Architect rank, the 🛰️ button opens the security command center:

- **6 global sites** — New Haven HQ, Austin, Frankfurt, Singapore, São Paulo, Tokyo
- **Nightly sim** — each site rolls incidents (25% base − 3%·security + 4%·wear) then health drifts
- **Policy matrix** — 10 points/night across Security / Maintenance / Training; projected outcomes shown live
- **Incident response** — red sites need attention; respond for cash or ignore for health loss
- **Last Night report** — morning briefing with per-site deltas and advice
- **Command ranks** — NOC Operator → SOC Analyst → Incident Commander → Site Director → Regional Director → VP Operations → SVP Infrastructure → EVP Technology → CTO

## The House

Your apartment has 4 trainable stations. Time spent unlocks permanent perks:

| Station | Perk | Effect |
|---|---|---|
| Zen Garden | MEDITATIVE MIND | Stress decays 2× at home |
| Server Rack | RACK WIZ | Start each day with +1 tech note |
| Bookshelf | DEEP READS | Books restore +6 confidence (was +3) |
| Garage Bag | SPARRING STANCE | Start each day with +8 HP |

Progress is tracked in the 🏠 HOME tab.

## Tech Stack

- **Engine** — vanilla JS + Canvas 2D, no frameworks, no build step
- **Sprites** — procedural pixel art via canvas (no image assets)
- **Audio** — Web Audio API (procedural chiptune SFX) + SoundCloud embed for music
- **Persistence** — localStorage (save every 30s + on day end)
- **Testing** — Puppeteer regression suites (16 suites, 100+ assertions)

## File Map

| File | Purpose |
|---|---|
| `index.html` | DOM shell, HUD, dialogs, title screen, script load order |
| `style.css` | All UI styling, HUD, dialogs, battle, panels, mobile media queries |
| `game.js` | Core engine: map gen, render loop, input, camera, ticket system, battle, save |
| `player*.js` | Player sprite atlas (5 parts) + assembler |
| `sp*.js` | NPC sprite atlas (9 parts) + assembler |
| `sprite_hooks.js` | Sprite animation hooks (walk cycles, expressions) |
| `comm_hooks.js` | Communication: phone, chat, email, radio hunt |
| `night_hooks.js` | Night mode: streets, combat, vendors, marketplace, apartment |
| `office_hooks.js` | Office: cert shop, knowledge board, team lunch, dept rep |
| `org_hooks.js` | Org: promotions, mentor feedback, VIP tickets, chaos events |
| `v53_hooks.js` | Interview engine, anomaly detection, response cache, ticket linking |
| `v54_hooks.js` | Phone queue, colleague AI, break room, standing desk |
| `v55_hooks.js` | Chaos events, VIP, bundles, mentor |
| `v56_hooks.js` | Guided diagnosis, fix suggestions, templates, patches, aging |
| `v57_hooks.js` | Weather, day/night light, deploy windows, maintenance |
| `v58_hooks.js` | Home training tree, home tab UI |
| `v59_hooks.js` | SLA tracking, plant procurement, vendor politics |
| `v60_hooks.js` | Command center, nightly sim, policy matrix, command ranks |
| `v61_hooks.js` | Emblem system (3 parts) + assembler |
| `v62_hooks.js` | Skyline (3 parts) + assembler |
| `v63_hooks.js` | Props system (11 parts) + assembler |
| `v64_hooks.js` | Felicia arc (12 parts) + assembler |
| `v65_hooks.js` | NPC enhancements (12 parts) + assembler |
| `v66_hooks.js` | Room interiors: IT (8 parts) + assembler |
| `v67_hooks.js` | Room interiors: Engineering (3 parts) + assembler |
| `v68_hooks.js` | Room interiors: Factory (3 parts) + assembler |
| `v69_hooks.js` | Room interiors: Office (3 parts) + assembler |
| `v70_hooks.js` | Glitch system (4 parts) + assembler |
| `v71_hooks.js` | Apartment interior (2 parts) + assembler |
| `v72_hooks.js` | Emote system (2 parts) + assembler |
| `v73_hooks.js` | Panel system: tabs, settings, achievements, stats |
| `v74_hooks.js` | Panel: inventory, equipment, consumables |
| `v75_hooks.js` | Panel: skills, certs, tech notes |
| `v76_hooks.js` | Panel: quest log, dept rep, knowledge board |
| `v77_hooks.js` | Panel: portraits (12 parts) + assembler |
| `v78_hooks.js` | Panel: world map, fast travel |
| `v710_hooks.js` | Panel: battle log, move reference |
| `v711_hooks.js` | Panel: radio hunt tracker, marketplace history |
| `v712_hooks.js` | Panel: vendor contacts, procurement status |
| `v713_hooks.js` | Panel: SLA dashboard, uptime history |
| `v714_hooks.js` | Panel: home training progress, perk list |
| `v715_hooks.js` | Panel: weather forecast, deploy schedule |
| `v716_hooks.js` | Panel: interview reference, diagnosis guide |
| `v717_hooks.js` | Panel: NOC wire, EOD cross-links, wear scaling |
| `v718_hooks.js` | Panel: interview rules, consistency fixes |
| `v719_hooks.js` | Panel: sprite transparency, atlas re-encode |
| `v720_hooks.js` | Panel: mobile fixes, Teams dock, prop inspection |
| `v721_hooks.js` | Panel: runtime bleed, drawImage wrapper |
| `v722_hooks.js` | Night drive cinematic (Charger, Felicia variant) |
| `v723_hooks.js` | Critical incident cinematic (sevBanner wrap) |
| `v724_hooks.js` | Day-end cinematic (checkDayEnd wrap) |
| `v725_hooks.js` | Cinematic engine: register, play, choice shots, audio cues |
| `v726_hooks.js` | Story pack II: racks, citylife, promotion |
| `v727_hooks.js` | Story pack III: K's night run, Mercedes, Charger update |
| `v728_hooks.js` | Performance: tile cache, minimap cache, light map optimization |
| `v729_hooks.js` | Story pack IV: wires, signal, orpheus |
| `v730_hooks.js` | Gamepad support, badge board, emerald board |
| `v731_hooks.js` | Night shift rework: districts, archetypes, hit-stop, jab chain |
| `v732_hooks.js` | Opening theme, save hardening, scene validator |
| `v733_hooks.js` | Waldo's Place: social district, car, stress tiers, intel skills |
| `v734_hooks.js` | Ghost Fork: K's arc, NULL SHEPHERD, district backdrops |
| `v735_hooks.js` | Good Dogs: portraits, interiors, questline finale |
| `dogs.js` + `dogs.atlas.js` | Manchez & Katrin atlas loader + frame metadata |
| `warden_null.js` + `.atlas.js` | Warden Null atlas loader + frame metadata |
| `portraits_ui.js` + `.atlas.js` | Portrait & UI atlas loader + frame metadata |
| `mike_actions.js` + `.atlas.js` | Mike action atlas loader + frame metadata |
| `enemy_roster.js` + `.atlas.js` | Enemy roster atlas loader + frame metadata |
| `interiors.js` + `.atlas.js` | Interior atlas loader + frame metadata |
| `bg_garage.js` | Waldo's garage backdrop loader |
| `bg_waldo_den.js` | Waldo's den backdrop loader |
| `bg_shuttle_crew.js` | Shuttle crew backdrop loader |
| `techops-theme.mp3` | Opening theme music (2.9 MB, loops on title) |

## Controls

| Input | Action |
|---|---|
| WASD / Arrows | Move |
| E | Interact / answer phone / enter portal |
| 1–4 | Battle moves / dialog choices / cinematic choices |
| Tab | Menu panel |
| M | Toggle music |
| T | Digital twin overlay |
| Esc | Close panel / dialog |

**Mobile:** touch joystick (left) + action buttons (right). All dialogs and panels are touch-scrollable.

**Gamepad:** left stick / dpad to move, A to interact, B to cancel, X for menu, Y for phone. Focus ring navigates button lists.

## Testing

```bash
cd tests
node test-v735.js    # latest release suite (31 assertions)
node run-all.js      # full battery (27 suites + UAT)
```

All suites run headless against a local HTTP server. Known flake: v5.1 symptom-first test has a ~30% timing issue in CI only (game behavior correct).

## Roadmap

- **v7.36+** — SOC-wall canvas command center (P2), character art variations (P3), SOC dashboard skin (P3), audio pass (P3)
- **Future** — multiplayer floor techs, mod support, Steam Deck verification

## License

MIT — do whatever you want, just don't ship it as your own game jam entry.

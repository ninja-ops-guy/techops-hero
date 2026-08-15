# TechOps Hero v7.23 — AeroTech Division

A roguelite IT help-desk RPG. Every ticket is a dungeon. Every day is a run.
You start answering calls alone — you end up running an IT organization.

## Play
Open `index.html` in any browser, or host the folder anywhere static (GitHub Pages, Netlify, S3...).
Live version: **https://ninja-ops-guy.github.io/techops-hero/**
Mobile-friendly: virtual joystick + touch buttons on coarse-pointer devices — night mode now has full touch controls too.

## Controls
- **Move:** WASD / arrow keys, or on-screen joystick (mobile)
- **Interact:** E / Enter / Space, or the Ⓐ button (mobile) — becomes 👊 JAB at night
- **Menu:** M or ☰
- **Teams phone:** 📱 button or P
- **Night (mobile):** joystick moves & jumps, ⚡ DASH and 🛡️ BLOCK buttons appear
- **Digital Twin overlay:** V or the 🛰️ HUD button
- **Settings:** ⚙️ in the HUD · **Cutscene gallery:** 🎬 · **Exit a side-view room:** Q / Esc or the left door

## The loop
1. **📞 The Call** — every ticket starts as a communication battle. Fill the caller's Ticket Gauge without draining their Patience. Executives have none; HR talks forever; Manufacturing shouts over line noise. Push too hard and they call your manager.
2. **Interview & Troubleshoot** — question the user, then work the process: gather information (*"When did this start?" "Can you reproduce it?" "What changed recently?"*), rule out wrong causes one by one, and only then form a conclusion. Skipping straight to a conclusion is a blind guess — no bonus, and the ticket remembers.
3. **🌀 Portal battle** — turn-based combat where **Uncertainty is the real enemy**: gather weighted evidence (testimony, logs, network, config), prune the root-cause tree, and only hypothesize at 60%+ Confidence. Blind fixes backfire and build tech debt.
4. **Close & grow** — XP, budget, department reputation, knowledge mastery. Coffee restores you (and the mug is sacred).
5. **🌃 Night Crawl** — at 16:00 the South Exit opens. Outside, the game becomes a floaty platformer: dash, double-jump (with flip), and clear three New Haven streets of glitch creatures in rhythm-based beat-'em-up combat — then head home and end the day.

## Systems
- **Week cycles** — HUD shows the weekday: **Monday ticket floods** (+2 walk-ins) and the dreaded **Friday 4:45 PM emergency** (a codenamed critical, always at quitting time)
- **Daily weather** — sunny (+5% production), rain (networking closes pay +$10, animated rain), thunderstorm (+5 stress, higher incident odds, lightning blinks), heatwave (terminal drills pay +$2 for hiding in the AC)
- **Full mobile night support** — on-screen DASH/BLOCK buttons, the Ⓐ button becomes 👊 JAB, and the virtual joystick now drives night-mode running/jumping/double-jumping; small-screen polish for chats and banners
- **Phone/Teams interface** — tickets arrive as chat notifications (📱 button or P key): reply "on my way", remote in, delegate to the crew, or escalate to a codenamed CRITICAL — all from your pocket
- **Living helpdesk** — the IT room visibly levels up with your rank: cable spaghetti and one coffee mug → extra monitors, dashboard wall, motivational posters → gold-trimmed COMMAND CENTER with your rank on the plaque
- **AV / Workplace Tech tickets** — conference room "No Signal", Teams Room offline, warehouse scanners, shipping label printers: the high-frequency people-facing side of real IT
- **Hardware lifecycle** — End-of-Life laptops land on your bench with a device card (model, age, warranty, battery health): **repair** ($40, 60 min, success odds shrink with age) vs **replace** ($350, 30 min, near-certain). Lifecycle math included
- **VIP support pressure** — executive tickets are flagged VIP: handle them and they advocate to the CIO (+$40, +1 extra rep); ignore them and they escalate UP (rep loss, stress)
- **Cinematic incident alerts** — screen shake + red banner when a dependency tree wakes up
- **Ops Monitor** — NASA-style dashboard in the management console: network health, security posture, user satisfaction, technical debt
- **Promotion-track perks** — your rank now unlocks real powers at the management console (Mike's desk): **scripting** (Senior+: auto-close a remote ticket daily), **delegation** (Site Admin+: hand tickets to Nick/Amit/Brandon/Daniel, closed by day end), **team standups** (Systems Admin+: -15 stress, +1 rep) and **outage response** (Systems Admin+: +15 confidence during declared incidents)
- **Incident dependency trees** — ~35% of days, one hidden Tier-0 root cause (DC replication, DNS, PKI expiry, DHCP exhaustion, NTP drift…) spawns 3 'unrelated' tickets across the plant. Diagnose the leaves, then name the common ancestor at your desk: +$150/+15 XP and every remaining leaf pays +$25/+5 XP. Wrong trees cost stress
- **Home upgrades** — online shopping from your desk: Gaming PC (+10% XP), Bookshelf (+6 battle confidence), Meal Prep (-15 stress/day), Better Bed (+10 max HP), Tool Bench (+2 hardware/automation)
- **IT Department home base** — dim room, glowing monitors, live ticket dashboard, funny coworkers (Nick/Amit/Brandon/Daniel), intern program via Daniel
- **Mike's desk** — log in and resolve tickets remotely where technically applicable (AD/Exchange/DNS/VPN/PKI 🟢, hardware/plant/RF 🔴); mastery & KB improve remote odds
- **Server-room terminal drills** — binary conversion + subnetting practice with full explanations; a perfect 3/3 run pays $10–15
- **Marketing corner** — new department; tickets there earn marketing points → swag shop (hats/shirts/pants, rendered on your sprite) + Mystery Box with the branded water bottle (+1 dept rep per close while equipped)
- **Tech Notes** — every diagnosis ends with a short educational "why this fix, why not the others" note written like real helpdesk reasoning
- **Night Crawl mode** — exit door (16:00+), floaty gravity, dashing, flip double-jumps, jab combos with rhythm-perfect timing, blocking, stage-gated streets, night-only
- **Rides & tricks** — Factory Tugger at 3x speed, Skateboard, Fixie Bike; speed ramps and shortcuts pay $100–$250 per trick, recharge every 3 days
- **Troubleshooting process** — every diagnosis is gather → eliminate → conclude; methodical work banks confidence and XP
- **Evidence-based battles** — Complexity / Uncertainty / Confidence meters, false positives, Insight auto-reveals, 5-star Perfect Investigation ratings
- **Knowledge mastery** — solve 5 of a type → MASTERED, +10 confidence forever after
- **Hidden root causes** — one culprit secretly sits behind several tickets each day; eliminate it for bonuses
- **Follow-up chains** — one ticket becomes an adventure
- **Users learn** — by day 4+, callers arrive having rebooted and pre-submitted tickets
- **Workforce** — hire interns/techs/engineers with traits, manage burnout and misdiagnosis escalations, train them via the knowledge base
- **Tech debt** — blind fixes and botched diagnoses compound until audits and repeat tickets bite
- **Three-vendor shop** — Procurement, Training, and the Innovation Lab; infrastructure investments retire ticket types permanently
- **Major Incidents** — codenamed SEV events with 90-minute declaration windows, war-room chatter, MTTR tracking, and post-incident reviews
- **Legacy Monsters** — five named ancient systems as mini-bosses with Decommission / Preserve / Migrate verdicts and hidden dependencies
- **Change Management** — cowboy deploys vs professional process (faster vs safer)
- **Career ladder** — 8 ranks from Help Desk Technician to CIO, certifications (A+ → Cloud), procedural war stories and a full Career Report with reputation paths (Firefighter / Builder / Teacher / Ghost / Legend)
- **Living factory** — animated floor, production counter ($/min), pager-night events, NPC emote bubbles, action poses, Digital Twin packet-flow overlay
- **Achievements** — six collectible trophies (Cable Whisperer, Zero Downtime, Packet Detective, The Automator, VIP Whisperer, The Teacher) with cash bonuses and a trophy case at Mike's desk
- **Rank gear** — your look evolves with rank: headset, admin tablet, security badge, and a golden CIO aura
- **Night maintenance windows** — ~30% of days a change window is scheduled (firmware, patching, SAN, firewall, UPS): run it after the night crawl through a prep/execute/validate flow where careful choices raise the odds and shortcuts raise the pay; fail validation and you eat a rollback (-$75, +10 stress) plus 2 fallout tickets in the morning. Skip it and change management notices
- **Certification study** — the Bookshelf doubles as a study desk: +$40 off your next cert per study night (once per night), with real study tips
- **Packet-routing drills** — longest-prefix-match, default-gateway, same-subnet and VLAN-isolation puzzles at the server-room terminal, with full explanations
- **AD permission drills** — effective-permissions puzzles (Deny precedence, share × NTFS, group nesting, explicit vs inherited)
- **Procurement refresh project** — from day 4, the CFO opens a capital budget line at the management console: **Replace All** ($500, EOL tickets vanish during rollout, Manufacturing +3 / Finance -2), **Extend Lifecycle** ($150, stretched fleet spawns extra EOL tickets, Finance +2 / Manufacturing -2) or **Hybrid** ($325, alternate-day rollout, everyone +1). One project per run — budget politics included
- **Detective evidence board** — a corkboard at Mike's desk: four clue cards pinned up (a smoking gun, two supporting symptoms, and one fact that clears an innocent suspect), three theories. Find the gun, rule out the innocent, name the root cause — six rotating cases (rogue DHCP, DNS poisoning, degraded RAID, expired certs, STP loops, NTP drift), perfect boards pay like terminal drills
- **Command-center endgame** — v6.0.1 polish: quantified policy projections, per-site LAST NIGHT report with advice, color-coded uptime, mobile touch-target fixes. At Security Architect rank, the management console opens the **global command center**: an enterprise map of five sites (Building 7, New Haven, Hartford, Stamford, Dublin) with live health, and a daily 6-point policy budget — 🛡️ security lowers incident odds, 🖥️ hardware fights daily wear, 👥 staffing drives nightly recovery. Overnight incidents damage sites; sites below 40% health go OUTAGE and scream straight into your ticket queue; perfect 100% enterprise uptime pays a $75 board bonus
- **Symptom-first tickets** — the board shows what the user actually said ("Laptop gets no IP at desk", "Red browser warning on the site") until you diagnose it; the real label (Wrong VLAN Assignment, SSL Certificate Expired) only appears once YOU figured it out — users report symptoms, never root causes
- **NPC flag-downs** — ticket holders wave you down in the halls: engage the troubleshooting battle now or ask them to hold (being acknowledged costs them nothing — good communication)
- **Daily standup** — 09:30 reminder; report to Mike's desk with the team. Mike references the hottest ticket on the board; your report style matters: crisp status (XP, -stress, +rep), flagging blockers (+confidence head start in that battle), offering to pair, or staying silent (+stress)
- **Pixel-baroque sprites** — every sprite atlas rebuilt pristine: true transparency (no more white borders), cross-cell bleed removed, frames centered and isolated; plus an AI-generated golden server-rack crest on the title screen and command center
- **Troubleshooting-session battles (v6.2 rework)** — portal battles follow a real session now: a 4-phase guide (▶ GATHER → HYPOTHESIZE → RESOLVE → VERIFY) sits above the fight and tells you what to do next; enemies scale fairly (HP ~60% of before), uncertainty starts at 52%, and corruption damage is mitigated — methodical play wins
- **South Exit map marker** — the 16:00 exit glows with a sign and countdown (gold when closed, green and OPEN at 16:00)
- **Modern clean look** — AI-generated night skyline behind the title crest, frosted-glass dialogs
- **Scene transitions** — day cards each morning, NIGHT CRAWL title card, glitch-flash on incident entry, soft wipes on battle end / night exit / EOD
- **Smooth walking** — the player glides between tiles with eased interpolation instead of snapping
- **40 scenic props** — AI-generated office & factory assets (server racks, whiteboards, robot arms, aircraft models, caution signs…) placed daily across the map; server LEDs pulse, the robot arm sways
- **NG+** — the building remembers your legend

## Files
| File | Purpose |
|---|---|
| `index.html` | App shell, HUD, battle/dialog/panel UI, script load order |
| `style.css` | Retro pixel-RPG styling, mobile/touch UI |
| `game.js` | Core engine: map gen, rendering, tickets, evidence combat, progression, workforce, incidents, legacy |
| `night_hooks.js` | v5.0: night platformer, ramps/tricks, vehicle speeds, exit door |
| `office_hooks.js` | v5.1: IT dept room, Mike's desk remote fixes, terminal drills, marketing swag, tech notes |
| `org_hooks.js` | v5.2: promotion perks, incident dependency trees, home upgrades |
| `v53_hooks.js` | v5.3: AV/hw ticket ecosystem, repair-vs-replace, VIP pressure, cinematics, ops monitor |
| `v54_hooks.js` | v5.4: phone/Teams interface, living helpdesk visuals |
| `v55_hooks.js` | v5.5: week cycles, weather, mobile night controls |
| `v56_hooks.js` | v5.6: collectible achievements, trophy case, rank gear visuals |
| `v57_hooks.js` | v5.7: night maintenance windows, certification study |
| `v58_hooks.js` | v5.8: packet-routing & AD permission drills, procurement refresh project |
| `v59_hooks.js` | v5.9: detective evidence board |
| `v60_hooks.js` | v6.0.1: command-center endgame — enterprise map, global sites, budget policy |
| `QA_REVIEW.md` | Full QA & polish review report (v6.0.1) |
| `v61_hooks.js` | v6.1: symptom-first tickets, NPC flag-downs, daily standup, crest UI |
| `emblem.js` + `emblem_p1–p3.js` | v6.1: AI-generated pixel-baroque crest (split payload) |
| `v62_hooks.js` | v6.2: battle rework + session guide, exit marker, title skyline |
| `skyline.js` + `skyline_p1–p3.js` | v6.2: AI-generated night skyline title backdrop (split payload) |
| `v63_hooks.js` | v6.3: transitional scenes, smooth walking, 40 scenic map props |
| `v64_hooks.js` | v6.4: Felicia secret boss, Watchdog Protocol mode, Impreza & war-driving |
| `v65_hooks.js` | v6.5: deep interviews (type-specific Q&A), reasoning outcomes, NPC sprite cast |
| `v66_hooks.js` | v6.6: AAA polish — battle juice, extended SFX, typewriter dialogue, win confetti |
| `v67_hooks.js` | v6.7: cinematic combat — settings, ambient audio, adaptive music, boss cinematics, combos, gallery, bug fixes |
| `v68_hooks.js` | v6.8: path guides to tickets & the way home, enforced 16:00 clock-out, Felicia overlay camera fix |
| `v69_hooks.js` + `rooms.js` + `rooms_*_p1–p4.js` | v6.9: side-view department interiors (AI backdrops), perspective-switch gameplay |
| `v70_hooks.js` | v7.0: Felicia scheduled appearances & walk-off, durable unlock + dev/prod separation, name plates, IT backdrop restyle |
| `v71_hooks.js` | v7.1: toggleable objectives, cover-fit room backdrops, UI animation pack, battle hit feedback |
| `glitch.js` + `glitch_p1–p4.js` | v7.2: AI-generated glitch-monster battle atlas (split payload) |
| `apt.js` + `apt_p1–p2.js` | v7.2: AI-generated APT operative boss sprite (split payload) |
| `emote.js` + `emote_p1.js` | v7.2: AI-generated emote icon atlas (split payload) |
| `v72_hooks.js` | v7.2: arena sprites by ticket type, hit-stop on crits, NPC idle emotes |
| `panels.js` + `panel_p1a–p6d.js` | v7.3: generated story-panel art for the days 5–10 arc (split payload) |
| `v73_hooks.js` | v7.3: animated comic cutscenes, Orpheus backstory, Crown Jewel intel, day-10 endings |
| `v74_hooks.js` | v7.4: story gallery replays, ending epilogues, post-arc Felicia |
| `v75_hooks.js` | v7.5: minimizable objectives tracker, scripted scene director, animation pack |
| `v76_hooks.js` | v7.6: time-of-day grading, real-time light map, camera lag, living title, floor texture |
| `v77_hooks.js` | v7.7: visual-novel dialogue portraits from panel art, mood grading, talk animation |
| `v78_hooks.js` | v7.8: ticket stinger, battle entry/punch feel, heartbeat, Felicia's desk storytelling (v7.9: battle-entry observer guard) |
| `v710_hooks.js` | v7.10: side-view rooms match the map (palette, positions, entry-edge doors), battle tactics/diagnosis consistency |
| `v711_hooks.js` | v7.11: remaining battle tactics reconciled with diagnosis tables & real infrastructure (wifi, share, slowpc) + invariant guard |
| `v712_hooks.js` | v7.12: name/sprite gender reconciliation — every NPC name matches the department sprite it wears |
| `v713_hooks.js` | v7.13: objective waypoints (user→device→portal), onward doors between rooms, cast variety variants, run-card export |
| `v714_hooks.js` | v7.14: diagnostic decision trees — dynamic branching troubleshooting with a visible, narrowing hypothesis space |
| `v715_hooks.js` | v7.15: tile-true movement — grid-locked logical tiles with smooth interpolated rendering and camera |
| `v716_hooks.js` | v7.16: variety pack — quote/label/opener rotation, day themes, expanded cast, ambient chatter, undefined-symptom fix |
| `v717_hooks.js` | v7.17: NOC wire — overnight reports in the Teams phone, EOD uptime cross-link, day-scaled wear balance |
| `v718_hooks.js` | v7.18: ask, don't answer — tree questions are answered BY the user per the true root cause, not picked by the player |
| `v719_hooks.js` | v7.19: true transparency — alpha-bled character/prop atlases (no black halo on Safari), nearest-neighbor player render path |
| `v720_hooks.js` | v7.20: field polish — lobby spawn fix, HUD button dock, prop inspection; comm_hooks: face-to-face vs phone framing + department-unique voices; v713: bigger NPC sprites with a 2-frame step |
| `v721_hooks.js` | v7.21: runtime alpha-bleed — drawImage wrapper flood-fills edge colours under transparent pixels of any PNG data-URL image (Safari palette-PNG halo fixed in-page), plus DOM `<img>` crest/seal bleeding |
| `v722_hooks.js` | v7.22: night drive cinematic — the 16:00 drive home plays as a letterboxed five-shot cut (rainy AeroTech exit, dashboard wake, neon New Haven parallax drive, Iron & Tide standoff, BATTLE START slam), procedural canvas + WebAudio, skippable, Felicia/Impreza variant |
| `v723_hooks.js` | v7.23: the line goes dark — every critical incident (anomaly, escalation, Friday spike, tree spawn) plays as a letterboxed six-shot cinematic (line running, network down, operators call Mike, rack trace, rogue DHCP reveal, cut & resolve + the watcher), procedural canvas + WebAudio, guarded & skippable |
| `CONSISTENCY.md` | Game logic & loop consistency review (v6.9) |
| `npcs.js` + `npcs_p1–p12.js` | v6.5: AI-generated 8-character NPC cast in player style (split payload) |
| `felicia.js` + `felicia_p1–p12.js` | v6.4: Felicia sprite atlas + portrait + Impreza (split payload) |
| `props.js` + `props_p1–p5/p7` + `props_c6a-c/c8a-c/c9a-c.js` | v6.3: AI-generated 40-prop scenic atlas (split payload) |
| `comm_hooks.js` | v4.3–4.4: communication battles, mastery, chains, root causes, users-learn |
| `sprite_hooks.js` | v4.1–4.2: action poses, NPC emote bubbles, equipment sprites, draw overlay |
| `player.js` + `player_p1–p5.js` | Player walk/idle sprite atlas (split payload) |
| `extra_sprites.js` + `sp0–sp8.js` | Character-sheet atlas: poses, emotes, equipment (split payload) |

v5.1 also fixed the overlay camera transform so room dressing renders in world space.

Saves to localStorage (Continue Run on the title screen).

## Roadmap
**Shipped:** evidence-based combat · communication battles · troubleshooting process · night crawl mode · ramps & rides · workforce & tech debt · vendor shop & infrastructure retirement · major incidents & PIRs · legacy monsters & verdicts · change management · knowledge mastery · hidden root causes · follow-up chains · users-learn · career report paths · NG+ legends · character sprite system · Digital Twin overlay · IT dept home base & interns · remote ticket resolution · terminal drills · marketing swag & cosmetics · educational tech notes · promotion-track powers · incident dependency trees · home upgrades · AV & plant-floor tickets · hardware lifecycle decisions · VIP support · cinematic incidents · ops monitor · phone/Teams interface · living helpdesk · week cycles & weather · mobile night controls · collectible achievements & trophy case · rank gear visuals · night maintenance windows · certification study · packet-routing & AD drills · procurement refresh project · detective evidence board · command-center endgame · final QA & polish pass (v6.0.1) · symptom-first ticket presentation · NPC-initiated troubleshooting · daily standup · pixel-baroque sprites · rebalanced troubleshooting-session battles · exit map marker · modern skyline title · scene transitions · smooth walk animation · 40 scenic map props · Felicia hidden APT boss & clue investigation · playable Felicia (max stats, legendary gear) · modded black Impreza & war-driving · Watchdog Protocol intelligence mode · type-specific interview answers with red herrings · varied reasoning outcomes · cohesive NPC sprite cast · AAA polish pass: battle juice & hit feedback · extended synthesized SFX · typewriter dialogue · win celebrations & hurt vignette · cinematic combat: boss intros & combo finishers · layered ambient audio & adaptive music · dialogue portraits · accessibility settings · cutscene gallery · living-world ambience · path guides (toggleable) · enforced 16:00 clock-out & drive home · side-view department interiors · perspective-switch gameplay · ghost-scheduled Felicia appearances & durable unlock · toggleable objectives & UI animation pack · generated arena sprites, hit-stop & idle emotes · animated comic cutscenes & the days 5–10 Orpheus arc (v7.3) · Crown Jewel intel tickets & gated endings · story gallery replays & ending epilogues (v7.4) · minimizable objectives tracker, condition-triggered cutscenes & the cinematic animation pack (v7.5) · certification polish: grading, lighting & camera (v7.6) · visual-novel portraits (v7.7) · combat feel & environmental storytelling (v7.8) · hotfix: battle-entry freeze & tracker minimize (v7.9) · True North: map-matched side-view rooms & battle consistency (v7.10) · Infra Truth: remaining tactics/diagnosis contradictions removed (v7.11) · Cast Truth: NPC names always match their sprites (v7.12) · objective waypoints, onward doors & cast variety (v7.13) · diagnostic decision trees (v7.14) · tile-true movement (v7.15) · variety pack (v7.16) · NOC wire: overnight reports & EOD cross-links (v7.17) · ask-don't-answer interviews (v7.18) · true transparency sprite fix (v7.19) · field polish: lobby spawn, HUD dock, prop inspection & department voices (v7.20) · runtime alpha-bleed for every PNG sprite source (v7.21) · the Night Drive cinematic (v7.22) · the Line Goes Dark critical-incident cinematic (v7.23)

## v6.4 — Felicia: Watchdog Protocol
- **🕶️ Hidden boss: APT-17 "MORNINGSTAR"** — Felicia Voss, the friendly contractor in the break room and at the campus café, is running a 243-day infiltration. Encounter her across days (a real printer jam, a laptop closed a second too fast, knowledge she shouldn't have), then collect **8 scattered clues** (badge logs, camera sync gaps, the 03:00 beacon, café scan spikes...). Each clue alone is explainable; together they reveal the pattern.
- **The Hunt** — at 5+ clues, confront her: a three-front boss battle (physical / digital / psychological) against a 130-HP APT with its own root-cause tree. Win and she stands down, leaving her research behind (*"You saw the pattern before anyone else did."*). Lose and she slips away — until tomorrow.
- **🔓 Playable Felicia** — beating her unlocks **WATCHDOG PROTOCOL** on the title screen: play as Felicia with **maxed stats (all 10s), 120 HP, three legendary items** (MORNINGSTAR Deck, Ghost Rig, ORBIT Headset) and her own sprite set.
- **🚗 Modded black Impreza** — she drives instead of walking (~2.4× speed, gold wheels, purple underglow), and every cruise is a **war drive**: sniff open APs (`ORION-GUEST`, `HANGAR-IOT`, `LEGACY-SCADA`...) for trickle cash.
- **🛰️ Watchdog View** — the campus becomes a sensor grid: NPCs ring green/yellow/red, devices glow cyan, portals mark attack paths, network pulse lines flow. Walk near people, devices, zones and portals to **gather intelligence** across 4 channels (Employees / Systems / Facilities / Security).
- **Actions on Objectives** — daily APT tasking (profile 5 employees, map 8 systems, chart 4 zones, expose 3 attack paths) pays cash + XP; complete all four to **advance the operation**. But scans raise **suspicion** — blend in by keeping moving, because at 100% **Mike starts hunting you** and your scans are burned for the day.

## v6.5 — Deep Interviews & Real Faces
- **🗣️ Type-specific questioning** — every ticket type now answers the four classic questions ("When did this start?" "What changed?" "Can you reproduce it?" "Anyone else affected?") with answers that are *technically consistent with the real root cause*: genuine signal ("It fails at the same setpoint every cycle"), honest shrugs, and plausible **red herrings** ("It's probably the toner") that reward verification instead of blind trust.
- **A self-consistent world** — red herrings stay chase-able until you verify them, and a user who's led you astray twice will stop and correct themselves, ruling out a branch. Signal answers can eliminate wrong theories outright.
- **Varied reasoning outcomes** — failed hypotheses now come with a type-specific post-mortem ("Safe mode loads no drivers — that points AT drivers, not away"), and a failed test still kills one wrong branch half the time: no dead-end runs.
- **🧑‍🤝‍🧑 A real cast** — all NPCs are now drawn from an AI-generated 8-character sprite sheet in the player's own pixel style: IT techs in the green vest (Mike, Nick, Amit, Brandon, Daniel), engineers with safety glasses, marketing blazers, hard-hat manufacturing, suited execs, HR cardigans, finance ties, sales headsets — one cohesive art direction.

## v6.6 — AAA Polish
- **💥 Battle juice** — every hit now lands with weight: floating damage numbers (gold for crits, red when you're hurt), hit-flash on the enemy sprite, screen shake, and a battle-entry intro slide. Heals float green; enemy regen shows too.
- **🏆 Win celebrations** — defeating a ticket bursts confetti over the arena and the enemy dissolves in a white-hot flash, with a victory arpeggio on top.
- **🔊 Extended synthesized SFX** — still zero audio assets: new WebAudio voices for coins, critical hits, player damage, heals, UI clicks and dialogue blips, layered on the existing chiptune kit.
- **⌨️ Typewriter dialogue** — long plain-text conversations type out with soft blips (click to fast-forward); short confirmations and HTML-rich dialogue fade in smoothly instead.
- **❤️ Hurt feedback** — taking damage flashes the arena red; at low HP a heartbeat vignette pulses around the screen until you recover.
- **✨ Feel pass** — smooth eased tweens on all HUD bars, pop-in toasts, and slide-in battle-log lines round out the AAA feel.
- **🔧 Sprite payload repair** — the player sprite atlas on the live site had silently corrupted in transit (dropped base64 characters broke the PNG decode, falling back to vector sprites); rebuilt the pristine transparent payload with corruption-proof encoding. The hero now renders in full pixel-baroque glory everywhere.

## v6.7 — Cinematic Combat
- **⚙️ Settings & accessibility** — a real settings menu (gear in the HUD): screen-shake toggle, particle density, dialogue text speed (up to instant), SFX & music volume sliders, and a colorblind-safe palette. Everything persists across sessions.
- **🎭 Boss cinematics** — major incidents, legacy monsters and Felicia now open with a letterboxed name-card slam and a camera zoom; click to skip. Every boss unlocks a replayable entry in the new **🎬 Cutscene Gallery**.
- **🔥 Combo system** — consecutive landed attacks build a combo badge; at x3+ the arena zooms and the announcer calls the streak. Whiffed or backfired fixes drop the combo.
- **💬 Combat callouts with personality** — CRITICAL BREACH, ACCESS DENIED, PATCH FAILED, ROOT ACCESS — flavor text layered over the v6.6 floating numbers, plus ability-specific projectiles that fly across the arena.
- **🎧 Layered ambient audio** — the world hums: server-room fans and diagnostic beeps, office HVAC and keyboard clacks, factory-floor rumble and machinery clanks, crossfading as you move between zones. Fully synthesized, zero audio assets.
- **🎼 Adaptive battle music** — a dark synth loop that adds a tension arpeggio when your HP drops and danger stabs when the enemy is cornered or you face the APT.
- **⚡ Living world** — machinery throws sparks, broken devices flicker, ambient coworkers wander between desks, power outages dim and flicker the plant, storms flash lightning, and the night-crawl skyline gains a real photographic parallax layer.
- **🖼️ Dialogue portraits** — NPC conversations now show the speaker's portrait from the cast atlas.
- **🐛 Graphical bug fixes** — Felicia's portrait no longer leaks into every NPC conversation (stale DOM image was never removed); the coffee mug now renders centered on its machine instead of floating mid-air; the ticket tracker gains a readable backdrop.

## v6.8 — Guided Shift
- **🗺️ Path guides (toggleable)** — flowing breadcrumb dots lead you to the nearest open ticket during the day, and a pulsing destination ring shows name + walking distance. At 16:00 they retarget to a green **WAY HOME** marker at the South Exit. Toggle them in ⚙️ Settings.
- **🕓 Enforced clock-out** — at 16:00 the shift ends: a directive toast points you to the exit (you can still finish the ticket you're on). At 16:59 Security sweeps the floor and you drive home — no more silently rolling into the backlog. Big time jumps can't skip the drive either: the stock 5 PM force-end is rerouted to the sweep.
- **🐛 Felicia stuck-sprite fix** — her NPC, clue markers and watchdog rings were rendering in screen space without the camera transform, so they glued to the screen while the world scrolled. All v6.4 overlays now render in world space.

## v6.9 — Department Interiors
- **🏢 Side-view departments** — walk into a department (IT, Engineering, Executive, Finance, Sales, HR, Marketing) and the perspective shifts to a side-scrolling interior in the cinematic pixel-art style of the reference boards: AI-generated backdrops (IT room, shuttle hangar, office suite), the dept's people at their stations with name plates, the IT crew at their desks — talk to anyone with E.
- **Seamless transitions** — the switch is edge-triggered on entry; the left door (or Q/Esc) drops you back to the exact top-down tile. Toggle it in ⚙️ Settings.
- **World-first consistency** — Felicia's clue spots and the APT herself keep their top-down interactions (the arc stays finishable), Felicia's station appears inside her current department, and Watchdog mode stays top-down so war-driving cruises never break.
- **📋 Consistency review** — `CONSISTENCY.md` audits the whole loop: single clock writer, day-end paths, room-vs-world precedence, camera space, settings — with the accepted minor items documented.

## v7.0 — Ghost Protocol
- **Felicia, occasionally**: the NPC now appears only on scheduled days at scripted haunts (campus café, break area, front steps). After each encounter she walks off the nearest map edge and stays gone for a day or two. With 5+ clues she stays findable so the confrontation is always reachable.
- **Prod/dev separation**: playing as Felicia now hard-requires the boss-win unlock — a tampered `techops_char` is reverted to Mike, and the unlock lives in a durable flag that survives starting a new run. Test helpers (`TOH_DEBUG.unlockFelicia/lockFelicia`) exist only behind `?dev=1`.
- **Name plates**: room NPCs and Felicia get standing desk-plaque name plates (separate objects, reference-art style) instead of floating text.
- **IT Department backdrop**: regenerated in the reference cubicle style — IT DEPARTMENT wall sign, KEEP CALM AND REBOOT poster, server rack, TICKETS whiteboard, water cooler, printer, trophy shelf.
- **Fix**: Felicia's side-room station called a private function and would throw; it now steps back into the world and talks there.

**The roadmap is complete** — every planned feature has shipped. See `QA_REVIEW.md` for the final review and P2/P3 polish ideas.

## v7.1 — Interface Polish
- **Toggleable objectives** — the HUD quest tracker can now be hidden from ⚙️ Settings (persisted); it also pulses when tickets arrive or close.
- **Distortion-free side-view backdrops** — department interiors render cover-fit, so the 16:9 art keeps its aspect on any window shape.
- **UI animation pack** — dialogue/panel/EOD/toast entrances, staggered battle & dialog buttons, floating title logo, button hover/press feedback, and a fade wipe when switching between world and side-view rooms. All gated behind a new **UI animations** setting.
- **Battle hit feedback** — the enemy jolts when its HP drops; the arena flashes red when you're hit (driven off the HP bars, zero game-internals risk).

## v7.2 — Feel the Fight
- **Real arena sprites** — battles now render generated pixel-art monsters instead of emoji: a six-strong glitch atlas (glitch blob, cable serpent, broken robot, static wraith, paper imp, circuit beast) mapped to ticket types, and a dedicated hooded **APT operative** sprite for the secret boss. All new art in the reference style — no Felicia reuse.
- **Hit-stop on criticals** — CRITICAL HITs freeze-zoom the arena for a beat with a bright flash.
- **NPC idle variety** — settled and ambient coworkers show small pixel-art emote icons (coffee, zzz, gear, question, sweat) on individual schedules, in world space.

## v7.3 — The Woman on the Wing
- **Animated comic cutscenes** — a letterboxed panel player (Ken Burns push-ins, typewriter captions, click/E to advance, ESC to skip) drives the days 5–10 story arc with six generated chibi pixel-art panels in the reference style.
- **The arc** — Day 5: the viral livestream (15.8M views) reveals the marketing contractor is the world-famous aerial violinist. Day 7: badge logs and CAM 07 show her walking Engineering halls at night. Day 9: an overheating storage array exposes archived simulations and a buried CITY EVACUATION MODEL behind PROJECT ORPHEUS (Clearance: CROWN JEWEL). Day 10: rain, a laptop, and a choice.
- **Why she needs the data** — ORPHEUS, AeroTech's predictive-control grid, quietly routes power, water and evacuation for New Haven; its storm model says the south flood walls fail, and someone buried the evacuation because the math said those districts aren't worth the cost. She needs the Crown Jewel archive to force the truth into the open before the storm does.
- **Crown Jewel intel** — three codenamed critical tickets (days 7/9/10) in Engineering each recover one intel piece when closed: ORPHEUS METADATA, CITY EVACUATION MODEL, ORPHEUS CORE KEYS.
- **Three endings, gated by your run** — REPORT FELICIA (needs all 8 investigation clues by day 10 → Ending A "Perfect Employee"), HELP FELICIA (needs all 3 Crown Jewel intel pieces → Ending B "Let's Save the City"), and a true ending (both, plus listening when she talks → "New Haven Counts On Us"). Endings persist to localStorage and the cutscene gallery.

## v7.4 — Aftermath
- **Story gallery** — every story beat (days 5/7/8/9/10 and all three endings) now lands in the 🎬 cutscene gallery as a full entry with icon and summary, and replaying one runs the actual animated panel cutscene instead of a static card.
- **Ending epilogues** — from day 11, a closing animated scene keyed to your choice: the chained roof and the memo (A), the city that moved first (B), or two mugs on the ledge — one says ROOT, one says BACKUP (TRUE).
- **Post-arc Felicia** — the world reflects your choice: after Ending A her Marketing desk sits empty (Nick notices); after B/TRUE she plays on the roof again at 16:00 — not a goodbye this time — and hands you a mug that says BACKUP.
- **Fix** — v7.3's gallery unlock calls used the old two-argument form, leaving those entries iconless and unreplayable; v7.4 normalizes them into full gallery definitions.

## v7.5 — Director's Cut
- **Minimizable objectives tracker** — the tracker gets a header with a live open-ticket count and a collapse button; minimized it shrinks to a single line, and the preference persists across sessions.
- **Scene Director** — cutscenes no longer fire on blind timers. Every story beat is scheduled through a director that waits for real conditions: the player is free (no dialog, battle, room or cutscene), the time window is right, and the trigger has happened. Day 5 rolls as you take your first steps; day 7 rolls when you walk into Engineering; days 8 and 10 spawn Felicia in the world with a pulsing cue marker — walk up to her and the rooftop scene / finale plays. Graceful fallbacks guarantee no scene can ever be missed, and busy players simply get the scene the moment they're free.
- **Cinematic animation pack** — every cutscene (story beats and gallery replays alike) gets letterbox bars that ease in, slide-change transition flashes, animated film grain, scanlines and a vignette, plus weather layers that follow the caption: rain streaks with distant lightning for storm scenes, drifting golden motes for rooftop sunsets.
- **World life** — every NPC idles with a soft bob and shadow, dust motes drift through the office, storm rain falls across campus from day 10, and landing a hit in battle shakes the screen. All of it respects the existing UI-animations setting.

## v7.6 — Visual Direction (certification polish, phase 1)
- **Time-of-day color grading** — warm 09:00 mornings, neutral midday, golden pre-clock-out, cool blue nights; a photosensitivity-safe red pulse while a major incident is declared, a permanent cyan cast from the server room, and a story-driven storm ramp that darkens the campus days 9→10. After Ending B/TRUE, day-11 mornings glow with the sunrise the city earned.
- **Real-time pixel lighting** — a multiply-composited light map: coffee machines pool warm light, server racks breathe cyan, portals pulse violet, and the player carries a soft personal light that becomes a flashlight cone during outages and night crawls. Frame-rate-adaptive: the light canvas drops to half resolution if the device struggles.
- **Camera that never sits still** — smoothed follow with ~170 ms lag and a half-tile look-ahead toward your facing.
- **Living title screen** — rain drifts across the skyline with a slow cinematic push-in; the loop self-terminates the moment you clock in.
- **Material pass** — procedural floor texture (noise + carpet-tile seams) world-aligned under everything, killing the flat-color look with zero new assets.

## v7.7 — Cast & Portraits (certification polish, phase 2)
- **Visual-novel dialogue portraits** — large illustrated portraits cropped from the v7.3 story-panel art (Felicia and Mike, from the day-10 standoff panel), framed and shadowed beside the dialogue box.
- **Mood grading** — the portrait's grade follows the scene: warm on the day-8 rooftop, resolute on day 9, storm-cooled on day 10.
- **Talk animation** — a subtle life pulse synced to the typewriter while text types out.
- **No-leak guarantee** — portraits are stripped on every dialog close (the v6.7 portrait-leak bug class is structurally impossible); non-cast speakers keep the classic atlas portraits.

## v7.23 — The Line Goes Dark (the critical-incident cut)
- **🎬 Every sev-1 is a movie now** — the `sevBanner` choke point (anomaly detected, escalated, Friday 16:45 spike, dependency-tree spawn) opens a letterboxed six-shot cinematic before the classic banner: (1) Line 3 running under STATUS ONLINE, (2) the lights die and PRODUCTION NETWORK DOWN burns red, (3) the operators call Mike in, (4) he traces the fault down the rack cables with a toner probe, (5) ROGUE DHCP DETECTED — device ID, IP, UNAUTHORIZED on the laptop screen, (6) the cut, the spark, INCIDENT RESOLVED… and a watcher silhouette with green eyes on the catwalk: NEW CLUE: UNKNOWN DEVICE.
- **Board-true, canon-true** — built from the CRITICAL INCIDENT comic board: jointed orange robot arms, caution striping, blinking rack LEDs, and the rogue device's exact identifiers (82:7A:AC:19:3F:2B / 192.168.50.143). The watcher is a brand-new procedural silhouette — no reused character sprites, no emoji glyphs anywhere in the art.
- **Polite by design** — world input freezes while it plays; it never interrupts an open dialog, a battle, the night crawl, or the v7.22 drive cinematic; skipping (E / Enter / Space / click) or finishing always lands on the original v5.3 banner. Audio is synthesized (line rumble, klaxon, spark, resolve hum) and respects the SFX volume setting.

## v7.22 — Night Drive (the cinematic cut)
- **🎬 The drive home plays as a movie** — every way out of the building at 16:00+ (South Exit door, both security sweeps) now opens with a letterboxed, five-shot cinematic instead of a hard cut: (1) Mike exits the AeroTech facade into the rainy parking lot, (2) the SUV's headlights flare and the TECHOPS dashboard wakes, (3) a three-layer parallax drive through neon New Haven on wet asphalt, (4) parking under the elevated line by Iron & Tide Supply Co. while a glitch creature steps out of the alley, (5) a crest-slam zoom-punch **BATTLE START** that hands off to the v6.3 title card and the crawl itself.
- **Cut from the reference, kept to canon** — the erroneous details are out: every neon sign is legible English (no mojibake), Mike walks in his real atlas frames (vest, sunglasses, dreadlocks — auto-bled by v7.21), and the alley threat is a glitch creature, the night crawl's actual enemy. Palette stays navy/purple with the wing crest.
- **Zero new assets** — the whole cut is procedural canvas + synthesized WebAudio (rain loop, sub pad, engine hum, thunder, battle sting), respects the SFX volume and screen-shake settings, freezes world input while playing, and is skippable with E / Enter / Space / click. Playing as Felicia swaps in the Impreza (purple underglow, gold wheels) and her own captions.

## v7.21 — Runtime Bleed
- **🧴 The halo fix that can't be missed** — v7.19 bled the atlas FILES, but any palette PNG (including ones already hosted or added later) can still halo on Safari. Now the game bleeds at runtime: a `drawImage` wrapper flood-fills opaque edge colours outward through every transparent pixel (multi-source BFS) the first time any PNG sprite is drawn, and substitutes the bled canvas as the draw source forever after.
- **🖼️ DOM images too** — the title crest and dialog seals/portraits (plain `<img>` tags, not canvas draws) get the same treatment via an async src swap; `dlg()` is wrapped so every future dialog portrait is covered automatically.
- **📦 Compact assets stay** — because the guarantee now lives in the renderer, the repo keeps the compact palette atlases; file-level bleed remains harmless on top (bleeding an already-bled image is a no-op). Exact by construction: all atlases use binary alpha, so the canvas readback round-trip is lossless.

## v7.20 — Field Polish
- **🏢 Spawn where you'd actually start** — the day spawned you at the map centre ±4 tiles, which could dump you in a prop corner; `genMap` always carved a lobby "reception area at spawn", and now the spawn truly lands inside it.
- **🎛️ HUD dock** — the Teams phone floated over the top-right button column, cramming overlapping sub-44px targets. All right-side controls now live in one column with real spacing and touch-sized buttons; chat toasts shift left of the dock.
- **🔍 Every prop identifies itself** — all 40 scenic props (server rack to rocket engine) answer an adjacent interact with a name and flavour line, so mystery floor items are no longer dead ends. Real interactions (NPCs, portals, devices, coffee, lore) always win first.
- **🗣️ Conversations know their setting** — walk up to someone and the dialog is a face-to-face talk; only remote engagements wear the "📞 Incoming Call" frame. Departments now speak in their own voices: curbed executives, frazzled sales, shouting-over-the-line manufacturing, precise engineering, worried finance, chatty HR — openers, reassures, demands and filler all differ per department.
- **🚶 The cast grew up** — NPC sprites render at 40px (was 32) to sit naturally beside the player, with a 2-frame step animation while they wander (idle sway stays).

## v7.19 — True Transparency
- **📱 The iPhone dark-box fix** — on real phones (most visible on iPhone/Safari) the player sprite carried a dark boxy halo that read as "the character isn't transparent" and looked like clipping into neighbouring NPCs. Root cause: every character/prop atlas was a palette PNG whose transparent palette entry was RGB(0,0,0); Safari interpolates palette transparency without premultiplication, so the hidden black bled into the silhouette — while the v7.13 NPC path (explicit nearest-neighbour) stayed clean, which is why only the player looked broken.
- **🎨 Alpha-bled assets** — all five atlases (player, extra poses, Felicia, NPC cast, scenic props) are re-encoded as RGBA with an 8 px colour bleed under every transparent pixel. Alpha channels and all opaque art are byte-identical; only the invisible colour under transparency changed, so no renderer can pull black out of the edges ever again.
- **🔍 Render parity** — the player draw chain now renders with `imageSmoothingEnabled = false`, exactly matching the NPC path: crisp chibi pixels at every DPR, and immunity to any future un-bled atlas.

## v7.18 — Ask, Don't Answer
- **🗨️ The user holds the observations** — the decision tree's branch questions ("Is it just you, or the whole team locked out?") were answered by the *player*, which broke the fiction and invited metagaming (pick whichever answer prunes the most). Now the question is put to the ticket user, and they answer according to the ticket's actual hidden root cause — a hand-audited truth mapping across all 22 trees × every node, cross-checked against each type's real fix.
- **Your skill is the questions, not the answers** — you still choose which branch to probe and when to conclude; the world decides what the answer is. Costs and rewards are unchanged (+5 min, +5 confidence per question, methodical bonus stands), and the user's answer lands as a quoted finding with its teaching reason on the board.

## v7.17 — NOC Wire
- **🌐 Overnight reports in your pocket** — the command center's LAST NIGHT report no longer lives only in a toast you can miss: every morning the NOC pings the Teams phone (badge + chat toast), and the full per-site before→after report with advice sits as the top Teams entry until you read it. One tap deep-links straight into the command center to adjust policy.
- **📊 EOD cross-links** — the end-of-day summary now carries the enterprise line next to your day stats: color-coded uptime, outage count ("expect spillover tickets"), and your current policy split — day work and enterprise health on one screen.
- **⚖️ Balance: fleets age** — the nightly wear ceiling grows with day count (+1 per 4 days, capped +5), so late-run hardware cover matters and full-security builds are no longer strictly dominant. The policy projection line always shows the current ceiling.

## v7.16 — Variety Pack
- **🗨️ Every ticket type speaks in variants** — all 22 ticket types now carry 3–4 interview quotes each (66 lines total), rotated deterministically per day and per occurrence, so the same symptom never reads the same twice in a run. This also fixes a real consistency bug found in the QA pass: the five v5.3 types (AV HDMI, Teams rooms, plant scanners, label printers, hardware swaps) rendered a literal `undefined` as their symptom line.
- **🏷️ Rotating symptom labels & themed days** — symptom labels shuffle through daily variants (a printer ticket might be "Printer jam" today and "Paper won't feed" tomorrow), and some days declare a theme — Patch Tuesday, Onboarding Wave, Audit Season, AV Rollout, Monsoon — that retargets a couple of tickets to fit the story of the day.
- **🙋 Livelier world** — flag-downs open with seven different lines instead of one, ambient chatter draws from an expanded pool with per-department flavor, the NPC name pool doubles to 32 (all dept-gender reconciled, no unisex names so sprites always match), and decision-tree option orders shuffle per day so muscle memory can't autopilot the suggested fix.

## v7.15 — Tile-True Movement
- **🚶 Grid-locked locomotion** — the engine no longer hops: the old accumulator teleported the player a full tile at frame-rate-dependent intervals, which read as "not tile accurate" (worst on touch). Movement is now classic tile-true locomotion: the logical position stays on exact integer tiles for collision, interaction, waypoints and NPCs, while a fractional render position glides smoothly between tiles.
- **One tap, one tile** — a quick tap moves exactly one tile; holding a direction flows at precisely `moveSpeed()` tiles per second. Teleports (doors, drive-home, scene transitions) snap instantly instead of sliding across the map, and Felicia's Impreza keeps its 2.4x cruise.
- **Smooth camera** — the camera, player sprite and minimap now render from the fractional position, so the whole world pans fluidly while game logic remains perfectly tile-accurate.

## v7.14 — Decision Tree

**Troubleshooting is a flowchart now, not a script.** The old dialog asked the same three static questions for every ticket and eliminated a random wrong answer with a one-line shrug. v7.14 replaces it with a real diagnostic tree for all 22 ticket types:

- **Dynamic options** — every question is a genuine branch: "Is it just you, or the whole team?" → *Just me* and *The whole team* eliminate DIFFERENT hypotheses and suggest different follow-ups. Two players working the same ticket walk different paths through the tree.
- **A visible, narrowing hypothesis space** — all six candidate root causes (the fix, the near-miss, and all four traps) are listed live on the board. Every answer strikes whole branches with the **reason**: *"An instant denial means the server evaluated you and said no — that's Share × NTFS effective access. A path that demonstrably reaches the server doesn't need remapping."*
- **Real methodology, taught by playing** — every tree is built from genuine helpdesk practice: scope questions first (one user or everyone?), layer-splitting second (works by IP? 5 GHz but not 2.4? send but not receive?), evidence last (what does the log, the link light, Resource Monitor actually say?). The board frames it explicitly: **scope → layer → evidence**.
- **Same stakes** — each question still costs +5 min and banks +5 battle confidence, methodical work (2+ questions) still pays the process bonus, and a blind conclusion from the full six-hypothesis board is now a true 1-in-6 guess.

## v7.13 — Waypoints, Doors & Faces

- **Objective waypoints** — the path guide no longer just points at the nearest user. It follows the ticket's actual objective: **talk to the user → find the ⚠️ device → enter the 🌀 portal**. The moment a user says "the portal is open by the device", the guide is already aimed at it — violet ring for portals, amber for devices — and every retarget lands with a "WAYPOINT UPDATED" toast. Works for walk-ins, repeats, incident leaves and criticals (they all share the npc→device→portal model), and the guide still hands off to **WAY HOME** at 16:00.
- **Onward doors** — every side-view room except the plant floor now has a second, green-glowing door on the far edge that leads to the **next logical place on the map**: Executive → Finance → Sales → HR → IT → the plant floor; Engineering → the plant floor; Marketing → the plant floor. The accent door on your entry edge still returns you to the exact tile you left (v7.10); the onward door drops you inside the destination department, so rooms chain into real traversal instead of dead ends.
- **Cast variety** — the eight department sprites now render as distinct people: each NPC gets a deterministic variant (4 skin tones × 5 hair colors × 6 outfit tints, one being the canonical dept colors) recolored from the original palette with shading preserved, drawn crisp at exact 4:1 pixel scale with a soft shadow. The IT crew and Felicia keep their canonical looks.
- **Run card export (roadmap: portfolio card)** — the end-of-day screen gains an **EXPORT RUN CARD** button: a gold-framed 480×270 PNG record of the run (rank, days, tickets closed, budget, masteries, trophies, NG+ legend) that downloads straight from the browser.

## v7.12 — Cast Truth

**No more "Earl" in the HR cardigan.** The v6.5 cast atlas is gendered by department — Engineering, Marketing and HR read female; IT, Manufacturing, Executives, Finance and Sales read male — but names were drawn from one mixed pool, so a female sprite could walk around with a male name.

- **A reconciler, not a patch** — a name/sprite alignment pass runs after every day setup and scans on a slow timer, covering every spawn path in the game (walk-ins, repeat tickets, incident leaves, the Friday 4:45 emergency, phone tickets, weather and maintenance spawns) without touching `game.js`.
- **Canon names, split** — the same 16 names, gender-sorted: Dana, Priya, Wanda, Nadia, Sue, Betty and Lena for the female-sprite departments; Marcus, Tom, Carlos, Earl, Greg, Vikram, Hank and Otis for the male-sprite ones. Yuki is unisex and valid anywhere. Uniqueness is preferred so two coworkers rarely share a name.
- **Protected cast** — the IT crew (Mike, Nick, Amit, Brandon, Daniel — the IT sprite is male, names already correct) and Felicia (her own atlas) are never touched, and unknown/custom names are left alone.
- **Everything downstream follows** — name plates, dialogue headers, phone chats, ticket boards and the story gallery all read the same `npc.name`, so one fix propagates everywhere.

## v7.11 — Infra Truth

**The rest of the battle ledger, reconciled.** v7.10 fixed six ticket types whose "super effective" tools contradicted their own diagnosis tables; v7.11 audits the remaining eleven and fixes the last three, then installs an invariant guard so the contradiction class can never come back.

| Ticket | Was weak to | Contradiction | Now weak to |
|---|---|---|---|
| WiFi Dead Zone | **Hardware Swap**, Traceroute | "Replace the user's WiFi adapter" is a listed wrong answer — the fix is an RF survey | Wireshark, Ping |
| File Share Access Denied | **Group Policy**, PowerShell | gpupdate doesn't repair Share-vs-NTFS ACLs; effective access is proven from the security log (Event 4656/4663) | PowerShell, Event Viewer |
| PC Running Slow | PowerShell, **Patch Deploy** | deploying patches isn't a slow-PC remediation; the fix is a startup/resource audit | PowerShell, Event Viewer |

- **PLC stays as-is on purpose** — its weak tools (Ping, Traceroute) map to the *okay* answer ("ping the PLC & check link lights"), and sudo resisting with "NEVER sudo random commands on factory equipment" is exactly how real OT environments treat the plant floor.
- **Infrastructure correlation** — every weakness now reflects what AeroTech actually hosts: Cisco switching and ACLs, an OT VLAN for the line PLCs, Exchange queues, AD lockout forensics (Event 4740), PKI chains, VSS-backed backup jobs, and share+NTFS file servers.
- **Invariant guard** — a dev-time cross-check walks every ticket: a weak (1.6x) tool may never be a listed wrong answer, a resist tool may never be the best answer. Violations are reported to the console and exposed at `window.v711.invariant()`.

## v7.10 — True North

**Side-view interiors now match the top-down map, graphically and logically.**

- **Palette truth** — each department's map colors (floor tones + accent line) drive its side-view room: a multiply wash keys the shared office art to the biome, the floor becomes the biome's carpet with its accent baseboard, and the entry name card + dept chip use the accent color. Exec is burgundy/gold, Finance green, Sales steel-blue, HR warm tan, Engineering orange-gray, IT cyan.
- **Positional truth** — people stand in the room where they stand on the map: an NPC's world-x inside the department rect maps to their room-x (west→left, east→right). Felicia's station is mapped the same way instead of a fixed spot.
- **Door logic** — the exit door sits on the edge you actually entered through: come in from the east and the door (and your starting position) is on the right. Walk into it, or press Q, to return to the exact tile you left.
- **Dept chip** — a persistent in-room chip shows the department name in its accent color with a live count of open tickets there.

**Battle flow consistency — evidence and solutions no longer contradict each other.**

The fight system's "super effective" tools contradicted the diagnosis tables — moves the battle rewarded were listed as *wrong answers* in the root-cause choice:

| Ticket | Was weak to | Contradiction | Now weak to |
|---|---|---|---|
| Printer Offline | Hardware Swap, Patch | "Replace the toner cartridge" is a wrong answer; the fix is the spooler | PowerShell, Event Viewer |
| VPN Won't Connect | Traceroute, ACL Strike | ACLs don't fix IKE/certs | Traceroute, Wireshark |
| Account Locked Out | PowerShell, sudo, **Password Reset** | "Reset the user's password" is a listed wrong answer (Event 4740 is the fix) | PowerShell, Event Viewer |
| Blue Screen Crash | **Hardware Swap**, Patch | "Run a full memory test first" is a listed wrong answer (dump analysis is the fix) | Event Viewer, Patch Deploy |
| SSL Certificate Expired | PowerShell, ACL Strike | ACLs don't renew certificates | PowerShell, Event Viewer |
| Backup Job Failed | Patch, **Containment** | Containment isn't a backup tool (VSS/job logs are the fix) | Event Viewer, PowerShell |

The battle intro also told players to "form a hypothesis at ≤50%" while the actual gate is 60% confidence — the guidance now matches the rule.

## v7.9 — Certification Hotfix

Two certification-blocking bugs found and fixed in the final sweep:

- **Battle-entry freeze (critical).** The v7.8 battle-entry observer watched `#battle` class changes and re-added its own animation class in the callback — an infinite MutationObserver loop that hard-locked the main thread the moment any battle started. The observer now only reacts to genuine hidden/shown transitions and ignores its own class churn. Verified: entry animation fires exactly once per battle, main thread stays responsive.
- **Objectives minimize stacking.** The v7.5 tracker re-injected its header on every minimize click without clearing the old one — repeated clicks stacked duplicate "OBJECTIVES" headers and the toggle state went stale. The header is now deduplicated before every injection. Verified: single header through any number of toggles, collapse/expand and localStorage persistence intact.

Regression coverage: `test-v79.js` (6 tests) guards both fixes; the full v7.5 + v7.8 batteries (20 tests) stay green.

## v7.8 — Feel & Story (certification polish, phase 3)
- **First-ticket stinger** — every new ticket that hits the board lands with a synthesized low thump and a golden vignette flash (respects the SFX volume slider).
- **Combat feel finishers** — battle entry zoom + desaturate pulse, a follow-through punch on the scene when the enemy takes damage, a gold-ring flourish on 5-star Perfect Investigations, and a low synthesized heartbeat when your HP drops below 30% in a fight.
- **Felicia's desk** — environmental storytelling with zero dialogue: her violin case leans by the Marketing desk days 5–9, vanishes on day 10, and after the choice the desk tells the ending — a bare outline and a banker's box (A), or a second mug that says BACKUP (B/TRUE).
- **New synth voices** — stinger, heartbeat, and flourish join the zero-asset WebAudio kit.

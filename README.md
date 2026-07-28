# TechOps Hero v6.3 — AeroTech Division

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
| `props.js` + `props_p1–p5/p7` + `props_c6a-c/c8a-c/c9a-c.js` | v6.3: AI-generated 40-prop scenic atlas (split payload) |
| `comm_hooks.js` | v4.3–4.4: communication battles, mastery, chains, root causes, users-learn |
| `sprite_hooks.js` | v4.1–4.2: action poses, NPC emote bubbles, equipment sprites, draw overlay |
| `player.js` + `player_p1–p5.js` | Player walk/idle sprite atlas (split payload) |
| `extra_sprites.js` + `sp0–sp8.js` | Character-sheet atlas: poses, emotes, equipment (split payload) |

v5.1 also fixed the overlay camera transform so room dressing renders in world space.

Saves to localStorage (Continue Run on the title screen).

## Roadmap
**Shipped:** evidence-based combat · communication battles · troubleshooting process · night crawl mode · ramps & rides · workforce & tech debt · vendor shop & infrastructure retirement · major incidents & PIRs · legacy monsters & verdicts · change management · knowledge mastery · hidden root causes · follow-up chains · users-learn · career report paths · NG+ legends · character sprite system · Digital Twin overlay · IT dept home base & interns · remote ticket resolution · terminal drills · marketing swag & cosmetics · educational tech notes · promotion-track powers · incident dependency trees · home upgrades · AV & plant-floor tickets · hardware lifecycle decisions · VIP support · cinematic incidents · ops monitor · phone/Teams interface · living helpdesk · week cycles & weather · mobile night controls · collectible achievements & trophy case · rank gear visuals · night maintenance windows · certification study · packet-routing & AD drills · procurement refresh project · detective evidence board · command-center endgame · final QA & polish pass (v6.0.1) · symptom-first ticket presentation · NPC-initiated troubleshooting · daily standup · pixel-baroque sprites · rebalanced troubleshooting-session battles · exit map marker · modern skyline title · scene transitions · smooth walk animation · 40 scenic map props

**The roadmap is complete** — every planned feature has shipped. See `QA_REVIEW.md` for the final review and P2/P3 polish ideas.

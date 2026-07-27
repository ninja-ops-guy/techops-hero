# TechOps Hero v5.0 — AeroTech Division

A roguelite IT help-desk RPG. Every ticket is a dungeon. Every day is a run.
You start answering calls alone — you end up running an IT organization.

## Play
Open `index.html` in any browser, or host the folder anywhere static (GitHub Pages, Netlify, S3...).
Live version: **https://ninja-ops-guy.github.io/techops-hero/**
Mobile-friendly: virtual joystick + touch buttons on coarse-pointer devices.

## Controls
- **Move:** WASD / arrow keys, or on-screen joystick (mobile)
- **Interact:** E / Enter / Space, or the Ⓐ button (mobile)
- **Menu:** M or ☰
- **Digital Twin overlay:** V or the 🛰️ HUD button

## The loop
1. **📞 The Call** — every ticket starts as a communication battle. Fill the caller's Ticket Gauge without draining their Patience. Executives have none; HR talks forever; Manufacturing shouts over line noise. Push too hard and they call your manager.
2. **Interview & Troubleshoot** — question the user, then work the process: gather information (*"When did this start?" "Can you reproduce it?" "What changed recently?"*), rule out wrong causes one by one, and only then form a conclusion. Skipping straight to a conclusion is a blind guess — no bonus, and the ticket remembers.
3. **🌀 Portal battle** — turn-based combat where **Uncertainty is the real enemy**: gather weighted evidence (testimony, logs, network, config), prune the root-cause tree, and only hypothesize at 60%+ Confidence. Blind fixes backfire and build tech debt.
4. **Close & grow** — XP, budget, department reputation, knowledge mastery. Coffee restores you (and the mug is sacred).
5. **🌃 Night Crawl** — at 16:00 the South Exit opens. Outside, the game becomes a floaty platformer: dash, double-jump (with flip), and clear three New Haven streets of glitch creatures in rhythm-based beat-'em-up combat — then head home and end the day.

## Systems
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
- **NG+** — the building remembers your legend

## Files
| File | Purpose |
|---|---|
| `index.html` | App shell, HUD, battle/dialog/panel UI, script load order |
| `style.css` | Retro pixel-RPG styling, mobile/touch UI |
| `game.js` | Core engine: map gen, rendering, tickets, evidence combat, progression, workforce, incidents, legacy |
| `night_hooks.js` | v5.0: night platformer, ramps/tricks, vehicle speeds, exit door |
| `comm_hooks.js` | v4.3–4.4: communication battles, mastery, chains, root causes, users-learn |
| `sprite_hooks.js` | v4.1–4.2: action poses, NPC emote bubbles, equipment sprites, draw overlay |
| `player.js` + `player_p1–p5.js` | Player walk/idle sprite atlas (split payload) |
| `extra_sprites.js` + `sp0–sp8.js` | Character-sheet atlas: poses, emotes, equipment (split payload) |

Saves to localStorage (Continue Run on the title screen).

## Roadmap
**Shipped:** evidence-based combat · communication battles · troubleshooting process · night crawl mode · ramps & rides · workforce & tech debt · vendor shop & infrastructure retirement · major incidents & PIRs · legacy monsters & verdicts · change management · knowledge mastery · hidden root causes · follow-up chains · users-learn · career report paths · NG+ legends · character sprite system · Digital Twin overlay

**Future ideas:** endgame modes (Architect / Crisis / Survival), mentorship depth, network-map exploration, automation factory depth, multiplayer war room

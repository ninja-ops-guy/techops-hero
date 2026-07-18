# TechOps Hero v2.0 — AeroTech Division

A roguelite IT help desk RPG. Every ticket is a dungeon. Every day is a run.

## Play
Open `index.html` in any browser, or host the folder anywhere static (GitHub Pages, Netlify, S3...).
Mobile-friendly: virtual joystick + touch buttons on coarse-pointer devices.

## Controls
- **Move:** WASD / arrow keys, or on-screen joystick (mobile)
- **Interact:** E / Enter / Space, or the Ⓐ button (mobile)
- **Menu:** M or ☰

## Gameplay
- **Workday runs** — each day is a randomized run: procedural office, 2–8 tickets, daily chaos event (Patch Tuesday, CEO Visit, Ransomware Drill...)
- **Ticket flow** — interview the user → diagnose root cause (right answer = easier dungeon) → enter the 🌀 portal → turn-based battle in the digital world (Paper Dimension, Identity Cathedral, Labyrinth of Names...) → close the ticket
- **Combat** — Ping, PowerShell, Flush DNS, Firewall Rule... abilities cost **stress** instead of mana. Coffee restores you.
- **Progression** — 8-rank career ladder (Help Desk Technician → CIO), certifications (A+, Network+, Security+, Linux+, CCNA, Cloud, Automation) that unlock new battle abilities, Diablo-style loot rarity, department reputation stars, troubleshooting journal
- **End of day** — pick 1 of 3 rewards; missed tickets cost rep
- Saves to localStorage (Continue Run on the title screen)

## Files
| File | Purpose |
|---|---|
| `index.html` | App shell, HUD, battle/dialog/panel UI |
| `style.css` | Retro pixel-RPG styling, mobile/touch UI |
| `game.js` | Engine: map gen, rendering, tickets, combat, progression |

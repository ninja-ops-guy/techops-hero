# Combat Lab — initial offline slice

From a safe Night Walker street, open Run Menu → Combat Lab. Training offers a
stationary target. Arena offers a fight against one existing guard AI, with a
victory/defeat result and retry. Both currently use Mike and existing Night Walker
controls; E is light attack, J is kick, movement and jump use the normal controls.
This is not player-versus-player, a character roster, nor a completed training
suite. See COMPETITIVE-COMBAT-ROADMAP.md for the remaining modes.

Entry requires no nearby living enemy or pending attack/grab. The street state is
held in memory and restored on exit; practice health and KOs do not carry back.
Night time and progression modifiers/rewards are disabled in the lab. For the
standalone Night checkpoint, saving while in the lab writes the preserved street
state; reload returns there, not into an unfinished practice fight. No new save
format or story flags are created.

Verification: `node scripts/combat_lab_browser.mjs` exercises normal UI in
Chromium desktop, emulated portrait and emulated landscape. It uses a safe-street
fixture, real keyboard combat, a one-HP target for the win, and a near-contact
one-HP fixture for defeat. It checks checkpoint contents, retry, no practice XP,
and restoration of HP, cash and kills. Touch is used for menus on the emulated
mobile profiles; combat inputs are keyboard-driven, so these checks do not
establish physical mobile or multi-touch acceptance.

# Combat Lab — offline practice

From a safe Night Walker street, open Run Menu → Combat Lab. Training offers a
stationary target, a damage/contact counter and an explicit target/health reset.
Arena offers a fight against an existing guard, skimmer or hunter AI, with a
victory/defeat result and a rematch against the selected opponent.

K, Iona, Mike and Felicia can be selected in either practice mode. Iona uses her
existing aerial bicycle kick and a provisional 1.08 damage multiplier. Felicia
has a provisional 1.12 movement multiplier. K and Mike use the shared combat
kit; Mike's route discovery, Felicia's stealth and K's system interaction are
not implemented here. These numbers are initial offline tuning, not competitive
balance. There is no player-versus-player, loadout, pickup, security system or
Red unlock in this slice.

K and Felicia use existing provisional art with incomplete combat animation.
Visual review of K's existing action atlas found dark glasses rather than the
canonically clear glasses, and an opaque white patch between the legs in the
idle frame. It is not creator-approved final art. Iona's existing band-reference
sprite is a candidate, also subject to creator visual approval. These issues
must be addressed before release; do not label the provisional images final.

Entry requires no nearby living enemy or pending attack/grab. The street state is
held in memory and restored on exit; practice health and KOs do not carry back.
Night time and campaign progression rewards/bonuses are disabled in the lab.
For the standalone Night checkpoint, saving while in the lab writes the
preserved street state; reload returns there, not into an unfinished practice
fight. No new save format or story flags are created.

Verification: `node scripts/combat_lab_browser.mjs` exercises normal UI in
Chromium desktop, emulated portrait and emulated landscape. It uses a safe-street
fixture, real keyboard combat, a one-HP target for the win, and a near-contact
one-HP fixture for defeat. It checks character selection, target damage/reset,
checkpoint contents, retry, no practice XP, and restoration of HP, cash and
kills. Touch is used for menus on the emulated mobile profiles; combat inputs
are keyboard-driven, so these checks do not establish physical mobile or
multi-touch acceptance. The unit test verifies Iona's bicycle move selection and
that a rematch retains the opponent and character.

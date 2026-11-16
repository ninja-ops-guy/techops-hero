# Felicia — Mr. Kali and violin specials

Implemented November 16, 2026 following the creator's direction: Felicia can call in a missile through her cat or play projectile notes with her violin. This establishes gameplay abilities, not a new comic scene revealing Mr. Kali's hidden identity to Felicia.

## Moves and loadout

| Move | Unlock | Focus | Behavior |
|---|---|---|---|
| Violin volley | Level 4, Intelligence 2; 1 skill point | 35 | Three traveling notes released at 100/230/360 ms. Each deals 9 base damage, travels at 700 world units/second and expires after 420 units. Occupies Special 1 (H). |
| Mr. Kali missile call | Level 6, Intelligence 3; 1 skill point | 70 | Grounded call with a fixed target marker and 900 ms warning. One 52-base-damage impact affects hostile centers within 85 horizontal / 60 vertical units. Occupies Special 2 (Y). |

Open Stats & skills → Learn skills → FELICIA. Learning a move equips it in its designated slot. Learned moves can be swapped freely through their detail screen. Evasive sweep and Precision kick remain available as alternatives, and remain the defaults for old saves and fresh Combat Lab sessions. Existing purchases are preserved.

The optional `nightTraining.equipped` map is validated against learned moves, actor and slot. Missing maps are compatible with old saves. Save failure rolls back equipment changes; free respec clears both skills and the equipped map. No extra points are awarded by migration.

Training/Arena use session-only equipment with all moves available to try. Changing the practice loadout does not write campaign progress. Training alone can refill focus. Touch controls remain MORE → SPECIAL 1 / SPECIAL 2.

## Simulation and interruption

Notes have swept horizontal collision against live enemies and platform rectangles. They do not hit behind their direction of travel, skip distant targets on slow frames, or pass through intervening platform geometry. Each note is consumed by its first collision. They respect the existing three-contact airborne juggle limit and cannot refund their own focus cost. At most six notes coexist; each has a finite range.

The missile picks an eligible enemy in front within 550 units when called, otherwise marks a point 220 units ahead. It does not follow a moving target after the call. Moving out of the marked area avoids impact. Only the current hostile list is affected; no story props, care stations, escorts or mission flags are modified. It is an overhead strike, not a roof-destruction simulation. Friendly fire is not added.

Both use the existing paused combat clock. Opening a menu pauses warning, flight and damage. Hurt/cancellation stops an uncompleted call and clears notes; already spent focus stays spent. Changing the controlled actor prevents pending hits and removes notes. Leaving a room, restoring the street or reloading does not preserve ordnance: it belongs to transient combat state.

## Presentation and verification

Code-drawn violin/bow, traveling note glyphs, Mr. Kali's black-cat silhouette, target warning, descending missile and bounded impact ring accompany existing Felicia art. These are provisional gameplay effects; commissioned final poses and animation remain open. A legacy render pass temporarily hides the player's width/height; presentation uses canonical fallback body dimensions so the cat sits at Felicia's feet and the violin stays at hand height.

New tests cover projectile travel/collision/range, pause, cancellation, actor ownership, missile warning/area/dodging, air-juggle limits, save compatibility, equipment validation/rollback and cat placement. Browser checks use actual equip controls, keyboard/touch specials, menu pause and save/reload. Their target positions and XP are declared fixtures. Full receipts are under `docs/qa/felicia-specials/`; physical-iPhone and long-term balancing are not claimed.

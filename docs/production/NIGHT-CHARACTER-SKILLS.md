# Night Walker character skills and moves

November 16, 2026. Builds on the offline combat lab and saved progression branches. All four playable human fighters retain the existing directional attacks, aerial attacks, grabs, throws, dash, slide cancels and gravity cancel. These additions do not replace that base kit or grant story access.

## Unlock and controls

Run Menu → Stats & skills → Learn skills → character. Each character has two active moves and one passive. Each costs one skill point and requires the listed level and stat rank; the existing free respec refunds them. The shared ten-point maximum skill budget means a build chooses between general and character skills rather than purchasing everything at once.

**H / Special 1** and **Y / Special 2** activate learned moves for the controlled character. On touch, MORE exposes both buttons. H and Y are reserved separately from existing remappable field controls. The character's catalog explains costs and posture requirements. Living World now resolves K and Felicia as themselves for combat skill ownership, rather than falling back to Mike. Linked Iona selection retains its existing authority checks.

| Fighter | Special 1 — H | Special 2 — Y | Passive |
|---|---|---|---|
| Mike | Breaker strike: grounded launcher, 32 base damage, 30 focus; level 3 / Strength 2 | Anchor sweep: grounded low knockdown, 26 damage, 35 focus; level 5 / Strength 3 | Firm grip: +10% directional throw damage; level 4 / Strength 2 |
| K | Rising arc: grounded launcher, 24 damage, 30 focus; level 3 / Dexterity 2 | Falling star: airborne downward slam, 30 damage, 40 focus; level 5 / Jump rank 1 | Air rhythm: +12% damage while airborne; level 4 / Dexterity 2 |
| Iona | Nunchuck flurry: three 7-damage contacts, 135 reach, 30 focus; level 3 / Dexterity 2 | Uzi burst: three 7-damage contacts, 380 reach, 50 focus; level 5 / Intelligence 2 | Unbroken rhythm: +4 focus on landed light attacks; level 4 / Dexterity 2 |
| Felicia | Evasive sweep: grounded low knockdown, 18 damage, eight physics frames of evasive startup, 25 focus; level 3 / Speed 2 | Precision kick: fast longer-reaching strike, 28 damage, 40 focus; level 5 / Dexterity 3 | Quiet footwork: further 15% reduction to dash cooldown; level 4 / Speed 2 |

Damage is before existing progression/preset modifiers. These names describe gameplay moves, not new supernatural canon or narrative events. Felicia's larger stealth/support system and Red's potential K skin are not introduced here.

## Focus and bounded combat

Focus starts at zero, caps at 100, and lives in the current combat state. Ordinary confirmed strikes earn eight focus; on-beat strikes earn four more. Guarded incoming contacts earn four. Unblocked hurt removes 25. Specials cannot refund their own focus through hits. Whiffing still spends the cost. Failed unlock, posture, pause or insufficient-focus checks spend nothing. Recovery prevents concurrent specials.

The HUD shows the numeric meter and six proportional pips. Focus resets when the combat state is replaced and is not persisted in a save checkpoint. It is not Day XP or a source of story unlocks.

All eight moves use the existing target, damage, pause clock and reaction systems. Multi-contact attacks stay on one target and stop on defeat, lost range, actor change or the existing three-hit aerial cap. Uzi is a bounded, horizontal same-height attack; it cannot hit behind, above another floor or beyond its reach. It is not a simulated projectile or an added destructible-wall/line-of-sight system. Its short tracer follows confirmed contacts. K's slam knocks down a grounded target or terminates an airborne juggle. Evasive sweep's startup invulnerability is short and uses the existing physics timer.

## Practice and presentation

Combat Lab uses complete character presets in Training and offline Arena, independent of campaign purchases. Training's menu can refill focus; Arena starts at zero and has no refill. Both preserve street state and earn no XP or unlocks. The practice move catalog is read-only.

Moves reuse existing animation poses; Iona's weapon silhouettes and contact traces are code-drawn provisional effects. This establishes playable behavior and readable controls, not final commissioned weapon animation or character-likeness certification. No generated art or new canon is claimed.

## Validation

`test_night_character_skills.js` covers all eight moves, bounded contacts/costs, ownership, persistence, locks, posture, pause, range, meter gain/loss, passives, finite juggles and practice isolation. Production-page browser tests exercise all specials with keyboard on desktop and touch on portrait/landscape, inspect the practice catalog, restore the street, learn Iona's Uzi through the actual menu and reload its saved unlock. XP, target positions and K's airborne position are declared fixtures. Physical-iPhone acceptance, full campaign traversal and long-term balance testing remain open.

# Night Walker supporting cast — review candidate

This draft makes the five ordinary Night enemy types visually closer to Mike’s reference combat art. Guard and hunter use neutral frames from the inspected transparent enemy sheet. Street thug, unarmed skimmer, drone operator and the small independent drone are newly generated candidate artwork using that sheet as the style anchor. Source and output hashes are in `NIGHT_REFERENCE_CAST_STYLE.json`; new art is not represented as individually creator-approved.

The renderer changes presentation only: hitboxes, AI, timing, health, input, saves and rewards remain untouched. It yields to the existing renderer when an image cannot be decoded or an enemy kind is unknown. Good Dogs and active Sector 04 use their prior renderer.

The five neutral images are not a complete animation set. Walk, attack, hit and defeat frames, the rest of the Night roster and environments, character readability on physical phones and visual approval remain open. This is a candidate for review, not a claim of complete game-wide consistency.

`test_night_reference_enemies.js` checks all five archetypes, image fallback, mode ownership and input-state immutability. The Night combat browser test includes a labeled five-enemy art fixture separately from real keyboard/touch combat, Charger and Night-mode checks.

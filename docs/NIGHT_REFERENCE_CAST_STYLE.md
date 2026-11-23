# Night Walker supporting cast — review candidate

This draft makes the five ordinary Night enemy types visually closer to Mike’s reference combat art. Guard and hunter use idle and action frames from the inspected transparent enemy sheet. Street thug, unarmed skimmer, drone operator and the small independent drone are newly generated candidate artwork using that sheet as the style anchor. Source and output hashes are in `NIGHT_REFERENCE_CAST_STYLE.json`; new art is not represented as individually creator-approved.

The renderer changes presentation only: hitboxes, AI, timing, health, input, saves and rewards remain untouched. It yields to the existing renderer when an image cannot be decoded or an enemy kind is unknown. Good Dogs, active Sector 04 and West Annex use their prior renderer.

All five enemies now face the player and select walking, attack preparation and recoil from their own art. The guard and hunter also have grounded recovery poses. The other three use newly generated action poses derived from their existing street silhouettes and reuse recoil during recovery. Walking advances with movement distance. Reduced motion holds a single stride. Final KO uses the existing combat feedback and despawn. The rest of the Night roster, environments and physical-phone readability still need visual review.

`test_night_reference_enemies.js` checks all five archetypes, image fallback, mode ownership and input-state immutability. The Night combat browser test includes a labeled five-enemy art fixture separately from real keyboard/touch combat, Charger and Night-mode checks.

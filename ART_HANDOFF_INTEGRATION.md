# Supplied art integration and backlog acceptance

Source: `TechOps-Hero-Art-Handoff(1).zip`, supplied September 11, 2026. Original inventory and hashes are preserved in `ART_HANDOFF_SOURCE.json`. Original sheets remain unchanged in the supplied archive. No new artwork was generated for this follow-up.

| Source | Integrated use | Deliberate exclusions |
|---|---|---|
| Katrin / Manchez locomotion | Run row and airborne dash sequence; active actor and partner renderer | Walk row is near-repeated: no certified walk loop; no idle/attack relabeling |
| Supplied Mike combat | Replaces the broken embedded idle/combat PNG with reviewed idle, strike, kick, guard, recoil and down poses | No Day Shift substitution |
| Mike traversal | Night-only run and ascent/apex/descent key poses | Punch-like dash extension; Day Shift atlas stays distinct |
| Masked Waldo | Cell 1984 / prison-escape figure after the established reveal; rescued follower display | Airborne kick never used as fall; no invented unmasking |
| Four-door Charger | Earth Night parked/travel rendering | Never in the dog prison world; perspective views not used as side view |
| Orbital props | Mission-specific doors/consoles, mid-distance conduits and restrained foreground atmosphere | No collision inferred from art; no claim of seamless tiles or 3D source |
| Existing K / supplied Sector 04 sheets | Current identity/reveal/inspectable providers retained | No Mike substitution; no premature K label |
| Paired human actions | Reference only | Blue-jacket identity unresolved |
| Everyday Waldo / enemy roster / Warden sheets | Existing providers retained pending a distinct demonstrated gap | No mass replacement merely because another sheet exists |

`node scripts/build_art_handoff.cjs /path/to/techops-art-handoff` reproduces seven runtime PNG atlases and `assets/handoff/atlas.json` using Sharp in an authoring environment. Runtime has no Sharp dependency. Each frame records its exact source rectangle, derivative rectangle, standing scale, foot anchor and background-removal count. Light-neutral flood fill starts at crop borders to preserve enclosed cream fur and silver details. No uniform 6×3 crop assumption is used for the 1774×887 dog sheets.

The passive loader fetches the small manifest, then decodes only requested atlases. The global inventory lists them without preloading all seven. Missing artwork keeps the existing actor/environment renderer available and is exposed in `TechOpsArtHandoff.health()`; a fallback is not art-certification evidence. Parser script count remains 265.

`/scripts/art_handoff_review.html` is a developer playback surface with pause/step controls, dark/light backgrounds and gameplay-scale frames. The new Chrome/WebKit CI step requires all seven atlases to decode and retains screenshots. Full campaign validation remains in the separate runtime/progression suites.

Backlog changes also include confirmed-impact-only FX, shared eased camera response, reduced motion, a common short scene entrance, M6 surveillance sweeps with catwalk cover, both-wave M2 boarding, M7 shuttle traversal, and prison-mask/coupler copy corrections. Existing hit-stop, damage, combo, SYNC and rescue ownership remain in their original authorities.

Remaining acceptance is explicit: physical iPhone Safari, complete alternating walk/contact cycles, distinct Mike dash, full start/stop/landing source sequences, DCC layer masters, cinematic-to-gameplay match frames, and unassisted late-campaign completion. The supplied archive does not contain those DCC sources or complete animation sequences. No generation request is necessary to integrate the usable material; any later generation requires the user's approval against these requirements.

Runtime graphics review found the pre-existing Night combat PNG had a broken compressed stream despite passing dimension/header checks. The supplied JPEG now reproduces its ten semantic slots in a valid transparent atlas. The embedded payload is byte-identical to the reviewed derivative, and the test decompresses every full indexed PNG before accepting it.

The Night input review also exposed Day prop inspection reacting to the same E key as combat. Day keyboard/touch interaction now checks the active mode; the legacy prop inspector also declines Night mode. Night movement/combat key state is still written normally.

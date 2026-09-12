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

The Night input review also exposed Day prop inspection reacting to the same E key as combat. The legacy prop inspector now declines Night mode after delegating to its existing interaction authority. Keyboard/touch, Good Dogs objectives, Sector 04 investigation and Night combat/Charger input keep their original routing.

Presentation fixtures now compare M3, Sector 04 and Industrial in Chrome and WebKit, recording 120 animation-frame intervals, decoded assets and screenshots. These fixtures do not replace campaign progression acceptance. The Sector 04 fixture exposed a missing district palette; its registry-owned configuration now supplies the renderer without adding Sector 04 to the six-district travel route. Local Chromium previews passed all three scenes; physical device certification remains outstanding.

The Sector 04 comparison also exposed Earth travel UI in the investigation encounter. Its Charger drawing, road markings and travel entry are now excluded while the Sector 04 authority is active; the entry toast explains investigation. The fixture presses E at the former car position and rejects an Earth travel dialog. Normal Night travel retains its car menu.

WebKit media isolation on Linux reproduced GD_CUT_01 stalling at 0.069 seconds after one decoded frame in a plain page with no game scripts; the same probe decoded 100 GD_CUT_02 frames and reached 3.34 seconds. A complete buffer, visible video and a running PulseAudio null sink did not resolve it. Browser acceptance now runs Chrome and WebKit on macOS 14 to validate Apple-platform media playback; deterministic contracts remain on Linux. Original MP4s and decoded-frame assertions are unchanged. Linux WebKit is not certified by this platform change.

The unchanged GD_CUT_01 then passed isolated macOS WebKit playback (74 decoded frames and 2.47 seconds), as did GD_CUT_02. This platform choice follows [Playwright’s WebKit media guidance](https://playwright.dev/docs/browsers#webkit). The crash film also exposed an application timing bug: its 9.433-second duration exceeded the old fixed 9-second watchdog. The absolute budget now derives from media duration plus the existing 3-second stall allowance; a deterministic test proves healthy playback reaches the end and stalled playback still recovers. Intro acceptance now rejects a plate fallback as video-completion evidence.

The first complete macOS run passed the real-input opening, decoded crash completion, both playable-mode runtime profiles, art review, and background validation. It exposed an inactive Good Dogs media bridge writing the normal Day dialog lock during opacity-zero entrance frames; the bridge now leaves other modes’ dialog ownership alone and treats a fading visible dialog as modal. The M3 progression driver now waits for the real three-card briefing and activates its controls before priming the documented encounter fixture.

The final progression-only failure had the same entry timing pattern at M7: the bot observed a temporarily clear modal state, waited, and fired the finisher after the restored briefing appeared. A local isolated M7 check completed the real finisher and shuttle walk after consuming the briefing. The full driver now consumes the actual restored briefing after each M5–M7 film before applying encounter fixtures. It also records player position/health and visible dialog text on failures.

The corrected late-mission driver reached the real Warden finisher, shuttle and all four Earthfall cards. Its remaining two assertions sampled M4 immediately after the film DOM detached while the cutscene bridge was still completing its promise. `resolveCutscene` now waits for that explicit bridge lifecycle to finish before checking the dialog lock and rescue flags; the assertions remain mandatory.

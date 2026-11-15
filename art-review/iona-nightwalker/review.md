# Iona Nightwalker sprite review — 2026-11-15

Status: implemented, generated and visually checked; new art is a review candidate. Not merged or deployed. Browser acceptance is tracked separately by the Iona sprite integration workflow.

The original Iona band sheet and ensemble second row were visually inspected. The adapted sheet preserves her short black bowl haircut, tan face, subtle ear jewelry and dark jacket with warm fasteners. It removes the drum kit and adds trousers, boots and unarmed movement/combat poses. No new story events, character unlocks or save fields are introduced. The creator subsequently requested directional combos; the added combat behavior is described below.

The runtime selects Iona only for an active Iona linked section in its matching district and playthrough. It yields to ordinary rendering after the section is left or completed, or when the playthrough changes. Good Dogs, Sector 04, driving and other actors retain their owners. An unavailable Iona image produces a loading/error label rather than silently substituting Mike.

## Actual visual checks

- Compared the original band pixels with all 24 output poses, including a 75px gameplay-scale contact sheet on dark and light backgrounds.
- Hair, costume, face silhouette and skin palette stay consistent. Hands and limbs were reviewed; no extra limb or visible gross anatomy defect identified at gameplay scale.
- Transparency verified on actual RGBA/WebP pixels. There are 1,084,887 fully transparent pixels. The runtime WebP is 865,482 bytes. Original PNG and lossless WebP retained.
- Initial fixed 256px cells exposed part of the downed head in the hurt frame. Corrected the source rectangles to measured blank gutters: hurt `[1008,768,240,256]`, down `[1248,768,288,256]`. Re-rendered and visually checked: no neighboring fragment, clipped head or missing feet. No artwork pixels were repainted.
- All 24 measured frame rectangles retain a margin around visible content (alpha > 128); downed pivot is grounded independently.
- These are 24 key poses with a four-pose walk. Attacks use the combat system's existing windup/contact/recovery clock with guard or jump anticipation/recovery. This is not 24 fully animated action sequences; throw-down reuses forward release and get-up uses existing down/crouch/guard/idle poses.

## Verification

- Local production release gate passed, including repository syntax checks.
- Focused actor isolation, stale-playthrough, district, combat timing, facing, paused-clock, draw priority and missing-image checks passed. Repeated focused checks after the measured-gutter correction passed.
- Local browser launch was blocked by environment socket permissions; it did not reach gameplay. No local-browser or physical-iPhone pass is claimed.
- Hosted browser script uses declared later-story prerequisite fixtures and a legally replayed Iona workshop history, then the actual section launcher, renderer and keyboard actions on desktop, portrait and landscape viewports. Consult workflow results before claiming browser verification.

Exact source/output hashes and frame bounds: `provenance.json`. Exact native-tool request: `image-request.json`. Its source path was an explicit local image input, and the original source was not replaced by a generated candidate. The native tool returned `exec-5bb8af07-b36d-42ec-b961-54f0f4f3d5a7.png`; it is retained as `iona-band-v1-source.png`.

## Directional aerial combos

Creator direction: “Let’s also give her some combos. Bicycle kick for aerial combos, and give her an aerial down light attack. Nightwalker fighting should have directional attack moves that chain into combos”.

| Input | Behavior |
| --- | --- |
| Ground ↑ + Light / E | Existing uppercut launcher; Jump / Space follows only after contact. |
| Ground ↑ + Kick / J | Existing rising launcher. Ground ↓ + Light stays low; ↓ + Kick stays sweep. |
| Iona, air ↑ + Kick | Bicycle kick, three scheduled 6-damage contacts at 75/145/215ms, 340ms recovery. Every contact consumes the existing three-hit juggle budget. |
| Air ↓ + Light / E | Quick 12-damage downward palm at 50ms, 180ms recovery; hits in front and below, starts descent without immediately imposing the heavy-slam lock. Shared Night Walker directional action. |
| Air ↓ + Kick / J | Existing heavy slam finisher. |

Example: rising kick → explicit jump → aerial light → ↑ + Kick. The bicycle finishes with only two contacts because the first light already spent one. To follow with downward light, move above the enemy with the next jump. The in-game run menu now contains a directional-combo guide. Keyboard and joystick share the same directional snapshot and recovery buffer.

Four bicycle frames were generated from the same original band reference and inspected on transparent/light backgrounds. They show preparation and alternating near/far leg extensions. The actual output is 1254×1254, not the requested 1024; the renderer uses the actual 627px cells. New movement tests exercise real production Night physics at 16ms, 100ms and 250ms frame intervals without repositioning after the initial encounter. They also check pause, lost viewpoint, interrupted attacks, target removal, no retargeting, one-time KO rewards and the existing aerial cap. These tests are not browser or physical-device evidence.

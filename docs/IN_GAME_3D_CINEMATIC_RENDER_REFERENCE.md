# TechOps Hero — in-game 3D cinematic render reference

**Owner reference:** six supplied portrait MP4 clips, November 23, 2026.  
**Purpose:** visual and motion target for authored, engine-rendered 3D animation and cutscenes. This is an art-direction brief; the clips are illustrative previsualization, not a claim that their frames are real-time renders or game-ready geometry.

## Reference map

| Supplied clip (filename stem) | Useful visual and motion reference | Apply to |
| --- | --- | --- |
| `01a2062e-ba9a-72bd-ac3d-e72e7dd56431(1)` (10.13 s) | Iona against a burning city, then compresses into a crouch and launches across a wet surface. Strong silhouette, weight shift, coat motion, orange fire against cool smoke. | Action blocking, landing and contact, exterior lighting. |
| `01a2064a-94b3-7e38-b38c-5098d57092a9(2)` and `(3)` (13.67 s each) | Nearly matching violet-dusk street sequences: cat at a window, stepped neighborhood, warm stall lights, a translucent human figure, then stark corridor silhouettes. | Depth, atmospheric perspective, scale, warm pools of light and scene transitions. The figure's identity is not established by these clips. |
| `01a20654-31be-7bcd-bdf4-f3dd696279f2(1)` (13.67 s) | Iona's crouch, movement into the vehicle, then held close facial acting. | Moving from full-body action to restrained expression without a model or lighting discontinuity. |
| `01a2065e-ff66-7ddf-af4c-9b5df123d221` (13.67 s) | Iona with radio on an industrial walkway, distant explosion, then an extreme facial close-up. | Spatially coherent light change, scale of effects, reaction acting and camera progression. The glowing eye is a concept image effect, not a new canon trait. |
| `01a20664-4fd8-78aa-b0a4-2913d57db99b` (13.67 s) | K and Iona walking, talking, shaking hands and embracing at a laundromat; the image shifts into comic-panel framing. | Two-person blocking, believable contact, quiet acting and a deliberate 3D-to-comic transition. Generated speech bubbles/text are not final dialogue. |

The filename stem follows `created-video-visual-ast_` and ends in `.mp4`. The originals were supplied to the project owner in chat; this document does not place those media files in the public repository.

## Render language

- **Characters:** Preserve recognizable approved silhouettes before adding detail. Iona has short black hair with bangs, ear piercings and her dark work jacket. K has a beanie, over-ear headphones, clear glasses and K insignia. Do not import incidental face drift, costume changes, or generated text as character canon. Kali is a long-haired black cat; his paws must remain black in the game model.
- **Materials:** Use tangible cloth, worn leather, metal, glass, skin and wet stone responses. Layer roughness and normal detail at the scale seen in medium shots; prioritize face, hands, hair, clothing folds and the contact points the camera actually reveals. Keep dark clothing separated from dark backgrounds with controlled rim light.
- **Lighting:** Treat orange fire, sunset and lamps as motivated warm sources; contrast them with violet dusk or cool industrial interior light. Bounce, haze and reflections should explain the environment rather than flatten it. Preserve readable eyes and facial planes in the close-ups. Explosion brightness and reflection should evolve together over time.
- **Camera:** Stage the location in a wide shot, establish spatial direction in a medium shot, then use close-ups when a reaction changes the meaning. Follow Iona's action on a legible trajectory; hold long enough on K and Iona's reunion for the gesture to read. Compose in 16:9 gameplay presentation with a 9:16 safe crop for the portrait references; avoid copying portrait framing so tightly that UI or subtitles have no room.
- **Motion:** Show anticipation, planted foot or hand contact, acceleration, follow-through and recovery. Crouch and jump must feel connected to the same ground plane. Avoid foot sliding, hand penetration, floating embraces and abrupt pose snaps. Give hair, jacket and straps secondary motion without overwhelming the pose. Eye-line, blink and breathing should carry quiet moments; lip sync only to approved dialogue and audio.
- **Environments and effects:** Build a camera-consistent 3D location with real occlusion and usable depth. Wet surfaces, smoke, distant activity and embers can add depth. Use restrained depth of field and bloom so silhouettes, contact points and captions remain clear. Keep particles and explosive effects tied to known world positions and light sources.

## Scene and engine integration

1. Start with an existing cutscene beat and storyboard its entry, key acting pose, camera change and exit to play. Use a match frame between the final cutscene frame and the first playable frame, including horizon, actor placement and lighting direction.
2. Reuse the existing campaign and cinematic owners. The render/animation layer observes story state and plays a shot; it does not decide damage, collision, objective completion, saves, film recovery or input ownership. Skip, reduced-motion behavior, subtitles, audio priority, pause and a clean return to control must remain available.
3. The current post-K Good Dogs 3D level has a stylized GLB prototype with quality tiers and a presentation-only renderer. Treat this brief as the quality target for the next character, rig, lighting and cinematic pass, not as a claim that the prototype already matches the supplied close-ups. See [post-K 3D](GOOD_DOGS_POST_K_3D.md) and [fidelity limits](GOOD_DOGS_3D_FIDELITY.md).
4. Preserve the approved Night Walker sprite and environment grammar for normal 2D play. In-engine 3D cinematics can use this richer material and camera treatment, provided the characters, palette motifs and handoff back to gameplay are unmistakably the same world. Comic-panel framing in the laundromat reference is an optional authored transition, not a requirement to render gameplay as a comic page.

## First acceptance slice

Deliver one short **engine-rendered** scene from an existing game beat with: (a) a wide location shot; (b) one correctly identified hero in a medium shot; (c) a close facial or hand-contact moment; (d) a matched return to live play. A Good Dogs house or ship scene can prove integration, while Iona and K need approved 3D likenesses before their reference moments are reproduced.

Review the slice at desktop 16:9 and narrow mobile widths. Capture actual engine frames and a short playthrough showing motion, Skip and the handoff. Compare the hero silhouette, lighting direction, contact, facial stability and environment continuity against the supplied clips. Measure frame pacing on target hardware before setting final mesh, shadow, effect and texture budgets; the portrait MP4 resolution and encoding are reference metadata, not game output requirements.

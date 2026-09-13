# After 118 — geometry and rendering upgrade

This revision upgrades the existing M5 presentation to bring the material response and lighting closer to the supplied industrial prison cutscenes. It remains a stylized prototype. Increasing surface density does not reconstruct photoreal likeness, fur grooming, clothing topology, or finished combat animation.

| Character | Original / lighter mesh triangles | High detail triangles | Rig |
|---|---:|---:|---|
| Katrin | 67,352 | 272,812 | Existing 17 bones and trot clip |
| Manchez | 86,252 | 349,356 | Existing 17 bones and trot clip |
| K | 29,370 | 118,664 | Existing 17 bones and idle clip |

Subdivision rounds broad surfaces and the original fur clusters. Garment clearance was corrected so the dogs' bodies no longer protrude through the sweaters. The high and lighter variants retain the same height, coordinate system and animation convention. Weight interpolation retains the existing prototype rig; deformation still needs an artist pass.

The renderer adds beveled architecture, instanced fasteners and drains, round conduits, scratched and oxidized metal, procedural knit/leather/camouflage detail, wet floor roughness variation, cloth sheen and reflective jewelry. A local environment map supplies reflections. A moving shadow region follows the party. High and Balanced add HDR bloom, shallow depth-based occlusion and tone mapping. Beam haze is restrained and depth tested. No external texture or CDN request is required.

Use **Graphics** in the opening or pause menu:

| Setting | Meshes | Pixel ratio cap | Shadow map | Film pass |
|---|---|---:|---:|---|
| High detail | Refined | 1.5 | 2048 | HDR where supported, bloom, depth occlusion |
| Balanced | Lighter | 1.0 | 1024 | Reduced occlusion, bloom |
| Performance | Lighter | 0.75 | Off | Direct tone-mapped render |

Coarse-pointer devices default to Balanced. The selection is saved separately from campaign state. Higher meshes are fetched only when needed. Retro view uses the pixelated orthographic presentation without shadows or film effects. The camera button also offers a **Crew close-up** for inspecting the characters.

The adapter remains presentation-only. M5 eligibility, native combat and story authority, Access Node requirements, K's release and Waldo's confinement are unchanged. `TechOpsGoodDogs3D.setQuality(value)` exposes the same rendering choice for an integrator; the full campaign does not yet have a dedicated graphics menu.

## Evidence and limits

The `qa-good-dogs-fidelity` folder contains actual WebGL scene captures and validation output. Capture tooling pauses simulation and temporarily stops repeated frame submission for software-GPU screenshots; it does not synthesize or edit the captured pixels. High, Balanced, Performance, retro, K observation, crew close-up and the narrow viewport are checked. Quality changes must preserve paused session state, keyboard movement must still work, and the setting must survive reload.

The six local 3D/progression tests and nine quality-integration cases pass. All six GLB variants have zero Khronos validator errors; each retains the existing non-root skinned-mesh hierarchy warning. These results do not certify physical iPhone frame rates or the entire campaign. The previously failing PR-wide CI gates are separate outstanding release work; this PR should remain draft.

Fal replacement-mesh generation was attempted, but the connected account reported exhausted balance. No Fal-generated replacement mesh was used. The delivered assets are refinements of the existing authored Blender scene. The editable refinement scripts are in `assets/good-dogs-3d/source/`; material shaders and the scene renderer are in the adjacent modules.

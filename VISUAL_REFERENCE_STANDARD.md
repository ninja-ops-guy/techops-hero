# TechOps Hero — Visual Reference Standard

**Status:** production authority for gameplay presentation
**Reference lock date:** 2026-08-25

The supplied gameplay and sprite references are authoritative for visual identity. A system may be mechanically correct and still fail production review if the rendered game does not resemble these references.

## Night Walker — Mike

Night Walker Mike is the bearded Black male operator shown in the supplied combat/traversal sheets: tied/dread hair, sunglasses, black technical jacket/pants, visible badge/ops details, grounded heavy silhouette, orange contact/impact energy. Night gameplay must not substitute the Day Shift `PLAYER_ATLAS`, generic chibi Mike, or unrelated action poses.

Production priority is silhouette and identity first, animation count second. Approved gameplay states must be visibly classified from the supplied references before binding.

## Night Walker stage language

Target gameplay is a side-view cinematic industrial brawler, not a small sprite floating over an empty procedural street. Composition should converge on the supplied Sector 04 reference:

- large readable character silhouettes;
- full-width authored industrial environment;
- foreground/midground/background depth;
- wet-floor/rain/reflection and practical light where appropriate;
- props and architecture that establish aerospace/industrial context;
- compact mission/HUD information outside the combat focal area;
- combat FX attached to contact and animation timing;
- minimal empty black letterbox area on mobile.

## Vehicle identity

Mike's Night Walker hub vehicle is a modern four-door Dodge Charger. It must read as a Charger at gameplay scale: long four-door sedan proportions, muscular shoulder/rear haunch, four-door glasshouse/door seams, large wheelbase and sedan roofline. A generic coupe, two-door sports car, slab rectangle, or unrelated black sedan fails the reference contract.

Green underglow/ghost-flame treatment may remain as TechOps Hero styling, but may not distort the Charger silhouette.

## Mobile composition

Portrait mobile must preserve the reference's readable subject scale. Cinematics should recompose/crop rather than letterbox a landscape frame into a narrow strip with large unused black areas. Touch controls must stay inside safe areas and must not obscure primary actors, enemies, or interaction targets.

## Production gate

Visual QA should fail a build when any of the following is true:

- Night mode renders Mike from `PLAYER_ATLAS` instead of the reference-locked Night Walker source;
- the parked/driving hub vehicle does not read as a four-door Charger;
- a production cutscene leaves most of the mobile viewport unused when a portrait reframe is possible;
- action sprites do not match the supplied Night Walker identity;
- authored Sector 04 gameplay is materially flatter/sparser than the supplied industrial brawler reference without an explicit temporary-fallback marker.

Current reference-derived runtime authority is `night_walker_reference_v1.js` + `night_reference_visuals.js`. Legacy Night Walker payload chunks remain historical/restoration material, not production authority.

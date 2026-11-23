# Siege environment and movement presentation

This review candidate is stacked only on PR154 (53 bb 6 a 8). It does not choose the
merge path between 153/154 or combine Night cutscene PR159. It adds authored
engine pixel-art layers for the existing source-side access, handrail approach,
secondary services room, occupied frontage, transfer court and receiving care.
Separate distant ruins, midground architecture and foreground street material
preserve the existing world coordinates and interaction plane. Ground carriers
and the visible infected hull use distinct detailed silhouettes. The visible
hull plus distant companions is scenery for the existing arrival group, never
proof of capacity, wave arrival, evacuation or a new event.

K, residents, units, enemies and carriers interpolate between existing 100 ms
mission samples. K's sprite, original source rectangles and ground anchor stay
unchanged. Walking phase follows actual distance, with stationary/paused/reloaded
states kept stable. Pose and position freeze on pause; resume cannot rewind to
an older interpolation sample. Sector changes and transport transitions snap to
their authored destination instead of sweeping through unrelated geography.
Portrait uses a 540 px logical camera against the same world; wide layouts 960 px.
Mike's reviewed six-frame run row also follows distance rather than wall time.
No new dog gait or Mike dash is invented from unclassified source poses.

Mission speed, update rate, collisions, hit/recovery timing, inputs, HP, population,
consent, command arrangements, event ledgers, save schema and all three endings
retain their original owners. Art/motion modules are optional; unavailable modules
retain playable legacy presentation. Architecture uses an LRU cache of at most
two canvases (maximum 2880×430 each); reduced motion holds the gait frame and the
static scenery adds no flashing, camera shake, new clock or frame loop.

The provenance manifest is docs/art/low-quarter-art-motion-manifest.json.
Source art remains byte-identical. Rendered geometry is a new visual review
candidate, not creator-approved final art, a new likeness certification or a 3D
master. The existing placeholder portraits for secondary actors have not become
final character model sheets. Physical phones/Safari and measured device frame
rates require their own qualification.

Validation includes the existing 58 rescue cases,22 siege contracts and 9 full
mission groups, plus interpolation, pause/resume, sector reset, immutable state,
world registration and bounded caching. The hosted mission workflow binds the
exact source and runs all three endings plus 390 px/320 px touch and short-landscape
profiles through actual inputs using the existing completed-epilogue fixture and
virtual clock. Additional receipts observe rendering between unchanged simulation
ticks and retain sector composition screenshots. These are not earned full-game
playthroughs or physical-device performance measurements.

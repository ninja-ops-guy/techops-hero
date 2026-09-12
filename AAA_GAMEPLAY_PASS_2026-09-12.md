# Gameplay quality pass — current objectives, prison staging, fighting sound

## Revision scope

Extends PR #26 (`661de60289f4ef59778e156052c812543f59c3d1`) over main
`31cdf77264d657e0a43c291b163e143546dd0325`.

The initial PR's independent experience loop is replaced, not layered on top.
The first version could infer progress from horizontal position, invent A/E
prompts for decorative landmarks, replay old combat serials across worlds, add a
second HUD, and synthesize duplicate sounds without the existing master mute.
Those are not acceptable tradeoffs for presentation polish.

## Implemented

### One objective HUD, driven by actual mission state

`production_gameplay_experience.js` is now a passive read model. It owns no RAF,
timer, audio context, input, save, progression, or DOM ribbon. The existing
`good_boys_hud_lite.js` displays its current objective and a second line of
context in the original HUD footprint, with larger small-screen labels.

M1/M2 retain the property/boarding route; M3 reads native breach/relay phases.
M4 tracks the actual clue objects (three observations required), cell release and
ambush; M5 separates Mike Index, security, node and secured-route phases; M6 shows
actual remaining decrypt time, scan/cover state, uplink loss, final wave and
release; M7 requires the recorded tandem result before pointing to the shuttle.
M8 never turns a presentation read into campaign completion.

Directions are LEFT / RIGHT / NEARBY relative to real target coordinates. They
are not a guessed percentage or metres. No new use prompt impersonates the real
input owner. Canonical/runtime divergence, ending, drive, dialog, battle,
presentation blockers, hidden pages and stale worlds suppress guidance. Existing
Night status space shows real hostile/pending/clear state without another ribbon.

### M4–M7 world-aligned raster staging

`orbital_scene_staging.js` differentiates detention, access core, surveillance,
and shuttle-bay scenes using approved prison source frames and registry anchors.
Actual clue/uplink positions control placement. Far/mid service structures use
restrained parallax; gameplay props stay world-aligned. M4/M6 use the paired open
door source frame only after the actual release flag. Exit lighting follows
recorded node/rescue/tandem outcomes, never an empty enemy array.

After the prison source decodes, a restrained structural backdrop replaces the
old screen-relative fallback boxes that duplicated consoles and cell labels.
Before decode (or if the module is unavailable), the original backdrop remains.
Generic opaque landmark rectangles are replaced with small labels/brackets;
nearby airborne characters retain visual priority. Foreground light runs stay
below the feet. Source calls are culled, bounded and preserve Canvas state.

The existing Night renderer, art passes and compositor call these services at
explicit seams. Collision, platforms, enemy timing, health and progression are
unchanged. There is no competing scene loop and no new image payload.

**These are staged raster environments, not DCC masters, newly approved art,
matched film/gameplay frames, or final environmental-art certification.**
The existing source-art quarantines remain intact.

### Semantic fighting audio and captions

Integrated the earlier gameplay kit, including its Tuesday/workday follow-ups
and investigation-integrity changes, together with the quality-pass staging and
mission guidance. See `docs/QUALITY_INTEGRATION_2026-09-12.md` for the current scope.

`runtime_combat_audio.js` provides 16 semantic cues, including swing, miss, grab,
hit variants, throw, crowd/wall impact, slam, guard/block, hurt, lost grip and KO.
`night_combat.js` invokes it directly at real events; there is no event-history
poller. Guarded contact does not double-play a hit. Source timing and damage are
unchanged. Unsupported audio cannot prevent combat.

The bus uses the existing shared AudioContext, master mute and SFX slider,
independent combat volume, optional captions, bounded eight-voice polyphony,
priority/rate limiting, cleanup and gesture unlock. Suspended/background sounds
are dropped, not replayed later. Stereo position is tied to the confirmed event,
clamped to a narrow field, with mono fallback on older implementations. Music is
untouched. Inactive/mismatched worlds and dialogs cannot play stale street cues.

Access settings through **the Charger menu → Combat sound & captions**, or
**Mike's workstation → Combat sound & captions**.
Good Dogs, Sector 04 and Waldo retain their existing audio/combat authorities.
The initial PR's unconditional vibration and full-screen hit/whiff flash are
removed; confirmed-hit effects remain with the original renderer.

## Historical R2 validation

The current integrated validation supersedes the counts below; see
`docs/QUALITY_INTEGRATION_2026-09-12.md`.

The full main snapshot was recovered from Pages artifact `10293194634`, SHA-256
`0b95d81250b9e43d8299c92423ad957c6359792342ed5204a3465c084c4d3c3b`.
The local Git baseline is reconstructed from this artifact, not the original
remote commit object. Remote publication must preserve untouched tree entries,
including workflows omitted from Pages artifacts.

- Baseline: all 57 aggregate suites plus the Mike action-atlas quarantine passed.
- Updated aggregate: all 60 suites plus the unchanged quarantine passed.
- Focused contracts: 34 audio, 24 objective, 24 staging tests (82 total).
- Updated the exact cache-version expectations, retaining all existing structural
  assertions and adding loader/bootstrap parity and audio-before-emitter checks.
- `scripts/gameplay_quality_browser.mjs`: eight Chromium renderer fixtures
  (M4–M7 at 1280×800 and 390×844) plus two real WebAudio/gesture/mute fixtures.
  Uses the real concern modules and original atlas bytes in an offline document.
  Screenshots and JSON evidence were retained; no page errors were observed.

Full-page browser navigation was blocked by the local browser environment.
These offline fixtures do NOT certify the full game boot, mission playthrough,
cinematic decoding/handoff, input routing, iPhone Safari, WebKit, physical audio
mix, performance/thermals, or deployment. Exact-head GitHub CI remains separate.
No existing gate was weakened or skipped to make this pass green.

## Next highest-value work still open

1. Exact-head full-game Chrome/WebKit and physical-device opening/Good Dogs route.
2. DCC-authored M4–M7 masters and matched cinematic/gameplay frames; staged raster
   presentation is not the closeout evidence for that art lane.
3. Approved alternating dog walks, start/stop/landing and distinct Mike dash poses.
4. Integrate and independently validate the rest of the unpublished workday kit.
5. Profile device costs and retire legacy hooks one behavior cluster at a time.

No release-ready, AAA-complete, or roadmap-complete claim is made by this pass.

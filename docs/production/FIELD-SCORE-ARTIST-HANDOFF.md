# Living World Artist-Stem Handoff

Status: creator-approved song and scene proposal; catalog and routing implemented in draft PR #131. Artist exports and listening acceptance remain pending. This handoff does not claim that stems exist.

## Approved candidate mappings

These are campaign soundtrack placements for review and production. They do not replace or edit K Terminal's published comic-to-song Guided Music cues.

| Song | Established narrative association | Living World scene | Proposed use |
| --- | --- | --- | --- |
| AGAMEMNON | Iona's revenge / violent beats; published cue: Revision G pages 117–121, Iona stair fight | `iona_pressure` — “Countermeasure” | Iona's active combat passage. Keep the performance identity and drum part intact. |
| Time Crumbles | Escape | `prison` — “Through the Walls” | Sector 4 escape movement. Let danger rise during the route and recede at the safe handoff. |
| Somewhere Deep Down Below | Escape / flight | `dock` — “Not Until They Answer” | Launch and evacuation departure. Let the pulse carry movement; reserve the threat layer for actual danger. |
| The Mercy I Buried | Demolition / “watch this” | No current PR #130 match | Hold for a future approved demolition scene; do not force it onto a generic combat or factory scene. |

The narrative associations are already represented in the published Guided Music catalog. The game placements above apply those associations to Living World scenes; they are not evidence of existing game cues or of delivered arrangements.

## Source and availability

At PR #130 exact head `7af5cc3a7a4ba428d7cb768abd071431da80adf2`, `assets/music/field-score.json` declares `source: "reference-arrangement"` and `layers: {}`. The draft's changed-file inventory contains no artist audio exports. The published Guided Music catalog links complete SoundCloud recordings; it does not provide separate synchronized production stems.

Keep the reference arrangement active until the selected song's approved export pack passes validation. Do not set the manifest to `artist-stems` or add fictional paths before real files are supplied.

## Layer arrangement brief

Prepare each selected song as one coherent adaptive arrangement:

- **bed:** the song's harmonic and tonal foundation; present in exploration, danger, combat, and recovery.
- **pulse:** its forward rhythmic motion; moderate in exploration, stronger during traversal or flight, reduced during recovery.
- **threat:** a tension or impact arrangement of the same song; fade in for meaningful danger and reach its strongest approved mix during combat.
- **quiet:** a sparse complementary part from the same song (not a duplicate full mix over the bed) for recovery and approved character moments.

Transitions should happen on musical phrase boundaries. Danger and combat should be separate runtime contexts: danger can raise tension without implying combat. Recovery should lower threat and pulse, then favor bed and quiet. The runtime now distinguishes exploration, visible local danger, active combat, four simulation seconds of recovery, escort care, and quiet aftermath. Named episode, actor and moment cues select songs. State changes use the selected pack’s phrase length; song changes wait for the audible phrase boundary, release the previous pack, then load and start the next pack. Loading may leave a short silence; cross-song seamless streaming is not implemented.

For character-specific moments, route only from an explicit scene cue approved for that character. Preserve current instrument assignments: K on guitar, Mike on bass, Felicia on violin/piano/synth, Waldo on the electronic mixing console, and Iona on drums. These are arrangement roles, not evidence that every character is physically performing in each scene. Iona remains the primary drummer in Ghost Bends; only one drummer performs at a time. Do not duplicate Iona's percussion across pulse and threat, add an implied second drummer, or treat a layered arrangement as permission to change band roles.

## Artist export specification

Provide up to four isolated stereo stems per selected song: `bed`, `pulse`, `threat`, and `quiet`. Each stem must be printed from the same approved session and arrangement. A stereo master is useful for reference and listening comparison, but cannot supply adaptive layers.

For each pack, supply:

1. Approved song title and stable song ID.
2. Actual tempo in BPM, meter, and integer loop bar count. PR #130's 96 BPM / four-bar example is not a song recommendation. The current duration formula assumes 4/4.
3. Each delivered layer's filename, codec, sample rate, channel count, file size, and measured duration.
4. A DAW export note confirming a common musical start, sample-aligned loop end, no layer-specific leading silence, and matching tempo and bar count.
5. An approved full-mix reference and per-state listening review, including loop seam and codec-padding checks.

Runtime constraints at this PR head:

- BPM range: 40–200; bars: 1–64.
- Accepted stem extensions: WAV, MP3, OGG.
- Relative same-origin paths under `assets/music/`; external SoundCloud paths are rejected.
- Maximum compressed file size: 32 MiB per stem.
- Maximum total decoded audio: 64 MiB, calculated from decoded frame count, channels, and four bytes per sample.
- Declared loop duration is `bars × 4 × 60 / BPM`; decoded duration must be within 50 ms. Target sample alignment, not merely the tolerance.

Deliver 48 kHz, 24-bit PCM WAV production sources from the same session. Do not independently normalize layers. Leave mixing headroom and confirm the full sum never clips. Tempo changes or pitch-preserving stretching require approval of the resulting arrangement; the engine never changes playback rate to force a song to 96 BPM. Use a lossless aligned export as the production source, then validate any optimized delivery encode against the same loop endpoints. Reduce loop length, channels, or encoded bitrate only with the artist's approval and after mobile listening.

## Implemented catalog and routing

`assets/music/field-score.json` is now schema version 2. The existing top-level reference BPM and bar count describe only the procedural fallback. Each catalog track has a stable ID, title, published recording reference, status (`pending`, `ready`, or `reserved`), and `pack`. All supplied tracks currently have `pack: null`. Recording URLs are reference metadata and are never fetched for adaptive playback.

The runtime cue scopes are explicit:

| Cue | Active moment |
| --- | --- |
| AGAMEMNON / `iona_pressure` / Iona | After the initial machine-reach observation, through the encounter and its recovery/aftermath. |
| Time Crumbles / `prison` / Katrin or Manchez | After K’s cell has opened, during the return for Oz and approach to the escape corridor. No shuttle-flight gameplay is implied. |
| Somewhere Deep Down Below / `dock` / Iona | Only after the final evacuation report has completed. The existing “Stay for the aftermath” action can expose the quiet departure aftermath; support verification and medical transfer remain outside this cue. The draft contains no playable flight sequence. |
| The Mercy I Buried | Reserved; no runtime cue. |

Private Iona rehearsal is not mapped to a published song. Audition taps silence the background score so a second drum performance cannot overlap it. Rehearsal data remains private under existing save rules.

A delivered `ready` pack must provide `approved: true`, the actual `bpm`, integer `bars`, `meter: [4, 4]`, `phraseBars` (an integer divisor of the loop bars), a `layers` map with real same-origin paths, and `percussionLayer` identifying one delivered layer or `null` for a percussion-free arrangement. This declaration needs listening review: code cannot determine whether a WAV contains a second drummer. Do not set approval merely because the song placement was approved.

To activate exports, change that track from `pending` to `ready`, supply its validated pack, and set the catalog’s top-level `source` to `artist-stems`. That switch enables ready packs only. Pending, reserved and unmapped scenes continue to use the reference instrumental. Legacy single-pack manifests remain readable.

The loader checks supported tempo/meter, phrase divisibility, local paths, duplicate files, file size, duration, matching decoded sample counts, and memory. Approved exports must match the expected loop duration to within one decoded sample; the older 50 ms guard remains for legacy packs. Only mono/stereo decode is supported. A conservative stereo estimate is checked before each decode; final actual buffer sizes are checked after decode. The 64 MiB limit covers retained decoded stems, not the browser’s entire process. One decode queue prevents overlapping pack loads. Stop/leave invalidates pending work and releases decoded buffers; a stale response cannot enable playback.

Failure falls back to the reference score and records an audio error; the settings screen identifies the selected score. It never relabels reference audio as a song. The existing music toggle remains exclusive with SoundCloud playback. Pausing, dialogue, hiding, blur and leaving retain their silence behavior.

Remaining production work is the actual artist exports, per-song audition and balancing, codec seam checks, Safari/WebKit compatibility, and physical iPhone memory/playback acceptance. Generated test tones validate transport and timing only. No original recording has been converted, downloaded, separated, stretched, or promoted as a stem.

The music state must not reveal unseen enemies, change mission outcomes, authenticate memories, or overwrite any existing story cue.

## References

- [PR #130](https://github.com/ninja-ops-guy/techops-hero/pull/130)
- [Exact-head field-score manifest](https://github.com/ninja-ops-guy/techops-hero/blob/7af5cc3a7a4ba428d7cb768abd071431da80adf2/assets/music/field-score.json)
- [PR #130 production notes](https://github.com/ninja-ops-guy/techops-hero/blob/7af5cc3a7a4ba428d7cb768abd071431da80adf2/docs/production/FIELDCRAFT-EXPANSION.md)
- [K Terminal Guided Music catalog](https://github.com/ninja-ops-guy/theemrld-portfolio/blob/main/public/k-world/guided-cues.json)

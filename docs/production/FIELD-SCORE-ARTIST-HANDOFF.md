# Living World Artist-Stem Handoff

Status: creator-approved song and scene proposal; production exports and runtime routing remain pending. This handoff does not claim that stems exist.

## Approved candidate mappings

These are campaign soundtrack placements for review and production. They do not replace or edit K Terminal's published comic-to-song Guided Music cues.

| Song | Established narrative association | Living World scene | Proposed use |
| --- | --- | --- | --- |
| AGAMEMNON | Iona's revenge / violent beats; published cue: Volume I stair fight | `iona_pressure` — “Countermeasure” | Iona's active combat passage. Keep the performance identity and drum part intact. |
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
- **quiet:** a stripped, intimate version of the same song for recovery and approved character moments.

Transitions should happen on musical phrase boundaries. Danger and combat should be separate runtime contexts: danger can raise tension without implying combat. Recovery should lower threat and pulse, then favor bed and quiet. The current engine selects `threat`, `care`, `quiet`, or `explore`; it does not yet expose distinct danger, combat, recovery, or character-cue routing.

For character-specific moments, route only from an explicit scene cue approved for that character. Preserve current instrument assignments. Iona remains the primary drummer in Ghost Bends; only one drummer performs at a time. Do not duplicate Iona's percussion across pulse and threat, add an implied second drummer, or treat a layered arrangement as permission to change band roles.

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

Use a lossless aligned export as the production source, then validate any optimized delivery encode against the same loop endpoints. Reduce loop length, channels, or encoded bitrate only with the artist's approval and after mobile listening.

## Required integration changes after exports arrive

PR #130 currently loads one configured pack, with up to four layers. It has no catalog of songs and no per-episode or character cue table. Once the exports exist, integration should:

1. Add a versioned score catalog with one entry per approved song, each containing its own BPM, meter/bar count, and real layer paths.
2. Add explicit Living World cue records keyed by episode and scene moment. Use the approved IDs above; leave The Mercy I Buried unmapped until an approved matching scene exists.
3. Load only the selected pack after the player's intentional audio gesture; unload the previous pack before loading another to respect mobile memory.
4. Add phrase-boundary transitions for exploration, danger, combat, recovery, and approved character moments. Keep pause, mute, dialogue, hidden-page, blur, and leave behavior from PR #130.
5. Keep `source: "reference-arrangement"` as the fallback until a selected artist pack has passed inventory, duration, memory, loop-seam, same-origin, and mobile playback checks.

The music state must not reveal unseen enemies, change mission outcomes, authenticate memories, or overwrite any existing story cue.

## References

- [PR #130](https://github.com/ninja-ops-guy/techops-hero/pull/130)
- [Exact-head field-score manifest](https://github.com/ninja-ops-guy/techops-hero/blob/7af5cc3a7a4ba428d7cb768abd071431da80adf2/assets/music/field-score.json)
- [PR #130 production notes](https://github.com/ninja-ops-guy/techops-hero/blob/7af5cc3a7a4ba428d7cb768abd071431da80adf2/docs/production/FIELDCRAFT-EXPANSION.md)
- [K Terminal Guided Music catalog](https://github.com/ninja-ops-guy/theemrld-portfolio/blob/main/public/k-world/guided-cues.json)

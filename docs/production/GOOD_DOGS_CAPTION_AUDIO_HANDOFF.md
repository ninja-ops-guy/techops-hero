# Good Dogs caption and audio handoff

Base: PR #134 head ec9dd7928c6b119c937a151952dec5c10b3a6d00. No caption text is approved or shipped in this change. Per the November 16 quality review, 01 and 04–08 have audio, 02 and the separate crash clip do not, and 03 is retired. The integration manifest describes story context; it is not a transcript of movie audio.

| Asset | Caption state | Media access in this review |
| --- | --- | --- |
| 01_signal_beyond_earth_pixel.mp4 | transcription and timing needed | not locally downloaded; remote audio analysis used for active audio clips |
| 02_signal_pull_transition_pixel.mp4 | no audio per prior probe; recheck on replacement | not locally downloaded; remote audio analysis used for active audio clips |
| 03_orbital_approach_pixel.mp4 | retired; do not ship as active | not locally downloaded; remote audio analysis used for active audio clips |
| 04_cell118_triple_jump_to_terminal_pixel.mp4 | transcription and timing needed | remote audio extracted; manifest duration 7.033333s |
| 05_cell118_approach_k_reveal_pixel.mp4 | transcription and timing needed | not locally downloaded; remote audio analysis used for active audio clips |
| 06_k_freed_prison_escort_pixel.mp4 | transcription and timing needed | not locally downloaded; remote audio analysis used for active audio clips |
| 07_cell1984_hack_pixel.mp4 | transcription and timing needed | SHA-256 53d4ef89a90201421e4ec6fd1f3022e9944bba82a0411936cdf9743fbf45a838 matched manifest; AAC; 4.921995s |
| 08_team_reunited_exit_pixel.mp4 | transcription and timing needed | SHA-256 24a444d2801e667fc775585674d6593d41ec4087af1ea0cca73dd9d592eaea01 matched manifest; AAC; 2.566341s |
| 09_prison_crash_selected_pixel.mp4 | no audio per prior probe; separate player | not locally downloaded; remote audio analysis used for active audio clips |

Clips 07 and 08 were downloaded and probed locally; the audio of 01 and 04–06 was extracted from the public repository by the analysis service. None was independently listened to. There is no verified dialogue, timed VTT, shot placement, or transcript in this change. To add a track, listen to the exact final movie; record its SHA-256; transcribe speech and meaningful sounds without inferring unheard material; time cues against the film; review names, sound descriptions, sync and placement with the creator; then set that clip's `captionSrc` to the reviewed same-origin VTT. Revalidate when movie bytes change. The native TextTrack renderer accepts authored cue position settings; top/bottom placement requires per-shot review. Missing and failed tracks report unavailable without affecting progression.

Movie sound remains muted until a gesture and is blocked by the existing master mute. Its volume follows the music setting where the browser permits. The existing SoundCloud widget is suppressed using a scoped claim while film sound is enabled; release never calls play or pause. When a requested soundtrack widget is unavailable, film sound remains muted. Pausing or interrupting a film releases its claim and returns film sound to muted; a fresh gesture is needed to enable it again. The controller uses the current game music setting as the restore baseline when no existing duck owns one. Other soundtrack sources, actual iOS volume behavior and asynchronous audible transitions require real-device investigation.

## Preliminary machine audio scan — not caption approval

At repository head 15b509583b30c586efaaf443a4e57f5bf2c108fd, speech-to-text and separate audio-classification models were run against each active audio-bearing movie. These are unverified machine observations, not listening evidence, a transcript, or an approved cue sheet. Do not add model-produced words to the game until checked against the actual recording and authoritative lyrics.

| Clip | Preliminary classification | Outstanding review |
| --- | --- | --- |
| 01 | Model reports rap vocals and music | Confirm words, song source, timings and visual placement by listening. |
| 04 | One model labels a water-like sound; another reports instrumental music and whooshing/crackling | Resolve the conflicting descriptions by listening; check for any speech and time individual effects. |
| 05 | Model reports rap vocals and music | Confirm words, source, timings and visual placement by listening. |
| 06 | Model reports rap vocals and music; possible percussive or impact sounds | Determine which sounds are musical and whether distinct effects need cues. |
| 07 | Model reports rap vocals and music; generated words were uncertain | Verify lyrics and timing; locally probed original is 4.921995 seconds. |
| 08 | Model reports rap vocals and music; generated words were uncertain | Verify lyrics and timing; locally probed original is 2.566341 seconds. |

The machine transcript produced plausible-looking but unverified words. It has not been used as a caption and must not be treated as canon or lyric approval. Source-review links are the exact media under [the pinned repository tree](https://github.com/ninja-ops-guy/techops-hero/tree/15b509583b30c586efaaf443a4e57f5bf2c108fd/assets/cutscenes/good_dogs).

## Acceptance still required

- Listen to each active audio track and complete/approve caption drafts; test VTT timing against exact hashes.
- Review every shot in portrait and landscape for captions, controls, safe areas, text and character/action obstruction; verify actual platform cue styling.
- Test screen-reader navigation, caption/transcript usability and focus return on real assistive technology.
- Listen for music overlap, levels, master mute, mute changes, pause/resume, errors, skip and consecutive films on desktop and physical iPhone.
- Run the full production gate and real browser acceptance on the exact integrated candidate; run the actual campaign route, including reloads and the Cell 118 handoff. The local fixtures do not certify playback, visuals or a release.

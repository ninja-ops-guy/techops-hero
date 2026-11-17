# Good Dogs caption and audio handoff

Base: PR #134 head ec9dd7928c6b119c937a151952dec5c10b3a6d00. No caption text is approved or shipped in this change. Per the November 16 quality review, 01 and 04–08 have audio, 02 and the separate crash clip do not, and 03 is retired. The integration manifest describes story context; it is not a transcript of movie audio.

| Asset | Caption state | Media access in this review |
| --- | --- | --- |
| 01_signal_beyond_earth_pixel.mp4 | transcription and timing needed | bytes unavailable |
| 02_signal_pull_transition_pixel.mp4 | no audio per prior probe; recheck on replacement | bytes unavailable |
| 03_orbital_approach_pixel.mp4 | retired; do not ship as active | bytes unavailable |
| 04_cell118_triple_jump_to_terminal_pixel.mp4 | transcription and timing needed | bytes unavailable; manifest duration 7.033333s |
| 05_cell118_approach_k_reveal_pixel.mp4 | transcription and timing needed | bytes unavailable |
| 06_k_freed_prison_escort_pixel.mp4 | transcription and timing needed | bytes unavailable |
| 07_cell1984_hack_pixel.mp4 | transcription and timing needed | SHA-256 53d4ef89a90201421e4ec6fd1f3022e9944bba82a0411936cdf9743fbf45a838 matched manifest; AAC; 4.921995s |
| 08_team_reunited_exit_pixel.mp4 | transcription and timing needed | SHA-256 24a444d2801e667fc775585674d6593d41ec4087af1ea0cca73dd9d592eaea01 matched manifest; AAC; 2.566341s |
| 09_prison_crash_selected_pixel.mp4 | no audio per prior probe; separate player | bytes unavailable |

Both accessible files were probed, not listened to. There is no verified dialogue, timed VTT, shot placement, or transcript in this change. To add a track, listen to the exact final movie; record its SHA-256; transcribe speech and meaningful sounds without inferring unheard material; time cues against the film; review names, sound descriptions, sync and placement with the creator; then set that clip's `captionSrc` to the reviewed same-origin VTT. Revalidate when movie bytes change. The native TextTrack renderer accepts authored cue position settings; top/bottom placement requires per-shot review. Missing and failed tracks report unavailable without affecting progression.

Movie sound remains muted until a gesture and is blocked by the existing master mute. Its volume follows the music setting where the browser permits. The existing SoundCloud widget is suppressed using a scoped claim while film sound is enabled; release never calls play or pause. When a requested soundtrack widget is unavailable, film sound remains muted. Pausing or interrupting a film releases its claim and returns film sound to muted; a fresh gesture is needed to enable it again. The controller uses the current game music setting as the restore baseline when no existing duck owns one. Other soundtrack sources, actual iOS volume behavior and asynchronous audible transitions require real-device investigation.

## Acceptance still required

- Listen to each active audio track and complete/approve caption drafts; test VTT timing against exact hashes.
- Review every shot in portrait and landscape for captions, controls, safe areas, text and character/action obstruction; verify actual platform cue styling.
- Test screen-reader navigation, caption/transcript usability and focus return on real assistive technology.
- Listen for music overlap, levels, master mute, mute changes, pause/resume, errors, skip and consecutive films on desktop and physical iPhone.
- Run the full production gate and real browser acceptance on the exact integrated candidate; run the actual campaign route, including reloads and the Cell 118 handoff. The local fixtures do not certify playback, visuals or a release.

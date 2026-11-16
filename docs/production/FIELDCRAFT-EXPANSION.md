# Living World: expressive gameplay candidate

Status: implementation candidate for creator review; no merge, deployment, art promotion or release certification.

Mike requested implementation of the eight proposed improvements on November 16, 2026. This branch builds on the exact Living World candidate `e6bd9b8a1eb5c7da749d6a8e50e61bf83f663fd9` (PR #129, itself stacked on #128). It does not import unrelated open PRs or silently reconcile the campaign's outstanding chronology decisions.

## Play the changes

Start Night Walker, open the run menu, choose **Living World**, and begin or resume an unlocked chapter. The existing native-story prerequisites and Waldo invitation/visit gates remain authoritative. For a fresh companion run, The Route We Keep teaches the local panel and has no combat requirement.

- **F / INTERACT** performs the marked physical interaction. **E / Light** always attacks in an expedition; nearby objectives cannot capture directional attacks.
- **Optional quest notes** in the journal show the current viewpoint’s last interaction and next known place. Unvisited chapters and another character’s private steps stay hidden. Completed chapters explicitly identify revisits as replays.
- **T / FIELD** opens equipment and comfort settings. **C** remains the journal. Touch has separate labelled interaction, combat and field controls.
- Change equipment in a quiet room or a clear room entry. Locate the matching physical panel, platform or motor before using its tool.
- **Survey:** scanner, verified task isolation, and a risky quick bypass. **Route:** powered crossing and diversion motor. **Escort:** scanner and powered crossing. Kits cost no currency and never gate required story actions.
- Scan to inspect local route conditions. In occupied work zones it also reveals the current phase and countdown.
- Isolation pauses only the task for eight seconds, followed by a visible three-second restoration warning. Separate support stays powered. Diversion moves the work zone toward the motor over time, creating a different dangerous area rather than removing danger. Unoccupied local security constructs also investigate the motor.
- A quick bypass accepted during a quiet cycle gives a four-second stop. A live-cycle rejection leaves the objective intact and makes a raised service walkway available. Checkpoint recovery also offers that walkway where appropriate; escorts remain at the entry and must be rejoined.
- Optional downtime includes a lamp choice at Mike's house, putting the phone away after Waldo's completed visit, Iona's private sixteen-tap rehearsal with optional drum audition and playback, and K's present-day desk-light choice. These have no score, reward grind, romance meter or implicit public sharing.

## Scope of the eight improvements

| Direction | Implemented in this candidate | Boundary / remaining production work |
| --- | --- | --- |
| Control feel | 90 ms jump grace, 140 ms pre-landing buffer, no extra air jumps, landing accent, interruption cleanup, distinct combat/interaction ownership | Existing character atlases remain in use. New hand-drawn locomotion and contextual sequences require final assets and creator visual approval. |
| Reusable tools | Spatial scanning, task isolation, optional powered crossings, task/construct diversion across eligible expedition rooms | These tools do not certify a repair, override a story route or operate in transport/dog viewpoints. Day's separate case system is unchanged. |
| Personal playstyle | Three swappable equipment sets with different available approaches; existing directional and Iona aerial combat retained | No new canonical powers, character identity changes, loot economy or stat grind. |
| Chorus routines | Local work, isolation, restoration warning and smooth diversion; observed phase and optional wider timing window | One local task model, not a complete simulation of all proposed Chorus manifestations. Occupied hosts are not kill-farm enemies, and interruption is not cure or consent. |
| Adaptive music | Gesture-started four-layer score engine, phrase-boundary transitions, shared stem start clock, pause/mute/lifecycle handling, replaceable local manifest | Audition uses an original reference arrangement. It is **not** an adaptive version of Mike's songs. Actual approved song stems are still needed. |
| Optional cast time | Four scoped activities, private saved rehearsal pattern, small environment changes | New dialogue/activities remain candidate adaptation material. Waldo/Iona housing and protected Chapter 39 are not changed. |
| Playable setbacks | Mistimed bypass opens an alternate physical approach; checkpoint offers service-walkway recovery without changing named survival | Limited local variation, not branching canon or a substitute for the remaining chapter-placement decisions. |
| Easy return / accessibility | Viewpoint-limited recap, true save/reload persistence, independent combat/timing assists, 100/115/130% text, reduced-motion-aware accents, seven remappable action keys | Keyboard action mapping is scoped to expeditions. Movement stays WASD/arrows/touch; C and Escape remain reserved. Physical iPhone qualification remains separate. |

## Persistence and integration

`campaign_fieldcraft.js` is the deterministic domain module. Preferences live under `meta.livingWorld.fieldcraft`; chapter-local room changes and activities live under `active.fieldcraft` and the existing suspended chapter record. Version-one expedition saves without these optional records are still valid. Malformed records fail visibly rather than being reset.

The existing expedition commit owner persists all tool, equipment, preference and activity changes. Failed writes roll the state back before platform or audio side effects are applied. No new profile key, save owner, animation loop, simulation timer or story authority is introduced. Transient jump/landing state does not survive room load. Temporary effects retain simulation time across suspension and do not advance in menus, hidden tabs or offline time.

The production Night physics owner calls field jump handling and incoming-damage scaling only for active expeditions. The existing compositor draws the props and landing cue. The new modules remain lazily loaded by `runtime_night.js`; the startup parser-script count is unchanged.

Three adjacent defects are corrected because they affect the new interactions: directional attacks previously became interactions beside objectives; Hangar commissioning and Earth fracture shared one support flag; Iona's complete-cycle observation lasted only half of the ten-second cycle. The support migration requires local chapter progress or completion, never the ambiguous old shared flag alone. Cycle observation now resets after movement/damage interrupts it.

## Music handoff

Edit `assets/music/field-score.json` after approving the actual source audio. Set `source` to `artist-stems` and provide one to four relative paths under `assets/music/`, keyed by `bed`, `pulse`, `threat`, and `quiet`. Filenames accept letters, digits, hyphens and underscores with WAV, MP3 or OGG extensions. The small manifest is inventory-checked at startup; its selected audio is loaded only after a deliberate gesture.

All layers must start at the same musical origin, contain the same declared loop length, and use the declared tempo. The default 96 BPM, four-bar configuration is ten seconds. The engine accepts a maximum 50 ms duration difference, but artist exports should be sample-aligned. Each compressed file is bounded to 32 MiB, with a 64 MiB total decoded-audio budget. Unsupported, missing or mismatched files produce a recoverable audio error. No stems are fetched from another origin. One approved percussion layer should carry Iona's drumming; layering is not permission to invent extra band performers or instrument assignments.

The existing SoundCloud soundtrack remains a separate choice. While the field score is active, the main audio toggle mutes/unmutes it and the SoundCloud play request is off. Dialogues, pause, page hiding and leaving the expedition silence the background score. Explicit drum audition is allowed only in the rehearsal menu; other menus, mute, blur or leaving stop it. Resume schedules a new phrase instead of catching up missed notes. The score does not reveal unseen enemies or authenticate memories.

## Animation handoff

Prioritize a consistent walk/run, turn, jump rise/apex/fall, soft/hard landing, and panel-use sequence for each approved playable actor. Follow with Iona's directional attack contacts and bicycle timing, Mike's phone-away action, and quiet seated/rehearsal poses. Match the existing actor scale in the actual runtime (roughly 68–75 logical pixels high for these on-foot renders), preserve clear silhouettes in both directions, and supply per-frame pivot and contact timing. Source sheets and review contact sheets are not runtime atlases until explicitly promoted.

The code currently adds movement timing and a landing accent; it does not claim to have commissioned or delivered these final animated sequences.

## Verification

- `node scripts/production_release_gate.js` includes the field domain and audio/lifecycle contracts alongside all existing production suites.
- `node scripts/fieldcraft_browser.mjs` runs targeted production-page checks at desktop, portrait-touch and landscape-touch sizes. It explicitly declares its later-story, position and stationary-opponent fixtures. It includes fresh entry and physical movement, equipment, save failure, real reload, master audio, remapping, simultaneous touch aim/attack, private rehearsal, failed bypass and recovery.
- `LIVING_LIMIT=1 node scripts/living_world_browser.mjs` is the unmodified normal-control opening-chapter playthrough, without injected chapter flags or coordinates.
- The existing domain suite traverses all 27 chapters and checks their progression contracts. This is not a complete new 27-chapter visual playthrough.

Final qualification receipts and source hashes belong in `docs/qa/fieldcraft/`. Passing automated checks does not resolve PR #129's existing chronology/adaptation findings, approve character likeness, establish physical-device performance, or authorize release.

# GOOD BOYS: The Diegetic Soundtrack of the Good Dogs Protocol

**Status:** implementation specification; no gameplay or audio implementation in this change.
**Testing branch:** `testing/good-boys-diegetic-soundtrack-spec`
**Inspected base:** `a7fa4066a4945bbcdc9d3e1259f61f2c18e3223b` (2026-09-12).
**Creative source:** Mike Olivares / K the EMRLD's six-track orbital detention treatment supplied September 12, 2026.
**Delivery plan and acceptance matrix:** [GOOD_BOYS_SOUNDTRACK_TEST_PLAN.md](GOOD_BOYS_SOUNDTRACK_TEST_PLAN.md).

> The EP is the prison. The game is the escape. The music is the evidence that they were there.

Here, “evidence” means personal testimony and remembered experience. Songs do not produce ORPHEUS investigation evidence, Trust, identity recognition, or campaign unlock facts by themselves.

## 1. Experience and scope

Build a playable K-perspective interlude: isolation → performed compliance → remembered time → orbital loneliness → chosen brotherhood → ordinary life. The player performs the actions that gave rise to the songs. Music is integrated with the scene, not a playlist laid over unrelated combat.

GOOD BOYS is the album/interlude title. GOOD DOGS PROTOCOL remains the rescue campaign's player-facing title. K is in Cell 118; Waldo is in Cell 1984. Katrin and Manchez remain essential rescuers, present through escape and homecoming.

The first implementation targets tight side-view gameplay with authored first-person inspection inserts for the ceiling, radio, Earth, and viewport hand. A separate first-person locomotion engine is unnecessary. All six tracks, the separate NULL SHEPHERD boss cue, and the gas-station coda are in scope. New music, vocal performances, and final art are dependencies, not claimed deliverables of this specification.

Target an approximately 25–40 minute first playthrough, tuned after final track durations are known. Collectible exploration may extend it. Never require 90 real minutes of waiting or 118 clicks to finish the story. Full collection remains required for the album reward.

## 2. Repository integration and deliberate adaptations

This branch proposes the following adaptation of the supplied treatment. It does not silently replace production canon or its authority documents.

| Topic | Observed baseline | Spec decision |
|---|---|---|
| Rescue order | Dogs reach M4, free K, clear M5 Access Core, free Waldo in M6, defeat Warden in M7, return in M8 | Present tracks 1–4 as K's recollection after the existing Cell 118 reveal; return to the dogs freeing him before continuing through M5–M8. K's earlier vent excursion discovers a route but cannot release Waldo. |
| K and Waldo playability | Dog actor contract binds the canonical pair; K is support | Introduce an explicitly scoped K/K–Waldo playable scene context. Never change the dog atlas contract or impersonate a dog with a K texture. Human traversal is a new mechanic requiring proof. |
| M7 victory | Actual dog tandem-finisher defeat and shuttle arrival gate progress | K and Waldo operate the route while the dogs perform the boss finisher. All four escape. The human pair does not replace the canonical finishing condition. |
| Homecoming | Earthfall returns to Waldo's property | Land at Waldo's property, then show the wet gas station as a later K-perspective coda. No second shuttle crash or replacement home destination. |
| Rain in orbit | No atmospheric rain simulation belongs outside the station | Show Connecticut rain as a memory/reflection on the porthole and cell wall, with unmistakable Earth imagery. Exterior vacuum remains dry; no Day Shift weather system runs in orbit. |
| Ghost Fork naming | `campaign_story.js` calls Ghost Fork `act_7`; recognition is `gk6` in the existing provider | “Chapter VIII” is the user's creative label, not a new act index. Bind callbacks to semantic Ghost Fork/recognition events; do not renumber the campaign. |
| Album reward | MUSIC tab already exists in `campaign_native_act1.js` | “Milestone 2” means delivery milestone GB-05 here, not Good Dogs mission M2. Unlock from completion plus 118 distinct scratches. |
| Identity | K the EMRLD stays visually anonymous to Mike until Ghost Fork | Player-view information is separate from Mike's knowledge. Transmission, catalogue art, reflection, and lyrics cannot set recognition facts. |

### Integrated route and checkpoint boundaries

1. Existing M1–M3 and M4 investigation/reveal run normally. The new interlude is offered after `GD_CUT_05` settles and the presentation owner releases it; never overlay it on the reveal video.
2. Snapshot M4's encounter and return target, pause its simulation, and enter `gb118_isolation`. An “EARLIER · CELL 118” caption establishes the recollection. Tracks 1–4 proceed in sequence.
3. Track 4 ends with K finding rescue coordinates, realizing he needs help, and transmitting the signal the dogs followed. A short return-to-cell ellipsis ends the recollection; he did not self-release or rescue Waldo offscreen.
4. Restore M4 at its captured checkpoint, resolve the existing rescue/ambush conditions, then advance through the canonical M5 Access Core requirements. Track 5 begins its preparatory motif here; its main escape section starts with the M6 rescue.
5. M6 adds K's door/keypad/reunion interaction; K/Waldo's traversal segment follows Waldo's actual release. The dogs still defend the uplink and clear the final wave. M7 switches back to the dog pair for NULL SHEPHERD, then reunites all four at the shuttle.
6. M8 replaces the corresponding card-only reentry portion with playable descent owned by the existing Earthfall authority. Return to Waldo's property, then coda. Commit return/completion once at the final homecoming checkpoint.

An isolated testing entry may start track 1 directly with a disposable fixture save and a spoiler label. It must not write production campaign progress. Integrated playback remains subject to the gates above. Replay uses a captured run context and does not rewind main-campaign time or consume resources twice.

## 3. Scene-by-scene implementation contracts

All numeric timings below are initial tuning values, not measured properties of the recordings. Each scene needs entry, success, retry, skip, suspend, resume, and exit behavior. Lyric cue times remain unset until mastered audio is available.

### GB-118 — “118”: Cell 118, isolation

**Entry:** black, ventilation bed, fade to ceiling bolts from K's POV. The first voluntary action is count. Caption: “Click to count”; substitute “Tap” or the remapped action glyph for the active input device.

**Actions and state:** author exactly 118 bolt IDs, `bolt_001`–`bolt_118`, grouped into accessible ceiling panels. Selecting a new bolt plays one quiet metallic tick and adds that ID to a set. Re-selecting one can replay the tick but cannot increment count. A wall interaction transfers newly counted IDs into corresponding permanent tallies. A panel shortcut/hold-to-count option sequentially selects visible uncounted bolts with the same feedback and ID rules; no blind bulk unlock. The 118 unique wall tallies are the collectible requirement, not a second unrelated set of 118 objects.

Teach with three counts and one wall-scratch interaction. After that, the player may advance the story without full collection. A visible journal shows counted versus scratched totals and identifies incomplete panels. Chapter replay permits cleanup; do not make missed bolts permanently inaccessible.

**Threat:** movement faster than the polite threshold increases local attention. The camera indicator changes cadence and shape, not just red intensity. At the warning threshold, play/caption “Something alive / Something remembers I'm here” through the vent. It warns of scanning; it does not spawn Warden combat. First warning is safe. Holding still reduces attention.

**Cues:** counting phrase → count prompt; three taps → uncertain reaction and a directional subtitle; scratching phrase → wall prompt. Three taps and the later four-knock transition are different events. On completed minimum tutorial plus player Continue, play the four knocks once, bounded shake, fade into the time skip. Do not auto-exit while the player is collecting.

**Checkpoint:** save each new scratched ID and the tutorial completion; resume safely before a knock transition if its commit did not finish. Full tally geometry later appears as a pattern K deliberately re-scratches at his workstation, not a wall inexplicably teleported to Earth.

### GB-POLITE — “Politely”: Cell 118, performance

**Loop:** observe the camera → take a slow deliberate action → respond when watched → choose a compliance line → receive limited yard access. Start attention at 0 on scene entry; default walk is safe and deliberate. Running is an intentional faster input.

**Smile action:** contextual `SMILE` prompt, default 1.5-second response window and 0.5-second anticipation cue, keyboard/gamepad/touch parity. Success redirects the camera. Failure triggers a restrained red light change and a 5-point oxygen drop from 100, bounded at 50. Oxygen is local dramatic pressure, not global HP or a suffocation softlock. Slow breathing restores it. Provide extended-window and auto-response assists with equal story/collection eligibility.

**Dialogue:** three short exchanges offer compliance, deflection, or silence. Compliance grants privilege most quickly; other answers return to a recoverable exchange with a hint. A correctly performed camera cycle plus a completed exchange opens yard access; no irreversible wrong-answer trap or morality score. “Yes, I accept my designation” is a performed lie, not K surrendering his identity.

**Memory:** gas station, two in the morning, Connecticut rain reflected on the cell surface. Constrain the overlay to authored surfaces; no full-screen daytime weather, clock messages, or ticket notifications. Caption the memory so it cannot be mistaken for literal rain in space.

**Exit:** cell opens onto the block; objective `FIND THE SIGNAL`. Commit `yard_access_earned` to this interlude's local state, not `k_freed`.

### GB-FIND — “Find me”: block, temporal disorientation

**Orbit clock:** display a fictional 90-minute orbital dial while advancing one orbit in 180 seconds of active play by default. Pause with menus, background tabs, and inspection panels. Sunlight transitions are gradual; reduced-motion mode uses a static phase indicator. No rapid full-screen strobe.

**Clock puzzle:** inspect a maintenance notation showing three dial positions: `1 → 1 → 8`. The player's first wall tallies acquire matching grouping marks when the notation is inspected. Select those positions in order, confirming each; repeated 1 is valid and an explicit confirm distinguishes it. Correct sequence plus journal clue inspection opens the shaft. Wrong input resets only the three-position entry. Full 118 collection is optional and never gates the shaft. Hint after two failures identifies the grouping; assist completes the interaction without granting uncollected scratches.

**Loop:** detection in the block restores the block-entry checkpoint with an incremented loop count and a short remembered line. Preserve bolt/scratch sets, clue discovery, heard dialogue, and solved-puzzle state. Reset guard routes, position, local attention, and oxygen; never reset the dog campaign or replay 118 interactions. Previously solved shafts remain open. Offer a stealth assist after two resets; no escalation that makes subsequent attempts harder.

**Waldo:** passing 1984 shows an authored silhouette behind the grate. K/player can suspect or recognize Waldo; this recollection does not set the canonical rescue encounter flag `waldo_seen` early. Store `recollection_1984_seen` locally. No premature unmasking.

**Exit:** a climb through the unlocked shaft changes acoustic space before the Earth reveal. Persist the shaft checkpoint and orbit phase.

### GB-ORBIT — “Can't sleep but like I'm in space and shit s…”: ventilation/orbit

The supplied title is provisional; retain the final approved display title separately from the stable asset ID `gb_track_04_orbit`. Do not identify a master by a fuzzy filename match.

**Traversal:** bounded side-view zero-G tube, directional thrust plus brake and interact. Initial target tuning: max speed 160 world units/s, acceleration 240 units/s², brake 480 units/s²; tune against actual scene scale. Collision prevents leaving the tube. A recover action returns K to the last handrail without losing memory. Earth is a backdrop/inspection target, not a traversable planet.

**Sleep:** at a secured handrail, hold or toggle Rest. Count upward at four counts/s; authored dawn interrupts at count 36, visibly before 40. This is a local, communicated time-compression vignette that advances the fictional orbit to sunrise, not an inconsistent global timer. Leaving the rest interaction returns to normal orbit pacing. Set `sleep_attempted`; increment fatigue to a maximum of three only after an interrupted attempt. Unique dialogue unlocks at each level; further attempts repeat safely. Fatigue changes expressive animation/dialogue, never required precision, maximum movement, or irreversible health. Attempting sleep is optional.

**Radio:** three discoverable presets lead toward the sound of rain under highway tires. Tune a normalized 0–1 dial to an authored target 0.62, within ±0.04 for 1.5 seconds. Static drops and the memory clears. Display equivalent signal feedback/captions; a deaf or muted player can solve it. The scene control frequency is fictional audio interaction, not an external radio connection. A hint and snap-to-target assist are available.

**Overview:** inspect Earth, slowly zoom, then inspect the New Haven marker to hear the manageable-mistakes line. No borders. On replay only, an already-completed Ghost Fork context allows a tiny amber marker for Mike's house; first-time play must not require later content. Clamp zoom/camera motion and provide a still composition option.

**Exit:** reach the control node, discover the Good Dogs Protocol coordinates, send the originating signal, and admit K cannot free Waldo alone. Save local discovery only. The recollection closes back at Cell 118, then resumes the actual rescue. No campaign completion, ship launch, or time reversal is inferred from this audio cue.

### GB-BREAK — “Break out sequence”: escape / No Vacancy

**Preparation:** after the dogs free K, he materially helps the M5 Access Core. Its Mike Index defeat and explicit Access Node seizure remain mandatory. His prior route memory explains his competence but does not bypass either condition.

**M6 rescue:** K's fictional door UI reads `NO VACANCY`. Inspect the occupancy entry, select Clear designation, and confirm `occupancy = null` through an authored choice UI. No terminal, real command, or network operation is involved. This changes the local door latch, not K/Waldo's personhood or campaign state directly.

Choose cut-wire or start-fire routes. Both trigger Warden attention exactly once. Stealth gives a longer preparation window; loud opens a shorter, more hazardous passage with extinguishable flame. Both converge on the same reachable rescue; neither yields a hidden permanent failure. The dogs' uplink defense and final wave still determine M6 eligibility.

**Restraints:** inspect the wall behind the panel for `1 9 8 4`; keypad accepts exactly those digits. Incorrect input resets entry and adds a bounded alarm pulse; no lockout. Use large buttons, erase, hint, and keyboard input. Entering the correct code plus the occupancy interaction releases restraints only after the rescue's other authored prerequisites are satisfied. Play the “Hold on, Waldo / I'm coming” line and unique chosen-brother handshake once. Waldo remains in his approved prison luchador mask.

**Human pair traversal:** single player controls K and can switch to Waldo; the other uses authored follow/catch AI. Optional local co-op controls the two independently within this segment. Required actions: assist jump, aerial dash, throw, catch; teach one at a time with safe practice before chained hazards. Reuse pair-mechanic definitions only where actor-independent, not the dog-only rendering bindings. Initial limits: one airborne dash per actor, one throw before grounded reset, catch prompt with 0.75-second base window; assist can automate catches. No infinite boost loop. Separation beyond the authored camera bound pauses forward travel and calls the partner back; missed catches reset to a safe ledge with both actors. No offscreen AI death.

**Boss handoff:** four `Bang` impacts herald Warden; captions/haptics have independent options. At the M7 arena, return control to Katrin and Manchez with a visible actor/control prompt. NULL SHEPHERD has a separate boss cue, not a seventh album track. Dogs deliver the real tandem-finisher victory while K/Waldo prepare the shuttle. No music ending or cutscene skip can grant Warden defeat. Reunion and shuttle reach unlock M8 once.

### GB-DOWN — “Down there again”: reentry / return

**Entry:** all four aboard the stolen maintenance shuttle. K/Waldo strap in; Earth fills the viewport. Existing Earthfall authority owns the sequence, including completion. Do not run a second independently completing M8 director.

**Descent:** guide a marker through a forgiving corridor while managing a visible heat margin. Default first-pass target: 60–90 seconds, three course corrections, recoverable checkpoint at each correction. Failure returns to the most recent correction; cinematic assist can follow the corridor. No random unavoidable damage. Reentry cannot replay the outbound M2 ship movies or orbital crash.

**Transmission:** optional send becomes available only when the interlude's protocol coordinates and radio-memory objective are complete. Persist `transmission_sent` once. Mike may receive an anonymous fragment later when eligible; delivery does not establish K's identity or bypass Ghost Fork prerequisites (`crew_returned_to_earth`, `k_freed`). A skipped or failed send still allows the existing Ghost Fork path.

**Character beats:** Waldo's traffic complaint plays in a safe interval. At the viewport-hand prompt, stabilize/autopilot the descent so the player is not punished for looking. K's hand covers Earth in an authored insert; resume from the same safe corridor point. “I'm coming ba—” cuts at the atmospheric transition. Whiteout becomes a soft fade under reduced-flash settings.

**Return:** land at Waldo's property, account for everyone, then fade to a later rainy gas-station moment: K's boots, wet pavement, ordinary cold. Do not mistake the coda for a second landing. Clear shuttle filters into rain/ordinary ambience. At K's reflection, show Mike's approved reflection for one authored 60 Hz frame (16.7 ms intent) independent of device refresh; low frame-rate/reduced-flash alternatives may omit it. The effect is player-facing foreshadowing, not an identity fact or a required collectible.

**Final card:** `EVERY TICKET IS A DUNGEON`. A small ordinary printer vignette may close this interlude, but it is not a second campaign ending. All three later endings still reach the canonical ordinary printer epilogue. No ORPHEUS sting, hidden threat, or conspiracy reward.

## 4. Audio and lyric synchronization

### Source contract

The inspected checkout exposes a SoundCloud widget path in `game.js` and `TechOpsDiegeticMusic` in `campaign_bible_gap_pass.js`; it does not establish approved local masters for these six tracks. Past uploaded filenames are not proof of a current playable binding. Do not silently substitute another K track or assume the existing widget provides accurate lyric scheduling or filter access.

Each approved master needs: stable track ID; final title; source path/URL; content hash; duration; codec; sample rate; channels; artist credit; usage confirmation; measured lyric markers; permitted instrumental loop regions; transition/tail points; and source version. The six required IDs are `gb_track_01_118`, `gb_track_02_politely`, `gb_track_03_find_me`, `gb_track_04_orbit`, `gb_track_05_breakout`, `gb_track_06_down_there`. Use `gb_boss_null_shepherd` separately. Keep every unverified field explicitly unbound, not zero or a fabricated timestamp.

Prefer controlled, browser-decodable masters for exact sync and processing. If only an external widget is available, classify that build as approximate playback; do not mark lyric-sync/filtered-audio acceptance passed. Confirm browser/API behavior during implementation. This document is a design contract, not a claim that the existing widget supports Web Audio routing.

### Mix profiles

| Profile | Chapters | Initial tuning target |
|---|---|---|
| K internal | 1–4 | Low-pass around 2.5 kHz, gentle short reverb around 12% wet, intimate vocal priority; keep key lyric words intelligible |
| Present escape | 5 | Full-bandwidth production, no perspective low-pass; make space for impact/partner calls |
| Warden | M7 | Crossfade to separate boss cue; audible windup/finisher cues above music |
| Shuttle radio | 6 descent | Approximate 300 Hz–3.4 kHz band-pass and mild radio texture; preserve speech clarity |
| Home | 6 end/coda | Open filter smoothly where the master permits; rain and ordinary sounds take focus |

Expose separate Music, Voice, and Effects controls. Start with 6 dB music ducking under spoken dialogue, 80 ms attack/300 ms release, and revise by listening on headphones and phone speakers. Limit summed peaks; no sudden jumps when filters open. No requirement to turn volume up to solve a puzzle. Keep captions optional for lyrics and independently available for critical sound cues.

### Cue scheduling and player pacing

- A cue record contains `cueId`, `trackId`, `sourceHash`, `sceneId`, `markerMs`, `requiredState`, `action`, `replayPolicy`, and `fallbackCaption`. Validate every marker against the approved master duration before it can be called production-synced.
- Use actual playback time for lyric highlights and audio-driven accents, not chained wall-clock timeouts. On pause, seek, suspend, or source reload, reconcile the cue cursor; do not replay already committed story actions.
- Gameplay owns completion. A lyric may expose a prompt or underscore an event; the recording ending cannot complete a rescue, solve a puzzle, award a scratch, or kill a boss.
- When the player takes longer than the song, move to an approved instrumental hold/ambient bed. Do not replay narrative vocals endlessly. If no loop/stem is approved, let the track end into ambience.
- For a key lyric that needs a matching action, make the interaction ready in advance, start its authored passage when the player commits, and use a safe short transition before normal play resumes. Never demand a precise action at a missed lyric to progress.
- If the player advances early, finish a permitted phrase or use the approved crossfade boundary. Mandatory story information remains in a caption/journal even if a vocal is cut. An extended album-listening option is separate from mandatory gameplay pacing.
- Request playback under a deliberate user gesture. Autoplay refusal offers Enable audio or Continue muted; neither blocks the game. Failed decoding offers Retry audio and the same muted continuation. Do not label a failed request “playing.”
- Each scene owns a cancellable audio lease. Scene exit, retry, mode switch, or source replacement invalidates late callbacks, stops old loops, and restores the prior music owner once. Dialogue ducking must nest safely with cutscenes and pause; releasing one duck reason cannot cancel another.
- Suspend simulation and music when the app backgrounds. Resume at a safe passage and checkpoint; never jump the player through multiple orbital cycles or QTE failures. Do not promise sample-perfect seeking across devices; capture measured drift and set ±150 ms as the initial lyric-caption acceptance target.

## 5. Save, replay, and cross-campaign contract

Proposed location: `S.meta.goodDogs.soundtrack`, owned/validated through `good_dogs_campaign_state.js`. This is local interlude state, not a second Good Dogs mission number. The production campaign remains under `S.meta._v736` with semantic facts bridged through the existing authority.

| Field | Type / invariant |
|---|---|
| `schemaVersion` | Integer, initial 1; idempotent migration from absent state |
| `runId`, `checkpointId`, `sceneId` | Validated authored identifiers; unknown checkpoints recover to nearest safe scene entry |
| `returnContext` | Validated parent mission/checkpoint and actor mode; no functions/DOM/audio handles |
| `countedBoltIds`, `scratchedBoltIds` | Unique known IDs; scratched must be subset of counted; max 118 |
| `loopCount`, `fatigue` | Nonnegative count / integer 0–3 |
| `sleepAttempted`, `radioMemoryUnlocked`, `coordinatesDiscovered` | Booleans; not inferred from track playback |
| `clockClueSeen`, `clockSolved`, `recollection1984Seen` | Local puzzle/memory booleans |
| `escapeApproach` | Null, `wire`, or `fire`; fixed after route checkpoint commits |
| `transmissionSent` | Boolean, once per canonical run; replay does not emit another message |
| `completedSceneIds`, `seenCueIds` | Deduplicated sets with separate gameplay completion and presentation semantics |
| `orbitPhase`, `playbackPositionMs`, `trackSourceHash` | Recovery hints; clamp values and rebase when source changes; never proof of gameplay success |
| `interludeCompleted`, `completionKind` | Completed route; kind `played`, `assisted`, or `skipped` |

Keep attention, oxygen, velocity, active UI, and in-flight audio callbacks transient; restore them at safe checkpoint defaults. Do not persist partially held inputs. New saves default empty/false. Legacy completed Good Dogs saves keep all existing rewards but receive neither fictitious scratches nor automatic album ownership; offer replay for collection.

Persist checkpoint candidate and related local unlock data together through the existing save boundary. If save fails, roll back the candidate, retain the playable safe state, and expose Retry save without claiming the checkpoint committed. Transition IDs make repeated completion/cutscene callbacks idempotent. Reload during a handoff resumes either the old committed scene or the fully committed new scene, never both.

**Skip rules:** cinematic skip commits the same required narrative boundary as successful viewing; media failure alone does not. Gameplay skip through an accessibility/episode option uses the canonical route's existing prerequisites and cannot fake M5/M6/M7 victories. Standalone episode skip records only local skipped scenes. Neither kind awards uncollected scratches. A story-route completion with assist is reward-eligible; a whole-episode skip is not.

**Album eligibility:** `interludeCompleted && completionKind != 'skipped' && scratchedBoltIds.size == 118 && canonical good_dogs_protocol_complete`. Re-evaluate after completion and after replay collection. Unlock once through the semantic bridge; derive display status from that single fact. Store a full-collection pattern reference for Ghost Fork. Album unlock is not a prerequisite for Ghost Fork or Watchdog.

**Ghost Fork callbacks:** display K's transferred tally pattern at his workstation, including partial progress. Mike can inspect it only in the eligible Ghost Fork scene; it remains personal history, not evidence points. Add the sleep exchange only when `sleepAttempted` is true and the existing recognition scene has made K's authorship eligible: “You heard that one?” / “Yeah.” / “I wrote it in orbit. Couldn't sleep.” Record the optional line separately from the existing recognition commit.

**MUSIC/standup:** add one GOOD BOYS album entry to the existing tab; anonymous/thematic cover until recognition, with no prison portrait or identity-spoiling metadata. Future standups can play it as background music, ducked under dialogue. Listening must neither restart a standup nor grant its flags, change ticket ownership, run timers early, or count as hearing a different required track. In-game album access never implies a new entitlement to download the masters.

## 6. Ownership and implementation destinations

Paths below exist at the inspected base unless explicitly marked proposed. These are integration targets, not claims that the feature is already present.

| Concern | Destination / boundary |
|---|---|
| Story eligibility, Ghost Fork knowledge | `campaign_story.js`, `campaign_scene_schema.js`; existing recognition adapter in `campaign_bible_gap_pass.js` |
| Interlude save schema and reward fact | `good_dogs_campaign_state.js`; validation in `state_validator.js` |
| Parent mission transitions | `good_boys_progression_authority.js`; use its validated/save-backed transition path, never assign mission numbers from audio |
| M4 reveal, media boundaries | `good_dogs_cutscene_bridge.js`, `good_dogs_cutscenes_v2_2.js`; preserve reveal trigger, retry, skip and non-replay contracts |
| Interlude semantic interactions | Proposed `good_dogs_soundtrack_interlude.js`; owns only the defined subscene lifecycle, not parent mission completion |
| Cue manifest and scoped music playback | Proposed `good_dogs_soundtrack_cues.json`; consolidate a `runtime_audio.js` only with explicit absorption of existing music/duck ownership |
| Camera/presentation/level metadata | `cinematic_systems.js`; authored subscene IDs and one presentation lease; do not add another draw loop |
| Dog and human rendering | `good_dogs_actor_contract.js` stays dog-only; extend the existing production compositor's scene actor selection through an explicit K/K–Waldo context |
| Pair input/traversal | `good_dogs_coop.js` for existing dog mechanics; new human provider must be explicitly scoped and cannot leave dog controls mounted |
| Access Core and prison integration | `good_boys_access_core_authority.js`, `good_boys_prison_gameplay_v2.js`, `good_boys_gameplay_loop.js` |
| Boss/Earthfall/home | Existing boss conditions in progression authority; `good_boys_earthfall_ending.js` owns M8; `good_dogs_home_scene.js` remains the opening |
| Art/audio asset identity | `campaign_assets.js`, `production_asset_registry.js`; one binding per asset, no guessed atlas crops |
| MUSIC | `campaign_native_act1.js`; integrate with the existing diegetic music provider rather than opening a second simultaneous player |

No new numbered hook. Do not add the proposed runtime files in this documentation-only change. A feature-disabled build must leave production input, saves, audio, and route behavior intact.

## 7. Art, performance, and accessibility requirements

Inventory/reuse existing approved assets before generating anything. Inspect actual source frames for K, prison-masked Waldo, dogs, Warden, shuttle, and environments. K must never be a mislabeled Mike crop; the intentional reflection is the only brief Mike substitution. The authored handshake needs its own paired contact pose and fixed feet/hand anchors.

Required additions or verified reuse: inspectable 118-bolt ceiling/panel map; tally decals; tracking red camera; gas-station Earth memory; mechanical clock with readable 1–1–8 puzzle; Waldo grate silhouette; vent/zero-G tube with handrails; Earth inspection plate; radio tuner; occupancy/keypad panels; K/Waldo traversal poses and handshake; Warden impact accents; interior viewport/hand; wet pavement and reflection coda; anonymous album art. Track each as `verified reuse`, `needs adaptation`, or `missing` after visual inspection. Filenames alone are insufficient.

Every scene needs foreground/midground/background separation, collision-aligned surfaces, stable sprite scale/feet anchors, practical lighting, and portrait reframing. UI includes only current objective and relevant controls/meters; ceiling counting cannot carry combat HP bars, daytime clock, or standup messages. Do not ship procedural placeholders as final scenes. Decode fallback is clearly identifiable in QA telemetry and remains a production art blocker.

Touch targets: at least 48 CSS px with safe-area padding. Keyboard and gamepad can reach every puzzle; remapping updates prompts. Offer subtitle size, separate sound captions, reduced motion/flash, hold-to-toggle, longer QTE windows, and traversal assistance. No puzzle depends only on hearing, red/green distinction, rapid tapping, frame-perfect timing, or tiny targets. Screen shake and haptics are separately adjustable.

Preload only the active/next scene and needed audio passages. Release decoded sources and GPU/DOM resources on exit. Target stable 60 fps with graceful 30 fps playability; measure on a named physical phone before certifying. Cap particle/reverb/texture work to the measured budget. Log active actors, input/presentation/audio owners, scene, checkpoint, master hash, cue drift, fallback assets, and transition reason for QA, without exposing internal diagnostics in normal product UI.

## 8. Remaining production dependencies

- Approved masters and final display names for all six tracks, plus NULL SHEPHERD; real durations, markers, and any stems/loop permissions.
- Verified frame/asset inventory for the human pair and new close-up scenes; inspect art rather than inferring readiness from registrations.
- Playtest tuning for puzzle hints, QTEs, traversal and reentry; numeric defaults above are starting points.
- Runtime implementation and the acceptance evidence in the companion plan. This spec has not been browser-playtested and does not certify present-day production readiness.

The decisions above make implementation possible without blocking on those assets: build bounded interactions with explicit unbound media in testing, then bind and validate actual assets before release. Keep the separate testing branch isolated from the deployed Pages route until the implementation meets the existing production gates.

# Gameplay quality integration — September 12, 2026

## Scope and bases

This integration combines the previously local R2 quality pass and the earlier
workday gameplay implementation with main `8004cef72a33b466285076f25af64a5f0570e6b5`
and PR #26's audio-safety update `a3adff2b6f8c6ddb33b1d7419868e87b261e77ba`.
It preserves main's Night Walker home film, flowing time, campaign discovery,
and Good Dogs mobile skin. No existing campaign, combat or art authority is retired.

The original PR's duplicate DOM ribbon, independent audio synthesizer and history
poller are replaced by the existing HUD and direct semantic audio events. The
later PR fix's intent is retained: no duplicate sound engine, stale-world effects,
or cursor shared across replacement combat states. Classic-script state remains
preferred over stale window aliases.

## Player-visible work

- Good Dogs M4–M7 have differentiated, state-aware raster staging using the existing
  approved prison atlas. Open cells, current evidence and route-control outcomes
  drive the presentation; decoration never changes collision or completion.
- Mission guidance occupies the existing HUD: required clues, ambush, Mike Index,
  route security, decrypt/cover state, final wave, tandem finish and shuttle exit.
  Walking farther right is not shown as mission completion.
- Street combat has 16 direct event-driven cues, narrow stereo positioning, shared
  AudioContext and master mute/SFX control, independent combat volume and optional
  captions. The soundtrack and other modes' combat/audio owners are unchanged.
- Shipping/Plating decisions can record witnessed restoration, reported but not
  fully verified restoration, or a tested temporary degraded workaround. Tuesday
  exposes persistent, playable rechecks and repairs through contacts, QUEUE,
  TEAMS and the casebook. Current restoration does not rewrite the Day 1 record.
- Investigation evidence review preserves phase, correct diagnoses require the
  relevant clue, repeated actions are idempotent, and unavailable modules cannot
  fall back to instant resolution.

## New reconciliation fixes

The main-branch mobile skin treated every `gb-use[data-context="1"]` as Cell 118.
A failing-before regression reproduced M3's `USE · OVERRIDE` becoming
`E USE · CELL 118`. The skin now leaves mission interaction labels and handlers
alone. Stale dog state cannot apply that skin to Day or a different Night world.

Pause, game-over, driving, presentation blockers and classic-script state are
now respected by guidance, combat sound and captions. Suppressed audio events
are consumed, never replayed after resume. Missing active world state cannot
unlock sound from a stale-world gesture.

The bootstrap retains both newer-main services exactly once, loads the audio
before its emitter, and shares its exact build key with the dynamic loader.
The gate now includes the previously separate Night flow smoke test.

## Validation on the integrated working tree

Source main was reconstructed from the exact successful Pages artifact
`10298164556` for `8004cef7`. Archive SHA-256:
`d0c972fabac01c0b39a1eea9ef167ef4188b58bb5e1fbce50d8fffe5146168ea`.
Untouched repository entries, including workflows omitted from Pages artifacts,
are preserved from the remote Git tree during publication.

- Aggregate: **65 suites PASS**, plus the unchanged Mike action-atlas quarantine.
- Focused quality tests: 38 combat-audio, 27 guidance, 24 staging, 8 integration.
- Recovered gameplay tests: 20 investigation-integrity, 26 workday contracts,
  24 workday UI/runtime, alongside the pre-existing 20 casebook and 20 opening
  investigation tests. These counts describe suites, not unique gameplay paths.
- Chromium: eight isolated renderer fixtures across M4–M7 at 1280×800 and
  390×844; two actual trusted-gesture WebAudio/unlock/mute fixtures. Ten PASS.
- The relay-label regression failed before the ownership fix and passed after it.

Local checks are not GitHub CI, full game traversal, physical iPhone/Safari
acceptance, hardware listening, or cinematic-to-gameplay match-frame proof.
Repository checks must run on the final published head before merge.

## Still open

Approved dog walk/start-stop/landing and distinct Mike dash source art; final
M4–M7 DCC/layer masters and cinematic match frames; unassisted full-game and
physical-device acceptance; measured mobile performance; broader procedural and
late-campaign recurrence; staged retirement of the historical hook stack.
No production-ready or whole-roadmap-complete claim is made.

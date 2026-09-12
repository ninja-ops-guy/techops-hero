# Gameplay quality pass — 12 September 2026

Base: `31cdf77264d657e0a43c291b163e143546dd0325` (merged PRs #20 and #22).
Target: PR #23, `feat/gameplay-roadmap-quality`. This is implementation scope,
not a production-release certification or a new Story Bible authority.

## Playable changes and access

### Fighting feedback

Ordinary Night Crawler consumes the existing contextual combat events at actual
contact: jab, cross, rising finisher, air hit, grab, throw, wall impact, crowd
collision, slam, guard, escape, whiff, hurt and knockout. Connected on-beat hits
also receive a restrained timing cue. Wind-up is silent; misses never sound like
hits. Existing shared Night jump/dash/block/parry and hit/hurt calls receive the
same sound palette without changing Good Dogs or Sector 04 combat rules.

Effects use the existing AudioContext, master sound switch and Settings → SFX
volume. They do not replace, restart or select music. Sources disconnect when
finished, noise is reused, simultaneous voices are bounded, and failed/suspended
or muted audio cannot stop gameplay or accumulate a delayed sound burst.

### A complete ordinary night-to-morning loop

Time advances continuously while playing (one game minute per four real seconds),
not in artificial twenty-minute jumps between streets. Paused menus, hidden tabs
and the home cinematic do not age office tickets. Long suspension frames are not
charged as elapsed simulation. The clock displays midnight correctly.

At the Charger, open **Route journal / combat guide** for live street/district
objectives and the existing combat controls. The journal distinguishes optional
street patrol from the authored campaign; it reads only already-revealed facts
and cannot bypass office investigation or Sector 04 prerequisites.

Drive to **Home Street**, approach Mike's porch, and interact. Choose **Stay out a
little longer** or **Rest until morning**. Rest plays a short, skippable in-engine
home transition over the existing scene, settles earnings once, and opens the
normal shift recap before the next workday. It does not grant a second reward or
skip existing study/maintenance choices where those are available. The router
releases Night identity, so choosing a recap reward does not relaunch Night.

Day-only HUD counters are suppressed on ordinary streets while music, menu and
settings remain available. Held inputs are released at modal/transition boundaries.
The transition uses existing scene/artwork and text, not a newly generated movie.

### Persistent next-shift follow-ups and reusable knowledge

Open **Mike's desk → Shift handoff / follow-up work**. This is reachable through
the Day 1 QUEUE/TEAMS tabs and the later-day desk, including an empty ticket queue.

Actual ordinary closures enter the existing canonical campaign save, retaining
original owner, verification strength and human outcome. The two ordinary authored
cases are imported from existing completed saves. Impossible Access and other
story evidence are excluded. Delegated work never becomes first-hand or strongly
verified merely because staff closed it.

On the following day, the player can complete a resumable loop:

`requester context → service check + real task → hypothesis → targeted correction
(if needed) → service AND requester verification → publish handoff or close`

Weak verification creates a reason to check, not a guaranteed repeat failure.
Only observed results can confirm recurrence. Healthy service is not repaired just
to satisfy the minigame. Wrong hypotheses are ruled out without closing the case.
The previous closure stays immutable; new proof belongs to the follow-up.

Publishing a verified procedural method projects it into the existing knowledge
base used by remote fixes and staff work. Reading history is free; actions consume
normal shift time. A complete fault-and-publication route takes 21 game minutes.
There is no duplicate XP/cash path. Progress saves before spending time; failed
storage is reported without replacing the prior save. The ledger is bounded at
240 records and never retires unfinished follow-ups.

## Architecture and roadmap mapping

- `combat_audio.js`: shared sound rendering, no gameplay or music authority.
- `night_session.js`: ordinary-street clock/journal/home lifecycle, called from
  the existing stable compositor, not an extra timer or wrapper stack.
- `campaign_act1.js`: canonical office snapshots, observations and transitions.
- `campaign_office_memory.js`: existing-menu presentation and procedural adapter.
- Existing native/core closure, staff, workstation, router and audio entrypoints
  call those services directly. No numbered hook or parallel save key is added.
- Bootstrap and changed parser assets use a new explicit cache version.

This advances the roadmap's late/procedural office memory, recurrence investigation,
reusable operational knowledge, fighting presentation, and film/gameplay continuity
at the ordinary home boundary. It does **not** add another campaign/boss, certify
missing art, replace the main storyline, or claim every historical feature complete.

## Evidence and acceptance

`node scripts/production_release_gate.js` now includes 60 deterministic suites,
including the new combat audio, night session and office memory suites. Existing
entrypoint/cache assertions were updated for changed assets, not removed. Router
regressions additionally cover deferred Good Dogs priming and canceled night polls.

`scripts/gameplay_quality_bot.mjs` and the Gameplay quality workflow exercise real
UI input in desktop Chrome and iPhone-emulated WebKit. Initial encounter/closure
fixtures supply test conditions; these are **fixture-assisted regressions**, not
unassisted full-campaign playthroughs or physical iPhone tests. Reports include
check results, errors and screenshots. CI exit status is enforced, never replaced
by a success-only summary. Actual run results belong in the PR and Actions logs.

Local browser navigation was blocked by the execution environment, so local
Chromium traversal is not claimed as passing. Exact-head CI and physical-device
acceptance remain separate requirements.

Still open: certified dog locomotion and remaining environment/art work; unassisted
main campaign and Good Dogs completion on physical devices; measured mobile frame,
load, memory and thermal behavior; broader historical-hook retirement. Preserve
all current release gates and quarantines until their evidence is supplied.

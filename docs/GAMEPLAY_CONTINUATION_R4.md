# Gameplay continuation R4 — September 12, 2026

## Publication scope

This continues PR #26's already-published integration at `bb3e41b9` rather than
replacing it with an older local bundle. It reconciles main `a7fa4066` (the
Night Walker lifecycle work from PR #24) and recovers the previously local R3
case tracking and short-screen dialog improvements. The review snapshot commit
was `2c136b09`. The temporary source-capture workflow is removed from the result.

## Player changes

### Track the next real investigation step

Open Workstation → QUEUE / TEAMS → ticket history → a case → **Track this case on
the Day map**. The existing waypoint/pathfinder routes to the actual contact and
labels evidence gathering, supported remediation, technical check, requester
verification, workaround verification, and Tuesday follow-up stages. Tracking
persists only a presentation preference; it does not complete work, grant rewards,
teleport, manufacture evidence, or add a new map/HUD. Completing work releases the
override; clock-out retains the original way-home guide. Storage reads are bounded
to four per second and invalidated on local writes and run changes. Night, modal,
paused, game-over, hidden-tab, room and stale-day contexts cannot display the pin.

### Dialogs fit short screens

Casebook and follow-up dialogs use a viewport-bounded internally scrollable shell,
with touch panning and keyboard focus. Every new dialog resets its scroll position.
The tests exercise actual game dialog code and native callbacks, not copied buttons.

### Preserve the mobile skin without a second HUD

Main's newer mobile skin previously overwrote M3's **USE · OVERRIDE** with a
Cell 118 label, presented zero partner HP as full health, and created a duplicate
DOM HUD over the native compact HUD. The integration regression failed before the
fix and passes afterward. Mission labels, disabled states and callbacks remain
owned by the mission, zero/downed/unknown HP is never treated as a heal, and the
skin yields to the existing single-HUD owner. A standalone fallback uses canonical
registry text and live guidance, not a static mission copy or decorative minimap.

The existing game frame now calls bounded passive skin maintenance. This replaces
the skin's independent interval, which the production bootstrap could park before
mode entry. Day/mode transitions bypass the maintenance throttle. Landscape action
controls use a three-column layout with a full-width context action and at least
44 px control height, preserving more playfield without changing input handlers.

### Street feedback consistency

The existing sixteen-cue audio service is preserved, including master mute, shared
context, independent combat volume, captions and soundtrack isolation. Fractional
or unsafe event IDs cannot poison deduplication. District-clear and home directions
now remain truthful without hiding live hostiles or queued reinforcements. This is
not a new combat engine or another audio poller.

## Integration boundaries

All incoming main lifecycle source and its browser workflow are retained. The
updated bootstrap and parser cache keys are aligned. Save authority, collisions,
combat damage, rescue gates, scene transitions, and unapproved-art quarantines are
not relaxed. Existing test expectations were updated for the new cache keys and
canonical single-HUD integration, with behavioural regressions added rather than
silencing failures. The reference UI retains its stable filename and public API.

The earlier PR already contains the Day 1 choices, Tuesday rechecks/repairs, sixteen
combat cues and M4–M7 state-aware raster staging. Those are preserved here, not
counted as newly authored in this continuation.

## Local validation

- Aggregate release gate: **68 suites PASS**, plus unchanged Mike-atlas quarantine.
- Focused new/expanded suites: 26 case tracking, 14 quality-integration, 39 combat
  audio, 28 objective guidance groups; all pre-existing assertions retained.
- Chromium fixtures: **16 PASS** — eight orbital renderer views, two real WebAudio
  gesture/mute checks, three actual casebook/follow-up dialog workflows, and three
  mobile skin/input/viewport checks.
- The relay-label regression was recorded failing before the fix.
- Local browser runner: environment Playwright 1.57 beta, system Chromium. CI uses
  the repository's locked Playwright 1.55.1 and installs Chromium, so the fresh
  exact-head workflow remains required after publication.

Local full-game navigation was attempted and blocked by the browser environment
(`ERR_BLOCKED_BY_ADMINISTRATOR`). Isolated rendering/callback fixtures are not a
full playthrough, cinematic handoff proof, Safari/WebKit acceptance, physical
phone test, or hardware listening session. No overall AAA/release certification
or entire-roadmap-complete claim is made.

## Fresh CI and next release work

`Gameplay quality acceptance` checks the exact PR head, executes the aggregate gate
and all three browser fixture scripts, and retains tested-head identity, logs and
screenshots. Existing campaign, runtime-bot, cutscene and Night lifecycle checks
remain mandatory and independent. Final authored M4–M7 environments/match frames,
approved dog walk/start-stop/landing art, broader late-campaign recurrence, and
physical-device/end-to-end acceptance remain open.

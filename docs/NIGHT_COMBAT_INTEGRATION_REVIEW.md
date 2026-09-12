# Night directional combat integration (PR #29)

Base: `a7fa4066a4945bbcdc9d3e1259f61f2c18e3223b`; source checkout:
`3f098d0ffd6ac22bcca431c254e26322b4af41c3`.

## Scope

Integrates the previously local directional-combat patch with the consolidated
Night lifecycle already on main. It does not replace `runtime_night.js`, create
another clock, modify Good Dogs progression, or merge the separate quality PR #26.

The existing v55 frame bridge samples aim separately from jump. Explicit grab,
upper/lower punches, neutral/rising/sweep kicks, directional throws and bounded
air follow-ups use the existing combat service and production compositor. E/Punch
retains contextual home and Charger interaction. The existing controller poll
adds Y kick, LB grab and RB jump in ordinary Night only; A/B/X remain
punch-interact/block/dash. No new polling or renderer loop is added.

The consolidated lifecycle's pause and presentation callbacks control the new
inputs. Audio exceptions cannot interrupt contact/KO settlement. The unclassified
Mike atlas remains quarantined; existing approved poses are reused.

## Local validation

- Full aggregate production gate: **61 suites PASS**, plus unchanged atlas quarantine.
- Directional combat/input suite: **38 cases PASS**.
- Actual extracted Night player/enemy step: **9 launcher-to-three-hit-air-combo sequences PASS**
  across 16, 100 and 250 ms render intervals, without repositioning after launch.
- Controller/integration suite: edge-only mappings, legacy mode behavior, blocked
  actions and loader/lifecycle ownership PASS.
- **7 Chromium touch fixture checks PASS**, including two simultaneous trusted
  touches (joystick + grab), directional attacks, air follow-ups and input cleanup.
- Original legacy combat regression suite remains passing.

The full production-page local Chromium attempt was blocked at navigation by
`ERR_BLOCKED_BY_ADMINISTRATOR`. That is not a passing full-page run. The touch
checks above used an explicitly isolated DOM/input/physics fixture, not fake game
screenshots. Local Chromium was 144.0.7559.96 and the preinstalled Playwright
binding was 1.57 prerelease; CI uses the repository-pinned dependency instead.

## Required remote acceptance

`Night combat integration` runs the actual production page with Chromium desktop,
Chromium touch (including actual simultaneous D-pad/action touches), and
portrait touch-enabled WebKit. `Night lifecycle validation` additionally checks
Chromium, Firefox, desktop WebKit and landscape touch-enabled WebKit for
movement, home/cinematic pause, day return and Sector 04 continuity. Existing
runtime/campaign/cutscene gates remain required. Keep the PR draft until the
final-head results are inspected; no physical iPhone/controller acceptance is
claimed.

## Integration boundary

PR #26 has an independently evolving semantic-audio/office-memory implementation.
Its combat-event changes must be reconciled rather than overwritten when combining
these branches. New move types (`uppercut`, `low`, `kick`, `rising-kick`, `sweep`,
`air-kick`, `air-slam`) need deliberate cue mapping in that shared audio owner.

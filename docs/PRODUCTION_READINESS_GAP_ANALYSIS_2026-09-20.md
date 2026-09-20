# TechOps Hero production-readiness gap analysis

Date: 2026-09-20  
Scope: PR #59 exact-head review against Story Bible v1.2, the current release policy, and the cinematic-cohesion revision  
Verdict: **release-candidate engineering is close; production release is not yet certified**

Implementation follow-up: [Production quality revision](QUALITY_PASS_2026-09-20.md)
records the subsequent fixes, executable acceptance, and remaining release/art gaps.
The findings below describe the PR #59 baseline.

## Executive judgment

The revision materially improves entry reliability, mode ownership, save continuity,
Story Bible ordering, Good Dogs co-op truthfulness, and cinematic recovery. It is a
credible beta/owner-review candidate once exact-head CI is green. It is not yet a
production-ready game release because the remaining uncertainty sits on the real
release surfaces: physical mobile browsers, licensed H.264 playback, unassisted
end-to-end traversal, interrupted-run recovery, and sustained device performance.

No automated contract should be interpreted as art approval, player comprehension,
or physical-device certification. Release requires evidence from the same commit
that will ship.

## Readiness by dimension

| Dimension | Current assessment | Release implication |
| --- | --- | --- |
| Deterministic contracts | Strong | Necessary foundation; exact-head remote checks must all pass |
| Day mode | Functionally coherent | Needs unassisted opening-to-Tuesday device run and visual polish |
| Night mode | Stable lifecycle, honest standalone isolation | Interrupted standalone recovery remains incomplete |
| Good Dogs solo/co-op | Core route and ownership are substantially stronger | Physical keyboard/touch matrix and full unseeded completion remain uncertified |
| Story Bible alignment | Ordered Act I–VI spine is enforced | Acts IV–VI need bespoke depth; Acts VII–X remain comparatively shallow |
| Cinematic delivery | Explicit play/skip/failure boundaries | Licensed-browser H.264, subtitle, resume, and aspect-ratio acceptance remain open |
| Visual cohesion | Title and Night establish a strong bar | Day opening and later Good Dogs environments do not consistently meet it |
| Accessibility/UX | Better labels, zoom, focus and recovery | Screen reader, reduced motion, contrast, safe-area and hardware-input evidence is incomplete |
| Performance/operability | Automated budgets and telemetry exist | Target-device load, memory, thermal and long-session evidence is missing |

## P0 release blockers

### 1. Exact-head remote gates

**Gap:** every required workflow has not yet demonstrated green status on the final
shipping tree.

**Revise:** keep the PR blocked until all named required checks report success on the
same commit. Workflow renames must be reflected in branch protection and the PR
description.

**Acceptance:** immutable commit SHA and tree SHA recorded; all required checks green;
no rerun hides a reproducible first-party failure; deployed build reports the same
build identity.

### 2. Physical-device route certification

**Gap:** desktop automation is not proof of iPhone Safari or Android Chrome behavior.

**Revise:** run a clean, unseeded matrix on a current iPhone and representative
Android phone, plus desktop Chromium, Firefox and WebKit. Cover Day New/Continue,
standalone and campaign Night, Good Dogs solo, and local co-op with a real keyboard.
Exercise rotation, safe areas, background/foreground, audio unlock, reload, rapid
double input and return-to-title.

**Acceptance:** zero softlocks, overlay bleed, invisible interaction, lost input or
first-party exception; screenshots/video, console, viewport, input device and exact
SHA attached for every route.

### 3. Licensed H.264 cinematic matrix

**Gap:** FFmpeg asset decoding and an unsupported-codec fallback do not certify
browser playback. The release needs both supported and unsupported capability paths.

**Revise:** play all nine clips to completion in licensed Chrome/Safari; also test
manual play, explicit skip, decode error, background interruption and reload. Keep
capability probing based on `MediaSource.isTypeSupported` / `canPlayType`, never UA
sniffing.

**Acceptance:** each clip produces decoded frames and one idempotent terminal result;
unsupported/error paths expose a visible PLAY/SKIP recovery; double-skip and
skip-after-auto-advance equal a single skip; narrative state advances exactly once.

### 4. Unassisted end-to-end progression

**Gap:** fixtures establish transition integrity but do not prove that a new player
can understand and complete every route without seeded facts or developer actions.

**Revise:** record clean runs from Day 1 through the currently advertised campaign
end, Good Dogs M1 through Earthfall, standalone Night through debrief, and campaign
Night back to the exact Day state. Force at least one reload at each major boundary.

**Acceptance:** no fixture APIs, localStorage edits or hidden shortcuts; objectives
remain legible; save/reload preserves ownership and chronology; all endings return
to an interactive surface with one canonical state.

### 5. Honest standalone Night recovery

**Gap:** isolation is correct, but an interrupted Night world is not exactly
recoverable while session-save behavior can imply otherwise.

**Revise:** either persist district, player, enemies, rewards, difficulty and return
destination, or remove the implied resume affordance and clearly label restart
semantics.

**Acceptance:** crash/reload restores an equivalent playable world without mutating
campaign progress, or the UI truthfully offers only a fresh run.

## P1 revisions required for production quality

| Area | Critique | Required revision | Acceptance evidence |
| --- | --- | --- | --- |
| Day opening | Standup/workstation/first ticket fall below the title and Night visual bar | One art-directed vertical slice with consistent scale, focal light, occupied rooms, shipped icons and readable phone typography | Side-by-side desktop/phone captures in Day and Night palettes |
| Good Dogs environments | M2 and M4–M7 use shallow staging and large flat floor bands | Responsive horizons, foreground occlusion, landmarks, hazards and orbital depth tied to approved source art | Landscape/portrait capture set with actor silhouette checks |
| Dog motion | Neutral/action poses do not form a convincing locomotion language | Approved start, walk/run, stop, landing and dash poses with authored timing | Frame review plus input-to-animation browser capture |
| Late campaign | Act I–VI ordering is stronger than its playable dramatic depth; VII–X remain shallow | Bespoke spatial objectives, character-switch encounters and canonical cinematics without bypassing the current gates | Unseeded act-by-act run with reload at each act boundary |
| HUD composition | Mission, objective, prompt, status, labels and touch controls compete | One responsive compositor with reserved safe zones and priority rules | No overlap at supported aspect ratios, zoom levels and safe areas |
| Cinematic continuity | Film/gameplay quality and timing vary by route | Standardize pre-roll, audio ducking, subtitles, skip/resume, letterbox and handoff grammar | Per-clip supported/unsupported state matrix |
| Accessibility | Semantic improvements are not yet a complete accessibility pass | Keyboard-only audit, screen-reader route, reduced motion, contrast, focus restoration and non-audio cues | WCAG-oriented checklist plus real assistive-tech recording |
| Save resilience | Happy paths are strong; corruption/private mode/quota behavior needs proof | Versioned migrations, corrupt-save quarantine, quota failure recovery and clear user messaging | Migration matrix across representative old/corrupt saves |

## P2 engineering and operational debt

- Consolidate historical hook families behind parity tests. Measure startup requests,
  parsed script weight, active timers/listeners and duplicate ownership before and
  after each retirement; do not bulk-delete runtime history.
- Establish target-device budgets for first playable, input latency, sustained frame
  time, memory growth, thermal throttling and 30-minute stability. Automated desktop
  frame timing is a signal, not certification.
- Add production telemetry for launch failure, media capability/result, save/migration
  failure, mode transition and crash recovery without collecting story spoilers or
  sensitive player data.
- Version the release receipt: commit/tree, deployed asset manifest, save schema,
  required checks, known issues, rollback tag and physical-device evidence.
- Extend the human-first operations loop into recurring late-campaign consequences:
  technical restoration, user confirmation, workaround, delegation and handoff must
  remain distinct durable outcomes.

## Recommended release sequence

1. Make the exact PR head green and lock required-check names.
2. Deploy that immutable candidate to the production-like host.
3. Complete the licensed-codec and physical-device matrix without code changes.
4. Fix every P0 discovered; restart the exact-head evidence cycle after any change.
5. Run the unassisted story routes and 30-minute device stability sessions.
6. Publish a release receipt and known-issues list; tag only if every P0 is closed.

## Go/no-go rule

**No-go** while any P0 above lacks exact-head evidence. P1 visual/content work may be
scheduled after a closed beta only if the marketed scope is narrowed honestly; it
cannot be waived for a release claiming the complete cinematic Story Bible
experience.

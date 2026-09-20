# TechOps Hero cinematic cohesion revision

Date: 2026-09-20
Reviewed base: `b53b338f44835b2621abe650108082a54dbb51e9`
Authority: Production Story Mode / Story Bible v1.2

## Outcome

This pass turns the three advertised entry routes into explicit, isolated product
modes and repairs the highest-risk continuity defects in the Day loop, Night
Crawler, and Good Dogs co-op. The result is ready for code review and automated
browser acceptance. It is not a claim of physical-device release certification.

## Product critique

The game's strongest material was being weakened at its seams rather than inside
its individual systems:

- The title looked cinematic, but late script readiness and nested launch handlers
  made the first click unreliable and gave players no useful recovery state.
- Day saves represented two different truths. A newer profile could be silently
  replaced by an older checkpoint, and resumed NPCs no longer shared identity with
  their ticket records.
- Combat presentation implied that defeating uncertainty closed a ticket, while
  the intended human-first workflow requires verification and documentation.
- Night Crawler and Good Dogs could inherit Day UI, held inputs, or story state.
  Returning from campaign Night could also leave the Day surface noninteractive.
- Difficulty changed some numbers but not the whole encounter contract, making the
  selection feel cosmetic or unexpectedly punitive.
- Historical hooks could still surface an early Felicia-villain path and endings
  that conflict with the v1.2 Story Bible's trust-to-alliance arc.
- Tests were broad but favored isolated source contracts. The most important
  regressions lived in real DOM behavior, mode composition, and persisted object
  identity.

## Revision delivered

### Entry, presentation, and mode ownership

- Added a responsive, keyboard-accessible cinematic title with three clear routes,
  dependency readiness, a visible retry state, and Night debrief continuity.
- Added one reversible mode shell for Day, Night, and Good Dogs surfaces. Ownership
  now includes visibility, pointer input, accessibility state, held input, and
  cleanup on return.
- Made the canonical Night loop publish a heartbeat so the safety renderer parks
  while the real simulation is healthy instead of advancing the world twice.
- Isolated standalone Night results from campaign story progress and returned its
  completed run to a debrief on the title screen.

### Day mechanics and persistence

- Added versioned exact Day checkpoints for clock, player position, budget, world,
  tickets, and UI-safe resume state.
- Rejected stale checkpoints using monotonic save revisions and relinked resumed
  NPC/ticket records so both systems operate on the same object again.
- Made New Day clear primary, backup, checkpoint, and campaign state before building
  a canonical opening.
- Centralized difficulty profiles across Day, Night, and signature attacks.
- Enforced the five-stage troubleshooting contract: Gather, Hypothesize, Resolve,
  Verify, then Document. A technical win stabilizes the issue; documentation closes
  it. Failed work remains open and escalated.
- Kept Verify and Document usable at high stress and resolved simultaneous knockouts
  in favor of the player's loss instead of a false success.
- Reworded end-of-day carryover as an explicit handoff rather than a false closure.

### Story and co-op consistency

- Added a compact Story Bible authority boundary and retired legacy early Felicia
  boss/playable/endings behavior when canonical production story mode is active.
- Enforced one ordered Story authority from the Prologue through Duet Protocol.
  Ghost Frequency now needs the full evidence/contact/signature chain, and forged
  downstream facts can no longer skip predecessor acts.
- Made **Trust Is Earned** a persistent playable Act IV flow: investigate the
  unauthorized traffic, commit an approach, then explicitly report it with shared
  ownership before Felicia's alliance and the MORNINGSTAR hangar can unlock.
- Gated MORNINGSTAR tickets, Night recoveries, the swarm command surface, and Duet
  behind their canonical acts. The natural public path now reaches Act VI across a
  save/reload without seeded facts; Felicia selection requires completed Act VI and
  both canonical reward facts.
- Preserved Good Dogs mission, puzzle, evidence, and co-op mode state across resume.
- Moved standalone Good Dogs into its own save slot, retained origin provenance,
  and made old untagged progress a copy-only migration so Story Continue remains
  byte-for-byte untouched.
- Made Earthfall commit semantic completion before returning to the title. Completed
  saves replay the authored Earthfall sequence rather than the retired finale reel,
  including after a cold resume.
- Required a trusted keyboard signal before enabling local two-player mode; touch
  players receive a clear accessible explanation rather than a broken control path.
- Cleared inherited identity, modal blockers, and held inputs before Good Dogs owns
  the frame.
- Suppressed inherited Night Crawler title cards and combat hints while Good Dogs
  owns presentation, preventing the large Night tutorial toast from covering the
  property scene on phones.
- Restored browser zoom, added semantic labels to icon/touch controls, announced
  transient status text, and made empty or failed Night returns read differently
  from a completed run.

## Validation evidence

| Gate | Result |
| --- | --- |
| `npm test` | 91 production suites plus Mike quarantine pass |
| `npm run lint` | Syntax validation passes across 547 JavaScript/MJS files |
| `npm run test:browser:revision` | Chromium title, clean New Day, exact Continue, identity relink, and blocker checks pass |
| Night lifecycle browser run | Standalone and campaign Night entry, input isolation, continuous midnight, return/debrief, and save isolation pass |
| Good Dogs browser bot | Local and solo paths through Mission 2, P2 keyboard control, combat, revive, and pair puzzles pass |
| Good Dogs movie probe | All nine H.264 assets decode fully with FFmpeg; the bundled open-source headless Chromium advertises no H.264 support, correctly holds progression at the visible PLAY/SKIP fallback, and therefore cannot certify decoded movie playback |
| Campaign Night return | Sector 04 entry and exact Day shell restoration pass in Chromium |
| `git diff --check` | Pass |

Browser automation reported no page exceptions. External Google Fonts were blocked
in the test environment without affecting gameplay. Visual review covered the title,
standalone Night home and Sector 04 scenes, resumed Day, the Good Dogs mode selector,
desktop local co-op, and the portrait solo property scene.

## Prioritized next plan

### P0 — Certify the actual release surfaces

Run unassisted, exact-commit playthroughs on desktop Chromium/Firefox/WebKit and
physical iPhone Safari plus one Android device. Cover New Day through a documented
ticket, Continue after a forced reload, standalone Night through debrief, campaign
Sector 04 return, and both Good Dogs modes. Capture viewport, input method, console,
memory, frame pacing, and every recovery intervention. A route passes only when a
new player can complete it without seeded state or developer help.

### P1 — Author the full cinematic late-game campaign

The ordered Act I–VI spine, minimal **Trust Is Earned** investigation, MORNINGSTAR
build, and Duet gate are now playable and reload-safe. Replace their remaining
dialogue/checklist presentation with bespoke spatial objectives, canonical
cinematics, and authored character-switch encounters. Then give Acts VII–X the same
depth before Watchdog/ORPHEUS is considered campaign-complete. Retain the current
transition tests as the non-bypassable skeleton underneath that richer content.

### P1 — Give standalone Night honest recovery semantics

Either persist enough Night world state to resume an interrupted run exactly, or
remove the misleading periodic session save. A real crash/reload test must preserve
district, player state, enemies, rewards, difficulty, and return destination without
touching campaign progress.

### P1 — Complete the cinematic asset language

Approve dedicated dog walk/start/stop/landing poses; finish later orbital layer
compositions; and standardize film-to-gameplay handoffs, skip behavior, subtitle
timing, and resume behavior. Review at desktop and phone aspect ratios, in Day and
Night palettes, with reduced motion enabled. Generated or placeholder imagery must
not be promoted without visual source review.

### P1 — Establish one responsive playfield and HUD compositor

Recompose Sector 04 and Good Dogs M2/M4–M7 so actors are not confined to a narrow
band above a large flat floor. Author foreground depth and responsive horizons,
then consolidate the overlapping mission banner, objective, prompt, status panels,
actor labels, and touch controls into reserved safe zones. At each target aspect
ratio there should be one objective, one contextual prompt, readable silhouettes,
and no control covering a target or subtitle.

### P1 — Raise the Day opening to the title/Night bar

Treat standup, the workstation, and the first ticket as a single art-direction
vertical slice. Normalize prop/grid scale, establish focal lighting and occupied
rooms, replace platform-dependent emoji/tofu with reviewed shipped icons, and make
the smallest HUD/dialogue text readable at phone distance. Accept only side-by-side
captures in Day and Night palettes at desktop and phone sizes.

### P2 — Consolidate the runtime with measured budgets

Retire historical hook clusters one behavior family at a time behind parity tests.
Set budgets for startup requests, parsed script weight, active animation/timer loops,
first-interaction latency, and sustained frame time on target phones. Each removal
must preserve the canonical title, save migrations, Story Bible gates, and all three
mode lifecycles.

### P2 — Deepen the human-first operations loop

Extend the existing outcome/provenance records into late-campaign recurrence and
office memory. Reopened work should distinguish technical restoration, user
confirmation, workaround, delegation, and handoff rather than reducing all success
to enemy HP. Add no new global system until one complete recurring-ticket story can
be played, saved, reloaded, and audited end to end.

## Release boundaries retained

- No physical Safari or Android result is represented by these desktop tests.
- Standalone Night currently isolates its save correctly but does not recover an
  interrupted world state.
- The canonical story now provides an ordered, minimally playable Act I–VI bridge;
  Acts IV–VI still need bespoke cinematic mechanics, and Acts VII–X remain much
  shallower than the opening campaign.
- Dedicated dog locomotion and later orbital compositions remain art-review work.
- Historical runtime hooks remain numerous and should be consolidated only with
  measured parity, not by bulk deletion.

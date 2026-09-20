# Production quality revision — 2026-09-20

Base: merged PR #59, `da33c5d34492288415f665d708cf3edd0d5d9efb`.
Authority: `PRODUCTION_BASELINE_v1.2.md`, `RUNTIME_AUTHORITY.md`, and
`VISUAL_REFERENCE_STANDARD.md`.

This pass closes concrete playability and presentation gaps. It does not certify
a production release or establish AAA production values. The earlier gap analysis
remains a historical assessment; this document records its implementation follow-up.

## What changed and why

| Area | Defect or shortcoming | Revision |
| --- | --- | --- |
| Night continuity | Standalone runs could not restore the actual interrupted world | Versioned isolated checkpoints restore route, combat damage, rewards, travel, difficulty, clock and position through Resume Night; explicit new-run action replaces invalid saves |
| Recovery failure | A failed restore could fall through the launch health loop into a new run | Failed restoration releases launch intent and returns title ownership; the saved checkpoint remains untouched |
| Save reliability | Clock-rounding residue could invalidate normal checkpoints; completion risked replay | Normalized clock rollover, validation, visible quota recovery and completion tombstone before settlement |
| Day interruption | A delayed pager replaced an authored dialogue | Notice queue waits for modal release and discards stale run/day/mode callbacks |
| Input | A descendant button blur cleared a held movement key | Only actual window blur releases the bridge's held keys |
| Control feedback | Shared hover/press translations and held scaling moved or shrank gameplay targets | Gameplay controls retain their geometry through interaction; existing color and brightness feedback remain |
| Day presentation | Artwork covered dialogue choices; toolbar and objectives crowded actors and touch controls | Shared scene/dialogue stacking, separate responsive regions, readable labels, scrollable objectives, keyboard communications control and 44px choices |
| Dialogue continuity | An old typewriter click handler replaced a later conversation's text | Each conversation clears the previous handler before its own typewriter is installed |
| Act IV | Choosing an approach immediately produced a verified investigation | Persisted observations → hypothesis → bounded response → technical verification → requester confirmation → shared report, with three distinct operational consequences |
| Campaign tone | Development notes appeared as character dialogue; legacy racks film assigned an enemy/toolkit prematurely | In-world dialogue and actionable objectives; native console presentation owns canonical Act IV, with historical racks content retained outside that route |
| Cinematics | Hidden playback, stale inputs and save failures lacked consistent recovery; the crash fallback advanced automatically | Visible pause/resume, focus trapping/restoration, idempotent settlement, reduced-motion handling and Earthfall save retry; crash recovery waits for deliberate player input |
| Co-op entry | Rapid cancel/reopen was swallowed by two independent launch guards | Selector cancellation releases debounce and title ownership synchronously |
| Mode choice | On narrow screens, one title tap opened the selector and selected Solo with its remaining click | Alternate title routes consume early pointer-up and change screens only on the terminal click; mode choice requires a separate action |
| Good Dogs entry | Gameplay readiness preceded the watchdog restoring hidden movement controls | Verified gameplay handoff restores the shell and canonical pad synchronously; browser acceptance checks the first ready frame and then actual movement |
| Good Dogs HUD | Mobile and cinematic timers alternately hid the same HUD | Cinematic guard owns visibility; mobile styling is passive; duplicate objective strips retire without removing unique narrative/combat messages |
| Orbital readability | Repeated flat staging and a misleading Cell 118 target | Approved atlas depth, pressure bays and mission lighting; registry/art/HUD align with the unchanged cell interaction coordinate |
| Short landscape | Fixed-floor characters rendered below a 390px canvas | Uniform minimum logical height preserves aspect ratio and physics while fitting the full character in view |
| Release evidence | A passing fixture or a successful protection lookup could be overstated as release certification | Machine-readable requirements and a receipt validator bind observations, source identity and artifact hashes; protection must be enabled/enforced with all declared checks passing |

Night autosaves normally run every five seconds and at major changes/suspension.
An abrupt process death may lose movement since the latest checkpoint. Held input,
queued attacks/grabs and modal callbacks intentionally do not replay after restore.

## Review and validation

`REVIEW_GUIDE.md` is generated from `review_contracts.json`. It maps the logical
changes, failure invariants and retirement guards to executable tests.

- `npm test`: complete registered contract inventory, JavaScript syntax, and art quarantine.
- `npm run test:browser:quality`: actual title/Day movement/workstation/Continue,
  Night movement/checkpoint/Resume, Good Dogs selector/prologue, and a separately
  labelled unsupported-codec fault case at desktop, portrait and landscape sizes.
- `npm run test:browser:presentation`: five responsive profiles, actual hit targets,
  correct conversation text, scene/dialogue separation and touch-control clearance,
  plus a 568×320 Night run with the extra combat controls expanded and collapsed.
- `npm run test:browser:act4`: prerequisite-assisted entry, real investigation choices,
  wrong-hypothesis recovery, mid-route reload and separate Evidence/Trust gates.
- Existing Night lifecycle/combat, Good Dogs co-op/progression, licensed-browser media,
  and campaign runtime suites remain in the remote Merge Gate.

The ordinary PR gate does not run the release-only receipt as a required success:
`npm run release:assess -- --evidence-dir <directory>` intentionally exits nonzero
when release evidence is incomplete. Automated browser fixtures cannot satisfy
physical-device, unassisted-playthrough or device-soak requirements.

The exact check names declared by `.github/workflows/merge-gate.yml` are
`Static and release contracts`, `Browser acceptance`, and `required` under the
`Merge Gate` workflow. These names are not proof of enforced branch protection.
The dedicated branch-protection endpoint returned HTTP 403, and the repository
rulesets endpoint returned an empty list. A subsequent authorized branch metadata
read confirmed `main` has `protected: false`, `protection.enabled: false`, and no
required status-check contexts. Protection is **disabled**. All triggered remote
workflows must still pass on the exact PR head before this revision is merged;
repository administration must enforce the check names above before release.

## Remaining production and AAA gaps

| Priority | Remaining gap | Concrete acceptance target |
| --- | --- | --- |
| Release | Physical iPhone/Android behavior | Clean touch, rotation, background/resume, safe-area, audio and storage runs on named real devices with exact candidate identity |
| Release | Decoder and media matrix | Nine retained MP4 assets decode with matching manifest digests; eight active playback routes also pass Pause/Skip/recovery. Retired GD_CUT_03 is decode-only evidence, not a resurrected route |
| Release | Complete player journeys | Unassisted Day campaign, Night, Good Dogs solo and local two-player runs, with reload boundaries and no state seeding |
| Release | Device stability | At least 30 minutes per target phone with frame pacing, stalls, memory where available, thermal observations and zero softlocks |
| Release | Deployment and rollback | Immutable deployed commit/asset identity, successful remote checks, verified protection and a rollback receipt |
| Content | Later campaign depth | Apply the human-first investigation standard to Acts V–X; add environmental objectives, character interactions and consequences, then playtest comprehension |
| Art | Authored animation | Reviewed start/run/stop/landing/dash animation for dogs and approved cinematic Mike poses; keep unclassified atlases quarantined |
| Art | Consistent scene quality | Text-free standup board base with live ticket typography, improved Day rooms, authored orbital layers and replacement of the low-fidelity trace-scene actor silhouette |
| UX | Small landscape HUD typography | Decouple status/objective text size from the scaled world canvas and verify readable labels on the smallest supported physical screen |
| Cinematic | Full editorial/audio pass | Consistent shot timing, audio mix/ducking, subtitles, transitions and player-visible interruption behavior across every route |
| Accessibility | Real assistive technology | Keyboard-only and screen-reader runs, contrast checks, non-audio cues and reduced-motion review on supported devices |
| Engineering | Runtime ownership debt | Incrementally retire historical wrappers with measured parity, listener/timer counts, startup cost and no new competing authorities |

The product is moving toward a stronger playable beta. A percentage would hide
the different sizes of these remaining tasks. Engineering gate passage, complete
content, art approval, player testing and release certification are separate milestones.

## Next production milestones

1. **Certify the opening vertical slice.** Follow the baseline's P0 priority: play
   New Game through Tuesday without seeded state on the exact deployed candidate.
   Finish the Day room/standup art and audio/subtitle pass, then repeat the same
   route on physical iPhone and Android. Advance only after recovery, comprehension
   and presentation meet the baseline's first 30–45 minute release definition.
2. **Prove the connected systems.** Complete Acts II–III, standalone and campaign
   Night, and Good Dogs solo/local co-op with independent player inputs. Include
   interrupted saves, all active cinematic handoffs, and 30-minute device runs.
   Keep automated transition evidence separate from unassisted player evidence.
3. **Raise authored production quality.** Approve dog locomotion and Mike poses,
   replace the remaining provisional environment/scene art, and review shot rhythm,
   sound, subtitles, contrast and keyboard/screen-reader behavior as complete scenes.
   Art approval must precede unquarantining assets.
4. **Deepen the later campaign.** Extend the Act IV investigation standard to
   Acts V–X only after the opening and Acts II–III satisfy their gates. Each mission
   needs a human need, competing hypotheses, a playable environmental objective,
   verification and a durable consequence; preserve canonical reveal timing and
   the ordinary-printer epilogue.
5. **Qualify the shipping candidate.** Enable branch protection, retain successful
   named checks, attach real-device/media/playthrough/soak evidence, verify deployed
   asset identity, rehearse rollback and pass the release receipt validator.
   Any candidate code or asset change invalidates evidence tied to the older source.

## Follow-up: live launch waiting boundary

The PR #60 merged tree deployed successfully in Pages run `35544173405`.
A direct cloud-browser interaction reached ALL MODES READY, opened Night's
canonical difficulty chooser, and then exposed `night_runtime_timeout` after
leaving that choice unanswered beyond the 15-second engine budget. This is a
live startup defect, not a completed live gameplay qualification. The local
runner could not reach Pages (`ERR_EMPTY_RESPONSE`); it is not evidence that
the public site was unavailable.

The router now pauses budget consumption for the visible canonical difficulty
choice, authored Night cinema, and a hidden document. Missing/hidden choices
and a visibly stalled engine retain the original bounded failure. No choice,
skip, campaign state, or gameplay coordinates are fabricated. Regression tests
cover 30 seconds of choice/cinema/background polling and both negative cases;
the real browser acceptance leaves difficulty unanswered for 16 seconds before
continuing through movement, save and Resume.

This narrowly addresses the observed live softlock. Small-landscape HUD sizing
remains open; it was deferred when the live launch defect was found. Physical
phones, unassisted complete journeys, authored production art and enforced
branch protection remain release requirements.

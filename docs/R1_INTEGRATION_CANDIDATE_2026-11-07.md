# R1 integration candidate — 2026-11-07

## Status

**Implementation candidate only. This is not R1 certification.**

The candidate integrates the playable Doors workstation from PR #94 onto the R1 recovery baseline merged by PR #93. No release tag, deployment identity, physical-device result, human playtest, accessibility certification, rollback certification, or release receipt is established by this document.

## Baseline and ownership

- Baseline: `main@9e06fa74c5aca335b1b471b651dd722d49826fb3`.
- Doors candidate: `26c52c35378248f3eb6de4aabee0f75c7a2379d8`.
- Canonical save compatibility, deterministic ownership, asset authority, and exactly-once narrative settlement remain governed by the existing R1 authorities.
- No numbered production hook or additional lifecycle wrapper is introduced.

## Pull-request dispositions

| PR | Disposition | Evidence |
| --- | --- | --- |
| #85 | Superseded by merged #93 | Night combat/enemy checkpoint validation and Good Dogs boarding recovery are already present on current main. Do not replay the old commit. |
| #86 | Superseded | Its authored-standup and visible-desktop-control correction is patch-equivalent to main; main additionally retains workstation touch-target assertions. |
| #91 | Superseded by merged #93 | Waldo checkpoint eligibility, validation, isolation, and regression coverage are present on main. |
| #92 | Superseded by merged #93 | Cockpit focus, held-input reset, timeout, stale-callback, cleanup, and exactly-once recovery are present on main. |
| #94 | Integrated and requalified | Its two unique commits carry the Doors workstation onto current main. Previous standalone Day/Night browser-job cancellations were setup failures, not gameplay passes. |

## Issue dispositions

| Issue | Disposition | Remaining boundary |
| --- | --- | --- |
| #4 | Partially satisfied | Physical devices, locomotion/environment art, sustained performance, hook retirement, packaging, and tag remain open. |
| #10 | Outstanding | Historical reports target old source and do not establish current behavior; exact-candidate browser evidence is required. |
| #36, #78 | Externally blocked | Repository administration must protect main and require `Static and release contracts`, `Browser acceptance`, and `required`. |
| #65 | Partially satisfied | Doors integration and deterministic/browser acceptance advance the lane; human visual and negative-route review remains. |
| #66 | Partially satisfied | Recovery and keyboard/touch combat advance the lane; WebKit, lifecycle, cinematic-return, and human presentation gates remain. |
| #67 | Partially satisfied | Deterministic media contracts remain necessary; licensed-codec playback and per-clip human review remain. |
| #68 | Partially satisfied | Boarding/cockpit ownership is retained; approved locomotion, M4–M7 art, co-op visual review, and physical devices remain. |
| #69 | Partially satisfied | Geometry and emulated viewport checks advance the lane; real assistive-technology audits remain separate. |
| #70 | Partially satisfied | Night/Waldo and exactly-once recovery are retained; complete migration and physical lifecycle evidence remain. |
| #71 | Partially satisfied | Simulated startup and browser samples are not physical performance certification; sustained device sessions remain. |
| #72 | Partially satisfied | Existing semantic/reload suites advance the lane; complete late-campaign human and comprehension review remains. |
| #73 | Partially satisfied | Exact-head evidence is required after every candidate change; cancelled jobs are missing evidence. |
| #81 | Outstanding | Human, device, governance, rollback, packaging, tag, and release-receipt gates remain open. |

## Evidence required on the exact candidate head

- Production release gate and JavaScript syntax check.
- Campaign, Day/Doors, Night, Good Dogs, media, accessibility/geometry, save/lifecycle, and browser-acceptance suites.
- Standalone Day device experience and Night combat workflows, with browser scenarios actually executed.
- Desktop and emulated phone captures, reports, traces where present, and source/asset identity artifacts.
- Hosted checks and any local evidence must identify the same final Git SHA; local emulation must not be described as physical-device evidence.

## Residual human and release gates

1. Physical iPhone/Safari and Android/Chrome acceptance.
2. Thirty-minute sessions on those physical devices.
3. Licensed-codec playback and audible/subtitle review.
4. Unassisted campaign, Night, and Good Dogs routes.
5. Fresh-context human playtest and comprehension review.
6. Real screen-reader and assistive-technology audit.
7. Main-branch protection and required check contexts.
8. Rollback and forward-restore certification.
9. Final packaging, release tag, deployed identity match, and release receipt.

Any post-freeze change invalidates affected evidence. Automation cannot certify hardware, art, audio, comprehension, accessibility, or release readiness.

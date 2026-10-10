# TechOps Hero backlog review — October 10, 2026

Reviewed main `9c8eb0509701026f276c66b9c9a99f529aabfc18` and the open Day-device
PR [#84](https://github.com/ninja-ops-guy/techops-hero/pull/84) at
`fc0e276adff4703ed6afd9db908e7744b1a69573`. R1 production contracts and Story Bible
v1.2 remain authoritative. This review does not certify a release.

## Implementation in this change

- **Lane F / #70 — malformed Night combat checkpoints.** The existing world
  validator accepted invalid effect/event containers and enemy reaction state.
  Restoring `{time:1000,events:{},fx:{}}` reached the real combat tick and threw
  `c.fx.filter is not a function`. Validate retained combat structure before
  restoration; keep rejected save bytes and other campaign slots intact. Preserve
  legitimate airborne reactions and collision history without replaying damage
  or rewards. Queued player actions still retire under the existing save policy.
- **Lane C / #67 — Good Dogs M2 failure recovery.** A failed ship atlas left a
  full-screen overlay above the recovered BOARD action. A flight timeout also
  left the active flight and animation callback alive. Settle only the owning
  flight session, remove its overlay, cancel its animation, clear held controls,
  and allow explicit retry. Required pilot-image errors and zero-width loads settle
  the cockpit interaction as unsuccessful rather than hold the boarding promise
  forever. No failed path may advance the mission or invoke the authored crash.

## Separate Day integration work

PR #84 has successful exact-head Day-device, runtime, performance, campaign,
story, metadata, cutscene and Night checks, but its
[Merge Gate run](https://github.com/ninja-ops-guy/techops-hero/actions/runs/37685888420)
fails in `Input and interrupted-run acceptance`. The walking fixture expects to
reach tile `(39,16)` while the new authored standup intentionally begins at
`(39,17)`. The Day acceptance repair is isolated on a branch based on PR #84;
it must use real standup and desktop controls, retain assignment authority, and
continue to fail on unrelated blocking dialogs. It is not part of this main-based
runtime patch.

## Remaining backlog

| Priority | Finding | Next acceptance evidence |
| --- | --- | --- |
| P1 | Standalone Night saves omit the reachable Waldo's Place route. `drive.to='waldo'` and the property world fail checkpoint validation; backgrounding preserves an older street checkpoint. | Separate checkpoint eligibility from the street combat/clock owner. Cover travel, property movement, mowing/repair, departure, once-only rewards, malformed data and other-mode isolation. |
| P1 | Cockpit focus ownership, held-input clearing on blur, reduced motion and flight lifecycle pause remain incomplete; a pilot request that never emits load/error can still wait indefinitely. | Keyboard/focus and background/recovery tests, motion preference review, and a recoverable network-stall path that does not impose a timer on player interaction. |
| Release gate | Physical-phone and human evidence in [#81](https://github.com/ninja-ops-guy/techops-hero/issues/81) remains separate from automation. | One frozen candidate: named iPhone/Android routes, rotation/background/audio, licensed cinematic playback, long sessions, unassisted play and assistive technology. |
| Release gate | Branch-protection work is tracked in [#78](https://github.com/ninja-ops-guy/techops-hero/issues/78) and #36. | Independently verify enforcement and the exact required checks after convergence; this review did not change repository settings. |
| Art/UX | PR #84 still lists Shipping character/portrait mismatch, desk art and texture/pixel-density consistency. Good Dogs locomotion/environment art remains tracked in #68. | Approved production sources and explicit desktop/phone visual review; do not promote reference art by file presence alone. |

The older September gap analysis calls standalone Night recovery incomplete in
general. Main now includes version-2 isolated world checkpoints; the remaining
claims should identify specific failing boundaries, such as Waldo's Place, rather
than imply that no recovery implementation exists.

## Validation scope

The initial main deterministic production gate passed, including 574 JavaScript
syntax checks. New regressions exercise failure behavior and real combat state,
not only source-string assertions. Final command results and immutable candidate
identity are recorded in the accompanying PR. Emulated browser profiles do not
certify physical devices, art quality or complete unassisted campaign play.

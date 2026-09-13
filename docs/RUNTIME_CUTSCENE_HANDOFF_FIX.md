# Runtime #808: distinguish film exit from playable mission handoff

## Verified input

- Repository: `ninja-ops-guy/techops-hero`, PR #40 head
  `b298b7a44d2d0a7b5056d4829e8080cdec15b667`.
- Runtime bot run `34719165551` (#808), tested merge
  `1c4a6609401cff7cebf3f1e6568914ba3b730cf4`.
- Downloaded full artifact ID `10305264589`: 370,650,686 bytes.
  Verified SHA-256:
  `e3cd19b999350734507e0b381a39179407ca95993b1ff751728d9a408ba639c1`.
- Inspected `goodboys-progression.json`, `goodboys-progression-trace.zip`
  (94,323,230 bytes), and a real screencast frame extracted from that trace.
- Downloaded source artifact ID `10305253871`, verified SHA-256
  `a7906fab53f304964608151513ea0c6d11133612ca03cbb17bb92174a7f4ed99`.
  Reconstructed Git tree: `1dcc0a1211e5f9873361810d4a8ab9ed9b014f67`,
  matching the PR head's tree before this change.

## What the failure actually shows

The old bot's `resolveCutscene()` waited for a terminal video result, removal
of the film overlay, and an idle film bridge. Those are **media completion**
conditions, not a playable-world invariant.

At `2026-09-12T21:19:37.480Z`, immediately after skipping GD_CUT_05:

- All three mission mirrors said M4, but progression `active` was **false**.
- Handoff M4, started at `1789247976543`, was still pending; the last completed
  handoff was M3. Runtime status was `awaiting-fresh-runtime`.
- `cinematicVisible` was **true**, despite bridge `visibleBlocker=false`.
- `inDialog=true`. The trace's nearby real frame shows the native M4 / Cell 118
  cinematic with its skip prompt, not a bare playable scene without an owner.
- The bot had already written `cellOpened=true` to the outgoing runtime and
  ticked the bridge, causing GD_CUT_05 to play before fresh M4 existed.
- The native handoff completed at `1789247987658`, about 11.1 seconds after its
  start, before the later M4 encounter fixture ran.

The bridge's DOM inventory does not include `v725-cine`; the shared
Presentation Director does. Therefore an empty bridge inventory cannot prove
that `S.inDialog` is stale. The same early assertion also explains why CUT_04
sometimes appeared to pass: the outgoing runtime was still ending, but the
sample happened to catch `inDialog=false` between independent ownership ticks.

This evidence supports a **fixture ordering/observation correction**, not a
change to campaign flags, mission advancement, combat, or global dialog repair.

## Implemented boundary

`scripts/good_dogs_handoff_probe.mjs` observes, without mutating:

1. The live Night world, fresh non-ending runtime, and all mission authorities.
2. Completed handoff for the expected mission; no pending runtime, transition,
   handoff, or handoff error.
3. Native v725 cinematic activity, the Presentation Director's claims/surfaces,
   and visible modal elements (including fading modal surfaces).
4. Bridge idle state, persisted clip-seen state, and a matching terminal result.
5. `S.inDialog=false` before declaring gameplay available.

The progression bot waits on that boundary after GD_CUT_04 **before** setting
its Cell 118 fixture flag, and again after GD_CUT_05 before asserting control.
It rechecks fresh M4 ownership at the mutation itself. The existing mission,
seen-flag, and stale-dialog assertions remain in place.

The wait is bounded to 15 seconds, allowing the observed native M4 entry scene
to complete normally. It does not retry a failed run, skip the native scene,
clear dialogs, prime an encounter, or invoke a repair/tick while waiting.

An unresolved boundary throws `GOOD_DOGS_HANDOFF_TIMEOUT` and stops the route
before any later encounter fixture. Reports include the last sampled state
and bounded ownership-transition observations. The exception path attempts
`goodboys-progression-exception.png` and explicitly records capture failure
instead of claiming a screenshot exists. The existing full Playwright trace
is finalized in `finally`. Media exit logs are now named `media-complete` to
avoid confusing them with the new `playable-handoff` checkpoints.

## Validation and limitations

- `node --test test_good_dogs_handoff_probe.mjs`: 42 tests, including the #808
  ordering, actual production director/bridge/progression composition, frozen
  read-only state, native-only blockers, real stuck-dialog rejection, bounded
  timeout, and fixture ordering.
- Included in the aggregate production release gate (now 69 suites).
- Existing runtime-triage, metadata and media checks are retained.
- Game runtime files, mission semantics, cinematic callbacks, workflow
  permissions, and the authoritative merge gate are unchanged.

Local dependency installation failed with DNS `EAI_AGAIN` for registry.npmjs.org.
A separate system Chromium navigation probe using installed Python Playwright
1.57.0 returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` for the local game URL. This
is **not** a successful full-game browser test and is not the repository's
pinned Playwright 1.55.1 acceptance environment. Fresh GitHub Actions browser
checks must validate the complete route and the new checkpoint evidence.

Do not certify ordinary play based on later encounter fixtures or merge on
parser/contract results alone. If fresh CI still cannot settle M4, use the new
ownership snapshots and trace to investigate the real owner; do not force-clear
`S.inDialog` or suppress the finding.

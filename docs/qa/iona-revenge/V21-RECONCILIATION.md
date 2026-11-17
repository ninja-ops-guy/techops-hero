# Iona 39A–51 reconciliation candidate

Status: SCRIPTED + OFFLINE LOGIC QA; NOT VISUALLY VERIFIED. Draft only.

Base: PR #131 c6b9cbde09a7bc08ceaa6b19d409c910fd2c60fb.
Authority: Mike's adopted 39A–51 v21 scene comparison and explicit “Work on it” (17 November 2026). The older REVIEW.md and scene-manifest.json preserve their original v16 provenance; they are not claimed to be v21 source or current proof. This patch implements the supplied corrections, not a claim of a separately downloaded full v21 manuscript.

## Applied
- 39A/39B: fixed grille, officer still security-side, keys pulled from cylinder, same outward-opening leaf, all three officers and one sandbag retained in security bay; latch check before route closure.
- 40/40A: separate initially closed vertical shutter raised by local control; fourth officer already archive-side; separate glass door, strike/stumble/radio and entry staging.
- 41–46A: director identifies North Intake only; archive HOLD is objective 19, before departure 20 and handoff 21. Director badge, retained release key and present-day Red recording are explicit. Departure requires HOLD; HOLD requires the lead. No remote-copy claim.
- New patrol, dropped flashlight, older injured officer and fire door remain distinct. Nearby correct older escort is required at fire-door action and final witnessed crossing, not any escort or an absent/distant person.
- Burn still requires ledger + witnessed older crossing -> independent all-clear; quiet loss and torn jacket retained.

## Save policy
Save schema remains version 1; this mission gains optional per-run scriptRevision 21. Unknown future or malformed explicit revisions fail closed. Unversioned pending objectives 19–21 cannot be reinterpreted at the same integer: explicit start/resume restores the local archive HOLD checkpoint (or the director lead if missing), clears transient hold/escort state, and keeps the untouched prior run in legacyCheckpoint. It never adds done entries, choices or completion flags. Other pending objectives keep their positions. Completed historical records are not rewritten or presented as proof of the revised experience. Fresh replays use revision 21 and start at zero.

Migration runs within the existing start/commit persistence boundary; it is not triggered by read-only validation. Runtime commit's existing rollback handles failed saves. Fixtures only: no player data or production save was accessed. The old run is retained for diagnosis, not used as new completion evidence. Full earlier geometry is not replayed retroactively for saves already past it.

## Remaining acceptance gates
- Review actual pixel art, barriers, key/radio/sandbag continuity, officer identity and injured gait. Text assertions do not certify animation.
- Normal-control fresh playthrough and serialized legacy resume in browser, including persistent save failure, touch/phone, collision and pacing.
- Exact combined qualification with sibling skill/multiplayer branches; this candidate is solely based on #131.
- No push, merge, deploy or PR126 changes are included in this candidate's local verification.

## Verified local result
Production gate PASS, 638 JavaScript syntax files; progression 19 groups; complete 29-chapter objective reachability fixture PASS. Independent review repeated the full gate and 131 extra migration/negative-save probes with unchanged engine/data/test hashes. Two initially detected missing-flag bypasses were corrected: held timers recheck required flags, and burn directly requires ledger, older count and all-clear. The loading-floor route wording was also corrected. These are offline fixtures, not a normal-control browser playthrough.

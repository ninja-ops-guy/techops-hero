# Open-PR inventory at the pinned base

- Repository: `ninja-ops-guy/techops-hero`
- Pinned default branch: `main` @ `3f8e59cc1b8f4b6f2bc32f3bc2eab32d81f36f66`
- Inventory observed: 2026-11-24; 58 open PRs, each accounted below exactly once.
- Categories: **Already included**, **Integrated**, **Overlapping/out**, or **Blocked** for this combined candidate.
- Head SHAs are abbreviated for readability. “Integrated via” means the selected integration head contains or reapplies that PR's content; it does not assert ancestry where the integration used fresh commits.

| PR | Head | Classification | Disposition and reason |
| --- | --- | --- | --- |
| #85 | `45b65843785f` | Overlapping/out | Dirty and 103 commits behind; old Night/Good Dogs recovery overlaps current recovery owners. Rebase and split any still-unique fix instead of overlaying it. |
| #86 | `da900eb34639` | Overlapping/out | Test-only browser repair on a non-`main` base, 91 commits behind; current harnesses supersede its context. |
| #91 | `0a474634020f` | Already included | Head is an ancestor of the pinned base; zero commits ahead. |
| #92 | `c12bd0bd1959` | Already included | Head is an ancestor of the pinned base; zero commits ahead. |
| #96 | `194aac870aa4` | Overlapping/out | Day-contact regression-only branch, 53 commits behind and includes a workflow edit; needs a current-base rebase before consideration. |
| #98 | `83d20ad7c412` | Blocked | Dirty linked-save/See World candidate, 53 commits behind; overlaps current save and entrypoint owners and still requires paired-repo browser qualification. |
| #103 | `72e074e04951` | Overlapping/out | Standalone old-origin settings export under `recover-settings/`; no dependency of the focused game journeys. |
| #107 | `d4faed91c1a8` | Overlapping/out | Thirty commits behind; touches the same Day runtime, entrypoint and release gate as the selected Day work. Accessibility deserves a fresh focused rebase/review. |
| #109 | `efe65b88c17d` | Overlapping/out | Separate sixteen-file Sector 04 hangar/route pass, thirty commits behind; not required by the focused Day/Night/Good Boys/save candidate. |
| #110 | `3b3247188191` | Blocked | R1 Night touch/combat stack member; do not integrate a partial stack whose save dependency is no longer aligned with #114. |
| #111 | `80d3e40e70d2` | Overlapping/out | Old seventeen-file Good Dogs Hidden Bay presentation/lifecycle pass, thirty commits behind; separate from the verified Good Boys route. |
| #112 | `dbdbfc00e428` | Blocked | Contained in the old R1 stack; blocked by that stack's stale save base rather than cherry-picked into an unrelated Night candidate. |
| #113 | `7a620b1a7117` | Blocked | Contained in the old R1 stack; same restack requirement as #112. |
| #114 | `426219b500d7` | Blocked | Current save-background head is not an ancestor of #115; downstream #115–#127 use an older #114 revision. Restack before integration. |
| #115 | `e50b7b41a807` | Blocked | Combo-reward layer is based on the superseded #114 revision, not current #114. |
| #116 | `ad5027c7d10f` | Blocked | Night onboarding layer remains on the stale R1/save stack. |
| #117 | `92945845be2d` | Blocked | Perfect Shift layer remains on the stale R1/save stack. |
| #118 | `14672c1e5bf3` | Blocked | Perfect Shift streak layer remains on the stale R1/save stack. |
| #119 | `6fc54c337ac1` | Blocked | Night danger-warning layer remains on the stale R1/save stack. |
| #120 | `0605eb934ee0` | Blocked | Day stress-warning layer remains on the stale R1/save stack. |
| #121 | `b96a1cb8d83d` | Blocked | Tech-debt-warning layer remains on the stale R1/save stack. |
| #122 | `69e1e84a5285` | Blocked | Reputation-milestone layer remains on the stale R1/save stack. |
| #123 | `c224f176195e` | Blocked | Quitting-time layer remains on the stale R1/save stack. |
| #124 | `09869bf89bd7` | Blocked | Stress-recovery layer remains on the stale R1/save stack. |
| #125 | `0f93461eeb7a` | Blocked | Hypothesis-ready layer remains on the stale R1/save stack. |
| #126 | `74dfd06adbc8` | Overlapping/out | Dirty old Day-field head; pinned `main` already contains the separately reviewed #149 Day-field integration. Do not overlay this head on that reviewed result. |
| #127 | `4d95743b1741` | Blocked | R1 stack tip still descends from the older #114 revision, not #114's current head; the full chain needs restacking. |
| #128 | `0fea6e760106` | Overlapping/out | Draft Night store/progression expansion on an older base; separate from the focused presentation/save integration. |
| #129 | `e6bd9b8a1eb5` | Overlapping/out | Living World campaign depends on #128; not part of the focused candidate. |
| #130 | `44ef8e417e18` | Overlapping/out | Expedition/audio/comfort expansion depends on #129; separate feature lane. |
| #131 | `b3e20ed39a8a` | Overlapping/out | Living World music/canon alignment depends on #130; separate feature lane. |
| #132 | `1af401c71b07` | Overlapping/out | Night levels/stats/skills branch from #130; separate progression expansion. |
| #133 | `678fd3947a8e` | Overlapping/out | Offline training/arena practice depends on #132; separate expansion. |
| #134 | `ec9dd7928c6b` | Overlapping/out | Good Dogs film-audio choice, not Good Boys; browser audible playback remained unverified and captions are handled by #140. |
| #135 | `7fe5d31919bf` | Overlapping/out | Character-skill expansion depends on #133; not required for the focused Night route. |
| #136 | `bde9909f789f` | Overlapping/out | Private Arena server prototype depends on #135; separate backend/multiplayer scope. |
| #137 | `db996700171a` | Overlapping/out | Alternate Night special-cancel/Uzi fix branch from #135; needs reconciliation with current Night rather than inclusion in this presentation candidate. |
| #138 | `2b886ed14cf5` | Overlapping/out | Arena foundation depends on #136; separate multiplayer qualification lane. |
| #139 | `c137c8cead1e` | Overlapping/out | Arena core/deadline layer depends on #138; separate multiplayer lane. |
| #140 | `0480b216348c` | Blocked | Contains #134 but ships no caption tracks; audible overlap, caption timing and physical playback still require qualification. Not part of Good Boys. |
| #141 | `4846428c492a` | Overlapping/out | Arena directional combat depends on #139; separate multiplayer lane. |
| #147 | `ec50cf2d82f0` | Overlapping/out | Dirty Day micro-scene branch with validation explicitly not run; overlaps the selected #165 Day presentation tree. |
| #150 | `170c9771f7de` | Overlapping/out | Low Quarter rescue authority is a separate post-epilogue feature lane, not a dependency of the four focused journeys. |
| #151 | `56f1612dca6f` | Blocked | Test-harness cleanup/diagnostics only; exact-head macOS shutdown evidence remained unresolved/unstable. No runtime gameplay change is needed for this candidate. |
| #152 | `7c6e76977743` | Overlapping/out | Chorus siege authority stacked on #150; separate Low Quarter lane. |
| #153 | `ab280596585f` | Overlapping/out | Low Quarter twelve-person opening on #152; its producer/save scope is explicitly not cumulative with #154. |
| #154 | `53bb6a8d8926` | Overlapping/out | Separate 48-person Low Quarter scenario on #152; requires producer/bootstrap reconciliation with #153 before any combined adoption. |
| #155 | `3c159476bb22` | Integrated | Included through #159, whose head contains #155; combined Night street-art suite passed. |
| #156 | `b5a3a5be0fc1` | Integrated | Content included through #165's reviewed Day integration; passive floor/wayfinding checks passed in the combined tree. |
| #157 | `1f5ebe35c2f7` | Integrated | Content included through #165; Plating, Security, Doors and Prompt checks passed in the combined tree. |
| #158 | `8a143583451a` | Integrated | Content included through #165; company media, reduced motion, compact evidence and cache assertions passed in the combined tree. |
| #159 | `7c6a59fac65d` | Integrated | Directly integrated after pinned `main`; includes #155. South Exit, Night combat, Waldo porch and persistence passed on the combined tree. |
| #160 | `1e34c5687ce9` | Overlapping/out | Siege art/motion depends on #154; remains with the separate Low Quarter lane. |
| #161 | `8603d8eaee81` | Overlapping/out | Low Quarter opening graphics depend on #153; remains with that alternative operation lane. |
| #162 | `cecb69ece910` | Blocked | Night enemy-animation candidate adds three new binary atlases. The available inline GitHub write path cannot safely create those blobs; excluded rather than risking corrupt art. |
| #163 | `556d00984c76` | Overlapping/out | Reference-style Low Quarter visuals depend on #161; separate art/operation lane. |
| #164 | `4ff9fdea75c2` | Overlapping/out | Documentation-only 3D cinematic reference map; no runtime/build effect. |
| #165 | `355027824235` | Integrated | Integrated after #159 with unioned release/static assertions. Runtime and tests from #156–#158 are in; its two pre-existing workflow-file modifications are not republished through the workflow-scoped write path. |

## Integration order

1. Pin `main` @ `3f8e59cc1b8f4b6f2bc32f3bc2eab32d81f36f66`.
2. Apply #159 at `7c6a59fac65dcbe165b477f802e224f29b7bc247` (thereby including #155).
3. Apply #165 at `3550278242357f14a21aa1fbf2639ae2212f2a93` (thereby including #156–#158 content), excluding only its two workflow-file modifications from the published tree.
4. Union both PRs' production/static suites and retain the Night and Day cache-key assertions. Add only a test-runner environment override for system Chromium; no gameplay authority or save semantics are changed by conflict resolution.

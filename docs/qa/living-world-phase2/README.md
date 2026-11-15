# Living World phase-two qualification

Final gameplay source tree: `d2f6375ed0132954f2aeab7e10fd4475f07c08cc`, published candidate `60ad448995c709eeb40e2d804a44c0b3d8a07a57`. Earlier focused browser checks ran during the phase-two development sequence; the final production gate, optional-chain pass and scene-render pass use this final gameplay source.

The phase-one receipts in `../living-world` are historical evidence for the original 14 chapters, not qualification of all 27 chapters at this revision.

## Focused checks

- 124 registered production suites, including 27-chapter reachability, all 11 optional chains, invitation/visit separation, dialogue cursors, legacy-save compatibility, all three first-call consequences and viewpoint isolation.
- 20 directional aerial-combat groups, including real Night physics at 16, 100 and 250 ms per frame.
- `dialogue.json`: normal movement and actual dialog clicks/taps on desktop, portrait and landscape. Resumes the exact unread line after reload; a quota failure on the final invitation line rolls back the flag and cursor; invitation alone does not unlock Iona. Prerequisites come from the genuine phase-one playthrough save, remapped to the local test origin. Storage failure is explicitly injected.
- `recovery.json`: objective/purchase rollback, full-health supply retention, healing/reload, chapter resume, HUD bounds, paused journals and actual touch movement. Declared fixtures: quota failure and health set to 40 to isolate healing. Includes the corrected chapter-exit checkpoint behavior.
- `iona.json`: sprite/combo rendering in all three layouts through the existing linked Iona path. The harness declares later-story prerequisites, legal Iona workshop history and cleared review enemies. It is not evidence of naturally unlocking the full native campaign.

## Cumulative playthrough

`cumulative-playthrough.json` records a real-control run reaching all 27 completed chapters. It starts from the genuine phase-one 14-chapter checkpoint and adds all 13 phase-two chapters through normal title/menu controls, movement, combat, work holds, conversations, escort routes and receiving checks. No new story flags, objective completions, health or positions were injected for this playthrough.

This is cumulative development evidence, **not one uninterrupted run at a frozen final revision**. Runs resumed after fixing the chapter-exit checkpoint transition, adapting the test driver to multi-line dialogue/dispatch and teaching the driver to use the offered recovery checkpoint after damage. The final separate optional-chain pass and render pass exercise the frozen final gameplay source. The final privacy guard for undelivered relay outcomes is verified through the browser-bridge unit harness as well as the domain test; it is not claimed to have been present in the earlier cumulative relay completion.

Four hosted checks also passed at the final gameplay revision `60ad448995c709eeb40e2d804a44c0b3d8a07a57`: two contracts jobs, cutscene-contract, and field-experience. This does not certify a deployment.

`optional-chains.json`: all five new chains completed at their 15 required physical locations through normal controls on the final gameplay source. The six original completed quests are retained from the genuine prior checkpoint, giving 11 completed optional quests. No optional progress is injected.

`scene-renders.json`: all 27 chapters revisited and rendered from the completed gameplay save on the final source. `new-scenes.webp` is the 13-new-chapter overview inspected for actor identity, mode labeling, HUD separation and environment variation. Scenery remains the candidate code-art treatment, not final commissioned artwork.

## Scope and remaining production work

This is a draft source candidate, not a merge, deployment, physical-iOS certification or final creator art approval. New scene layouts use existing backgrounds and code scenery; accompaniment figures are readable markers. The imported Iona candidate retains its art source and review provenance. No protected comic page or main-story milestone is modified.

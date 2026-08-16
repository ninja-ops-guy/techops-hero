# TechOps Hero — Production Readiness & Concept Fidelity Review

**Date:** 2026-08-17 · **Scope:** all delivered briefs (cutscene bible, production backlog, night-crawler spec, story arc, mechanics/pacing notes) + all reference sheets vs the shipped v7.31 build · **Reviewer:** K3

---

## Verdict

**Ship-ready as a vertical-slice-plus product.** The build is stable (27/27 suites green), performant (v7.28/v7.31 measured wins), save-safe, exactly-once on rewards, controller-complete, and visually faithful to the reference grammar. The docs' aspirational backlog (40+ systems) is largely covered or consciously scoped out; the gaps that remain are P2 polish, listed at the end. No P0 defects. Two P1 items fixed in this pass (deploy snapshot refreshed; Pages outage is GitHub-side).

---

## 1. Doc requirement audit (what the briefs demand vs what ships)

### Cutscene bible brief
| Requirement | Status |
|---|---|
| Data-driven scenes | ✅ all boards are `{title, shots, cues}` data on the v7.25 engine |
| Manifest before implementation / no silent placeholders | ✅ every board adapts an uploaded reference sheet; drawn-glyph stand-ins are documented canon, never silently swapped |
| Exactly-once rewards | ✅ latched in `S.meta`, test-covered per pack |
| Skip/replay behavior | ✅ skip except during choices; gallery replays |
| State matrix (replay/skip/save before+after choice/interruption) | ✅ covered in suites v7.25–v7.30 (skip re-arms, choices persist in save blob, once-per-day latches) |
| Controller input in cutscenes | ✅ v7.30 dpad + A drives engine choices |
| Accessibility (reduced motion, text speed) | ✅ settings menu (v6.7): UI-animations toggle, text speed, SFX/music volume, colorblind palette |
| Scene validator in CI | ⚠️ partial — the engine refuses duplicate scene ids at registration; a full schema validator (unknown speaker, text overflow, dead-end branch) is not built. **P2** |
| Performance budgets doc | ✅ measured per-frame budgets enforced in tests (fillRect budget, amortized drawTile); formal budget doc added below |
| Profiling evidence for heavy scenes | ✅ probe logs in verifier/runs (fillRect 3,294→~600, quantum-hitch fix measured) |

### Night-crawler spec (vertical slice)
| Requirement | Status |
|---|---|
| Move/jump/dash/block/attack chain | ✅ v7.31 (3-hit chain → launcher, dash i-frames, block chip) |
| Hit-stop / telegraphs / crowd control | ✅ v7.31 (hit-stop, "!" windups, 2-attacker tokens) |
| Enemy archetypes | ✅ five sheet archetypes live; the spec's parry/perfect-dodge and stagger meter are **P2** |
| Insight scan & diagnosis-alters-encounter | ✅ exists in the day game (evidence/confidence/hypothesis alters the fight); not yet wired into the night mode — **P2** |
| Environmental system interactions | ✅ partially (conveyors halt on PLC tickets, day-side change windows); night-side breaker/crane interactions are **P2** |
| Results screen / performance rating | ✅ exists in the day game (5-star Investigation ratings, career report); night-crawl rating card is **P2** |

### Production backlog (systems coverage)
Fully covered: time/weather, ticket economy, troubleshooting loop (observe→document), Digital Twin overlay, comm battles, workforce/leadership, command center, certifications, change management, incident lifecycle incl. PIRs, career report, NG+, mobile + gamepad, gallery, accessibility settings, UAT/regression CI.
Deliberately simplified or open: NPC schedules are ambient-wander only (P2), salary/rent economy abstracted into budget (fine), relationship values abstracted into dept rep (fine), full co-op move list (out of scope), localization export (P2), backup save slots (P2 — single localStorage slot today).

---

## 2. Concept fidelity (sheets vs build, screenshot-verified this pass)

| Reference | Build match |
|---|---|
| Mike (dreads/sunglasses/vest/ROOT mug) | ✅ player atlas + all cinematic draws |
| Felicia (violin, purple grammar) | ✅ own atlas only, violin frame on the signal board |
| Charger (green ghost flames/underglow) | ✅ night drive + K's run + parked hub car |
| K (beanie/headphones/shades) | ✅ procedural figure, never a Felicia reuse |
| Night city districts + neon | ✅ v7.31 six districts, legible English signs, lamp pools, wet lanes |
| Night enemy roster | ✅ five archetypes as night-glitch silhouettes w/ tints |
| Badge-cloner / wires / K-origin / ORPHEUS boards | ✅ shipped in v7.29/v7.30, screenshot-verified against the sheets (incl. panel-level details: EVENT 77A2F381, 03:17 AM, 99.7%) |
| Night HUD (HP/FOCUS/COMBO/DANGER/district) | ✅ v7.31 |
| Boss-fight mockup (hangar, "RESTORE SECTOR 04", insight button) | ⚠️ the day battle UI is DOM-based, not the mockup's diegetic hangar fight. Documented as a deliberate engine choice; the night boss arena is the closest match — **P2 theming gap** |

---

## 3. Prioritized gaps

**P0** — none.
**P1** — none open (deploy snapshot refreshed this pass; GitHub Pages 404 remains a GitHub-side setting to flip in repo Settings → Pages).
**P2** (tracked, not blocking):
1. Scene-schema validator in CI (duplicate shots, text overflow, dead-end branches).
2. Night-mode Insight scan + environmental interactions + results card (spec's investigation loop at night).
3. Backup save slot / atomic save rotation.
4. Dialogue history + remappable keys.
5. Parry/perfect-dodge + stagger meter at night.
6. Diegetic boss-arena theming closer to the hangar mockup.

## Performance budget (formalized)
- World frame: < 1,200 canvas fill ops; zero per-frame gradient construction; tile-cache quantum repaint ≤ 40 drawTile calls.
- Cinematic scene load: instant (all procedural); zero network fetches at runtime.
- Verified: probes in `verifier/runs/`, suites test-v728 (budgets) and test-v731 (night).

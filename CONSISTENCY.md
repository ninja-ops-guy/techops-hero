# TechOps Hero — Game Logic & Loop Consistency Review (v6.9)

*Reviewed after the v6.9 "Department Interiors" release. Verifies the core loops agree
with each other across all 25 hook layers.*

---

## 1. The day loop (canonical)

```
09:00  setupDay — new map, tickets spawn, day card
  ↓    work tickets: call → interview → diagnose → portal battle → close
16:00  CLOCK OUT — directive toast, guides retarget WAY HOME (grace: finish current ticket)
16:59  Security Sweep — forced exit → night falls (18:00)
18:00  Night Crawl — 3 New Haven streets (+20 min each)
19:00  Head home → END OF DAY summary + reward choice
  ↓    setupDay again (clock resets to 09:00)
```

**Single clock choke point:** `advanceClock(min)` is the *only* writer of `S.clock`
(verified by audit) — every interview, diagnosis, close, deploy and night stage flows
through it, and the v6.8 clock-out enforcement hooks exactly there. No parallel time
systems exist.

**Documented exceptions (intended, now consistent):**
- Finishing *all* tickets before 16:00 ends the day early via the normal EOD screen
  (reward for a perfect shift — the 17:00 backlog path is not involved).
- A single large time jump past 17:00 (e.g. a 20-minute ticket close at 16:45) is
  rerouted to the Security Sweep instead of the silent backlog end (v6.8 backstop,
  gated on clock ≥ 16:00 + unfinished tickets).
- Friday 16:45 emergency vs the 16:59 sweep: the grace period lets you finish the
  emergency battle you're in before Security walks you out.

## 2. Watchdog (Felicia) mode

- No tickets spawn — guide targets fall through to the South Exit ✓
- 16:00/16:59 enforcement applies (she drives the Impreza home) ✓
- **v6.9 consistency rule: side-view department interiors are disabled while playing
  as Felicia.** Her mode is campus-wide top-down surveillance; side rooms broke
  war-driving (a cruise crossing a biome froze the cruise and the war-drive counter).
  This was caught by the v6.4 regression suite and fixed.

## 3. Side-view department interiors (v6.9)

- Transition fires only on **biome entry** (edge-triggered), never on presence — no
  boot-time misfires, no retrigger loops when idling inside a room.
- Exit: left door edge, `Q`/`Esc`, or the EXIT marker → returns to the exact top-down tile.
- **World interactions take precedence over rooms:** unfound Felicia clue spots and
  Felicia herself keep their top-down interactions (several clue spots sit inside
  department biomes — without this rule the APT arc would be unfinishable). Inside a
  room, walking into her station and pressing E talks to her normally.
- Battles are DOM overlays and work identically inside rooms; path guides and ambient
  overlays are suppressed while inside (they belong to the top-down campus).

## 4. Systems cross-check

| System | Writes | Reads | Consistency verdict |
|---|---|---|---|
| Clock | advanceClock only | guides, enforcement, weather, incidents | ✅ single writer |
| Day end | checkDayEnd / endOfDay | v6.8 backstop gated | ✅ no double-end paths |
| Felicia arc | fel() state, clues | rooms, world, portraits | ✅ reachable in both views |
| Portraits | dlg()/closeDlg() strip | v64 felDlg injects own | ✅ no leaks (v6.7 fix) |
| Camera space | game draw transform | v64/v68 overlays re-apply it | ✅ no screen-space glue (v6.8 fix) |
| Ambient audio | zone rects | rooms keep last zone | ✅ acceptable |
| Settings | V67SET + localStorage | v66–v69 all read it | ✅ one settings object |

## 5. Known accepted minor items (not bugs)

- Night-crawl player sprite is the standard hero even when playing as Felicia
  (night mode has its own pixel-hero renderer; cosmetic only).
- The guide label slightly overlaps the "SOUTH EXIT · 16:00" sign when the door is
  the destination.
- The v6.1 symptom-first test has a known ~30% timing flake in headless CI only;
  game behavior is correct.

*Author: K3 consistency pass, 2026-07-29.*

## v7.16 Addendum

- Variety systems (quotes, labels, openers, tree-order shuffle, day themes) are seeded by a deterministic FNV-1a hash of type-id + day + occurrence — variety without save-game bloat, and identical within a day for the same occurrence count.
- Unisex NPC names were deliberately excluded from the name-pool expansion: dept-gendered sprites make unisex names read as name/sprite mismatches (v7.12 rule). Yuki remains the single grandfathered unisex name.
- Ambient chatter never hijacks scripted NPCs (Felicia's rooftop scene, pinned story NPCs, the crew).

*Author: K3 consistency pass, 2026-07-30.*

## v7.18 Addendum

- Interview rule, codified: the player chooses questions; the ticket user provides answers. Tree answers are bound to the ticket's hidden root cause (TRUTH table), so an observation can never contradict the fix the run will later require. The player-facing skill is probe selection and conclusion timing.
- Same question, same ticket type, same answer — deterministic per node, so repeated play is consistent rather than arbitrary.

*Author: K3 consistency pass, 2026-07-30.*

## v7.19 Addendum

- Sprite truth, codified: character and prop atlases must carry colour-bled transparent pixels (never pure black/white under alpha 0). Palette-PNG transparency interpolates incorrectly on some mobile renderers; RGBA + bleed is the required export format for any future sprite.
- Render-path parity: every world-space character draw path sets `imageSmoothingEnabled = false` (v7.13 NPCs, v7.19 player). Mixed sampling modes across sprites on the same screen are a visual-consistency bug class.

## v7.20 Addendum

- Conversation framing truth: dialog chrome must match physical reality — face-to-face (adjacent) conversations use 🗣️, only remote engagements use 📞. Proximity is the single source of truth, so framing can never contradict where the player is standing.
- Spawn truth: the day spawn is the lobby (the map's carved reception area), never a random free tile.
- Interaction priority, codified: NPC > portal > device > coffee > lore > prop-inspection. Prop inspection is strictly a fall-through and can never shadow a real interaction.

## v7.21 Addendum

- Sprite transparency truth, final form: the GUARANTEE lives in the renderer, not the assets. Any PNG data-URL image drawn to canvas is alpha-bled at runtime before its first visible frame; asset encoding (palette vs RGBA) is no longer a consistency risk for sprites. New sprite sheets may ship as compact palette PNGs.
- Same rule off-canvas: sprite art shown via DOM `<img>` (title crest, dialog portraits/seals) must pass through the v7.21 async bleed, never raw palette data-URLs.

## v7.22 Addendum

- **Single entry point preserved** — the cinematic wraps `enterNight`, the one function every night entry (South Exit dialog, v6.8 sweep at 16:59, v6.8 backstop) already calls. No new paths into night mode were created; the v6.3 title card still fires after the cut, and day-end suppression while `s.nightMode` is untouched.
- **Input discipline** — `S.inDialog` is held true for the whole cut (movement/interaction gated exactly like a dialog) and restored before the original `enterNight` runs; the overlay swallows all keys with a capture-phase listener so no input leaks into the frozen world.
- **Canon art rules hold** — the cut draws Mike from the real player atlas (bleed-safe via v7.21), introduces no new character sprites, reuses no Felicia art (Felicia mode is a tinted variant + her Impreza), and keeps the neon signage English and emoji-free.
- **Settings respected** — SFX volume (v6.7) gates every synthesized layer; the screen-shake toggle gates the BATTLE START punch. Skipping is always available and instant.

## v7.23 Addendum

- **Single entry point preserved** — the incident cinematic wraps `sevBanner`, the one function every critical alert (anomaly, escalation, Friday spike, tree spawn) already calls. No new alert paths; the classic v5.3 banner still appears after every play or skip.
- **Input discipline** — `S.inDialog` is held for the whole cut and restored before the original banner fires; a capture-phase key listener swallows all keys while the overlay lives.
- **Never interrupts** — the wrap refuses to play while a dialog, battle, night mode, or the v7.22 drive cinematic is active; the banner alone fires in those states.
- **Canon art rules hold** — Mike is drawn from the real player atlas (bleed-safe via v7.21); the watcher is a new procedural silhouette; no Felicia art is reused; warning glyphs are drawn shapes, not emoji.
- **Settings respected** — SFX volume (v6.7) gates every synthesized layer; skipping is instant and always available.

## v7.24 Addendum — Ghost in the Boot Drive
- Adds a second cinematic choke point: `checkDayEnd` (resolution) complements v7.23's `sevBanner` (detection). Together they bracket the critical-incident loop: the anomaly opens as a movie, and the day it is cracked closes as one.
- No new clock writers, no new dialog systems: the wrap only observes `s.meta.tree.cracked` (set in `org_hooks.js` root-cause flow) and the existing day-end predicate, then defers to the original chain — `endOfDay()`, EOD rewards, and v56 achievement checks are untouched.
- Once-per-day latch (`s.meta._v724Day`) persists in `S.meta`, so save/load cannot double-fire the cinematic within a day.
- Story continuity: the "2:17 AM" close beat matches the v7.23 watcher clue (UNKNOWN DEVICE) — the repair montage is the same night's incident, seen from the fix side.

## v7.25 Addendum — Interactive Cinematic Pack

- The four boards extend the established cinematic grammar: letterboxed canvas overlay, caption bar, `TECHOPS HERO —` chrome, E/click skip, once-per-day latch persisted in `S.meta` — now with in-scene choices as a first-class mechanic.
- Story continuity: the Day 14 Betrayal Protocol pays off the Day 9 ORPHEUS/CROWN JEWEL discovery and Felicia's Day 8 "saying goodbye" rooftop beat; the Day 14 choice flag is read by The City Beneath the City's epilogue, keeping both branches canon. K debuts inside the Orpheus operations floor before ever appearing in gameplay, matching how the supervisor debuted in v7.24.
- Character rule kept: Felicia is drawn only from her own atlas and only as herself; K (beanie, headphones, shades, green accents) is a new procedural sprite consistent with the chibi pixel-comic reference; Mike always from the real player atlas.
- The coffee/mentor boards are deliberately lighter in palette and stakes (side quest / mentorship) to contrast the Level -17 material, per the reference boards' own tonal split.

## v7.26 Addendum — Story Pack II

- The new boards extend the established grammar through registration, not duplication: `v725.register` keeps one renderer, one input discipline, one skip path, one audio bus. Any future board is data (`{title, shots, cues}`), not code paths.
- Story continuity: Shadows Between the Racks (day 8) is the TRUST beat that makes the Day 14 betrayal land — Felicia's "a group pulling strings from outside this company" seeds the CIO reveal in The City Beneath the City; its three-way choice grants the tooling (Deep Network Map / Emergency Protocols / Counterstrike Toolkit) that the late-game Orpheus takeover presupposes. Promotion Day pays off the command-center arc: the enterprise map becomes a cinematic crisis, and DELEGATE unlocks at the rank the player has earned.
- Rewards discipline: cinematic rewards apply AFTER the end-of-day chain (so EOD adjustments can't clobber them), clamp to real stat rules (HP ≤ maxHp), and are latched exactly-once in `S.meta`.
- Character rule kept: Mike from the real player atlas; Felicia only as herself via her v6.4 atlas; no new reuse — city-life apartment, command center, and world map are procedural props built from the shared kit.

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
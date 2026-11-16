# Fieldcraft qualification — 2026-11-16

Implementation baseline: `e6bd9b8a1eb5c7da749d6a8e50e61bf83f663fd9` (Living World PR #129).
The source-sha256 manifest identifies the implementation tested; this receipt and screenshots are added after qualification.

- Production gate: PASS, 126 suites, including 22 fieldcraft groups and 12 audio groups; syntax check: 636 JavaScript files.
- Browser: PASS, 57 checks (19 each at 1280×800 desktop, 390×844 portrait touch, 844×390 landscape touch). All reports contain empty browser error lists.
- Normal-control opening chapter: PASS using the unmodified campaign browser runner with `LIVING_LIMIT=1`; no injected chapter flags or coordinates.
- Runtime: Node 24.22.1, Playwright 1.55.1, downloaded headless Chromium 140.0.7339.186.
- Visual inspection: portrait settings at 130% text scroll within their panel; mobile field/interaction controls remain separate from movement/combat targets. Screenshots are attached without alteration.

Run `node scripts/production_release_gate.js` and `node scripts/fieldcraft_browser.mjs` to reproduce. Browser fixtures explicitly select later chapters/positions and a stationary combat opponent. This is not an uninterrupted 27-chapter browser playthrough, physical iPhone acceptance, final animation approval, song-stem delivery or release authorization. Existing PR #129 chronology/adaptation findings remain open.

See [implementation and artist handoff](../../production/FIELDCRAFT-EXPANSION.md).

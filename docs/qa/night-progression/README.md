# Night progression acceptance — November 16, 2026

24 browser checks passed (8 per desktop, portrait and landscape), zero page errors. Includes fresh entry, no-point rejection, all stat purchases and a learned skill, 44px settled touch targets, reset cancellation, full reload, actual jump inputs and confirmed free respec. XP and encounter-position fixtures are declared in the runner. Mobile menus use touch; jump checks use keyboard input on all three layouts. No physical-device claim.

127 production suites and syntax checks for 639 files passed. The new progression suite contains 12 contract groups, including real combat contact, corrupt-save rejection, save failure rollback, duplicate rewards, chapter/quiet-scene separation and walking-off-edge behavior. Source fingerprints identify the tested implementation. Screenshots were reviewed after UI transitions settled; the menu scrolls on narrow/short screens.

Commands: `node test_night_progression.js`, `node scripts/production_release_gate.js`, `node scripts/night_progression_browser.mjs`.

Design: [Night progression](../../production/NIGHT-PROGRESSION.md). This candidate is not merged/deployed and has not received a fresh full-campaign or physical-iPhone pass.

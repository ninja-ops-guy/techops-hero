# TechOps Hero — Release Policy

## Product versioning

The public product line is **Production v1.2**. Historical files named `v5x`/`v7xx` are implementation archaeology and compatibility hooks; they are not product versions and must not be used to describe a release candidate.

Release candidate IDs use the form:

`production-v1.2-rc.N + <git SHA>`

A candidate is identified by its exact Git SHA until a tag is deliberately created after physical-device acceptance.

## Save compatibility

The canonical campaign save schema is owned by `campaign_act1.js` and currently uses schema version **6** with storage key `techops_hero_campaign_v1_2`.

Rules:

1. Existing saves must migrate forward without losing authored campaign facts.
2. New canonical snake_case flags remain authoritative; legacy aliases exist only for migration/compatibility.
3. A release that intentionally breaks save compatibility must increment the save schema and document the migration in the production changelog.
4. Acceptance must include at least one reload at authored campaign boundaries and one migrated older save fixture.

## Rollback

The rollback unit is an exact known-good Git SHA/tag, not a historical hook number.

Before tagging a release candidate:

1. record the current known-good production SHA;
2. verify Campaign Contracts and `node scripts/production_release_gate.js` on that SHA;
3. verify Pages deployed the same SHA;
4. retain the preceding accepted SHA as the rollback target;
5. never force-move a published production tag.

## Release evidence

A release candidate requires all of the following on the same SHA:

- aggregate deterministic production gate: PASS;
- GitHub Campaign Contracts: PASS;
- GitHub Pages deployment: PASS;
- iPhone Safari main-campaign acceptance evidence;
- desktop Chromium main-campaign acceptance evidence;
- iPhone Safari Good Boys acceptance evidence;
- no unresolved P0 item in issue #4;
- `KNOWN_ISSUES.md` reviewed and current.

## Branch discipline

`main` is the continuously integrated production line. New numbered hook files are prohibited for production behavior. Fixes should land in stable concern modules (`campaign_*`, `good_boys_*`, `good_dogs_production_runtime.js`, visual/runtime authority modules) and be covered by a deterministic contract.

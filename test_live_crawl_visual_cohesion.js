const assert = require('assert');
const fs = require('fs');

const cohesion = fs.readFileSync('visual_cohesion_live_crawl.js','utf8');
const bootstrap = fs.readFileSync('production_bootstrap.js','utf8');
const nightAssets = fs.readFileSync('night_production_assets.js','utf8');
const goodDogsUi = fs.readFileSync('good_boys_reference_ui_v1.js','utf8');

assert.ok(bootstrap.includes('visual_cohesion_live_crawl.js'), 'production bootstrap must load live-crawl cohesion authority');
assert.ok(bootstrap.includes('VERSION=34'), 'bootstrap version must advance with the new production owner');

assert.ok(cohesion.includes('live-crawl-night #hud'), 'Night mode must explicitly suppress legacy Day HUD');
assert.ok(cohesion.includes('f.pos=null;f.spots=null'), 'Night interaction must mask Felicia day-world targets while delegating');
assert.ok(cohesion.includes('finally{f.pos=pos;f.spots=spots;}'), 'day investigation state must be restored after Night interaction');
assert.ok(cohesion.includes('Math.abs(delta)<64'), 'fresh Good Dogs M1 overlap must be detected');
assert.ok(cohesion.includes('p.x=n.x+dir*84'), 'fresh pair must receive a readable spawn separation');
assert.ok(cohesion.includes('controls-outside-viewport'), 'mobile visual contract must detect clipped controls');
assert.ok(cohesion.includes('board-prompt-clipped'), 'mobile visual contract must detect clipped board prompt');
assert.ok(cohesion.includes('day-ui-visible:'), 'visual contract must detect Day HUD leakage in Night');
assert.ok(cohesion.includes('Math.max(70,Math.min(82'), 'Night Mike scale must be capped to the live-crawl target range');

assert.ok(!/longwharf\s*:\s*"noc_twin"/.test(nightAssets), 'Long Wharf must not use the NOC interior plate');
assert.ok(!/wooster\s*:\s*"music_venue"/.test(nightAssets), 'Wooster must not use the music venue plate');
assert.ok(!/airport\s*:\s*"orbital_gate"/.test(nightAssets), 'Airport must not use the orbital gate plate');
assert.ok(nightAssets.includes('DEFERRED_DISTRICTS'), 'wrong-world districts must be explicitly deferred to their existing fallback');

assert.ok(goodDogsUi.includes('VERSION=2'), 'Good Dogs reference UI must carry the live-crawl recomposition');
assert.ok(goodDogsUi.includes('#good-boys-board-ship'), 'board prompt must be explicitly mobile-sized');
assert.ok(goodDogsUi.includes('transform:scale(.78)'), 'small-phone movement controls must leave more gameplay viewport visible');

console.log('Live-crawl visual cohesion contract: PASS');

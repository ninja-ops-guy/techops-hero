'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const visuals=require('./east_side_visual_assets.js');
assert.equal(visuals.VERSION,1);
assert.equal(visuals.ENV.length,6);
assert.equal(visuals.PORCH.length,7);
assert.equal(visuals.environment(0).id,'bus_stop');
assert.equal(visuals.environment(5).id,'waldo_street');
assert.equal(visuals.porch('knock').src.length,4);
for(const file of Object.values(visuals.FILES)){
  assert.ok(file.startsWith('assets/eastside/'));
  assert.ok(fs.existsSync(file),file+' must exist');
  assert.ok(fs.statSync(file).size>10000,file+' must be a real approved image asset');
}
const boot=fs.readFileSync('bg_noc.js','utf8');
assert.match(boot,/east_side_visual_assets\.js/);
assert.match(boot,/TechOpsEastSideVisualAssets\.preload/);
console.log('EAST SIDE approved visual atlas handoff: PASS');

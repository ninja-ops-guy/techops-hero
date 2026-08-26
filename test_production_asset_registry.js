"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const registry=fs.readFileSync("production_asset_registry.js","utf8");
const bootstrap=fs.readFileSync("production_bootstrap.js","utf8");
const html=fs.readFileSync("index.html","utf8");

// Execute registry in a minimal browser-like VM so we validate the exported inventory,
// not a hand-maintained duplicate list in this test.
const context={console,Promise,Image:function(){},fetch:null,document:{scripts:[],head:{appendChild(){}},documentElement:{appendChild(){}},createElement(){return{dataset:{},getAttribute(){return"";}};}}};
context.globalThis=context;vm.createContext(context);vm.runInContext(registry,context,{filename:"production_asset_registry.js"});
const api=context.TechOpsProductionAssets;assert.ok(api,"production asset registry must export TechOpsProductionAssets");assert.strictEqual(api.VERSION,1);

for(const src of [...api.SCRIPT_ASSETS,...api.SOURCE_PARTS,...api.PNG_ASSETS,...api.JSON_ASSETS]){
  assert.ok(fs.existsSync(src),`production asset registry references missing file: ${src}`);
}
assert.ok(api.PNG_ASSETS.length>=70,"expected the full campaign + Katrin/Manchez physical PNG inventory");
assert.ok(api.SOURCE_PARTS.length>=50,"expected all campaign background/UI payload chunks");
assert.ok(api.SCRIPT_ASSETS.includes("night_walker.atlas.js"));
assert.ok(api.SCRIPT_ASSETS.includes("orbital_tiles.atlas.js"));
assert.ok(api.SCRIPT_ASSETS.includes("weather_ov.atlas.js"));
assert.ok(api.SCRIPT_ASSETS.includes("warden.atlas.js"));
assert.ok(api.SCRIPT_ASSETS.includes("waldo_full.atlas.js"));
assert.ok(api.SCRIPT_ASSETS.includes("campaign_ui.atlas.js"));
assert.ok(api.PNG_ASSETS.includes("assets/v736/katrin_manchez_atlas.png"));
assert.ok(api.PNG_ASSETS.includes("assets/campaign/sector04.locked_violin_door.png"));
assert.ok(api.PNG_ASSETS.includes("assets/campaign/workstation.felicia.video_frame.png"));
for(let i=1;i<=33;i++) assert.ok(api.SOURCE_PARTS.includes(`parts/campaign_ui_camp_ui_p${String(i).padStart(3,"0")}.js`),`missing campaign UI payload part ${i}`);

// Every root-level atlas/reference art authority must either be parser-loaded already
// or explicitly loaded by the production registry. This prevents new art from silently
// landing in the repository without becoming part of the shipped runtime.
const rootFiles=fs.readdirSync(".").filter(f=>fs.statSync(f).isFile());
const candidates=rootFiles.filter(f=>/\.(atlas\.js)$/.test(f)||/(reference_v\d+\.js|animation_manifest\.js)$/.test(f));
for(const f of candidates){
  const parserLoaded=html.includes(`src="${f}"`);
  const registryLoaded=api.SCRIPT_ASSETS.includes(f);
  assert.ok(parserLoaded||registryLoaded,`unintegrated root asset authority: ${f}`);
}

// Bootstrap must install the registry before Night/Good Boys authority wrappers.
assert.ok(bootstrap.includes("production_asset_registry.js"));
assert.ok(bootstrap.indexOf("production_asset_registry.js")<bootstrap.indexOf("night_production_assets.js"),"asset registry must load before Night production visuals");
assert.ok(bootstrap.includes("TechOpsProductionAssets.install()"),"bootstrap must install complete asset registry");
assert.ok(/VERSION=2/.test(bootstrap),"production bootstrap v2 contract missing");

console.log(`Production asset integration: PASS (${api.PNG_ASSETS.length} PNGs, ${api.SOURCE_PARTS.length} payload parts, ${api.SCRIPT_ASSETS.length} asset authorities)`);

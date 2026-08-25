const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const world = fs.readFileSync('campaign_world_visuals.js', 'utf8');
const dogs = fs.readFileSync('dogs.js', 'utf8');
const mobileGuard = fs.readFileSync('good_boys_mobile_launch_guard.js', 'utf8');
const modeRouter = fs.readFileSync('production_mode_router.js', 'utf8');
const runtimeSafety = fs.readFileSync('production_runtime_safety.js', 'utf8');
const wrapperGuard = fs.readFileSync('production_wrapper_guard.js', 'utf8');
function has(s){assert.ok(html.includes(s),`missing mobile production marker: ${s}`);}
function script(src){return html.indexOf(`<script src="${src}"></script>`);}

['width=device-width','maximum-scale=1.0','user-scalable=no','viewport-fit=cover','apple-mobile-web-app-capable','mobile-web-app-capable'].forEach(has);
has('<title>TechOps Hero — Production v1.2</title>');
has('PRODUCTION v1.2 // GHOST FREQUENCY');
assert.ok(!html.includes('<title>TechOps Hero v7.37</title>'),'stale v7.37 page title returned');
['game','hud','hud-clock','dialogue','dlg-options','touch-ui','dpad','tb-interact','tb-menu'].forEach(id=>has(`id="${id}"`));
has('WASD / ARROWS OR JOYSTICK TO MOVE · E / Ⓐ TO INTERACT');

const requiredScripts=['campaign_act1.js','campaign_act2.js','campaign_assets.js','campaign_scene_schema.js','campaign_runtime.js','campaign_sector04.js','campaign_sector04_runtime.js','campaign_visual_direction.js','campaign_native_act1.js','campaign_native_act2.js','campaign_world_visuals.js'];
requiredScripts.forEach(src=>assert.notStrictEqual(script(src),-1,`${src} missing from mobile tester`));
const legacy=script('v737_hooks.js'), worldIndex=script('campaign_world_visuals.js'), act1=script('campaign_act1.js');
assert.ok(legacy < worldIndex,'stable playable-world presentation must load after legacy hooks');
assert.ok(worldIndex < act1,'world presentation may bootstrap before semantic campaign authority; it must not overwrite campaign state');
assert.ok(script('campaign_sector04_runtime.js') < script('campaign_native_act1.js'),'native Act I must load after Sector 04 bridge');

['safe-area-inset-top','safe-area-inset-bottom','safe-area-inset-left','safe-area-inset-right','#hud-top','#dialogue','#dpad','#touch-buttons','min-height:44px'].forEach(marker=>assert.ok(world.includes(marker),`mobile safe-area/touch contract missing ${marker}`));
['night_walker_reference_v1.js','night_reference_visuals.js','loadNightReference'].forEach(marker=>assert.ok(world.includes(marker),`Night reference bootstrap missing ${marker}`));

assert.ok(script('dogs.js') !== -1,'dogs.js must be present in deployed entrypoint');
assert.ok(dogs.includes('__techopsLexicalBridgeVersion=1'),'dogs.js must bridge lexical runtime state for production modules');
assert.ok(dogs.includes('good_boys_mobile_launch_guard.js?v=4'),'dogs.js must cache-bust Good Boys mobile launch guard v4');
assert.ok(dogs.includes('production_mode_router.js?v=3'),'dogs.js must bootstrap cache-busted production mode router v3');
assert.ok(dogs.includes('production_runtime_safety.js?v=1'),'dogs.js must bootstrap production runtime safety');
assert.ok(dogs.includes('production_wrapper_guard.js?v=1'),'dogs.js must bootstrap stable Night draw/step compositor');
['VERSION=4','function state()','function world()','pairReady','installStartGuard','resume_pair_missing','RETRY CO-OP HANDOFF','pair_attach_failed','mobile_night_handoff_timeout'].forEach(marker=>assert.ok(mobileGuard.includes(marker),`Good Boys mobile recovery contract missing ${marker}`));
assert.ok(!mobileGuard.includes('root.S&&root.S.nightMode'),'Good Boys guard cannot inspect lexical S via window/root');
assert.ok(!mobileGuard.includes('root.NM&&root.NM._v736'),'Good Boys guard cannot inspect lexical NM via window/root');
['VERSION=3','function state()','function world()','clearErrors','launchNightCrawler','launchGoodBoys','enterNightReliably','good_boys_pair_timeout'].forEach(marker=>assert.ok(modeRouter.includes(marker),`Production mode router missing ${marker}`));
['VERSION=1','safeDraw','safeStep','NIGHT RUNTIME RECOVERY','__nightRuntimeRenderError','__nightRuntimeStepError'].forEach(marker=>assert.ok(runtimeSafety.includes(marker),`Production runtime safety missing ${marker}`));
assert.ok(!runtimeSafety.includes('root.S')&&!runtimeSafety.includes('root.NM'),'Runtime safety must use lexical S/NM');
['VERSION=1','__productionStableCompositor','__goodDogsHud','__goodBoysCanon','__goodBoysGameplayLoop','drawFeatures','stepFeatures'].forEach(marker=>assert.ok(wrapperGuard.includes(marker),`Stable wrapper guard missing ${marker}`));

has('auto_play=false');
has('allow="autoplay"');
console.log('Mobile production tester contract: PASS');

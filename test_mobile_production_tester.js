const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const world = fs.readFileSync('campaign_world_visuals.js', 'utf8');
const dogs = fs.readFileSync('dogs.js', 'utf8');
const bgNoc = fs.readFileSync('bg_noc.js', 'utf8');
const mobileGuard = fs.readFileSync('good_boys_mobile_launch_guard.js', 'utf8');
const modeRouter = fs.readFileSync('production_mode_router.js', 'utf8');
const runtimeSafety = fs.readFileSync('production_runtime_safety.js', 'utf8');
const wrapperGuard = fs.readFileSync('production_wrapper_guard.js', 'utf8');
const bootstrap = fs.readFileSync('production_bootstrap.js', 'utf8');
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
assert.ok(dogs.includes('__techopsLexicalBridgeVersion=3'),'dogs.js must expose current lexical runtime bridge v3');
['bridge("S"','bridge("NM"','bridge("ctx"','bridge("NM_DISTRICTS"','__techopsPreProductionDrawNM','__techopsPreProductionStepNM'].forEach(marker=>assert.ok(dogs.includes(marker),`dogs.js lexical bridge missing ${marker}`));
assert.ok(dogs.includes('production_bootstrap') && dogs.includes('sole authority'),'dogs.js must defer post-parser production loading to bootstrap');
assert.ok(!dogs.includes('good_boys_mobile_launch_guard.js?v='),'dogs.js must not dynamically load production guards');

assert.ok(bgNoc.includes('__techopsFinalParserDrawNM')&&bgNoc.includes('__techopsFinalParserStepNM'),'bootstrap entrypoint must snapshot final parser Night chain');
assert.ok(bgNoc.includes('snapshotParserChain();'),'final parser snapshot must occur immediately before bootstrap injection');

const mobileGuardVersion=Number((mobileGuard.match(/var\s+VERSION\s*=\s*(\d+)/)||[])[1]||0);
assert.ok(mobileGuardVersion>=7,`Good Boys mobile launch guard must retain v7+ cinematic handoff protection (found v${mobileGuardVersion})`);
['function state()','function world()','pairReady','installStartGuard','resume_pair_missing','RETRY CO-OP HANDOFF','pair_attach_failed','mobile_night_handoff_timeout','introVisible'].forEach(marker=>assert.ok(mobileGuard.includes(marker),`Good Boys mobile recovery contract missing ${marker}`));
assert.ok(mobileGuard.includes('Wrapper installation is one-shot'),'mobile watchdog must preserve one-shot wrapper installation');
assert.ok(mobileGuard.includes('every authored Good Boys cinematic as a hard handoff blocker'),'v7+ mobile guard must block Night priming beneath authored cinematics');
assert.ok(!mobileGuard.includes('root.S&&root.S.nightMode'),'Good Boys guard cannot inspect lexical S via window/root');
assert.ok(!mobileGuard.includes('root.NM&&root.NM._v736'),'Good Boys guard cannot inspect lexical NM via window/root');

const modeRouterVersion=Number((modeRouter.match(/var\s+VERSION\s*=\s*(\d+)/)||[])[1]||0);
assert.ok(modeRouterVersion>=7,`Production mode router must retain v7+ single-authority Good Boys launch routing (found v${modeRouterVersion})`);
['function state()','function world()','clearErrors','launchNightCrawler','launchGoodBoys','enterNightReliably','good_boys_pair_timeout','never calls feature tick()','defers authored Good Boys title-button launches to the campaign director'].forEach(marker=>assert.ok(modeRouter.includes(marker),`Production mode router missing ${marker}`));

assert.ok(/var VERSION=2/.test(runtimeSafety),'Production runtime safety must be v2');
['function state()','function world()','NIGHT RUNTIME RECOVERY','__nightRuntimeRenderError','__nightRuntimeStepError','ensureVisible'].forEach(marker=>assert.ok(runtimeSafety.includes(marker),`Production runtime safety missing ${marker}`));
assert.ok(!runtimeSafety.includes('root.S')&&!runtimeSafety.includes('root.NM'),'Runtime safety must use lexical S/NM');

const compositorVersion = Number((wrapperGuard.match(/var\s+VERSION\s*=\s*(\d+)/)||[])[1]||0);
assert.ok(compositorVersion >= 7,'Stable compositor authority must retain v7+ immutable single-owner architecture');
['__productionStableCompositor','__goodDogsHud','__goodBoysCanon','__goodBoysGameplayLoop','drawFeatureLayers','stepFeatureLayers','globalDrawAligned','globalStepAligned','__productionSingleCompositor','__techopsFinalParserDrawNM','baseSource','repairStaleDialog'].forEach(marker=>assert.ok(wrapperGuard.includes(marker),`Stable compositor guard missing ${marker}`));
assert.ok(bootstrap.indexOf('production_wrapper_guard.js') < bootstrap.indexOf('good_dogs_production_runtime.js'),'stable compositor must load before feature runtime wrappers');

has('auto_play=false');
has('allow="autoplay"');
console.log('Mobile production tester contract: PASS');
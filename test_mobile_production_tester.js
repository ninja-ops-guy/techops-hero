const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const world = fs.readFileSync('campaign_world_visuals.js', 'utf8');
function has(s){assert.ok(html.includes(s),`missing mobile production marker: ${s}`);}
function script(src){return html.indexOf(`<script src="${src}"></script>`);}

['width=device-width','maximum-scale=1.0','user-scalable=no','viewport-fit=cover','apple-mobile-web-app-capable','mobile-web-app-capable'].forEach(has);
has('<title>TechOps Hero — Production v1.2</title>');
has('PRODUCTION v1.2 // GHOST FREQUENCY');
assert.ok(!html.includes('<title>TechOps Hero v7.37</title>'),'stale v7.37 page title returned');
['game','hud','hud-clock','dialogue','dlg-options','touch-ui','dpad','tb-interact','tb-menu'].forEach(id=>has(`id="${id}"`));
has('WASD / ARROWS OR JOYSTICK TO MOVE · E / Ⓐ TO INTERACT');

const requiredScripts=['campaign_act1.js','campaign_act2.js','campaign_assets.js','campaign_scene_schema.js','campaign_runtime.js','campaign_sector04.js','campaign_sector04_runtime.js','campaign_visual_direction.js','campaign_native_act1.js','campaign_native_act1_visuals.js','campaign_native_act2.js','mike_animation_manifest.js','campaign_world_visuals.js'];
requiredScripts.forEach(src=>assert.notStrictEqual(script(src),-1,`${src} missing from mobile tester`));
assert.ok(script('v737_hooks.js')<script('campaign_act1.js'),'canonical campaign authority must load after legacy hooks');
assert.ok(script('campaign_native_act1.js')<script('campaign_world_visuals.js'),'world presentation must load after native Act I');

// iPhone notches/home indicators: runtime production layer must protect HUD, dialogue and both control clusters.
['safe-area-inset-top','safe-area-inset-bottom','safe-area-inset-left','safe-area-inset-right','#hud-top','#dialogue','#dpad','#touch-buttons','min-height:44px'].forEach(marker=>assert.ok(world.includes(marker),`mobile safe-area/touch contract missing ${marker}`));

has('auto_play=false');
has('allow="autoplay"');
console.log('Mobile production tester contract: PASS');

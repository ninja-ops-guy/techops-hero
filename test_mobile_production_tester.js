const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

function has(s) { assert.ok(html.includes(s), `missing mobile production marker: ${s}`); }
function script(src) { return html.indexOf(`<script src="${src}"></script>`); }

// iPhone/Safari viewport and installability contract.
has('width=device-width');
has('maximum-scale=1.0');
has('user-scalable=no');
has('viewport-fit=cover');
has('apple-mobile-web-app-capable');
has('mobile-web-app-capable');

// Production identity must not regress to the old v7.37 tester build.
has('<title>TechOps Hero — Production v1.2</title>');
has('PRODUCTION v1.2 // GHOST FREQUENCY');
assert.ok(!html.includes('<title>TechOps Hero v7.37</title>'), 'stale v7.37 page title returned');

// Required touch surface and dialogue/HUD layers.
['game','hud','hud-clock','dialogue','dlg-options','touch-ui','dpad','tb-interact','tb-menu'].forEach(id => has(`id="${id}"`));
has('WASD / ARROWS OR JOYSTICK TO MOVE · E / Ⓐ TO INTERACT');

// Current production modules must be in the deployed static entrypoint.
const requiredScripts = [
  'campaign_act1.js',
  'campaign_act2.js',
  'campaign_assets.js',
  'campaign_scene_schema.js',
  'campaign_runtime.js',
  'campaign_sector04.js',
  'campaign_sector04_runtime.js',
  'campaign_visual_direction.js',
  'campaign_native_act1.js',
  'campaign_native_act1_visuals.js',
  'campaign_native_act2.js',
  'mike_animation_manifest.js',
  'campaign_world_visuals.js'
];
requiredScripts.forEach(src => assert.notStrictEqual(script(src), -1, `${src} missing from mobile tester`));
assert.ok(script('v737_hooks.js') < script('campaign_act1.js'), 'canonical campaign authority must load after legacy hooks');
assert.ok(script('campaign_native_act1.js') < script('campaign_world_visuals.js'), 'world presentation must load after native Act I');

// Mobile CSS must contain safe-area-aware layout and touch affordances.
assert.ok(/env\(safe-area-inset-(top|bottom|left|right)/.test(css), 'mobile CSS must use safe-area insets');
assert.ok(css.includes('#touch-ui'), 'touch UI CSS missing');
assert.ok(css.includes('#dpad'), 'dpad CSS missing');
assert.ok(css.includes('.tbtn'), 'touch button CSS missing');

// Audio iframe remains non-blocking and autoplay is not forced on page load.
has('auto_play=false');
has('allow="autoplay"');

console.log('Mobile production tester contract: PASS');

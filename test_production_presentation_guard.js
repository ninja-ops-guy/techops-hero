'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const delivered = [], handlers = {}, attrs = {};
let clicks = 0;
const phone = {
  setAttribute(key, value) { attrs[key] = value; },
  getAttribute(key) { return attrs[key] || null; },
  addEventListener(key, fn) { assert.equal(handlers[key], undefined, 'one keyboard handler per control'); handlers[key] = fn; },
  click() { clicks++; }
};
const context = {
  S: { meta: { _standaloneMode: 'gooddogs' } },
  toast(...args) { delivered.push(args); },
  document: { getElementById(id) { return id === 'v54-phone' ? phone : null; } },
  setInterval() { return 1; }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('production_presentation_guard.js', 'utf8'), context);
context.toast('Double-tap left/right to DASH. ATTACK after dash to grab', 5200);
assert.equal(delivered.length, 0, 'inherited Night hint cannot flash before the presentation poll');
context.toast('CELL 118 — verify K before opening the cell', 2400);
assert.equal(delivered.length, 1, 'Good Dogs narrative messages remain visible');
context.S.meta = { _char: 'nightcrawler' };
context.toast('Double-tap left/right to DASH. ATTACK after dash to grab', 5200);
assert.equal(delivered.length, 2, 'Night retains its own control tutorial');
context.TechOpsProductionPresentationGuard.clean();
context.TechOpsProductionPresentationGuard.clean();
assert.equal(attrs.role, 'button');
assert.equal(attrs.tabindex, '0');
assert.equal(attrs['data-control-label'], 'COMMS');
assert.equal(attrs['aria-label'], 'Open team communications');
for (const key of ['Enter', ' ']) {
  let prevented = 0, stopped = 0;
  handlers.keydown({ key, preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
  assert.equal(prevented, 1);
  assert.equal(stopped, 1, 'focused communications control cannot leak Space to world jump');
}
handlers.keydown({ key: 'ArrowLeft' });
assert.equal(clicks, 2, 'Enter/Space activate once; unrelated keys do not');
// The visual bridge delegates text animation, but must retire the previous
// click-to-complete callback before the next dialogue takes ownership.
{
  const copy = { textContent: '', onclick: null };
  const speech = {
    document: { body: null, getElementById(id) { return id === 'dlg-text' ? copy : null; } },
    dlg(name, text) {
      copy.textContent = text;
      if (!text.includes('<')) copy.onclick = () => { copy.textContent = text; };
    }
  };
  speech.globalThis = speech;
  vm.createContext(speech);
  vm.runInContext(fs.readFileSync('campaign_native_act1_visuals_impl.js', 'utf8'), speech);
  speech.dlg('FIRST', 'An unfinished typewriter sentence');
  assert.equal(typeof copy.onclick, 'function', 'current typewriter keeps its completion behavior');
  speech.dlg('NEXT', '<b>Current workstation content</b>');
  assert.equal(copy.onclick, null, 'old typewriter handler cannot corrupt the next rich dialogue');
  assert.equal(copy.textContent, '<b>Current workstation content</b>');
}
// Mobile styling and cinematic visibility used to race every 100ms/80ms.
// Interleave those actual owners in both orders, with and without a modal.
{
  const source = fs.readFileSync('good_dogs_mobile_visual_polish.js', 'utf8');
  assert.doesNotMatch(source, /root\.__goodBoysHideHud\s*=/, 'mobile styling cannot resurrect blanket HUD suppression');
  const classes = {};
  const mobile = {
    NM: { _v736: {} }, S: { inDialog: false, meta: { _v736: {} } }, innerWidth: 390,
    document: {
      createElement() { return {}; },
      head: { appendChild() {} },
      body: { classList: { toggle(name, value) { classes[name] = value; } } },
      getElementById() { return null; }, querySelectorAll() { return []; }
    },
    setInterval() { return 1; }
  };
  mobile.globalThis = mobile;
  vm.createContext(mobile);
  vm.runInContext(source, mobile);
  vm.runInContext(fs.readFileSync('good_boys_cinematic_ui_guard.js', 'utf8'), mobile);
  for (const width of [390, 1280, 320]) {
    mobile.innerWidth = width;
    for (const blocked of [false, true, false]) {
      mobile.S.inDialog = blocked;
      mobile.TechOpsGoodBoysCinematicUiGuard.apply();
      mobile.TechOpsGoodDogsMobileVisualPolish.apply();
      assert.equal(mobile.__goodBoysHideHud, blocked, 'viewport polling preserves actual cinematic state');
      mobile.TechOpsGoodDogsMobileVisualPolish.apply();
      mobile.TechOpsGoodBoysCinematicUiGuard.apply();
      assert.equal(mobile.__goodBoysHideHud, blocked, 'owner ordering cannot flicker the canonical HUD');
      assert.equal(classes['good-boys-ui-blocked'], blocked);
    }
  }
  assert.equal(classes['good-dogs-active'], true, 'mobile class/style ownership remains intact');
}
console.log('Production presentation ownership and keyboard controls: PASS');

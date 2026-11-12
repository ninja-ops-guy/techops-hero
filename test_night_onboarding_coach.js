// test_night_onboarding_coach.js — contract suite for night_onboarding_coach.js.
// Run: node test_night_onboarding_coach.js  (exit 0 = all contracts hold)
"use strict";
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const SRC = fs.readFileSync(path.join(__dirname, "night_onboarding_coach.js"), "utf8");
let failures = 0;
function check(name, cond) {
  if (cond) { console.log("  ok — " + name); }
  else { failures++; console.error("  FAIL — " + name); }
}

function makeSandbox(opts) {
  opts = opts || {};
  const listeners = { document: {} };
  const documentObj = {
    addEventListener: function (ev, fn) { (listeners.document[ev] = listeners.document[ev] || []).push(fn); },
  };
  const windowObj = { addEventListener: function () { } };
  const sandbox = {
    window: windowObj,
    document: documentObj,
    performance: { now: () => (sandbox.__now != null ? sandbox.__now : 1000) },
    console,
  };
  if (opts.S) sandbox.S = opts.S;
  if (opts.step) sandbox.step = opts.step;
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return {
    sandbox,
    coach: sandbox.window.TechOpsNightCoach,
    fireDOMContentLoaded: () => (listeners.document.DOMContentLoaded || []).forEach(f => f()),
  };
}

function mkNM(over) {
  return Object.assign({ x: 200, w: 22, enemies: [], clear: false, msg: "", msgT: 0 }, over || {});
}

// 1. Module surface.
{
  const { coach } = makeSandbox({});
  check("TechOpsNightCoach exposed with HINTS/tick/reset",
    !!coach && Array.isArray(coach.HINTS) && coach.HINTS.length === 5 &&
    typeof coach.tick === "function" && typeof coach.reset === "function");
}

// 2. First night tick -> movement hint, once.
{
  const NM = mkNM();
  const { coach } = makeSandbox({});
  coach.tick(NM);
  check("first tick shows movement hint", /WASD/.test(NM.msg) && NM.msgT > 1000);
  NM.msg = ""; NM.msgT = 0;
  coach.tick(NM);
  check("movement hint does not repeat", NM.msg === "");
}

// 3. Enemy within 200px -> attack/rhythm hint.
{
  const NM = mkNM({ enemies: [{ alive: true, x: 300, w: 24, windup: 0 }] });
  const { coach } = makeSandbox({});
  coach.tick(NM); // move hint
  NM.msgT = 0;
  coach.tick(NM);
  check("nearby enemy triggers attack hint", /E to punch/.test(NM.msg));
}

// 4. Charging enemy (windup >= 8) -> block/dash hint, with priority over attack.
{
  const NM = mkNM({ enemies: [{ alive: true, x: 280, w: 24, windup: 9 }] });
  const { coach } = makeSandbox({});
  coach.tick(NM); // move
  NM.msgT = 0;
  coach.tick(NM);
  check("charging enemy triggers defend hint (priority over attack)", /charging/.test(NM.msg));
}

// 5. Street clear -> exit hint.
{
  const NM = mkNM({ clear: true });
  const { coach } = makeSandbox({});
  coach.tick(NM); // move
  NM.msgT = 0;
  coach.tick(NM);
  check("cleared street triggers exit hint", /Street clear/.test(NM.msg));
}

// 6. Near the Charger with no live enemy close -> drive hint.
{
  const NM = mkNM({ x: 100, enemies: [{ alive: true, x: 900, w: 24, windup: 0 }] });
  const { coach } = makeSandbox({});
  coach.tick(NM); // move
  NM.msgT = 0;
  coach.tick(NM);
  check("near Charger, no threat -> drive hint", /Charger/.test(NM.msg));
}

// 7. Drive hint suppressed while a live enemy is within 90px of the car area.
{
  const NM = mkNM({ x: 100, enemies: [{ alive: true, x: 150, w: 24, windup: 0 }] });
  const { coach } = makeSandbox({});
  coach.tick(NM); // move
  NM.msgT = 0;
  coach.tick(NM); // enemy within 200 -> attack hint instead
  check("threat near car -> attack hint, not drive hint", /E to punch/.test(NM.msg));
}

// 8. Politeness: a live message (msgT in future) is never stomped; the hint
//    stays pending and lands once the message expires.
{
  const NM = mkNM({ msg: "💥 Street Thug hits you!", msgT: 5000, enemies: [{ alive: true, x: 300, w: 24, windup: 0 }] });
  const { coach, sandbox } = makeSandbox({});
  coach.tick(NM); // move hint blocked by live message
  check("live message not stomped", NM.msg === "💥 Street Thug hits you!");
  check("blocked hint stays pending (not marked shown)", !NM._coachHints || !NM._coachHints.move);
  sandbox.__now = 6000; // message expires
  coach.tick(NM);
  check("pending hint lands after expiry", /WASD/.test(NM.msg));
}

// 9. New night (new NM object) resets the coach automatically; reset() also works.
{
  const NM1 = mkNM();
  const { coach } = makeSandbox({});
  coach.tick(NM1);
  const NM2 = mkNM();
  coach.tick(NM2);
  check("new NM object gets fresh hints", /WASD/.test(NM2.msg));
  coach.reset(NM1);
  NM1.msg = ""; NM1.msgT = 0;
  coach.tick(NM1);
  check("reset() re-arms hints on the same NM", /WASD/.test(NM1.msg));
}

// 10. TechOpsNightCombat active -> coach stays out of the way.
{
  const NM = mkNM();
  const { coach, sandbox } = makeSandbox({});
  sandbox.window.TechOpsNightCombat = { active: () => true };
  coach.tick(NM);
  check("night combat active -> no hints", NM.msg === "" && NM._coachHints === undefined);
}

// 11. step wrapper integration + load-order independence.
{
  const NM = mkNM();
  const env = makeSandbox({ S: { nightMode: NM } });
  env.sandbox.step = function () { }; // step defined AFTER module load
  env.fireDOMContentLoaded();
  env.sandbox.step(0.016);
  check("late-bound step wrapped via DOMContentLoaded -> move hint", /WASD/.test(NM.msg));
}

// 12. Safe no-op outside a browser environment.
{
  const sandbox = { console };
  vm.createContext(sandbox);
  let threw = false;
  try { vm.runInContext(SRC, sandbox); } catch (e) { threw = true; }
  check("loads cleanly without window", !threw && sandbox.window === undefined);
}

console.log(failures ? `\n${failures} contract(s) FAILED` : "\nAll contracts passed");
process.exit(failures ? 1 : 0);

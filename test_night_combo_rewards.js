// test_night_combo_rewards.js — contract suite for night_combo_rewards.js.
// Run: node test_night_combo_rewards.js  (exit 0 = all contracts hold)
"use strict";
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const SRC = fs.readFileSync(path.join(__dirname, "night_combo_rewards.js"), "utf8");
let failures = 0;
function check(name, cond) {
  if (cond) { console.log("  ok — " + name); }
  else { failures++; console.error("  FAIL — " + name); }
}

// Build an isolated browser-ish sandbox. Globals (S, nmJab, step, sfx) are
// installed per scenario so each contract gets a clean runtime.
function makeSandbox(opts) {
  opts = opts || {};
  const listeners = { document: {}, window: {} };
  const documentObj = {
    addEventListener: function (ev, fn) { (listeners.document[ev] = listeners.document[ev] || []).push(fn); },
  };
  const windowObj = {
    addEventListener: function (ev, fn) { (listeners.window[ev] = listeners.window[ev] || []).push(fn); },
  };
  const sandbox = {
    window: windowObj,
    document: documentObj,
    performance: { now: () => 1000 },
    console,
  };
  if (opts.S) sandbox.S = opts.S;
  if (opts.nmJab) sandbox.nmJab = opts.nmJab;
  if (opts.step) sandbox.step = opts.step;
  if (opts.sfx) sandbox.sfx = opts.sfx;
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return { sandbox, listeners, fireDOMContentLoaded: () => (listeners.document.DOMContentLoaded || []).forEach(f => f()) };
}

// 1. tierFor thresholds (boundary-exact).
{
  const { sandbox } = makeSandbox({});
  const t = sandbox.window.TechOpsComboRewards.tierFor;
  check("tierFor exposed on window.TechOpsComboRewards", typeof t === "function");
  check("combo 0/4 -> no tier", t(0) === null && t(4) === null);
  check("combo 5/7 -> x1.5", t(5).mult === 1.5 && t(7).mult === 1.5);
  check("combo 8/11 -> x2", t(8).mult === 2 && t(11).mult === 2);
  check("combo 12/30 -> x3", t(12).mult === 3 && t(30).mult === 3);
}

// 2. Kill at tier pays the bonus and announces it.
{
  const NM = { kills: 0, cash: 0, combo: 8 };
  const S = { nightMode: NM };
  const nmJab = function () { NM.kills++; NM.cash += 20; };
  const { sandbox } = makeSandbox({ S, nmJab });
  sandbox.nmJab();
  check("ON FIRE x2: $20 kill -> +$20 bonus (cash 40)", NM.cash === 40);
  check("bonus announced via NM.msg", /ON FIRE/.test(NM.msg) && /\+\$20/.test(NM.msg));
  check("msgT set into the future", NM.msgT > 1000);
}

// 3. Kill below tier pays no bonus.
{
  const NM = { kills: 0, cash: 0, combo: 2 };
  const nmJab = function () { NM.kills++; NM.cash += 20; };
  const { sandbox } = makeSandbox({ S: { nightMode: NM }, nmJab });
  sandbox.nmJab();
  check("combo 2 kill -> no bonus (cash 20)", NM.cash === 20);
}

// 4. Non-kill jab pays no bonus.
{
  const NM = { kills: 0, cash: 0, combo: 12 };
  const nmJab = function () { /* whiff */ };
  const { sandbox } = makeSandbox({ S: { nightMode: NM }, nmJab });
  sandbox.nmJab();
  check("whiff at combo 12 -> cash untouched", NM.cash === 0 && NM.kills === 0);
}

// 5. Load-order independence: module loads before nmJab exists; the wrap lands
//    on DOMContentLoaded and still pays out.
{
  const NM = { kills: 0, cash: 0, combo: 12 };
  const env = makeSandbox({ S: { nightMode: NM } });
  env.sandbox.nmJab = function () { NM.kills++; NM.cash += 10; };
  env.fireDOMContentLoaded();
  env.sandbox.nmJab();
  check("late-bound nmJab wrapped via DOMContentLoaded (x3: +$20 bonus)", NM.cash === 30);
}

// 6. Combo break: a hit at combo >= 3 resets the streak with a message.
{
  const NM = { kills: 0, cash: 0, combo: 6, jabStage: 2, hp: 100 };
  const step = function () { NM.hp -= 10; };
  const { sandbox } = makeSandbox({ S: { nightMode: NM }, step });
  sandbox.step(0.016);
  check("hit at combo 6 -> combo/jabStage reset", NM.combo === 0 && NM.jabStage === 0);
  check("COMBO BROKEN message shown", /COMBO BROKEN/.test(NM.msg));
}

// 7. No break below combo 3.
{
  const NM = { kills: 0, cash: 0, combo: 2, jabStage: 1, hp: 100 };
  const step = function () { NM.hp -= 10; };
  const { sandbox } = makeSandbox({ S: { nightMode: NM }, step });
  sandbox.step(0.016);
  check("hit at combo 2 -> streak kept", NM.combo === 2 && NM.jabStage === 1);
}

// 8. TechOpsNightCombat owns combat -> break rule stays out of the way.
{
  const NM = { kills: 0, cash: 0, combo: 9, jabStage: 1, hp: 100 };
  const step = function () { NM.hp -= 10; };
  const env = makeSandbox({ S: { nightMode: NM }, step });
  env.sandbox.window.TechOpsNightCombat = { active: () => true };
  env.sandbox.step(0.016);
  check("night combat active -> no forced break", NM.combo === 9 && NM.jabStage === 1);
}

// 9. Safe no-op outside a browser environment (no window).
{
  const sandbox = { console };
  vm.createContext(sandbox);
  let threw = false;
  try { vm.runInContext(SRC, sandbox); } catch (e) { threw = true; }
  check("loads cleanly without window", !threw && sandbox.window === undefined);
}

console.log(failures ? `\n${failures} contract(s) FAILED` : "\nAll contracts passed");
process.exit(failures ? 1 : 0);

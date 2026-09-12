"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const read = file => fs.readFileSync(file, "utf8");
const progressionSource = read("good_boys_progression_authority.js");
const titleSource = read("good_boys_button_hard_fix.js");
const validatorSource = read("state_validator.js");
const v736Source = read("v736_hooks.js");
const gameSource = read("game.js");

for (const source of [progressionSource, titleSource, validatorSource, v736Source]) {
  assert.doesNotThrow(() => new Function(source));
}
assert.ok(gameSource.includes("window.__techopsSaveError"), "base save failures must be observable");
assert.ok(gameSource.includes("return true;") && gameSource.includes("return false;"), "base save must expose an explicit boolean contract");
assert.ok(v736Source.includes("resumeState = JSON.parse(JSON.stringify(options.state))"), "v736 must clone a durable state before replacing S");
assert.ok(v736Source.includes("Object.assign(mt, campaign)"), "v736 must restore the complete Good Dogs campaign snapshot");

{
  const match = gameSource.match(/const save = \(\) => \{[\s\S]*?\n\};\nconst load/);
  assert.ok(match, "canonical save implementation must remain directly testable");
  let writes = 0, reject = false, throwWrite = false;
  const context = {
    S: { day: 1, meta: {}, certs: [], inv: [], journal: [], stats: {}, soft: {}, rep: {}, ach: [], books: [], lab: [], staff: [], infra: [] },
    localStorage: { setItem() { if (throwWrite) throw new Error("quota"); writes++; } },
    TechOpsStateValidator: { assertBeforeSave() { return !reject; } }
  };
  context.window = context;
  vm.runInNewContext(match[0].replace(/\nconst load$/, "") + "\nthis.testSave=save;", context);
  assert.strictEqual(context.testSave(), true, "successful storage writes must return true");
  assert.strictEqual(writes, 1);
  reject = true;
  assert.strictEqual(context.testSave(), false, "validator refusal must return false");
  assert.strictEqual(writes, 1, "validator refusal must not write storage");
  reject = false; throwWrite = true;
  assert.strictEqual(context.testSave(), false, "storage exceptions must return false");
  assert.match(context.__techopsSaveError, /quota/);
}

function progressionContext(saveResult) {
  const saved = [];
  const context = {
    console, Date, Math, Object, Array, Number, String, JSON, isFinite,
    performance: { now: () => 1000 },
    S: { meta: { _v736: { m: 4, evidence: [{ found: true }], k: false, waldo: false, done: false } } },
    NM: { enemies: [], _v736: { m: 4, ending: false } },
    save() { saved.push(JSON.parse(JSON.stringify(context.S.meta._v736))); return saveResult; },
    setInterval() { return 1; }, clearInterval() {}, setTimeout() { return 1; }, clearTimeout() {},
    document: { documentElement: {}, querySelectorAll() { return []; }, getElementById() { return null; } }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(validatorSource, context, { filename: "state_validator.js" });
  vm.runInContext(progressionSource, context, { filename: "good_boys_progression_authority.js" });
  return { context, saved };
}

{
  const { context, saved } = progressionContext(true);
  const before = JSON.parse(JSON.stringify(context.S.meta._v736));
  assert.throws(() => context.TechOpsGoodBoysCampaignState.transition(4, 5, "invalid-without-k", {}), /invalid persisted transition/);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.S.meta._v736)), before, "rejected validation must not mutate canonical metadata");
  assert.strictEqual(context.NM._v736.m, 4, "rejected validation must not advance runtime state");
  assert.strictEqual(saved.length, 0, "invalid candidates must not be persisted");
}

{
  const { context, saved } = progressionContext(false);
  const before = JSON.parse(JSON.stringify(context.S.meta._v736));
  assert.throws(() => context.TechOpsGoodBoysCampaignState.transition(4, 5, "storage-failure", { k: true }), /save failed/);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.S.meta._v736)), before, "failed persistence must roll canonical metadata back");
  assert.strictEqual(context.NM._v736.m, 4, "failed persistence must not advance runtime state");
  assert.strictEqual(saved.length, 1, "the validated candidate should be attempted exactly once");
  assert.strictEqual(context.__goodBoysTransitionFailure.stage, "save");
}

{
  const { context, saved } = progressionContext(true);
  assert.strictEqual(context.TechOpsGoodBoysCampaignState.transition(4, 5, "freed-k", { k: true }), true);
  assert.strictEqual(context.S.meta._v736.m, 5);
  assert.strictEqual(context.S.meta._v736.k, true);
  assert.strictEqual(context.NM._v736.m, 5);
  assert.strictEqual(saved[0].m, 5);
  assert.strictEqual(saved[0].k, true);
}

{
  const durable = {
    day: 9,
    meta: {
      _v736: {
        m: 7, k: true, waldo: true, done: false,
        evidence: [{ id: "cell-118", found: true }],
        ship_establishing_seen: true,
        checkpoint: "shuttle-bay",
        playMode: "local",
        pairPuzzles: { garage_latches: true, hangar_power: true }
      },
      goodDogs: { k_freed: true, waldo_freed: true }
    }
  };
  const context = {
    console, Date, Math, Object, Array, Number, String, JSON, Promise,
    S: null, NM: null,
    localStorage: { getItem(key) { return key === "techops_save" ? JSON.stringify(durable) : null; } },
    document: { addEventListener() {}, getElementById() { return null; }, body: { dataset: {}, appendChild() {} } },
    setTimeout() { return 1; }, clearTimeout() {},
    v736: {
      start(options) {
        const restored = JSON.parse(JSON.stringify(options.state || { meta: {} }));
        context.S = Object.assign({ inDialog: false }, restored);
        context.S.meta = context.S.meta || {};
        context.S.meta._v736 = Object.assign(context.S.meta._v736 || {}, JSON.parse(JSON.stringify(options.campaign || {})), { m: options.mission });
        context.NM = { _v736: { m: options.mission, ending: false, chars: { katrin: {}, manchez: {} } } };
        return true;
      }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read("good_dogs_coop.js"), context, { filename: "good_dogs_coop.js" });
  vm.runInContext(titleSource, context, { filename: "good_boys_button_hard_fix.js" });
  const title = context.TechOpsGoodBoysButtonHardFix;
  const config = title.launchConfig();
  assert.strictEqual(config.mission, 7, "cold title launch must read the durable checkpoint");
  assert.strictEqual(config.fresh, false);
  assert.strictEqual(config.k, true);
  assert.strictEqual(config.waldo, true);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(config.evidence)), durable.meta._v736.evidence);
  assert.strictEqual(title.mount(config, "cold-resume-test"), true);
  assert.strictEqual(context.S.day, 9, "resume must retain the saved top-level state");
  assert.strictEqual(context.S.meta._v736.checkpoint, "shuttle-bay", "resume must retain non-enumerated campaign checkpoint fields");
  assert.strictEqual(context.S.meta._v736.ship_establishing_seen, true);
  assert.strictEqual(context.S.meta.goodDogs.k_freed, true, "semantic rescue state must survive title-state recreation");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.S.meta._v736.pairPuzzles)), durable.meta._v736.pairPuzzles, "cold resume must retain both completed co-op puzzles");
  assert.strictEqual(context.TechOpsGoodDogsCoop.mode(), "local", "cold resume retains its mode without an explicit selector override");
  assert.strictEqual(context.document.body.dataset.goodDogsMode, "local");
  config.playMode = "solo";
  assert.strictEqual(title.mount(config, "cold-resume-mode-change"), true);
  assert.strictEqual(context.TechOpsGoodDogsCoop.mode(), "solo", "an explicit mode selection must override the durable mode");
  assert.strictEqual(context.S.meta._v736.pairPuzzles.hangar_power, true, "changing mode must retain solved puzzles");
  assert.strictEqual(context.S.day, 9);
  assert.strictEqual(context.S.meta._v736.checkpoint, "shuttle-bay");
}

console.log("Good Dogs cold resume + transactional persistence integrity: PASS");

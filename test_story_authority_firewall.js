"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const Campaign = require("./campaign_act1.js");

const game = fs.readFileSync("game.js", "utf8");
const felicia = fs.readFileSync("v64_hooks.js", "utf8");
const ending = fs.readFileSync("v73_hooks.js", "utf8");
const aftermath = fs.readFileSync("v74_hooks.js", "utf8");
const ghostProtocol = fs.readFileSync("v70_hooks.js", "utf8");

assert.ok(game.includes("window.TechOpsStoryAuthority"));
assert.ok(game.includes('VERSION: "1.2"'));
assert.ok(game.includes("duet_protocol_complete"), "Felicia playability must be earned by the canonical Duet gate");

function memoryStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values
  };
}

function loadStoryAuthority(storage) {
  const start = game.indexOf("const CANONICAL_CAMPAIGN_SAVE_KEY");
  const end = game.indexOf("function newState()", start);
  assert.ok(start >= 0 && end > start, "canonical story authority block must remain executable in isolation");
  const context = { window: { localStorage: storage }, JSON, Object };
  vm.runInNewContext(game.slice(start, end), context, { filename: "game.story-authority.js" });
  return context.window.TechOpsStoryAuthority;
}

let storage = memoryStorage();
let authority = loadStoryAuthority(storage);
assert.strictEqual(authority.canPlayFelicia({ meta: { duet_protocol_complete: true } }), false, "base-game meta cannot forge the canonical unlock");
storage.setItem(Campaign.SAVE_KEY, JSON.stringify({ story: { completedActs: ["act_6"], facts: { duet_protocol_complete: false, felicia_playable: true } } }));
assert.strictEqual(authority.canPlayFelicia(), false, "an explicitly incomplete canonical Duet remains locked");
storage.setItem(Campaign.SAVE_KEY, JSON.stringify({ story: { completedActs: ["act_5"], facts: { duet_protocol_complete: true, felicia_playable: true } } }));
assert.strictEqual(authority.canPlayFelicia(), false, "forged Duet reward facts cannot bypass the ordered Act VI milestone");
storage.setItem(Campaign.SAVE_KEY, JSON.stringify({ story: { completedActs: ["act_6"], facts: { duet_protocol_complete: true, felicia_playable: false } } }));
assert.strictEqual(authority.canPlayFelicia(), false, "Act VI without its playable reward fails closed");
storage.setItem(Campaign.SAVE_KEY, JSON.stringify({ story: { completedActs: ["act_6"], facts: { duet_protocol_complete: true, felicia_playable: true } } }));
assert.strictEqual(authority.canPlayFelicia({ meta: {} }), true, "the completed canonical Duet milestone unlocks Felicia before the campaign API loads");
storage.setItem(Campaign.SAVE_KEY, "{corrupt");
assert.strictEqual(authority.canPlayFelicia(), false, "corrupt campaign JSON fails closed");
authority = loadStoryAuthority({ getItem() { throw new Error("storage denied"); } });
assert.strictEqual(authority.canPlayFelicia(), false, "unavailable storage fails closed");

assert.ok(felicia.includes("if (canonicalStory()) return false;"), "retired Felicia confrontation/boss must fail closed");
assert.ok(felicia.includes("if (canonicalStory()) return;\n    const s = S, f = fel();"), "legacy Felicia/clue placement must be suppressed");
assert.ok(felicia.includes("if (canonicalStory()) return __origInteract64.apply"), "legacy Felicia interactions must be suppressed");
assert.ok(felicia.includes("localStorage.removeItem(\"techops_char\")"), "stale premature Felicia identity must be cleared");

assert.ok(ghostProtocol.includes("if (canonicalStory()) return;\n    const s = S;"), "legacy v7.0 haunt placement must be suppressed");
assert.ok(ghostProtocol.includes("if (canonicalStory()) return __origInteract70.apply"), "legacy v7.0 encounter handling must be suppressed");
assert.ok(ghostProtocol.includes("if (canonicalStory()) return r;\n    const s = S;"), "legacy v7.0 walk-off mutation must be suppressed");

function loadV70(feliciaPlayable, withLegacyKeys = true) {
  const local = memoryStorage(withLegacyKeys ? { techops_felicia_unlock: "1", techops_char: "felicia" } : {});
  const context = {
    console: { log() {}, warn() {}, error() {} },
    location: { search: "" },
    localStorage: local,
    document: { getElementById() { return null; }, createElement() { return {}; } },
    TechOpsStoryAuthority: { canonical: true, canPlayFelicia: () => feliciaPlayable },
    load: () => ({ meta: { _fel: { unlocked: true } } }),
    newState: () => ({ meta: { _char: "felicia" } }),
    winBattle() { context.baseWins = (context.baseWins || 0) + 1; },
    setupDay() { context.baseSetups = (context.baseSetups || 0) + 1; },
    interact() { context.baseInteractions = (context.baseInteractions || 0) + 1; return "interacted"; },
    step() { context.baseSteps = (context.baseSteps || 0) + 1; return "stepped"; },
    S: { meta: {}, nightMode: false, map: [[0]], inDialog: false, inBattle: false },
    B: { felicia: true },
    fel() { context.legacyFeliciaCalls = (context.legacyFeliciaCalls || 0) + 1; throw new Error("legacy Felicia route ran"); },
    isFel: () => false
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(ghostProtocol, context, { filename: "v70_hooks.js" });
  return { context, local };
}

let v70 = loadV70(false);
assert.strictEqual(v70.context.newState().meta._char, null, "a stale legacy unlock cannot select Felicia in canonical mode");
assert.strictEqual(v70.local.getItem("techops_char"), null, "a stale character selection is removed");
v70.context.setupDay();
v70.context.interact();
v70.context.step(.016);
v70.local.removeItem("techops_felicia_unlock");
v70.context.winBattle();
assert.deepStrictEqual([v70.context.baseSetups, v70.context.baseInteractions, v70.context.baseSteps, v70.context.baseWins], [1, 1, 1, 1]);
assert.strictEqual(v70.context.legacyFeliciaCalls, undefined, "canonical mode never enters v7.0 haunt state");
assert.strictEqual(v70.local.getItem("techops_felicia_unlock"), null, "the retired boss cannot stamp its durable unlock in canonical mode");
v70 = loadV70(false, false);
assert.strictEqual(v70.local.getItem("techops_felicia_unlock"), null, "canonical startup does not migrate a retired save-based boss unlock");
v70 = loadV70(true);
v70.local.removeItem("techops_felicia_unlock");
assert.strictEqual(v70.context.newState().meta._char, "felicia", "the canonical Duet fact survives the v7.0 guard");

assert.ok(ending.includes("if (canonicalStory()) return false;\n    const a = arc()"), "legacy day-10 ending cannot fire in Story Bible mode");
assert.ok((ending.match(/if \(canonicalStory\(\)\) return r;/g) || []).length >= 2, "legacy scheduled scenes and clock finale must both be firewalled");
assert.ok((aftermath.match(/if \(canonicalStory\(\)\) return r;/g) || []).length >= 2, "legacy day-11 epilogue schedules must be firewalled");

const legacyFiles = ["v725_hooks.js", "v726_hooks.js", "v727_hooks.js", "v729_hooks.js", "v730_hooks.js"];
const expectedRetiredScenes = ["coffee", "mentor", "betrayal", "city", "racks", "citylife", "promotion", "krun", "wires", "signal", "orpheus", "badge", "emerald"];
const legacyContext = {
  console: { log() {}, warn() {}, error() {} },
  Math, Date, JSON, Object, Array, Set, Map,
  TechOpsStoryAuthority: { canonical: true },
  checkDayEnd() { legacyContext.baseDayEnds = (legacyContext.baseDayEnds || 0) + 1; },
  S: {
    day: 19, ticketsDone: 1, ticketsTotal: 1, nightMode: false, battle: false,
    meta: { day: 19, _v726racks: "trace", _v725betrayal: "follow", _v725betrayalDay: 14, _v725city: true, _v727kLine: true, _v729wires: "trace", _v729orpheus: "sign" }
  },
  document: {}, navigator: { getGamepads: () => [] }, performance: { now: () => 0 },
  setTimeout, clearTimeout, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  addEventListener() {}, removeEventListener() {}
};
legacyContext.window = legacyContext;
legacyContext.globalThis = legacyContext;
vm.createContext(legacyContext);
legacyFiles.forEach(file => vm.runInContext(fs.readFileSync(file, "utf8"), legacyContext, { filename: file }));

const metaBeforeDayEnd = JSON.stringify(legacyContext.S.meta);
legacyContext.checkDayEnd(true);
assert.strictEqual(legacyContext.baseDayEnds, 1, "every retired scheduler delegates to the real day-end exactly once");
assert.strictEqual(JSON.stringify(legacyContext.S.meta), metaBeforeDayEnd, "canonical day-end cannot write a retired story latch or reward");
expectedRetiredScenes.forEach(id => {
  assert.strictEqual(legacyContext.v725.defs()[id].retiredStory, true, id + " must be inventoried as retired story");
  assert.strictEqual(legacyContext.v725.storyAllowed(id), false, id + " must fail closed in canonical mode");
});
assert.deepStrictEqual([
  legacyContext.v725.play("coffee"), legacyContext.v726.play("racks"), legacyContext.v727.play("krun"),
  legacyContext.v729.play("wires"), legacyContext.v730.play("badge")
], [false, false, false, false, false], "public legacy scene APIs cannot bypass the canonical firewall");
assert.strictEqual(legacyContext.v725.register("late_canonical_test", { shots: [{}] }), true, "the shared cinematic engine remains available to canonical chapters");
assert.strictEqual(legacyContext.v725.storyAllowed("late_canonical_test"), true, "canonical registered scenes are not disabled with legacy chronology");

const fresh = Campaign.createInitialState();
assert.strictEqual(fresh.campaign.storyModeVersion, "1.2");
const legacy = Campaign.migrate({ schemaVersion: 1, campaign: { day: 8, act: 3, chapter: "legacy", phase: "old" }, flags: {}, assignments: {}, tickets: {}, evidence: { ghostIdentityEvidence: {} } });
assert.strictEqual(legacy.campaign.storyModeVersion, "1.2", "legacy saves migrate behind the canonical firewall");

console.log("Story Bible v1.2 legacy Felicia/ending firewall: PASS");

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
  const match = gameSource.match(/const PROFILE_SAVE_SCHEMA_VERSION = \d+;\nconst save = \(\) => \{[\s\S]*?\n\};\nconst load/);
  assert.ok(match, "canonical save implementation must remain directly testable");
  let writes = 0, reject = false, throwWrite = false;
  const storage = new Map();
  const context = {
    S: { day: 1, meta: {}, certs: [], inv: [], journal: [], stats: {}, soft: {}, rep: {}, ach: [], books: [], lab: [], staff: [], infra: [] },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { if (throwWrite) throw new Error("quota"); writes++; storage.set(key, String(value)); }
    },
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
    S: { meta: { _standaloneMode: "gooddogs", _v736: { m: 4, evidence: [{ found: true }], k: false, waldo: false, done: false, campaignOrigin: "standalone" } } },
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
  assert.strictEqual(saved[0].campaignOrigin, "standalone", "mission transition persistence must retain title origin");
}

{
  const durable = {
    day: 3,
    clock: 615,
    meta: {
      _char: "felicia",
      _v736: {
        m: 1, k: false, waldo: false, done: false,
        evidence: ["garage-trace"],
        checkpoint: "garage-search",
        playMode: "local",
        pairPuzzles: { garage_latches: true },
        custom: { route: "north-wall" }
      },
      unrelatedCampaignFlag: true
    }
  };
  const canonicalProfile = JSON.stringify({ day: 6, meta: { _char: "felicia", canonicalMarker: "day-profile" } });
  durable.meta._standaloneMode = "gooddogs";
  durable.meta._v736.campaignOrigin = "standalone";
  const storage = { techops_save: canonicalProfile, techops_good_dogs_session_v1: JSON.stringify(durable), techops_char: "felicia" };
  let saveCalls = 0;
  const context = {
    console, Date, Math, Object, Array, Number, String, JSON, Promise,
    S: null, NM: null,
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
      setItem(key, value) { storage[key] = String(value); },
      removeItem(key) { delete storage[key]; }
    },
    document: { addEventListener() {}, getElementById() { return null; }, body: { dataset: {}, appendChild() {} } },
    setTimeout() { return 1; }, clearTimeout() {},
    save() { saveCalls++; storage.techops_good_dogs_session_v1 = JSON.stringify(context.S); return true; },
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
  context.S={day:2,meta:{_char:"mike",canonicalMarker:true,_v736:{m:5,k:true,waldo:false,done:false}}};
  const config = title.launchConfig();
  assert.strictEqual(config.state.day,3,"an untagged live campaign state cannot be adopted by standalone title resume");
  assert.strictEqual(context.S.meta._char,"mike","standalone resume discovery cannot mutate a live canonical identity");
  assert.strictEqual(config.mission, 1, "a valid durable M1 campaign is a resume, not a fresh reset");
  assert.strictEqual(config.fresh, false);
  assert.strictEqual(storage.techops_char, "felicia", "Good Dogs entry must preserve the Day profile character selection");
  assert.strictEqual(config.state.meta._char, undefined, "the durable snapshot is sanitized before restore");
  assert.strictEqual(config.state.meta._standaloneMode, "gooddogs", "title resume must carry standalone mode provenance");
  assert.strictEqual(config.campaign.campaignOrigin, "standalone", "title resume must tag the Good Dogs campaign origin");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(config.campaign.pairPuzzles)), { garage_latches: true });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(config.campaign.custom)), { route: "north-wall" });
  assert.strictEqual(title.mount(config, "m1-cold-resume"), true);
  assert.strictEqual(context.S.day, 3);
  assert.strictEqual(context.S.clock, 615);
  assert.strictEqual(context.S.meta._char, undefined, "restored Good Dogs state cannot regain Felicia/Mike/Night identity");
  assert.strictEqual(context.S.meta.unrelatedCampaignFlag, true, "full non-Good-Dogs state survives M1 resume");
  assert.strictEqual(context.S.meta._v736.checkpoint, "garage-search");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(context.S.meta._v736.evidence)), ["garage-trace"]);
  assert.strictEqual(context.S.meta._v736.playMode, "local");
  assert.strictEqual(context.S.meta._v736.pairPuzzles.garage_latches, true);
  assert.strictEqual(context.S.meta._standaloneMode, "gooddogs");
  assert.strictEqual(context.S.meta._v736.campaignOrigin, "standalone");
  assert.strictEqual(saveCalls, 1, "mount persists the sanitized mode and campaign snapshot");
  assert.strictEqual(storage.techops_save, canonicalProfile, "title Good Dogs cannot overwrite the canonical Day profile");

  context.S = null;
  const resumed = title.launchConfig();
  assert.strictEqual(resumed.fresh, false, "persisted title campaign must remain resumable");
  assert.strictEqual(resumed.campaign.campaignOrigin, "standalone", "standalone origin survives save and cold resume");
  assert.strictEqual(resumed.state.meta._standaloneMode, "gooddogs");
  context.S = null;
  context.newState = () => ({ day: 1, meta: { _char: "felicia", baseFlag: true }, inDialog: false });
  storage.techops_char = "felicia";
  const fresh = title.freshConfig();
  assert.strictEqual(title.persistModeChoice(fresh, "local"), true, "mode choice is durable before the prologue/mount handoff");
  const immediate = JSON.parse(storage.techops_good_dogs_session_v1);
  assert.strictEqual(immediate.meta._v736.playMode, "local");
  assert.deepStrictEqual(immediate.meta._v736.pairPuzzles, {});
  assert.strictEqual(immediate.meta._v736.campaignOrigin, "standalone", "fresh title choice persists campaign origin before gameplay");
  assert.strictEqual(immediate.meta._standaloneMode, "gooddogs");
  assert.strictEqual(immediate.meta._char, undefined);
  assert.strictEqual(immediate.meta.baseFlag, true);
  assert.strictEqual(storage.techops_char, "felicia");
  assert.strictEqual(storage.techops_save, canonicalProfile, "fresh Good Dogs persistence must stay in its isolated slot");
}

// A pre-isolation title save is copied on explicit title resume, never moved or
// rewritten in place. This preserves old progress without claiming its canon.
{
  const legacy={day:4,meta:{_char:"mike",_v736:{m:4,k:false,waldo:false,done:false,evidence:["legacy-clue"],playMode:"solo"},canonicalMarker:"keep-byte-for-byte"}};
  const canonicalBytes=JSON.stringify(legacy),storage={techops_save:canonicalBytes,techops_char:"mike"};
  const context={console,Date,Math,Object,Array,Number,String,JSON,Promise,S:null,NM:null,localStorage:{getItem:key=>Object.prototype.hasOwnProperty.call(storage,key)?storage[key]:null,setItem:(key,value)=>{storage[key]=String(value);},removeItem:key=>{delete storage[key];}},document:{addEventListener(){},getElementById(){return null;},body:{dataset:{},appendChild(){}}},setTimeout(){return 1;},clearTimeout(){}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(titleSource,context,{filename:"good_boys_button_hard_fix.js"});
  const title=context.TechOpsGoodBoysButtonHardFix,cfg=title.launchConfig();
  assert.strictEqual(cfg.mission,4,"legacy title progress remains resumable");
  assert.strictEqual(cfg.state.meta._standaloneMode,"gooddogs");assert.strictEqual(cfg.campaign.campaignOrigin,"standalone");
  assert.strictEqual(cfg.state.meta._char,undefined,"the copied standalone state drops canonical character identity");
  assert.strictEqual(storage.techops_save,canonicalBytes,"legacy migration cannot mutate canonical profile bytes");
  assert.strictEqual(storage.techops_char,"mike");
  assert.strictEqual(title.persistModeChoice(cfg,"solo"),true);
  const migrated=JSON.parse(storage.techops_good_dogs_session_v1);
  assert.strictEqual(migrated.meta._v736.m,4);assert.strictEqual(migrated.meta._v736.campaignOrigin,"standalone");
  assert.strictEqual(storage.techops_save,canonicalBytes,"copying legacy progress leaves Story Continue untouched");
}

// Cold-resuming a completed standalone run restores semantics first and then
// replays the authored Earthfall ending; the legacy b736m8 reel is suppressed.
{
  const completed={day:4,meta:{_standaloneMode:"gooddogs",_v736:{m:8,k:true,waldo:true,done:true,campaignOrigin:"standalone",evidence:[]}}};
  const canonicalBytes=JSON.stringify({day:5,meta:{canonicalMarker:"continue-day"}}),storage={techops_save:canonicalBytes,techops_good_dogs_session_v1:JSON.stringify(completed),techops_char:"felicia"};
  let semanticCalls=0,replayCalls=0,legacyReels=0,startOptions=null;
  const context={console,Date,Math,Object,Array,Number,String,JSON,Promise,S:null,NM:null,localStorage:{getItem:key=>Object.prototype.hasOwnProperty.call(storage,key)?storage[key]:null,setItem:(key,value)=>{storage[key]=String(value);},removeItem:key=>{delete storage[key];}},document:{addEventListener(){},getElementById(){return null;},body:{dataset:{},appendChild(){}}},setTimeout(){return 1;},clearTimeout(){},save(){storage.techops_good_dogs_session_v1=JSON.stringify(context.S);return true;},v736:{start(options){startOptions=options;context.S=JSON.parse(JSON.stringify(options.state));context.S.meta._v736=Object.assign(context.S.meta._v736,options.campaign||{});if(context.S.meta._v736.done&&!options.suppressDoneReplay)legacyReels++;return true;}},TechOpsGoodDogsCampaignState:{completeReturn(){semanticCalls++;context.S.meta.goodDogs=Object.assign(context.S.meta.goodDogs||{},{good_dogs_protocol_complete:true,crew_returned_to_earth:true});return true;}},TechOpsGoodBoysEarthfallEnding:{replay(){replayCalls++;return true;}}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(titleSource,context,{filename:"good_boys_button_hard_fix.js"});
  const title=context.TechOpsGoodBoysButtonHardFix,cfg=title.launchConfig();assert.strictEqual(cfg.done,true);
  assert.strictEqual(title.mount(cfg,"completed-cold-resume"),true);
  assert.strictEqual(startOptions.suppressDoneReplay,true);assert.strictEqual(legacyReels,0,"completed title resume cannot invoke the legacy finale reel");
  assert.strictEqual(semanticCalls,1,"cold done-state resume repairs semantic completion before replay");assert.strictEqual(replayCalls,1,"completed title resume uses authored Earthfall replay");
  const persisted=JSON.parse(storage.techops_good_dogs_session_v1);assert.strictEqual(persisted.meta.goodDogs.good_dogs_protocol_complete,true);
  assert.strictEqual(storage.techops_save,canonicalBytes);assert.strictEqual(storage.techops_char,"felicia");
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
  durable.meta._standaloneMode = "gooddogs";
  durable.meta._v736.campaignOrigin = "standalone";
  const context = {
    console, Date, Math, Object, Array, Number, String, JSON, Promise,
    S: null, NM: null,
    localStorage: { getItem(key) { return key === "techops_good_dogs_session_v1" ? JSON.stringify(durable) : key === "techops_save" ? JSON.stringify({day:2,meta:{canonicalMarker:true}}) : null; } },
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
  assert.strictEqual(context.S.meta._standaloneMode, "gooddogs", "cold title resume remains isolated from the main campaign");
  assert.strictEqual(context.S.meta._v736.campaignOrigin, "standalone");
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

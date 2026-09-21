"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("game.js", "utf8");
assert.ok(source.includes('localStorage.removeItem("techops_save_bak")'), "New Game must clear the legacy recovery shadow as well as the primary profile");
assert.ok(source.includes("Shift resumed at ${fmtClock(S.clock)}") && !source.includes("fmtTime(S.clock)"), "Continue feedback must use the shipped clock formatter");
const block = source.match(/const PROFILE_SAVE_SCHEMA_VERSION = \d+;\nconst save = \(\) => \{[\s\S]*?\nfunction loadDayCheckpoint\(profile\) \{[\s\S]*?\n\}/);
assert.ok(block, "save and checkpoint functions must remain directly testable");

const data = new Map([["techops_save", JSON.stringify({ day: 9, meta: { marker: "existing-story" } })]]);
const localStorage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); }
};
const context = {
  console, JSON, Number, Array, String,
  localStorage,
  window: { TechOpsStateValidator: { assertBeforeSave() { return true; } } },
  DAY_CHECKPOINT_KEY: "techops_day_checkpoint_v1",
  NIGHT_CRAWLER_SAVE_KEY: "techops_nightcrawler_session_v1",
  GOOD_DOGS_SAVE_KEY: "techops_good_dogs_session_v1",
  eodOpen: false,
  panelOpen: false,
  S: null
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(block[0] + "\nthis.saveShift=save;this.loadProfile=load;this.loadCheckpoint=loadDayCheckpoint;", context, { filename: "game-checkpoint-extract.js" });

const sharedTicket = { id: 1, name: "Dana", interviewed: true, age: 42 };
context.S = {
  day: 3, clock: 777, xp: 42, budget: 91, stress: 12, hp: 30, maxHp: 40,
  certs: [], inv: [], journal: [], stats: {}, soft: {}, rep: {},
  meta: { marker: "resume-me", debt: 0, wrongDiag: 0, recentTypes: [], kb: {}, incidents: 0, mttr: [], hires: 0, _v736: { m: 1 } },
  ach: [], books: [], lab: [], stressResist: 0, diff: 1, ngPlus: false, shadowDone: false,
  staff: [], audited: false, infra: [], certDiscount: 75,
  map: [[0, 0], [0, 0]], px: 1, py: 1,
  npcs: [sharedTicket],
  tickets: [sharedTicket], portals: [], devices: [], loreSpots: [], coffeeMachines: [],
  inDialog: true, inBattle: false, gameOver: false, nightMode: null, moving: true
};
assert.strictEqual(context.saveShift(), true);
assert.deepStrictEqual(JSON.parse(data.get("techops_save_bak")), { day: 9, meta: { marker: "existing-story" } }, "first durable story save preserves the previous valid profile as rollback");
const profile = context.loadProfile();
assert.strictEqual(profile.day, 3);
assert.strictEqual(profile.certDiscount, 75, "durable rewards survive old-profile loading");
const restored = context.loadCheckpoint(profile);
assert.ok(restored, "safe workday save produces a resumable checkpoint");
assert.strictEqual(restored.clock, 777);
assert.strictEqual(restored.px, 1);
assert.strictEqual(restored.npcs[0].interviewed, true);
assert.strictEqual(restored.npcs[0].age, 42);
assert.strictEqual(restored.meta.marker, "resume-me");
assert.strictEqual(restored.meta._v736.m, 1, "dormant Good Dogs campaign metadata cannot suppress an ordinary Day checkpoint");
assert.strictEqual(restored.tickets[0], restored.npcs[0], "resume must restore the canonical shared NPC/ticket object identity");
restored.npcs[0].done = true;
assert.strictEqual(restored.tickets[0].done, true, "ticket tracking must see interaction mutations after resume");
assert.strictEqual(restored.inDialog, false, "blocking overlays never resume stale callbacks");
assert.strictEqual(restored.moving, false, "held movement never replays after reload");

context.panelOpen = true;
context.S.budget = 123;
context.S.inv.push({ id: "panel-purchase" });
assert.strictEqual(context.saveShift(), true, "safe day progress may checkpoint while a panel is open");
const panelProfile = context.loadProfile();
const panelRestored = context.loadCheckpoint(panelProfile);
assert.strictEqual(panelRestored.budget, 123, "a newer panel save cannot roll back to an older checkpoint");
assert.strictEqual(panelRestored.inv[0].id, "panel-purchase");
const staleProfile = { ...panelProfile, _saveRevision: panelProfile._saveRevision + 1 };
assert.strictEqual(context.loadCheckpoint(staleProfile), null, "a checkpoint older than the profile must never win Continue");
context.panelOpen = false;

// A failed backup write must fail closed before replacing the readable primary.
const stablePrimary = data.get("techops_save");
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === "techops_save_bak") throw new Error("QuotaExceededError: backup slot full");
  return originalSetItem.call(this, key, value);
};
context.S.budget = 124;
assert.strictEqual(context.saveShift(), false, "quota failure while preserving rollback must block primary overwrite");
assert.strictEqual(data.get("techops_save"), stablePrimary, "failed rollback preservation cannot destroy the last readable primary");
assert.match(context.window.__techopsSaveError, /QuotaExceededError/);
localStorage.setItem = originalSetItem;

// Corrupt primary recovery uses the one-generation backup and retains the bad bytes.
const validBackup = data.get("techops_save_bak");
data.set("techops_save", "{broken-primary");
const recovered = context.loadProfile();
assert.ok(recovered && recovered.meta, "corrupt primary recovers from the last valid backup");
assert.strictEqual(data.get("techops_save_corrupt_v1"), "{broken-primary", "corrupt primary bytes are retained in the bounded quarantine slot");
assert.strictEqual(data.get("techops_save"), validBackup, "successful quarantine repairs the primary from the verified backup");
assert.strictEqual(context.window.__techopsSaveRecovery, "backup-restored");

// If quarantine cannot be written, recovery is memory-only and the corrupt primary stays untouched.
data.set("techops_save", "{broken-again");
localStorage.setItem = function(key, value) {
  if (key === "techops_save_corrupt_v1") throw new Error("QuotaExceededError: quarantine unavailable");
  return originalSetItem.call(this, key, value);
};
const memoryRecovered = context.loadProfile();
assert.ok(memoryRecovered && memoryRecovered.meta, "backup remains usable when quarantine storage is unavailable");
assert.strictEqual(data.get("techops_save"), "{broken-again", "memory-only recovery must not overwrite unquarantined corrupt bytes");
assert.strictEqual(context.window.__techopsSaveRecovery, "backup-memory-only");
assert.match(context.window.__techopsSaveQuarantineError, /QuotaExceededError/);
localStorage.setItem = originalSetItem;
data.set("techops_save", stablePrimary);

// Private/restricted storage failures are explicit rather than silently treated as a missing save.
const originalGetItem = localStorage.getItem;
localStorage.getItem = function() { throw new Error("SecurityError: storage denied"); };
assert.strictEqual(context.loadProfile(), null);
assert.match(context.window.__techopsSaveLoadError, /SecurityError/);
assert.match(context.window.__techopsSaveLoadNotice, /Browser storage is unavailable/);
localStorage.getItem = originalGetItem;

// An unreadable primary with no backup remains untouched and surfaces a clear notice.
data.set("techops_save", "{unrecoverable");
data.delete("techops_save_bak");
assert.strictEqual(context.loadProfile(), null);
assert.strictEqual(data.get("techops_save"), "{unrecoverable");
assert.match(context.window.__techopsSaveLoadNotice, /no compatible backup/);
data.set("techops_save", stablePrimary);
data.set("techops_save_bak", stablePrimary);

// Legacy unversioned profiles migrate in memory to the current explicit schema.
const legacyProfile = { day: 3, budget: 55, meta: { marker: "legacy" }, certs: ["ccna"] };
data.set("techops_save", JSON.stringify(legacyProfile));
const migratedLegacy = context.loadProfile();
assert.strictEqual(migratedLegacy._profileSchemaVersion, 1, "legacy profile is promoted to the explicit current schema");
assert.deepStrictEqual(JSON.parse(JSON.stringify(context.window.__techopsSaveMigration)), { from: 0, to: 1, migrated: true }, "migration metadata crosses the VM boundary as plain data");
assert.strictEqual(migratedLegacy.meta.marker, "legacy", "migration preserves unknown/canonical player metadata");
assert.deepStrictEqual(migratedLegacy.certs, ["ccna"], "migration preserves existing player collections");

// A future schema cannot be silently interpreted by older code; a valid backup
// remains the only permitted recovery path.
data.set("techops_save_bak", stablePrimary);
data.set("techops_save", JSON.stringify({ _profileSchemaVersion: 99, day: 99, meta: { future: true } }));
const futureRecovered = context.loadProfile();
assert.ok(futureRecovered && futureRecovered.meta, "unsupported future schema falls back to the prior compatible backup");
assert.match(context.window.__techopsSaveLoadError, /unsupported profile save schema 99/);
assert.strictEqual(context.window.__techopsSaveRecovery, "backup-restored");
data.set("techops_save", stablePrimary);

const storyBeforeNight = data.get("techops_save");
const checkpointBeforeNight = data.get(context.DAY_CHECKPOINT_KEY);
context.S.meta._standaloneMode = "nightcrawler";
context.S.nightMode = { district: "downtown" };
assert.strictEqual(context.saveShift(), true);
assert.strictEqual(data.get("techops_save"), storyBeforeNight, "standalone Night cannot overwrite Story Continue");
assert.strictEqual(data.get(context.DAY_CHECKPOINT_KEY), checkpointBeforeNight, "alternate modes cannot replace a day checkpoint");
assert.ok(data.get(context.NIGHT_CRAWLER_SAVE_KEY), "standalone Night writes only its isolated slot");

const storyBeforeGoodDogs = data.get("techops_save");
const checkpointBeforeGoodDogs = data.get(context.DAY_CHECKPOINT_KEY);
context.S.meta._standaloneMode = "gooddogs";
context.S.meta._v736.campaignOrigin = "standalone";
assert.strictEqual(context.saveShift(), true);
assert.strictEqual(data.get("techops_save"), storyBeforeGoodDogs, "standalone Good Dogs cannot overwrite Story Continue");
assert.strictEqual(data.get(context.DAY_CHECKPOINT_KEY), checkpointBeforeGoodDogs, "standalone Good Dogs cannot replace a day checkpoint");
const goodDogsSave = JSON.parse(data.get(context.GOOD_DOGS_SAVE_KEY));
assert.strictEqual(goodDogsSave.meta._standaloneMode, "gooddogs");
assert.strictEqual(goodDogsSave.meta._v736.campaignOrigin, "standalone", "Good Dogs origin must survive its isolated save");

data.set(context.DAY_CHECKPOINT_KEY, "{broken");
assert.strictEqual(context.loadCheckpoint(profile), null, "corrupt checkpoints fail closed to legacy profile loading");
assert.match(context.window.__techopsCheckpointLoadError, /SyntaxError/);

console.log("Game save resilience + day checkpoint + standalone Night/Good Dogs isolation: PASS");

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('game.js', 'utf8');
const store = source.slice(source.indexOf('const STORE_STOCK = ['), source.indexOf('// ---------- workforce: hire'));
const persistence = source.match(/const PROFILE_SAVE_SCHEMA_VERSION = \d+;\nconst save = \(\) => \{[\s\S]*?\nfunction loadDayCheckpoint\(profile\) \{[\s\S]*?\n\}/)[0];
const data = new Map();
const context = {
  console, performance, Math, Date,
  localStorage: {getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value)},
  NIGHT_CRAWLER_SAVE_KEY: 'night', GOOD_DOGS_SAVE_KEY: 'dogs', DAY_CHECKPOINT_KEY: 'day',
  toast() {}, sfx() {}, updateHUD() {}, closeDlg() {},
  dlg(title, body, options) { context.dialog = {title, body, options}; },
  S: {day: 1, hp: 10, maxHp: 40, budget: 1000, books: [], lab: [], infra: [], stats: {}, meta: {}, inv: []}
};
context.window = context;
vm.createContext(context);
vm.runInContext(store + '\n' + persistence + '\nthis.loadProfile=load;', context);
const s = context.S;
context.refreshStoreStock();
assert.ok(s.storeStock.includes('supply_dressing'));
assert.ok(s.storeStock.includes('supply_firstaid'));
assert.equal(context.buyStoreItem('supply_dressing'), true);
assert.equal(s.budget, 980);
assert.equal(context.supplyCount('supply_dressing'), 1);
assert.equal(context.buyStoreItem('supply_dressing'), false, 'a stale buy callback cannot charge twice');
assert.equal(s.budget, 980);
context.refreshStoreStock();
assert.equal(s.storeStock.includes('supply_dressing'), false, 'opening the store cannot replenish it');
let loaded = context.loadProfile();
assert.equal(loaded.supplies.supply_dressing, 1);
assert.equal(loaded.storeStock.includes('supply_dressing'), false);
assert.equal(loaded.storeStockDay, 1);
assert.equal(context.useSupply('supply_dressing'), true);
assert.equal(s.hp, 25);
assert.equal(context.supplyCount('supply_dressing'), 0);
assert.equal(context.useSupply('supply_dressing'), false);
assert.equal(s.hp, 25);
assert.equal(context.buyStoreItem('supply_firstaid'), true);
s.nightMode = {hp: 100};
assert.equal(context.useSupply('supply_firstaid'), false, 'full health retains a supply');
assert.equal(context.supplyCount('supply_firstaid'), 1);
s.nightMode.hp = 80;
assert.equal(context.useSupply('supply_firstaid'), true);
assert.equal(s.nightMode.hp, 100, 'Night healing clamps to Night HP');
assert.equal(s.hp, 25, 'Night items target the active Night health');
s.day++;
context.refreshStoreStock();
assert.ok(s.storeStock.includes('supply_dressing'), 'a new day restocks supplies');
assert.equal(context.buyStoreItem('supply_dressing'), true);
s.nightMode._v736 = {};
assert.equal(context.useSupply('supply_dressing'), false, 'Good Dogs owns its own character health');
delete s.nightMode._v736;
s.nightMode.hp = 40;
const write = context.localStorage.setItem;
context.localStorage.setItem = () => { throw Error('quota'); };
assert.equal(context.useSupply('supply_dressing'), false);
assert.equal(s.nightMode.hp, 40);
assert.equal(context.supplyCount('supply_dressing'), 1, 'failed persistence rolls back use');
const budget = s.budget;
assert.equal(context.buyStoreItem('supply_firstaid'), false);
assert.equal(s.budget, budget);
assert.equal(context.supplyCount('supply_firstaid'), 0);
assert.ok(s.storeStock.includes('supply_firstaid'), 'failed persistence retains stock');
context.localStorage.setItem = write;
s.budget = 0;
assert.equal(context.buyStoreItem('supply_firstaid'), false);
s.budget = budget;
assert.equal(context.buyStoreItem('unknown'), false);
// Existing ownership remains authoritative even when older stock contains an owned upgrade.
s.books.push('book_itil'); s.storeStock.push('book_itil');
assert.equal(context.buyStoreItem('book_itil'), false);
s.lab.push('ram'); s.storeStock.push('lab_ram');
assert.equal(context.buyStoreItem('lab_ram'), false);
s.storeStock.push('retired-item-id');
assert.equal(context.storeItemAvailable(undefined), false);
// Old saves migrate without inventing items or losing equipment.
data.set('techops_save', JSON.stringify({day: 4, meta: {}, inv: [{name: 'old equipment'}]}));
loaded = context.loadProfile();
assert.equal(Object.keys(loaded.supplies).length, 0);
assert.equal(loaded.inv[0].name, 'old equipment');
assert.equal(loaded.storeStockDay, 0);
// Stale mission UI cannot consume supplies from a replacement run.
context.openNightSupplies();
const staleUse = context.dialog.options.find(option => option.t.startsWith('Use Field'));
context.S = {...s, supplies: {supply_dressing: 3}, nightMode: {hp: 20}};
staleUse.f();
assert.equal(context.S.supplies.supply_dressing, 3);
assert.equal(context.S.nightMode.hp, 20);
console.log('Store purchase, inventory use, stock persistence, migration and rollback: PASS');

"use strict";
const assert = require("assert");

global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; }
};

global.TechOpsCampaign = require("./campaign_act1.js");
global.TechOpsCampaignAct2 = require("./campaign_act2.js");
global.TechOpsCampaignVisuals = require("./campaign_visual_direction.js");
let lastDialog = null;
global.dlg = function (name, body, options) { lastDialog = { name, body, options }; global.S.inDialog = true; };
global.closeDlg = function () { global.S.inDialog = false; };
global.toast = function () {};
global.adjacent = function (a,b) { return Math.abs(a.x-b.x)+Math.abs(a.y-b.y) <= 1; };
global.interact = function () { return "base"; };
global.setupDay = function () { return true; };

function makeMap() { return Array.from({length:44},()=>Array.from({length:44},()=>0)); }
function choose(text) { const option = lastDialog.options.find(o=>o.t===text); assert.ok(option, `missing ${text} in ${lastDialog.name}`); option.f(); }
function load() { return global.TechOpsCampaign.load(global.localStorage); }

let campaign = global.TechOpsCampaign.freshState ? global.TechOpsCampaign.freshState() : global.TechOpsCampaign.load(global.localStorage);
campaign.flags = campaign.flags || {};
campaign.flags.tuesday_morning_reached = true;
campaign.flags.felicia_video_watched = true;
global.TechOpsCampaign.save(campaign, global.localStorage);

global.S = { day:2, map:makeMap(), npcs:[], meta:{}, px:0, py:0, inDialog:false };
const native = require("./campaign_native_act2.js");
assert.strictEqual(native.ensureWorld(), true);
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "badge_cloner"));
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "felicia_daylight"));
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "morningstar_trace"));
assert.ok(global.S.npcs.some(n=>n.campaignAct2 === "rooftop_violin"));

native.badgeCloner();
assert.strictEqual(lastDialog.name, "SECURITY LAB // BADGE CLONER");
choose("Compare physical badge to audit");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).badgeClonerVerified, true);

native.feliciaDaylight();
assert.strictEqual(lastDialog.name, "FELICIA // DAYLIGHT");
choose("Professional — ask about systems integration");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).trustScore, 2);

native.morningstarTrace();
assert.strictEqual(lastDialog.name, "TRACE BAY // MORNINGSTAR");
choose("Verify telemetry signature");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).morningstarSignatureFound, true);

native.rooftop();
assert.strictEqual(lastDialog.name, "ROOFTOP // SIGNAL");
choose("Observe signal timing");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).rooftopViolinVerified, true);
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).violinistRevealEligible, true);
choose("Recognize Felicia");
assert.strictEqual(global.TechOpsCampaignAct2.snapshot(load()).violinistRevealed, true);

const visual = global.TechOpsCampaignVisuals.show("rooftop_violin");
assert.strictEqual(visual.id, "rooftop_violin");
assert.ok(visual.layers.includes("cv-city-far"));
assert.ok(visual.layers.includes("cv-city-near"));
assert.ok(visual.layers.includes("cv-rooftop-floor"));

console.log("Campaign native Act II gameplay: PASS");
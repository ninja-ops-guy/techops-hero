"use strict";
const assert = require("assert");

global.__techopsCampaignNativeAct1Assets = null;
global.dlg = function () { return true; };
global.closeDlg = function () { return true; };

const visuals = require("./campaign_native_act1_visuals.js");

assert.strictEqual(visuals.VERSION, 3);
assert.strictEqual(visuals.url("shipping.dock_background"), "assets/campaign/shipping.dock_background.png");
assert.strictEqual(visuals.sceneForDialog("CAMPAIGN STANDUP"), "standup");
assert.strictEqual(visuals.sceneForDialog("WORKSTATION // COMPANY"), "workstation");
assert.strictEqual(visuals.sceneForDialog("SHIPPING CANNOT PRINT"), "shipping");
assert.strictEqual(visuals.sceneForDialog("PLATING WORKSTATION DOWN"), "plating");
assert.strictEqual(visuals.sceneForDialog("IMPOSSIBLE ACCESS EVENT"), "access");

global.__techopsCampaignNativeAct1Assets = { id: "plating" };
assert.strictEqual(visuals.sceneForDialog("ANY DIALOG"), "plating");
global.__techopsCampaignNativeAct1Assets = null;

const base = {
  flags: { standup_completed: false, day_work_unlocked: false },
  tickets: {},
  evidence: { ghostIdentityEvidence: { status: "unknown", sources: [] } }
};

let p = visuals.presentationFor("shipping", base);
assert.strictEqual(p.variant, "fault");
assert.deepStrictEqual(p.props, ["shipping.label_printer"]);
assert.deepStrictEqual(p.motion, ["forklift_pass", "printer_feed", "camera_track"]);

const shippingDone = JSON.parse(JSON.stringify(base));
shippingDone.tickets.shipping_cannot_print = { status: "resolved", verification: "strong", humanOutcome: "restored" };
p = visuals.presentationFor("shipping", shippingDone);
assert.strictEqual(p.variant, "verified");
assert.deepStrictEqual(p.props, ["shipping.printed_label_success"]);
assert.deepStrictEqual(p.motion, ["verification_glow", "printer_eject", "camera_push"]);
assert.match(p.statusText, /VERIFIED/);

p = visuals.presentationFor("plating", base);
assert.strictEqual(p.variant, "stopped");
assert.deepStrictEqual(p.props, ["plating.workstation_cracked", "plating.line_stopped_display"]);
assert.deepStrictEqual(p.motion, ["warning_beacon", "machine_idle", "camera_track"]);

const platingDone = JSON.parse(JSON.stringify(base));
platingDone.tickets.plating_workstation_down = { status: "resolved", verification: "strong", humanOutcome: "restored" };
p = visuals.presentationFor("plating", platingDone);
assert.strictEqual(p.variant, "restored");
assert.deepStrictEqual(p.props, []);
assert.deepStrictEqual(p.motion, ["machine_run", "status_clear", "camera_push"]);
assert.match(p.statusText, /LINE RESUMED/);

p = visuals.presentationFor("access", base);
assert.strictEqual(p.variant, "unresolved");
assert.deepStrictEqual(p.motion, ["audit_sweep", "evidence_pulse", "camera_push"]);

const accessDone = JSON.parse(JSON.stringify(base));
accessDone.evidence.ghostIdentityEvidence.status = "established";
accessDone.evidence.ghostIdentityEvidence.sources.push({ id: "badge_impossible_access", perspective: "firsthand" });
p = visuals.presentationFor("access", accessDone);
assert.strictEqual(p.variant, "documented");
assert.deepStrictEqual(p.motion, ["audit_lock", "evidence_stack", "camera_push"]);
assert.match(p.statusText, /PROVENANCE/);

p = visuals.presentationFor("workstation", base, "WORKSTATION // COMPANY");
assert.strictEqual(p.variant, "pre_shift");
assert.deepStrictEqual(p.motion, ["screen_scan", "camera_push"]);
p = visuals.presentationFor("workstation", base, "ENGINEERING THE HUMAN CONNECTION");
assert.strictEqual(p.variant, "company_video");
assert.ok(p.motion.includes("orpheus_glitch"));

const unlocked = JSON.parse(JSON.stringify(base));
unlocked.flags.day_work_unlocked = true;
p = visuals.presentationFor("workstation", unlocked, "09:00 // DAY SHIFT");
assert.strictEqual(p.variant, "clocked_in");
assert.strictEqual(p.statusText, "DAY SHIFT ACTIVE");

const owned = JSON.parse(JSON.stringify(base));
owned.flags.standup_completed = true;
p = visuals.presentationFor("standup", owned);
assert.strictEqual(p.variant, "owned");
assert.deepStrictEqual(p.motion, ["board_lock", "ambient_drift"]);
assert.strictEqual(visuals.EXIT_MS, 180);

console.log("Campaign Day 1 state-reactive visuals: PASS");

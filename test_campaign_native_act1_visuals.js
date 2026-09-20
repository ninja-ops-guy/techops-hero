"use strict";
const assert = require("assert");
const fs = require("fs");

global.__techopsCampaignNativeAct1Assets = null;
global.dlg = function () { return true; };
global.closeDlg = function () { return true; };
global.S = { px: 10, py: 8, room: "factory", area: "plating", facing: "right", clock: 540, day: 1 };

require("./campaign_act1.js");
const native = require("./campaign_native_act1.js");
const visuals = require("./campaign_native_act1_visuals.js");

assert.strictEqual(visuals.VERSION, 5);
assert.strictEqual(visuals.ENTER_MS, 240);
assert.strictEqual(visuals.EXIT_MS, 180);
assert.strictEqual(visuals.url("shipping.dock_background"), "assets/campaign/shipping.dock_background.png");
assert.strictEqual(visuals.sceneForDialog("CAMPAIGN STANDUP"), "standup");
assert.strictEqual(visuals.sceneForDialog("WORKSTATION // COMPANY"), "workstation");
assert.strictEqual(visuals.sceneForDialog("SHIPPING CANNOT PRINT"), "shipping");
assert.strictEqual(visuals.sceneForDialog("PLATING WORKSTATION DOWN"), "plating");
assert.strictEqual(visuals.sceneForDialog("IMPOSSIBLE ACCESS EVENT"), "access");

global.__techopsCampaignNativeAct1Assets = { id: "plating" };
assert.strictEqual(visuals.sceneForDialog("ANY DIALOG"), "plating");
global.__techopsCampaignNativeAct1Assets = null;

const snap = visuals.snapshotWorld();
assert.deepStrictEqual(snap, { px: 10, py: 8, room: "factory", area: "plating", map: null, facing: "right", clock: 540, day: 1 });
const focus = visuals.worldFocus(snap);
assert.ok(focus.x > 20 && focus.x < 30, "player X should seed the cinematic origin");
assert.ok(focus.y > 20 && focus.y < 30, "player Y should seed the cinematic origin");
global.S.px = 99; global.S.py = 99; global.S.room = "wrong"; global.S.area = "wrong"; global.S.facing = "left";
assert.strictEqual(visuals.restoreWorld(snap), true);
assert.strictEqual(global.S.px, 10);
assert.strictEqual(global.S.py, 8);
assert.strictEqual(global.S.room, "factory");
assert.strictEqual(global.S.area, "plating");
assert.strictEqual(global.S.facing, "right");
// Returning from presentation must not rewind legitimate simulation time.
global.S.clock = 555;
visuals.restoreWorld(snap);
assert.strictEqual(global.S.clock, 555);

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
shippingDone.tickets.shipping_cannot_print = { status: "resolved", technicalResolution: true, verification: "strong", humanOutcome: "restored" };
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
platingDone.tickets.plating_workstation_down = { status: "resolved", technicalResolution: true, verification: "strong", humanOutcome: "restored" };
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

// Text and visual success must share the same canonical read model.
for (const [scene, id, successfulVariant] of [
  ["shipping", "shipping_cannot_print", "verified"],
  ["plating", "plating_workstation_down", "restored"]
]) {
  for (const verification of ["partial", "strong"]) {
    for (const humanOutcome of ["restored", "degraded", "unmet"]) {
      const state = JSON.parse(JSON.stringify(base));
      state.tickets[id] = { status: "resolved", technicalResolution: true, verification, humanOutcome };
      const before = JSON.stringify(state), view = native.ticketRecord(state, id);
      const profile = visuals.show(scene, "CASEBOOK", state).presentation;
      const expected = view.status === "VERIFIED / RESTORED" ? successfulVariant : "follow_up";
      assert.strictEqual(profile.variant, expected, scene + ": " + verification + "/" + humanOutcome);
      if (expected === "follow_up") {
        assert.match(profile.statusText, /NEEDS FOLLOW-UP/);
        assert.deepStrictEqual(profile.motion, ["camera_push"]);
        assert.ok(!profile.props.includes("shipping.printed_label_success"));
      }
      assert.strictEqual(JSON.stringify(state), before, "visual review is read-only");
    }
  }
  for (const failure of ["missing_technical", "reopened", "conflict"]) {
    const state = JSON.parse(JSON.stringify(base));
    state.tickets[id] = { status: "resolved", technicalResolution: true, verification: "strong", humanOutcome: "restored" };
    if (failure === "missing_technical") delete state.tickets[id].technicalResolution;
    if (failure === "reopened") state.tickets[id].status = "reopened";
    if (failure === "conflict") state.humanOutcomes = { [id]: "degraded" };
    assert.strictEqual(visuals.presentationFor(scene, state).variant, "follow_up", scene + ": " + failure);
  }
}

const unrelated = JSON.parse(JSON.stringify(base));
unrelated.evidence.ghostIdentityEvidence = { status: "established", sources: [{ id: "unrelated_clue", perspective: "firsthand" }] };
assert.strictEqual(visuals.presentationFor("access", unrelated).variant, "unresolved");
const nativeApi = global.TechOpsCampaignNativeAct1;
global.TechOpsCampaignNativeAct1 = null;
assert.strictEqual(visuals.presentationFor("shipping", shippingDone).variant, "follow_up", "missing read model cannot certify restoration");
assert.strictEqual(visuals.presentationFor("access", accessDone).variant, "unresolved");
global.TechOpsCampaignNativeAct1 = nativeApi;

// The badge timestamp/door overlay must not leak through the CSS pseudo-element
// when an uninvestigated casebook entry is opened.
const visualSource = fs.readFileSync("campaign_native_act1_visuals_impl.js", "utf8");
assert.ok(visualSource.includes(".act1-reference.a1-investigation.a1-documented:after{content:"));
assert.ok(!visualSource.includes(".act1-reference.a1-investigation:after{content:"));
console.log("Campaign casebook visual outcome/provenance parity: PASS");

// The old workstation composition remains historical data in the visual bridge,
// but production must retire it before paint so ordinary workstation/user
// dialogue stays in the normal dialogue shell.
const browserLoader = fs.readFileSync("campaign_native_act1_visuals.js", "utf8");
const retirement = fs.readFileSync("workstation_cinematic_clarity_patch.js", "utf8");
assert.match(browserLoader, /workstation_cinematic_clarity_patch\.js\?v=20260904-workstation-retired-v2/);
assert.match(retirement, /VERSION:2/);
assert.match(retirement, /RETIRED:true/);
assert.match(retirement, /__techopsAct1ReferenceScene/);
assert.match(retirement, /a1-first_person/);
assert.match(retirement, /api\.hide\(true\)/);
assert.doesNotMatch(retirement, /COMPANY FEED \/\/ FELICIA/);
assert.doesNotMatch(retirement, /OPENING BRIEFING · SHIFT CLOCK PAUSED UNTIL CLOCK IN/);

console.log("Campaign Day 1 world-camera continuity + retired workstation concept overlay: PASS");

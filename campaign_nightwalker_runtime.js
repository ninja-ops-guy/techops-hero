/* TechOps Hero — Nightwalker: West Annex browser/Night-engine bridge.
* Reuses ordinary Night combat, Industrial scene art, and Sector 04 production
* assets. Mission state lives only in campaign_nightwalker.js storage.
*/
(function (root, factory) {
var api = factory(root);
if (typeof module === "object" && module.exports) module.exports = api;
if (root) root.TechOpsNightwalkerRuntime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
"use strict";
var FLOOR = 430;
var WIDTH = 1800;
var INTERACT_RANGE = 96;
var POINTS = Object.freeze([
{ id: "security_uplink", x: 130, y: FLOOR - 17, label: "Security Ops uplink", kind: "uplink" },
{ id: "access_audit", x: 390, y: 343, label: "Access audit", kind: "audit" },
{ id: "wiped_drive", x: 795, y: 268, label: "Drive WA-773", kind: "drive" },
{ id: "maintenance_panel", x: 1220, y: 268, label: "Maintenance panel", kind: "panel" },
{ id: "hypothesis_console", x: 1530, y: FLOOR - 17, label: "Analysis console", kind: "console" }
]);
var GUARD_SLOTS = {
idle: "sector04.access_guard.idle",
attack: "sector04.access_guard.attack",
suppressed: "sector04.access_guard.suppressed",
respawn: "sector04.access_guard.respawn",
controller: "sector04.identity_controller.active",
severed: "sector04.identity_controller.severed"
};
var activeMissionState = null;
var originNight = null;
var pendingEntry = null;
function missionApi() { if (!root || !root.TechOpsNightwalker) throw new Error("TechOpsNightwalker is required"); return root.TechOpsNightwalker; }
function sectorVisuals() { return root && root.TechOpsSector04Runtime ? root.TechOpsSector04Runtime : null; }
function storage() { return root && root.localStorage ? root.localStorage : null; }
function nowMs() { return root && root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now(); }
function message(night, text, ms) { night.msg = text; night.msgT = nowMs() + (ms || 2800); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() { if (!activeMissionState) activeMissionState = missionApi().load(storage()); return activeMissionState; }
function saveState(state) { activeMissionState = state || activeMissionState; missionApi().save(activeMissionState, storage()); return activeMissionState; }
function browserNight() { return root && root.S && root.S.nightMode ? root.S.nightMode : null; }
function standalone() { return !!(root && root.S && root.S.meta && root.S.meta._standaloneMode === "nightcrawler"); }
function closeVisuals() { if (root && root.TechOpsCampaignVisuals) root.TechOpsCampaignVisuals.hide(); }
function closeDialog() { closeVisuals(); if (root && root.closeDlg) root.closeDlg(); }
function dialog(title, text, options) { if (!root || !root.dlg) return false; root.dlg(title, text, options || []); return true; }
function notify(text) { if (root && root.toast) root.toast(text, 3600); }
function cloneOrigin(night) {
return JSON.parse(JSON.stringify(night, function (key, value) {
if (key === "_nightCombat" || key === "_nightwalker") return undefined;
return value;
}));
}
function platformLayout() {
return [
{ x: 300, y: 360, w: 170, h: 14 },
{ x: 535, y: 305, w: 112, h: 14 },
{ x: 710, y: 285, w: 170, h: 14 },
{ x: 945, y: 330, w: 128, h: 14 },
{ x: 1130, y: 285, w: 180, h: 14 },
{ x: 1390, y: 350, w: 150, h: 14 }
];
}
function accessGuard() {
var visuals = sectorVisuals();
var guard = visuals ? visuals.accessGuard() : {
name: "Access Guard", kind: "access_guard", assetSlot: GUARD_SLOTS.idle,
attackAssetSlot: GUARD_SLOTS.attack, suppressedAssetSlot: GUARD_SLOTS.suppressed,
respawnAssetSlot: GUARD_SLOTS.respawn, x: 780, y: FLOOR - 38, w: 30, h: 38,
hp: 72, maxHp: 72, spd: 1.05, dmg: 12, tint: "#8b5cf6", cash: [0, 0],
vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true, cd: 0, dashes: true
};
guard.x = 960;
guard.y = FLOOR - (guard.h || 38);
guard.spd = 0;
guard.dashes = false;
guard.dmg = 4;
guard.hp = guard.maxHp = 48;
var difficulty = root && root.TechOpsDifficulty && root.S && root.TechOpsDifficulty.profile ? root.TechOpsDifficulty.profile(root.S.diff) : null;
if (difficulty) {
guard.hp = Math.max(1, Math.round(guard.hp * difficulty.enemyHp));
guard.maxHp = guard.hp;
guard.dmg = Math.max(1, Math.round(guard.dmg * difficulty.damage));
}
guard.campaignNightwalkerGuard = true;
delete guard.campaignSector04Guard;
return guard;
}
function resolverFor(night) {
var rt = ensureNight(night);
if (!rt.assets) {
var visuals = sectorVisuals();
rt.assets = visuals ? visuals.createAssetResolver() : { records: {}, requestSlot: function () { return null; }, get: function () { return null; } };
Object.keys(GUARD_SLOTS).forEach(function (key) { rt.assets.requestSlot(GUARD_SLOTS[key]); });
}
return rt.assets;
}
function ensureNight(night) {
if (!night) throw new Error("A Night mode state is required");
if (!night._nightwalker) night._nightwalker = { active: true, inspectables: POINTS.map(function (p) { return Object.assign({}, p); }), respawnFxUntil: 0, hudStatus: "INVESTIGATE" };
night._nightwalker.active = true;
night._nightwalker.inspectables = night._nightwalker.inspectables || POINTS.map(function (p) { return Object.assign({}, p); });
return night._nightwalker;
}
function guard(night) {
if (!night || !night.enemies) return null;
for (var i = 0; i < night.enemies.length; i++) if (night.enemies[i].campaignNightwalkerGuard) return night.enemies[i];
return null;
}
function spawnGuard(night) {
var existing = guard(night);
if (existing && existing.alive) return existing;
night.enemies = (night.enemies || []).filter(function (enemy) { return !enemy.campaignNightwalkerGuard; });
var created = accessGuard();
night.enemies.push(created);
night.clear = false;
return created;
}
function removeGuard(night) {
var existing = guard(night);
if (existing) { existing.alive = false; existing.hp = 0; }
night.clear = false;
return existing;
}
function hudStatus(state) {
if (state.completed) return "VERIFIED";
if (state.relayIsolated) return "VERIFY WITH SECURITY OPS";
if (state.controllerRevealed) return "ISOLATE THE LIVE RELAY";
if (state.guard.suppressed) return "GUARD SUPPRESSED · INVESTIGATE";
if (state.stage === "insight_ready") return "USE INSIGHT";
if (state.evidence.length === 3) return "HYPOTHESIZE";
return "INVESTIGATE";
}
function syncHud(night, state) { ensureNight(night).hudStatus = hudStatus(state); }
function createEncounter(state, night) {
missionApi().start(state);
var rt = ensureNight(night);
night.district = "industrial";
night.street = 1;
night.drive = null;
night.x = 88;
night.y = FLOOR - (night.h || 34);
night.vx = 0; night.vy = 0; night.face = 1;
night.platforms = platformLayout();
night.enemies = [];
if (state.evidence.length > 0 && !state.relayIsolated && !state.guard.suppressed) spawnGuard(night);
night.clear = false;
night.cam = 0;
resolverFor(night);
syncHud(night, state);
message(night, "Inspect evidence.", 3600);
rt.lastInteraction = "entered";
return rt;
}
function nearestInspectable(night, x, y) {
var best = null;
ensureNight(night).inspectables.forEach(function (point) {
var dx = x - point.x, dy = y - point.y, distance = Math.sqrt(dx * dx + dy * dy);
if (distance <= INTERACT_RANGE && (!best || distance < best.distance)) best = Object.assign({}, point, { distance: distance });
});
return best;
}
function inspectNearest(state, night, x, y) {
var point = nearestInspectable(night, x, y);
if (!point) return null;
syncHud(night, state);
if (point.id === "security_uplink") {
if (!state.relayIsolated) return { id: point.id, blocked: true, message: missionApi().objective(state) };
var verified = missionApi().verifyWithRequester(state, { physicalBadge: true, requesterConfirmation: true });
removeGuard(night); syncHud(night, state);
return Object.assign({ id: point.id }, verified);
}
if (point.id === "hypothesis_console") {
if (state.controllerRevealed) return { id: point.id, blocked: true, message: "The supported hypothesis has exposed the live relay. Return to the maintenance panel." };
if (state.evidence.length < Object.keys(missionApi().EVIDENCE).length) return { id: point.id, blocked: true, message: "The console needs all three independent evidence sources before a responsible hypothesis can be recorded." };
return { id: point.id, requiresHypothesis: true };
}
if (point.id === "maintenance_panel" && state.controllerRevealed && !state.relayIsolated) {
var isolated = missionApi().isolateRelay(state);
removeGuard(night); syncHud(night, state);
return Object.assign({ id: point.id, text: "The live relay is isolated. The Access Guard cannot re-form. Return to Security Ops and verify the real outcome." }, isolated);
}
var inspected = missionApi().inspect(state, point.id);
if (state.evidence.length === 1 && !state.relayIsolated && !state.guard.suppressed && !guard(night)) spawnGuard(night);
syncHud(night, state);
return Object.assign({ point: point }, inspected);
}
function chooseHypothesis(state, night, id) {
var result = missionApi().hypothesize(state, id);
syncHud(night, state);
return result;
}
function useInsight(state, night) {
var result = missionApi().insight(state);
syncHud(night, state);
message(night, "INSIGHT — the maintenance relay is the live dependency.", 3800);
return result;
}
function syncCombat(state, night, atMs) {
var existing = guard(night);
if (!existing || existing.alive || existing.hp > 0) return { changed: false };
if (state.relayIsolated) { removeGuard(night); return { changed: false, permanent: true }; }
if (state.guard.suppressed) { night.clear = false; return { changed: false }; }
var result = missionApi().suppress(state, atMs);
night.clear = false;
ensureNight(night).respawnFxUntil = result.respawnAt;
syncHud(night, state);
message(night, "Access Guard suppressed. The incident remains; continue investigating.", 3200);
return { changed: true, suppressed: true, respawnAt: result.respawnAt };
}
function tick(state, night, atMs) {
var before = state.guard.respawnCount;
missionApi().tick(state, atMs);
if (state.relayIsolated) {
removeGuard(night);
ensureNight(night).respawnFxUntil = 0;
} else if (state.guard.respawnCount !== before) {
spawnGuard(night);
ensureNight(night).respawnFxUntil = 0;
message(night, "Access Guard reconstituted. Damage was never the resolution.", 2800);
}
syncHud(night, state);
return { respawned: state.guard.respawnCount !== before };
}
function drawAsset(ctx, night, slotId, sx, sy, defaultW, defaultH) {
var visuals = sectorVisuals(), resolver = resolverFor(night), record = resolver.requestSlot(slotId);
var presentation = visuals && visuals.presentationForSlot(slotId) || {};
var w = presentation.width || defaultW, h = presentation.height || defaultH;
if (record && record.status === "ready" && record.image) {
var y = presentation.anchor === "center" ? sy - h / 2 : sy - h;
ctx.drawImage(record.image, sx - w / 2, y, w, h);
return true;
}
if (visuals) return visuals.drawGeneratedAsset(ctx, slotId, sx, sy, w, h);
return false;
}
function drawPoint(ctx, point, sx, sy, state) {
var seen = state.evidence.indexOf(point.id) >= 0;
var accent = seen ? "#7ee787" : point.kind === "panel" ? "#fbbf24" : "#38bdf8";
ctx.save(); ctx.strokeStyle = accent; ctx.fillStyle = "rgba(7,15,24,.94)"; ctx.lineWidth = 2;
if (point.kind === "drive") {
ctx.fillRect(sx - 22, sy - 16, 44, 28); ctx.strokeRect(sx - 22, sy - 16, 44, 28);
ctx.fillStyle = accent; ctx.fillRect(sx - 15, sy - 9, 30, 4); ctx.fillRect(sx - 15, sy - 1, 20, 4);
} else if (point.kind === "panel") {
ctx.fillRect(sx - 28, sy - 52, 56, 52); ctx.strokeRect(sx - 28, sy - 52, 56, 52);
ctx.strokeStyle = "#f87171"; ctx.beginPath(); ctx.moveTo(sx - 17, sy - 40); ctx.lineTo(sx - 3, sy - 12); ctx.moveTo(sx, sy - 42); ctx.lineTo(sx + 14, sy - 10); ctx.stroke();
ctx.strokeStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(sx - 25, sy - 47); ctx.lineTo(sx - 11, sy - 33); ctx.moveTo(sx - 22, sy - 50); ctx.lineTo(sx - 8, sy - 36); ctx.stroke();
} else {
ctx.fillRect(sx - 26, sy - 46, 52, 36); ctx.strokeRect(sx - 26, sy - 46, 52, 36);
ctx.fillStyle = accent;
if (point.kind === "audit") {
ctx.fillRect(sx - 18, sy - 37, 30, 4); ctx.fillRect(sx - 18, sy - 27, 22, 4);
ctx.fillStyle = "#f87171"; ctx.fillRect(sx + 15, sy - 37, 5, 5);
} else if (point.kind === "console") {
ctx.font = "bold 22px monospace"; ctx.textAlign = "center"; ctx.fillText("?", sx, sy - 18);
} else {
ctx.fillRect(sx - 17, sy - 35, 34, 5); ctx.fillRect(sx - 17, sy - 24, 24, 5);
}
ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx, sy); ctx.moveTo(sx - 14, sy); ctx.lineTo(sx + 14, sy); ctx.stroke();
}
if (seen) { ctx.fillStyle = "#7ee787"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText("✓", sx + 27, sy - 45); }
ctx.restore();
}
function wrap(ctx, text, width) {
var words = String(text || "").split(/\s+/), lines = [], line = "";
words.forEach(function (word) {
var trial = line ? line + " " + word : word;
var measured = ctx.measureText ? ctx.measureText(trial).width : trial.length * 7;
if (line && measured > width) { lines.push(line); line = word; } else line = trial;
});
if (line) lines.push(line);
return lines;
}
function drawObjective(ctx, night, state, width, height) {
var W = width || 960, H = height || 720, compact = W < 620;
var cardW = Math.min(compact ? W - 20 : 440, W - 20), x = 10, y = compact ? H - 156 : H - 100;
var objective = missionApi().objective(state), lines = wrap(ctx, objective, cardW - 20).slice(0, 2);
ctx.save(); ctx.textAlign = "left"; ctx.fillStyle = "rgba(4,13,23,.90)"; ctx.fillRect(x, y, cardW, 78);
ctx.strokeStyle = "rgba(56,189,248,.48)"; ctx.strokeRect(x + .5, y + .5, cardW - 1, 77);
ctx.fillStyle = "#38bdf8"; ctx.font = "bold 11px monospace"; ctx.fillText(compact ? "WEST ANNEX · C FIELD REPORT" : "NIGHTWALKER / WEST ANNEX · C FIELD REPORT", x + 10, y + 17);
ctx.fillStyle = "#e5edf5"; ctx.font = "12px monospace";
lines.forEach(function (line, index) { ctx.fillText(line, x + 10, y + 37 + index * 16); });
ctx.fillStyle = "#9fb3c8"; ctx.font = "10px monospace"; ctx.fillText(state.evidence.length + "/3 EVIDENCE · " + hudStatus(state), x + 10, y + 69);
ctx.restore();
}
function drawOverlay(ctx, night, state, width, height) {
if (!ctx || !night || !night._nightwalker) return false;
var cam = night.cam || 0, W = width || ctx.canvas && ctx.canvas.width || 960, H = height || ctx.canvas && ctx.canvas.height || 720;
var existing = guard(night);
ctx.save();
if (existing && existing.alive) {
var slot = existing.windup > 0 || existing.cd > 0 ? GUARD_SLOTS.attack : existing.hitT > 0 || existing.down > 0 ? GUARD_SLOTS.suppressed : GUARD_SLOTS.idle;
drawAsset(ctx, night, slot, existing.x + (existing.w || 30) / 2 - cam, existing.y + (existing.h || 38), 64, 70);
} else if (night._nightwalker.respawnFxUntil > nowMs()) {
drawAsset(ctx, night, GUARD_SLOTS.respawn, 975 - cam, FLOOR - 18, 72, 72);
}
night._nightwalker.inspectables.forEach(function (point) {
var sx = point.x - cam;
if (sx < -80 || sx > W + 80) return;
drawPoint(ctx, point, sx, point.y + 17, state);
if (point.id === "maintenance_panel" && state.controllerRevealed) drawAsset(ctx, night, state.relayIsolated ? GUARD_SLOTS.severed : GUARD_SLOTS.controller, sx, point.y - 45, 48, 48);
ctx.fillStyle = "#e5edf5"; ctx.font = "11px monospace"; ctx.textAlign = "center";
var label = point.id === "security_uplink" && state.relayIsolated ? "Verify with Security Ops" : point.label;
ctx.fillText(label, sx, point.y - 65);
});
var nearest = nearestInspectable(night, night.x + night.w / 2, night.y + night.h / 2);
if (nearest) {
ctx.fillStyle = "#fff2cd"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
ctx.fillText("E " + (nearest.id === "security_uplink" && state.relayIsolated ? "VERIFY" : nearest.id === "hypothesis_console" ? "ANALYZE" : "INSPECT"), nearest.x - cam, nearest.y - 86);
}
drawObjective(ctx, night, state, W, H);
ctx.restore();
return true;
}
function showBriefing(resumed) {
if (root.TechOpsCampaignVisuals) root.TechOpsCampaignVisuals.show("badge_lab");
var state = loadState();
var title = resumed ? "WEST ANNEX // FIELD REPORT RESUMED" : "NIGHTWALKER // THE TRAIL THAT SHOULDN'T EXIST";
var body = "Security Ops: “Overnight we logged a camera gap, a wiped drive, and badge anomalies in the West Annex. This is deliberate—but deliberate does not tell us who.”<br><br>" +
"Inspect the <b>access audit</b>, <b>drive WA-773</b>, and the <b>maintenance panel</b>. Form a hypothesis only after all three records agree. Move with <b>A/D or arrows</b>, jump with <b>Space</b>, and inspect with <b>E</b>. The Access Guard can be suppressed or avoided; it is not the objective.<br><br><b>Current step:</b> " + missionApi().objective(state);
return dialog(title, body, [{ t: "Begin at the Security Ops uplink", f: closeDialog }]);
}
function showHypotheses() {
var night = browserNight(), state = loadState();
var options = missionApi().HYPOTHESES.map(function (hypothesis) {
return { t: hypothesis.label, f: function () {
var result = chooseHypothesis(state, night, hypothesis.id);
saveState(state);
if (result.supported) return dialog("WEST ANNEX // SUPPORTED HYPOTHESIS", result.feedback, [
{ t: "Use Insight — reveal the live dependency", f: function () { useInsight(state, night); saveState(state); dialog("INSIGHT // LIVE IDENTITY RELAY", "The maintenance relay supplies valid identity without verified presence. Isolating it will stop the Access Guard from re-forming.<br><br>Return to the maintenance panel. Combat remains optional.", [{ t: "Continue to the relay", f: closeDialog }]); } },
{ t: "Review other hypotheses", f: showHypotheses }
]);
return dialog("WEST ANNEX // NOT SUPPORTED", result.feedback, [{ t: "Review other hypotheses", f: showHypotheses }, { t: "Return to the evidence", f: closeDialog }]);
} };
});
options.push({ t: "Return to the evidence", f: closeDialog });
return dialog("WEST ANNEX // HYPOTHESIZE", "Choose only what the three records support. An incorrect hypothesis does not destroy evidence or end the mission.", options);
}
function showInteraction(result) {
var night = browserNight(), state = loadState();
if (!result) return false;
saveState(state);
if (result.requiresHypothesis) return showHypotheses();
if (result.verified) {
if (root.TechOpsCampaignVisuals) root.TechOpsCampaignVisuals.show("badge_lab");
return dialog("WEST ANNEX // VERIFIED", "Security Ops holds a real badge against the reader. The audit records the same person standing in front of it.<br><br>Security Ops: “Valid identity. Verified presence. That's the confirmation I needed.”<br><br>The relay stays isolated. The wiped drive and audit remain preserved as evidence; the actor's identity and intent remain unproven.<br><br><b>Field report complete.</b>", [
{ t: "Save report and return to free roam", f: exitToFreeRoam },
{ t: "Review the completed field report", f: openJournal }
]);
}
if (result.isolated) return dialog("WEST ANNEX // DEPENDENCY ISOLATED", result.text, [{ t: "Return to the Security Ops uplink", f: closeDialog }]);
if (result.blocked) return dialog("WEST ANNEX // CURRENT STEP", result.message, [{ t: "Continue", f: closeDialog }]);
if (result.text) return dialog(result.label || "WEST ANNEX // EVIDENCE", result.text + "<br><br><b>Evidence:</b> " + state.evidence.length + "/3<br><b>Next:</b> " + missionApi().objective(state), [{ t: "Record and continue", f: closeDialog }]);
return false;
}
function browserInteract() {
var night = browserNight();
if (!night || !night._nightwalker || !night._nightwalker.active) return false;
var state = loadState(), result = inspectNearest(state, night, night.x + night.w / 2, night.y + night.h / 2);
if (!result) return false;
showInteraction(result);
return true;
}
function openJournal() {
var night = browserNight(), state = loadState();
if (!night || !night._nightwalker) return false;
var evidence = Object.keys(missionApi().EVIDENCE).map(function (id) {
var seen = state.evidence.indexOf(id) >= 0;
return (seen ? "✓ " : "○ ") + missionApi().EVIDENCE[id].label;
}).join("<br>");
var options = [{ t: "Resume the field report", f: closeDialog }];
if (state.completed) options.push({ t: "Return to free roam", f: exitToFreeRoam });
else options.push({ t: "Save progress and return to free roam", f: exitToFreeRoam });
options.push({ t: "Restart this field report", f: function () {
return dialog("RESTART WEST ANNEX?", "Only this standalone field report will be reset. Ordinary Night progress and all Day-campaign saves remain unchanged.", [
{ t: "Confirm restart", f: function () { var fresh = missionApi().initialState(); activeMissionState = fresh; createEncounter(fresh, night); saveState(fresh); showBriefing(false); } },
{ t: "Keep current report", f: openJournal }
]);
} });
return dialog("NIGHTWALKER // WEST ANNEX FIELD REPORT", "<b>Current step:</b> " + missionApi().objective(state) + "<br><br>" + evidence + "<br><br>Hypothesis: " + (state.hypothesis || "not recorded") + "<br>Relay: " + (state.relayIsolated ? "isolated" : state.controllerRevealed ? "revealed" : "not understood") + "<br>Human verification: " + (state.requesterVerified ? "confirmed" : "pending") + "<br><br>This standalone report never writes Day-campaign objectives.", options);
}
function exitToFreeRoam() {
var night = browserNight();
if (!night) return false;
saveState(loadState());
closeDialog();
if (originNight) {
var restored = clone(originNight);
Object.keys(night).forEach(function (key) { delete night[key]; });
Object.assign(night, restored);
originNight = null;
} else {
delete night._nightwalker;
if (root.nmLoadDistrict) root.nmLoadDistrict("downtown");
}
delete night._nightwalker;
night.clear = false;
message(night, "West Annex field report saved. Free roam resumed.", 3600);
notify("West Annex field report saved — free roam resumed");
return true;
}
function attachBrowserEncounter(night) {
if (!night || night._v736 || !standalone()) return false;
if (night._nightwalker && night._nightwalker.active) return night._nightwalker;
if (!originNight) originNight = cloneOrigin(night);
var state = loadState(), resumed = state.history.length > 0;
createEncounter(state, night);
saveState(state);
showBriefing(resumed);
return night._nightwalker;
}
function enterBrowser() {
if (!standalone()) {
dialog("NIGHTWALKER // STANDALONE FIELD REPORT", "West Annex is available from the standalone Night Crawler run menu. Day-campaign objectives are not changed.", [{ t: "Back", f: closeDialog }]);
return false;
}
var night = browserNight();
if (night && night._v736) return false;
if (root.closeDlg) root.closeDlg();
if (night) return attachBrowserEncounter(night);
pendingEntry = root.S;
if (root.enterNight) root.enterNight();
night = browserNight();
if (night) { pendingEntry = null; return attachBrowserEncounter(night); }
return { pending: true };
}
function onNightEntered(event) {
if (!pendingEntry) return;
var expected = pendingEntry; pendingEntry = null;
if (root.S !== expected || !standalone()) return;
attachBrowserEncounter(event && event.detail && event.detail.night || browserNight());
}
function install() {
if (!root || root.__techopsNightwalkerRuntimeInstalled) return false;
root.__techopsNightwalkerRuntimeInstalled = true;
if (root.addEventListener) root.addEventListener("techops:night-entered", onNightEntered);
if (typeof root.stepNM === "function") {
var originalStep = root.stepNM;
root.stepNM = function () {
var result = originalStep.apply(this, arguments), night = browserNight();
if (night && night._nightwalker && night._nightwalker.active && !(root.S && root.S.inDialog)) {
var state = loadState(), combat = syncCombat(state, night, nowMs()), clock = tick(state, night, nowMs());
if (combat.changed || clock.respawned) saveState(state);
}
return result;
};
}
if (typeof root.drawNM === "function") {
var originalDraw = root.drawNM;
root.drawNM = function () {
var result = originalDraw.apply(this, arguments), night = browserNight();
if (night && night._nightwalker && night._nightwalker.active && root.ctx) drawOverlay(root.ctx, night, loadState(), root.cv && root.cv.width, root.cv && root.cv.height);
return result;
};
}
if (typeof root.interact === "function") {
var originalInteract = root.interact;
root.interact = function () { if (browserInteract()) return; return originalInteract.apply(this, arguments); };
}
return true;
}
var api = {
POINTS: POINTS,
GUARD_SLOTS: GUARD_SLOTS,
platformLayout: platformLayout,
accessGuard: accessGuard,
createEncounter: createEncounter,
nearestInspectable: nearestInspectable,
inspectNearest: inspectNearest,
chooseHypothesis: chooseHypothesis,
useInsight: useInsight,
syncCombat: syncCombat,
tick: tick,
drawOverlay: drawOverlay,
enterBrowser: enterBrowser,
openJournal: openJournal,
exitToFreeRoam: exitToFreeRoam,
install: install
};
if (root && root.document) {
if (root.document.readyState === "loading" && root.document.addEventListener) root.document.addEventListener("DOMContentLoaded", install);
else install();
}
return api;
});

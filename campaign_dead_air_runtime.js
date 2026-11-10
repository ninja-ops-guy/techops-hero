/* TechOps Hero — Nightwalker: Dead Air at Pier 7 runtime.
 * Reuses Night combat and Long Wharf scene art with independent mission state.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsDeadAirRuntime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";
  var FLOOR = 430;
  var INTERACT_RANGE = 96;
  var POINTS = Object.freeze([
    { id: "dock_uplink", x: 130, y: FLOOR - 17, label: "Dockworker uplink", kind: "uplink" },
    { id: "pier_gate", x: 360, y: 333, label: "Pier 7 gate relay", kind: "relay" },
    { id: "crane4", x: 795, y: 263, label: "Crane 4 relay", kind: "relay" },
    { id: "bait_tackle", x: 1220, y: 268, label: "Bait & Tackle relay", kind: "relay" },
    { id: "recorder_console", x: 1530, y: FLOOR - 17, label: "Recovery console", kind: "console" }
  ]);
  var activeState = null;
  var originNight = null;
  var pendingEntry = null;
  function missionApi() { if (!root || !root.TechOpsDeadAir) throw new Error("TechOpsDeadAir is required"); return root.TechOpsDeadAir; }
  function sectorVisuals() { return root && root.TechOpsSector04Runtime ? root.TechOpsSector04Runtime : null; }
  function storage() { return root && root.localStorage ? root.localStorage : null; }
  function nowMs() { return root && root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now(); }
  function message(night, text, ms) { night.msg = text; night.msgT = nowMs() + (ms || 2800); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadState() { if (!activeState) activeState = missionApi().load(storage()); return activeState; }
  function saveState(state) { activeState = state || activeState; missionApi().save(activeState, storage()); return activeState; }
  function browserNight() { return root && root.S && root.S.nightMode ? root.S.nightMode : null; }
  function standalone() { return !!(root && root.S && root.S.meta && root.S.meta._standaloneMode === "nightcrawler"); }
  function closeDialog() { if (root && root.TechOpsCampaignVisuals) root.TechOpsCampaignVisuals.hide(); if (root && root.closeDlg) root.closeDlg(); }
  function dialog(title, text, options) { if (!root || !root.dlg) return false; root.dlg(title, text, options || []); return true; }
  function notify(text) { if (root && root.toast) root.toast(text, 3600); }
  function cloneOrigin(night) { return JSON.parse(JSON.stringify(night, function (key, value) { if (key === "_nightCombat" || key === "_nightwalker") return undefined; return value; })); }
  function platformLayout() {
    return [
      { x: 250, y: 350, w: 150, h: 14 },
      { x: 470, y: 310, w: 130, h: 14 },
      { x: 720, y: 280, w: 170, h: 14 },
      { x: 945, y: 335, w: 135, h: 14 },
      { x: 1130, y: 285, w: 180, h: 14 },
      { x: 1420, y: 345, w: 140, h: 14 }
    ];
  }
  function skimmer() {
    var profile = root && root.TechOpsDifficulty && root.S && root.TechOpsDifficulty.profile ? root.TechOpsDifficulty.profile(root.S.diff) : { enemyHp: 1, damage: 1 };
    return {
      name: "Cyber Skimmer", kind: "skimmer", campaignDeadAirSkimmer: true,
      x: 960, y: FLOOR - 28, w: 22, h: 28,
      hp: Math.round(40 * profile.enemyHp), maxHp: Math.round(40 * profile.enemyHp),
      spd: 0, dmg: Math.max(1, Math.round(6 * profile.damage)), tint: "#67e8f9", cash: [0, 0],
      vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true, cd: 0, dashes: false
    };
  }
  function ensureNight(night) {
    if (!night) throw new Error("A Night mode state is required");
    if (!night._nightwalker) night._nightwalker = { active: true, runtimeId: "deadAir", districtName: "LONG WHARF", accent: "#2dd4bf", inspectables: POINTS.map(function (p) { return Object.assign({}, p); }), respawnFxUntil: 0, hudStatus: "TRIANGULATE", lastPlayerHp: night.hp || 100 };
    night._nightwalker.active = true;
    return night._nightwalker;
  }
  function guard(night) {
    if (!night || !night.enemies) return null;
    for (var i = 0; i < night.enemies.length; i++) if (night.enemies[i].campaignDeadAirSkimmer) return night.enemies[i];
    return null;
  }
  function spawnGuard(night) {
    var existing = guard(night);
    if (existing && existing.alive) return existing;
    night.enemies = (night.enemies || []).filter(function (enemy) { return !enemy.campaignDeadAirSkimmer; });
    var created = skimmer();
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
    if (state.choice) return "VERIFY CARGO A17";
    if (state.triangulated) return "CHOOSE RECOVERY";
    if (state.guard.suppressed) return "SKIMMER SUPPRESSED";
    return "TUNE " + state.tunedRelays.length + "/3 · " + state.recordingIntegrity + "%";
  }
  function syncHud(night, state) { ensureNight(night).hudStatus = hudStatus(state); }
  function createEncounter(state, night) {
    missionApi().start(state);
    var rt = ensureNight(night);
    night.district = "longwharf";
    night.street = 1;
    night.drive = null;
    night.x = 88; night.y = FLOOR - (night.h || 34);
    night.vx = 0; night.vy = 0; night.face = 1;
    night.platforms = platformLayout();
    night.enemies = [];
    if (state.tunedRelays.length > 0 && !state.completed && !state.guard.suppressed) spawnGuard(night);
    night.clear = false; night.cam = 0;
    rt.lastPlayerHp = night.hp || 100;
    syncHud(night, state);
    message(night, "Tune three relays.", 3600);
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
    if (point.id === "dock_uplink") {
      if (!state.choice) return { id: point.id, blocked: true, message: missionApi().objective(state) };
      var verified = missionApi().verifyWithRequester(state, { physicalSeal: true, requesterConfirmation: true });
      removeGuard(night); syncHud(night, state);
      return Object.assign({ id: point.id }, verified);
    }
    if (point.id === "recorder_console") {
      if (!state.triangulated) return { id: point.id, blocked: true, message: "The recovery console needs all three relay timings before it can reconstruct the manifest." };
      return { id: point.id, requiresRecoveryChoice: true };
    }
    var relay = missionApi().RELAYS[point.id];
    if (!relay) return null;
    if (state.tunedRelays.indexOf(point.id) >= 0) return { id: point.id, blocked: true, message: relay.observation };
    return { id: point.id, requiresTune: true, observation: relay.observation };
  }
  function tuneRelay(state, night, id, filter) {
    var result = missionApi().tune(state, id, filter);
    if (result.tuned && !result.alreadyTuned && !state.completed && !state.guard.suppressed && !guard(night)) spawnGuard(night);
    syncHud(night, state);
    return result;
  }
  function restoreRecording(state, night) {
    var result = missionApi().restoreRecording(state);
    syncHud(night, state);
    return { restored: true, integrity: result };
  }
  function chooseRecovery(state, night, choice) {
    var result = missionApi().choose(state, choice);
    syncHud(night, state);
    return result;
  }

  function syncCombat(state, night, atMs) {
    var existing = guard(night);
    if (!existing || existing.alive || existing.hp > 0) return { changed: false };
    if (state.completed) { removeGuard(night); return { changed: false, permanent: true }; }
    if (state.guard.suppressed) { night.clear = false; return { changed: false }; }
    var result = missionApi().suppress(state, atMs);
    night.clear = false;
    ensureNight(night).respawnFxUntil = result.respawnAt;
    syncHud(night, state);
    message(night, "Skimmer suppressed. The recording still needs work.", 3000);
    return { changed: true, respawnAt: result.respawnAt };
  }
  function tick(state, night, atMs) {
    var rt = ensureNight(night), before = state.guard.respawnCount;
    if (typeof night.hp === "number" && night.hp < rt.lastPlayerHp) {
      var integrityDamage = Math.max(1, Math.round((rt.lastPlayerHp - night.hp) / 2));
      missionApi().damageRecording(state, integrityDamage);
      rt.lastIntegrityHitAt = atMs;
    }
    if (typeof night.hp === "number") rt.lastPlayerHp = night.hp;
    missionApi().tick(state, atMs);
    if (state.completed) {
      removeGuard(night);
      rt.respawnFxUntil = 0;
    } else if (state.guard.respawnCount !== before) {
      spawnGuard(night);
      rt.respawnFxUntil = 0;
      message(night, "Skimmer reconstituted. Keep the recording intact.", 2800);
    }
    syncHud(night, state);
    return { respawned: state.guard.respawnCount !== before, integrityChanged: rt.lastIntegrityHitAt === atMs };
  }
  function resolverFor(night) {
    var rt = ensureNight(night), visuals = sectorVisuals();
    if (!rt.assets && visuals) {
      rt.assets = visuals.createAssetResolver();
      rt.assets.requestSlot("sector04.violin_note.fx");
    }
    return rt.assets || null;
  }
  function drawViolin(ctx, night, sx, sy) {
    var visuals = sectorVisuals(), resolver = resolverFor(night);
    if (!visuals || !resolver) return false;
    var record = resolver.requestSlot("sector04.violin_note.fx");
    if (record && record.status === "ready" && record.image) {
      ctx.drawImage(record.image, sx - 21, sy - 42, 42, 42);
      return true;
    }
    return visuals.drawGeneratedAsset(ctx, "sector04.violin_note.fx", sx, sy, 42, 42);
  }
  function drawRelay(ctx, point, sx, sy, state) {
    var tuned = state.tunedRelays.indexOf(point.id) >= 0;
    var accent = tuned ? "#7ee787" : "#2dd4bf";
    ctx.save(); ctx.strokeStyle = accent; ctx.fillStyle = "rgba(5,19,25,.92)"; ctx.lineWidth = 2;
    if (point.kind === "relay") {
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - 50); ctx.moveTo(sx - 18, sy - 26); ctx.lineTo(sx + 18, sy - 40); ctx.moveTo(sx + 18, sy - 26); ctx.lineTo(sx - 18, sy - 40); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy - 53, 5, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
      ctx.globalAlpha = .45; ctx.beginPath(); ctx.arc(sx, sy - 53, tuned ? 22 : 15, 0, Math.PI * 2); ctx.stroke();
      if (tuned) { ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(sx, sy - 53, 31, 0, Math.PI * 2); ctx.stroke(); }
    } else {
      ctx.fillRect(sx - 26, sy - 46, 52, 36); ctx.strokeRect(sx - 26, sy - 46, 52, 36);
      ctx.fillStyle = accent; ctx.fillRect(sx - 17, sy - 35, 34, 5); ctx.fillRect(sx - 17, sy - 24, 24, 5);
      ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx, sy); ctx.moveTo(sx - 14, sy); ctx.lineTo(sx + 14, sy); ctx.stroke();
    }
    if (tuned) { ctx.fillStyle = "#7ee787"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText("✓", sx + 27, sy - 50); }
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
  function drawObjective(ctx, state, width, height) {
    var W = width || 960, H = height || 720, compact = W < 620;
    var cardW = Math.min(compact ? W - 20 : 450, W - 20), x = 10, y = compact ? H - 164 : H - 108;
    var lines = wrap(ctx, missionApi().objective(state), cardW - 20).slice(0, 2);
    ctx.save(); ctx.textAlign = "left"; ctx.fillStyle = "rgba(4,16,22,.91)"; ctx.fillRect(x, y, cardW, 86);
    ctx.strokeStyle = "rgba(45,212,191,.50)"; ctx.strokeRect(x + .5, y + .5, cardW - 1, 85);
    ctx.fillStyle = "#2dd4bf"; ctx.font = "bold 11px monospace"; ctx.fillText(compact ? "PIER 7 · C FIELD REPORT" : "DEAD AIR / PIER 7 · C FIELD REPORT", x + 10, y + 17);
    ctx.fillStyle = "#e5edf5"; ctx.font = "12px monospace";
    lines.forEach(function (line, index) { ctx.fillText(line, x + 10, y + 35 + index * 16); });
    ctx.fillStyle = "#304053"; ctx.fillRect(x + 10, y + 72, cardW - 20, 7);
    ctx.fillStyle = state.recordingIntegrity >= 60 ? "#2dd4bf" : "#fbbf24"; ctx.fillRect(x + 10, y + 72, (cardW - 20) * state.recordingIntegrity / 100, 7);
    ctx.fillStyle = "#d8e7f5"; ctx.font = "10px monospace"; ctx.fillText("RECORDING " + state.recordingIntegrity + "%", x + 10, y + 66);
    ctx.restore();
  }
  function drawOverlay(ctx, night, state, width, height) {
    if (!ctx || !night || !night._nightwalker) return false;
    var cam = night.cam || 0, W = width || ctx.canvas && ctx.canvas.width || 960, H = height || ctx.canvas && ctx.canvas.height || 720;
    ctx.save();
    if (night._nightwalker.respawnFxUntil > nowMs()) {
      ctx.strokeStyle = "#67e8f9"; ctx.globalAlpha = .75; ctx.beginPath(); ctx.arc(975 - cam, FLOOR - 25, 28, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    night._nightwalker.inspectables.forEach(function (point) {
      var sx = point.x - cam;
      if (sx < -80 || sx > W + 80) return;
      drawRelay(ctx, point, sx, point.y + 17, state);
      if (point.id === "recorder_console" && state.triangulated) drawViolin(ctx, night, sx + 32, point.y - 45);
      ctx.fillStyle = "#e5edf5"; ctx.font = "11px monospace"; ctx.textAlign = "center";
      ctx.fillText(point.id === "dock_uplink" && state.choice ? "Verify cargo A17" : point.label, sx, point.y - 65);
    });
    var nearest = nearestInspectable(night, night.x + night.w / 2, night.y + night.h / 2);
    if (nearest) {
      ctx.fillStyle = "#fff2cd"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
      var action = nearest.id === "dock_uplink" && state.choice ? "VERIFY" : nearest.id === "recorder_console" ? "CHOOSE" : nearest.kind === "relay" ? "TUNE" : "INSPECT";
      ctx.fillText("E " + action, nearest.x - cam, nearest.y - 86);
    }
    drawObjective(ctx, state, W, H);
    ctx.restore();
    return true;
  }

  function showBriefing(resumed) {
    if (root.TechOpsCampaignVisuals) root.TechOpsCampaignVisuals.show("morningstar_trace");
    var state = loadState();
    var title = resumed ? "PIER 7 // FIELD REPORT RESUMED" : "NIGHTWALKER // DEAD AIR AT PIER 7";
    var body = "Dockworker: “The overnight aerospace manifest went dead. Crates are here, but I can't release them without matching records.”<br><br>" +
      "Tune the <b>Pier 7 gate</b>, <b>Crane 4</b>, and <b>Bait & Tackle</b> relays. Read each waveform before choosing a filter. A Cyber Skimmer can damage Mike and the recording, but combat is optional.<br><br>" +
      "Move with <b>A/D or arrows</b>, jump with <b>Space</b>, and interact with <b>E</b>.<br><br><b>Current step:</b> " + missionApi().objective(state);
    return dialog(title, body, [{ t: "Begin at the dockworker uplink", f: closeDialog }]);
  }
  function showTune(id) {
    var night = browserNight(), state = loadState(), relay = missionApi().RELAYS[id];
    if (!relay) return false;
    var options = missionApi().FILTERS.map(function (filter) {
      return { t: filter + " filter", f: function () {
        var result = tuneRelay(state, night, id, filter);
        saveState(state);
        if (!result.tuned) return dialog("PIER 7 // FILTER MISMATCH", result.feedback + "<br><br>Recording integrity: <b>" + result.integrity + "%</b>", [{ t: "Try another filter", f: function () { showTune(id); } }, { t: "Return to the relay", f: closeDialog }]);
        if (result.triangulated) return dialog("PIER 7 // SOURCE TRIANGULATED", "The three timings align. The recovered manifest is readable again. Beneath it, a single violin phrase survives without identifying its source.<br><br>Restore the recording if needed, then choose whether to broadcast or isolate the recovery.", [{ t: "Review recovery choices", f: showRecoveryChoice }]);
        return dialog("PIER 7 // RELAY TUNED", result.observation + "<br><br>Recording integrity: <b>" + result.integrity + "%</b><br><b>Next:</b> " + missionApi().objective(state), [{ t: "Continue to the next relay", f: closeDialog }]);
      } };
    });
    options.push({ t: "Return to the relay", f: closeDialog });
    return dialog(relay.label.toUpperCase(), relay.observation + "<br><br>Choose the filter that matches this observation.", options);
  }
  function showRecoveryChoice() {
    var night = browserNight(), state = loadState();
    if (!state.triangulated) return dialog("PIER 7 // RECOVERY INCOMPLETE", "All three relays are required before choosing a recovery approach.", [{ t: "Return to the relays", f: closeDialog }]);
    var options = [];
    if (state.recordingIntegrity < 100) options.push({ t: "Restore recording to 100%", f: function () { restoreRecording(state, night); saveState(state); showRecoveryChoice(); } });
    if (state.recordingIntegrity >= 60) options.push({ t: "Broadcast — fastest crew recovery; share the recording", f: function () { finishChoice("broadcast"); } });
    options.push({ t: "Isolate — restore locally; protect the unknown source", f: function () { finishChoice("isolate"); } });
    options.push({ t: "Return to the relays", f: closeDialog });
    var body = "The manifest can be restored, but the violin source remains unidentified.<br><br><b>Recording integrity: " + state.recordingIntegrity + "%</b><br><br>" +
      "<b>Broadcast</b> gets the manifest to the dock crew immediately and shares the recovered recording. <b>Isolate</b> restores a verified local copy while protecting the unknown source.<br><br>Broadcast requires at least 60% integrity. Either approach still requires physical cargo verification.";
    return dialog("PIER 7 // RECOVERY CHOICE", body, options);
  }
  function finishChoice(choice) {
    var night = browserNight(), state = loadState();
    chooseRecovery(state, night, choice);
    saveState(state);
    var body = choice === "broadcast" ? "The restored manifest and recording go to the dock crew. The source is shared, not identified." : "The restored manifest stays on a verified local copy. The unknown source remains protected.";
    return dialog("PIER 7 // " + (choice === "broadcast" ? "BROADCAST" : "ISOLATE"), body + "<br><br>Return to the dockworker with the physical <b>A17 cargo seal</b> and the restored manifest.", [{ t: "Return to the dockworker", f: closeDialog }]);
  }
  function showInteraction(result) {
    var state = loadState();
    if (!result) return false;
    saveState(state);
    if (result.requiresTune) return showTune(result.id);
    if (result.requiresRecoveryChoice) return showRecoveryChoice();
    if (result.verified) {
      if (root.TechOpsCampaignVisuals) root.TechOpsCampaignVisuals.show("morningstar_trace");
      var source = state.choice === "broadcast" ? "The restored manifest and recording are now shared with the crew." : "The restored manifest remains on a verified local copy. The unknown source stays protected.";
      return dialog("PIER 7 // CARGO VERIFIED", "The dockworker checks the physical A17 seal against the restored manifest. Crate and record agree.<br><br>Dockworker: “That's the confirmation I needed. Release it.”<br><br>" + source + "<br><br><b>Field report complete.</b>", [
        { t: "Save report and return to free roam", f: exitToFreeRoam },
        { t: "Review the completed field report", f: openJournal }
      ]);
    }
    if (result.blocked) return dialog("PIER 7 // CURRENT STEP", result.message, [{ t: "Continue", f: closeDialog }]);
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
    var relays = Object.keys(missionApi().RELAYS).map(function (id) { return (state.tunedRelays.indexOf(id) >= 0 ? "✓ " : "○ ") + missionApi().RELAYS[id].label; }).join("<br>");
    var options = [{ t: "Resume the field report", f: closeDialog }, { t: "Save progress and return to free roam", f: exitToFreeRoam }];
    options.push({ t: "Restart this field report", f: function () {
      return dialog("RESTART PIER 7?", "Only this standalone field report will be reset. Ordinary Night progress, West Annex, and all Day-campaign saves remain unchanged.", [
        { t: "Confirm restart", f: function () { var fresh = missionApi().initialState(); activeState = fresh; createEncounter(fresh, night); saveState(fresh); showBriefing(false); } },
        { t: "Keep current report", f: openJournal }
      ]);
    } });
    return dialog("NIGHTWALKER // PIER 7 FIELD REPORT", "<b>Current step:</b> " + missionApi().objective(state) + "<br><br>" + relays + "<br><br>Recording integrity: <b>" + state.recordingIntegrity + "%</b><br>Recovery: " + (state.choice || "not chosen") + "<br>Source identity: " + state.sourceIdentity + "<br>Human verification: " + (state.requesterVerified ? "confirmed" : "pending") + "<br><br>This standalone report never writes Day-campaign objectives.", options);
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
    message(night, "Pier 7 field report saved. Free roam resumed.", 3600);
    notify("Pier 7 field report saved — free roam resumed");
    return true;
  }
  function attachBrowserEncounter(night) {
    if (!night || night._v736 || !standalone()) return false;
    if (night._nightwalker && night._nightwalker.active) return night._nightwalker;
    if (!originNight) originNight = cloneOrigin(night);
    var state = loadState(), resumed = state.history.length > 0;
    createEncounter(state, night);
    saveState(state);
    if (state.completed) return openJournal();
    showBriefing(resumed);
    return night._nightwalker;
  }
  function enterBrowser() {
    if (!standalone()) {
      dialog("NIGHTWALKER // STANDALONE FIELD REPORT", "Pier 7 is available from the standalone Night Crawler run menu. Day-campaign objectives are not changed.", [{ t: "Back", f: closeDialog }]);
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
    if (!root || root.__techopsDeadAirRuntimeInstalled) return false;
    root.__techopsDeadAirRuntimeInstalled = true;
    if (root.addEventListener) root.addEventListener("techops:night-entered", onNightEntered);
    if (typeof root.stepNM === "function") {
      var originalStep = root.stepNM;
      root.stepNM = function () {
        var result = originalStep.apply(this, arguments), night = browserNight();
        if (night && night._nightwalker && night._nightwalker.runtimeId === "deadAir" && !(root.S && root.S.inDialog)) {
          var state = loadState(), combat = syncCombat(state, night, nowMs()), clock = tick(state, night, nowMs());
          if (combat.changed || clock.respawned || clock.integrityChanged) saveState(state);
        }
        return result;
      };
    }
    if (typeof root.drawNM === "function") {
      var originalDraw = root.drawNM;
      root.drawNM = function () {
        var result = originalDraw.apply(this, arguments), night = browserNight();
        if (night && night._nightwalker && night._nightwalker.runtimeId === "deadAir" && root.ctx) drawOverlay(root.ctx, night, loadState(), root.cv && root.cv.width, root.cv && root.cv.height);
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
    platformLayout: platformLayout,
    skimmer: skimmer,
    createEncounter: createEncounter,
    nearestInspectable: nearestInspectable,
    inspectNearest: inspectNearest,
    tuneRelay: tuneRelay,
    restoreRecording: restoreRecording,
    chooseRecovery: chooseRecovery,
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

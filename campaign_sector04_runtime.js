/* TechOps Hero - Sector 04 Night Walker runtime bridge.
 * Connects the tested Sector 04 encounter contract to the existing Night mode
 * movement, combat, interaction, and draw loop without forking Night mode.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsSector04Runtime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var FLOOR = 430;
  var INTERACT_RANGE = 56;
  var DEFAULT_ASSET_BASE = "assets/campaign/";

  var POINTS = [
    { id: "purple_damage", x: 610, y: FLOOR - 24, label: "Damaged enemy", requiresController: false, assetSlot: "sector04.purple_damage.enemy" },
    { id: "identity_controller", x: 1180, y: 292, label: "Identity controller", requiresController: true, assetSlot: "sector04.identity_controller.active" },
    { id: "locked_violin_door", x: 1570, y: FLOOR - 42, label: "Locked door", requiresController: false, assetSlot: "sector04.locked_violin_door" },
    { id: "symptoms_terminal", x: 1660, y: FLOOR - 58, label: "Terminal", requiresController: true, assetSlot: "sector04.terminal.symptoms" }
  ];

  var PRESENTATION = {
    "sector04.access_guard.idle": { layer: "enemy", anchor: "feet", width: 54, height: 70, fallback: true },
    "sector04.access_guard.attack": { layer: "enemy", anchor: "feet", width: 64, height: 70, fallback: true },
    "sector04.access_guard.suppressed": { layer: "enemy", anchor: "feet", width: 78, height: 52, fallback: true },
    "sector04.access_guard.respawn": { layer: "fx", anchor: "center", width: 72, height: 72, fallback: true, frames: [{ x: 0, y: 0, w: 160, h: 256 }, { x: 160, y: 0, w: 160, h: 256 }], frameMs: 140 },
    "sector04.purple_damage.enemy": { layer: "clue", anchor: "feet", width: 76, height: 54, fallback: true },
    "sector04.purple_damage.fx": { layer: "fx", anchor: "center", width: 58, height: 46, fallback: true },
    "sector04.identity_controller.active": { layer: "prop", anchor: "center", width: 48, height: 48, fallback: true },
    "sector04.identity_controller.severed": { layer: "prop", anchor: "center", width: 54, height: 50, fallback: true },
    "sector04.identity_controller.spark_fx": { layer: "fx", anchor: "center", width: 42, height: 42, fallback: true },
    "sector04.locked_violin_door": { layer: "prop", anchor: "feet", width: 52, height: 86, fallback: true },
    "sector04.violin_note.fx": { layer: "fx", anchor: "center", width: 42, height: 42, fallback: true },
    "sector04.terminal.symptoms": { layer: "terminal", anchor: "center", width: 126, height: 68, fallback: true, exactText: "YOU ARE FIXING THE SYMPTOMS." }
  };

  var GENERATED = {
    "sector04.access_guard.idle": { kind: "guard", accent: "#8b5cf6" },
    "sector04.access_guard.attack": { kind: "guard_attack", accent: "#a855f7" },
    "sector04.access_guard.suppressed": { kind: "guard_down", accent: "#7c3aed" },
    "sector04.access_guard.respawn": { kind: "respawn", accent: "#c084fc" },
    "sector04.purple_damage.enemy": { kind: "damaged_enemy", accent: "#a855f7" },
    "sector04.purple_damage.fx": { kind: "burn_fx", accent: "#d946ef" },
    "sector04.identity_controller.active": { kind: "controller", accent: "#a855f7" },
    "sector04.identity_controller.severed": { kind: "controller_severed", accent: "#f97316" },
    "sector04.identity_controller.spark_fx": { kind: "spark_fx", accent: "#f59e0b" },
    "sector04.locked_violin_door": { kind: "locked_door", accent: "#a855f7" },
    "sector04.violin_note.fx": { kind: "violin_note", accent: "#d946ef" },
    "sector04.terminal.symptoms": { kind: "terminal", accent: "#c084fc" }
  };

  function campaignApi() { if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required"); return root.TechOpsCampaign; }
  function sectorApi() { if (!root || !root.TechOpsSector04) throw new Error("TechOpsSector04 is required"); return root.TechOpsSector04; }
  function assetsApi() { return root && root.TechOpsCampaignAssets ? root.TechOpsCampaignAssets : null; }
  function assetFilename(slotId) { var api = assetsApi(); return api && typeof api.slotFilename === "function" ? api.slotFilename(slotId) : slotId + ".png"; }
  function normalizeBasePath(basePath) { basePath = basePath || DEFAULT_ASSET_BASE; return basePath.charAt(basePath.length - 1) === "/" ? basePath : basePath + "/"; }
  function assetUrl(slotId, basePath) { return normalizeBasePath(basePath) + assetFilename(slotId); }
  function atlasUrl(slotId, basePath) { return normalizeBasePath(basePath) + slotId + ".atlas.json"; }
  function presentationForSlot(slotId) { return PRESENTATION[slotId] || null; }
  function frameForSlot(slotId, atMs) {
    var presentation = presentationForSlot(slotId);
    if (!presentation || !presentation.frames || !presentation.frames.length) return null;
    var frameMs = Math.max(1, presentation.frameMs || 120);
    var sampleMs = atMs === undefined || atMs === null ? nowMs() : atMs;
    var index = Math.floor(sampleMs / frameMs) % presentation.frames.length;
    return presentation.frames[index];
  }
  function requiredPresentationSlots() { return Object.keys(PRESENTATION); }
  function generatedAssetSpec(slotId) { return GENERATED[slotId] || { kind: "unknown", accent: "#38bdf8" }; }

  function drawGeneratedAsset(ctx, slotId, sx, sy, w, h) {
    if (!ctx) return false;
    var spec = generatedAssetSpec(slotId), x = sx - w / 2, y = sy - h, cx = sx, cy = y + h / 2;
    ctx.save(); ctx.globalAlpha = 0.96; ctx.strokeStyle = spec.accent; ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    if (spec.kind === "terminal") { ctx.fillRect(x, y, w, h); ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); ctx.fillStyle = spec.accent; ctx.fillRect(x + 10, y + 12, w - 20, 6); ctx.fillRect(x + 10, y + 26, w - 46, 5); ctx.fillRect(x + 10, y + 40, w - 32, 5); }
    else if (spec.kind === "locked_door") { ctx.fillRect(x + w * 0.18, y, w * 0.64, h); ctx.strokeRect(x + w * 0.18, y, w * 0.64, h); ctx.fillStyle = spec.accent; ctx.fillRect(cx - 9, y + h * 0.2, 18, h * 0.42); ctx.strokeRect(cx - 7, y + h * 0.62, 14, 12); }
    else if (spec.kind === "controller" || spec.kind === "controller_severed") { ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = spec.accent; ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.16, 0, Math.PI * 2); ctx.fill(); if (spec.kind === "controller_severed") { ctx.strokeStyle = "#f97316"; ctx.beginPath(); ctx.moveTo(x + 7, y + h - 7); ctx.lineTo(x + w - 7, y + 7); ctx.stroke(); } }
    else if (spec.kind === "violin_note") { ctx.strokeStyle = spec.accent; ctx.beginPath(); ctx.moveTo(cx - 8, y + h * 0.72); ctx.lineTo(cx - 8, y + h * 0.28); ctx.lineTo(cx + 16, y + h * 0.2); ctx.stroke(); ctx.fillStyle = spec.accent; ctx.beginPath(); ctx.arc(cx - 12, y + h * 0.74, 8, 0, Math.PI * 2); ctx.arc(cx + 12, y + h * 0.66, 8, 0, Math.PI * 2); ctx.fill(); }
    else if (spec.kind === "burn_fx" || spec.kind === "respawn" || spec.kind === "spark_fx") { ctx.fillStyle = spec.accent; ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = spec.accent; ctx.beginPath(); ctx.moveTo(cx, y + 4); ctx.lineTo(cx, y + h - 4); ctx.moveTo(x + 4, cy); ctx.lineTo(x + w - 4, cy); ctx.stroke(); }
    else if (spec.kind === "damaged_enemy" || spec.kind === "guard_down") { ctx.fillRect(x + w * 0.14, y + h * 0.58, w * 0.72, h * 0.22); ctx.strokeRect(x + w * 0.14, y + h * 0.58, w * 0.72, h * 0.22); ctx.fillStyle = spec.accent; ctx.fillRect(x + w * 0.46, y + h * 0.48, w * 0.16, h * 0.2); }
    else { ctx.fillRect(x + w * 0.3, y + h * 0.22, w * 0.4, h * 0.62); ctx.strokeRect(x + w * 0.3, y + h * 0.22, w * 0.4, h * 0.62); ctx.fillStyle = spec.accent; ctx.fillRect(x + w * 0.36, y + h * 0.32, w * 0.28, h * 0.18); if (spec.kind === "guard_attack") ctx.fillRect(x + w * 0.62, y + h * 0.38, w * 0.32, h * 0.08); }
    ctx.restore(); return true;
  }

  function createAssetResolver(options) {
    options = options || {};
    var basePath = normalizeBasePath(options.basePath || root && root.TECHOPS_CAMPAIGN_ASSET_BASE || DEFAULT_ASSET_BASE);
    var ImageCtor = options.Image || root && root.Image;
    var fetchFn = options.fetch || root && root.fetch;
    var records = {};
    function ensure(slotId) {
      if (!slotId) return null;
      if (!records[slotId]) records[slotId] = { slot: slotId, url: assetUrl(slotId, basePath), atlasUrl: atlasUrl(slotId, basePath), status: ImageCtor ? "pending" : "unavailable", atlasStatus: fetchFn ? "pending" : "unavailable", image: null, atlas: null, error: null };
      return records[slotId];
    }
    function requestSlot(slotId) {
      var record = ensure(slotId); if (!record || record.requested || !ImageCtor) return record;
      record.requested = true; record.status = "loading"; var img = new ImageCtor();
      img.onload = function () { record.image = img; record.status = "ready"; };
      img.onerror = function () { record.status = "missing"; record.error = "image_load_failed"; };
      img.src = record.url; return record;
    }
    function requestAtlas(slotId) {
      var record = ensure(slotId); if (!record || record.atlasRequested || !fetchFn) return record;
      record.atlasRequested = true; record.atlasStatus = "loading";
      fetchFn(record.atlasUrl).then(function (res) { if (!res || !res.ok) throw new Error("atlas_load_failed"); return res.json(); }).then(function (json) { record.atlas = json; record.atlasStatus = "ready"; }).catch(function () { record.atlasStatus = "missing"; });
      return record;
    }
    return { basePath: basePath, records: records, requestSlot: requestSlot, requestAtlas: requestAtlas, get: ensure };
  }

  function preloadPresentationAssets(resolver) { if (!resolver || typeof resolver.requestSlot !== "function") return []; return requiredPresentationSlots().map(function (slotId) { return resolver.requestSlot(slotId); }); }
  function storage() { return root && root.localStorage ? root.localStorage : null; }
  function loadCampaign() { return campaignApi().load(storage()); }
  function saveCampaign(state) { campaignApi().save(state, storage()); return state; }
  function nowMs() { if (root && root.performance && typeof root.performance.now === "function") return root.performance.now(); return Date.now(); }
  function message(night, text, ms) { night.msg = text; night.msgT = nowMs() + (ms || 2400); }

  function accessGuard() {
    return { name: "Access Guard", kind: "access_guard", campaignSector04Guard: true, assetSlot: "sector04.access_guard.idle", attackAssetSlot: "sector04.access_guard.attack", suppressedAssetSlot: "sector04.access_guard.suppressed", respawnAssetSlot: "sector04.access_guard.respawn", x: 780, y: FLOOR - 38, w: 30, h: 38, hp: 72, maxHp: 72, spd: 1.05, dmg: 12, tint: "#8b5cf6", cash: [0, 0], vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true, cd: 0, dashes: true };
  }
  function platformLayout() {
    return [
      { x: 260, y: 342, w: 150, h: 14 },
      { x: 560, y: 342, w: 130, h: 14 },
      // Each rise is reachable with a single jump. The controller remains
      // above ground-level interaction range.
      { x: 935, y: 372, w: 130, h: 14 },
      { x: 1065, y: 320, w: 210, h: 14 },
      { x: 1350, y: 368, w: 150, h: 14 }
    ];
  }
  function ensureNight(night) {
    if (!night) throw new Error("A Night mode state is required");
    var encounter = night._sector04;
    if (!encounter) {
      encounter = night._sector04 = { active: true, lastInteraction: null, completed: false, assets: createAssetResolver() };
      preloadPresentationAssets(encounter.assets);
      encounter.inspectables = POINTS.map(function (point) { return Object.assign({}, point); });
    }
    return encounter;
  }
  function createEncounter(campaign, night) {
    sectorApi().enter(campaign);
    var rt = ensureNight(night);
    rt.active = true; rt.completed = false; rt.respawnFxUntil = 0; rt.terminalResult = null;
    rt.progress = sectorApi().snapshot(campaign);
    night.district = "sector04"; night.street = 1; night.done = night.done || {}; night.drive = null;
    night.x = 120; night.y = FLOOR - (night.h || 34); night.vx = 0; night.vy = 0; night.face = 1;
    night.platforms = platformLayout(); night.enemies = [accessGuard()];
    night.clear = false; night.cam = 0;
    rt.lastInteraction = "entered";
    night.msg = ""; night.msgT = 0;
    return rt;
  }
  function guard(night) { if (!night || !night.enemies) return null; for (var i = 0; i < night.enemies.length; i++) if (night.enemies[i].campaignSector04Guard) return night.enemies[i]; return null; }
  function aliveGuard(night) { var g = guard(night); return g && g.alive ? g : null; }
  function removeGuard(night) { var g = guard(night); if (g) g.alive = false; return g; }
  function spawnGuardIfMissing(night) { if (aliveGuard(night)) return aliveGuard(night); var g = accessGuard(); night.enemies = (night.enemies || []).filter(function (enemy) { return !enemy.campaignSector04Guard; }); night.enemies.push(g); ensureNight(night).assets.requestSlot(g.assetSlot); night.clear = false; return g; }
  function distance(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function nearestInspectable(night, x, y) {
    var pos = { x: x, y: y }, best = null, bestDistance = Infinity;
    ensureNight(night).inspectables.forEach(function (point) {
      var d = distance(pos, point);
      if (d <= INTERACT_RANGE && d < bestDistance) { best = point; bestDistance = d; }
    });
    return best && Object.assign({ distance: bestDistance }, best);
  }
  function currentTarget(night) {
    if (!night || !night._sector04 || !night._sector04.active) return null;
    var point = nearestInspectable(night, night.x + (night.w || 22) / 2, night.y + (night.h || 34) / 2);
    return night._sector04.completed && point && point.id !== "symptoms_terminal" ? null : point;
  }
  function hitGuard(campaign, night, damage, atMs) {
    var g = aliveGuard(night); if (!g) return { hit: false }; g.hp -= Math.max(1, damage || 12); g.hitT = Math.max(g.hitT || 0, 8); if (g.hp > 0) return { hit: true, suppressed: false, health: g.hp };
    removeGuard(night); var snap = sectorApi().snapshot(campaign); if (snap.controllerSevered || snap.resolved) { night.clear = true; return { hit: true, permanent: true }; }
    var result = sectorApi().suppress(campaign, atMs); ensureNight(night).respawnFxUntil = result.respawnAt; message(night, "Access Guard suppressed. The incident remains.", 2600); return { hit: true, suppressed: true, respawnAt: result.respawnAt };
  }
  function syncCombat(campaign, night, atMs) {
    var g = guard(night); if (!g || g.alive || g.hp > 0) return { changed: false }; var snap = sectorApi().snapshot(campaign); if (snap.resolved || snap.guardSuppressed) return { changed: false };
    var result = sectorApi().suppress(campaign, atMs); ensureNight(night).respawnFxUntil = result.respawnAt; message(night, "Access Guard suppressed. Damage created time, not restoration.", 2800); return { changed: true, suppressed: true };
  }
  function tick(campaign, night, atMs) {
    var before = sectorApi().snapshot(campaign), sector = sectorApi().tick(campaign, atMs), after = sectorApi().snapshot(campaign);
    ensureNight(night).progress = after;
    if (after.resolved || after.permanentlyDefeated) { removeGuard(night); night.clear = true; ensureNight(night).respawnFxUntil = 0; }
    else if (!before.spawned && after.spawned) { spawnGuardIfMissing(night); ensureNight(night).respawnFxUntil = 0; message(night, "Access Guard reconstituted. Find the controller.", 2600); }
    return sector;
  }
  function recoveryAdvice(campaign) {
    var evidence = campaign && campaign.evidence && campaign.evidence.ghostIdentityEvidence;
    if (evidence && evidence.status === "established") return { required: false, reason: null, message: "" };
    return { required: true, reason: "daytime_identity_evidence_missing", action: "return_to_daytime_access_investigation", message: "Unknown controller—daytime investigation required. Return to Security Ops and document the impossible access event before severing the controller." };
  }
  function retreatToDayInvestigation(campaign, night) {
    var advice = recoveryAdvice(campaign); if (!advice.required) return { changed: false, advice: advice };
    var sector = sectorApi().ensure(campaign); sector.active = false; sector.accessGuardSpawned = false; sector.respawnAt = null;
    if (campaign && campaign.campaign && campaign.campaign.day === 1) campaign.campaign.phase = "day_shift"; if (campaign && campaign.night) campaign.night.combatActive = false;
    if (night) { if (night._sector04) { night._sector04.active = false; night._sector04.lastInteraction = "retreat_to_daytime_access_investigation"; } removeGuard(night); night.clear = true; message(night, advice.message, 4200); }
    return { changed: true, advice: advice };
  }
  function inspectNearest(campaign, night, x, y) {
    var p = nearestInspectable(night, x, y);
    if (!p) return null;
    var encounter = night._sector04;
    if (encounter.completed) return p.id === "symptoms_terminal" ? encounter.terminalResult : null;
    var snap = sectorApi().snapshot(campaign);
    if (p.requiresController && !snap.controllerRevealed) { var insight = sectorApi().insight(campaign); if (!insight.success) { var advice = recoveryAdvice(campaign); message(night, advice.message, 4200); return { id: p.id, blocked: true, message: advice.message, recovery: advice }; } }
    var result;
    if (p.id === "identity_controller") {
      if (!snap.controllerSevered) sectorApi().severController(campaign);
      removeGuard(night);
      message(night, "Identity controller severed. The Access Guard cannot re-form.", 3600);
      result = { id: p.id, severed: true };
    } else if (p.id === "symptoms_terminal") {
      result = sectorApi().terminal(campaign);
      if (result.canTransition) {
        if (!snap.violinNoteHeard) sectorApi().inspect(campaign, "locked_violin_door");
        encounter.progress = sectorApi().snapshot(campaign);
        sectorApi().complete(campaign);
        encounter.completed = true;
        encounter.terminalResult = result;
        night.clear = true;
      }
      message(night, result.canTransition ? result.message + " Mike: " + result.mikeResponse : result.message, 5200);
    } else {
      result = sectorApi().inspect(campaign, p.id);
      if (p.id === "purple_damage") sectorApi().insight(campaign);
      message(night, result.text, 4200);
    }
    if (!encounter.completed) encounter.progress = sectorApi().snapshot(campaign);
    return result;
  }

  function drawSlot(ctx, night, slotId, x, anchorY) {
    var size = PRESENTATION[slotId], record = night._sector04.assets.requestSlot(slotId);
    var top = Math.round(anchorY - (size.anchor === "center" ? size.height / 2 : size.height));
    var left = Math.round(x - size.width / 2);
    if (!record || record.status !== "ready" || !record.image) {
      drawGeneratedAsset(ctx, slotId, x, top + size.height, size.width, size.height);
      return;
    }
    var frame = frameForSlot(slotId, nowMs());
    if (frame) ctx.drawImage(record.image, frame.x, frame.y, frame.w, frame.h, left, top, size.width, size.height);
    else ctx.drawImage(record.image, left, top, size.width, size.height);
  }

  function drawGuard(ctx, night, g, x) {
    var slot = g.assetSlot;
    if (g.hitT > 0 || g.down > 0) slot = g.suppressedAssetSlot;
    else if (g.windup > 0 || g.jabAnim > 0 || g.cd > 0) slot = g.attackAssetSlot;
    drawSlot(ctx, night, slot, x + g.w / 2, g.y + g.h);
    return true;
  }

  function pointSlot(point, progress) {
    return point.id === "identity_controller" && progress.controllerSevered
      ? "sector04.identity_controller.severed" : point.assetSlot;
  }

  function drawOverlay(ctx, night, width) {
    if (!ctx || !night || !night._sector04) return false;
    var encounter = night._sector04, cam = night.cam || 0, W = width || ctx.canvas.width;
    var progress = encounter.progress;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    var g = guard(night);
    if (g && g.alive && g.x - cam >= -80 && g.x - cam <= W + 80) drawGuard(ctx, night, g, g.x - cam);
    else if (encounter.respawnFxUntil > nowMs()) {
      drawSlot(ctx, night, "sector04.access_guard.respawn", 795 - cam, FLOOR - 18);
    }
    encounter.inspectables.forEach(function (point) {
      var x = point.x - cam;
      if (x < -70 || x > W + 70) return;
      var slot = pointSlot(point, progress), size = PRESENTATION[slot];
      if (point.id === "symptoms_terminal" && !progress.terminalViewed) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#0c161c";
        ctx.fillRect(Math.round(x - 44), point.y - 24, 88, 48);
        ctx.strokeStyle = "#506468";
        ctx.strokeRect(Math.round(x - 42) + 0.5, point.y - 22.5, 84, 43);
        ctx.fillStyle = "#9b7851";
        ctx.fillRect(Math.round(x + 32), point.y + 14, 4, 3);
        return;
      }
      ctx.globalAlpha = point.id === "identity_controller" && !progress.controllerRevealed ? 0.55 : 1;
      drawSlot(ctx, night, slot, x, size.anchor === "feet" ? FLOOR : point.y);
    });
    ctx.restore();
    return true;
  }

  function drawPrompt(ctx, night, width) {
    var point = currentTarget(night);
    if (!point) return;
    var progress = night._sector04.progress, slot = pointSlot(point, progress), size = PRESENTATION[slot];
    var x = Math.round(point.x - (night.cam || 0));
    var y = Math.round((size.anchor === "feet" ? FLOOR : point.y + size.height / 2) - size.height);
    var color = point.id === "purple_damage" ? "#e0b8ff" : "#a4eef3";
    var label = point.id === "identity_controller" && !progress.controllerRevealed ? "Access hardware" : point.label;
    var touch = root.matchMedia && root.matchMedia("(pointer: coarse)").matches;
    var text = (touch ? "A · Inspect " : "E · Inspect ") + label;
    ctx.save();
    ctx.font = "bold 14px monospace";
    var boxWidth = Math.min(width - 16, Math.ceil(ctx.measureText(text).width) + 20);
    var center = Math.max(boxWidth / 2 + 8, Math.min(width - boxWidth / 2 - 8, x));
    ctx.fillStyle = "#081219";
    ctx.fillRect(Math.round(center - boxWidth / 2), y - 30, boxWidth, 24);
    ctx.fillStyle = color;
    ctx.fillRect(x - 3, y - 5, 6, 2);
    ctx.fillRect(x - 2, y - 3, 4, 2);
    ctx.textAlign = "center";
    ctx.fillText(text, center, y - 13, boxWidth - 14);
    ctx.restore();
  }

  function drawHud(ctx, night, width) {
    var encounter = night._sector04, progress = encounter.progress;
    var objective = "Inspect the damaged enemy.";
    if (encounter.completed) objective = "Continue to Tuesday morning.";
    else if (progress.controllerSevered) objective = progress.violinNoteHeard ? "Read the terminal." : "Check the locked door.";
    else if (progress.controllerRevealed) objective = "Climb the maintenance catwalk.";
    else if (progress.purpleDamageInspected) objective = "Check the daytime access record.";
    var w = Math.min(358, width - 24), compact = width < 620, h = compact ? 50 : 65;
    ctx.save();
    ctx.fillStyle = "#081219";
    ctx.fillRect(12, 12, w, h);
    ctx.fillStyle = "#3f6e78";
    ctx.fillRect(12, 12, 3, h);
    ctx.fillStyle = "#a4eef3";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SECTOR 04", 24, 34);
    ctx.fillStyle = "#cadcde";
    ctx.font = "12px monospace";
    ctx.fillText("HP", w - 79, 33);
    ctx.fillStyle = "#293a42";
    ctx.fillRect(w - 56, 24, 56, 9);
    ctx.fillStyle = night.hp > 35 ? "#7bdbe0" : "#ff9e85";
    ctx.fillRect(w - 56, 24, 56 * Math.max(0, Math.min(100, night.hp)) / 100, 9);
    ctx.fillStyle = "#f1f5ef";
    ctx.font = "14px monospace";
    ctx.fillText(objective, 24, compact ? 52 : 61, w - 24);
    ctx.restore();
  }

  function browserNight() { return root && root.S && root.S.nightMode ? root.S.nightMode : null; }
  var pendingEntry = null;
  function attachBrowserEncounter(night) {
    if (!night || night._v736) return false;
    if (night._sector04 && night._sector04.active) return night._sector04;
    var campaign = loadCampaign();
    createEncounter(campaign, night); saveCampaign(campaign);
    var toast = root.document && root.document.getElementById("toast");
    if (toast) toast.classList.add("hidden");
    return night._sector04;
  }
  function enterBrowser() {
    var campaign = loadCampaign(), night = browserNight();
    if (!campaign.flags.day_work_unlocked) throw new Error("Complete the Day 1 opening before Sector 04");
    if (campaign.flags.tuesday_morning_reached) return false;
    if (night && night._v736) return false;
    if (root.closeDlg) root.closeDlg();
    if (night) return attachBrowserEncounter(night); // preserve the current Night session
    pendingEntry = root.S;
    if (root.enterNight) root.enterNight();
    night = browserNight();
    if (night) { pendingEntry = null; return attachBrowserEncounter(night); }
    return { pending: true }; // Night Drive is still playing; the entered event completes the handoff.
  }
  function onNightEntered(event) {
    if (!pendingEntry) return;
    var expected = pendingEntry; pendingEntry = null;
    if (root.S !== expected || root.__productionDesiredMode === "goodboys") return;
    attachBrowserEncounter(event && event.detail && event.detail.night || browserNight());
  }
  function browserInteract() {
    var night = browserNight();
    if (!currentTarget(night) || root.S.inDialog) return false;
    var campaign = loadCampaign(), result = inspectNearest(campaign, night, night.x + night.w / 2, night.y + night.h / 2);
    if (!result) return false;
    saveCampaign(campaign);
    if (result.message && root.dlg && (result.id === "symptoms_terminal" || result.blocked)) {
      var options = [{ t: "Continue", f: root.closeDlg }];
      if (night._sector04.completed && root.TechOpsNightRuntime) {
        options.unshift({ t: "Continue to Tuesday morning", f: root.TechOpsNightRuntime.resumeDay });
      }
      if (result.blocked && result.recovery && result.recovery.required) {
        options.unshift({ t: "Return to daytime investigation", f: function () {
          var freshCampaign = loadCampaign(), freshNight = browserNight();
          retreatToDayInvestigation(freshCampaign, freshNight);
          saveCampaign(freshCampaign);
          if (root.TechOpsNightRuntime) root.TechOpsNightRuntime.resumeDay();
          else { if (root.S) root.S.nightMode = null; if (root.closeDlg) root.closeDlg(); }
        } });
      }
      var content = result.canTransition ? result.message + "<br><br><b>Mike:</b> " + result.mikeResponse : result.message;
      root.dlg("SECTOR 04", content, options);
    }
    return true;
  }
  function install() {
    if (!root || root.__techopsSector04RuntimeInstalled) return false; root.__techopsSector04RuntimeInstalled = true;
    if (root.addEventListener) root.addEventListener("techops:night-entered", onNightEntered);
    if (typeof root.nmJab === "function") { var originalJab = root.nmJab; root.nmJab = function () { var result = originalJab.apply(this, arguments), night = browserNight(); if (night && night._sector04) { var campaign = loadCampaign(); syncCombat(campaign, night, nowMs()); saveCampaign(campaign); } return result; }; }
    if (typeof root.stepNM === "function") { var originalStep = root.stepNM; root.stepNM = function () { var result = originalStep.apply(this, arguments), night = browserNight(); if (night && night._sector04 && !night._sector04.completed) { var campaign = loadCampaign(); tick(campaign, night, nowMs()); saveCampaign(campaign); } return result; }; }
    if (typeof root.interact === "function") { var originalInteract = root.interact; root.interact = function () { if (browserInteract()) return; return originalInteract.apply(this, arguments); }; }
    return true;
  }

  var api = { POINTS: POINTS, PRESENTATION: PRESENTATION, createEncounter: createEncounter, accessGuard: accessGuard, assetFilename: assetFilename, assetUrl: assetUrl, atlasUrl: atlasUrl, presentationForSlot: presentationForSlot, requiredPresentationSlots: requiredPresentationSlots, createAssetResolver: createAssetResolver, preloadPresentationAssets: preloadPresentationAssets, generatedAssetSpec: generatedAssetSpec, frameForSlot: frameForSlot, drawGeneratedAsset: drawGeneratedAsset, nearestInspectable: nearestInspectable, currentTarget: currentTarget, hitGuard: hitGuard, syncCombat: syncCombat, tick: tick, recoveryAdvice: recoveryAdvice, retreatToDayInvestigation: retreatToDayInvestigation, inspectNearest: inspectNearest, drawOverlay: drawOverlay, drawPrompt: drawPrompt, drawHud: drawHud, enterBrowser: enterBrowser, install: install };
  if (root && root.document) { if (root.document.readyState === "loading" && root.document.addEventListener) root.document.addEventListener("DOMContentLoaded", install); else install(); }
  return api;
});

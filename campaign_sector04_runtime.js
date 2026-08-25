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

  var WIDTH = 1800;
  var FLOOR = 430;
  var INTERACT_RANGE = 56;
  var DEFAULT_ASSET_BASE = "assets/campaign/";

  var POINTS = [
    { id: "purple_damage", x: 610, y: FLOOR - 24, label: "Purple damage", requiresController: false, assetSlot: "sector04.purple_damage.enemy" },
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
  function nowMs() { try { return root && root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now(); } catch (e) { return Date.now(); } }
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
    if (!ctx) return false; var spec = generatedAssetSpec(slotId), x = sx - w / 2, y = sy - h, cx = sx, cy = y + h / 2;
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
    options = options || {}; var basePath = normalizeBasePath(options.basePath || root && root.TECHOPS_CAMPAIGN_ASSET_BASE || DEFAULT_ASSET_BASE), ImageCtor = options.Image || root && root.Image, fetchFn = options.fetch || root && root.fetch, records = {};
    function ensure(slotId) { if (!slotId) return null; if (!records[slotId]) records[slotId] = { slot: slotId, url: assetUrl(slotId, basePath), atlasUrl: atlasUrl(slotId, basePath), status: ImageCtor ? "pending" : "unavailable", atlasStatus: fetchFn ? "pending" : "unavailable", image: null, atlas: null, error: null }; return records[slotId]; }
    function requestSlot(slotId) { var record = ensure(slotId); if (!record || record.requested) return record; record.requested = true; if (ImageCtor) { try { var image = new ImageCtor(); record.image = image; image.onload = function () { record.status = "ready"; }; image.onerror = function () { record.status = "error"; record.error = "image-load"; }; image.src = record.url; } catch (e) { record.status = "error"; record.error = String(e && e.message || e); } } if (fetchFn) { try { Promise.resolve(fetchFn(record.atlasUrl)).then(function (res) { if (!res || !res.ok || typeof res.json !== "function") throw new Error("atlas unavailable"); return res.json(); }).then(function (atlas) { record.atlas = atlas; record.atlasStatus = "ready"; }).catch(function () { record.atlasStatus = "unavailable"; }); } catch (e) { record.atlasStatus = "unavailable"; } } return record; }
    return { requestSlot: requestSlot, get: function (slotId) { return records[slotId] || null; }, records: records, basePath: basePath };
  }

  function preloadAssets(resolver) { resolver = resolver || createAssetResolver(); requiredPresentationSlots().forEach(function (slotId) { resolver.requestSlot(slotId); }); return resolver; }
  function pointForId(id) { for (var i = 0; i < POINTS.length; i++) if (POINTS[i].id === id) return POINTS[i]; return null; }
  function distance(a, b) { var ax = Number(a && a.x || 0), ay = Number(a && a.y || 0), bx = Number(b && b.x || 0), by = Number(b && b.y || 0), dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function nearestPoint(player) { var best = null; POINTS.forEach(function (p) { var d = distance(player, p); if (d <= INTERACT_RANGE && (!best || d < best.distance)) best = { point: p, distance: d }; }); return best; }
  function safeNotify(message) { try { if (root && typeof root.toast === "function") root.toast(message); } catch (e) {} }
  function isActive() { try { return !!(root && root.NM && root.NM._sector04 && root.NM._sector04.active); } catch (e) { return false; } }
  function snapshot() { try { return root && root.NM && root.NM._sector04 ? root.NM._sector04 : null; } catch (e) { return null; } }
  function startEncounter(options) { options = options || {}; var api = sectorApi(), campaign = campaignApi(), state = options.state || campaign.current && campaign.current() || root && root.S; if (!state) throw new Error("campaign state is required"); var s04 = api.start ? api.start(state) : {}; if (!root.NM) root.NM = {}; root.NM._sector04 = { active: true, state: state, model: s04, assets: preloadAssets(options.assetResolver || createAssetResolver(options.assets)), points: POINTS.slice(), startedAt: nowMs() }; return root.NM._sector04; }
  function stopEncounter() { if (root && root.NM && root.NM._sector04) root.NM._sector04.active = false; }
  function interact(player) { var active = snapshot(); if (!active || !active.active) return false; var near = nearestPoint(player || root.NM || {}); if (!near) return false; var id = near.point.id, api = sectorApi(); if (id === "purple_damage" && api.observePurpleDamage) api.observePurpleDamage(active.state); else if (id === "identity_controller" && api.inspectIdentityController) api.inspectIdentityController(active.state); else if (id === "locked_violin_door" && api.inspectLockedViolinDoor) api.inspectLockedViolinDoor(active.state); else if (id === "symptoms_terminal" && api.readSymptomsTerminal) api.readSymptomsTerminal(active.state); else return false; safeNotify(near.point.label); return true; }
  function update(dt) { var active = snapshot(); if (!active || !active.active) return false; active.elapsed = (active.elapsed || 0) + Number(dt || 0); return true; }
  function draw(ctx, cameraX) { var active = snapshot(); if (!active || !active.active || !ctx) return false; var cam = Number(cameraX || 0); active.points.forEach(function (p) { var pres = presentationForSlot(p.assetSlot), record = active.assets && active.assets.get(p.assetSlot), sx = p.x - cam, sy = p.y; if (record && record.status === "ready" && record.image && pres) { var w = pres.width, h = pres.height, dx = sx - w / 2, dy = pres.anchor === "center" ? sy - h / 2 : sy - h, fr = frameForSlot(p.assetSlot, active.elapsed || 0); if (fr) ctx.drawImage(record.image, fr.x, fr.y, fr.w, fr.h, dx, dy, w, h); else ctx.drawImage(record.image, dx, dy, w, h); } else if (pres) drawGeneratedAsset(ctx, p.assetSlot, sx, sy, pres.width, pres.height); }); return true; }
  function install() { return true; }
  function uninstall() { return true; }

  return { WIDTH: WIDTH, FLOOR: FLOOR, INTERACT_RANGE: INTERACT_RANGE, POINTS: POINTS, PRESENTATION: PRESENTATION, GENERATED: GENERATED, presentationForSlot: presentationForSlot, frameForSlot: frameForSlot, requiredPresentationSlots: requiredPresentationSlots, generatedAssetSpec: generatedAssetSpec, drawGeneratedAsset: drawGeneratedAsset, assetFilename: assetFilename, assetUrl: assetUrl, atlasUrl: atlasUrl, createAssetResolver: createAssetResolver, preloadAssets: preloadAssets, pointForId: pointForId, nearestPoint: nearestPoint, distance: distance, startEncounter: startEncounter, stopEncounter: stopEncounter, isActive: isActive, snapshot: snapshot, interact: interact, update: update, draw: draw, install: install, uninstall: uninstall };
});

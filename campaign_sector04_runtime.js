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

  function campaignApi() {
    if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required");
    return root.TechOpsCampaign;
  }

  function sectorApi() {
    if (!root || !root.TechOpsSector04) throw new Error("TechOpsSector04 is required");
    return root.TechOpsSector04;
  }

  function assetsApi() {
    return root && root.TechOpsCampaignAssets ? root.TechOpsCampaignAssets : null;
  }

  function assetFilename(slotId) {
    var api = assetsApi();
    return api && typeof api.slotFilename === "function" ? api.slotFilename(slotId) : slotId + ".png";
  }

  function normalizeBasePath(basePath) {
    basePath = basePath || DEFAULT_ASSET_BASE;
    return basePath.charAt(basePath.length - 1) === "/" ? basePath : basePath + "/";
  }

  function assetUrl(slotId, basePath) {
    return normalizeBasePath(basePath) + assetFilename(slotId);
  }

  function atlasUrl(slotId, basePath) {
    return normalizeBasePath(basePath) + slotId + ".atlas.json";
  }

  function generatedAssetSpec(slotId) {
    var map = {
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
    return map[slotId] || { kind: "unknown", accent: "#38bdf8" };
  }

  function drawGeneratedAsset(ctx, slotId, sx, sy, w, h) {
    if (!ctx) return false;
    var spec = generatedAssetSpec(slotId);
    var x = sx - w / 2;
    var y = sy - h;
    var cx = sx;
    var cy = y + h / 2;
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.strokeStyle = spec.accent;
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    if (spec.kind === "terminal") {
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = spec.accent;
      ctx.fillRect(x + 10, y + 12, w - 20, 6);
      ctx.fillRect(x + 10, y + 26, w - 46, 5);
      ctx.fillRect(x + 10, y + 40, w - 32, 5);
    } else if (spec.kind === "locked_door") {
      ctx.fillRect(x + w * 0.18, y, w * 0.64, h);
      ctx.strokeRect(x + w * 0.18, y, w * 0.64, h);
      ctx.fillStyle = spec.accent;
      ctx.fillRect(cx - 9, y + h * 0.2, 18, h * 0.42);
      ctx.strokeRect(cx - 7, y + h * 0.62, 14, 12);
    } else if (spec.kind === "controller" || spec.kind === "controller_severed") {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = spec.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.16, 0, Math.PI * 2);
      ctx.fill();
      if (spec.kind === "controller_severed") {
        ctx.strokeStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(x + 7, y + h - 7);
        ctx.lineTo(x + w - 7, y + 7);
        ctx.stroke();
      }
    } else if (spec.kind === "violin_note") {
      ctx.strokeStyle = spec.accent;
      ctx.beginPath();
      ctx.moveTo(cx - 8, y + h * 0.72);
      ctx.lineTo(cx - 8, y + h * 0.28);
      ctx.lineTo(cx + 16, y + h * 0.2);
      ctx.stroke();
      ctx.fillStyle = spec.accent;
      ctx.beginPath();
      ctx.arc(cx - 12, y + h * 0.74, 8, 0, Math.PI * 2);
      ctx.arc(cx + 12, y + h * 0.66, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (spec.kind === "burn_fx" || spec.kind === "respawn" || spec.kind === "spark_fx") {
      ctx.fillStyle = spec.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spec.accent;
      ctx.beginPath();
      ctx.moveTo(cx, y + 4);
      ctx.lineTo(cx, y + h - 4);
      ctx.moveTo(x + 4, cy);
      ctx.lineTo(x + w - 4, cy);
      ctx.stroke();
    } else if (spec.kind === "damaged_enemy" || spec.kind === "guard_down") {
      ctx.fillRect(x + w * 0.14, y + h * 0.58, w * 0.72, h * 0.22);
      ctx.strokeRect(x + w * 0.14, y + h * 0.58, w * 0.72, h * 0.22);
      ctx.fillStyle = spec.accent;
      ctx.fillRect(x + w * 0.46, y + h * 0.48, w * 0.16, h * 0.2);
    } else {
      ctx.fillRect(x + w * 0.3, y + h * 0.22, w * 0.4, h * 0.62);
      ctx.strokeRect(x + w * 0.3, y + h * 0.22, w * 0.4, h * 0.62);
      ctx.fillStyle = spec.accent;
      ctx.fillRect(x + w * 0.36, y + h * 0.32, w * 0.28, h * 0.18);
      if (spec.kind === "guard_attack") ctx.fillRect(x + w * 0.62, y + h * 0.38, w * 0.32, h * 0.08);
    }
    ctx.restore();
    return true;
  }

  function createAssetResolver(options) {
    options = options || {};
    var basePath = normalizeBasePath(options.basePath || (root && root.TECHOPS_CAMPAIGN_ASSET_BASE) || DEFAULT_ASSET_BASE);
    var ImageCtor = options.Image || root && root.Image;
    var fetchFn = options.fetch || root && root.fetch;
    var records = {};

    function ensure(slotId) {
      if (!slotId) return null;
      if (!records[slotId]) {
        records[slotId] = {
          slot: slotId,
          url: assetUrl(slotId, basePath),
          atlasUrl: atlasUrl(slotId, basePath),
          status: ImageCtor ? "pending" : "unavailable",
          atlasStatus: fetchFn ? "pending" : "unavailable",
          image: null,
          atlas: null,
          error: null
        };
      }
      return records[slotId];
    }

    function requestSlot(slotId) {
      var record = ensure(slotId);
      if (!record || record.requested || !ImageCtor) return record;
      record.requested = true;
      record.status = "loading";
      var img = new ImageCtor();
      img.onload = function () {
        record.image = img;
        record.status = "ready";
      };
      img.onerror = function () {
        record.status = "missing";
        record.error = "image_load_failed";
      };
      img.src = record.url;
      return record;
    }

    function requestAtlas(slotId) {
      var record = ensure(slotId);
      if (!record || record.atlasRequested || !fetchFn) return record;
      record.atlasRequested = true;
      record.atlasStatus = "loading";
      fetchFn(record.atlasUrl)
        .then(function (res) {
          if (!res || !res.ok) throw new Error("atlas_load_failed");
          return res.json();
        })
        .then(function (json) {
          record.atlas = json;
          record.atlasStatus = "ready";
        })
        .catch(function () {
          record.atlasStatus = "missing";
        });
      return record;
    }

    return {
      basePath: basePath,
      records: records,
      requestSlot: requestSlot,
      requestAtlas: requestAtlas,
      get: ensure
    };
  }

  function storage() {
    return root && root.localStorage ? root.localStorage : null;
  }

  function loadCampaign() {
    return campaignApi().load(storage());
  }

  function saveCampaign(state) {
    campaignApi().save(state, storage());
    return state;
  }

  function nowMs() {
    if (root && root.performance && typeof root.performance.now === "function") return root.performance.now();
    return Date.now();
  }

  function message(night, text, ms) {
    night.msg = text;
    night.msgT = nowMs() + (ms || 2400);
  }

  function accessGuard() {
    return {
      name: "Access Guard",
      kind: "access_guard",
      campaignSector04Guard: true,
      assetSlot: "sector04.access_guard.idle",
      suppressedAssetSlot: "sector04.access_guard.suppressed",
      x: 780,
      y: FLOOR - 38,
      w: 30,
      h: 38,
      hp: 72,
      maxHp: 72,
      spd: 1.05,
      dmg: 12,
      tint: "#8b5cf6",
      cash: [0, 0],
      vx: 0,
      windup: 0,
      hitT: 0,
      kb: 0,
      launch: 0,
      down: 0,
      alive: true,
      cd: 0,
      dashes: true
    };
  }

  function platformLayout() {
    return [
      { x: 260, y: 342, w: 150, h: 14 },
      { x: 560, y: 286, w: 130, h: 14 },
      { x: 930, y: 336, w: 150, h: 14 },
      { x: 1130, y: 320, w: 160, h: 14 },
      { x: 1410, y: 352, w: 150, h: 14 }
    ];
  }

  function ensureNight(night) {
    if (!night) throw new Error("A Night mode state is required");
    night._sector04 = night._sector04 || {
      active: true,
      prompt: "",
      lastInteraction: null,
      completed: false
    };
    night._sector04.active = true;
    night._sector04.assets = night._sector04.assets || createAssetResolver();
    night._sector04.inspectables = POINTS.map(function (p) {
      return {
        id: p.id,
        x: p.x,
        y: p.y,
        label: p.label,
        requiresController: p.requiresController,
        assetSlot: p.assetSlot
      };
    });
    night._sector04.inspectables.forEach(function (p) {
      night._sector04.assets.requestSlot(p.assetSlot);
    });
    return night._sector04;
  }

  function createEncounter(campaign, night) {
    sectorApi().enter(campaign);
    var rt = ensureNight(night);
    night.district = "sector04";
    night.street = 1;
    night.done = night.done || {};
    night.drive = null;
    night.x = 120;
    night.y = FLOOR - (night.h || 34);
    night.vx = 0;
    night.vy = 0;
    night.face = 1;
    night.platforms = platformLayout();
    night.enemies = [accessGuard()];
    rt.assets.requestSlot(night.enemies[0].assetSlot);
    rt.assets.requestSlot(night.enemies[0].suppressedAssetSlot);
    night.clear = false;
    night.cam = 0;
    message(night, "SECTOR 04 - damage suppresses; understanding defeats.", 4200);
    rt.lastInteraction = "entered";
    return rt;
  }

  function guard(night) {
    if (!night || !night.enemies) return null;
    for (var i = 0; i < night.enemies.length; i++) {
      if (night.enemies[i].campaignSector04Guard) return night.enemies[i];
    }
    return null;
  }

  function aliveGuard(night) {
    var g = guard(night);
    return g && g.alive ? g : null;
  }

  function removeGuard(night) {
    var g = guard(night);
    if (g) g.alive = false;
    return g;
  }

  function spawnGuardIfMissing(night) {
    if (aliveGuard(night)) return aliveGuard(night);
    var g = accessGuard();
    night.enemies = (night.enemies || []).filter(function (enemy) { return !enemy.campaignSector04Guard; });
    night.enemies.push(g);
    ensureNight(night).assets.requestSlot(g.assetSlot);
    night.clear = false;
    return g;
  }

  function distance(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function nearestInspectable(night, x, y) {
    var rt = ensureNight(night);
    var pos = { x: x, y: y };
    var best = null;
    rt.inspectables.forEach(function (p) {
      var d = distance(pos, p);
      if (d <= INTERACT_RANGE && (!best || d < best.distance)) {
        best = {
          id: p.id,
          x: p.x,
          y: p.y,
          label: p.label,
          requiresController: p.requiresController,
          distance: d
        };
      }
    });
    return best;
  }

  function hitGuard(campaign, night, damage, atMs) {
    var g = aliveGuard(night);
    if (!g) return { hit: false };
    g.hp -= Math.max(1, damage || 12);
    g.hitT = Math.max(g.hitT || 0, 8);
    if (g.hp > 0) return { hit: true, suppressed: false, health: g.hp };
    removeGuard(night);
    var snap = sectorApi().snapshot(campaign);
    if (snap.controllerSevered || snap.resolved) {
      night.clear = true;
      return { hit: true, permanent: true };
    }
    var result = sectorApi().suppress(campaign, atMs);
    message(night, "Access Guard suppressed. The incident remains.", 2600);
    return { hit: true, suppressed: true, respawnAt: result.respawnAt };
  }

  function syncCombat(campaign, night, atMs) {
    var g = guard(night);
    if (!g || g.alive || g.hp > 0) return { changed: false };
    var snap = sectorApi().snapshot(campaign);
    if (snap.resolved || snap.guardSuppressed) return { changed: false };
    sectorApi().suppress(campaign, atMs);
    message(night, "Access Guard suppressed. Damage created time, not restoration.", 2800);
    return { changed: true, suppressed: true };
  }

  function tick(campaign, night, atMs) {
    var before = sectorApi().snapshot(campaign);
    var sector = sectorApi().tick(campaign, atMs);
    var after = sectorApi().snapshot(campaign);
    if (after.resolved || after.permanentlyDefeated) {
      removeGuard(night);
      night.clear = true;
      return sector;
    }
    if (!before.spawned && after.spawned) {
      spawnGuardIfMissing(night);
      message(night, "Access Guard reconstituted. Find the controller.", 2600);
    }
    return sector;
  }

  function inspectNearest(campaign, night, x, y) {
    var p = nearestInspectable(night, x, y);
    if (!p) return null;
    var snap = sectorApi().snapshot(campaign);
    if (p.requiresController && !snap.controllerRevealed) {
      var insight = sectorApi().insight(campaign);
      if (!insight.success) {
        message(night, insight.message, 3200);
        return { id: p.id, blocked: true, message: insight.message };
      }
    }
    if (p.id === "identity_controller") {
      sectorApi().severController(campaign);
      removeGuard(night);
      message(night, "Identity controller severed. The Access Guard cannot re-form.", 3600);
      return { id: p.id, severed: true };
    }
    if (p.id === "symptoms_terminal") {
      var terminal = sectorApi().terminal(campaign);
      if (terminal.canTransition) {
        sectorApi().inspect(campaign, "locked_violin_door");
        sectorApi().complete(campaign);
        night._sector04.completed = true;
        night.clear = true;
        message(night, terminal.message + " Mike: " + terminal.mikeResponse, 5200);
      } else {
        message(night, terminal.message, 3600);
      }
      return terminal;
    }
    var inspected = sectorApi().inspect(campaign, p.id);
    if (p.id === "purple_damage") sectorApi().insight(campaign);
    message(night, inspected.text, 4200);
    return inspected;
  }

  function drawOverlay(ctx, night, width) {
    if (!ctx || !night || !night._sector04) return false;
    var cam = night.cam || 0;
    var W = width || ctx.canvas && ctx.canvas.width || 960;
    var resolver = night._sector04.assets || createAssetResolver();
    night._sector04.assets = resolver;

    function drawAsset(slotId, sx, sy, w, h) {
      var record = resolver.requestSlot(slotId);
      if (!record || record.status !== "ready" || !record.image) return false;
      ctx.drawImage(record.image, sx - w / 2, sy - h, w, h);
      return true;
    }

    function inspectableSize(id) {
      if (id === "symptoms_terminal") return { w: 126, h: 68 };
      if (id === "locked_violin_door") return { w: 52, h: 86 };
      if (id === "identity_controller") return { w: 48, h: 48 };
      return { w: 76, h: 54 };
    }

    ctx.save();
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    var g = guard(night);
    if (g && g.alive) {
      var guardX = g.x + (g.w || 30) / 2 - cam;
      var guardY = g.y + (g.h || 38);
      if (guardX >= -80 && guardX <= W + 80 && !drawAsset(g.assetSlot, guardX, guardY, 54, 70)) {
        drawGeneratedAsset(ctx, g.assetSlot, guardX, guardY, 54, 70);
      }
    }
    night._sector04.inspectables.forEach(function (p) {
      var sx = p.x - cam;
      if (sx < -60 || sx > W + 60) return;
      var color = p.id === "purple_damage" ? "#a78bfa" : p.id === "identity_controller" ? "#38bdf8" : "#f8fafc";
      var size = inspectableSize(p.id);
      if (!drawAsset(p.assetSlot, sx, p.y + size.h / 2, size.w, size.h) &&
          !drawGeneratedAsset(ctx, p.assetSlot, sx, p.y + size.h / 2, size.w, size.h)) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(sx - 8, p.y - 8, 16, 16);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#e5e7eb";
      ctx.fillText(p.label, sx, p.y - 14);
    });
    ctx.restore();
    return true;
  }

  function browserNight() {
    return root && root.S && root.S.nightMode ? root.S.nightMode : null;
  }

  function enterBrowser() {
    var campaign = loadCampaign();
    if (root.closeDlg) root.closeDlg();
    if (root.enterNight) root.enterNight();
    var night = browserNight();
    if (!night) throw new Error("Night mode did not start");
    createEncounter(campaign, night);
    saveCampaign(campaign);
    return night._sector04;
  }

  function browserInteract() {
    var night = browserNight();
    if (!night || !night._sector04 || !night._sector04.active) return false;
    var campaign = loadCampaign();
    var result = inspectNearest(campaign, night, night.x + night.w / 2, night.y + night.h / 2);
    if (!result) return false;
    saveCampaign(campaign);
    if (result.message && root.dlg && (result.id === "symptoms_terminal" || result.blocked)) {
      root.dlg("SECTOR 04", result.message, [{ t: "Continue", f: root.closeDlg }]);
    }
    return true;
  }

  function install() {
    if (!root || root.__techopsSector04RuntimeInstalled) return false;
    root.__techopsSector04RuntimeInstalled = true;

    if (typeof root.nmJab === "function") {
      var originalJab = root.nmJab;
      root.nmJab = function () {
        var result = originalJab.apply(this, arguments);
        var night = browserNight();
        if (night && night._sector04) {
          var campaign = loadCampaign();
          syncCombat(campaign, night, nowMs());
          saveCampaign(campaign);
        }
        return result;
      };
    }

    if (typeof root.stepNM === "function") {
      var originalStep = root.stepNM;
      root.stepNM = function () {
        var result = originalStep.apply(this, arguments);
        var night = browserNight();
        if (night && night._sector04) {
          var campaign = loadCampaign();
          tick(campaign, night, nowMs());
          saveCampaign(campaign);
        }
        return result;
      };
    }

    if (typeof root.drawNM === "function") {
      var originalDraw = root.drawNM;
      root.drawNM = function () {
        var result = originalDraw.apply(this, arguments);
        var night = browserNight();
        if (night && night._sector04 && root.ctx) drawOverlay(root.ctx, night, root.cv && root.cv.width);
        return result;
      };
    }

    if (typeof root.interact === "function") {
      var originalInteract = root.interact;
      root.interact = function () {
        if (browserInteract()) return;
        return originalInteract.apply(this, arguments);
      };
    }
    return true;
  }

  var api = {
    POINTS: POINTS,
    createEncounter: createEncounter,
    accessGuard: accessGuard,
    assetFilename: assetFilename,
    assetUrl: assetUrl,
    atlasUrl: atlasUrl,
    createAssetResolver: createAssetResolver,
    generatedAssetSpec: generatedAssetSpec,
    drawGeneratedAsset: drawGeneratedAsset,
    nearestInspectable: nearestInspectable,
    hitGuard: hitGuard,
    syncCombat: syncCombat,
    tick: tick,
    inspectNearest: inspectNearest,
    drawOverlay: drawOverlay,
    enterBrowser: enterBrowser,
    install: install
  };

  if (root && root.document) {
    if (root.document.readyState === "loading" && root.document.addEventListener) {
      root.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }

  return api;
});

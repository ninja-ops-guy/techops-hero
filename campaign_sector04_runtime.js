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

  var POINTS = [
    { id: "purple_damage", x: 610, y: FLOOR - 24, label: "Purple damage", requiresController: false },
    { id: "identity_controller", x: 1180, y: 292, label: "Identity controller", requiresController: true },
    { id: "locked_violin_door", x: 1570, y: FLOOR - 42, label: "Locked door", requiresController: false },
    { id: "symptoms_terminal", x: 1660, y: FLOOR - 58, label: "Terminal", requiresController: true }
  ];

  function campaignApi() {
    if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required");
    return root.TechOpsCampaign;
  }

  function sectorApi() {
    if (!root || !root.TechOpsSector04) throw new Error("TechOpsSector04 is required");
    return root.TechOpsSector04;
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
    night._sector04.inspectables = POINTS.map(function (p) {
      return {
        id: p.id,
        x: p.x,
        y: p.y,
        label: p.label,
        requiresController: p.requiresController
      };
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
    ctx.save();
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    night._sector04.inspectables.forEach(function (p) {
      var sx = p.x - cam;
      if (sx < -60 || sx > W + 60) return;
      var color = p.id === "purple_damage" ? "#a78bfa" : p.id === "identity_controller" ? "#38bdf8" : "#f8fafc";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(sx - 8, p.y - 8, 16, 16);
      ctx.globalAlpha = 1;
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

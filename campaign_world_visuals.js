/* TechOps Hero — production playable-world presentation.
 * Stable concern module: polishes the controllable daytime map without owning
 * story, collision, ticket state, or campaign progression.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignWorldVisuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 1;
  var INTERACT_RANGE = 2.15;

  function distance(ax, ay, bx, by) {
    var dx = Number(ax || 0) - Number(bx || 0);
    var dy = Number(ay || 0) - Number(by || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function candidates(state) {
    state = state || {};
    var out = [];
    (state.npcs || []).forEach(function (n) {
      if (n && !n.done) out.push({ kind: "npc", x: n.x, y: n.y, source: n, priority: n.ambient ? 1 : 4 });
    });
    (state.devices || []).forEach(function (d) {
      if (d && !d.fixed) out.push({ kind: "device", x: d.x, y: d.y, source: d, priority: 3 });
    });
    (state.portals || []).forEach(function (p) {
      if (p) out.push({ kind: "portal", x: p.x, y: p.y, source: p, priority: 2 });
    });
    return out;
  }

  function nearestInteractable(state, range) {
    state = state || {};
    range = typeof range === "number" ? range : INTERACT_RANGE;
    var best = null;
    candidates(state).forEach(function (c) {
      var d = distance(state.px, state.py, c.x, c.y);
      if (d > range) return;
      if (!best || d < best.distance - 0.001 || (Math.abs(d - best.distance) < 0.001 && c.priority > best.priority)) {
        best = { kind: c.kind, x: c.x, y: c.y, source: c.source, priority: c.priority, distance: d };
      }
    });
    return best;
  }

  function lightProfile(state) {
    state = state || {};
    var zone = "default";
    try {
      if (typeof root.zoneAt === "function") zone = String(root.zoneAt(state.px, state.py) || "default").toLowerCase();
    } catch (e) {}
    var profiles = {
      factory: { vignette: 0.17, warm: 0.10, cool: 0.02 },
      engineering: { vignette: 0.14, warm: 0.07, cool: 0.07 },
      server: { vignette: 0.20, warm: 0.01, cool: 0.13 },
      office: { vignette: 0.11, warm: 0.08, cool: 0.03 },
      lobby: { vignette: 0.10, warm: 0.05, cool: 0.05 }
    };
    var p = profiles[zone] || { vignette: 0.12, warm: 0.05, cool: 0.04 };
    return { zone: zone, vignette: p.vignette, warm: p.warm, cool: p.cool };
  }

  function canRender() {
    try { return typeof cv !== "undefined" && typeof ctx !== "undefined" && typeof S !== "undefined" && !!cv && !!ctx && !!S; }
    catch (e) { return false; }
  }

  function worldToScreen(tx, ty) {
    if (!canRender()) return null;
    var ts = cv.height / 14;
    var sc = ts / TILE;
    return {
      x: (tx * TILE + TILE / 2 - camX) * sc,
      y: (ty * TILE + TILE / 2 - camY) * sc,
      scale: sc
    };
  }

  function drawInteractionCue(tm) {
    var target = nearestInteractable(S);
    if (!target) return;
    var pt = worldToScreen(target.x, target.y);
    if (!pt) return;
    var pulse = 0.5 + Math.sin(tm / 220) * 0.18;
    var radius = Math.max(15, 19 * pt.scale) + Math.sin(tm / 250) * 2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = target.kind === "npc" ? "#f2d46b" : target.kind === "device" ? "#7effcd" : "#b388ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.88;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(4,10,14,.82)";
    ctx.fillRect(pt.x - 18, pt.y - radius - 18, 36, 14);
    ctx.fillStyle = "#f3f7f8";
    ctx.fillText("E / A", pt.x, pt.y - radius - 11);
    ctx.restore();
  }

  function drawGrade(tm) {
    var p = lightProfile(S);
    var w = cv.width, h = cv.height;
    ctx.save();
    var vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, Math.min(w, h) * 0.12, w * 0.5, h * 0.48, Math.max(w, h) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0," + p.vignette + ")");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    var drift = (Math.sin(tm / 2600) + 1) / 2;
    var warm = ctx.createLinearGradient(0, 0, w, h);
    warm.addColorStop(0, "rgba(255,196,116," + (p.warm * (0.65 + drift * 0.35)) + ")");
    warm.addColorStop(0.55, "rgba(255,196,116,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);

    var cool = ctx.createLinearGradient(w, 0, 0, h);
    cool.addColorStop(0, "rgba(102,187,255," + p.cool + ")");
    cool.addColorStop(0.6, "rgba(102,187,255,0)");
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function installPlayerShadow() {
    try {
      if (typeof drawPlayer !== "function" || drawPlayer.__productionShadow) return false;
      var base = drawPlayer;
      drawPlayer = function (s, tm) {
        try {
          var cx = s.px * TILE + TILE / 2;
          var cy = s.py * TILE + TILE - 2;
          ctx.save();
          ctx.globalAlpha = s.moving ? 0.22 : 0.28;
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.ellipse(cx, cy, s.moving ? 13 : 11, s.moving ? 4.4 : 3.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } catch (e) {}
        return base.apply(this, arguments);
      };
      drawPlayer.__productionShadow = true;
      return true;
    } catch (e) { return false; }
  }

  function installDrawPolish() {
    try {
      if (typeof draw !== "function" || draw.__productionWorldPolish) return false;
      var base = draw;
      draw = function () {
        var result = base.apply(this, arguments);
        try {
          if (canRender() && !(S && S.nightMode)) {
            var tm = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
            drawGrade(tm);
            if (!S.inDialog) drawInteractionCue(tm);
          }
        } catch (e) {}
        return result;
      };
      draw.__productionWorldPolish = true;
      return true;
    } catch (e) { return false; }
  }

  function install() {
    return { playerShadow: installPlayerShadow(), drawPolish: installDrawPolish() };
  }

  var installed = install();
  return {
    VERSION: VERSION,
    INTERACT_RANGE: INTERACT_RANGE,
    distance: distance,
    candidates: candidates,
    nearestInteractable: nearestInteractable,
    lightProfile: lightProfile,
    installPlayerShadow: installPlayerShadow,
    installDrawPolish: installDrawPolish,
    install: install,
    installed: installed
  };
});

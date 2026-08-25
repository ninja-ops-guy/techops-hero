/* TechOps Hero — production atlas bridge for canonical campaign visuals.
 * Stable concern module: upgrades campaign_visual_direction.js placeholders with
 * real shipped character atlases and painted night backgrounds when available.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignVisualAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 1;
  var SPECS = Object.freeze({
    mike: { atlas: "MIKE_ACTIONS", payloads: ["TO_MIKE_ACTIONS", "__GK_MIKE_ACTIONS"], frame: "f000", fit: "contain" },
    felicia_day: { atlas: "PORTRAITS_UI", payloads: ["TO_PORTRAITS_UI", "__GK_PORTRAITS_UI"], frame: "port_felicia0", fit: "cover" },
    felicia_rooftop: { atlas: "FELICIA_MUSIC", payloads: ["TO_FELICIA_MUSIC", "__GK_FELICIA_MUSIC"], frame: "felicia0", fit: "contain" },
    security_ops: { atlas: "PORTRAITS_UI", payloads: ["TO_PORTRAITS_UI", "__GK_PORTRAITS_UI"], frame: "port_cast0", fit: "cover" }
  });

  function sourceFor(spec) {
    if (!root || !spec) return null;
    var atlas = root[spec.atlas];
    if (atlas && atlas.src) return atlas.src;
    for (var i = 0; i < (spec.payloads || []).length; i++) {
      var src = root[spec.payloads[i]];
      if (src) return src;
    }
    return null;
  }

  function frameRect(spec) {
    if (!root || !spec) return null;
    var atlas = root[spec.atlas];
    if (!atlas || !atlas.frames) return null;
    var fr = atlas.frames[spec.frame] || atlas.frames[Object.keys(atlas.frames)[0]];
    if (!fr) return null;
    if (fr.length >= 4) return { sx: fr[0], sy: fr[1], sw: fr[2], sh: fr[3] };
    var c = atlas.cell || 64, ch = atlas.cellH || c;
    return { sx: fr[0] * c, sy: fr[1] * ch, sw: c, sh: ch };
  }

  function actorSpec(sceneId, side) {
    if (side === "left") return SPECS.mike;
    if (sceneId === "felicia_day") return SPECS.felicia_day;
    if (sceneId === "rooftop_violin") return SPECS.felicia_rooftop;
    if (sceneId === "badge_lab") return SPECS.security_ops;
    return null;
  }

  function drawAtlasCanvas(canvas, spec) {
    if (!canvas || !spec || !root || typeof root.Image !== "function") return false;
    var src = sourceFor(spec), rect = frameRect(spec);
    if (!src || !rect) return false;
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return false;
    var im = new root.Image();
    im.onload = function () {
      var w = canvas.width || 160, h = canvas.height || 240;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      var scale = spec.fit === "cover" ? Math.max(w / rect.sw, h / rect.sh) : Math.min(w / rect.sw, h / rect.sh);
      var dw = rect.sw * scale, dh = rect.sh * scale;
      ctx.drawImage(im, rect.sx, rect.sy, rect.sw, rect.sh, (w - dw) / 2, h - dh, dw, dh);
    };
    im.src = src;
    return true;
  }

  function paintedBackground(sceneId) {
    if (!root || !root.NM_BG734) return null;
    var key = sceneId === "rooftop_violin" ? "downtown" : sceneId === "morningstar_trace" ? "industrial" : null;
    var im = key && root.NM_BG734[key];
    return im && im.src ? im.src : null;
  }

  function decorate(sceneId) {
    if (!root || !root.document) return { sceneId: sceneId, decorated: false };
    var el = root.document.getElementById("campaign-visual");
    if (!el) return { sceneId: sceneId, decorated: false };

    var bg = paintedBackground(sceneId);
    if (bg) {
      var layer = root.document.createElement("div");
      layer.className = "cv-layer cv-painted-reference";
      layer.style.backgroundImage = "linear-gradient(rgba(4,8,14,.18),rgba(4,8,14,.5)),url(" + JSON.stringify(bg) + ")";
      layer.style.backgroundSize = "cover";
      layer.style.backgroundPosition = "center";
      layer.style.opacity = sceneId === "rooftop_violin" ? ".72" : ".5";
      el.insertBefore(layer, el.firstChild);
    }

    var actors = el.querySelectorAll ? el.querySelectorAll(".cv-actor") : [];
    for (var i = 0; i < actors.length; i++) {
      var side = actors[i].className.indexOf("cv-left") >= 0 ? "left" : "right";
      var spec = actorSpec(sceneId, side);
      if (!spec) {
        if (sceneId === "morningstar_trace" && side === "right") actors[i].className += " cv-machine-actor";
        continue;
      }
      var canvas = root.document.createElement("canvas");
      canvas.className = "cv-atlas-actor";
      canvas.width = 180;
      canvas.height = 260;
      canvas.style.position = "absolute";
      canvas.style.left = "50%";
      canvas.style.bottom = "0";
      canvas.style.width = "150%";
      canvas.style.height = "150%";
      canvas.style.transform = "translateX(-50%)";
      canvas.style.objectFit = "contain";
      if (drawAtlasCanvas(canvas, spec)) {
        actors[i].className += " cv-real-actor";
        actors[i].appendChild(canvas);
      }
    }
    return { sceneId: sceneId, decorated: true, paintedBackground: !!bg };
  }

  function install() {
    if (!root || !root.TechOpsCampaignVisuals || root.TechOpsCampaignVisuals.__assetBridgeInstalled) return false;
    var visuals = root.TechOpsCampaignVisuals;
    var base = visuals.show;
    visuals.show = function (sceneId) {
      var result = base.apply(this, arguments);
      try { decorate(sceneId); } catch (e) {}
      return result;
    };
    visuals.__assetBridgeInstalled = true;
    return true;
  }

  install();
  return { VERSION: VERSION, SPECS: SPECS, sourceFor: sourceFor, frameRect: frameRect, actorSpec: actorSpec, paintedBackground: paintedBackground, decorate: decorate, install: install };
});
/* TechOps Hero — reference-driven campaign presentation.
 * Stable production visual layer for authored campaign scenes.
 * Actual gameplay uses shipped atlases first, painted/procedural staging second.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignVisuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 2;
  var SCENES = Object.freeze({
    badge_lab: { label: "SECURITY LAB // DAY", className: "cv-day cv-lab", layers: ["cv-window-grid", "cv-racks", "cv-benches"], left: "MIKE", right: "SECURITY OPS" },
    felicia_day: { label: "AEROTECH // CONNECTOR HALL", className: "cv-day cv-hall", layers: ["cv-window-grid", "cv-aircraft", "cv-glass"], left: "MIKE", right: "FELICIA" },
    morningstar_trace: { label: "SYSTEMS INTEGRATION // TRACE BAY", className: "cv-day cv-trace", layers: ["cv-window-grid", "cv-racks", "cv-telemetry"], left: "MIKE", right: "MORNINGSTAR TRACE" },
    rooftop_violin: { label: "ROOFTOP // NIGHT", className: "cv-night cv-rooftop", layers: ["cv-sky", "cv-city-far", "cv-city-near", "cv-rooftop-floor", "cv-cables"], left: "MIKE", right: "FELICIA" }
  });

  var ACTOR_SPECS = Object.freeze({
    mike: { atlas: "MIKE_ACTIONS", payloads: ["TO_MIKE_ACTIONS", "__GK_MIKE_ACTIONS"], frame: "f000", fit: "contain" },
    felicia_day: { atlas: "PORTRAITS_UI", payloads: ["TO_PORTRAITS_UI", "__GK_PORTRAITS_UI"], frame: "port_felicia0", fit: "cover" },
    felicia_rooftop: { atlas: "FELICIA_MUSIC", payloads: ["TO_FELICIA_MUSIC", "__GK_FELICIA_MUSIC"], frame: "felicia0", fit: "contain" },
    security_ops: { atlas: "PORTRAITS_UI", payloads: ["TO_PORTRAITS_UI", "__GK_PORTRAITS_UI"], frame: "port_cast0", fit: "cover" }
  });

  function canDom() { return !!(root && root.document && root.document.body); }
  function sourceFor(spec) {
    if (!root || !spec) return null;
    var atlas = root[spec.atlas];
    if (atlas && atlas.src) return atlas.src;
    for (var i = 0; i < spec.payloads.length; i++) if (root[spec.payloads[i]]) return root[spec.payloads[i]];
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
    if (side === "left") return ACTOR_SPECS.mike;
    if (sceneId === "felicia_day") return ACTOR_SPECS.felicia_day;
    if (sceneId === "rooftop_violin") return ACTOR_SPECS.felicia_rooftop;
    if (sceneId === "badge_lab") return ACTOR_SPECS.security_ops;
    return null;
  }
  function paintedBackground(sceneId) {
    if (!root || !root.NM_BG734) return null;
    var key = sceneId === "rooftop_violin" ? "downtown" : sceneId === "morningstar_trace" ? "industrial" : null;
    var im = key && root.NM_BG734[key];
    return im && im.src ? im.src : null;
  }

  function ensureStyle() {
    if (!canDom() || root.document.getElementById("campaign-visual-style")) return;
    var style = root.document.createElement("style");
    style.id = "campaign-visual-style";
    style.textContent = [
      ".campaign-visual{position:fixed;inset:0;z-index:14;pointer-events:none;overflow:hidden;background:#071017;color:#fff;font-family:'Press Start 2P',monospace}",
      ".campaign-visual .cv-layer{position:absolute;inset:0;will-change:transform}",
      ".campaign-visual .cv-painted-reference{background-size:cover;background-position:center;image-rendering:auto}",
      ".campaign-visual .cv-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 44%,transparent 28%,rgba(0,0,0,.72) 100%)}",
      ".campaign-visual .cv-label{position:absolute;top:max(18px,env(safe-area-inset-top));left:20px;font-size:9px;letter-spacing:1px;opacity:.7}",
      ".campaign-visual .cv-ground{position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(rgba(23,36,44,.75),rgba(7,11,14,.96));border-top:2px solid rgba(255,255,255,.09)}",
      ".campaign-visual .cv-actor{position:absolute;bottom:18%;width:112px;height:190px;filter:drop-shadow(0 16px 10px rgba(0,0,0,.55));transition:transform .25s ease}",
      ".campaign-visual .cv-actor:not(.cv-real-actor):before{content:'';position:absolute;left:34px;top:4px;width:40px;height:40px;border-radius:50%;background:#202a30;box-shadow:0 42px 0 15px #182229,0 90px 0 8px #121a20}",
      ".campaign-visual .cv-left{left:10%}.campaign-visual .cv-right{right:10%}",
      ".campaign-visual .cv-atlas-actor{position:absolute;left:50%;bottom:0;width:150%;height:150%;transform:translateX(-50%);image-rendering:pixelated}",
      ".campaign-visual .cv-real-actor:before{display:none}",
      ".campaign-visual .cv-name{position:absolute;z-index:3;bottom:-23px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;text-shadow:0 2px 0 #000}",
      ".campaign-visual.cv-night{background:linear-gradient(#080818 0,#111b2c 48%,#090d13 100%)}",
      ".campaign-visual.cv-day{background:linear-gradient(#94b5c2 0,#506b75 52%,#202b31 100%)}",
      ".campaign-visual .cv-sky{background:radial-gradient(circle at 76% 16%,rgba(190,170,255,.18),transparent 24%)}",
      ".campaign-visual .cv-city-far{top:28%;bottom:25%;background:repeating-linear-gradient(90deg,transparent 0 42px,rgba(38,49,74,.65) 43px 72px);transform:translateX(var(--cv-far,0px))}",
      ".campaign-visual .cv-city-near{top:43%;bottom:24%;background:repeating-linear-gradient(90deg,rgba(12,18,29,.9) 0 56px,rgba(20,31,43,.95) 57px 112px);clip-path:polygon(0 35%,8% 18%,17% 42%,29% 8%,37% 37%,51% 21%,63% 45%,76% 15%,86% 40%,100% 22%,100% 100%,0 100%);transform:translateX(var(--cv-near,0px))}",
      ".campaign-visual .cv-rooftop-floor{top:72%;background:linear-gradient(180deg,rgba(36,43,51,.8),rgba(11,15,19,.95));border-top:2px solid rgba(190,170,255,.28)}",
      ".campaign-visual .cv-cables{background:linear-gradient(105deg,transparent 0 47%,rgba(160,170,180,.25) 48% 49%,transparent 50% 100%);opacity:.7}",
      ".campaign-visual .cv-window-grid{background:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:64px 64px;opacity:.55}",
      ".campaign-visual .cv-racks{left:8%;right:8%;top:31%;bottom:27%;background:repeating-linear-gradient(90deg,rgba(8,18,23,.75) 0 66px,transparent 67px 96px)}",
      ".campaign-visual .cv-benches{top:66%;bottom:21%;background:repeating-linear-gradient(90deg,#263238 0 130px,#151d21 131px 156px)}",
      ".campaign-visual .cv-aircraft{left:45%;top:26%;width:45%;height:34%;border:3px solid rgba(220,236,238,.28);border-radius:60% 10% 42% 50%;transform:skewX(-8deg)}",
      ".campaign-visual .cv-glass{background:linear-gradient(110deg,transparent 25%,rgba(210,239,255,.12) 26% 27%,transparent 28% 60%,rgba(210,239,255,.08) 61% 62%,transparent 63%)}",
      ".campaign-visual .cv-telemetry{left:48%;right:7%;top:23%;bottom:31%;border:1px solid rgba(130,255,214,.26);background:repeating-linear-gradient(0deg,rgba(115,255,208,.07) 0 1px,transparent 1px 20px),repeating-linear-gradient(90deg,rgba(115,255,208,.06) 0 1px,transparent 1px 26px)}",
      ".campaign-visual .cv-machine-actor{border:2px solid rgba(115,255,208,.35);background:repeating-linear-gradient(0deg,rgba(115,255,208,.08) 0 2px,transparent 2px 18px);height:120px;bottom:26%}",
      ".campaign-visual .cv-signal{position:absolute;right:18%;bottom:43%;width:160px;height:160px;border:2px solid rgba(177,118,255,.55);border-radius:50%;animation:cvpulse 1.8s infinite ease-out;opacity:0}",
      ".campaign-visual .cv-signal.s2{animation-delay:.6s}.campaign-visual .cv-signal.s3{animation-delay:1.2s}",
      ".campaign-visual.cv-rooftop .cv-right:after{content:'';position:absolute;left:-18px;top:46px;width:122px;height:3px;background:linear-gradient(90deg,transparent,rgba(190,129,255,.85),transparent);transform:rotate(-18deg);box-shadow:0 0 10px rgba(190,129,255,.8)}",
      "@keyframes cvpulse{0%{transform:scale(.25);opacity:.7}100%{transform:scale(1.5);opacity:0}}",
      "@media(max-width:600px){.campaign-visual .cv-actor{width:78px;height:135px;bottom:21%}.campaign-visual .cv-left{left:6%}.campaign-visual .cv-right{right:6%}.campaign-visual .cv-name{font-size:6px}.campaign-visual .cv-signal{width:110px;height:110px;right:12%;bottom:46%}}"
    ].join("\n");
    root.document.head.appendChild(style);
  }

  function actor(side, name) {
    var el = root.document.createElement("div");
    el.className = "cv-actor " + (side === "left" ? "cv-left" : "cv-right");
    var label = root.document.createElement("span");
    label.className = "cv-name";
    label.textContent = name;
    el.appendChild(label);
    return el;
  }

  function drawActor(el, spec) {
    if (!el || !spec || !root || typeof root.Image !== "function") return false;
    var src = sourceFor(spec), rect = frameRect(spec);
    if (!src || !rect) return false;
    var canvas = root.document.createElement("canvas");
    canvas.className = "cv-atlas-actor";
    canvas.width = 180; canvas.height = 260;
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return false;
    var im = new root.Image();
    im.onload = function () {
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h); ctx.imageSmoothingEnabled = false;
      var scale = spec.fit === "cover" ? Math.max(w / rect.sw, h / rect.sh) : Math.min(w / rect.sw, h / rect.sh);
      var dw = rect.sw * scale, dh = rect.sh * scale;
      ctx.drawImage(im, rect.sx, rect.sy, rect.sw, rect.sh, (w - dw) / 2, h - dh, dw, dh);
    };
    im.src = src;
    el.className += " cv-real-actor";
    el.appendChild(canvas);
    return true;
  }

  function show(sceneId) {
    var scene = SCENES[sceneId];
    if (!scene) throw new Error("Unknown campaign visual scene: " + sceneId);
    if (!canDom()) return { id: sceneId, active: false, className: scene.className, layers: scene.layers.slice() };
    ensureStyle(); hide();
    var el = root.document.createElement("div");
    el.id = "campaign-visual"; el.className = "campaign-visual " + scene.className;

    var bg = paintedBackground(sceneId);
    if (bg) {
      var painted = root.document.createElement("div");
      painted.className = "cv-layer cv-painted-reference";
      painted.style.backgroundImage = "linear-gradient(rgba(4,8,14,.18),rgba(4,8,14,.52)),url(" + JSON.stringify(bg) + ")";
      painted.style.opacity = sceneId === "rooftop_violin" ? ".72" : ".5";
      el.appendChild(painted);
    }

    scene.layers.forEach(function (name) { var layer = root.document.createElement("div"); layer.className = "cv-layer " + name; el.appendChild(layer); });
    var ground = root.document.createElement("div"); ground.className = "cv-ground"; el.appendChild(ground);
    var left = actor("left", scene.left), right = actor("right", scene.right);
    drawActor(left, actorSpec(sceneId, "left"));
    if (!drawActor(right, actorSpec(sceneId, "right")) && sceneId === "morningstar_trace") right.className += " cv-machine-actor";
    el.appendChild(left); el.appendChild(right);
    if (sceneId === "rooftop_violin") ["", "s2", "s3"].forEach(function (extra) { var ring = root.document.createElement("div"); ring.className = "cv-signal " + extra; el.appendChild(ring); });
    var vignette = root.document.createElement("div"); vignette.className = "cv-vignette"; el.appendChild(vignette);
    var label = root.document.createElement("div"); label.className = "cv-label"; label.textContent = scene.label; el.appendChild(label);
    root.document.body.appendChild(el); root.__techopsCampaignVisualScene = sceneId;
    return { id: sceneId, active: true, className: scene.className, layers: scene.layers.slice(), atlasDriven: true, paintedBackground: !!bg };
  }

  function hide() {
    if (!canDom()) return false;
    var current = root.document.getElementById("campaign-visual");
    if (current && current.parentNode) current.parentNode.removeChild(current);
    root.__techopsCampaignVisualScene = null;
    return !!current;
  }

  function setParallax(x) {
    if (!canDom()) return;
    var el = root.document.getElementById("campaign-visual"); if (!el) return;
    var n = Math.max(-1, Math.min(1, Number(x) || 0));
    el.style.setProperty("--cv-far", (n * -8).toFixed(1) + "px");
    el.style.setProperty("--cv-near", (n * -18).toFixed(1) + "px");
  }

  return { VERSION: VERSION, SCENES: SCENES, ACTOR_SPECS: ACTOR_SPECS, sourceFor: sourceFor, frameRect: frameRect, actorSpec: actorSpec, paintedBackground: paintedBackground, show: show, hide: hide, setParallax: setParallax };
});
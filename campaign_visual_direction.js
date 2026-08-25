/* TechOps Hero — reference-driven campaign presentation.
 * Stable production visual layer for authored campaign scenes.
 * Goal: actual gameplay composition matches the painted/pixel-hybrid references:
 * side-view staging, layered depth, readable silhouettes, cinematic dialogue framing,
 * restrained purple/green anomaly color, and environmental motion.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignVisuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 1;
  var SCENES = Object.freeze({
    badge_lab: {
      label: "SECURITY LAB // DAY",
      className: "cv-day cv-lab",
      layers: ["cv-window-grid", "cv-racks", "cv-benches"],
      left: "MIKE",
      right: "SECURITY OPS"
    },
    felicia_day: {
      label: "AEROTECH // CONNECTOR HALL",
      className: "cv-day cv-hall",
      layers: ["cv-window-grid", "cv-aircraft", "cv-glass"],
      left: "MIKE",
      right: "FELICIA"
    },
    morningstar_trace: {
      label: "SYSTEMS INTEGRATION // TRACE BAY",
      className: "cv-day cv-trace",
      layers: ["cv-window-grid", "cv-racks", "cv-telemetry"],
      left: "MIKE",
      right: "MORNINGSTAR TRACE"
    },
    rooftop_violin: {
      label: "ROOFTOP // NIGHT",
      className: "cv-night cv-rooftop",
      layers: ["cv-sky", "cv-city-far", "cv-city-near", "cv-rooftop-floor", "cv-cables"],
      left: "MIKE",
      right: "FELICIA"
    }
  });

  function canDom() { return !!(root && root.document && root.document.body); }
  function ensureStyle() {
    if (!canDom() || root.document.getElementById("campaign-visual-style")) return;
    var style = root.document.createElement("style");
    style.id = "campaign-visual-style";
    style.textContent = [
      ".campaign-visual{position:fixed;inset:0;z-index:14;pointer-events:none;overflow:hidden;background:#071017;color:#fff;font-family:'Press Start 2P',monospace}",
      ".campaign-visual .cv-layer{position:absolute;inset:0;will-change:transform}",
      ".campaign-visual .cv-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 44%,transparent 28%,rgba(0,0,0,.72) 100%)}",
      ".campaign-visual .cv-label{position:absolute;top:max(18px,env(safe-area-inset-top));left:20px;font-size:9px;letter-spacing:1px;opacity:.7}",
      ".campaign-visual .cv-ground{position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(#17242c,#070b0e);border-top:2px solid rgba(255,255,255,.09)}",
      ".campaign-visual .cv-actor{position:absolute;bottom:18%;width:88px;height:170px;filter:drop-shadow(0 16px 10px rgba(0,0,0,.55));transition:transform .25s ease}",
      ".campaign-visual .cv-actor:before{content:'';position:absolute;left:24px;top:4px;width:40px;height:40px;border-radius:50%;background:#202a30;box-shadow:0 42px 0 15px #182229,0 90px 0 8px #121a20}",
      ".campaign-visual .cv-left{left:12%}.campaign-visual .cv-right{right:12%}",
      ".campaign-visual .cv-name{position:absolute;bottom:-23px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8px;text-shadow:0 2px 0 #000}",
      ".campaign-visual.cv-night{background:linear-gradient(#080818 0,#111b2c 48%,#090d13 100%)}",
      ".campaign-visual.cv-day{background:linear-gradient(#94b5c2 0,#506b75 52%,#202b31 100%)}",
      ".campaign-visual .cv-sky{background:radial-gradient(circle at 76% 16%,rgba(190,170,255,.18),transparent 24%)}",
      ".campaign-visual .cv-city-far{top:28%;bottom:25%;background:repeating-linear-gradient(90deg,transparent 0 42px,rgba(38,49,74,.65) 43px 72px);transform:translateX(var(--cv-far,0px))}",
      ".campaign-visual .cv-city-near{top:43%;bottom:24%;background:repeating-linear-gradient(90deg,rgba(12,18,29,.9) 0 56px,rgba(20,31,43,.95) 57px 112px);clip-path:polygon(0 35%,8% 18%,17% 42%,29% 8%,37% 37%,51% 21%,63% 45%,76% 15%,86% 40%,100% 22%,100% 100%,0 100%);transform:translateX(var(--cv-near,0px))}",
      ".campaign-visual .cv-rooftop-floor{top:72%;background:linear-gradient(180deg,#242b33,#0b0f13);border-top:2px solid rgba(190,170,255,.28)}",
      ".campaign-visual .cv-cables{background:linear-gradient(105deg,transparent 0 47%,rgba(160,170,180,.25) 48% 49%,transparent 50% 100%);opacity:.7}",
      ".campaign-visual .cv-window-grid{background:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:64px 64px;opacity:.55}",
      ".campaign-visual .cv-racks{left:8%;right:8%;top:31%;bottom:27%;background:repeating-linear-gradient(90deg,rgba(8,18,23,.75) 0 66px,transparent 67px 96px)}",
      ".campaign-visual .cv-benches{top:66%;bottom:21%;background:repeating-linear-gradient(90deg,#263238 0 130px,#151d21 131px 156px)}",
      ".campaign-visual .cv-aircraft{left:45%;top:26%;width:45%;height:34%;border:3px solid rgba(220,236,238,.28);border-radius:60% 10% 42% 50%;transform:skewX(-8deg)}",
      ".campaign-visual .cv-glass{background:linear-gradient(110deg,transparent 25%,rgba(210,239,255,.12) 26% 27%,transparent 28% 60%,rgba(210,239,255,.08) 61% 62%,transparent 63%)}",
      ".campaign-visual .cv-telemetry{left:48%;right:7%;top:23%;bottom:31%;border:1px solid rgba(130,255,214,.26);background:repeating-linear-gradient(0deg,rgba(115,255,208,.07) 0 1px,transparent 1px 20px),repeating-linear-gradient(90deg,rgba(115,255,208,.06) 0 1px,transparent 1px 26px)}",
      ".campaign-visual .cv-signal{position:absolute;right:18%;bottom:43%;width:160px;height:160px;border:2px solid rgba(177,118,255,.55);border-radius:50%;animation:cvpulse 1.8s infinite ease-out;opacity:0}",
      ".campaign-visual .cv-signal.s2{animation-delay:.6s}.campaign-visual .cv-signal.s3{animation-delay:1.2s}",
      ".campaign-visual .cv-right:after{content:'';position:absolute;left:-18px;top:46px;width:122px;height:3px;background:linear-gradient(90deg,transparent,rgba(190,129,255,.85),transparent);transform:rotate(-18deg);box-shadow:0 0 10px rgba(190,129,255,.8)}",
      "@keyframes cvpulse{0%{transform:scale(.25);opacity:.7}100%{transform:scale(1.5);opacity:0}}",
      "@media(max-width:600px){.campaign-visual .cv-actor{width:62px;height:125px;bottom:21%}.campaign-visual .cv-left{left:8%}.campaign-visual .cv-right{right:8%}.campaign-visual .cv-name{font-size:6px}.campaign-visual .cv-signal{width:110px;height:110px;right:12%;bottom:46%}}"
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

  function show(sceneId) {
    var scene = SCENES[sceneId];
    if (!scene) throw new Error("Unknown campaign visual scene: " + sceneId);
    if (!canDom()) return { id: sceneId, active: false, className: scene.className, layers: scene.layers.slice() };
    ensureStyle();
    hide();
    var el = root.document.createElement("div");
    el.id = "campaign-visual";
    el.className = "campaign-visual " + scene.className;
    scene.layers.forEach(function (name) { var layer = root.document.createElement("div"); layer.className = "cv-layer " + name; el.appendChild(layer); });
    var ground = root.document.createElement("div"); ground.className = "cv-ground"; el.appendChild(ground);
    el.appendChild(actor("left", scene.left));
    el.appendChild(actor("right", scene.right));
    if (sceneId === "rooftop_violin") {
      ["", "s2", "s3"].forEach(function (extra) { var ring = root.document.createElement("div"); ring.className = "cv-signal " + extra; el.appendChild(ring); });
    }
    var vignette = root.document.createElement("div"); vignette.className = "cv-vignette"; el.appendChild(vignette);
    var label = root.document.createElement("div"); label.className = "cv-label"; label.textContent = scene.label; el.appendChild(label);
    root.document.body.appendChild(el);
    root.__techopsCampaignVisualScene = sceneId;
    return { id: sceneId, active: true, className: scene.className, layers: scene.layers.slice() };
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
    var el = root.document.getElementById("campaign-visual");
    if (!el) return;
    var n = Math.max(-1, Math.min(1, Number(x) || 0));
    el.style.setProperty("--cv-far", (n * -8).toFixed(1) + "px");
    el.style.setProperty("--cv-near", (n * -18).toFixed(1) + "px");
  }

  return { VERSION: VERSION, SCENES: SCENES, show: show, hide: hide, setParallax: setParallax };
});
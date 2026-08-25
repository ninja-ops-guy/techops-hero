/* TechOps Hero — production Night Walker visual authority.
 * Loaded after the historical hook stack. It fixes visible reference breaks:
 *  1) Night gameplay must never render Mike with the daytime PLAYER_ATLAS.
 *  2) The district hub vehicle must read as a modern four-door Dodge Charger.
 *  3) Portrait mobile cinematics must cover/reframe the viewport instead of
 *     shrinking a 16:9 canvas into a thin strip surrounded by dead black space.
 * Story/combat physics remain owned by night_hooks.js.
 */
(function (root) {
  "use strict";
  var VERSION = 2;
  var atlas = root.NIGHT_WALKER_REFERENCE_V1 || null;
  var image = null;
  var portraitObserver = null;

  function imageReady() {
    if (!atlas || !atlas.src || typeof root.Image !== "function") return null;
    if (!image) { image = new root.Image(); image.src = atlas.src; }
    return image.complete && image.naturalWidth ? image : null;
  }

  function framePlan(NM, now) {
    NM = NM || {};
    if (NM.down > 0 || NM.hp <= 0) return "down0";
    if (NM.hitT > 0 || NM.ifr > 0 && NM.vy > 1.5) return "hit0";
    if (NM.block) return "guard0";
    if (NM.jabAnim > 0) {
      var stage = Math.max(0, Math.min(2, Number(NM.jabStage || 1) - 1));
      return ["light0", "light1", "light2"][stage];
    }
    if (NM.dashT > 0) return (Math.floor(now / 70) % 2) ? "heavy0" : "heavy1";
    if (Math.abs(NM.vx || 0) > .45) return (Math.floor(now / 145) % 2) ? "idle0" : "idle1";
    return (Math.floor(now / 420) % 2) ? "idle0" : "idle1";
  }

  function drawReferenceNightWalker(x, NM, px, py, now) {
    var img = imageReady();
    if (!img || !atlas || !atlas.frames) return false;
    var key = framePlan(NM, now || 0);
    var fr = atlas.frames[key] || atlas.frames.idle0;
    if (!fr) return false;
    var C = atlas.cell || 128;
    // Reference target is the large readable Sector 04 silhouette. The old
    // runtime rendered Mike near debug-sprite scale; production is intentionally larger.
    var h = Math.round(Math.max(92, (NM.h || 34) * 2.9));
    var w = h;
    var moving = Math.abs(NM.vx || 0) > .45;
    var bob = moving && NM.onGround ? Math.round(Math.sin((now || 0) / 92) * 1.5) : 0;
    var dx = Math.round(px + (NM.w || 22) / 2 - w / 2);
    var dy = Math.round(py + (NM.h || 34) - h + 7 + bob);
    x.save();
    x.imageSmoothingEnabled = false;
    // grounded contact shadow helps the heavier reference silhouette read on wet streets
    if (NM.onGround) {
      x.save(); x.globalAlpha = .28; x.fillStyle = "#000";
      x.beginPath(); x.ellipse(px + (NM.w || 22) / 2, py + (NM.h || 34) + 3, w * .24, 5, 0, 0, Math.PI * 2); x.fill(); x.restore();
    }
    if (NM.ifr > 0 && Math.floor((now || 0) / 80) % 2) x.globalAlpha = .55;
    if ((NM.face || 1) < 0) {
      x.translate(dx + w, 0); x.scale(-1, 1);
      x.drawImage(img, fr[0], fr[1], C, C, 0, dy, w, h);
    } else {
      x.drawImage(img, fr[0], fr[1], C, C, dx, dy, w, h);
    }
    x.restore();
    return true;
  }

  // Side-view 2015–2023 Charger silhouette: long four-door sedan, short deck,
  // muscular rear haunch, four side windows/door seams and full-width rear lamp cue.
  function drawCharger(x, cx, cy, w, tm) {
    var W = Math.max(154, w * 1.38), H = W * .285;
    var L = cx - W / 2, T = cy - H;
    x.save();
    x.shadowColor = "#39ff88"; x.shadowBlur = 18;
    x.fillStyle = "rgba(57,255,136,.20)";
    x.beginPath(); x.ellipse(cx, cy + 4, W * .45, 7, 0, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;

    // long-hood/four-door Charger body. Lower roof and longer wheelbase than
    // the retired coupe/slab renderer.
    x.fillStyle = "#080b10"; x.strokeStyle = "#303744"; x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(L + 2, T + H * .58);
    x.lineTo(L + W * .11, T + H * .45);
    x.lineTo(L + W * .26, T + H * .18);
    x.lineTo(L + W * .63, T + H * .13);
    x.lineTo(L + W * .79, T + H * .34);
    x.lineTo(L + W * .94, T + H * .42);
    x.lineTo(L + W, T + H * .59);
    x.lineTo(L + W * .965, T + H * .82);
    x.lineTo(L + W * .04, T + H * .82);
    x.closePath(); x.fill(); x.stroke();

    // four-door glasshouse, with B/C pillars readable even at gameplay size
    var glassY = T + H * .22, glassH = H * .29;
    x.fillStyle = "#111a24"; x.strokeStyle = "#475565"; x.lineWidth = 1;
    var windows = [
      [L + W*.285, glassY+2, W*.145, glassH-2],
      [L + W*.442, glassY, W*.145, glassH],
      [L + W*.600, glassY, W*.125, glassH],
      [L + W*.738, glassY+2, W*.070, glassH-3]
    ];
    windows.forEach(function (r) { x.beginPath(); x.roundRect(r[0],r[1],r[2],r[3],2); x.fill(); x.stroke(); });

    x.strokeStyle = "#252d37"; x.lineWidth = 1;
    [0.275,0.438,0.595,0.738].forEach(function (p) { x.beginPath(); x.moveTo(L+W*p,T+H*.52); x.lineTo(L+W*p,T+H*.80); x.stroke(); });
    x.fillStyle = "#68717c";
    [0.393,0.548,0.690].forEach(function(p){ x.fillRect(L+W*p,T+H*.585,7,1.5); });

    // wheels are pushed outward to preserve the Charger wheelbase at small scale
    [L + W*.185, L + W*.805].forEach(function(wx){
      x.fillStyle="#050608"; x.beginPath(); x.arc(wx,T+H*.80,H*.205,0,Math.PI*2); x.fill();
      x.strokeStyle="#697480"; x.lineWidth=2; x.beginPath(); x.arc(wx,T+H*.80,H*.125,0,Math.PI*2); x.stroke();
      x.fillStyle="#111820"; x.beginPath(); x.arc(wx,T+H*.80,H*.055,0,Math.PI*2); x.fill();
    });

    // rear light-bar identity + restrained TechOps ghost-flame treatment
    x.save(); x.shadowColor="#ff2338"; x.shadowBlur=8; x.strokeStyle="#ff394c"; x.lineWidth=2.6;
    x.beginPath(); x.moveTo(L+4,T+H*.49); x.lineTo(L+W*.112,T+H*.465); x.stroke(); x.restore();
    x.strokeStyle="#39ff88"; x.lineWidth=2; x.globalAlpha=.85;
    x.beginPath(); x.moveTo(L+W*.25,T+H*.69); x.quadraticCurveTo(L+W*.38,T+H*.53,L+W*.49,T+H*.69); x.quadraticCurveTo(L+W*.60,T+H*.79,L+W*.71,T+H*.66); x.stroke();
    x.globalAlpha=1;
    x.fillStyle="#d9f4ff"; x.fillRect(L+W*.965,T+H*.46,3,5);
    x.restore();
  }

  function portraitCoverCanvas(canvas) {
    if (!canvas || !root || !root.innerWidth || !root.innerHeight) return false;
    var vw = root.innerWidth, vh = root.innerHeight;
    if (vw >= vh) return false;
    // The cinematic canvas is 16:9. On portrait, cover the viewport and crop
    // horizontally around center rather than letterboxing the entire frame.
    var aspect = 1280 / 720;
    canvas.style.width = Math.ceil(vh * aspect) + "px";
    canvas.style.height = vh + "px";
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    canvas.style.flex = "0 0 auto";
    var overlay = canvas.parentNode;
    if (overlay && overlay.style) {
      overlay.style.overflow = "hidden";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
    }
    return true;
  }

  function installPortraitCinematicGuard() {
    if (!root || !root.document || typeof root.MutationObserver !== "function") return false;
    function apply() {
      var canvas = root.document.querySelector("#v722-cine canvas");
      if (canvas) portraitCoverCanvas(canvas);
    }
    apply();
    if (portraitObserver) return true;
    portraitObserver = new root.MutationObserver(function(){ apply(); });
    portraitObserver.observe(root.document.documentElement, { childList:true, subtree:true });
    root.addEventListener && root.addEventListener("resize", apply, { passive:true });
    root.addEventListener && root.addEventListener("orientationchange", apply, { passive:true });
    return true;
  }

  function install() {
    var result = { player:false, charger:false, portraitCinematic:false };
    // Explicit overwrite is intentional: this module is the stable visual authority.
    if (typeof root.drawNightPlayerAtlas === "function") { root.drawNightPlayerAtlas = drawReferenceNightWalker; result.player = true; }
    if (typeof root.nmCar === "function") { root.nmCar = drawCharger; result.charger = true; }
    result.portraitCinematic = installPortraitCinematicGuard();
    try { imageReady(); } catch (e) {}
    return result;
  }

  var installed = install();
  root.TechOpsNightReferenceVisuals = {
    VERSION: VERSION, atlas: atlas, framePlan: framePlan,
    drawReferenceNightWalker: drawReferenceNightWalker,
    drawCharger: drawCharger, portraitCoverCanvas: portraitCoverCanvas,
    installPortraitCinematicGuard: installPortraitCinematicGuard,
    install: install, installed: installed
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

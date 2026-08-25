/* TechOps Hero — production Night Walker visual authority.
 * Loaded after the historical hook stack. It fixes two visible reference breaks:
 *  1) Night gameplay must never render Mike with the daytime PLAYER_ATLAS.
 *  2) The district hub vehicle must read as a modern four-door Dodge Charger,
 *     not the old procedural two-door/slab silhouette.
 * Story/combat physics remain owned by night_hooks.js.
 */
(function (root) {
  "use strict";
  var VERSION = 1;
  var atlas = root.NIGHT_WALKER_REFERENCE_V1 || null;
  var image = null;

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
    var h = Math.round(Math.max(76, (NM.h || 34) * 2.45));
    var w = h;
    var dx = Math.round(px + (NM.w || 22) / 2 - w / 2);
    var dy = Math.round(py + (NM.h || 34) - h + 7);
    x.save();
    x.imageSmoothingEnabled = false;
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
    var W = Math.max(138, w * 1.28), H = W * .31;
    var L = cx - W / 2, T = cy - H;
    x.save();
    x.shadowColor = "#39ff88"; x.shadowBlur = 18;
    x.fillStyle = "rgba(57,255,136,.20)";
    x.beginPath(); x.ellipse(cx, cy + 4, W * .45, 7, 0, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;

    // lower body + Charger shoulders
    x.fillStyle = "#080b10"; x.strokeStyle = "#303744"; x.lineWidth = 1.5;
    x.beginPath();
    x.moveTo(L + 3, T + H * .55);
    x.lineTo(L + W * .12, T + H * .43);
    x.lineTo(L + W * .28, T + H * .16);
    x.lineTo(L + W * .66, T + H * .12);
    x.lineTo(L + W * .80, T + H * .34);
    x.lineTo(L + W * .96, T + H * .43);
    x.lineTo(L + W, T + H * .60);
    x.lineTo(L + W * .96, T + H * .82);
    x.lineTo(L + W * .05, T + H * .82);
    x.closePath(); x.fill(); x.stroke();

    // four-door glasshouse rather than a coupe cabin
    var glassY = T + H * .21, glassH = H * .30;
    x.fillStyle = "#111a24"; x.strokeStyle = "#475565"; x.lineWidth = 1;
    var windows = [
      [L + W*.29, glassY, W*.15, glassH],
      [L + W*.45, glassY-1, W*.15, glassH+1],
      [L + W*.61, glassY, W*.13, glassH],
      [L + W*.75, glassY+2, W*.07, glassH-3]
    ];
    windows.forEach(function (r) { x.beginPath(); x.roundRect(r[0],r[1],r[2],r[3],2); x.fill(); x.stroke(); });

    // door seams + handles make the four-door identity obvious at game scale
    x.strokeStyle = "#252d37"; x.lineWidth = 1;
    [0.28,0.45,0.61,0.76].forEach(function (p) { x.beginPath(); x.moveTo(L+W*p,T+H*.52); x.lineTo(L+W*p,T+H*.80); x.stroke(); });
    x.fillStyle = "#68717c";
    [0.40,0.57,0.72].forEach(function(p){ x.fillRect(L+W*p,T+H*.58,7,1.5); });

    // wheels
    [L + W*.20, L + W*.79].forEach(function(wx){
      x.fillStyle="#050608"; x.beginPath(); x.arc(wx,T+H*.80,H*.19,0,Math.PI*2); x.fill();
      x.strokeStyle="#697480"; x.lineWidth=2; x.beginPath(); x.arc(wx,T+H*.80,H*.12,0,Math.PI*2); x.stroke();
      x.fillStyle="#111820"; x.beginPath(); x.arc(wx,T+H*.80,H*.055,0,Math.PI*2); x.fill();
    });

    // Charger rear light-bar cue + restrained green ghost-flame accent
    x.strokeStyle="#ff394c"; x.lineWidth=2.4; x.beginPath(); x.moveTo(L+5,T+H*.49); x.lineTo(L+W*.115,T+H*.46); x.stroke();
    x.strokeStyle="#39ff88"; x.lineWidth=2; x.globalAlpha=.85;
    x.beginPath(); x.moveTo(L+W*.26,T+H*.68); x.quadraticCurveTo(L+W*.38,T+H*.54,L+W*.48,T+H*.69); x.quadraticCurveTo(L+W*.59,T+H*.78,L+W*.70,T+H*.66); x.stroke();
    x.globalAlpha=1;
    x.fillStyle="#d9f4ff"; x.fillRect(L+W*.965,T+H*.46,3,5);
    x.restore();
  }

  function install() {
    var result = { player:false, charger:false };
    // Explicit overwrite is intentional: this module is the stable visual authority.
    if (typeof root.drawNightPlayerAtlas === "function") { root.drawNightPlayerAtlas = drawReferenceNightWalker; result.player = true; }
    if (typeof root.nmCar === "function") { root.nmCar = drawCharger; result.charger = true; }
    // Prime the embedded reference image so first combat frame rarely falls back.
    try { imageReady(); } catch (e) {}
    return result;
  }

  var installed = install();
  root.TechOpsNightReferenceVisuals = {
    VERSION: VERSION, atlas: atlas, framePlan: framePlan,
    drawReferenceNightWalker: drawReferenceNightWalker,
    drawCharger: drawCharger, install: install, installed: installed
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

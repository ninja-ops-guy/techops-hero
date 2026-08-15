// v7.6 "Visual Direction" — certification polish pass, phase 1 (see the Cert
// Polish Review). Pure presentation; zero game-logic changes. All effects gate
// on the existing UI-animations setting (V67SET.anims).
//   P0-1 time-of-day color grading (+ storm ramp days 7→10, incident pulse)
//   P0-2 real-time pixel lighting (multiply light map: monitors, racks, portals,
//        player light, outage/night flashlight cone, FPS-adaptive LOD)
//   P0-3 camera lag + look-ahead (never static)
//   P0-4 living title screen (rain + skyline push-in, self-terminating)
//   P1-3 material pass (procedural floor texture — kills flat colors)
(function () {
  const animsOn = () => !window.V67SET || V67SET.anims !== false;

  // ---------- P0-3: camera smoothing ----------
  let smx = null, smy = null, lastT = 0;
  function cameraPre(s) {
    if (!s || s.room || s.nightMode || !animsOn()) { smx = null; return; }
    const now = performance.now(), dt = Math.min(80, now - (lastT || now)); lastT = now;
    if (smx === null) { smx = s.px; smy = s.py; }
    // look-ahead half a tile toward facing
    const la = { left: [-.5, 0], right: [.5, 0], up: [0, -.5], down: [0, .5] }[s.fx] || [0, 0];
    const tx = s.px + la[0], ty = s.py + la[1];
    const k = 1 - Math.exp(-dt / 170); // ~170ms lag
    smx += (tx - smx) * k; smy += (ty - smy) * k;
    const dx = Math.max(-.6, Math.min(.6, smx - s.px)), dy = Math.max(-.6, Math.min(.6, smy - s.py));
    if (Math.abs(dx) + Math.abs(dy) < .001) return null;
    s.px += dx; s.py += dy;
    return [dx, dy];
  }
  function cameraPost(s, d) { if (d && s) { s.px -= d[0]; s.py -= d[1]; } }

  // ---------- P1-3: procedural floor texture ----------
  let floorPat = null;
  function getFloorPat() {
    if (floorPat) return floorPat;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"), im = x.createImageData(128, 128);
    for (let i = 0; i < im.data.length; i += 4) {
      const n = 218 + (Math.random() * 37 | 0); // subtle brightness noise
      im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    // faint carpet-tile seams every 32px
    x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 1;
    for (let j = 0; j <= 128; j += 32) { x.beginPath(); x.moveTo(0, j + .5); x.lineTo(128, j + .5); x.moveTo(j + .5, 0); x.lineTo(j + .5, 128); x.stroke(); }
    floorPat = ctx.createPattern(c, "repeat");
    return floorPat;
  }

  // ---------- P0-2: light map ----------
  const lc = document.createElement("canvas"), lx = lc.getContext("2d");
  // v7.28 perf: default to half-res lights (soft radial glows — visually
  // identical upscaled), and stamp a cached gradient blob instead of building
  // a new radial gradient per light per frame.
  let lightScale = .5, frameEMA = 16, lodChecked = 0;
  let glowBlob = null;
  function getGlowBlob() {
    if (glowBlob) return glowBlob;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const bx = c.getContext("2d");
    const g = bx.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    bx.fillStyle = g; bx.fillRect(0, 0, 128, 128);
    glowBlob = c;
    return c;
  }
  function ambientRGB(s) {
    const outage = s.chaos && s.chaos.id === "outage";
    if (s.nightMode || outage) return [56, 60, 86];
    const h = s.clock / 60;
    if (h < 10) return [226, 218, 202];
    if (h < 15) return [248, 245, 240];
    if (h < 17) return [234, 220, 204];
    return [188, 192, 208];
  }
  function punch(W, H, sx, sy, r, a) {
    if (sx < -r || sy < -r || sx > W + r || sy > H + r) return;
    lx.globalAlpha = a;
    lx.drawImage(getGlowBlob(), sx - r, sy - r, r * 2, r * 2);
    lx.globalAlpha = 1;
  }
  function renderLights(s, sc) {
    const W = Math.ceil(cv.width * lightScale), H = Math.ceil(cv.height * lightScale);
    if (lc.width !== W || lc.height !== H) { lc.width = W; lc.height = H; }
    const [r, g, b] = ambientRGB(s);
    lx.globalCompositeOperation = "source-over";
    lx.fillStyle = `rgb(${r},${g},${b})`; lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = "destination-out";
    const toS = (wx, wy) => [(wx * TILE + TILE / 2 - camX) * sc * lightScale, (wy * TILE + TILE / 2 - camY) * sc * lightScale];
    const dark = s.nightMode || (s.chaos && s.chaos.id === "outage");
    // coffee machines — warm pools
    for (const c of s.coffeeMachines) { const [x, y] = toS(c.x, c.y); punch(W, H, x, y, 50 * lightScale, .55); }
    // server racks — cyan breathing
    const tm = performance.now(), br = .5 + .18 * Math.sin(tm / 700);
    for (const [rx, ry] of [[SRV.x0 + 2, SRV.y0 + 1], [SRV.x1 - 2, SRV.y0 + 1], [(SRV.x0 + SRV.x1) / 2, SRV.y1 - 1]]) {
      const [x, y] = toS(rx, ry); punch(W, H, x, y, 62 * lightScale, br);
    }
    // portals — violet pulse (reuse their rhythm)
    for (const p of s.portals) { const [x, y] = toS(p.x, p.y); punch(W, H, x, y, 42 * lightScale, .5 + .2 * Math.sin(tm / 400 + p.x)); }
    // player personal light; flashlight cone when dark
    const [px, py] = toS(s.px, s.py);
    punch(W, H, px, py, (dark ? 44 : 58) * lightScale, dark ? .95 : .5);
    if (dark) {
      const d = { left: [-1.4, 0], right: [1.4, 0], up: [0, -1.4], down: [0, 1.4] }[s.fx] || [0, 1.4];
      punch(W, H, px + d[0] * TILE * sc * lightScale, py + d[1] * TILE * sc * lightScale, 60 * lightScale, .85);
    }
    // composite
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = .5;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lc, 0, 0, cv.width, cv.height);
    ctx.restore();
  }

  // ---------- P0-1: grading ----------
  function renderGrade(s) {
    const h = s.clock / 60, tm = performance.now();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fills = window.v76._fills = [];
    if (s.nightMode) fills.push(["rgba(50,70,170,.14)", "night"]);
    else if (h < 10) fills.push(["rgba(255,190,90,.10)", "morning"]);
    else if (h >= 15 && h < 17) fills.push(["rgba(255,150,60,.11)", "golden"]);
    // story storm ramp — the week darkens toward day 10
    if (s.day === 9) fills.push(["rgba(80,100,140,.07)", "storm9"]);
    if (s.day >= 10 && s.day < 11) fills.push(["rgba(70,90,135,.13)", "storm10"]);
    // aftermath warmth: the city that moved first
    try {
      const a = window.v73 && window.v73.arc();
      if (a && s.day >= 11 && (a.choice === "B" || a.choice === "TRUE") && h < 12) fills.push(["rgba(255,205,120,.08)", "sunrise"]);
    } catch (e) { }
    // declared incident — emergency pulse (≤2Hz, low alpha: photosensitivity-safe)
    if (s.npcs && s.npcs.some(n => n.incidentDeclared && !n.done)) {
      const a2 = .04 + .035 * Math.sin(tm / 500);
      fills.push([`rgba(255,40,40,${a2.toFixed(3)})`, "incident"]);
    }
    for (const [f] of fills) { ctx.fillStyle = f; ctx.fillRect(0, 0, cv.width, cv.height); }
    // server room casts cyan into the world
    if (!s.room && !s.nightMode) {
      const sc = cv.height / 14 / TILE;
      ctx.fillStyle = "rgba(40,200,255,.06)";
      ctx.fillRect((SRV.x0 * TILE - camX) * sc, (SRV.y0 * TILE - camY) * sc, (SRV.x1 - SRV.x0 + 1) * TILE * sc, (SRV.y1 - SRV.y0 + 1) * TILE * sc);
    }
    ctx.restore();
  }

  // ---------- master draw wrap (pre: camera · post: texture, grade, lights) ----------
  const flags = { tex: false, fills: 0, lights: false }; // observability for tests/a11y
  const __origDraw76 = draw;
  let lastFrame = 0;
  draw = function () {
    const s = S;
    const d = cameraPre(s);
    const t0 = performance.now();
    const r = __origDraw76.apply(this, arguments);
    cameraPost(s, d);
    flags.tex = false; flags.fills = 0; flags.lights = false;
    if (!s || !s.map || !animsOn()) return r;
    try {
      if (!s.room) {
        // floor texture, world-aligned
        const ts = cv.height / 14, sc = ts / TILE;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = .08; ctx.fillStyle = getFloorPat();
        ctx.translate(-((camX * sc) % 128), -((camY * sc) % 128));
        ctx.fillRect(0, 0, cv.width + 128, cv.height + 128);
        ctx.restore();
        flags.tex = true;
      }
      renderGrade(s);
      flags.fills = (window.v76 && window.v76._fills) ? window.v76._fills.length : 0;
      if (!s.room) { renderLights(s, cv.height / 14 / TILE); flags.lights = true; }
    } catch (e) { }
    // v7.28: the EMA now covers the WHOLE frame (core + all post layers), so
    // the adaptive LOD actually reacts to the light map's own cost.
    const ft = performance.now() - t0; frameEMA = frameEMA * .95 + ft * .05;
    if (++lodChecked > 90) { lodChecked = 0; lightScale = frameEMA > 20 ? .3 : .5; }
    return r;
  };

  // ---------- P0-4: living title screen ----------
  (function titleFX() {
    const ts = document.getElementById("title-screen");
    if (!ts || document.getElementById("v76-titlefx")) return;
    const c = document.createElement("canvas");
    c.id = "v76-titlefx";
    ts.insertBefore(c, ts.firstChild);
    const sky = document.getElementById("v62-skyline");
    if (sky) sky.classList.add("v76-push");
    const x = c.getContext("2d");
    let raf = 0, drops = [];
    function loop() {
      if (ts.classList.contains("hidden") || !ts.isConnected) { c.remove(); cancelAnimationFrame(raf); return; }
      const W = c.width = ts.clientWidth, H = c.height = ts.clientHeight;
      if (!drops.length) for (let i = 0; i < 40; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 5 });
      x.clearRect(0, 0, W, H);
      if (animsOn()) {
        x.strokeStyle = "rgba(165,190,235,.28)"; x.lineWidth = 1; x.beginPath();
        for (const p of drops) { x.moveTo(p.x, p.y); x.lineTo(p.x - 2, p.y + 11); p.y += p.v; p.x -= .6; if (p.y > H) { p.y = -14; p.x = Math.random() * (W + 30); } }
        x.stroke();
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
  })();

  const st = document.createElement("style");
  st.textContent = `
#v76-titlefx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
#title-screen #v62-skyline.v76-push{animation:v76-pushin 24s ease-in-out infinite alternate}
@keyframes v76-pushin{from{transform:scale(1)}to{transform:scale(1.06)}}`;
  document.head.appendChild(st);

  window.v76 = { renderGrade, renderLights, flags, get lightCanvas() { return lc; }, get smoothed() { return [smx, smy]; }, get lightScale() { return lightScale; }, get frameEMA() { return frameEMA; } };
  console.log("[v7.6] Visual Direction loaded");
})();

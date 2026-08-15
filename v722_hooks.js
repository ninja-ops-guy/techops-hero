/* ==========================================================================
   v7.22 — NIGHT DRIVE (the cinematic cut)
   The 16:00 drive home / night-crawl opening now plays as a real-time
   cinematic instead of a hard cut, after the reference boards + clip:
     1. AEROTECH facade in the rain — Mike walks to his Charger
     2. Headlights flare, the TECHOPS dashboard wakes
     3. Neon New Haven drive — three-layer parallax, rain, wet asphalt
     4. Iron & Tide under the elevated line — a glitch steps out of the alley
     5. BATTLE START — crest slam, zoom punch, straight into the crawl
   Reference-board corrections (erroneous details cut): legible English neon
   only, Mike keeps the IT vest/sunglasses/dreadlocks (real sprite frames),
   the alley threat is a glitch creature (the night crawl's actual enemy),
   and the palette stays navy/purple with the wing crest.
   Everything is procedural canvas + WebAudio — zero new assets. Player
   frames come from the v7.21-bleed path automatically. Skippable (E /
   Enter / Space / click), input-frozen while playing, Felicia mode gets
   the Impreza variant. Wraps enterNight — every way out of the building
   (South Exit door, both security sweeps) routes through it.
   ========================================================================== */
(function () {
  const VER = "7.22";
  if (window.v722) return;

  // ---------- audio (own context, respects the v6.7 volume setting) ----------
  let AC722 = null, live = [];
  function ac() {
    try {
      AC722 = AC722 || new (window.AudioContext || window.webkitAudioContext)();
      if (AC722.state === "suspended") AC722.resume();
    } catch (e) { }
    return AC722;
  }
  const vol722 = () => { try { return (window.V67SET ? V67SET.volSfx : .8); } catch (e) { return .8; } };
  function noiseBuffer(c, sec) {
    const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function startRain() {
    const c = ac(); if (!c) return;
    try {
      const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 2); src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = .5;
      const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(.055 * vol722(), c.currentTime + .8);
      src.connect(bp); bp.connect(g); g.connect(c.destination); src.start();
      live.push(src, g);
    } catch (e) { }
  }
  function pad722() {
    const c = ac(); if (!c) return;
    try {
      [55, 82.5, 110].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = i === 2 ? "sine" : "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(.028 * vol722(), c.currentTime + 1.6);
        o.connect(g); g.connect(c.destination); o.start();
        live.push(o, g);
      });
    } catch (e) { }
  }
  function engine722() {
    const c = ac(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(42, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(96, c.currentTime + 1.1);
      o.frequency.exponentialRampToValueAtTime(58, c.currentTime + 1.8);
      g.gain.setValueAtTime(.09 * vol722(), c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + 1.9);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 2);
    } catch (e) { }
  }
  function thunder722() {
    const c = ac(); if (!c) return;
    try {
      const src = c.createBufferSource(); src.buffer = noiseBuffer(c, 1.4);
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 140;
      const g = c.createGain();
      g.gain.setValueAtTime(.16 * vol722(), c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + 1.3);
      src.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
    } catch (e) { }
  }
  function sting722() {
    const c = ac(); if (!c) return;
    try {
      const t0 = c.currentTime;
      [[330, 0, .09], [415, .09, .09], [494, .18, .09], [660, .27, .22]].forEach(([f, d, dur]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "square"; o.frequency.value = f;
        g.gain.setValueAtTime(.07 * vol722(), t0 + d);
        g.gain.exponentialRampToValueAtTime(.001, t0 + d + dur);
        o.connect(g); g.connect(c.destination); o.start(t0 + d); o.stop(t0 + d + dur);
      });
      const src = c.createBufferSource(); src.buffer = noiseBuffer(c, .4);
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
      const g2 = c.createGain();
      g2.gain.setValueAtTime(.12 * vol722(), t0);
      g2.gain.exponentialRampToValueAtTime(.001, t0 + .35);
      src.connect(hp); hp.connect(g2); g2.connect(c.destination); src.start(t0);
    } catch (e) { }
  }
  function stopAudio722() {
    const c = AC722;
    live.forEach(n => {
      try {
        if (n.gain) { n.gain.cancelScheduledValues(c.currentTime); n.gain.linearRampToValueAtTime(0, c.currentTime + .3); }
        else setTimeout(() => { try { n.stop(); } catch (e) { } }, 350);
      } catch (e) { }
    });
    live = [];
  }

  // ---------- drawing helpers ----------
  const LW = 1280, LH = 720, BAR = 64; // logical size + letterbox
  const NEON = ["#b26bff", "#39d5ff", "#ff5c8a", "#ffb347", "#39ff88"];
  function rr(x, X, Y, W, H, R) {
    x.beginPath();
    x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
    x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
  }
  function px(x, X, Y, W, H, C) { x.fillStyle = C; x.fillRect(X | 0, Y | 0, Math.ceil(W), Math.ceil(H)); }
  function txt(x, s, X, Y, size, C, align, glow) {
    x.save();
    x.font = `bold ${size}px "Courier New", monospace`;
    x.textAlign = align || "left"; x.textBaseline = "middle";
    if (glow) { x.shadowColor = glow; x.shadowBlur = 18; }
    x.fillStyle = C; x.fillText(s, X, Y);
    x.restore();
  }
  function neonSign(x, X, Y, s, C, t, vert) {
    x.save();
    x.strokeStyle = "#2a3350"; x.lineWidth = 3;
    const w = vert ? 34 : x.measureText(s).width + 22, h = vert ? s.length * 26 + 16 : 44;
    x.fillStyle = "#0d1120"; x.fillRect(X, Y, w, h); x.strokeRect(X, Y, w, h);
    const flick = (Math.sin(t * .021 + X) > -.92) ? 1 : .25; // occasional neon dropouts
    x.globalAlpha = flick;
    if (vert) { for (let i = 0; i < s.length; i++) txt(x, s[i], X + w / 2, Y + 22 + i * 26, 20, C, "center", C); }
    else txt(x, s, X + w / 2, Y + h / 2 + 1, 20, C, "center", C);
    x.restore();
  }
  function rain722(x, t, amt, W, H) {
    x.save(); x.strokeStyle = "rgba(170,195,255,.34)"; x.lineWidth = 1.4; x.beginPath();
    for (let i = 0; i < amt; i++) {
      const rx = ((i * 197.3 + t * .9) % (W + 40)) - 20, ry = ((i * 89.7 + t * 1.9) % (H + 30)) - 15;
      x.moveTo(rx, ry); x.lineTo(rx - 5, ry + 14);
    }
    x.stroke(); x.restore();
  }
  function grain722(x, W, H) {
    x.save(); x.globalAlpha = .05;
    for (let i = 0; i < 260; i++) px(x, Math.random() * W, Math.random() * H, 2, 2, Math.random() > .5 ? "#fff" : "#000");
    x.restore();
  }
  function crest(x, cx, cy, sc, C) {
    x.save(); x.translate(cx, cy); x.scale(sc, sc);
    x.fillStyle = C; x.shadowColor = C; x.shadowBlur = 22;
    px(x, -4, -26, 8, 52, C); // spine
    for (let i = 0; i < 3; i++) { // wings
      const y = -20 + i * 14, w = 40 - i * 9;
      x.beginPath(); x.moveTo(-6, y); x.lineTo(-6 - w, y - 10); x.lineTo(-6 - w, y - 2); x.lineTo(-6, y + 8); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(6, y); x.lineTo(6 + w, y - 10); x.lineTo(6 + w, y - 2); x.lineTo(6, y + 8); x.closePath(); x.fill();
    }
    x.restore();
  }

  // Mike (or a tinted stand-in for Felicia mode) straight from the real atlas —
  // the v7.21 drawImage wrapper bleeds the source automatically.
  let tmpSprite = null;
  function mikeSprite(x, key, dx, dy, h, fel) {
    try {
      if (typeof playerImg === "undefined" || !playerImg.complete || !playerImg.naturalWidth) return;
      const fr = PLAYER_ATLAS.frames[key] || PLAYER_ATLAS.frames.right0, C = PLAYER_ATLAS.cell;
      const dw = h, dh = h;
      x.save();
      x.imageSmoothingEnabled = false;
      if (fel) { try { x.filter = "hue-rotate(250deg) saturate(1.3) brightness(.8)"; } catch (e) { } }
      x.drawImage(playerImg, fr[0] * C, fr[1] * C, C, C, dx - dw / 2, dy - dh, dw, dh);
      x.restore();
    } catch (e) { }
  }
  function suv(x, X, Y, sc, imp, lightsOn) {
    // X,Y = front wheel ground point; sc = px scale
    // v7.27: Mike's daily is his Charger now — black muscle car, green ghost
    // flames, green underglow (per the car sheet). Felicia keeps the Impreza.
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    const body = imp ? "#15151d" : "#0e1013", trim = imp ? "#8a6cff" : "#39ff88";
    x.save(); x.shadowColor = imp ? "#a86bff" : "#2ee06f"; x.shadowBlur = 26;
    px(x, -98, -6, 196, 5, imp ? "#a86bff" : "#2ee06f"); x.restore(); // underglow
    x.fillStyle = body;
    if (imp) { rr(x, -100, -34, 200, 28, 10); x.fill(); rr(x, -64, -52, 118, 22, 8); x.fill(); } // low sedan
    else { // Charger — long-hood muscle stance
      rr(x, -100, -42, 200, 36, 10); x.fill();
      rr(x, -56, -64, 104, 24, 9); x.fill();
      px(x, 56, -50, 36, 8, body);       // hood line
      px(x, 72, -47, 18, 5, "#1a1d24");  // hood scoop
    }
    x.fillStyle = "#0a0f1c"; // glass
    if (imp) { rr(x, -58, -49, 50, 16, 4); x.fill(); rr(x, -2, -49, 50, 16, 4); x.fill(); }
    else { rr(x, -50, -60, 42, 18, 4); x.fill(); rr(x, -1, -60, 39, 18, 4); x.fill(); }
    if (!imp) { // green ghost flames licking the flanks (shapes, not emoji)
      x.fillStyle = "#1d5c38";
      [[-92, -22, 48], [-32, -20, 42], [20, -21, 36]].forEach(f => {
        x.beginPath(); x.moveTo(f[0], -13);
        x.quadraticCurveTo(f[0] + f[2] * .28, f[1] - 4, f[0] + f[2] * .55, -15);
        x.quadraticCurveTo(f[0] + f[2] * .78, f[1] - 1, f[0] + f[2], -12);
        x.lineTo(f[0] + f[2], -7); x.lineTo(f[0], -7); x.closePath(); x.fill();
      });
      x.fillStyle = "#39ff88";
      [[-82, -17, 34], [-24, -16, 30]].forEach(f => {
        x.beginPath(); x.moveTo(f[0], -11);
        x.quadraticCurveTo(f[0] + f[2] * .35, f[1] - 3, f[0] + f[2], -10);
        x.lineTo(f[0] + f[2], -7); x.lineTo(f[0], -7); x.closePath(); x.fill();
      });
    }
    x.fillStyle = trim; px(x, -100, -16, 200, 5, trim); // side skirt
    [-64, 62].forEach(wx => { // wheels
      x.fillStyle = "#0a0a0d"; x.beginPath(); x.arc(wx, 0, 17, 0, 7); x.fill();
      x.fillStyle = imp ? "#d9b45b" : "#2b303c"; x.beginPath(); x.arc(wx, 0, 8, 0, 7); x.fill();
      if (!imp) { x.strokeStyle = "#39ff88"; x.lineWidth = 1.5; x.beginPath(); x.arc(wx, 0, 11.5, 0, 7); x.stroke(); }
    });
    if (lightsOn) {
      const g = x.createLinearGradient(100, -20, 260, 6);
      g.addColorStop(0, "rgba(255,240,190,.5)"); g.addColorStop(1, "rgba(255,240,190,0)");
      x.fillStyle = g; x.beginPath(); x.moveTo(98, -26); x.lineTo(264, -8); x.lineTo(264, 8); x.lineTo(98, -6); x.closePath(); x.fill();
      x.save(); x.shadowColor = "#ffe9b0"; x.shadowBlur = 18; px(x, 92, -30, 8, 12, "#fff3c4"); x.restore();
      if (imp) px(x, -100, -28, 5, 10, "#ff4d5e"); // taillight
      else { // Charger full-width rear light bar
        x.save(); x.shadowColor = "#ff2233"; x.shadowBlur = 14;
        px(x, -102, -36, 6, 16, "#ff2233"); x.restore();
      }
    }
    x.fillStyle = "#101319"; rr(x, 40, -12, 34, 13, 3); x.fill(); // plate
    x.save(); x.font = 'bold 8px "Courier New",monospace'; x.fillStyle = "#cfe3ff"; x.textAlign = "center"; x.fillText("TECHOPS", 57, -3); x.restore();
    x.restore();
  }
  function glitch(x, X, Y, sc, t, reveal) {
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    x.globalAlpha = reveal * (.55 + .45 * Math.abs(Math.sin(t * .05)));
    const jit = () => (Math.random() - .5) * 6;
    x.save(); x.shadowColor = "#b26bff"; x.shadowBlur = 24;
    px(x, -16 + jit(), -64, 32, 40, "#3c2a63");          // torso slab
    px(x, -12 + jit(), -84, 24, 22, "#2a1d47");          // head
    px(x, -20 + jit(), -24, 14, 24, "#31215a");
    px(x, 6 + jit(), -24, 14, 24, "#31215a");
    x.restore();
    px(x, -8, -78, 5, 5, "#ff3860"); px(x, 4, -78, 5, 5, "#ff3860"); // eyes
    for (let i = 0; i < 5; i++) px(x, -18 + Math.random() * 36, -70 + Math.random() * 46, 10 + Math.random() * 14, 2, "#8a6cff"); // static slices
    x.restore();
  }

  // ---------- the five shots ----------
  const DUR = 13500;
  const SHOTS = [0, 3300, 5700, 9700, 12000, DUR];
  function captions(fel) {
    return [
      `${fel ? "FELICIA" : "MIKE"} EXITS AEROTECH INTO THE RAINY PARKING LOT.`,
      fel ? "THE IMPREZA'S DASHBOARD WAKES. GHOST RIG ONLINE." : "THE DASHBOARD ACTIVATES. TECHOPS.",
      "NEON NEW HAVEN — THE DRIVE HOME.",
      "IRON & TIDE, UNDER THE ELEVATED LINE. SOMETHING MOVES IN THE ALLEY.",
      "",
    ];
  }

  function shot1(x, t, tl, fel) { // AEROTECH facade, rain, walk to the car
    const g = x.createLinearGradient(0, BAR, 0, LH - BAR);
    g.addColorStop(0, "#0a0e1c"); g.addColorStop(1, "#131a30");
    x.fillStyle = g; x.fillRect(0, BAR, LW, LH - BAR * 2);
    // city silhouette
    for (let i = 0; i < 9; i++) {
      const bw = 90 + (i * 53) % 70, bx = i * 150 - 40, bh = 120 + (i * 97) % 130;
      px(x, bx, 430 - bh, bw, bh, "#0d1322");
      for (let w = 0; w < 12; w++) if ((i * 7 + w * 13) % 5 < 2) px(x, bx + 10 + (w % 4) * 20, 430 - bh + 14 + ((w / 4) | 0) * 26, 8, 10, "#26324f");
    }
    // factory block + sign
    px(x, 60, 180, 420, 260, "#161d31");
    px(x, 60, 180, 420, 10, "#232c47");
    txt(x, "AEROTECH", 130, 160, 42, "#39d5ff", "left", "#39d5ff");
    px(x, 84, 236, 200, 34, "#0d1120"); txt(x, "EMPLOYEES BADGE IN", 94, 246, 11, "#8fa3cc"); txt(x, "AT ALL TIMES", 94, 260, 11, "#8fa3cc");
    // door glow
    const dg = x.createLinearGradient(300, 300, 300, 440);
    dg.addColorStop(0, "rgba(255,214,140,.5)"); dg.addColorStop(1, "rgba(255,214,140,.05)");
    px(x, 300, 300, 90, 140, "#2a2417"); x.fillStyle = dg; x.fillRect(300, 300, 90, 140);
    px(x, 340, 300, 4, 140, "#0d1120");
    // wet asphalt
    px(x, 0, 440, LW, LH - BAR - 440, "#0b0f1d");
    const wg = x.createLinearGradient(0, 440, 0, LH - BAR);
    wg.addColorStop(0, "rgba(57,213,255,.14)"); wg.addColorStop(1, "rgba(57,213,255,0)");
    x.fillStyle = wg; x.fillRect(120, 440, 260, LH - BAR - 440);
    const og = x.createLinearGradient(0, 440, 0, LH - BAR);
    og.addColorStop(0, "rgba(255,214,140,.12)"); og.addColorStop(1, "rgba(255,214,140,0)");
    x.fillStyle = og; x.fillRect(300, 440, 90, LH - BAR - 440);
    // car + Mike walking toward it
    suv(x, 950, 452, 1.05, fel, tl > 2400);
    const mx = Math.min(330 + tl * .16, 830);
    const step = ["right0", "right1", "right0", "right2"][(tl / 170 | 0) % 4];
    mikeSprite(x, mx >= 830 ? "right0" : step, mx, 452, 92, fel);
    rain722(x, t, 90, LW, LH);
  }

  function shot2(x, t, tl, fel) { // close-up: headlights + dash wake
    px(x, 0, BAR, LW, LH - BAR * 2, "#0b0f1c");
    // ambient city glow behind the close-up
    const amb2 = x.createRadialGradient(560, 380, 40, 560, 380, 560);
    amb2.addColorStop(0, "rgba(90,110,190,.22)"); amb2.addColorStop(1, "rgba(90,110,190,0)");
    x.fillStyle = amb2; x.fillRect(0, BAR, LW, LH - BAR * 2);
    const push = 1 + tl / 2400 * .07; // slow push-in
    x.save(); x.translate(LW / 2, 470); x.scale(push, push); x.translate(-LW / 2, -470);
    suv(x, 560, 480, 2.1, fel, tl > 500);
    // dashboard glow through the glass
    if (tl > 900) {
      const a = Math.min(1, (tl - 900) / 600);
      x.save(); x.globalAlpha = a * .8;
      px(x, 410, 300, 90, 40, "rgba(57,213,255,.25)");
      txt(x, "TECHOPS", 455, 322, 13, "#39d5ff", "center", "#39d5ff");
      px(x, 424, 332, 8, 4, "#39ff88"); px(x, 436, 332, 8, 4, "#ffb347"); px(x, 448, 332, 8, 4, "#ff5c8a");
      x.restore();
    }
    // exhaust puff
    if (tl > 400 && tl < 1600) {
      x.save(); x.globalAlpha = .25 * (1 - (tl - 400) / 1200);
      x.fillStyle = "#9aa7c7";
      x.beginPath(); x.arc(340 - (tl - 400) * .05, 470 - (tl - 400) * .02, 14 + (tl - 400) * .03, 0, 7); x.fill();
      x.restore();
    }
    x.restore();
    rain722(x, t, 45, LW, LH);
  }

  function shot3(x, t, tl, fel) { // the neon drive — three-layer parallax
    const g = x.createLinearGradient(0, BAR, 0, 470);
    g.addColorStop(0, "#0b0a1c"); g.addColorStop(1, "#221a3d");
    x.fillStyle = g; x.fillRect(0, BAR, LW, LH - BAR * 2);
    // layer 1: far skyline
    for (let i = 0; i < 14; i++) {
      const bw = 110, bx = ((i * 173 - tl * .06) % (LW + 220) + LW + 220) % (LW + 220) - 110;
      const bh = 140 + (i * 61) % 170;
      px(x, bx, 470 - bh, bw, bh, "#0e1226");
      for (let w = 0; w < 16; w++) if ((i * 11 + w * 7) % 6 < 2) px(x, bx + 8 + (w % 4) * 26, 470 - bh + 12 + ((w / 4) | 0) * 30, 9, 12, NEON[(i + w) % 5] + "55");
    }
    // layer 2: mid blocks + neon signs (legible English only — mojibake cut)
    const signs = ["NEW HAVEN", "RAMEN", "24 HR", "MOTEL", "LIQUOR", "PAWN", "NOODLE BAR", "E-BIT REPAIR", "HOTEL", "DINER"];
    for (let i = 0; i < 10; i++) {
      const bw = 200, bx = ((i * 260 - tl * .22) % (LW + 400) + LW + 400) % (LW + 400) - 200;
      const bh = 180 + (i * 83) % 120;
      px(x, bx, 470 - bh, bw, bh, "#151b31");
      px(x, bx, 470 - bh, bw, 8, "#1f2742");
      neonSign(x, bx + 16, 470 - bh + 20, signs[i], NEON[i % 5], t);
      for (let w = 0; w < 8; w++) if ((i * 5 + w * 3) % 4 < 2) px(x, bx + 14 + (w % 4) * 46, 470 - bh + 84 + ((w / 4) | 0) * 40, 16, 20, "#2b3a5e");
    }
    // layer 3: road, lamps, reflections
    px(x, 0, 470, LW, LH - BAR - 470, "#0a0d18");
    px(x, 0, 470, LW, 6, "#1a2138");
    for (let i = 0; i < 8; i++) { // lamp posts sweeping past
      const lx = ((i * 320 - tl * .5) % (LW + 200) + LW + 200) % (LW + 200) - 100;
      px(x, lx, 330, 6, 140, "#10162a");
      x.save(); x.shadowColor = "#ffd68c"; x.shadowBlur = 16; px(x, lx - 6, 322, 18, 8, "#ffd68c"); x.restore();
      const lg = x.createLinearGradient(0, 470, 0, 560);
      lg.addColorStop(0, "rgba(255,214,140,.18)"); lg.addColorStop(1, "rgba(255,214,140,0)");
      x.fillStyle = lg; x.fillRect(lx - 20, 470, 60, 90);
    }
    // neon smears on the wet road
    NEON.forEach((c, i) => {
      const rx = ((i * 260 + 90 - tl * .22) % (LW + 400) + LW + 400) % (LW + 400) - 100;
      const rg = x.createLinearGradient(0, 476, 0, 590);
      rg.addColorStop(0, c + "30"); rg.addColorStop(1, c + "00");
      x.fillStyle = rg; x.fillRect(rx, 476, 70, 116);
    });
    // dashed centre line streaming by
    for (let i = 0; i < 10; i++) px(x, ((i * 160 - tl * .5) % (LW + 160) + LW + 160) % (LW + 160) - 80, 520, 60, 4, "#3d4a6e");
    suv(x, 420, 520, 1.35, fel, true);
    rain722(x, t, 70, LW, LH);
  }

  function shot4(x, t, tl, fel) { // Iron & Tide under the elevated line
    px(x, 0, BAR, LW, LH - BAR * 2, "#0a0c16");
    // storefront backdrop
    px(x, 120, 260, 700, 210, "#131829");
    px(x, 120, 250, 700, 12, "#1e2540");
    px(x, 150, 300, 240, 170, "#0d111f"); // shutter
    for (let i = 0; i < 9; i++) px(x, 150, 306 + i * 18, 240, 4, "#161d31");
    txt(x, "IRON & TIDE", 160, 282, 24, "#8fa3cc", "left", "#8fa3cc");
    txt(x, "SUPPLY CO.", 160, 306 + 0, 12, "#5a6a8f");
    px(x, 420, 310, 120, 160, "#0d111f"); txt(x, "CLOSED", 435, 326, 12, "#ff5c8a", "left", "#ff5c8a");
    px(x, 580, 330, 200, 140, "#10162a"); // dumpster zone / alley mouth
    px(x, 600, 350, 90, 60, "#1b2238");
    // elevated rail girder across the top
    px(x, 0, BAR, LW, 58, "#12141f");
    px(x, 0, BAR + 58, LW, 8, "#232a44");
    for (let i = 0; i < 24; i++) px(x, i * 56, BAR + 10, 8, 44, "#1c2238");
    for (let i = 0; i < 40; i++) { x.fillStyle = "#2c3550"; x.beginPath(); x.arc(i * 33, BAR + 52, 2.5, 0, 7); x.fill(); }
    // wet pavement
    px(x, 0, 470, LW, LH - BAR - 470, "#0b0e1a");
    const rg = x.createLinearGradient(0, 470, 0, 560);
    rg.addColorStop(0, "rgba(255,92,138,.12)"); rg.addColorStop(1, "rgba(255,92,138,0)");
    x.fillStyle = rg; x.fillRect(400, 470, 160, 90);
    suv(x, 420, 486, 1.15, fel, tl < 500);
    // Mike steps out and faces the alley
    if (tl > 600) {
      const step = ["right0", "right1", "right0", "right2"][((tl - 600) / 170 | 0) % 4];
      const mx = Math.min(560 + (tl - 600) * .12, 700);
      mikeSprite(x, mx >= 700 ? "right0" : step, mx, 486, 88, fel);
    }
    // the glitch reveals itself from the alley
    glitch(x, 1010, 500, 1.25, t, Math.min(1, Math.max(0, (tl - 1200) / 700)));
    if (tl > 1900) txt(x, "…", 940, 390, 26, "#b26bff", "center", "#b26bff");
    rain722(x, t, 80, LW, LH);
  }

  function shot5(x, t, tl, fel) { // BATTLE START slam
    px(x, 0, BAR, LW, LH - BAR * 2, "#0a0714");
    // radial purple burst
    const burst = x.createRadialGradient(LW / 2, 360, 20, LW / 2, 360, 520);
    burst.addColorStop(0, "rgba(178,107,255,.5)"); burst.addColorStop(1, "rgba(178,107,255,0)");
    x.fillStyle = burst; x.fillRect(0, BAR, LW, LH - BAR * 2);
    // the two silhouettes facing off
    mikeSprite(x, "right0", 400, 500, 150, fel);
    glitch(x, 890, 510, 2.1, t, 1);
    // zoom punch + crest + title
    const punch = tl < 260 ? 1 + (260 - tl) / 260 * .18 : 1;
    const shake = (window.V67SET && V67SET.shake) ? Math.max(0, 1 - tl / 500) : 0;
    x.save();
    x.translate(LW / 2 + (Math.random() - .5) * 8 * shake, 360 + (Math.random() - .5) * 8 * shake);
    x.scale(punch, punch); x.translate(-LW / 2, -360);
    crest(x, LW / 2, 260, 1.15, "#8a6cff");
    txt(x, "BATTLE", LW / 2, 390, 92, "#ffffff", "center", "#b26bff");
    txt(x, "START", LW / 2, 486, 92, "#b26bff", "center", "#b26bff");
    x.restore();
    if (tl < 180) { x.fillStyle = `rgba(255,255,255,${.55 * (1 - tl / 180)})`; x.fillRect(0, BAR, LW, LH - BAR * 2); }
    txt(x, "— SURVIVE THE ENCOUNTER —", LW / 2, 580, 20, "#39d5ff", "center", "#39d5ff");
  }

  const SHOT_FNS = [shot1, shot2, shot3, shot4, shot5];

  // ---------- engine ----------
  let playing = false, ov = null, cv = null, ctx = null, raf = 0, t0 = 0, after722 = null, frame722 = 0;
  const stats722 = { plays: 0, skips: 0, full: 0 };

  function buildOverlay() {
    ov = document.createElement("div");
    ov.id = "v722-cine";
    ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer";
    cv = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = LW * dpr; cv.height = LH * dpr;
    const fit = Math.min(window.innerWidth / LW, window.innerHeight / LH);
    cv.style.width = (LW * fit) + "px"; cv.style.height = (LH * fit) + "px";
    cv.style.imageRendering = "auto";
    ov.appendChild(cv);
    document.body.appendChild(ov);
    ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function shotAt(tl) {
    for (let i = 0; i < SHOTS.length - 1; i++) if (tl >= SHOTS[i] && tl < SHOTS[i + 1]) return [i, tl - SHOTS[i]];
    return [SHOT_FNS.length - 1, SHOTS[SHOTS.length - 1] - SHOTS[SHOTS.length - 2]];
  }

  const fired = {};
  function cueAudio(i) {
    if (fired[i]) return; fired[i] = true;
    if (i === 0) { startRain(); pad722(); }
    if (i === 1) engine722();
    if (i === 2) { try { sfx("portal"); } catch (e) { } }
    if (i === 3) thunder722();
    if (i === 4) { sting722(); try { sfx("stinger"); } catch (e) { } }
  }

  function draw722(now) {
    if (!playing) return;
    frame722++;
    const tl = now - t0;
    const fel = !!(S && S.meta && S.meta._char === "felicia");
    const [si, st] = shotAt(tl);
    cueAudio(si);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, LH);
    try { SHOT_FNS[si](ctx, tl, st, fel); } catch (e) { }
    grain722(ctx, LW, LH);
    // letterbox
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, BAR); ctx.fillRect(0, LH - BAR, LW, BAR);
    crest(ctx, 46, 32, .42, "#8a6cff");
    txt(ctx, "NIGHT CRAWL — AFTER THE SHIFT", LW / 2, 32, 20, "#b26bff", "center", "#b26bff");
    const caps = captions(fel);
    if (caps[si]) txt(ctx, caps[si], 30, LH - 33, 15, "#c8d4f2", "left");
    // skip hint
    if ((tl / 500 | 0) % 2 === 0) txt(ctx, "E / CLICK — SKIP ▸", LW - 24, LH - 33, 14, "#5a6a8f", "right");
    // fade in / out
    if (tl < 350) { ctx.fillStyle = `rgba(0,0,0,${1 - tl / 350})`; ctx.fillRect(0, 0, LW, LH); }
    if (tl > DUR - 450) { ctx.fillStyle = `rgba(0,0,0,${(tl - (DUR - 450)) / 450})`; ctx.fillRect(0, 0, LW, LH); }
    if (tl >= DUR) return end722(false);
    raf = requestAnimationFrame(draw722);
  }

  function end722(skipped) {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(raf);
    stopAudio722();
    window.removeEventListener("keydown", onKey722, true);
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    ov = cv = ctx = null;
    if (skipped) stats722.skips++; else stats722.full++;
    if (S) S.inDialog = false;
    const cb = after722; after722 = null;
    if (cb) cb();
  }

  function onKey722(e) {
    if (["e", "E", "Enter", " ", "Escape"].includes(e.key)) { e.stopPropagation(); e.preventDefault(); end722(true); }
    else { e.stopPropagation(); } // swallow everything else so the world stays frozen
  }

  function play722(after) {
    playing = true; after722 = after; stats722.plays++; frame722 = 0;
    Object.keys(fired).forEach(k => delete fired[k]);
    buildOverlay();
    ov.addEventListener("click", () => end722(true));
    window.addEventListener("keydown", onKey722, true);
    t0 = performance.now();
    raf = requestAnimationFrame(draw722);
  }

  // ---------- the wrap: every way into the night routes through the cut ----------
  const __origEnterNight722 = enterNight;
  enterNight = function () {
    const s = S;
    if (playing || !s || s.nightMode) return __origEnterNight722();
    s.inDialog = true; // freeze the world under the letterbox
    play722(() => { __origEnterNight722(); });
  };

  window.v722 = {
    version: VER, stats: stats722,
    active: () => playing,
    frames: () => frame722,
    skip: () => end722(true),
    DUR,
    car: suv, // v7.27: shared Charger/Impreza draw so other scenes reuse the same car
  };
  console.log(`[v7.22] Night Drive cinematic loaded (v${VER})`);
})();

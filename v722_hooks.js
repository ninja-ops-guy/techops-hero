/* v7.22.3: AFTER THE SHIFT. Three pixel-art beats using the game atlases:
   AeroTech clock-out, the established car crossing New Haven, and the
   first Night street. Existing Night entry retains world/save ownership. */
(function () {
  const VER = "7.22.3";
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
  // Use the actual game actor, never a recolored stand-in for Felicia.
  let feliciaImg = null;
  function mikeSprite(x, key, dx, dy, h, fel) {
    try {
      if (fel && !feliciaImg && typeof TO_FELICIA !== "undefined") {
        feliciaImg = new Image(); feliciaImg.src = TO_FELICIA;
      }
      const img = fel ? feliciaImg : (typeof playerImg !== "undefined" ? playerImg : null);
      const atlas = fel ? (typeof FEL_ATLAS !== "undefined" ? FEL_ATLAS : null) : PLAYER_ATLAS;
      if (!img || !img.complete || !img.naturalWidth || !atlas) return false;
      const fr = atlas.frames[key] || atlas.frames.right0 || atlas.frames.down0, C = atlas.cell;
      x.save(); x.imageSmoothingEnabled = false;
      x.drawImage(img, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
      x.restore(); return true;
    } catch (e) { return false; }
  }
  function drawNightMike(x, cx, ground, moving, now) {
    // Use the same Mike renderer as ordinary Night gameplay, not the Day atlas.
    // This pose is presentation-only; do not read or mutate the live Night world.
    const draw = window.TechOpsNightReferenceVisuals?.drawReferenceNightWalker;
    if (typeof draw !== "function") return false;
    const pose = {w:22, h:34, hp:1, face:1, vx:moving ? 1 : 0, onGround:true};
    x.save();
    try {
      x.translate(Math.round(cx), ground);
      x.scale(1.16, 1.16);
      return draw(x, pose, -pose.w / 2, -pose.h - 3, now);
    } finally { x.restore(); }
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
  function cutCar(x, X, Y, sc, fel, lightsOn) {
    const draw = window.TechOpsNightReferenceVisuals?.drawCharger;
    if (fel || typeof draw !== "function") { suv(x, X, Y, sc, fel, lightsOn); return; }
    if (lightsOn) {
      const beam = x.createLinearGradient(X + 85 * sc, Y - 32 * sc, X + 245 * sc, Y);
      beam.addColorStop(0, "rgba(255,235,180,.28)");
      beam.addColorStop(1, "rgba(255,235,180,0)");
      x.fillStyle = beam; x.beginPath();
      x.moveTo(X + 85 * sc, Y - 36 * sc); x.lineTo(X + 245 * sc, Y - 8 * sc);
      x.lineTo(X + 245 * sc, Y + 8 * sc); x.lineTo(X + 85 * sc, Y - 26 * sc); x.closePath(); x.fill();
    }
    draw(x, X, Y, 150 * sc, 0);
  }
  function glitch(x, X, Y, sc, t, reveal) {
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    x.globalAlpha = reveal * (.55 + .45 * Math.abs(Math.sin(t * .05)));
    const jit = () => t ? (Math.random() - .5) * 6 : 0;
    x.save(); x.shadowColor = "#b26bff"; x.shadowBlur = 24;
    px(x, -16 + jit(), -64, 32, 40, "#3c2a63");          // torso slab
    px(x, -12 + jit(), -84, 24, 22, "#2a1d47");          // head
    px(x, -20 + jit(), -24, 14, 24, "#31215a");
    px(x, 6 + jit(), -24, 14, 24, "#31215a");
    x.restore();
    px(x, -8, -78, 5, 5, "#ff3860"); px(x, 4, -78, 5, 5, "#ff3860"); // eyes
    for (let i = 0; i < 5; i++) px(x, -18 + (i * 17) % 36, -70 + (i * 11) % 46, 10 + i * 2, 2, "#8a6cff"); // static slices
    x.restore();
  }

  const DUR = 6800, SHORT_DUR = 1050;
  const SHOTS = [0, 2200, 4550, DUR];
  const SHOT_IDS = ["clock-out", "new-haven", "first-street"];
  const seen = new Set();
  function actorKey(state) { return state?.meta?._char === "felicia" ? "felicia" : "mike"; }
  function seenKey(actor) { return "techops_night_drive_v2_seen_" + actor; }
  function hasSeen(actor) {
    try { return seen.has(actor) || localStorage.getItem(seenKey(actor)) === "1"; }
    catch (_) { return seen.has(actor); }
  }
  function markSeen(actor) {
    seen.add(actor);
    try { localStorage.setItem(seenKey(actor), "1"); } catch (_) {}
  }
  function captions(fel) {
    return [fel ? "CLOCK-OUT / FELICIA HEADS FOR THE IMPREZA" : "CLOCK-OUT / MIKE HEADS FOR THE CHARGER",
      "NEW HAVEN / AFTER THE SHIFT", "DOWNTOWN / SOMETHING MOVES UNDER THE EL"];
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
    cutCar(x, 950, 452, 1.05, fel, tl > 1600);
    const mx = Math.min(330 + tl * .28, 830);
    const step = ["right0", "right1", "right0", "right2"][(tl / 170 | 0) % 4];
    const ready = mikeSprite(x, mx >= 830 ? "right0" : step, mx, 452, 92, fel);
    rain722(x, t, 90, LW, LH);
    return ready;
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
      neonSign(x, bx + 16, 470 - bh + 20, signs[i], NEON[i % 5], 0);
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
    // Restrained camera drift; the tracked car and its headlights stay together.
    const advance = Math.min(tl / 2350, 1);
    const xCar = 350 + 134 * advance - 18 * Math.sin(Math.PI * advance);
    cutCar(x, xCar, 520 + Math.sin(tl / 125) * 1.4, 1.35, fel, true);
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
    cutCar(x, 420, 486, 1.15, fel, tl < 500);
    // Preserve Felicia’s own look; reveal Mike in his Night Walker gear.
    let ready = true;
    if (tl > 600) {
      const step = ["right0", "right1", "right0", "right2"][((tl - 600) / 170 | 0) % 4];
      const mx = Math.min(560 + (tl - 600) * .12, 700);
      if (fel) ready = mikeSprite(x, mx >= 700 ? "right0" : step, mx, 486, 88, true);
      else ready = drawNightMike(x, mx, 486, mx < 700 && t > 0, t);
    }
    // the glitch reveals itself from the alley
    const reveal = Math.min(1, Math.max(0, (tl - 1200) / 700));
    if (reveal > 0) {
      x.save(); x.globalAlpha = reveal; x.translate(1010, 488); x.scale(1.75, 1.75);
      const drawn = typeof drawNightEnemyAtlas === "function" &&
        drawNightEnemyAtlas(x, {kind:"thug",y:-34,h:34,w:24}, -12, t, true);
      x.restore();
      if (!drawn) glitch(x,1010,488,1.1,t,reveal);
    }
    if (tl > 1900) txt(x, "…", 940, 390, 26, "#b26bff", "center", "#b26bff");
    rain722(x, t, 80, LW, LH);
    return ready;
  }

  // Composition is drawn by the engine over its own frame. The detail cut uses
  // existing scene pixels (never an alternate character or vehicle asset).
  function comicFrame(x, si, st, compact, narrow) {
    const accent = ["#edba74", "#ca9af0", "#79dbec"][si];
    const place = ["AEROTECH", "NEW HAVEN", "DOWNTOWN"][si];
    px(x, 0, 0, LW, BAR, "#10121b");
    px(x, 0, LH - BAR, LW, BAR, "#10121b");
    px(x, 0, BAR, 27, LH - 2 * BAR, "#10121b");
    px(x, LW - 27, BAR, 27, LH - 2 * BAR, "#10121b");
    x.strokeStyle = "#d6c6a8"; x.lineWidth = 3; x.strokeRect(28, BAR + 1, LW - 56, LH - 2 * BAR - 2);
    px(x, 28, 20, 44, 24, accent);
    txt(x, "0" + (si + 1), 50, 32, narrow ? 22 : 16, "#11131b", "center");
    txt(x, place, 86, 32, narrow ? 29 : 16, "#e6d8be");
    txt(x, "AFTER THE SHIFT", LW - 30, 32, narrow ? 30 : 21, "#e6d8be", "right");
    const beats = ["CLOCK OUT", "THE DRIVE", "FIRST STREET"];
    beats.forEach((label, i) => {
      const X = 28 + 412 * i;
      px(x, X, LH - 43, 400, 4, si === i ? accent : "#373843");
      txt(x, label, X + 1, LH - 22, narrow ? 26 : 17, si === i ? "#e6d8be" : "#a09b93");
    });

    // On phones the detail sits below the wide panel so the actor remains
    // legible at 320 CSS pixels. Both views sample the same rendered instant.
    const portrait = detail && !detail.hidden;
    if (!portrait && (compact || narrow || st < [850,580,950][si])) return;
    const car = 350 + 134 * Math.min(st / 2350, 1) - 18 * Math.sin(Math.PI * Math.min(st / 2350, 1));
    const dayActor = Math.min(330 + st * .28, 830);
    const nightActor = st < 600 ? 420 : Math.min(560 + (st - 600) * .12, 700);
    const source = [[dayActor-113,343,226,108],[car-204,407,408,195],[nightActor-113,387,226,108]][si];
    const scale = cv.width / LW;
    const [sx,sy,sw,sh] = source.map(value=>value*scale);
    if (portrait) {
      const pen = detail.getContext("2d");
      pen.imageSmoothingEnabled = false;
      pen.drawImage(cv,sx,sy,sw,sh,0,0,detail.width,detail.height);
      return;
    }
    const edge = 909, top = 88, width = 326, height = 174;
    px(x, edge + 8, top + 8, width, height, "#070911");
    px(x, edge, top, width, height, "#d6c6a8");
    x.save();
    x.imageSmoothingEnabled = false;
    x.drawImage(cv, sx, sy, sw, sh,
      edge + 5, top + 5, width - 10, height - 10);
    x.restore();
    px(x, edge, top, 25, 4, accent);
  }

  const SHOT_FNS = [shot1, shot3, shot4];
  let playing = false, ov = null, cv = null, ctx = null, raf = 0, t0 = 0;
  let frame722 = 0, entry = null, skipButton = null, status = null, detail = null, priorFocus = null, previousShot = -1;
  const stats722 = { plays: 0, skips: 0, full: 0, compact: 0, canceled: 0 };

  function sizeCanvas() {
    if (!cv) return;
    const width = window.visualViewport?.width || window.innerWidth;
    const height = window.visualViewport?.height || window.innerHeight;
    const portrait = width < 600 && height > width * 1.25;
    detail.hidden = !portrait;
    detail.style.display = portrait ? "block" : "none";
    const fit = Math.max(.08, Math.min(width / LW, (height - 120) / (LH + (portrait ? 520 : 0))));
    if (portrait) detail.style.width = Math.floor(LW * fit * .91) + "px";
    if (entry) entry.painted = false;
    cv.style.width = Math.floor(LW * fit) + "px";
    cv.style.height = Math.floor(LH * fit) + "px";
  }

  function buildOverlay() {
    ov = document.createElement("div");
    ov.id = "v722-cine";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "After the Shift");
    ov.dataset.nightDriveVariant = entry.variant;
    ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:#070a12;display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:monospace";
    cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = LW * dpr; cv.height = LH * dpr;
    cv.style.cssText = "min-width:0;min-height:0;flex:none;image-rendering:pixelated;display:block";
    detail = document.createElement("canvas");
    detail.setAttribute("aria-hidden","true");
    detail.width = 480; detail.height = 229;
    detail.style.cssText = "height:auto;flex:none;image-rendering:pixelated;border:2px solid #cbbda6;box-sizing:border-box;margin:3px 0 9px";
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    ov.appendChild(cv); ov.appendChild(detail);
    status = document.createElement("div");
    status.setAttribute("aria-live", "polite");
    status.style.cssText = "color:#c8d4f2;background:#111827;text-align:center;font-size:clamp(12px,2.4vw,18px);padding:8px 12px;margin:0;max-width:100%;box-sizing:border-box";
    ov.appendChild(status);
    skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.textContent = "Skip to Night";
    skipButton.id = "v722-skip";
    skipButton.style.cssText = "min-height:44px;min-width:122px;margin:6px;padding:0 14px;color:#edf1ff;background:#252142;border:1px solid #9e83ea;font:700 14px monospace;cursor:pointer";
    const owner = entry;
    skipButton.addEventListener("click", () => { if (entry === owner) end722("skip"); });
    ov.appendChild(skipButton);
    document.body.appendChild(ov);
    ctx = cv.getContext("2d");
    if (!ctx) throw new Error("Night Drive canvas unavailable");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    try { skipButton.focus({ preventScroll: true }); } catch (_) {}
  }

  function draw722(now) {
    if (!playing || !entry) return;
    if (S !== entry.state) { end722("cancel"); return; }
    const t = now - t0;
    if (t >= entry.duration) { end722("full"); return; }
    const compact = entry.variant !== "full";
    const si = entry.variant === "repeat" ? 2 : t < SHOTS[1] ? 0 : t < SHOTS[2] ? 1 : 2;
    const st = compact ? [1180, 980, 1850][si] : t - SHOTS[si];
    const fel = entry.actor === "felicia";
    try {
      if (si !== previousShot) {
        entry.painted = false;
        previousShot = si; ov.dataset.nightDriveShot = SHOT_IDS[si];
        status.textContent = captions(fel)[si];
        if (!compact && si === 0) { startRain(); pad722(); }
        if (!compact && si === 1) engine722();
      }
      // Hold one still per beat, including the drive and arrival on a first reduced-motion viewing.
      if (!compact || !entry.painted) {
        ctx.fillStyle = "#070a12"; ctx.fillRect(0, 0, LW, LH);
        const narrow = (window.visualViewport?.width || window.innerWidth) < 600;
        ctx.save();
        const ready = SHOT_FNS[si](ctx, compact ? 0 : t, st, fel);
        ctx.restore();
        // A compact still may be requested while the existing sprite is decoding.
        // Retry the same still, never draw the Day sprite as a fallback.
        const art = window.TechOpsArtHandoff;
        const carReady = fel || !art || !!art.image("charger") || t >= 310;
        if (!compact || (ready !== false && carReady)) { frame722++; entry.painted = true; }
        comicFrame(ctx, si, st, compact, narrow);
      }
    } catch (_) { end722("unavailable"); return; }
    raf = requestAnimationFrame(draw722);
  }

  function end722(reason) {
    if (!playing || !entry) return;
    const e = entry, hasSameState = S === e.state;
    playing = false; entry = null;
    cancelAnimationFrame(raf);
    stopAudio722();
    window.removeEventListener("resize", sizeCanvas);
    window.removeEventListener("keydown", onKey722, true);
    ov?.remove(); ov = cv = ctx = status = skipButton = detail = null;
    if (reason === "cancel" || !hasSameState) { stats722.canceled++; priorFocus = null; return; }
    if (reason === "skip") stats722.skips++;
    if (reason === "full" && e.variant === "full") stats722.full++;
    if (reason !== "unavailable") markSeen(e.actor);
    e.state.inDialog = false;
    const focus = priorFocus; priorFocus = null;
    if (focus?.isConnected) { try { focus.focus({ preventScroll: true }); } catch (_) {} }
    if (!e.state.nightMode) e.after();
  }

  function onKey722(e) {
    if (!playing) return;
    if (["e", "E", "Enter", " ", "Escape"].includes(e.key) && !e.repeat) {
      e.stopImmediatePropagation(); e.preventDefault(); end722("skip");
    } else {
      e.stopImmediatePropagation(); e.preventDefault();
    }
  }

  function play722(state, after) {
    const actor = actorKey(state);
    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const variant = hasSeen(actor) ? "repeat" : reduced ? "reduced" : "full";
    entry = {actor, state, after, variant, duration: variant === "repeat" ? SHORT_DUR : DUR};
    playing = true; frame722 = 0; previousShot = -1; stats722.plays++;
    if (variant !== "full") stats722.compact++;
    priorFocus = document.activeElement;
    try {
      buildOverlay();
      window.addEventListener("keydown", onKey722, true);
      t0 = performance.now(); raf = requestAnimationFrame(draw722);
    } catch (_) { end722("unavailable"); }
  }

  const __origEnterNight722 = enterNight;
  enterNight = function () {
    const s = S;
    if (!s || s.nightMode) return __origEnterNight722();
    if (playing) {
      if (entry.state === s) return; // A double activation cannot mount a second Night world.
      end722("cancel");
    }
    s.inDialog = true;
    play722(s, () => { __origEnterNight722(); });
  };

  window.v722 = {version:VER, stats:stats722, active:() => playing,
    frames:() => frame722, skip:() => end722("skip"), DUR, SHORT_DUR, car:suv};
})();

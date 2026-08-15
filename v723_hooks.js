/* ==========================================================================
   v7.23 — THE LINE GOES DARK (critical-incident cinematic)
   Major incidents used to arrive as a toast + red banner. Now the sevBanner
   choke point (anomaly trees, escalations, Friday emergencies) opens with a
   letterboxed six-shot cinematic after the CRITICAL INCIDENT reference board:
     1. The line is running — robot arms, STATUS ONLINE
     2. The system goes dark — red beacon, PRODUCTION NETWORK DOWN
     3. Operators call Mike — "MIKE! WE NEED YOU!"
     4. Tracing the fault — toner probe, green signal blips down the cable
     5. ROGUE DHCP DETECTED — device ID, IP, UNAUTHORIZED
     6. Cut → line back online → INCIDENT RESOLVED …but someone is watching
   Canon notes: Mike is drawn from the real player atlas (laptop frame
   included, bled via v7.21); the watcher is a NEW procedural silhouette,
   no Felicia sprite reuse; palette stays navy/purple/red.
   Procedural canvas + WebAudio only — zero new assets. Skippable
   (E / Enter / Space / click). Never interrupts an open dialog, battle,
   the night crawl, or the v7.22 drive cinematic. The original banner
   always fires afterwards, so no information is ever lost to a skip.
   ========================================================================== */
(function () {
  const VER = "7.23";
  if (window.v723) return;

  // ---------- audio ----------
  let AC723 = null, live723 = [];
  function ac723() {
    try {
      AC723 = AC723 || new (window.AudioContext || window.webkitAudioContext)();
      if (AC723.state === "suspended") AC723.resume();
    } catch (e) { }
    return AC723;
  }
  const vol723 = () => { try { return (window.V67SET ? V67SET.volSfx : .8); } catch (e) { return .8; } };
  function nbuf(c, sec) {
    const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function rumble723() { // factory floor loop
    const c = ac723(); if (!c) return;
    try {
      const src = c.createBufferSource(); src.buffer = nbuf(c, 2); src.loop = true;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 110;
      const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(.11 * vol723(), c.currentTime + .6);
      src.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
      live723.push(src, g);
    } catch (e) { }
  }
  function klaxon723(on) { // two-tone alarm while the line is dark
    const c = ac723(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "square";
      const t0 = c.currentTime;
      for (let i = 0; i < 8; i++) {
        o.frequency.setValueAtTime(i % 2 ? 392 : 311, t0 + i * .42);
      }
      g.gain.setValueAtTime(.028 * vol723(), t0);
      g.gain.setValueAtTime(.028 * vol723(), t0 + 3.3);
      g.gain.exponentialRampToValueAtTime(.001, t0 + 3.6);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 3.7);
    } catch (e) { }
  }
  function spark723() {
    const c = ac723(); if (!c) return;
    try {
      const src = c.createBufferSource(); src.buffer = nbuf(c, .3);
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2400;
      const g = c.createGain();
      g.gain.setValueAtTime(.13 * vol723(), c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .25);
      src.connect(hp); hp.connect(g); g.connect(c.destination); src.start();
    } catch (e) { }
  }
  function drone723() { // the watcher beat
    const c = ac723(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(65, c.currentTime);
      o.frequency.linearRampToValueAtTime(49, c.currentTime + 1.6);
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(.07 * vol723(), c.currentTime + .3);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + 1.8);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 1.9);
    } catch (e) { }
  }
  function stopAudio723() {
    const c = AC723;
    live723.forEach(n => {
      try {
        if (n.gain) { n.gain.cancelScheduledValues(c.currentTime); n.gain.linearRampToValueAtTime(0, c.currentTime + .25); }
        else setTimeout(() => { try { n.stop(); } catch (e) { } }, 300);
      } catch (e) { }
    });
    live723 = [];
  }

  // ---------- drawing helpers ----------
  const LW = 1280, LH = 720, BAR = 64;
  function rr3(x, X, Y, W, H, R) {
    x.beginPath();
    x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
    x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
  }
  function px3(x, X, Y, W, H, C) { x.fillStyle = C; x.fillRect(X | 0, Y | 0, Math.ceil(W), Math.ceil(H)); }
  function txt3(x, s, X, Y, size, C, align, glow) {
    x.save();
    x.font = `bold ${size}px "Courier New", monospace`;
    x.textAlign = align || "left"; x.textBaseline = "middle";
    if (glow) { x.shadowColor = glow; x.shadowBlur = 18; }
    x.fillStyle = C; x.fillText(s, X, Y);
    x.restore();
  }
  function grain723(x) {
    x.save(); x.globalAlpha = .05;
    for (let i = 0; i < 240; i++) px3(x, Math.random() * LW, Math.random() * LH, 2, 2, Math.random() > .5 ? "#fff" : "#000");
    x.restore();
  }
  function crest3(x, cx, cy, sc, C) {
    x.save(); x.translate(cx, cy); x.scale(sc, sc);
    x.fillStyle = C; x.shadowColor = C; x.shadowBlur = 20;
    px3(x, -4, -26, 8, 52, C);
    for (let i = 0; i < 3; i++) {
      const y = -20 + i * 14, w = 40 - i * 9;
      x.beginPath(); x.moveTo(-6, y); x.lineTo(-6 - w, y - 10); x.lineTo(-6 - w, y - 2); x.lineTo(-6, y + 8); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(6, y); x.lineTo(6 + w, y - 10); x.lineTo(6 + w, y - 2); x.lineTo(6, y + 8); x.closePath(); x.fill();
    }
    x.restore();
  }
  function mike723(x, key, dx, dy, h) {
    try {
      if (typeof playerImg === "undefined" || !playerImg.complete || !playerImg.naturalWidth) return;
      const fr = PLAYER_ATLAS.frames[key] || PLAYER_ATLAS.frames.down0, C = PLAYER_ATLAS.cell;
      x.save(); x.imageSmoothingEnabled = false;
      x.drawImage(playerImg, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
      x.restore();
    } catch (e) { }
  }
  function arm723(x, X, Y, t, phase, dead) { // jointed robot arm over a conveyor
    const a1 = dead ? .5 : Math.sin(t * .004 + phase) * .5 - .4;
    const a2 = dead ? .8 : Math.sin(t * .006 + phase * 1.7) * .7 + .6;
    x.save(); x.translate(X, Y);
    px3(x, -14, -6, 28, 12, "#2c3550"); // pedestal
    x.strokeStyle = dead ? "#3a3f4d" : "#c96b2c"; x.lineWidth = 10; x.lineCap = "round";
    const x1 = Math.cos(a1 - 1.2) * 46, y1 = Math.sin(a1 - 1.2) * 46;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(x1, y1); x.stroke();
    const x2 = x1 + Math.cos(a1 + a2 - 1.6) * 40, y2 = y1 + Math.sin(a1 + a2 - 1.6) * 40;
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
    x.fillStyle = dead ? "#3a3f4d" : "#e08a3c";
    x.beginPath(); x.arc(0, 0, 8, 0, 7); x.fill();
    x.beginPath(); x.arc(x1, y1, 7, 0, 7); x.fill();
    px3(x, x2 - 5, y2 - 3, 10, 10, dead ? "#454b5c" : "#ffd24a"); // gripper
    x.restore();
  }
  function conveyor723(x, online) {
    px3(x, 120, 470, 1040, 26, "#1a2138");
    for (let i = 0; i < 26; i++) px3(x, 128 + i * 40, 474, 20, 4, "#262f4c");
    for (let i = 0; i < 6; i++) { // boards on the belt
      const bx = 170 + i * 170;
      px3(x, bx, 448, 60, 22, online ? "#1c3a2a" : "#141a2c");
      px3(x, bx + 6, 453, 10, 6, online ? "#39ff88" : "#232c47");
      px3(x, bx + 22, 453, 6, 6, online ? "#39d5ff" : "#232c47");
      px3(x, bx + 34, 458, 16, 3, online ? "#ffd24a" : "#232c47");
    }
  }
  function statusBoard723(x, X, Y, online, t) {
    px3(x, X, Y, 170, 74, "#0d1120");
    x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(X, Y, 170, 74);
    const c = online ? "#39ff88" : "#ff3860";
    if (online || (t / 300 | 0) % 2 === 0) txt3(x, "STATUS", X + 85, Y + 22, 15, "#8fa3cc", "center");
    if (online || (t / 300 | 0) % 2 === 0) txt3(x, online ? "ONLINE" : "DOWN", X + 85, Y + 48, 22, c, "center", c);
  }
  function watcher723(x, X, Y, sc, a) { // procedural silhouette — new art, no sprite reuse
    x.save(); x.translate(X, Y); x.scale(sc, sc); x.globalAlpha = a;
    x.fillStyle = "#05070f";
    px3(x, -10, -58, 20, 34, "#05070f");                    // coat
    x.beginPath(); x.arc(0, -66, 10, 0, 7); x.fill();       // head
    px3(x, -13, -76, 8, 26, "#05070f"); px3(x, 5, -76, 8, 26, "#05070f"); // long hair fall
    px3(x, -8, -24, 7, 24, "#05070f"); px3(x, 1, -24, 7, 24, "#05070f");
    px3(x, -6, -68, 3, 3, "#39ff88"); px3(x, 3, -68, 3, 3, "#39ff88"); // eyes catch the light
    x.restore();
  }

  // ---------- the six shots ----------
  const DUR3 = 11500;
  const SHOTS3 = [0, 2200, 4000, 5800, 8000, 9600, DUR3];
  const CAPS3 = [
    "THE LINE IS RUNNING.",
    "SUDDENLY, THE SYSTEM GOES DARK.",
    "OPERATORS CALL MIKE.",
    "HE TRACES THE FAULT — AND FINDS IT.",
    "ROGUE DHCP DETECTED.",
    "HE CUTS THE CONNECTION. THE LINE COMES BACK. …BUT SOMEONE IS WATCHING.",
  ];

  function hall723(x, dark) { // shared factory backdrop
    const g = x.createLinearGradient(0, BAR, 0, LH - BAR);
    g.addColorStop(0, dark ? "#0a0710" : "#0c1122"); g.addColorStop(1, dark ? "#120a14" : "#16203a");
    x.fillStyle = g; x.fillRect(0, BAR, LW, LH - BAR * 2);
    for (let i = 0; i < 7; i++) { // ceiling trusses
      px3(x, i * 200, BAR, 12, 90, "#141a2e");
      px3(x, i * 200 - 40, BAR + 88, 92, 8, "#1a2238");
    }
    // overhead lamps
    for (let i = 0; i < 5; i++) {
      const lx = 140 + i * 250;
      if (!dark || i % 2 === 0) {
        x.save(); x.shadowColor = dark ? "#ff8a5c" : "#cfe3ff"; x.shadowBlur = 14;
        px3(x, lx, BAR + 96, 34, 6, dark ? "#ff8a5c" : "#e8f2ff"); x.restore();
        const lg = x.createLinearGradient(0, BAR + 100, 0, 470);
        lg.addColorStop(0, dark ? "rgba(255,138,92,.10)" : "rgba(200,220,255,.10)");
        lg.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = lg; x.fillRect(lx - 30, BAR + 102, 94, 368);
      }
    }
    px3(x, 0, 496, LW, LH - BAR - 496, dark ? "#0c0910" : "#101830"); // floor
    px3(x, 0, 496, LW, 5, "#1c2542");
    // caution striping along the walkway
    for (let i = 0; i < 32; i++) px3(x, i * 42, 540, 22, 6, i % 2 ? "#b98a2c" : "#141a2c");
  }

  function s1run(x, t, tl) { // the line is running
    hall723(x, false);
    conveyor723(x, true);
    arm723(x, 340, 440, t, 0); arm723(x, 640, 440, t, 2.1); arm723(x, 940, 440, t, 4.2);
    statusBoard723(x, 1050, 300, true, t);
    txt3(x, "AEROTECH MFG — LINE 3", 40, 110, 18, "#39d5ff", "left", "#39d5ff");
  }

  function s2dark(x, t, tl) { // the system goes dark
    hall723(x, true);
    conveyor723(x, false);
    arm723(x, 340, 440, t, 0, true); arm723(x, 640, 440, t, 2.1, true); arm723(x, 940, 440, t, 4.2, true);
    // spinning red beacon
    const bx = 640, by = 170, flash = (t / 240 | 0) % 2 === 0;
    px3(x, bx - 14, by - 10, 28, 20, "#3a0a12");
    x.save(); x.shadowColor = "#ff2233"; x.shadowBlur = flash ? 40 : 6;
    px3(x, bx - 9, by - 6, 18, 12, flash ? "#ff4d5e" : "#66151d"); x.restore();
    if (flash) {
      const rg = x.createRadialGradient(bx, by, 10, bx, by, 300);
      rg.addColorStop(0, "rgba(255,40,60,.28)"); rg.addColorStop(1, "rgba(255,40,60,0)");
      x.fillStyle = rg; x.fillRect(0, BAR, LW, LH - BAR * 2);
    }
    // the big board
    px3(x, 380, 230, 520, 130, "#1a0508");
    x.strokeStyle = "#ff2233"; x.lineWidth = 4; x.strokeRect(380, 230, 520, 130);
    const on = tl > 250 || (t / 300 | 0) % 2 === 0; // flash once, then hold steady
    if (on) {
      // drawn warning triangle (no emoji glyphs in the art)
      x.save();
      x.fillStyle = "#ff4d5e"; x.shadowColor = "#ff2233"; x.shadowBlur = 18;
      x.beginPath(); x.moveTo(432, 250); x.lineTo(462, 306); x.lineTo(402, 306); x.closePath(); x.fill();
      x.shadowBlur = 0; x.fillStyle = "#1a0508";
      px3(x, 429, 268, 6, 22, "#1a0508"); px3(x, 429, 295, 6, 6, "#1a0508");
      x.restore();
      txt3(x, "PRODUCTION", 690, 272, 34, "#ff6b7a", "center", "#ff2233");
      txt3(x, "NETWORK DOWN", 690, 318, 34, "#ff6b7a", "center", "#ff2233");
    }
  }

  function s3call(x, t, tl) { // operators call Mike
    hall723(x, true);
    // control desk row
    px3(x, 180, 400, 560, 70, "#1a2138");
    for (let i = 0; i < 3; i++) {
      px3(x, 210 + i * 170, 340, 120, 60, "#0d1120");
      x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(210 + i * 170, 340, 120, 60);
      const blink = (t / 260 + i) % 2 < 1;
      txt3(x, "LINK " + (i + 1), 270 + i * 170, 362, 13, blink ? "#ff6b7a" : "#66151d", "center");
      px3(x, 230 + i * 170, 378, 80, 4, blink ? "#ff6b7a" : "#2a1520");
    }
    // operators (simple seated silhouettes with headsets)
    for (let i = 0; i < 2; i++) {
      const ox = 300 + i * 200;
      x.fillStyle = "#0a0d18";
      x.beginPath(); x.arc(ox, 396, 13, 0, 7); x.fill();
      px3(x, ox - 14, 408, 28, 26, "#0a0d18");
      x.strokeStyle = "#39d5ff"; x.lineWidth = 2;
      x.beginPath(); x.arc(ox, 394, 15, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); // headset band
      px3(x, ox + 12, 398, 3, 10, "#39d5ff"); // mic boom
    }
    // Mike steps in, right side
    const mx = Math.max(1120 - tl * .1, 960);
    mike723(x, "left" in PLAYER_ATLAS.frames ? "left0" : "down0", mx, 500, 96);
    // speech bubble
    if (tl > 500) {
      x.save();
      x.fillStyle = "#f2f5ff"; rr3(x, 700, 210, 300, 84, 12); x.fill();
      x.beginPath(); x.moveTo(920, 292); x.lineTo(950, 330); x.lineTo(890, 294); x.closePath(); x.fill();
      txt3(x, "MIKE!", 850, 240, 26, "#141b2e", "center");
      txt3(x, "WE NEED YOU!", 850, 272, 20, "#141b2e", "center");
      x.restore();
    }
  }

  function s4trace(x, t, tl) { // tracing the fault at the rack
    px3(x, 0, BAR, LW, LH - BAR * 2, "#0a0e1c");
    // server rack wall
    for (let i = 0; i < 4; i++) {
      const rx2 = 700 + i * 130;
      px3(x, rx2, 180, 120, 320, "#10162a");
      x.strokeStyle = "#232c47"; x.lineWidth = 3; x.strokeRect(rx2, 180, 120, 320);
      for (let u = 0; u < 10; u++) {
        px3(x, rx2 + 10, 192 + u * 30, 100, 22, "#161d31");
        const on = (t / 200 + u * 3 + i) % 4 < 2;
        px3(x, rx2 + 16, 200 + u * 30, 5, 5, on ? "#39ff88" : "#1f5a38");
        px3(x, rx2 + 26, 200 + u * 30, 5, 5, on && u % 3 ? "#ffb347" : "#4a3a1a");
      }
    }
    // cable bundle drooping out of the rack
    x.lineCap = "round";
    const cables = ["#8a3a4a", "#3a5a8a", "#8a7a3a", "#4a3a6a"];
    cables.forEach((cc, i) => {
      x.strokeStyle = cc; x.lineWidth = 5;
      x.beginPath(); x.moveTo(730, 300 + i * 18);
      x.bezierCurveTo(620, 340 + i * 26, 560, 420 + i * 8, 470, 470 + i * 10);
      x.stroke();
    });
    // signal blips running down the traced cable
    const prog = (tl % 900) / 900;
    const bx2 = 730 + (470 - 730) * prog, by2 = (300 + 2 * 18) + ((470 + 20) - (300 + 36)) * prog + Math.sin(prog * 9) * 12;
    x.save(); x.shadowColor = "#39ff88"; x.shadowBlur = 16;
    px3(x, bx2 - 4, by2 - 4, 8, 8, "#39ff88"); x.restore();
    // Mike crouched with the probe (laptop frame doubles as kneeling tech work)
    mike723(x, "laptop", 420, 540, 110);
    px3(x, 452, 462, 26, 8, "#232c47"); // probe wand
    x.save(); x.shadowColor = "#39ff88"; x.shadowBlur = 12; px3(x, 476, 460, 6, 6, "#39ff88"); x.restore();
    txt3(x, "RACK B-7 — OT VLAN", 40, 110, 16, "#8fa3cc", "left");
  }

  function s5rogue(x, t, tl) { // ROGUE DHCP DETECTED
    px3(x, 0, BAR, LW, LH - BAR * 2, "#070a14");
    // the laptop on the crate, screen to camera
    px3(x, 340, 520, 600, 30, "#1a2138"); // crate
    const scr = { x: 390, y: 200, w: 500, h: 320 };
    px3(x, scr.x - 14, scr.y - 14, scr.w + 28, scr.h + 28, "#232c47"); // bezel
    px3(x, scr.x, scr.y, scr.w, scr.h, "#160608");
    const on = tl > 250 || (t / 280 | 0) % 2 === 0; // flash once, then hold
    if (on) {
      txt3(x, "ROGUE DHCP", scr.x + scr.w / 2, scr.y + 60, 40, "#ff4d5e", "center", "#ff2233");
      txt3(x, "DETECTED", scr.x + scr.w / 2, scr.y + 110, 40, "#ff4d5e", "center", "#ff2233");
      // skull glyph, pixel style
      const sx = scr.x + 92, sy = scr.y + 52;
      px3(x, sx, sy, 34, 26, "#ff4d5e"); px3(x, sx + 6, sy + 26, 8, 8, "#ff4d5e"); px3(x, sx + 20, sy + 26, 8, 8, "#ff4d5e");
      px3(x, sx + 6, sy + 8, 7, 7, "#160608"); px3(x, sx + 21, sy + 8, 7, 7, "#160608"); px3(x, sx + 14, sy + 17, 6, 6, "#160608");
      txt3(x, "DEVICE ID:  82:7A:AC:19:3F:2B", scr.x + 150, scr.y + 170, 17, "#c8d4f2", "left");
      txt3(x, "IP:         192.168.50.143", scr.x + 150, scr.y + 200, 17, "#c8d4f2", "left");
      txt3(x, "STATUS:", scr.x + 150, scr.y + 236, 17, "#c8d4f2", "left");
      txt3(x, "UNAUTHORIZED", scr.x + 268, scr.y + 236, 17, "#ff6b7a", "left", "#ff2233");
    }
    // small wifi-rogue box with antenna, red blink
    px3(x, 980, 470, 90, 50, "#141a2c");
    px3(x, 1030, 420, 4, 50, "#2c3550");
    const b = (t / 300 | 0) % 2 === 0;
    x.save(); x.shadowColor = "#ff3860"; x.shadowBlur = b ? 14 : 0;
    px3(x, 990, 480, 8, 8, b ? "#ff3860" : "#551520"); x.restore();
    x.strokeStyle = "#ff3860"; x.lineWidth = 2;
    if (b) for (let i = 1; i <= 3; i++) { x.beginPath(); x.arc(1032, 416, i * 9, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
    // Mike at the laptop edge
    mike723(x, "laptop", 320, 560, 120);
  }

  function s6cut(x, t, tl) { // cut → online → the watcher
    if (tl < 700) { // the cut: cable spark close-up
      px3(x, 0, BAR, LW, LH - BAR * 2, "#0a0e1c");
      x.strokeStyle = "#8a3a4a"; x.lineWidth = 9; x.lineCap = "round";
      x.beginPath(); x.moveTo(300, 420); x.lineTo(600, 420); x.stroke();
      x.beginPath(); x.moveTo(690, 420); x.lineTo(990, 420); x.stroke();
      const sp = tl < 350;
      if (sp) {
        x.save(); x.shadowColor = "#ffe9b0"; x.shadowBlur = 30;
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * 7, r = 10 + Math.random() * 50;
          px3(x, 645 + Math.cos(a) * r, 420 + Math.sin(a) * r * .6, 4, 4, i % 2 ? "#fff" : "#ffd24a");
        }
        x.restore();
      }
      mike723(x, "down0", 520, 560, 110);
      txt3(x, "CUT.", LW / 2, 200, 44, "#ffd24a", "center", "#ffd24a");
    } else { // line back online + watcher on the catwalk
      hall723(x, false);
      conveyor723(x, true);
      arm723(x, 340, 440, t, 0); arm723(x, 640, 440, t, 2.1); arm723(x, 940, 440, t, 4.2);
      statusBoard723(x, 1050, 300, true, t);
      // catwalk
      px3(x, 0, 150, LW, 10, "#1c2542");
      for (let i = 0; i < 32; i++) px3(x, i * 42, 120, 5, 30, "#161d31");
      watcher723(x, 1080, 150, 1.15, Math.min(1, (tl - 1100) / 600));
      if (tl > 1500) txt3(x, "…", 1080, 96, 24, "#39ff88", "center", "#39ff88");
      // resolved banner strip
      const ba = Math.min(1, (tl - 900) / 400);
      x.save(); x.globalAlpha = ba;
      px3(x, 300, 560, 680, 60, "#0a1f14");
      x.strokeStyle = "#39ff88"; x.lineWidth = 3; x.strokeRect(300, 560, 680, 60);
      txt3(x, "INCIDENT RESOLVED", 640, 590, 26, "#39ff88", "center", "#39ff88");
      x.restore();
      if (tl > 1700) {
        x.save(); x.globalAlpha = Math.min(1, (tl - 1700) / 300);
        px3(x, 380, 630, 520, 34, "#17102a");
        x.strokeStyle = "#8a6cff"; x.lineWidth = 2; x.strokeRect(380, 630, 520, 34);
        txt3(x, "NEW CLUE: UNKNOWN DEVICE", 640, 648, 15, "#b26bff", "center", "#8a6cff");
        x.restore();
      }
    }
  }

  const SHOT_FNS3 = [s1run, s2dark, s3call, s4trace, s5rogue, s6cut];

  // ---------- engine ----------
  const st723 = { plays: 0, skips: 0, completes: 0 };
  let ov723 = null, cx723 = null, raf723 = 0, t0 = 0, done723 = null, fired3 = [];

  function buildOverlay723() {
    const d = document.createElement("div");
    d.id = "v723-cine";
    d.style.cssText = "position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer";
    const c = document.createElement("canvas");
    c.width = LW * Math.min(2, window.devicePixelRatio || 1);
    c.height = LH * Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(innerWidth / LW, innerHeight / LH);
    c.style.width = LW * scale + "px"; c.style.height = LH * scale + "px";
    c.style.imageRendering = "pixelated";
    d.appendChild(c);
    document.body.appendChild(d);
    d.addEventListener("click", () => end723(true));
    window.addEventListener("keydown", onKey723, true);
    return { d, c };
  }

  function shotAt3(t) {
    for (let i = SHOTS3.length - 2; i >= 0; i--) if (t >= SHOTS3[i]) return i;
    return 0;
  }

  function cueAudio3(i) {
    try {
      if (i === 0) { rumble723(); }
      else if (i === 1) { klaxon723(); }
      else if (i === 3) { spark723(); }
      else if (i === 4) { drone723(); }
      else if (i === 5) { spark723(); setTimeout(() => { try { padCue723(); } catch (e) {} }, 900); }
    } catch (e) {}
  }
  function padCue723() { // relieved hum when the line comes back: reuse rumble at lower gain feel
    const a = ac723(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "triangle"; o.frequency.value = 110;
    const o2 = a.createOscillator(); o2.type = "sine"; o2.frequency.value = 165;
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(.05 * vol723(), a.currentTime + .3);
    g.gain.linearRampToValueAtTime(0, a.currentTime + 1.4);
    o.connect(g); o2.connect(g); g.connect(a.destination);
    o.start(); o2.start(); o.stop(a.currentTime + 1.5); o2.stop(a.currentTime + 1.5);
    live723.push(o, o2);
  }

  function draw723() {
    const t = performance.now() - t0;
    const si = shotAt3(t);
    while (fired3.length <= si) { fired3.push(true); cueAudio3(fired3.length - 1); }
    const x = cx723;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.fillStyle = "#000"; x.fillRect(0, 0, LW, LH);
    const tl = t - SHOTS3[si];
    SHOT_FNS3[si](x, t, tl);
    // letterbox + caption
    x.fillStyle = "#000"; x.fillRect(0, 0, LW, BAR); x.fillRect(0, LH - BAR, LW, BAR);
    const cap = CAPS3[si];
    if (cap) txt3(x, cap, LW / 2, LH - BAR / 2 + 6, 17, "#c8d4f2", "center");
    txt3(x, "TECHOPS HERO — CRITICAL INCIDENT", 24, BAR / 2 + 6, 12, "#4a5578", "left");
    txt3(x, "E / CLICK — SKIP", LW - 24, BAR / 2 + 6, 12, "#4a5578", "right");
    grain723(x, t);
    // fade in/out
    const fin = Math.min(1, t / 400), fout = Math.min(1, Math.max(0, (DUR3 - t) / 500));
    const a = 1 - Math.min(fin, fout);
    if (a > 0) { x.fillStyle = "rgba(0,0,0," + a + ")"; x.fillRect(0, 0, LW, LH); }
    if (t >= DUR3) return end723(false);
    raf723 = requestAnimationFrame(draw723);
  }

  function end723(skipped) {
    if (!ov723) return;
    cancelAnimationFrame(raf723);
    window.removeEventListener("keydown", onKey723, true);
    stopAudio723();
    ov723.d.remove();
    ov723 = null;
    if (skipped) st723.skips++; else st723.completes++;
    const cb = done723; done723 = null;
    if (cb) cb();
  }

  function onKey723(e) {
    e.stopPropagation(); e.preventDefault();
    if (["e", "E", "Enter", " ", "Escape"].includes(e.key)) end723(true);
  }

  function play723(cb) {
    if (ov723) return cb();
    st723.plays++;
    done723 = cb;
    ov723 = buildOverlay723();
    cx723 = ov723.c.getContext("2d");
    fired3 = [];
    t0 = performance.now();
    raf723 = requestAnimationFrame(draw723);
  }

  // ---------- the wrap: every critical incident becomes a cutscene ----------
  const __origSev723 = sevBanner;
  sevBanner = function (title, sub) {
    try {
      if (
        typeof S !== "undefined" && S &&
        !S.inDialog && !S.inBattle && !S.nightMode &&
        !(window.v722 && v722.active && v722.active())
      ) {
        S.inDialog = true;
        play723(() => {
          try { S.inDialog = false; } catch (e) {}
          __origSev723(title, sub);
        });
        return;
      }
    } catch (e) { window.__err723 = String(e && e.stack || e); }
    return __origSev723(title, sub);
  };

  window.v723 = {
    version: VER,
    stats: () => Object.assign({}, st723),
    active: () => !!ov723,
    skip: () => end723(true),
    DUR: DUR3,
  };
  console.log("%c[v7.23] THE LINE GOES DARK — critical-incident cinematic armed", "color:#ff4d5e");
})();

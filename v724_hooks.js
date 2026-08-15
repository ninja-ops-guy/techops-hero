/* ==========================================================================
   v7.24 — GHOST IN THE BOOT DRIVE (major-incident RESOLUTION cinematic)
   v7.23 opened critical incidents with a cutscene; this one CLOSES them.
   Choke point: checkDayEnd — on any day where the incident tree was
   cracked (s.meta.tree.cracked), the day ends with a letterboxed
   seven-shot cinematic after the GHOST IN THE BOOT DRIVE reference board:
     1. MIDNIGHT — PLATING LINE STOPS (12:00 AM, LINE STATUS STOPPED)
     2. CRASH SCREEN — BOOT FAILURE (INACCESSIBLE_BOOT_DEVICE)
     3. THE SUPERVISOR CALLS MIKE — "Every minute costs us."
     4. BIOS CHECK — WRONG SETTINGS (Legacy Only / Secure Boot Disabled)
     5. REBUILD EFI / BCD — REPAIR IN PROGRESS (checklist + progress)
     6. SECURE BOOT ENABLED — WINDOWS LOADS (the line restarts)
     7. 2:17 AM — INCIDENT CLOSED (PRODUCTION RESTORED · MTTR: 47 MIN)
   Erroneous board details edited out: garbled microtext replaced with
   clean strings, all glyphs drawn as shapes (no emoji in the art), and
   naming kept canon (AeroTech Mfg — Plant 7).
   Canon notes: Mike is drawn from the real player atlas (bled via v7.21);
   the supervisor is a NEW procedural silhouette — no Felicia sprite reuse;
   palette stays navy/purple/red with green resolve.
   Procedural canvas + WebAudio only — zero new assets. Skippable
   (E / Enter / Space / click). Plays at most once per day, never
   interrupts a dialog, battle, night crawl, or a v7.22/v7.23 cinematic,
   and the normal end-of-day flow always runs afterwards.
   ========================================================================== */
(function () {
  const VER = "7.24";
  if (window.v724) return;

  // ---------- audio ----------
  let AC724 = null, live724 = [];
  function ac724() {
    try {
      AC724 = AC724 || new (window.AudioContext || window.webkitAudioContext)();
      if (AC724.state === "suspended") AC724.resume();
    } catch (e) { }
    return AC724;
  }
  const vol724 = () => { try { return (window.V67SET ? V67SET.volSfx : .8); } catch (e) { return .8; } };
  function nbuf4(c, sec) {
    const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function hum724(dark) { // factory bed: live hum vs dead-room rumble
    const c = ac724(); if (!c) return;
    try {
      const src = c.createBufferSource(); src.buffer = nbuf4(c, 2); src.loop = true;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = dark ? 90 : 140;
      const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime((dark ? .07 : .1) * vol724(), c.currentTime + .5);
      src.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
      live724.push(src, g);
      if (!dark) {
        const o = c.createOscillator(), g2 = c.createGain();
        o.type = "sawtooth"; o.frequency.value = 60;
        g2.gain.setValueAtTime(0, c.currentTime);
        g2.gain.linearRampToValueAtTime(.02 * vol724(), c.currentTime + .5);
        o.connect(g2); g2.connect(c.destination); o.start();
        live724.push(o, g2);
      }
    } catch (e) { }
  }
  function errBeep724() { // crash-screen sting: falling square + sub drop
    const c = ac724(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime;
      o.type = "square"; o.frequency.setValueAtTime(520, t0);
      o.frequency.setValueAtTime(520, t0 + .09); o.frequency.setValueAtTime(392, t0 + .18);
      g.gain.setValueAtTime(.05 * vol724(), t0);
      g.gain.exponentialRampToValueAtTime(.001, t0 + .5);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + .5);
      const o2 = c.createOscillator(), g2 = c.createGain();
      o2.type = "sine"; o2.frequency.setValueAtTime(80, t0);
      o2.frequency.linearRampToValueAtTime(44, t0 + 1.2);
      g2.gain.setValueAtTime(0, t0); g2.gain.linearRampToValueAtTime(.07 * vol724(), t0 + .1);
      g2.gain.exponentialRampToValueAtTime(.001, t0 + 1.4);
      o2.connect(g2); g2.connect(c.destination); o2.start(t0); o2.stop(t0 + 1.5);
    } catch (e) { }
  }
  function phoneBuzz724() { // two short buzzes — the supervisor's call
    const c = ac724(); if (!c) return;
    try {
      const t0 = c.currentTime;
      for (let k = 0; k < 2; k++) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sawtooth"; o.frequency.value = 190;
        const s = t0 + k * .55;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(.045 * vol724(), s + .04);
        g.gain.setValueAtTime(.045 * vol724(), s + .3);
        g.gain.linearRampToValueAtTime(0, s + .36);
        o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + .4);
      }
    } catch (e) { }
  }
  function keyBeeps724(n, base) { // BIOS / rebuild ticks
    const c = ac724(); if (!c) return;
    try {
      const t0 = c.currentTime;
      for (let i = 0; i < n; i++) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "square"; o.frequency.value = base + (i % 3) * 60;
        const s = t0 + i * .16;
        g.gain.setValueAtTime(.02 * vol724(), s);
        g.gain.exponentialRampToValueAtTime(.001, s + .09);
        o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + .1);
      }
    } catch (e) { }
  }
  function chime724() { // secure boot + windows loads: rising major third
    const c = ac724(); if (!c) return;
    try {
      const t0 = c.currentTime, notes = [262, 330, 392, 523];
      notes.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "triangle"; o.frequency.value = f;
        const s = t0 + i * .13;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(.05 * vol724(), s + .03);
        g.gain.exponentialRampToValueAtTime(.001, s + .7);
        o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + .8);
      });
    } catch (e) { }
  }
  function padCue724() { // 2:17 AM — quiet relieved hum
    const a = ac724(); if (!a) return;
    try {
      const o = a.createOscillator(), g = a.createGain();
      o.type = "triangle"; o.frequency.value = 98;
      const o2 = a.createOscillator(); o2.type = "sine"; o2.frequency.value = 147;
      g.gain.setValueAtTime(0, a.currentTime);
      g.gain.linearRampToValueAtTime(.045 * vol724(), a.currentTime + .4);
      g.gain.linearRampToValueAtTime(0, a.currentTime + 1.8);
      o.connect(g); o2.connect(g); g.connect(a.destination);
      o.start(); o2.start(); o.stop(a.currentTime + 1.9); o2.stop(a.currentTime + 1.9);
      live724.push(o, o2);
    } catch (e) { }
  }
  function stopAudio724() {
    const c = AC724;
    live724.forEach(n => {
      try {
        if (n.gain) { n.gain.cancelScheduledValues(c.currentTime); n.gain.linearRampToValueAtTime(0, c.currentTime + .25); }
        else setTimeout(() => { try { n.stop(); } catch (e) { } }, 300);
      } catch (e) { }
    });
    live724 = [];
  }

  // ---------- drawing helpers ----------
  const LW = 1280, LH = 720, BAR = 64;
  function rr4(x, X, Y, W, H, R) {
    x.beginPath();
    x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
    x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
  }
  function px4(x, X, Y, W, H, C) { x.fillStyle = C; x.fillRect(X | 0, Y | 0, Math.ceil(W), Math.ceil(H)); }
  function txt4(x, s, X, Y, size, C, align, glow) {
    x.save();
    x.font = `bold ${size}px "Courier New", monospace`;
    x.textAlign = align || "left"; x.textBaseline = "middle";
    if (glow) { x.shadowColor = glow; x.shadowBlur = 18; }
    x.fillStyle = C; x.fillText(s, X, Y);
    x.restore();
  }
  function grain724(x) {
    x.save(); x.globalAlpha = .05;
    for (let i = 0; i < 240; i++) px4(x, Math.random() * LW, Math.random() * LH, 2, 2, Math.random() > .5 ? "#fff" : "#000");
    x.restore();
  }
  function mike724(x, key, dx, dy, h) {
    try {
      if (typeof playerImg === "undefined" || !playerImg.complete || !playerImg.naturalWidth) return;
      const fr = PLAYER_ATLAS.frames[key] || PLAYER_ATLAS.frames.down0, C = PLAYER_ATLAS.cell;
      x.save(); x.imageSmoothingEnabled = false;
      x.drawImage(playerImg, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
      x.restore();
    } catch (e) { }
  }
  function arm724(x, X, Y, t, phase, dead) { // jointed robot arm over a conveyor
    const a1 = dead ? .5 : Math.sin(t * .004 + phase) * .5 - .4;
    const a2 = dead ? .8 : Math.sin(t * .006 + phase * 1.7) * .7 + .6;
    x.save(); x.translate(X, Y);
    px4(x, -14, -6, 28, 12, "#2c3550");
    x.strokeStyle = dead ? "#3a3f4d" : "#c96b2c"; x.lineWidth = 10; x.lineCap = "round";
    const x1 = Math.cos(a1 - 1.2) * 46, y1 = Math.sin(a1 - 1.2) * 46;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(x1, y1); x.stroke();
    const x2 = x1 + Math.cos(a1 + a2 - 1.6) * 40, y2 = y1 + Math.sin(a1 + a2 - 1.6) * 40;
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
    x.fillStyle = dead ? "#3a3f4d" : "#e08a3c";
    x.beginPath(); x.arc(0, 0, 8, 0, 7); x.fill();
    x.beginPath(); x.arc(x1, y1, 7, 0, 7); x.fill();
    px4(x, x2 - 5, y2 - 3, 10, 10, dead ? "#454b5c" : "#ffd24a");
    x.restore();
  }
  function conveyor724(x, online) {
    px4(x, 120, 470, 1040, 26, "#1a2138");
    for (let i = 0; i < 26; i++) px4(x, 128 + i * 40, 474, 20, 4, "#262f4c");
    for (let i = 0; i < 6; i++) {
      const bx = 170 + i * 170;
      px4(x, bx, 448, 60, 22, online ? "#1c3a2a" : "#141a2c");
      px4(x, bx + 6, 453, 10, 6, online ? "#39ff88" : "#232c47");
      px4(x, bx + 22, 453, 6, 6, online ? "#39d5ff" : "#232c47");
      px4(x, bx + 34, 458, 16, 3, online ? "#ffd24a" : "#232c47");
    }
  }
  function hall724(x, dark) { // shared factory backdrop
    const g = x.createLinearGradient(0, BAR, 0, LH - BAR);
    g.addColorStop(0, dark ? "#0a0710" : "#0c1122"); g.addColorStop(1, dark ? "#120a14" : "#16203a");
    x.fillStyle = g; x.fillRect(0, BAR, LW, LH - BAR * 2);
    for (let i = 0; i < 7; i++) {
      px4(x, i * 200, BAR, 12, 90, "#141a2e");
      px4(x, i * 200 - 40, BAR + 88, 92, 8, "#1a2238");
    }
    for (let i = 0; i < 5; i++) {
      const lx = 140 + i * 250;
      if (!dark || i % 2 === 0) {
        x.save(); x.shadowColor = dark ? "#ff8a5c" : "#cfe3ff"; x.shadowBlur = 14;
        px4(x, lx, BAR + 96, 34, 6, dark ? "#ff8a5c" : "#e8f2ff"); x.restore();
        const lg = x.createLinearGradient(0, BAR + 100, 0, 470);
        lg.addColorStop(0, dark ? "rgba(255,138,92,.10)" : "rgba(200,220,255,.10)");
        lg.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = lg; x.fillRect(lx - 30, BAR + 102, 94, 368);
      }
    }
    px4(x, 0, 496, LW, LH - BAR - 496, dark ? "#0c0910" : "#101830");
    px4(x, 0, 496, LW, 5, "#1c2542");
    for (let i = 0; i < 32; i++) px4(x, i * 42, 540, 22, 6, i % 2 ? "#b98a2c" : "#141a2c");
  }
  function mug724(x, X, Y, label) { // the ROOT / AEROTECH mug
    px4(x, X, Y, 34, 40, "#20294a");
    px4(x, X + 34, Y + 8, 10, 22, "#20294a");
    px4(x, X + 37, Y + 12, 4, 14, "#0d1120");
    px4(x, X, Y, 34, 5, "#2c3550");
    txt4(x, label, X + 17, Y + 22, 10, "#c8d4f2", "center");
    // steam
    x.save(); x.globalAlpha = .5; x.strokeStyle = "#8fa3cc"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(X + 10, Y - 6); x.quadraticCurveTo(X + 6, Y - 14, X + 10, Y - 22); x.stroke();
    x.beginPath(); x.moveTo(X + 22, Y - 6); x.quadraticCurveTo(X + 26, Y - 14, X + 22, Y - 22); x.stroke();
    x.restore();
  }
  function clock724(x, X, Y, s, C) { // big digital clock
    px4(x, X, Y, 230, 78, "#0d1120");
    x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(X, Y, 230, 78);
    txt4(x, s, X + 115, Y + 42, 40, C, "center", C);
  }
  function check724(x, X, Y, sc, C) { // drawn check mark (no emoji)
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    x.strokeStyle = C; x.lineWidth = 5; x.lineCap = "round";
    x.shadowColor = C; x.shadowBlur = 8;
    x.beginPath(); x.moveTo(-8, 0); x.lineTo(-2, 7); x.lineTo(10, -8); x.stroke();
    x.restore();
  }
  function xMark724(x, X, Y, sc, C) { // drawn red X (no emoji)
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    x.strokeStyle = C; x.lineWidth = 5; x.lineCap = "round";
    x.shadowColor = C; x.shadowBlur = 8;
    x.beginPath(); x.moveTo(-7, -7); x.lineTo(7, 7); x.moveTo(7, -7); x.lineTo(-7, 7); x.stroke();
    x.restore();
  }
  function sup724(x, X, Y, sc, phone) { // plant supervisor — NEW procedural silhouette (cap, hi-vis vest)
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    px4(x, -12, -52, 24, 32, "#0a0d18");                       // torso
    px4(x, -12, -52, 24, 10, "#3a4a2a");                       // vest band
    px4(x, -12, -46, 5, 14, "#b98a2c"); px4(x, 7, -46, 5, 14, "#b98a2c"); // hi-vis stripes
    x.fillStyle = "#0a0d18"; x.beginPath(); x.arc(0, -62, 10, 0, 7); x.fill(); // head
    px4(x, -11, -74, 22, 6, "#1c2542");                        // cap crown
    px4(x, -11, -70, 30, 4, "#1c2542");                        // cap brim
    px4(x, -9, -20, 7, 20, "#0a0d18"); px4(x, 2, -20, 7, 20, "#0a0d18"); // legs
    if (phone) { px4(x, 8, -68, 5, 12, "#2c3550"); px4(x, 10, -58, 3, 3, "#39d5ff"); }
    x.restore();
  }

  // ---------- the seven shots ----------
  const DUR4 = 12800;
  const SHOTS4 = [0, 1900, 3700, 5400, 7200, 9000, 10800, DUR4];
  const CAPS4 = [
    "MIDNIGHT — THE PLATING LINE STOPS.",
    "CRASH SCREEN — BOOT FAILURE.",
    "THE PLANT SUPERVISOR CALLS MIKE.",
    "BIOS CHECK — THE SETTINGS ARE WRONG.",
    "HE REBUILDS THE BOOT CONFIGURATION.",
    "SECURE BOOT ON. WINDOWS LOADS. THE LINE RESTARTS.",
    "2:17 AM — INCIDENT CLOSED. PRODUCTION RESTORED.",
  ];

  function b1stops(x, t, tl) { // midnight — plating line stops
    hall724(x, true);
    conveyor724(x, false);
    arm724(x, 340, 440, t, 0, true); arm724(x, 640, 440, t, 2.1, true); arm724(x, 940, 440, t, 4.2, true);
    clock724(x, 60, 130, "12:00 AM", "#39d5ff");
    // LINE STATUS board
    px4(x, 60, 240, 230, 90, "#1a0508");
    x.strokeStyle = "#ff2233"; x.lineWidth = 3; x.strokeRect(60, 240, 230, 90);
    txt4(x, "LINE STATUS", 175, 266, 15, "#8fa3cc", "center");
    const on = tl > 250 || (t / 300 | 0) % 2 === 0;
    if (on) txt4(x, "STOPPED", 175, 302, 26, "#ff4d5e", "center", "#ff2233");
    // row of faulted terminals
    for (let i = 0; i < 4; i++) {
      const tx = 760 + i * 120;
      px4(x, tx, 330, 90, 64, "#0d1120");
      x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(tx, 330, 90, 64);
      xMark724(x, tx + 45, 362, 1.1, "#ff3860");
    }
    txt4(x, "AEROTECH MFG — PLANT 7", 1000, 110, 15, "#8fa3cc", "left");
  }

  function b2crash(x, t, tl) { // crash screen — boot failure
    px4(x, 0, BAR, LW, LH - BAR * 2, "#0a0e1c");
    // desk
    px4(x, 240, 540, 800, 26, "#1a2138");
    // monitor with the blue screen
    const scr = { x: 340, y: 150, w: 600, h: 380 };
    px4(x, scr.x - 16, scr.y - 16, scr.w + 32, scr.h + 32, "#232c47");
    px4(x, scr.x, scr.y, scr.w, scr.h, "#12347a");
    px4(x, 596, 530, 88, 12, "#232c47"); // stand
    txt4(x, ":(", scr.x + 70, scr.y + 90, 64, "#dce8ff", "left");
    txt4(x, "Your device ran into a problem and", scr.x + 60, scr.y + 190, 17, "#c8d8f8", "left");
    txt4(x, "needs to restart. We're collecting", scr.x + 60, scr.y + 216, 17, "#c8d8f8", "left");
    txt4(x, "some error info, then we'll restart.", scr.x + 60, scr.y + 242, 17, "#c8d8f8", "left");
    const on = tl > 250 || (t / 280 | 0) % 2 === 0;
    if (on) txt4(x, "INACCESSIBLE_BOOT_DEVICE", scr.x + 60, scr.y + 320, 21, "#ffffff", "left", "#9fc0ff");
    mug724(x, 990, 500, "AERO");
    // the tech's silhouette from behind, facing the screen
    x.fillStyle = "#0a0d18";
    x.beginPath(); x.arc(250, 470, 16, 0, 7); x.fill();
    px4(x, 232, 484, 36, 56, "#0a0d18");
    px4(x, 236, 474, 28, 8, "#141a2e"); // cap
  }

  function b3callsup(x, t, tl) { // the supervisor calls Mike
    px4(x, 0, BAR, LW, LH - BAR * 2, "#0b0f1e");
    // plant window behind: dark line with red glow
    px4(x, 60, 120, 540, 300, "#120a14");
    x.strokeStyle = "#2a3350"; x.lineWidth = 4; x.strokeRect(60, 120, 540, 300);
    const flash = (t / 400 | 0) % 2 === 0;
    if (flash) { x.save(); x.globalAlpha = .18; px4(x, 60, 120, 540, 300, "#ff2233"); x.restore(); }
    arm724(x, 180, 380, t, 0, true); arm724(x, 420, 380, t, 2.1, true);
    // supervisor at the window, phone up
    sup724(x, 330, 480, 1.5, true);
    // Mike on the right, phone to ear (down frame + handset)
    mike724(x, "down0", 980, 520, 130);
    px4(x, 1008, 400, 8, 20, "#2c3550");
    px4(x, 1010, 398, 5, 5, "#39d5ff");
    // AEROTECH PLANT 7 sign
    px4(x, 1080, 140, 150, 74, "#0d1120");
    x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(1080, 140, 150, 74);
    txt4(x, "AEROTECH", 1155, 166, 14, "#8fa3cc", "center");
    txt4(x, "PLANT 7", 1155, 192, 14, "#8fa3cc", "center");
    // speech bubble
    if (tl > 400) {
      x.save();
      x.fillStyle = "#f2f5ff"; rr4(x, 620, 170, 320, 92, 12); x.fill();
      x.beginPath(); x.moveTo(660, 258); x.lineTo(600, 300); x.lineTo(690, 262); x.closePath(); x.fill();
      txt4(x, "Every minute", 780, 204, 20, "#141b2e", "center");
      txt4(x, "costs us.", 780, 234, 20, "#141b2e", "center");
      x.restore();
    }
    txt4(x, "SUPERVISOR — PLATING LINE", 60, 100, 14, "#8fa3cc", "left");
  }

  function b4bios(x, t, tl) { // BIOS check — wrong settings
    px4(x, 0, BAR, LW, LH - BAR * 2, "#0a0e1c");
    const scr = { x: 330, y: 110, w: 620, h: 430 };
    px4(x, scr.x - 14, scr.y - 14, scr.w + 28, scr.h + 28, "#232c47");
    px4(x, scr.x, scr.y, scr.w, scr.h, "#101b3d");
    px4(x, scr.x, scr.y, scr.w, 40, "#1a2c5c");
    txt4(x, "BIOS SETUP UTILITY", scr.x + scr.w / 2, scr.y + 21, 18, "#dce8ff", "center");
    const rows = [
      ["Boot Mode", "Legacy Only", true],
      ["Storage Controller", "RAID Mode", false],
      ["SATA Mode", "RAID", false],
      ["Boot Option #1", "RAID: Intel RST", true],
      ["Secure Boot", "Disabled", true],
    ];
    rows.forEach((r, i) => {
      const ry = scr.y + 76 + i * 56;
      if (r[2]) px4(x, scr.x + 20, ry - 18, scr.w - 40, 38, "#182c58");
      txt4(x, r[0], scr.x + 40, ry, 17, r[2] ? "#ffd24a" : "#8fa3cc", "left");
      txt4(x, r[1], scr.x + scr.w - 40, ry, 17, r[2] ? "#ff8a96" : "#c8d4f2", "right", r[2] ? "#b3385a" : null);
      if (r[2]) xMark724(x, scr.x + 30, ry, .6, "#ff3860");
    });
    txt4(x, "Enter: Change    F10: Save & Exit", scr.x + scr.w / 2, scr.y + scr.h - 22, 13, "#5a6c9c", "center");
    // Mike at the keyboard, seen from behind
    mike724(x, "laptop", 220, 560, 120);
    mug724(x, 1010, 510, "ROOT");
  }

  function b5rebuild(x, t, tl) { // rebuild EFI / BCD — repair in progress
    px4(x, 0, BAR, LW, LH - BAR * 2, "#0a0e1c");
    const scr = { x: 330, y: 110, w: 620, h: 430 };
    px4(x, scr.x - 14, scr.y - 14, scr.w + 28, scr.h + 28, "#232c47");
    px4(x, scr.x, scr.y, scr.w, scr.h, "#0d1426");
    txt4(x, "Repairing boot configuration...", scr.x + 30, scr.y + 34, 17, "#dce8ff", "left");
    const steps = [
      "Mounting EFI System Partition",
      "Backing up BCD",
      "Rebuilding EFI files",
      "Recreating BCD store",
      "Updating boot entries",
      "Verifying integrity",
    ];
    const done = Math.min(steps.length, 1 + (tl / 300 | 0));
    steps.forEach((sname, i) => {
      const ry = scr.y + 76 + i * 42;
      txt4(x, sname, scr.x + 30, ry, 15, i < done ? "#c8d4f2" : "#4a5578", "left");
      if (i < done) {
        px4(x, scr.x + scr.w - 92, ry - 11, 66, 24, "#0a1f14");
        txt4(x, "OK", scr.x + scr.w - 59, ry + 1, 14, "#39ff88", "center", "#39ff88");
      }
    });
    // overall progress bar, easing to 86%
    const pct = Math.min(86, tl / 20);
    txt4(x, "Overall Progress:", scr.x + 30, scr.y + 356, 14, "#8fa3cc", "left");
    px4(x, scr.x + 30, scr.y + 372, scr.w - 120, 20, "#101b3d");
    px4(x, scr.x + 33, scr.y + 375, (scr.w - 126) * pct / 100, 14, "#39ff88");
    txt4(x, Math.round(pct) + "%", scr.x + scr.w - 50, scr.y + 383, 16, "#39ff88", "center", "#39ff88");
    mike724(x, "laptop", 220, 560, 120);
    mug724(x, 1010, 510, "ROOT");
  }

  function b6restart(x, t, tl) { // secure boot on → windows loads → line restarts
    if (tl < 800) { // the toggle moment: SECURITY SETTINGS screen
      px4(x, 0, BAR, LW, LH - BAR * 2, "#0a0e1c");
      const scr = { x: 390, y: 170, w: 500, h: 320 };
      px4(x, scr.x - 14, scr.y - 14, scr.w + 28, scr.h + 28, "#232c47");
      px4(x, scr.x, scr.y, scr.w, scr.h, "#101b3d");
      px4(x, scr.x, scr.y, scr.w, 36, "#1a2c5c");
      txt4(x, "SECURITY SETTINGS", scr.x + scr.w / 2, scr.y + 19, 16, "#dce8ff", "center");
      const flip = tl > 350;
      px4(x, scr.x + 24, scr.y + 62, scr.w - 48, 40, flip ? "#0a1f14" : "#182c58");
      txt4(x, "Secure Boot", scr.x + 44, scr.y + 83, 17, "#ffd24a", "left");
      txt4(x, flip ? "[ ENABLED ]" : "[ Disabled ]", scr.x + scr.w - 44, scr.y + 83, 17,
        flip ? "#39ff88" : "#ff8a96", "right", flip ? "#39ff88" : "#b3385a");
      txt4(x, "Platform Key (PK)      Loaded", scr.x + 44, scr.y + 140, 14, "#8fa3cc", "left");
      txt4(x, "Key Exchange Keys      Loaded", scr.x + 44, scr.y + 172, 14, "#8fa3cc", "left");
      txt4(x, "Authorized Signatures  Valid", scr.x + 44, scr.y + 204, 14, "#8fa3cc", "left");
      txt4(x, "F10 : Save & Exit", scr.x + scr.w / 2, scr.y + scr.h - 40, 14, "#5a6c9c", "center");
      mike724(x, "laptop", 280, 560, 120);
      mug724(x, 950, 510, "ROOT");
    } else { // machines restart — terminals flipping green one by one
      hall724(x, false);
      conveyor724(x, true);
      arm724(x, 340, 440, t, 0); arm724(x, 640, 440, t, 2.1); arm724(x, 940, 440, t, 4.2);
      const lit = Math.min(5, ((tl - 800) / 260 | 0) + 1);
      for (let i = 0; i < 5; i++) {
        const tx = 300 + i * 170;
        px4(x, tx, 300, 110, 70, "#0d1120");
        x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(tx, 300, 110, 70);
        if (i < lit) {
          px4(x, tx + 8, 308, 94, 40, "#0a1f14");
          check724(x, tx + 55, 330, 1.3, "#39ff88");
        } else {
          txt4(x, "...", tx + 55, 332, 18, "#4a5578", "center");
        }
      }
      if (lit >= 5) txt4(x, "ALL MACHINES RESTARTING", 640, 250, 18, "#39ff88", "center", "#39ff88");
    }
  }

  function b7closed(x, t, tl) { // 2:17 AM — incident closed
    hall724(x, false);
    conveyor724(x, true);
    arm724(x, 300, 440, t, 0); arm724(x, 560, 440, t, 2.1); arm724(x, 820, 440, t, 4.2);
    clock724(x, 990, 120, "02:17 AM", "#39ff88");
    // "IT GETS DONE." wall sign
    px4(x, 990, 230, 230, 90, "#0d1120");
    x.strokeStyle = "#2a3350"; x.lineWidth = 3; x.strokeRect(990, 230, 230, 90);
    txt4(x, "IT GETS", 1105, 262, 18, "#8fa3cc", "center");
    txt4(x, "DONE.", 1105, 292, 18, "#dce8ff", "center");
    // Mike off-shift: seated on a crate with the mug (party frame = the relaxed beat)
    px4(x, 180, 480, 120, 60, "#1a2138"); // crate
    mike724(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", 240, 490, 110);
    mug724(x, 330, 452, "ROOT");
    // footer strip: PRODUCTION RESTORED · MTTR
    const ba = Math.min(1, tl / 400);
    x.save(); x.globalAlpha = ba;
    px4(x, 300, 566, 680, 56, "#0a1f14");
    x.strokeStyle = "#39ff88"; x.lineWidth = 3; x.strokeRect(300, 566, 680, 56);
    check724(x, 340, 594, 1.2, "#39ff88");
    txt4(x, "PRODUCTION RESTORED", 590, 594, 24, "#39ff88", "center", "#39ff88");
    x.restore();
    if (tl > 700) {
      x.save(); x.globalAlpha = Math.min(1, (tl - 700) / 300);
      px4(x, 400, 632, 480, 34, "#17102a");
      x.strokeStyle = "#8a6cff"; x.lineWidth = 2; x.strokeRect(400, 632, 480, 34);
      txt4(x, "MTTR: 47 MIN", 640, 650, 16, "#b26bff", "center", "#8a6cff");
      x.restore();
    }
  }

  const SHOT_FNS4 = [b1stops, b2crash, b3callsup, b4bios, b5rebuild, b6restart, b7closed];

  // ---------- engine ----------
  const st724 = { plays: 0, skips: 0, completes: 0 };
  let ov724 = null, cx724 = null, raf724 = 0, t04 = 0, done724 = null, fired4 = [];

  function buildOverlay724() {
    const d = document.createElement("div");
    d.id = "v724-cine";
    d.style.cssText = "position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer";
    const c = document.createElement("canvas");
    c.width = LW * Math.min(2, window.devicePixelRatio || 1);
    c.height = LH * Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(innerWidth / LW, innerHeight / LH);
    c.style.width = LW * scale + "px"; c.style.height = LH * scale + "px";
    c.style.imageRendering = "pixelated";
    d.appendChild(c);
    document.body.appendChild(d);
    d.addEventListener("click", () => end724(true));
    window.addEventListener("keydown", onKey724, true);
    return { d, c };
  }

  function shotAt4(t) {
    for (let i = SHOTS4.length - 2; i >= 0; i--) if (t >= SHOTS4[i]) return i;
    return 0;
  }

  function cueAudio4(i) {
    try {
      if (i === 0) { hum724(true); }
      else if (i === 1) { errBeep724(); }
      else if (i === 2) { phoneBuzz724(); }
      else if (i === 3) { keyBeeps724(6, 700); }
      else if (i === 4) { keyBeeps724(9, 980); }
      else if (i === 5) { chime724(); setTimeout(() => { try { hum724(false); } catch (e) { } }, 800); }
      else if (i === 6) { padCue724(); }
    } catch (e) { }
  }

  function draw724() {
    const t = performance.now() - t04;
    const si = shotAt4(t);
    while (fired4.length <= si) { fired4.push(true); cueAudio4(fired4.length - 1); }
    const x = cx724;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.fillStyle = "#000"; x.fillRect(0, 0, LW, LH);
    const tl = t - SHOTS4[si];
    SHOT_FNS4[si](x, t, tl);
    x.fillStyle = "#000"; x.fillRect(0, 0, LW, BAR); x.fillRect(0, LH - BAR, LW, BAR);
    const cap = CAPS4[si];
    if (cap) txt4(x, cap, LW / 2, LH - BAR / 2 + 6, 17, "#c8d4f2", "center");
    txt4(x, "TECHOPS HERO — MAJOR INCIDENT", 24, BAR / 2 + 6, 12, "#4a5578", "left");
    txt4(x, "E / CLICK — SKIP", LW - 24, BAR / 2 + 6, 12, "#4a5578", "right");
    grain724(x, t);
    const fin = Math.min(1, t / 400), fout = Math.min(1, Math.max(0, (DUR4 - t) / 500));
    const a = 1 - Math.min(fin, fout);
    if (a > 0) { x.fillStyle = "rgba(0,0,0," + a + ")"; x.fillRect(0, 0, LW, LH); }
    if (t >= DUR4) return end724(false);
    raf724 = requestAnimationFrame(draw724);
  }

  function end724(skipped) {
    if (!ov724) return;
    cancelAnimationFrame(raf724);
    window.removeEventListener("keydown", onKey724, true);
    stopAudio724();
    ov724.d.remove();
    ov724 = null;
    if (skipped) st724.skips++; else st724.completes++;
    const cb = done724; done724 = null;
    if (cb) cb();
  }

  function onKey724(e) {
    e.stopPropagation(); e.preventDefault();
    if (["e", "E", "Enter", " ", "Escape"].includes(e.key)) end724(true);
  }

  function play724(cb) {
    if (ov724) return cb();
    st724.plays++;
    done724 = cb;
    ov724 = buildOverlay724();
    cx724 = ov724.c.getContext("2d");
    fired4 = [];
    t04 = performance.now();
    raf724 = requestAnimationFrame(draw724);
  }

  // ---------- the wrap: a cracked incident tree closes the day with the repair montage ----------
  const __origCDE724 = checkDayEnd;
  checkDayEnd = function (force) {
    try {
      const s = (typeof S !== "undefined") ? S : null;
      if (
        s && s.meta && s.meta.tree && s.meta.tree.cracked &&
        s.meta._v724Day !== s.day &&
        (s.ticketsDone >= s.ticketsTotal || force) &&
        !s.inDialog && !s.inBattle && !s.nightMode &&
        !(window.v722 && v722.active && v722.active()) &&
        !(window.v723 && v723.active && v723.active())
      ) {
        s.meta._v724Day = s.day;
        s.inDialog = true;
        play724(() => {
          try { s.inDialog = false; } catch (e) { }
          __origCDE724(force);
        });
        return;
      }
    } catch (e) { window.__err724 = String(e && e.stack || e); }
    return __origCDE724(force);
  };

  window.v724 = { version: VER, stats: () => Object.assign({}, st724), active: () => !!ov724, skip: () => end724(true), DUR: DUR4 };
})();

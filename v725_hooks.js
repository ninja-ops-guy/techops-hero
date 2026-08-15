/* ==========================================================================
   v7.25 — INTERACTIVE CINEMATIC PACK (four boards, player choices inside)
   One shared engine drives four letterboxed cinematics, each adapted from
   the reference boards with erroneous details edited out (clean strings,
   glyphs drawn as shapes — no emoji, canon naming):
     A. SIDE QUEST — THE COFFEE MACHINE INCIDENT (day >= 11, day-end)
        8:03 AM, ERROR 418, pick the fault to fix first (choice),
        MORALE +15, COFFEE ACCESS UNLOCKED.
     B. MENTOR QUEST — SHOW THEM HOW TO THINK (day >= 12, day-end)
        27 open incidents, OBSERVE/INVESTIGATE/HYPOTHESIZE/EXECUTE,
        "Your call." — pick the fix (choice), CONFIDENCE +10,
        MENTORSHIP COMPLETE / TEAM CAPACITY INCREASED.
     C. DAY 14 — THE BETRAYAL PROTOCOL (day >= 14, day-end)
        Central Vault, PROJECT ORPHEUS — TRANSFER STARTED,
        "What I came here to do." — STOP THE TRANSFER / FOLLOW FELICIA
        (choice, stored in S.meta._v725betrayal), ALLIANCE FRACTURED.
     D. PROJECT ORPHEUS — THE CITY BENEATH THE CITY (day-end after C)
        Subsurface Level -17, digital twin, "It rehearses it.",
        K debuts (NEW procedural sprite — beanie/headphones/shades,
        never a Felicia reuse), ORPHEUS CONTROL TRANSFERRED,
        TAKE CONTROL OF THE DIGITAL TWIN. Ending text varies with
        the Day 14 choice.
   Canon notes: Mike drawn from the real player atlas (bled via v7.21);
   Felicia drawn from her own v6.4 atlas (TO_FELICIA/FEL_ATLAS) only AS
   Felicia; the junior tech, the CIO and K are NEW procedural figures.
   Procedural canvas + WebAudio only — zero new assets. Skippable
   (E / Enter / Space / click) except while a choice is on screen.
   Plays at most one cinematic per day, never interrupts a dialog,
   battle, night crawl, or a v7.22/v7.23/v7.24 cinematic, and the
   normal end-of-day flow always runs afterwards.
   ========================================================================== */
(function () {
  const VER = "7.25";
  if (window.v725) return;

  // ---------- audio ----------
  let AC725 = null, live725 = [];
  function ac725() {
    try {
      AC725 = AC725 || new (window.AudioContext || window.webkitAudioContext)();
      if (AC725.state === "suspended") AC725.resume();
    } catch (e) { }
    return AC725;
  }
  const vol725 = () => { try { return (window.V67SET ? V67SET.volSfx : .8); } catch (e) { return .8; } };
  function tone725(f, dur, type, g0, when) {
    const ac = ac725(); if (!ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + (when || 0);
      o.type = type || "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime((g0 || .12) * vol725(), t + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .05);
      live725.push(o);
    } catch (e) { }
  }
  function beep725(n, f) { for (let i = 0; i < n; i++) tone725((f || 880) + (i % 2) * 40, .07, "square", .07, i * .09); }
  function chime725() { tone725(660, .3, "triangle", .12); tone725(880, .42, "triangle", .12, .12); tone725(1320, .5, "triangle", .1, .24); }
  function alarm725() { for (let i = 0; i < 4; i++) tone725(i % 2 ? 520 : 740, .16, "sawtooth", .06, i * .18); }
  function err725() { tone725(220, .35, "sawtooth", .1); tone725(196, .5, "sawtooth", .1, .12); }
  function steam725() { for (let i = 0; i < 8; i++) tone725(1800 + Math.random() * 900, .05, "sine", .03, i * .05); }
  function stopAudio725() { try { live725.forEach(o => { try { o.stop(); } catch (e) { } }); } catch (e) { } live725 = []; }

  // ---------- shared helpers ----------
  const LW = 1280, LH = 720, BAR = 64;
  const NAVY = "#0b0e1d", PANEL = "#141a30", EDGE = "#2a3560", CYAN = "#39d3ff",
    GREEN = "#39ff88", RED = "#ff4455", AMBER = "#ffb347", PUR = "#a06bff",
    INK = "#e8ecff", DIM = "#8b93b8", GOLD = "#ffd166";

  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function panel725(x, a, b, w, h, fill) { x.fillStyle = fill || PANEL; rr(x, a, b, w, h, 8); x.fill(); x.strokeStyle = EDGE; x.lineWidth = 2; rr(x, a, b, w, h, 8); x.stroke(); }
  function txt(x, s, a, b, size, col, align, mono) {
    x.fillStyle = col || INK; x.font = (mono ? "" : "bold ") + size + "px " + (mono ? "'Courier New',monospace" : "Verdana,sans-serif");
    x.textAlign = align || "left"; x.textBaseline = "middle"; x.fillText(s, a, b);
  }
  function check725(x, a, b, s, col) { x.strokeStyle = col || GREEN; x.lineWidth = s * .22; x.lineCap = "round"; x.beginPath(); x.moveTo(a + s * .15, b + s * .55); x.lineTo(a + s * .42, b + s * .8); x.lineTo(a + s * .9, b + s * .18); x.stroke(); }
  function xmark725(x, a, b, s, col) { x.strokeStyle = col || RED; x.lineWidth = s * .22; x.lineCap = "round"; x.beginPath(); x.moveTo(a + s * .18, b + s * .18); x.lineTo(a + s * .82, b + s * .82); x.moveTo(a + s * .82, b + s * .18); x.lineTo(a + s * .18, b + s * .82); x.stroke(); }
  function bar725(x, a, b, w, h, p, col) { x.fillStyle = "#0a0f1e"; rr(x, a, b, w, h, 4); x.fill(); x.fillStyle = col || GREEN; if (p > 0) { rr(x, a + 2, b + 2, (w - 4) * Math.min(1, p), h - 4, 3); x.fill(); } x.strokeStyle = EDGE; x.lineWidth = 1.5; rr(x, a, b, w, h, 4); x.stroke(); }
  function bg725(x, tint) { const g = x.createLinearGradient(0, BAR, 0, LH - BAR); g.addColorStop(0, tint || "#0d1126"); g.addColorStop(1, "#070a18"); x.fillStyle = g; x.fillRect(0, BAR, LW, LH - 2 * BAR); }
  function cityGlow725(x, tm, n) { for (let i = 0; i < (n || 40); i++) { const px = (i * 97) % LW, py = BAR + 40 + ((i * 61) % (LH - 2 * BAR - 120)); x.fillStyle = i % 3 ? "rgba(57,211,255,.10)" : "rgba(160,107,255,.10)"; x.fillRect(px, py, 10 + (i % 4) * 6, 14 + (i % 5) * 8); } }
  function rackRow725(x, tm, y0, n, a) {
    for (let i = 0; i < (n || 9); i++) {
      const rx = 60 + i * 130; x.fillStyle = "#10152a"; x.fillRect(rx, y0, 104, 260);
      x.strokeStyle = EDGE; x.lineWidth = 2; x.strokeRect(rx, y0, 104, 260);
      for (let j = 0; j < 6; j++) {
        const on = ((tm / 300 + i * 3 + j * 7) | 0) % 5 !== 0;
        x.fillStyle = on ? (j % 3 ? "rgba(57,255,136," + (a || .8) + ")" : "rgba(57,211,255," + (a || .8) + ")") : "#1a2140";
        x.fillRect(rx + 12, y0 + 14 + j * 38, 10, 10);
        x.fillStyle = "#1a2140"; x.fillRect(rx + 30, y0 + 16 + j * 38, 60, 6);
      }
    }
  }
  function bubble725(x, s, a, b, w) {
    const h = 46; x.fillStyle = "#f2f4ff"; rr(x, a, b, w, h, 10); x.fill();
    x.beginPath(); x.moveTo(a + 26, b + h); x.lineTo(a + 16, b + h + 14); x.lineTo(a + 46, b + h); x.closePath(); x.fill();
    x.fillStyle = "#141a30"; x.font = "bold 19px Verdana,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(s, a + w / 2, b + h / 2 + 1, w - 16);
  }

  // ---------- figures ----------
  function mike725(x, key, dx, dy, h) {
    try {
      if (typeof playerImg === "undefined" || !playerImg.complete || !playerImg.naturalWidth) throw 0;
      const fr = PLAYER_ATLAS.frames[key] || PLAYER_ATLAS.frames.down0, C = PLAYER_ATLAS.cell;
      x.imageSmoothingEnabled = false;
      x.drawImage(playerImg, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
    } catch (e) { silhouette725(x, dx, dy, h, "#2b3550"); }
  }
  let felImg725 = null;
  function felicia725(x, key, dx, dy, h, flip) {
    try {
      if (typeof TO_FELICIA === "undefined") throw 0;
      if (!felImg725) { felImg725 = new Image(); felImg725.src = TO_FELICIA; }
      if (!felImg725.complete || !felImg725.naturalWidth) throw 0;
      const fr = FEL_ATLAS.frames[key] || FEL_ATLAS.frames.down0, C = FEL_ATLAS.cell;
      x.imageSmoothingEnabled = false;
      if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(felImg725, fr[0] * C, fr[1] * C, C, C, -h / 2, dy - h, h, h); x.restore(); }
      else x.drawImage(felImg725, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
    } catch (e) { silhouette725(x, dx, dy, h, "#3a2b45"); }
  }
  function silhouette725(x, dx, dy, h, col) {
    x.fillStyle = col || "#2b3550";
    x.beginPath(); x.arc(dx, dy - h * .82, h * .16, 0, 7); x.fill();
    rr(x, dx - h * .18, dy - h * .66, h * .36, h * .66, h * .1); x.fill();
  }
  // Junior tech — NEW procedural figure (messy hair, navy hoodie, badge)
  function junior725(x, dx, dy, h, worry) {
    const u = h / 100;
    x.fillStyle = "#1c2340"; rr(x, dx - 24 * u, dy - 62 * u, 48 * u, 62 * u, 10 * u); x.fill(); // hoodie
    x.fillStyle = "#e8b98a"; x.beginPath(); x.arc(dx, dy - 74 * u, 15 * u, 0, 7); x.fill(); // face
    x.fillStyle = "#2a2019"; // messy hair spikes
    for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(dx + i * 7 * u - 5 * u, dy - 82 * u); x.lineTo(dx + i * 7 * u, dy - (96 + (i % 2) * 6) * u); x.lineTo(dx + i * 7 * u + 5 * u, dy - 82 * u); x.closePath(); x.fill(); }
    x.fillStyle = "#141a30"; x.beginPath(); x.arc(dx - 5 * u, dy - 74 * u, 2.2 * u, 0, 7); x.arc(dx + 5 * u, dy - 74 * u, 2.2 * u, 0, 7); x.fill();
    if (worry) { x.strokeStyle = "#141a30"; x.lineWidth = 2 * u; x.beginPath(); x.arc(dx, dy - 64 * u, 4 * u, .2, Math.PI - .2); x.stroke(); }
    x.fillStyle = "#c8d2f0"; x.fillRect(dx - 6 * u, dy - 50 * u, 12 * u, 16 * u); // badge
    x.strokeStyle = EDGE; x.lineWidth = 1.5 * u; x.strokeRect(dx - 6 * u, dy - 50 * u, 12 * u, 16 * u);
  }
  // K — NEW procedural figure (black beanie+pom, headphones, shades, tactical)
  function k725(x, dx, dy, h, pose) {
    const u = h / 100;
    x.fillStyle = "#14171f"; rr(x, dx - 22 * u, dy - 64 * u, 44 * u, 64 * u, 8 * u); x.fill(); // jacket
    x.fillStyle = "#0d0f14"; rr(x, dx - 22 * u, dy - 64 * u, 44 * u, 14 * u, 6 * u); x.fill(); // collar
    x.fillStyle = "#39ff88"; x.fillRect(dx - 16 * u, dy - 44 * u, 4 * u, 4 * u); x.fillRect(dx - 9 * u, dy - 44 * u, 4 * u, 4 * u); // chest LEDs
    x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx, dy - 76 * u, 14 * u, 0, 7); x.fill(); // face
    x.fillStyle = "#101318"; x.beginPath(); x.arc(dx, dy - 80 * u, 15 * u, Math.PI, 0); x.fill(); rr(x, dx - 15 * u, dy - 82 * u, 30 * u, 8 * u, 3 * u); x.fill(); // beanie
    x.beginPath(); x.arc(dx, dy - 97 * u, 5 * u, 0, 7); x.fill(); // pom
    x.strokeStyle = "#101318"; x.lineWidth = 5 * u; x.beginPath(); x.arc(dx, dy - 78 * u, 17 * u, Math.PI * 1.05, Math.PI * 1.95, true); x.stroke(); // headphone band
    x.fillStyle = "#101318"; x.beginPath(); x.arc(dx - 15 * u, dy - 76 * u, 6 * u, 0, 7); x.arc(dx + 15 * u, dy - 76 * u, 6 * u, 0, 7); x.fill(); // cans
    x.fillStyle = "#05070c"; rr(x, dx - 12 * u, dy - 79 * u, 24 * u, 7 * u, 3 * u); x.fill(); // shades
    x.fillStyle = "#39ff88"; x.fillRect(dx - 9 * u, dy - 77 * u, 5 * u, 2 * u); x.fillRect(dx + 4 * u, dy - 77 * u, 5 * u, 2 * u); // shade glint
    x.fillStyle = "#3a2417"; rr(x, dx - 6 * u, dy - 68 * u, 12 * u, 4 * u, 2 * u); x.fill(); // beard shadow
    x.fillStyle = "#0d0f14"; rr(x, dx - 26 * u, dy - 60 * u, 8 * u, 40 * u, 4 * u); x.fill(); rr(x, dx + 18 * u, dy - 60 * u, 8 * u, 40 * u, 4 * u); x.fill(); // arms
    if (pose === "fist") { x.save(); x.translate(dx + 20 * u, dy - 58 * u); x.rotate(-.7); x.fillStyle = "#0d0f14"; rr(x, -4 * u, -34 * u, 9 * u, 36 * u, 4 * u); x.fill(); x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(0, -36 * u, 6 * u, 0, 7); x.fill(); x.restore(); }
    if (pose === "deck") { x.fillStyle = "#1a2030"; rr(x, dx + 12 * u, dy - 52 * u, 22 * u, 30 * u, 3 * u); x.fill(); x.fillStyle = "#39ff88"; x.fillRect(dx + 16 * u, dy - 46 * u, 14 * u, 3 * u); x.fillRect(dx + 16 * u, dy - 39 * u, 14 * u, 3 * u); }
  }
  // CIO — NEW procedural figure (grey hair, glasses, suit)
  function cio725(x, dx, dy, h) {
    const u = h / 100;
    x.fillStyle = "#232838"; rr(x, dx - 24 * u, dy - 62 * u, 48 * u, 62 * u, 8 * u); x.fill();
    x.fillStyle = "#f2f4ff"; rr(x, dx - 6 * u, dy - 62 * u, 12 * u, 20 * u, 2 * u); x.fill();
    x.fillStyle = "#7a1f2b"; rr(x, dx - 3 * u, dy - 60 * u, 6 * u, 26 * u, 2 * u); x.fill();
    x.fillStyle = "#e8c39a"; x.beginPath(); x.arc(dx, dy - 74 * u, 14 * u, 0, 7); x.fill();
    x.fillStyle = "#b9bfce"; x.beginPath(); x.arc(dx, dy - 80 * u, 14 * u, Math.PI, 0); x.fill();
    x.strokeStyle = "#0d0f14"; x.lineWidth = 2 * u; x.strokeRect(dx - 12 * u, dy - 78 * u, 10 * u, 7 * u); x.strokeRect(dx + 2 * u, dy - 78 * u, 10 * u, 7 * u);
  }

  // ==========================================================================
  // CINEMATIC A — THE COFFEE MACHINE INCIDENT
  // ==========================================================================
  function coffeeMachine725(x, dx, dy, s, mode, tm) { // dy = base; s = scale unit
    x.fillStyle = "#232a44"; rr(x, dx - 60 * s, dy - 210 * s, 120 * s, 210 * s, 8 * s); x.fill();
    x.strokeStyle = EDGE; x.lineWidth = 2.5 * s; rr(x, dx - 60 * s, dy - 210 * s, 120 * s, 210 * s, 8 * s); x.stroke();
    x.fillStyle = "#0a0f1e"; rr(x, dx - 44 * s, dy - 196 * s, 88 * s, 56 * s, 5 * s); x.fill(); // screen
    if (mode === "err") {
      x.fillStyle = RED; x.font = "bold " + 13 * s + "px 'Courier New',monospace"; x.textAlign = "center";
      x.fillText("ERROR 418:", dx, dy - 178 * s); x.fillText("COFFEE NOT", dx, dy - 162 * s); x.fillText("FOUND", dx, dy - 148 * s);
      if (((tm / 400) | 0) % 2) { x.fillStyle = "rgba(255,68,85,.15)"; x.fillRect(dx - 44 * s, dy - 196 * s, 88 * s, 56 * s); }
    } else if (mode === "ok") {
      x.strokeStyle = GREEN; x.lineWidth = 2.5 * s; // cup glyph drawn as shapes
      x.strokeRect(dx - 14 * s, dy - 176 * s, 22 * s, 16 * s);
      x.beginPath(); x.arc(dx + 13 * s, dy - 168 * s, 6 * s, -1.2, 1.2); x.stroke();
      x.beginPath(); x.moveTo(dx - 8 * s, dy - 182 * s); x.quadraticCurveTo(dx - 4 * s, dy - 188 * s, dx - 8 * s, dy - 193 * s); x.stroke();
      x.fillStyle = GREEN; x.font = "bold " + 11 * s + "px 'Courier New',monospace"; x.textAlign = "center";
      x.fillText("READY", dx, dy - 146 * s);
    } else { x.fillStyle = "#1a2140"; x.fillRect(dx - 36 * s, dy - 188 * s, 72 * s, 40 * s); }
    x.fillStyle = "#161c34"; rr(x, dx - 40 * s, dy - 60 * s, 80 * s, 34 * s, 4 * s); x.fill(); // tray
    if (mode === "ok") { // dispensed mug
      x.fillStyle = "#3f6b4f"; rr(x, dx - 12 * s, dy - 92 * s, 24 * s, 30 * s, 3 * s); x.fill();
      x.fillStyle = INK; x.font = "bold " + 9 * s + "px 'Courier New',monospace"; x.textAlign = "center"; x.fillText("ROOT", dx, dy - 76 * s);
    }
    if (mode === "err") { // OUT OF ORDER tag
      x.save(); x.translate(dx + 44 * s, dy - 120 * s); x.rotate(.12);
      x.fillStyle = "#d8c58a"; x.fillRect(-26 * s, -14 * s, 52 * s, 28 * s);
      x.fillStyle = "#5a4a1a"; x.font = "bold " + 8 * s + "px 'Courier New',monospace"; x.textAlign = "center";
      x.fillText("OUT OF", 0, -4 * s); x.fillText("ORDER", 0, 6 * s); x.restore();
    }
  }
  const CINE_A_SHOTS = [
    {
      dur: 1900, cap: "8:03 AM — AeroTech Mfg, Plant 7. The queue forms.", draw(x, tm) {
        bg725(x); cityGlow725(x, tm, 24);
        txt(x, "8:03 AM", 70, BAR + 42, 22, CYAN, "left", true);
        coffeeMachine725(x, 1050, LH - BAR - 60, .9, "idle", tm);
        const faces = ["#2b3550", "#33284a", "#27304a", "#2b3550"];
        for (let i = 0; i < 4; i++) { silhouette725(x, 200 + i * 150, LH - BAR - 60, 120, faces[i]); txt(x, "Z", 226 + i * 150 + ((tm / 500 + i) | 0) % 3 * 4, LH - BAR - 200 - ((tm / 700 + i * 2) | 0) % 3 * 10, 16, DIM, "center", true); }
        x.fillStyle = "#3f6b4f"; rr(x, 880, LH - BAR - 220, 16, 22, 3); x.fill(); // dropped mug hint
      }
    },
    {
      dur: 2000, cap: "ERROR 418 — COFFEE NOT FOUND.", draw(x, tm) {
        bg725(x, "#140f1c"); coffeeMachine725(x, LW / 2, LH - BAR - 70, 1.7, "err", tm);
        x.fillStyle = "rgba(255,68,85,.06)"; x.fillRect(0, BAR, LW, LH - 2 * BAR);
      }
    },
    {
      dur: 2200, cap: "\"This one feels personal.\"", draw(x, tm) {
        bg725(x); rackRow725(x, tm, BAR + 90, 8, .35);
        mike725(x, "down0", 480, LH - BAR - 60, 150); felicia725(x, "down0", 800, LH - BAR - 60, 148, true);
        x.fillStyle = "#3f6b4f"; rr(x, 560, LH - BAR - 200, 20, 26, 3); x.fill();
        txt(x, "ROOT", 570, LH - BAR - 187, 8, INK, "center", true);
        bubble725(x, "This one feels personal.", 620, BAR + 110, 330);
      }
    },
    {
      dur: 2200, cap: "Panel off. CAUTION — HOT LIQUIDS.", draw(x, tm) {
        bg725(x, "#101426");
        coffeeMachine725(x, 830, LH - BAR - 60, 1.2, "idle", tm);
        x.fillStyle = "#0a0f1e"; rr(x, 700, LH - BAR - 260, 240, 180, 6); x.fill(); x.strokeStyle = RED; x.lineWidth = 2; rr(x, 700, LH - BAR - 260, 240, 180, 6); x.stroke(); // open guts
        for (let i = 0; i < 5; i++) { x.strokeStyle = i % 2 ? "#5a3b28" : "#26405a"; x.lineWidth = 6; x.beginPath(); x.moveTo(720 + i * 44, LH - BAR - 250); x.bezierCurveTo(700 + i * 50, LH - BAR - 200, 760 + i * 30, LH - BAR - 160, 720 + i * 44, LH - BAR - 100); x.stroke(); }
        mike725(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 420, LH - BAR - 60, 150);
        x.save(); x.translate(960, LH - BAR - 130); x.rotate(-.08); x.fillStyle = "#d8c58a"; x.fillRect(-56, -18, 112, 36); x.fillStyle = "#5a4a1a"; x.font = "bold 11px 'Courier New',monospace"; x.textAlign = "center"; x.fillText("CAUTION", 0, -5); x.fillText("HOT LIQUIDS", 0, 9); x.restore();
      }
    },
    {
      dur: 0, cap: "Three faults flagged. Pick one to chase first.", choice: {
        prompt: "WHICH FAULT FIRST?",
        options: ["1 — TUBE TANGLE", "2 — LOOSE SENSOR", "3 — SINGLE BEAN JAMMED"],
        store: "_v725coffeePick"
      }, draw(x, tm) {
        bg725(x, "#101426");
        x.fillStyle = "#0a0f1e"; rr(x, 240, BAR + 80, 800, 300, 10); x.fill(); x.strokeStyle = EDGE; x.lineWidth = 2.5; rr(x, 240, BAR + 80, 800, 300, 10); x.stroke();
        const tags = [["TUBE TANGLE", 340, 170, AMBER], ["LOOSE SENSOR", 640, 150, RED], ["SINGLE BEAN", 800, 260, GREEN], ["JAMMED", 800, 285, GREEN]];
        x.strokeStyle = "#5a3b28"; x.lineWidth = 10;
        x.beginPath(); x.moveTo(320, 330); x.bezierCurveTo(420, 180, 520, 340, 620, 220); x.stroke();
        x.beginPath(); x.moveTo(620, 220); x.bezierCurveTo(720, 320, 820, 200, 940, 300); x.stroke();
        x.fillStyle = "#26405a"; x.fillRect(600, 140, 90, 60); x.strokeStyle = EDGE; x.lineWidth = 2; x.strokeRect(600, 140, 90, 60);
        x.fillStyle = "#6b4a2a"; x.beginPath(); x.arc(830, 290, 14, 0, 7); x.fill();
        tags.forEach(tg => { x.fillStyle = "#d8c58a"; x.fillRect(tg[1] - 62, tg[2] - 14, 124, 26); x.fillStyle = "#3a2f10"; x.font = "bold 12px 'Courier New',monospace"; x.textAlign = "center"; x.fillText(tg[0], tg[1], tg[2]); });
        txt(x, "FAULT MAP — UNIT 03", 270, BAR + 110, 16, CYAN, "left", true);
      }
    },
    {
      dur: 2000, cap: "Steam clears. The floor holds its breath.", draw(x, tm) {
        bg725(x); coffeeMachine725(x, LW / 2, LH - BAR - 70, 1.5, "err", tm);
        for (let i = 0; i < 7; i++) { const sy = LH - BAR - 240 - ((tm / 6 + i * 60) % 220); x.fillStyle = "rgba(200,210,240," + (0.28 - i * .03) + ")"; x.beginPath(); x.arc(LW / 2 - 60 + (i * 37) % 120, sy, 16 + (i % 3) * 8, 0, 7); x.fill(); }
        const faces = ["#2b3550", "#33284a", "#27304a"];
        for (let i = 0; i < 3; i++) silhouette725(x, 160 + i * 110, LH - BAR - 60, 110, faces[i]);
      }
    },
    {
      dur: 2200, cap: "CRITICAL SERVICE RESTORED.", draw(x, tm) {
        bg725(x, "#0e1a14"); coffeeMachine725(x, LW / 2, LH - BAR - 70, 1.6, "ok", tm);
        for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, r = 150 + ((tm / 9 + i * 20) % 60); x.fillStyle = i % 2 ? GREEN : GOLD; x.fillRect(LW / 2 + Math.cos(a) * r, LH - BAR - 190 + Math.sin(a) * r * .5, 4, 4); }
      }
    },
    {
      dur: 2600, cap: "MORALE +15 — COFFEE ACCESS UNLOCKED.", draw(x, tm) {
        bg725(x); cityGlow725(x, tm, 18);
        mike725(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", 500, LH - BAR - 60, 155);
        felicia725(x, "down0", 700, LH - BAR - 60, 150, false);
        junior725(x, 280, LH - BAR - 60, 130, false); cio725(x, 1010, LH - BAR - 60, 150);
        x.fillStyle = "#3f6b4f"; rr(x, 560, LH - BAR - 210, 22, 28, 3); x.fill(); txt(x, "ROOT", 571, LH - BAR - 196, 9, INK, "center", true);
        bubble725(x, "Critical service restored.", 760, BAR + 100, 330);
        panel725(x, LW / 2 - 320, LH - BAR - 74, 300, 46, "#0d1f16"); txt(x, "MORALE +15", LW / 2 - 170, LH - BAR - 51, 20, GREEN, "center", true);
        panel725(x, LW / 2 + 20, LH - BAR - 74, 320, 46, "#0d1f16"); txt(x, "COFFEE ACCESS UNLOCKED", LW / 2 + 180, LH - BAR - 51, 15, GREEN, "center", true);
      }
    }
  ];

  // ==========================================================================
  // CINEMATIC B — MENTOR QUEST: SHOW THEM HOW TO THINK
  // ==========================================================================
  const CINE_B_SHOTS = [
    {
      dur: 2200, cap: "TICKET QUEUE — 27 OPEN INCIDENTS.", draw(x, tm) {
        bg725(x); cityGlow725(x, tm, 20);
        junior725(x, 320, LH - BAR - 60, 150, true);
        panel725(x, 560, BAR + 70, 520, 400);
        txt(x, "TICKET QUEUE", 600, BAR + 110, 18, INK, "left", true);
        txt(x, "OPEN INCIDENTS", 600, BAR + 150, 16, RED, "left", true);
        txt(x, "27", 1010, BAR + 150, 42, RED, "right", true);
        const q = ["PRINTER OFFLINE", "VPN DISCONNECTED", "EMAIL DELAY", "ACCESS DENIED", "SERVER SLOW"];
        q.forEach((s, i) => {
          x.strokeStyle = EDGE; x.lineWidth = 2; x.strokeRect(604, BAR + 184 + i * 44, 18, 18);
          txt(x, s, 640, BAR + 194 + i * 44, 15, DIM, "left", true);
        });
        txt(x, "...AND 22 MORE", 600, BAR + 436, 14, DIM, "left", true);
      }
    },
    {
      dur: 2000, cap: "\"Which one do I fix first?\"", draw(x, tm) {
        bg725(x); rackRow725(x, tm, BAR + 100, 8, .3);
        junior725(x, 420, LH - BAR - 60, 150, true); mike725(x, "down0", 800, LH - BAR - 60, 160);
        bubble725(x, "Which one do I fix first?", 300, BAR + 110, 340);
      }
    },
    {
      dur: 2600, cap: "Show them how to think — not what to fix.", draw(x, tm) {
        bg725(x, "#0e1226");
        panel725(x, 240, BAR + 80, 560, 380);
        const steps = [["OBSERVE", CYAN], ["INVESTIGATE", DIM], ["HYPOTHESIZE", AMBER], ["EXECUTE", GREEN]];
        steps.forEach((s, i) => {
          const by = BAR + 130 + i * 82;
          x.strokeStyle = s[1]; x.lineWidth = 3; x.beginPath(); x.arc(310, by, 16, 0, 7); x.stroke();
          if (i === 0) { x.fillStyle = s[1]; x.beginPath(); x.arc(310, by, 6, 0, 7); x.fill(); }
          if (i === 1) { x.beginPath(); x.moveTo(320, by + 10); x.lineTo(334, by + 24); x.stroke(); }
          if (i === 2) { x.fillStyle = s[1]; x.beginPath(); x.moveTo(310, by - 8); x.lineTo(318, by + 4); x.lineTo(302, by + 4); x.closePath(); x.fill(); }
          if (i === 3) { x.fillStyle = s[1]; x.fillRect(304, by - 8, 12, 16); }
          txt(x, s[0], 360, by, 22, INK, "left", true);
        });
        mike725(x, "down0", 1020, LH - BAR - 60, 165);
        x.strokeStyle = AMBER; x.lineWidth = 4; x.beginPath(); x.moveTo(950, LH - BAR - 190); x.lineTo(830, BAR + 200); x.stroke(); // pointer stick
      }
    },
    {
      dur: 2000, cap: "PRINTER-07 — STATUS: OFFLINE.", draw(x, tm) {
        bg725(x);
        x.fillStyle = "#2a3048"; rr(x, 780, LH - BAR - 260, 260, 200, 8); x.fill(); x.strokeStyle = EDGE; x.lineWidth = 2.5; rr(x, 780, LH - BAR - 260, 260, 200, 8); x.stroke();
        x.fillStyle = "#1c2238"; rr(x, 800, LH - BAR - 180, 220, 60, 5); x.fill();
        x.fillStyle = RED; x.beginPath(); x.arc(1020, LH - BAR - 240, 6, 0, 7); x.fill();
        panel725(x, 300, BAR + 110, 340, 90); txt(x, "PRINTER-07", 330, BAR + 148, 20, INK, "left", true);
        txt(x, "STATUS: OFFLINE", 330, BAR + 178, 16, RED, "left", true);
        junior725(x, 480, LH - BAR - 60, 150, false); mike725(x, "down0", 620, LH - BAR - 60, 155);
      }
    },
    {
      dur: 0, cap: "The cable's fine. The port isn't. Your call.", choice: {
        prompt: "SWITCH PORT 12 — STATUS: DISABLED · LINK: DOWN",
        options: ["1 — RE-ENABLE PORT 12", "2 — REPLACE THE CABLE", "3 — REBOOT THE SWITCH"],
        store: "_v725mentorPick", correct: 0
      }, draw(x, tm) {
        bg725(x, "#0e1226");
        junior725(x, 300, LH - BAR - 60, 150, false);
        x.strokeStyle = CYAN; x.lineWidth = 5; x.beginPath(); x.moveTo(360, LH - BAR - 130); x.bezierCurveTo(500, LH - BAR - 200, 600, LH - BAR - 120, 760, LH - BAR - 180); x.stroke();
        panel725(x, 760, BAR + 100, 380, 220);
        txt(x, "SWITCH PORT 12", 790, BAR + 140, 17, INK, "left", true);
        txt(x, "STATUS: DISABLED", 790, BAR + 172, 15, RED, "left", true);
        txt(x, "LINK: DOWN", 790, BAR + 200, 15, RED, "left", true);
        for (let i = 0; i < 5; i++) {
          x.fillStyle = "#0a0f1e"; x.fillRect(790 + i * 66, BAR + 228, 54, 40);
          x.strokeStyle = i === 3 ? RED : EDGE; x.lineWidth = 2; x.strokeRect(790 + i * 66, BAR + 228, 54, 40);
          txt(x, String(9 + i), 817 + i * 66, BAR + 288, 12, DIM, "center", true);
        }
        xmark725(x, 800 + 3 * 66 + 14, BAR + 236, 24, RED);
      }
    },
    {
      dur: 2200, cap: "Port enabled. LINK: UP. PRINTER-07: ONLINE.", draw(x, tm) {
        bg725(x, "#0e1a14");
        panel725(x, 220, BAR + 110, 380, 190);
        txt(x, "SWITCH PORT 12", 250, BAR + 148, 17, INK, "left", true);
        txt(x, "STATUS: ENABLED", 250, BAR + 180, 15, GREEN, "left", true);
        txt(x, "LINK: UP", 250, BAR + 208, 15, GREEN, "left", true);
        for (let i = 0; i < 5; i++) { x.fillStyle = "#0a0f1e"; x.fillRect(250 + i * 62, BAR + 232, 50, 36); x.strokeStyle = i === 3 ? GREEN : EDGE; x.lineWidth = 2; x.strokeRect(250 + i * 62, BAR + 232, 50, 36); }
        check725(x, 262 + 3 * 62 + 8, BAR + 238, 26, GREEN);
        x.fillStyle = "#2a3048"; rr(x, 720, LH - BAR - 240, 240, 180, 8); x.fill(); x.strokeStyle = EDGE; x.lineWidth = 2.5; rr(x, 720, LH - BAR - 240, 240, 180, 8); x.stroke();
        x.fillStyle = GREEN; x.beginPath(); x.arc(940, LH - BAR - 222, 6, 0, 7); x.fill();
        panel725(x, 660, BAR + 110, 300, 80, "#0d1f16"); txt(x, "PRINTER-07", 690, BAR + 144, 18, INK, "left", true); txt(x, "STATUS: ONLINE", 690, BAR + 172, 15, GREEN, "left", true);
        junior725(x, 480, LH - BAR - 60, 150, false);
      }
    },
    {
      dur: 2600, cap: "CONFIDENCE +10 — MENTORSHIP COMPLETE.", draw(x, tm) {
        bg725(x); cityGlow725(x, tm, 16);
        felicia725(x, "down0", 320, LH - BAR - 60, 148, false);
        check725(x, 380, BAR + 120, 30, GREEN); // approval glyph as shape
        junior725(x, 560, LH - BAR - 60, 155, false); mike725(x, "down0", 860, LH - BAR - 60, 160);
        panel725(x, LW / 2 - 210, BAR + 90, 420, 130, "#17133a");
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; x.fillStyle = PUR; x.fillRect(LW / 2 + Math.cos(a) * (120 + (i % 3) * 14), BAR + 155 + Math.sin(a) * 60, 4, 4); }
        txt(x, "CONFIDENCE", LW / 2, BAR + 140, 20, PUR, "center", true);
        txt(x, "+10", LW / 2, BAR + 182, 34, GREEN, "center", true);
        panel725(x, LW / 2 - 330, LH - BAR - 74, 300, 46, "#0d1f16"); txt(x, "MENTORSHIP COMPLETE", LW / 2 - 180, LH - BAR - 51, 15, GOLD, "center", true);
        panel725(x, LW / 2 + 30, LH - BAR - 74, 320, 46, "#0d1f16"); txt(x, "TEAM CAPACITY INCREASED", LW / 2 + 190, LH - BAR - 51, 14, GREEN, "center", true);
      }
    }
  ];

  // ==========================================================================
  // CINEMATIC C — DAY 14: THE BETRAYAL PROTOCOL
  // ==========================================================================
  function vault725(x, tm, open) {
    const cx = LW / 2, cy = BAR + 250, R = 150;
    x.fillStyle = "#131a33"; x.beginPath(); x.arc(cx, cy, R + 40, 0, 7); x.fill();
    x.strokeStyle = EDGE; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, R + 40, 0, 7); x.stroke();
    x.fillStyle = "#1b2342"; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
    x.strokeStyle = PUR; x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, R - 14, 0, 7); x.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + (open ? tm / 900 : 0); x.fillStyle = PUR; x.beginPath(); x.arc(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40), 7, 0, 7); x.fill(); }
    x.fillStyle = "#0a0f1e"; x.beginPath(); x.arc(cx, cy, 46, 0, 7); x.fill();
    x.strokeStyle = open ? GREEN : RED; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 46, 0, 7); x.stroke();
  }
  const CINE_C_SHOTS = [
    {
      dur: 2200, cap: "AEROTECH DATA CENTER — LEVEL 7.", draw(x, tm) {
        bg725(x); rackRow725(x, tm, BAR + 70, 9, .8);
        txt(x, "AEROTECH", LW / 2, BAR + 60, 22, DIM, "center", true);
        txt(x, "DATA CENTER — LEVEL 7", LW / 2, BAR + 88, 15, DIM, "center", true);
        mike725(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 480, LH - BAR - 50, 140);
        felicia725(x, "down0", 720, LH - BAR - 50, 138, false);
        x.fillStyle = "rgba(160,107,255,.05)"; x.fillRect(0, BAR, LW, LH - 2 * BAR);
      }
    },
    {
      dur: 2200, cap: "CENTRAL VAULT — VAULT ACCESS: UNLOCKING...", draw(x, tm) {
        bg725(x, "#0d1024"); vault725(x, tm, false);
        txt(x, "CENTRAL VAULT", LW / 2, BAR + 60, 20, PUR, "center", true);
        mike725(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 350, LH - BAR - 50, 140);
        panel725(x, 850, BAR + 160, 300, 120);
        txt(x, "VAULT ACCESS", 880, BAR + 196, 16, INK, "left", true);
        txt(x, "UNLOCKING" + ".".repeat(1 + ((tm / 400) | 0) % 3), 880, BAR + 228, 15, CYAN, "left", true);
        bar725(x, 880, BAR + 248, 240, 14, (tm % 2200) / 2200, CYAN);
      }
    },
    {
      dur: 1800, cap: "Felicia palmed something into the port.", draw(x, tm) {
        bg725(x, "#0d1024"); rackRow725(x, tm, BAR + 70, 9, .4);
        felicia725(x, "down0", 560, LH - BAR - 50, 155, false);
        mike725(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 780, LH - BAR - 50, 150);
        x.fillStyle = PUR; rr(x, 640, LH - BAR - 150, 26, 12, 3); x.fill(); // the drive
        x.fillStyle = "rgba(160,107,255,.5)"; rr(x, 640, LH - BAR - 150, 26, 12, 3); x.stroke();
      }
    },
    {
      dur: 2400, cap: "PROJECT ORPHEUS — TRANSFER STARTED.", draw(x, tm) {
        bg725(x, "#0a140f");
        panel725(x, LW / 2 - 360, BAR + 90, 720, 320, "#0a140f");
        x.strokeStyle = GREEN; x.lineWidth = 3;
        txt(x, "PROJECT ORPHEUS —", LW / 2, BAR + 150, 26, GREEN, "center", true);
        txt(x, "TRANSFER STARTED", LW / 2, BAR + 190, 26, GREEN, "center", true);
        // geometric node glyph (shape, not emoji)
        x.beginPath(); x.arc(LW / 2 - 160, BAR + 268, 30, 0, 7); x.stroke();
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; x.beginPath(); x.moveTo(LW / 2 - 160, BAR + 268); x.lineTo(LW / 2 - 160 + Math.cos(a) * 30, BAR + 268 + Math.sin(a) * 30); x.stroke(); }
        txt(x, ">>>", LW / 2, BAR + 268, 30, GREEN, "center", true);
        // wing sigil as shapes
        x.save(); x.translate(LW / 2 + 170, BAR + 268); x.strokeStyle = GREEN; x.lineWidth = 3;
        x.beginPath(); x.moveTo(0, -30); x.lineTo(0, 30); x.stroke();
        for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(0, -20 + i * 16); x.lineTo(-34 - i * 6, -34 + i * 18); x.stroke(); x.beginPath(); x.moveTo(0, -20 + i * 16); x.lineTo(34 + i * 6, -34 + i * 18); x.stroke(); }
        x.restore();
        bar725(x, LW / 2 - 260, BAR + 340, 520, 20, .15 + (tm % 2400) / 2400 * .5, GREEN);
      }
    },
    {
      dur: 2400, cap: "\"Felicia... what did you do?\"", draw(x, tm) {
        bg725(x, "#120f1e"); rackRow725(x, tm, BAR + 70, 9, .25);
        mike725(x, "down0", 460, LH - BAR - 50, 160); felicia725(x, "up0", 780, LH - BAR - 50, 155, false);
        bubble725(x, "Felicia... what did you do?", 300, BAR + 100, 360);
        x.fillStyle = "rgba(255,68,85,.05)"; x.fillRect(0, BAR, LW, LH - 2 * BAR);
      }
    },
    {
      dur: 2400, cap: "\"What I came here to do.\"", draw(x, tm) {
        bg725(x, "#120f1e");
        felicia725(x, "down0", LW / 2, LH - BAR - 40, 260, false);
        bubble725(x, "What I came here to do.", LW / 2 + 170, BAR + 140, 330);
      }
    },
    {
      dur: 2200, cap: "The blast door sealed behind her. ALERT.", draw(x, tm) {
        bg725(x, "#161022");
        x.fillStyle = "#1b2342"; rr(x, LW / 2 - 140, BAR + 80, 280, 380, 8); x.fill();
        x.strokeStyle = AMBER; x.lineWidth = 8;
        for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(LW / 2 - 140 + i * 72, BAR + 80); x.lineTo(LW / 2 - 96 + i * 72, BAR + 460); x.stroke(); }
        mike725(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", LW / 2 - 320, LH - BAR - 50, 150);
        if (((tm / 300) | 0) % 2) { x.fillStyle = "rgba(255,68,85,.12)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); }
        panel725(x, 90, BAR + 90, 200, 60, "#2a0d14"); txt(x, "! ALERT", 190, BAR + 120, 20, RED, "center", true);
      }
    },
    {
      dur: 2400, cap: "On the glass, one last message: \"Trust me.\"", draw(x, tm) {
        bg725(x, "#0d1024");
        x.fillStyle = "#10152a"; rr(x, LW / 2 - 300, BAR + 70, 600, 380, 10); x.fill();
        x.strokeStyle = RED; x.lineWidth = 3; rr(x, LW / 2 - 300, BAR + 70, 600, 380, 10); x.stroke();
        x.strokeStyle = "rgba(160,107,255,.3)"; x.lineWidth = 1;
        for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(LW / 2 - 300 + i * 86, BAR + 70); x.lineTo(LW / 2 - 300 + i * 86, BAR + 450); x.stroke(); }
        felicia725(x, "down0", LW / 2, BAR + 430, 190, false);
        bubble725(x, "Trust me.", LW / 2 - 80, BAR + 100, 170);
        panel725(x, 90, BAR + 90, 200, 60, "#2a0d14"); txt(x, "! ALERT", 190, BAR + 120, 20, RED, "center", true);
      }
    },
    {
      dur: 0, cap: "SYSTEM MESSAGE — your move.", choice: {
        prompt: "SYSTEM MESSAGE",
        options: ["1 — STOP THE TRANSFER", "2 — FOLLOW FELICIA"],
        store: "_v725betrayal", values: ["stop", "follow"]
      }, draw(x, tm) {
        bg725(x, "#160d14");
        rackRow725(x, tm, BAR + 70, 9, .2);
        mike725(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", LW / 2 - 380, LH - BAR - 50, 160);
        panel725(x, LW / 2 - 240, BAR + 100, 560, 300, "#170d18");
        x.strokeStyle = RED; x.lineWidth = 2.5; rr(x, LW / 2 - 240, BAR + 100, 560, 300, 10); x.stroke();
        x.fillStyle = RED; x.beginPath(); x.moveTo(LW / 2 - 190, BAR + 132); x.lineTo(LW / 2 - 172, BAR + 164); x.lineTo(LW / 2 - 208, BAR + 164); x.closePath(); x.fill();
        txt(x, "SYSTEM MESSAGE", LW / 2 + 10, BAR + 150, 22, RED, "center", true);
        x.fillStyle = "rgba(255,68,85,.10)"; x.fillRect(LW / 2 - 220, BAR + 190, 520, 60);
        txt(x, "STOP THE TRANSFER", LW / 2 + 30, BAR + 220, 20, RED, "center", true);
        x.fillStyle = "rgba(160,107,255,.10)"; x.fillRect(LW / 2 - 220, BAR + 270, 520, 60);
        txt(x, "FOLLOW FELICIA", LW / 2 + 30, BAR + 300, 20, PUR, "center", true);
        if (((tm / 400) | 0) % 2) { x.fillStyle = "rgba(255,68,85,.08)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); }
      }
    },
    {
      dur: 2600, cap: "ALLIANCE FRACTURED.", draw(x, tm) {
        bg725(x, "#0a0c18");
        // broken chain glyph as shapes
        const cy = BAR + 250;
        x.strokeStyle = PUR; x.lineWidth = 8;
        x.beginPath(); x.ellipse(LW / 2 - 90, cy, 60, 34, -.4, .6, 5.4); x.stroke();
        x.beginPath(); x.ellipse(LW / 2 + 90, cy, 60, 34, -.4, -.8, 2.6); x.stroke();
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; x.fillStyle = PUR; x.fillRect(LW / 2 + Math.cos(a) * (70 + (tm / 8 + i * 9) % 40), cy + Math.sin(a) * 50, 4, 4); }
        txt(x, "ALLIANCE FRACTURED", LW / 2, cy + 120, 34, PUR, "center", true);
        const pick = ((typeof S !== "undefined") && S.meta && S.meta._v725betrayal) || "stop";
        txt(x, pick === "follow" ? "You went after her." : "You killed the transfer. She was already gone.",
          LW / 2, cy + 170, 17, DIM, "center");
      }
    }
  ];

  // ==========================================================================
  // CINEMATIC D — PROJECT ORPHEUS: THE CITY BENEATH THE CITY
  // ==========================================================================
  function twinCity725(x, tm, a0, b0, w, h, seized) {
    x.fillStyle = "#0a1020"; rr(x, a0, b0, w, h, 8); x.fill(); x.strokeStyle = EDGE; x.lineWidth = 2; rr(x, a0, b0, w, h, 8); x.stroke();
    const cols = 14, rows = 8;
    x.strokeStyle = "rgba(57,211,255,.25)"; x.lineWidth = 1;
    for (let i = 0; i <= cols; i++) { x.beginPath(); x.moveTo(a0 + i * w / cols, b0); x.lineTo(a0 + i * w / cols, b0 + h); x.stroke(); }
    for (let j = 0; j <= rows; j++) { x.beginPath(); x.moveTo(a0, b0 + j * h / rows); x.lineTo(a0 + w, b0 + j * h / rows); x.stroke(); }
    for (let i = 0; i < 60; i++) {
      const bx = a0 + 12 + (i * 53) % (w - 30), by = b0 + 10 + (i * 37) % (h - 30), bh = 6 + (i % 5) * 7;
      const hot = ((tm / 350 + i * 11) | 0) % 13 === 0;
      x.fillStyle = seized ? (hot ? "#39ff88" : "rgba(57,255,136,.30)") : (hot ? CYAN : "rgba(57,211,255,.30)");
      x.fillRect(bx, by + (26 - bh), 8, bh);
    }
  }
  const CINE_D_SHOTS = [
    {
      dur: 2400, cap: "NEW HAVEN SUBSURFACE — LEVEL -17. ORPHEUS OPERATIONS.", draw(x, tm) {
        bg725(x, "#0a0e20");
        panel725(x, 70, BAR + 70, 260, 130, "#0d1226");
        txt(x, "NEW HAVEN", 90, BAR + 100, 15, GREEN, "left", true);
        txt(x, "SUBSURFACE", 90, BAR + 122, 15, GREEN, "left", true);
        txt(x, "LEVEL -17", 90, BAR + 144, 15, GREEN, "left", true);
        txt(x, "ORPHEUS OPERATIONS", 90, BAR + 172, 12, DIM, "left", true);
        twinCity725(x, tm, 420, BAR + 90, 760, 360, false);
        k725(x, 250, LH - BAR - 40, 150, "deck"); // K's first appearance, watching the floor
        txt(x, "K", 250, LH - BAR - 210, 16, GREEN, "center", true);
      }
    },
    {
      dur: 2200, cap: "NEW HAVEN DIGITAL TWIN — LIVE FEED.", draw(x, tm) {
        bg725(x, "#0a0e20");
        twinCity725(x, tm, 140, BAR + 70, 1000, 380, false);
        panel725(x, LW / 2 - 200, BAR + 90, 400, 70, "rgba(10,16,32,.85)");
        txt(x, "NEW HAVEN", LW / 2, BAR + 114, 16, CYAN, "center", true);
        txt(x, "DIGITAL TWIN — LIVE FEED", LW / 2, BAR + 140, 14, CYAN, "center", true);
      }
    },
    {
      dur: 2400, cap: "Power. Traffic. Hospitals. Factories. Comms. All of it.", draw(x, tm) {
        bg725(x, "#0a0e20");
        const tiles = [["POWER GRID", RED], ["TRAFFIC", AMBER], ["HOSPITALS", CYAN], ["FACTORIES", PUR], ["COMMUNICATIONS", GREEN]];
        tiles.forEach((t, i) => {
          const ax = 90 + (i % 3) * 380, ay = BAR + 70 + ((i / 3) | 0) * 190;
          panel725(x, ax, ay, 340, 160, "#0d1226");
          txt(x, t[0], ax + 170, ay + 26, 15, t[1], "center", true);
          for (let j = 0; j < 8; j++) {
            const px = ax + 30 + (j * 41) % 280, py = ay + 55 + (j * 29) % 80;
            x.fillStyle = t[1]; x.beginPath(); x.arc(px, py, 3.5, 0, 7); x.fill();
            if (j) { const qx = ax + 30 + ((j - 1) * 41) % 280, qy = ay + 55 + ((j - 1) * 29) % 80; x.strokeStyle = t[1]; x.lineWidth = 1; x.globalAlpha = .5; x.beginPath(); x.moveTo(qx, qy); x.lineTo(px, py); x.stroke(); x.globalAlpha = 1; }
          }
        });
        mike725(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 560, LH - BAR - 40, 130);
        felicia725(x, "up0", 720, LH - BAR - 40, 128, false);
      }
    },
    {
      dur: 2600, cap: "SIMULATION — PREDICTED: BRIDGE FAILURE. PREDICTED: BLACKOUT.", draw(x, tm) {
        bg725(x, "#120d18"); twinCity725(x, tm, 140, BAR + 70, 1000, 380, false);
        x.strokeStyle = RED; x.lineWidth = 3; // bridge glyph
        x.beginPath(); x.moveTo(300, BAR + 300); x.quadraticCurveTo(420, BAR + 190, 540, BAR + 300); x.stroke();
        x.beginPath(); x.moveTo(300, BAR + 300); x.lineTo(540, BAR + 300); x.stroke();
        x.beginPath(); x.moveTo(420, BAR + 190); x.lineTo(420, BAR + 300); x.stroke();
        x.fillStyle = "rgba(255,68,85,.18)"; x.beginPath(); x.moveTo(300, BAR + 300); x.quadraticCurveTo(420, BAR + 190, 540, BAR + 300); x.lineTo(540, BAR + 330); x.lineTo(300, BAR + 330); x.closePath(); x.fill();
        panel725(x, 180, BAR + 90, 380, 56, "#2a0d14"); txt(x, "SIMULATION  T-00:17:43", 200, BAR + 112, 13, RED, "left", true); txt(x, "PREDICTED: BRIDGE FAILURE", 200, BAR + 132, 13, RED, "left", true);
        panel725(x, 720, BAR + 150, 400, 56, "#2a0d14"); txt(x, "SIMULATION  T-00:32:08", 740, BAR + 172, 13, RED, "left", true); txt(x, "PREDICTED: NEIGHBORHOOD BLACKOUT", 740, BAR + 192, 12, RED, "left", true);
      }
    },
    {
      dur: 2600, cap: "\"Orpheus doesn't watch the city. It rehearses it.\"", draw(x, tm) {
        bg725(x, "#0d1024"); twinCity725(x, tm, 700, BAR + 80, 500, 300, false);
        felicia725(x, "down0", 380, LH - BAR - 40, 155, false);
        mike725(x, "down0", 620, LH - BAR - 40, 158);
        x.fillStyle = "#3f6b4f"; rr(x, 660, LH - BAR - 190, 20, 26, 3); x.fill(); txt(x, "ROOT", 670, LH - BAR - 177, 8, INK, "center", true);
        bubble725(x, "Orpheus doesn't watch the city.", 200, BAR + 90, 380);
        bubble725(x, "It rehearses it.", 240, BAR + 165, 220);
      }
    },
    {
      dur: 2400, cap: "CITIZEN PROFILES — 8,742,391 rehearsed lives.", draw(x, tm) {
        bg725(x, "#0d1024");
        panel725(x, 140, BAR + 70, 620, 400);
        txt(x, "CITIZEN PROFILES", 170, BAR + 104, 17, INK, "left", true);
        txt(x, "TOTAL: 8,742,391", 730, BAR + 104, 15, RED, "right", true);
        const ppl = [["L. MARTINEZ", "TEACHER", "0.78"], ["D. OKAFOR", "ENGINEER", "0.64"], ["J. WILSON", "NURSE", "0.83"]];
        ppl.forEach((p, i) => {
          const ay = BAR + 130 + i * 106;
          x.fillStyle = "#0a0f1e"; rr(x, 170, ay, 560, 92, 6); x.fill(); x.strokeStyle = EDGE; x.lineWidth = 1.5; rr(x, 170, ay, 560, 92, 6); x.stroke();
          silhouette725(x, 220, ay + 78, 70, "#2b3550");
          txt(x, "NAME: " + p[0], 270, ay + 30, 13, INK, "left", true);
          txt(x, "OCCUPATION: " + p[1], 270, ay + 52, 12, DIM, "left", true);
          txt(x, "PREDICTION SCORE: " + p[2], 270, ay + 74, 12, CYAN, "left", true);
        });
        panel725(x, 800, BAR + 70, 340, 400);
        txt(x, "BEHAVIORAL", 830, BAR + 104, 13, PUR, "left", true);
        txt(x, "PREDICTION", 830, BAR + 124, 13, PUR, "left", true);
        txt(x, "MODEL v9.3", 830, BAR + 144, 13, PUR, "left", true);
        for (let i = 0; i < 14; i++) { const px = 830 + (i * 61) % 280, py = BAR + 190 + (i * 43) % 200; x.fillStyle = i % 4 ? "rgba(255,68,85,.6)" : "rgba(57,211,255,.6)"; x.beginPath(); x.arc(px, py, 3, 0, 7); x.fill(); }
        mike725(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 1180, LH - BAR - 40, 130);
      }
    },
    {
      dur: 2400, cap: "\"Order requires foresight.\"", draw(x, tm) {
        bg725(x, "#14101e");
        panel725(x, 140, BAR + 80, 460, 340);
        cio725(x, 370, BAR + 400, 240);
        txt(x, "AEROTECH", 370, BAR + 120, 15, DIM, "center", true);
        txt(x, "SYSTEMS", 370, BAR + 142, 15, DIM, "center", true);
        bubble725(x, "Order requires foresight.", 620, BAR + 150, 360);
        mike725(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 880, LH - BAR - 40, 130);
        felicia725(x, "up0", 1040, LH - BAR - 40, 128, false);
      }
    },
    {
      dur: 2600, cap: "The handoff.", draw(x, tm) {
        bg725(x, "#0d1024"); twinCity725(x, tm, 760, BAR + 80, 440, 280, true);
        const follow = ((typeof S !== "undefined") && S.meta && S.meta._v725betrayal) === "follow";
        mike725(x, "down0", 420, LH - BAR - 40, 155);
        felicia725(x, "down0", 640, LH - BAR - 40, 150, true);
        // link glyph between their decks
        x.strokeStyle = PUR; x.lineWidth = 4;
        const ly = LH - BAR - 180;
        x.beginPath(); x.ellipse(505, ly, 22, 12, -.5, 0, 7); x.stroke();
        x.beginPath(); x.ellipse(555, ly, 22, 12, -.5, 0, 7); x.stroke();
        x.fillStyle = "#1a2030"; rr(x, 452, ly - 40, 26, 42, 4); x.fill(); rr(x, 586, ly - 40, 26, 42, 4); x.fill();
        x.fillStyle = GREEN; x.fillRect(458, ly - 28, 14, 4); x.fillRect(592, ly - 28, 14, 4);
        if (follow) txt(x, "You were already on her side of the glass.", LW / 2, BAR + 60, 16, DIM, "center");
        else txt(x, "She still sent you the keys.", LW / 2, BAR + 60, 16, DIM, "center");
      }
    },
    {
      dur: 3000, cap: "ORPHEUS CONTROL TRANSFERRED — RESISTANCE NETWORK ONLINE.", draw(x, tm) {
        bg725(x, "#0a140f");
        twinCity725(x, tm, 140, BAR + 70, 1000, 340, true);
        panel725(x, LW / 2 - 330, BAR + 90, 660, 80, "rgba(10,20,15,.9)");
        x.strokeStyle = GREEN; x.lineWidth = 2.5; rr(x, LW / 2 - 330, BAR + 90, 660, 80, 8); x.stroke();
        txt(x, "ORPHEUS CONTROL TRANSFERRED", LW / 2, BAR + 118, 19, GREEN, "center", true);
        txt(x, "RESISTANCE NETWORK ONLINE", LW / 2, BAR + 146, 15, GREEN, "center", true);
        mike725(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", 420, LH - BAR - 40, 145);
        felicia725(x, "down0", 580, LH - BAR - 40, 142, false);
        k725(x, 760, LH - BAR - 40, 150, "fist");
        txt(x, "K", 760, LH - BAR - 220, 16, GREEN, "center", true);
        for (let i = 0; i < 3; i++) silhouette725(x, 900 + i * 90, LH - BAR - 40, 120, i % 2 ? "#33284a" : "#2b3550");
      }
    }
  ];

  // ==========================================================================
  // SHARED ENGINE
  // ==========================================================================
  const CINES = {
    coffee: { title: "SIDE QUEST — THE COFFEE MACHINE INCIDENT", shots: CINE_A_SHOTS },
    mentor: { title: "MENTOR QUEST — SHOW THEM HOW TO THINK", shots: CINE_B_SHOTS },
    betrayal: { title: "DAY 14 — THE BETRAYAL PROTOCOL", shots: CINE_C_SHOTS },
    city: { title: "PROJECT ORPHEUS — THE CITY BENEATH THE CITY", shots: CINE_D_SHOTS }
  };
  const st725 = { plays: 0, skips: 0, completes: 0, choices: 0 };
  let ov725 = null, cx725 = null, raf725 = 0, t0725 = 0, cine725 = null, done725 = null,
    shotIdx = -1, waitingChoice = null, resolved725 = null, fired725 = [], lastShotAt = -1;

  function shotsOf() { return CINES[cine725].shots; }
  function shotStartAt(i) { let s = 0; for (let j = 0; j < i; j++) s += shotsOf()[j].dur || 0; return s; }
  function totalDur() { let s = 0; shotsOf().forEach(sh => s += sh.dur || 0); return s; }

  function buildOverlay725() {
    const d = document.createElement("div");
    d.id = "v725-cine";
    d.style.cssText = "position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer";
    const c = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = LW * dpr; c.height = LH * dpr;
    const scale = Math.min(innerWidth / LW, innerHeight / LH);
    c.style.width = LW * scale + "px"; c.style.height = LH * scale + "px";
    c.style.imageRendering = "pixelated";
    d.appendChild(c); document.body.appendChild(d);
    d.addEventListener("click", (e) => {
      if (waitingChoice) { pickChoice725(clickChoice725(e, c)); return; }
      end725(true);
    });
    window.addEventListener("keydown", onKey725, true);
    return { d, c };
  }
  function clickChoice725(e, c) {
    const r = c.getBoundingClientRect();
    const lx = (e.clientX - r.left) / r.width * LW, ly = (e.clientY - r.top) / r.height * LH;
    const n = waitingChoice.options.length;
    for (let i = 0; i < n; i++) {
      const by = LH - BAR - 70 - (n - i) * 58;
      if (lx >= LW / 2 - 330 && lx <= LW / 2 + 330 && ly >= by && ly <= by + 48) return i;
    }
    return -1;
  }
  function pickChoice725(i) {
    if (!waitingChoice || i < 0 || i >= waitingChoice.options.length) return;
    const ch = waitingChoice; waitingChoice = null;
    resolved725 = cine725 + ":" + shotIdx;
    st725.choices++;
    try {
      const val = ch.values ? ch.values[i] : i;
      if ((typeof S !== "undefined") && S.meta) S.meta[ch.store] = val;
      if (cine725 === "betrayal" && (typeof S !== "undefined") && S.meta) S.meta._v725betrayalDay = S.meta.day || S.day;
    } catch (e) { }
    chime725();
    t0725 = performance.now() - (shotStartAt(shotIdx) + 1); // resume into next shot
    lastShotAt = -1;
  }
  function onKey725(e) {
    if (!ov725) return;
    e.stopPropagation(); e.preventDefault();
    if (waitingChoice) {
      const n = { "1": 0, "2": 1, "3": 2 }[e.key];
      if (n !== undefined) pickChoice725(n);
      return;
    }
    end725(true);
  }

  function drawChoice725(x, tm) {
    const ch = waitingChoice, n = ch.options.length;
    x.fillStyle = "rgba(5,8,18,.72)"; x.fillRect(0, LH - BAR - 80 - n * 58, LW, 100 + n * 58);
    txt(x, ch.prompt, LW / 2, LH - BAR - 52 - n * 58, 19, GOLD, "center", true);
    for (let i = 0; i < n; i++) {
      const by = LH - BAR - 70 - (n - i) * 58;
      const hot = ((tm / 500) | 0) % 2 === 0;
      x.fillStyle = "#141a30"; rr(x, LW / 2 - 330, by, 660, 48, 8); x.fill();
      x.strokeStyle = hot ? CYAN : EDGE; x.lineWidth = 2; rr(x, LW / 2 - 330, by, 660, 48, 8); x.stroke();
      txt(x, ch.options[i], LW / 2, by + 24, 17, INK, "center", true);
    }
  }

  function draw725() {
    if (!ov725) return;
    const x = cx725, dpr = Math.min(2, window.devicePixelRatio || 1);
    const tm = performance.now();
    let el = tm - t0725;
    const shots = shotsOf();
    // locate shot; choice shots hold until resolved
    let idx = 0, acc = 0;
    for (let i = 0; i < shots.length; i++) {
      if (shots[i].choice && el >= acc && resolved725 !== cine725 + ":" + i) { idx = i; break; } // unresolved choice shots hold the timeline
      acc += shots[i].dur || 0;
      if (el < acc || i === shots.length - 1) { idx = i; break; }
      idx = i;
    }
    const sh = shots[idx];
    if (idx !== shotIdx) { shotIdx = idx; cue725(idx); }
    if (sh.choice && !waitingChoice && resolved725 !== cine725 + ":" + idx) waitingChoice = sh.choice;
    // draw
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.fillStyle = "#000"; x.fillRect(0, 0, LW, LH);
    try { sh.draw(x, tm, Math.max(0, el - shotStartAt(idx))); } catch (e) { }
    if (waitingChoice) drawChoice725(x, tm);
    // letterbox + chrome
    x.fillStyle = "#000"; x.fillRect(0, 0, LW, BAR); x.fillRect(0, LH - BAR, LW, BAR);
    x.fillStyle = "rgba(57,211,255,.5)"; x.fillRect(0, BAR - 2, LW, 2); x.fillRect(0, LH - BAR, LW, 2);
    txt(x, "TECHOPS HERO — " + CINES[cine725].title, 28, 32, 16, DIM, "left", true);
    txt(x, waitingChoice ? "1-" + waitingChoice.options.length + " / CLICK — CHOOSE" : "E / CLICK — SKIP", LW - 28, 32, 14, DIM, "right", true);
    if (sh.cap) { txt(x, sh.cap, LW / 2, LH - BAR + 32, 17, INK, "center"); }
    // fade edges
    const fade = Math.min(1, el / 500), out = Math.min(1, Math.max(0, (totalDur() - el) / 500));
    const a = 1 - Math.min(fade, out || 1);
    if (a > 0) { x.fillStyle = "rgba(0,0,0," + a + ")"; x.fillRect(0, 0, LW, LH); }
    if (!waitingChoice && el >= totalDur() && shots[shots.length - 1].dur > 0 && el > totalDur() + 400) { end725(false); return; }
    if (!waitingChoice && el >= totalDur() && cine725 !== null && shots[shots.length - 1].choice) { end725(false); return; }
    raf725 = requestAnimationFrame(draw725);
  }

  function cue725(i) {
    try {
      const id = cine725 + ":" + i;
      if (cine725 === "coffee") {
        if (i === 1) err725(); else if (i === 4) beep725(3, 620); else if (i === 5) steam725(); else if (i === 6) chime725(); else if (i === 7) chime725();
        else beep725(2, 500);
      } else if (cine725 === "mentor") {
        if (i === 4) beep725(3, 700); else if (i === 5) chime725(); else if (i === 6) chime725(); else beep725(2, 520);
      } else if (cine725 === "betrayal") {
        if (i === 3) err725(); else if (i === 6 || i === 7) alarm725(); else if (i === 8) beep725(3, 440); else beep725(2, 380);
      } else {
        if (i === 3) alarm725(); else if (i === 8) chime725(); else beep725(2, 460);
      }
    } catch (e) { }
  }

  function end725(skipped) {
    if (!ov725) return;
    try { cancelAnimationFrame(raf725); } catch (e) { }
    window.removeEventListener("keydown", onKey725, true);
    try { ov725.d.remove(); } catch (e) { }
    ov725 = null; cx725 = null; waitingChoice = null;
    stopAudio725();
    st725.plays++; if (skipped) st725.skips++; else st725.completes++;
    const cb = done725; done725 = null; cine725 = null;
    if (cb) setTimeout(cb, 30);
  }

  function play725(id, onDone) {
    if (ov725) return false;
    cine725 = id; done725 = onDone || null;
    shotIdx = -1; waitingChoice = null; resolved725 = null; fired725 = []; lastShotAt = -1;
    ov725 = buildOverlay725();
    cx725 = ov725.c.getContext("2d");
    t0725 = performance.now();
    raf725 = requestAnimationFrame(draw725);
    return true;
  }

  // ==========================================================================
  // TRIGGERS — checkDayEnd choke point (outermost wrap, after v7.24)
  // Order: coffee (d>=11) → mentor (d>=12) → betrayal (d>=14) → city (after betrayal)
  // ==========================================================================
  const _checkDayEnd725 = checkDayEnd;
  function pendingCine725(s) {
    const m = s.meta || (s.meta = {});
    const day = m.day || s.day || 0;
    if (day >= 11 && !m._v725coffee) return "coffee";
    if (day >= 12 && !m._v725mentor) return "mentor";
    if (day >= 14 && !m._v725betrayal) return "betrayal";
    if (m._v725betrayal && !m._v725city && day > (m._v725betrayalDay || 14)) return "city";
    return null;
  }
  window.checkDayEnd = function (force) {
    const s = (typeof S !== "undefined") ? S : null;
    try {
      if (s && s.meta && !ov725 && !s.nightMode && !s.battle &&
        !(typeof dlgOpen !== "undefined" && dlgOpen && dlgOpen()) &&
        !(window.v722 && v722.active && v722.active()) &&
        !(window.v723 && v723.active && v723.active()) &&
        !(window.v724 && v724.active && v724.active())) {
        const id = pendingCine725(s);
        const done = (s.ticketsDone >= s.ticketsTotal) || force;
        if (id && done && s.meta._v725Day !== (s.meta.day || s.day)) {
          s.meta._v725Day = s.meta.day || s.day;
          const mark = { coffee: "_v725coffee", mentor: "_v725mentor", betrayal: "_v725betrayalPending", city: "_v725city" }[id];
          const ok = play725(id, function () {
            try {
              if (id === "betrayal") { if (S.meta._v725betrayal) S.meta._v725betrayalSeen = true; }
              else if (id === "coffee") S.meta._v725coffee = true;
              else if (id === "mentor") S.meta._v725mentor = true;
              else if (id === "city") S.meta._v725city = true;
            } catch (e) { }
            _checkDayEnd725(force);
          });
          if (ok) return;
        }
      }
    } catch (e) { window.__err725 = String(e && e.stack || e); }
    return _checkDayEnd725(force);
  };

  window.v725 = {
    version: VER,
    stats: () => Object.assign({}, st725),
    active: () => !!ov725,
    skip: () => end725(true),
    play: (id) => play725(id || "coffee", null),
    choose: (i) => pickChoice725(i),
    cines: Object.keys(CINES)
  };
})();

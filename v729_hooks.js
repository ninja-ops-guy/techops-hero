/* ==========================================================================
   v7.29 — SIGNALS FROM THE DARK: story pack III
   Three more boards on the shared v7.25 engine (register API + helper kit —
   no parallel framework), closing the open threads from the roadmap:
     1. DAY 9 — THE ENEMY IN THE WIRES (id "wires", day>=9, after the Day-8
        racks encounter _v726racks): the breach from Day 8 moves inside the
        plant network. Traceroute across the rack rows, then the call —
        ISOLATE THE SEGMENT / MIRROR THE TRAFFIC / FOLLOW THE PACKET —
        persisted in S.meta._v729wires with a matching permanent unlock flag
        (_v729isolation / _v729mirror / _v729trace).
     2. ROOFTOP — THE SIGNAL (id "signal", day>=15, after the Day-14 betrayal
        _v725betrayal): dusk on the roof. A violin phrase crosses the city —
        Felicia's signal to the network she chose. ANSWER THE PHRASE /
        RECORD IT / LET IT PLAY — persisted in S.meta._v729signal.
     3. EPILOGUE — ORPHEUS WAKES (id "orpheus", day>=18, after K's direct
        line _v727kLine): the night contracts call. K's origin teased — she
        built ORPHEUS's first admin console. SIGN THE NIGHT CONTRACT /
        STAND DOWN — persisted in S.meta._v729orpheus; signing pays
        NIGHT CONTRACTS UNLOCKED (S.meta._v729nightContract) exactly once.
   Canon rules hold: Mike from the real player atlas, Felicia only from her
   own atlas (violin frame), K from the v7.25 procedural figure (never a
   Felicia reuse), glyphs as shapes — no emoji in the art (the ORPHEUS eye
   and the violin soundwave are drawn, not typed). One cinematic per day
   across all packs; skippable except during the choice; normal end-of-day
   flow always runs afterwards.
   ========================================================================== */
(function () {
  const VER = "7.29";
  if (window.v729) return;
  const v725 = window.v725;
  if (!v725 || !v725.register || !v725.h) return; // needs the v7.25 engine
  const H = v725.h;
  const LW = H.LW, LH = H.LH, BAR = H.BAR;
  const GREEN = H.GREEN, PUR = H.PUR, CYAN = H.CYAN, RED = H.RED,
    INK = H.INK, DIM = H.DIM, GOLD = H.GOLD, EDGE = H.EDGE;

  function meta729() { try { return (typeof S !== "undefined") ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } }

  // ---------- shared vignettes ----------
  // drawn soundwave — a violin phrase as a living glyph (shapes, no emoji)
  function soundwave729(x, cx, cy, w, tm, col, phrase) {
    const n = 48, ph = phrase || [3, 5, 2, 6, 4, 7, 3, 5];
    x.strokeStyle = col || CYAN; x.lineWidth = 2.5;
    x.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = cx - w / 2 + t * w;
      const note = ph[Math.floor(t * ph.length + tm / 600) % ph.length];
      const amp = 10 + note * 6 + Math.sin(tm / 180 + i * .7) * 5;
      const py = cy + Math.sin(t * Math.PI * 4 + tm / 240) * amp * Math.sin(t * Math.PI);
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
  }
  // the ORPHEUS eye — drawn lid + iris, opens over the shot
  function orpheusEye729(x, cx, cy, r, open01, tm) {
    x.save();
    // socket glow
    x.save(); x.shadowColor = PUR; x.shadowBlur = 30;
    x.fillStyle = "#0b0714"; x.beginPath(); x.ellipse(cx, cy, r * 1.5, r, 0, 0, 7); x.fill(); x.restore();
    x.strokeStyle = EDGE; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, r * 1.5, r, 0, 0, 7); x.stroke();
    // iris, clipped by the lids
    x.save();
    x.beginPath(); x.ellipse(cx, cy, r * 1.5, r * open01, 0, 0, 7); x.clip();
    const g = x.createRadialGradient(cx, cy, r * .1, cx, cy, r * .8);
    g.addColorStop(0, "#e9d8ff"); g.addColorStop(.45, PUR); g.addColorStop(1, "#17092e");
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * .8, 0, 7); x.fill();
    x.fillStyle = "#050308"; x.beginPath(); x.arc(cx, cy, r * (.3 + .06 * Math.sin(tm / 500)), 0, 7); x.fill();
    x.strokeStyle = "rgba(233,216,255,.6)"; x.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) { const a = i * .524 + tm / 4000; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * .34, cy + Math.sin(a) * r * .34); x.lineTo(cx + Math.cos(a) * r * .76, cy + Math.sin(a) * r * .76); x.stroke(); }
    x.restore();
    // lids
    x.fillStyle = "#0b0714";
    x.beginPath(); x.ellipse(cx, cy, r * 1.52, r * (1 - open01), 0, Math.PI, 0); x.fill();
    x.beginPath(); x.ellipse(cx, cy, r * 1.52, r * (1 - open01), 0, 0, Math.PI); x.fill();
    x.restore();
  }

  // ---------- BOARD 1: DAY 9 — THE ENEMY IN THE WIRES ----------
  const WIRES_SHOTS = [
    {
      dur: 2400, cap: "DAY 9 — 2:12 PM. THE BREACH FROM DAY 8 MOVED.", draw(x, tm) {
        H.bg(x, "#0a0e1c"); H.rackRow(x, tm, BAR + 60, 10, .5);
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", LW / 2, LH - BAR - 60, 170);
        H.txt(x, "2:12 PM", 70, BAR + 42, 22, CYAN, "left", true);
        const bl = Math.floor(tm / 500) % 2;
        x.fillStyle = bl ? RED : "#3a0d12"; x.fillRect(LW - 220, BAR + 40, 150, 10);
        H.txt(x, "CORE SWITCH — FLT", LW - 220, BAR + 76, 13, RED, "left", true);
      }
    },
    {
      dur: 2600, cap: "TRACEROUTE — SIX HOPS, AND NONE OF THEM LEAVE THE BUILDING.", draw(x, tm) {
        H.bg(x, "#081018");
        H.twinCity(x, tm, 190, BAR + 80, 900, 360, false);
        for (let i = 0; i < 6; i++) {
          const on = tm > 350 + i * 300;
          const nx = 300 + i * 130, ny = BAR + 200 + Math.sin(i * 2.1) * 90;
          if (i) { x.strokeStyle = on ? "rgba(255,80,80,.8)" : "#22304a"; x.lineWidth = 2; x.beginPath(); x.moveTo(300 + (i - 1) * 130, BAR + 200 + Math.sin((i - 1) * 2.1) * 90); x.lineTo(nx, ny); x.stroke(); }
          x.fillStyle = on ? RED : "#182238"; x.beginPath(); x.arc(nx, ny, on ? 9 : 6, 0, 7); x.fill();
          if (on) H.txt(x, "HOP " + i, nx, ny + 26, 11, RED, "center", true);
        }
        H.panel(x, LW / 2 - 280, BAR + 92, 560, 58, "rgba(24,8,10,.92)");
        x.strokeStyle = RED; x.lineWidth = 2.5; H.rr(x, LW / 2 - 280, BAR + 92, 560, 58, 8); x.stroke();
        H.txt(x, "TRACEROUTE — SOURCE: INSIDE THE PLANT", LW / 2, BAR + 126, 16, RED, "center", true);
      }
    },
    {
      dur: 2400, cap: "\"It's not stealing data. It's learning the rhythm.\"", draw(x, tm) {
        H.bg(x, "#0a0e1c"); H.rackRow(x, tm, BAR + 70, 8, .35);
        H.mike(x, "down0", 480, LH - BAR - 50, 165);
        H.cio(x, 780, LH - BAR - 50, 165);
        H.bubble(x, "It's not stealing data.", 250, BAR + 90, 290);
        H.bubble(x, "It's learning the rhythm.", 280, BAR + 165, 320);
      }
    },
    {
      dur: 0, cap: "The packet waits for nobody. Your call, Administrator.", choice: {
        prompt: "THE ENEMY IN THE WIRES — HOW DO YOU ANSWER?",
        options: ["1 — ISOLATE THE SEGMENT", "2 — MIRROR THE TRAFFIC", "3 — FOLLOW THE PACKET"],
        values: ["isolate", "mirror", "follow"],
        store: "_v729wires"
      }, draw(x, tm) {
        H.bg(x, "#0a0e1c"); H.rackRow(x, tm, BAR + 60, 9, .45);
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", LW / 2 - 180, LH - BAR - 60, 165);
        // the packet — a drawn courier glyph pulsing down the row
        const px = 300 + (tm / 4) % 700, py = BAR + 130;
        x.save(); x.shadowColor = RED; x.shadowBlur = 14;
        x.fillStyle = RED; H.rr(x, px - 12, py - 8, 24, 16, 4); x.fill(); x.restore();
        x.strokeStyle = "#ffd2d2"; x.lineWidth = 1.5; H.rr(x, px - 12, py - 8, 24, 16, 4); x.stroke();
      }
    },
    {
      dur: 2800, cap: "LOGGED. THE WIRES REMEMBER WHO ANSWERED.", draw(x, tm) {
        H.bg(x, "#0b1210"); H.rackRow(x, tm, BAR + 70, 8, .3);
        const pick = (meta729() || {})._v729wires;
        const label = pick === "mirror" ? "TRAFFIC MIRROR ACTIVE — PORT 9 SPAN"
          : pick === "follow" ? "PACKET TRACE ARMED — HOP WATCH LIVE"
            : "SEGMENT ISOLATED — VLAN 40 QUARANTINED";
        H.panel(x, LW / 2 - 360, BAR + 90, 720, 100, "rgba(8,20,14,.92)");
        x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 360, BAR + 90, 720, 100, 8); x.stroke();
        H.check(x, LW / 2 - 310, BAR + 122, 30, GREEN);
        H.txt(x, label, LW / 2 + 20, BAR + 128, 18, GREEN, "center", true);
        H.txt(x, "COUNTERMEASURE LOGGED — DAY 9", LW / 2 + 20, BAR + 164, 13, DIM, "center", true);
        H.mike(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", LW / 2, LH - BAR - 60, 160);
      }
    }
  ];

  // ---------- BOARD 2: ROOFTOP — THE SIGNAL ----------
  const SIGNAL_SHOTS = [
    {
      dur: 2400, cap: "DAY 15 — 7:40 PM. THE ROOF ABOVE ENGINEERING.", draw(x, tm) {
        H.bg(x, "#14102a"); H.cityGlow(x, tm, 56);
        // dusk band
        const g = x.createLinearGradient(0, LH - BAR - 260, 0, LH - BAR);
        g.addColorStop(0, "rgba(255,150,60,0)"); g.addColorStop(1, "rgba(255,150,60,.16)");
        x.fillStyle = g; x.fillRect(0, LH - BAR - 260, LW, 260);
        H.txt(x, "7:40 PM", 70, BAR + 42, 22, GOLD, "left", true);
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 420, LH - BAR - 50, 165);
        x.fillStyle = "#0d0a18"; x.fillRect(0, LH - BAR - 34, LW, 34); // parapet
      }
    },
    {
      dur: 2800, cap: "A VIOLIN PHRASE CROSSES THE CITY. EIGHT NOTES, THEN SILENCE.", draw(x, tm) {
        H.bg(x, "#120e24"); H.cityGlow(x, tm, 40);
        H.felicia(x, "violin", 880, LH - BAR - 60, 175, true);
        soundwave729(x, 430, BAR + 180, 560, tm, GOLD);
        H.txt(x, "— . . — — . — .", 430, BAR + 260, 14, DIM, "center", true); // rhythm legend, text only
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 220, LH - BAR - 50, 160);
      }
    },
    {
      dur: 2400, cap: "\"She's not hiding anymore. She's knocking.\"", draw(x, tm) {
        H.bg(x, "#14102a"); H.cityGlow(x, tm, 30);
        H.mike(x, "down0", 560, LH - BAR - 50, 170);
        H.k(x, 800, LH - BAR - 50, 160, "deck");
        H.bubble(x, "She's not hiding anymore.", 300, BAR + 90, 300);
        H.bubble(x, "She's knocking.", 330, BAR + 165, 220);
      }
    },
    {
      dur: 0, cap: "The phrase hangs in the dusk, waiting on your answer.", choice: {
        prompt: "THE SIGNAL — WHAT DO YOU DO WITH IT?",
        options: ["1 — ANSWER THE PHRASE", "2 — RECORD IT", "3 — LET IT PLAY"],
        values: ["answer", "record", "listen"],
        store: "_v729signal"
      }, draw(x, tm) {
        H.bg(x, "#120e24"); H.cityGlow(x, tm, 34);
        H.felicia(x, "violin", 900, LH - BAR - 60, 165, true);
        soundwave729(x, 420, BAR + 170, 520, tm, CYAN, [5, 3, 6, 2, 7, 4, 3, 5]);
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 240, LH - BAR - 50, 165);
      }
    },
    {
      dur: 2800, cap: "THE CITY KEEPS THE MUSIC. SO DO YOU.", draw(x, tm) {
        H.bg(x, "#101423"); H.cityGlow(x, tm, 50);
        const pick = (meta729() || {})._v729signal;
        const line = pick === "record" ? "Eight notes, safe on the deck. Evidence, if it ever needs to be."
          : pick === "listen" ? "You let it play out over the water. Some things aren't evidence."
            : "You tapped the answer on the parapet. Somewhere, a bow smiled.";
        soundwave729(x, LW / 2, BAR + 150, 640, tm, GOLD);
        H.panel(x, LW / 2 - 380, BAR + 230, 760, 76, "rgba(20,14,8,.92)");
        x.strokeStyle = GOLD; x.lineWidth = 2.5; H.rr(x, LW / 2 - 380, BAR + 230, 760, 76, 8); x.stroke();
        H.txt(x, line, LW / 2, BAR + 268, 15, GOLD, "center", true);
        H.mike(x, "down0", LW / 2 - 260, LH - BAR - 50, 160);
        H.felicia(x, "violin", LW / 2 + 260, LH - BAR - 55, 160, true);
      }
    }
  ];

  // ---------- BOARD 3: EPILOGUE — ORPHEUS WAKES ----------
  const ORPHEUS_SHOTS = [
    {
      dur: 2400, cap: "DAY 18 — 1:03 AM. THE DIRECT LINE BUZZES.", draw(x, tm) {
        H.bg(x, "#0a0d1c"); H.cityGlow(x, tm, 24);
        H.txt(x, "1:03 AM", 70, BAR + 42, 22, CYAN, "left", true);
        H.mike(x, "down0", 420, LH - BAR - 50, 165);
        // the deck, buzzing — drawn comm unit
        const bx = 640, by = LH - BAR - 190 + Math.sin(tm / 90) * 3;
        x.save(); x.shadowColor = GREEN; x.shadowBlur = 18;
        x.fillStyle = "#141b2a"; H.rr(x, bx - 14, by - 20, 28, 40, 4); x.fill(); x.restore();
        x.fillStyle = GREEN; x.fillRect(bx - 9, by - 12, 18, 4); x.fillRect(bx - 9, by - 3, 18, 4);
        H.txt(x, "K", bx, by + 34, 14, GREEN, "center", true);
      }
    },
    {
      dur: 2600, cap: "\"I built its first console. It was my dashboard once.\"", draw(x, tm) {
        H.bg(x, "#0b0a16");
        // K origin tease — younger-K silhouette at a drawn console
        H.k(x, 460, LH - BAR - 50, 165, "deck");
        x.fillStyle = "#101828"; H.rr(x, 620, LH - BAR - 210, 300, 130, 10); x.fill();
        x.strokeStyle = EDGE; x.lineWidth = 2; H.rr(x, 620, LH - BAR - 210, 300, 130, 10); x.stroke();
        orpheusEye729(x, 770, LH - BAR - 145, 40, .12, tm);
        H.txt(x, "ORPHEUS v0.1 — ADMIN CONSOLE", 770, LH - BAR - 60, 12, DIM, "center", true);
        H.bubble(x, "I built its first console.", 220, BAR + 90, 280);
        H.bubble(x, "It was my dashboard once.", 250, BAR + 165, 300);
      }
    },
    {
      dur: 2800, cap: "ACROSS NEW HAVEN, THE GRID OPENS ONE EYE.", draw(x, tm) {
        H.bg(x, "#0a1020");
        H.twinCity(x, tm, 140, BAR + 70, 1000, 380, true);
        const open = Math.min(1, Math.max(0, (tm - 600) / 1800));
        orpheusEye729(x, LW / 2, BAR + 260, 90, Math.max(.08, open), tm);
        H.panel(x, LW / 2 - 240, BAR + 480, 480, 52, "rgba(16,8,24,.92)");
        x.strokeStyle = PUR; x.lineWidth = 2.5; H.rr(x, LW / 2 - 240, BAR + 480, 480, 52, 8); x.stroke();
        H.txt(x, "ORPHEUS — WATCHING BACK", LW / 2, BAR + 512, 16, PUR, "center", true);
      }
    },
    {
      dur: 0, cap: "Night contracts: the grid pays for hands it can't see.", choice: {
        prompt: "ORPHEUS WAKES — THE NIGHT CONTRACT",
        options: ["1 — SIGN THE NIGHT CONTRACT", "2 — STAND DOWN"],
        values: ["sign", "standdown"],
        store: "_v729orpheus"
      }, draw(x, tm) {
        H.bg(x, "#0b0a16"); H.cityGlow(x, tm, 26);
        H.k(x, 380, LH - BAR - 50, 165, "fist");
        H.mike(x, "down0", 640, LH - BAR - 50, 165);
        orpheusEye729(x, 980, BAR + 170, 70, .8, tm);
        H.txt(x, "CONTRACT: NIGHT WATCH — NEW HAVEN GRID", LW / 2 - 60, BAR + 70, 16, GREEN, "center", true);
      }
    },
    {
      dur: 3000, cap: "THE NIGHT HAS A LEDGER NOW. YOUR NAME IS IN IT — OR IT ISN'T.", draw(x, tm) {
        H.bg(x, "#0a140f"); H.cityGlow(x, tm, 20);
        const signed = (meta729() || {})._v729orpheus === "sign";
        H.panel(x, LW / 2 - 380, BAR + 80, 760, 116, signed ? "rgba(10,20,15,.92)" : "rgba(18,14,20,.92)");
        x.strokeStyle = signed ? GREEN : DIM; x.lineWidth = 2.5; H.rr(x, LW / 2 - 380, BAR + 80, 760, 116, 8); x.stroke();
        if (signed) {
          H.check(x, LW / 2 - 330, BAR + 112, 30, GREEN);
          H.txt(x, "NIGHT CONTRACTS UNLOCKED", LW / 2 + 20, BAR + 118, 20, GREEN, "center", true);
          H.txt(x, "THE GRID CALLS. YOU ANSWER FIRST.", LW / 2 + 20, BAR + 156, 14, DIM, "center", true);
        } else {
          H.txt(x, "STOOD DOWN — THE LINE STAYS OPEN", LW / 2, BAR + 118, 20, DIM, "center", true);
          H.txt(x, "K nodded. \"The offer doesn't expire.\"", LW / 2, BAR + 156, 14, DIM, "center", true);
        }
        H.k(x, 860, LH - BAR - 50, 150, "deck");
        H.mike(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", 400, LH - BAR - 50, 155);
        orpheusEye729(x, LW / 2, BAR + 280, 60, signed ? 1 : .1, tm);
      }
    }
  ];

  v725.register("wires", { title: "DAY 9 — THE ENEMY IN THE WIRES", shots: WIRES_SHOTS, cues: { 1: "beep520", 3: "chime" } });
  v725.register("signal", { title: "ROOFTOP — THE SIGNAL", shots: SIGNAL_SHOTS, cues: { 1: "chime", 3: "beep620" } });
  v725.register("orpheus", { title: "EPILOGUE — ORPHEUS WAKES", shots: ORPHEUS_SHOTS, cues: { 1: "beep620", 2: "beep520", 4: "chime" } });

  // ---------- exactly-once rewards ----------
  function applyRewards729(id) {
    const m = meta729(); if (!m) return;
    try {
      if (id === "wires" && m._v729wires) {
        if (m._v729wires === "isolate") m._v729isolation = true;
        if (m._v729wires === "mirror") m._v729mirror = true;
        if (m._v729wires === "follow") m._v729trace = true;
      }
      if (id === "orpheus" && m._v729orpheus === "sign") m._v729nightContract = true;
    } catch (e) { }
  }

  // ---------- trigger — outermost checkDayEnd wrap (after v7.27) ----------
  const _checkDayEnd729 = checkDayEnd;
  function pending729(s) {
    const m = s.meta || (s.meta = {});
    const day = m.day || s.day || 0;
    if (day >= 9 && m._v726racks && !m._v729wires) return "wires";
    if (day >= 15 && m._v725betrayal && !m._v729signal) return "signal";
    if (day >= 18 && m._v727kLine && !m._v729orpheus) return "orpheus";
    return null;
  }
  window.checkDayEnd = function (force) {
    const s = (typeof S !== "undefined") ? S : null;
    try {
      if (s && s.meta && !v725.active() && !s.nightMode && !s.battle &&
        !(typeof dlgOpen !== "undefined" && dlgOpen && dlgOpen()) &&
        !(window.v722 && v722.active && v722.active()) &&
        !(window.v723 && v723.active && v723.active()) &&
        !(window.v724 && v724.active && v724.active())) {
        const id = pending729(s);
        const day = s.meta.day || s.day;
        const done = (s.ticketsDone >= s.ticketsTotal) || force;
        if (id && done && s.meta._v729Day !== day) {
          s.meta._v729Day = day;
          s.meta._v727Day = day; // one cinematic per day across all packs
          s.meta._v726Day = day;
          s.meta._v725Day = day;
          const ok = v725.play(id, function () {
            _checkDayEnd729(force); // day-end flow first…
            applyRewards729(id);    // …then the unlock lands on top, exactly once
          });
          if (ok) return;
        }
      }
    } catch (e) { window.__err729 = String(e && e.stack || e); }
    return _checkDayEnd729(force);
  };

  window.v729 = {
    version: VER,
    scenes: ["wires", "signal", "orpheus"],
    play: (id) => v725.play(id || "wires", null),
    active: () => v725.active(),
    eye: orpheusEye729, wave: soundwave729, // shared draws for future scenes
    unlocks: () => {
      const m = meta729() || {};
      return {
        wires: m._v729wires || null, signal: m._v729signal || null,
        orpheus: m._v729orpheus || null, nightContract: !!m._v729nightContract,
        isolation: !!m._v729isolation, mirror: !!m._v729mirror, trace: !!m._v729trace
      };
    }
  };
})();

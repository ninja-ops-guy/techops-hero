/* ==========================================================================
   v7.27 — RIDE ALONG: K'S NIGHT RUN (+ the Charger rolls in)
   Two car sprite sheets become canon:
     1. Mike's black Dodge Charger with green ghost flames replaces the old
        SUV in the v7.22 night drive (edited in place in v722_hooks.js —
        same draw slot, same shots, extended not paralleled). The Charger
        draw is exported as v722.car so any scene can reuse it.
     2. K's black Mercedes with green/purple flames debuts in a NEW
        cinematic on the shared v7.25 engine: K — THE NIGHT RUN
        (day >= 17, after the City Beneath the City handoff). K shows Mike
        the resistance network node by node; the player picks HOW they ride
        (choice, stored in S.meta._v727krun — "shotgun" / "charger"), and
        the drive shot reflects the pick (the Charger pulls in behind if
        you follow). Reward: K — DIRECT LINE UNLOCKED (S.meta._v727kLine),
        paid exactly once, after the end-of-day chain.
   Canon rules hold: Mike from the real player atlas, Felicia only from her
   own atlas (she does not appear here), K drawn from the v7.25 procedural
   figure (never a Felicia reuse), glyphs as shapes — no emoji in the art.
   One cinematic per day across all packs; skippable except during the
   choice; normal end-of-day flow always runs afterwards.
   ========================================================================== */
(function () {
  const VER = "7.27";
  if (window.v727) return;
  const v725 = window.v725;
  if (!v725 || !v725.register || !v725.h) return; // needs the v7.25 engine
  const H = v725.h;
  const LW = H.LW, LH = H.LH, BAR = H.BAR;
  const GREEN = H.GREEN, PUR = H.PUR, CYAN = H.CYAN, RED = H.RED,
    INK = H.INK, DIM = H.DIM, GOLD = H.GOLD, EDGE = H.EDGE;

  function meta727() { try { return (typeof S !== "undefined") ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } }

  // ---------- K's Mercedes — black sedan, green→purple ghost flames ----------
  // X,Y = front wheel ground point; sc = px scale. Shapes only.
  function merc727(x, X, Y, sc, lightsOn, tm) {
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    // split underglow — green at the nose, purple at the tail
    x.save();
    const ug = x.createLinearGradient(-100, 0, 100, 0);
    ug.addColorStop(0, "#a06bff"); ug.addColorStop(1, "#2ee06f");
    x.shadowColor = "#7a5cff"; x.shadowBlur = 24;
    x.fillStyle = ug; x.fillRect(-98, -6, 196, 5);
    x.restore();
    // rounded sedan body
    x.fillStyle = "#0d0f13";
    H.rr(x, -100, -38, 200, 32, 14); x.fill();
    H.rr(x, -54, -58, 100, 22, 12); x.fill(); // sloped cabin
    x.fillStyle = "#0a0f1c"; // glass
    H.rr(x, -48, -55, 40, 15, 5); x.fill(); H.rr(x, -2, -55, 38, 15, 5); x.fill();
    // ghost flames — green base, purple tips
    x.fillStyle = "#1d5c38";
    [[-90, -21, 44], [-34, -19, 40], [16, -20, 34]].forEach(f => {
      x.beginPath(); x.moveTo(f[0], -12);
      x.quadraticCurveTo(f[0] + f[2] * .28, f[1] - 4, f[0] + f[2] * .55, -14);
      x.quadraticCurveTo(f[0] + f[2] * .78, f[1] - 1, f[0] + f[2], -11);
      x.lineTo(f[0] + f[2], -7); x.lineTo(f[0], -7); x.closePath(); x.fill();
    });
    x.fillStyle = "#7a4fe0";
    [[-80, -16, 32], [-26, -15, 28], [22, -15, 24]].forEach(f => {
      x.beginPath(); x.moveTo(f[0], -10);
      x.quadraticCurveTo(f[0] + f[2] * .35, f[1] - 3, f[0] + f[2], -9);
      x.lineTo(f[0] + f[2], -7); x.lineTo(f[0], -7); x.closePath(); x.fill();
    });
    x.fillStyle = "#39ff88"; x.fillRect(-100, -15, 200, 4); // side skirt
    // grille + tri-spoke star badge (drawn as shapes)
    x.fillStyle = "#14171d"; H.rr(x, 82, -34, 18, 20, 5); x.fill();
    x.strokeStyle = "#3a4152"; x.lineWidth = 1.5; H.rr(x, 82, -34, 18, 20, 5); x.stroke();
    x.strokeStyle = "#c8d2f0"; x.lineWidth = 1.5;
    x.beginPath(); x.arc(91, -24, 6, 0, 7); x.stroke();
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * 2.094; x.beginPath(); x.moveTo(91, -24); x.lineTo(91 + Math.cos(a) * 6, -24 + Math.sin(a) * 6); x.stroke(); }
    // wheels — purple ring accents
    [-62, 60].forEach(wx => {
      x.fillStyle = "#0a0a0d"; x.beginPath(); x.arc(wx, 0, 17, 0, 7); x.fill();
      x.fillStyle = "#2b303c"; x.beginPath(); x.arc(wx, 0, 8, 0, 7); x.fill();
      x.strokeStyle = "#7a4fe0"; x.lineWidth = 1.5; x.beginPath(); x.arc(wx, 0, 11.5, 0, 7); x.stroke();
    });
    if (lightsOn) {
      const g = x.createLinearGradient(100, -18, 250, 4);
      g.addColorStop(0, "rgba(190,255,230,.5)"); g.addColorStop(1, "rgba(190,255,230,0)");
      x.fillStyle = g; x.beginPath(); x.moveTo(98, -24); x.lineTo(254, -6); x.lineTo(254, 8); x.lineTo(98, -5); x.closePath(); x.fill();
      x.save(); x.shadowColor = "#c8ffe8"; x.shadowBlur = 16; x.fillStyle = "#eafff4"; x.fillRect(92, -28, 9, 11); x.restore();
      x.save(); x.shadowColor = "#ff2233"; x.shadowBlur = 12; x.fillStyle = "#ff2233"; x.fillRect(-102, -32, 6, 12); x.restore();
    }
    x.restore();
  }

  // rain streaks + speed lines, shared by the street shots
  function rain727(x, tm, n) {
    x.strokeStyle = "rgba(150,170,220,.22)"; x.lineWidth = 1.5;
    for (let i = 0; i < (n || 40); i++) {
      const px = (i * 67 + tm * .9) % LW, py = BAR + ((i * 91 + tm * 1.7) % (LH - 2 * BAR));
      x.beginPath(); x.moveTo(px, py); x.lineTo(px - 5, py + 16); x.stroke();
    }
  }
  function speed727(x, tm, col) {
    x.strokeStyle = col || "rgba(57,211,255,.3)"; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const py = BAR + 120 + i * 48, off = (tm * 2.2 + i * 160) % (LW + 300);
      x.beginPath(); x.moveTo(LW - off, py); x.lineTo(LW - off + 90, py); x.stroke();
    }
  }

  // ---------- shots ----------
  const KRUN_SHOTS = [
    {
      dur: 2400, cap: "NEW HAVEN — 11:48 PM. TWO NIGHTS AFTER THE HANDOFF.", draw(x, tm) {
        H.bg(x, "#0a0d1c"); H.cityGlow(x, tm, 46); rain727(x, tm, 34);
        H.txt(x, "11:48 PM", 70, BAR + 42, 22, CYAN, "left", true);
        merc727(x, 880, LH - BAR - 66, 1.15, true, tm);
        H.k(x, 620, LH - BAR - 50, 150, "deck");
        H.txt(x, "K", 620, LH - BAR - 220, 16, GREEN, "center", true);
        H.mike(x, "down0", 300, LH - BAR - 50, 150);
        x.fillStyle = "rgba(57,255,136,.04)"; x.fillRect(0, BAR, LW, LH - 2 * BAR);
      }
    },
    {
      dur: 2400, cap: "GHOST FLAMES — GREEN INTO PURPLE. SHE BUILDS THEM QUIET.", draw(x, tm) {
        H.bg(x, "#0b0a16");
        merc727(x, LW / 2, LH - BAR - 150, 2.2, true, tm);
        const p = .5 + .5 * Math.sin(tm / 300);
        x.save(); x.globalAlpha = .25 + p * .3;
        const ug = x.createLinearGradient(LW / 2 - 220, 0, LW / 2 + 220, 0);
        ug.addColorStop(0, "#a06bff"); ug.addColorStop(1, "#2ee06f");
        x.fillStyle = ug; x.fillRect(LW / 2 - 220, LH - BAR - 148, 440, 12);
        x.restore();
        H.panel(x, LW / 2 - 200, BAR + 60, 400, 56, "#14101e");
        H.txt(x, "MERCEDES — GHOST SPEC", LW / 2, BAR + 80, 15, PUR, "center", true);
        H.txt(x, "UNREGISTERED · UNTRACKED", LW / 2, BAR + 102, 12, DIM, "center", true);
      }
    },
    {
      dur: 2600, cap: "\"You took the keys. Now see what they open.\"", draw(x, tm) {
        H.bg(x, "#0a0d1c"); H.cityGlow(x, tm, 30); rain727(x, tm, 24);
        merc727(x, 940, LH - BAR - 60, 1.0, true, tm);
        H.k(x, 460, LH - BAR - 50, 165, "deck");
        H.mike(x, "down0", 640, LH - BAR - 50, 160);
        H.bubble(x, "You took the keys.", 240, BAR + 80, 280);
        H.bubble(x, "Now see what they open.", 270, BAR + 155, 330);
      }
    },
    {
      dur: 0, cap: "K tosses you a spare comm. Your call how you ride.", choice: {
        prompt: "THE NIGHT RUN — HOW DO YOU RIDE?",
        options: ["1 — RIDE SHOTGUN WITH K", "2 — FOLLOW IN THE CHARGER"],
        values: ["shotgun", "charger"],
        store: "_v727krun"
      }, draw(x, tm) {
        H.bg(x, "#0b0a16"); H.cityGlow(x, tm, 26); rain727(x, tm, 20);
        merc727(x, 880, LH - BAR - 70, 1.25, true, tm);
        H.k(x, 560, LH - BAR - 50, 155, "deck");
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 320, LH - BAR - 50, 155);
        // the tossed comm — a small glowing deck mid-air
        const bx = 440 + Math.sin(tm / 260) * 8, by = LH - BAR - 220 + Math.cos(tm / 260) * 6;
        x.fillStyle = "#1a2030"; H.rr(x, bx - 11, by - 15, 22, 30, 3); x.fill();
        x.fillStyle = GREEN; x.fillRect(bx - 7, by - 9, 14, 3); x.fillRect(bx - 7, by - 2, 14, 3);
      }
    },
    {
      dur: 2600, cap: "NODE BY NODE — DROP SITES, DEAD DROPS, SAFE HOUSES.", draw(x, tm) {
        H.bg(x, "#0a0e20"); H.cityGlow(x, tm, 60); speed727(x, tm);
        const follow = (meta727() || {})._v727krun === "charger";
        merc727(x, 760, LH - BAR - 90, 1.5, true, tm);
        if (follow && window.v722 && v722.car) { try { v722.car(x, 400, LH - BAR - 70, 1.0, false, true); } catch (e) { } }
        if (!follow) { H.k(x, 745, LH - BAR - 200, 90, "deck"); H.mike(x, "down0", 800, LH - BAR - 198, 88); }
        x.fillStyle = "rgba(160,107,255,.05)"; x.fillRect(0, BAR, LW, LH - 2 * BAR);
      }
    },
    {
      dur: 2600, cap: "THE RESISTANCE NETWORK, ON A MAP ONLY K CAN SEE.", draw(x, tm) {
        H.bg(x, "#0a1020");
        H.twinCity(x, tm, 140, BAR + 70, 1000, 380, true);
        // nodes waking up one by one
        for (let i = 0; i < 6; i++) {
          const on = tm > 400 + i * 320;
          const nx = 240 + (i * 173) % 860, ny = BAR + 120 + (i * 97) % 280;
          x.fillStyle = on ? GREEN : "#1a2140";
          x.beginPath(); x.arc(nx, ny, on ? 8 : 5, 0, 7); x.fill();
          if (on) { x.strokeStyle = "rgba(57,255,136,.5)"; x.lineWidth = 2; x.beginPath(); x.arc(nx, ny, 12 + (tm / 60 + i * 7) % 10, 0, 7); x.stroke(); }
        }
        H.panel(x, LW / 2 - 260, BAR + 90, 520, 60, "rgba(10,20,15,.9)");
        x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 260, BAR + 90, 520, 60, 8); x.stroke();
        H.txt(x, "RESISTANCE NETWORK — 6 NODES ONLINE", LW / 2, BAR + 120, 16, GREEN, "center", true);
      }
    },
    {
      dur: 2400, cap: "\"Orpheus listens. We answer first.\"", draw(x, tm) {
        H.bg(x, "#0d1024"); H.rackRow(x, tm, BAR + 90, 8, .3);
        H.k(x, 480, LH - BAR - 50, 170, "fist");
        H.mike(x, "down0", 760, LH - BAR - 50, 162);
        H.bubble(x, "Orpheus listens.", 560, BAR + 90, 250);
        H.bubble(x, "We answer first.", 590, BAR + 165, 240);
      }
    },
    {
      dur: 3000, cap: "K — DIRECT LINE UNLOCKED. NIGHT CONTRACTS WILL CALL.", draw(x, tm) {
        H.bg(x, "#0a140f"); H.cityGlow(x, tm, 20);
        merc727(x, 900, LH - BAR - 60, 1.05, true, tm);
        H.k(x, 640, LH - BAR - 50, 150, "fist");
        H.mike(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", 400, LH - BAR - 50, 155);
        H.panel(x, LW / 2 - 380, BAR + 70, 760, 110, "rgba(10,20,15,.92)");
        x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 380, BAR + 70, 760, 110, 8); x.stroke();
        H.check(x, LW / 2 - 330, BAR + 102, 30, GREEN);
        H.txt(x, "K — DIRECT LINE UNLOCKED", LW / 2 + 20, BAR + 108, 20, GREEN, "center", true);
        H.txt(x, "NIGHT CONTRACTS WILL CALL", LW / 2 + 20, BAR + 148, 14, DIM, "center", true);
        const pick = (meta727() || {})._v727krun;
        H.txt(x, pick === "charger" ? "You followed in the Charger. She approved." : "You rode shotgun. She drove like the city owed her.",
          LW / 2, BAR + 210, 15, DIM, "center");
      }
    }
  ];

  v725.register("krun", {
    title: "K — THE NIGHT RUN",
    shots: KRUN_SHOTS,
    cues: { 1: "beep620", 3: "chime", 5: "beep520", 7: "chime" }
  });

  // ---------- exactly-once reward ----------
  function applyRewards727(id) {
    const m = meta727(); if (!m) return;
    try { if (id === "krun" && m._v727krun) m._v727kLine = true; } catch (e) { }
  }

  // ---------- trigger — outermost checkDayEnd wrap (after v7.26) ----------
  const _checkDayEnd727 = checkDayEnd;
  function pending727(s) {
    const m = s.meta || (s.meta = {});
    const day = m.day || s.day || 0;
    if (day >= 17 && m._v725city && !m._v727krun) return "krun";
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
        const id = pending727(s);
        const day = s.meta.day || s.day;
        const done = (s.ticketsDone >= s.ticketsTotal) || force;
        if (id && done && s.meta._v727Day !== day) {
          s.meta._v727Day = day;
          s.meta._v726Day = day; // one cinematic per day across all packs
          s.meta._v725Day = day;
          const ok = v725.play(id, function () {
            _checkDayEnd727(force); // day-end flow first…
            applyRewards727(id);    // …then the unlock lands on top, exactly once
          });
          if (ok) return;
        }
      }
    } catch (e) { window.__err727 = String(e && e.stack || e); }
    return _checkDayEnd727(force);
  };

  window.v727 = {
    version: VER,
    scenes: ["krun"],
    play: (id) => v725.play(id || "krun", null),
    active: () => v725.active(),
    merc: merc727, // K's Mercedes draw, shared for future scenes
    unlocks: () => {
      const m = meta727() || {};
      return { krun: m._v727krun || null, kLine: !!m._v727kLine };
    }
  };
})();

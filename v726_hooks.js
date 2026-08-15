/* ==========================================================================
   v7.26 — STORY PACK II (three more boards on the SHARED v7.25 engine)
   No parallel framework: scenes are registered into the v7.25 cinematic
   engine via v725.register(id, {title, shots, cues}) and drawn with the
   shared helper kit (v725.h). All choices persist in S.meta; rewards are
   applied exactly once. Boards adapted:
     E. DAY 8 — SHADOWS BETWEEN THE RACKS (day >= 8, day-end)
        Felicia's backdoor terminal, "Trust is earned.", UNAUTHORIZED
        TRAFFIC DETECTED, then the three-way call: TRACE THE SOURCE /
        CONTAIN THE BREACH / CONFRONT THE ENEMY (stored in
        S.meta._v726racks + a matching unlock flag: _v726deepMap /
        _v726emergProto / _v726counterstrike).
     F. CITY LIFE — FOUR HOURS TO YOURSELF (day >= 13, day-end)
        4:07 PM badge-out, the evening menu — HOME / GYM / COFFEE SHOP /
        NIGHT CRAWL (stored in S.meta._v726evening), then the unwind:
        ENERGY RESTORED +25 (real: HP heal) · PURPOSE +10 (real: -stress),
        applied exactly once.
     G. PROMOTION DAY — RUNNING THE DEPARTMENT (day >= 16, day-end)
        TECHOPS ADMIN II plaque, GLOBAL ALERT — 5 sites disconnected,
        tasking the crew (Amit/Nick/Jess/Priya/Dev), ROOT CAUSE:
        NETWORK POLICY PUSH (GLOBAL) #POL-7742, the rollback choice
        (GLOBAL / STAGED, stored in S.meta._v726rollback), ALL GREEN,
        "Nice first day, Administrator." NEW ROLE UNLOCKED —
        TECHOPS ADMIN II · ABILITY: DELEGATE.
   Canon rules hold: Mike from the real player atlas, Felicia only from
   her own v6.4 atlas, glyphs drawn as shapes (no emoji), AeroTech /
   New Haven naming. One cinematic per day across BOTH packs (the v7.26
   wrap suppresses the v7.25 latch for the day when it plays).
   ========================================================================== */
(function () {
  const VER = "7.26";
  if (window.v726) return;
  if (!window.v725 || !v725.register) { window.__err726 = "v725 engine missing"; return; }
  const H = v725.h;
  const LW = H.LW, LH = H.LH, BAR = H.BAR;
  const CYAN = H.CYAN, GREEN = H.GREEN, RED = H.RED, AMBER = H.AMBER, PUR = H.PUR,
    INK = H.INK, DIM = H.DIM, GOLD = H.GOLD;

  const meta726 = () => (typeof S !== "undefined" && S.meta) ? S.meta : null;
  const metaGet = (k) => { const m = meta726(); return m ? m[k] : undefined; };

  // ---------- small local props (built from the shared kit, shapes only) ----------
  function mug726(x, a, b, s) {
    x.fillStyle = "#3f6b4f"; H.rr(x, a, b, 20 * s, 26 * s, 3 * s); x.fill();
    x.strokeStyle = "#2b4a38"; x.lineWidth = 2 * s; x.beginPath(); x.arc(a + 24 * s, b + 13 * s, 7 * s, -1.2, 1.2); x.stroke();
    H.txt(x, "ROOT", a + 10 * s, b + 13 * s, 8 * s, INK, "center", true);
  }
  function warnTri726(x, cx, cy, s, col) {
    x.strokeStyle = col || RED; x.lineWidth = s * .14; x.lineJoin = "round";
    x.beginPath(); x.moveTo(cx, cy - s * .6); x.lineTo(cx + s * .62, cy + s * .45); x.lineTo(cx - s * .62, cy + s * .45); x.closePath(); x.stroke();
    x.fillStyle = col || RED; x.fillRect(cx - s * .05, cy - s * .22, s * .1, s * .34); x.fillRect(cx - s * .05, cy + s * .2, s * .1, s * .1);
  }
  function skull726(x, cx, cy, s) {
    x.strokeStyle = RED; x.lineWidth = s * .12;
    x.beginPath(); x.arc(cx, cy - s * .1, s * .5, Math.PI * .95, Math.PI * 2.05); x.stroke();
    x.beginPath(); x.moveTo(cx - s * .42, cy + s * .1); x.lineTo(cx - s * .3, cy + s * .5); x.lineTo(cx + s * .3, cy + s * .5); x.lineTo(cx + s * .42, cy + s * .1); x.stroke();
    x.fillStyle = RED; x.beginPath(); x.arc(cx - s * .18, cy - s * .08, s * .1, 0, 7); x.arc(cx + s * .18, cy - s * .08, s * .1, 0, 7); x.fill();
  }
  function note726(x, cx, cy, s, col) {
    x.strokeStyle = col || PUR; x.fillStyle = col || PUR; x.lineWidth = s * .12;
    x.beginPath(); x.ellipse(cx, cy, s * .28, s * .2, -.3, 0, 7); x.fill();
    x.beginPath(); x.moveTo(cx + s * .24, cy - s * .05); x.lineTo(cx + s * .24, cy - s * .75); x.stroke();
    x.beginPath(); x.moveTo(cx + s * .24, cy - s * .75); x.quadraticCurveTo(cx + s * .6, cy - s * .6, cx + s * .62, cy - s * .3); x.stroke();
  }
  // Simplified world map: dotted landmasses + labeled site markers
  const SITES726 = [
    ["NEW HAVEN", .28, .38], ["TORONTO", .24, .30], ["MEXICO", .20, .52],
    ["BERLIN", .52, .28], ["TOKYO", .82, .40]
  ];
  function worldMap726(x, tm, a0, b0, w, h, down, linked) {
    H.panel(x, a0, b0, w, h, "#0a1020");
    for (let i = 0; i < 260; i++) { // dot-grid "landmass" noise
      const px = a0 + 14 + (i * 53) % (w - 28), py = b0 + 14 + (i * 37) % (h - 28);
      const land = Math.sin(px * .021) + Math.cos(py * .033) > .35;
      if (land) { x.fillStyle = "rgba(43,53,80,.9)"; x.fillRect(px, py, 3, 3); }
    }
    const pts = [];
    SITES726.forEach((s, i) => {
      const px = a0 + s[1] * w, py = b0 + s[2] * h; pts.push([px, py]);
      const bad = down && down[i];
      const pulse = ((tm / 400 + i) | 0) % 2 === 0;
      if (bad) { H.xmark(x, px - 8, py - 8, 16, RED); if (pulse) { x.fillStyle = "rgba(255,68,85,.25)"; x.beginPath(); x.arc(px, py, 16, 0, 7); x.fill(); } }
      else { x.fillStyle = GREEN; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill(); if (pulse) { x.strokeStyle = "rgba(57,255,136,.5)"; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 10, 0, 7); x.stroke(); } }
      H.txt(x, s[0], px, py + (i % 2 ? 22 : -18), 11, bad ? RED : (linked ? GREEN : DIM), "center", true);
      if (bad) H.txt(x, "DISCONNECTED", px, py + (i % 2 ? 36 : -32), 9, RED, "center", true);
      else if (linked) H.txt(x, "CONNECTED", px, py + (i % 2 ? 36 : -32), 9, GREEN, "center", true);
    });
    if (linked) {
      x.strokeStyle = "rgba(57,255,136,.55)"; x.lineWidth = 2;
      for (let i = 1; i < pts.length; i++) { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); x.lineTo(pts[i][0], pts[i][1]); x.stroke(); }
    }
  }

  // ==========================================================================
  // SCENE E — DAY 8: SHADOWS BETWEEN THE RACKS
  // ==========================================================================
  const RACKS_SHOTS = [
    {
      dur: 2300, cap: "A blank panel. A green glow. BACKDOOR CHANNEL ESTABLISHED.", draw(x, tm) {
        H.bg(x, "#0a0e1c"); H.rackRow(x, tm, BAR + 70, 8, .5);
        H.panel(x, 860, BAR + 150, 260, 120, "#0a140f");
        x.strokeStyle = GREEN; x.lineWidth = 2; H.rr(x, 860, BAR + 150, 260, 120, 8); x.stroke();
        H.txt(x, "BACKDOOR", 990, BAR + 185, 14, GREEN, "center", true);
        H.txt(x, "CHANNEL", 990, BAR + 207, 14, GREEN, "center", true);
        H.txt(x, "ESTABLISHED", 990, BAR + 229, 14, GREEN, "center", true);
        if (((tm / 300) | 0) % 2) { x.fillStyle = "rgba(57,255,136,.12)"; x.fillRect(864, BAR + 154, 252, 112); }
        H.felicia(x, "right0", 820, BAR + 420, 150, false);
      }
    },
    {
      dur: 2300, cap: "\"That panel's supposed to be sealed shut.\"", draw(x, tm) {
        H.bg(x); H.rackRow(x, tm, BAR + 70, 9, .4);
        H.mike(x, "down0", 420, LH - BAR - 60, 165); mug726(x, 470, LH - BAR - 180, 1);
        x.fillStyle = "rgba(57,255,136,.08)"; x.fillRect(980, BAR + 60, 300, LH - 2 * BAR - 60);
        H.silhouette(x, 1130, BAR + 330, 120, "#241a2e");
        H.bubble(x, "That panel's supposed", 500, BAR + 90, 320);
        H.bubble(x, "to be sealed shut.", 540, BAR + 165, 240);
      }
    },
    {
      dur: 2100, cap: "He approaches — careful. QUIET ZONE.", draw(x, tm) {
        H.bg(x, "#080b16");
        for (let i = 0; i < 4; i++) { // corridor racks both sides
          x.fillStyle = "#10152a"; x.fillRect(60 + i * 90, BAR + 80 + i * 12, 70, 420 - i * 24);
          x.fillRect(1150 - i * 90, BAR + 80 + i * 12, 70, 420 - i * 24);
          x.fillStyle = ((tm / 300 + i) | 0) % 3 ? "rgba(57,211,255,.6)" : "#1a2140";
          x.fillRect(72 + i * 90, BAR + 100 + i * 12, 8, 8); x.fillRect(1162 - i * 90, BAR + 100 + i * 12, 8, 8);
        }
        H.panel(x, 560, BAR + 120, 160, 60, "#1a1020");
        H.txt(x, "QUIET", 640, BAR + 142, 16, RED, "center", true);
        H.txt(x, "ZONE", 640, BAR + 166, 16, RED, "center", true);
        H.mike(x, "right0" in PLAYER_ATLAS.frames ? "right0" : "down0", 560, LH - BAR - 50, 150);
        H.silhouette(x, 700, BAR + 380, 90, "#241a2e");
      }
    },
    {
      dur: 2500, cap: "\"We don't hide in the dark from each other, Felicia.\"", draw(x, tm) {
        H.bg(x, "#0b0e1c"); H.rackRow(x, tm, BAR + 90, 7, .3);
        H.mike(x, "right0" in PLAYER_ATLAS.frames ? "right0" : "down0", 460, LH - BAR - 60, 170);
        H.felicia(x, "down0", 800, LH - BAR - 60, 165, true);
        H.bubble(x, "We don't hide in the dark", 170, BAR + 80, 360);
        H.bubble(x, "from each other, Felicia.", 210, BAR + 155, 320);
      }
    },
    {
      dur: 2700, cap: "\"Trust is earned. And you haven't earned the whole story.\"", draw(x, tm) {
        H.bg(x, "#0d0a18");
        H.felicia(x, "down0", LW / 2, LH - BAR - 40, 260, false);
        H.bubble(x, "Trust is earned.", 140, BAR + 90, 260);
        H.bubble(x, "And you haven't earned", 800, BAR + 90, 340);
        H.bubble(x, "the whole story.", 860, BAR + 165, 240);
      }
    },
    {
      dur: 2500, cap: "\"There's a group pulling strings from outside this company.\"", draw(x, tm) {
        H.bg(x); H.rackRow(x, tm, BAR + 90, 7, .3);
        H.mike(x, "down0", 430, LH - BAR - 60, 165); H.felicia(x, "down0", 830, LH - BAR - 60, 160, true);
        warnTri726(x, 640, BAR + 120, 60, AMBER);
        H.bubble(x, "There's a group pulling strings", 140, BAR + 70, 400);
        H.bubble(x, "from outside this company.", 700, BAR + 70, 380);
      }
    },
    {
      dur: 2500, cap: "\"To stop them. Before they turn this place into a weapon.\"", draw(x, tm) {
        H.bg(x, "#0b0e1c");
        H.felicia(x, "right0", 620, LH - BAR - 60, 170, false);
        H.mike(x, "down0", 940, LH - BAR - 60, 165);
        mug726(x, 900, LH - BAR - 190, 1);
        H.bubble(x, "To stop them. Before they", 180, BAR + 90, 360);
        H.bubble(x, "turn this place into a weapon.", 220, BAR + 165, 400);
      }
    },
    {
      dur: 2400, cap: "UNAUTHORIZED TRAFFIC DETECTED — SOURCE: INTERNAL · SEVERITY: CRITICAL", draw(x, tm) {
        H.bg(x, "#160a10");
        if (((tm / 350) | 0) % 2) { x.fillStyle = "rgba(255,68,85,.08)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); }
        H.panel(x, LW / 2 - 380, BAR + 110, 760, 260, "#1c0a10");
        x.strokeStyle = RED; x.lineWidth = 3; H.rr(x, LW / 2 - 380, BAR + 110, 760, 260, 10); x.stroke();
        warnTri726(x, LW / 2 - 310, BAR + 180, 46, RED);
        H.txt(x, "UNAUTHORIZED", LW / 2 + 20, BAR + 165, 26, RED, "center", true);
        H.txt(x, "TRAFFIC DETECTED", LW / 2 + 20, BAR + 200, 26, RED, "center", true);
        skull726(x, LW / 2 + 300, BAR + 180, 30);
        H.txt(x, "SOURCE: INTERNAL", LW / 2, BAR + 260, 16, INK, "center", true);
        H.txt(x, "SEVERITY: CRITICAL", LW / 2, BAR + 290, 16, RED, "center", true);
        H.bar(x, LW / 2 - 250, BAR + 320, 500, 14, (tm % 1600) / 1600, RED);
        H.silhouette(x, 180, LH - BAR - 40, 130, "#241a2e"); H.silhouette(x, 1100, LH - BAR - 40, 130, "#1a2438");
      }
    },
    {
      dur: 2500, cap: "\"Looks like our shadow just stepped into the light.\"", draw(x, tm) {
        H.bg(x, "#0d0a18"); H.rackRow(x, tm, BAR + 90, 7, .35);
        H.felicia(x, "right0", 500, LH - BAR - 60, 165, false);
        H.mike(x, "down0", 780, LH - BAR - 60, 170);
        H.bubble(x, "Looks like our shadow just", 300, BAR + 80, 380);
        H.bubble(x, "stepped into the light.", 360, BAR + 155, 300);
      }
    },
    {
      dur: 0, cap: "OPTION A: TRACE THE SOURCE — RISK: HIGH · OPTION B: CONTAIN THE BREACH — RISK: MEDIUM", draw(x, tm) {
        H.bg(x, "#0a0f1e");
        H.panel(x, LW / 2 - 400, BAR + 60, 800, 300, "#0a1020");
        H.txt(x, "THREAT ORIGIN", LW / 2, BAR + 92, 16, RED, "center", true);
        worldMap726(x, tm, LW / 2 - 360, BAR + 110, 720, 220, [0, 1, 1, 0, 1], false);
        x.strokeStyle = RED; x.lineWidth = 2; x.beginPath(); x.arc(LW / 2 + 60, BAR + 210, 26, 0, 7); x.stroke();
        x.beginPath(); x.arc(LW / 2 + 60, BAR + 210, 14, 0, 7); x.stroke();
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 480, LH - BAR - 40, 140);
        H.felicia(x, "up0", 800, LH - BAR - 40, 138, false);
      },
      choice: {
        prompt: "THEY HAVE A CHOICE.",
        options: [
          "TRACE THE SOURCE — UNLOCK: DEEP NETWORK MAP",
          "CONTAIN THE BREACH — UNLOCK: EMERGENCY PROTOCOLS",
          "CONFRONT THE ENEMY — UNLOCK: COUNTERSTRIKE TOOLKIT"
        ],
        values: ["trace", "contain", "confront"],
        store: "_v726racks"
      }
    },
    {
      dur: 2800, cap: "\"Let's find out who's really pulling the strings.\" — \"Then we cut them.\"", draw(x, tm) {
        H.bg(x, "#0b0e1c"); H.rackRow(x, tm, BAR + 80, 8, .4);
        H.panel(x, 880, BAR + 90, 300, 180, "#0a140f");
        H.txt(x, "TRACE ACTIVE", 1030, BAR + 120, 14, GREEN, "center", true);
        H.bar(x, 910, BAR + 145, 240, 12, .72, GREEN);
        const pick = metaGet("_v726racks");
        H.txt(x, pick === "contain" ? "LOCKING DOWN SEGMENTS" : pick === "confront" ? "ARMING COUNTERSTRIKE" : "FOLLOWING THE TRAFFIC",
          1030, BAR + 185, 11, DIM, "center", true);
        H.mike(x, "down0", 480, LH - BAR - 50, 165); H.felicia(x, "laptop" in FEL_ATLAS.frames ? "laptop" : "down0", 700, LH - BAR - 50, 160, false);
        H.bubble(x, "Let's find out who's really", 130, BAR + 70, 380);
        H.bubble(x, "pulling the strings.", 170, BAR + 145, 260);
        H.bubble(x, "Then we cut them.", 960, BAR + 300, 240);
        H.txt(x, "UNLOCKED: " + (pick === "contain" ? "EMERGENCY PROTOCOLS" : pick === "confront" ? "COUNTERSTRIKE TOOLKIT" : "DEEP NETWORK MAP"),
          LW / 2, BAR + 42, 16, GOLD, "center", true);
      }
    }
  ];

  // ==========================================================================
  // SCENE F — CITY LIFE: FOUR HOURS TO YOURSELF
  // ==========================================================================
  const CITYLIFE_SHOTS = [
    {
      dur: 2100, cap: "4:07 PM — badge out. GOOD SHIFT, MIKE.", draw(x, tm) {
        H.bg(x); H.cityGlow(x, tm, 18);
        H.panel(x, 880, BAR + 90, 220, 200, "#10152a");
        H.txt(x, "BADGE OUT", 990, BAR + 130, 15, DIM, "center", true);
        H.check(x, 966, BAR + 150, 48, GREEN);
        H.txt(x, "GOOD SHIFT", 990, BAR + 230, 13, GREEN, "center", true);
        H.txt(x, "MIKE", 990, BAR + 252, 13, GREEN, "center", true);
        H.txt(x, "4:07 PM", 200, BAR + 60, 22, CYAN, "left", true);
        H.mike(x, "right0" in PLAYER_ATLAS.frames ? "right0" : "down0", 640, LH - BAR - 60, 170);
        x.fillStyle = "#1a2030"; x.fillRect(1050, BAR + 120, 140, 300); // parked SUV hint
        x.fillStyle = "#39d3ff"; x.fillRect(1062, BAR + 140, 30, 16);
      }
    },
    {
      dur: 2200, cap: "The evening is his.", draw(x, tm) {
        H.bg(x, "#0d0a18"); H.cityGlow(x, tm, 30);
        // windshield frame
        x.fillStyle = "rgba(10,14,28,.85)"; x.fillRect(0, LH - BAR - 190, LW, 190);
        x.strokeStyle = "#1a2030"; x.lineWidth = 10; x.beginPath(); x.arc(330, LH - BAR + 60, 130, Math.PI, 0); x.stroke(); // wheel
        H.panel(x, 760, BAR + 100, 380, 260, "#10152a");
        const rows = [["HOME", GREEN], ["GYM", DIM], ["COFFEE SHOP", DIM], ["NIGHT CRAWL", PUR]];
        rows.forEach((r, i) => {
          H.txt(x, r[0], 800, BAR + 140 + i * 56, 17, r[1], "left", true);
          x.strokeStyle = r[1]; x.lineWidth = 2; H.rr(x, 780, BAR + 120 + i * 56, 320, 40, 6); x.stroke();
        });
        H.mike(x, "down0", 420, LH - BAR - 90, 150);
      }
    },
    {
      dur: 0, cap: "The city can wait. Or it can't.", draw(x, tm) {
        H.bg(x, "#0d0a18"); H.cityGlow(x, tm, 34);
        H.mike(x, "down0", LW / 2, LH - BAR - 40, 150);
      },
      choice: {
        prompt: "FOUR HOURS TO YOURSELF.",
        options: [
          "HOME — cook, music, the rig",
          "GYM — burn the stress off",
          "COFFEE SHOP — refuel and people-watch",
          "NIGHT CRAWL — the streets call"
        ],
        values: ["home", "gym", "coffee", "crawl"],
        store: "_v726evening"
      }
    },
    {
      dur: 2400, cap: "Home. The rig, the certs, the quiet.", draw(x, tm) {
        H.bg(x, "#141020");
        // window skyline
        H.panel(x, 60, BAR + 60, 420, 220, "#0a0f1e"); H.cityGlow(x, tm, 10);
        // cert frames
        const certs = ["CompTIA Sec+", "Cisco CCNA", "AWS Architect"];
        certs.forEach((c, i) => {
          H.panel(x, 560 + i * 210, BAR + 70, 180, 90, "#1a2030");
          H.txt(x, c, 650 + i * 210, BAR + 100, 12, GOLD, "center", true);
          H.check(x, 638 + i * 210, BAR + 118, 22, GOLD);
        });
        // guitar on wall
        x.strokeStyle = "#8a5a2a"; x.lineWidth = 8; x.beginPath(); x.moveTo(1160, BAR + 80); x.lineTo(1160, BAR + 200); x.stroke();
        x.fillStyle = "#8a5a2a"; x.beginPath(); x.ellipse(1160, BAR + 230, 34, 44, 0, 0, 7); x.fill();
        // desk + monitors
        x.fillStyle = "#1a2030"; x.fillRect(420, LH - BAR - 190, 440, 18);
        H.panel(x, 450, LH - BAR - 330, 180, 130, "#0a0f1e"); H.panel(x, 650, LH - BAR - 330, 180, 130, "#0a0f1e");
        H.mike(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", 730, LH - BAR - 340, 96); // mini mike on screen
        H.txt(x, "TechOps Hero", 740, LH - BAR - 350, 11, CYAN, "center", true);
        H.mike(x, "down0", 320, LH - BAR - 40, 160);
      }
    },
    {
      dur: 2200, cap: "Cook something real. Music on.", draw(x, tm) {
        H.bg(x, "#18122a");
        x.fillStyle = "#232838"; x.fillRect(200, LH - BAR - 210, 380, 20); // counter
        x.fillStyle = "#101318"; x.beginPath(); x.ellipse(390, LH - BAR - 220, 90, 22, 0, 0, 7); x.fill(); // pan
        const veg = ["#39ff88", "#ff4455", "#ffb347"];
        for (let i = 0; i < 9; i++) { x.fillStyle = veg[i % 3]; x.fillRect(330 + (i * 17) % 110, LH - BAR - 228 - (i % 3) * 4, 10, 8); }
        x.strokeStyle = "rgba(232,236,255,.4)"; x.lineWidth = 3; // steam
        for (let i = 0; i < 3; i++) { const sy = LH - BAR - 260 - ((tm / 12 + i * 40) % 60); x.beginPath(); x.moveTo(360 + i * 30, sy); x.quadraticCurveTo(370 + i * 30, sy - 14, 360 + i * 30, sy - 26); x.stroke(); }
        note726(x, 700, BAR + 120 + ((tm / 500) | 0) % 2 * 8, 30); note726(x, 780, BAR + 160, 24, CYAN); note726(x, 850, BAR + 110, 20, GOLD);
        H.mike(x, "down0", 250, LH - BAR - 40, 160);
      }
    },
    {
      dur: 2200, cap: "FOCUS MODE 1:00:00 — ship something of your own.", draw(x, tm) {
        H.bg(x, "#0a0d18");
        H.panel(x, LW / 2 - 130, BAR + 60, 260, 60, "#10152a");
        H.txt(x, "FOCUS MODE", LW / 2, BAR + 84, 14, CYAN, "center", true);
        H.txt(x, "1:00:00", LW / 2, BAR + 106, 15, INK, "center", true);
        H.panel(x, LW / 2 - 260, BAR + 160, 520, 260, "#0a0f1e");
        x.strokeStyle = H.EDGE; x.lineWidth = 2; H.rr(x, LW / 2 - 260, BAR + 160, 520, 260, 8); x.stroke();
        for (let i = 0; i < 10; i++) { // code lines
          x.fillStyle = i % 3 ? "rgba(57,211,255,.5)" : "rgba(57,255,136,.5)";
          x.fillRect(LW / 2 - 230, BAR + 185 + i * 21, 60 + (i * 67) % 260, 8);
        }
        H.mike(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", LW / 2 - 330, LH - BAR - 40, 150);
        mug726(x, LW / 2 + 300, LH - BAR - 120, 1.1);
      }
    },
    {
      dur: 2800, cap: "11:00 PM — ENERGY RESTORED +25 · PURPOSE +10", draw(x, tm) {
        H.bg(x, "#0d0a18");
        H.panel(x, 800, BAR + 70, 380, 260, "#0a0f1e");
        H.cityGlow(x, tm, 12);
        H.txt(x, "11:00 PM", 990, BAR + 310, 16, CYAN, "center", true);
        H.mike(x, "down0", 420, LH - BAR - 40, 165); mug726(x, 470, LH - BAR - 180, 1);
        // reward banner
        H.panel(x, LW / 2 - 430, BAR + 30, 860, 64, "rgba(10,20,15,.92)");
        x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 430, BAR + 30, 860, 64, 8); x.stroke();
        x.fillStyle = RED; x.beginPath(); x.arc(LW / 2 - 370, BAR + 62, 11, 0, 7); x.fill(); // heart-ish
        H.txt(x, "ENERGY RESTORED +25", LW / 2 - 160, BAR + 62, 18, GREEN, "center", true);
        x.fillStyle = PUR; x.beginPath(); x.arc(LW / 2 + 120, BAR + 62, 11, 0, 7); x.fill(); // star-ish
        H.txt(x, "PURPOSE +10", LW / 2 + 300, BAR + 62, 18, PUR, "center", true);
      }
    }
  ];

  // ==========================================================================
  // SCENE G — PROMOTION DAY: RUNNING THE DEPARTMENT
  // ==========================================================================
  const PROMO_SHOTS = [
    {
      dur: 2200, cap: "AEROTECH TECHOPS OPERATIONS — the plaque is his now.", draw(x, tm) {
        H.bg(x); H.rackRow(x, tm, BAR + 60, 9, .35);
        H.panel(x, LW / 2 - 220, BAR + 80, 440, 90, "#10152a");
        H.txt(x, "AEROTECH", LW / 2, BAR + 112, 20, CYAN, "center", true);
        H.txt(x, "TECHOPS OPERATIONS", LW / 2, BAR + 144, 14, DIM, "center", true);
        x.fillStyle = "#1a2030"; x.fillRect(300, LH - BAR - 160, 680, 20); // desk
        x.fillStyle = "#8a6a2a"; H.rr(x, 460, LH - BAR - 200, 200, 44, 4); x.fill(); // plaque
        H.txt(x, "TECHOPS ADMIN II", 560, LH - BAR - 178, 14, "#0d0a04", "center", true);
        H.mike(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 800, LH - BAR - 40, 160);
        mug726(x, 380, LH - BAR - 200, 1);
      }
    },
    {
      dur: 2000, cap: "The crew approves.", draw(x, tm) {
        H.bg(x, "#0d1126"); H.cityGlow(x, tm, 14);
        H.mike(x, "down0", LW / 2, LH - BAR - 50, 175);
        H.junior(x, 340, LH - BAR - 50, 150, false); H.junior(x, 930, LH - BAR - 50, 150, false);
        H.silhouette(x, 200, LH - BAR - 50, 140, "#2b3550"); H.silhouette(x, 1080, LH - BAR - 50, 140, "#33284a");
        H.txt(x, "!", LW / 2 + 90, LH - BAR - 260, 34, GOLD, "center", true);
      }
    },
    {
      dur: 2500, cap: "GLOBAL ALERT — 5 AEROTECH SITES DISCONNECTED.", draw(x, tm) {
        H.bg(x, "#160a10");
        if (((tm / 350) | 0) % 2) { x.fillStyle = "rgba(255,68,85,.07)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); }
        H.panel(x, LW / 2 - 480, BAR + 40, 960, 64, "#1c0a10");
        x.strokeStyle = RED; x.lineWidth = 3; H.rr(x, LW / 2 - 480, BAR + 40, 960, 64, 8); x.stroke();
        warnTri726(x, LW / 2 - 420, BAR + 72, 34, RED); warnTri726(x, LW / 2 + 420, BAR + 72, 34, RED);
        H.txt(x, "GLOBAL ALERT", LW / 2, BAR + 62, 20, RED, "center", true);
        H.txt(x, "5 AEROTECH SITES DISCONNECTED", LW / 2, BAR + 88, 15, RED, "center", true);
        worldMap726(x, tm, 140, BAR + 130, 1000, 400, [1, 1, 1, 1, 1], false);
      }
    },
    {
      dur: 2200, cap: "Command center. Every site, one wall.", draw(x, tm) {
        H.bg(x, "#0a0f1e");
        H.panel(x, 60, BAR + 90, 220, 60, "#10152a");
        H.txt(x, "COMMAND", 170, BAR + 112, 15, INK, "center", true);
        H.txt(x, "CENTER", 170, BAR + 136, 15, INK, "center", true);
        worldMap726(x, tm, 320, BAR + 80, 900, 420, [1, 1, 1, 1, 1], false);
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 200, LH - BAR - 40, 150);
      }
    },
    {
      dur: 2600, cap: "AMIT — NEW HAVEN · NICK — MEXICO · JESS — BERLIN · PRIYA — TOKYO · DEV — TORONTO.", draw(x, tm) {
        H.bg(x); H.rackRow(x, tm, BAR + 60, 9, .25);
        const crew = [["NEW HAVEN", "NETWORK INVESTIGATE", "AMIT"], ["MEXICO", "VPN TUNNELS CHECK", "NICK"], ["BERLIN", "FIREWALLS REVIEW", "JESS"], ["TOKYO", "SERVICES VERIFY", "PRIYA"], ["TORONTO", "DNS & APPS CHECK", "DEV"]];
        crew.forEach((c, i) => {
          const ax = 60 + i * 238;
          H.panel(x, ax, BAR + 120, 220, 150, "#10152a");
          H.txt(x, c[0], ax + 110, BAR + 150, 15, RED, "center", true);
          const taskWords = c[1].split(" "), mid = Math.ceil(taskWords.length / 2);
          H.txt(x, taskWords.slice(0, mid).join(" "), ax + 110, BAR + 178, 10, DIM, "center", true);
          H.txt(x, taskWords.slice(mid).join(" "), ax + 110, BAR + 194, 10, DIM, "center", true);
          H.silhouette(x, ax + 110, BAR + 262, 44, "#2b3550");
          H.txt(x, c[2], ax + 110, BAR + 288, 13, CYAN, "center", true);
        });
        H.mike(x, "down0", LW / 2, LH - BAR - 40, 165);
        H.junior(x, 400, LH - BAR - 40, 145, false); H.junior(x, 880, LH - BAR - 40, 145, false);
      }
    },
    {
      dur: 2700, cap: "ROOT CAUSE ANALYSIS — CORRELATION COMPLETE: NETWORK POLICY PUSH (GLOBAL) · #POL-7742.", draw(x, tm) {
        H.bg(x, "#0a0f1e");
        H.panel(x, 100, BAR + 60, 620, 300, "#0a140f");
        H.txt(x, "ROOT CAUSE ANALYSIS", 130, BAR + 94, 18, INK, "center", true);
        H.check(x, 380, BAR + 108, 26, GREEN);
        H.txt(x, "CORRELATION COMPLETE", 130, BAR + 160, 15, GREEN, "left", true);
        H.txt(x, "COMMON FACTOR IDENTIFIED:", 130, BAR + 195, 13, DIM, "left", true);
        H.txt(x, "NETWORK POLICY PUSH (GLOBAL)", 130, BAR + 222, 15, RED, "left", true);
        H.txt(x, "TIME: 10:02 AM    PUSH ID: #POL-7742", 130, BAR + 250, 13, DIM, "left", true);
        // fault tree
        H.panel(x, 850, BAR + 70, 280, 70, "#1c0a10");
        H.txt(x, "POLICY PUSH", 990, BAR + 96, 14, RED, "center", true);
        H.txt(x, "#POL-7742", 990, BAR + 118, 12, RED, "center", true);
        x.strokeStyle = RED; x.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const nx = 800 + i * 110, ny = BAR + 240;
          x.beginPath(); x.moveTo(990, BAR + 140); x.lineTo(nx + 30, ny); x.stroke();
          H.panel(x, nx, ny, 60, 44, "#141a30"); H.xmark(x, nx + 22, ny + 14, 16, RED);
        }
        H.mike(x, "down0", 200, LH - BAR - 40, 160); mug726(x, 250, LH - BAR - 180, 1);
      }
    },
    {
      dur: 0, cap: "RESOLUTION — this will roll back network policy push #POL-7742.", draw(x, tm) {
        H.bg(x, "#0a0f1e");
        worldMap726(x, tm, 320, BAR + 70, 900, 400, [1, 1, 1, 1, 1], false);
        H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", 200, LH - BAR - 40, 150);
      },
      choice: {
        prompt: "RESOLUTION — #POL-7742 ACROSS ALL SITES. CONTINUE?",
        options: [
          "GLOBAL ROLLBACK — every site at once",
          "STAGED ROLLBACK — one site at a time"
        ],
        values: ["global", "staged"],
        store: "_v726rollback"
      }
    },
    {
      dur: 2700, cap: "GLOBAL STATUS — ALL SYSTEMS OPERATIONAL.", draw(x, tm) {
        H.bg(x, "#0a140f");
        H.panel(x, LW / 2 - 400, BAR + 40, 800, 64, "#0a140f");
        x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 400, BAR + 40, 800, 64, 8); x.stroke();
        H.txt(x, "GLOBAL STATUS", LW / 2, BAR + 62, 18, GREEN, "center", true);
        H.txt(x, "ALL SYSTEMS OPERATIONAL", LW / 2, BAR + 86, 14, GREEN, "center", true);
        H.check(x, LW / 2 + 250, BAR + 58, 30, GREEN);
        worldMap726(x, tm, 140, BAR + 130, 1000, 360, null, true);
        H.panel(x, LW / 2 - 160, LH - BAR - 110, 320, 56, "rgba(10,20,15,.92)");
        x.strokeStyle = GREEN; H.rr(x, LW / 2 - 160, LH - BAR - 110, 320, 56, 8); x.stroke();
        H.txt(x, "ALL GREEN", LW / 2, LH - BAR - 82, 22, GREEN, "center", true);
      }
    },
    {
      dur: 3000, cap: "\"Nice first day, Administrator.\" — NEW ROLE UNLOCKED: TECHOPS ADMIN II · ABILITY: DELEGATE", draw(x, tm) {
        H.bg(x); H.rackRow(x, tm, BAR + 70, 8, .3);
        H.mike(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 420, LH - BAR - 50, 165);
        mug726(x, 470, LH - BAR - 180, 1);
        H.felicia(x, "down0", 960, LH - BAR - 50, 160, true);
        H.bubble(x, "Nice first day,", 680, BAR + 80, 240);
        H.bubble(x, "Administrator.", 720, BAR + 155, 220);
        H.panel(x, LW / 2 - 430, LH - BAR - 128, 860, 78, "rgba(20,16,40,.95)");
        x.strokeStyle = PUR; x.lineWidth = 2.5; H.rr(x, LW / 2 - 430, LH - BAR - 128, 860, 78, 8); x.stroke();
        H.txt(x, "NEW ROLE UNLOCKED — ", LW / 2 - 30, LH - BAR - 102, 17, INK, "center", true);
        H.txt(x, "TECHOPS ADMIN II", LW / 2 + 160, LH - BAR - 102, 17, GOLD, "center", true);
        H.txt(x, "ABILITY: DELEGATE", LW / 2, LH - BAR - 74, 15, PUR, "center", true);
      }
    }
  ];

  // ---------- register into the shared engine ----------
  v725.register("racks", {
    title: "DAY 8 — SHADOWS BETWEEN THE RACKS",
    shots: RACKS_SHOTS,
    cues: { 7: "alarm", 10: "chime" }
  });
  v725.register("citylife", {
    title: "CITY LIFE — FOUR HOURS TO YOURSELF",
    shots: CITYLIFE_SHOTS,
    cues: { 6: "chime" }
  });
  v725.register("promotion", {
    title: "PROMOTION DAY — RUNNING THE DEPARTMENT",
    shots: PROMO_SHOTS,
    cues: { 2: "alarm", 7: "chime", 8: "chime" }
  });

  // ---------- exactly-once rewards ----------
  function applyRewards726(id) {
    const m = meta726(); if (!m) return;
    try {
      if (id === "racks") {
        const pick = m._v726racks;
        if (pick === "contain") m._v726emergProto = true;
        else if (pick === "confront") m._v726counterstrike = true;
        else if (pick) m._v726deepMap = true;
      } else if (id === "citylife") {
        if (m._v726evening && !m._v726eveningPaid) {
          m._v726eveningPaid = true;
          const s = (typeof S !== "undefined") ? S : null;
          if (s) {
            const max = s.maxHp || s.hpMax || 100;
            if (typeof s.hp === "number") s.hp = Math.min(max, s.hp + 25);       // ENERGY +25
            if (typeof s.stress === "number") s.stress = Math.max(0, s.stress - 10); // PURPOSE +10
          }
        }
      } else if (id === "promotion") {
        m._v726adminII = true;
      }
    } catch (e) { }
  }

  // ---------- triggers — outermost checkDayEnd wrap (after v7.25) ----------
  const _checkDayEnd726 = checkDayEnd;
  function pending726(s) {
    const m = s.meta || (s.meta = {});
    const day = m.day || s.day || 0;
    if (day >= 8 && !m._v726racks) return "racks";
    if (day >= 13 && !m._v726evening) return "citylife";
    if (day >= 16 && !m._v726rollback) return "promotion";
    return null;
  }
  window.checkDayEnd = function (force) {
    const s = (typeof S !== "undefined") ? S : null;
    try {
      if (s && s.meta && window.v725 && !v725.active() && !s.nightMode && !s.battle &&
        !(typeof dlgOpen !== "undefined" && dlgOpen && dlgOpen()) &&
        !(window.v722 && v722.active && v722.active()) &&
        !(window.v723 && v723.active && v723.active()) &&
        !(window.v724 && v724.active && v724.active())) {
        const id = pending726(s);
        const day = s.meta.day || s.day;
        const done = (s.ticketsDone >= s.ticketsTotal) || force;
        if (id && done && s.meta._v726Day !== day) {
          s.meta._v726Day = day;
          s.meta._v725Day = day; // one cinematic per day across both packs
          const ok = v725.play(id, function () {
            try { if (id === "racks" && S.meta._v726racks) S.meta._v726racksSeen = true; } catch (e) { }
            _checkDayEnd726(force); // day-end flow first…
            applyRewards726(id);    // …then rewards land on top, exactly once
          });
          if (ok) return;
        }
      }
    } catch (e) { window.__err726 = String(e && e.stack || e); }
    return _checkDayEnd726(force);
  };

  window.v726 = {
    version: VER,
    scenes: ["racks", "citylife", "promotion"],
    play: (id) => v725.play(id || "racks", null),
    active: () => v725.active(),
    unlocks: () => {
      const m = meta726() || {};
      return {
        deepMap: !!m._v726deepMap, emergProto: !!m._v726emergProto,
        counterstrike: !!m._v726counterstrike, adminII: !!m._v726adminII,
        evening: m._v726evening || null, rollback: m._v726rollback || null
      };
    }
  };
})();

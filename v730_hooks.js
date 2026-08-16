/* ==========================================================================
   v7.30 — SECOND MOVEMENT
   Part 1: gamepad/controller support (the definition-of-done gap).
   Part 2: two more boards on the shared v7.25 engine, closing the uploaded
   storyboard sheets:
     4. BADGE-CLONER INVESTIGATION (id "badge", day>=10, after _v729wires):
        02:13 badge events that can't be Mike's. LOCK DOWN / TRACE / WATCH —
        persisted in S.meta._v730badge with a matching permanent flag.
     5. K ORIGIN TEASER — THE EMRLD (id "emerald", day>=19, after
        _v729orpheus): the deck handoff ("He found it." / "Good." /
        K WILL RETURN), then the 03:17 AM post-credits wake — Mike's
        decisions become training data, and ORPHEUS asks
        BEGIN SECOND MOVEMENT? Y/N — persisted in S.meta._v730secondMovement.
   Canon rules hold: Mike from the real player atlas, K from the v7.25
   procedural figure, Felicia only via her own atlas, glyphs drawn as
   shapes — no emoji in the art. One cinematic per day across all packs;
   skippable except during the choice; day-end flow always runs after.
   ========================================================================== */
/* Gamepad notes:
   Extends the EXISTING input path — no parallel input system:
   the pad writes into the same `keys` object every system already reads
   (day movement, night crawl, dash/block), and presses call the same
   interact()/panel/phone/twin functions the keyboard already calls.
   Mapping (standard layout):
     left stick / dpad  — move (day) · run/jump (night)
     A (0)  — interact / advance dialog / activate focused button / jab (night)
     B (1)  — block (night, held) · close panel (day)
     X (2)  — dash (night, held) · Digital Twin toggle (day)
     Y (3)  — Teams phone
     Start (9) — panel open/close
   Dialogs, battle buttons, EOD rewards: dpad up/down moves a focus ring,
   A activates. v7.25-engine choices: dpad picks, A confirms (out-of-range
   keys are ignored by the engine). World keys are never written while a
   dialog, battle, panel, EOD screen or cinematic owns input.
   ========================================================================== */
(function () {
  const VER = "7.30";
  if (window.v730) return;

  const DEAD = .28;
  let prev = [];                 // previous button states (edge detection)
  let padIndex = -1, announced = false;
  let focusIdx = 0, focusSig = ""; // focus ring state for button lists
  let choiceSel = 0;             // selected option while a v725 choice waits
  let navCooldown = 0;           // ms timestamp gate for dpad/stick focus moves

  function getPad() {
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.connected) return p;
    } catch (e) { }
    return null;
  }

  // which button list currently owns focus (if any)
  function focusList() {
    try {
      if ((typeof S === "undefined") || !S) return null;
      if (window.v725 && v725.active && v725.active()) return null; // choices handled separately
      if (S.inBattle) { const b = $("battle-actions"); return b && !$("battle").classList.contains("hidden") ? b : null; }
      if ((typeof eodOpen !== "undefined") && eodOpen) { const b = $("eod-rewards"); return b && !$("eod").classList.contains("hidden") ? b : null; }
      if (S.inDialog) { const b = $("dlg-options"); return b && !$("dialogue").classList.contains("hidden") ? b : null; }
    } catch (e) { }
    return null;
  }
  function focusButtons(box) { return [...box.querySelectorAll("button")].filter(b => !b.disabled); }

  function paintFocus(box) {
    const btns = focusButtons(box);
    if (!btns.length) return;
    const sig = btns.length + ":" + btns[0].textContent.slice(0, 12);
    if (sig !== focusSig) { focusSig = sig; focusIdx = 0; }
    focusIdx = Math.max(0, Math.min(focusIdx, btns.length - 1));
    btns.forEach((b, i) => {
      b.style.outline = i === focusIdx ? "2px solid #ffd24a" : "";
      b.style.outlineOffset = i === focusIdx ? "2px" : "";
    });
  }

  function pressEdge(p, i) { const b = p.buttons[i]; return !!(b && b.pressed) && !prev[i]; }
  function heldBtn(p, i) { const b = p.buttons[i]; return !!(b && b.pressed); }

  function pollPad730() {
    const p = getPad();
    const now = performance.now();
    if (!p) { prev = []; padIndex = -1; return; }
    if (p.index !== padIndex) { padIndex = p.index; prev = []; }
    if (!announced) {
      announced = true;
      try { if (typeof toast !== "undefined" && (typeof S !== "undefined") && S) toast("🎮 Controller linked — " + (p.id || "gamepad").slice(0, 40)); } catch (e) { }
    }

    const s = (typeof S !== "undefined") ? S : null;
    const cineLive = !!(window.v725 && v725.active && v725.active());
    const box = focusList();

    // ---- focus ring for button lists (dialogs / battle / EOD) ----
    if (box) {
      paintFocus(box);
      const btns = focusButtons(box);
      const navUp = pressEdge(p, 12), navDown = pressEdge(p, 13);
      const stickNav = Math.abs(p.axes[1] || 0) > .6 ? Math.sign(p.axes[1]) : 0;
      if (btns.length && (navUp || navDown || (stickNav && now > navCooldown))) {
        focusIdx = (focusIdx + (navUp ? -1 : navDown ? 1 : stickNav) + btns.length) % btns.length;
        navCooldown = now + 220;
        paintFocus(box);
      }
      if (pressEdge(p, 0) && btns.length) { btns[focusIdx].click(); prev = p.buttons.map(b => b.pressed); return; }
    }

    // ---- v7.25 cinematic: dpad picks a choice, A confirms; A/B advances ----
    if (cineLive) {
      if (pressEdge(p, 12)) choiceSel = Math.max(0, choiceSel - 1);
      if (pressEdge(p, 13)) choiceSel = Math.min(3, choiceSel + 1);
      if (pressEdge(p, 0) || pressEdge(p, 1)) {
        // the engine picks on "1".."4" while a choice waits and skips on any key
        // otherwise — one synthetic keypress handles both cases correctly
        window.dispatchEvent(new KeyboardEvent("keydown", { key: String(choiceSel + 1), bubbles: true }));
      }
      prev = p.buttons.map(b => b.pressed);
      return; // never leak world input during a cinematic
    }

    // ---- world input ----
    const busy = !s || s.inDialog || s.inBattle || (typeof panelOpen !== "undefined" && panelOpen) || (typeof eodOpen !== "undefined" && eodOpen);
    if (!busy && s && s.map && (typeof keys !== "undefined")) {
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const L = ax < -DEAD || heldBtn(p, 14), Rt = ax > DEAD || heldBtn(p, 15);
      const U = ay < -DEAD || heldBtn(p, 12), D = ay > DEAD || heldBtn(p, 13);
      keys.a = keys.arrowleft = L; keys.d = keys.arrowright = Rt;
      keys.w = keys.arrowup = U; keys.s = keys.arrowdown = D;
      // night-mode combat buttons ride the same keys the keyboard uses
      keys.k = heldBtn(p, 1);        // B = block
      keys.shift = heldBtn(p, 2);    // X = dash
      if (pressEdge(p, 0)) { try { window.__padPresses = (window.__padPresses || 0) + 1; interact(); } catch (e) { } }          // A: interact / jab
      if (pressEdge(p, 2) && !s.nightMode) { try { toggleTwin(); } catch (e) { } } // X: twin (day)
    }
    // panel & phone work from any non-battle state
    if (pressEdge(p, 9)) {
      try {
        if ((typeof panelOpen !== "undefined") && panelOpen) closePanel();
        else if (s && !s.inBattle && !(typeof eodOpen !== "undefined" && eodOpen)) openPanel();
      } catch (e) { }
    }
    if (pressEdge(p, 1) && (typeof panelOpen !== "undefined") && panelOpen) { try { closePanel(); } catch (e) { } } // B = back
    if (pressEdge(p, 3) && s && !s.inBattle && !s.inDialog && !(typeof panelOpen !== "undefined" && panelOpen) && !(typeof eodOpen !== "undefined" && eodOpen)) {
      try { if (typeof phonePanel !== "undefined") phonePanel(); } catch (e) { }
    }
    prev = p.buttons.map(b => b.pressed);
  }

  // ---------- wrap the existing per-frame step (same choke point everything uses) ----------
  if (typeof step === "function" && !window.__v730step) {
    window.__v730step = true;
    const _step730 = step;
    window.step = function (dt) {
      try { pollPad730(); } catch (e) { window.__err730 = String(e && e.stack || e); }
      return _step730.apply(this, arguments);
    };
  }
  // step() early-returns while dialogs/battles own input, so poll from the frame
  // loop as well — pad navigation must stay alive when the world is frozen.
  if (typeof loop === "function" && !window.__v730loop) {
    window.__v730loop = true;
    const _loop730 = loop;
    window.loop = function (t) {
      try { pollPad730(); } catch (e) { window.__err730 = String(e && e.stack || e); }
      return _loop730.apply(this, arguments);
    };
  }

  // ======================================================================
  // Part 2 — the boards (shared v7.25 engine; register, never duplicate)
  // ======================================================================
  const v725 = window.v725;
  if (v725 && v725.register && v725.h) {
    const H = v725.h;
    const LW = H.LW, LH = H.LH, BAR = H.BAR;
    const GREEN = H.GREEN, PUR = H.PUR, CYAN = H.CYAN, RED = H.RED,
      DIM = H.DIM, GOLD = H.GOLD, EDGE = H.EDGE;
    const meta730 = () => { try { return (typeof S !== "undefined") ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };

    // drawn terminal panel with mono log lines
    function term730(x, px, py, w, h, title, lines, col, tm) {
      H.panel(x, px, py, w, h, "rgba(6,10,18,.94)");
      x.strokeStyle = col || GREEN; x.lineWidth = 2.5; H.rr(x, px, py, w, h, 8); x.stroke();
      H.txt(x, title, px + 18, py + 26, 14, col || GREEN, "left", true);
      const show = Math.min(lines.length, 2 + Math.floor(tm / 380));
      for (let i = 0; i < show; i++) H.txt(x, lines[i], px + 18, py + 52 + i * 22, 12.5, i === show - 1 ? "#e8f4ff" : (col || GREEN), "left", false);
    }
    // drawn warning glyph (triangle + bar — shapes, never emoji)
    function warn730(x, cx, cy, r, col, tm) {
      const p = .8 + .2 * Math.sin(tm / 240);
      x.save(); x.shadowColor = col; x.shadowBlur = 18 * p;
      x.strokeStyle = col; x.lineWidth = 5; x.lineJoin = "round";
      x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * .95, cy + r * .75); x.lineTo(cx - r * .95, cy + r * .75); x.closePath(); x.stroke();
      x.fillStyle = col; x.fillRect(cx - 3, cy - r * .38, 6, r * .62);
      x.beginPath(); x.arc(cx, cy + r * .48, 4.5, 0, 7); x.fill();
      x.restore();
    }
    // K's Mercedes as a night silhouette (slab + glass + green-purple underglow)
    function car730(x, cx, cy, w, tm) {
      const h = w * .26;
      x.save(); x.shadowColor = PUR; x.shadowBlur = 24;
      x.fillStyle = "#0c0a16"; H.rr(x, cx - w / 2, cy - h, w, h, 10); x.fill(); x.restore();
      x.fillStyle = "#141126"; H.rr(x, cx - w * .28, cy - h * 1.55, w * .5, h * .7, 8); x.fill();
      x.strokeStyle = EDGE; x.lineWidth = 2; H.rr(x, cx - w / 2, cy - h, w, h, 10); x.stroke();
      const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
      g.addColorStop(0, GREEN); g.addColorStop(1, PUR);
      x.save(); x.globalAlpha = .5 + .2 * Math.sin(tm / 300); x.strokeStyle = g; x.lineWidth = 4;
      x.beginPath(); x.moveTo(cx - w * .44, cy + 6); x.lineTo(cx + w * .44, cy + 6); x.stroke(); x.restore();
      for (const wx of [-w * .32, w * .32]) { x.fillStyle = "#050508"; x.beginPath(); x.arc(cx + wx, cy, h * .32, 0, 7); x.fill(); x.strokeStyle = GREEN; x.lineWidth = 2; x.stroke(); }
    }

    // ---------- BOARD 4: BADGE-CLONER INVESTIGATION ----------
    const BADGE_SHOTS = [
      {
        dur: 2400, cap: "DAY 10 — 9:47 PM. THE ACCESS LOG DOESN'T ADD UP.", draw(x, tm) {
          H.bg(x, "#0a0e18"); H.mike(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", 420, LH - BAR - 60, 165);
          term730(x, 610, BAR + 60, 480, 190, "ACCESS LOG — PLANT 7", [
            "02:13  M. OLIVEFIELD — LEVEL 3 ACCESS",
            "02:13  M. OLIVEFIELD — SERVER ROOM",
            "02:14  M. OLIVEFIELD — R&D LAB 02",
            "02:15  M. OLIVEFIELD — OT CONTROL",
            "02:15  M. OLIVEFIELD — VAULT DOOR 7",
          ], GREEN, tm);
          H.txt(x, "9:47 PM", 70, BAR + 42, 22, CYAN, "left", true);
        }
      },
      {
        dur: 2600, cap: "\"02:13 AM? I was IN the NOC. On camera.\"", draw(x, tm) {
          H.bg(x, "#0b0f1a"); H.rackRow(x, tm, BAR + 70, 8, .3);
          H.mike(x, "down0", 520, LH - BAR - 50, 170);
          H.cio(x, 800, LH - BAR - 50, 165);
          H.bubble(x, "02:13 AM? I was IN the NOC.", 260, BAR + 90, 320);
          H.bubble(x, "On camera. The whole hour.", 290, BAR + 165, 330);
        }
      },
      {
        dur: 2800, cap: "BADGE EVENT TRACE — VERDICT: ANOMALOUS.", draw(x, tm) {
          H.bg(x, "#0d0a12");
          term730(x, 300, BAR + 60, 520, 210, "BADGE EVENT TRACE", [
            "EVENT ID:  77A2F381",
            "BADGE ID:  0x7C21A9",
            "USER:      M. OLIVEFIELD",
            "LOCATION:  LEVEL 3 DOOR 7",
            "TIME:      02:13:47",
            "VERDICT:   ANOMALOUS",
          ], CYAN, tm);
          H.panel(x, 880, BAR + 90, 240, 120, "rgba(24,8,10,.92)");
          x.strokeStyle = RED; x.lineWidth = 2.5; H.rr(x, 880, BAR + 90, 240, 120, 8); x.stroke();
          warn730(x, 1000, BAR + 130, 26, RED, tm);
          H.txt(x, "CLONED CREDENTIAL", 1000, BAR + 178, 13, RED, "center", true);
          H.txt(x, "DETECTED", 1000, BAR + 196, 13, RED, "center", true);
        }
      },
      {
        dur: 2600, cap: "FIVE NAMES. PLACES THEY'VE NEVER BEEN. ONE PATTERN.", draw(x, tm) {
          H.bg(x, "#0a0e18");
          term730(x, 330, BAR + 56, 620, 220, "ANOMALOUS ACCESS EVENTS", [
            "M. OLIVEFIELD — LEVEL 3",
            "J. RAMIREZ    — R&D LAB 02",
            "T. WONG       — SERVER ROOM",
            "A. PATEL      — OT CONTROL",
            "S. HARRIS     — VAULT ACCESS",
            "» PATTERN DETECTED «",
          ], GOLD, tm);
          H.silhouette(x, 1050, LH - BAR - 60, 160);
          H.txt(x, "LEVEL 3 — AUTHORIZED PERSONNEL ONLY", 640, LH - BAR - 24, 13, DIM, "center", true);
        }
      },
      {
        dur: 0, cap: "Your badge is no longer proof you were there. Your move, Administrator.", choice: {
          prompt: "THE CLONE WALKS OUR HALLS — HOW DO YOU ANSWER?",
          options: ["1 — LOCK DOWN EVERY BADGE", "2 — TRACE THE CLONE", "3 — WATCH AND WAIT"],
          values: ["lockdown", "trace", "watch"],
          store: "_v730badge"
        }, draw(x, tm) {
          H.bg(x, "#0d0a12"); H.rackRow(x, tm, BAR + 60, 9, .4);
          H.mike(x, "up0" in PLAYER_ATLAS.frames ? "up0" : "down0", LW / 2 - 180, LH - BAR - 60, 165);
          warn730(x, LW / 2 + 200, BAR + 150, 40, RED, tm);
          H.txt(x, "IDENTITY COMPROMISED", LW / 2 + 200, BAR + 230, 16, RED, "center", true);
        }
      },
      {
        dur: 2800, cap: "LOGGED. THE DOORS REMEMBER WHO WALKED THEM.", draw(x, tm) {
          H.bg(x, "#0b1210");
          const pick730 = (meta730() || {})._v730badge;
          const label = pick730 === "trace" ? "CLONE TRACE ARMED — READER MESH LIVE"
            : pick730 === "watch" ? "SILENT WATCH POSTED — DOOR 7 STAKED OUT"
              : "FULL BADGE LOCKDOWN — PLANT 7 RE-KEYED";
          H.panel(x, LW / 2 - 360, BAR + 90, 720, 100, "rgba(8,20,14,.92)");
          x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 360, BAR + 90, 720, 100, 8); x.stroke();
          H.check(x, LW / 2 - 310, BAR + 122, 30, GREEN);
          H.txt(x, label, LW / 2 + 20, BAR + 128, 18, GREEN, "center", true);
          H.txt(x, "COUNTERMEASURE LOGGED — DAY 10", LW / 2 + 20, BAR + 164, 13, DIM, "center", true);
          H.mike(x, "party" in PLAYER_ATLAS.frames ? "party" : "down0", LW / 2, LH - BAR - 60, 160);
        }
      }
    ];

    // ---------- BOARD 5: K ORIGIN TEASER — THE EMRLD ----------
    const EMERALD_SHOTS = [
      {
        dur: 2400, cap: "TWO NIGHTS AFTER THE CONTRACT. 11:58 PM, ROUTE 9.", draw(x, tm) {
          H.bg(x, "#0a0d1c"); H.cityGlow(x, tm, 30);
          car730(x, LW / 2 + 120, LH - BAR - 90, 420, tm);
          H.txt(x, "11:58 PM", 70, BAR + 42, 22, CYAN, "left", true);
          H.txt(x, "ROUTE 9 — RAIN", LW - 240, BAR + 42, 14, DIM, "left", true);
        }
      },
      {
        dur: 2600, cap: "THE DOOR OPENS. K STEPS INTO THE NIGHT.", draw(x, tm) {
          H.bg(x, "#0b0a16"); H.cityGlow(x, tm, 22);
          car730(x, 400, LH - BAR - 80, 360, tm);
          H.k(x, 840, LH - BAR - 50, 175, "deck");
        }
      },
      {
        dur: 2600, cap: "\"He found it.\" — the deck changes hands.", draw(x, tm) {
          H.bg(x, "#0a0d18");
          H.silhouette(x, 420, LH - BAR - 55, 170);
          H.k(x, 760, LH - BAR - 50, 170, "deck");
          // the handoff deck — drawn comm unit, green glow
          const bx = 600, by = LH - BAR - 200 + Math.sin(tm / 300) * 4;
          x.save(); x.shadowColor = GREEN; x.shadowBlur = 16;
          x.fillStyle = "#141b2a"; H.rr(x, bx - 16, by - 22, 32, 44, 4); x.fill(); x.restore();
          x.fillStyle = GREEN; x.fillRect(bx - 10, by - 13, 20, 5); x.fillRect(bx - 10, by - 3, 20, 5);
          H.txt(x, "AEROTECH", bx, by + 16, 8, GREEN, "center", true);
          H.bubble(x, "He found it.", 250, BAR + 90, 220);
        }
      },
      {
        dur: 2400, cap: "\"Good.\" — K WILL RETURN.", draw(x, tm) {
          H.bg(x, "#0b0a16"); H.cityGlow(x, tm, 18);
          H.k(x, LW / 2, LH - BAR - 50, 190, "fist");
          H.bubble(x, "Good.", 300, BAR + 100, 160);
          H.panel(x, LW / 2 - 220, BAR + 40, 440, 56, "rgba(8,16,12,.92)");
          x.strokeStyle = GREEN; x.lineWidth = 2.5; H.rr(x, LW / 2 - 220, BAR + 40, 440, 56, 8); x.stroke();
          H.txt(x, "K WILL RETURN.", LW / 2, BAR + 76, 20, GREEN, "center", true);
        }
      },
      {
        dur: 2800, cap: "03:17 AM. ONE MACHINE REMAINS.", draw(x, tm) {
          H.bg(x, "#070a14"); H.rackRow(x, tm, BAR + 70, 10, .25);
          term730(x, LW / 2 - 300, BAR + 90, 600, 170, "TERMINAL 7 — UNSCHEDULED WAKE", [
            "> INITIALIZING...",
            "> LOADING ARCHIVE...",
            "> REPLAYING LOGS...",
            "> IMPORTING DATASET: OPERATOR M. OLIVEFIELD",
            "> DECISIONS: 412 · SUCCESS RATE: 73.4%",
          ], PUR, tm);
          H.txt(x, "03:17 AM", LW / 2, BAR + 300, 26, PUR, "center", true);
        }
      },
      {
        dur: 0, cap: "MIKE'S DECISIONS BECOME TRAINING DATA.", choice: {
          prompt: "BEGIN THE SECOND MOVEMENT?",
          options: ["1 — Y: BEGIN THE SECOND MOVEMENT", "2 — N: NOT TONIGHT"],
          values: ["begin", "wait"],
          store: "_v730secondMovement"
        }, draw(x, tm) {
          H.bg(x, "#0a0812");
          v729.eye(x, LW / 2, BAR + 220, 80, .9, tm);
          H.txt(x, "OPERATOR PROFILE: MIKE OLIVEFIELD", LW / 2, BAR + 70, 15, PUR, "center", true);
          H.txt(x, "PREDICTION CONFIDENCE: 99.7%", LW / 2, BAR + 360, 14, DIM, "center", true);
        }
      },
      {
        dur: 3000, cap: "THE GRID ALREADY KNOWS YOUR ANSWER. IT ASKED ANYWAY.", draw(x, tm) {
          H.bg(x, "#0a140f"); H.cityGlow(x, tm, 20);
          const begin = (meta730() || {})._v730secondMovement === "begin";
          H.panel(x, LW / 2 - 380, BAR + 80, 760, 110, begin ? "rgba(10,20,15,.92)" : "rgba(16,12,20,.92)");
          x.strokeStyle = begin ? GREEN : DIM; x.lineWidth = 2.5; H.rr(x, LW / 2 - 380, BAR + 80, 760, 110, 8); x.stroke();
          H.txt(x, begin ? "SECOND MOVEMENT — ARMED" : "SECOND MOVEMENT — DEFERRED", LW / 2, BAR + 118, 20, begin ? GREEN : DIM, "center", true);
          H.txt(x, begin ? "The grid hums a new phrase. Eight notes, answered." : "The offer doesn't expire. The logs keep replaying.", LW / 2, BAR + 154, 13, DIM, "center", true);
          v729.eye(x, LW / 2, BAR + 300, 60, begin ? 1 : .15, tm);
          H.txt(x, "TO BE CONTINUED.", LW / 2, LH - BAR - 40, 16, GOLD, "center", true);
        }
      }
    ];

    v725.register("badge", { title: "BADGE-CLONER INVESTIGATION — ACCESS GRANTED", shots: BADGE_SHOTS, cues: { 2: "beep520", 4: "chime" } });
    v725.register("emerald", { title: "K ORIGIN TEASER — THE EMRLD", shots: EMERALD_SHOTS, cues: { 3: "chime", 4: "beep620", 5: "beep520" } });

    // ---------- exactly-once rewards ----------
    function applyRewards730(id) {
      const m = meta730(); if (!m) return;
      try {
        if (id === "badge" && m._v730badge) {
          if (m._v730badge === "lockdown") m._v730lockdown = true;
          if (m._v730badge === "trace") m._v730traceBadge = true;
          if (m._v730badge === "watch") m._v730watch = true;
        }
        if (id === "emerald" && m._v730secondMovement === "begin") m._v730secondMvmt = true;
      } catch (e) { }
    }

    // ---------- trigger — outermost checkDayEnd wrap (after v7.29) ----------
    const _checkDayEnd730 = checkDayEnd;
    function pending730(s) {
      const m = s.meta || (s.meta = {});
      const day = m.day || s.day || 0;
      if (day >= 10 && m._v729wires && !m._v730badge) return "badge";
      if (day >= 19 && m._v729orpheus && !m._v730secondMovement) return "emerald";
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
          const id = pending730(s);
          const day = s.meta.day || s.day;
          const done = (s.ticketsDone >= s.ticketsTotal) || force;
          if (id && done && s.meta._v730Day !== day) {
            s.meta._v730Day = day;
            s.meta._v729Day = day; // one cinematic per day across all packs
            s.meta._v727Day = day;
            s.meta._v726Day = day;
            s.meta._v725Day = day;
            const ok730 = v725.play(id, function () {
              _checkDayEnd730(force); // day-end flow first…
              applyRewards730(id);    // …then the unlock lands on top, exactly once
            });
            if (ok730) return;
          }
        }
      } catch (e) { window.__err730b = String(e && e.stack || e); }
      return _checkDayEnd730(force);
    };
  }

  window.v730 = {
    version: VER,
    scenes: ["badge", "emerald"],
    play: (id) => v725.play(id || "badge", null),
    active: () => v725.active(),
    unlocks: () => {
      const m = (typeof S !== "undefined") ? (S.meta || {}) : {};
      return {
        badge: m._v730badge || null, secondMovement: m._v730secondMovement || null,
        lockdown: !!m._v730lockdown, traceBadge: !!m._v730traceBadge, watch: !!m._v730watch,
        secondMvmt: !!m._v730secondMvmt,
      };
    },
    pad: () => { const p = getPad(); return p ? { id: p.id, index: p.index, buttons: p.buttons.length } : null; },
    poll: pollPad730,
    get focus() { return focusIdx; },
    get choiceSel() { return choiceSel; },
  };
  console.log("[v7.30] Second Movement loaded — controller support online");
})();

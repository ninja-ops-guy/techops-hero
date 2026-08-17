/* ==========================================================================
   v7.37 — THIRD SHIFT (Ghost Shift chapters 1–2 + mike_actions wiring)
     · CH.1 AFTER HOURS — the v7.33 encrypted message becomes playable:
       Industrial street 1 (the recycling facility) hides 3 evidence drives.
       The brief's two-objective rule: clearing the street is one thing;
       recovering every drive before leaving is the grade. Full recovery pays
       the reveal — every drive was already wiped; they wanted the HARDWARE.
     · CH.2 DEAD DROPS — one glowing cache per combat district (first visit
       each): fragments of incident reports erased from the archive. At 3,
       the distorted radio speaks: "You fix their systems. I remember what
       they erased." Fragments file into the v7.33 intel docs.
     · mike_actions, first honest wiring: A/S style nights end the EOD screen
       with Mike's celebration pose from the sheet.
   Chapters 3–5 wait on the Echo sprite (documented). No new frameworks:
   missions ride NM state, the v7.25 engine, and the existing wraps.
   ========================================================================== */
(function () {
  const VER = "7.37";
  if (window.v737) return;
  const meta737 = () => { try { return (typeof S !== "undefined") && S ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };
  const now737 = () => performance.now();

  // ---------- payload plumbing ----------
  let mikeImg737 = null;
  try { // warm the decode at load — data-URL Images resolve asynchronously
    if (typeof TO_MIKE_ACTIONS !== "undefined" && TO_MIKE_ACTIONS) { mikeImg737 = new Image(); mikeImg737.src = TO_MIKE_ACTIONS; }
  } catch (e) { }
  function mikePose737(frame) { // crop a mike_actions frame to a data URL (for DOM)
    try {
      if (typeof TO_MIKE_ACTIONS === "undefined" || typeof MIKE_ACTIONS === "undefined" || !TO_MIKE_ACTIONS) return null;
      if (!mikeImg737) { mikeImg737 = new Image(); mikeImg737.src = TO_MIKE_ACTIONS; }
      if (!mikeImg737.complete || !mikeImg737.naturalWidth) return null;
      const A = MIKE_ACTIONS, fr = A.frames[frame] || A.frames[Object.keys(A.frames)[0]];
      const CH = A.cellH || A.cell;
      const c = document.createElement("canvas"); c.width = A.cell; c.height = CH;
      c.getContext("2d").drawImage(mikeImg737, fr[0] * A.cell, fr[1] * CH, A.cell, CH, 0, 0, A.cell, CH);
      return c.toDataURL();
    } catch (e) { return null; }
  }

  // ---------- ch.1: the recycling facility (Industrial street 1) ----------
  const DRIVES737 = [{ x: 620 }, { x: 1010 }, { x: 1420 }];
  function missionActive737() {
    try {
      const m = meta737();
      return typeof NM !== "undefined" && NM && NM.district === "industrial" && NM.street === 1 && m && m._v733ghost && !m._v737ch1;
    } catch (e) { return false; }
  }
  function missionState737() {
    if (!NM.mission737) NM.mission737 = { got: [false, false, false] };
    return NM.mission737;
  }
  const _nmLoad737 = nmLoadDistrict;
  window.nmLoadDistrict = function (id) {
    _nmLoad737(id);
    try {
      if (typeof NM !== "undefined" && NM) {
        NM._v737dropTaken = false; // cache availability re-evaluates per street
        if (id === "industrial" && NM.street === 1) {
          NM.mission737 = null; // fresh drives per attempt
          if (missionActive737()) {
            NM.msg = "♻️ THE RECYCLING PLANT — clear it AND recover the 3 evidence drives"; NM.msgT = now737() + 4200;
          }
        }
      }
    } catch (e) { }
  };
  const _stepNM737 = stepNM;
  window.stepNM = function (dt) {
    _stepNM737(dt);
    try {
      if (typeof NM === "undefined" || !NM || NM.drive) return;
      // drive pickups (walk over)
      if (missionActive737()) {
        const st = missionState737();
        DRIVES737.forEach((d, i) => {
          if (!st.got[i] && Math.abs(NM.x - d.x) < 34) {
            st.got[i] = true;
            NM.msg = `💾 EVIDENCE DRIVE ${st.got.filter(Boolean).length}/3 — securely erased… but present`; NM.msgT = now737() + 2200;
            sfx("pickup");
          }
        });
      }
      // dead-drop caches: one per combat district, first visit
      const m = meta737();
      if (m && m._v733ghost && NM.district !== "waldo" && NM.district !== "home" && NM.street === 1) {
        m._v737drops = m._v737drops || [];
        if (!m._v737drops.includes(NM.district) && !NM._v737dropTaken) {
          if (Math.abs(NM.x - 900) < 34) {
            NM._v737dropTaken = true;
            m._v737drops.push(NM.district);
            m._v733docs = m._v733docs || []; m._v733docs.push("erased-report-" + NM.district);
            const n = m._v737drops.length;
            NM.msg = `📡 DEAD DROP — incident report fragment ${n} (name deleted from every record)`; NM.msgT = now737() + 3000;
            sfx("promote"); save();
            if (n >= 3 && !m._v737ch2) {
              m._v737ch2 = true;
              setTimeout(() => { try { toast("📻 DISTORTED TRANSMISSION — \"You fix their systems. I remember what they erased.\"", 5600); } catch (e) { } }, 1200);
            }
          }
        }
      }
    } catch (e) { window.__err737 = String(e && e.stack || e); }
  };
  // caches reset per street load
  const _nmLoad737b = window.nmLoadDistrict;
  window.nmLoadDistrict = function (id) { _nmLoad737b(id); try { if (typeof NM !== "undefined" && NM) NM._v737dropTaken = false; } catch (e) { } };

  // street clear grading — wrap the progression choke point
  const _nmNextStage737 = nmNextStage;
  window.nmNextStage = function () {
    try {
      if (missionActive737()) {
        const st = missionState737(), got = st.got.filter(Boolean).length, m = meta737();
        m._v737ch1 = true;
        m._v733docs = m._v733docs || [];
        if (got === 3) {
          m._v733docs.push("after-hours-grade-A");
          NM.cash += 60;
          try { v725.play("gs1", null); } catch (e) { }
          try { save(); } catch (e) { }
        } else {
          m._v733docs.push("after-hours-partial");
          toast(`♻️ Street cleared, but ${3 - got} drive(s) left behind — someone else may find them.`, 4200);
          try { save(); } catch (e) { }
        }
      }
    } catch (e) { window.__err737b = String(e && e.stack || e); }
    return _nmNextStage737();
  };

  // ---------- mission rendering ----------
  const _drawNM737 = drawNM;
  window.drawNM = function () {
    _drawNM737();
    try {
      if (typeof NM === "undefined" || !NM || NM.drive) return;
      const now = now737();
      ctx.save();
      if (missionActive737()) {
        const st = missionState737();
        DRIVES737.forEach((d, i) => {
          if (st.got[i]) return;
          const dx = d.x - NM.cam, dy = NM_FLOOR;
          ctx.fillStyle = ((now / 400) | 0) % 2 ? "#39d3ff" : "#e8ecff";
          ctx.fillRect(dx - 7, dy - 26, 14, 18); // the drive
          ctx.fillStyle = "#0b0e1d"; ctx.fillRect(dx - 4, dy - 22, 8, 5);
          ctx.strokeStyle = "rgba(57,211,255,.6)"; ctx.beginPath(); ctx.arc(dx, dy - 17, 16 + 4 * Math.sin(now / 300), 0, 7); ctx.stroke();
        });
        // crescent-cursor tag on the wall (the calling card from v7.33)
        const gx = 1500 - NM.cam, gy = NM_FLOOR - 160;
        ctx.strokeStyle = "rgba(57,211,255,.7)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(gx, gy, 24, .8, 5.6); ctx.stroke();
        if (((now / 500) | 0) % 2) { ctx.fillStyle = "rgba(57,211,255,.7)"; ctx.fillRect(gx + 18, gy - 9, 4, 18); }
        // objective strip
        ctx.fillStyle = "#000a"; ctx.fillRect(18, 84, 260, 24);
        ctx.fillStyle = "#39d3ff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "left";
        ctx.fillText(`EVIDENCE ${st.got.filter(Boolean).length}/3`, 28, 100);
      }
      // dead-drop caches
      const m = meta737();
      if (m && m._v733ghost && NM.district !== "waldo" && NM.district !== "home" && NM.street === 1 && !(m._v737drops || []).includes(NM.district) && !NM._v737dropTaken) {
        const dx = 900 - NM.cam, dy = NM_FLOOR;
        ctx.fillStyle = ((now / 350) | 0) % 2 ? "#ffd166" : "#e8ecff";
        ctx.fillRect(dx - 8, dy - 22, 16, 14); // the cache
        ctx.strokeStyle = "rgba(255,209,102,.6)"; ctx.beginPath(); ctx.arc(dx, dy - 15, 14 + 3 * Math.sin(now / 280), 0, 7); ctx.stroke();
      }
      ctx.restore();
    } catch (e) { }
  };

  // ---------- ch.1 reveal cinematic ----------
  if (window.v725 && v725.register && v725.h) {
    const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
    const GREEN = H.GREEN, CYAN = H.CYAN, RED = H.RED, DIM = H.DIM, GOLD = H.GOLD;
    const GS1 = [
      { dur: 2400, cap: "AFTER HOURS — the recycling plant, picked clean.", draw(x, tm) { H.bg(x, "#0d0906"); H.rackRow(x, tm, BAR + 90, 8, .3); H.txt(x, "E-WASTE RECLAMATION — CLOSED 2019", LW / 2, BAR + 60, 16, DIM, "center", true); } },
      { dur: 2600, cap: "Three drives recovered. Every one already wiped. Securely.", draw(x, tm) { H.bg(x, "#0d0906"); for (let i = 0; i < 3; i++) { x.fillStyle = "#10152a"; H.rr(x, LW / 2 - 220 + i * 160, BAR + 140, 120, 80, 6); x.fill(); x.strokeStyle = CYAN; H.rr(x, LW / 2 - 220 + i * 160, BAR + 140, 120, 80, 6); x.stroke(); H.txt(x, "WIPED", LW / 2 - 160 + i * 160, BAR + 182, 15, RED, "center", true); } } },
      { dur: 2600, cap: "They wanted the hardware, not the data. Someone is rebuilding something.", draw(x, tm) { H.bg(x, "#0a0714"); x.strokeStyle = "rgba(57,211,255,.7)"; x.lineWidth = 4; x.beginPath(); x.arc(LW / 2, BAR + 210, 60, .8, 5.6); x.stroke(); if (((tm / 500) | 0) % 2) { x.fillStyle = "rgba(57,211,255,.7)"; x.fillRect(LW / 2 + 44, BAR + 186, 9, 44); } H.txt(x, "A CRESCENT AROUND A BLINKING CURSOR", LW / 2, BAR + 310, 15, CYAN, "center", true); } },
      { dur: 2600, cap: "INVESTIGATION GRADE: A — the Ghost Shift is yours now.", draw(x, tm) { H.bg(x, "#0a140f"); H.panel(x, LW / 2 - 320, BAR + 100, 640, 100, "#0d1f16"); H.txt(x, "INVESTIGATION GRADE: A", LW / 2, BAR + 132, 20, GOLD, "center", true); H.txt(x, "AFTER HOURS — DOCUMENTED", LW / 2, BAR + 162, 14, GREEN, "center", true); } },
    ];
    v725.register("gs1", { title: "GHOST SHIFT I — AFTER HOURS", shots: GS1, cues: { 2: "beep440", 3: "chime" } });
  }

  // ---------- mike_actions: the EOD celebration on a stylish night ----------
  const _endOfDay737 = endOfDay;
  window.endOfDay = function () {
    _endOfDay737();
    try {
      const m = meta737();
      const rank = m && m._v737lastStyle;
      if (rank === "A" || rank === "S") {
        const url = mikePose737("f170"); // celebration pose row
        if (url) {
          const sum = document.getElementById("eod-summary");
          if (sum && !sum.querySelector(".v737-pose")) {
            const im = document.createElement("img");
            im.src = url; im.className = "v737-pose"; im.alt = "";
            im.style.cssText = "display:block;margin:10px auto 0;width:112px;height:120px;image-rendering:pixelated";
            sum.appendChild(im);
            sum.innerHTML += `<small>Night style rank: <b style="color:${rank === "S" ? "#ffd166" : "#39ff88"}">${rank}</b> — the city noticed.</small>`;
          }
        }
      }
    } catch (e) { }
  };
  const _exitNight737 = exitNight;
  window.exitNight = function (homeSafe) {
    try {
      const m = meta737();
      if (m && typeof NM !== "undefined" && NM && NM._v736style) m._v737lastStyle = NM._v736style.rank;
    } catch (e) { }
    return _exitNight737(homeSafe);
  };

  // ---------- exports ----------
  window.v737 = {
    version: VER,
    state: () => { const m = meta737() || {}; return { ch1: !!m._v737ch1, ch2: !!m._v737ch2, drops: m._v737drops || [], docs: m._v733docs || [], lastStyle: m._v737lastStyle || null }; },
    drives: () => { try { return missionState737().got.slice(); } catch (e) { return []; } },
    play: () => v725.play("gs1", null),
    mikePose: mikePose737,
  };
  console.log("[v7.37] Third Shift loaded — the plant remembers");
})();

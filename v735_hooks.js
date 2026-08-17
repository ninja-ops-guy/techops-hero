/* ==========================================================================
   v7.35 — GOOD DOGS (wiring & polish pack)
   Wires the delivered art into the live systems — no parallel frameworks:
     · Manchez & Katrin draw from their own atlas (amber/blue collars) at
       Waldo's and in cinematics; the Ghost Fork decoy uses K's action atlas.
     · Dialogue chrome: DOM dialogs for K / Waldo / Manchez / Katrin gain
       their nameplate portraits from the UI kit (cropped to data-URLs,
       cached); never fights the v7.7 portrait path (yields if present).
     · Key art placed: ORPHEUS eye closes the v7.29 ORPHEUS WAKES scene,
       the NOC art anchors v7.30's emerald wake, Waldo's garage + den are
       real interiors at Waldo's Place (backdrop swap + existing hotspots).
     · Waldo questline completes: PARTS RUN (tier 2, car mod choice),
       NOWHERE TO BE (tier 2, the no-objective drive — biggest stress heal,
       restores a morning block), PARTY IN THE STRATOSPHERE (tier 3, den),
       BROTHERS UNDER ONE SKY (tier 5 finale — WALDO ASSIST unlocked:
       once per night at critical HP he crashes the fight, 3s stun + 20 HP).
   Canon: dogs from their own atlas only; K/Waldo plates from the UI kit;
   glyphs as shapes; no emoji in drawn art.
   ========================================================================== */
(function () {
  const VER = "7.35";
  if (window.v735) return;
  const meta735 = () => { try { return (typeof S !== "undefined") ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };

  // ---------- payload plumbing ----------
  const IMG735 = {};
  function img735(globalName) {
    if (IMG735[globalName] !== undefined) return IMG735[globalName];
    let im = null;
    try {
      const src = (typeof window[globalName] !== "undefined") ? window[globalName] : null;
      if (src && typeof src === "string") { im = new Image(); im.src = src; }
    } catch (e) { }
    IMG735[globalName] = im; return im;
  }
  const ready735 = (im) => !!(im && im.complete && im.naturalWidth);
  // crop one atlas frame to a data URL (cached) — for DOM <img> use
  const CROP735 = {};
  function crop735(globalSrc, atlas, frame) {
    const key = globalSrc + ":" + frame;
    if (CROP735[key]) return CROP735[key];
    let url = null;
    try {
      const im = img735(globalSrc), A = window[atlas];
      if (!ready735(im) || !A) return null;
      const fr = A.frames[frame]; if (!fr) return null;
      const c = document.createElement("canvas"); c.width = A.cell; c.height = A.cellH;
      c.getContext("2d").drawImage(im, fr[0] * A.cell, fr[1] * A.cell, A.cell, A.cellH, 0, 0, A.cell, A.cellH);
      url = c.toDataURL();
    } catch (e) { }
    if (url) CROP735[key] = url; // never cache a miss — images decode async
    return url;
  }
  function drawFrame735(x, globalSrc, atlas, frame, dx, dy, h, flip) {
    try {
      const im = img735(globalSrc), A = window[atlas];
      if (!ready735(im) || !A) return false;
      const fr = A.frames[frame] || A.frames[Object.keys(A.frames)[0]];
      const C = A.cell, CH = A.cellH, w = h * (C / CH);
      x.imageSmoothingEnabled = false;
      if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(im, fr[0] * C, fr[1] * C, C, CH, -w / 2, dy - h, w, h); x.restore(); }
      else x.drawImage(im, fr[0] * C, fr[1] * C, C, CH, dx - w / 2, dy - h, w, h);
      return true;
    } catch (e) { return false; }
  }
  const DOG_FRAME = { idle: 0, sit: 2, run: 4, bark: 8, hack: 11, power: 12, cheer: 15 };

  // ---------- dialogue portraits from the UI kit (yields to v7.7) ----------
  const PLATE_FOR = [
    [/MANCHEZ/i, "port_manchez"], [/KATRIN/i, "port_katrin"],
    [/WALDO/i, "port_waldo"], [/🎹 K|\bK\b/, "port_k"],
  ];
  const _dlg735 = dlg;
  window.dlg = function (name, text, options) {
    _dlg735(name, text, options);
    try {
      const box = document.getElementById("dialogue");
      if (!box || box.querySelector(".v77-portrait")) return; // v7.7 owns it
      const hit = PLATE_FOR.find(p => p[0].test(name));
      if (!hit) return;
      const url = crop735("TO_UI_KIT", "UI_KIT", hit[1]);
      if (!url) return;
      const im = document.createElement("img");
      im.src = url; im.className = "v77-portrait v735-plate";
      im.style.cssText = "position:absolute;right:10px;top:8px;left:auto;transform:none;width:92px;height:92px;image-rendering:pixelated;border:2px solid #2a3560;border-radius:8px;object-fit:cover;object-position:top";
      box.appendChild(im);
      const strip = () => { const e2 = box.querySelector(".v735-plate"); if (e2) e2.remove(); };
      const obs = new MutationObserver(() => { if (box.classList.contains("hidden")) { strip(); obs.disconnect(); } });
      obs.observe(box, { attributes: true });
    } catch (e) { }
  };

  // ---------- dog + decoy renderers (called by v7.34's draw paths) ----------
  function dogDraw735(x, dx, dy, who, tm) {
    const wag = Math.sin(tm / 300) > 0;
    const frame = (who === "manchez" ? "manchez" : "katrin") + (wag ? 0 : 2);
    return drawFrame735(x, "TO_DOGS", "DOGS", frame, dx, dy, 34, false);
  }
  function decoyDraw735(x, dx, dy, tm) {
    const frame = "f" + String(20 + (((tm / 120) | 0) % 4)).padStart(3, "0"); // emerald-stance frames
    x.save(); x.globalAlpha = .6 + .2 * Math.sin(tm / 120);
    const okd = drawFrame735(x, "TO_K_ACTION", "K_ACTION", frame, dx, dy, 52, false);
    x.restore();
    return okd;
  }

  // ---------- key art placement: ORPHEUS eye & the NOC ----------
  function coverArt735(x, globalSrc, LW, LH, BAR) {
    const im = img735(globalSrc); if (!ready735(im)) return false;
    const s = Math.max(LW / im.naturalWidth, (LH - 2 * BAR) / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    x.imageSmoothingEnabled = true;
    x.drawImage(im, (LW - w) / 2, BAR + (LH - 2 * BAR - h) / 2, w, h);
    return true;
  }
  try {
    const defs = v725.defs();
    // ORPHEUS WAKES final shot: the eye opens over the city — painted key art
    if (defs.orpheus && defs.orpheus.shots.length) {
      const sh = defs.orpheus.shots[defs.orpheus.shots.length - 1];
      const _o = sh.draw;
      sh.draw = function (x, tm) {
        if (!coverArt735(x, "TO_BG_ORPHEUS_EYE", v725.h.LW, v725.h.LH, v725.h.BAR)) return _o(x, tm);
        const m = (typeof S !== "undefined") && S ? S.meta : null;
        const signed = m && m._v729nightContract;
        x.fillStyle = signed ? "rgba(57,255,136,.08)" : "rgba(10,12,24,.35)";
        x.fillRect(0, v725.h.BAR, v725.h.LW, v725.h.LH - 2 * v725.h.BAR);
      };
    }
    // v7.30 emerald wake: the NOC at 03:17 — painted key art behind the text beats
    if (defs.emerald && defs.emerald.shots.length) {
      const sh = defs.emerald.shots[0];
      const _e = sh.draw;
      sh.draw = function (x, tm) {
        if (!coverArt735(x, "TO_BG_NOC", v725.h.LW, v725.h.LH, v725.h.BAR)) return _e(x, tm);
        x.fillStyle = "rgba(6,8,18,.30)"; x.fillRect(0, v725.h.BAR, v725.h.LW, v725.h.LH - 2 * v725.h.BAR);
      };
    }
  } catch (e) { window.__err735 = String(e && e.stack || e); }

  // ---------- Waldo interiors: garage + den (backdrop swap at Waldo's Place) ----------
  const inside735 = () => { try { return typeof NM !== "undefined" && NM && NM.waldo && NM.waldo.inside; } catch (e) { return null; } };
  const _drawNM735 = drawNM;
  window.drawNM = function () {
    _drawNM735();
    try {
      const inside = inside735();
      if (!inside) return;
      const art = inside === "garage" ? "TO_BG_GARAGE" : "TO_BG_WALDO_DEN";
      if (!coverArt735(ctx, art, cv.width, cv.height, 0)) return;
      // floor line + prompt
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, cv.height - 60, cv.width, 60);
      ctx.fillStyle = "#39d3ff"; ctx.font = "12px monospace"; ctx.textAlign = "center";
      ctx.fillText(inside === "garage" ? "WALDO'S GARAGE — E: work the lift · Q: step out" : "THE DEN — E: join the party · Q: step out", cv.width / 2, cv.height - 36);
      // the hosts inside
      if (window.v734) { /* dogs drawn by stock waldo scene when outside */ }
    } catch (e) { }
  };

  // ---------- quest cinematics ----------
  if (window.v725 && v725.register && v725.h) {
    const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
    const GREEN = H.GREEN, CYAN = H.CYAN, DIM = H.DIM, GOLD = H.GOLD, PUR = H.PUR, RED = H.RED, AMBER = H.AMBER;
    function road735(x, tm) { // night drive strip
      H.bg(x, "#070b18"); H.cityGlow(x, tm, 30);
      x.fillStyle = "#1e2536"; x.fillRect(0, LH - BAR - 90, LW, 90);
      x.fillStyle = "#ffd24a55"; for (let i = 0; i < 10; i++) x.fillRect(((i * 160 - tm / 4) % (LW + 160)) - 80, LH - BAR - 48, 70, 5);
      if (window.v722 && v722.car) v722.car(x, LW / 2 - 100, LH - BAR - 96, 150, tm);
    }
    function waldo735() { /* Waldo figure lives in v734 (drawWaldoRef734) */ }
    const W_PARTS = [
      { dur: 2400, cap: "PARTS RUN — a rare component, a seller across the city.", draw(x, tm) { road735(x, tm); H.txt(x, "11:20 PM — CROSS-TOWN", LW / 2, BAR + 60, 16, CYAN, "center", true); } },
      { dur: 2600, cap: "Waldo aux-cords his playlist. \"You drive. I narrate.\"", draw(x, tm) { road735(x, tm); H.bubble(x, "You drive. I narrate.", LW / 2 + 120, BAR + 80, 300); } },
      {
        dur: 0, cap: "The seller texts: hurry up, or the part walks.", choice: {
          prompt: "THE TRIP",
          options: ["1 — RUSH THE DEAL", "2 — TAKE THE LONG WAY"],
          store: "_v735partsRoute", values: ["rush", "cruise"]
        }, draw(x, tm) { road735(x, tm); }
      },
      { dur: 2800, cap: "The part is real. The night was the point.", draw(x, tm) { road735(x, tm); H.panel(x, LW / 2 - 320, BAR + 80, 640, 92, "#0d1f16"); H.txt(x, "CAR MOD INSTALLED", LW / 2, BAR + 112, 18, GREEN, "center", true); H.txt(x, "WALDO REP +10", LW / 2, BAR + 142, 14, GOLD, "center", true); } },
    ];
    const W_NOWHERE = [
      { dur: 2400, cap: "The car is fixed. Waldo doesn't hand back the keys.", draw(x, tm) { H.bg(x, "#0b0f22"); if (window.v722 && v722.car) v722.car(x, LW / 2 - 90, LH - BAR - 96, 150, tm); H.bubble(x, "Get in. No destination.", LW / 2 + 100, BAR + 90, 340); } },
      { dur: 2600, cap: "NOWHERE TO BE — overlooks, radio static, no objective.", draw(x, tm) { road735(x, tm); H.txt(x, "NO DESTINATION SET", LW / 2, BAR + 60, 15, DIM, "center", true); } },
      { dur: 2800, cap: "The city from the bluff. You talk about nothing. It fixes things.", draw(x, tm) { H.bg(x, "#0a0e20"); H.cityGlow(x, tm, 60); if (window.v722 && v722.car) v722.car(x, LW / 2 - 260, LH - BAR - 96, 140, tm); H.silhouette(x, LW / 2 + 60, LH - BAR - 40, 130, "#2b3550"); H.silhouette(x, LW / 2 + 130, LH - BAR - 40, 130, "#33284a"); } },
      { dur: 2800, cap: "Recovery is not wasted time. Tomorrow starts early, clear.", draw(x, tm) { road735(x, tm); H.panel(x, LW / 2 - 330, BAR + 80, 660, 92, "#0d1f16"); H.txt(x, "-25 STRESS · MORNING BLOCK RESTORED", LW / 2, BAR + 112, 17, GREEN, "center", true); H.txt(x, "WALDO REP +8", LW / 2, BAR + 142, 14, GOLD, "center", true); } },
    ];
    const W_PARTY = [
      { dur: 2400, cap: "PARTY IN THE STRATOSPHERE — the den, full up.", draw(x, tm) { if (!coverArt735(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) { H.bg(x, "#14101e"); } for (let i = 0; i < 6; i++) H.silhouette(x, 200 + i * 170, LH - BAR - 40, 120, i % 2 ? "#33284a" : "#2b3550"); } },
      { dur: 2600, cap: "Mechanics, radio pirates, a retired ground-station op. Waldo's people.", draw(x, tm) { if (!coverArt735(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) H.bg(x, "#14101e"); for (let i = 0; i < 6; i++) H.silhouette(x, 200 + i * 170, LH - BAR - 40, 120, i % 2 ? "#33284a" : "#2b3550"); H.bubble(x, "You're the AeroTech guy? Waldo talks about you.", 160, BAR + 80, 440); } },
      {
        dur: 0, cap: "The night is yours to spend.", choice: {
          prompt: "THE PARTY",
          options: ["1 — WORK THE ROOM", "2 — HELP WALDO HOST", "3 — LISTEN IN THE CORNER"],
          store: "_v735party", values: ["room", "host", "corner"]
        }, draw(x, tm) { if (!coverArt735(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) H.bg(x, "#14101e"); for (let i = 0; i < 5; i++) H.silhouette(x, 260 + i * 180, LH - BAR - 40, 120, i % 2 ? "#33284a" : "#2b3550"); }
      },
      { dur: 2800, cap: "Someone's pocket is transmitting encrypted telemetry. Optional.", draw(x, tm) { if (!coverArt735(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) H.bg(x, "#14101e"); H.txt(x, "UNUSUAL SIGNAL — GUEST DEVICE", LW / 2, BAR + 70, 15, RED, "center", true); for (let i = 0; i < 5; i++) H.silhouette(x, 260 + i * 180, LH - BAR - 40, 120, i % 2 ? "#33284a" : "#2b3550"); } },
      { dur: 2800, cap: "WALDO REP +15 — and a track for the deck.", draw(x, tm) { if (!coverArt735(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) H.bg(x, "#14101e"); H.panel(x, LW / 2 - 330, BAR + 80, 660, 92, "#0d1f16"); H.txt(x, "WALDO REP +15", LW / 2, BAR + 112, 18, GOLD, "center", true); H.txt(x, "TRACK: STRATOSPHERE SUITE", LW / 2, BAR + 142, 14, CYAN, "center", true); } },
    ];
    const W_BROTHERS = [
      { dur: 2600, cap: "BROTHERS UNDER ONE SKY — they found Waldo through you.", draw(x, tm) { H.bg(x, "#120d18"); if (!coverArt735(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) { } x.fillStyle = "rgba(255,68,85,.12)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); H.txt(x, "PERIMETER ALERT", LW / 2, BAR + 60, 18, RED, "center", true); } },
      { dur: 2600, cap: "You knew every threat coming toward me. And you knew me.", draw(x, tm) { H.bg(x, "#120d18"); H.bubble(x, "You knew every threat coming toward me.", 180, BAR + 80, 480); H.bubble(x, "And you knew me.", 220, BAR + 160, 240); } },
      { dur: 2800, cap: "The house holds. The archive opens — all of it, no price tags.", draw(x, tm) { H.bg(x, "#0d1024"); H.panel(x, LW / 2 - 330, BAR + 90, 660, 100, "#0d1f16"); H.txt(x, "SHARED INTELLIGENCE ARCHIVE", LW / 2, BAR + 122, 18, GREEN, "center", true); H.txt(x, "THREAT NETWORK — INTEL WITHOUT INVOICES", LW / 2, BAR + 152, 13, GREEN, "center", true); } },
      { dur: 3000, cap: "WALDO ASSIST UNLOCKED — CLOSE AIR SUPPORT.", draw(x, tm) { H.bg(x, "#0b0f22"); H.cityGlow(x, tm, 24); H.panel(x, LW / 2 - 330, BAR + 90, 660, 100, "#0d1f16"); H.txt(x, "WALDO ASSIST — CLOSE AIR SUPPORT", LW / 2, BAR + 122, 18, GOLD, "center", true); H.txt(x, "ONCE PER NIGHT, AT CRITICAL HP, HE CRASHES THE FIGHT", LW / 2, BAR + 152, 12, DIM, "center", true); } },
    ];
    v725.register("w_parts", { title: "WALDO — PARTS RUN", shots: W_PARTS, cues: { 3: "chime" } });
    v725.register("w_nowhere", { title: "WALDO — NOWHERE TO BE", shots: W_NOWHERE, cues: { 2: "beep520", 3: "chime" } });
    v725.register("w_party", { title: "WALDO — PARTY IN THE STRATOSPHERE", shots: W_PARTY, cues: { 3: "beep620", 4: "chime" } });
    v725.register("w_brothers", { title: "WALDO — BROTHERS UNDER ONE SKY", shots: W_BROTHERS, cues: { 0: "alarm", 3: "chime" } });
  }

  // ---------- quest rewards (exactly once) ----------
  function questReward735(id) {
    const m = meta735(); if (!m || m["_v735paid_" + id]) return;
    m["_v735paid_" + id] = true;
    const rep = (n, w) => { m._v733rep = (m._v733rep || 0) + n; };
    if (id === "w_parts") {
      rep(10); m._v735carMod = true;
      const c = (typeof S !== "undefined") && S.car; if (c) Object.keys(c).forEach(k => c[k] = Math.min(100, c[k] + 15));
    }
    if (id === "w_nowhere") { rep(8); addStress(-25); m._v735restDay = true; }
    if (id === "w_party") { rep(15); m._v735track2 = true; m._v735partyLead = (m._v735party === "corner"); }
    if (id === "w_brothers") { m._v735assist = true; m._v733archive = true; }
    try { save(); } catch (e) { }
  }

  // ---------- garage/den entry + quest offers ride the Waldo interact wrap ----------
  const _interact735 = interact;
  window.interact = function () {
    const s = S;
    if (s && s.nightMode && window.v733 && v733.atWaldo() && !s.inDialog) {
      const m = meta735(), t = v733.tier(), inside = inside735();
      const q = (k) => keys735(k);
      if (inside) { // interior interactions
        if (keys735.q || keys735.escape) { NM.waldo.inside = null; return; }
        if (inside === "garage") { NM.waldo.inside = null; return v733.startRepair(); }
        if (inside === "den") {
          NM.waldo.inside = null;
          if (t >= 5 && !m._v735assist) return playQuest735("w_brothers");
          if (t >= 3 && !m._v735paid_w_party) return playQuest735("w_party");
          return dlg("🛋️ The Den", "Records, the mask shelf, two dog beds. It smells like cedar and solder.", [{ t: "Cozy.", f: closeDlg }]);
        }
      }
      // outside: interiors open only once the stock quests at those spots are resolved
      if (typeof NM !== "undefined" && NM && !NM.drive) {
        if (Math.abs(NM.x - 1120) < 70 && m._v733tracker) { const ws = (NM.waldo = NM.waldo || { used: {} }); ws.inside = "garage"; sfx("portal"); return; }
        if (Math.abs(NM.x - 880) < 28 && m._v733met) { const ws = (NM.waldo = NM.waldo || { used: {} }); ws.inside = "den"; sfx("portal"); return; }
        // quest offers at the dish
        if (Math.abs(NM.x - 1420) < 90 && t >= 2 && !m._v735paid_w_parts) return playQuest735("w_parts");
        if (Math.abs(NM.x - 1420) < 90 && t >= 2 && m._v735paid_w_parts && !m._v735paid_w_nowhere) return playQuest735("w_nowhere");
      }
    }
    return _interact735();
  };
  function keys735(k) { try { return !!keys[k]; } catch (e) { return false; } }
  function playQuest735(id) {
    try {
      v725.play(id, function () { questReward735(id); });
    } catch (e) { questReward735(id); }
  }

  // ---------- NOWHERE TO BE: the restored morning block ----------
  const _setupDay735 = setupDay;
  window.setupDay = function () {
    _setupDay735();
    try {
      const m = meta735(), s = S;
      if (m && m._v735restDay && s) {
        m._v735restDay = false; // exactly once
        s.clock = Math.min(s.clock, 8 * 60 + 30);
        s._v733clear = true;
        toast("🌅 The drive worked. You wake before the alarm — 08:30, clear head.", 4200);
      }
    } catch (e) { }
  };

  // ---------- WALDO ASSIST: close air support, once per night ----------
  const _stepNM735 = stepNM;
  window.stepNM = function (dt) {
    _stepNM735(dt);
    try {
      const m = meta735();
      if (typeof NM === "undefined" || !NM || !m || !m._v735assist || NM.district === "waldo" || NM.drive) return;
      if (!NM._v735assistUsed && NM.hp <= 25 && NM.hp > 0) {
        NM._v735assistUsed = true;
        NM.hp = Math.min(100, NM.hp + 20);
        for (const e of NM.enemies) if (e.alive) { e.down = Math.max(e.down || 0, 180); e.cd = Math.max(e.cd || 0, 180); }
        NM.hitStop = Math.max(NM.hitStop, 10);
        NM.msg = "🛰️ WALDO — CLOSE AIR SUPPORT. \"Nobody hunts my friends.\""; NM.msgT = performance.now() + 2600;
        sfx("promote");
      }
    } catch (e) { window.__err735b = String(e && e.stack || e); }
  };

  // ---------- eager image warm-up (data-URL Images decode async) ----------
  ["TO_DOGS", "TO_K_ACTION", "TO_UI_KIT", "TO_PORTRAITS_UI", "TO_WARDEN_NULL",
   "TO_BG_GARAGE", "TO_BG_WALDO_DEN", "TO_BG_SHUTTLE_CREW", "TO_BG_ORPHEUS_EYE", "TO_BG_NOC"].forEach(g => { try { img735(g); } catch (e) { } });

  // ---------- exports ----------
  window.v735 = {
    version: VER,
    dog: dogDraw735, decoy: decoyDraw735, coverArt: coverArt735,
    inside: inside735,
    state: () => { const m = meta735() || {}; return { parts: m._v735partsRoute || null, party: m._v735party || null, carMod: !!m._v735carMod, restDay: !!m._v735restDay, assist: !!m._v735assist, archive: !!m._v733archive, partyLead: !!m._v735partyLead, track2: !!m._v735track2 }; },
    play: (id) => v725.play(id || "w_parts", null),
  };
  console.log("[v7.35] Good Dogs loaded — the crew has portraits now");
})();

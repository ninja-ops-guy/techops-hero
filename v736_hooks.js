/* ==========================================================================
   v7.36 — FULL WIRING (every delivered asset gets a job)
     · Felicia's music atlas drives the v7.29 rooftop signal close-up and a
       den-party encore cameo (B/TRUE endings only — canon).
     · Dogs' action atlas: Manchez barks a greeting, Katrin wall-peeks;
       idle poses cycle at Waldo's.
     · portraits_ui: Felicia / Mike / cast dialog portraits where v7.7 has
       none (yields to existing portraits, never double-draws).
     · WARDEN NULL — the fragment escaped into K's archive — resurfaces as
       the Industrial street-2 boss after Ghost Fork (own 24-pose atlas;
       laser eyes, glitch step, prison-cage root).
     · enemy_roster: the five night archetypes wear real frames (thug=merc
       row, guard=shield row, droneop=drone row, skimmer=runner row,
       hunter=wraith row) over their silhouettes.
     · Alt title: after the Ghost Fork finale (durable flag), the title
       screen shows the shuttle crew — K, Waldo, Manchez, Katrin.
     · The Waldo questline's last three: HOUSE CALL (tier 2, den),
       FAMILY BANDWIDTH (tier 3, porch), THE MISSING BIRD (tier 4, dish) —
       choices persisted, rewards exactly once.
     · Night STYLE RANK (D→S: variety, perfects, airtime, damage avoided)
       in the night HUD and the ride-home toast.
   ========================================================================== */
(function () {
  const VER = "7.36";
  if (window.v736) return;
  const meta736 = () => { try { return (typeof S !== "undefined") && S ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };
  const IMG736 = {};
  function img736(g) {
    if (IMG736[g] !== undefined) return IMG736[g];
    let im = null;
    try { const src = window[g]; if (src && typeof src === "string") { im = new Image(); im.src = src; } } catch (e) { }
    IMG736[g] = im; return im;
  }
  const ready736 = (im) => !!(im && im.complete && im.naturalWidth);
  function drawF736(x, g, atlas, frame, dx, dy, h, flip) {
    try {
      const im = img736(g), A = window[atlas];
      if (!ready736(im) || !A) return false;
      const fr = A.frames[frame]; if (!fr) return false;
      const C = A.cell, CH = A.cellH || A.cell, w = h * (C / CH);
      x.imageSmoothingEnabled = false;
      if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(im, fr[0] * C, fr[1] * C, C, CH, -w / 2, dy - h, w, h); x.restore(); }
      else x.drawImage(im, fr[0] * C, fr[1] * C, C, CH, dx - w / 2, dy - h, w, h);
      return true;
    } catch (e) { return false; }
  }
  ["TO_FELICIA_MUSIC", "TO_DOGS_ACTION", "TO_UI_LOBBY", "TO_WARDEN_NULL", "TO_PORTRAITS_UI", "TO_ENEMY_ROSTER", "TO_BG_SHUTTLE_CREW"].forEach(g => { try { img736(g); } catch (e) { } });

  // ---------- alt title screen after Ghost Fork ----------
  try {
    if (localStorage.getItem("techops_ghostfork_done") === "1") {
      const crew = window.TO_BG_SHUTTLE_CREW;
      if (typeof crew === "string" && crew.length > 1000) {
        const ts = document.getElementById("title-screen");
        let img = document.getElementById("v62-skyline");
        if (ts) {
          if (!img) { img = document.createElement("img"); img.id = "v62-skyline"; ts.prepend(img); }
          img.src = crew; img.alt = "";
          img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5;image-rendering:pixelated;pointer-events:none";
          const fl = document.getElementById("title-flavor");
          if (fl) fl.innerHTML = "K · WALDO · MANCHEZ · KATRIN — ABOARD THE SHUTTLE<br>Every ticket is a dungeon. Every day is a run.";
        }
      }
    }
  } catch (e) { }

  // ---------- Felicia's music atlas: the rooftop signal close-up ----------
  try {
    const defs = v725.defs();
    if (defs.signal && defs.signal.shots[1]) {
      const sh = defs.signal.shots[1]; // the violin-phrase shot
      const _s = sh.draw;
      sh.draw = function (x, tm) {
        _s(x, tm);
        drawF736(x, "TO_FELICIA_MUSIC", "FELICIA_MUSIC", "felicia" + (11 + ((tm / 300) | 0) % 4), v725.h.LW - 260, v725.h.LH - v725.h.BAR - 20, 240, true);
      };
    }
  } catch (e) { }
  function feliciaPlays736(x, dx, dy, h, tm) { // den encore cameo
    return drawF736(x, "TO_FELICIA_MUSIC", "FELICIA_MUSIC", "felicia" + (2 + ((tm / 350) | 0) % 4), dx, dy, h, false);
  }

  // ---------- dogs' action poses at Waldo's (greeting bark, wall-peek) ----------
  let bark736 = 0;
  function dogAct736(x, dx, dy, who, tm, action) {
    const A = window.DOGS_ACTION; const base = who === "manchez" ? "manchest" : "katrin";
    if (!A) return false;
    const frames = Object.keys(A.frames).filter(k => k.indexOf(base) === 0);
    if (!frames.length) return false;
    let f;
    if (action === "bark") f = frames[0]; // first pose = bark
    else if (action === "peek") f = frames[Math.min(6, frames.length - 1)]; // wall-peek
    else f = frames[(2 + ((tm / 600) | 0)) % Math.min(5, frames.length)];
    return drawF736(x, "TO_DOGS_ACTION", "DOGS_ACTION", f, dx, dy, 34, false);
  }

  // ---------- dog arrival bark + action idles (through the v7.35 hook) ----------
  try {
    const _load736 = nmLoadDistrict;
    window.nmLoadDistrict = function (id) { _load736(id); if (id === "waldo") bark736 = performance.now() + 2600; };
  } catch (e) { }
  if (window.v735 && v735.dog) {
    const _dog735 = v735.dog;
    v735.dog = function (x, dx, dy, who, tm) {
      if (tm < bark736) { if (dogAct736(x, dx, dy, who, tm, "bark")) return true; }
      if (dogAct736(x, dx, dy, who, tm, null)) return true;
      return _dog735(x, dx, dy, who, tm);
    };
  }

  // ---------- portraits_ui dialog portraits (Felicia/Mike/cast; yields to v7.7 + v7.35 plates) ----------
  const PORTRAIT736 = [
    [/FELICIA/i, "port_felicia0"], [/MIKE|STANDUP/i, "port_mike0"],
    [/NICK/i, "port_cast0"], [/AMIT/i, "port_cast1"], [/BRANDON/i, "port_cast2"], [/DANIEL/i, "port_cast3"],
  ];
  const _dlg736 = window.dlg;
  window.dlg = function (name, text, options) {
    _dlg736(name, text, options);
    try {
      const box = document.getElementById("dialogue");
      if (!box || box.querySelector(".v77-portrait") || box.querySelector(".v735-plate")) return;
      const hit = PORTRAIT736.find(p => p[0].test(name)); if (!hit) return;
      const im736 = img736("TO_PORTRAITS_UI"), A = window.PORTRAITS_UI;
      if (!ready736(im736) || !A) return;
      const fr = A.frames[hit[1]]; if (!fr) return;
      const c = document.createElement("canvas"); c.width = A.cell; c.height = A.cellH || A.cell;
      c.getContext("2d").drawImage(im736, fr[0] * A.cell, fr[1] * (A.cellH || A.cell), A.cell, A.cellH || A.cell, 0, 0, A.cell, A.cellH || A.cell);
      const el = document.createElement("img");
      el.src = c.toDataURL(); el.className = "v736-portrait";
      el.style.cssText = "position:absolute;right:10px;top:8px;width:92px;height:92px;image-rendering:pixelated;border:2px solid #2a3560;border-radius:8px;object-fit:cover;object-position:top";
      box.appendChild(el);
      const obs = new MutationObserver(() => { if (box.classList.contains("hidden")) { const e2 = box.querySelector(".v736-portrait"); if (e2) e2.remove(); obs.disconnect(); } });
      obs.observe(box, { attributes: true });
    } catch (e) { }
  };

  // ---------- WARDEN NULL — the fragment resurfaces (Industrial, post-Ghost-Fork) ----------
  try {
    if (typeof NM_KINDS !== "undefined" && !NM_KINDS.warden) {
      NM_KINDS.warden = { name: "WARDEN NULL", hp: 260, spd: 1.15, dmg: 20, tint: "#ff9f43", cash: [160, 220], w: 36, h: 46, boss: true, lunges: true, dashes: true };
    }
  } catch (e) { }
  function nullUp736() { const m = meta736(); return !!(m && m._v734k && m._v734shepherdDown && !m._v736nullDown); }
  const _nmSpawn736 = nmSpawnEnemies;
  window.nmSpawnEnemies = function (st, dist) {
    const arr = _nmSpawn736(st, dist);
    try {
      if (dist === "industrial" && st >= 2 && nullUp736() && !arr.some(e => e.kind === "warden")) {
        const k = NM_KINDS.warden, F = (typeof NM_FLOOR !== "undefined" ? NM_FLOOR : 430);
        arr.push({ ...k, kind: "warden", x: 1250, y: F - k.h, w: k.w, h: k.h, hp: k.hp, maxHp: k.hp, dmg: k.dmg, vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true, cd: 80, face: -1, laser: 0, cage: 0, _caged: false });
      }
    } catch (e) { }
    return arr;
  };
  const _stepNM736 = stepNM;
  window.stepNM = function (dt) {
    const rootX = (typeof NM !== "undefined" && NM) ? NM.x : 0;
    _stepNM736(dt);
    try {
      if (typeof NM === "undefined" || !NM) return;
      if (NM._v736rooted) { NM.x = rootX; NM.vx = 0; } // the cage holds you still
      const now = performance.now();
      for (const e of NM.enemies) {
        if (!e.alive || e.kind !== "warden") continue;
        if (e.down > 0 || e.launch > 0) continue;
        e.face = Math.sign(NM.x - e.x) || e.face || 1;
        e.cd -= dt * 60;
        if (e.cage > 0) { // prison-cage zone: entering roots you
          e.cage -= dt * 60;
          if (e.cage <= 6 && !e._cageHit) {
            e._cageHit = true;
            if (Math.abs(NM.x - e._cageX) < 70) { NM._v736rooted = 1.2; addStress(2); sfx("block"); }
          }
          if (e.cage <= 0) e._cageHit = false;
        }
        if (e.cd <= 0) {
          const adx = Math.abs(NM.x - e.x);
          if (adx > 280) { e.x = NM.x - Math.sign(NM.x - e.x) * 100; e.cd = 120; sfx("dash"); }
          else if (Math.random() < .5) { e.laser = 30; e.cd = 140; sfx("sev"); }
          else { e.cage = 40; e._cageX = NM.x; e.cd = 160; sfx("ping"); }
        }
        if (e.laser > 0) {
          e.laser -= dt * 60;
          if (e.laser <= 5 && !e._laserHit) {
            e._laserHit = true;
            if (Math.abs(NM.y - e.y) < 50 && Math.abs(NM.x - e.x) < 420 && !NM.block) { NM.hp -= 15; NM.ifr = 30; sfx("hit"); }
            else if (Math.abs(NM.y - e.y) < 50 && Math.abs(NM.x - e.x) < 420) { NM.hp -= 4; sfx("block"); }
          }
          if (e.laser <= 0) e._laserHit = false;
        }
        if (e.hp <= 0 && !e._counted) {
          e._counted = true;
          const m = meta736();
          if (m && !m._v736nullDown) {
            m._v736nullDown = true;
            NM.cash += 200;
            NM.msg = "💀 WARDEN NULL DELETED — +$200 · the archive is quiet"; NM.msgT = now + 4200;
            sfx("promote"); save();
          }
        }
      }
      // cage root effect on the player
      if (NM._v736rooted) { NM._v736rooted -= dt; NM.vx = 0; if (NM._v736rooted <= 0) NM._v736rooted = 0; }
    } catch (e) { window.__err736 = String(e && e.stack || e); }
  };

  // ---------- roster overlays + warden render + style HUD (post-draw wrap) ----------
  const ROSTER_ROW = { thug: "r0", guard: "r1", skimmer: "r8", droneop: "r6", hunter: "r13" };
  function rosterFrame736(x, e, ex) {
    try {
      const A = window.ENEMY_ROSTER; if (!A || !ready736(img736("TO_ENEMY_ROSTER"))) return false;
      const row = ROSTER_ROW[e.kind]; if (!row) return false;
      const cols = Object.keys(A.frames).filter(k => k.indexOf(row + "_") === 0).sort();
      if (!cols.length) return false;
      const fi = e.hitT > 0 ? Math.min(4, cols.length - 1) : (((performance.now() / 200 + e.x) | 0) % Math.min(3, cols.length));
      const fr = A.frames[cols[fi]];
      const h = e.h * 2.1, w = h * (A.cell / (A.cellH || A.cell));
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      if (e.face < 0) { ctx.translate(ex + e.w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(ex + e.w / 2), 0); }
      ctx.drawImage(img736("TO_ENEMY_ROSTER"), fr[0] * A.cell, fr[1] * (A.cellH || A.cell), A.cell, A.cellH || A.cell, ex + e.w / 2 - w / 2, NM_FLOOR - h, w, h);
      ctx.restore();
      return true;
    } catch (e) { return false; }
  }
  const _drawNM736 = drawNM;
  window.drawNM = function () {
    _drawNM736();
    if (typeof NM === "undefined" || !NM || NM.drive) return;
    const now = performance.now();
    ctx.save();
    // archetype frames over silhouettes
    for (const e of NM.enemies) {
      if (!e.alive || e.kind === "shepherd" || e.kind === "warden") continue;
      rosterFrame736(ctx, e, e.x - NM.cam);
    }
    // WARDEN NULL
    for (const e of NM.enemies) {
      if (e.kind !== "warden" || !e.alive) continue;
      const sx = e.x - NM.cam;
      let fr = "f000";
      if (e.down > 0) fr = "f020"; else if (e.hitT > 0) fr = "f018"; else if (e.laser > 0) fr = "f008";
      else if (e.cage > 0) fr = "f012"; else if (Math.abs(e.vx) > .5) fr = "f001";
      if (!drawF736(ctx, "TO_WARDEN_NULL", "WARDEN_NULL", fr, sx + e.w / 2, e.y + e.h, 66, e.face < 0)) {
        // procedural fragment fallback: dish-crown glitch
        ctx.fillStyle = "#0e0f16"; ctx.beginPath(); ctx.roundRect(sx, e.y, e.w, e.h, 6); ctx.fill();
        ctx.strokeStyle = "#ff9f43"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#ff4444"; ctx.beginPath(); ctx.arc(sx + e.w / 2, e.y + 12, 5, 0, 7); ctx.fill();
        ctx.strokeStyle = "#2a3550"; ctx.beginPath(); ctx.ellipse(sx + e.w / 2, e.y - 10, 16, 8, -.4, 0, 7); ctx.stroke();
      }
      if (e.laser > 0) {
        const ly = e.y + 12;
        if (e.laser > 5) { ctx.strokeStyle = "rgba(255,68,68,.6)"; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + e.w / 2, ly); ctx.lineTo(sx + e.w / 2 + e.face * 420, ly); ctx.stroke(); ctx.setLineDash([]); }
        else { ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx + e.w / 2, ly); ctx.lineTo(sx + e.w / 2 + e.face * 420, ly); ctx.stroke(); }
      }
      if (e.cage > 0) {
        const cx2 = e._cageX - NM.cam;
        ctx.strokeStyle = e.cage > 6 ? "rgba(255,159,67,.5)" : "#ff9f43"; ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx2 + i * 26, NM_FLOOR - 90); ctx.lineTo(cx2 + i * 26, NM_FLOOR); ctx.stroke(); }
        ctx.strokeRect(cx2 - 65, NM_FLOOR - 92, 130, 92);
      }
      ctx.fillStyle = "#000a"; ctx.fillRect(cv.width / 2 - 160, 84, 320, 18);
      ctx.fillStyle = "#333"; ctx.fillRect(cv.width / 2 - 156, 88, 312, 10);
      ctx.fillStyle = "#ff9f43"; ctx.fillRect(cv.width / 2 - 156, 88, 312 * Math.max(0, e.hp) / e.maxHp, 10);
      ctx.fillStyle = "#e8ecff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText("WARDEN NULL", cv.width / 2, 97);
    }
    // style rank HUD
    if (NM._v736style && NM.district !== "waldo") {
      const st = NM._v736style;
      ctx.fillStyle = "#000a"; ctx.fillRect(cv.width - 130, 76, 112, 30);
      ctx.fillStyle = st.rankColor; ctx.font = "bold 16px monospace"; ctx.textAlign = "center";
      ctx.fillText("STYLE " + st.rank, cv.width - 74, 96);
    }
    // den encore: Felicia plays (B/TRUE endings)
    if (NM.district === "waldo" && inside736Check()) feliciaPlays736(ctx, 620 - NM.cam, NM_FLOOR, 120, now);
    ctx.restore();
  };
  function inside736Check() {
    try {
      const m = meta736(); if (!m) return false;
      const end = m.ending || m._v73ending;
      return window.v733 && v733.atWaldo() && NM.waldo && NM.waldo.inside === "den" && (m._v74epilogue === "B" || m._v74epilogue === "TRUE" || m.endingB || m.endingTrue);
    } catch (e) { return false; }
  }

  // ---------- style rank ----------
  function styleInit736() {
    if (typeof NM === "undefined" || !NM) return;
    if (!NM._v736style) NM._v736style = { moves: {}, perfects: 0, airT: 0, hits: 0, tookHit: 0, maxCombo: 0, rank: "D", rankColor: "#8b93b8" };
  }
  function styleRank736(st) {
    const variety = Object.keys(st.moves).length;
    let score = variety * 2 + Math.min(10, st.maxCombo) + st.perfects * 2 + Math.min(6, Math.round(st.airT)) - st.tookHit * 3;
    const rank = score >= 26 ? "S" : score >= 18 ? "A" : score >= 12 ? "B" : score >= 6 ? "C" : "D";
    st.rank = rank;
    st.rankColor = { S: "#ffd166", A: "#39ff88", B: "#39d3ff", C: "#a06bff", D: "#8b93b8" }[rank];
    return rank;
  }
  const _nmJab736 = nmJab;
  window.nmJab = function () {
    if (typeof NM !== "undefined" && NM) {
      styleInit736();
      const st = NM._v736style, gap = now736() - NM.lastJab, stage = (gap <= 700) ? (NM.jabStage + 1) % 3 : 0;
      st.moves["jab" + stage] = true; st.hits++;
      if (NM.combo >= st.maxCombo) st.maxCombo = NM.combo + 1;
    }
    const pb = NM ? NM.perfectT : 0;
    _nmJab736();
    if (NM && NM._v736style) {
      if (NM.perfectT > pb) NM._v736style.perfects++;
      if (NM.jabStage === 2) NM._v736style.moves.sweep = true;
      styleRank736(NM._v736style);
    }
  };
  function now736() { return performance.now(); }
  const _stepNM736b = window.stepNM;
  window.stepNM = function (dt) {
    if (typeof NM !== "undefined" && NM) {
      styleInit736();
      const st = NM._v736style;
      if (!NM.onGround) { st.airT += dt; st.moves.air = true; }
      if (NM.dashT > 0) st.moves.dash = true;
      const hpB = NM.hp;
      _stepNM736b(dt);
      if (!NM) return; // a KO mid-step ends the night (NM nulled by exitNight)
      if (NM.hp < hpB) { st.tookHit++; styleRank736(st); }
      else styleRank736(st);
      return;
    }
    _stepNM736b(dt);
  };

  // ==========================================================================
  // THE LAST WALDO QUESTS (v7.25 engine; choices persist; rewards exactly once)
  // ==========================================================================
  if (window.v725 && v725.register && v725.h) {
    const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
    const GREEN = H.GREEN, CYAN = H.CYAN, DIM = H.DIM, GOLD = H.GOLD, PUR = H.PUR, RED = H.RED, AMBER = H.AMBER;
    function denBg736(x, tm) { if (window.v735 && !v735.coverArt(x, "TO_BG_WALDO_DEN", LW, LH, BAR)) H.bg(x, "#14101e"); }
    const W_HOUSECALL = [
      { dur: 2400, cap: "HOUSE CALL — the receiver, the network and the TV all glitch at once.", draw(x, tm) { denBg736(x, tm); H.panel(x, LW / 2 - 300, BAR + 90, 600, 120); H.txt(x, "SAT RECEIVER — SYNC LOSS", LW / 2 - 260, BAR + 124, 14, RED, "left", true); H.txt(x, "MESH NODE 2 — FLAPPING", LW / 2 - 260, BAR + 152, 14, RED, "left", true); H.txt(x, "TV — SUBTITLES IN CIPHER", LW / 2 - 260, BAR + 180, 14, AMBER, "left", true); } },
      { dur: 2600, cap: "A compromised set-top box is watching the house. Quietly.", draw(x, tm) { denBg736(x, tm); x.fillStyle = "#0a0f1e"; H.rr(x, LW / 2 - 60, BAR + 120, 120, 70, 6); x.fill(); x.strokeStyle = RED; H.rr(x, LW / 2 - 60, BAR + 120, 120, 70, 6); x.stroke(); x.fillStyle = RED; x.beginPath(); x.arc(LW / 2, BAR + 155, 8 + 3 * Math.sin(tm / 200), 0, 7); x.fill(); H.txt(x, "STB-04 — EXFIL ACTIVE", LW / 2, BAR + 216, 13, RED, "center", true); } },
      {
        dur: 0, cap: "The party is in an hour. Your move.", choice: {
          prompt: "THE BOX",
          options: ["1 — ISOLATE IT QUIETLY", "2 — TRACE THE OBSERVER", "3 — FEED IT FALSE TELEMETRY", "4 — KILL THE WHOLE NETWORK"],
          store: "_v736housecall", values: ["isolate", "trace", "spoof", "shutdown"]
        }, draw(x, tm) { denBg736(x, tm); }
      },
      { dur: 2800, cap: "TELEMETRY LINK UNLOCKED — and the party is saved.", draw(x, tm) { denBg736(x, tm); H.panel(x, LW / 2 - 320, BAR + 80, 640, 92, "#0d1f16"); H.txt(x, "TELEMETRY LINK UNLOCKED", LW / 2, BAR + 112, 18, CYAN, "center", true); H.txt(x, "THREAT DOC LOGGED", LW / 2, BAR + 142, 14, GREEN, "center", true); } },
    ];
    const W_FAMILY = [
      { dur: 2400, cap: "FAMILY BANDWIDTH — his cousin's block is being squeezed.", draw(x, tm) { H.bg(x, "#0b0f22"); H.cityGlow(x, tm, 20); H.bubble(x, "It's my cousin, homes. Not a job. Family.", 200, BAR + 90, 420); } },
      { dur: 2600, cap: "A recon box on the pole, aimed at people who talk to satellites.", draw(x, tm) { H.bg(x, "#0b0f22"); x.strokeStyle = "#2a3550"; x.lineWidth = 5; x.beginPath(); x.moveTo(LW / 2 + 200, BAR + 60); x.lineTo(LW / 2 + 200, LH - BAR - 40); x.stroke(); x.fillStyle = "#141a30"; H.rr(x, LW / 2 + 176, BAR + 150, 48, 60, 4); x.fill(); x.strokeStyle = RED; H.rr(x, LW / 2 + 176, BAR + 150, 48, 60, 4); x.stroke(); x.fillStyle = RED; x.fillRect(LW / 2 + 192, BAR + 168, 6, 6); } },
      {
        dur: 0, cap: "Fix the family without treating their home like a scene.", choice: {
          prompt: "THE APPROACH",
          options: ["1 — QUIET CLEANUP, NO QUESTIONS", "2 — TEACH THEM THE BASICS", "3 — FULL AUDIT, TELL THEM ALL"],
          store: "_v736family", values: ["quiet", "teach", "audit"]
        }, draw(x, tm) { H.bg(x, "#0b0f22"); H.cityGlow(x, tm, 16); }
      },
      { dur: 2800, cap: "LOW-ORBIT RELAY UNLOCKED — family tier, intel discount.", draw(x, tm) { H.bg(x, "#0b0f22"); H.panel(x, LW / 2 - 320, BAR + 80, 640, 92, "#0d1f16"); H.txt(x, "LOW-ORBIT RELAY UNLOCKED", LW / 2, BAR + 112, 18, CYAN, "center", true); H.txt(x, "INTEL PRICES DROP — FAMILY RATE", LW / 2, BAR + 142, 13, GOLD, "center", true); } },
    ];
    const W_BIRD = [
      { dur: 2400, cap: "THE MISSING BIRD — one of his unofficial satellites went dark.", draw(x, tm) { H.bg(x, "#070b18"); for (let i = 0; i < 80; i++) { x.fillStyle = "rgba(232,236,255,.5)"; x.fillRect((i * 173) % LW, BAR + (i * 89) % 300, 2, 2); } x.fillStyle = "#26304e"; x.beginPath(); x.ellipse(LW / 2, BAR + 200, 60, 36, -.5, 0, 7); x.fill(); x.strokeStyle = CYAN; H.rr(x, LW / 2 - 90, BAR + 188, 60, 24, 3); x.stroke(); H.txt(x, "BIRD-7 — SIGNAL LOST", LW / 2, BAR + 280, 16, RED, "center", true); } },
      { dur: 2600, cap: "It heard something about AeroTech. And CRAWLER. And her.", draw(x, tm) { H.bg(x, "#070b18"); H.panel(x, LW / 2 - 340, BAR + 90, 680, 130); H.txt(x, "INTERCEPT FRAGMENTS", LW / 2 - 300, BAR + 122, 14, CYAN, "left", true); H.txt(x, "AEROTECH · CRAWLER · F. — PARTIAL", LW / 2 - 300, BAR + 152, 13, RED, "left", true); H.txt(x, "He held this back because he was scared you'd pick the company.", LW / 2 - 300, BAR + 184, 12, DIM, "left", false); } },
      {
        dur: 0, cap: "The bird is in a graveyard orbit. Decide.", choice: {
          prompt: "BIRD-7",
          options: ["1 — RECOVER IT", "2 — BURN IT DOWN", "3 — REDIRECT ITS EARS"],
          store: "_v736bird", values: ["recover", "burn", "redirect"]
        }, draw(x, tm) { H.bg(x, "#070b18"); x.fillStyle = "#26304e"; x.beginPath(); x.ellipse(LW / 2, BAR + 210, 60, 36, -.5, 0, 7); x.fill(); }
      },
      { dur: 2800, cap: "THREAT FORECAST UNLOCKED — the sky answers to you both now.", draw(x, tm) { H.bg(x, "#070b18"); H.panel(x, LW / 2 - 320, BAR + 80, 640, 92, "#0d1f16"); H.txt(x, "THREAT FORECAST UNLOCKED", LW / 2, BAR + 112, 18, CYAN, "center", true); H.txt(x, "ADVANCED SATELLITE INTEL — DOCUMENTED", LW / 2, BAR + 142, 13, GREEN, "center", true); } },
    ];
    v725.register("w_housecall", { title: "WALDO — HOUSE CALL", shots: W_HOUSECALL, cues: { 1: "alarm", 3: "chime" } });
    v725.register("w_family", { title: "WALDO — FAMILY BANDWIDTH", shots: W_FAMILY, cues: { 3: "chime" } });
    v725.register("w_bird", { title: "WALDO — THE MISSING BIRD", shots: W_BIRD, cues: { 0: "err", 3: "chime" } });
  }
  function questReward736(id) {
    const m = meta736(); if (!m || m["_v736paid_" + id]) return;
    m["_v736paid_" + id] = true;
    m._v733docs = m._v733docs || [];
    if (id === "w_housecall") { m._v733rep = (m._v733rep || 0) + 10; if (window.v733) v733.unlock("telemetry"); m._v733docs.push("stb-exfil"); }
    if (id === "w_family") { m._v733rep = (m._v733rep || 0) + 12; if (window.v733) v733.unlock("relay"); m._v736familyRate = true; }
    if (id === "w_bird") { m._v733rep = (m._v733rep || 0) + 14; if (window.v733) v733.unlock("forecast"); m._v733docs.push("bird7-intercept"); }
    try { save(); } catch (e) { }
  }

  // ---------- quest offers ride the Waldo interact chain (outermost) ----------
  const _interact736 = interact;
  window.interact = function () {
    const s = S;
    if (s && s.nightMode && window.v733 && v733.atWaldo() && !s.inDialog && typeof NM !== "undefined" && NM && !NM.drive) {
      const m = meta736(), t = v733.tier(), inside = NM.waldo && NM.waldo.inside;
      if (!inside) {
        if (Math.abs(NM.x - 880) < 28 && m._v733met && t >= 2 && !m._v736paid_w_housecall) return play736("w_housecall");
        if (Math.abs(NM.x - 820) < 60 && t >= 3 && m._v736paid_w_housecall && !m._v736paid_w_family) return play736("w_family");
        if (Math.abs(NM.x - 1420) < 90 && t >= 4 && m._v735paid_w_party && !m._v736paid_w_bird) return play736("w_bird");
      }
    }
    return _interact736();
  };
  function play736(id) { try { v725.play(id, function () { questReward736(id); }); } catch (e) { questReward736(id); } }

  // ---------- style rank rides home ----------
  const _exitNight736 = exitNight;
  window.exitNight = function (homeSafe) {
    let st = null;
    try { st = (typeof NM !== "undefined" && NM && NM._v736style) ? NM._v736style : null; } catch (e) { }
    _exitNight736(homeSafe);
    try { if (st && st.hits > 0) toast(`🎖️ Night style rank: ${st.rank} — ${Object.keys(st.moves).length} moves, ${st.perfects} perfects, max combo ${st.maxCombo}`, 4200); } catch (e) { }
  };

  // ---------- exports ----------
  window.v736 = {
    version: VER,
    nullUp: nullUp736,
    state: () => { const m = meta736() || {}; return { nullDown: !!m._v736nullDown, housecall: m._v736housecall || null, family: m._v736family || null, bird: m._v736bird || null, familyRate: !!m._v736familyRate, altTitle: (typeof localStorage !== "undefined") && localStorage.getItem("techops_ghostfork_done") === "1" }; },
    style: () => { try { return NM && NM._v736style ? { rank: NM._v736style.rank, moves: Object.keys(NM._v736style.moves).length } : null; } catch (e) { return null; } },
    felicia: feliciaPlays736, dogAct: dogAct736, roster: rosterFrame736,
    play: (id) => v725.play(id || "w_housecall", null),
  };
  console.log("[v7.36] Full Wiring loaded — every asset has a job");
})();

/* ==========================================================================
   v7.34 — GHOST FORK (K's side story, NULL SHEPHERD, district art)
   Built on the existing systems only:
     · Painted night-district backdrops (downtown / longwharf / industrial /
       wooster / airport / suburbs) load into the v7.31 renderer through the
       NM_BG734 hook in drawNM — procedural street stays as fallback.
     · NULL SHEPHERD — Warden Null's champion — joins the night bestiary via
       NM_KINDS (teleport + beam + a phase shift at half health), spawned as
       the Suburbs street-2 boss once the Ghost Fork arc reaches the archive.
       His moveset animates from his own generated atlas when present.
     · Six mission cinematics on the shared v7.25 engine (day-end chain,
       gated on the v7.33 Ghost Shift seed): gk1 TWO GOOD DOGS →
       gk2 THE MAN IN CELL 118 → gk3 GHOST IN THE SYSTEM (Ghost Fork unlock)
       → gk4 CELL 1984 (BROTHERS BY CHOICE) → gk5 THE ARCHIVE OF MIKES
       (RESTORE / DESTROY / DIVIDE in S.meta._v734archive) → gk6 THE
       IMPOSSIBLE EXIT (needs the Shepherd down) → K joins as companion.
     · Companion: after gk6, K plays the emerald piano at Waldo's porch, and
       GHOST FORK triggers once per night at low HP — a decoy fork pulls all
       aggro for 6 seconds. GOOD DOGS PROTOCOL: Manchez & Katrin cameo at
       Waldo's (+rep with Waldo, once per night).
   Canon: K from his own generated atlas (beanie/headphones/shades/emerald),
   never a Felicia reuse; Waldo beardless with the crimson mask in his
   smuggler past; dogs are dogs. Glyphs as shapes, no emoji in drawn art.
   ========================================================================== */
(function () {
  const VER = "7.34";
  if (window.v734) return;
  const meta734 = () => { try { return (typeof S !== "undefined") ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };

  // ---------- painted district backdrops (payload or fallback) ----------
  const BG_SRCS = {
    downtown: () => (typeof TO_BG_DOWNTOWN !== "undefined") ? TO_BG_DOWNTOWN : null,
    longwharf: () => (typeof TO_BG_LONGWHARF !== "undefined") ? TO_BG_LONGWHARF : null,
    industrial: () => (typeof TO_BG_INDUSTRIAL !== "undefined") ? TO_BG_INDUSTRIAL : null,
    wooster: () => (typeof TO_BG_WOOSTER !== "undefined") ? TO_BG_WOOSTER : null,
    airport: () => (typeof TO_BG_AIRPORT !== "undefined") ? TO_BG_AIRPORT : null,
    suburbs: () => (typeof TO_BG_SUBURBS !== "undefined") ? TO_BG_SUBURBS : null,
  };
  window.NM_BG734 = {};
  for (const id in BG_SRCS) {
    try { const src = BG_SRCS[id](); if (src) { const im = new Image(); im.src = src; window.NM_BG734[id] = im; } } catch (e) { }
  }

  // ---------- atlas helpers ----------
  let kImg = null, nsImg = null;
  function drawK734(x, key, dx, dy, h, flip) {
    try {
      if (typeof TO_K_STUDIO === "undefined" || typeof K_STUDIO === "undefined" || !TO_K_STUDIO) throw 0;
      if (!kImg) { kImg = new Image(); kImg.src = TO_K_STUDIO; }
      if (!kImg.complete || !kImg.naturalWidth) throw 0;
      const fr = K_STUDIO.frames[key] || K_STUDIO.frames[Object.keys(K_STUDIO.frames)[0]], C = K_STUDIO.cell;
      x.imageSmoothingEnabled = false;
      if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(kImg, fr[0] * C, fr[1] * C, C, C, -h / 2, dy - h, h, h); x.restore(); }
      else x.drawImage(kImg, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
      return true;
    } catch (e) { return false; }
  }
  function drawShepherd734(x, dx, dy, h, row, fi, flip) {
    try {
      if (typeof TO_NULL_SHEPHERD === "undefined" || typeof NULL_SHEPHERD === "undefined" || !TO_NULL_SHEPHERD) throw 0;
      if (!nsImg) { nsImg = new Image(); nsImg.src = TO_NULL_SHEPHERD; }
      if (!nsImg.complete || !nsImg.naturalWidth) throw 0;
      const names = Object.keys(NULL_SHEPHERD.frames).filter(n => n.indexOf(row) === 0);
      const key = names.length ? names[fi % names.length] : Object.keys(NULL_SHEPHERD.frames)[0];
      const fr = NULL_SHEPHERD.frames[key], C = NULL_SHEPHERD.cell;
      x.imageSmoothingEnabled = false;
      if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(nsImg, fr[0] * C, fr[1] * C, C, C, -h / 2, dy - h, h, h); x.restore(); }
      else x.drawImage(nsImg, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
      return true;
    } catch (e) { return false; }
  }
  // procedural NULL SHEPHERD fallback — glitch wraith, satellite-dish crown
  function shepherdFig734(x, dx, dy, h, tm) {
    const u = h / 100;
    x.fillStyle = "#0c0f18";
    x.beginPath(); x.moveTo(dx - 20 * u, dy); x.quadraticCurveTo(dx - 26 * u, dy - 60 * u, dx - 12 * u, dy - 72 * u);
    x.lineTo(dx + 12 * u, dy - 72 * u); x.quadraticCurveTo(dx + 26 * u, dy - 60 * u, dx + 20 * u, dy); x.closePath(); x.fill();
    for (let i = 0; i < 5; i++) { // ragged tendrils
      const tx = dx - 18 * u + i * 9 * u, w = 3 * Math.sin(tm / 300 + i);
      x.strokeStyle = "#0c0f18"; x.lineWidth = 4 * u;
      x.beginPath(); x.moveTo(tx, dy - 30 * u); x.quadraticCurveTo(tx + w * u * 4, dy - 8 * u, tx + w * u * 7, dy); x.stroke();
    }
    x.fillStyle = "#39ff88"; x.beginPath(); x.arc(dx, dy - 60 * u, 6 * u, 0, 7); x.fill(); // the one green eye
    x.strokeStyle = "#39ff88"; x.lineWidth = 1.5 * u; x.beginPath(); x.arc(dx, dy - 60 * u, 10 * u, 0, 7); x.stroke();
    x.strokeStyle = "#26304e"; x.lineWidth = 3 * u; // dish crown
    x.beginPath(); x.ellipse(dx, dy - 88 * u, 16 * u, 9 * u, -.5, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(dx, dy - 72 * u); x.lineTo(dx, dy - 82 * u); x.stroke();
    const gl = .5 + .5 * Math.sin(tm / 180); // purple glitch aura
    x.fillStyle = "rgba(160,107,255," + (0.10 + gl * .08) + ")";
    x.beginPath(); x.arc(dx, dy - 40 * u, 34 * u, 0, 7); x.fill();
  }

  // ---------- NULL SHEPHERD joins the bestiary ----------
  try {
    if (typeof NM_KINDS !== "undefined" && !NM_KINDS.shepherd) {
      NM_KINDS.shepherd = { name: "NULL SHEPHERD", hp: 220, spd: 1.1, dmg: 18, tint: "#a06bff", cash: [120, 160], w: 34, h: 44, boss: true, lunges: true, dashes: true };
    }
  } catch (e) { }
  function shepherdUp734() { const m = meta734(); return !!(m && m._v734gk5 && !m._v734shepherdDown); }
  const _nmSpawn734 = nmSpawnEnemies;
  window.nmSpawnEnemies = function (st, dist) {
    const arr = _nmSpawn734(st, dist);
    try {
      if (dist === "suburbs" && st >= 2 && shepherdUp734() && !arr.some(e => e.kind === "shepherd")) {
        const k = NM_KINDS.shepherd;
        arr.push({
          ...k, kind: "shepherd", x: 1200, y: (typeof NM_FLOOR !== "undefined" ? NM_FLOOR : 430) - k.h, w: k.w, h: k.h,
          hp: k.hp, maxHp: k.hp, dmg: k.dmg, vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true,
          cd: 60, face: -1, beam: 0, phased: false, _beamHit: false, _counted: false,
        });
      }
    } catch (e) { }
    return arr;
  };
  // boss behaviors: teleport behind the player, beam telegraph, phase shift at 50%
  const _stepNM734 = stepNM;
  window.stepNM = function (dt) {
    _stepNM734(dt);
    try {
      if (typeof NM === "undefined" || !NM) return;
      const now = performance.now();
      for (const e of NM.enemies) {
        if (!e.alive || e.kind !== "shepherd") continue;
        // phase transition at half health — brief invulnerable glitch-out
        if (!e.phased && e.hp <= e.maxHp / 2) { e.phased = true; e.cd = 40; NM.msg = "⚠ NULL SHEPHERD — PHASE SHIFT"; NM.msgT = now + 1600; NM.hitStop = Math.max(NM.hitStop, 8); sfx("portal"); }
        if (e.down > 0 || e.launch > 0) continue;
        e.face = Math.sign(NM.x - e.x) || e.face || 1; // the Shepherd always faces his flock
        e.cd -= dt * 60;
        if (e.cd <= 0) {
          const dx = NM.x - e.x, adx = Math.abs(dx);
          if (adx > 260) { // teleport behind the player
            e.beam = 0; e.x = NM.x - Math.sign(dx) * 90; e.cd = 110; sfx("dash");
            NM.msg = "🌌 GLITCH STEP"; NM.msgT = now + 700;
          } else { // satellite beam: telegraphed column
            e.beam = 36; e.cd = 150; sfx("sev");
          }
        }
        if (e.beam > 0) {
          e.beam -= dt * 60;
          if (e.beam <= 6 && !e._beamHit) {
            e._beamHit = true;
            if (Math.abs(NM.x - (e.x + e.face * 70)) < 60 && !NM.block) { NM.hp -= 16; NM.ifr = 30; addStress(2); sfx("hit"); }
            else if (Math.abs(NM.x - (e.x + e.face * 70)) < 60) { NM.hp -= 4; sfx("block"); }
          }
          if (e.beam <= 0) e._beamHit = false;
        }
        if (e.hp <= 0 && !e._counted) {
          e._counted = true;
          const m = meta734();
          if (m && !m._v734shepherdDown) {
            m._v734shepherdDown = true;
            m._v734loot = m._v734loot || {}; m._v734loot.fork = true; m._v734loot.crystal = true;
            NM.cash += 140;
            NM.msg = "💀 NULL SHEPHERD DELETED — +$140 · GHOST FORK SOURCE + ARCHIVE CRYSTAL recovered"; NM.msgT = now + 4600;
            sfx("promote"); save();
          }
        }
      }
      // GHOST FORK companion: once per night at low HP, a fork decoy pulls aggro
      const m = meta734();
      if (m && m._v734k && !NM._v734forked && NM.hp <= 35 && NM.hp > 0 && !NM.drive) {
        NM._v734forked = true; NM._v734decoy = { x: NM.x + 160 * NM.face, t: 6 };
        NM.msg = "🍴 GHOST FORK — K's decoy takes the heat"; NM.msgT = now + 2200; sfx("portal");
      }
      if (NM._v734decoy) {
        NM._v734decoy.t -= dt;
        for (const e of NM.enemies) if (e.alive) { e.cd = Math.max(e.cd, 20); const dir = Math.sign(NM._v734decoy.x - e.x); e.x += dir * 1.6 * dt * 60; } // they chase the fork
        if (NM._v734decoy.t <= 0) NM._v734decoy = null;
      }
    } catch (e) { window.__err734 = String(e && e.stack || e); }
  };

  // ---------- boss & companion & decoy rendering (post-draw wrap) ----------
  const _drawNM734 = drawNM;
  window.drawNM = function () {
    _drawNM734();
    if (typeof NM === "undefined" || !NM) return;
    const now = performance.now();
    ctx.save();
    for (const e of NM.enemies) {
      if (e.kind !== "shepherd" || !e.alive) continue;
      const sx = e.x - NM.cam, sy = e.y + e.h;
      let row = "idle", fi = ((now / 140) | 0);
      if (e.down > 0) row = "knockdown";
      else if (e.hitT > 0) row = "hit";
      else if (e.beam > 0) row = "beam";
      else if (e.launch > 0) row = "airrec";
      else if (Math.abs(e.vx) > .5) row = "walk";
      const h = 64;
      if (!drawShepherd734(ctx, sx + e.w / 2, sy, h, row, fi, e.face < 0)) shepherdFig734(ctx, sx + e.w / 2, sy, h, now);
      // beam telegraph + column
      if (e.beam > 0) {
        const bx = sx + e.w / 2 + e.face * 70;
        if (e.beam > 6) { ctx.strokeStyle = "rgba(160,107,255,.7)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx, 60); ctx.lineTo(bx, NM_FLOOR); ctx.stroke(); ctx.setLineDash([]); }
        else { const g = ctx.createLinearGradient(bx, 60, bx, NM_FLOOR); g.addColorStop(0, "rgba(160,107,255,.9)"); g.addColorStop(1, "rgba(160,107,255,.25)"); ctx.fillStyle = g; ctx.fillRect(bx - 14, 60, 28, NM_FLOOR - 60); }
      }
      // boss HP bar
      ctx.fillStyle = "#000a"; ctx.fillRect(W734() / 2 - 160, 84, 320, 18);
      ctx.fillStyle = "#333"; ctx.fillRect(W734() / 2 - 156, 88, 312, 10);
      ctx.fillStyle = e.phased ? "#a06bff" : "#ff6b81"; ctx.fillRect(W734() / 2 - 156, 88, 312 * Math.max(0, e.hp) / e.maxHp, 10);
      ctx.fillStyle = "#e8ecff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText("NULL SHEPHERD", W734() / 2, 97);
    }
    // the fork decoy (v7.35: K's action-atlas frame when present)
    if (NM._v734decoy) {
      const dx = NM._v734decoy.x - NM.cam, dy = NM_FLOOR;
      let drawn = false;
      try { if (window.v735 && v735.decoy) drawn = v735.decoy(ctx, dx, dy, now); } catch (e) { }
      if (!drawn) {
        ctx.globalAlpha = .55 + .2 * Math.sin(now / 120);
        ctx.fillStyle = "#39ff88"; ctx.beginPath(); ctx.arc(dx, dy - 30, 14, 0, 7); ctx.fill();
        ctx.fillStyle = "#0b0e1d"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillText("K?", dx, dy - 26);
        ctx.globalAlpha = 1;
      }
    }
    // K at Waldo's porch + the good dogs (post-gk6)
    if (NM.district === "waldo" && meta734() && meta734()._v734k) {
      if (!drawK734(ctx, "f003", 980 - NM.cam, NM_FLOOR, 44, false)) { try { v725.h.k(ctx, 980 - NM.cam, NM_FLOOR, 44, "deck"); } catch (e) { } }
      // piano glow
      ctx.fillStyle = "rgba(57,255,136,.12)"; ctx.beginPath(); ctx.arc(980 - NM.cam, NM_FLOOR - 30, 40, 0, 7); ctx.fill();
      dog734(ctx, 900 - NM.cam, NM_FLOOR, "#f59e0b", now);       // Manchez — amber
      dog734(ctx, 930 - NM.cam, NM_FLOOR, "#3fa9f5", now + 300); // Katrin — blue
    }
    ctx.restore();
  };
  function W734() { return cv.width; }
  // Waldo in the Ghost Fork scenes — procedural (beanie, gold chain, puffer)
  function drawWaldoRef734(x, dx, dy, h, pose, flip) {
    const u = h / 100;
    x.save(); if (flip) { x.translate(dx, 0); x.scale(-1, 1); x.translate(-dx, 0); }
    x.fillStyle = "#151920"; x.beginPath(); x.moveTo(dx - 24 * u, dy); x.arcTo(dx - 24 * u, dy - 64 * u, dx, dy - 64 * u, 10 * u); x.arcTo(dx + 24 * u, dy - 64 * u, dx + 24 * u, dy, 10 * u); x.lineTo(dx + 24 * u, dy); x.closePath(); x.fill();
    x.strokeStyle = "#ffd166"; x.lineWidth = 2.2 * u; x.beginPath(); x.arc(dx, dy - 54 * u, 8 * u, .3, Math.PI - .3); x.stroke();
    x.fillStyle = "#ffd166"; x.beginPath(); x.arc(dx, dy - 44 * u, 3 * u, 0, 7); x.fill();
    x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx, dy - 76 * u, 14 * u, 0, 7); x.fill();
    x.fillStyle = "#0e1116"; x.beginPath(); x.arc(dx, dy - 81 * u, 14.5 * u, Math.PI, 0); x.fill(); x.fillRect(dx - 14.5 * u, dy - 83 * u, 29 * u, 9 * u);
    x.fillStyle = "#141a30"; x.beginPath(); x.arc(dx - 5 * u, dy - 74 * u, 2.2 * u, 0, 7); x.arc(dx + 5 * u, dy - 74 * u, 2.2 * u, 0, 7); x.fill();
    if (pose === "wave") { x.strokeStyle = "#151920"; x.lineWidth = 9 * u; x.beginPath(); x.moveTo(dx + 20 * u, dy - 56 * u); x.lineTo(dx + 36 * u, dy - 88 * u); x.stroke(); x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx + 38 * u, dy - 92 * u, 5.5 * u, 0, 7); x.fill(); }
    x.restore();
  }
  function dog734(x, dx, dy, tint, tm) { // two extremely dangerous little dogs
    // v7.35: their own atlas when present (manchez = amber rows, katrin = blue rows)
    try {
      if (window.v735 && v735.dog && v735.dog(x, dx, dy, tint === "#f59e0b" ? "manchez" : "katrin", tm)) return;
    } catch (e) { }
    const b = Math.sin(tm / 300) * 1.5;
    x.fillStyle = "#e8e4da"; // fluffy body
    x.beginPath(); x.ellipse(dx, dy - 10 + b * .3, 13, 9, 0, 0, 7); x.fill();
    x.beginPath(); x.arc(dx + 11, dy - 18 + b * .3, 7.5, 0, 7); x.fill(); // head
    x.fillStyle = "#d8d2c4"; x.beginPath(); x.ellipse(dx + 6, dy - 22, 4, 6, -.5, 0, 7); x.ellipse(dx + 16, dy - 22, 4, 6, .5, 0, 7); x.fill(); // ears
    x.fillStyle = "#141a30"; x.beginPath(); x.arc(dx + 13.5, dy - 19, 1.6, 0, 7); x.fill(); // eye
    x.beginPath(); x.arc(dx + 18, dy - 15.5, 2, 0, 7); x.fill(); // nose
    x.strokeStyle = tint; x.lineWidth = 2.5; x.beginPath(); x.arc(dx + 10, dy - 11, 6, .4, Math.PI - .4); x.stroke(); // collar interface
    x.fillStyle = tint; x.fillRect(dx + 8, dy - 12, 3, 3);
    x.strokeStyle = "#e8e4da"; x.lineWidth = 3; x.beginPath(); x.moveTo(dx - 11, dy - 14); x.quadraticCurveTo(dx - 18, dy - 22 - b * 2, dx - 14, dy - 26 - b * 2); x.stroke(); // wagging tail
  }

  // ==========================================================================
  // GHOST FORK — six missions on the shared v7.25 engine
  // ==========================================================================
  if (window.v725 && v725.register && v725.h) {
    const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
    const GREEN = H.GREEN, CYAN = H.CYAN, DIM = H.DIM, GOLD = H.GOLD, PUR = H.PUR, RED = H.RED, AMBER = H.AMBER;
    function vaultBg734(x, tm) { // the Penumbra Vault — prison between timelines
      H.bg(x, "#0a0714");
      for (let i = 0; i < 9; i++) { const rx = 80 + i * 130; x.fillStyle = i % 2 ? "#120e22" : "#0e0a1c"; x.fillRect(rx, BAR + 60, 90, 340); x.strokeStyle = PUR; x.globalAlpha = .25; x.strokeRect(rx, BAR + 60, 90, 340); x.globalAlpha = 1; }
      for (let i = 0; i < 24; i++) { const px = (i * 211 + ((tm / 30) | 0) * 2) % LW, py = BAR + 40 + (i * 137) % 380; x.fillStyle = i % 3 ? "rgba(160,107,255,.35)" : "rgba(57,211,255,.3)"; x.fillRect(px, py, 3, 3); }
    }
    function cell734(x, tm, num, col) { // a cell door with a number plaque
      H.panel(x, LW / 2 - 200, BAR + 100, 400, 330, "#0d0a18");
      x.strokeStyle = col || PUR; x.lineWidth = 3; H.rr(x, LW / 2 - 200, BAR + 100, 400, 330, 10); x.stroke();
      for (let i = 0; i < 5; i++) { x.fillStyle = "#1a1430"; x.fillRect(LW / 2 - 160 + i * 70, BAR + 130, 26, 270); }
      H.txt(x, "CELL " + num, LW / 2, BAR + 90, 18, col || PUR, "center", true);
    }
    function kFig734(x, dx, dy, h, pose) { if (!drawK734(x, pose === "piano" ? "f003" : "f000", dx, dy, h, false)) H.k(x, dx, dy, h, pose === "fist" ? "fist" : "deck"); }
    function dogs734(x, tm) { dog734(x, LW / 2 - 260, LH - BAR - 36, "#f59e0b", tm); dog734(x, LW / 2 - 210, LH - BAR - 36, "#3fa9f5", tm + 300); }
    const GK_SHOTS = {
      gk1: [
        { dur: 2400, cap: "THE PENUMBRA VAULT — a prison hidden between timelines.", draw(x, tm) { vaultBg734(x, tm); H.txt(x, "PENUMBRA VAULT", LW / 2, BAR + 60, 20, PUR, "center", true); dogs734(x, tm); } },
        { dur: 2600, cap: "KATRIN: \"Waldo signal confirmed. Alive. Irritated. Probably hungry.\"", draw(x, tm) { vaultBg734(x, tm); dogs734(x, tm); H.bubble(x, "Waldo signal confirmed.", LW / 2 - 160, BAR + 80, 340); H.bubble(x, "Alive. Irritated. Probably hungry.", LW / 2 - 120, BAR + 155, 420); } },
        { dur: 2600, cap: "MANCHEZ: \"Secondary signature. It matches Mike... smells different.\"", draw(x, tm) { vaultBg734(x, tm); dogs734(x, tm); H.panel(x, LW / 2 - 300, BAR + 90, 600, 110); H.txt(x, "SECONDARY SIGNATURE", LW / 2, BAR + 125, 15, AMBER, "center", true); H.txt(x, "MATCH: MIKE — 99.7% · variance: UNMEASURED", LW / 2, BAR + 158, 13, DIM, "center", true); } },
        { dur: 2600, cap: "Every entrance is guarded by security that predicts Mike.", draw(x, tm) { vaultBg734(x, tm); for (let i = 0; i < 3; i++) H.silhouette(x, LW / 2 - 100 + i * 100, LH - BAR - 40, 120, "#1a1430"); dogs734(x, tm); H.txt(x, "PREDICTIVE MODEL: ACTIVE", LW / 2, BAR + 60, 15, RED, "center", true); } },
        { dur: 2600, cap: "It cannot predict two dogs. CELL 118 — this way.", draw(x, tm) { vaultBg734(x, tm); cell734(x, tm, 118, CYAN); dogs734(x, tm); } },
      ],
      gk2: [
        { dur: 2400, cap: "Cell 118. Someone is tapping a rhythm against the wall.", draw(x, tm) { vaultBg734(x, tm); cell734(x, tm, 118, CYAN); kFig734(x, LW / 2, LH - BAR - 40, 150, "deck"); } },
        { dur: 2600, cap: "\"The prison sent dogs now?\" — \"We sent ourselves.\" · K knows Mike's face only from Waldo's stories.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2 + 120, LH - BAR - 40, 160, "deck"); dogs734(x, tm); H.bubble(x, "The prison sent dogs now?", LW / 2 - 460, BAR + 80, 360); H.bubble(x, "We sent ourselves.", LW / 2 - 420, BAR + 155, 280); } },
        { dur: 2600, cap: "Manchez presses Waldo's broken mask emblem to the glass.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2 + 100, LH - BAR - 40, 160, "deck"); dogs734(x, tm); x.fillStyle = RED; H.rr(x, LW / 2 - 60, BAR + 160, 60, 44, 6); x.fill(); x.fillStyle = "#0d0a18"; x.beginPath(); x.arc(LW / 2 - 44, BAR + 176, 5, 0, 7); x.arc(LW / 2 - 20, BAR + 176, 5, 0, 7); x.fill(); } },
        { dur: 2400, cap: "\"Waldo is captured.\" — K stands. \"Open the door.\"", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2, LH - BAR - 40, 200, "fist"); dogs734(x, tm); H.bubble(x, "Open the door.", LW / 2 - 120, BAR + 90, 220); } },
        { dur: 2800, cap: "The suppression collar breaks. Emerald light returns.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2, LH - BAR - 40, 210, "fist"); x.strokeStyle = GREEN; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + tm / 400; x.beginPath(); x.moveTo(LW / 2, LH - BAR - 160); x.lineTo(LW / 2 + Math.cos(a) * 90, LH - BAR - 160 + Math.sin(a) * 60); x.stroke(); } dogs734(x, tm); H.txt(x, "SUPPRESSION COLLAR — OFFLINE", LW / 2, BAR + 60, 16, GREEN, "center", true); } },
      ],
      gk3: [
        { dur: 2400, cap: "The prison was trained on a thousand simulated Mikes.", draw(x, tm) { vaultBg734(x, tm); H.twinCity(x, tm, LW / 2 - 380, BAR + 80, 760, 320, false); H.txt(x, "SIMULATION ARCHIVE — 4,096 RUNS", LW / 2, BAR + 60, 16, PUR, "center", true); } },
        { dur: 2600, cap: "\"Every route I choose is already blocked.\" — \"Prove you're not Mike.\"", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2 + 160, LH - BAR - 40, 170, "deck"); dogs734(x, tm); H.bubble(x, "Every route I choose is already blocked.", LW / 2 - 520, BAR + 80, 460); H.bubble(x, "Prove it.", LW / 2 - 500, BAR + 160, 140); } },
        { dur: 2600, cap: "\"Give me the stupidest plan you have.\" Manchez drops a wrench.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2 + 140, LH - BAR - 40, 170, "deck"); dogs734(x, tm); x.strokeStyle = "#9fb7d9"; x.lineWidth = 5; x.beginPath(); x.moveTo(LW / 2 - 260, LH - BAR - 70); x.lineTo(LW / 2 - 200, LH - BAR - 90); x.stroke(); H.bubble(x, "That is unbelievably stupid.", LW / 2 - 500, BAR + 90, 340); } },
        { dur: 2800, cap: "THE GHOST FORK — four believable Ks. The model can't pick one.", draw(x, tm) { vaultBg734(x, tm); for (let i = 0; i < 4; i++) { x.globalAlpha = i ? .35 : 1; kFig734(x, LW / 2 - 240 + i * 160, LH - BAR - 40, 150, "deck"); } x.globalAlpha = 1; H.txt(x, "GHOST FORK — ACTIVE", LW / 2, BAR + 60, 18, GREEN, "center", true); } },
        { dur: 2600, cap: "GHOST FORK UNLOCKED — a decoy answers when you're cornered.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2, LH - BAR - 40, 170, "fist"); dogs734(x, tm); H.panel(x, LW / 2 - 300, BAR + 80, 600, 60, "#0d1f16"); H.txt(x, "GHOST FORK UNLOCKED", LW / 2, BAR + 110, 19, GREEN, "center", true); } },
      ],
      gk4: [
        { dur: 2400, cap: "CELL 1984. Waldo. Alive. Irritated. Hungry.", draw(x, tm) { vaultBg734(x, tm); cell734(x, tm, 1984, RED); } },
        { dur: 2800, cap: "\"You never told me I was a clone.\" — \"What you were didn't matter.\"", draw(x, tm) { vaultBg734(x, tm); cell734(x, tm, 1984, RED); kFig734(x, LW / 2 - 300, LH - BAR - 40, 160, "deck"); H.bubble(x, "You never told me I was a clone.", 180, BAR + 80, 400); H.bubble(x, "What you were didn't matter.", LW / 2 - 150, BAR + 160, 380); } },
        { dur: 2600, cap: "\"Then decide what it means. Don't let them decide for you.\"", draw(x, tm) { vaultBg734(x, tm); cell734(x, tm, 1984, RED); kFig734(x, LW / 2 - 300, LH - BAR - 40, 170, "fist"); H.bubble(x, "Then decide what it means.", 200, BAR + 90, 340); dogs734(x, tm); } },
        { dur: 2800, cap: "The door opens. UNKNOWN VARIABLE → BROTHERS BY CHOICE.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2 - 140, LH - BAR - 40, 180, "deck"); if (window.v733 && drawWaldoRef734) drawWaldoRef734(x, LW / 2 + 140, LH - BAR - 40, 180, "wave", true); dogs734(x, tm); H.txt(x, "BROTHERS BY CHOICE", LW / 2, BAR + 60, 18, GOLD, "center", true); } },
      ],
      gk5: [
        { dur: 2400, cap: "THE ARCHIVE OF MIKES. Dozens of unfinished versions.", draw(x, tm) { vaultBg734(x, tm); for (let i = 0; i < 6; i++) { const ax = 140 + i * 180; x.strokeStyle = PUR; x.globalAlpha = .4; H.rr(x, ax, BAR + 90, 120, 300, 8); x.stroke(); x.globalAlpha = 1; H.silhouette(x, ax + 60, BAR + 370, 140, "#141126"); } H.txt(x, "CLONE ARCHIVE", LW / 2, BAR + 60, 18, PUR, "center", true); } },
        { dur: 2600, cap: "The K-0 archive crystal. Every simulated Mike they ever ran.", draw(x, tm) { vaultBg734(x, tm); x.fillStyle = GREEN; x.save(); x.translate(LW / 2, BAR + 220); x.rotate(tm / 1400); x.beginPath(); x.moveTo(0, -34); x.lineTo(24, 0); x.lineTo(0, 34); x.lineTo(-24, 0); x.closePath(); x.fill(); x.restore(); x.strokeStyle = GREEN; x.globalAlpha = .4; x.beginPath(); x.arc(LW / 2, BAR + 220, 60 + 8 * Math.sin(tm / 300), 0, 7); x.stroke(); x.globalAlpha = 1; H.txt(x, "ARCHIVE CRYSTAL — K-0 · MIKE SIMULATIONS", LW / 2, BAR + 300, 15, GREEN, "center", true); } },
        {
          dur: 0, cap: "Install it and lose himself. Destroy it. Or divide it.", choice: {
            prompt: "THE CRYSTAL",
            options: ["1 — INSTALL (Mike's patterns, less of me)", "2 — DESTROY (stronger fork)", "3 — DIVIDE (archive it for later)"],
            store: "_v734archive", values: ["restore", "destroy", "divide"]
          }, draw(x, tm) { vaultBg734(x, tm); x.fillStyle = GREEN; x.save(); x.translate(LW / 2, BAR + 200); x.rotate(tm / 1400); x.beginPath(); x.moveTo(0, -30); x.lineTo(21, 0); x.lineTo(0, 30); x.lineTo(-21, 0); x.closePath(); x.fill(); x.restore(); kFig734(x, LW / 2 - 260, LH - BAR - 40, 170, "deck"); dogs734(x, tm); }
        },
        { dur: 2800, cap: "Neither the Directorate's truth nor its erasure. His own.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2, LH - BAR - 40, 190, "fist"); dogs734(x, tm); const p = (meta734() || {})._v734archive; H.txt(x, p === "destroy" ? "THE FORK BURNS BRIGHTER." : p === "restore" ? "HE CARRIES MIKE'S PLAYBOOK NOW." : "THE TRUTH, FILED UNDER HIS OWN NAME.", LW / 2, BAR + 60, 15, GOLD, "center", true); } },
        { dur: 2400, cap: "Warden Null sends the champion: NULL SHEPHERD. Suburbs, tomorrow night.", draw(x, tm) { vaultBg734(x, tm); shepherdFig734(x, LW / 2, LH - BAR - 40, 220, tm); H.txt(x, "NULL SHEPHERD — INBOUND", LW / 2, BAR + 60, 18, RED, "center", true); } },
      ],
      gk6: [
        { dur: 2400, cap: "The Vault collapses between timelines. One craft left.", draw(x, tm) { vaultBg734(x, tm); x.fillStyle = "rgba(255,68,85,.08)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); for (let i = 0; i < 8; i++) { x.strokeStyle = "rgba(160,107,255,.4)"; x.beginPath(); x.moveTo((i * 197 + tm / 8) % LW, BAR); x.lineTo((i * 197 + tm / 8 + 60) % LW, LH - BAR); x.stroke(); } } },
        { dur: 2600, cap: "Someone must stay connected. K quietly locks the door.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2, LH - BAR - 40, 190, "deck"); H.bubble(x, "You gave me a choice once.", LW / 2 - 400, BAR + 90, 360); H.txt(x, "CONTROL ROOM — SEALED FROM INSIDE", LW / 2, BAR + 60, 14, RED, "center", true); } },
        { dur: 2800, cap: "The dogs route the portal math across all four minds. No one stays.", draw(x, tm) { vaultBg734(x, tm); kFig734(x, LW / 2 - 60, LH - BAR - 40, 170, "deck"); if (window.v733 && drawWaldoRef734) drawWaldoRef734(x, LW / 2 + 160, LH - BAR - 40, 170, "idle", true); dogs734(x, tm); x.strokeStyle = GREEN; x.lineWidth = 2; x.beginPath(); x.moveTo(LW / 2 - 60, LH - BAR - 150); x.lineTo(LW / 2 + 160, LH - BAR - 150); x.lineTo(LW / 2 - 245, LH - BAR - 60); x.stroke(); H.txt(x, "DISTRIBUTED CALCULATION — 4 MINDS", LW / 2, BAR + 60, 15, GREEN, "center", true); } },
        { dur: 2800, cap: "Warden Null escapes as a fragment — inside K's own archive.", draw(x, tm) { vaultBg734(x, tm); shepherdFig734(x, LW / 2 + 220, LH - BAR - 30, 130, tm); x.globalAlpha = .35; kFig734(x, LW / 2 - 180, LH - BAR - 40, 170, "deck"); x.globalAlpha = 1; H.txt(x, "FRAGMENT LODGED — THE ARCHIVE", LW / 2, BAR + 60, 15, PUR, "center", true); } },
        { dur: 3000, cap: "Aboard the stolen shuttle, course: Earth. He scratches one emerald letter. Just K.", draw(x, tm) { H.bg(x, "#0a0e20"); H.cityGlow(x, tm, 30); kFig734(x, LW / 2 - 100, LH - BAR - 40, 190, "idle"); if (window.v733 && drawWaldoRef734) drawWaldoRef734(x, LW / 2 + 140, LH - BAR - 40, 180, "wave", true); dogs734(x, tm); x.fillStyle = "#10152a"; H.rr(x, LW / 2 - 70, BAR + 100, 140, 84, 8); x.fill(); x.strokeStyle = GREEN; x.lineWidth = 3; H.rr(x, LW / 2 - 70, BAR + 100, 140, 84, 8); x.stroke(); H.txt(x, "K", LW / 2, BAR + 142, 44, GREEN, "center", true); H.txt(x, "K JOINS THE CREW — GHOST FORK ONLINE", LW / 2, BAR + 216, 15, GOLD, "center", true); } },
      ],
    };
    const GK_TITLES = {
      gk1: "GHOST FORK I — TWO GOOD DOGS", gk2: "GHOST FORK II — THE MAN IN CELL 118",
      gk3: "GHOST FORK III — GHOST IN THE SYSTEM", gk4: "GHOST FORK IV — CELL 1984",
      gk5: "GHOST FORK V — THE ARCHIVE OF MIKES", gk6: "GHOST FORK VI — THE IMPOSSIBLE EXIT",
    };
    for (const id in GK_SHOTS) v725.register(id, { title: GK_TITLES[id], shots: GK_SHOTS[id], cues: { 1: "beep520", [GK_SHOTS[id].length - 1]: "chime" } });
  }

  // ==========================================================================
  // TRIGGERS — day-end chain (outermost; after every earlier pack)
  // ==========================================================================
  const _checkDayEnd734 = checkDayEnd;
  function pending734(s) {
    const m = s.meta || {};
    const day = m.day || s.day || 0;
    if (!m._v733ghost) return null; // the Ghost Shift seed must be planted first
    if (day >= 20 && !m._v734gk1) return "gk1";
    if (day >= 21 && m._v734gk1 && !m._v734gk2) return "gk2";
    if (day >= 22 && m._v734gk2 && !m._v734gk3) return "gk3";
    if (day >= 23 && m._v734gk3 && !m._v734gk4) return "gk4";
    if (day >= 24 && m._v734gk4 && !m._v734gk5) return "gk5";
    if (day >= 25 && m._v734gk5 && m._v734shepherdDown && !m._v734gk6) return "gk6";
    return null;
  }
  const GK_FLAG = { gk1: "_v734gk1", gk2: "_v734gk2", gk3: "_v734gk3", gk4: "_v734gk4", gk5: "_v734gk5", gk6: "_v734gk6" };
  function rewards734(id) {
    const m = meta734(); if (!m) return;
    m._v734loot = m._v734loot || {};
    if (id === "gk2") { m._v734loot.keycard = true; m._v734loot.emblem = true; }
    if (id === "gk3") { m._v734fork = true; }
    if (id === "gk4") { m._v734brothers = true; if (window.v733) { /* Waldo rep: the rescue is the friendship */ m._v733rep = (m._v733rep || 0) + 20; } }
    if (id === "gk5") { if (m._v734archive === "destroy") m._v734forkPlus = true; }
    if (id === "gk6") { m._v734k = true; m._v734loot.wrench = true; m._v734loot.module = true; m._v734loot.photo = true; }
    try { save(); } catch (e) { }
  }
  window.checkDayEnd = function (force) {
    const s = (typeof S !== "undefined") ? S : null;
    try {
      if (s && s.meta && !v725.active() && !s.nightMode && !s.battle &&
        !(typeof dlgOpen !== "undefined" && dlgOpen && dlgOpen()) &&
        !(window.v722 && v722.active && v722.active()) &&
        !(window.v723 && v723.active && v723.active()) &&
        !(window.v724 && v724.active && v724.active())) {
        const id = pending734(s);
        const day = s.meta.day || s.day;
        const done = (s.ticketsDone >= s.ticketsTotal) || force;
        if (id && done && s.meta._v734Day !== day) {
          // one cinematic per day across ALL packs
          s.meta._v734Day = day; s.meta._v733Day = day; s.meta._v730Day = day;
          s.meta._v729Day = day; s.meta._v727Day = day; s.meta._v726Day = day; s.meta._v725Day = day;
          const ok = v725.play(id, function () {
            _checkDayEnd734(force);
            try { s.meta[GK_FLAG[id]] = true; rewards734(id); } catch (e) { }
          });
          if (ok) return;
        }
      }
    } catch (e) { window.__err734b = String(e && e.stack || e); }
    return _checkDayEnd734(force);
  };

  // ---------- K at Waldo's porch (post-gk6 conversation, once per night) ----------
  const _interact734 = interact;
  window.interact = function () {
    const s = S;
    if (s && s.nightMode && window.v733 && v733.atWaldo() && !s.inDialog && meta734() && meta734()._v734k) {
      if (typeof NM !== "undefined" && NM && Math.abs(NM.x - 980) < 70) {
        const ws = (NM.waldo = NM.waldo || { used: {} });
        if (ws.used.k734) { dlg("🎹 K", "\"The piano stays in tune out here. Waldo tunes it with a wrench. I stopped asking.\"", [{ t: "Ha.", f: closeDlg }]); return; }
        ws.used.k734 = true;
        addStress(-6);
        if (window.v733) S.meta._v733rep = (S.meta._v733rep || 0) + 3;
        dlg("🎹 K", "K picks out something slow on the emerald piano. Manchez headbutts your shin; Katrin translates your heartbeat and files it under ACCEPTABLE.<br><br><i>\"You ever hear a story so many times it feels like it happened to you?\"</i><br><small>-6 stress · +3 Waldo rep</small>", [
          { t: "\"You're not the version of me they made.\"", f: () => { closeDlg(); dlg("🎹 K", "<i>\"Neither are you.\"</i> He goes back to the piano. The dogs argue about it in barks.", [{ t: "Good night, K.", f: closeDlg }]); } },
          { t: "Just listen.", f: closeDlg },
        ]);
        return;
      }
    }
    return _interact734();
  };

  // ---------- exports ----------
  window.v734 = {
    version: VER,
    bgLoaded: () => Object.keys(window.NM_BG734).filter(k => { const im = window.NM_BG734[k]; return im && im.complete && im.naturalWidth; }),
    missions: () => { const m = meta734() || {}; return GK_FLAG ? Object.keys(GK_FLAG).filter(k => m[GK_FLAG[k]]) : []; },
    state: () => { const m = meta734() || {}; return { ghost: !!m._v733ghost, archive: m._v734archive || null, shepherdDown: !!m._v734shepherdDown, k: !!m._v734k, fork: !!m._v734fork, brothers: !!m._v734brothers, loot: m._v734loot || {} }; },
    shepherdUp: shepherdUp734,
    play: (id) => v725.play(id || "gk1", null),
  };
  console.log("[v7.34] Ghost Fork loaded — the Vault listens");
})();

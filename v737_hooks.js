/* ==========================================================================
   v7.37 — NIGHT CRAWLER playable from the main menu (production visual patch)
   Wrap-only (game.js / night_hooks.js untouched):
     · Title-screen button "🌙 NIGHT CRAWLER" starts a dedicated Night Crawler
       run at 16:00. Explicit CLOCK IN always starts Mike/day mode and clears
       any stale Night Crawler selector left in localStorage.
     · Night Crawler rendering delegates to the production reference authority
       (NIGHT_WALKER_REFERENCE_V1 via TechOpsNightReferenceVisuals). The old
       NIGHT_WALKER decoder remains compatibility/restoration code only and is
       not the normal production player path.
     · Late-stage Good Dogs bridge: when the v7.36 breakout is active, the
       engine's Mike body is suppressed for the render pass and the currently
       controlled Katrin/Manchez fighter is drawn from KATRIN_MANCHEZ. The
       v7.36 partner, HUD, objectives and combat math remain untouched.
     · Satellite beam special on S (unused by night mode): 2× sweep-finisher
       damage, 1.5 s cooldown. All Mike damage/timing/collision numbers are
       unchanged — pure reskin plus this one additive special.
   ========================================================================== */
(function () {
  const VER = "7.37";
  if (window.v737) return;
  window.v737 = true;
  try {
    const meta737 = () => { try { return (typeof S !== "undefined" && S) ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };
    const isNC = () => { const m = meta737(); return !!(m && m._char === "nightcrawler"); };

    // ---------- historical NIGHT_WALKER decoder (restoration compatibility only) ----------
    let nwImg = null;
    const NW = () => (typeof NIGHT_WALKER !== "undefined") ? NIGHT_WALKER : null;
    function nwSourceRect(A, key) {
      const fr = A.frames[key] || A.frames[Object.keys(A.frames)[0]];
      const C = A.cell || 64;
      // NIGHT_WALKER stores pixel offsets ([0,128],[256,128]...), while older
      // grid atlases store cell coordinates ([0,1],[2,1]...). Support both for
      // diagnostics/restoration without making this the production sprite path.
      const sx = fr[0] >= C || fr[1] >= (A.cellH || C) ? fr[0] : fr[0] * C;
      const sy = fr[0] >= C || fr[1] >= (A.cellH || C) ? fr[1] : fr[1] * (A.cellH || C);
      return [sx, sy, C, (A.cellH || C)];
    }
    function nwFrame(key, x, dx, dy, h, flip) {
      try {
        const A = NW();
        if (!A || !A.src || !A.frames) throw 0;
        if (!nwImg) { nwImg = new Image(); nwImg.src = A.src; }
        if (!nwImg.complete || !nwImg.naturalWidth) throw 0;
        const fr = nwSourceRect(A, key);
        x.imageSmoothingEnabled = false;
        if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(nwImg, fr[0], fr[1], fr[2], fr[3], -h / 2, dy - h, h, h); x.restore(); }
        else x.drawImage(nwImg, fr[0], fr[1], fr[2], fr[3], dx - h / 2, dy - h, h, h);
        return true;
      } catch (e) { return false; }
    }
    const nwKey = (row, i, n) => { const A = NW(); const k = row + (n ? (i % n) : 0); return (A && A.frames && A.frames[k]) ? k : row + "0"; };

    // ---------- active Good Dogs production-atlas bridge ----------
    let gdImg737 = null;
    const GD737 = () => (typeof KATRIN_MANCHEZ !== "undefined") ? KATRIN_MANCHEZ : null;
    function gdFrame737(key, x, cx, base, h, flip) {
      try {
        const A = GD737();
        if (!A || !A.src || !A.frames || !A.frames[key]) return false;
        if (!gdImg737) { gdImg737 = new Image(); gdImg737.src = A.src; }
        if (!gdImg737.complete || !gdImg737.naturalWidth) return false;
        const fr = A.frames[key];
        if (!fr || fr.length < 4 || !(fr[2] > 0 && fr[3] > 0)) return false;
        const dw = h * (fr[2] / fr[3]);
        x.save(); x.imageSmoothingEnabled = false;
        if (flip) { x.translate(cx, 0); x.scale(-1, 1); x.drawImage(gdImg737, fr[0], fr[1], fr[2], fr[3], -dw / 2, base - h, dw, h); }
        else x.drawImage(gdImg737, fr[0], fr[1], fr[2], fr[3], cx - dw / 2, base - h, dw, h);
        x.restore();
        return true;
      } catch (e) { return false; }
    }
    function gdKey737(who, NM, now) {
      const p = who === "katrin" ? "kat_" : "man_";
      const A = GD737();
      const has = (k) => !!(A && A.frames && A.frames[k]);
      if (NM.hp <= 0) return p + "down";
      if (NM.ifr > 0 && has(p + "wall_hit") && Math.floor(now / 80) % 2) return p + "wall_hit";
      if (NM.dashT > 0 && has(p + "roll")) return p + "roll";
      if (NM.jabAnim > 0) {
        if (who === "katrin") return has("kat_strike") && NM.jabStage === 2 ? "kat_strike" : "kat_pounce";
        return has("man_strike") && NM.jabStage === 2 ? "man_strike" : "man_pounce";
      }
      if (NM.block && has(p + "shield")) return p + "shield";
      if (!NM.onGround && has(p + "leap")) return p + "leap";
      // There is no authored walk row in this source sheet. Cycle the seven
      // clean idle/motion frames instead of pretending attack poses are walk.
      const idle = p + "idle" + (Math.floor(now / (Math.abs(NM.vx) > .5 ? 105 : 155)) % 7);
      return has(idle) ? idle : p + "idle0";
    }
    function drawGoodDogActive737(x, NM, now, oldW, oldH) {
      try {
        const cs = NM && NM._v736;
        if (!cs || !cs.active || (cs.chars && cs.chars[cs.active] && cs.chars[cs.active].downed)) return false;
        const who = cs.active === "manchez" ? "manchez" : "katrin";
        const h = Math.max(50, (oldH || 42) * 1.45);
        const cx = NM.x - NM.cam + (oldW || 28) / 2;
        const base = NM.y + (oldH || 42);
        return gdFrame737(gdKey737(who, NM, now), x, cx, base, h, NM.face < 0);
      } catch (e) { return false; }
    }

    // ---------- procedural fallback (used only while production reference image decodes) ----------
    function drawNCFallback(x, NM, px, py, now) {
      const w = NM.w, h = NM.h, cxp = px + w / 2, cyp = py + h / 2;
      if (NM.dashT > 0) {
        x.save(); x.globalAlpha = .22;
        for (let i = 1; i <= 3; i++) { x.fillStyle = "#b18cff"; x.fillRect(px - NM.face * i * 9, py + 6, w, h - 6); }
        x.restore();
      }
      x.save();
      x.translate(cxp, cyp);
      if (NM.flip > 0) x.rotate((NM.face) * (16 - NM.flip) / 16 * Math.PI * 2);
      if (NM.ifr > 0 && Math.floor(now / 80) % 2) x.globalAlpha = .45;
      x.scale(NM.face, 1);
      x.fillStyle = "#0b0916"; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 6); x.fill();
      x.strokeStyle = "#7b5cff88"; x.lineWidth = 2; x.stroke();
      x.fillStyle = "#2dd4bf"; x.fillRect(-3, -h / 2 + 6, 6, 3);
      if (NM.jabAnim > 0) {
        x.fillStyle = "#1a1430";
        if (NM.jabStage === 2) { x.fillRect(w / 2 - 2, -10, 18, 5); x.fillRect(w / 2 - 2, 2, 18, 5); }
        else x.fillRect(w / 2 - 2, -4 + (NM.jabStage === 1 ? -5 : 0), 16, 6);
      }
      x.restore();
      x.save(); x.globalAlpha = .5 + .2 * Math.sin(now / 260);
      x.fillStyle = "#8b5cf6";
      for (let i = 0; i < 3; i++) {
        const a = now / 420 + i * 2.1;
        x.fillRect(cxp + Math.cos(a) * (w * .9) - 2, py + 6 + ((i * 13 + now / 30) % (h - 8)), 4, 4);
      }
      x.restore();
      if (NM.block) { x.strokeStyle = "#2dd4bf"; x.lineWidth = 3; x.beginPath(); x.arc(cxp, cyp, 24, -1.2, 1.2); x.stroke(); }
    }

    // ---------- production-authority Night Crawler player figure ----------
    function drawNCPlayer(x, NM, px, py, now) {
      try {
        const ref = window.TechOpsNightReferenceVisuals;
        if (ref && typeof ref.drawReferenceNightWalker === "function") {
          if (ref.drawReferenceNightWalker(x, NM, px, py, now)) return true;
          drawNCFallback(x, NM, px, py, now);
          return false;
        }
      } catch (e) { }
      // Do not fall back to the retired NIGHT_WALKER payload: it is historical
      // restoration material and is the source of the incorrect production sprite.
      drawNCFallback(x, NM, px, py, now);
      return false;
    }

    // ---------- satellite beam special (S key — untouched by night mode) ----------
    const BEAM_DMG = 36;
    const BEAM_CD = 1500;
    function ncBeam() {
      if (!NM || NM.drive || NM.block) return;
      const now = performance.now();
      if (NM._737beamCD && now < NM._737beamCD) return;
      NM._737beamCD = now + BEAM_CD;
      NM._737beamT = 26;
      const bx0 = NM.face > 0 ? NM.x + NM.w : NM.x - 280, bw = 280;
      let hit = false;
      for (const e of NM.enemies) {
        if (!e.alive || e.down > 0) continue;
        if (e.x + e.w > bx0 && e.x < bx0 + bw && Math.abs(e.y - NM.y) < 52) {
          hit = true;
          e.hp -= BEAM_DMG; e.hitT = 8; e.kb = NM.face * 8;
          NM.hitStop = Math.max(NM.hitStop, 5);
          if (e.hp <= 0) {
            e.alive = false; NM.kills++;
            NM.hitStop = Math.max(NM.hitStop, 8);
            const c = e.cash[0] + Math.floor(Math.random() * (e.cash[1] - e.cash[0] + 1));
            NM.cash += c;
            NM.msg = `🛰️ ${e.name} vaporized by the satellite beam! +$${c}`; NM.msgT = now + 1400;
          }
        }
      }
      NM.msg = hit ? (NM.msgT > now ? NM.msg : "🛰️ SATELLITE BEAM") : "🛰️ SATELLITE BEAM — nothing in the line";
      NM.msgT = now + 900;
      sfx(hit ? "hit" : "portal");
      nmCheckClear();
    }
    function drawNCBeam(x, NM, now) {
      if (!NM._737beamT || NM._737beamT <= 0) return;
      const a = Math.min(1, NM._737beamT / 14);
      const bx = NM.face > 0 ? NM.x + NM.w - NM.cam : NM.x - 280 - NM.cam;
      x.save();
      x.globalAlpha = .75 * a;
      x.shadowColor = "#2dd4bf"; x.shadowBlur = 18;
      x.fillStyle = "#2dd4bf"; x.fillRect(bx, NM.y + 4, 280, 7);
      x.fillStyle = "#b18cff"; x.fillRect(bx, NM.y + 8, 280, 2);
      x.restore();
    }

    // ---------- character select: newState + run start ----------
    const __origNewState737 = newState;
    newState = function () {
      const s = __origNewState737();
      try { if (localStorage.getItem("techops_char") === "nightcrawler") s.meta._char = "nightcrawler"; } catch (e) { }
      return s;
    };

    // Explicit CLOCK IN means normal Mike/day run. Night Crawler uses either
    // the production router desired-mode flag or this local transient intent.
    function clearStaleNightSelectionForNormalStart(ev) {
      try {
        const target = ev && ev.target;
        const start = target && typeof target.closest === "function" ? target.closest("#btn-start") : null;
        if (!start) return false;
        if (window.__productionDesiredMode === "nightcrawler" || window.__v737NightStartIntent) return false;
        if (localStorage.getItem("techops_char") !== "nightcrawler") return false;
        localStorage.removeItem("techops_char");
        const m = meta737();
        if (m && m._char === "nightcrawler") delete m._char;
        window.__productionNormalRunClearedNightcrawler = true;
        return true;
      } catch (e) { return false; }
    }
    try { document.addEventListener("click", clearStaleNightSelectionForNormalStart, true); } catch (e) { }

    function ncEnterNight(s) {
      try {
        if (!s || s.nightMode || typeof enterNight !== "function") return;
        s.clock = Math.max(s.clock || 0, 16 * 60);
        enterNight();
      } catch (e) { }
    }
    const __origStartRun737 = startRun;
    startRun = function () {
      __origStartRun737();
      try { if (isNC()) ncEnterNight(S); } catch (e) { }
    };
    try {
      const bc = document.getElementById("btn-continue");
      if (bc) bc.addEventListener("click", () => { setTimeout(() => { try { if (isNC()) ncEnterNight(S); } catch (e) { } }, 0); });
    } catch (e) { }

    if (typeof exitNight === "function") {
      const __origExitNight737 = exitNight;
      exitNight = function (homeSafe) {
        __origExitNight737(homeSafe);
        try { if (isNC()) ncEnterNight(S); } catch (e) { }
      };
    }

    // ---------- night-mode wraps (Good Dogs campaign bridge + Night Crawler) ----------
    if (typeof stepNM === "function") {
      const __origStepNM737 = stepNM;
      stepNM = function (dt) {
        if (!isNC() || !NM) return __origStepNM737(dt);
        const hp0 = NM.hp, f = dt * 60;
        const sKey = keys.s;
        if (sKey && !NM._737sHeld) ncBeam();
        NM._737sHeld = !!sKey;
        if (NM._737beamT > 0) NM._737beamT -= f;
        __origStepNM737(dt);
        if (NM && NM.hp < hp0) NM._737hitT = performance.now() + 420;
      };
    }
    if (typeof drawNM === "function") {
      const __origDrawNM737 = drawNM;
      drawNM = function () {
        if (NM && NM._v736) {
          const svW = NM.w, svH = NM.h, svB = NM.block;
          NM.w = 0; NM.h = 0; NM.block = false;
          try { __origDrawNM737(); } finally { NM.w = svW; NM.h = svH; NM.block = svB; }
          if (!NM.drive) drawGoodDogActive737(ctx, NM, performance.now(), svW, svH);
          return;
        }
        if (!isNC() || !NM) return __origDrawNM737();
        const svW = NM.w, svH = NM.h, svB = NM.block;
        NM.w = 0; NM.h = 0; NM.block = false;
        try { __origDrawNM737(); } finally { NM.w = svW; NM.h = svH; NM.block = svB; }
        if (!NM.drive) {
          drawNCBeam(ctx, NM, performance.now());
          drawNCPlayer(ctx, NM, NM.x - NM.cam, NM.y, performance.now());
        }
      };
    }

    // ---------- title screen: character select ----------
    (function ncTitle() {
      try {
        const ts = document.getElementById("title-screen"); if (!ts) return;
        const b = document.createElement("button");
        b.id = "btn-nightcrawler";
        b.textContent = "🌙 NIGHT CRAWLER";
        b.onclick = () => {
          window.__v737NightStartIntent = true;
          try {
            localStorage.setItem("techops_char", "nightcrawler");
            document.getElementById("btn-start").click();
          } finally {
            window.__v737NightStartIntent = false;
          }
        };
        ts.appendChild(b);
        const back = document.createElement("div");
        back.id = "v737-backmike";
        back.textContent = "← play as Mike instead";
        back.style.display = localStorage.getItem("techops_char") === "nightcrawler" ? "block" : "none";
        back.style.cursor = "pointer";
        back.onclick = () => { localStorage.removeItem("techops_char"); location.reload(); };
        ts.appendChild(back);
      } catch (e) { }
    })();

    console.log("[v7.37] Night Crawler normal-run isolation + production sprite authority loaded");
  } catch (e) { try { console.warn("[v7.37] load error", e); } catch (_) { } }
})();
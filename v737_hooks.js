/* ==========================================================================
   v7.37 — NIGHT CRAWLER playable from the main menu (NIGHT_WALKER form)
   Wrap-only (game.js / night_hooks.js untouched):
     · Title-screen button "🌙 NIGHT CRAWLER" (v6.4 felTitle pattern) — starts
       a run that drops straight into night mode at 16:00 as the glitch-void
       walker instead of day-Mike. "← play as Mike instead" backlink clears it.
     · Player night-mode draw reskinned to the NIGHT_WALKER atlas
       (idle/walk/guard/light/launcher/dash/beam/hit/down/defeat) with a
       procedural dark-silhouette fallback when the atlas payload is absent.
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

    // ---------- atlas (contract: window.NIGHT_WALKER from night_walker.atlas.js) ----------
    let nwImg = null;
    const NW = () => (typeof NIGHT_WALKER !== "undefined") ? NIGHT_WALKER : null;
    function nwSourceRect(A, key) {
      const fr = A.frames[key] || A.frames[Object.keys(A.frames)[0]];
      const C = A.cell || 64;
      // NIGHT_WALKER stores pixel offsets ([0,128],[256,128]...), while older
      // grid atlases store cell coordinates ([0,1],[2,1]...). Support both so
      // restored payloads animate instead of sampling outside the sheet.
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

    // ---------- procedural fallback (same footprint as the nm Mike figure) ----------
    function drawNCFallback(x, NM, px, py, now) {
      const w = NM.w, h = NM.h, cxp = px + w / 2, cyp = py + h / 2;
      // glitch dash trail
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
      // dark silhouette body
      x.fillStyle = "#0b0916"; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 6); x.fill();
      x.strokeStyle = "#7b5cff88"; x.lineWidth = 2; x.stroke(); // void rim
      // teal eye
      x.fillStyle = "#2dd4bf"; x.fillRect(-3, -h / 2 + 6, 6, 3);
      // jab / beam arm
      if (NM.jabAnim > 0) {
        x.fillStyle = "#1a1430";
        if (NM.jabStage === 2) { x.fillRect(w / 2 - 2, -10, 18, 5); x.fillRect(w / 2 - 2, 2, 18, 5); }
        else x.fillRect(w / 2 - 2, -4 + (NM.jabStage === 1 ? -5 : 0), 16, 6);
      }
      x.restore();
      // purple wisps
      x.save(); x.globalAlpha = .5 + .2 * Math.sin(now / 260);
      x.fillStyle = "#8b5cf6";
      for (let i = 0; i < 3; i++) {
        const a = now / 420 + i * 2.1;
        x.fillRect(cxp + Math.cos(a) * (w * .9) - 2, py + 6 + ((i * 13 + now / 30) % (h - 8)), 4, 4);
      }
      x.restore();
      if (NM.block) { x.strokeStyle = "#2dd4bf"; x.lineWidth = 3; x.beginPath(); x.arc(cxp, cyp, 24, -1.2, 1.2); x.stroke(); }
    }

    // ---------- atlas-driven player figure ----------
    function drawNCPlayer(x, NM, px, py, now) {
      const h = NM.h * 1.5, cxp = px + NM.w / 2, flip = NM.face < 0, dy = py + NM.h;
      const anim = (row, n, spd) => nwKey(row, Math.floor(now / (spd || 110)), n);
      let key = null;
      if (NM.hp <= 0) key = anim("defeat", 10, 90);
      else if (NM._737beamT > 0) key = nwKey("beam", Math.floor((26 - NM._737beamT) / 26 * 8), 8);
      else if (NM._737hitT > now) key = NM.onGround ? anim("hit", 6, 70) : anim("down", 6, 90);
      else if (NM.dashT > 0) key = anim("dash", 6, 60);
      else if (NM.jabAnim > 0) {
        if (NM.jabStage === 2) key = nwKey("launcher", Math.floor((9 - NM.jabAnim) / 9 * 5), 5); // the sweep launches
        else key = nwKey("light", NM.jabStage * 3 + Math.floor((9 - NM.jabAnim) / 9 * 3), 8);
      }
      else if (NM.block) key = anim("guard", 4, 140);
      else if (NM.flip > 0 || !NM.onGround) key = anim("airrec", 4, 130);
      else if (Math.abs(NM.vx) > .5) key = anim("walk", 6, 95);
      else key = anim("idle", 6, 160);
      if (!nwFrame(key, x, cxp, dy, h, flip)) drawNCFallback(x, NM, px, py, now);
    }

    // ---------- satellite beam special (S key — untouched by night mode) ----------
    const BEAM_DMG = 36;          // 2× the sweep finisher's heavy damage (12 × 1.5 × 2)
    const BEAM_CD = 1500;         // 1.5 s cooldown
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
    function ncEnterNight(s) {
      try {
        if (!s || s.nightMode || typeof enterNight !== "function") return;
        s.clock = Math.max(s.clock || 0, 16 * 60); // night door opens 16:00 — walk straight out
        enterNight();
      } catch (e) { }
    }
    const __origStartRun737 = startRun;
    startRun = function () {
      __origStartRun737();
      try { if (isNC()) ncEnterNight(S); } catch (e) { }
    };
    // CONTINUE RUN restores the nightcrawler form (btn-continue handler is anonymous
    // in game.js and synchronous, so this listener runs right after it)
    try {
      const bc = document.getElementById("btn-continue");
      if (bc) bc.addEventListener("click", () => { setTimeout(() => { try { if (isNC()) ncEnterNight(S); } catch (e) { } }, 0); });
    } catch (e) { }

    // a nightcrawler run stays a night run: dawn just rolls into the next night
    if (typeof exitNight === "function") {
      const __origExitNight737 = exitNight;
      exitNight = function (homeSafe) {
        __origExitNight737(homeSafe);
        try { if (isNC()) ncEnterNight(S); } catch (e) { }
      };
    }

    // ---------- night-mode wraps (no-ops unless playing the nightcrawler) ----------
    if (typeof stepNM === "function") {
      const __origStepNM737 = stepNM;
      stepNM = function (dt) {
        if (!isNC() || !NM) return __origStepNM737(dt);
        const hp0 = NM.hp, f = dt * 60;
        const sKey = keys.s;                              // S = satellite beam (unused by nm)
        if (sKey && !NM._737sHeld) ncBeam();
        NM._737sHeld = !!sKey;
        if (NM._737beamT > 0) NM._737beamT -= f;
        __origStepNM737(dt);
        if (NM && NM.hp < hp0) NM._737hitT = performance.now() + 420; // hurt flash for the reskin
      };
    }
    if (typeof drawNM === "function") {
      const __origDrawNM737 = drawNM;
      drawNM = function () {
        if (!isNC() || !NM) return __origDrawNM737();
        // hide Mike's procedural figure during the original pass (zero-size
        // rects, no block arc), then draw the NIGHT_WALKER form on top — HUD,
        // enemies, street and timing all stay byte-identical.
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
        b.onclick = () => { localStorage.setItem("techops_char", "nightcrawler"); document.getElementById("btn-start").click(); };
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

    console.log("[v7.37] night crawler playable loaded");
  } catch (e) { try { console.warn("[v7.37] load error", e); } catch (_) { } }
})();

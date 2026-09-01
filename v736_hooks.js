/* ==========================================================================
   v7.36 — THE 118/1984 BREAKOUT (Katrin & Manchez co-op side campaign)
   A self-contained 8-mission side story built only on existing systems:
     · Cinematics: the shared v7.25 engine (v725.register) — b736m1..b736m8.
     · Combat: the v7.31 night-mode beat-'em-up (wrapped, never edited) on the
       new NM_DISTRICTS.orbital (BLACKSITE MERIDIAN, 2 streets, painted bgs
       orbital_gate → orbital_eye via NM_BG734 with procedural fallback) and
       suburb_rift for the dawn crash.
     · Linked-pair Solo control mode: Katrin (control/setup — cryo-tag
       projectile applies Tracked, tripwire trap) & Manchez (pressure — rapid
       strikes, launcher) with individual HP/stress/status, one-button swap
       (C), partner follow-AI, knockdown → 8s revive window (E) → control
       transfer, mission fails only when BOTH are down.
     · Sync meter: builds on revives + alternating hits within 2s; spend a
       full meter (G) on the TANDEM FINISHER — big damage + freeze frame.
     · K support (post-m4, Q, 25s cooldown): disable cameras (opening stun),
       decrypt doors (skip one wave), decoy Mike (5s aggro pull).
     · Waldo Threat Forecast (post-m6, passive): next wave spawns flash-marked
       3s early; elites take +25% damage.
     · Dialogue chrome: CAMP_UI portraits/plates in briefings when the atlas
       payload is present, v725/dlg() panels otherwise.
     · New sprite contracts (all guarded via atlasFrame736, procedural figures
       always remain the fallback): KATRIN_MANCHEZ kat-/man- solo poses and
       duo- tandem frames (finisher burst), K_FULL (k_orb cryo-tags, k_decoy,
       k_shield uplink, k_emerald K figure), WALDO_FULL w- poses (m6-m8),
       WARDEN (wd_ring/laser/chain/grab boss overlay, wd_barrier split wall),
       SHUTTLE (m7 takeoff, m8 reentry/crash/wreck), NM_BG734 waldo_garage /
       waldo_loft (m8 dawn backdrop), music_venue registered.
     · Completion: S.meta._v736breakout = true → Katrin & Manchez unlocked as
       a selectable night pair (S.meta._v736pair, techops_char-compatible),
       journal/gallery entries, ending stinger.
   Zero impact unless a campaign run is active (every wrap gated on NM._v736).
   ========================================================================== */
(function () {
  const VER = "7.36";
  if (window.v736) return;
  try {
    const meta736 = () => {
      try {
        if (typeof S === "undefined" || !S) return null;
        const m = S.meta || (S.meta = {});
        return m._v736 || (m._v736 = { m: 1, evidence: [], k: false, waldo: false, done: false });
      } catch (e) { return null; }
    };
    const campOn = () => { try { return typeof NM !== "undefined" && NM && NM._v736; } catch (e) { return false; } };
    const now736 = () => performance.now();

    // ================= CAMP_UI contract (variable-size rects, guarded) =================
    let campImg = null;
    function campReady() {
      try {
        const A = window.CAMP_UI;
        if (!A || !A.src) return false;
        if (!campImg) { campImg = new Image(); campImg.src = A.src; }
        return campImg.complete && campImg.naturalWidth;
      } catch (e) { return false; }
    }
    // frames are VARIABLE-SIZE rects [x,y,w,h]; tolerate [col,row] + cell too
    function campFrame(x, key, dx, dy, dw, dh) {
      try {
        if (!campReady()) return false;
        const A = window.CAMP_UI;
        let fr = A.frames && A.frames[key];
        if (!fr) return false;
        let sx, sy, sw, sh;
        if (fr.length >= 4) { sx = fr[0]; sy = fr[1]; sw = fr[2]; sh = fr[3]; }
        else { const C = A.cell || 64; sx = fr[0] * C; sy = fr[1] * C; sw = C; sh = (A.cellH || C); }
        x.imageSmoothingEnabled = false;
        x.drawImage(campImg, sx, sy, sw, sh, dx, dy, dw, dh !== undefined ? dh : dw * (sh / sw));
        return true;
      } catch (e) { return false; }
    }
    function campPortrait(x, key, dx, dy, size) { // portrait over its plate; false → caller falls back
      if (!campReady()) return false;
      const plate = { port_k: "plate_k", port_waldo: "plate_waldo", port_manchez: "plate_manchez", port_katrin: "plate_katrin" }[key] || "plate_transmission";
      const okP = campFrame(x, plate, dx - 6, dy - 6, size + 12, size + 12);
      const okF = campFrame(x, key, dx, dy, size, size);
      return okP || okF;
    }

    // ============ generic variable-rect atlas consumer (guarded; new v7.36 contracts) ============
    const _atlasCache736 = {};
    function atlasSrc736(name, A) {
      try {
        if (A && A.src) return A.src;
        return window["TO_" + name] || null;
      } catch (e) { return null; }
    }
    function atlasImg736(name) {
      try {
        const A = window[name], src = atlasSrc736(name, A);
        if (!A || !src) return null;
        let im = _atlasCache736[name];
        if (!im || im.src !== src) { im = new Image(); im.src = src; _atlasCache736[name] = im; }
        return (im.complete && im.naturalWidth) ? im : null;
      } catch (e) { return null; }
    }
    function atlasFrame736(name, key, x, dx, dy, dw, dh, flip) { // rects [x,y,w,h] or grid [col,row]+cell; returns false → caller falls back
      try {
        const im = atlasImg736(name); if (!im) return false;
        const A = window[name];
        let fr = A.frames && (A.frames[key] || A.frames[key + "0"]);
        if (!fr) return false;
        let sx, sy, sw, sh;
        if (fr.length >= 4) { sx = fr[0]; sy = fr[1]; sw = fr[2]; sh = fr[3]; }
        else { const C = A.cell || 64; sx = fr[0] * C; sy = fr[1] * C; sw = C; sh = (A.cellH || C); }
        if (!(sw > 0 && sh > 0)) return false;
        x.save(); x.imageSmoothingEnabled = false;
        if (flip) { x.translate(dx + dw / 2, 0); x.scale(-1, 1); x.translate(-(dx + dw / 2), 0); }
        x.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh !== undefined ? dh : dw * (sh / sw));
        x.restore();
        return true;
      } catch (e) { return false; }
    }
    function bg734Img(key) { // NM_BG734 entry (Image) if painted & decoded, else null
      try { const im = window.NM_BG734 && window.NM_BG734[key]; return (im && im.complete && im.naturalWidth) ? im : null; } catch (e) { return null; }
    }

    // ================= painted orbital backdrops (payload contract, guarded) =================
    try {
      window.NM_BG734 = window.NM_BG734 || {};
      const PAYLOADS = {
        orbital_gate: () => window.__GK_BG_ORBITAL_GATE,
        orbital_eye: () => window.__GK_BG_ORBITAL_EYE,
        suburb_rift: () => window.__GK_BG_SUBURB_RIFT,
        noc_twin: () => window.__GK_BG_NOC_TWIN,
        waldo_loft: () => window.__GK_BG_WALDO_LOFT,
        waldo_garage: () => window.__GK_BG_WALDO_GARAGE,
        music_venue: () => window.__GK_BG_MUSIC_VENUE,
      };
      for (const id in PAYLOADS) {
        try {
          if (!window.NM_BG734[id]) {
            const src = PAYLOADS[id]();
            if (src) { const im = new Image(); im.src = src; window.NM_BG734[id] = im; }
          }
        } catch (e) { }
      }
    } catch (e) { }

    // ================= districts & bosses (guard if NM tables missing) =================
    try {
      if (typeof NM_DISTRICTS !== "undefined") {
        if (!NM_DISTRICTS.orbital) NM_DISTRICTS.orbital = {
          name: "BLACKSITE MERIDIAN — ORBITAL", streets: 2, danger: 2.0, accent: "#a06bff",
          sky: "#05030e", far: "#0d0a1e", mid: "#16122e", signs: ["CELL 118", "CELL 1984", "ORPHEUS"],
          roster: ["skimmer", "guard", "hunter"],
        };
        if (!NM_DISTRICTS.suburb_rift) NM_DISTRICTS.suburb_rift = {
          name: "SUBURB RIFT — DAWN", streets: 1, danger: 0, accent: "#ffd166",
          sky: "#1a1430", far: "#2a2038", mid: "#3a2c48", signs: ["MAPLE ST", "WALDO'S"], roster: [],
        };
      }
      if (typeof NM_KINDS !== "undefined") {
        if (!NM_KINDS.mikeindex) NM_KINDS.mikeindex = { name: "THE MIKE INDEX", hp: 300, spd: 1.25, dmg: 16, tint: "#67e8f9", cash: [200, 260], w: 30, h: 40, boss: true, blocks: true, dashes: true };
        if (!NM_KINDS.warden1984) NM_KINDS.warden1984 = { name: "WARDEN OF 1984", hp: 380, spd: 0.9, dmg: 20, tint: "#a06bff", cash: [300, 400], w: 40, h: 52, boss: true, lunges: true };
      }
    } catch (e) { }

    // ================= animated dog fallback for the pair =================
    function dogFig736(x, who, dx, dy, h, pose, flip, tm) {
      const u = h / 100;
      const t = tm || 0;
      const tint = who === "katrin" ? "#3fa9f5" : "#f59e0b";
      const coat = who === "katrin" ? "#dcecff" : "#ffe4bd";
      const trim = who === "katrin" ? "#8fd8ff" : "#fbbf24";
      const bob = Math.sin(t / 180) * 2.5 * u;
      const wag = Math.sin(t / 90) * 7 * u;
      const strike = pose === "strike";
      const cast = pose === "cast";
      const shield = pose === "shield";
      const bark = pose === "bark";
      const down = pose === "down";
      const crouch = strike ? 5 * u : 0;
      const lean = strike ? 9 * u : cast ? -3 * u : 0;
      x.save();
      if (flip) { x.translate(dx, 0); x.scale(-1, 1); x.translate(-dx, 0); }
      x.translate(strike ? Math.sin(t / 50) * 2 * u : 0, down ? 7 * u : bob);
      if (down) x.rotate(-0.08);

      x.fillStyle = coat;
      x.beginPath();
      x.ellipse(dx - 1 * u + lean, dy - 30 * u + crouch, 28 * u, down ? 11 * u : 17 * u, 0, 0, 7);
      x.fill();
      x.fillStyle = "#cfc7b8";
      x.beginPath();
      x.ellipse(dx + 15 * u + lean, dy - 43 * u + crouch, 14 * u, down ? 10 * u : 14 * u, 0, 0, 7);
      x.fill();
      x.fillStyle = trim;
      x.beginPath();
      x.arc(dx + 13 * u + lean, dy - 54 * u + crouch, 9 * u, Math.PI, 0);
      x.fill();

      x.fillStyle = "#171008";
      x.beginPath();
      x.arc(dx + 18 * u + lean, dy - 44 * u + crouch, 2.1 * u, 0, 7);
      x.fill();
      x.beginPath();
      x.arc(dx + 28 * u + lean, dy - 38 * u + crouch, 2.6 * u, 0, 7);
      x.fill();
      x.strokeStyle = tint;
      x.lineWidth = 3 * u;
      x.beginPath();
      x.arc(dx + 7 * u + lean, dy - 29 * u + crouch, 10 * u, 0.3, Math.PI - 0.3);
      x.stroke();
      x.fillStyle = tint;
      x.fillRect(dx + 5 * u + lean, dy - 31 * u + crouch, 4 * u, 4 * u);

      x.strokeStyle = coat;
      x.lineWidth = 5 * u;
      x.beginPath();
      x.moveTo(dx - 25 * u + lean, dy - 33 * u + crouch);
      x.quadraticCurveTo(dx - 42 * u + lean, dy - 55 * u - wag + crouch, dx - 30 * u + lean, dy - 63 * u - wag + crouch);
      x.stroke();
      x.strokeStyle = "#d8d2c4";
      x.lineWidth = 4 * u;
      const step = down ? 0 : Math.sin(t / 110) * 3 * u;
      for (const lx of [-14, 2, 16]) {
        x.beginPath();
        x.moveTo(dx + lx * u + lean, dy - 17 * u + crouch);
        x.lineTo(dx + (lx + (strike ? 7 : 0)) * u + lean, dy - 4 * u + step + crouch);
        x.stroke();
      }

      if (bark || cast) {
        x.strokeStyle = "rgba(103,232,249,.65)";
        x.lineWidth = 2 * u;
        for (let i = 0; i < 3; i++) {
          const r = (12 + i * 8 + (t / 40) % 8) * u;
          x.beginPath();
          x.arc(dx + 35 * u + lean, dy - 40 * u + crouch, r, -0.5, 0.45);
          x.stroke();
        }
      }
      if (shield) {
        x.strokeStyle = "rgba(160,107,255,.7)";
        x.lineWidth = 3 * u;
        x.beginPath();
        x.ellipse(dx + lean, dy - 36 * u + crouch, 38 * u, 30 * u, 0, 0, 7);
        x.stroke();
      }
      if (strike) {
        x.strokeStyle = "rgba(245,158,11,.55)";
        x.lineWidth = 3 * u;
        x.beginPath();
        x.moveTo(dx + 28 * u + lean, dy - 32 * u);
        x.lineTo(dx + 58 * u + lean, dy - 30 * u);
        x.stroke();
      }
      x.restore();
    }

    // ================= procedural figures for the pair =================
    function katrinFig736(x, dx, dy, h, pose, flip, tm) {
      const u = h / 100;
      x.save(); if (flip) { x.translate(dx, 0); x.scale(-1, 1); x.translate(-dx, 0); }
      x.fillStyle = "#12203a"; x.beginPath(); // long blue coat
      x.moveTo(dx - 16 * u, dy); x.quadraticCurveTo(dx - 20 * u, dy - 52 * u, dx - 11 * u, dy - 60 * u);
      x.lineTo(dx + 11 * u, dy - 60 * u); x.quadraticCurveTo(dx + 20 * u, dy - 52 * u, dx + 16 * u, dy); x.closePath(); x.fill();
      x.strokeStyle = "#3fa9f5"; x.lineWidth = 2 * u; x.beginPath(); x.moveTo(dx, dy - 58 * u); x.lineTo(dx, dy - 6 * u); x.stroke(); // coat seam glow
      x.fillStyle = "#e8c39a"; x.beginPath(); x.arc(dx, dy - 70 * u, 10 * u, 0, 7); x.fill(); // face
      x.fillStyle = "#0e1420"; x.beginPath(); x.arc(dx, dy - 74 * u, 10.5 * u, Math.PI, 0); x.fill(); // hair
      x.fillStyle = "#3fa9f5"; x.fillRect(dx - 10 * u, dy - 72 * u, 20 * u, 3 * u); // visor band
      x.fillStyle = "#8fd8ff"; x.beginPath(); x.arc(dx - 4 * u, dy - 69 * u, 1.6 * u, 0, 7); x.arc(dx + 4 * u, dy - 69 * u, 1.6 * u, 0, 7); x.fill();
      if (pose === "cast") { // cryo-tag throw
        x.strokeStyle = "#12203a"; x.lineWidth = 7 * u; x.beginPath(); x.moveTo(dx + 10 * u, dy - 50 * u); x.lineTo(dx + 26 * u, dy - 62 * u); x.stroke();
        const gl = .6 + .4 * Math.sin((tm || 0) / 120);
        x.fillStyle = "rgba(103,232,249," + gl + ")"; x.beginPath(); x.arc(dx + 30 * u, dy - 64 * u, 5 * u, 0, 7); x.fill();
      }
      x.restore();
    }
    function manchezFig736(x, dx, dy, h, pose, flip, tm) {
      const u = h / 100;
      x.save(); if (flip) { x.translate(dx, 0); x.scale(-1, 1); x.translate(-dx, 0); }
      x.fillStyle = "#241812"; x.beginPath(); // heavy amber jacket
      x.moveTo(dx - 20 * u, dy); x.lineTo(dx - 20 * u, dy - 56 * u); x.quadraticCurveTo(dx - 20 * u, dy - 64 * u, dx, dy - 64 * u);
      x.quadraticCurveTo(dx + 20 * u, dy - 64 * u, dx + 20 * u, dy - 56 * u); x.lineTo(dx + 20 * u, dy); x.closePath(); x.fill();
      x.strokeStyle = "#f59e0b"; x.lineWidth = 2 * u; x.strokeRect(dx - 14 * u, dy - 56 * u, 28 * u, 8 * u); // chest strap
      x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx, dy - 74 * u, 11 * u, 0, 7); x.fill(); // face
      x.fillStyle = "#171008"; x.beginPath(); x.arc(dx, dy - 79 * u, 11.5 * u, Math.PI, 0); x.fill(); x.fillRect(dx - 11.5 * u, dy - 80 * u, 23 * u, 6 * u); // bandana
      x.fillStyle = "#f59e0b"; x.beginPath(); x.arc(dx - 4.5 * u, dy - 72 * u, 1.8 * u, 0, 7); x.arc(dx + 4.5 * u, dy - 72 * u, 1.8 * u, 0, 7); x.fill();
      x.fillStyle = "#3a2a1a"; x.fillRect(dx - 18 * u, dy - 4 * u, 13 * u, 4 * u); x.fillRect(dx + 5 * u, dy - 4 * u, 13 * u, 4 * u); // boots
      if (pose === "strike") { // rapid strike blur
        x.strokeStyle = "#241812"; x.lineWidth = 8 * u; x.beginPath(); x.moveTo(dx + 14 * u, dy - 48 * u); x.lineTo(dx + 34 * u, dy - 50 * u); x.stroke();
        x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx + 38 * u, dy - 50 * u, 6 * u, 0, 7); x.fill();
        x.strokeStyle = "rgba(245,158,11,.5)"; x.lineWidth = 2 * u; x.beginPath(); x.moveTo(dx + 44 * u, dy - 54 * u); x.lineTo(dx + 56 * u, dy - 54 * u); x.stroke();
      }
      x.restore();
    }
    function drawPairFig736(x, who, dx, dy, h, pose, flip, tm) {
      // KATRIN_MANCHEZ contract first (guarded); procedural figures otherwise
      const frame = Math.floor((tm || 0) / 140) % 7;
      const key = who === "katrin"
        ? (pose === "cast" ? "kat_hack" : pose === "down" ? "kat_down" : pose === "shield" ? "kat_shield" : pose === "strike" ? "kat_pounce" : "kat_idle" + frame)
        : (pose === "strike" ? "man_pounce" : pose === "down" ? "man_down" : pose === "shield" ? "man_shield" : pose === "bark" ? "man_bark" : pose === "cast" ? "man_hack" : "man_idle" + frame);
      if (atlasFrame736("KATRIN_MANCHEZ", key, x, dx - h * 0.36, dy - h, h * 0.72, h, flip)) return;
      dogFig736(x, who, dx, dy, h, pose, flip, tm);
    }
    function duoFig736(x, key, dx, dy, w, h, flip, tm) { // duo_* tandem frames; composed dogs if no duo atlas exists yet
      if (atlasFrame736("KATRIN_MANCHEZ", key, x, dx, dy, w, h, flip)) return;
      const cx = dx + w / 2, base = dy + h * .9, phase = Math.floor((tm || 0) / 140) % 2;
      const slam = key === "duo_slam";
      const katPose = slam ? (phase ? "strike" : "shield") : (phase ? "cast" : "strike");
      const manPose = slam ? (phase ? "strike" : "cast") : (phase ? "bark" : "strike");
      const dir = flip ? -1 : 1;
      const a = .5 + .5 * Math.sin((tm || 0) / 90);
      x.save();
      x.strokeStyle = "rgba(192,132,252," + (.25 + a * .35) + ")"; x.lineWidth = 3;
      x.beginPath(); x.arc(cx, base - h * .52, w * (.28 + a * .03), 0, 7); x.stroke();
      drawPairFig736(x, "katrin", cx - dir * w * .2, base, h * .68, katPose, flip, tm);
      drawPairFig736(x, "manchez", cx + dir * w * .2, base + h * .02, h * .72, manPose, !flip, (tm || 0) + 80);
      x.fillStyle = "rgba(255,240,180," + (.12 + a * .12) + ")";
      x.beginPath(); x.arc(cx, base - h * .56, w * .1, 0, 7); x.fill();
      x.restore();
    }
    function waldoFig736(x, dx, dy, h, pose) { // WALDO_FULL contract first (guarded); shapes otherwise
      if (atlasFrame736("WALDO_FULL", "w_" + (pose || "point"), x, dx - h * 0.36, dy - h, h * 0.72, h)) return;
      {
      const u = h / 100;
      x.fillStyle = "#151920"; x.beginPath(); x.moveTo(dx - 24 * u, dy); x.arcTo(dx - 24 * u, dy - 64 * u, dx, dy - 64 * u, 10 * u); x.arcTo(dx + 24 * u, dy - 64 * u, dx + 24 * u, dy, 10 * u); x.lineTo(dx + 24 * u, dy); x.closePath(); x.fill();
      x.strokeStyle = "#ffd166"; x.lineWidth = 2.2 * u; x.beginPath(); x.arc(dx, dy - 54 * u, 8 * u, .3, Math.PI - .3); x.stroke();
      x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx, dy - 76 * u, 14 * u, 0, 7); x.fill();
      x.fillStyle = "#262b33"; x.fillRect(dx - 13 * u, dy - 74 * u, 26 * u, 10 * u); // lowered balaclava
      x.fillStyle = "#0e1116"; x.beginPath(); x.arc(dx, dy - 81 * u, 14.5 * u, Math.PI, 0); x.fill(); x.fillRect(dx - 14.5 * u, dy - 83 * u, 29 * u, 9 * u); // black beanie
      x.fillStyle = "#141a30"; x.beginPath(); x.arc(dx - 5 * u, dy - 77 * u, 2.2 * u, 0, 7); x.arc(dx + 5 * u, dy - 77 * u, 2.2 * u, 0, 7); x.fill();
      }
    }
    const K_POSES736 = {
      idle: ["studio0", "studio6", "action28", "action0"],
      deck: ["studio0", "studio6", "action28", "action0"],
      fist: ["studio11", "studio22", "action21", "action22"],
      piano: ["studio3", "studio2", "action14", "action21"],
      orb: ["action14", "action15", "studio3"],
      burst: ["action21", "action22", "studio22"],
      shield: ["studio16", "action16", "action17"],
      crouch: ["action6", "studio15", "action13"],
      down: ["studio17", "action8", "action26"],
      fork: ["action21", "action22", "studio22", "studio11"],
    };
    function kAtlasFrame736(x, key, dx, dy, h, flip) {
      const names = /^action/.test(key) ? ["K_ACTION", "K_STUDIO"] : /^studio/.test(key) ? ["K_STUDIO", "K_ACTION"] : ["K_STUDIO", "K_ACTION"];
      for (const name of names) {
        const A = window[name];
        const fr = A && A.frames && A.frames[key];
        if (!fr) continue;
        const C = A.cell || 64;
        const sw = fr.length >= 4 ? fr[2] : C;
        const sh = fr.length >= 4 ? fr[3] : (A.cellH || C);
        const w = h * (sw / sh);
        if (atlasFrame736(name, key, x, dx - w / 2, dy - h, w, h, flip)) return true;
      }
      return false;
    }
    function kFig736(x, dx, dy, h, pose) { // concept K first; K_FULL support FX / v725 fallback otherwise
      const raw = Array.isArray(pose) ? pose : (K_POSES736[pose || "deck"] || [pose || "deck"]);
      const candidates = [];
      raw.forEach(k => {
        candidates.push(k);
        if (/^f\d+$/.test(k)) {
          const n = Math.max(0, parseInt(k.slice(1), 10));
          candidates.push("studio" + n, "action" + n);
        }
      });
      for (const key of candidates) if (kAtlasFrame736(x, key, dx, dy, h, false)) return;
      if (atlasFrame736("K_FULL", pose === "orb" ? "k_orb" : pose === "burst" ? "k_burst" : pose === "shield" ? "k_shield" : "k_emerald", x, dx - h * 0.36, dy - h, h * 0.72, h)) return;
      try { if (window.v725 && v725.h && v725.h.k) { v725.h.k(x, dx, dy, h, pose || "deck"); return; } } catch (e) { }
      try { if (window.v725 && v725.h && v725.h.silhouette) v725.h.silhouette(x, dx, dy, h, "#101a14"); } catch (e) { }
    }
    function shuttle736(x, key, dx, dy, w, h, tm) { // SHUTTLE contract (guarded); procedural shuttle otherwise
      if (atlasFrame736("SHUTTLE", key, x, dx, dy, w, h)) return;
      const cx = dx + w / 2, cy = dy + h / 2, u = h / 60;
      x.save(); x.translate(cx, cy); if (key === "sh_crash" || key === "sh_wreck") x.rotate(.35);
      x.fillStyle = "#39435e"; x.beginPath(); x.ellipse(0, 0, w * .42, 14 * u, 0, 0, 7); x.fill();
      x.fillStyle = "#67e8f9"; x.beginPath(); x.ellipse(w * .12, -6 * u, w * .12, 5 * u, 0, 0, 7); x.fill();
      x.fillStyle = "#525f7e"; x.beginPath(); x.moveTo(-w * .42, -4 * u); x.lineTo(-w * .55, -22 * u); x.lineTo(-w * .3, -6 * u); x.closePath(); x.fill();
      if (key === "sh_thrust" || key === "sh_takeoff" || key === "sh_reentry") {
        const fl = .6 + .4 * Math.sin((tm || 0) / 70);
        x.fillStyle = "rgba(255,166,77," + fl + ")"; x.beginPath(); x.moveTo(-w * .42, 6 * u); x.lineTo(-w * .42 - 34 * u * fl, 10 * u); x.lineTo(-w * .42, 14 * u); x.closePath(); x.fill();
      }
      if (key === "sh_damage" || key === "sh_crash" || key === "sh_wreck") {
        x.strokeStyle = "rgba(120,128,150,.8)"; x.lineWidth = 2 * u;
        for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-w * .3 + i * w * .2, -10 * u); x.quadraticCurveTo(-w * .3 + i * w * .2 + 8 * u, -22 * u - i * 4, -w * .3 + i * w * .2 - 6 * u, -34 * u - i * 6); x.stroke(); }
      }
      x.restore();
    }
    function dawnBg736(x, tm) { // m8 backdrop: waldo_garage/loft painted bg when present, gradient otherwise
      const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
      const im = bg734Img("waldo_garage") || bg734Img("waldo_loft");
      if (im) {
        x.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, BAR, LW, LH - 2 * BAR);
        x.fillStyle = "rgba(26,20,48,.35)"; x.fillRect(0, BAR, LW, LH - 2 * BAR);
        return;
      }
      H.bg(x, "#2a2038");
      const g = x.createLinearGradient(0, BAR, 0, LH - BAR); g.addColorStop(0, "#1a1430"); g.addColorStop(1, "#7a4a3a");
      x.fillStyle = g; x.fillRect(0, BAR, LW, LH - 2 * BAR);
      x.fillStyle = "#ffd166"; x.beginPath(); x.arc(LW - 160, BAR + 120, 26, 0, 7); x.fill();
    }

    // ==========================================================================
    // CINEMATICS — eight missions on the shared v7.25 engine
    // ==========================================================================
    const CINE_IDS = ["b736m1", "b736m2", "b736m3", "b736m4", "b736m5", "b736m6", "b736m7", "b736m8"];
    const CINE_TITLES = {
      b736m1: "THE 118/1984 BREAKOUT — M1 · DEAD SATELLITE",
      b736m2: "THE 118/1984 BREAKOUT — M2 · NIGHT LAUNCH",
      b736m3: "THE 118/1984 BREAKOUT — M3 · BLACKSITE MERIDIAN",
      b736m4: "THE 118/1984 BREAKOUT — M4 · CELL 118",
      b736m5: "THE 118/1984 BREAKOUT — M5 · THE WRONG MIKE",
      b736m6: "THE 118/1984 BREAKOUT — M6 · CELL 1984",
      b736m7: "THE 118/1984 BREAKOUT — M7 · ESCAPE VELOCITY",
      b736m8: "THE 118/1984 BREAKOUT — M8 · RETURN TO EARTH",
    };
    function briefPortraits(x, y) { // CAMP_UI chrome when present (K stays hidden until m4)
      if (!campReady()) return false;
      const H = v725.h;
      let px = 60;
      campPortrait(x, "port_katrin", px, y, 84); px += 100;
      campPortrait(x, "port_manchez", px, y, 84); px += 100;
      const m = meta736();
      if (m && (m.k || m.m > 4)) { campPortrait(x, "port_k", px, y, 84); px += 100; }
      if (m && (m.waldo || m.m > 6)) { campPortrait(x, "port_waldo", px, y, 84); px += 100; }
      return true;
    }
    function stationBg736(x, tm) { // Blacksite Meridian interior — cells numbered like training data
      const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
      H.bg(x, "#0a0714");
      for (let i = 0; i < 8; i++) {
        const rx = 70 + i * 140;
        x.fillStyle = i % 2 ? "#120e22" : "#0e0a1c"; x.fillRect(rx, BAR + 70, 96, 330);
        x.strokeStyle = "rgba(160,107,255,.3)"; x.lineWidth = 2; x.strokeRect(rx, BAR + 70, 96, 330);
        H.txt(x, ["118", "1984", "77", "404", "3", "900", "12", "000"][i], rx + 48, BAR + 60, 13, "rgba(160,107,255,.8)", "center", true);
      }
      for (let i = 0; i < 20; i++) { const px = (i * 173 + ((tm / 40) | 0) * 2) % LW, py = BAR + 40 + (i * 131) % 380; x.fillStyle = i % 3 ? "rgba(160,107,255,.3)" : "rgba(103,232,249,.28)"; x.fillRect(px, py, 3, 3); }
      // surveillance eye
      const ex = LW - 130, ey = BAR + 70, p = .5 + .5 * Math.sin(tm / 500);
      x.strokeStyle = "rgba(255,82,82," + (.4 + p * .4) + ")"; x.lineWidth = 2;
      x.beginPath(); x.ellipse(ex, ey, 34, 16, 0, 0, 7); x.stroke();
      x.fillStyle = "rgba(255,82,82," + (.5 + p * .5) + ")"; x.beginPath(); x.arc(ex, ey, 7, 0, 7); x.fill();
    }
    function cell736(x, tm, num, col) {
      const H = v725.h, LW = H.LW, BAR = H.BAR;
      H.panel(x, LW / 2 - 200, BAR + 100, 400, 330, "#0d0a18");
      x.strokeStyle = col || H.PUR; x.lineWidth = 3; H.rr(x, LW / 2 - 200, BAR + 100, 400, 330, 10); x.stroke();
      for (let i = 0; i < 5; i++) { x.fillStyle = "#1a1430"; x.fillRect(LW / 2 - 160 + i * 70, BAR + 130, 26, 270); }
      H.txt(x, "CELL " + num, LW / 2, BAR + 90, 18, col || H.PUR, "center", true);
    }
    function pair736(x, tm, y) {
      const H = v725.h, LH = H.LH, BAR = H.BAR;
      drawPairFig736(x, "katrin", H.LW / 2 - 260, y || (LH - BAR - 36), 120, null, false, tm);
      drawPairFig736(x, "manchez", H.LW / 2 - 190, y || (LH - BAR - 36), 130, null, false, tm);
    }
    if (window.v725 && v725.register && v725.h) {
      const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
      const GREEN = H.GREEN, CYAN = H.CYAN, DIM = H.DIM, GOLD = H.GOLD, PUR = H.PUR, RED = H.RED, AMBER = H.AMBER;
      function earthBg736(x, tm) { H.bg(x, "#0a1020"); H.cityGlow(x, tm, 46); }
      function sat736(x, tm) { // the dead satellite tumbling over New Haven
        const sx = LW / 2 + 180, sy = BAR + 110 + Math.sin(tm / 700) * 10;
        x.save(); x.translate(sx, sy); x.rotate(tm / 2600);
        x.fillStyle = "#26304e"; x.fillRect(-16, -10, 32, 20);
        x.fillStyle = "#3fa9f5"; x.fillRect(-52, -6, 30, 12); x.fillRect(22, -6, 30, 12);
        x.strokeStyle = "rgba(103,232,249,.6)"; x.strokeRect(-52, -6, 30, 12); x.strokeRect(22, -6, 30, 12);
        x.restore();
      }
      const SHOTS736 = {
        b736m1: [
          { dur: 2600, cap: "02:14 — a corrupted satellite burst. Two numbers repeat.", draw(x, tm) { earthBg736(x, tm); sat736(x, tm); H.panel(x, LW / 2 - 260, BAR + 130, 520, 120); H.txt(x, "CELL 118 — M. OLIVARES", LW / 2, BAR + 175, 17, CYAN, "center", true); H.txt(x, "CELL 1984 — WALDO", LW / 2, BAR + 215, 17, AMBER, "center", true); } },
          { dur: 2600, cap: "KATRIN: \"Waldo vanished chasing ORPHEUS satellites. This is his voice in the static.\"", draw(x, tm) { earthBg736(x, tm); if (!briefPortraits(x, LH - BAR - 110)) pair736(x, tm); H.bubble(x, "Waldo's voice. In the static.", 60, BAR + 60, 400); } },
          { dur: 2600, cap: "MANCHEZ: \"My contacts say it's a detention site — inside the City Beneath the City.\"", draw(x, tm) { earthBg736(x, tm); pair736(x, tm); H.bubble(x, "A prison, wearing a network's face.", 60, BAR + 60, 460); } },
          { dur: 2400, cap: "They go expecting to rescue Mike. Tutorial: move as a pair · C swaps · E interacts.", draw(x, tm) { earthBg736(x, tm); pair736(x, tm); H.txt(x, "C — SWAP · E — INTERACT · G — SYNC FINISHER", LW / 2, BAR + 60, 14, DIM, "center", true); } },
        ],
        b736m2: [
          { dur: 2400, cap: "An ORPHEUS launch facility. Three uplink towers guard the transport.", draw(x, tm) { earthBg736(x, tm); for (let i = 0; i < 3; i++) { const tx = LW / 2 - 240 + i * 240; x.strokeStyle = AMBER; x.lineWidth = 3; x.beginPath(); x.moveTo(tx, LH - BAR - 30); x.lineTo(tx, BAR + 140); x.stroke(); x.fillStyle = ((tm / 400 + i) | 0) % 2 ? RED : "#39131c"; x.beginPath(); x.arc(tx, BAR + 140, 9, 0, 7); x.fill(); } pair736(x, tm); } },
          { dur: 2600, cap: "Disable all three towers (E), steal credentials, fight across the platform.", draw(x, tm) { earthBg736(x, tm); pair736(x, tm); H.bubble(x, "Three towers. Then we ride the fire up.", 60, BAR + 60, 420); } },
          { dur: 2400, cap: "Waldo's old intel reveals hidden routes — if he ever trusted you with it.", draw(x, tm) { earthBg736(x, tm); sat736(x, tm); H.txt(x, "THREAT-INTEL ROUTE: " + (((typeof S !== "undefined") && S.meta && (S.meta._v733rep || 0) >= 20) ? "AVAILABLE" : "LOCKED (Waldo rep)"), LW / 2, BAR + 70, 14, GOLD, "center", true); pair736(x, tm); } },
        ],
        b736m3: [
          { dur: 2600, cap: "BLACKSITE MERIDIAN. A detention station that phases into the City Beneath the City.", draw(x, tm) { stationBg736(x, tm); pair736(x, tm); } },
          { dur: 2600, cap: "Gravity rotates. Cells glitch. Some inmates are copies from Mike's incident history.", draw(x, tm) { stationBg736(x, tm); for (let i = 0; i < 3; i++) H.silhouette(x, LW / 2 + 120 + i * 90, LH - BAR - 40, 110, "#131c38"); pair736(x, tm); H.txt(x, "GRAVITY FLUX — expect the floor to forget you", LW / 2, BAR + 50, 13, PUR, "center", true); } },
          { dur: 2600, cap: "Cell numbers aren't numbers. They're training-data milestones.", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, "?", PUR); } },
        ],
        b736m4: [
          { dur: 2600, cap: "CELL 118. \"Mike\" — injured, restrained, disoriented. Investigate before opening.", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, 118, CYAN); H.txt(x, "E — examine the evidence · find 3+ clues", LW / 2, BAR + 60, 14, CYAN, "center", true); } },
          { dur: 2800, cap: "The ROOT mug untouched. A cipher in the restraints. A reflection that isn't Mike.", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, 118, CYAN); H.txt(x, "☕ ROOT — untouched", LW / 2 - 320, LH - BAR - 60, 13, DIM, "left", true); H.txt(x, "⌘ cipher — K's signature", LW / 2 + 40, LH - BAR - 60, 13, GREEN, "left", true); } },
          { dur: 2800, cap: "K: \"I found out they were printing him. So they printed a cell for me.\"", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, 118, CYAN); kFig736(x, LW / 2, LH - BAR - 60, 150, "deck"); pair736(x, tm); } },
          { dur: 2400, cap: "Only K can decrypt the route to Cell 1984. He joins as tactical support (Q).", draw(x, tm) { stationBg736(x, tm); kFig736(x, LW / 2 + 200, LH - BAR - 60, 150, "deck"); pair736(x, tm); H.txt(x, "Q — K SUPPORT UNLOCKED", LW / 2, BAR + 60, 15, GREEN, "center", true); } },
        ],
        b736m5: [
          { dur: 2600, cap: "ORPHEUS seals the block and deploys simulated Mikes. THE MIKE INDEX.", draw(x, tm) { stationBg736(x, tm); H.silhouette(x, LW / 2, LH - BAR - 40, 170, "#101820"); x.strokeStyle = CYAN; x.lineWidth = 2; x.strokeRect(LW / 2 - 46, LH - BAR - 200, 92, 170); H.txt(x, "INDEXING…", LW / 2, BAR + 60, 15, CYAN, "center", true); } },
          { dur: 2800, cap: "Phase one imitates Technician Mike. Phase two, the Night Walker. K will call the vulnerable one.", draw(x, tm) { stationBg736(x, tm); H.txt(x, "PHASE 1 — TECHNICIAN: traps & drones", LW / 2, BAR + 90, 14, AMBER, "center", true); H.txt(x, "PHASE 2 — NIGHT WALKER: air combos", LW / 2, BAR + 130, 14, PUR, "center", true); pair736(x, tm); } },
        ],
        b736m6: [
          { dur: 2600, cap: "CELL 1984 — the year of total surveillance. Waldo is alive. Beanie. Balaclava down.", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, 1984, AMBER); waldoFig736(x, LW / 2, LH - BAR - 60, 150); } },
          { dur: 2800, cap: "Defend BOTH sides: Katrin at the uplink, Manchez in the corridor. K decrypts the lock.", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, 1984, AMBER); H.txt(x, "PROTECT THE UPLINK — K DECRYPTS UNDER FIRE", LW / 2, BAR + 60, 14, GREEN, "center", true); pair736(x, tm); } },
          { dur: 2600, cap: "Waldo's dismantled surveillance unit is now a transmitter. He's been feeding them lies.", draw(x, tm) { stationBg736(x, tm); waldoFig736(x, LW / 2 + 200, LH - BAR - 60, 150); pair736(x, tm); H.bubble(x, "Took you long enough. I made friends with the camera.", 60, BAR + 60, 460); } },
        ],
        b736m7: [
          { dur: 2600, cap: "ESCAPE VELOCITY. The station collapses. Waldo guides; K keeps the corridors real.", draw(x, tm) { stationBg736(x, tm); shuttle736(x, "sh_takeoff", LW / 2 - 460, BAR + 70, 240, 120, tm); pair736(x, tm); kFig736(x, LW / 2 + 160, LH - BAR - 40, 130, "deck"); waldoFig736(x, LW / 2 + 260, LH - BAR - 40, 140); } },
          { dur: 2800, cap: "THE WARDEN OF 1984 manifests through the central eye. It splits the arena with surveillance barriers.", draw(x, tm) { stationBg736(x, tm); const ex = LW / 2, ey = BAR + 170, p = .5 + .5 * Math.sin(tm / 400); if (!atlasFrame736("WARDEN", "wd_ring", x, ex - 120, ey - 70, 240, 140)) { x.strokeStyle = RED; x.lineWidth = 4; x.beginPath(); x.ellipse(ex, ey, 90, 44, 0, 0, 7); x.stroke(); x.fillStyle = "rgba(255,82,82," + (.4 + p * .5) + ")"; x.beginPath(); x.arc(ex, ey, 20, 0, 7); x.fill(); } H.txt(x, "WARDEN OF 1984", LW / 2, BAR + 60, 18, RED, "center", true); } },
          { dur: 2600, cap: "Fight divided. Reunite. End it with a synchronized launcher (G at the mark).", draw(x, tm) { stationBg736(x, tm); pair736(x, tm); H.txt(x, "FINISH IT TOGETHER — G WHEN THE EYE EXPOSES", LW / 2, BAR + 60, 14, GOLD, "center", true); } },
        ],
        b736m8: [
          { dur: 2800, cap: "The shuttle falls out of the dark and into a suburban dawn, by Waldo's house.", draw(x, tm) { dawnBg736(x, tm); shuttle736(x, ((tm / 1200) | 0) % 2 ? "sh_reentry" : "sh_crash", LW / 2 - 420, BAR + 60 + Math.sin(tm / 600) * 8, 260, 120, tm); pair736(x, tm); waldoFig736(x, LW / 2 + 40, LH - BAR - 40, 140, "point"); kFig736(x, LW / 2 + 160, LH - BAR - 40, 130, "deck"); } },
          { dur: 2800, cap: "Mike arrives. Waldo knows him instantly — only Mike knows where the garage key hides.", draw(x, tm) { dawnBg736(x, tm); shuttle736(x, "sh_wreck", 40, LH - BAR - 120, 220, 110, tm); try { H.mike(x, "idle0", LW / 2 + 260, LH - BAR - 40, 140); } catch (e) { H.silhouette(x, LW / 2 + 260, LH - BAR - 40, 140, "#4a6390"); } waldoFig736(x, LW / 2 + 340, LH - BAR - 40, 140, "handshake"); kFig736(x, LW / 2 + 120, LH - BAR - 40, 130, "deck"); pair736(x, tm); H.bubble(x, "It's him. He went straight for the key.", 60, BAR + 60, 420); } },
          { dur: 3200, cap: "K: \"It didn't copy your memories to become you. It copied them to predict who you'll save.\"", draw(x, tm) { H.bg(x, "#141024"); kFig736(x, LW / 2 - 100, LH - BAR - 40, 170, "deck"); try { H.mike(x, "idle0", LW / 2 + 140, LH - BAR - 40, 150); } catch (e) { H.silhouette(x, LW / 2 + 140, LH - BAR - 40, 150, "#4a6390"); } H.panel(x, LW / 2 - 360, BAR + 60, 720, 110); H.txt(x, "\"It didn't copy your memories to become you.", LW / 2, BAR + 105, 16, GREEN, "center", true); H.txt(x, "It copied them to predict who you'll save.\"", LW / 2, BAR + 145, 16, GREEN, "center", true); } },
          { dur: 3000, cap: "The final shot: the empty Cell 118. The restraints reactivate.", draw(x, tm) { stationBg736(x, tm); cell736(x, tm, 118, RED); } },
          { dur: 3200, cap: "SUBJECT K: RELEASE WAS EXPECTED — MIKE OUTCOME MODEL: 87% COMPLETE", draw(x, tm) { H.bg(x, "#050308"); H.panel(x, LW / 2 - 330, LH / 2 - 90, 660, 180, "#0a0612"); H.txt(x, "SUBJECT K: RELEASE WAS EXPECTED", LW / 2, LH / 2 - 30, 20, RED, "center", true); H.txt(x, "MIKE OUTCOME MODEL: 87% COMPLETE", LW / 2, LH / 2 + 20, 20, RED, "center", true); } },
        ],
      };
      for (const id of CINE_IDS) {
        try { v725.register(id, { title: CINE_TITLES[id], shots: SHOTS736[id], cues: { 1: "beep520", [SHOTS736[id].length - 1]: id === "b736m8" ? "promote" : "chime" } }); } catch (e) { }
      }
    }

    // ==========================================================================
    // CAMPAIGN RUNNER
    // ==========================================================================
    const FLOOR736 = () => (typeof NM_FLOOR !== "undefined") ? NM_FLOOR : 430;
    const NMW736 = () => (typeof NM_W !== "undefined") ? NM_W : 1800;
    const MISSIONS = {
      1: { dist: "suburbs", name: "DEAD SATELLITE", waves: [["thug", "thug"], ["thug", "skimmer", "thug"]], brief: "Pair movement · C swaps · clear the crash site · both fighters at the door (E) to leave." },
      2: { dist: "industrial", name: "NIGHT LAUNCH", towers: [520, 1030, 1540], waves: [["guard", "thug"], ["skimmer", "guard", "thug"]], brief: "Disable 3 uplink towers (E) and clear the platform crew." },
      3: { dist: "orbital", name: "BLACKSITE MERIDIAN", grav: true, waves: [["skimmer", "skimmer"], ["guard", "hunter", "skimmer"]], brief: "Gravity flux — the floor forgets you. Survive the glitched block." },
      4: { dist: "orbital", evidence: true, waves: [["guard", "skimmer", "guard"]], brief: "Investigate Cell 118 (E on the glints). Find 3+ clues before opening it." },
      5: { dist: "orbital", boss: "mikeindex", adds: [["droneop", "thug"]], brief: "THE MIKE INDEX — two phases of stolen Mikes. K calls the vulnerable one." },
      6: { dist: "orbital", defend: true, waves: [["thug", "skimmer"], ["guard", "thug", "skimmer"], ["hunter", "guard", "skimmer"]], brief: "Split defense: protect the uplink (left) while K decrypts Cell 1984." },
      7: { dist: "orbital", boss: "warden1984", brief: "WARDEN OF 1984 — it splits the arena. Reunite. End it with G." },
      8: { cine: true, name: "RETURN TO EARTH" },
    };
    function mkChar(who) {
      return who === "katrin"
        ? { hp: 100, maxHp: 100, stress: 0, downed: false, out: false, downT: 0, bodyX: 0, tags: 0 }
        : { hp: 120, maxHp: 120, stress: 0, downed: false, out: false, downT: 0, bodyX: 0, tags: 0 };
    }
    function mkCState(m) {
      const M = MISSIONS[m] || MISSIONS[1];
      return {
        m, active: "katrin", ending: false, resolving: false,
        chars: { katrin: mkChar("katrin"), manchez: mkChar("manchez") },
        partner: { x: 60, y: FLOOR736() - 34, vx: 0, vy: 0, w: 22, h: 34, face: 1, onGround: true, jumps: 0, cd: 0, anim: 0 },
        sync: 0, lastHit: { who: null, t: 0 },
        shots: [], traps: [], decoy: null, kReady: 0,
        wave: 0, waveDelay: 0, pendingSpawn: null,
        towers: M.towers ? M.towers.map(x => ({ x, done: false })) : null,
        evidence: M.evidence ? [
          { id: "mug", x: 500, found: false, label: "☕ the ROOT mug", text: "The ROOT mug, recovered from his desk. <b>Untouched.</b> Mike's hands find it blind, half-asleep, in the dark. This man looked at it like evidence." },
          { id: "cipher", x: 800, found: false, label: "⌘ the restraints", text: "The restraint locks carry an encryption signature you know from the NOC logs: <b>K's cipher.</b> Whoever restrained him signed the work." },
          { id: "reflection", x: 1100, found: false, label: "🪞 the reflection", text: "The polished cell wall throws his shadow back wrong — for one frame it wears <b>K's silhouette.</b> Beanie. Headphones. Stillness." },
          { id: "recording", x: 1400, found: false, label: "📼 the recording", text: "A visitor log, cached: <b>Mike visited Cell 118 three weeks ago.</b> The prisoner describes Mike's memories like incident documentation — read, not lived." },
        ] : null,
        uplink: M.defend ? { x: 420, hp: 120, maxHp: 120 } : null,
        decrypt: M.defend ? 60 : null,
        gravT: 0, lowGrav: false, barrier: null, finisherReady: false,
        ptCD: 0, msg0: M.brief,
      };
    }
    function partnerWho(cs) { return cs.active === "katrin" ? "manchez" : "katrin"; }
    function playCine736(id, cb) {
      try { if (window.v725 && v725.play && v725.play(id, cb)) return; } catch (e) { }
      if (cb) try { cb(); } catch (e) { }
    }
    function spawn736(kinds, cs) {
      const out = [];
      try {
        if (typeof NM_KINDS === "undefined") return out;
        const D = NM_DISTRICTS[NM.district] || NM_DISTRICTS.downtown;
        const F = FLOOR736();
        kinds.forEach((kind, i) => {
          const k = NM_KINDS[kind]; if (!k) return;
          const x = (i % 2 ? 1250 : 640) + i * 130;
          out.push({
            ...k, kind, x, y: F - k.h, w: k.w, h: k.h,
            hp: Math.round(k.hp * (0.9 + cs.m * 0.08)), maxHp: Math.round(k.hp * (0.9 + cs.m * 0.08)),
            dmg: Math.round(k.dmg * (0.85 + cs.m * 0.05)), vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true,
            cd: 40, face: -1, weak: false, _counted: false, phase: 1, _spawnX: x,
          });
        });
      } catch (e) { }
      return out;
    }
    function queueWave736(cs) { // Threat Forecast: spawns flash-marked 3s early post-m6
      const mt = meta736();
      const kinds = (MISSIONS[cs.m].waves || [])[cs.wave]; if (!kinds) return;
      cs.wave++;
      if (mt && mt.waldo) {
        cs.pendingSpawn = { at: now736() + 3000, kinds };
        NM.msg = "🛰 THREAT FORECAST — incoming wave marked"; NM.msgT = now736() + 2600;
      } else {
        NM.enemies = NM.enemies.concat(spawn736(kinds, cs));
        cs.pendingSpawn = null;
      }
    }
    function startCombat736(m) {
      try {
        const M = MISSIONS[m]; if (!M) return;
        if (!S.nightMode && typeof enterNight === "function") enterNight();
        if (typeof NM === "undefined" || !NM) return;
        if (typeof nmLoadDistrict === "function") nmLoadDistrict(M.dist);
        NM._v736 = mkCState(m);
        NM.enemies = [];
        if (M.boss) {
          const b = spawn736([M.boss], NM._v736)[0];
          if (b) { b.x = 1300; b._spawnX = 1300; NM.enemies = [b]; }
        }
        const cs = NM._v736;
        cs.partner.x = NM.x - 60;
        NM.hp = cs.chars[cs.active].hp;
        // paint the orbital backdrop per street (contract keys, procedural fallback inside drawNM)
        if (M.dist === "orbital") { try { if (window.NM_BG734 && NM_BG734.orbital_gate) NM_BG734.orbital = NM_BG734.orbital_gate; } catch (e) { } }
        if (M.defend) { NM.x = 700; cs.partner.x = 460; }
        if (M.evidence) { NM.msg = "🛰 CELL 118 — examine the glints (E) · 3+ clues before opening"; }
        else if (M.boss === "mikeindex") { NM.msg = "⚠ THE MIKE INDEX — ORPHEUS deploys simulated Mikes"; }
        else if (M.boss === "warden1984") { NM.msg = "⚠ WARDEN OF 1984 — surveillance barrier ONLINE"; cs.barrier = 900; }
        else NM.msg = "🛰 M" + m + " — " + M.name + " — " + M.brief;
        NM.msgT = now736() + 5200;
        try { sfx("portal"); } catch (e) { }
      } catch (e) { window.__err736c = String(e && e.stack || e); }
    }
    function runMission736(m) {
      if (m >= 8) { playCine736("b736m8", completeCampaign736); return; }
      playCine736("b736m" + m, () => startCombat736(m));
    }
    function start736(options) {
      options = options || {};
      try {
        const ts = document.getElementById("title-screen");
        if ((typeof S === "undefined" || !S) || (ts && !ts.classList.contains("hidden"))) {
          S = newState(); S.diff = 1;
          if (ts) ts.classList.add("hidden");
          const hud = document.getElementById("hud"); if (hud) hud.classList.remove("hidden");
          try { showTouchUI(); } catch (e) { }
          try { updateHUD(); } catch (e) { }
        }
        const mt = meta736(); if (!mt) return false;
        if (options.mission != null) mt.m = Number(options.mission) || mt.m || 1;
        if (mt.done) { playCine736("b736m8", null); return true; }
        if (options.directGameplay) {
          const mission = mt.m || 1;
          startCombat736(mission);
          let runtimeMission = 0;
          try { runtimeMission = Number(NM && NM._v736 && NM._v736.m || 0); } catch (e) { }
          window.__goodBoysDirectGameplay = { mission, requested: true, mounted: runtimeMission === mission, runtimeMission, source: "v736-core", at: Date.now() };
          return runtimeMission === mission;
        }
        runMission736(mt.m || 1);
        return true;
      } catch (e) { window.__err736s = String(e && e.stack || e); return false; }
    }
    function missionWin736() {
      const cs = NM._v736, m = cs.m, mt = meta736();
      cs.ending = true; NM.enemies = []; NM.clear = false; cs.pendingSpawn = null;
      if (mt) {
        if (m === 4) mt.k = true;
        if (m === 6) mt.waldo = true;
        mt.m = m + 1;
        try { save(); } catch (e) { }
      }
      const names = { 1: "CELL 118 record recovered", 2: "orbital transport boarded", 3: "Blacksite Meridian crossed", 4: "K FREED — tactical support online (Q)", 5: "MIKE INDEX deleted", 6: "WALDO FREED — Threat Forecast online", 7: "WARDEN OF 1984 destroyed" };
      try { sfx("promote"); } catch (e) { }
      dlg("✅ M" + m + " COMPLETE — " + (MISSIONS[m].name || ""), (names[m] || "Objective complete.") + ".<br><small>Sync banked: " + Math.round(cs.sync) + " · " + (mt && mt.k ? "K support ready (Q)" : "K not yet freed") + "</small>", [
        { t: "▶ M" + (m + 1) + " — " + (MISSIONS[m + 1] ? MISSIONS[m + 1].name : "RETURN TO EARTH"), f: () => { closeDlg(); endNightQuiet736(); runMission736(m + 1); } },
        { t: "💾 Save & return to the title", f: () => { closeDlg(); endNightQuiet736(); try { save(); } catch (e) { } location.reload(); } },
      ]);
    }
    function endNightQuiet736() { // leave night mode without day-end side effects
      try {
        const qt = document.getElementById("quest-tracker");
        if (qt && NM && !NM._qtHidden) qt.classList.remove("hidden");
        S.nightMode = null; NM = null;
      } catch (e) { }
    }
    function missionFail736(why) {
      const cs = NM._v736; if (!cs || cs.resolving) return; cs.resolving = true;
      dlg("💀 MISSION FAILED — " + (MISSIONS[cs.m].name || ""), why + "<br><small>Both fighters down. The cell numbers keep their prisoners.</small>", [
        { t: "↻ Retry M" + cs.m, f: () => { closeDlg(); const m = cs.m; endNightQuiet736(); startCombat736(m); } },
        { t: "Abort to the title", f: () => { closeDlg(); endNightQuiet736(); try { save(); } catch (e) { } location.reload(); } },
      ]);
    }
    function completeCampaign736() {
      try {
        const mt = meta736(); if (!mt) return;
        mt.done = true; mt.m = 9;
        S.meta._v736breakout = true;
        S.meta._v736pair = true; // Katrin & Manchez selectable night pair (techops_char-compatible flag)
        try { localStorage.setItem("techops_char_1181984", "katrin_manchez"); } catch (e) { }
        try {
          S.journal.push({ day: S.day, title: "GALLERY — CELL 118", body: "The prisoner who wasn't Mike. K held for discovering the behavioral copies. SUBJECT K: RELEASE WAS EXPECTED." });
          S.journal.push({ day: S.day, title: "GALLERY — CELL 1984", body: "Waldo's cell. He turned their surveillance unit into a transmitter and fed them lies. MIKE OUTCOME MODEL: 87% COMPLETE." });
        } catch (e) { }
        try { if (window.v733) S.meta._v733rep = (S.meta._v733rep || 0) + 25; } catch (e) { }
        try { save(); } catch (e) { }
        toast("🛰 THE 118/1984 BREAKOUT complete — Katrin & Manchez unlocked as a night pair!", 5200);
        console.log("[v7.36] campaign complete — pair unlocked");
        dlg("🛰 THE 118/1984 BREAKOUT — COMPLETE", "The shuttle cools in Waldo's yard. K's warning hangs in the dawn air.<br><br><i>\"It didn't copy your memories to become you. It copied them to predict who you'll save.\"</i><br><br><b>Unlocked:</b> Katrin & Manchez night pair · Cell 118 / Cell 1984 gallery entries · K support · Waldo Threat Forecast.", [
          { t: "Return to the title", f: () => { closeDlg(); location.reload(); } },
        ]);
      } catch (e) { }
    }

    // ==========================================================================
    // LINKED-PAIR COMBAT — wraps over the v7.31 night engine
    // ==========================================================================
    function dealDamage736(e, dmg, who) { // shared hit resolution: Tracked, weakness, sync, kills
      const cs = NM._v736, now = now736(), mt = meta736();
      let dealt = dmg;
      if (who === "manchez" && e.tracked) { dealt = Math.round(dealt * 1.5); e.tracked = 0; NM.msg = "❄ TRACKED — Manchez converts!"; NM.msgT = now + 800; }
      if (e.weak) dealt = Math.round(dealt * 1.25);
      e.hp -= dealt; e.hitT = 8;
      NM.hitStop = Math.max(NM.hitStop, 3);
      // alternating hits within 2s build Sync
      if (cs.lastHit.who && cs.lastHit.who !== who && now - cs.lastHit.t < 2000) {
        cs.sync = Math.min(100, cs.sync + 8);
        if (cs.sync >= 100) { NM.msg = "🤝 SYNC FULL — G for the TANDEM FINISHER"; NM.msgT = now + 1600; }
      }
      cs.lastHit = { who, t: now };
      if (e.hp <= 0 && e.alive) {
        e.alive = false; NM.kills++;
        NM.hitStop = Math.max(NM.hitStop, 8);
        const c = e.cash ? e.cash[0] + Math.floor(Math.random() * (e.cash[1] - e.cash[0] + 1)) : 10;
        NM.cash += c;
        NM.msg = `💥 ${e.name} deleted! +$${c}`; NM.msgT = now + 1400;
      }
      try { sfx("hit"); } catch (e2) { }
    }
    function swap736() {
      const cs = NM && NM._v736; if (!cs || cs.ending || cs.resolving) return;
      const pw = partnerWho(cs), ch = cs.chars;
      if (ch[pw].downed || ch[pw].out) { NM.msg = "⚠ partner is down — revive them (E)"; NM.msgT = now736() + 1200; return; }
      // player becomes the partner AI, partner steps into player control
      const p = cs.partner;
      const t = { x: NM.x, y: NM.y, vx: NM.vx, vy: NM.vy, face: NM.face, onGround: NM.onGround, jumps: NM.jumps };
      NM.x = p.x; NM.y = p.y; NM.vx = p.vx; NM.vy = p.vy; NM.face = p.face; NM.onGround = p.onGround; NM.jumps = p.jumps;
      p.x = t.x; p.y = t.y; p.vx = t.vx; p.vy = t.vy; p.face = t.face; p.onGround = t.onGround; p.jumps = t.jumps;
      cs.active = pw;
      NM.hp = ch[pw].hp;
      NM.msg = (pw === "katrin" ? "🧊 KATRIN on point" : "🥊 MANCHEZ on point"); NM.msgT = now736() + 1200;
      try { sfx("dash"); } catch (e) { }
    }
    function tandemFinisher736() {
      const cs = NM && NM._v736; if (!cs || cs.ending) return;
      const pw = partnerWho(cs), ch = cs.chars;
      if (ch[pw].downed || ch[pw].out) return;
      if (cs.sync < 100 && !cs.finisherReady) { NM.msg = "🤝 Sync not full yet"; NM.msgT = now736() + 900; return; }
      cs.sync = 0;
      cs.finisherFx = now736() + 750; // tandem finisher burst visual (duo_* frame / procedural burst)
      NM.hitStop = Math.max(NM.hitStop, 26); // freeze frame
      let hits = 0;
      for (const e of NM.enemies) {
        if (!e.alive) continue;
        hits++;
        if (e.kind === "warden1984" && cs.finisherReady) { e.hp = 1; dealDamage736(e, 9999, cs.active); }
        else dealDamage736(e, e.boss ? 120 : 80, cs.active);
        e.kb = Math.sign(e.x - NM.x) * 12; e.launch = 16; e.down = 40;
      }
      NM.msg = "🤝 TANDEM FINISHER — KATRIN × MANCHEZ" + (hits ? "" : " (whiffed — nothing in range)"); NM.msgT = now736() + 2200;
      try { sfx("promote"); } catch (e) { }
      cs.finisherReady = false;
    }
    function kSupport736() {
      const cs = NM && NM._v736; if (!cs || cs.ending) return;
      const mt = meta736();
      if (!mt || !mt.k) { NM.msg = "🔒 K support unlocks in Cell 118 (M4)"; NM.msgT = now736() + 1400; return; }
      if (now736() < cs.kReady) { NM.msg = "⏳ K re-routing… " + Math.ceil((cs.kReady - now736()) / 1000) + "s"; NM.msgT = now736() + 1000; return; }
      const use = (label, fn) => { closeDlg(); cs.kReady = now736() + 25000; fn(); try { sfx("portal"); } catch (e) { } };
      dlg("⌘ K — TACTICAL SUPPORT", "K's voice, flat and close, on a channel that shouldn't exist.<br><small>One call, then a 25s cooldown.</small>", [
        { t: "📵 Disable cameras (stun the field)", f: () => use("cameras", () => { for (const e of NM.enemies) if (e.alive && !e.boss) { e.down = Math.max(e.down, 70); e.windup = 0; } NM.msg = "📵 K: \"Cameras are mine. Go.\""; NM.msgT = now736() + 2000; }) },
        { t: "🚪 Decrypt the door (skip this wave)", f: () => use("decrypt", () => { let n = 0; for (const e of NM.enemies) if (e.alive && !e.boss) { e.alive = false; n++; } if (cs.uplink) cs.decrypt = Math.max(0, cs.decrypt - 15); NM.msg = n ? `🚪 K: \"Door's open. ${n} hostiles rerouted.\"` : "🚪 K: \"Nothing to bypass.\""; NM.msgT = now736() + 2200; }) },
        { t: "🪞 Project a decoy Mike (5s aggro)", f: () => use("decoy", () => { cs.decoy = { x: NM.x + NM.face * 180, t: 5 }; NM.msg = "🪞 K: \"They'll chase the better Mike.\""; NM.msgT = now736() + 2000; }) },
        { t: "Hold.", f: closeDlg },
      ]);
    }
    function handleDown736() { // replaces exitNight(false) during the campaign
      const cs = NM && NM._v736; if (!cs || cs.ending) return;
      const ch = cs.chars, act = cs.active, pw = partnerWho(cs);
      ch[act].hp = 0; ch[act].downed = true; ch[act].downT = 8; ch[act].bodyX = NM.x;
      if (ch[pw].downed || ch[pw].out) { missionFail736("Both fighters are down."); return; }
      // control transfers to the standing partner
      const p = cs.partner;
      ch[pw].hp = Math.max(1, ch[pw].hp);
      NM.x = p.x; NM.y = p.y; NM.vx = 0; NM.vy = 0; NM.face = p.face; NM.hp = ch[pw].hp; NM.ifr = 40;
      cs.active = pw;
      NM.msg = `⚠ ${act.toUpperCase()} IS DOWN — ${pw.toUpperCase()} takes over · 8s to revive (E)`; NM.msgT = now736() + 2600;
      try { sfx("bad"); } catch (e) { }
    }
    function revive736() {
      const cs = NM._v736, ch = cs.chars, now = now736();
      const down = (ch.katrin.downed ? "katrin" : ch.manchez.downed ? "manchez" : null);
      if (!down) return false;
      if (Math.abs(NM.x - ch[down].bodyX) > 90) return false;
      ch[down].downed = false; ch[down].hp = Math.round(ch[down].maxHp * 0.4);
      cs.partner.x = ch[down].bodyX; cs.partner.y = FLOOR736() - cs.partner.h; cs.partner.vx = 0; cs.partner.vy = 0;
      cs.sync = Math.min(100, cs.sync + 25);
      NM.msg = `🤝 ${down.toUpperCase()} IS BACK — +25 SYNC`; NM.msgT = now + 1800;
      try { sfx("promote"); } catch (e) { }
      return true;
    }
    function stepPair736(dt, f) { // partner AI + pair bookkeeping, runs after base stepNM
      const cs = NM._v736, ch = cs.chars, now = now736();
      const pw = partnerWho(cs), p = cs.partner, F = FLOOR736();
      ch[cs.active].hp = NM.hp; // mirror the engine's HP back into the sheet
      // revive countdown
      for (const who of ["katrin", "manchez"]) {
        const c = ch[who];
        if (c.downed) {
          c.downT -= dt;
          if (c.downT <= 0) { c.downed = false; c.out = true; NM.msg = `💀 ${who.toUpperCase()} is out for this mission`; NM.msgT = now + 2000; }
        }
      }
      // K decoy pulls aggro
      if (cs.decoy) {
        cs.decoy.t -= dt;
        for (const e of NM.enemies) if (e.alive && !e.boss) { e.windup = 0; e.cd = Math.max(e.cd, 20); e.x += Math.sign(cs.decoy.x - e.x) * 1.6 * f; }
        if (cs.decoy.t <= 0) cs.decoy = null;
      }
      // cryo-tag projectiles (Katrin)
      for (const s of cs.shots) {
        s.x += s.vx * f; s.life -= dt;
        for (const e of NM.enemies) {
          if (!e.alive || e.down > 0) continue;
          if (Math.abs(e.x + e.w / 2 - s.x) < 30 && Math.abs(e.y - s.y) < 46) {
            s.life = 0; e.tracked = now + 6000; dealDamage736(e, 13, "katrin");
            NM.msg = "❄ CRYO-TAG — target TRACKED"; NM.msgT = now + 900;
            break;
          }
        }
      }
      cs.shots = cs.shots.filter(s => s.life > 0 && s.x > NM.cam - 100 && s.x < NM.cam + 1100);
      // tripwire traps
      for (const t of cs.traps) {
        if (t.spent) continue;
        for (const e of NM.enemies) {
          if (!e.alive || e.down > 0 || e.boss) continue;
          if (Math.abs(e.x + e.w / 2 - t.x) < 26 && Math.abs(e.y - (F - e.h)) < 40) {
            t.spent = true; e.down = 60; e.tracked = now + 6000;
            NM.msg = "🪤 TRIPWIRE — floored & TRACKED"; NM.msgT = now + 1100; try { sfx("block"); } catch (e2) { }
            break;
          }
        }
      }
      cs.traps = cs.traps.filter(t => !t.spent);
      // partner AI — stay near, attack the player's target
      if (!ch[pw].downed && !ch[pw].out && !cs.ending) {
        p.hp = ch[pw].hp;
        const tx = NM.x - NM.face * 70, dx = tx - p.x;
        const spd = 3.4;
        if (Math.abs(dx) > 46) { p.vx += Math.sign(dx) * .5 * f; p.face = Math.sign(dx); }
        else p.vx *= Math.pow(.7, f);
        p.vx = Math.max(-spd, Math.min(spd, p.vx));
        if (NM.y < p.y - 70 && p.onGround && Math.abs(dx) < 120) { p.vy = -10; p.onGround = false; }
        p.vy = Math.min(p.vy + 0.48 * f, 13.5);
        p.x = Math.max(0, Math.min(NMW736() - p.w, p.x + p.vx * f));
        p.y += p.vy * f;
        p.onGround = false;
        if (p.y + p.h >= F) { p.y = F - p.h; p.vy = 0; p.onGround = true; }
        for (const pl of NM.platforms) {
          if (p.vy >= 0 && p.y + p.h >= pl.y && p.y + p.h <= pl.y + 20 && p.x + p.w > pl.x && p.x < pl.x + pl.w) { p.y = pl.y - p.h; p.vy = 0; p.onGround = true; }
        }
        // barrier (Warden) keeps the pair split
        if (cs.barrier) { if (p.x < cs.barrier + 30) p.x = cs.barrier + 30; }
        p.cd -= dt; if (p.anim > 0) p.anim -= f;
        if (p.cd <= 0) {
          let best = null, bd = 1e9;
          for (const e of NM.enemies) { if (!e.alive || e.down > 0) continue; const d = Math.abs(e.x - p.x); if (d < bd) { bd = d; best = e; } }
          if (best && bd < 64 && Math.abs(best.y - p.y) < 48) {
            p.cd = 0.9; p.anim = 8; p.face = Math.sign(best.x - p.x) || 1;
            dealDamage736(best, pw === "manchez" ? 11 : 9, pw);
          } else p.cd = 0.15;
        }
        // enemies clip the partner too (light pressure, throttled)
        cs.ptCD -= dt;
        if (cs.ptCD <= 0) {
          for (const e of NM.enemies) {
            if (!e.alive || e.down > 0 || e.launch > 0) continue;
            if (Math.abs(e.x - p.x) < 38 && Math.abs(e.y - p.y) < 42 && Math.random() < 0.3) {
              ch[pw].hp -= Math.round(e.dmg * 0.7); cs.ptCD = 1.2; p.anim = 10;
              if (ch[pw].hp <= 0) {
                ch[pw].hp = 0; ch[pw].downed = true; ch[pw].downT = 8; ch[pw].bodyX = p.x;
                NM.msg = `⚠ ${pw.toUpperCase()} IS DOWN — 8s to revive (E)`; NM.msgT = now + 2200;
              }
              break;
            }
          }
        }
      }
    }
    function stepObjectives736(dt, f) {
      const cs = NM._v736, now = now736(), M = MISSIONS[cs.m];
      if (cs.ending || cs.resolving) return;
      // Threat Forecast: resolve marked spawns
      if (cs.pendingSpawn && now >= cs.pendingSpawn.at) {
        const arr = spawn736(cs.pendingSpawn.kinds, cs), mt = meta736();
        if (mt && mt.waldo) for (const e of arr) if (e.kind === "hunter" || e.boss) e.weak = true; // elite weakness exposed
        NM.enemies = NM.enemies.concat(arr);
        cs.pendingSpawn = null;
      }
      // waves: start next when the field is clear
      if (M.waves && !NM.enemies.some(e => e.alive) && !cs.pendingSpawn) {
        if (cs.wave < M.waves.length) {
          cs.waveDelay += dt;
          if (cs.waveDelay > 1.6) { cs.waveDelay = 0; queueWave736(cs); }
        }
      }
      const clear = !NM.enemies.some(e => e.alive) && !cs.pendingSpawn && (!M.waves || cs.wave >= M.waves.length);
      // m1 — linked door: both fighters near the exit once clear
      if (cs.m === 1 && clear) {
        NM.clear = false;
        NM.msg = "✅ SITE CLEAR — both fighters to the door ➡ (E)"; NM.msgT = now + 500;
        if (NM.x > NMW736() - 220 && Math.abs(cs.partner.x - NM.x) < 160) missionWin736();
        return;
      }
      // m2 — towers then clear
      if (cs.m === 2) {
        const tDone = cs.towers.every(t => t.done);
        if (clear && tDone) return missionWin736();
        // moving launch platform
        const pl = NM.platforms && NM.platforms[1];
        if (pl && !pl._v736base) pl._v736base = pl.x;
        if (pl) pl.x = pl._v736base + Math.sin(now / 900) * 90;
        return;
      }
      // m3 — gravity flux
      if (cs.m === 3) {
        cs.gravT += dt;
        if (cs.gravT > 6) { cs.gravT = 0; cs.lowGrav = !cs.lowGrav; NM.msg = cs.lowGrav ? "🌀 GRAVITY FLUX — the floor forgets you" : "🌀 gravity reasserts"; NM.msgT = now + 1600; }
        if (cs.lowGrav && !NM.onGround) NM.vy -= 0.3 * f;
        if (clear) return missionWin736();
        return;
      }
      // m4 — evidence then ambush
      if (cs.m === 4) {
        if (!cs.cellOpened) {
          const found = cs.evidence.filter(e => e.found).length;
          if (found >= 3 && NM.x > NMW736() - 260) {
            cs.cellOpened = true;
            const mt = meta736(); if (mt) { mt.k = true; }
            try { sfx("promote"); } catch (e) { }
            dlg("⌘ CELL 118 — THE PRISONER", "The restraints answer K's cipher before you touch them. He stands, and for one frame his shadow is someone else.<br><br><i>\"I found out they were printing him. So they printed a cell for me. Freeing me is how you reach Cell 1984 — I'm the only route key left.\"</i><br><br><b>K JOINS AS TACTICAL SUPPORT — press Q in combat.</b>", [
              { t: "We trust him. Move.", f: () => { closeDlg(); cs.wave = 0; queueWave736(cs); NM.msg = "⚠ AMBUSH — ORPHEUS noticed the open door"; NM.msgT = now736() + 2600; } },
            ]);
          }
          return;
        }
        if (cs.cellOpened && clear) return missionWin736();
        return;
      }
      // m5 — Mike Index phases
      if (cs.m === 5) {
        const b = NM.enemies.find(e => e.kind === "mikeindex" && e.alive);
        if (b) {
          if (!cs._adds66 && b.hp <= b.maxHp * 0.66) { cs._adds66 = true; NM.enemies = NM.enemies.concat(spawn736(["droneop", "thug"], cs)); NM.msg = "🔧 TECHNICIAN MIKE — repair drones deployed"; NM.msgT = now + 2200; }
          if (b.phase === 1 && b.hp <= b.maxHp * 0.5) {
            b.phase = 2; b.dashes = true; b.lunges = true; b.spd = 1.7; b.blocks = false; b.tint = "#a06bff";
            NM.msg = "🌙 NIGHT WALKER MIKE — the Index changes its mind about who it is"; NM.msgT = now + 2600;
            NM.hitStop = Math.max(NM.hitStop, 10);
          }
        } else if (clear) return missionWin736();
        return;
      }
      // m6 — split defense + decrypt
      if (cs.m === 6) {
        if (cs.decrypt > 0) cs.decrypt -= dt;
        if (cs.uplink && cs.uplink.hp > 0) {
          for (const e of NM.enemies) {
            if (!e.alive || e.down > 0) continue;
            if (Math.abs(e.x - cs.uplink.x) < 60) {
              e._uz = (e._uz || 0) + dt;
              if (e._uz > 2) { e._uz = 0; cs.uplink.hp -= 8; NM.msg = "⚠ the uplink is taking damage!"; NM.msgT = now + 1000; try { sfx("bad"); } catch (e2) { } }
            }
          }
        }
        if (cs.uplink && cs.uplink.hp <= 0) return missionFail736("The uplink was destroyed — K lost the decrypt stream.");
        if (cs.decrypt <= 0 && clear) {
          const mt = meta736(); if (mt) mt.waldo = true;
          missionWin736();
          return;
        }
        return;
      }
      // m7 — Warden: barrier split, reunion, synchronized launcher finisher
      if (cs.m === 7) {
        const b = NM.enemies.find(e => e.kind === "warden1984" && e.alive);
        if (b) {
          if (cs.barrier && b.hp <= b.maxHp * 0.5) {
            cs.barrier = null; cs.sync = Math.min(100, cs.sync + 30);
            NM.msg = "💥 BARRIER DOWN — REUNITE · +30 SYNC"; NM.msgT = now + 2400; NM.hitStop = Math.max(NM.hitStop, 10);
          }
          if (cs.barrier && NM.x > cs.barrier - 40) NM.x = cs.barrier - 40; // the wall holds
          if (!cs.finisherReady && b.hp <= b.maxHp * 0.15) {
            cs.finisherReady = true;
            NM.msg = "👁 THE EYE IS EXPOSED — G: SYNCHRONIZED LAUNCHER"; NM.msgT = now + 3600; try { sfx("sev"); } catch (e) { }
          }
          if (cs.finisherReady && b.hp < 1) b.hp = 1; // only the tandem finisher ends it
        } else if (clear) return missionWin736();
        return;
      }
    }

    // ---------- stepNM (outermost wrap; campaign branch runs after the engine) ----------
    const _stepNM736 = (typeof stepNM !== "undefined") ? stepNM : null;
    if (_stepNM736) {
      window.stepNM = function (dt) {
        if (!campOn()) return _stepNM736(dt);
        const cs = NM._v736;
        if (cs.ending || cs.resolving) return; // mission over — world holds
        NM.hp = Math.max(1, cs.chars[cs.active].hp); // mirror the active fighter into the engine
        _stepNM736(dt);
        if (!campOn()) return;
        if (typeof S !== "undefined" && S && S.inDialog) return; // dialogs hold the mission clock
        const f = dt * 60;
        try { stepPair736(dt, f); stepObjectives736(dt, f); } catch (e) { window.__err736p = String(e && e.stack || e); }
      };
    }
    // ---------- death intercept: knockdown → transfer, never a night bail ----------
    const _exitNight736 = (typeof exitNight !== "undefined") ? exitNight : null;
    if (_exitNight736) {
      window.exitNight = function (homeSafe) {
        if (campOn() && !NM._v736.ending) {
          if (homeSafe) { endNightQuiet736(); return; } // campaign abort path
          return handleDown736();
        }
        return _exitNight736(homeSafe);
      };
    }
    // ---------- street progression is mission logic during the campaign ----------
    const _nmNextStage736 = (typeof nmNextStage !== "undefined") ? nmNextStage : null;
    if (_nmNextStage736) {
      window.nmNextStage = function () {
        if (campOn()) return; // objectives drive progression, not street exits
        return _nmNextStage736();
      };
    }
    // ---------- jab: Katrin cryo-tag / Manchez pressure ----------
    const _nmJab736 = (typeof nmJab !== "undefined") ? nmJab : null;
    if (_nmJab736) {
      window.nmJab = function () {
        if (!campOn()) return _nmJab736();
        const cs = NM._v736, now = now736();
        if (NM.block || NM.drive || cs.ending) return;
        const who = cs.active;
        NM.jabAnim = 9;
        if (who === "katrin") {
          const c = cs.chars.katrin; c.tags++;
          cs.shots.push({ x: NM.x + NM.face * 26, y: NM.y + 10, vx: NM.face * 8.5, life: 1.4 });
          if (c.tags % 3 === 0) cs.traps.push({ x: NM.x, spent: false }); // every 3rd tag drops a tripwire
          try { sfx("ping"); } catch (e) { }
          return;
        }
        // Manchez — rapid strikes, stage-2 launcher, Tracked homing
        const gap = now - NM.lastJab; NM.lastJab = now;
        NM.jabStage = (gap <= 600) ? (NM.jabStage + 1) % 3 : 0;
        const finisher = NM.jabStage === 2;
        let best = null, bd = 1e9;
        for (const e of NM.enemies) { if (!e.alive || e.down > 0) continue; const d = Math.abs(e.x - NM.x); if (d < bd) { bd = d; best = e; } }
        if (best && best.tracked && bd < 220 && bd > 50) { NM.face = Math.sign(best.x - NM.x) || NM.face; NM.x += NM.face * 18; } // Tracked: home slightly
        const hx = NM.face > 0 ? NM.x + NM.w : NM.x - 38, hw = 38;
        let hit = false;
        for (const e of NM.enemies) {
          if (!e.alive || e.down > 0) continue;
          if (e.x + e.w > hx && e.x < hx + hw && Math.abs(e.y - NM.y) < 46) {
            hit = true;
            if (finisher) { e.kb = NM.face * 11; e.launch = 16; e.down = 36; } // launcher
            else e.kb = NM.face * 4;
            dealDamage736(e, finisher ? 16 : 11, "manchez");
          }
        }
        if (!hit) try { sfx("ping"); } catch (e2) { }
      };
    }
    // ---------- interact: revive / towers / evidence / abort ----------
    const _interact736 = (typeof interact !== "undefined") ? interact : null;
    if (_interact736) {
      window.interact = function () {
        if (campOn() && typeof S !== "undefined" && S && !S.inDialog) {
          const cs = NM._v736, now = now736();
          // revive the downed partner
          const down = cs.chars.katrin.downed ? cs.chars.katrin : cs.chars.manchez.downed ? cs.chars.manchez : null;
          if (down && Math.abs(NM.x - down.bodyX) < 90) { revive736(); return; }
          // m2 uplink towers
          if (cs.towers) {
            const t = cs.towers.find(t => !t.done && Math.abs(NM.x - t.x) < 80);
            if (t) {
              t.done = true;
              const n = cs.towers.filter(t2 => t2.done).length;
              NM.msg = `📡 UPLINK TOWER ${n}/3 DOWN`; NM.msgT = now + 1600;
              try { sfx("promote"); } catch (e) { }
              if (n === 3) { NM.msg = "📡 ALL TOWERS DOWN — credentials stolen · clear the platform"; NM.msgT = now + 2600; }
              return;
            }
          }
          // m4 evidence glints
          if (cs.evidence && !cs.cellOpened) {
            const ev = cs.evidence.find(e => !e.found && Math.abs(NM.x - e.x) < 80);
            if (ev) {
              ev.found = true;
              const mt = meta736(); if (mt && !mt.evidence.includes(ev.id)) mt.evidence.push(ev.id);
              const n = cs.evidence.filter(e => e.found).length;
              try { sfx("beep520"); } catch (e) { }
              dlg("🔍 EVIDENCE — " + ev.label, ev.text + `<br><small>Clues found: ${n}/4 — ${n >= 3 ? "the pattern is clear. Open the cell (walk right)." : "keep looking."}</small>`, [{ t: "Log it.", f: closeDlg }]);
              return;
            }
          }
          // abort at the car instead of the district map
          if (typeof NM_CAR_X !== "undefined" && NM.x < NM_CAR_X + 150) {
            dlg("🛰 THE 118/1984 BREAKOUT", "Abort the mission? Progress up to the last completed mission is saved.", [
              { t: "Keep fighting.", f: closeDlg },
              { t: "Abort to the title", f: () => { closeDlg(); endNightQuiet736(); try { save(); } catch (e) { } location.reload(); } },
            ]);
            return;
          }
          return window.nmJab();
        }
        return _interact736();
      };
    }
    // ---------- keys: C swap · Q K support · G tandem finisher ----------
    window.addEventListener("keydown", (e) => {
      try {
        if (!campOn() || (typeof S !== "undefined" && S && S.inDialog)) return;
        const k = (e.key || "").toLowerCase();
        if (k === "c") swap736();
        else if (k === "q") kSupport736();
        else if (k === "g") tandemFinisher736();
      } catch (e2) { }
    }, true);

    // ---------- drawNM overlay (outermost wrap) ----------
    const _drawNM736 = (typeof drawNM !== "undefined") ? drawNM : null;
    if (_drawNM736) {
      window.drawNM = function () {
        _drawNM736();
        if (!campOn()) return;
        try {
          const cs = NM._v736, now = now736(), F = FLOOR736(), W = cv.width;
          const pw = partnerWho(cs), ch = cs.chars, p = cs.partner;
          ctx.save();
          // tether warning when the pair separates
          if (!ch[pw].downed && !ch[pw].out && Math.abs(p.x - NM.x) > 420) {
            ctx.strokeStyle = "rgba(255,209,102,.5)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(NM.x - NM.cam + 11, NM.y - 10); ctx.lineTo(p.x - NM.cam + 11, p.y - 10); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "#ffd166"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
            ctx.fillText("⟟ TETHER STRAINING", (NM.x + p.x) / 2 - NM.cam, Math.min(NM.y, p.y) - 30);
          }
          // the partner fighter
          if (!ch[pw].downed && !ch[pw].out) {
            const px = p.x - NM.cam + p.w / 2, py = p.y + p.h;
            if (p.anim > 0) drawPairFig736(ctx, pw, px, py, 46, pw === "manchez" ? "strike" : "cast", p.face < 0, now);
            else drawPairFig736(ctx, pw, px, py, 46, null, p.face < 0, now);
            ctx.fillStyle = pw === "katrin" ? "#3fa9f5" : "#f59e0b";
            ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText(pw.toUpperCase(), px, py - 56);
            ctx.fillStyle = "#222"; ctx.fillRect(px - 16, py - 52, 32, 3);
            ctx.fillStyle = pw === "katrin" ? "#3fa9f5" : "#f59e0b";
            ctx.fillRect(px - 16, py - 52, 32 * Math.max(0, ch[pw].hp) / ch[pw].maxHp, 3);
          }
          // downed bodies + revive prompt
          for (const who of ["katrin", "manchez"]) {
            const c = ch[who];
            if (!c.downed) continue;
            const bx = c.bodyX - NM.cam;
            ctx.save(); ctx.translate(bx, F); ctx.rotate(-Math.PI / 2 * .9);
            drawPairFig736(ctx, who, 0, 0, 40, "down", false, now); ctx.restore();
            const blink = .5 + .5 * Math.sin(now / 150);
            ctx.fillStyle = "rgba(255,82,82," + blink + ")"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
            ctx.fillText("Ⓔ REVIVE — " + Math.max(0, c.downT).toFixed(1) + "s", bx, F - 70);
          }
          // tandem finisher burst (KATRIN_MANCHEZ duo_* frame, composed dog-action fallback)
          if (cs.finisherFx && now < cs.finisherFx) {
            const bx = (NM.x + (ch[partnerWho(cs)].downed || ch[partnerWho(cs)].out ? NM.x : cs.partner.x)) / 2 - NM.cam;
            ctx.globalAlpha = Math.min(1, (cs.finisherFx - now) / 300);
            duoFig736(ctx, ((now / 140) | 0) % 2 ? "duo_slam" : "duo_vortex", bx - 90, F - 170, 180, 150, false, now);
            ctx.fillStyle = "rgba(255,240,200,.18)"; ctx.fillRect(0, 0, W, cv.height);
            ctx.globalAlpha = 1;
          }
          // cryo-tags + tripwires (K_FULL k_orb for tags when present)
          for (const s of cs.shots) {
            if (!atlasFrame736("K_FULL", "k_orb", ctx, s.x - NM.cam - 9, s.y - 9, 18, 18)) {
              ctx.fillStyle = "#67e8f9"; ctx.beginPath(); ctx.arc(s.x - NM.cam, s.y, 5, 0, 7); ctx.fill();
              ctx.strokeStyle = "rgba(103,232,249,.5)"; ctx.beginPath(); ctx.arc(s.x - NM.cam, s.y, 9, 0, 7); ctx.stroke();
            }
          }
          for (const t of cs.traps) {
            ctx.strokeStyle = "rgba(103,232,249,.7)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(t.x - NM.cam - 12, F); ctx.lineTo(t.x - NM.cam, F - 8); ctx.lineTo(t.x - NM.cam + 12, F); ctx.stroke();
          }
          // decoy Mike (K_FULL k_decoy when present)
          if (cs.decoy) {
            const dx = cs.decoy.x - NM.cam;
            ctx.globalAlpha = .5 + .2 * Math.sin(now / 120);
            if (!atlasFrame736("K_FULL", "k_decoy", ctx, dx - 17, F - 48, 34, 48)) {
              ctx.fillStyle = "#4a6390"; ctx.fillRect(dx - 11, F - 34, 22, 34);
            }
            ctx.fillStyle = "#7ec8ff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText("MIKE?", dx, F - 42);
            ctx.globalAlpha = 1;
          }
          // m2 towers
          if (cs.towers) for (const t of cs.towers) {
            const tx = t.x - NM.cam;
            ctx.strokeStyle = t.done ? "#2a3350" : "#f59e0b"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(tx, F); ctx.lineTo(tx, F - 150); ctx.stroke();
            ctx.fillStyle = t.done ? "#2a3350" : ((now / 300 | 0) % 2 ? "#ff5252" : "#5a1620");
            ctx.beginPath(); ctx.arc(tx, F - 150, 8, 0, 7); ctx.fill();
            if (!t.done) { ctx.fillStyle = "#9fb7d9"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText("Ⓔ DISABLE", tx, F - 166); }
          }
          // m4 evidence glints
          if (cs.evidence && !cs.cellOpened) for (const ev of cs.evidence) {
            if (ev.found) continue;
            const ex = ev.x - NM.cam, a = .5 + .5 * Math.sin(now / 200 + ev.x);
            ctx.fillStyle = "rgba(103,232,249," + a + ")"; ctx.font = "16px monospace"; ctx.textAlign = "center";
            ctx.fillText("✦", ex, F - 60);
            ctx.font = "9px monospace"; ctx.fillText("Ⓔ", ex, F - 44);
          }
          if (cs.evidence && !cs.cellOpened) { // the cell door at the far end
            ctx.strokeStyle = "#67e8f9"; ctx.lineWidth = 3; ctx.strokeRect(NMW736() - 200 - NM.cam, F - 160, 90, 160);
            ctx.fillStyle = "#67e8f9"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
            ctx.fillText("CELL 118", NMW736() - 155 - NM.cam, F - 172);
          }
          // m6 uplink + decrypt
          if (cs.uplink) {
            const ux = cs.uplink.x - NM.cam;
            ctx.fillStyle = "#101828"; ctx.fillRect(ux - 18, F - 90, 36, 90);
            ctx.strokeStyle = "#39d3ff"; ctx.lineWidth = 2; ctx.strokeRect(ux - 18, F - 90, 36, 90);
            ctx.fillStyle = ((now / 260) | 0) % 2 ? "#39d3ff" : "#123a4a"; ctx.fillRect(ux - 6, F - 108, 12, 12);
            ctx.fillStyle = "#222"; ctx.fillRect(ux - 24, F - 122, 48, 6);
            ctx.fillStyle = cs.uplink.hp > 40 ? "#39d3ff" : "#ff6b81";
            ctx.fillRect(ux - 24, F - 122, 48 * Math.max(0, cs.uplink.hp) / cs.uplink.maxHp, 6);
            if (cs.decrypt > 0) {
              ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 150, 136, 300, 20);
              ctx.fillStyle = "#39ff88"; ctx.fillRect(W / 2 - 146, 140, 292 * (1 - cs.decrypt / 60), 12);
              ctx.fillStyle = "#0b0e1d"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
              ctx.fillText("K DECRYPTING CELL 1984 — " + Math.ceil(cs.decrypt) + "s", W / 2, 150);
            }
          }
          // m6 uplink shield shimmer (K_FULL k_shield when present)
          if (cs.uplink && cs.uplink.hp > 0) {
            const ux = cs.uplink.x - NM.cam, a = .3 + .2 * Math.sin(now / 300);
            ctx.globalAlpha = a;
            atlasFrame736("K_FULL", "k_shield", ctx, ux - 34, F - 120, 68, 120);
            ctx.globalAlpha = 1;
          }
          // m7 Warden body overlay (WARDEN frames when present) + barrier
          {
            const wb = NM.enemies.find(e => e.kind === "warden1984" && e.alive);
            if (wb) atlasFrame736("WARDEN", cs.finisherReady ? "wd_ring" : (wb.windup > 0 ? "wd_laser" : ((now / 900 | 0) % 2 ? "wd_chain" : "wd_grab")), ctx, wb.x - NM.cam - 24, wb.y - 34, wb.w + 48, wb.h + 34);
          }
          if (cs.barrier) {
            const bx = cs.barrier - NM.cam;
            if (atlasFrame736("WARDEN", "wd_barrier", ctx, bx - 10, 60, 36, F - 60)) {
              ctx.fillStyle = "#ff5252"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText("SURVEILLANCE BARRIER", bx + 8, 76);
            } else {
            const g = ctx.createLinearGradient(bx, 0, bx + 16, 0);
            g.addColorStop(0, "rgba(255,82,82,.05)"); g.addColorStop(.5, "rgba(255,82,82,.5)"); g.addColorStop(1, "rgba(255,82,82,.05)");
            ctx.fillStyle = g; ctx.fillRect(bx, 60, 16, F - 60);
            ctx.fillStyle = "#ff5252"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText("SURVEILLANCE BARRIER", bx + 8, 76);
            }
          }
          // Threat Forecast spawn markers
          if (cs.pendingSpawn) {
            const rem = Math.max(0, (cs.pendingSpawn.at - now) / 1000);
            cs.pendingSpawn.kinds.forEach((kind, i) => {
              const mx = ((i % 2 ? 1250 : 640) + i * 130) - NM.cam, a = .4 + .6 * Math.abs(Math.sin(now / 160));
              ctx.strokeStyle = "rgba(255,209,102," + a + ")"; ctx.lineWidth = 2;
              ctx.strokeRect(mx - 14, F - 48, 28, 48);
              ctx.fillStyle = "rgba(255,209,102," + a + ")"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
              ctx.fillText(rem.toFixed(1), mx, F - 56);
            });
          }
          // boss HP bars
          for (const e of NM.enemies) {
            if (!e.alive || !e.boss) continue;
            ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 170, 84, 340, 20);
            ctx.fillStyle = "#333"; ctx.fillRect(W / 2 - 164, 89, 328, 10);
            ctx.fillStyle = e.kind === "warden1984" ? "#a06bff" : e.phase === 2 ? "#a06bff" : "#67e8f9";
            ctx.fillRect(W / 2 - 164, 89, 328 * Math.max(0, e.hp) / e.maxHp, 10);
            ctx.fillStyle = "#e8ecff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
            const sub = e.kind === "mikeindex" ? (e.phase === 2 ? " — NIGHT WALKER MIKE" : " — TECHNICIAN MIKE") : (cs.finisherReady ? " — EYE EXPOSED · G" : "");
            ctx.fillText(e.name + sub, W / 2, 99);
          }
          // ---------- duo HUD ----------
          ctx.fillStyle = "#000a"; ctx.fillRect(10, 92, 250, 66);
          const rows = [["katrin", "#3fa9f5"], ["manchez", "#f59e0b"]];
          rows.forEach(([who, col], i) => {
            const c = ch[who], y = 100 + i * 20;
            ctx.fillStyle = who === cs.active ? col : "#556"; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
            ctx.fillText((who === cs.active ? "▶ " : "") + who.toUpperCase(), 16, y + 8);
            ctx.fillStyle = "#333"; ctx.fillRect(76, y + 2, 130, 8);
            ctx.fillStyle = c.out ? "#552" : c.downed ? "#ff5252" : col;
            ctx.fillRect(76, y + 2, 130 * Math.max(0, c.hp) / c.maxHp, 8);
            if (c.downed) { ctx.fillStyle = "#ff5252"; ctx.fillText("DOWN " + Math.max(0, c.downT).toFixed(0) + "s", 212, y + 9); }
            else if (c.out) { ctx.fillStyle = "#887"; ctx.fillText("OUT", 212, y + 9); }
          });
          // sync meter (CAMP_UI meter frame when the payload is present)
          const sy = 142;
          if (!campFrame(ctx, "meter_hack", 16, sy - 2, 240, 14)) {
            ctx.fillStyle = "#333"; ctx.fillRect(16, sy, 240, 10);
            ctx.fillStyle = cs.sync >= 100 ? "#ffd24a" : "#c084fc";
            ctx.fillRect(16, sy, 240 * cs.sync / 100, 10);
            ctx.strokeStyle = "#556"; ctx.strokeRect(16, sy, 240, 10);
          }
          ctx.fillStyle = cs.sync >= 100 ? "#ffd24a" : "#9fb7d9"; ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
          ctx.fillText(cs.sync >= 100 ? "SYNC FULL — G: TANDEM FINISHER" : "SYNC " + Math.round(cs.sync), 20, sy + 22);
          const mt = meta736();
          if (mt && mt.k) {
            ctx.fillStyle = now < cs.kReady ? "#556" : "#39ff88";
            ctx.fillText(now < cs.kReady ? "K ⏳ " + Math.ceil((cs.kReady - now) / 1000) + "s" : "K READY — Q", 130, sy + 22);
          }
          // campaign banner
          ctx.fillStyle = "#0009"; ctx.fillRect(W - 262, 78, 252, 22);
          ctx.fillStyle = "#a06bff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "right";
          ctx.fillText("118/1984 · M" + cs.m + " " + (MISSIONS[cs.m].name || "") + " · C swap", W - 16, 92);
          ctx.restore();
        } catch (e) { window.__err736d = String(e && e.stack || e); }
      };
    }

    // ---------- the Charger gains the campaign drive option (needs the Ghost Shift seed) ----------
    const _nmCarMenu736 = (typeof nmCarMenu !== "undefined") ? nmCarMenu : null;
    if (_nmCarMenu736) {
      window.nmCarMenu = function () {
        try {
          const s = (typeof S !== "undefined") ? S : null;
          if (s && s.meta && s.meta._v733ghost && !(s.meta._v736 && s.meta._v736.done) && typeof NM !== "undefined" && NM && !NM._v736) {
            const mt = meta736();
            return dlg("🚗 THE CHARGER — where to?", "The engine idles. Katrin's intercepted burst repeats on the police band: <b>CELL 118 · CELL 1984</b>.<br><small>Side story: progress is saved between missions.</small>", [
              { t: `🛰 THE 118/1984 BREAKOUT <small>· co-op side story${mt && mt.m > 1 ? " · resume M" + mt.m : ""}</small>`, f: () => { closeDlg(); try { s.nightMode = null; NM = null; } catch (e) { } start736(); } },
              { t: "Regular district map…", f: () => { closeDlg(); _nmCarMenu736(); } },
            ]);
          }
        } catch (e) { }
        return _nmCarMenu736();
      };
    }

    // ---------- title-screen entry (felTitle pattern) + unlock note ----------
    (function title736() {
      try {
        const ts = document.getElementById("title-screen"); if (!ts) return;
        const saved = (function () { try { const d = localStorage.getItem("techops_save"); return d ? JSON.parse(d) : null; } catch (e) { return null; } })();
        const pr = saved && saved.meta && saved.meta._v736;
        const b = document.createElement("button");
        b.id = "btn-v736";
        b.textContent = "🛰 THE 118/1984 BREAKOUT — CO-OP SIDE STORY" + (pr && pr.done ? " · ✅ REPLAY FINALE" : pr && pr.m > 1 ? " · RESUME M" + pr.m : "");
        b.onclick = () => start736();
        ts.appendChild(b);
        if (pr && pr.done) {
          const n = document.createElement("div");
          n.id = "v736-pair-note";
          n.style.cssText = "color:#a06bff;font:11px monospace;margin-top:4px";
          n.textContent = "🤝 Katrin & Manchez unlocked as a night pair (campaign complete)";
          ts.appendChild(n);
        }
      } catch (e) { }
    })();

    // ---------- exports ----------
    window.v736 = {
      version: VER,
      active: () => campOn(),
      start: start736,
      play: (id) => playCine736(id || "b736m1", null),
      state: () => { const mt = meta736() || {}; return { mission: mt.m || 1, done: !!mt.done, k: !!mt.k, waldo: !!mt.waldo, evidence: (mt.evidence || []).slice(), breakout: !!((typeof S !== "undefined") && S && S.meta && S.meta._v736breakout) }; },
      swap: swap736, support: kSupport736, finisher: tandemFinisher736,
      campUi: () => campReady(),
    };
    console.log("[v7.36] 118/1984 breakout loaded");
  } catch (e) { window.__err736 = String(e && e.stack || e); console.log("[v7.36] load error: " + e); }
})();

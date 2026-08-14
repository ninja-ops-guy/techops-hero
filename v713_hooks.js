/* ============================================================
   TechOps Hero v7.13 — WAYPOINTS, DOORS & FACES
   Three consistency/feature pillars:

   1. OBJECTIVE WAYPOINTS — the path guide used to always point
      at the nearest open ticket, even after you'd interviewed the
      user and moved on to the device / portal. Now the waypoint
      follows the ticket's actual objective: TALK TO USER →
      FIND THE ⚠️ DEVICE → ENTER THE 🌀 PORTAL. The moment a user
      says "the portal is open by the device", the guide is
      already pointing at it. Works for walk-ins, repeats,
      incident leaves and criticals (same npc→device→portal
      model), yields to v68's WAY HOME guide at clock-out, and
      announces every retarget with a toast.

   2. ONWARD DOORS — every side-view room except the factory now
      has a second door on the FAR edge that leads to the next
      logical place on the map: Executive → Finance → Sales →
      HR → IT → the plant floor; Engineering → plant floor;
      Marketing → plant floor. The entry-edge door still takes
      you back to the exact tile you left (v7.10); the onward
      door drops you inside the destination department.

   3. CAST VARIETY — the 8 dept sprites now render as distinct
      people: a deterministic per-NPC variant (skin tone, hair
      color, outfit tint) recolored from the original palette
      with shading preserved, drawn crisp at exact 4:1 pixel
      scale. Crew and Felicia keep their canonical looks.
   ============================================================ */
(function () {
  "use strict";

  /* ==================== 1. objective waypoints ==================== */
  function bfs713(sx, sy, tx, ty) {
    const m = S.map;
    if (!m || !m[sy] || !m[ty]) return null;
    const key = (x, y) => x + "," + y;
    const prev = new Map(), q = [[sx, sy]];
    prev.set(key(sx, sy), null);
    const targets = new Set();
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = tx + dx, y = ty + dy;
      if (m[y] && m[y][x] === 0) targets.add(key(x, y));
    }
    if (!targets.size) return null;
    let found = null;
    while (q.length && !found) {
      const [x, y] = q.shift();
      if (targets.has(key(x, y))) { found = [x, y]; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (m[ny] && m[ny][nx] === 0 && !prev.has(k)) { prev.set(k, [x, y]); q.push([nx, ny]); }
      }
    }
    if (!found) return null;
    const path = [];
    let cur = found;
    while (cur) { path.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
    return path;
  }

  // The ticket's current objective: portal (3) > device (2) > person (0).
  // Returns null when v68's default guide should stay in charge.
  function objective713() {
    const s = S;
    if (!s || !s.npcs || s.nightMode || s.inBattle || s.room) return null;
    if (s.clock >= 960) return null; // 16:00 — v68's WAY HOME owns the guide
    let best = null, bestW = 0, bestD = 1e9;
    for (const n of s.npcs) {
      if (!n || n.ambient || n.done || !n.type) continue;
      const d = Math.abs(n.x - s.px) + Math.abs(n.y - s.py);
      // portal open for this ticket?
      const po = (s.portals || []).find(p => p.npc === n.id && !p.cleared);
      if (po) {
        if (bestW < 3 || (bestW === 3 && d < bestD)) { bestW = 3; bestD = d; best = { x: po.x, y: po.y, color: "#c9a0ff", label: "🌀 PORTAL — " + (n.type.label || "ticket"), kind: "portal" }; }
        continue;
      }
      // broken device waiting for diagnosis/repair?
      const dev = (s.devices || []).find(dd => dd.npc === n.id && !dd.fixed);
      if (dev) {
        if (bestW < 2 || (bestW === 2 && d < bestD)) { bestW = 2; bestD = d; best = { x: dev.x, y: dev.y, color: "#ffb84a", label: "⚠️ DEVICE — " + (n.type.label || "ticket"), kind: "device" }; }
        continue;
      }
    }
    return best; // null → v68 points at the nearest user to talk to
  }

  let _objKey = "", _path = null, _pathAt = 0, _pathKey = "";
  function objPath() {
    const s = S, tm = performance.now();
    const t = objective713();
    if (!t) { _objKey = ""; return null; }
    const k = t.kind + ":" + t.x + "," + t.y;
    if (k !== _objKey) {
      _objKey = k;
      try { if (typeof toast === "function") toast(`📍 WAYPOINT UPDATED<br><small>${t.label}</small>`, 2200); } catch (e) { }
      if (typeof sfx === "function") try { sfx("click"); } catch (e) { }
    }
    const px = Math.round(s.px), py = Math.round(s.py);
    const pk = `${px},${py}->${t.x},${t.y}`;
    if (tm - _pathAt > 600 || pk !== _pathKey) {
      _path = bfs713(px, py, t.x, t.y);
      _pathAt = tm; _pathKey = pk;
    }
    return _path ? { path: _path, target: t } : null;
  }

  const __origDraw713 = draw;
  draw = function () {
    const s = S;
    const obj = (s && s.map && !s.nightMode && !s.inBattle && !s.room) ? objective713() : null;
    // suppress v68's guide only while an objective overrides it
    let g = null, suppressed = false;
    if (obj && window.V67SET && V67SET.guides !== false) { g = V67SET.guides; V67SET.guides = false; suppressed = true; }
    __origDraw713.apply(this, arguments);
    if (suppressed) V67SET.guides = g;
    if (!obj || !window.V67SET || V67SET.guides === false) return;
    const gg = objPath();
    if (!gg || gg.path.length < 2) return;
    const tm = performance.now();
    const ts = cv.height / 14, sc = ts / TILE;
    ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
    const flow = Math.floor(tm / 300);
    for (let i = 1; i < gg.path.length - 1; i += 2) {
      const [x, y] = gg.path[i];
      const on = (i + flow) % 4 < 2;
      ctx.globalAlpha = on ? .85 : .35;
      ctx.fillStyle = gg.target.color;
      ctx.beginPath();
      ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 3, 0, 7);
      ctx.fill();
    }
    const t = gg.target;
    const pulse = 4 + 3 * Math.sin(tm / 250);
    ctx.globalAlpha = .9;
    ctx.strokeStyle = t.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x * TILE + TILE / 2, t.y * TILE + TILE / 2, 10 + pulse, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "#000"; ctx.globalAlpha = .75;
    const tw = ctx.measureText(t.label).width + 8;
    ctx.fillRect(t.x * TILE + TILE / 2 - tw / 2, t.y * TILE - 16, tw, 11);
    ctx.globalAlpha = 1; ctx.fillStyle = t.color;
    ctx.fillText(t.label, t.x * TILE + TILE / 2, t.y * TILE - 7);
    ctx.fillStyle = "#000"; ctx.globalAlpha = .7;
    ctx.fillRect(t.x * TILE + TILE / 2 - 18, t.y * TILE - 27, 36, 10);
    ctx.globalAlpha = 1; ctx.fillStyle = "#fff";
    ctx.fillText((gg.path.length - 1) + " tiles", t.x * TILE + TILE / 2, t.y * TILE - 19);
    ctx.restore();
  };

  /* ==================== 2. onward doors ==================== */
  const NEXT_OF_ROOM = {
    exec: { biome: "finance", name: "FINANCE ROW" },
    finance: { biome: "sales", name: "SALES FLOOR" },
    sales: { biome: "hr", name: "HR CORNER" },
    hr: { biome: "itdept", name: "IT DEPARTMENT" },
    itdept: { biome: "factory", name: "THE PLANT FLOOR" },
    eng: { biome: "factory", name: "THE PLANT FLOOR" },
    marketing: { biome: "factory", name: "THE PLANT FLOOR" },
  };
  function onwardOf(room) {
    if (!room || !room.id) return null;
    return NEXT_OF_ROOM[room.id] || null;
  }
  // render the onward door on the edge opposite the exit door
  const __origDraw713b = draw;
  draw = function () {
    __origDraw713b.apply(this, arguments);
    const s = S;
    if (!s || !s.room) return;
    const nxt = onwardOf(s.room);
    if (!nxt) return;
    const W = cv.width, H = cv.height;
    const left = s.room.door === "right"; // onward = opposite edge
    const dx = left ? W * .012 : W * .962, dw = W * .026;
    const dy = H * .52, dh = H * .40;
    const tm = performance.now();
    const glow = .55 + .25 * Math.sin(tm / 350);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = "#8affc1";
    ctx.fillRect(dx - 2, dy - 4, dw + 4, dh + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0d1520";
    ctx.fillRect(dx, dy, dw, dh);
    ctx.strokeStyle = "#8affc1"; ctx.lineWidth = 2;
    ctx.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
    ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "#8affc1";
    ctx.fillText(left ? "◀" : "▶", dx + dw / 2, dy - 10);
    // label
    ctx.font = "bold 9px monospace";
    const lbl = (left ? "◀ " : "") + nxt.name + (left ? "" : " ▶");
    const tw = ctx.measureText(lbl).width + 10;
    ctx.fillStyle = "rgba(4,8,14,.8)";
    ctx.fillRect(dx + dw / 2 - tw / 2, dy + dh + 8, tw, 13);
    ctx.fillStyle = "#8affc1";
    ctx.fillText(lbl, dx + dw / 2, dy + dh + 18);
    ctx.restore();
  };
  // walk into the onward door: exit the room into the destination dept
  const __origStep713 = step;
  step = function (dt) {
    const s = S;
    if (s && s.room && !s.inDialog) {
      const nxt = onwardOf(s.room);
      if (nxt) {
        const left = s.room.door === "right";
        const x = s.room.x || 0;
        const hitLeft = left && x <= .031 && ((typeof keys !== "undefined" && (keys.a || keys.arrowleft)) || (typeof joy !== "undefined" && joy && joy.x < -0.3));
        const hitRight = !left && x >= .969 && ((typeof keys !== "undefined" && (keys.d || keys.arrowright)) || (typeof joy !== "undefined" && joy && joy.x > 0.3));
        if (hitLeft || hitRight) {
          let spot = null;
          try { spot = spotInBiome(s.map, nxt.biome); } catch (e) { }
          if (spot) {
            s.room.back = { px: spot.x, py: spot.y };
            try { if (typeof toast === "function") toast(`🚪 THROUGH TO ${nxt.name}`, 1800); } catch (e) { }
            try { if (typeof sfx === "function") sfx("door"); } catch (e) { }
            window.v69ExitRoom();
            return;
          }
        }
      }
    }
    return __origStep713.apply(this, arguments);
  };

  /* ==================== 3. cast variety ==================== */
  // per-cell color roles (from palette analysis of the v6.5 atlas)
  const ROLE_MAP = {
    0: { skin: ["#d99a63", "#d4945b", "#c8894f"], hair: ["#2b180b"], outfit: ["#1a4826", "#0f2715"] },
    1: { skin: ["#a8682d", "#864915"], hair: ["#2b180b"], outfit: ["#105591", "#094b85"] },
    2: { skin: ["#d4945b", "#c8894f", "#d99a63"], hair: ["#2b180b"], outfit: ["#171c24", "#1c222a"] },
    3: { skin: ["#d4945b", "#c8894f"], hair: ["#4e2709", "#6b380e", "#2b180b"], outfit: ["#171c24", "#1c222a"] },
    4: { skin: ["#a8682d", "#6b380e"], hair: [], outfit: ["#171c24", "#1c222a"] },
    5: { skin: ["#b67638", "#a8682d"], hair: ["#141416"], outfit: ["#1c222a", "#171c24", "#24272d"] },
    6: { skin: ["#d99a63", "#d4945b"], hair: ["#141416"], outfit: ["#85a9c8", "#7597b3"] },
    7: { skin: ["#d99a63", "#d4945b", "#c8894f"], hair: ["#141416"], outfit: ["#ccc7b5", "#d9d6c7"] },
  };
  const SKINS = ["#eec39a", "#d99a63", "#a8682d", "#6e3f1d"];
  const HAIRS = ["#1a1a1c", "#3a2410", "#6b3210", "#a8803a", "#777777"];
  const OUTFITS = [null, "#2a7a7a", "#7a2a3a", "#5a6a2a", "#3a4a6a", "#5a3a6a"]; // null = dept colors
  function hex2rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function lum(c) { return .299 * c[0] + .587 * c[1] + .114 * c[2]; }
  function rampFor(baseHex, n) {
    const b = hex2rgb(baseHex), out = [];
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 1 : .78 + (i / (n - 1)) * .42; // dark→light shading ramp
      out.push([Math.min(255, Math.round(b[0] * f)), Math.min(255, Math.round(b[1] * f)), Math.min(255, Math.round(b[2] * f))]);
    }
    return out;
  }
  const npcImg713 = new Image();
  if (typeof TO_NPCS !== "undefined") npcImg713.src = TO_NPCS;
  const varCache = new Map(); // "cell|skin|hair|outfit" -> canvas
  function variantCell(cell, si, hi, oi) {
    const key = cell + "|" + si + "|" + hi + "|" + oi;
    if (varCache.has(key)) return varCache.get(key);
    const roles = ROLE_MAP[cell] || { skin: [], hair: [], outfit: [] };
    const c = document.createElement("canvas"); c.width = 128; c.height = 128;
    const x2 = c.getContext("2d");
    x2.drawImage(npcImg713, cell * 128, 0, 128, 128, 0, 0, 128, 128);
    const im = x2.getImageData(0, 0, 128, 128), dt = im.data;
    // build per-cell recolor table
    const table = new Map();
    const groups = [
      [roles.skin, rampFor(SKINS[si], roles.skin.length)],
      [roles.hair, hi >= 0 ? rampFor(HAIRS[hi], roles.hair.length) : null],
      [roles.outfit, OUTFITS[oi] ? rampFor(OUTFITS[oi], roles.outfit.length) : null],
    ];
    for (const [srcs, ramp] of groups) {
      if (!srcs || !srcs.length || !ramp) continue;
      const sorted = srcs.map(hex2rgb).sort((a, b) => lum(a) - lum(b));
      sorted.forEach((rgb, i) => table.set((rgb[0] << 16) | (rgb[1] << 8) | rgb[2], ramp[i]));
    }
    for (let i = 0; i < dt.length; i += 4) {
      if (dt[i + 3] < 200) continue;
      const k = (dt[i] << 16) | (dt[i + 1] << 8) | dt[i + 2];
      const rep = table.get(k);
      if (rep) { dt[i] = rep[0]; dt[i + 1] = rep[1]; dt[i + 2] = rep[2]; }
    }
    x2.putImageData(im, 0, 0);
    varCache.set(key, c);
    return c;
  }
  const CREW713 = ["mike", "nick", "amit", "brandon", "daniel"];
  const v713WalkMap = new Map(); // v7.20: per-NPC last tile + time, drives the 2-frame step
  function hash713(n) { let h = (n.id || 0) * 2654435761 >>> 0; return (h ^ (h >>> 13)) >>> 0; }
  const __origDrawSpr713 = (typeof drawSpr !== "undefined") ? drawSpr : null;
  if (__origDrawSpr713 && typeof SPR_NPC !== "undefined") {
    drawSpr = function (rows, pal, tx, ty, flip) {
      if (rows === SPR_NPC && npcImg713.complete && npcImg713.naturalWidth && typeof S !== "undefined" && S && S.npcs) {
        const n = S.npcs.find(nn => nn.x === tx && nn.y === ty);
        const nm = ((n && n.name) || "").toLowerCase();
        const isCrew = CREW713.some(k => nm.includes(k)) || (typeof isFel === "function" && n && isFel(n));
        const idx = (typeof npcIdx === "function") ? npcIdx(n) : 1;
        const h = n ? hash713(n) : 0;
        const cell = isCrew ? null : variantCell(idx, h % 4, (h >>> 3) % 5, (h >>> 6) % 6);
        // v7.20: NPCs draw at 40px (was 32) so the cast reads at the player's scale,
        // with a 2-frame step cycle when the NPC is on the move.
        const SZ = 40;
        const now713 = performance.now();
        const nid = n ? (n.id ?? n.name ?? tx * 91 + ty) : tx * 91 + ty;
        const rec = v713WalkMap.get(nid);
        let walking = false;
        if (!rec) v713WalkMap.set(nid, { x: tx, y: ty, t: 0 });
        else if (rec.x !== tx || rec.y !== ty) { v713WalkMap.set(nid, { x: tx, y: ty, t: now713 }); walking = true; }
        else walking = now713 - rec.t < 380;
        const step = walking ? ((now713 / 170) | 0) % 2 : 0; // frame A / frame B
        const bob = Math.sin(now713 / 480 + tx * 7 + ty * 3) * (walking ? 0.4 : 1.1);
        const dx = tx * TILE + (TILE - SZ) / 2, dy = ty * TILE + TILE - SZ + 3 + bob - (step ? 1.6 : 0);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // soft shadow (squashes on the lifted frame)
        ctx.globalAlpha = .25; ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(tx * TILE + TILE / 2, ty * TILE + TILE - 2, step ? 9 : 11, step ? 3 : 3.6, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        // frame B: subtle forward lean + squash for a readable 2-frame walk
        if (step) { ctx.translate(tx * TILE + TILE / 2, ty * TILE + TILE); ctx.transform(1.03, 0, step ? .04 : 0, .96, 0, 0); ctx.translate(-(tx * TILE + TILE / 2), -(ty * TILE + TILE)); }
        if (isCrew) ctx.drawImage(npcImg713, idx * 128, 0, 128, 128, dx, dy, SZ, SZ);
        else ctx.drawImage(cell, dx, dy, SZ, SZ);
        ctx.restore();
        return;
      }
      return __origDrawSpr713(rows, pal, tx, ty, flip);
    };
  }

  /* ==================== 4. run card export (roadmap: portfolio card) ==================== */
  function runCardCanvas() {
    const s = S || {};
    const meta = s.meta || {};
    const c = document.createElement("canvas"); c.width = 480; c.height = 270;
    const x = c.getContext("2d");
    // backdrop: navy/purple brand gradient + scanlines
    const gr = x.createLinearGradient(0, 0, 480, 270);
    gr.addColorStop(0, "#141428"); gr.addColorStop(1, "#241a3a");
    x.fillStyle = gr; x.fillRect(0, 0, 480, 270);
    x.globalAlpha = .08; x.fillStyle = "#fff";
    for (let yy = 0; yy < 270; yy += 4) x.fillRect(0, yy, 480, 1);
    x.globalAlpha = 1;
    // gold frame
    x.strokeStyle = "#c9a227"; x.lineWidth = 3; x.strokeRect(6, 6, 468, 258);
    x.strokeStyle = "rgba(201,162,39,.35)"; x.lineWidth = 1; x.strokeRect(11, 11, 458, 248);
    // header
    x.textAlign = "center"; x.fillStyle = "#c9a227";
    x.font = "bold 22px monospace"; x.fillText("TECHOPS HERO", 240, 44);
    x.fillStyle = "#8a86a8"; x.font = "11px monospace";
    x.fillText("AEROTECH MFG — BUILDING 7 · OFFICIAL RUN RECORD", 240, 62);
    x.fillStyle = "#3fd2ff"; x.font = "bold 13px monospace";
    const rank = (typeof RANKS !== "undefined" && RANKS[s.rank]) ? RANKS[s.rank].name : ("Rank " + (s.rank || 0));
    x.fillText(rank.toUpperCase(), 240, 92);
    // stats grid
    const ach = (meta.ach && Object.keys(meta.ach).length) || (meta.achievements && meta.achievements.length) || 0;
    const mas = (meta.mastery && Object.values(meta.mastery).filter(v => v >= 5).length) || 0;
    const rows = [
      ["DAYS SURVIVED", String(s.day || 1)],
      ["TICKETS CLOSED", (s.ticketsDone || 0) + " / " + (s.ticketsTotal || 0)],
      ["BUDGET EARNED", "$" + (s.budget || 0)],
      ["MASTERIES", String(mas)],
      ["TROPHIES", String(ach)],
      ["NG+ LEGEND", "x" + (s.ngPlus || 0)],
    ];
    x.font = "11px monospace";
    rows.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = 70 + col * 200, by = 118 + row * 34;
      x.textAlign = "left"; x.fillStyle = "#8a86a8"; x.fillText(r[0], bx, by);
      x.fillStyle = "#e8e6f0"; x.font = "bold 13px monospace"; x.fillText(r[1], bx, by + 16);
      x.font = "11px monospace";
    });
    // footer
    x.textAlign = "center"; x.fillStyle = "#5a5678"; x.font = "10px monospace";
    x.fillText("Every ticket is a dungeon. Every day is a run.", 240, 236);
    x.fillStyle = "#c9a227"; x.fillText("ninja-ops-guy.github.io/techops-hero", 240, 252);
    return c;
  }
  function exportRunCard() {
    try {
      const c = runCardCanvas();
      const a = document.createElement("a");
      a.download = "techops-hero-run-card.png";
      a.href = c.toDataURL("image/png");
      a.click();
      if (typeof toast === "function") toast("📤 RUN CARD EXPORTED — check your downloads", 2400);
    } catch (e) { console.warn("v713 run card", e); }
  }
  const eodEl = document.getElementById("eod");
  if (eodEl) {
    new MutationObserver(() => {
      if (eodEl.classList.contains("hidden")) return;
      if (document.getElementById("v713-runcard")) return;
      const btn = document.createElement("button");
      btn.id = "v713-runcard";
      btn.className = "big-btn";
      btn.style.cssText = "margin-top:10px;font-size:11px;padding:8px 18px;";
      btn.textContent = "📤 EXPORT RUN CARD";
      btn.onclick = exportRunCard;
      eodEl.appendChild(btn);
    }).observe(eodEl, { attributes: true, attributeFilter: ["class"] });
  }

  window.v713 = { objective: objective713, onwardOf, NEXT_OF_ROOM, variantCell, SKINS, HAIRS, OUTFITS, runCardCanvas, exportRunCard };
})();

// v6.8 "Guided Shift": toggleable path guides to tickets & the ride home, and
// enforced clock-out at 16:00 — the shift ends, you drive home. Plus the camera-space
// fix for Felicia's stuck overlays (applied in v64_hooks.js).
(function () {
  const V68_VER = "6.8.0";
  const CLOCK_OUT = 16 * 60;      // 16:00 — shift ends, head to the South Exit
  const HARD_EXIT = 16 * 60 + 59; // 16:59 — security walks you out

  // ================= settings: path guides toggle =================
  if (window.V67SET && V67SET.guides === undefined) { V67SET.guides = true; try { localStorage.setItem("techops_settings", JSON.stringify(V67SET)); } catch (e) { } }
  function injectGuideRow() {
    const card = document.querySelector("#v67-settings .v67-set-card");
    if (!card || $("v68s-guides")) return;
    const note = card.querySelector(".v67-note");
    const row = document.createElement("label");
    row.className = "v67-row";
    row.innerHTML = `<span>Path guides (tickets & way home)</span><input type="checkbox" id="v68s-guides">`;
    card.insertBefore(row, note);
    const el = row.querySelector("input");
    el.checked = V67SET.guides !== false;
    el.oninput = () => { V67SET.guides = el.checked; try { localStorage.setItem("techops_settings", JSON.stringify(V67SET)); } catch (e) { } };
  }
  const gearBtn = () => $("v67-gear");
  function armGear() {
    const g = gearBtn();
    if (g && !g._v68armed) { g._v68armed = true; const old = g.onclick; g.onclick = () => { old && old(); setTimeout(injectGuideRow, 0); }; }
  }
  armGear(); setTimeout(armGear, 500);

  // ================= pathfinding (BFS over walkable tiles) =================
  function bfs(sx, sy, tx, ty) {
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
  function guideTarget() {
    const s = S; if (!s || !s.npcs) return null;
    if (s.clock >= CLOCK_OUT && s._nightObjs && s._nightObjs.door) {
      return { x: s._nightObjs.door.x, y: s._nightObjs.door.y, color: "#39ff88", label: "🚪 WAY HOME", exit: true };
    }
    let best = null, bd = 1e9;
    for (const n of s.npcs) {
      if (n.ambient || n.done) continue;
      const d = Math.abs(n.x - s.px) + Math.abs(n.y - s.py);
      if (d < bd) { bd = d; best = n; }
    }
    if (best) return { x: best.x, y: best.y, color: "#4af", label: "🎫 " + (best.name || "ticket"), exit: false };
    if (s._nightObjs && s._nightObjs.door) return { x: s._nightObjs.door.x, y: s._nightObjs.door.y, color: "#39ff88", label: "🚪 SOUTH EXIT", exit: true };
    return null;
  }
  let _path = null, _pathAt = 0, _pathKey = "";
  function currentPath() {
    const s = S, tm = performance.now();
    const t = guideTarget();
    if (!t) return null;
    const px = Math.round(s.px), py = Math.round(s.py);
    const key = `${px},${py}->${t.x},${t.y}`;
    if (tm - _pathAt > 600 || key !== _pathKey) {
      _path = bfs(px, py, t.x, t.y);
      _pathAt = tm; _pathKey = key;
    }
    return _path ? { path: _path, target: t } : null;
  }
  window.v68Guide = currentPath;

  const __origDraw68 = draw;
  draw = function () {
    __origDraw68.apply(this, arguments);
    const s = S;
    if (!s || !s.map || s.nightMode || s.inBattle) return;
    if (!window.V67SET || V67SET.guides === false) return;
    const g = currentPath();
    if (!g || g.path.length < 2) return;
    const tm = performance.now();
    const ts = cv.height / 14, sc = ts / TILE;
    ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
    // breadcrumb chevrons every 2nd tile, flowing toward the destination
    const flow = Math.floor(tm / 300);
    for (let i = 1; i < g.path.length - 1; i += 2) {
      const [x, y] = g.path[i];
      const on = (i + flow) % 4 < 2;
      ctx.globalAlpha = on ? .85 : .35;
      ctx.fillStyle = g.target.color;
      ctx.beginPath();
      ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 3, 0, 7);
      ctx.fill();
    }
    // destination marker: pulsing ring + label
    const t = g.target;
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
    // distance readout
    ctx.fillStyle = "#000"; ctx.globalAlpha = .7;
    ctx.fillRect(t.x * TILE + TILE / 2 - 18, t.y * TILE - 27, 36, 10);
    ctx.globalAlpha = 1; ctx.fillStyle = "#fff";
    ctx.fillText((g.path.length - 1) + " tiles", t.x * TILE + TILE / 2, t.y * TILE - 19);
    ctx.restore();
  };

  // ================= clock-out enforcement =================
  // 16:00 — shift is over: directive + guides retarget the exit; grace to finish your ticket.
  // 16:59 — security walks you out; you drive home (night mode).
  // advanceClock is the single choke point for all in-game time passing.
  const __origAC68 = advanceClock;
  advanceClock = function (min) {
    const r = __origAC68(min);
    const s = S;
    if (s && !s.nightMode && !s.gameOver) {
      if (s.clock >= CLOCK_OUT && !s.meta._v68clockout) {
        s.meta._v68clockout = true;
        toast("🕓 <b>CLOCK OUT</b> — shift's over. Follow the <b style='color:#39ff88'>green guide</b> to the South Exit and drive home.", 5000);
        sfx("ticket");
      }
      if (s.clock >= HARD_EXIT && s._nightObjs && !s.inBattle && !s.inDialog && !s.meta._v68swept) {
        s.meta._v68swept = true;
        dlg("🚪 Security Sweep", "Security is walking the floor — Building 7 is closing. Your shift is done. Time to drive home.", [
          { t: "🌃 Head out", f: () => { closeDlg(); if (typeof enterNight === "function") enterNight(); } },
        ]);
      }
    }
    return r;
  };

  // backstop: if a single big time jump lands on the stock 17:00 force-end, redirect it
  // to the drive-home sweep instead of silently rolling tickets to the backlog
  const __origCDE68 = checkDayEnd;
  checkDayEnd = function (force) {
    const s = S;
    if (force && s && !s.nightMode && s._nightObjs && !s.meta._v68swept && s.clock >= CLOCK_OUT && s.ticketsDone < s.ticketsTotal) {
      s.meta._v68swept = true;
      dlg("🚪 Security Sweep", "Security is walking the floor — Building 7 is closing. Your shift is done. Time to drive home.", [
        { t: "🌃 Head out", f: () => { closeDlg(); if (typeof enterNight === "function") enterNight(); } },
      ]);
      return;
    }
    return __origCDE68(force);
  };

  // after 16:00 you can finish the ticket you're on, but the guides point home —
  // at 16:59 security sweeps, no exceptions.
  window.v68CLOCK_OUT = CLOCK_OUT; window.v68HARD_EXIT = HARD_EXIT;
  console.log(`[v6.8] Guided Shift loaded (${V68_VER})`);
})();
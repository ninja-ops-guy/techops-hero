// v7.35 "Portal Side-View Access" — glitch portals spawned by diagnoses are no
// longer stranded in the top-down world: they surface INSIDE the v6.9/v7.10
// side-view department rooms (palette-wash matched, positional-truth mapped)
// and on the night-mode streets (district-palette matched), so E → startBattle
// works wherever the player actually is. Wrap-only: game.js, v69, v710 and
// night_hooks are untouched.
(function () {
  if (window.v735) return; window.v735 = 1;

  // ---------- shared helpers ----------
  function portalsLive() {
    const s = S;
    if (!s || !s.portals || !s.portals.length) return [];
    return s.portals.filter(p => !p.cleared);
  }
  // portal → its broken device + owning npc + biome id (device position is
  // ground truth; fall back to the dept→biome table like v69/v710 do)
  function portalInfo(po) {
    const s = S;
    const npc = s.npcs.find(n => n.id === po.npc);
    if (!npc) return null;
    const dev = s.devices.find(d => d.npc === npc.id);
    let biomeId = null;
    if (dev && typeof biomeAt === "function") { const b = biomeAt(dev.x, dev.y); biomeId = b ? b.id : null; }
    if (!biomeId && typeof BIOME_OF_DEPT !== "undefined") biomeId = BIOME_OF_DEPT[npc.dept] || null;
    return { npc, dev, biomeId };
  }
  function canBattle(s) { return typeof startBattle === "function" && !s.inBattle && !s.inDialog && !s.gameOver; }

  // ============================================================
  // A) SIDE-VIEW ROOMS (day) — marker + E-to-enter
  // ============================================================
  // portals whose device/npc lives in the room's biome, with v7.10 room-x
  function roomPortals() {
    const s = S;
    if (!s || !s.room) return [];
    const out = [];
    for (const po of portalsLive()) {
      const info = portalInfo(po);
      if (!info || info.biomeId !== s.room.id) continue;
      let rx = null;
      if (info.dev && window.v710 && typeof v710.roomXof === "function") {
        rx = v710.roomXof({ x: info.dev.x }, s.room.id); // positional truth, west→left
      }
      if (rx === null) rx = .5; // device outside the biome rect (shouldn't happen)
      out.push({ portal: po, rx });
    }
    return out;
  }
  function nearRoomPortal() {
    const s = S;
    const list = roomPortals();
    let best = null, bd = 1e9;
    for (const r of list) { const d = Math.abs(r.rx - s.room.x); if (d < bd) { bd = d; best = r; } }
    return bd <= .06 ? best : null;
  }

  const __origInteract735 = interact;
  interact = function () {
    const s = S;
    if (s && s.room && canBattle(s)) {
      const hit = nearRoomPortal();
      if (hit) return startBattle(hit.portal); // core path (game.js:1182-1183); cleanup on win/flee is core's
    }
    return __origInteract735.apply(this, arguments);
  };

  // ============================================================
  // B) NIGHT MODE — district-matched street markers
  // ============================================================
  // office tower devices haunt downtown; factory-floor ones haunt the
  // industrial district. Everything else has no night analogue → skip (no-op).
  const NM_BIOME_TO_DISTRICT = {
    factory: "industrial",
    exec: "downtown", finance: "downtown", sales: "downtown",
    eng: "downtown", hr: "downtown", itdept: "downtown",
  };
  function nmPortalSpots() {
    const s = S;
    if (!s || !s.nightMode || typeof NM === "undefined" || !NM || NM.drive) return [];
    const out = [];
    for (const po of portalsLive()) {
      const info = portalInfo(po);
      if (!info || !info.dev) continue;
      const dist = NM_BIOME_TO_DISTRICT[info.biomeId];
      if (!dist || dist !== NM.district) continue; // no mapping for this street → skip
      const t = Math.max(0, Math.min(1, info.dev.x / (typeof MAPW !== "undefined" ? MAPW : 40)));
      const sx = 250 + t * (NM_W - 450); // world-x → street-x, clear of the Charger zone
      out.push({ portal: po, sx });
    }
    return out;
  }
  function nearNmPortal() {
    const spots = nmPortalSpots();
    if (!spots.length) return null;
    const px = NM.x + NM.w / 2;
    let best = null, bd = 1e9;
    for (const r of spots) { const d = Math.abs(r.sx - px); if (d < bd) { bd = d; best = r; } }
    return bd <= 60 ? best : null;
  }

  const __origInteract735b = interact;
  interact = function () {
    const s = S;
    if (s && s.nightMode && typeof NM !== "undefined" && NM && !NM.drive && canBattle(s)) {
      const hit = nearNmPortal();
      if (hit) return startBattle(hit.portal);
    }
    return __origInteract735b.apply(this, arguments);
  };

  // ============================================================
  // C) RENDERING — one draw wrap covers room mode and night mode,
  //    always AFTER the previous draw so markers sit on top of the
  //    room bg / street (and palette-matched to it, never raw #a6f).
  // ============================================================
  const __origDraw735 = draw;
  draw = function () {
    const r = __origDraw735.apply(this, arguments);
    try {
      const s = S;
      if (!s) return r;
      const now = performance.now();
      const W = cv.width, H = cv.height;
      // ---- room marker: tinted with the v7.10 palette wash of THIS room ----
      if (s.room) {
        const list = roomPortals();
        if (list.length) {
          const p = (window.v710 && typeof v710.palOf === "function") ? v710.palOf(s.room.id)
            : { f1: "#2e3442", f2: "#282e3a", line: "#8fa0c8" };
          const floorY = Math.round(H * .82);
          for (const m of list) {
            const x = m.rx * W;
            const pulse = .6 + Math.sin(now / 280 + x) * .25;
            ctx.save();
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            // backdrop tint disc: multiply wash (same composite as the room bg)
            ctx.globalCompositeOperation = "multiply";
            ctx.globalAlpha = .30;
            ctx.fillStyle = p.f1;
            ctx.beginPath(); ctx.arc(x, floorY - 34, 34, 0, 7); ctx.fill();
            ctx.restore();
            ctx.save();
            // swirl ring in the biome accent line color
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = p.line; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(x, floorY - 34, 16 + Math.sin(now / 300) * 3, 0, 7); ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.font = "26px serif";
            ctx.fillText("🌀", x, floorY - 34);
            if (Math.abs(s.room.x - m.rx) <= .06 && !s.inDialog) {
              ctx.font = "bold 10px monospace"; ctx.fillStyle = p.line;
              ctx.fillText("E — enter portal", x, floorY - 64);
            }
            ctx.restore();
          }
        }
        return r;
      }
      // ---- night marker: district accent, wet-street glow ----
      if (s.nightMode && typeof NM !== "undefined" && NM && !NM.drive && typeof NM_DISTRICTS !== "undefined") {
        const spots = nmPortalSpots();
        if (spots.length) {
          const D = NM_DISTRICTS[NM.district] || { accent: "#8fa0c8" };
          for (const m of spots) {
            const x = m.sx - NM.cam;
            if (x < -60 || x > W + 60) continue;
            const y = NM_FLOOR;
            const pulse = .55 + Math.sin(now / 260 + m.sx) * .3;
            ctx.save();
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            // glow pool on the asphalt in the district accent
            const g = ctx.createRadialGradient(x, y - 8, 4, x, y - 8, 60);
            g.addColorStop(0, D.accent + "44"); g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.ellipse(x, y - 6, 60, 18, 0, 0, 7); ctx.fill();
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = D.accent; ctx.lineWidth = 3;
            ctx.shadowColor = D.accent; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(x, y - 34, 15 + Math.sin(now / 300) * 3, 0, 7); ctx.stroke();
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            ctx.font = "26px serif";
            ctx.fillText("🌀", x, y - 34);
            if (Math.abs(NM.x + NM.w / 2 - m.sx) <= 60 && !s.inDialog) {
              ctx.font = "bold 11px monospace"; ctx.fillStyle = D.accent;
              ctx.fillText("Ⓔ ENTER PORTAL", x, y - 64);
            }
            ctx.restore();
          }
        }
      }
    } catch (e) { }
    return r;
  };

  try { S && S.meta && (S.meta._v735portalSide = true); } catch (e) { }
  console.log("[v7.35] portal side-view access loaded");
})();

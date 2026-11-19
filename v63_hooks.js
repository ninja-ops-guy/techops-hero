/* ============================================================
   TECHOPS HERO v6.3 — "Motion & Scenery" (v63_hooks.js)
   Loads AFTER v62_hooks.js. Adds:
   • Transitional scenes — day cards, night-crawl title card,
     battle glitch-wipe, end-of-day fade: the game moves
   • Smooth walking — the player glides between tiles instead
     of snapping (positional interpolation)
   • 40 scenic map props (AI-generated sheets, v63_props.js)
   ============================================================ */
"use strict";

// ---------- 1. transitional scenes ----------
(function () {
  const wrap = document.getElementById("game-wrap");
  // full-screen wipe overlay
  const wipe = document.createElement("div");
  wipe.id = "v63-wipe";
  wipe.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:55;opacity:0;background:#050510;transition:opacity .28s ease";
  wrap.appendChild(wipe);
  // glitch flash overlay
  const glitch = document.createElement("div");
  glitch.id = "v63-glitch";
  glitch.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:56;opacity:0;background:repeating-linear-gradient(0deg,#f4a 0 2px,#4af 2px 4px,#0000 4px 7px);mix-blend-mode:screen";
  wrap.appendChild(glitch);
  // scene title card
  const card = document.createElement("div");
  card.id = "v63-card";
  card.style.cssText = "position:absolute;top:34%;left:50%;transform:translate(-50%,-50%) scale(.9);z-index:57;pointer-events:none;text-align:center;opacity:0;transition:opacity .3s ease,transform .3s ease";
  wrap.appendChild(card);

  window.v63Wipe = function (color) {
    wipe.style.background = color || "#050510";
    wipe.style.opacity = ".92";
    setTimeout(() => { wipe.style.opacity = "0"; }, 300);
  };
  window.v63Glitch = function () {
    glitch.style.transition = "none"; glitch.style.opacity = ".55";
    setTimeout(() => { glitch.style.opacity = ".2"; }, 90);
    setTimeout(() => { glitch.style.opacity = ".45"; }, 160);
    setTimeout(() => { glitch.style.transition = "opacity .3s ease"; glitch.style.opacity = "0"; }, 260);
  };
  window.v63Card = function (title, sub, color) {
    card.innerHTML = `<div style="font-family:'Press Start 2P',monospace;font-size:18px;color:${color || "#ffd24a"};text-shadow:0 0 18px ${color || "#ffd24a"}88,2px 2px #000">${title}</div>` +
      (sub ? `<div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#9fb7d9;margin-top:10px;text-shadow:1px 1px #000">${sub}</div>` : "");
    card.style.opacity = "1"; card.style.transform = "translate(-50%,-50%) scale(1)";
    // While the arrival card holds the screen, body-level HUD cards step aside.
    if (document.body) document.body.classList.add("arrival-card-on");
    clearTimeout(window._v63CardT);
    window._v63CardT = setTimeout(() => {
      card.style.opacity = "0"; card.style.transform = "translate(-50%,-50%) scale(.9)";
      if (document.body) document.body.classList.remove("arrival-card-on");
    }, 1500);
  };
})();

// morning card on each new day
const __origSetupDayV63 = setupDay;
setupDay = function () {
  __origSetupDayV63();
  const s = S; if (!s) return;
  const wd = (typeof weekday === "function") ? weekday().toUpperCase() : "";
  v63Card(`DAY ${s.day}`, wd ? `${wd} · SHIFT 09:00` : "SHIFT 09:00", "#ffd24a");
};
// night-crawl title card + wipe
const __origEnterNightV63 = enterNight;
enterNight = function () {
  v63Wipe("#05051a");
  v63Card("🌃 NIGHT CRAWL", "NEW HAVEN STREETS — clear them, then head home", "#7fd4ff");
  __origEnterNightV63();
};
// battle entry: glitch flash + incident card
const __origStartBattleV63 = startBattle;
startBattle = function (portal) {
  v63Glitch();
  __origStartBattleV63(portal);
  if (B && B.t) v63Card(B.boss ? `🚨 «${B.npc.codename || "CRITICAL"}»` : `⚠️ INCIDENT`, `${B.t.enemy} — ${B.t.world}`, B.boss ? "#ff6b6b" : "#c9a227");
};
// battle end + night exit + EOD: soft wipes
const __origWinBattleV63 = winBattle;
winBattle = function () { v63Wipe("#0a1a0f"); __origWinBattleV63(); };
const __origLoseBattleV63 = loseBattle;
loseBattle = function () { v63Wipe("#1a0505"); __origLoseBattleV63(); };
const __origExitNightV63 = exitNight;
exitNight = function (homeSafe) { v63Wipe("#050510"); __origExitNightV63(homeSafe); };

// ---------- 2. smooth walking ----------
// tiles snap once per move tick; glide the sprite across the gap instead
const v63Move = { x0: 0, y0: 0, t0: 0, dur: 140, px: -1, py: -1, cadence: 140 };
const __origDrawPlayerV63 = drawPlayer;
drawPlayer = function (s, tm) {
  const now = performance.now();
  if (s.px !== v63Move.px || s.py !== v63Move.py) {
    if (v63Move.px >= 0 && s.moving) {
      const dtMs = now - v63Move.t0;
      v63Move.cadence = Math.min(300, Math.max(70, dtMs));
      v63Move.x0 = v63Move.px; v63Move.y0 = v63Move.py; v63Move.t0 = now;
    }
    v63Move.px = s.px; v63Move.py = s.py;
  }
  if (s.moving && v63Move.t0 && now - v63Move.t0 < v63Move.cadence) {
    const k = (now - v63Move.t0) / v63Move.cadence;
    const ease = 1 - (1 - k) * (1 - k); // ease-out
    const rx = v63Move.x0 + (s.px - v63Move.x0) * ease;
    const ry = v63Move.y0 + (s.py - v63Move.y0) * ease;
    const ox = s.px, oy = s.py;
    s.px = rx; s.py = ry;
    try { __origDrawPlayerV63(s, tm); } finally { s.px = ox; s.py = oy; }
    return;
  }
  __origDrawPlayerV63(s, tm);
};

console.log("%c[TechOps Hero] v6.3 Motion & Scenery loaded — transitions, smooth walking, 40 props.", "color:#f472b6");

// ---------- 3. scenic map props (40, AI-generated atlas) ----------
const V63_PROPS = [
  // office set (0–19): [atlasIdx, x, y]
  [0, 30, 3], [1, 32, 3], [2, 16, 15], [3, 25, 16], [4, 35, 3], [5, 3, 2], [6, 12, 2], [7, 22, 3],
  [8, 6, 10], [9, 31, 5], [10, 28, 1], [11, 14, 2], [12, 34, 6], [13, 24, 16], [14, 18, 16], [15, 5, 2],
  [16, 8, 11], [17, 38, 8], [18, 23, 10], [19, 36, 5],
  // factory set (20–39)
  [20, 4, 17], [21, 7, 18], [22, 12, 24], [23, 16, 28], [24, 20, 25], [25, 24, 29], [26, 28, 23], [27, 32, 27],
  [28, 36, 24], [29, 2, 22], [30, 22, 22], [31, 40, 20], [32, 34, 30], [33, 8, 26], [34, 14, 30], [35, 18, 23],
  [36, 26, 21], [37, 38, 28], [38, 10, 30], [39, 30, 30],
];
const V63_ANIM = { 0: "pulse", 39: "pulse", 26: "sway" };
const propsImg = new Image();
if (typeof TO_PROPS_ATLAS === "string") propsImg.src = TO_PROPS_ATLAS;
let v63PropLayout;
function v63PropSpots(s) {
  const dayStations = s.meta.dayStations;
  const contacts = s.meta.campaignAct1Native;
  if (v63PropLayout?.map === s.map && v63PropLayout.dayStations === dayStations && v63PropLayout.contacts === contacts) return v63PropLayout.spots;
  const occupied = new Set();
  const reserve = (x, y) => occupied.add(y * MAPW + x);
  if (Array.isArray(dayStations?.items)) {
    for (const station of dayStations.items) {
      if (!station?.available) continue;
      reserve(station.x, station.y);
      if (station.approach) reserve(station.approach.x, station.approach.y);
    }
  }
  for (const contact of Object.values(contacts || {})) if (contact) reserve(contact.x, contact.y);
  const openAt = (x, y) => s.map[y]?.[x] === 0 && !occupied.has(y * MAPW + x);
  const saved = s.meta._v63SpotsDay === s.day && Array.isArray(s.meta._v63Spots) ? s.meta._v63Spots : [];
  const spots = [];
  for (const [idx, px, py] of V63_PROPS) {
    let spot = saved.find(item => item[0] === idx && openAt(item[1], item[2]));
    if (!spot) {
      let bestDistance = Infinity;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = px + dx, y = py + dy, distance = dx * dx + dy * dy;
        if (distance < bestDistance && openAt(x, y)) { bestDistance = distance; spot = [idx, x, y]; }
      }
    }
    if (spot) { spots.push(spot); reserve(spot[1], spot[2]); }
  }
  s.meta._v63Spots = spots;
  s.meta._v63SpotsDay = s.day;
  v63PropLayout = { map: s.map, dayStations, contacts, spots };
  return spots;
}
function drawScenery(s, tm, x0, x1, y0, y1) {
  if (!propsImg.width) return;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const [idx, x, y] of v63PropSpots(s)) {
    if (x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 1) continue;
    const cx = idx % 8, cy = Math.floor(idx / 8);
    const size = 40;
    let X = x * TILE + (TILE - size) / 2;
    const Y = y * TILE + TILE - size + 2;
    const anim = V63_ANIM[idx];
    if (anim === "pulse") ctx.globalAlpha = .8 + .2 * Math.sin(tm / 300 + idx);
    else if (anim === "sway") X += Math.round(Math.sin(tm / 700) * 2);
    ctx.drawImage(propsImg, cx * 80, cy * 80, 80, 80, X, Y, size, size);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
window.v63 = { v63PropSpots, drawScenery, PROPS: V63_PROPS }; // v7.20: prop inspection reuses the resolved spots

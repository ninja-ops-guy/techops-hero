// v4.2 sprite detail — action poses, NPC emote bubbles, equipment sprites.
// Loads AFTER game.js and hooks in without modifying it:
//  - redefines drawPlayer() with pose priority (party > pose > thumbs > laptop > walk > idle)
//  - wraps draw() with an overlay for mugs, server-room hardware, and NPC emote bubbles
//  - watches game state to trigger action poses (no changes to game logic required)

// extra poses/emotes/equipment from the character sheet
const extraImg = new Image();
if (typeof PLAYER_EXTRA !== "undefined") extraImg.src = PLAYER_EXTRA.src;

function drawExtra(key, tx, ty, size = 26) {
  if (typeof PLAYER_EXTRA === "undefined" || !PLAYER_EXTRA.frames[key]) return;
  const [cx, cy] = PLAYER_EXTRA.frames[key], C = PLAYER_EXTRA.cell;
  ctx.drawImage(extraImg, cx * C, cy * C, C, C, tx * TILE + (TILE - size) / 2, ty * TILE - size + 8, size, size);
}

function setPose(pose, ms) {
  if (!S) return;
  S.pose = pose; S.poseUntil = performance.now() + ms;
}

// --- drawPlayer with extra-atlas pose priority (replaces the stock one) ---
drawPlayer = function (s, tm) {
  const fx = s.fx || "down";
  const now = performance.now();
  let key;
  if (s.partyUntil && now < s.partyUntil) key = "party";
  else if (s.poseUntil && now < s.poseUntil && s.pose) key = s.pose;
  else if (s.thumbsUntil && now < s.thumbsUntil) key = "thumbs";
  else if (s.inDialog) key = "laptop";
  else if (s.moving) key = `${fx}${1 + Math.floor(tm / 160) % 2}`;
  else key = `${fx}0`;
  const dw = 46, dh = 46;
  const bob = s.moving ? Math.sin(tm / 90) * 1.5 : 0;
  const dx = s.px * TILE + (TILE - dw) / 2, dy = s.py * TILE + TILE - dh + 3 + bob;
  ctx.save();
  // extra-atlas poses (character sheet) take precedence when available
  if (typeof PLAYER_EXTRA !== "undefined" && PLAYER_EXTRA.frames[key]) {
    const [cx, cy] = PLAYER_EXTRA.frames[key], C = PLAYER_EXTRA.cell;
    if (fx === "left") { ctx.translate(dx + dw, 0); ctx.scale(-1, 1); ctx.drawImage(extraImg, cx * C, cy * C, C, C, 0, dy, dw, dh); }
    else ctx.drawImage(extraImg, cx * C, cy * C, C, C, dx, dy, dw, dh);
    ctx.restore();
    const ride2 = s.lab.includes("tugger") ? "🛺" : s.lab.includes("skate") ? "🛹" : null;
    if (ride2) { ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ride2, dx + dw / 2, dy + dh - 2); }
    return;
  }
  if (!(key in PLAYER_ATLAS.frames)) key = "down0";
  const [cx, cy] = PLAYER_ATLAS.frames[key];
  const C = PLAYER_ATLAS.cell;
  if (fx === "left") {
    ctx.translate(dx + dw, 0); ctx.scale(-1, 1);
    ctx.drawImage(playerImg, cx * C, cy * C, C, C, 0, dy, dw, dh);
  } else {
    ctx.drawImage(playerImg, cx * C, cy * C, C, C, dx, dy, dw, dh);
  }
  ctx.restore();
  // rideable drawn under the player
  const ride = s.lab.includes("tugger") ? "🛺" : s.lab.includes("skate") ? "🛹" : null;
  if (ride) {
    ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ride, dx + dw / 2, dy + dh - 2);
  }
};

// --- overlay: coffee mugs, server-room hardware, NPC emote bubbles ---
// v4.2: repaint base tiles first so the stock emoji (☕ 🎫 ✅ 🚨 ⚠️) don't double-render
// under the sprite versions — drawTile()/drawSpr() are global, so we can rebuild each tile.
const __origDrawV41 = draw;
const AMBIENT_BUBBLES = ["dots", "bq", "heart", "lol", "cool"];
draw = function () {
  __origDrawV41.apply(this, arguments);
  const s = S; if (!s || !s.map) return;
  const tm = performance.now();
  const ts = cv.height / 14, sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  const repaint = (x, y) => drawTile((s.map[y] && s.map[y][x]) || 0, x, y, tm);
  // coffee machines — the sacred HELP DESK FUEL mug (repaint tile to hide ☕)
  for (const c of s.coffeeMachines) {
    repaint(c.x, c.y);
    ctx.globalAlpha = c.used ? .35 : 1; drawExtra("mug", c.x, c.y, 26); ctx.globalAlpha = 1;
  }
  // server room hardware detail
  drawExtra("router", SRV.x0 + 2, SRV.y0 + 1, 26);
  drawExtra("server", SRV.x1 - 2, SRV.y0 + 1, 26);
  // broken devices — wrench marker (repaint tile to hide ⚠️)
  for (const d of s.devices) {
    if (d.fixed) continue;
    repaint(d.x, d.y);
    ctx.font = "24px serif"; ctx.fillText(d.type.icon, d.x * TILE + 16, d.y * TILE + 17);
    drawExtra("wrench", d.x, d.y, 18);
  }
  // NPC emote bubbles (repaint tile to hide 🎫 ✅ 🚨)
  for (const n of s.npcs) {
    repaint(n.x, n.y);
    drawSpr(SPR_NPC, DEPT_PAL[n.dept] || PAL_NPCS[n.pv ?? 0], n.x, n.y);
    if (!n.ambient && !n.done) drawExtra(n.critical || n.legacy ? "warn" : "bex", n.x, n.y, 18);
    else if (!n.ambient && n.done) drawExtra("check", n.x, n.y, 16);
    else if (n.ambient && ((n.id + Math.floor(tm / 2600)) % 5 === 0)) drawExtra(AMBIENT_BUBBLES[(n.id + Math.floor(tm / 2600)) % AMBIENT_BUBBLES.length], n.x, n.y, 16);
  }
  ctx.restore();
};

// --- pose triggers via lightweight state watching ---
let __pv41 = null;
setInterval(() => {
  const s = S; if (!s || !s.map) { __pv41 = null; return; }
  const cur = {
    coffee: s.coffeeMachines.filter(c => c.used).length,
    intv: s.npcs.filter(n => n.interviewed).length,
    fixed: s.devices.filter(d => d.fixed).length,
    solved: s.npcs.filter(n => n.done && (n.incidentDeclared || n.legacy)).length,
    mig: (s.meta.legacyChoices || []).length,
    hp: s.hp,
    party: s.partyUntil || 0,
  };
  if (__pv41) {
    if (cur.hp <= __pv41.hp - 15) setPose("hurt", 1800);
    else if (cur.party > __pv41.party) setPose("powerup", 1800);
    else if (cur.coffee > __pv41.coffee) setPose("coffee", 1500);
    else if (cur.intv > __pv41.intv) setPose("helpdesk", 1400);
    else if (cur.fixed > __pv41.fixed) setPose("fixit", 1500);
    else if (cur.solved > __pv41.solved) setPose("solved", 2000);
    else if (cur.mig > __pv41.mig) setPose("victory", 1800);
  }
  __pv41 = cur;
}, 150);

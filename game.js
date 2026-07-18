/* ============================================================
   TECHOPS HERO v2.0 — roguelite IT RPG (single-file web app)
   ============================================================ */
"use strict";

// ---------- helpers ----------
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);

// ---------- constants ----------
const TILE = 32, MAPW = 42, MAPH = 32;
const DEPTS = ["Manufacturing", "Finance", "Engineering", "Executives", "HR", "Sales"];
const RANKS = [
  { name: "Help Desk Technician", xp: 0 },
  { name: "Senior Technician", xp: 120 },
  { name: "Site Administrator", xp: 300 },
  { name: "Systems Administrator", xp: 550 },
  { name: "Infrastructure Engineer", xp: 900 },
  { name: "Security Engineer", xp: 1350 },
  { name: "Security Architect", xp: 1900 },
  { name: "CIO", xp: 2600 },
];
const CERTS = [
  { id: "aplus", name: "A+", cost: 150, desc: "+15% repair success, unlocks 'Hardware Swap' ability", stat: "hardware" },
  { id: "netplus", name: "Network+", cost: 250, desc: "Unlocks 'Traceroute' (reveals enemy weakness)", stat: "networking" },
  { id: "secplus", name: "Security+", cost: 350, desc: "Unlocks 'Containment' (blocks enemy attack 1 turn)", stat: "security" },
  { id: "linux", name: "Linux+", cost: 350, desc: "Unlocks 'sudo' (big damage, high stress)", stat: "linux" },
  { id: "ccna", name: "CCNA", cost: 600, desc: "Unlocks 'ACL Strike' (piercing packet attack)", stat: "networking" },
  { id: "cloud", name: "Cloud Admin", cost: 600, desc: "Unlocks 'Auto-Scale' (regen HP each battle turn)", stat: "cloud" },
  { id: "auto", name: "Automation Mastery", cost: 800, desc: "Unlocks 'PowerShell Sweep' (auto-resolve 1 ticket/day)", stat: "automation" },
];
const CHAOS = [
  { id: "patch", name: "⚙️ PATCH TUESDAY", desc: "More tickets, +50% XP" },
  { id: "ceo", name: "👔 CEO VISIT", desc: "Executive tickets worth double rep" },
  { id: "outage", name: "🌐 ISP OUTAGE", desc: "Network enemies +30% HP, better loot" },
  { id: "audit", name: "📋 AUDIT WEEK", desc: "Documentation grants bonus budget" },
  { id: "heat", name: "🔥 HEAT WAVE", desc: "Stress builds faster, coffee plentiful" },
  { id: "drill", name: "🛡️ RANSOMWARE DRILL", desc: "Security enemies appear, big rewards" },
  { id: "calm", name: "😌 QUIET DAY", desc: "Fewer tickets, stress recovery doubled" },
];
const TICKET_TYPES = [
  { id: "printer", label: "Printer Offline", icon: "🖨️", enemy: "Printer Goblin", eicon: "👺", world: "Paper Dimension", wbg: "#3a2e18", diag: ["Restart the print spooler", "Blame the user", "Buy a new printer"], correct: 0, stat: "hardware" },
  { id: "vpn", label: "VPN Won't Connect", icon: "🚇", enemy: "VPN Ghost", eicon: "👻", world: "Tunnel Caverns", wbg: "#14202e", diag: ["Check tunnel certs & gateway", "Reinstall Windows", "Yell at the ISP"], correct: 0, stat: "networking" },
  { id: "dns", label: "Internet 'Broken'", icon: "📖", enemy: "DNS Hydra", eicon: "🐍", world: "Labyrinth of Names", wbg: "#1e1430", diag: ["Trace the bad DNS record", "Factory reset the router", "Sacrifice a keyboard"], correct: 0, stat: "networking" },
  { id: "ad", label: "Account Locked Out", icon: "⛪", enemy: "AD Lich", eicon: "💀", world: "Identity Cathedral", wbg: "#241a2e", diag: ["Review lockout events in AD", "Delete the user", "Wait until tomorrow"], correct: 0, stat: "windows" },
  { id: "malware", label: "Suspicious Pop-ups", icon: "☣️", enemy: "Malware Swarm", eicon: "🦠", world: "Corrupted Network", wbg: "#2e1414", diag: ["Isolate host, then scan", "Click the pop-up", "Format everything"], correct: 0, stat: "security" },
  { id: "email", label: "Email Not Syncing", icon: "📬", enemy: "Email Phantom", eicon: "🕊️", world: "Mail Kingdom", wbg: "#142428", diag: ["Check Exchange queue & creds", "Send a test fax", "Blame Outlook"], correct: 0, stat: "windows" },
  { id: "bsod", label: "Blue Screen Crash", icon: "💙", enemy: "Blue Screen Titan", eicon: "🗿", world: "Kernel Forest", wbg: "#101c34", diag: ["Analyze the dump file", "Hit it harder", "Blame cosmic rays"], correct: 0, stat: "hardware" },
  { id: "plc", label: "PLC Offline (Factory)", icon: "🏭", enemy: "Rust Golem", eicon: "🤖", world: "Motherboard Desert", wbg: "#2e2410", diag: ["Check the VLAN segment", "Pour water on it", "Kick the conveyor"], correct: 0, stat: "networking" },
];
const ABILITIES = [
  { id: "ping", name: "Ping", icon: "📡", dmg: [8, 14], stress: 0, desc: "Reliable packet poke" },
  { id: "ps", name: "PowerShell", icon: "💠", dmg: [12, 20], stress: 8, desc: "Scripted strike" },
  { id: "flush", name: "Flush DNS", icon: "🌀", dmg: [10, 16], stress: 6, desc: "Clears corruption, heals 5 HP", heal: 5 },
  { id: "patch", name: "Patch Deploy", icon: "🩹", dmg: [6, 10], stress: 5, desc: "Heals you for 12 HP", heal: 12 },
  { id: "fw", name: "Firewall Rule", icon: "🧱", dmg: [4, 8], stress: 7, desc: "Halves next enemy hit", shield: true },
  { id: "coffee", name: "Chug Coffee", icon: "☕", dmg: [0, 0], stress: -25, desc: "Restores 25 stress", usable: "calm" },
];
const CERT_ABILITIES = {
  aplus: { id: "swap", name: "Hardware Swap", icon: "🔧", dmg: [18, 26], stress: 10 },
  netplus: { id: "tracert", name: "Traceroute", icon: "🛰️", dmg: [10, 14], stress: 6, weaken: true },
  secplus: { id: "contain", name: "Containment", icon: "🔒", dmg: [5, 8], stress: 9, stun: true },
  linux: { id: "sudo", name: "sudo rm -rf /bug", icon: "🐧", dmg: [24, 36], stress: 18 },
  ccna: { id: "acl", name: "ACL Strike", icon: "⚡", dmg: [20, 30], stress: 12 },
  cloud: { id: "scale", name: "Auto-Scale", icon: "☁️", dmg: [8, 12], stress: 6, regen: true },
};
const LOOT_TABLE = [
  { name: "USB Drive", icon: "💾", rarity: "common", stat: "hardware", val: 2 },
  { name: "Cat6 Cable", icon: "🔌", rarity: "common", stat: "networking", val: 2 },
  { name: "RAM Stick", icon: "🟩", rarity: "common", stat: "hardware", val: 3 },
  { name: "Golden Ethernet", icon: "🌟", rarity: "rare", stat: "networking", val: 6 },
  { name: "Fiber Blade", icon: "🗡️", rarity: "rare", stat: "networking", val: 7 },
  { name: "Keyboard of Debugging", icon: "⌨️", rarity: "rare", stat: "programming", val: 6 },
  { name: "Admin Badge", icon: "🪪", rarity: "epic", stat: "security", val: 10 },
  { name: "Quantum Laptop", icon: "💻", rarity: "epic", stat: "cloud", val: 10 },
  { name: "Master Keycard", icon: "🗝️", rarity: "epic", stat: "security", val: 12 },
  { name: "Domain Admin Crown", icon: "👑", rarity: "legendary", stat: "windows", val: 16 },
  { name: "Infinite Coffee Mug", icon: "☕", rarity: "legendary", stat: "stress", val: 20 },
  { name: "Enterprise Laptop", icon: "🖥️", rarity: "legendary", stat: "hardware", val: 15 },
];
const NPC_NAMES = ["Dana", "Marcus", "Priya", "Tom", "Yuki", "Carlos", "Wanda", "Earl", "Nadia", "Greg", "Sue", "Vikram", "Betty", "Hank", "Lena", "Otis"];
const LORE = ["📀 Old floppy: 'backup_final_v2_REAL.bak — do not delete'", "📓 Admin journal: 'The root account... it changes its own password now.'", "🗄️ Forgotten server: it's been up 3,412 days. Nobody knows what it does.", "📼 VHS tape: 'ORIENTATION 1987 — the building's network predates the building.'", "🖥️ Terminal: a lone process named 'palan0' has been running since boot..."];

// ---------- state ----------
let S = null;
function newState() {
  return {
    day: 1, clock: 9 * 60, xp: 0, budget: 80, stress: 10,
    hp: 40, maxHp: 40,
    certs: [], inv: [], journal: [],
    stats: { networking: 1, windows: 1, linux: 0, cloud: 0, security: 1, programming: 0, hardware: 1, automation: 0 },
    soft: { communication: 1, patience: 1, documentation: 0 },
    rep: Object.fromEntries(DEPTS.map(d => [d, 1])),
    tickets: [], ticketsDone: 0, ticketsTotal: 0, lootToday: 0,
    chaos: null, promoted: false, autoUsed: false,
    px: 0, py: 0, dir: 1, moving: false,
    npcs: [], portals: [], devices: [], loreSpots: [], coffeeMachines: [],
    map: null, inDialog: false, inBattle: false, gameOver: false, won: false,
  };
}
const save = () => { try { localStorage.setItem("techops_save", JSON.stringify({ day: S.day, clock: S.clock, xp: S.xp, budget: S.budget, stress: S.stress, hp: S.hp, maxHp: S.maxHp, certs: S.certs, inv: S.inv, journal: S.journal, stats: S.stats, soft: S.soft, rep: S.rep })); } catch (e) { } };
const load = () => { try { const d = JSON.parse(localStorage.getItem("techops_save")); return d; } catch (e) { return null; } };
const rank = () => { let r = RANKS[0]; for (const k of RANKS) if (S.xp >= k.xp) r = k; return r; };
const statBonus = st => S.stats[st] * 2 + S.inv.reduce((a, l) => a + (l.stat === st ? l.val : 0), 0);
const coffeeMug = () => S.inv.some(l => l.stat === "stress");

// ---------- map generation ----------
function genMap() {
  const m = [];
  for (let y = 0; y < MAPH; y++) { m.push([]); for (let x = 0; x < MAPW; x++) m[y].push(0); }
  // outer walls
  for (let x = 0; x < MAPW; x++) { m[0][x] = 1; m[MAPH - 1][x] = 1; }
  for (let y = 0; y < MAPH; y++) { m[y][0] = 1; m[y][MAPW - 1] = 1; }
  // room partitions (random pillars & walls)
  const wallLines = R(4, 7);
  for (let i = 0; i < wallLines; i++) {
    const horiz = Math.random() < .5;
    const pos = R(4, (horiz ? MAPH : MAPW) - 5);
    const from = R(2, 6), len = R(8, 18);
    const door = R(from, from + len - 1);
    for (let j = from; j < from + len; j++) {
      if (j === door || j === door + 1) continue;
      const x = horiz ? j : pos, y = horiz ? pos : j;
      if (x > 0 && x < MAPW - 1 && y > 0 && y < MAPH - 1) m[y][x] = 1;
    }
  }
  // scatter furniture (2 = desk, 3 = server rack, 4 = plant)
  for (let i = 0; i < 90; i++) {
    const x = R(2, MAPW - 3), y = R(2, MAPH - 3);
    if (m[y][x] === 0) m[y][x] = pick([2, 2, 2, 3, 3, 4]);
  }
  return m;
}
function freeSpot(m, nearX, nearY) {
  for (let tries = 0; tries < 200; tries++) {
    const x = nearX !== undefined ? clamp(nearX + R(-4, 4), 1, MAPW - 2) : R(1, MAPW - 2);
    const y = nearY !== undefined ? clamp(nearY + R(-4, 4), 1, MAPH - 2) : R(1, MAPH - 2);
    if (m[y] && m[y][x] === 0) return { x, y };
  }
  return { x: 1, y: 1 };
}

// ---------- day setup ----------
function setupDay() {
  const s = S;
  s.map = genMap();
  const start = freeSpot(s.map, MAPW >> 1, MAPH >> 1);
  s.px = start.x; s.py = start.y;
  s.npcs = []; s.portals = []; s.devices = []; s.loreSpots = []; s.coffeeMachines = [];
  s.tickets = []; s.ticketsDone = 0; s.lootToday = 0; s.autoUsed = false; s.hp = s.maxHp;
  s.clock = 9 * 60;

  // chaos event
  s.chaos = Math.random() < .75 ? pick(CHAOS) : null;

  // ticket count
  let n = R(4, 6);
  if (s.chaos?.id === "patch") n += 2;
  if (s.chaos?.id === "calm") n -= 2;
  n = clamp(n, 2, 8);
  s.ticketsTotal = n;

  // spawn NPCs with tickets
  for (let i = 0; i < n; i++) {
    let type = pick(TICKET_TYPES);
    if (s.chaos?.id === "drill") type = TICKET_TYPES.find(t => t.id === "malware");
    if (s.chaos?.id === "outage" && Math.random() < .5) type = pick(TICKET_TYPES.filter(t => t.stat === "networking"));
    const dept = pick(DEPTS);
    const pos = freeSpot(s.map);
    const npc = {
      id: i, name: pick(NPC_NAMES), dept, type,
      x: pos.x, y: pos.y, face: "🧑‍💼",
      done: false, interviewed: false, diagnosed: false, correctDiag: false,
      critical: Math.random() < .12,
    };
    s.npcs.push(npc); s.tickets.push(npc);
    // a broken device + portal appear near the NPC after diagnosis
  }
  // ambient NPCs
  for (let i = 0; i < R(3, 6); i++) {
    const pos = freeSpot(s.map);
    s.npcs.push({ id: 100 + i, name: pick(NPC_NAMES), dept: pick(DEPTS), x: pos.x, y: pos.y, face: "🧍", ambient: true });
  }
  // lore spots
  for (let i = 0; i < R(2, 4); i++) { const p = freeSpot(s.map); s.loreSpots.push({ x: p.x, y: p.y, text: pick(LORE), found: false }); }
  // coffee machines
  const nc = s.chaos?.id === "heat" ? 4 : 2;
  for (let i = 0; i < nc; i++) { const p = freeSpot(s.map); s.coffeeMachines.push({ x: p.x, y: p.y, used: false }); }

  toast(s.chaos ? `DAY ${s.day} — ${s.chaos.name}<br><small>${s.chaos.desc}</small>` : `DAY ${s.day} begins`);
  updateHUD();
  save();
}

// ---------- rendering ----------
const cv = $("game"), ctx = cv.getContext("2d");
let camX = 0, camY = 0;
function resize() {
  const ar = innerWidth / innerHeight;
  cv.height = Math.min(720, innerHeight);
  cv.width = Math.round(cv.height * ar);
  if (cv.width > innerWidth) { cv.width = innerWidth; cv.height = Math.round(cv.width / ar); }
}
addEventListener("resize", resize); resize();

const TILE_GLYPH = { 1: "🧱", 2: "🖥️", 3: "🗄️", 4: "🪴" };
function draw() {
  const s = S; if (!s) return;
  const ts = cv.height / 14; // tiles visible vertically
  ctx.fillStyle = "#0d0d16"; ctx.fillRect(0, 0, cv.width, cv.height);
  camX = clamp(s.px * TILE + TILE / 2 - cv.width / 2, 0, MAPW * TILE - cv.width);
  camY = clamp(s.py * TILE + TILE / 2 - cv.height / 2, 0, MAPH * TILE - cv.height);
  const sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  const x0 = Math.max(0, Math.floor(camX / TILE)), x1 = Math.min(MAPW - 1, Math.ceil((camX + cv.width / sc) / TILE));
  const y0 = Math.max(0, Math.floor(camY / TILE)), y1 = Math.min(MAPH - 1, Math.ceil((camY + cv.height / sc) / TILE));
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = s.map[y][x];
    ctx.fillStyle = t === 1 ? "#232336" : ((x + y) % 2 ? "#161622" : "#181828");
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    if (t >= 2) { ctx.font = "24px serif"; ctx.fillText(TILE_GLYPH[t], x * TILE + 16, y * TILE + 17); }
  }
  // coffee machines
  for (const c of s.coffeeMachines) { ctx.font = "24px serif"; ctx.globalAlpha = c.used ? .35 : 1; ctx.fillText("☕", c.x * TILE + 16, c.y * TILE + 17); ctx.globalAlpha = 1; }
  // lore
  for (const l of s.loreSpots) if (!l.found) { ctx.font = "20px serif"; ctx.fillText("❓", l.x * TILE + 16, l.y * TILE + 16); }
  // devices (broken)
  for (const d of s.devices) {
    ctx.font = "24px serif"; ctx.fillText(d.type.icon, d.x * TILE + 16, d.y * TILE + 17);
    if (!d.fixed) { ctx.font = "14px serif"; ctx.fillText("⚠️", d.x * TILE + 24, d.y * TILE + 8); }
  }
  // portals
  const t = performance.now() / 300;
  for (const p of s.portals) {
    ctx.font = "26px serif";
    ctx.fillStyle = "#a6f"; ctx.globalAlpha = .5 + Math.sin(t + p.x) * .3;
    ctx.beginPath(); ctx.arc(p.x * TILE + 16, p.y * TILE + 16, 12 + Math.sin(t) * 2, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillText("🌀", p.x * TILE + 16, p.y * TILE + 17);
  }
  // NPCs
  for (const n of s.npcs) {
    ctx.font = "24px serif"; ctx.fillText(n.face, n.x * TILE + 16, n.y * TILE + 17);
    if (!n.ambient && !n.done) {
      ctx.font = "13px serif";
      ctx.fillText(n.critical ? "🚨" : "🎫", n.x * TILE + 24, n.y * TILE + 7);
    } else if (!n.ambient && n.done) { ctx.font = "12px serif"; ctx.fillText("✅", n.x * TILE + 24, n.y * TILE + 7); }
  }
  // player
  ctx.font = "26px serif";
  ctx.save();
  if (s.dir < 0) { ctx.translate(s.px * TILE + 32, 0); ctx.scale(-1, 1); ctx.fillText("🧑‍🔧", -16, s.py * TILE + 17); }
  else ctx.fillText("🧑‍🔧", s.px * TILE + 16, s.py * TILE + 17);
  ctx.restore();
  ctx.restore();
}

// ---------- movement & input ----------
const keys = {};
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (["e", "enter", " "].includes(e.key.toLowerCase())) interact();
  if (e.key.toLowerCase() === "m") openPanel();
});
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let joy = { x: 0, y: 0 };
const joyEl = $("joystick"), knob = $("joy-knob");
let joyId = null, joyC = null;
joyEl.addEventListener("touchstart", e => { const t = e.changedTouches[0]; joyId = t.identifier; const r = joyEl.getBoundingClientRect(); joyC = { x: r.left + 55, y: r.top + 55 }; }, { passive: true });
addEventListener("touchmove", e => {
  for (const t of e.changedTouches) if (t.identifier === joyId) {
    let dx = t.clientX - joyC.x, dy = t.clientY - joyC.y;
    const d = Math.hypot(dx, dy) || 1, m = Math.min(d, 40);
    dx = dx / d * m; dy = dy / d * m;
    knob.style.left = 35 + dx + "px"; knob.style.top = 35 + dy + "px";
    joy.x = dx / 40; joy.y = dy / 40;
  }
}, { passive: true });
addEventListener("touchend", e => {
  for (const t of e.changedTouches) if (t.identifier === joyId) { joyId = null; joy.x = joy.y = 0; knob.style.left = "35px"; knob.style.top = "35px"; }
}, { passive: true });
$("tb-interact").addEventListener("touchstart", e => { e.preventDefault(); interact(); });
$("tb-menu").addEventListener("touchstart", e => { e.preventDefault(); openPanel(); });
$("btn-menu").addEventListener("click", openPanel);

let moveAcc = 0;
function step(dt) {
  const s = S; if (!s || s.inDialog || s.inBattle || s.gameOver || panelOpen || eodOpen) return;
  let dx = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0) + joy.x;
  let dy = (keys.w || keys.arrowup ? -1 : 0) + (keys.s || keys.arrowdown ? 1 : 0) + joy.y;
  const mag = Math.hypot(dx, dy);
  s.moving = mag > .3;
  if (!s.moving) return;
  if (mag > 1) { dx /= mag; dy /= mag; }
  if (Math.abs(dx) > .1) s.dir = dx > 0 ? 1 : -1;
  moveAcc += dt * (coffeeMug() ? 3.4 : 3.0); // tiles per second
  if (moveAcc < 1) return;
  moveAcc = 0;
  const nx = clamp(Math.round(s.px + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0)), 1, MAPW - 2);
  const ny = clamp(Math.round(s.py + (Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0)), 1, MAPH - 2);
  if (s.map[ny][nx] === 0 && !npcAt(nx, ny)) { s.px = nx; s.py = ny; }
  else if (s.map[s.py][nx] === 0 && !npcAt(nx, s.py)) s.px = nx;
  else if (s.map[ny][s.px] === 0 && !npcAt(s.px, ny)) s.py = ny;
}
function npcAt(x, y) { return S.npcs.find(n => n.x === x && n.y === y); }
function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; }

// ---------- game loop ----------
let last = 0;
function loop(t) {
  const dt = Math.min(.1, (t - last) / 1000); last = t;
  step(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- interaction ----------
function interact() {
  const s = S; if (!s || s.inBattle || panelOpen || eodOpen) return;
  if (s.inDialog) return;
  const p = { x: s.px, y: s.py };
  // NPC?
  const npc = s.npcs.find(n => adjacent(p, n));
  if (npc) return npc.ambient ? ambientTalk(npc) : ticketFlow(npc);
  // portal?
  const portal = s.portals.find(po => adjacent(p, po));
  if (portal) return startBattle(portal);
  // device?
  const dev = s.devices.find(d => adjacent(p, d) && !d.fixed);
  if (dev) return fixDevice(dev);
  // coffee?
  const cof = s.coffeeMachines.find(c => adjacent(p, c) && !c.used);
  if (cof) { cof.used = true; addStress(-25); toast("☕ +25 calm. The dark roast hits."); return; }
  // lore?
  const lore = s.loreSpots.find(l => adjacent(p, l) && !l.found);
  if (lore) { lore.found = true; addXP(5); s.journal.push({ day: s.day, title: "Office Lore", body: lore.text }); dlg("📜 Discovery", lore.text, [{ t: "Fascinating. (+5 XP)", f: closeDlg }]); return; }
}

function dlg(name, text, options) {
  S.inDialog = true;
  $("dialogue").classList.remove("hidden");
  $("dlg-name").textContent = name;
  $("dlg-text").innerHTML = text;
  const box = $("dlg-options"); box.innerHTML = "";
  for (const o of options) {
    const b = document.createElement("button");
    b.innerHTML = o.t; b.onclick = o.f;
    box.appendChild(b);
  }
}
function closeDlg() { S.inDialog = false; $("dialogue").classList.add("hidden"); }

function ambientTalk(n) {
  const lines = [
    `Heard the ${pick(["server room", "MDF", "fiber vault"])} hums at night. Creepy.`,
    `You're ${rank().name}, right? ${S.rep[n.dept] >= 3 ? n.dept + " speaks highly of you." : "We haven't had much to fix in " + n.dept + " lately."}`,
    `Day ${S.day} already? Time flies when the network's up.`,
    `Word is the old root account is still active somewhere...`,
  ];
  dlg(`${n.name} — ${n.dept}`, pick(lines), [{ t: "Back to work.", f: closeDlg }]);
}

// ---------- ticket flow: interview → diagnose → device → portal/battle → close ----------
function ticketFlow(n) {
  const s = S, t = n.type;
  if (n.done) return dlg(`${n.name} — ${n.dept}`, "Thanks again for the fix! ⭐", [{ t: "Anytime.", f: closeDlg }]);
  if (!n.interviewed) {
    n.interviewed = true; advanceClock(10);
    const symptoms = {
      printer: `"It just says 'PC LOAD LETTER' and makes a screaming noise."`,
      vpn: `"I click connect and it spins forever. I have a meeting in 10 minutes!"`,
      dns: `"The WiFi is connected but NOTHING loads. Is the internet down?"`,
      ad: `"I typed my password ONE time wrong and now I'm locked out. Also maybe 9 times."`,
      malware: `"A pop-up said I won a cruise, so I clicked it. Why does my screen have... friends?"`,
      email: `"My inbox is empty. EMPTY. Where did 14,000 emails go?"`,
      bsod: `"It blue screens every time I open the spreadsheet. THE spreadsheet."`,
      plc: `"Line 3 is down. The PLC won't talk to anything. Production is staring at me."`,
    };
    dlg(`${n.name} — ${n.dept} ${n.critical ? "🚨" : ""}`,
      `<b>${t.icon} ${t.label}</b><br>${symptoms[t.id]}<br><small>Interview the user, then form a hypothesis.</small>`,
      [{ t: "🔍 Form a diagnosis", f: () => diagnose(n) }]);
    return;
  }
  if (!n.diagnosed) return diagnose(n);
  dlg(`${n.name} — ${n.dept}`, n.fixedReady ? "The portal is open by the device. Good luck in there... 🌀" : "Find the broken device nearby (look for ⚠️).", [{ t: "On it.", f: closeDlg }]);
}

function diagnose(n) {
  const s = S, t = n.type;
  const opts = t.diag.map((d, i) => ({
    t: `${["🅰", "🅱", "🅲"][i]} ${d}`,
    f: () => {
      n.diagnosed = true; n.correctDiag = i === t.correct;
      advanceClock(15);
      // spawn broken device near npc
      const dp = freeSpot(s.map, n.x, n.y);
      s.devices.push({ ...dp, type: t, fixed: false, npc: n.id });
      if (n.correctDiag) {
        addXP(8); toast("🎯 Correct diagnosis! (+8 XP)");
        // good diagnosis = easier dungeon: portal appears, enemy weakened
        const pp = freeSpot(s.map, dp.x, dp.y);
        s.portals.push({ ...pp, npc: n.id, weak: true });
      } else {
        addStress(10);
        toast("❌ Wrong hypothesis... the problem is worse than it looked. (+10 stress)");
        const pp = freeSpot(s.map, dp.x, dp.y);
        s.portals.push({ ...pp, npc: n.id, weak: false });
      }
      n.fixedReady = true;
      closeDlg(); updateHUD();
    }
  }));
  dlg("🧠 Diagnosis", `<b>${t.label}</b><br>What's the most likely root cause?`, opts);
}

function fixDevice(d) {
  const s = S;
  if (!s.portals.some(p => p.npc === d.npc && !p.cleared)) {
    // portal already cleared → physical repair completes it
    d.fixed = true;
    resolveTicket(s.npcs.find(n => n.id === d.npc));
    return;
  }
  dlg("🔧 Device", `The ${d.type.label.toLowerCase()} hardware looks physically fine... the corruption runs deeper. Enter the 🌀 portal to fight the manifestation.`, [{ t: "OK", f: closeDlg }]);
}

// ---------- battle ----------
let B = null;
function startBattle(portal) {
  const s = S, npc = s.npcs.find(n => n.id === portal.npc), t = npc.type;
  const lv = 1 + Math.floor(s.day / 2) + (npc.critical ? 2 : 0);
  let hp = 18 + lv * 8;
  if (portal.weak) hp = Math.round(hp * .7);
  if (s.chaos?.id === "outage" && t.stat === "networking") hp = Math.round(hp * 1.3);
  B = { portal, npc, t, hp, maxHp: hp, shield: false, stunned: false, weakened: false, regen: false, log: [] };
  s.inBattle = true;
  $("battle").classList.remove("hidden");
  $("enemy-sprite").textContent = t.eicon;
  $("enemy-name").textContent = `${t.enemy} — ${t.world}`;
  blog(`<span class="sys">You step through the portal into the <b>${t.world}</b>. A ${t.enemy} manifests!</span>`);
  renderBattle();
}
function blog(h) { B.log.push(h); $("battle-log").innerHTML = B.log.slice(-30).join("<br>"); $("battle-log").scrollTop = 1e6; }
function battleAbilities() {
  const list = [...ABILITIES];
  for (const c of S.certs) if (CERT_ABILITIES[c]) list.push(CERT_ABILITIES[c]);
  return list;
}
function renderBattle() {
  const s = S;
  $("enemy-hp").style.width = clamp(B.hp / B.maxHp * 100, 0, 100) + "%";
  $("player-hp").style.width = clamp(s.hp / s.maxHp * 100, 0, 100) + "%";
  $("player-hp-text").textContent = `HP ${s.hp}/${s.maxHp} · Stress ${s.stress}/100`;
  const box = $("battle-actions"); box.innerHTML = "";
  for (const a of battleAbilities()) {
    const b = document.createElement("button");
    b.innerHTML = `${a.icon} ${a.name}<span class="cost">${a.stress > 0 ? "+" + a.stress + " stress" : a.stress < 0 ? a.stress + " stress" : "free"}</span>`;
    b.disabled = s.stress + a.stress > 100;
    b.onclick = () => doAbility(a);
    box.appendChild(b);
  }
}
function doAbility(a) {
  const s = S;
  if (!B || B.over) return;
  addStress(a.stress);
  let dmg = 0;
  if (a.dmg[1] > 0) {
    const bonus = statBonus(B.t.stat);
    dmg = R(a.dmg[0], a.dmg[1]) + Math.round(bonus / 2);
    if (B.weakened) dmg = Math.round(dmg * 1.25);
    B.hp -= dmg;
    blog(`<span class="dmg">${a.icon} ${a.name} hits for <b>${dmg}</b>!</span>`);
  }
  if (a.heal) { s.hp = clamp(s.hp + a.heal, 0, s.maxHp); blog(`<span class="heal">+${a.heal} HP</span>`); }
  if (a.shield) { B.shield = true; blog(`<span class="sys">🧱 Firewall up — next hit halved.</span>`); }
  if (a.stun) { B.stunned = true; blog(`<span class="sys">🔒 Enemy contained! It loses a turn.</span>`); }
  if (a.weaken) { B.weakened = true; blog(`<span class="sys">🛰️ Weakness found: take +25% damage.</span>`); }
  if (a.regen) { B.regen = true; blog(`<span class="sys">☁️ Auto-scaling: +3 HP per turn.</span>`); }
  if (a.usable === "calm") blog(`<span class="heal">☕ You feel human again.</span>`);
  if (B.hp <= 0) return winBattle();
  // enemy turn
  if (B.stunned) { B.stunned = false; }
  else {
    const atk = pick(["Packet Flood", "Credential Theft", "Latency Spike", "Memory Leak", "Spam Burst", "Corruption Wave"]);
    let ed = R(4, 9) + Math.floor(s.day / 2);
    if (B.shield) { ed = Math.ceil(ed / 2); B.shield = false; }
    s.hp -= ed; addStress(4);
    blog(`💥 ${B.t.enemy} uses <b>${atk}</b> — you take ${ed}.`);
  }
  if (B.regen) s.hp = clamp(s.hp + 3, 0, s.maxHp);
  if (s.hp <= 0) return loseBattle();
  renderBattle(); updateHUD();
}
function winBattle() {
  const s = S, n = B.npc, t = B.t;
  B.over = true;
  let xp = 20 + (n.critical ? 30 : 0);
  if (s.chaos?.id === "patch") xp = Math.round(xp * 1.5);
  addXP(xp);
  blog(`<span class="sys">🏆 ${t.enemy} defeated! +${xp} XP</span>`);
  // loot
  const roll = Math.random();
  let drops = [];
  if (roll < .5) drops.push(rollLoot("common"));
  else if (roll < .8) drops.push(rollLoot("rare"));
  else if (roll < .95) drops.push(rollLoot("epic"));
  else drops.push(rollLoot("legendary"));
  if (n.critical) drops.push(rollLoot("epic"));
  for (const l of drops) { s.inv.push(l); s.lootToday++; blog(`<span class="heal">Loot: ${l.icon} <b>${l.name}</b> (${l.rarity})</span>`); }
  const cash = R(15, 40) * (s.chaos?.id === "audit" ? 2 : 1);
  s.budget += cash; blog(`<span class="heal">💰 +$${cash} budget</span>`);
  B.portal.cleared = true;
  setTimeout(() => {
    $("battle").classList.add("hidden");
    s.inBattle = false;
    // remove portal
    s.portals = s.portals.filter(p => p !== B.portal);
    // journal
    s.journal.push({ day: s.day, title: `${t.label} — resolved`, body: `Root cause traced in the ${t.world}. Solution: ${t.diag[t.correct]}. Prevention: monitoring + documentation.` });
    // now fix the physical device
    const dev = s.devices.find(d => d.npc === n.id);
    if (dev) { dev.fixed = true; }
    resolveTicket(n);
    B = null;
    updateHUD();
  }, 900);
}
function loseBattle() {
  const s = S;
  addStress(20); s.hp = Math.round(s.maxHp / 2);
  s.portals = s.portals.filter(p => p !== B.portal);
  const dev = s.devices.find(d => d.npc === B.npc.id); if (dev) dev.fixed = true;
  s.rep[B.npc.dept] = Math.max(0, s.rep[B.npc.dept] - 1);
  const n = B.npc; n.done = true; s.ticketsDone++;
  toast("💀 The manifestation overwhelmed you. The ticket got escalated... (-1 rep, +20 stress)");
  s.journal.push({ day: s.day, title: `${n.type.label} — FAILED`, body: `Lesson: ${n.type.diag[n.type.correct]}. You won't make that mistake twice.` });
  $("battle").classList.add("hidden"); s.inBattle = false; B = null;
  updateHUD(); checkDayEnd();
}
function rollLoot(minRarity) {
  const order = ["common", "rare", "epic", "legendary"];
  const pool = LOOT_TABLE.filter(l => order.indexOf(l.rarity) >= order.indexOf(minRarity) - 1);
  const weights = pool.map(l => l.rarity === "common" ? 40 : l.rarity === "rare" ? 30 : l.rarity === "epic" ? 20 : 10);
  let tot = weights.reduce((a, b) => a + b), r = Math.random() * tot;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return { ...pool[i] }; }
  return { ...pool[0] };
}
function resolveTicket(n) {
  const s = S;
  n.done = true; s.ticketsDone++;
  let repGain = 1;
  if (s.chaos?.id === "ceo" && n.dept === "Executives") repGain = 2;
  s.rep[n.dept] = clamp(s.rep[n.dept] + repGain, 0, 5);
  addXP(10);
  toast(`✅ Ticket closed — ${n.type.label}<br>${n.dept} rep +${repGain} ${"⭐".repeat(s.rep[n.dept])}`);
  advanceClock(20);
  updateHUD();
  checkDayEnd();
}

// ---------- HUD / clock / progression ----------
let toastT = null;
function toast(html, ms = 2600) {
  const t = $("toast"); t.innerHTML = html; t.classList.remove("hidden");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), ms);
}
function addXP(n) {
  const s = S, before = rank().name;
  s.xp += n;
  const after = rank().name;
  if (after !== before) setTimeout(() => promotion(after), 600);
  updateHUD();
}
function addStress(n) {
  const s = S;
  let mult = s.chaos?.id === "heat" && n > 0 ? 1.5 : 1;
  s.stress = clamp(Math.round(s.stress + n * mult), 0, 100);
  if (s.stress >= 100) { s.stress = 70; s.hp = Math.max(1, s.hp - 10); toast("🔥 BURNOUT! You snap at a user and hide in the IDF. (-10 HP)"); }
  updateHUD();
}
function promotion(newRank) {
  const s = S;
  s.maxHp += 10; s.hp = s.maxHp;
  const perk = {
    "Senior Technician": "Perk: +10 max HP. Users trust you more.",
    "Site Administrator": "Perk: Master keycard! 🗝️ All doors open. +10 max HP.",
    "Systems Administrator": "Perk: Group Policy buffs. +10 max HP.",
    "Infrastructure Engineer": "Perk: You can feel packet flows. +10 max HP.",
    "Security Engineer": "Perk: Proactive threat sense. +10 max HP.",
    "Security Architect": "Perk: The corruption fears you. +10 max HP.",
    "CIO": "👑 You run the whole digital world now. You WIN... but the tickets never end. (Endless mode unlocked)",
  }[newRank] || "+10 max HP";
  if (newRank === "CIO") s.won = true;
  dlg("🎉 PROMOTION!", `You've been promoted to <b>${newRank}</b>!<br>${perk}`, [{ t: "Let's go.", f: () => { closeDlg(); save(); } }]);
  toast(`🎉 PROMOTED: ${newRank}`, 4000);
}
function advanceClock(min) {
  const s = S;
  s.clock += min;
  if (s.clock >= 17 * 60 && s.ticketsDone < s.ticketsTotal) {
    // day force-ends when you run out of time
    toast("🕔 It's 5 PM. Remaining tickets roll to the backlog...");
    checkDayEnd(true);
  }
  updateHUD();
}
function fmtClock(c) { const h = Math.floor(c / 60), m = c % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; }
function updateHUD() {
  const s = S; if (!s) return;
  $("hud-day").textContent = `DAY ${s.day}`;
  $("hud-title").textContent = rank().name;
  $("hud-clock").textContent = fmtClock(s.clock);
  const cur = rank(), ni = RANKS.indexOf(cur);
  const next = RANKS[ni + 1];
  $("bar-xp").style.width = next ? clamp((s.xp - cur.xp) / (next.xp - cur.xp) * 100, 0, 100) + "%" : "100%";
  $("bar-stress").style.width = s.stress + "%";
  $("hud-budget").textContent = "$" + s.budget;
  $("hud-tickets").textContent = `🎫 ${s.ticketsDone}/${s.ticketsTotal}`;
  if (s.chaos) { $("chaos-banner").classList.remove("hidden"); $("chaos-banner").textContent = `${s.chaos.name} — ${s.chaos.desc}`; }
  else $("chaos-banner").classList.add("hidden");
  const open = s.tickets.filter(t => !t.done);
  $("quest-tracker").innerHTML =
    s.tickets.filter(t => t.done).map(t => `<div class="done">✅ ${t.type.label} (${t.dept})</div>`).join("") +
    open.map(t => `<div>${t.critical ? "🚨" : "🎫"} ${t.type.label} — ${t.name}, ${t.dept}${t.diagnosed ? " · find 🌀" : ""}</div>`).join("");
}

// ---------- end of day ----------
let eodOpen = false;
function checkDayEnd(force) {
  const s = S;
  if (s.inBattle) return;
  if ((s.ticketsDone >= s.ticketsTotal || force) && !eodOpen) endOfDay();
}
function endOfDay() {
  const s = S; eodOpen = true;
  let stressRec = s.chaos?.id === "calm" ? 30 : 15;
  s.stress = clamp(s.stress - stressRec, 0, 100);
  const missed = s.ticketsTotal - s.ticketsDone;
  if (missed > 0) for (const t of s.tickets.filter(t => !t.done)) s.rep[t.dept] = Math.max(0, s.rep[t.dept] - 1);
  $("eod-title").textContent = `DAY ${s.day} COMPLETE`;
  $("eod-summary").innerHTML =
    `🎫 Tickets: ${s.ticketsDone}/${s.ticketsTotal}${missed ? ` <span style="color:#f88">(${missed} rolled over, -rep)</span>` : " — <b>ZERO BACKLOG!</b> 👑"}<br>` +
    `✨ Total XP: ${s.xp} · 💰 Budget: $${s.budget}<br>` +
    `😌 Stress recovered: -${stressRec} · Rank: <b>${rank().name}</b>`;
  const rewards = [
    { icon: "💻", t: "New Hardware", d: "+1 random stat", f: () => { const k = pick(Object.keys(s.stats)); s.stats[k]++; toast(`📈 ${k} +1`); } },
    { icon: "📜", t: "Automation Script", d: "+2 automation", f: () => { s.stats.automation += 2; toast("📈 automation +2"); } },
    { icon: "☕", t: "Coffee Perk", d: "-20 stress tomorrow", f: () => { s.stress = clamp(s.stress - 20, 0, 100); toast("☕ deeply relaxed"); } },
    { icon: "🎓", t: "Cert Study", d: "-$100 next cert", f: () => { s.certDiscount = (s.certDiscount || 0) + 100; toast("🎓 cert discount $100"); } },
    { icon: "💰", t: "Budget Bump", d: "+$60", f: () => { s.budget += 60; toast("💰 +$60"); } },
    { icon: "🧘", t: "Vacation Half-day", d: "+10 max HP", f: () => { s.maxHp += 10; s.hp = s.maxHp; toast("❤️ max HP +10"); } },
  ];
  const shown = [...rewards].sort(() => Math.random() - .5).slice(0, 3);
  const box = $("eod-rewards"); box.innerHTML = "";
  for (const r of shown) {
    const b = document.createElement("button");
    b.innerHTML = `<span class="rw-icon">${r.icon}</span><b>${r.t}</b><br>${r.d}`;
    b.onclick = () => { r.f(); $("eod").classList.add("hidden"); eodOpen = false; s.day++; setupDay(); };
    box.appendChild(b);
  }
  $("eod").classList.remove("hidden");
  save();
}

// ---------- panel (character / inventory / certs / journal / reputation) ----------
let panelOpen = false;
function openPanel(tab = "Character") {
  if (S.inBattle) return;
  panelOpen = true;
  $("panel").classList.remove("hidden");
  const tabs = ["Character", "Inventory", "Certifications", "Journal", "Reputation"];
  $("panel-title").textContent = "🧑‍🔧 TECHOPS HERO";
  $("panel-tabs").innerHTML = "";
  for (const t of tabs) {
    const b = document.createElement("button");
    b.textContent = t; if (t === tab) b.classList.add("active");
    b.onclick = () => openPanel(t);
    $("panel-tabs").appendChild(b);
  }
  renderTab(tab);
}
function closePanel() { panelOpen = false; $("panel").classList.add("hidden"); }
$("panel-close").addEventListener("click", closePanel);

function renderTab(tab) {
  const s = S, el = $("panel-body");
  if (tab === "Character") {
    el.innerHTML =
      `<h3>${rank().name} — Day ${s.day}</h3>` +
      `<div class="stat-row"><span>XP</span><span>${s.xp}</span></div>` +
      `<div class="stat-row"><span>HP</span><span>${s.hp}/${s.maxHp}</span></div>` +
      `<div class="stat-row"><span>Stress</span><span>${s.stress}/100</span></div>` +
      `<div class="stat-row"><span>Budget</span><span>$${s.budget}</span></div><br><h4>Technical Skills</h4>` +
      Object.entries(s.stats).map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${"▮".repeat(Math.min(v, 20))} ${v + Math.round(S.inv.reduce((a, l) => a + (l.stat === k ? l.val : 0), 0) / 3)}</span></div>`).join("") +
      `<br><h4>Soft Skills</h4>` +
      Object.entries(s.soft).map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${"▮".repeat(v)} ${v}</span></div>`).join("") +
      `<br><h4>Career Ladder</h4>` + RANKS.map(r => `<div class="stat-row"><span>${s.xp >= r.xp ? "✅" : "⬜"} ${r.name}</span><span>${r.xp} XP</span></div>`).join("");
  } else if (tab === "Inventory") {
    el.innerHTML = s.inv.length ? "" : "<i>No loot yet. Close tickets and clear dungeons!</i>";
    for (const l of s.inv) el.innerHTML += `<div class="loot-item">${l.icon} <span class="rarity-${l.rarity}"><b>${l.name}</b> (${l.rarity})</span><br><small>${l.stat === "stress" ? "Passive: move faster, stress resist" : `+${l.val} ${l.stat}`}</small></div>`;
  } else if (tab === "Certifications") {
    el.innerHTML = "<i>Certs unlock new battle abilities. Study with your budget.</i><br><br>";
    for (const c of CERTS) {
      const owned = s.certs.includes(c.id);
      const cost = Math.max(0, c.cost - (s.certDiscount || 0));
      el.innerHTML += `<div class="cert-node ${owned ? "owned" : s.budget < cost ? "locked" : ""}"><b>${c.name}</b> ${owned ? "✅" : `<button data-cert="${c.id}" data-cost="${cost}">$${cost}</button>`}<br><small>${c.desc}</small></div>`;
    }
    el.querySelectorAll("button[data-cert]").forEach(b => b.onclick = () => {
      const cost = +b.dataset.cost;
      if (s.budget < cost) return toast("Not enough budget!");
      s.budget -= cost; s.certDiscount = 0;
      s.certs.push(b.dataset.cert); addXP(30);
      toast(`🎓 Certified! New ability unlocked in battle.`);
      renderTab("Certifications"); save();
    });
  } else if (tab === "Journal") {
    el.innerHTML = s.journal.length ? "" : "<i>Your troubleshooting journal is empty. Solve tickets to fill it.</i>";
    for (const j of [...s.journal].reverse()) el.innerHTML += `<div class="journal-entry"><b>Day ${j.day} — ${j.title}</b><br><small>${j.body}</small></div>`;
  } else if (tab === "Reputation") {
    el.innerHTML = "<i>Departments remember you.</i><br><br>";
    for (const d of DEPTS) {
      const v = s.rep[d];
      el.innerHTML += `<div class="rep-row"><span>${d}</span><span class="stars">${"★".repeat(v)}${"☆".repeat(5 - v)}</span></div>`;
    }
    el.innerHTML += `<br><small>Higher rep → better budget rewards & friendlier users. Missed tickets lower rep.</small>`;
  }
}

// ---------- boot ----------
function showTouchUI() {
  if (matchMedia("(pointer:coarse)").matches) $("touch-ui").classList.remove("hidden");
}
$("btn-start").addEventListener("click", () => {
  localStorage.removeItem("techops_save");
  S = newState(); setupDay();
  $("title-screen").classList.add("hidden");
  $("hud").classList.remove("hidden");
  showTouchUI();
  dlg("📟 CIO Dispatch", `Welcome to <b>AeroTech Manufacturing</b>, ${rank().name}.<br><br>Users have tickets. Devices have... <i>manifestations</i>. Interview users, diagnose root causes, enter the portals, and keep this factory running.<br><br>Clock out strong. Good luck.`, [{ t: "Clock in ▶", f: closeDlg }]);
});
$("btn-continue").addEventListener("click", () => {
  const d = load(); if (!d) return;
  S = newState(); Object.assign(S, d);
  setupDay(); S.day = d.day; // setupDay regenerates the run for the day
  updateHUD();
  $("title-screen").classList.add("hidden");
  $("hud").classList.remove("hidden");
  showTouchUI();
  toast(`↻ Welcome back, ${rank().name}. Day ${S.day} begins.`);
});
if (load()) $("btn-continue").classList.remove("hidden");
requestAnimationFrame(loop);

/* ============================================================
   TECHOPS HERO v5.6 — "Drip & Trophies" (v56_hooks.js)
   Loads AFTER v55_hooks.js. Adds:
   • Collectible achievements with a trophy case at Mike's desk
   • Character progression visuals — your look evolves with rank
   ============================================================ */
"use strict";

// ---------- collectible achievements ----------
const V56_ACH = [
  { id: "cable", icon: "🔌", name: "Cable Whisperer", desc: "Fix 5 hardware tickets", reward: 100,
    prog: s => [s.meta.v56.hwFixed || 0, 5] },
  { id: "zero", icon: "🛡️", name: "Zero Downtime", desc: "Finish a day with every ticket closed", reward: 150,
    prog: s => [s.meta.v56.zeroDays || 0, 1] },
  { id: "detective", icon: "🕵️", name: "Packet Detective", desc: "Crack 3 incident dependency trees", reward: 200,
    prog: s => [s.meta.v56.treesCracked || 0, 3] },
  { id: "automator", icon: "🤖", name: "The Automator", desc: "Use the automation script 5 times", reward: 150,
    prog: s => [s.meta.v56.scripts || 0, 5] },
  { id: "vip", icon: "⭐", name: "VIP Whisperer", desc: "Handle 10 VIP tickets well", reward: 200,
    prog: s => [s.meta.v56.vips || 0, 10] },
  { id: "teacher", icon: "🍎", name: "The Teacher", desc: "Master 5 ticket types", reward: 250,
    prog: s => [Object.values(s.meta.mastery || {}).filter(v => v >= 5).length, 5] },
];
function v56Init() { const s = S; s.meta.v56 = s.meta.v56 || { unlocked: [] }; return s.meta.v56; }
function v56Check() {
  const s = S; if (!s || !s.meta) return;
  const m = v56Init();
  for (const a of V56_ACH) {
    if (m.unlocked.includes(a.id)) continue;
    const [cur, need] = a.prog(s);
    if (cur >= need) {
      m.unlocked.push(a.id);
      s.budget += a.reward;
      setTimeout(() => toast(`🏆 <b>ACHIEVEMENT:</b> ${a.icon} ${a.name} — ${a.desc}. (+$${a.reward})`, 4600), 4800);
    }
  }
}
function trophyCase() {
  const s = S, m = v56Init();
  const rows = V56_ACH.map(a => {
    const has = m.unlocked.includes(a.id);
    const [cur, need] = a.prog(s);
    return `${has ? a.icon : "🔒"} <b>${a.name}</b> — ${a.desc} <small>(${Math.min(cur, need)}/${need})</small>`;
  }).join("<br><br>");
  dlg("🏆 TROPHY CASE", `${rows}<br><br><small>${m.unlocked.length}/${V56_ACH.length} unlocked · each pays a cash bonus</small>`,
    [{ t: "Back", f: (typeof mgmtConsole === "function") ? mgmtConsole : closeDlg }]);
}
// inject trophy case into the management console — DOM-level, so it
// composes with v53's dlg-interception wrap (which would clobber ours)
const __origMgmtConsoleV56 = (typeof mgmtConsole === "function") ? mgmtConsole : null;
if (__origMgmtConsoleV56) {
  mgmtConsole = function () {
    __origMgmtConsoleV56.apply(this, arguments);
    const nameEl = document.getElementById("dlg-name");
    const optsEl = document.getElementById("dlg-options");
    if (!nameEl || !optsEl || !nameEl.textContent.includes("MANAGEMENT CONSOLE")) return;
    if ([...optsEl.children].some(b => b.textContent.includes("Trophy case"))) return;
    const sib = optsEl.querySelector("button");
    const btn = document.createElement("button");
    if (sib) btn.className = sib.className;
    btn.textContent = "🏆 Trophy case";
    btn.onclick = () => trophyCase();
    optsEl.insertBefore(btn, optsEl.children[Math.max(0, optsEl.children.length - 1)] || null);
  };
}

// counters
const __origResolveTicketV56 = resolveTicket;
resolveTicket = function (n) {
  __origResolveTicketV56(n);
  const s = S; if (!s || !n || !n.type || !n.done) return;
  const m = v56Init();
  if (n.type.stat === "hardware") m.hwFixed = (m.hwFixed || 0) + 1;
  if (n.vip) m.vips = (m.vips || 0) + 1;
  v56Check();
};
// trees cracked
const __origSetupDayV56 = setupDay;
setupDay = function () {
  __origSetupDayV56();
  const s = S; if (!s || !s.meta) return;
  v56Init();
  // previous day cracked a tree? (tree object is replaced daily, so check the flag we set on crack)
  if (s.meta._v56TreeCracked) { s.meta._v56TreeCracked = false; s.meta.v56.treesCracked = (s.meta.v56.treesCracked || 0) + 1; v56Check(); }
};
const __origCheckDayEndV56 = checkDayEnd;
checkDayEnd = function (force) {
  const s = S;
  if (s && (force || s.ticketsDone >= s.ticketsTotal)) {
    if (s.meta.tree && s.meta.tree.cracked) s.meta._v56TreeCracked = true;
    const open = s.tickets.filter(t => !t.done && t.type && !t.ambient).length;
    if (open === 0 && s.tickets.length > 0) { v56Init().zeroDays = 1; v56Check(); }
  }
  __origCheckDayEndV56(force);
};
// automation script usage — latch on meta.scriptDay === current day (once per day)
const __origAdvanceClockV56 = advanceClock;
advanceClock = function (min) {
  __origAdvanceClockV56(min);
  const s = S;
  if (s && s.meta && s.meta.scriptDay === s.day) {
    const m = v56Init();
    if (m._scriptCountedDay !== s.day) {
      m._scriptCountedDay = s.day;
      m.scripts = (m.scripts || 0) + 1;
      v56Check();
    }
  }
};

// ---------- character progression visuals ----------
const RANK_GEAR = [
  { min: 1, icon: "🎧", label: "headset" },        // Senior Technician
  { min: 3, icon: "📱", label: "admin tablet" },    // Systems Administrator
  { min: 5, icon: "🛡️", label: "security badge" },  // Security Engineer
  { min: 7, icon: "👑", label: "CIO aura" },        // CIO
];
const __origDrawV56 = draw;
draw = function () {
  __origDrawV56.apply(this, arguments);
  const s = S;
  if (!s || s.nightMode || !s.map) return;
  const idx = (typeof rankIdx === "function") ? rankIdx() : 0;
  const gear = RANK_GEAR.filter(g => idx >= g.min);
  if (!gear.length) return;
  const tm = performance.now();
  const ts = cv.height / 14, sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  const X = s.px * TILE + 16, Y = s.py * TILE;
  // CIO aura: golden pulse ring
  if (idx >= 7) {
    const r = 20 + 3 * Math.sin(tm / 400);
    ctx.strokeStyle = `rgba(255,215,106,${.35 + .2 * Math.sin(tm / 400)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X, Y + 16, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
  }
  // gear icons stacked beside the player
  ctx.font = "11px serif";
  gear.forEach((g, i) => ctx.fillText(g.icon, X + 14 + (i % 2) * 2, Y + 4 + i * 10));
  ctx.restore();
};

console.log("%c[TechOps Hero] v5.6 Drip & Trophies loaded — achievements, trophy case, rank gear.", "color:#f472b6");

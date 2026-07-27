/* ============================================================
   TECHOPS HERO v6.0 — "Command Center" (v60_hooks.js)
   Loads AFTER v59_hooks.js. The endgame:
   • Enterprise command center (Security Architect+, rank 6) —
     five global sites with live health, an emoji enterprise map,
     and daily policy allocation: security / hardware / staffing
   • Site incidents, outages that spill tickets onto your board,
     and a perfect-uptime bonus. SimCity × SOC.
   ============================================================ */
"use strict";

const CC_SITES = [
  { id: "b7", icon: "🏭", name: "Building 7 — AeroTech HQ plant" },
  { id: "nh", icon: "🏢", name: "New Haven Corporate" },
  { id: "hf", icon: "🔧", name: "Hartford Plant" },
  { id: "st", icon: "🏙️", name: "Stamford Office" },
  { id: "db", icon: "🍀", name: "Dublin EU" },
];
const CC_POINTS = 6; // daily policy points across sec / hw / staff
function ccInit() {
  const s = S;
  s.meta.cc = s.meta.cc || {
    alloc: { sec: 2, hw: 2, staff: 2 },
    sites: CC_SITES.map(c => ({ id: c.id, health: R(62, 88) })),
  };
  return s.meta.cc;
}
const ccUnlocked = () => (typeof rankIdx === "function") && rankIdx() >= 6;
const ccBar = h => "█".repeat(Math.round(h / 10)).padEnd(10, "░");
const ccAvg = cc => Math.round(cc.sites.reduce((a, x) => a + x.health, 0) / cc.sites.length);

function commandCenter() {
  const s = S;
  if (!ccUnlocked()) {
    return dlg("🌐 COMMAND CENTER", `A wall of dark monitors. The enterprise map is <b>Security Architect</b> clearance and above.<br><br><small>Current rank: ${rank().name} — keep climbing.</small>`, [{ t: "Back", f: mgmtConsole }]);
  }
  const cc = ccInit();
  const a = cc.alloc, spent = a.sec + a.hw + a.staff, left = CC_POINTS - spent;
  const rows = cc.sites.map(x => {
    const meta = CC_SITES.find(c => c.id === x.id);
    const st = x.health >= 80 ? "🟢" : x.health >= 40 ? "🟡" : "🔴";
    return `${st} ${meta.icon} ${meta.name}<br><small>${ccBar(x.health)} ${x.health}%</small>`;
  }).join("<br><br>");
  const map = `<small>      🍀 DUBLIN ─────────┐<br>🏙️ STAMFORD ─ 🏢 NEW HAVEN ─ 🔧 HARTFORD<br>            🏭 <b>BUILDING 7 (you)</b></small>`;
  const mk = (label, f, dis) => ({ t: label, f });
  const bump = (k, d) => () => {
    const spentNow = cc.alloc.sec + cc.alloc.hw + cc.alloc.staff;
    if (d > 0 && spentNow >= CC_POINTS) return toast(`Only ${CC_POINTS} policy points — take some back first.`);
    if (d < 0 && cc.alloc[k] <= 0) return;
    cc.alloc[k] += d; commandCenter();
  };
  dlg("🌐 GLOBAL COMMAND CENTER",
    `${map}<br><br>${rows}<br><br>📊 <b>ENTERPRISE UPTIME: ${ccAvg(cc)}%</b><br><br><b>DAILY POLICY</b> (${left} pts unspent)<br><small>🛡️ Security −incident odds · 🖥️ Hardware −daily wear · 👥 Staffing +nightly recovery</small><br>🛡️ ${a.sec} · 🖥️ ${a.hw} · 👥 ${a.staff}`,
    [
      mk("🛡️ +1", bump("sec", 1)), mk("🛡️ −1", bump("sec", -1)),
      mk("🖥️ +1", bump("hw", 1)), mk("🖥️ −1", bump("hw", -1)),
      mk("👥 +1", bump("staff", 1)), mk("👥 −1", bump("staff", -1)),
      { t: "✅ Commit policy", f: () => { save(); toast("🌐 Policy committed. Effects apply each morning."); commandCenter(); } },
      { t: "Back", f: mgmtConsole },
    ]);
}

// inject into the management console (DOM-level, proven pattern)
const __origMgmtConsoleV60 = (typeof mgmtConsole === "function") ? mgmtConsole : null;
if (__origMgmtConsoleV60) {
  mgmtConsole = function () {
    __origMgmtConsoleV60.apply(this, arguments);
    const nameEl = document.getElementById("dlg-name");
    const optsEl = document.getElementById("dlg-options");
    if (!nameEl || !optsEl || !nameEl.textContent.includes("MANAGEMENT CONSOLE")) return;
    if ([...optsEl.children].some(b => b.textContent.includes("Command center"))) return;
    const sib = optsEl.querySelector("button");
    const btn = document.createElement("button");
    if (sib) btn.className = sib.className;
    btn.textContent = "🌐 Command center";
    btn.onclick = () => commandCenter();
    optsEl.insertBefore(btn, optsEl.children[Math.max(0, optsEl.children.length - 1)] || null);
  };
}

// nightly simulation: incidents, wear, recovery — outages spill onto your board
const __origSetupDayV60 = setupDay;
setupDay = function () {
  const hadCC = S && S.meta.cc;
  __origSetupDayV60();
  const s = S;
  if (!hadCC || !s || !s.meta.cc || !ccUnlocked()) return;
  const cc = s.meta.cc, a = cc.alloc;
  const events = [];
  cc.sites.forEach((x, i) => {
    const meta = CC_SITES.find(c => c.id === x.id);
    const incChance = Math.max(.04, .18 - a.sec * .02);
    let wasOut = x.health < 40;
    if (Math.random() < incChance) {
      const dmg = R(8, 16);
      x.health -= dmg;
      events.push(`${meta.icon} ${meta.name}: incident overnight (-${dmg}%)`);
    }
    const wear = Math.max(0, R(0, 5) - a.hw);
    if (wear) x.health -= wear;
    x.health += a.staff * 2;
    x.health = Math.max(5, Math.min(100, Math.round(x.health)));
    // outage → the site screams into your queue
    if (!wasOut && x.health < 40) {
      const dept = pick(DEPTS);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
      const type = pick(TICKET_TYPES.filter(t => t.id !== "hw_replace"));
      if (pos && type) {
        const npc = { id: 890 + i, name: `${meta.name.split(" ")[0]} NOC`, dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
          done: false, diagnosed: false, correctDiag: false, pv: 0, ambient: false };
        s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
        events.push(`🔴 OUTAGE at ${meta.name} — they're in your queue now`);
      }
    }
  });
  if (events.length) setTimeout(() => toast(`🌐 OVERNIGHT: ${events[0]}${events.length > 1 ? ` (+${events.length - 1} more — see command center)` : ""}`, 5200), 5800);
  if (ccAvg(cc) === 100) {
    s.budget += 75;
    setTimeout(() => toast("🌐 PERFECT ENTERPRISE UPTIME — the board wires a $75 excellence bonus.", 5200), 6200);
  }
};

console.log("%c[TechOps Hero] v6.0 Command Center loaded — enterprise map, global sites, budget policy.", "color:#f472b6");

/* ============================================================
   TECHOPS HERO v6.0 — "Command Center" (v60_hooks.js)
   Loads AFTER v59_hooks.js. The endgame:
   • Enterprise command center (Security Architect+, rank 6) —
     five global sites with live health, an emoji enterprise map,
     and daily policy allocation: security / hardware / staffing
   • Site incidents, outages that spill tickets onto your board,
     and a perfect-uptime bonus. SimCity × SOC.
   v6.0.1 polish: quantified policy projections, LAST NIGHT
   per-site report with advice, color-coded uptime.
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
  // quantified nightly projections — policy choices should say what they DO
  const incPct = Math.round(Math.max(.04, .18 - a.sec * .02) * 100);
  const wearMax = Math.max(0, 5 - a.hw), rec = a.staff * 2;
  const rows = cc.sites.map(x => {
    const meta = CC_SITES.find(c => c.id === x.id);
    const st = x.health >= 80 ? "🟢" : x.health >= 40 ? "🟡" : "🔴";
    return `${st} ${meta.icon} ${meta.name}<br><small>${ccBar(x.health)} ${x.health}%</small>`;
  }).join("<br><br>");
  const uptime = ccAvg(cc);
  const upColor = uptime >= 80 ? "#4ade80" : uptime >= 40 ? "#facc15" : "#f87171";
  const report = cc.lastReport
    ? `<br><br>📋 <b>LAST NIGHT</b><br><small>${cc.lastReport.join("<br>")}</small>${cc.advice ? `<br><small>💡 ${cc.advice}</small>` : ""}`
    : "";
  const map = `<small>      🍀 DUBLIN ─────────┐<br>🏙️ STAMFORD ─ 🏢 NEW HAVEN ─ 🔧 HARTFORD<br>            🏭 <b>BUILDING 7 (you)</b></small>`;
  const mk = (label, f, dis) => ({ t: label, f });
  const bump = (k, d) => () => {
    const spentNow = cc.alloc.sec + cc.alloc.hw + cc.alloc.staff;
    if (d > 0 && spentNow >= CC_POINTS) return toast(`Only ${CC_POINTS} policy points — take some back first.`);
    if (d < 0 && cc.alloc[k] <= 0) return;
    cc.alloc[k] += d; commandCenter();
  };
  dlg("🌐 GLOBAL COMMAND CENTER",
    `${map}<br><br>${rows}<br><br>📊 <b>ENTERPRISE UPTIME: <span style="color:${upColor}">${uptime}%</span></b><br><br><b>DAILY POLICY</b> (${left} pts unspent)<br>🛡️ ${a.sec} · 🖥️ ${a.hw} · 👥 ${a.staff}<br><small>→ Tonight: <b>${incPct}%</b> incident odds per site · wear up to <b>${wearMax}%</b> · recovery <b>+${rec}%</b></small>${report}`,
    [
      mk("🛡️ +1", bump("sec", 1)), mk("🛡️ −1", bump("sec", -1)),
      mk("🖥️ +1", bump("hw", 1)), mk("🖥️ −1", bump("hw", -1)),
      mk("👥 +1", bump("staff", 1)), mk("👥 −1", bump("staff", -1)),
      { t: "✅ Commit policy", f: () => { save(); toast(`🌐 Policy live: ${incPct}% incident odds, wear ≤${wearMax}%, +${rec}% nightly recovery.`); commandCenter(); } },
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
  const report = [];
  cc.sites.forEach((x, i) => {
    const meta = CC_SITES.find(c => c.id === x.id);
    const incChance = Math.max(.04, .18 - a.sec * .02);
    const before = x.health;
    let wasOut = x.health < 40, inc = 0, wear = 0;
    if (Math.random() < incChance) {
      inc = R(8, 16);
      x.health -= inc;
      events.push(`${meta.icon} ${meta.name}: incident overnight (-${inc}%)`);
    }
    wear = Math.max(0, R(0, 5) - a.hw);
    if (wear) x.health -= wear;
    const recGain = a.staff * 2;
    x.health += recGain;
    x.health = Math.max(5, Math.min(100, Math.round(x.health)));
    report.push(`${meta.icon} ${meta.name.split(" — ")[0]}: ${before}% → ${x.health}%${inc ? ` (incident −${inc}` : ""}${wear ? `${inc ? " · " : " ("}wear −${wear}` : ""}${inc || wear ? ")" : ""}${recGain ? ` · +${recGain} recovery` : ""}`);
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
  cc.lastReport = report;
  // what could I have done differently?
  const hadInc = events.some(e => e.includes("incident")), hadWear = report.some(r => r.includes("wear"));
  const lowSite = cc.sites.some(x => x.health < 60);
  cc.advice = hadInc && a.sec < 6 ? "More 🛡️ Security would cut incident odds."
    : hadWear && a.hw < 6 ? "More 🖥️ Hardware cover would absorb daily wear."
    : lowSite && a.staff < 6 ? "More 👥 Staffing would speed nightly recovery."
    : "Policy is holding. The enterprise hums.";
  if (events.length) setTimeout(() => toast(`🌐 OVERNIGHT: ${events[0]}${events.length > 1 ? ` (+${events.length - 1} more — see command center)` : ""}`, 5200), 5800);
  if (ccAvg(cc) === 100) {
    s.budget += 75;
    setTimeout(() => toast("🌐 PERFECT ENTERPRISE UPTIME — the board wires a $75 excellence bonus.", 5200), 6200);
  }
};

console.log("%c[TechOps Hero] v6.0 Command Center loaded — enterprise map, global sites, budget policy.", "color:#f472b6");

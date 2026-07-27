/* ============================================================
   TECHOPS HERO v5.8 — "Drills & Deals" (v58_hooks.js)
   Loads AFTER v57_hooks.js. Adds:
   • Packet-routing puzzle — longest-prefix-match drills at the terminal
   • AD permission puzzle — effective-permissions drills at the terminal
   • Procurement refresh project — plant-wide hardware lifecycle
     strategy with real budget politics (per-department rep effects)
   ============================================================ */
"use strict";

// ---------- packet-routing puzzle ----------
const PKT_QS = [
  () => { // longest prefix match
    const hops = { 8: "10.0.0.1", 16: "10.1.0.1", 24: "10.1.4.1" };
    const dst = `10.1.4.${R(2, 250)}`;
    return { q: `Routing table:<br><small>10.0.0.0/8 → ${hops[8]}<br>10.1.0.0/16 → ${hops[16]}<br>10.1.4.0/24 → ${hops[24]}<br>0.0.0.0/0 → 192.0.2.1</small><br><br>Packet to <b>${dst}</b> goes to next hop…`, correct: hops[24],
      opts: [hops[24], hops[8], hops[16], "192.0.2.1"].sort(() => Math.random() - .5),
      why: `Longest prefix match wins. ${dst} matches all three routes, but /24 is the most specific → ${hops[24]}. The default route (0.0.0.0/0) is always the last resort.` };
  },
  () => { // default gateway for foreign network
    const b = R(2, 9);
    return { q: `Host 10.1.${b}.22/24 (gateway 10.1.${b}.1) sends to <b>172.16.5.9</b>. The frame is addressed to…`, correct: `The default gateway's MAC (10.1.${b}.1)`,
      opts: [`The default gateway's MAC (10.1.${b}.1)`, "172.16.5.9's MAC directly", "The broadcast MAC ff:ff:ff:ff:ff:ff", `Its own MAC — it ARPs for 172.16.5.9`].sort(() => Math.random() - .5),
      why: `172.16.5.9 is outside 10.1.${b}.0/24, so the host forwards everything to its default gateway. You only ARP for addresses on your own subnet — off-subnet traffic always goes to the gateway's MAC.` };
  },
  () => { // same subnet, no router
    const v = R(2, 9);
    return { q: `10.1.${v}.10/24 pings 10.1.${v}.55/24. What device forwards the packet?`, correct: "No router — same subnet, direct delivery",
      opts: ["No router — same subnet, direct delivery", "The default gateway", "The core switch's Layer-3 engine", "The firewall"].sort(() => Math.random() - .5),
      why: `Both hosts are in 10.1.${v}.0/24. Same-subnet traffic never touches a router — the sender ARPs for the destination directly and the switch forwards the frame.` };
  },
  () => { // VLAN isolation
    const a = R(10, 19), b = a + R(1, 5);
    return { q: `PC-A is on VLAN ${a}, PC-B on VLAN ${b}. Both plug into the same switch. PC-A pings PC-B — result?`, correct: "Fails — inter-VLAN traffic needs a Layer-3 device",
      opts: ["Fails — inter-VLAN traffic needs a Layer-3 device", "Works — same physical switch", "Works if both ports are access ports", "Works, but slowly — half-duplex"].sort(() => Math.random() - .5),
      why: `VLANs are separate broadcast domains. Even on the same switch, VLAN ${a} and VLAN ${b} can't talk without a router (or L3 switch SVI) routing between them.` };
  },
];
function pktGame() {
  const qs = PKT_QS.sort(() => Math.random() - .5).slice(0, 3).map(f => f());
  runQuiz("🛰️ PACKET ROUTING DRILL", "The core router's route table glows. Three packets need a next hop — choose like a router would.", qs);
}

// ---------- AD permission puzzle ----------
const AD_QS = [
  () => ({ q: `User has <b>Allow: Read</b> and <b>Deny: Write</b> on a folder (both explicit). Effective access?`, correct: "Read only — Deny always wins",
    opts: ["Read only — Deny always wins", "Read + Write — Allow wins if listed first", "Full Control — they stack", "None — conflicting entries cancel out"].sort(() => Math.random() - .5),
    why: `In NTFS, an explicit Deny beats every Allow, every time. That's why Deny should be a last resort — it overrides even Full Control granted elsewhere.` }),
  () => ({ q: `Share permission: <b>Full Control</b>. NTFS permission: <b>Read</b>. A user connects over the network. Effective access?`, correct: "Read — the most restrictive of share × NTFS wins",
    opts: ["Read — the most restrictive of share × NTFS wins", "Full Control — share permissions win", "Full Control — NTFS only applies locally", "Read + Write — they average out"].sort(() => Math.random() - .5),
    why: `Over the network, BOTH apply and the most restrictive combination wins. Full Control (share) × Read (NTFS) = Read. Locally, only NTFS applies.` }),
  () => ({ q: `A user is in <b>Sales-Read</b>, and Sales-Read is nested inside <b>Share-Modify</b>. Effective NTFS access?`, correct: "Modify — group memberships accumulate",
    opts: ["Modify — group memberships accumulate", "Read — the first group wins", "Read — nested groups don't pass permissions", "None until re-added directly"].sort(() => Math.random() - .5),
    why: `Permissions from group nesting are cumulative (Allow + Allow = both). Membership of Share-Modify flows through Sales-Read, so the user gets Modify. Deny would be the only exception.` }),
  () => ({ q: `Folder inherits <b>Deny: Write</b> from its parent, but an <b>explicit Allow: Write</b> is set on the folder itself. Effective?`, correct: "Write allowed — explicit beats inherited",
    opts: ["Write allowed — explicit beats inherited", "Write denied — Deny always wins", "Denied — parent settings lock children", "Read only — they cancel out"].sort(() => Math.random() - .5),
    why: `The precedence order: explicit Deny > explicit Allow > inherited Deny > inherited Allow. An explicit Allow on the object overrides a Deny that only arrives via inheritance.` }),
];
function adGame() {
  const qs = AD_QS.sort(() => Math.random() - .5).slice(0, 3).map(f => f());
  runQuiz("🔐 AD PERMISSIONS DRILL", "The domain controller's security tab stares back. Three access puzzles — think like the ACL evaluator.", qs);
}

// inject the new drills into the terminal menu (DOM-level, like the trophy case)
const __origTerminalMenuV58 = (typeof terminalMenu === "function") ? terminalMenu : null;
if (__origTerminalMenuV58) {
  terminalMenu = function () {
    __origTerminalMenuV58.apply(this, arguments);
    const nameEl = document.getElementById("dlg-name");
    const optsEl = document.getElementById("dlg-options");
    if (!nameEl || !optsEl || !nameEl.textContent.includes("ROOT TERMINAL")) return;
    const sib = optsEl.querySelector("button");
    const mk = (label, fn) => {
      const b = document.createElement("button");
      if (sib) b.className = sib.className;
      b.textContent = label; b.onclick = fn;
      optsEl.insertBefore(b, optsEl.lastElementChild); // before "Walk away"
    };
    if (![...optsEl.children].some(b => b.textContent.includes("PACKET ROUTING"))) mk("🛰️ Packet routing drill", pktGame);
    if (![...optsEl.children].some(b => b.textContent.includes("AD PERMISSIONS"))) mk("🔐 AD permissions drill", adGame);
  };
}

// ---------- procurement refresh project ----------
const PROC_STRATS = [
  { id: "replace", icon: "🏗️", name: "Replace All", cost: 500,
    desc: "Forklift refresh: every EOL device swapped this week. Manufacturing loves it; Finance feels it.",
    reps: { Manufacturing: 3, Finance: -2 } },
  { id: "extend", icon: "🩹", name: "Extend Lifecycle", cost: 150,
    desc: "SSD + RAM upgrades, stretch the fleet one more year. Cheap — but the bench stays busy.",
    reps: { Finance: 2, Manufacturing: -2 } },
  { id: "hybrid", icon: "⚖️", name: "Hybrid Refresh", cost: 325,
    desc: "Replace the worst third, upgrade the rest. Nobody ecstatic, nobody furious.",
    reps: { Manufacturing: 1, Finance: 1, Executives: 1 } },
];
function procProject() {
  const s = S;
  if (s.meta.proc) {
    const st = PROC_STRATS.find(x => x.id === s.meta.proc.strategy);
    const left = s.meta.proc.untilDay - s.day;
    return dlg("📦 REFRESH PROJECT", `Strategy: <b>${st.icon} ${st.name}</b> ($${st.cost})<br><br>${left > 0 ? `Rollout in progress — <b>${left} day(s)</b> of effects remaining.` : "Rollout complete. The fleet settles into its new normal."}<br><br><small>One refresh project per run — the budget committee has a long memory.</small>`, [{ t: "Back", f: mgmtConsole }]);
  }
  if (s.day < 4) return dlg("📦 REFRESH PROJECT", `The CFO hasn't opened the capital budget yet. Check back on <b>day 4</b>.`, [{ t: "Back", f: mgmtConsole }]);
  dlg("📦 PLANT HARDWARE REFRESH", `The CFO approved a lifecycle budget line. Three proposals are on the table — pick one. <small>Each department will judge the choice.</small><br><br>Budget: <b>$${s.budget}</b>`,
    PROC_STRATS.map(st => ({
      t: `${st.icon} ${st.name} — $${st.cost}${s.budget < st.cost ? " (can't afford)" : ""}`,
      f: () => {
        if (s.budget < st.cost) return toast("Not enough budget for that proposal!");
        s.budget -= st.cost;
        for (const d in st.reps) s.rep[d] = (s.rep[d] || 0) + st.reps[d];
        s.meta.proc = { strategy: st.id, untilDay: s.day + 4 };
        toast(`📦 ${st.name} approved! Rollout effects for the next 4 days.`, 5200);
        dlg("📦 PROJECT APPROVED", `<b>${st.icon} ${st.name}</b> — PO signed for $${st.cost}.<br><br>${st.desc}<br><br><small>Rep: ${Object.entries(st.reps).map(([d, v]) => `${d} ${v > 0 ? "+" : ""}${v}`).join(" · ")}</small>`,
          [{ t: "Back", f: mgmtConsole }]);
        save();
      }
    })).concat([{ t: "Decide later", f: mgmtConsole }]));
}
// inject into the management console (DOM-level, alongside the trophy case)
const __origMgmtConsoleV58 = (typeof mgmtConsole === "function") ? mgmtConsole : null;
if (__origMgmtConsoleV58) {
  mgmtConsole = function () {
    __origMgmtConsoleV58.apply(this, arguments);
    const nameEl = document.getElementById("dlg-name");
    const optsEl = document.getElementById("dlg-options");
    if (!nameEl || !optsEl || !nameEl.textContent.includes("MANAGEMENT CONSOLE")) return;
    if ([...optsEl.children].some(b => b.textContent.includes("Refresh project"))) return;
    const sib = optsEl.querySelector("button");
    const btn = document.createElement("button");
    if (sib) btn.className = sib.className;
    btn.textContent = "📦 Refresh project";
    btn.onclick = () => procProject();
    optsEl.insertBefore(btn, optsEl.children[Math.max(0, optsEl.children.length - 1)] || null);
  };
}
// rollout effects each morning
const __origSetupDayV58 = setupDay;
setupDay = function () {
  __origSetupDayV58();
  const s = S, p = s && s.meta.proc;
  if (!p || s.day >= p.untilDay) return;
  const isHw = t => t.type && t.type.id === "hw_replace";
  if (p.strategy === "replace" || (p.strategy === "hybrid" && s.day % 2 === 0)) {
    // new fleet (or partial rollout): EOL tickets vanish from the board
    const before = s.tickets.filter(isHw).length;
    if (before) {
      s.tickets = s.tickets.filter(t => !isHw(t));
      s.npcs = s.npcs.filter(t => !isHw(t));
      s.ticketsTotal -= before;
      setTimeout(() => toast(`📦 Refresh rollout: ${before} EOL laptop ticket(s) cleared by the swap crew.`, 4600), 5400);
    }
  } else if (p.strategy === "extend" && Math.random() < .4) {
    // stretched fleet creaks: one extra EOL ticket
    const dept = pick(DEPTS);
    const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
    const type = TICKET_TYPES.find(t => t.id === "hw_replace");
    if (type && pos) {
      const npc = { id: 885, name: pick(NPC_NAMES), dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
        done: false, diagnosed: false, correctDiag: false, pv: 0, ambient: false };
      s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
      setTimeout(() => toast("🩹 The stretched fleet creaks: an extra EOL laptop landed on the board.", 4600), 5400);
    }
  }
};

console.log("%c[TechOps Hero] v5.8 Drills & Deals loaded — packet routing, AD permissions, procurement project.", "color:#f472b6");

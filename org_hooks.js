/* ============================================================
   TECHOPS HERO v5.2 — "Running the Department" (org_hooks.js)
   Loads AFTER office_hooks.js. Adds:
   • Promotion-track perks: scripting (Senior+), delegation (Site Admin+),
     team meetings (Systems Admin+), outage response (Systems Admin+)
   • Incident dependency trees: one Tier-0 root cause cascades into
     downstream tickets — find the lowest common ancestor
   • Home upgrades: apartment gear with permanent run effects
   ============================================================ */
"use strict";

// ---------- helpers ----------
const rankIdx = () => RANKS.indexOf(rank());
const HOME_ITEMS = [
  { id: "gamingpc", icon: "🖥️", name: "Gaming PC", cost: 600, desc: "+10% all XP — ranked ladder grind sharpens the mind" },
  { id: "shelf", icon: "📚", name: "Bookshelf", cost: 400, desc: "+6 starting confidence in every portal battle" },
  { id: "meals", icon: "🍱", name: "Meal Prep Sundays", cost: 350, desc: "start every day -15 stress" },
  { id: "bed", icon: "🛏️", name: "Better Bed", cost: 500, desc: "+10 max HP, permanently — spine alignment is uptime" },
  { id: "bench", icon: "🔧", name: "Tool Bench", cost: 450, desc: "+2 hardware, +2 automation (one-time)" },
];

// ---------- management console (injected into Mike's desk menu) ----------
const __origMikeDeskV52 = (typeof mikeDesk === "function") ? mikeDesk : null;
if (__origMikeDeskV52) {
  const __origDlgV52 = dlg;
  mikeDesk = function () {
    dlg = function (name, text, opts) {
      if (name.includes("MIKE'S DESK")) {
        opts = opts.slice();
        opts.splice(Math.max(0, opts.length - 1), 0, { t: "🏢 Management console", f: mgmtConsole });
      }
      __origDlgV52(name, text, opts);
    };
    try { __origMikeDeskV52(); } finally { dlg = __origDlgV52; }
  };
}
function mgmtConsole() {
  const s = S, idx = rankIdx();
  const rname = rank().name;
  const opts = [];
  // scripting — Senior Technician and up
  if (idx >= 1) opts.push({
    t: `⚡ Run automation script ${s.meta.scriptDay === s.day ? "(used today)" : "— auto-close oldest remote ticket"}`,
    f: () => {
      if (s.meta.scriptDay === s.day) return mgmtConsole();
      const t = s.tickets.find(t => !t.done && !t.ambient && t.type && REMOTE_OK[t.type.id]);
      if (!t) return dlg("⚡ AUTOMATION", "No remote-eligible tickets in the queue. The script sighs and idles.", [{ t: "Back", f: mgmtConsole }]);
      s.meta.scriptDay = s.day;
      advanceClock(15);
      closeDlg();
      toast(`⚡ Your PowerShell sweep chewed through <b>${t.type.label}</b> (${t.dept}) while you watched.`, 3400);
      t.diagnosed = true; t.correctDiag = true; t.autoFixed = true;
      resolveTicket(t); save();
    },
  });
  // delegation — Site Administrator and up
  if (idx >= 2) {
    const freeCrew = COWORKERS.filter(c => !(s.meta.delegated || {})[c.id]);
    opts.push({
      t: `🤝 Delegate a ticket (${freeCrew.length} crew free today)`,
      f: () => {
        if (!freeCrew.length) return dlg("🤝 DELEGATE", "Everyone's already got one. They close theirs at end of day.", [{ t: "Back", f: mgmtConsole }]);
        const open = s.tickets.filter(t => !t.done && !t.ambient && t.type && !t.critical && !t.delegatedTo);
        if (!open.length) return dlg("🤝 DELEGATE", "Nothing safe to hand off (criticals stay with you — accountability).", [{ t: "Back", f: mgmtConsole }]);
        dlg("🤝 DELEGATE — PICK A TICKET", "The crew member closes it by end of day. Your name stays on the SLA, so choose wisely.", open.slice(0, 5).map(t => ({
          t: `${t.type.icon} ${t.type.label} — ${t.dept}`,
          f: () => {
            const c = freeCrew[0];
            s.meta.delegated = s.meta.delegated || {};
            s.meta.delegated[c.id] = t.id; t.delegatedTo = c.id;
            closeDlg();
            toast(`🤝 ${c.name} took <b>${t.type.label}</b>. "On it. Probably."`, 3200);
            save();
          },
        })).concat([{ t: "Back", f: mgmtConsole }]));
      },
    });
  }
  // team meeting — Systems Administrator and up
  if (idx >= 3) opts.push({
    t: `📣 Team standup ${s.meta.meetingDay === s.day ? "(held today)" : "— morale & alignment"}`,
    f: () => {
      if (s.meta.meetingDay === s.day) return mgmtConsole();
      s.meta.meetingDay = s.day;
      advanceClock(10);
      addStress(-15);
      const lowest = Object.keys(s.rep).sort((a, b) => s.rep[a] - s.rep[b])[0];
      s.rep[lowest] = clamp(s.rep[lowest] + 1, 0, 5);
      closeDlg();
      toast(`📣 Standup done. Blockers surfaced, vibes restored. (-15 stress, ${lowest} rep +1)`, 3400);
      save();
    },
  });
  // root-cause theory — visible when an incident tree is active
  const tree = s.meta.tree;
  if (tree && !tree.cracked) {
    const leaves = s.tickets.filter(t => t.treeRoot === tree.root);
    const diagd = leaves.filter(t => t.diagnosed).length;
    const openLeaves = leaves.filter(t => !t.done).length;
    opts.push({
      t: `🧩 ROOT-CAUSE THEORY — ${openLeaves} linked tickets (${diagd} diagnosed)`,
      f: () => {
        if (!diagd) return dlg("🧩 ROOT-CAUSE THEORY", "You need evidence first. Diagnose at least one of the linked tickets, then connect the dots.", [{ t: "Back", f: mgmtConsole }]);
        const others = INCIDENT_TREES.filter(x => x.root !== tree.root).sort(() => Math.random() - .5).slice(0, 3).map(x => x.root);
        const choices = [tree.root, ...others].sort(() => Math.random() - .5);
        dlg("🧩 WHAT'S THE COMMON ANCESTOR?", `The symptoms: ${tree.symptoms}<br><br><small>These tickets look unrelated. They aren't. Name the Tier-0 cause.</small>`, choices.map(c => ({
          t: c,
          f: () => {
            if (c === tree.root) {
              tree.cracked = true;
              s.budget += 150; addXP(15);
              dlg("⚡ ROOT CAUSE IDENTIFIED", `<b>${tree.root}</b> — of course. Every one of those tickets was a leaf on the same tree.<br><br><b>+$150 · +15 XP</b><br><small>${tree.lesson}<br><br>Every remaining linked fix now pays +$25 & +5 XP — you're repairing a system, not swatting symptoms.</small>`,
                [{ t: "Fix it at the source", f: () => { closeDlg(); save(); } }]);
            } else {
              addStress(10);
              dlg("❌ WRONG TREE", `<b>${c}</b> doesn't explain all the symptoms.<br><small>+10 stress. The real cause explains EVERY leaf — check what they share: identity, naming, time, network, or storage?</small>`, [{ t: "Back", f: mgmtConsole }]);
            }
          },
        })));
      },
    });
  }
  opts.push({ t: "🛒 Online shopping — home upgrades", f: homeShop });
  opts.push({ t: "Back to desk", f: mikeDesk });
  const gated = idx === 0 ? `<br><small>Rank: <b>${rname}</b> — reach Senior Technician to unlock scripting, Site Admin to delegate, Systems Admin for standups.</small>` : `<br><small>Rank: <b>${rname}</b></small>`;
  dlg("🏢 MANAGEMENT CONSOLE", `The org chart has your name on it now.${gated}`, opts);
}

// ---------- home upgrades ----------
function homeShop() {
  const s = S;
  s.meta.home = s.meta.home || [];
  const opts = HOME_ITEMS.map(it => {
    const owned = s.meta.home.includes(it.id);
    return {
      t: `${it.icon} ${it.name} — ${owned ? "OWNED ✓" : "$" + it.cost} · ${it.desc}`,
      f: () => {
        if (owned) return homeShop();
        if (s.budget < it.cost) return dlg("🛒 HOME UPGRADES", `"${it.name}" costs $${it.cost}. Budget: $${s.budget}. The cart mocks you.`, [{ t: "Back", f: homeShop }]);
        s.budget -= it.cost;
        s.meta.home.push(it.id);
        if (it.id === "bench") { s.stats.hardware = (s.stats.hardware || 0) + 2; s.stats.automation = (s.stats.automation || 0) + 2; }
        if (it.id === "bed") { s.maxHp += 10; s.hp = clamp(s.hp + 10, 0, s.maxHp); }
        toast(`${it.icon} ${it.name} installed at home. ${it.desc}.`);
        homeShop();
      },
    };
  });
  opts.push({ t: "Back", f: mgmtConsole });
  dlg("🛒 HOME UPGRADES", `Your apartment: your second datacenter.<br>Budget: <b>$${s.budget}</b><br><small>Owned: ${s.meta.home.length ? s.meta.home.map(id => HOME_ITEMS.find(i => i.id === id).icon).join(" ") : "nothing yet — sad echo"}</small>`, opts);
}

// ---------- incident dependency trees: one root, many symptoms ----------
const INCIDENT_TREES = [
  { root: "DC replication failure", leaves: ["ad", "share", "email"], symptoms: `"New password works at Site A but not Site B" · "GPO updates stopped applying" · "Shared drives keep prompting for credentials"`,
    lesson: "Replication lag means directory changes exist on some DCs but not others — anything identity-dependent fails inconsistently across sites." },
  { root: "Internal DNS server down", leaves: ["dns", "email", "share"], symptoms: `"Outlook disconnected" · "RDP works only by IP" · "File servers unreachable by name"`,
    lesson: "When name resolution dies, everything that uses hostnames fails at once — but IP-based access keeps working. That split IS the diagnosis." },
  { root: "Enterprise root certificate expired", leaves: ["cert", "vpn", "wifi"], symptoms: `"Browsers warn the internet is unsafe" · "VPN won't connect" · "Wi-Fi asks for a password it never needed"`,
    lesson: "Browsers, VPN and Wi-Fi all chain-trust the same PKI — one expired root surfaces as a dozen 'unrelated' tickets." },
  { root: "Conditional Access policy misfire", leaves: ["email", "update", "share"], symptoms: `"Outlook prompts endlessly" · "OneDrive stopped syncing" · "Office says it's not activated"`,
    lesson: "A bad CA policy blocks tokens, not apps — every cloud service that needs that token fails while the network looks perfectly healthy." },
  { root: "DHCP scope exhaustion", leaves: ["wifi", "printer", "vlan"], symptoms: `"Phones drop off Wi-Fi" · "Printers disappeared" · "New laptops get 169.254.x.x"`,
    lesson: "When the pool runs dry, new devices self-assign APIPA addresses — they look 'connected' but reach nothing. Check for 169.254 first." },
  { root: "Hypervisor host crash", leaves: ["backup", "share", "slowpc"], symptoms: `"ERP is frozen" · "The file server is gone" · "Backup jobs failed overnight"`,
    lesson: "One dead host takes every VM it ran — SQL, files, licensing, print — so 'unrelated' app outages cluster on the same physical box." },
  { root: "Firewall rule blocks LDAP", leaves: ["ad", "vpn", "printer"], symptoms: `"VPN authentication fails" · "GPO won't apply" · "Domain printers vanished"`,
    lesson: "Block the directory port and every service that authenticates against it fails — while pings pass and the firewall swears it's innocent." },
  { root: "Entra Connect sync stopped", leaves: ["ad", "email", "share"], symptoms: `"The new hire can't log in" · "Password changes don't work online" · "A mailbox is missing"`,
    lesson: "Sync is one-directional and scheduled — on-prem changes simply stop existing in the cloud until the sync resumes." },
  { root: "SAN storage latency spike", leaves: ["slowpc", "backup", "disk"], symptoms: `"Everything is slow" · "SQL crawls" · "Backups overrun their window"`,
    lesson: "Storage latency amplifies upward: the array stalls, VMs freeze, databases crawl, and users report 'the whole internet is slow'." },
  { root: "NTP time drift", leaves: ["vpn", "wifi", "email"], symptoms: `"VPN randomly refuses logins" · "Wi-Fi auth fails" · "Outlook won't connect"`,
    lesson: "Kerberos tolerates ~5 minutes of skew. Drift past that and EVERY authentication protocol fails in ways that blame everything except the clock." },
];
const __origSetupDayV52 = setupDay;
setupDay = function () {
  __origSetupDayV52();
  const s = S; if (!s || !s.map) return;
  // reset daily management uses
  s.meta.delegated = {};
  // home upgrade effects
  const home = s.meta.home || [];
  if (home.includes("meals")) { s.stress = clamp(s.stress - 15, 0, 100); setTimeout(() => toast("🍱 Meal prep pays off — real breakfast. (-15 stress)"), 4200); }
  // incident dependency tree — one root cause, scattered symptoms
  s.meta.tree = null;
  if (s.day >= 2 && Math.random() < .35) {
    const tree = pick(INCIDENT_TREES);
    let spawned = 0;
    for (let i = 0; i < 3; i++) {
      const type = TICKET_TYPES.find(t => t.id === tree.leaves[i % tree.leaves.length]);
      if (!type) continue;
      const dept = pick(DEPTS);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
      const npc = {
        id: 700 + s.day * 10 + i, name: pick(NPC_NAMES), dept, type,
        x: pos.x, y: pos.y, face: "🧑‍💼",
        done: false, interviewed: false, diagnosed: false, correctDiag: false,
        critical: false, pv: R(0, PAL_NPCS.length - 1), treeRoot: tree.root,
      };
      s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
      spawned++;
    }
    if (spawned) {
      s.meta.tree = { root: tree.root, cracked: false };
      setTimeout(() => toast(`📟 Ticket surge — ${spawned} reports across the plant. Something feels... connected. (Diagnose them, then form a 🧩 theory at your desk)`, 4200), 2600);
    }
  }
};

// ---------- delegation resolves at day end ----------
const __origCheckDayEndV52 = checkDayEnd;
checkDayEnd = function (force) {
  const s = S;
  if (s && s.meta && s.meta.delegated && (force || s.ticketsDone >= s.ticketsTotal)) {
    for (const [cid, tid] of Object.entries(s.meta.delegated)) {
      const t = s.tickets.find(x => x.id === tid && !x.done);
      const c = COWORKERS.find(x => x.id === cid);
      if (t && c) {
        t.diagnosed = true; t.correctDiag = true; t.delegatedWin = true;
        resolveTicket(t);
        setTimeout(() => toast(`🤝 ${c.name} closed <b>${t.type.label}</b> as promised. Delegation works.`), 1800);
      }
    }
    s.meta.delegated = {};
  }
  __origCheckDayEndV52(force);
};

// ---------- resolution bonuses: cracked trees pay extra ----------
const __origResolveTicketV52 = resolveTicket;
resolveTicket = function (n) {
  __origResolveTicketV52(n);
  const s = S; if (!s || !n || !n.type) return;
  const tree = s.meta.tree;
  if (n.treeRoot && tree && tree.cracked && n.done) {
    s.budget += 25; addXP(5);
    setTimeout(() => toast(`🧩 Leaf of <b>${tree.root}</b> pruned at the source. (+$25, +5 XP)`), 3900);
  }
};

// ---------- home upgrade passives ----------
const __origAddXPV52 = addXP;
addXP = function (n) {
  const s = S;
  if (s && s.meta && (s.meta.home || []).includes("gamingpc") && n > 0) n = Math.round(n * 1.1);
  __origAddXPV52(n);
};
const __origStartBattleV52 = startBattle;
startBattle = function (portal) {
  __origStartBattleV52(portal);
  const s = S; if (!s || !B || !B.npc) return;
  if ((s.meta.home || []).includes("shelf")) {
    B.confidence = clamp(B.confidence + 6, 0, 100);
    blog("📚 Bookshelf: you read the manual last night. +6 confidence.");
  }
  if (rankIdx() >= 3 && B.npc.incidentDeclared) {
    B.confidence = clamp(B.confidence + 15, 0, 100);
    blog("🎖️ Outage response training: you've run this drill. +15 confidence.");
  }
};

console.log("%c[TechOps Hero] v5.2 Running the Department loaded — promotions, incident trees, home upgrades.", "color:#a78bfa");

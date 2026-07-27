/* ============================================================
   TECHOPS HERO v5.1 — "Home Base" (office_hooks.js)
   Loads AFTER night_hooks.js. Adds:
   • IT Department room (dim, screens on, dashboards, coworkers)
   • Player cubicle (Mike's desk) → remote ticket resolution
   • Server-room terminal → binary + subnetting minigames ($10-15)
   • Marketing corner → marketing points → hats/shirts/pants + mystery box
   • Intern recruitment + funny coworker chatter
   • Educational Tech Notes on every diagnosis
   ============================================================ */
"use strict";

// ---------- new departments & zones ----------
if (!DEPTS.includes("Marketing")) DEPTS.push("Marketing");
const IT_ROOM = { x0: 28, y0: 10, x1: 41, y1: 17 };
const MKT_ROOM = { x0: 2, y0: 16, x1: 13, y1: 22 };
if (!BIOMES.some(b => b.id === "itdept")) {
  BIOMES.push({ id: "itdept", name: "IT DEPARTMENT", ...IT_ROOM, f1: "#232a3e", f2: "#202739", line: "#3fd2ff", props: [] });
  BIOMES.push({ id: "marketing", name: "MARKETING", ...MKT_ROOM, f1: "#7a4a5e", f2: "#734556", line: "#ff9ad5", props: [] });
}
BIOME_OF_DEPT.Marketing = "marketing";

const COWORKERS = [
  { id: "nick", name: "NICK", face: "🧑🏻‍💻", x: 30, y: 13, desk: { x: 30, y: 12 } },
  { id: "amit", name: "AMIT", face: "🧑🏽‍💻", x: 33, y: 13, desk: { x: 33, y: 12 } },
  { id: "brandon", name: "BRANDON", face: "🧑🏼‍💻", x: 36, y: 13, desk: { x: 36, y: 12 } },
  { id: "daniel", name: "DANIEL", face: "🧑🏾‍💻", x: 35, y: 16, desk: { x: 35, y: 15 } },
];
const MIKE_DESK = { x: 31, y: 15 };
const TERMINAL = { x: 30, y: 3 };          // inside the server room
const MKT_KIOSK = { x: 12, y: 20 };
const MAYA = { name: "MAYA", face: "🧑🏻‍🎨", x: 8, y: 19 };

// ---------- carve the rooms into the map each day ----------
const __origSetupDayV51 = setupDay;
setupDay = function () {
  __origSetupDayV51();
  const s = S; if (!s || !s.map) return;
  if (s.rep.Marketing == null) s.rep.Marketing = 1;
  const m = s.map;
  // IT DEPARTMENT — walled room below the server room
  for (let y = IT_ROOM.y0; y <= IT_ROOM.y1; y++) for (let x = IT_ROOM.x0; x <= IT_ROOM.x1; x++) m[y][x] = 0;
  for (let x = IT_ROOM.x0; x <= IT_ROOM.x1; x++) { m[IT_ROOM.y0][x] = 1; m[IT_ROOM.y1][x] = 1; }
  for (let y = IT_ROOM.y0; y <= IT_ROOM.y1; y++) { m[y][IT_ROOM.x0] = 1; m[y][IT_ROOM.x1] = 1; }
  m[IT_ROOM.y1][39] = 0; m[IT_ROOM.y1][40] = 0;                 // door, bottom-right
  for (const c of COWORKERS) { m[c.desk.y][c.desk.x] = 2; m[c.y][c.x] = 0; }
  m[MIKE_DESK.y][MIKE_DESK.x] = 2;                              // your desk
  m[11][39] = 3;                                                // spare rack
  m[11][40] = 8;                                                // water cooler
  m[16][29] = 4;                                                // plant
  // MARKETING corner — walled room, west side
  for (let y = MKT_ROOM.y0; y <= MKT_ROOM.y1; y++) for (let x = MKT_ROOM.x0; x <= MKT_ROOM.x1; x++) m[y][x] = 0;
  for (let x = MKT_ROOM.x0; x <= MKT_ROOM.x1; x++) { m[MKT_ROOM.y0][x] = 1; m[MKT_ROOM.y1][x] = 1; }
  for (let y = MKT_ROOM.y0; y <= MKT_ROOM.y1; y++) { m[y][MKT_ROOM.x0] = 1; m[y][MKT_ROOM.x1] = 1; }
  m[MKT_ROOM.y0][7] = 0; m[MKT_ROOM.y0][8] = 0;                 // door, top-middle
  m[18][4] = 2; m[18][7] = 2; m[18][10] = 2;                    // desks
  m[21][3] = 4; m[21][11] = 10;                                 // plant + sofa
  m[20][12] = 9;                                                // swag kiosk counter
  // server-room terminal — keep its tile clear
  m[TERMINAL.y][TERMINAL.x] = 0;
  // keep night-mode objects off our walls (safety re-scan)
  if (s._nightObjs) {
    const bad = o => m[o.y] && m[o.y][o.x] !== 0;
    for (const arr of [s._nightObjs.ramps, s._nightObjs.shortcuts]) for (const o of arr)
      if (bad(o)) { const p = freeSpot(m); o.x = p.x; o.y = p.y; }
  }
  // interns grind overnight
  s.meta.interns = s.meta.interns || 0;
  if (s.meta.interns > 0 && s.day > (s.meta.internHiredDay || 0)) {
    for (let i = 0; i < s.meta.interns; i++) {
      if (Math.random() < .6) {
        s.budget += 25; addXP(2);
        setTimeout(() => toast(`🧑‍🎓 Your intern closed a password-reset ticket overnight. (+$25, +2 XP)`), 3500 + i * 900);
      }
    }
  }
  s.meta.mktPts = s.meta.mktPts || 0;
  s.meta.outfit = s.meta.outfit || { hat: null, shirt: null, pants: null, bottle: false };
};

// ---------- server-room terminal: binary + subnetting drills ----------
function binExplain(dec) {
  const bits = [];
  let v = dec;
  for (let p = 7; p >= 0; p--) { if (v >= 2 ** p) { bits.push(`2^${p}=${2 ** p}`); v -= 2 ** p; } }
  return `${dec} = ${bits.join(" + ")} → ${dec.toString(2).padStart(8, "0")}`;
}
function binaryGame() {
  const s = S;
  const qs = [];
  for (let i = 0; i < 3; i++) {
    const dec = R(9, 250), toBin = i % 2 === 0;
    const correct = toBin ? dec.toString(2).padStart(8, "0") : String(dec);
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const d = dec + pick([-2, -1, 1, 2, 16, -16, 128, -128]) * R(1, 2);
      if (d > 0 && d < 256) opts.add(toBin ? d.toString(2).padStart(8, "0") : String(d));
    }
    const shown = toBin ? String(dec) : dec.toString(2).padStart(8, "0");
    qs.push({ q: toBin ? `Convert <b>${shown}</b> to 8-bit binary` : `Convert <b>${shown}</b> to decimal`, correct, opts: [...opts].sort(() => Math.random() - .5), why: binExplain(dec) });
  }
  runQuiz("💻 BINARY DRILL", "Root terminal access granted. The firmware speaks in ones and zeros — 3 conversions, no calculator.", qs);
}
const SUBNET_QS = [
  () => { const p = pick([24, 25, 26, 27, 28, 29, 30]); const hosts = 2 ** (32 - p) - 2;
    return { q: `How many <b>usable host addresses</b> in a /${p} network?`, correct: String(hosts),
      opts: [String(hosts), String(hosts + 2), String(2 ** (32 - p - 1) - 2), String(2 ** (32 - p))].sort(() => Math.random() - .5),
      why: `Usable hosts = 2^(32−prefix) − 2. A /${p} leaves ${32 - p} host bits → 2^${32 - p} = ${2 ** (32 - p)} addresses, minus network and broadcast = ${hosts}.` }; },
  () => { const third = R(0, 3) * 64, host = third + R(1, 62);
    return { q: `What is the <b>network address</b> of 192.168.1.${host}/26?`, correct: `192.168.1.${third}`,
      opts: [`192.168.1.${third}`, `192.168.1.0`, `192.168.1.${third + 32}`, `192.168.1.${host - host % 32}`].sort(() => Math.random() - .5),
      why: `A /26 has 64-address blocks (0, 64, 128, 192). ${host} falls in the block starting at ${third}, so the network address is 192.168.1.${third}.` }; },
  () => { const masks = { 24: "255.255.255.0", 25: "255.255.255.128", 26: "255.255.255.192", 27: "255.255.255.224", 28: "255.255.255.240", 29: "255.255.255.248" };
    const p = pick(Object.keys(masks).map(Number));
    const wrongs = Object.values(masks).filter(mm => mm !== masks[p]).sort(() => Math.random() - .5).slice(0, 3);
    return { q: `What is the <b>subnet mask</b> for /${p}?`, correct: masks[p], opts: [masks[p], ...wrongs].sort(() => Math.random() - .5),
      why: `/${p} means ${p} ones in binary. The last octet gets ${p - 24} ones → ${masks[p].split(".")[3]}, so the mask is ${masks[p]}.` }; },
  () => { const p = pick([25, 26, 27]); const n = 2 ** (p - 24);
    return { q: `How many /${p} subnets fit inside one /24?`, correct: String(n),
      opts: [String(n), String(n * 2), String(Math.max(1, n / 2)), "1"].sort(() => Math.random() - .5),
      why: `Each borrowed bit doubles the subnet count. /${p} borrows ${p - 24} bits from the /24 → 2^${p - 24} = ${n} subnets.` }; },
  () => { const base = pick([0, 64, 128, 192]);
    return { q: `For 10.0.0.${base}/26, what is the <b>first usable host</b>?`, correct: `10.0.0.${base + 1}`,
      opts: [`10.0.0.${base + 1}`, `10.0.0.${base}`, `10.0.0.${base + 62}`, `10.0.0.${base + 63}`].sort(() => Math.random() - .5),
      why: `The network address (.${base}) is reserved — the first usable host is always network+1 → 10.0.0.${base + 1}. (Broadcast is .${base + 63}.)` }; },
];
function subnetGame() {
  const qs = SUBNET_QS.sort(() => Math.random() - .5).slice(0, 3).map(f => f());
  runQuiz("🌐 SUBNETTING DRILL", "The core router console hums. Three subnet problems stand between you and a pristine config.", qs);
}
function runQuiz(title, intro, qs) {
  const s = S;
  advanceClock(10);
  let score = 0, i = 0;
  const ask = () => {
    const cur = qs[i];
    dlg(`${title} — Q${i + 1}/3`, `${i === 0 ? intro + "<br><br>" : ""}${cur.q}`, cur.opts.map(o => ({
      t: o,
      f: () => {
        const ok = o === cur.correct;
        if (ok) score++;
        dlg(ok ? "✅ Correct" : "❌ Not quite",
          `<b>Your answer:</b> ${o}<br><b>Correct:</b> ${cur.correct}<br><br>💡 <small>${cur.why}</small>`,
          [{ t: i < 2 ? "Next question →" : "Finish", f: () => { i++; if (i < 3) ask(); else finish(); } }]);
      },
    })));
  };
  const finish = () => {
    if (score === 3) {
      const pay = R(10, 15);
      s.budget += pay; addXP(4);
      dlg("🏆 PERFECT RUN", `Flawless. The terminal prints a voucher.<br><br><b>+$${pay} · +4 XP</b><br><small>Skills like this are why the server room respects you.</small>`, [{ t: "Log off", f: () => { closeDlg(); save(); } }]);
    } else if (score === 2) {
      s.budget += 5;
      dlg("🟡 CLOSE", `2/3 — solid, but the terminal only pays out for perfection.<br><br><b>+$5 consolation</b>`, [{ t: "Log off", f: () => { closeDlg(); save(); } }]);
    } else {
      addStress(3);
      dlg("🔴 RUN FAILED", `${score}/3. The terminal buzzes disapprovingly.<br><small>Review the explanations and try again — reps make network engineers. (+3 stress)</small>`, [{ t: "Log off", f: () => { closeDlg(); save(); } }]);
    }
    checkAch();
  };
  ask();
}
function terminalMenu() {
  dlg("🖥️ ROOT TERMINAL", "Fans roar. Cold air. A lone terminal glows between the racks.<br><br><small>Drills cost 10 min. A perfect run pays <b>$10–15</b>.</small>", [
    { t: "💻 Binary conversion drill", f: binaryGame },
    { t: "🌐 Subnetting drill", f: subnetGame },
    { t: "Walk away", f: closeDlg },
  ]);
}

// ---------- Mike's desk: log in & resolve tickets remotely ----------
// What a tech can genuinely fix without touching the machine:
const REMOTE_OK = {
  ad: "unlock via ADUC / check 4740 remotely", email: "Exchange admin center & OWA tests",
  vpn: "VPN gateway console & cert renewal", dns: "DNS manager — fix records & flush",
  malware: "EDR console — isolate & trigger scan", share: "fix NTFS/share perms from the file server",
  backup: "rerun the job from the backup console", disk: "remote cleanup & quota via RMM",
  update: "kick the update via WSUS/RMM", slowpc: "remote in, kill the runaway process",
  cert: "renew via the PKI/CA console", vlan: "switch config change over SSH",
};
const REMOTE_NO = {
  printer: "someone has to physically clear it", bsod: "needs hands on the crashing machine",
  plc: "plant-floor gear — no remote access by policy", wifi: "requires an on-site RF survey",
  shadow: "nobody remotes into THAT",
};
function mikeDesk() {
  const s = S;
  const open = s.tickets.filter(t => !t.done && !t.ambient && t.type);
  if (!open.length) return dlg("🖥️ MIKE'S DESK", "You log in. Dual monitors bloom to life.<br><br>The queue is <b>empty</b>. A rare, beautiful thing.", [{ t: "Bask in it", f: closeDlg }]);
  const opts = open.slice(0, 6).map(t => {
    const ok = REMOTE_OK[t.type.id];
    return {
      t: `${ok ? "🟢" : "🔴"} ${t.type.icon} ${t.type.label} — ${t.dept}${t.diagnosed ? "" : " (undiagnosed)"}`,
      f: () => ok ? remoteFix(t) : dlg("🔴 HANDS-ON ONLY", `<b>${t.type.label}</b> can't be fixed from a chair — ${REMOTE_NO[t.type.id] || "it needs a site visit"}.<br><small>Real helpdesk rule: know which tickets are desk work and which are shoe leather.</small>`, [{ t: "Back", f: mikeDesk }]),
    };
  });
  opts.push({ t: "Log off", f: closeDlg });
  dlg("🖥️ MIKE'S DESK — REMOTE SESSION", `You log in. RMM, ADUC, Exchange admin, DNS manager — all one alt-tab away.<br><br><small>🟢 remote-fixable · 🔴 needs a site visit · Each attempt: 10 min</small>`, opts);
}
function remoteFix(t) {
  const s = S;
  advanceClock(10);
  const mastery = (s.meta.mastery || {})[t.type.id] || 0;
  // undiagnosed? run remote diagnostics first — experience fills in for shoe leather
  if (!t.diagnosed) {
    const diagChance = .55 + Math.min(.3, mastery * .04) + (s.meta.kb && s.meta.kb[t.type.id] ? .1 : 0);
    if (Math.random() > diagChance) {
      addStress(5);
      return dlg("🔎 REMOTE DIAGNOSTICS", `You poke at ${t.type.label} through the RMM… logs are ambiguous. You can't tell what's wrong from here.<br><br><small>+5 stress. Go interview the user on-site — or level your mastery of this ticket type.</small>`, [{ t: "Back to queue", f: mikeDesk }]);
    }
    t.diagnosed = true; t.correctDiag = true;
    toast(`🔎 Remote diagnostics nailed it: <b>${t.type.diag.best}</b>`);
  }
  // apply the fix — 85% base, mastery and knowledge base help
  const fixChance = Math.min(.97, .85 + mastery * .02 + (s.meta.kb && s.meta.kb[t.type.id] ? .05 : 0));
  if (Math.random() < fixChance) {
    t.remoteFixed = true; t.correctDiag = true;
    closeDlg();
    toast(`🛰️ REMOTE FIX — ${REMOTE_OK[t.type.id]}. No walking required.`, 3000);
    resolveTicket(t);
    save();
  } else {
    addStress(8);
    dlg("⚠️ SESSION DROPPED", `The remote session to ${t.dept} froze mid-fix. Of course it did.<br><br><small>+8 stress. The ticket is still open — try again or go on-site.</small>`, [{ t: "Back to queue", f: mikeDesk }]);
  }
}

// ---------- coworkers: funny lines + intern hiring ----------
function coworkerLines(c) {
  const s = S, ch = s.chaos ? s.chaos.name : "a normal day";
  const open = s.tickets.filter(t => !t.done).length;
  const base = [
    `"Did you see the ticket queue? ${open} open. I stopped counting at ${open}."`,
    `"The coffee machine in the break room has a higher uptime than our print server."`,
    `"Keep calm and reboot. It's on the poster for a reason."`,
    `"Marketing asked if the Wi-Fi 'runs out' at the end of the month."`,
    `"Someone in Finance laminated their password. LAMINATED."`,
    `"The server room AC is set to 'meat locker' and honestly? Perfect."`,
    `"I don't make the tickets. I just close them and cry."`,
    `"If one more person says 'it worked yesterday' I'm moving into the server room."`,
    `"Today's vibe: ${ch}. Management calls it 'dynamic'. I call it Tuesday."`,
    `"I automated my lunch order. If only ticket triage was that easy."`,
    `"The intern asked if 'the cloud' comes down when it rains. I said maybe."`,
    `" palan0? Never heard of it. Definitely not written in the old rack logs. Nope."`,
  ];
  if (s.meta.legendaries > 0) base.push(`"You found a LEGENDARY item? I've been here six years and found a stapler."`);
  if (s.meta.debt >= 5) base.push(`"Tech debt's at ${s.meta.debt}. We're one reboot away from a documentary about us."`);
  if (s.meta.mktPts >= 10) base.push(`"Marketing keeps talking about you. They made a mood board. It's unsettling."`);
  return base;
}
function coworkerTalk(c) {
  const s = S;
  const opts = [];
  if (c.id === "daniel") {
    const canHire = (s.meta.interns || 0) < 2 && !(s.meta.internHiredDay === s.day);
    opts.push({
      t: canHire ? "🧑‍🎓 \"Send me an intern\" ($120 signing)" : `🧑‍🎓 Interns: ${s.meta.interns || 0}/2${s.meta.internHiredDay === s.day ? " (hired today)" : ""}`,
      f: () => {
        if (!canHire) return coworkerTalk(c);
        if (s.budget < 120) return dlg("DANIEL", `"Interns cost \$120 to onboard — HR paperwork, badge, a chair. Come back with budget."`, [{ t: "Back", f: () => coworkerTalk(c) }]);
        s.budget -= 120; s.meta.interns = (s.meta.interns || 0) + 1; s.meta.internHiredDay = s.day;
        dlg("🧑‍🎓 INTERN ONBOARDED", `Daniel grins. "Fresh meat. I'll teach them the sacred arts: cable management and blaming DNS."<br><br><b>Intern ${s.meta.interns}/2</b> — each morning there's a 60% chance they close a small ticket overnight (+$25, +2 XP).`, [{ t: "Excellent.", f: () => { closeDlg(); save(); } }]);
      },
    });
  }
  opts.push({ t: "💬 Chat", f: () => dlg(c.name, pick(coworkerLines(c)), [{ t: "Ha.", f: () => coworkerTalk(c) }, { t: "Back to work", f: closeDlg }]) });
  opts.push({ t: "Leave", f: closeDlg });
  const deskNote = c.id === "amit" ? `<br><small>Amit's mug says "</>". Of course it does.</small>` :
    c.id === "brandon" ? `<br><small>Brandon has a Pokéball banner. He will mention it.</small>` :
    c.id === "nick" ? `<br><small>Nick's plant is the only thing thriving in this room.</small>` :
    `<br><small>Daniel runs the intern program. Allegedly it's "mentorship".</small>`;
  dlg(`${c.face} ${c.name} — IT DEPT`, `Screens glow. Keyboards clack.${deskNote}`, opts);
}

// ---------- marketing: points → swag shop ----------
const MKT_ITEMS = [
  { id: "cap", slot: "hat", icon: "🧢", name: "AeroTech Cap", cost: 4 },
  { id: "hardhat", slot: "hat", icon: "⛑️", name: "Hard Hat of Uptime", cost: 6 },
  { id: "fedora", slot: "hat", icon: "🎩", name: "CTO Fedora", cost: 8 },
  { id: "tee", slot: "shirt", icon: "👕", name: "\"Have You Tried Rebooting?\" Tee", cost: 5 },
  { id: "vest", slot: "shirt", icon: "🦺", name: "Hi-Vis Sysadmin Vest", cost: 7 },
  { id: "cargo", slot: "pants", icon: "👖", name: "Cargo Pants of Holding", cost: 5 },
  { id: "shorts", slot: "pants", icon: "🩳", name: "Deploy-Friday Shorts", cost: 9 },
  { id: "bottle", slot: "bottle", icon: "🍶", name: "Branded Water Bottle", cost: 0, mystery: true },
];
function mktShop() {
  const s = S, pts = s.meta.mktPts || 0;
  const owned = s.meta.swag = s.meta.swag || [];
  const outfit = s.meta.outfit;
  const opts = [];
  for (const it of MKT_ITEMS.filter(i => !i.mystery)) {
    const has = owned.includes(it.id), on = outfit[it.slot] === it.id;
    opts.push({
      t: `${it.icon} ${it.name} — ${has ? (on ? "EQUIPPED ✓" : "owned · equip") : it.cost + " pts"}`,
      f: () => {
        if (!has) {
          if (pts < it.cost) return dlg("MAYA — MARKETING", `"Not enough marketing points, bestie. Help us out and the swag flows." (${pts} pts)`, [{ t: "Back", f: mktShop }]);
          s.meta.mktPts -= it.cost; owned.push(it.id);
          toast(`${it.icon} Unlocked: ${it.name}!`);
        }
        outfit[it.slot] = outfit[it.slot] === it.id ? null : it.id;
        mktShop();
      },
    });
  }
  opts.push({
    t: `🎁 Mystery Box — 10 pts${outfit.bottle ? " · 🍶 bottle equipped ✓" : owned.includes("bottle") ? " · 🍶 owned · equip below" : ""}`,
    f: () => {
      if (pts < 10) return dlg("🎁 MYSTERY BOX", `"Ten points. Them's the rules." (${pts} pts)`, [{ t: "Back", f: mktShop }]);
      s.meta.mktPts -= 10;
      const unowned = MKT_ITEMS.filter(i => !owned.includes(i.id));
      if (Math.random() < .4 && !owned.includes("bottle")) {
        owned.push("bottle");
        dlg("🎁 MYSTERY BOX", `The box whirs… confetti…<br><br><b>🍶 BRANDED WATER BOTTLE!</b><br><small>"AeroTech: Hydrate. Troubleshoot. Repeat."<br>Equip it — every ticket you close earns <b>+1 bonus reputation</b> with that department.</small>`,
          [{ t: "Equip it now", f: () => { outfit.bottle = true; mktShop(); } }, { t: "Later", f: mktShop }]);
      } else if (unowned.length) {
        const it = pick(unowned.filter(i => !i.mystery).concat(unowned.filter(i => i.mystery)));
        owned.push(it.id);
        dlg("🎁 MYSTERY BOX", `The box whirs…<br><br><b>${it.icon} ${it.name}!</b> Added to your wardrobe.`, [{ t: "Nice.", f: mktShop }]);
      } else {
        s.meta.mktPts += 6;
        dlg("🎁 MYSTERY BOX", `You already own everything! Maya converts the box into <b>6 points</b> of store credit and a sticker.`, [{ t: "Fair trade.", f: mktShop }]);
      }
      save();
    },
  });
  if (owned.includes("bottle")) opts.push({
    t: `${outfit.bottle ? "🍶 Unequip water bottle" : "🍶 Equip water bottle (+rep/ticket)"}`,
    f: () => { outfit.bottle = !outfit.bottle; mktShop(); },
  });
  opts.push({ t: "Leave", f: closeDlg });
  dlg("🎨 MAYA — MARKETING SWAG SHOP", `"IT!! Our favorite department. You help us, we dress you. That's the deal."<br><br>⭐ Marketing points: <b>${pts}</b><br><small>Earn +2 per Marketing ticket closed (+1 more with a correct diagnosis). Equip one item per slot.</small>`, opts);
}

// ---------- marketing points & bottle rep bonus on every close ----------
const __origResolveTicketV51 = resolveTicket;
resolveTicket = function (n) {
  __origResolveTicketV51(n);
  const s = S; if (!s || !n || !n.type) return;
  if (n.dept === "Marketing") {
    const pts = 2 + (n.correctDiag ? 1 : 0);
    s.meta.mktPts = (s.meta.mktPts || 0) + pts;
    setTimeout(() => toast(`🎨 Marketing noticed! <b>+${pts} marketing points</b> (${s.meta.mktPts} total)`), 3200);
  }
  if (s.meta.outfit && s.meta.outfit.bottle && n.dept) {
    s.rep[n.dept] = clamp((s.rep[n.dept] || 0) + 1, 0, 5);
    setTimeout(() => toast(`🍶 The branded bottle gleams. ${n.dept} rep +1 (${s.rep[n.dept]}/5)`), 3600);
  }
};

// ---------- educational tech notes on every diagnosis ----------
const TECH_NOTES = {
  printer: "The print spooler (spoolsv.exe) queues every job — one corrupt job jams the whole line. Restarting it clears the jam. Reinstalling drivers treats a queue problem like a software problem: the classic time-sink.",
  vpn: "Tunnels fail at the crypto/transport layer most often: expired certs, or IKE/ESP (UDP 500/4500) blocked upstream. Re-entering credentials only fixes auth failures — which log differently.",
  dns: "If 8.8.8.8 answers pings but names don't resolve, the network is fine — the name layer is broken. Flush cache, fix the record. Rebooting switches treats a Layer-7 problem at Layer 2.",
  ad: "Event 4740 on the PDC emulator names the lockout source — usually a phone or mapped drive with a stale password hammering auth. Resetting the password without finding the source just re-locks the account.",
  malware: "Isolate FIRST. Every minute an infected host stays on the LAN risks lateral movement and C2 callbacks. Scanning while connected lets the malware phone home mid-scan.",
  email: "Split the problem in half: if OWA works in a browser, the server is healthy and it's the client profile. Testing OWA before recreating profiles saves an hour of re-downloading mailboxes.",
  bsod: "The minidump (C:\\Windows\\Minidump) records the stop code and faulting driver — WinDbg's !analyze -v names the culprit. Shotgun driver updates can introduce brand-new crashes.",
  plc: "PLCs run deterministic scan cycles — 'offline' usually means the fieldbus dropped, not the program. And never sudo anything on plant gear; a watchdog reset mid-cycle can fault a production line.",
  wifi: "Dead zones are physics, not config: check channel overlap and AP placement with a survey before touching settings. Rebooting the AP fixes interference the same way turning a flashlight off fixes fog.",
  cert: "Certificates expire on schedule — check expiry before anything else. Browsers, VPNs and Wi-Fi all chain-trust the same PKI, so one expired root surfaces as a dozen 'unrelated' tickets.",
  disk: "A full disk breaks logs, updates, and temp files at once — that's why everything degrades together. WinSxS, old update caches, and shadow copies are the usual hogs.",
  update: "A stuck update is almost always the servicing stack (SoftwareDistribution catroot2), not the patch itself. Reset those folders and the queue flows again.",
  share: "'Access denied' = effective permissions. Share perms AND NTFS perms both apply; the most restrictive wins. Group membership changes need a re-login to take effect.",
  vlan: "A port on the wrong VLAN gets a valid link light and a useless network — it looks exactly like 'no internet'. Check the switch config before touching the PC.",
  backup: "Failed backups are usually capacity or credentials, not the backup engine. Check target free space and the service account's expiry first.",
  slowpc: "Slow is a symptom, not a cause: check for a runaway process, a dying disk (SMART), or 47 Chrome tabs. RAM upgrades don't fix a process eating 99% CPU.",
  shadow: "Unknown processes get traced, not killed — killing a root process blinds you to where it came from.",
};
const __origConcludeV51 = (typeof conclude === "function") ? conclude : null;
if (__origConcludeV51) {
  const __origDlgV51 = dlg;
  conclude = function (n) {
    const note = TECH_NOTES[n.type.id];
    dlg = function (name, text, opts) {
      const wrapped = opts.map(o => ({
        t: o.t,
        f: () => { o.f(); if (note) setTimeout(() => toast(`💡 <b>Tech note:</b> ${note}`, 6500), 900); },
      }));
      __origDlgV51(name, text, wrapped);
    };
    try { __origConcludeV51(n); } finally { dlg = __origDlgV51; }
  };
}

// ---------- interaction routing ----------
const __origInteractV51 = interact;
interact = function () {
  const s = S;
  if (s && !s.nightMode && !s.inDialog && !s.inBattle && !panelOpen && !eodOpen) {
    const p = { x: s.px, y: s.py };
    if (adjacent(p, TERMINAL) && zoneAt(p.x, p.y) === "server") return terminalMenu();
    if (adjacent(p, MIKE_DESK)) return mikeDesk();
    if (adjacent(p, MKT_KIOSK) || adjacent(p, MAYA)) return mktShop();
    const cw = COWORKERS.find(c => adjacent(p, c));
    if (cw) return coworkerTalk(cw);
  }
  __origInteractV51();
};

// ---------- rendering: dim IT room, glowing screens, dashboards, crew ----------
const __origDrawV51 = draw;
draw = function () {
  __origDrawV51.apply(this, arguments);
  const s = S;
  if (!s || s.nightMode || !s.map) return;
  const tm = performance.now();
  const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  // only spend cycles when a room is on screen
  const vis = (X, Y) => X > camX - 96 && X < camX + cv.width + 96 && Y > camY - 96 && Y < camY + cv.height + 96;
  // the base draw restores its camera transform — re-enter world space
  const ts = cv.height / 14, sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  ctx.textBaseline = "middle";
  if (vis(IT_ROOM.x0 * TILE, IT_ROOM.y0 * TILE) || vis(IT_ROOM.x1 * TILE, IT_ROOM.y1 * TILE)) {
    // dim the whole room — the IT dept runs on monitor light
    ctx.fillStyle = "rgba(8,10,26,0.42)";
    ctx.fillRect(IT_ROOM.x0 * TILE, IT_ROOM.y0 * TILE, (IT_ROOM.x1 - IT_ROOM.x0 + 1) * TILE, (IT_ROOM.y1 - IT_ROOM.y0 + 1) * TILE);
    // glowing screens on every desk
    const desks = COWORKERS.map(c => c.desk).concat([MIKE_DESK]);
    desks.forEach((d, i) => {
      const flick = .55 + .35 * Math.sin(tm / 300 + i * 1.7);
      ctx.fillStyle = `rgba(64,220,255,${flick})`;
      ctx.fillRect(d.x * TILE + 11, d.y * TILE + 4, 10, 7);
      ctx.fillStyle = `rgba(64,220,255,${flick * .25})`;
      ctx.fillRect(d.x * TILE + 6, d.y * TILE, 20, 16);
    });
    // wall sign
    ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
    ctx.fillStyle = "#0a0c18"; ctx.fillRect(30 * TILE - 2, 10 * TILE + 2, 90, 13);
    ctx.fillStyle = "#3fd2ff"; ctx.fillText("IT DEPARTMENT", 30 * TILE, 10 * TILE + 12);
    // ticket dashboard — live little wall chart
    const dx = 33 * TILE, dy = 10 * TILE;
    ctx.fillStyle = "#0d1226"; ctx.fillRect(dx, dy + 2, 88, 26);
    ctx.strokeStyle = "#3fd2ff"; ctx.strokeRect(dx + .5, dy + 2.5, 87, 25);
    const open = s.tickets ? s.tickets.filter(t => !t.done).length : 0;
    ctx.fillStyle = "#ff5a6a"; ctx.font = "bold 9px monospace";
    ctx.fillText(`TICKETS: ${open}`, dx + 4, dy + 12);
    for (let i = 0; i < 6; i++) {
      const h = 3 + ((Math.floor(tm / 800) + i * 3) % 9);
      ctx.fillStyle = i < 3 ? "#3fd2ff" : "#7CFC00";
      ctx.fillRect(dx + 62 + i * 4, dy + 24 - h, 3, h);
    }
    // KEEP CALM poster
    ctx.font = "8px monospace"; ctx.fillStyle = "#9adfff";
    ctx.fillText("KEEP CALM", 37.2 * TILE, 10 * TILE + 9);
    ctx.fillText("& REBOOT", 37.2 * TILE, 10 * TILE + 18);
    // the crew + nameplates
    ctx.textAlign = "center";
    for (const c of COWORKERS) {
      ctx.font = "22px serif"; ctx.fillText(c.face, c.x * TILE + 16, c.y * TILE + 22);
      ctx.font = "bold 7px monospace"; ctx.fillStyle = "#3fd2ff";
      ctx.fillText(c.name, c.x * TILE + 16, c.y * TILE + 31);
    }
    ctx.font = "22px serif"; ctx.fillText("🖥️", MIKE_DESK.x * TILE + 16, MIKE_DESK.y * TILE + 17);
    ctx.font = "bold 7px monospace"; ctx.fillStyle = "#8ab8ff";
    ctx.fillText("MIKE (YOU)", MIKE_DESK.x * TILE + 16, MIKE_DESK.y * TILE + 31);
    ctx.textAlign = "left";
  }
  // server-room terminal marker
  if (vis(TERMINAL.x * TILE, TERMINAL.y * TILE)) {
    ctx.font = "20px serif"; ctx.textAlign = "center";
    ctx.fillText("🖥️", TERMINAL.x * TILE + 16, TERMINAL.y * TILE + 20);
    if (Math.floor(tm / 600) % 2) { ctx.font = "9px monospace"; ctx.fillStyle = "#7CFC00"; ctx.fillText("$", TERMINAL.x * TILE + 26, TERMINAL.y * TILE + 8); }
    ctx.textAlign = "left";
  }
  // marketing corner dressing
  if (vis(MKT_ROOM.x0 * TILE, MKT_ROOM.y0 * TILE) || vis(MKT_ROOM.x1 * TILE, MKT_ROOM.y1 * TILE)) {
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#2a0f1c"; ctx.fillRect(3 * TILE, 16 * TILE - 4, 78, 12);
    ctx.fillStyle = "#ff9ad5"; ctx.fillText("MARKETING", 3 * TILE + 3, 16 * TILE + 5);
    ctx.textAlign = "center";
    ctx.font = "22px serif"; ctx.fillText(MAYA.face, MAYA.x * TILE + 16, MAYA.y * TILE + 22);
    ctx.font = "bold 7px monospace"; ctx.fillStyle = "#ff9ad5"; ctx.fillText(MAYA.name, MAYA.x * TILE + 16, MAYA.y * TILE + 31);
    ctx.font = "16px serif"; ctx.fillText("🎁", MKT_KIOSK.x * TILE + 16, MKT_KIOSK.y * TILE + 10);
    ctx.textAlign = "left";
  }
  // equipped cosmetics ride on the player
  const o = s.meta.outfit;
  if (o) {
    const X = s.px * TILE + 16, Y = s.py * TILE;
    ctx.textAlign = "center";
    const item = id => MKT_ITEMS.find(i => i.id === id);
    if (o.hat && item(o.hat)) { ctx.font = "16px serif"; ctx.fillText(item(o.hat).icon, X, Y - 4); }
    if (o.shirt && item(o.shirt)) { ctx.font = "13px serif"; ctx.fillText(item(o.shirt).icon, X - 12, Y + 20); }
    if (o.pants && item(o.pants)) { ctx.font = "12px serif"; ctx.fillText(item(o.pants).icon, X, Y + 32); }
    if (o.bottle) { ctx.font = "12px serif"; ctx.fillText("🍶", X + 13, Y + 24); }
    ctx.textAlign = "left";
  }
  ctx.restore();
};

console.log("%c[TechOps Hero] v5.1 Home Base loaded — IT dept, Mike's desk, terminal drills, marketing swag, tech notes.", "color:#3fd2ff");

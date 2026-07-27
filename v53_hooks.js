/* ============================================================
   TECHOPS HERO v5.3 — "Frontline & Lifecycle" (v53_hooks.js)
   Loads AFTER org_hooks.js. Adds:
   • AV / Workplace Tech ticket types (conference rooms, Teams rooms)
   • Hardware lifecycle: repair-vs-replace decisions with device cards
   • Plant-floor hardware: warehouse scanners, label printers
   • VIP support pressure (executives complain UP if ignored)
   • Cinematic incident alerts (screen shake + red banner)
   • Ops Monitor dashboard (network/security/satisfaction/tech-debt)
   ============================================================ */
"use strict";

// ---------- new ticket types (const array is mutable — spawn picks them up naturally) ----------
const V53_TYPES = [
  { id: "av_hdmi", label: "Conference Room 'No Signal'", icon: "📽️", enemy: "Signal Gremlin", eicon: "👾", world: "The Dead Channel", wbg: "#1c1428", stat: "hardware",
    diag: { best: "Check input source, then reseat/replace the HDMI cable", okay: "Test with a known-good laptop and cable", wrong: ["Update the display firmware first", "Reboot the Teams room PC", "Replace the projector lamp", "Reinstall the graphics driver"] } },
  { id: "av_teams", label: "Teams Room Can't Join Meetings", icon: "📹", enemy: "Muted Phantom", eicon: "🎭", world: "The Silent Stage", wbg: "#142028", stat: "windows",
    diag: { best: "Check the room account license & sign-in state", okay: "Reboot the room PC & re-pair USB peripherals", wrong: ["Replace the camera", "Reinstall Teams on the room PC", "Reset the room's network jack", "Factory-reset the touch console"] } },
  { id: "plant_scanner", label: "Warehouse Scanner Down", icon: "🔫", enemy: "Barcode Bandit", eicon: "🤠", world: "The Unscannable Aisle", wbg: "#241c10", stat: "hardware",
    diag: { best: "Re-pair the scanner & check its WiFi roaming profile", okay: "Cold-boot the scanner & test the base station", wrong: ["Replace the scanner battery blindly", "Reflash the scanner firmware", "Restart the WMS server", "Swap the barcode labels"] } },
  { id: "label_printer", label: "Label Printer Stopped (Shipping)", icon: "🏷️", enemy: "Zebra Zapper", eicon: "🦓", world: "The Unlabeled Void", wbg: "#20141c", stat: "hardware",
    diag: { best: "Check the print share & DHCP reservation", okay: "Clear the queue & recalibrate the label sensor", wrong: ["Replace the printhead first", "Reinstall the ZPL driver", "Factory-reset the printer", "Move the printer to another desk"] } },
  { id: "hw_replace", label: "Laptop End-of-Life", icon: "💻", enemy: "Elder Machine", eicon: "🧓", world: "The Warranty Graveyard", wbg: "#181c24", stat: "hardware",
    diag: { best: "Assess age/warranty — repair vs replace decision", okay: "Run hardware diagnostics & battery report", wrong: ["Re-image it and hope", "Add more RAM to a 6-year-old laptop", "Replace the SSD on an expired device", "Tell the user to restart more"] } },
];
for (const t of V53_TYPES) if (!TICKET_TYPES.some(x => x.id === t.id)) TICKET_TYPES.push(t);

// ---------- educational notes + remote rules for the new types ----------
if (typeof TECH_NOTES !== "undefined") {
  TECH_NOTES.av_hdmi = "'No Signal' is almost never the display: it's the chain — cable, input source, dock. Swap the cheapest link first (the cable), then test a known-good source before touching firmware.";
  TECH_NOTES.av_teams = "Teams Rooms run on a licensed resource account — an expired license signs the whole room out, taking camera and mic with it. Peripherals are the second suspect, the OS is the last.";
  TECH_NOTES.plant_scanner = "Warehouse scanners are WiFi clients first: roaming between APs drops their session, and the WMS sees them as dead. Check the RF profile before replacing batteries.";
  TECH_NOTES.label_printer = "Label printers live on DHCP reservations — lose the lease and shipping's print jobs route into the void. The printer reports 'fine'; the network disagrees.";
  TECH_NOTES.hw_replace = "Lifecycle math: repairing a 5-year-old out-of-warranty laptop buys months; replacing buys years. Rule of thumb — never spend more than a third of replacement cost on a device past warranty.";
}
if (typeof REMOTE_NO !== "undefined") {
  REMOTE_NO.av_hdmi = "you have to physically touch the cable chain";
  REMOTE_NO.av_teams = "someone has to be in the room";
  REMOTE_NO.plant_scanner = "it's a handheld in a warehouse";
  REMOTE_NO.label_printer = "labels don't calibrate themselves";
  REMOTE_NO.hw_replace = "it's a lifecycle decision — hands and a PO required";
}

// ---------- two new dependency trees feeding off the new types ----------
if (typeof INCIDENT_TREES !== "undefined") {
  INCIDENT_TREES.push(
    { root: "No AV standards or inventory", leaves: ["av_hdmi", "av_teams", "av_hdmi"], symptoms: `"Boardroom shows No Signal" · "Teams Room offline again" · "Every room has a different remote"`,
      lesson: "Untracked AV fleets drift: every room a different cable, firmware, and config — so failures look random until you see there's no standard to hold them to." },
    { root: "No asset lifecycle management", leaves: ["slowpc", "bsod", "hw_replace"], symptoms: `"Everything takes forever to open" · "Third blue screen this week" · "The CFO's laptop just died"`,
      lesson: "Without lifecycle tracking, every laptop ages into a surprise incident. Slow, crash, dead — the leaves are the same tree: nobody knows how old anything is." },
  );
}

// ---------- cinematic incident alerts ----------
(function injectSevCss() {
  if (document.getElementById("v53-css")) return;
  const st = document.createElement("style");
  st.id = "v53-css";
  st.textContent = `
@keyframes v53shake { 0%,100%{transform:translate(0,0)} 15%{transform:translate(-6px,3px)} 30%{transform:translate(5px,-4px)} 45%{transform:translate(-4px,-3px)} 60%{transform:translate(4px,3px)} 75%{transform:translate(-3px,2px)} }
.v53-shake { animation: v53shake .7s ease-in-out 2; }
#v53-banner { position:absolute; top:18%; left:50%; transform:translateX(-50%); z-index:60; background:linear-gradient(180deg,#3a0a12,#20060a); border:2px solid #ff5a6a; color:#ff8a96; font-family:'Press Start 2P',monospace; font-size:11px; padding:12px 18px; text-align:center; box-shadow:0 0 24px rgba(255,60,80,.6); text-shadow:0 0 8px #ff5a6a; pointer-events:none; }
#v53-banner small { display:block; margin-top:8px; font-size:8px; color:#ffb3bb; }`;
  document.head.appendChild(st);
})();
function sevBanner(title, sub) {
  const wrap = document.getElementById("game-wrap");
  if (wrap) { wrap.classList.remove("v53-shake"); void wrap.offsetWidth; wrap.classList.add("v53-shake"); }
  const old = document.getElementById("v53-banner"); if (old) old.remove();
  const b = document.createElement("div");
  b.id = "v53-banner";
  b.innerHTML = `⚠️ ${title} ⚠️<small>${sub}</small>`;
  (wrap || document.body).appendChild(b);
  setTimeout(() => b.remove(), 5200);
}

// ---------- hardware lifecycle: repair vs replace ----------
const LAPTOP_MODELS = ["Dell Latitude 7420", "Lenovo ThinkPad T14", "HP EliteBook 840", "Dell Precision 3560", "Panasonic Toughbook 55"];
function hwReplaceFlow(n) {
  const s = S;
  if (!n.device) {
    const age = R(2, 6);
    n.device = { model: pick(LAPTOP_MODELS), age, battery: R(38, 95), warranty: age < 4 };
  }
  const d = n.device;
  const repairChance = .92 - d.age * .07;
  const card = `<b>${d.model}</b><br>Age: <b>${d.age} yrs</b> · Warranty: <b>${d.warranty ? "active" : "EXPIRED"}</b> · Battery health: <b>${d.battery}%</b><br><small>Repair: $40, 60 min, ~${Math.round(repairChance * 100)}% success · Replace: $350, 30 min, near-certain</small>`;
  dlg("🔧 LIFECYCLE DECISION", `${n.name}'s laptop is on your bench.<br><br>${card}`, [
    { t: "🔩 Repair it ($40 · 60 min)", f: () => {
      if (s.budget < 40) return dlg("🔩 REPAIR", "No budget for parts. ($40 needed)", [{ t: "Back", f: () => hwReplaceFlow(n) }]);
      s.budget -= 40; advanceClock(60);
      if (Math.random() < repairChance) {
        n.diagnosed = true; n.correctDiag = true; n.repaired = true;
        closeDlg();
        toast(`🔩 Repaired the ${d.model}. ${d.age >= 5 ? "It'll hold... for now. That was lifecycle debt, not a fix." : "Solid fix — plenty of life left."}`, 3400);
        resolveTicket(n); save();
      } else {
        addStress(10);
        dlg("🔩 REPAIR FAILED", `New SSD, new battery — and the mainboard dies on the bench. Classic sunk cost on a ${d.age}-year-old machine out of warranty.<br><br><small>+10 stress. The ticket is still open — replace it or try again.</small>`,
          [{ t: "Back to the bench", f: () => hwReplaceFlow(n) }]);
      }
    } },
    { t: "📦 Replace it ($350 · 30 min)", f: () => {
      if (s.budget < 350) return dlg("📦 REPLACE", "Procurement needs $350. Budget's short.", [{ t: "Back", f: () => hwReplaceFlow(n) }]);
      s.budget -= 350; advanceClock(30);
      n.diagnosed = true; n.correctDiag = true; n.replaced = true;
      closeDlg();
      toast(`📦 New ${pick(LAPTOP_MODELS)} imaged and deployed. ${n.dept} is delighted.`);
      if (d.age >= 4 && !d.warranty) setTimeout(() => toast(`💡 <b>Lifecycle note:</b> replacing a ${d.age}-yr-old out-of-warranty machine was the right call — repair would've been a gamble.`, 6000), 3200);
      resolveTicket(n); save();
    } },
    { t: "Step away", f: closeDlg },
  ]);
}
const __origDiagnoseV53 = diagnose;
diagnose = function (n) {
  if (n && n.type && n.type.id === "hw_replace") return hwReplaceFlow(n);
  __origDiagnoseV53(n);
};

// ---------- VIP support: executives escalate UP when ignored ----------
const __origSetupDayV53 = setupDay;
setupDay = function () {
  __origSetupDayV53();
  const s = S; if (!s || !s.map) return;
  for (const t of s.tickets) {
    if (!t.done && t.dept === "Executives" && t.type) t.vip = true;
  }
  // cinematic alert when an incident tree spawns
  if (s.meta.tree && !s.meta.tree.cinematic) {
    s.meta.tree.cinematic = true;
    const t = INCIDENT_TREES.find(x => x.root === s.meta.tree.root);
    setTimeout(() => sevBanner("ANOMALY DETECTED", t ? t.root.toUpperCase() : "UNKNOWN"), 1200);
  }
};
const __origResolveTicketV53 = resolveTicket;
resolveTicket = function (n) {
  __origResolveTicketV53(n);
  const s = S; if (!s || !n || !n.type || !n.done) return;
  if (n.vip) {
    s.rep.Executives = clamp((s.rep.Executives || 0) + 1, 0, 5);
    s.budget += 40;
    setTimeout(() => toast(`⭐ VIP handled well — the ${n.name} tells the CIO you're "the one who gets it." (+$40, Exec rep +1)`), 4100);
  }
};
const __origCheckDayEndV53 = checkDayEnd;
checkDayEnd = function (force) {
  const s = S;
  if (s && (force || s.ticketsDone >= s.ticketsTotal)) {
    const vips = s.tickets.filter(t => t.vip && !t.done);
    for (const v of vips) {
      s.rep.Executives = clamp((s.rep.Executives || 0) - 1, 0, 5);
      addStress(6);
      setTimeout(() => toast(`📉 VIP ticket <b>${v.type.label}</b> was ignored — ${v.name} complained to the CIO. (Exec rep -1, +6 stress)`), 2200);
    }
  }
  __origCheckDayEndV53(force);
};

// ---------- ops monitor: NASA-style dashboard in the management console ----------
function opsMonitor() {
  const s = S;
  const open = s.tickets.filter(t => !t.done && t.type);
  const openNet = open.filter(t => t.type.stat === "networking").length;
  const openSec = open.filter(t => t.type.stat === "security").length;
  const debt = s.meta.debt || 0;
  const reps = Object.values(s.rep);
  const avgRep = reps.length ? reps.reduce((a, b) => a + b, 0) / reps.length : 0;
  const treePenalty = (s.meta.tree && !s.meta.tree.cracked) ? 20 : 0;
  const net = clamp(100 - openNet * 10 - treePenalty, 0, 100);
  const sec = clamp(100 - debt * 6 - openSec * 15, 0, 100);
  const sat = clamp(Math.round(avgRep * 20), 0, 100);
  const td = clamp(debt * 10, 0, 100);
  const bar = v => "█".repeat(Math.round(v / 10)) + "░".repeat(10 - Math.round(v / 10));
  dlg("📊 OPS MONITOR", `<pre style="font-family:monospace;font-size:11px;line-height:1.7;margin:0">NETWORK HEALTH    ${bar(net)} ${net}%\nSECURITY POSTURE  ${bar(sec)} ${sec}%\nUSER SATISFACTION ${bar(sat)} ${sat}%\nTECHNICAL DEBT    ${bar(td)} ${td}%</pre><br><small>${treePenalty ? "⚠️ Unresolved incident tree dragging network health. " : ""}Open tickets: ${open.length} · Tech debt: ${debt} · Day ${s.day}</small>`,
    [{ t: "Back to console", f: mgmtConsole }]);
}
const __origMgmtConsoleV53 = (typeof mgmtConsole === "function") ? mgmtConsole : null;
if (__origMgmtConsoleV53) {
  const __origDlgV53 = dlg;
  mgmtConsole = function () {
    dlg = function (name, text, opts) {
      if (name.includes("MANAGEMENT CONSOLE")) {
        opts = opts.slice();
        opts.splice(Math.max(0, opts.length - 2), 0, { t: "📊 Ops monitor", f: opsMonitor });
      }
      __origDlgV53(name, text, opts);
    };
    try { __origMgmtConsoleV53(); } finally { dlg = __origDlgV53; }
  };
}

console.log("%c[TechOps Hero] v5.3 Frontline & Lifecycle loaded — AV tickets, repair-vs-replace, VIP pressure, cinematics, ops monitor.", "color:#fbbf24");

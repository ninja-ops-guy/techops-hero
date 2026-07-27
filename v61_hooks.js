/* ============================================================
   TECHOPS HERO v6.1 — "Real Users & Real Rituals" (v61_hooks.js)
   Loads AFTER v60_hooks.js. Adds:
   • Realistic ticket presentation — the board shows what the
     USER actually said (symptom) until you diagnose the cause
   • NPC-initiated troubleshooting — ticket holders flag you
     down; engage now or reschedule (they'll wait, patiently)
   • Daily standup — report to Mike in the IT room once a day,
     with the team; options model good communication practice
   ============================================================ */
"use strict";

// ---------- 1. symptom-first presentation ----------
// short user-voice versions of every ticket, shown until diagnosed
const SYMPTOM_LABEL = {
  printer: "Printer won't print",
  vpn: "VPN spins forever",
  dns: "'The internet is down!'",
  ad: "Locked out of account",
  malware: "Pop-ups won a 'cruise'",
  email: "Inbox shows empty",
  bsod: "Blue screens on spreadsheet",
  plc: "Line 3 is down",
  wifi: "Calls drop in east stairwell",
  cert: "Red browser warning on the site",
  disk: "'C: drive full' popup",
  update: "Update stuck at 27%",
  share: "Access Denied on Q: drive",
  vlan: "Laptop gets no IP at desk",
  backup: "Legal needs a restore",
  slowpc: "12-minute boot times",
  shadow: "Terminal typing by itself",
  av_hdmi: "Conference room 'No Signal'",
  av_teams: "Teams Room can't join",
  plant_scanner: "Scanner won't scan",
  label_printer: "Labels won't print (Shipping)",
  hw_replace: "Laptop on its last legs",
};
// the overhead/overlay renderer draws type.label — swap pre-diagnosis labels
// around each draw, then restore (type objects are shared)
const __origDrawV61 = draw;
draw = function () {
  const s = S, swapped = [];
  if (s && s.tickets) {
    for (const t of s.tickets) {
      if (!t.done && !t.diagnosed && SYMPTOM_LABEL[t.type.id] && t.type.label !== SYMPTOM_LABEL[t.type.id]) {
        swapped.push([t.type, t.type.label]);
        t.type.label = SYMPTOM_LABEL[t.type.id];
      }
    }
  }
  try { __origDrawV61.apply(this, arguments); }
  finally { for (const [ty, lbl] of swapped) ty.label = lbl; }
};
// the quest tracker builds its HTML from labels — post-process it the same way
const __origUpdateHUDV61 = updateHUD;
updateHUD = function () {
  const s = S, swapped = [];
  if (s && s.tickets) {
    for (const t of s.tickets) {
      if (!t.done && !t.diagnosed && SYMPTOM_LABEL[t.type.id] && t.type.label !== SYMPTOM_LABEL[t.type.id]) {
        swapped.push([t.type, t.type.label]);
        t.type.label = SYMPTOM_LABEL[t.type.id];
      }
    }
  }
  try { __origUpdateHUDV61.apply(this, arguments); }
  finally { for (const [ty, lbl] of swapped) ty.label = lbl; }
};

// ---------- 2. NPC-initiated troubleshooting ----------
// every so often a nearby ticket-holder flags you down
const V61_FLAG_COOLDOWN = 45;   // in-game minutes before the same NPC asks again
const V61_GLOBAL_GAP = 15;      // in-game minutes between any two flag-downs
const __origStepV61 = step;
step = function (dt) {
  __origStepV61(dt);
  const s = S;
  if (!s || s.nightMode || s.inBattle || s.inDialog || panelOpen || eodOpen) return;
  if (s.clock < 9 * 60 + 20 || s.clock >= 16 * 60) return;
  s.meta._v61NextFlag = s.meta._v61NextFlag || (9 * 60 + 30);
  if (s.clock < s.meta._v61NextFlag) return;
  const n = s.npcs.find(n =>
    !n.ambient && !n.done && n.type && !n.v61SnoozedBattle &&
    Math.abs(n.x - s.px) <= 3 && Math.abs(n.y - s.py) <= 3 &&
    (!n._v61LastFlag || s.clock - n._v61LastFlag >= V61_FLAG_COOLDOWN));
  if (!n) return;
  n._v61LastFlag = s.clock;
  s.meta._v61NextFlag = s.clock + V61_GLOBAL_GAP;
  const symptom = SYMPTOM_LABEL[n.type.id] || n.type.label;
  dlg(`🙋 ${n.name} flags you down`,
    `<i>"Hey — got a minute? ${symptom.toLowerCase().startsWith("'") ? symptom : `It's the ${symptom.toLowerCase()}`}."</i><br><small>Engage now, or ask them to hold — they'll wait, but patience is a resource.</small>`,
    [
      { t: "🔧 Engage now", f: () => { closeDlg(); ticketFlow(n); } },
      { t: "⏰ \"I'll come by — put it in the queue\"", f: () => {
          n._v61LastFlag = s.clock; // cooldown applies
          addStress(-1);
          toast(`⏰ ${n.name} nods. "Thanks for acknowledging it." (-1 stress — being heard matters)`);
          closeDlg();
        } },
    ]);
};

// ---------- 3. daily standup ----------
function standup() {
  const s = S;
  if (s.meta.standupDay === s.day) return dlg("📋 STANDUP", `Already synced today. The board is green-ish.`, [{ t: "Back", f: closeDlg }]);
  s.meta.standupDay = s.day;
  advanceClock(15);
  // Mike references the most urgent open ticket
  const open = s.tickets.filter(t => !t.done && t.type);
  const hot = open.find(t => t.critical) || open.sort((a, b) => (b.age || 0) - (a.age || 0))[0];
  const hotLine = hot
    ? `Mike taps the board: <b>"${hot.critical ? `🚨 «${hot.codename}» — ` : ""}${hot.type.label}"</b> at <b>${hot.dept}</b> ${hot.critical ? "is our top priority — all eyes." : "has been simmering — let's not let it boil."}`
    : `Mike: "Queue's clear. Enjoy the silence — it never lasts."`;
  const team = pick(COWORKERS.map(c => c.name));
  dlg("📋 DAILY STANDUP — IT DEPT",
    `The team circles up in the IT room. Nick brings coffee. Amit has the dashboard up. ${team} waves.<br><br>${hotLine}<br><br>Your turn to report:`,
    [
      { t: "📊 Crisp status: done / doing / blockers", f: () => {
          addXP(6); addStress(-5);
          const d = pick(DEPTS); s.rep[d] = (s.rep[d] || 0) + 1;
          toast(`📊 Clear, short, actionable. The whole room knows the plan now. (+6 XP, -5 stress, +1 ${d} rep)`);
          closeDlg();
        } },
      { t: "🙋 Flag a blocker & ask for help", f: () => {
          addXP(4); addStress(-3);
          if (hot) { hot.standupBoost = true; toast(`🙋 Mike: "Good — blockers belong in the open." ${hot.name}'s ticket gets team eyes (+confidence when you engage). (+4 XP, -3 stress)`); }
          else toast(`🙋 "No blockers reported" — said with confidence. (+4 XP, -3 stress)`);
          closeDlg();
        } },
      { t: "🤝 Offer to pair with a teammate", f: () => {
          addXP(3); addStress(-2);
          s.meta._v61Pair = true;
          toast(`🤝 You take point with ${team}. Knowledge shared is knowledge doubled. (+3 XP, -2 stress)`);
          closeDlg();
        } },
      { t: "😶 Stay quiet and nod", f: () => {
          addStress(2);
          toast(`😶 You say nothing. Mike notices. Standups work when people talk. (+2 stress)`);
          closeDlg();
        } },
    ]);
}
// 09:30 reminder + standup button at Mike's desk
const __origStepStandupV61 = step;
step = function (dt) {
  __origStepStandupV61(dt);
  const s = S;
  if (!s || s.nightMode || s.inBattle || s.inDialog) return;
  if (s.meta.standupDay !== s.day && s.clock >= 9 * 60 + 30 && s.clock < 12 * 60 && !s.meta._v61StandupToast) {
    s.meta._v61StandupToast = true;
    toast("📋 Standup in 5 — head to the IT room and check in with Mike.", 4200);
  }
  if (s.meta.standupDay === s.day) s.meta._v61StandupToast = false;
};
const __origMikeDeskV61 = (typeof mikeDesk === "function") ? mikeDesk : null;
if (__origMikeDeskV61) {
  mikeDesk = function () {
    __origMikeDeskV61.apply(this, arguments);
    const s = S;
    if (!s || s.meta.standupDay === s.day) return;
    const nameEl = document.getElementById("dlg-name");
    const optsEl = document.getElementById("dlg-options");
    if (!nameEl || !optsEl || !nameEl.textContent.includes("MIKE'S DESK")) return;
    if ([...optsEl.children].some(b => b.textContent.includes("Daily standup"))) return;
    const sib = optsEl.querySelector("button");
    const btn = document.createElement("button");
    if (sib) btn.className = sib.className;
    btn.textContent = "📋 Daily standup";
    btn.onclick = () => standup();
    optsEl.insertBefore(btn, optsEl.firstChild || null); // standup is the first thing on the desk
  };
}
// standup-flagged blockers get a confidence head start in battle
const __origStartBattleV61 = startBattle;
startBattle = function (portal) {
  __origStartBattleV61(portal);
  if (B && B.npc && B.npc.standupBoost) {
    B.confidence = Math.min(100, B.confidence + 10);
    B.npc.standupBoost = false;
    blog(`<span class="sys">📋 Standup pays off — the team already talked this one through. +10 confidence.</span>`);
    renderBattle();
  }
};

console.log("%c[TechOps Hero] v6.1 Real Users & Real Rituals loaded — symptom-first tickets, NPC flag-downs, daily standup.", "color:#f472b6");

// ---------- 4. pixel-baroque crest: title screen + command center ----------
(function () {
  if (typeof TO_EMBLEM !== "string") return;
  const injectTitle = () => {
    const logo = document.getElementById("title-logo");
    if (!logo || document.getElementById("v61-emblem")) return;
    const img = document.createElement("img");
    img.id = "v61-emblem";
    img.src = TO_EMBLEM;
    img.alt = "AeroTech crest";
    img.style.cssText = "width:150px;image-rendering:pixelated;filter:drop-shadow(0 0 18px #ffd24a55);margin-bottom:4px";
    logo.prepend(img);
  };
  injectTitle();
  // command center gets the crest as its header seal
  const __origDlgV61 = dlg;
  dlg = function (name, text, opts) {
    if (typeof name === "string" && name.includes("GLOBAL COMMAND CENTER") && !text.includes("v61-cc-seal")) {
      text = `<img class="v61-cc-seal" src="${TO_EMBLEM}" style="float:right;width:64px;image-rendering:pixelated;filter:drop-shadow(0 0 10px #ffd24a66)">` + text;
    }
    __origDlgV61(name, text, opts);
  };
})();

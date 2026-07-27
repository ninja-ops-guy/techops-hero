/* ============================================================
   TECHOPS HERO v5.7 — "After Hours" (v57_hooks.js)
   Loads AFTER v56_hooks.js. Adds:
   • Night maintenance windows — scheduled change work you run
     after the night crawl: prep/execute/validate choices,
     success odds vs pay, rollback fallout if it goes wrong
   • Certification study — the Bookshelf doubles as a study desk:
     +$40 cert discount per study night (once per night)
   ============================================================ */
"use strict";

// ---------- night maintenance windows ----------
const MAINT_JOBS = [
  { name: "CORE-SWITCH firmware upgrade", risk: .30, pay: 220 },
  { name: "Domain controller patching", risk: .25, pay: 180 },
  { name: "SAN firmware update", risk: .35, pay: 260 },
  { name: "Firewall rulebase cleanup", risk: .20, pay: 160 },
  { name: "UPS battery swap", risk: .30, pay: 200 },
  { name: "Wireless controller upgrade", risk: .28, pay: 210 },
];
const STUDY_TIPS = [
  "OSI layer 1 is physical — if the cable's bad, no amount of DNS work helps.",
  "A /26 gives you 62 usable hosts. Subtract network + broadcast, always.",
  "RAID 10 needs 4 disks minimum and survives one loss per mirror pair.",
  "Kerberos hates clock skew — more than 5 minutes and tickets die.",
  "DHCP exhaustion looks exactly like 'the wifi is broken' to users.",
  "DNS TTL: lower it BEFORE the migration, not during the outage.",
  "SFC /scannow fixes system files; DISM fixes the image SFC relies on.",
  "Port 443 is HTTPS, 22 is SSH, 3389 is RDP — the exam will ask.",
];

// schedule windows + handle skipped/failed fallout
const __origSetupDayV57 = setupDay;
setupDay = function () {
  const sPrev = S;
  const skipped = sPrev && sPrev.meta.maint && !sPrev.meta.maint.done && sPrev.meta.maint.day < sPrev.day;
  const failed = sPrev && sPrev.meta.maintFailed;
  __origSetupDayV57();
  const s = S; if (!s || !s.meta) return;
  // skipped yesterday's window → change management noticed
  if (skipped) {
    s.rep.Manufacturing = (s.rep.Manufacturing || 0) - 1;
    setTimeout(() => toast("📋 You skipped last night's change window. Change management noticed (-1 Manufacturing rep).", 4600), 5200);
  }
  // failed window → rollback fallout tickets this morning
  if (failed) {
    s.meta.maintFailed = false;
    for (let i = 0; i < 2; i++) {
      const type = pick(TICKET_TYPES.filter(t => t.id !== "hw_replace"));
      const dept = pick(DEPTS);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
      const npc = { id: 880 + i, name: pick(NPC_NAMES), dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
        done: false, diagnosed: false, correctDiag: false, pv: 0, ambient: false };
      s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
    }
    setTimeout(() => toast("↩️ ROLLBACK FALLOUT: last night's failed change left 2 extra tickets on the board.", 4600), 5600);
  }
  // schedule tonight's window (~30% of days, never day 1)
  if (s.day >= 2 && Math.random() < .30) {
    const j = pick(MAINT_JOBS);
    s.meta.maint = { name: j.name, risk: j.risk, pay: j.pay, day: s.day, done: false, reminded: false };
    setTimeout(() => toast(`🛠️ CHANGE WINDOW tonight: ${j.name}. Run it after the night crawl — pays $${j.pay}+.`, 5200), 4600);
  } else {
    s.meta.maint = null;
  }
};

// 16:00 reminder
const __origStepV57 = step;
step = function (dt) {
  __origStepV57(dt);
  const s = S;
  if (s && s.meta.maint && !s.meta.maint.done && !s.meta.maint.reminded && s.clock >= 16 * 60) {
    s.meta.maint.reminded = true;
    toast(`🛠️ Reminder: change window tonight — ${s.meta.maint.name}. It'll be waiting when you get home.`, 4600);
  }
};

// the change-window flow: 3 decision steps, then the roll
function maintFlow(homeSafe, finish) {
  const s = S, job = s.meta.maint;
  let bonus = 0, succ = 1 - job.risk;
  const step3 = () => {
    dlg("🛠️ STEP 3 — VALIDATE", `Change applied. Prove it works before you sleep.`, [
      { t: "🧪 Full regression tests (+10% success)", f: () => { succ += .10; resolve(); } },
      { t: "👀 Spot check and go to bed (-5 stress)", f: () => { addStress(-5); resolve(); } },
    ]);
  };
  const step2 = () => {
    dlg("🛠️ STEP 2 — EXECUTE", `Maintenance window open. Users are (mostly) offline.`, [
      { t: "📋 Follow the runbook (+15% success)", f: () => { succ += .15; step3(); } },
      { t: "🤠 Wing it from memory (+$50, -12% success)", f: () => { bonus += 50; succ -= .12; step3(); } },
    ]);
  };
  const resolve = () => {
    succ += (((s.stats && s.stats.hardware) || 0) + ((s.stats && s.stats.automation) || 0)) * .01;
    succ = Math.min(.95, succ);
    job.done = true;
    if (Math.random() < succ) {
      const pay = job.pay + bonus;
      s.budget += pay; addXP(18);
      toast(`✅ CHANGE SUCCESSFUL: ${job.name}. +$${pay}, +18 XP. You sleep like a rock.`, 5200);
    } else {
      s.meta.maintFailed = true;
      s.budget = Math.max(0, s.budget - 75); addStress(10);
      toast(`↩️ ROLLBACK! ${job.name} failed validation. -$75, +10 stress — and tomorrow will be busy.`, 5200);
    }
    closeDlg(); finish();
  };
  dlg("🛠️ STEP 1 — PREP", `<b>${job.name}</b><br><br>Base success odds: <b>${Math.round((1 - job.risk) * 100)}%</b> · pays <b>$${job.pay}</b>. Prep is everything.`, [
    { t: "🗄️ Full backup first (+15% success)", f: () => { succ += .15; step2(); } },
    { t: "📸 Snapshot only (+8% success)", f: () => { succ += .08; step2(); } },
    { t: "😎 Skip prep (+$60, risky)", f: () => { bonus += 60; step2(); } },
  ]);
}

// ---------- after-hours menu: maintenance + cert study, then bed ----------
const __origExitNightV57 = exitNight;
exitNight = function (homeSafe) {
  const s = S;
  if (!s || !s.meta) return __origExitNightV57(homeSafe);
  const finish = () => __origExitNightV57(homeSafe);
  const maintPending = s.meta.maint && !s.meta.maint.done && s.meta.maint.day === s.day;
  const canStudy = (s.meta.home || []).includes("shelf") && s.meta.studiedDay !== s.day;
  if (!maintPending && !canStudy) return finish();
  const opts = [];
  if (maintPending) opts.push({ t: `🛠️ Change window: ${s.meta.maint.name}`, f: () => maintFlow(homeSafe, finish) });
  if (canStudy) opts.push({
    t: "📚 Study for certs (+$40 discount, +3 stress)", f: () => {
      s.meta.studiedDay = s.day;
      s.certDiscount = (s.certDiscount || 0) + 40;
      addStress(3); addXP(4);
      toast(`📚 ${pick(STUDY_TIPS)}`, 5600);
      finish();
    }
  });
  opts.push({ t: "😴 Straight to bed", f: finish });
  dlg("🌙 AFTER HOURS", `${homeSafe ? "Home safe." : "You limped home."} The apartment is quiet — but the night isn't quite over.${maintPending ? `<br><br>🛠️ <b>${s.meta.maint.name}</b> is scheduled tonight.` : ""}${canStudy ? `<br><br>📚 Your Bookshelf is stacked with cert guides.` : ""}`, opts);
};

console.log("%c[TechOps Hero] v5.7 After Hours loaded — night maintenance windows, cert study.", "color:#f472b6");

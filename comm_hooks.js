// v4.4 — Communication Battles + IT-department systems.
// Loads AFTER sprite_hooks.js. Hooks in without modifying game.js:
//  - wraps ticketFlow() with a JRPG-style phone-call battle (hidden Patience / Ticket Gauge)
//  - wraps startBattle() to apply call bonuses + knowledge mastery confidence
//  - wraps resolveTicket() for mastery tracking, follow-up chains, and root-cause elimination
//  - wraps setupDay() to seed a hidden root cause behind the day's tickets
//  - users learn: from day 4+, callers arrive having rebooted and pre-submitted tickets

// ---------- department personalities (hidden stats) ----------
const COMM_PATIENCE = { Executives: 3, Sales: 4, Manufacturing: 4, Engineering: 5, Finance: 6, HR: 6 };
const COMM_MOOD = {
  Executives: "😤 Curt — every second costs money",
  Sales: "🔥 Frazzled — everything is 'urgent'",
  Manufacturing: "🔊 Shouting over line noise",
  Engineering: "🧪 Precise — already tried the obvious",
  Finance: "😟 Worried — needs reassurance",
  HR: "🗣️ Chatty — the story has a prelude",
};
const ROOT_CAUSES = ["Switch 14 failing", "a swollen UPS battery", "a shadow DNS server", "a bad patch from Tuesday", "a flaky core transceiver"];

// ---------- Phase 1: the call ----------
const __origTicketFlowV43 = ticketFlow;
ticketFlow = function (n) {
  if (!n || n.done || n.interviewed || n.ambient) return __origTicketFlowV43(n);
  commBattle(n);
};

function commBattle(n) {
  const s = S;
  const rep = s.rep[n.dept] || 0;
  // departments remember: high rep = friendlier callers + better descriptions; low rep = wary
  if (typeof n.patience !== "number") {
    n.patience = (COMM_PATIENCE[n.dept] || 5) + (rep >= 4 ? 1 : 0) - (rep <= 1 ? 1 : 0) + ((n.timesHelped || 0) >= 3 ? 1 : 0);
  }
  const maxPat = n.patience;
  if (typeof n.ticketGauge !== "number") n.ticketGauge = s.day >= 4 ? 2 : 0; // users learn
  n.preConf = n.preConf || 0;
  n.guessed = n.guessed || false;
  const veteran = s.day >= 4;

  const bars = (v, mx) => "▮".repeat(Math.max(0, v)) + "▯".repeat(Math.max(0, mx - v));
  const render = (line) => {
    dlg(`📞 Incoming Call — ${n.name} (${n.dept})`,
      `<small>${COMM_MOOD[n.dept] || "🙂 Calm"}</small><br>` +
      `Patience ${bars(n.patience, maxPat)}<br>Ticket ${bars(n.ticketGauge, 4)}<br><br><i>${line}</i>`,
      [
        { t: "🎫 \"Did you submit a ticket?\"", f: () => act("ask") },
        { t: "💬 Reassure them first", f: () => act("reassure") },
        { t: "🔍 Guess the cause", f: () => act("guess") },
        { t: "😤 \"I need a ticket. Period.\"", f: () => act("demand") },
      ]);
  };
  const finish = (line) => {
    toast("🎫 Ticket created — the real work begins.");
    __origTicketFlowV43(n);
  };
  const complaint = () => {
    addStress(15);
    s.rep[n.dept] = Math.max(0, (s.rep[n.dept] || 0) - 1);
    n.trustHurt = true;
    dlg(`📞 ${n.name} (${n.dept})`, `<i>"So you're refusing to help me? I'm calling your manager."</i><br><br><small>Complaint filed: +15 stress, ${n.dept} reputation −1.</small>`,
      [{ t: "...great.", f: () => __origTicketFlowV43(n) }]);
  };
  const act = (kind) => {
    const noisy = n.dept === "Manufacturing" && (kind === "ask" || kind === "guess") && Math.random() < .25;
    if (kind === "ask") {
      n.ticketGauge += 2;
      if (noisy) { n.patience -= 1; render(`"WHAT? THE LINE IS LOUD. SAY AGAIN?" — misheard, patience frays.`); }
      else render(veteran ? `"Already rebooted AND submitted it. I learn, you know."` : `"Oh… no. How do I even do that?" — you walk them through it.`);
    } else if (kind === "reassure") {
      n.ticketGauge += 1; n.patience = Math.min(maxPat + 1, n.patience + 1);
      render(`"Okay… okay. Thanks. It's just been a morning." — shoulders drop.`);
    } else if (kind === "guess") {
      if (noisy) { n.patience -= 1; render(`"YOU'RE BREAKING UP—" the line noise eats your question.`); }
      else if (n.guessed) { n.ticketGauge += 1; render(`"We already covered that part." — keep it moving.`); }
      else {
        n.guessed = true; n.ticketGauge += 1; n.preConf += rep >= 4 ? 20 : 15; // trusted techs get better clues
        render(n.root
          ? `"Funny you ask — three other desks act up the same way." 🧩 <small>(+15 confidence later — smells like ${n.root})</small>`
          : `"Huh, that actually narrows it down." <small>(+15 confidence when you portal in)</small>`);
      }
    } else if (kind === "demand") {
      n.ticketGauge += 3; n.patience -= 2;
      if (n.patience <= 0) return complaint();
      render(`"...fine. FINE. Submitting it now." — frost on the line.`);
    }
    if (n.ticketGauge >= 4) return finish();
    render(n.patience <= 1 ? `<i>"I'm running out of patience here…"</i>` : pick([
      `"So… can you fix it?"`, `"I have a meeting in ten."`, `"Is this going to take long?"`]));
  };
  render(
    n.trustHurt ? `"You blew me off last time. This better be quick."`
    : (n.timesHelped || 0) >= 3 ? `"You fixed my laptop last month — I trust you. Same gremlin, I think."`
    : veteran ? `"Hey, it's me again — I rebooted first, like you taught us."`
    : `"${pick(["Something's wrong with my computer.", "Nothing works and I changed NOTHING.", "It's broken. I didn't touch it. Ever."])}"`);
}

// ---------- battle bonuses: call prep + knowledge mastery ----------
const __origStartBattleV43 = startBattle;
startBattle = function (portal) {
  __origStartBattleV43(portal);
  if (!B || !B.npc) return;
  const s = S, id = B.t.id;
  const mas = (s.meta.mastery || {})[id] || 0;
  let bonus = B.npc.preConf || 0;
  if (mas >= 5) bonus += 10;
  if (bonus > 0) {
    B.confidence = clamp(B.confidence + bonus, 0, 100);
    if (B.npc.preConf) blog(`📞 Call prep pays off: +${B.npc.preConf} confidence.`);
    if (mas >= 5) blog(`🎓 MASTERED ${B.t.label.toUpperCase()}: you've killed this before. +10 confidence.`);
  }
};

// ---------- resolution: mastery, chains, root causes ----------
const __origResolveTicketV43 = resolveTicket;
resolveTicket = function (n) {
  const wasDone = n.done;
  __origResolveTicketV43(n);
  if (wasDone || !n.done) return;
  const s = S;
  // relationships: users remember who helped them
  n.timesHelped = (n.timesHelped || 0) + 1;
  // knowledge mastery — every solved type makes the next one easier
  s.meta.mastery = s.meta.mastery || {};
  const id = n.type.id;
  s.meta.mastery[id] = (s.meta.mastery[id] || 0) + 1;
  if (s.meta.mastery[id] === 5) toast(`🎓 MASTERED ${n.type.label.toUpperCase()} — future ${n.type.label} battles start +10 confidence.`, 3200);
  // hidden root cause tracking
  if (n.root) {
    s.rootResolved = (s.rootResolved || 0) + 1;
    const total = s.npcs.filter(x => x.root === n.root).length;
    if (s.rootResolved === 2) toast(`🧩 Another one traces back to ${n.root}… something deeper is going on.`, 3200);
    if (total > 1 && s.rootResolved >= total) {
      s.budget += 150;
      s.meta.rootCausesFixed = (s.meta.rootCausesFixed || 0) + 1;
      if (typeof setPose === "function") setPose("victory", 1800);
      toast(`⚡ ROOT CAUSE ELIMINATED: ${n.root} — ${total} tickets, one culprit. (+$150)`, 3600);
      updateHUD();
    }
  }
  // follow-up chains — one issue leads to another
  if (n.isChain) addXP(10);
  else if (!n.legacy && !n.ambient && Math.random() < .18) {
    const cand = s.npcs.find(x => !x.done && !x.ambient && x !== n && !x.critical && !x.isChain);
    if (cand) {
      cand.isChain = true;
      toast(`🔗 FOLLOW-UP: ${n.name}'s ${n.type.label} was a symptom — ${cand.name} (${cand.dept}) just reported the next domino.`, 3400);
    }
  }
  save();
};

// ---------- hidden root cause of the day ----------
const __origSetupDayV43 = setupDay;
setupDay = function () {
  __origSetupDayV43();
  const s = S; if (!s || !s.npcs) return;
  const rc = pick(ROOT_CAUSES);
  const tagged = s.npcs.filter(x => !x.ambient).sort(() => Math.random() - .5).slice(0, 3);
  tagged.forEach(x => { x.root = rc; });
  s.rootResolved = 0;
};

// ---------- v4.4: the troubleshooting process ----------
// diagnose() used to jump straight to "pick the root cause" — a conclusion with no process.
// Now diagnosis is a structured flow: gather information -> eliminate possibilities -> conclude.
// Each step costs 5 minutes, earns +5 battle confidence, and rules out one wrong option.
const __origDiagnoseV44 = diagnose;
diagnose = function (n) { troubleshoot(n); };

const TSHOOT_STEPS = [
  { id: "when", icon: "🗣️", label: "\"When did this start?\"", kind: "eliminate",
    line: (w) => `"Right after the morning login storm…" — timing rules out: <s>${w}</s>` },
  { id: "repro", icon: "🔁", label: "\"Can you reproduce it?\"", kind: "eliminate",
    line: (w) => `"Every single time I try it, yes." — reproducible and local, rules out: <s>${w}</s>` },
  { id: "changed", icon: "📋", label: "\"What changed recently?\"", kind: "confirm",
    line: () => `"There WAS an update pushed last night…" — a lead worth following. (+5 confidence)` },
];

function troubleshoot(n) {
  const s = S, t = n.type;
  // same option pool the stock diagnose() would build (kept stable across steps)
  if (!n._pool) {
    const wrongs = [...t.diag.wrong].sort(() => Math.random() - .5).slice(0, 2);
    n._pool = [
      { text: t.diag.best, kind: "best" },
      { text: t.diag.okay, kind: "okay" },
      ...wrongs.map(w => ({ text: w, kind: "wrong" })),
    ].sort(() => Math.random() - .5);
    n._clues = [];
    n._stepsDone = 0;
    n._stepsUsed = {};
  }
  const pool = n._pool;

  const render = () => {
    const clueLog = n._clues.length ? `<br><br>📋 <b>Findings so far:</b><br>${n._clues.join("<br>")}` : "";
    const wrongLeft = pool.filter(o => o.kind === "wrong" && !o.ruledOut);
    const stepsLeft = TSHOOT_STEPS.filter(st => !n._stepsUsed[st.id] && (st.kind !== "eliminate" || wrongLeft.length));
    const opts = stepsLeft.map(st => ({
      t: `${st.icon} ${st.label} <small>(+5 min, +5 conf)</small>`,
      f: () => {
        n._stepsUsed[st.id] = true; n._stepsDone++;
        advanceClock(5);
        n.preConf = (n.preConf || 0) + 5;
        if (st.kind === "eliminate") {
          const w = pool.find(o => o.kind === "wrong" && !o.ruledOut);
          if (w) { w.ruledOut = true; n._clues.push(`<small>${st.line(w.text)}</small>`); }
        } else {
          n._clues.push(`<small>${st.line()}</small>`);
        }
        render();
      },
    }));
    opts.push({
      t: "🧠 Form a conclusion",
      f: () => conclude(n),
    });
    const ruled = pool.filter(o => o.ruledOut).length;
    dlg(`🔧 Troubleshooting — ${t.label}`,
      `<small>Gather information, eliminate possibilities, THEN conclude.${n._stepsDone === 0 ? " Skipping straight to a conclusion is a blind guess." : ""}</small>` +
      `<br>Steps taken: ${n._stepsDone} · Ruled out: ${ruled}${clueLog}`,
      opts);
  };
  render();
}

function conclude(n) {
  const s = S, t = n.type;
  const pool = n._pool;
  const remaining = pool.filter(o => !o.ruledOut);
  const ruledOut = pool.filter(o => o.ruledOut);
  const opts = remaining.map((o, i) => ({
    t: `${["🅰", "🅱", "🅲", "🅳"][i]} ${o.text}`,
    f: () => {
      n.diagnosed = true; n.correctDiag = o.kind === "best";
      advanceClock(15);
      // spawn broken device near npc (same as stock diagnose)
      const dp = freeSpot(s.map, n.x, n.y);
      s.devices.push({ ...dp, type: t, fixed: false, npc: n.id });
      const pp = freeSpot(s.map, dp.x, dp.y);
      if (o.kind === "best") {
        addXP(8); toast("🎯 Correct diagnosis! (+8 XP)");
        s.portals.push({ ...pp, npc: n.id, weak: true });
      } else if (o.kind === "okay") {
        addXP(4);
        toast(`🤔 Reasonable — that helps some, but it's not the root cause. (+4 XP)<br><small>Best move: ${t.diag.best}</small>`, 3400);
        s.portals.push({ ...pp, npc: n.id, weak: false, partial: true });
      } else {
        addStress(10); n.trustHurt = true;
        toast(`❌ Wrong hypothesis... the problem is worse than it looked. (+10 stress)<br><small>Best move: ${t.diag.best}</small>`, 3400);
        s.portals.push({ ...pp, npc: n.id, weak: false });
      }
      // process matters: methodical work pays, blind guesses don't
      if (n._stepsDone >= 2) {
        addXP(3); n.processCredit = true;
        toast(`📋 By the book — evidence first, conclusion second. (+3 XP, +${n._stepsDone * 5} confidence banked)`, 3000);
      } else if (n._stepsDone === 0) {
        toast("🎲 Blind guess — no investigation, no bonus. The ticket remembers.", 2600);
      }
      n.fixedReady = true;
      closeDlg(); updateHUD();
    },
  }));
  dlg("🧠 Conclusion", `<b>${t.label}</b><br>Based on your findings, what's the root cause?` +
    (ruledOut.length ? `<br><small>Ruled out by investigation: ${ruledOut.map(o => `<s>${o.text}</s>`).join(", ")}</small>` : ""),
    opts);
}

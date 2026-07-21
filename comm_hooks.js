// v4.3 — Communication Battles + IT-department systems.
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
  if (typeof n.patience !== "number") n.patience = COMM_PATIENCE[n.dept] || 5;
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
        n.guessed = true; n.ticketGauge += 1; n.preConf += 15;
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
  render(veteran
    ? `"Hey, it's me again — I rebooted first, like you taught us."`
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

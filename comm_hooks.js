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

// v7.20 — every department talks like itself. Openers, reassure/demand
// responses and idle filler are all keyed to who the user IS and where
// they work; face-to-face conversations (you walked up to them) no longer
// wear a phone-call frame.
const COMM_OPENERS = {
  Executives: ["Walk me to the fix — board in five.", "This costs me money per minute. Go."],
  Sales: ["Demo in ten and the deck won't load. SAVE me.", "Client call at the half hour. It's urgent. It's always urgent."],
  Manufacturing: ["LINE'S WAITING ON THIS TERMINAL. HURRY.", "SHIFT LEAD'S ON MY NECK. WHAT'S BROKEN?"],
  Engineering: ["I already ruled out the obvious. Impress me.", "Before you ask: yes, I rebooted. Twice. Logged it."],
  Finance: ["Quarter-end reports are due… tell me this is quick.", "I triple-checked it isn't my fault. It isn't, right?"],
  HR: ["So sorry to bother you — take your time. Well, some time.", "Short version: it's broken. The long version is available."],
};
const COMM_REASSURE = {
  Executives: `"Fine. FINE." — the calendar alert already glares, but the shoulders drop.`,
  Sales: `"Okay, okay — breathing. You're a lifesaver." they pace a headset circle.`,
  Manufacturing: `"ALRIGHT. ALRIGHT." a hard-hat nod; the line keeps clanking behind them.`,
  Engineering: `"Understood. Proceeding rationally." they annotate your plan on a whiteboard.`,
  Finance: `"Okay… okay. Numbers can wait. Mostly." a ledger closes with a soft thump.`,
  HR: `"You're so patient with us. Anyway — as I was saying—"`,
};
const COMM_DEMAND = {
  Executives: `"...careful." — but the ticket goes in. Even VPs respect process.`,
  Sales: `"Wow. Okay. Filing it. My commission better not file with it."`,
  Manufacturing: `"FINE. PAPERWORK. THE LINE HEARD THAT TOO."`,
  Engineering: `"Bureaucratic, but valid. Ticket submitted — with logs attached."`,
  Finance: `"…fine. FINE. It goes in the system, like everything else."`,
  HR: `"Alright — but I'm documenting this interaction too, you know."`,
};
const COMM_FILLER = {
  Executives: [`"Clock's ticking."`],
  Sales: [`"The client just texted me. Twice."`],
  Manufacturing: [`"THE LINE WON'T WAIT MUCH LONGER."`],
  Engineering: [`"Hypothesis: this wastes cycles."`],
  Finance: [`"Every hour of downtime hits the ledger."`],
  HR: [`"People are asking me about it, you know…"`],
};

// ---------- Phase 1: the call ----------
const __origTicketFlowV43 = ticketFlow;
ticketFlow = function (n) {
  if (!n || n.done || n.interviewed || n.ambient) return __origTicketFlowV43(n);
  commBattle(n);
};

// Stable authored observations: no random cause revelation or confidence for guessing.
const DAY_INTAKE = {
  printer: ["The print job never reaches the tray.", "Show me the queue and the printer panel", "I'll keep the job in place so you can compare the two. Please don't clear everyone's documents.", "Leave the queued jobs intact", "Yes. I can wait on this job if it helps you find where it stops."],
  vpn: ["The remote connection won't complete.", "Show me where the connection stops", "I'll reproduce the connection attempt. Let's record the exact message before changing my sign-in settings.", "Keep the current sign-in settings", "Agreed. I don't want a password reset to become a second problem."],
  dns: ["The network looks connected, but the site won't open.", "Show me the failing address", "Here is the address I normally use. We should compare the actual error before calling the whole network down.", "Keep the failing page open", "I'll leave this tab as it is. You can test from here."],
  ad: ["I can't sign into the account I use for work.", "Read the sign-in message with me", "I'll show you the message. I won't say my password out loud or put it in the ticket.", "Pause repeated sign-in attempts", "Okay. I'll stop trying until we've checked whether the account is locked."],
  malware: ["An unexpected window appeared on my computer.", "Describe the window without clicking it", "I'll leave it alone. Can you capture what you need without opening any of its links?", "Stop using this session while we assess it", "Understood. I'll use another approved way to contact the team."],
  email: ["The messages I need aren't where I expect them.", "Show me the mailbox view and one missing message", "I can give you a sender and approximate date. Please check the view before changing or deleting anything.", "Preserve the mailbox while we investigate", "Please do. Some of those messages are records we need to keep."],
  bsod: ["The computer stops with a blue screen.", "Capture the stop message before restarting", "I'll show you the code if it happens again. I want the error recorded, not another unexplained restart.", "Check for unsaved work before recovery", "Yes. Tell me what can be preserved before you touch the machine."],
  plc: ["The production terminal can't communicate with the cell.", "Ask the operator what state the cell is in", "The operator needs to confirm that in person. A screen error isn't permission to change the controller.", "Agree the operator hold before any change", "Bring the operator and controls owner into it. Don't bypass an interlock for this."],
  wifi: ["The wireless connection drops while I'm working.", "Show me the location where it drops", "Let's test in that spot and compare it with somewhere that works. Moving desks isn't a diagnosis.", "Keep an approved fallback available", "If there's a working desk, I can use it while you investigate. Tell me before switching the connection."],
  cert: ["The site is showing a connection warning.", "Read the warning and site address together", "I'll show you the details. I haven't continued past the warning.", "Keep the security warning in place", "Good. I need the site working, but I don't want to teach everyone to ignore that warning."],
  disk: ["The computer says there's no space left.", "Show me the storage report", "Let's identify what's taking space. Some of the large files are work records, not rubbish.", "Agree what can be removed first", "Ask before deleting anything. I can tell you who owns the files."],
  update: ["The machine is still displaying the update screen.", "Check the update status before interrupting it", "I'll tell you what I've seen. Let's check whether it's progressing before forcing it off.", "Arrange another workstation while we check", "That would help. I need to work without risking the update on this machine."],
  share: ["The shared folder says access denied.", "Show me the exact folder and denial", "This is the folder I need. Check the intended access with its owner; don't just give me everything.", "Confirm the folder owner before changing access", "I can help identify the owner. I need the right access, not someone else's account."],
  vlan: ["The desk connection isn't giving the laptop a usable network.", "Compare the laptop connection with the wall port", "I'll show you what is plugged in. Label anything you move so the next shift can trace it.", "Keep the phone and production links untouched", "Please. This desk has more than one device, and they're not all on the same service."],
  backup: ["We need to check whether the backup can actually be restored.", "Review the failed job and the restore request", "Let's keep the job logs. A green console alone won't answer whether the requested data is recoverable.", "Preserve existing recovery points", "Agreed. Don't discard the last known copy while trying to repair the next backup."],
  slowpc: ["The computer is taking too long to become usable.", "Watch one slow start with me", "I'll show you the point where I start waiting. Let's measure it rather than remove applications at random.", "Check which applications the job requires", "Some of them look unnecessary until you try to do my job. I'll walk you through them."],
  _generic: ["Something is stopping the work on this device.", "Show me the task that fails", "I'll demonstrate the task and the exact failure. I'd rather show you than guess at the cause.", "Agree what must be preserved", "Tell me what you plan to change, and I'll flag anything the team still needs."]
};
const DAY_WORK_CONTEXT = {
  HR: ["People are waiting for an HR task to finish.", "Which HR task is blocked?", "I can explain the task without putting employee details in the public ticket. Let's keep the personal information private."],
  Finance: ["I need to finish the finance work without losing the records.", "Which finance deadline is affected?", "Let's record the affected deadline and the work that is blocked. Please preserve the source records while you test."],
  Manufacturing: ["I need the work area ready for the next operation.", "Is the line stopped or working around this?", "Check the current line state with the operator. We'll distinguish a stopped process from a workstation inconvenience."],
  Engineering: ["I need a repeatable result, not a temporary good run.", "Which engineering task can we use to verify it?", "Use the same task that failed. If a different test works, it doesn't prove this workflow is restored."],
  Sales: ["I need a working way to reach the customer.", "What can the customer still access?", "Let's separate the customer-facing failure from what I can still do internally, then agree an approved fallback."],
  Executives: ["I need to know what can happen next and when I'll hear from you.", "What decision is waiting on this?", "Give me the affected decision and the next update point. Don't promise a repair time before you've inspected it."],
  Marketing: ["The team needs to get this work out with the correct material.", "Which deliverable is waiting?", "Let's identify the blocked deliverable and preserve the approved version. A rushed replacement can create another problem."]
};
let dayIntakeSerial = 0;
function commBattle(n) {
  const s=S, token=++dayIntakeSerial, incident=DAY_INTAKE[n.type&&n.type.id]||DAY_INTAKE._generic;
  const context=DAY_WORK_CONTEXT[n.dept]||["I need a reliable way to finish the work.","What work is blocked?","Let's record the actual task and who is waiting on it."];
  const memory=n.dayConversation||(n.dayConversation={asked:[],visits:0});memory.visits++;
  const heard=memory.asked, valid=()=>S===s&&s.inDialog&&token===dayIntakeSerial&&!n.done;
  const identity=Array.from(n.name||'').reduce((h,c)=>h+c.charCodeAt(0),0)%3;
  const greetings=["Thanks for coming over, Mike.","Mike, I've kept this open for you.","Can we look at this together?"];
  const topics=[
    {id:'impact',label:context[1],reply:context[2],response:'Record the impact and agree the next update'},
    {id:'demonstrate',label:incident[1],reply:incident[2],response:'Keep that observation with this incident'},
    {id:'protect',label:incident[3],reply:incident[4],response:'Agree those limits before touching the device'}
  ];
  function remember(id){if(!heard.includes(id)){heard.push(id);if(typeof save==='function')save();}}
  function menu(line){
    const options=topics.filter(t=>!heard.includes(t.id)).map(t=>({t:t.label,f:()=>{
      if(!valid())return;remember(t.id);
      dlg(`${n.name} — ${n.dept}`,`<b>${t.label}</b><br><br>“${t.reply}”`,[
        {t:t.response,f:()=>{if(valid())menu('We have that in the handoff. What else do you need to know?');}},
        {t:'Begin the technical investigation',f:()=>{if(valid())finish();}},
        {t:'Pause here; keep the conversation for later',f:()=>{if(valid())closeDlg();}}
      ]);
    }}));
    if(heard.length)options.push({t:n.trustHurt?'Investigate before promising a fix':'Take this to the device',f:()=>{if(valid())finish();}});
    options.push({t:heard.length?'Return later with these notes':'Let them continue; come back later',f:()=>{if(valid())closeDlg();}});
    dlg(`${n.name} — ${n.dept}`,`<b>${n.type&&n.type.label||'Service request'}</b><br><br>${line}<br><br><small>${heard.length?'Discussed: '+topics.filter(t=>heard.includes(t.id)).map(t=>t.label).join(' · '):'Ask about the work, observe the symptom, and agree the limits.'}</small>`,options);
  }
  function finish(){dayIntakeSerial++;n.ticketGauge=4;__origTicketFlowV43(n);}
  const intro=n.trustHurt?'I need you to hear this before changing anything. Last time left me wary.':memory.visits>1?(heard.length?'You’re back. We can pick up from the notes we already agreed.':'We didn’t get to the details earlier. I still have the problem here.'):(n.timesHelped||0)>0?'You helped me before. Let’s check this properly rather than assume it’s the same fault.':greetings[identity];
  menu(`${intro}<br>“${incident[0]} ${context[0]}”`);
}

const DAY_AMBIENT_TOPICS={
 HR:[['What helps a new starter on day one?','A working account, the right access and someone who expects them. A laptop on a desk is only one part of being ready.'],['What should stay out of a support ticket?','Personal employee details that are not needed to solve the issue. Record the system and the task; use the approved private channel for sensitive context.']],
 Finance:[['What makes a fix useful to Finance?','Let me run the same reconciliation afterward. If the numbers and the source records survive, then we can talk about closure.'],['How should we schedule a change around your work?','Ask which deadline it touches before choosing the window. The same ten-minute interruption can mean very different things on different days.']],
 Manufacturing:[['Where should a visitor stand on the floor?','Outside the marked travel lanes, with the operator aware you are there. A troubleshooting screen should not make you forget the machine beside it.'],['What do you need in a shift handoff?','The equipment state, the work being held and the person who owns the next step. The next shift should not have to discover our workaround by accident.']],
 Engineering:[['What makes a useful fault report?','A repeatable task, the exact result and what changed between the good run and the failed run. Screenshots help when they show the part that matters.'],['How do you handle a result you cannot reproduce?','Keep the original observation and say that the repeat test differed. Do not replace an inconvenient result with the one you hoped to see.']],
 Sales:[['What does a good outage update look like?','Tell me what I can still do, what I should tell the customer and when the next update is coming. I can plan around uncertainty if you name it.'],['What should we test before the next demo?','The actual customer path, on the connection we will use. A successful test from a different desk can be a very convincing false comfort.']],
 Marketing:[['How do we avoid sending the wrong version?','Keep the approved material clearly identified and check the destination. A working upload can still deliver the wrong thing.'],['What would make support less disruptive?','Tell the person doing the work what you need to test. We can often find a window if the first contact is a conversation rather than a restart.']],
 Executives:[['What belongs in an incident update?','Impact, owner, current evidence and the next decision. If something is not known yet, say that before a guess turns into a promise.'],['What do you need from the technical team?','A clear choice with its tradeoffs. We need enough detail to make the decision, not a dashboard full of green things unrelated to it.']]
};
function dayAmbientConversation(n){
 if(!n||!S||S.nightMode||n._felScene||n._pin||n._cue)return false;
 const topics=DAY_AMBIENT_TOPICS[n.dept];if(!topics)return false;
 const s=S;s.meta.dayAmbientTalk=s.meta.dayAmbientTalk||{};const key=s.day+':'+(n.id||n.name)+':'+n.dept;
 const m=s.meta.dayAmbientTalk[key]||(s.meta.dayAmbientTalk[key]={visits:0,heard:[]});
 const intro=m.visits++?'“Back for a minute? We can pick up where we left off.”':'“Hi, Mike. Nothing to restart here — what did you want to ask?”';
 const options=topics.filter((t,i)=>!m.heard.includes(i)).map(t=>({t:t[0],f:()=>{if(S!==s||!s.inDialog)return;const i=topics.indexOf(t);if(!m.heard.includes(i))m.heard.push(i);save();dlg(n.name+' — '+n.dept,'“'+t[1]+'”',[{t:'Ask another question',f:()=>dayAmbientConversation(n)},{t:'Thanks — I’ll let you get back to it',f:closeDlg}]);}}));
 if(!options.length)options.push({t:'Revisit our earlier conversation',f:()=>dlg(n.name+' — '+n.dept,topics.map(t=>'“'+t[1]+'”').join('<br><br>'),[{t:'Thanks — see you around',f:closeDlg}])});
 options.push({t:'Just saying hello — see you around',f:closeDlg});save();dlg(n.name+' — '+n.dept,intro,options);return true;
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

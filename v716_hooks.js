/* ==========================================================================
   v7.16 — VARIETY PACK (QA polish + anti-repetition)
   Fresh QA/consistency pass findings, fixed here:
     · The 5 v5.3 ticket types (av_hdmi, av_teams, plant_scanner,
       label_printer, hw_replace) had NO symptom quote — the interview
       dialog literally rendered "undefined". (consistency bug, fixed)
     · Every ticket type had exactly ONE symptom quote, ONE board label,
       ONE flag-down opener — same words every run, every day.
     · The decision-tree board always offered questions/answers in the
       same order, so repeat play became muscle memory.
     · The 16-name NPC pool recycled fast across days.
     · Days without a chaos event felt structurally identical.

   Systems:
     1. Symptom quote variants (3+ per type, root-cause-consistent, all 22)
     2. Symptom board-label variants, rotated daily
     3. Flag-down opener variants
     4. Expanded ambient chatter pool
     5. Bigger, gender-aware name pool (+supplemental reconciler)
     6. Deterministic shuffle of tree questions & answers
     7. Day themes (Patch Tuesday, Onboarding Wave, Audit Week, AV Rollout)
   ========================================================================== */
(function () {
  "use strict";

  /* deterministic hash → stable variety per day/NPC, no save bloat */
  function h716(str) {
    let h = 2166136261 >>> 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  const at = (arr, key) => arr[h716(key) % arr.length];

  /* ---------- 1. symptom quote variants (user voice, cause-consistent) ---------- */
  const QUOTES = {
    printer: [
      `"It just says 'PC LOAD LETTER' and makes a screaming noise."`,
      `"I sent one page. ONE. It's been 'printing' since breakfast."`,
      `"The printer ate my report and now it just blinks at me. Menacingly."`,
      `"Everyone's jobs come out except mine. The printer has favorites."`],
    vpn: [
      `"I click connect and it spins forever. I have a meeting in 10 minutes!"`,
      `"It says 'connecting...' then asks for my password again. And again."`,
      `"VPN worked at home, died at the hotel. The client demo is at 2."`,
      `"It connects, then drops the second I open the shared drive."`],
    dns: [
      `"The WiFi is connected but NOTHING loads. Is the internet down?"`,
      `"Email works but websites don't. How is that even possible?"`,
      `"It says the site 'can't be reached'. The WHOLE internet. All of it."`,
      `"My coworker loads the same site fine. My laptop is gaslighting me."`],
    ad: [
      `"I typed my password ONE time wrong and now I'm locked out. Also maybe 9 times."`,
      `"Locked out again. I swear the keyboard did it, not me."`,
      `"I changed my password Friday like the email said. Monday: locked out."`,
      `"My account locks every morning at 9:05. Like clockwork. Haunted clockwork."`],
    malware: [
      `"A pop-up said I won a cruise, so I clicked it. Why does my screen have... friends?"`,
      `"My homepage changed itself and there's a toolbar called 'DealsGoat'."`,
      `"The mouse moved on its own. I watched it. I was NOT touching it."`,
      `"It plays a little song and all my files have weird names now."`],
    email: [
      `"My inbox is empty. EMPTY. Where did 14,000 emails go?"`,
      `"Mail comes to my phone but not Outlook. Pick a lane, Microsoft."`,
      `"Sent mail sits in Outbox all day. People think I'm ignoring them."`,
      `"It keeps asking for a password. The RIGHT password. I checked twice."`],
    bsod: [
      `"It blue screens every time I open the spreadsheet. THE spreadsheet."`,
      `"Blue screen, again. I got a photo of the frowny face this time."`,
      `"It crashed during my presentation. Twice. The board laughed. I didn't."`,
      `"Random blue screens. No pattern. Well — it hates me, that's the pattern."`],
    plc: [
      `"Line 3 is down. The PLC won't talk to anything. Production is staring at me."`,
      `"The HMI says 'comm fault' and the line is holding WIP hostage."`,
      `"PLC's been solid for years. Today: silence. The floor is NOT happy."`,
      `"Engineering changes something, line dies. Coincidence? It never is."`],
    wifi: [
      `"The WiFi just dies in the east stairwell. My calls drop every single time."`,
      `"Full bars by my desk, walk ten feet — nothing. It's a dead Bermuda triangle."`,
      `"WiFi crawls every day at lunch. Every. Day. Like it's eating too."`,
      `"The new corner office has zero signal. The VP has 'thoughts'."`],
    cert: [
      `"The site says 'Your connection is not private' with a big red warning. Clients are calling."`,
      `"Chrome says the cert expired yesterday. Legal wants answers TODAY."`,
      `"Big red warning on the customer portal. Marketing is screenshotting it angrily."`,
      `"It worked Friday. Nobody touched anything. Somebody touched something."`],
    disk: [
      `"It says C: is full. 0 bytes free. I only saved ONE 40GB video of the Christmas party."`,
      `"Red bar on the C: drive and everything takes ten minutes to open."`,
      `"Windows keeps nagging about low disk space. I keep dismissing it. Now it won't boot."`,
      `"I deleted like six files and it's STILL full. Where does it all GO?"`],
    update: [
      `"It's been 'Working on updates, 27%' for three hours. Don't turn it off, right?"`,
      `"The update failed and now it retries every reboot. Groundhog Day."`,
      `"It's restarted to 'finish updates' four times this morning."`,
      `"Patch Tuesday happened and my PC hasn't been right since."`],
    share: [
      `"It says Access Denied on the Q: drive, but Dave in accounting can open it just fine."`,
      `"I could open the project share yesterday. Today I'm apparently nobody."`,
      `"The drive is mapped, it's right THERE, it just says no. Rude."`,
      `"Whole team can get in except the new guy. He's starting to take it personally."`],
    vlan: [
      `"My desk phone works but my laptop gets no IP. IT plugged me into the wrong port, didn't they?"`,
      `"Moved desks over the weekend and now I'm on some guest network."`,
      `"Laptop gets a 169 address. The printer next to me works fine."`,
      `"Facilities moved my cube. My network identity did not survive."`],
    backup: [
      `"The nightly backup has failed 4 days in a row. Nobody noticed until Legal asked for a restore."`,
      `"Backup job says 'failed' again. It emails me about it. Into the void."`,
      `"Restore test is Friday and I do NOT trust the tapes right now."`,
      `"The job runs for six hours then quits at 98%. It's taunting me."`],
    slowpc: [
      `"It takes 12 minutes to boot. I time it. I have a spreadsheet of the boot times."`,
      `"Opening Excel is a coffee break. Opening two Excels is lunch."`,
      `"It was fine until that 'productivity' toolbar appeared. Asking for a friend."`,
      `"Five-year-old laptop. Fan sounds like Line 2. Everything is... gradual."`],
    shadow: [
      `"ACCESS GRANTED... — the terminal is typing by itself: 'i remember this building. i remember YOU.'`],
    av_hdmi: [
      `"Boardroom shows 'No Signal' and the execs arrive in five minutes."`,
      `"The HDMI works if you hold the cable. Someone has to HOLD it."`,
      `"Projector sees my laptop, TV doesn't. Same cable. Explain that."`,
      `"Every room has a different remote and NONE of them wake the display."`],
    av_teams: [
      `"The Teams Room can't join its own meeting. It's invited. It's IN the invite."`,
      `"Room system says 'couldn't connect you'. The all-hands starts now."`,
      `"Camera works, mic works, join button: decorative."`,
      `"The Teams Room joined as somebody else yesterday. Today it won't join at all."`],
    plant_scanner: [
      `"The warehouse scanner won't scan. Inventory is piling up by hand."`,
      `"Scanner beeps but nothing lands in the system. Ghost inventory."`,
      `"It scans every OTHER barcode. The important ones: nope."`,
      `"Dropped once, months ago. It's been 'mostly fine' until today."`],
    label_printer: [
      `"Shipping labels won't print and the truck leaves at 3."`,
      `"Labels come out blank. The ribbon is new. The rage is real."`,
      `"It prints one label then jams. Every. Single. Time."`,
      `"Barcodes print smeared — receiving can't scan them downstream."`],
    hw_replace: [
      `"This laptop is on its last legs. Battery dies at 40%, fan wheezes."`,
      `"The screen flickers when I breathe on the hinge. It's 6 years old."`,
      `"It takes 20 minutes to boot and the keyboard's missing E."`,
      `"Warranty ended in 2022. It knows. It's punishing me."`],
  };

  /* ---------- 2. symptom board-label variants (rotated daily) ---------- */
  const LABELS = {
    printer: ["Printer won't print", "Printer screams, prints nothing", "Jobs stuck in the queue"],
    vpn: ["VPN spins forever", "VPN drops immediately", "VPN password loop"],
    dns: ["'The internet is down!'", "Sites won't load", "'WiFi's connected but dead'"],
    ad: ["Locked out of account", "Account locks every morning", "'Password is right, still locked'"],
    malware: ["Pop-ups won a 'cruise'", "Mystery toolbar appeared", "'Files renamed themselves'"],
    email: ["Inbox shows empty", "Mail stuck in Outbox", "Outlook password loop"],
    bsod: ["Blue screens on spreadsheet", "Random blue screens", "Crashed mid-presentation"],
    plc: ["Line 3 is down", "PLC 'comm fault'", "HMI says nothing at all"],
    wifi: ["Calls drop in east stairwell", "Dead zone by the corner office", "WiFi crawls at lunch"],
    cert: ["Red browser warning on the site", "'Connection not private'", "Cert expired on the portal"],
    disk: ["'C: drive full' popup", "0 bytes free", "Red bar on C:"],
    update: ["Update stuck at 27%", "Update fails and retries", "Reboot loop after patching"],
    share: ["Access Denied on Q: drive", "'Yesterday it opened fine'", "Share says no to one user"],
    vlan: ["Laptop gets no IP at desk", "169 address after desk move", "Phone works, laptop doesn't"],
    backup: ["Legal needs a restore", "Backup failed 4 days straight", "Job dies at 98%"],
    slowpc: ["12-minute boot times", "'Everything is... gradual'", "Excel opens like it's 1998"],
    shadow: ["Terminal typing by itself"],
    av_hdmi: ["Conference room 'No Signal'", "Display won't wake", "Hold-the-cable meeting room"],
    av_teams: ["Teams Room can't join", "Room joins as wrong person", "Join button is decorative"],
    plant_scanner: ["Scanner won't scan", "Ghost inventory scans", "Scanner beeps, nothing lands"],
    label_printer: ["Labels won't print (Shipping)", "Blank labels, new ribbon", "One label then jam"],
    hw_replace: ["Laptop on its last legs", "6-year-old laptop wheezing", "Battery dies at 40%"],
  };

  /* ---------- 3. flag-down openers ---------- */
  const OPENERS = ["Hey — got a minute?", "Got a sec?", "Sorry to grab you —", "You look like the IT person.", "Quick one, promise.", "Before my next meeting —", "I know you're busy, but"];

  /* ---------- 4. expanded ambient chatter ---------- */
  const CHATTER = [
    `"The ticket queue has a queue now. I'm sure that's a metaphor."`,
    `"I label my cables. Nobody else labels their cables. This is why we suffer."`,
    `"Documentation is love letters to your future self. Mine are mostly apologies."`,
    `"The coffee machine rebooted itself this morning. Even IT's IT needs IT."`,
    `"Someone asked if the server room hum helps them think. It helps ME think."`,
    `"Change freeze Friday. Nobody deploys Friday. Somebody will deploy Friday."`,
    `"I don't make the policies. I just enforce them with a sigh."`,
    `"Backup succeeded last night. First time this week. I framed the email."`,
    `"The intern asked what a 'rumored switch' is. I pointed at Switch 17."`,
    `"If it works, don't touch it. If it doesn't work, also don't touch it. Call me."`,
    `"Every 'quick question' is 40 minutes. Every 'big problem' is a loose cable."`,
    `"The CEO's printer has a name. The name is 'Priority One'."`,
  ];

  /* ---------- 5. name pool expansion ---------- */
  const MALE_PLUS = ["Raj", "Dmitri", "Cole", "Andre", "Miles", "Sanjay", "Theo", "Ravi"];
  const FEMALE_PLUS = ["Ingrid", "Mara", "Tessa", "Rosa", "Aisha", "June", "Kira", "Alba"];
  // NB: no unisex additions — dept-gendered sprites make unisex names read as mismatches (v7.12 rule)
  if (typeof NPC_NAMES !== "undefined") NPC_NAMES.push(...MALE_PLUS, ...FEMALE_PLUS);
  const G716 = {};
  const MALE_ALL = [...(window.v712 ? window.v712.MALE : []), ...MALE_PLUS];
  const FEMALE_ALL = [...(window.v712 ? window.v712.FEMALE : []), ...FEMALE_PLUS];
  MALE_ALL.forEach(n => G716[n] = "m");
  FEMALE_ALL.forEach(n => { if (!G716[n]) G716[n] = "f"; });
  const UNI716 = new Set(["Yuki"]);
  const CREW716 = new Set(["Mike", "Nick", "Amit", "Brandon", "Daniel", "Felicia", "Felicia Cruz"]);
  if (window.v712) {
    window.v712.MALE.push(...MALE_PLUS.filter(n => !window.v712.MALE.includes(n)));
    window.v712.FEMALE.push(...FEMALE_PLUS.filter(n => !window.v712.FEMALE.includes(n)));
    // v712's genderOf reads a load-time closure map — wrap it so the new names resolve too
    const __origGenderOf716 = window.v712.genderOf;
    window.v712.genderOf = n => __origGenderOf716(n) ||
      (MALE_PLUS.includes(n) ? "m" : FEMALE_PLUS.includes(n) ? "f" : null);
  }
  function pickFree716(pool, inUse) {
    const free = pool.filter(n => !inUse.has(n));
    const src = free.length ? free : pool;
    return src[Math.floor(Math.random() * src.length)];
  }
  function reconcile716() {
    if (typeof S === "undefined" || !S || !S.npcs || !window.v712) return 0;
    const DG = window.v712.DEPT_GENDER;
    let fixed = 0;
    const inUse = new Set(S.npcs.map(n => n && n.name).filter(Boolean));
    for (const n of S.npcs) {
      if (!n || !n.name || !n.dept || CREW716.has(n.name)) continue;
      const want = DG[n.dept];
      if (!want || UNI716.has(n.name)) continue;
      if (G716[n.name] === want) continue;
      const nn = pickFree716(want === "m" ? MALE_ALL : FEMALE_ALL, inUse);
      inUse.delete(n.name); inUse.add(nn);
      n.name = nn; fixed++;
    }
    return fixed;
  }
  setInterval(() => { try { reconcile716(); } catch (e) { } }, 30000);

  /* ---------- 7. day themes ---------- */
  const THEMES = [
    { id: "patch_tuesday", name: "📅 PATCH TUESDAY", desc: "Every machine wants updates. Expect servicing-stack casualties.", types: ["update"] },
    { id: "onboarding", name: "📅 ONBOARDING WAVE", desc: "A dozen new hires start today. New accounts, new lockouts.", types: ["ad"] },
    { id: "audit", name: "📅 AUDIT WEEK", desc: "Compliance is in the building. Restores and permission reviews.", types: ["backup", "share"] },
    { id: "av_rollout", name: "📅 AV ROLLOUT", desc: "Facilities is 'upgrading' meeting rooms. What could go wrong.", types: ["av_hdmi", "av_teams"] },
    { id: "monsoon", name: "📅 STORM SEASON", desc: "RF hates weather. Dead zones multiply and tunnels drop.", types: ["wifi", "vpn"] },
  ];

  /* ---------- setupDay wrap: labels, theme, reconcile ---------- */
  const __origSetup716 = setupDay;
  setupDay = function () {
    __origSetup716.apply(this, arguments);
    const s = S;
    if (!s) return;
    // daily label rotation (v6.1 reads SYMPTOM_LABEL at draw/flag-down time)
    if (typeof SYMPTOM_LABEL !== "undefined") {
      for (const id in LABELS) SYMPTOM_LABEL[id] = at(LABELS[id], id + ":" + s.day + ":" + (s.ngPlus ? "ng" : ""));
    }
    s._qSeen = {};
    // day theme: retarget up to 2 ordinary tickets toward the theme
    if (!s.chaos && s.day >= 2 && Math.random() < .45) {
      const th = at(THEMES, "theme:" + s.day + ":" + h716(String(Date.now())));
      const want = th.types.filter(id => !(s.infra || []).includes(id) && TICKET_TYPES.some(t => t.id === id));
      if (want.length) {
        const cands = s.tickets.filter(t => !t.done && !t.critical && !t.legacy && t.type && t.type.id !== "shadow" && !want.includes(t.type.id));
        for (let i = 0; i < Math.min(2, cands.length); i++) {
          const nt = TICKET_TYPES.find(t => t.id === at(want, "tt:" + s.day + ":" + i));
          cands[i].type = nt;
        }
        s.theme = th;
        setTimeout(() => toast(`${th.name}<br><small>${th.desc}</small>`, 3800), 3400);
      }
    }
    try { reconcile716(); } catch (e) { }
  };

  /* ---------- 6+3+1. dlg interception: shuffle, openers, quotes ---------- */
  const DEFAULT_QUOTES = {};
  for (const id in QUOTES) DEFAULT_QUOTES[QUOTES[id][0]] = id; // index the stock line per type

  function varyQuotes(text) {
    const s = S; if (!s) return text;
    // stock quote → daily/occurrence variant
    for (const q in DEFAULT_QUOTES) {
      if (text.includes(q)) {
        const id = DEFAULT_QUOTES[q];
        s._qSeen = s._qSeen || {};
        const seen = s._qSeen[id] || 0; s._qSeen[id] = seen + 1;
        const v = QUOTES[id];
        return text.split(q).join(v[(h716(id + ":" + s.day) + seen) % v.length]);
      }
    }
    // v5.3 types: the stock dialog prints a bare "undefined" symptom line
    if (text.includes("<br>undefined") && text.includes("Interview the user")) {
      // pick by ticket type icon in the bold tag when possible; else any v53 quote
      let id = null;
      for (const cand of ["av_hdmi", "av_teams", "plant_scanner", "label_printer", "hw_replace"]) {
        const ty = TICKET_TYPES.find(x => x.id === cand);
        if (ty && text.includes("<b>" + ty.icon)) { id = cand; break; }
      }
      if (id) {
        s._qSeen[id] = (s._qSeen[id] || 0) + 1;
        const v = QUOTES[id];
        return text.replace(/<br>undefined/, "<br>" + v[(h716(id + ":" + s.day) + s._qSeen[id] - 1) % v.length]);
      }
    }
    return text;
  }

  function shuffleOpts(name, options) {
    if (!Array.isArray(options) || options.length < 3) return options;
    const s = S;
    const key = name + "|" + options.map(o => o.t).join("|") + "|" + (s ? s.day : 0);
    const isBoard = name.startsWith("🌳 ");
    const head = [], tail = [], mid = [];
    options.forEach(o => {
      if (isBoard && o.t.startsWith("▶")) head.push(o);
      else if (o.t.startsWith("🧠") || o.t.startsWith("🔙")) tail.push(o);
      else mid.push(o);
    });
    if (mid.length < 2) return options;
    let h = h716(key);
    for (let i = mid.length - 1; i > 0; i--) { h = (Math.imul(h ^ (h >>> 15), 2246822519) >>> 0); const j = h % (i + 1); const tmp = mid[i]; mid[i] = mid[j]; mid[j] = tmp; }
    return [...head, ...mid, ...tail];
  }

  const __origDlg716 = dlg;
  dlg = function (name, text, options) {
    try {
      if (typeof text === "string") text = varyQuotes(text);
      if (typeof name === "string" && name.startsWith("🙋 ") && typeof text === "string" && text.includes("Hey — got a minute?")) {
        const s = S;
        text = text.replace("Hey — got a minute?", at(OPENERS, name + ":" + (s ? s.clock : 0)));
      }
      if (typeof name === "string" && (name.startsWith("🌳 ") || name.startsWith("🔧 "))) options = shuffleOpts(name, options);
    } catch (e) { }
    return __origDlg716.call(this, name, text, options);
  };

  /* ---------- 4b. ambientTalk expansion ---------- */
  const __origTalk716 = ambientTalk;
  ambientTalk = function (n) {
    // never hijack scripted/cue NPCs (Felicia's rooftop scene, pinned story NPCs, crew)
    const scripted = n && (n._felScene || n._pin || n._cue ||
      (typeof CREW !== "undefined" && CREW.some(c => c.name === n.name)));
    if (!scripted && Math.random() < 0.45) {
      const deptExtra = {
        IT: [`"Nick swears the dashboard wall is 'load-bearing decoration'."`, `"Standup was 6 minutes today. A record."`],
        Executives: [`"The board wants an AI strategy. I want a working calendar."`],
        Manufacturing: [`"The tugger has right of way. Remember that."`],
        Engineering: [`"The wind tunnel data backs up my parking theory."`],
      };
      const lines = [...CHATTER, ...(deptExtra[n.dept] || [])];
      return dlg(`${n.name} — ${n.dept}`, at(lines, n.name + ":" + (S ? S.day : 0) + ":" + n.id), [{ t: "Back to work.", f: closeDlg }]);
    }
    return __origTalk716.apply(this, arguments);
  };

  window.v716 = {
    version: "7.16",
    QUOTES, LABELS, THEMES, reconcile: reconcile716,
    coverage() { return TICKET_TYPES.filter(t => !QUOTES[t.id] || !LABELS[t.id]).map(t => t.id); },
  };
})();

// v7.3 "The Woman on the Wing": the days 5–10 story arc. Animated comic-panel
// cutscenes (generated chibi pixel-art panels, Ken Burns motion + typewriter
// captions), in-between scenes, the PROJECT ORPHEUS backstory, Crown Jewel
// intel tickets, and the day-10 rooftop choice:
//   all 8 investigation clues by day 10 -> you can stop her   (Ending A)
//   all 3 Crown Jewel intel pieces      -> you can side with her (Ending B)
//   both + every optional talk          -> true ending
(function () {
  const PANELS = (typeof TO_PANELS !== "undefined") ? TO_PANELS : [];
  const imgs = PANELS.map(src => { const i = new Image(); i.src = src; return i; });

  function arc() {
    const s = S;
    if (!s.meta._arc73) s.meta._arc73 = { intel: [], talks: 0, seen: {}, choice: null, ending: null };
    return s.meta._arc73;
  }
  function clueCount() { try { return window.fel ? fel().clues.length : 0; } catch (e) { return 0; } }
  function endings() { try { return JSON.parse(localStorage.getItem("techops_endings") || "[]"); } catch (e) { return []; } }
  function recordEnding(id) {
    const e = endings(); if (!e.includes(id)) { e.push(id); localStorage.setItem("techops_endings", JSON.stringify(e)); }
  }

  // ================= animated comic-panel player =================
  let cineOpen = false;
  function v73Cine(slides, onDone) {
    if (cineOpen) { if (onDone) onDone(); return; }
    cineOpen = true;
    const wasDialog = S.inDialog; S.inDialog = true;
    const ov = document.createElement("div");
    ov.id = "v73-cine";
    ov.innerHTML = `<div class="v73-bar top"></div><canvas class="v73-cv"></canvas>
      <div class="v73-capwrap"><div class="v73-cap"></div><div class="v73-hint">CLICK / E — NEXT · ESC — SKIP</div></div>
      <div class="v73-bar bot"></div>`;
    document.body.appendChild(ov);
    const cv = ov.querySelector(".v73-cv"), cx = cv.getContext("2d"), cap = ov.querySelector(".v73-cap");
    let idx = 0, t0 = performance.now(), raf = 0, typeTimer = 0, fullText = "", typed = false;

    function size() { cv.width = innerWidth; cv.height = innerHeight; }
    size(); addEventListener("resize", size);

    function draw() {
      const s = slides[idx], im = s && s.img != null ? imgs[s.img] : null;
      const el = (performance.now() - t0) / 1000;
      cx.fillStyle = "#05060d"; cx.fillRect(0, 0, cv.width, cv.height);
      if (im && im.complete && im.naturalWidth) {
        // slow push-in (or pull-back) — Ken Burns
        const dir = s.zoom === "out" ? -1 : 1;
        const k = 1.08 + dir * Math.min(el / 14, 1) * 0.10;
        const cr = cv.width / cv.height, ir = im.naturalWidth / im.naturalHeight;
        let dw, dh; if (cr > ir) { dw = cv.width; dh = cv.width / ir; } else { dh = cv.height; dw = cv.height * ir; }
        const zw = dw / k, zh = dh / k;
        const ox = (dw - zw) * (0.5 + (s.pan || 0) * 0.3) + (cv.width - dw) / 2 - (cv.width - dw) / 2;
        // compute source crop then draw to full screen
        const sw = im.naturalWidth / k, sh = im.naturalHeight / k;
        const sx = (im.naturalWidth - sw) * (0.5 + (s.pan || 0) * 0.35), sy = (im.naturalHeight - sh) * 0.5;
        cx.drawImage(im, sx, sy, sw, sh, (cv.width - dw * k) / 2 + (cv.width - dw) / 2, (cv.height - dh * k) / 2 + (cv.height - dh) / 2, dw * k, dh * k);
        cx.fillStyle = "rgba(5,6,13,.18)"; cx.fillRect(0, 0, cv.width, cv.height);
      }
      raf = requestAnimationFrame(draw);
    }

    function typeCap(html) {
      fullText = html; typed = false;
      const plain = html.replace(/<[^>]+>/g, "");
      let n = 0;
      clearInterval(typeTimer);
      typeTimer = setInterval(() => {
        n += 2;
        if (n >= plain.length) { cap.innerHTML = html; typed = true; clearInterval(typeTimer); return; }
        cap.textContent = plain.slice(0, n);
      }, 16);
    }
    function show() {
      const s = slides[idx]; t0 = performance.now();
      cap.parentElement.style.opacity = s.title ? "1" : "";
      typeCap(s.cap);
    }
    function next() {
      if (!typed) { clearInterval(typeTimer); cap.innerHTML = fullText; typed = true; return; }
      idx++;
      if (idx >= slides.length) return end();
      show();
    }
    function end() {
      cancelAnimationFrame(raf); clearInterval(typeTimer);
      removeEventListener("resize", size);
      ov.remove(); cineOpen = false; S.inDialog = wasDialog;
      removeEventListener("keydown", key, true);
      if (onDone) onDone();
    }
    function key(e) {
      if (e.key === "Escape") { e.stopPropagation(); end(); }
      else if (["e", "E", " ", "Enter"].includes(e.key)) { e.stopPropagation(); next(); }
    }
    addEventListener("keydown", key, true);
    ov.addEventListener("click", next);
    show(); draw();
  }

  // ================= Crown Jewel tickets =================
  const CJ = [
    { day: 7, code: "CROWN JEWEL: ORPHEUS META", intel: "ORPHEUS METADATA",
      text: "Buried in the sync logs: <b>PROJECT ORPHEUS</b> — AeroTech's predictive-control platform. It quietly routes power, water and evacuation for all of New Haven. Clearance: <b>CROWN JEWEL</b>.<br><br><small>INTEL 1/3 recovered.</small>" },
    { day: 9, code: "CROWN JEWEL: ARRAY 06", cjType: "server", intel: "CITY EVACUATION MODEL",
      text: "Behind the overheating array: archived simulations — weather models, infrastructure load, the power grid... and a <b>CITY EVACUATION MODEL</b> nobody was meant to find. The south districts are marked <i>acceptable loss</i>.<br><br><small>INTEL 2/3 recovered.</small>" },
    { day: 10, code: "CROWN JEWEL: ARCHIVE KEY", intel: "ORPHEUS CORE KEYS",
      text: "The last piece: <b>ORPHEUS CORE</b> — comm-override signing keys. Whoever holds these can make the grid tell the truth in front of the whole city.<br><br><small>INTEL 3/3 recovered.</small>" },
  ];
  function spawnCJ(def) {
    const s = S;
    if (s.tickets.some(t => t.cj && t.codename === def.code)) return;
    const type = (def.cjType && TICKET_TYPES.find(t => t.id === def.cjType)) ||
      TICKET_TYPES.find(t => t.id === "server") || pick(TICKET_TYPES.filter(t => t.id !== "shadow"));
    const dept = "Engineering";
    const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
    const npc = {
      id: 7300 + def.day, name: "Archive Technician", dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
      done: false, interviewed: false, diagnosed: false, correctDiag: false,
      critical: true, codename: def.code, cj: true, cjIntel: def.intel, personality: "security", pv: 0,
    };
    s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
    toast(`🚨 <b>${def.code}</b> — a Crown Jewel incident hits the board in Engineering`);
  }

  // ================= intel on Crown Jewel close =================
  const __origWin73 = winBattle;
  winBattle = function () {
    const b = B;
    __origWin73.apply(this, arguments);
    try {
      if (b && b.npc && b.npc.cj) {
        const def = CJ.find(d => d.code === b.npc.codename);
        const a = arc();
        if (def && !a.intel.includes(def.intel)) {
          a.intel.push(def.intel);
          setTimeout(() => dlg(`💠 CROWN JEWEL INTEL — ${def.intel}`, def.text, [{ t: "Log it.", f: closeDlg }]), 600);
        }
      }
    } catch (e) { }
  };

  // ================= day beats =================
  function day5Scene() {
    v73Cine([
      { img: 1, cap: "DAY 5 — MONDAY. Three printer outages, VPN down again... who keeps unplugging the label printer?!", zoom: "in" },
      { img: 1, cap: "“You going to the flight demonstration this afternoon?” — “Flight demonstration?”", zoom: "out", pan: 1 },
      { img: 0, cap: "LIVE — “Violinist Plays On Top of Flying Aircraft.” 15.8 million views.", zoom: "in" },
      { img: 0, cap: "...No way.", zoom: "in", pan: -1 },
      { img: 1, cap: "Felicia Cruz. The Violinist. Everyone knows her... except me.", zoom: "out" },
      { title: true, cap: "That case... there's more to it.<br><br><b>MISSION COMPLETE</b><br>LORE UNLOCKED — <b>FELICIA</b>: world-famous aerial violinist. Somehow knows more about IT than she should.<br><br><small>NEXT OBJECTIVE: investigate unusual access logs and Engineering data requests.</small>" },
    ], () => toast("📖 LORE UNLOCKED — FELICIA, THE VIOLINIST"));
    try { window.unlockGallery && unlockGallery("d5", "Day 5 — The Woman on the Wing"); } catch (e) { }
  }
  function day6Scene() {
    dlg("Nick — IT", "Did you SEE the stream?! 15.8 million! She's more famous than the CEO. Marketing's walking around like they won the championship.", [
      { t: "“Shouldn't she be heading back to Marketing?”", f: () => { closeDlg(); dlg("Mike — thought", "Shouldn't she be heading back to Marketing? ...So why was her badge near the Engineering network door at 19:42?", [{ t: "Hm.", f: closeDlg }]); } },
      { t: "Back to the queue.", f: closeDlg },
    ]);
  }
  function day7Scene() {
    v73Cine([
      { img: 2, cap: "DAY 7. Badge 41782 — FELICIA — ENG-NET: GRANTED. HANGAR ACCESS: GRANTED. ...Deleted entries recovered.", zoom: "in" },
      { img: 2, cap: "Why is Marketing accessing Engineering so often? Something's not adding up.", zoom: "out", pan: 1 },
      { img: 2, cap: "CAM 07 — ENG HALL, 18:21. She knows exactly where she's going.", zoom: "in", pan: -1 },
    ], () => spawnCJ(CJ[0]));
  }
  function day8Scene() {
    v73Cine([
      { img: 3, cap: "DAY 8, 16:00. The roof door was propped open. She plays like the shift never happened.", zoom: "in" },
      { img: 3, cap: "“You sound like you're saying goodbye.” — “hm.”", zoom: "out", pan: 1 },
      { img: 3, cap: "Her case lies open between you. On the lining, three words: Practice. Perfect. Protect.", zoom: "in", pan: -1 },
    ], () => {
      dlg("Felicia — rooftop", "“Control is the loudest song in this world. Music is the only truth.”", [
        { t: "“What aren't you telling me?”", f: () => { arc().talks++; closeDlg(); dlg("Felicia — rooftop", "“Orpheus was built to keep us safe. Then they decided who's worth saving.” She packs the violin away. “Ask me again when you've seen the archive.”", [{ t: "...", f: closeDlg }]); } },
        { t: "“Beautiful. Don't stop.”", f: () => { closeDlg(); toast("🎻 She plays one more as the sun goes down."); } },
      ]);
    });
  }
  function day9Scene() {
    spawnCJ(CJ[1]);
    toast("🌡️ STORAGE ARRAY 06 is overheating — Engineering needs hands");
  }
  function day9AfterIntel() {
    v73Cine([
      { img: 4, cap: "PROJECT ORPHEUS. Clearance: CROWN JEWEL. ACCESS DENIED.", zoom: "in" },
      { img: 4, cap: "Why would this be locked away? — “Looking for something, Mike?”", zoom: "out", pan: 1 },
    ], () => {
      dlg("Felicia — server room", "She's standing in the doorway, badge still warm from a door she shouldn't be able to open.", [
        { t: "“Tell me exactly what you're doing.”", f: () => { arc().talks++; closeDlg(); dlg("Felicia — server room", "“It predicts. It decides. It obeys orders.” A beat. “I won't let it decide for this city.”", [{ t: "...", f: closeDlg }]); } },
        { t: "“Just fixing the array.”", f: () => { closeDlg(); toast("👁️ She holds your look a second too long, then lets you pass."); } },
      ]);
    });
  }
  function day10Scene() { spawnCJ(CJ[2]); }

  // ================= day-10 finale =================
  function finale() {
    const a = arc(); if (a.choice) return;
    v73Cine([
      { img: 5, cap: "DAY 10 — RAIN. The roof again. Her laptop is open on the ledge: “Copying data. Again.”", zoom: "in" },
      { img: 5, cap: "“What are you doing, Felicia?” — “Getting what they buried.”", zoom: "out", pan: -1 },
      { img: 5, cap: "“The storm models say the south flood walls fail. Orpheus ran the evacuation — and buried it, because the math said those districts aren't worth the cost.”", zoom: "in" },
      { img: 5, cap: "“I need the Crown Jewel archive to force the truth into the open before the storm does. Walk with me.”", zoom: "out", pan: 1 },
    ], showChoice);
  }
  function showChoice() {
    const a = arc(), clues = clueCount(), intel = a.intel.length;
    const canReport = clues >= 8, canHelp = intel >= 3, canTrue = canReport && canHelp && a.talks >= 2;
    const opts = [];
    if (canTrue) opts.push({
      t: "🤝 DUET — Change the future together", f: () => endGame("TRUE",
        "You earned all trust. You uncovered everything.<br><br>You don't hand her the drive — you walk in beside her. Orpheus doesn't get to decide anymore, because someone who reads the logs and someone who opens the doors finally want the same thing.<br><br><b>TRUE ENDING — NEW HAVEN COUNTS ON US.</b>")
    });
    opts.push({
      t: `⚖️ REPORT FELICIA — Protect AeroTech${canReport ? "" : ` (need all 8 clues — have ${clues})`}`,
      dis: !canReport, f: () => endGame("A",
        "You call it in. Security arrives; she doesn't run. The archive seals itself behind her.<br><br>Months later the storm comes, the south districts flood, and the truth stays buried. She chose the city. You chose the company. The system didn't change — it just got stronger.<br><br><b>ENDING A — PERFECT EMPLOYEE.</b>")
    });
    opts.push({
      t: `💚 HELP FELICIA — Protect New Haven${canHelp ? "" : ` (need all 3 Crown Jewel intel pieces — have ${intel})`}`,
      dis: !canHelp, f: () => endGame("B",
        "You hand her the drive. At dawn the evacuation model is on every screen in New Haven, and the city moves before the storm does.<br><br>Together you uncover the real threat — not a hacker, but a system allowed to decide who's worth saving.<br><br><b>ENDING B — LET'S SAVE THE CITY.</b>")
    });
    opts.push({ t: "Not yet — walk away.", f: () => { closeDlg(); toast("The roof, the rain, and the choice wait for you. (Talk to Felicia again before the day ends.)"); } });
    dlg("DAY 10 — THE CHOICE", "Rain on the roof. The case open between you. Whatever you decide, New Haven is watching.", opts);
  }
  function endGame(id, text) {
    const a = arc(); a.choice = id; a.ending = id;
    closeDlg();
    recordEnding(id);
    try { window.unlockGallery && unlockGallery("ending_" + id, id === "A" ? "Ending A — Perfect Employee" : id === "B" ? "Ending B — Let's Save the City" : "True Ending — New Haven Counts On Us"); } catch (e) { }
    v73Cine([{ title: true, cap: text + "<br><br><small>The run continues — the backlog never ends. (Ending saved.)</small>" }], () => {
      toast(id === "TRUE" ? "🏆 TRUE ENDING unlocked" : `🏆 ENDING ${id} unlocked`);
    });
  }

  // ================= scheduling =================
  const __origSetupDay73 = setupDay;
  setupDay = function () {
    const r = __origSetupDay73.apply(this, arguments);
    const s = S, a = arc(), d = s.day;
    if (d >= 5 && d <= 10 && !a.seen["d" + d]) {
      a.seen["d" + d] = true;
      setTimeout(() => {
        if (d === 5) day5Scene();
        else if (d === 6) day6Scene();
        else if (d === 7) day7Scene();
        else if (d === 9) day9Scene();
        else if (d === 10) day10Scene();
      }, 2600);
    }
    return r;
  };

  // clock-driven beats: day-8 rooftop (16:00) and the day-10 finale
  const __origHUD73 = updateHUD;
  updateHUD = function () {
    const r = __origHUD73.apply(this, arguments);
    try {
      const s = S, a = arc();
      if (cineOpen || s.inBattle || s.inDialog || s.room) return r;
      if (s.day === 8 && s.clock >= 16 * 60 && !a.seen.d8roof) { a.seen.d8roof = true; day8Scene(); }
      if (s.day === 10 && s.clock >= 16 * 60 && !a.seen.d10fin) { a.seen.d10fin = true; finale(); }
      // day-9 follow-up scene right after the evac intel lands
      if (s.day === 9 && a.intel.includes("CITY EVACUATION MODEL") && !a.seen.d9cine) { a.seen.d9cine = true; day9AfterIntel(); }
    } catch (e) { }
    return r;
  };

  // ================= styles =================
  const st = document.createElement("style");
  st.textContent = `
#v73-cine{position:fixed;inset:0;z-index:900;background:#05060d;font-family:'Press Start 2P',monospace}
#v73-cine .v73-cv{position:absolute;inset:0;width:100%;height:100%}
#v73-cine .v73-bar{position:absolute;left:0;right:0;height:8vh;background:#000;z-index:2}
#v73-cine .v73-bar.top{top:0}#v73-cine .v73-bar.bot{bottom:0}
#v73-cine .v73-capwrap{position:absolute;left:50%;transform:translateX(-50%);bottom:10vh;width:min(860px,92vw);
 background:rgba(8,10,20,.92);border:2px solid #46536e;border-radius:10px;padding:16px 18px 10px;z-index:3;
 box-shadow:0 0 30px #000c;animation:v71-pop .3s ease}
#v73-cine .v73-cap{color:#e8ecf5;font-size:12px;line-height:1.9;min-height:44px}
#v73-cine .v73-cap b{color:#ffd24a}#v73-cine .v73-cap small{color:#8fa0c8}
#v73-cine .v73-hint{color:#55608a;font-size:8px;margin-top:10px;text-align:right}`;
  document.head.appendChild(st);

  window.v73 = { cine: v73Cine, arc, spawnCJ, finale, CJ, clueCount };
  console.log("[v7.3] The Woman on the Wing loaded");
})();

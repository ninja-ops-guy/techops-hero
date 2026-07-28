// v6.4 "Felicia — Watchdog Protocol": hidden APT boss, investigation clues, playable Felicia,
// max stats + legendary gear, modded black Impreza (super fast + war-driving), Watchdog intel mode.
(function () {
  const FEL_VER = "6.4.0";

  // ---------- state ----------
  function fel() {
    const s = S; s.meta._fel = s.meta._fel || {
      met: 0, clues: [], trust: 0, defeated: false, unlocked: false,
      pos: null, spots: null, blockedDay: 0,
      intel: { employees: 0, systems: 0, facilities: 0, security: 0 },
      scanned: [], zones: [], ao: {}, aoDay: 0, suspicion: 0, wv: true, wdTiles: 0, blendTiles: 0
    };
    return s.meta._fel;
  }
  const isFel = () => !!(S && S.meta && S.meta._char === "felicia");
  const felUnlocked = () => { try { const d = load(); return !!(d && d.meta && d.meta._fel && d.meta._fel.unlocked); } catch (e) { return false; } };

  // ---------- sprites ----------
  const felImg = new Image();
  if (typeof TO_FELICIA !== "undefined") felImg.src = TO_FELICIA;
  const FELC = (typeof FEL_ATLAS !== "undefined") ? FEL_ATLAS.cell : 128;
  function felFrame(key) { return (typeof FEL_ATLAS !== "undefined" ? FEL_ATLAS.frames[key] : null) || [0, 0]; }
  let _felPortraitURL = null;
  function felPortraitURL() {
    if (_felPortraitURL) return _felPortraitURL;
    if (!felImg.complete || !felImg.naturalWidth) return null;
    const c = document.createElement("canvas"); c.width = c.height = FELC;
    c.getContext("2d").drawImage(felImg, 4 * FELC, 0, FELC, FELC, 0, 0, FELC, FELC);
    return (_felPortraitURL = c.toDataURL("image/png"));
  }
  function felDlg(title, html, opts) {
    dlg(title, html, opts);
    const pu = felPortraitURL();
    const txt = document.getElementById("dlg-text");
    if (pu && txt) {
      const im = document.createElement("img");
      im.src = pu; im.className = "v64-portrait"; im.alt = "Felicia";
      txt.parentElement.insertBefore(im, txt);
    }
  }

  // ---------- clues ----------
  const FEL_CLUES = [
    { id: "badge", x: 21, y: 30, icon: "🪪", label: "Badge Logs", text: "Her badge opens buildings she was never assigned to. Facilities has no record of a request." },
    { id: "wifi", x: 26, y: 14, icon: "📶", label: "Café Table", text: "Her laptop has never once joined ORION-GUEST. Not once in 243 days." },
    { id: "cam", x: 3, y: 3, icon: "📷", label: "Camera Sync", text: "Corridor cameras drop four seconds of sync whenever she badges through." },
    { id: "usb", x: 6, y: 10, icon: "💾", label: "Lab Bench", text: "Two USB forensics dongles vanished from the Engineering lab the afternoon she 'helped' there." },
    { id: "launch", x: 24, y: 3, icon: "🛰️", label: "Launch Schedule", text: "The launch manifest printer logged a page pulled at 00:12 — on her badge." },
    { id: "scans", x: 5, y: 26, icon: "📡", label: "Network Closet", text: "Internal scan spikes originate near the café SSID, minutes after she leaves." },
    { id: "early", x: 8, y: 15, icon: "☕", label: "Break Room", text: "She badged in at 05:58 every day for months — before the cleaning crew." },
    { id: "beacon", x: 34, y: 27, icon: "🖧", label: "Rack 04", text: "Rack 04 beacons small encrypted bursts to an unknown external host at 03:00, daily." },
  ];

  function foundClue(c) {
    const f = fel();
    f.clues.push(c.id);
    addXP(12);
    S.journal.push({ day: S.day, title: `🔍 Clue: ${c.label}`, body: c.text });
    toast(`🔍 CLUE ${f.clues.length}/${FEL_CLUES.length} — ${c.label}`);
    save();
    const left = FEL_CLUES.length - f.clues.length;
    felDlg(`🔍 ${c.label}`, `${c.text}<br><br><small>Each clue alone is explainable. Together they reveal a pattern. (${f.clues.length}/${FEL_CLUES.length}${left ? ` — ${left} left` : ""})</small>${f.clues.length >= 5 && !f.defeated ? "<br><br><b>You have enough to confront her. Find Felicia.</b>" : ""}`,
      [{ t: "Log it in the case file", f: closeDlg }]);
  }

  // ---------- felicia npc ----------
  function feliciaTalk() {
    const f = fel();
    f.met++;
    const opts = [];
    if (f.met === 1) {
      felDlg("🖨️ Felicia — Break Room", `<i>A contractor wrestles with the office printer. She laughs.</i><br><br>"Technology always breaks at the worst possible time. You're IT, right? Any chance you could take a look?"<br><br><small>The jam is legitimate. She's not playing you. Probably.</small>`, [
        { t: "🔧 Clear the jam & reset the spooler", f: () => { f.trust++; addXP(8); closeDlg(); toast("🙂 Felicia remembers your name. +trust, +8 XP"); felDlg("☕ Felicia", '"Thanks — you\'re a lifesaver. I\'m Felicia, systems integration. I\'m around if you ever need an extra pair of hands on tooling."', [{ t: "Good to meet you", f: closeDlg }]); } },
        { t: "“Have you tried turning it off and on?”", f: () => { closeDlg(); toast("She smiles politely. It somehow feels like a test you barely passed."); } },
      ]);
      return;
    }
    if (f.met === 2) {
      felDlg("💻 Felicia — Campus Café", `<i>She's outside with her laptop, rain on the awning, coffee gone cold.</i><br><br>"Sometimes the best place to think is somewhere nobody expects you to work."<br><br><i>She closes the laptop as you approach. A second too fast.</i>`, [
        { t: "“What are you working on?”", f: () => { closeDlg(); felDlg("💻 Felicia", '"Documentation. Boring stuff." <br><br><small>Her laptop sticker: an aerospace logo. Look closer — the stars form a tiny constellation. MORNINGSTAR.</small>', [{ t: "…Interesting sticker", f: () => { f.trust++; closeDlg(); } }]); } },
        { t: "Leave her to it", f: closeDlg },
      ]);
      return;
    }
    if (f.met === 3) {
      felDlg("🚶 Felicia — Engineering Hallway", `"Heard the flight sim server was having issues again. Rough timing with the launch window."<br><br><i>You never told her that. Nobody was talking about it.</i>`, [
        { t: "“How did you know that?”", f: () => { closeDlg(); felDlg("🚶 Felicia", '"Everyone was talking about it."<br><br><small>They weren\'t. File that away.</small>', [{ t: "…Right", f: closeDlg }]); } },
        { t: "Let it slide", f: () => { f.trust++; closeDlg(); } },
      ]);
      return;
    }
    // recurring talks: hints + confrontation
    const remaining = FEL_CLUES.filter(c => !f.clues.includes(c.id));
    let hint = "";
    if (f.defeated) hint = "Her desk is empty. Her records are gone.";
    else if (f.clues.length >= 5) hint = "<b>You have enough evidence to confront her.</b>";
    else if (remaining.length) hint = `<small>She's careful, but patterns leak. Maybe check the <b>${remaining[0].label}</b>.</small>`;
    if (f.clues.length >= 5 && !f.defeated) {
      opts.push({ t: "⚡ Present the evidence — CONFRONT HER", f: () => { closeDlg(); confrontFelicia(); } });
    }
    opts.push({ t: "Make small talk", f: () => { f.trust++; closeDlg(); toast(`🙂 Trust ${f.trust} · Clues ${f.clues.length}/${FEL_CLUES.length}`); } });
    opts.push({ t: "Walk away", f: closeDlg });
    felDlg("🕶️ Felicia", `"Back again? You always find me."<br><br>${hint}`, opts);
  }

  function confrontFelicia() {
    const f = fel();
    const ev = Math.min(10, Math.round(f.clues.length / FEL_CLUES.length * 10));
    const bar = (n) => "█".repeat(n) + "░".repeat(10 - n);
    felDlg("⚠️ OPERATION STATUS", `You lay it out: badge logs, camera gaps, the 03:00 beacon, the café scans. Her expression doesn't change — but her coffee stops halfway to her lips.<br><br><pre>IDENTITY EXPOSURE   ${bar(ev)}\nNETWORK CONTROL     ${bar(8)}\nEVIDENCE COLLECTED  ${bar(Math.min(10, f.clues.length + 2))}\nTRUST LEVEL         ${bar(Math.min(10, f.trust + 3))}</pre><br>"...You saw the pattern. Most never look closely enough."`, [
      { t: "🔥 Expose the operation (BOSS FIGHT)", f: () => { closeDlg(); feliciaBattle(); } },
      { t: "Not yet — keep gathering", f: closeDlg },
    ]);
  }

  // ---------- boss battle: THE HUNT ----------
  const FEL_TYPE = { id: "apt", label: "UNKNOWN PERSISTENCE", icon: "🕶️", enemy: "APT-17 MORNINGSTAR", eicon: "🕶️", world: "The Identity Graph", wbg: "#0b0f1a", stat: "security", diag: { best: "Correlate badge, camera & beacon evidence into one timeline", okay: "Isolate Rack 04 and revoke contractor certs", wrong: ["Wipe the café router", "Reimage her laptop immediately", "Disable every contractor account", "Ignore the 03:00 beacon"] } };
  function feliciaBattle() {
    const s = S, f = fel();
    if (!TICKET_TYPES.some(t => t.id === "apt")) TICKET_TYPES.push(FEL_TYPE);
    const pos = f.pos || { x: s.px, y: s.py };
    const npc = { id: 999, name: "Felicia Voss", dept: "Engineering", type: FEL_TYPE, x: pos.x, y: pos.y, face: "🕶️", critical: true, codename: "MORNINGSTAR", personality: "problem", age: 0, pv: 0, done: false };
    s.npcs.push(npc);
    const portal = { npc: 999, x: pos.x, y: pos.y };
    s.portals.push(portal);
    startBattle(portal);
    // override into a true APT hunt
    B.felicia = true;
    B.hp = B.maxHp = 130;
    B.uncertainty = 80;
    document.getElementById("enemy-name").textContent = "🕶️ APT-17 «MORNINGSTAR» — FELICIA VOSS 🕶️";
    document.getElementById("enemy-sprite").textContent = "🕶️";
    blog(`<span class="sys">⚠️ <b>«MORNINGSTAR»</b> — Three fronts at once: <b>physical</b> (where is she operating?), <b>digital</b> (kill the persistence: ORBIT · ECHO · LANTERN), <b>psychological</b> (understand why). Gather evidence, hypothesize, contain — don't break production doing it.</span>`);
    if (typeof v63Card === "function") v63Card("⚠️ THE HUNT", "EXPOSE THE OPERATION", "#ff416c");
  }

  function feliciaDefeated() {
    const f = fel();
    f.defeated = true; f.unlocked = true; f.pos = null;
    save();
    setTimeout(() => {
      if (typeof v63Card === "function") v63Card("✅ OPERATION EXPOSED", "MORNINGSTAR STANDS DOWN", "#39ff88");
      felDlg("🌅 GOOD ENDING — The Pattern", `Felicia realizes she's been identified — and stands down before irreversible damage is done.<br><br>She leaves behind encrypted notes documenting every overlooked weakness she found. Orion's defenses get stronger because of her.<br><br><i>"You saw the pattern before anyone else did. Most never look closely enough."</i><br><br><b>🔓 UNLOCKED: FELICIA VOSS — WATCHDOG PROTOCOL</b><br><small>Play as her from the title screen: max stats, legendary gear, and her modded black Impreza.</small>`,
        [{ t: "One day, I'll understand her", f: closeDlg }]);
    }, 900);
  }
  function feliciaEscaped() {
    const f = fel();
    f.pos = null; // she goes dark for the day
    setTimeout(() => {
      felDlg("🌑 She Slipped Away", `The evidence wasn't airtight. By morning her desk is empty, her laptop gone, her badge deactivated.<br><br>On an abandoned workstation, one message:<br><br><i>"You were looking at the alerts. I was watching the people."</i><br><br><small>She'll resurface. Keep your clues — try again tomorrow.</small>`,
        [{ t: "I'll be ready", f: closeDlg }]);
    }, 900);
  }

  const __origWinBattle64 = winBattle;
  winBattle = function () { const wasFel = !!(B && B.felicia); __origWinBattle64(); if (wasFel) feliciaDefeated(); };
  const __origLoseBattle64 = loseBattle;
  loseBattle = function () { const wasFel = !!(B && B.felicia); __origLoseBattle64(); if (wasFel) feliciaEscaped(); };

  // ---------- character select ----------
  const __origNewState64 = newState;
  newState = function () {
    const s = __origNewState64();
    try { if (localStorage.getItem("techops_char") === "felicia") s.meta._char = "felicia"; } catch (e) { }
    return s;
  };

  function applyFeliciaLoadout(s) {
    if (s.meta._felGeared) return;
    s.meta._felGeared = true;
    s.stats = { networking: 10, windows: 10, linux: 10, cloud: 10, security: 10, programming: 10, hardware: 10, automation: 10 };
    s.maxHp = 120; s.hp = 120;
    s.inv.push(
      { name: "MORNINGSTAR Deck", icon: "🕶️", stat: "security", val: 12, rarity: "legendary" },
      { name: "Ghost Rig", icon: "💻", stat: "programming", val: 12, rarity: "legendary" },
      { name: "ORBIT Headset", icon: "🎧", stat: "networking", val: 12, rarity: "legendary" }
    );
    if (!s.lab.includes("impreza")) s.lab.push("impreza");
  }

  // ---------- setupDay: place felicia + clue spots, apply loadout ----------
  const __origSetupDay64 = setupDay;
  setupDay = function () {
    __origSetupDay64();
    const s = S, f = fel();
    f.spots = FEL_CLUES.map(c => { const p = freeSpot(s.map, c.x, c.y); return Object.assign({}, c, { x: p.x, y: p.y }); });
    f.scanned = []; f.zones = []; f.wdTiles = 0;
    f.suspicion = Math.max(0, f.suspicion - 30);
    if (!f.defeated) {
      // two recurring locations: break area (even days), campus café (odd days)
      const spot = (s.day % 2 === 0) ? freeSpot(s.map, 8, 15) : freeSpot(s.map, 26, 14);
      f.pos = spot;
    } else f.pos = null;
    if (isFel()) {
      applyFeliciaLoadout(s);
      s.hp = s.maxHp;
      if (s.day !== f.aoDay) { f.ao = {}; f.aoDay = s.day; }
      ensureFelPanel();
      updateFelPanel();
      if (!s.meta._felIntro) {
        s.meta._felIntro = true;
        setTimeout(() => {
          if (typeof v63Card === "function") v63Card("🕶️ WATCHDOG PROTOCOL", "OBSERVE · COLLECT · ANALYZE · DECIDE", "#00d9ff");
          felDlg("🕶️ WATCHDOG PROTOCOL", `No tickets. No queue. The campus is your sensor grid.<br><br><b>WATCHDOG VIEW</b> is active — walk near people, devices and portals to gather intelligence. Complete today's <b>Actions on Objectives</b>.<br><br>Cover matters: scans raise <b>suspicion</b>. Blend in (keep moving, act normal) to work it off. The Impreza is yours — <b>war-drive</b> the lot for extra cash.`, [{ t: "Fade into the routine", f: closeDlg }]);
        }, 600);
      }
    }
  };

  // ---------- speed: modded black Impreza (super fast) ----------
  const __origStep64 = step;
  let _v64Last = null;
  step = function (dt) {
    __origStep64(dt);
    const s = S; if (!s || !s.map || s.inDialog || s.inBattle) return;
    if (isFel() && s.lab.includes("impreza") && s.moving) __origStep64(dt * 1.4); // 2.4x — she drives, not walks
    // war driving + blending + watchdog proximity scans
    if (!isFel()) { _v64Last = { x: s.px, y: s.py }; return; }
    const f = fel();
    const moved = !_v64Last || _v64Last.x !== s.px || _v64Last.y !== s.py;
    _v64Last = { x: s.px, y: s.py };
    if (!moved) return;
    if (s.lab.includes("impreza")) {
      f.wdTiles++;
      if (f.wdTiles >= 14) {
        f.wdTiles = 0;
        const ap = pick(["ORION-GUEST", "HANGAR-IOT", "CAFÉ-POS", "VISITOR-5G", "LEGACY-SCADA", "PRN-FLEET", "SAT-UPLINK-LAB"]);
        const cash = R(6, 18);
        s.budget += cash;
        toast(`📡 War drive: snagged open AP <b>${ap}</b> — +$${cash}`);
      }
    }
    f.blendTiles++;
    if (f.blendTiles >= 30) { f.blendTiles = 0; if (f.suspicion > 0) { f.suspicion--; updateFelPanel(); } }
    if (f.wv) felScan();
  };

  // ---------- watchdog protocol: intel gathering ----------
  const FEL_AOS = [
    { id: "ao1", key: "employees", need: 5, text: "Profile 5 employees", reward: 80 },
    { id: "ao2", key: "systems", need: 8, text: "Map 8 systems", reward: 100 },
    { id: "ao3", key: "facilities", need: 4, text: "Chart 4 facility zones", reward: 90 },
    { id: "ao4", key: "security", need: 3, text: "Expose 3 attack paths", reward: 120 },
  ];
  function felBumpSuspicion(n) {
    const f = fel();
    f.suspicion = Math.min(100, f.suspicion + n);
    if (f.suspicion >= 100 && f.blockedDay !== S.day) {
      f.blockedDay = S.day; f.suspicion = 60;
      toast("🚨 <b>MIKE IS INVESTIGATING</b> — scans burned for today. Blend in.", 4200);
      if (typeof v63Card === "function") v63Card("🚨 COUNTER-INTEL", "THE ANALYST IS ONTO YOU", "#ff416c");
    } else if (f.suspicion >= 70) {
      toast("⚠️ Security is noticing a pattern. Blend in.", 3000);
    }
    updateFelPanel();
  }
  function felScan() {
    const s = S, f = fel();
    if (f.blockedDay === s.day) return;
    const near = (x, y, d) => Math.abs(x - s.px) + Math.abs(y - s.py) <= d;
    for (const n of s.npcs) {
      const k = "n" + n.id;
      if (!f.scanned.includes(k) && near(n.x, n.y, 2)) {
        f.scanned.push(k); f.intel.employees++;
        toast(`👤 Profiled: <b>${n.name}</b> — ${n.dept || "staff"} · routine logged (+intel)`);
        felBumpSuspicion(5); checkAOs();
      }
    }
    for (const d of s.devices) {
      const k = "d" + d.x + "_" + d.y;
      if (!f.scanned.includes(k) && near(d.x, d.y, 2)) {
        f.scanned.push(k); f.intel.systems++;
        toast(`🖥️ Mapped device @ ${d.x},${d.y} — firmware & services fingerprinted (+intel)`);
        felBumpSuspicion(4); checkAOs();
      }
    }
    for (const p of s.portals) {
      const k = "p" + p.x + "_" + p.y;
      if (!f.scanned.includes(k) && near(p.x, p.y, 3)) {
        f.scanned.push(k); f.intel.security++;
        toast(`🕳️ Attack path exposed — unpatched corruption vector charted (+intel)`);
        felBumpSuspicion(6); checkAOs();
      }
    }
    const z = zoneAt(s.px, s.py);
    if (!f.zones.includes(z)) {
      f.zones.push(z); f.intel.facilities++;
      toast(`🗺️ Zone charted: <b>${z.toUpperCase()}</b> — patrol rhythm & blind spots noted (+intel)`);
      felBumpSuspicion(2); checkAOs();
    }
  }
  function checkAOs() {
    const s = S, f = fel();
    for (const ao of FEL_AOS) {
      if (!f.ao[ao.id] && f.intel[ao.key] >= ao.need) {
        f.ao[ao.id] = true;
        s.budget += ao.reward;
        addXP(20);
        toast(`✅ OBJECTIVE COMPLETE: ${ao.text} — +$${ao.reward}, +20 XP`, 3600);
        save();
      }
    }
    if (FEL_AOS.every(a => f.ao[a.id]) && !f.ao.all) {
      f.ao.all = true;
      addXP(150);
      if (typeof v63Card === "function") v63Card("🛰️ OPERATION ADVANCED", "ALL OBJECTIVES COMPLETE", "#00d9ff");
      toast("🛰️ <b>OPERATION ADVANCED</b> — the intelligence picture is complete. +150 XP", 5000);
    }
    updateFelPanel();
  }

  // ---------- watchdog HUD panel ----------
  function ensureFelPanel() {
    if (document.getElementById("v64-panel")) return;
    const el = document.createElement("div");
    el.id = "v64-panel";
    el.innerHTML = `<div class="v64-h">🛰️ WATCHDOG <button id="v64-wv" title="toggle watchdog view">VIEW: ON</button></div>
      <div class="v64-row"><span>EMPLOYEES</span><b id="v64-e">0</b></div>
      <div class="v64-row"><span>SYSTEMS</span><b id="v64-sy">0</b></div>
      <div class="v64-row"><span>FACILITIES</span><b id="v64-f">0</b></div>
      <div class="v64-row"><span>SECURITY</span><b id="v64-se">0</b></div>
      <div class="v64-row v64-sus"><span>SUSPICION</span><b id="v64-su">0%</b></div>
      <div class="v64-ao" id="v64-ao"></div>`;
    document.body.appendChild(el);
    el.querySelector("#v64-wv").onclick = () => {
      const f = fel(); f.wv = !f.wv;
      el.querySelector("#v64-wv").textContent = f.wv ? "VIEW: ON" : "VIEW: OFF";
      toast(f.wv ? "🛰️ WATCHDOG VIEW ACTIVE — the campus lights up" : "WATCHDOG VIEW off");
    };
  }
  function updateFelPanel() {
    const el = document.getElementById("v64-panel"); if (!el || typeof S === "undefined" || !S) return;
    const f = fel();
    el.querySelector("#v64-e").textContent = f.intel.employees;
    el.querySelector("#v64-sy").textContent = f.intel.systems;
    el.querySelector("#v64-f").textContent = f.intel.facilities;
    el.querySelector("#v64-se").textContent = f.intel.security;
    const su = el.querySelector("#v64-su");
    su.textContent = f.suspicion + "%";
    su.style.color = f.suspicion >= 70 ? "#ff416c" : f.suspicion >= 40 ? "#ffc857" : "#39ff88";
    el.querySelector("#v64-ao").innerHTML = FEL_AOS.map(a => `<div class="${f.ao[a.id] ? "done" : ""}">${f.ao[a.id] ? "✅" : "▫️"} ${a.text}</div>`).join("");
  }
  const __origUpdateHUD64 = updateHUD;
  updateHUD = function () { __origUpdateHUD64(); if (isFel()) updateFelPanel(); };
  window.fel = fel; window.feliciaBattle = feliciaBattle; window.felScan = felScan; window.isFel = isFel; window.felCheckAOs = checkAOs;

  // ---------- rendering: felicia npc, clue markers, watchdog overlays, playable sprite ----------
  function drawFeliciaAt(x, y, frame, flip, size, tm) {
    if (!felImg.complete || !felImg.naturalWidth) return;
    const [cx, cy] = felFrame(frame);
    const dw = size, dh = size;
    const bob = Math.sin((tm || 0) / 500) * 1.2;
    const dx = x * TILE + (TILE - dw) / 2, dy = y * TILE + TILE - dh + 3 + bob;
    ctx.save();
    if (flip) { ctx.translate(dx + dw, 0); ctx.scale(-1, 1); ctx.drawImage(felImg, cx * FELC, cy * FELC, FELC, FELC, 0, dy, dw, dh); }
    else ctx.drawImage(felImg, cx * FELC, cy * FELC, FELC, FELC, dx, dy, dw, dh);
    ctx.restore();
  }
  function drawCarAt(rx, ry, tm) {
    if (!felImg.complete || !felImg.naturalWidth) return;
    const dw = 54, dh = 54;
    const dx = rx * TILE + (TILE - dw) / 2, dy = ry * TILE + TILE - dh + 6;
    ctx.save();
    ctx.globalAlpha = .95;
    ctx.drawImage(felImg, 5 * FELC, 0, FELC, FELC, dx, dy, dw, dh);
    ctx.restore();
  }

  const __origDraw64 = draw;
  draw = function () {
    __origDraw64();
    const s = S; if (!s || !s.map) return;
    const f = fel();
    const tm = performance.now();
    // v6.8 fix: overlays must render in WORLD space (camera transform), not screen space —
    // otherwise Felicia, clue markers and watchdog rings stick to the screen while scrolling
    const ts64 = cv.height / 14, sc64 = ts64 / TILE;
    ctx.save(); ctx.scale(sc64, sc64); ctx.translate(-camX, -camY);
    // clue markers
    if (f.spots && !f.defeated && !isFel()) {
      for (const c of f.spots) {
        if (f.clues.includes(c.id)) continue;
        const pulse = .6 + .4 * Math.sin(tm / 350 + c.x);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.font = "15px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(c.icon, c.x * TILE + TILE / 2, c.y * TILE + TILE / 2 - 4);
        ctx.globalAlpha = pulse * .8;
        ctx.strokeStyle = "#00d9ff"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(c.x * TILE + TILE / 2, c.y * TILE + TILE / 2, 10 + 2 * Math.sin(tm / 350 + c.x), 0, 7); ctx.stroke();
        ctx.restore();
      }
    }
    // felicia npc
    if (f.pos && !f.defeated && !isFel()) {
      drawFeliciaAt(f.pos.x, f.pos.y, "down0", false, 42, tm);
      ctx.save();
      ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#0b0f1a"; ctx.globalAlpha = .7;
      ctx.fillRect(f.pos.x * TILE - 8, f.pos.y * TILE - 12, 48, 10);
      ctx.globalAlpha = 1; ctx.fillStyle = "#00d9ff";
      ctx.fillText("Felicia", f.pos.x * TILE + TILE / 2, f.pos.y * TILE - 4);
      ctx.restore();
    }
    // watchdog view overlays
    if (isFel() && f.wv) {
      const ring = (x, y, color, r0) => {
        ctx.save();
        ctx.globalAlpha = .55 + .35 * Math.sin(tm / 300 + x + y);
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, r0 + 2 * Math.sin(tm / 300 + x), 0, 7); ctx.stroke();
        ctx.restore();
      };
      for (const n of s.npcs) ring(n.x, n.y, n.critical ? "#ff416c" : n.ambient ? "#39ff88" : "#ffc857", 13);
      for (const d of s.devices) ring(d.x, d.y, "#00d9ff", 11);
      for (const p of s.portals) ring(p.x, p.y, "#ff416c", 14);
      // network pulse: lines from player to nearest mapped entities
      ctx.save();
      ctx.globalAlpha = .25; ctx.strokeStyle = "#00d9ff"; ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -tm / 40;
      const c0 = { x: s.px * TILE + TILE / 2, y: s.py * TILE + TILE / 2 };
      for (const n of s.npcs.slice(0, 8)) {
        ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(n.x * TILE + TILE / 2, n.y * TILE + TILE / 2); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore(); // v6.8: end world-space transform
  };

  // playable felicia sprite (replaces Mike) + impreza
  const __origDrawPlayer64 = drawPlayer;
  drawPlayer = function (s, tm) {
    if (!isFel() || !felImg.complete || !felImg.naturalWidth) {
      // guard: skip frames until the player atlas finishes decoding (avoids broken-state drawImage)
      try { if (typeof playerImg !== "undefined" && !(playerImg.complete && playerImg.naturalWidth)) return; } catch (e) { }
      return __origDrawPlayer64(s, tm);
    }
    // own eased position (independent smooth walk)
    if (s._v64rx === undefined || Math.abs(s._v64rx - s.px) > 2) { s._v64rx = s.px; s._v64ry = s.py; }
    const k = .28;
    s._v64rx += (s.px - s._v64rx) * k; s._v64ry += (s.py - s._v64ry) * k;
    const rx = s._v64rx, ry = s._v64ry;
    const fx = s.fx || "down";
    let frame = "down0", flip = false;
    if (s.inDialog) frame = "violin";
    else if (fx === "up") frame = "up0";
    else if (fx === "right") frame = "right0";
    else if (fx === "left") { frame = "right0"; flip = true; }
    if (s.lab.includes("impreza") && s.moving) drawCarAt(rx, ry, tm);
    drawFeliciaAt(rx, ry, frame, flip, 46, s.moving ? tm : 0);
  };

  // ---------- interaction ----------
  const __origInteract64 = interact;
  interact = function () {
    const s = S;
    if (s && !s.inBattle && !s.inDialog) {
      const f = fel();
      const p = { x: s.px, y: s.py };
      if (!isFel() && f.pos && !f.defeated && Math.abs(f.pos.x - p.x) + Math.abs(f.pos.y - p.y) <= 1) return feliciaTalk();
      if (!isFel() && f.spots) {
        const c = f.spots.find(c => !f.clues.includes(c.id) && Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1);
        if (c) return foundClue(c);
      }
    }
    return __origInteract64();
  };

  // ---------- title screen: character select ----------
  (function felTitle() {
    try {
      if (!felUnlocked()) return;
      const ts = document.getElementById("title-screen"); if (!ts) return;
      const b = document.createElement("button");
      b.id = "btn-felicia";
      b.textContent = "🕶️ WATCHDOG PROTOCOL — PLAY AS FELICIA";
      b.onclick = () => { localStorage.setItem("techops_char", "felicia"); document.getElementById("btn-start").click(); };
      ts.appendChild(b);
      const back = document.createElement("div");
      back.id = "v64-backmike";
      back.textContent = "← play as Mike instead";
      back.style.display = localStorage.getItem("techops_char") === "felicia" ? "block" : "none";
      back.onclick = () => { localStorage.removeItem("techops_char"); location.reload(); };
      ts.appendChild(back);
    } catch (e) { }
  })();

  // ---------- robustness: night-mode platform race (NM non-null but platforms not yet assigned) ----------
  if (typeof stepNM === "function") {
    const __origStepNM64 = stepNM;
    stepNM = function (dt) { if (typeof NM !== "undefined" && NM && !Array.isArray(NM.platforms)) return; return __origStepNM64(dt); };
  }
  if (typeof drawNM === "function") {
    const __origDrawNM64 = drawNM;
    drawNM = function () { if (typeof NM !== "undefined" && NM && !Array.isArray(NM.platforms)) return; return __origDrawNM64(); };
  }

  console.log(`[v6.4] Felicia — Watchdog Protocol loaded (${FEL_VER})`);
})();
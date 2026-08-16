/* ==========================================================================
   v7.33 — FRIENDS IN HIGH PLACES (the Waldo pack)
   Waldo — Mike's longtime friend: satellite threat-intelligence contact,
   backyard mechanic, porch philosopher. This pack wires his brief into the
   existing systems only (no parallel frameworks):
     · WALDO'S PLACE — a social night destination on the Charger's district
       map (v7.31 hub). Walk his property: mow the lawn, work the garage,
       porch hangouts, satellite watching, the grill. No combat here.
     · STRESS MATTERS — the brief's stress tiers now bite: burned-out Mikes
       oversleep (day starts 09:30), clear-headed Mikes wake early (08:30
       start = the recovered morning block, once per day by construction).
     · MIKE'S CAR — condition parts (engine/tires/brakes/battery/body) wear
       with every district drive; worn cars can break down (+time, +stress).
       Waldo's garage (Homie tier+) fixes parts cheap via a hold-the-light
       coop minigame; Midnight Tune-Up grants ROAD READY (no breakdowns).
     · REPUTATION — tiers 0..5 (Contact / Homie / Trusted / Family /
       Inner Orbit / Ride or Die), earned mostly by showing up.
     · THREAT-INTEL SKILLS — equippable augments (2 slots) that modify the
       v7.31 night combat in place: Orbital Trace, Telemetry Link,
       Signal Intercept, Ground Station Pivot, Low-Orbit Relay,
       Threat Forecast. Bought with cash at Waldo's satellite dish or earned
       from his quests. They change moves, not stats.
     · QUEST CINEMATICS on the shared v7.25 engine: waldo_meet (first
       visit), waldo_smoke (porch, tier 1), waldo_tracker (Check Engine
       Friendship — the tracker behind the dash, choice persisted in
       S.meta._v733tracker and read by the Orpheus arc).
     · GHOST SHIFT SEED — cracking a major incident tree draws an encrypted
       message the next night; a crescent-cursor tag appears in the
       Industrial District from then on (story flag _v733ghost).
   Canon: Waldo is a NEW procedural figure (black beanie, gold chain, fur-
   hood puffer) and uses his own generated atlas when present — never a
   Felicia reuse. Glyphs drawn as shapes, no emoji in drawn art.
   ========================================================================== */
(function () {
  const VER = "7.33";
  if (window.v733) return;
  const meta733 = () => { try { return (typeof S !== "undefined") ? (S.meta || (S.meta = {})) : null; } catch (e) { return null; } };
  const repPts = () => { const m = meta733(); return (m && m._v733rep) || 0; };
  const TIER_NAMES = ["CONTACT", "HOMIE", "TRUSTED", "FAMILY", "INNER ORBIT", "RIDE OR DIE"];
  const TIER_AT = [0, 20, 50, 90, 140, 200];
  const tier733 = () => { const r = repPts(); let t = 0; for (let i = 0; i < TIER_AT.length; i++) if (r >= TIER_AT[i]) t = i; return t; };
  function addRep733(n, why) {
    const m = meta733(); if (!m) return;
    const before = tier733();
    m._v733rep = (m._v733rep || 0) + n;
    const after = tier733();
    try { toast(`🛰️ Waldo +${n} rep${why ? " — " + why : ""}`, 2600); } catch (e) { }
    if (after > before) {
      try { sfx("promote"); toast(`🛰️ WALDO — ${TIER_NAMES[after]}${after === 1 ? " · his garage is your garage" : after === 2 ? " · the intel market opens" : after === 5 ? " · ride or die" : ""}`, 4200); } catch (e) { }
    }
    try { save(); } catch (e) { }
  }
  // ---------- car ----------
  function car733() {
    const s = (typeof S !== "undefined") ? S : null; if (!s) return null;
    if (!s.car) s.car = { engine: 88, tires: 82, brakes: 78, battery: 90, body: 85 };
    return s.car;
  }
  const CAR_PARTS = ["engine", "tires", "brakes", "battery", "body"];
  function worstPart733() { const c = car733(); let w = CAR_PARTS[0]; CAR_PARTS.forEach(p => { if (c[p] < c[w]) w = p; }); return w; }
  function roadReady733() { const m = meta733(); return !!(m && m._v733roadReady); }

  // ---------- threat-intel skills (equip 2; they modify moves, not stats) ----------
  const SKILLS733 = {
    orbital:   { name: "ORBITAL TRACE",       cost: 0,   desc: "Launchers mark the target; hits on marked enemies track harder (+dmg)." },
    telemetry: { name: "TELEMETRY LINK",      cost: 150, desc: "Combo 5+ reveals enemy HP over their heads." },
    intercept: { name: "SIGNAL INTERCEPT",    cost: 180, desc: "A PERFECT-timed jab exposes the attacker's next move." },
    pivot:     { name: "GROUND STATION PIVOT",cost: 200, desc: "Jab 2 in the chain becomes the launcher sweep." },
    relay:     { name: "LOW-ORBIT RELAY",     cost: 240, desc: "Three PERFECTs in a row instantly recharge your dash." },
    forecast:  { name: "THREAT FORECAST",     cost: 160, desc: "Elite hunters show an early warning before they lunge." },
  };
  const skills733 = () => { const m = meta733(); return (m && m._v733skills) || []; };
  const equip733 = () => { const m = meta733(); return (m && m._v733equip) || []; };
  function unlockSkill733(id) {
    const m = meta733(); if (!m || !SKILLS733[id]) return false;
    m._v733skills = m._v733skills || [];
    if (m._v733skills.includes(id)) return false;
    m._v733skills.push(id); try { save(); } catch (e) { }
    return true;
  }
  function equipSkill733(id) {
    const m = meta733(); if (!m) return "no";
    if (!skills733().includes(id)) return "locked";
    m._v733equip = m._v733equip || [];
    if (m._v733equip.includes(id)) { m._v733equip = m._v733equip.filter(x => x !== id); try { save(); } catch (e) { } return "off"; }
    if (m._v733equip.length >= 2) return "full";
    m._v733equip.push(id); try { save(); } catch (e) { } return "on";
  }

  // ---------- Waldo figure (his own atlas when present; procedural otherwise) ----------
  let waldoImgA = null;
  function waldoSprite733(x, frameKey, dx, dy, h, flip) {
    try {
      if (typeof TO_WALDO_A === "undefined" || typeof WALDO_A === "undefined") throw 0;
      if (!waldoImgA) { waldoImgA = new Image(); waldoImgA.src = TO_WALDO_A; }
      if (!waldoImgA.complete || !waldoImgA.naturalWidth) throw 0;
      const fr = WALDO_A.frames[frameKey] || WALDO_A.frames.f000, C = WALDO_A.cell;
      x.imageSmoothingEnabled = false;
      if (flip) { x.save(); x.translate(dx, 0); x.scale(-1, 1); x.drawImage(waldoImgA, fr[0] * C, fr[1] * C, C, C, -h / 2, dy - h, h, h); x.restore(); }
      else x.drawImage(waldoImgA, fr[0] * C, fr[1] * C, C, C, dx - h / 2, dy - h, h, h);
      return true;
    } catch (e) { return false; }
  }
  // procedural Waldo — black beanie, gold chain, fur-hood puffer, jeans (shapes only)
  function waldoFig733(x, dx, dy, h, pose) {
    const u = h / 100;
    x.fillStyle = "#151920"; rr733(x, dx - 24 * u, dy - 64 * u, 48 * u, 64 * u, 10 * u); x.fill(); // puffer
    x.fillStyle = "#3a3f4a"; rr733(x, dx - 24 * u, dy - 64 * u, 48 * u, 12 * u, 6 * u); x.fill(); // fur hood trim
    x.strokeStyle = "#232833"; x.lineWidth = 2 * u; // puffer seams
    for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(dx - 22 * u, dy - (64 - i * 14) * u); x.lineTo(dx + 22 * u, dy - (64 - i * 14) * u); x.stroke(); }
    x.fillStyle = "#d8a24a"; x.beginPath(); x.arc(dx, dy - 52 * u, 7 * u, 0, Math.PI); x.stroke(); // chain
    x.strokeStyle = "#ffd166"; x.lineWidth = 2.2 * u; x.beginPath(); x.arc(dx, dy - 54 * u, 8 * u, .3, Math.PI - .3); x.stroke();
    x.fillStyle = "#ffd166"; x.beginPath(); x.arc(dx, dy - 44 * u, 3 * u, 0, 7); x.fill(); // pendant
    x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(dx, dy - 76 * u, 14 * u, 0, 7); x.fill(); // face
    x.fillStyle = "#0e1116"; x.beginPath(); x.arc(dx, dy - 81 * u, 14.5 * u, Math.PI, 0); x.fill(); rr733(x, dx - 14.5 * u, dy - 83 * u, 29 * u, 9 * u, 4 * u); x.fill(); // beanie
    x.fillStyle = "#141a30"; x.beginPath(); x.arc(dx - 5 * u, dy - 74 * u, 2.2 * u, 0, 7); x.arc(dx + 5 * u, dy - 74 * u, 2.2 * u, 0, 7); x.fill();
    x.fillStyle = "#1d2733"; rr733(x, dx - 13 * u, dy - 4 * u, 11 * u, 4 * u, 2 * u); x.fill(); rr733(x, dx + 2 * u, dy - 4 * u, 11 * u, 4 * u, 2 * u); x.fill(); // boots
    if (pose === "wave") { x.save(); x.translate(dx + 22 * u, dy - 58 * u); x.rotate(-2.4); x.fillStyle = "#151920"; rr733(x, -4 * u, -30 * u, 9 * u, 32 * u, 4 * u); x.fill(); x.fillStyle = "#c98a5b"; x.beginPath(); x.arc(0, -32 * u, 5.5 * u, 0, 7); x.fill(); x.restore(); }
    if (pose === "wrench") { x.strokeStyle = "#9fb7d9"; x.lineWidth = 3.5 * u; x.beginPath(); x.moveTo(dx + 20 * u, dy - 30 * u); x.lineTo(dx + 34 * u, dy - 44 * u); x.stroke(); x.beginPath(); x.arc(dx + 36 * u, dy - 46 * u, 5 * u, .8, 4.4); x.stroke(); }
  }
  function rr733(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function drawWaldo733(x, dx, dy, h, pose, flip) {
    const key = pose === "wave" ? "f001" : pose === "wrench" ? "f010" : "f000";
    if (!waldoSprite733(x, key, dx, dy, h, flip)) waldoFig733(x, dx, dy, h, pose);
  }

  // ==========================================================================
  // WALDO'S PLACE — a social district on the Charger's map (no combat)
  // ==========================================================================
  try {
    if (typeof NM_DISTRICTS !== "undefined" && !NM_DISTRICTS.waldo) {
      NM_DISTRICTS.waldo = { name: "WALDO'S PLACE", streets: 1, danger: 0, accent: "#39d3ff", sky: "#070b18", far: "#101528", mid: "#182038", signs: ["WALDO'S", "MAPLE ST"], roster: [] };
    }
  } catch (e) { }
  const W_MOW_X = 300, W_MOW_CELLS = 24, W_MOW_CELL_W = 42; // lawn strip 300..1308
  const W_HOTSPOTS = [
    { id: "mower", x: 340, label: "the mower" },
    { id: "grill", x: 560, label: "the grill" },
    { id: "porch", x: 820, label: "the porch" },
    { id: "garage", x: 1120, label: "the garage" },
    { id: "dish", x: 1420, label: "the satellite dish" },
  ];
  function ws733() { // per-night Waldo scene state, lives on NM
    if (typeof NM === "undefined" || !NM) return null;
    if (!NM.waldo) NM.waldo = { used: {}, mow: null, repair: null, waldoX: 900, waldoDir: 1, waldoT: 0 };
    return NM.waldo;
  }
  const atWaldo733 = () => { try { return typeof NM !== "undefined" && NM && NM.district === "waldo"; } catch (e) { return false; } };

  // ---------- the Charger menu gains a social call ----------
  const _nmCarMenu733 = nmCarMenu;
  window.nmCarMenu = function () {
    const s = S;
    if (!NM) return _nmCarMenu733();
    const opts = [];
    if (NM.district !== "waldo" && !NM.done.waldoSocial) {
      opts.push({
        t: `🛰️ WALDO'S PLACE <small>· no danger · mow, wrench, hang out</small>`,
        f: () => { closeDlg(); NM.drive = { t: 0, dur: 1500, to: "waldo" }; sfx("portal"); },
      });
    }
    NM_ORDER.filter(id => !NM.done[id]).forEach(id => {
      const D = NM_DISTRICTS[id];
      opts.push({
        t: `🚗 ${D.name} <small>· DANGER ${Math.round(D.danger * 100)}% · ${NM_ORDER.indexOf(id) === 0 ? "" : "+" + Math.round((D.danger - 1) * 100) + "% pay"}</small>`,
        f: () => { closeDlg(); NM.drive = { t: 0, dur: 1500, to: id }; sfx("portal"); },
      });
    });
    opts.push({ t: `🏠 HOME STREET <small>· call it a night</small>`, f: () => { closeDlg(); NM.drive = { t: 0, dur: 1500, to: "home" }; sfx("portal"); } });
    opts.push({ t: "Back to the street.", f: closeDlg });
    const c = car733(), worst = c ? c[worstPart733()] : 100;
    dlg("🚗 THE CHARGER — where to?", `The engine idles. New Haven glows wet and neon.<br><small>Cleared districts stay cleared tonight. Pay scales with danger.` +
      (worst < 40 ? ` <b style="color:#ffb347">The ${worstPart733()} ${worst < 25 ? "is shot" : "is worn"} (${worst}%) — Waldo can fix that.</b>` : "") + `</small>`, opts);
  };

  // ---------- district load: scene setup + greeting ----------
  const _nmLoadDistrict733 = nmLoadDistrict;
  window.nmLoadDistrict = function (id) {
    _nmLoadDistrict733(id);
    if (id !== "waldo" || !NM) return;
    const ws = ws733();
    NM.msg = "WALDO'S PLACE — mow the lawn, hit the garage, or just hang out · ← the Charger waits"; NM.msgT = performance.now() + 4200;
    const m = meta733();
    if (m && !m._v733met) {
      m._v733met = true;
      setTimeout(() => { try { if (window.v725) v725.play("waldo_meet", null); } catch (e) { } }, 600);
    }
    try { save(); } catch (e) { }
  };

  // ---------- stress tiers bite at day start (the brief's time blocks) ----------
  const _setupDay733 = setupDay;
  window.setupDay = function () {
    _setupDay733();
    const s = S; if (!s) return;
    try {
      if (s.stress <= 25) {
        s.clock = 8 * 60 + 30; // Clear Head: up early — the recovered morning block
        s._v733clear = true;
        toast("🌅 CLEAR HEAD — good sleep. You're in at 8:30, a full block ahead.", 4200);
      } else if (s.stress >= 80) {
        s.clock = 9 * 60 + 30; // burned out: overslept
        s._v733clear = false;
        toast("😮‍💨 You slept through the alarm. In at 9:30 — the morning's already gone.", 4200);
      } else s._v733clear = false;
      if (roadReady733()) { const m = meta733(); if (m._v733roadReadyDay !== (m.day || s.day)) { m._v733roadReady = false; } }
    } catch (e) { window.__err733 = String(e && e.stack || e); }
  };

  // ---------- car wear: every drive costs something; worn cars break down ----------
  const _stepNM733 = stepNM;
  window.stepNM = function (dt) {
    const hadDrive = (typeof NM !== "undefined" && NM && NM.drive) ? NM.drive.to : null;
    _stepNM733(dt);
    try {
      if (hadDrive && typeof NM !== "undefined" && NM && !NM.drive) {
        const c = car733();
        if (c && hadDrive !== "waldo") { // social call is a gentle cruise
          const p = CAR_PARTS[Math.floor(Math.random() * CAR_PARTS.length)];
          c[p] = Math.max(5, c[p] - (1 + Math.floor(Math.random() * 3)));
          const worst = c[worstPart733()];
          if (worst < 25 && !roadReady733() && Math.random() < .3) {
            advanceClock(15); addStress(6);
            toast(`🔧 The Charger sputters and dies two blocks out. Breakdown — you coast it in. (+15 min, +6 stress)`, 4600);
            sfx("hit");
          }
        }
      }
      // Waldo wander + repair minigame marker
      if (atWaldo733()) {
        const ws = ws733(), now = performance.now();
        if (ws) {
          ws.waldoT += dt;
          if (ws.waldoT > 2.4) { ws.waldoT = 0; ws.waldoDir = Math.random() < .5 ? -1 : 1; }
          ws.waldoX += ws.waldoDir * dt * 14;
          if (ws.waldoX < 700) ws.waldoX = 700; if (ws.waldoX > 1050) ws.waldoX = 1050;
          if (ws.repair) { ws.repair.marker += ws.repair.dir * dt * 1.35; if (ws.repair.marker > 1) { ws.repair.marker = 1; ws.repair.dir = -1; } if (ws.repair.marker < 0) { ws.repair.marker = 0; ws.repair.dir = 1; } }
          // mowing: your steps cut the grass
          if (ws.mow && !ws.mow.done) {
            const cell = Math.floor((NM.x - W_MOW_X) / W_MOW_CELL_W);
            if (cell >= 0 && cell < W_MOW_CELLS) {
              const clean = Math.abs(NM.vx) < 6; // walking cuts clean, dashing leaves tufts
              ws.mow.cells[cell] = Math.min(2, ws.mow.cells[cell] + (clean ? 2 : 1));
              if (clean && !ws.mow.cutSfx || now - (ws.mow.cutSfx || 0) > 260) { try { sfx("pickup"); } catch (e) { } ws.mow.cutSfx = now; }
              if (ws.mow.cells.every(v => v >= 2)) finishMow733();
            }
          }
        }
      }
    } catch (e) { window.__err733b = String(e && e.stack || e); }
  };

  function mowPct733() { const ws = ws733(); if (!ws || !ws.mow) return 0; return Math.round(ws.mow.cells.filter(v => v >= 2).length / W_MOW_CELLS * 100); }
  function finishMow733() {
    const ws = ws733(); if (!ws || !ws.mow || ws.mow.done) return;
    ws.mow.done = true;
    const m = meta733(), s = S;
    const tufts = ws.mow.cells.filter(v => v === 1).length;
    const careful = tufts <= 4;
    addStress(careful ? -18 : -12);
    const first = m && !m._v733q1;
    if (first) {
      m._v733q1 = true;
      addRep733(15, "Grassroots Intelligence");
      unlockSkill733("orbital");
      m._v733docs = m._v733docs || []; m._v733docs.push("sat-ground-station");
      try { if (window.v725) v725.play("waldo_grass", null); } catch (e) { }
      toast("🛰️ \"See? Everybody wants intelligence. Nobody wants to help with the yard.\" — ORBITAL TRACE unlocked · first satellite indicator logged", 5600);
    } else {
      addRep733(careful ? 5 : 3, careful ? "a careful job" : "the lawn");
      toast(careful ? "🌱 Stripes like a ballpark. Waldo nods, impressed." : "🌱 Lawn's mowed. A few tufts, but it's honest work.", 3600);
    }
    try { sfx("promote"); save(); } catch (e) { }
  }

  // ---------- coop repair: hold the light (timing minigame, 3 rounds) ----------
  function startRepair733() {
    const s = S, ws = ws733(), c = car733(); if (!ws || !c) return;
    const part = worstPart733();
    if (c[part] >= 95) { dlg("🔧 Waldo's Garage", "Waldo runs a hand over the fender. \"She's fine, hermano. Come back when something actually rattles.\"", [{ t: "Close up.", f: closeDlg }]); return; }
    const cost = tier733() >= 3 ? 10 : 20; // Family discount
    if (s.budget < cost) { dlg("🔧 Waldo's Garage", `\"Parts cost money even for me. $${cost}, homes.\" You're short.`, [{ t: "Later.", f: closeDlg }]); return; }
    s.budget -= cost;
    ws.repair = { part, marker: 0, dir: 1, rounds: 3, hits: 0 };
    NM.msg = `HOLD THE LIGHT — press E when the marker crosses the green · round 1/3`; NM.msgT = performance.now() + 3600;
    sfx("pickup"); save();
  }
  function repairRound733() { // returns "hit"|"miss"|null(finished)
    const ws = ws733(); if (!ws || !ws.repair) return null;
    const r = ws.repair, m = r.marker, ok = m > .4 && m < .6; // green zone center 20%
    if (ok) { r.hits++; sfx("chime" in window ? "chime" : "promote"); } else sfx("ping");
    r.rounds--;
    if (r.rounds <= 0) {
      const c = car733(), gain = (meta733()._v733carDiag ? 40 : 30) + r.hits * 5;
      c[r.part] = Math.min(100, c[r.part] + gain);
      ws.repair = null;
      addStress(-5); addRep733(5, "wrench time");
      NM.msg = `🔧 ${r.part.toUpperCase()} fixed (+${gain}%) — "There. Better than the shop, and cheaper."`; NM.msgT = performance.now() + 4200;
      try { save(); } catch (e) { }
      return ok ? "hit" : "miss";
    }
    NM.msg = `${ok ? "✅ steady" : "❌ shaky"} — round ${4 - r.rounds}/3`; NM.msgT = performance.now() + 1600;
    return ok ? "hit" : "miss";
  }

  // ==========================================================================
  // INTERACTION at Waldo's — E talks to the property, never a jab
  // ==========================================================================
  function hotspot733() {
    if (!NM) return null;
    let best = null, bd = 90;
    for (const h of W_HOTSPOTS) { const d = Math.abs(NM.x - h.x); if (d < bd) { bd = d; best = h; } }
    return best;
  }
  function waldoMenu733() {
    const h = hotspot733(); if (!h) return;
    const m = meta733(), s = S, ws = ws733(), t = tier733();
    if (ws.repair) { repairRound733(); return; }
    if (h.id === "mower") {
      if (ws.mow && !ws.mow.done) { NM.msg = `Mowing — ${mowPct733()}% · walk the stripes, dashing leaves tufts`; NM.msgT = performance.now() + 2400; return; }
      if (ws.used.mow) { dlg("🌱 The Lawn", "Already cut tonight. It smells like rain and gasoline — in a good way.", [{ t: "Nice.", f: closeDlg }]); return; }
      dlg("🌱 Waldo's Lawn", "The yard is a meadow. The mower's gassed.<br><small>Walk the lawn to cut it clean — dash and you'll leave tufts. Waldo watches from the porch.</small>", [
        { t: "🌱 Mow the lawn.", f: () => { closeDlg(); ws.mow = { cells: new Array(W_MOW_CELLS).fill(0), done: false }; NM.msg = "MOW THE LAWN — walk every stripe"; NM.msgT = performance.now() + 3000; sfx("pickup"); } },
        { t: "Not tonight.", f: closeDlg },
      ]);
    } else if (h.id === "grill") {
      if (ws.used.grill) { dlg("🔥 The Grill", "Coals are banked for the night.", [{ t: "Smells great.", f: closeDlg }]); return; }
      ws.used.grill = true; addStress(-4); addRep733(2, "carne asada");
      dlg("🔥 The Grill", "Waldo flips something that hisses. You eat standing up, arguing about salsa. Nobody mentions satellites for a whole ten minutes.<br><small>-4 stress</small>", [{ t: "Worth it.", f: closeDlg }]);
    } else if (h.id === "porch") {
      if (t >= 1 && !m._v733smoke) {
        dlg("🪑 The Porch", "Two chairs, string lights, the whole sky. Waldo nods at the seat next to him.<br><small>Smoke Signals — a long talk. No objective.</small>", [
          { t: "🪑 Sit a while. (story)", f: () => { closeDlg(); try { v725.play("waldo_smoke", function () { smokeReward733(); }); } catch (e) { smokeReward733(); } } },
          { t: "Just hang out.", f: () => { closeDlg(); hangout733(); } },
        ]);
      } else hangout733();
    } else if (h.id === "garage") {
      if (t < 1) { dlg("🔧 The Garage", "The door's half open — tools, a lift, a radio murmuring corridos. Waldo waves you off: \"Garage privileges are earned, homes. Help me out sometime.\"<br><small>Reach HOMIE tier (20 rep).</small>", [{ t: "Fair.", f: closeDlg }]); return; }
      if (t >= 2 && !m._v733tracker) {
        dlg("🔧 The Garage", "The Charger's CHECK ENGINE light glows — then dies when Waldo looks at it. \"Intermittent? Bring it in. NOW.\"<br><small>Check Engine Friendship — a diagnosis with a secret inside.</small>", [
          { t: "🔧 Pop the hood. (story)", f: () => { closeDlg(); try { v725.play("waldo_tracker", function () { trackerReward733(); }); } catch (e) { trackerReward733(); } } },
          { t: "Just a repair.", f: () => { closeDlg(); startRepair733(); } },
        ]);
      } else {
        const c = car733();
        const bars = CAR_PARTS.map(p => `${p.toUpperCase()} ${c[p]}%`).join(" · ");
        dlg("🔧 Waldo's Garage", `The Charger up on the lift.<br><small>${bars}${roadReady733() ? " · <b style='color:#39ff88'>ROAD READY</b>" : ""}</small>`, [
          { t: `🔧 Fix the ${worstPart733()} ($${t >= 3 ? 10 : 20}, coop repair).`, f: () => { closeDlg(); startRepair733(); } },
          { t: "🌙 Midnight tune-up (needs 40 rep).", f: () => { closeDlg(); tuneUp733(); } },
          { t: "Close up.", f: closeDlg },
        ]);
      }
    } else if (h.id === "dish") {
      if (t >= 2) return dishMarket733();
      if (ws.used.dish) { dlg("🛰️ The Dish", "Static and starlight. Nothing new crosses tonight.", [{ t: "Watch anyway.", f: closeDlg }]); return; }
      ws.used.dish = true; addStress(-6); addRep733(2, "satellite watching");
      dlg("🛰️ Satellite Watching", "Waldo names them as they pass — the honest ones on public trackers, and the ones that aren't on any list.<br><small>-6 stress · intel market at TRUSTED tier (50 rep)</small>", [{ t: "Clear night.", f: closeDlg }]);
    }
  }
  function hangout733() {
    const ws = ws733();
    if (ws.used.porch) { dlg("🪑 The Porch", "You've talked it out for tonight. The crickets take over.", [{ t: "Good night.", f: closeDlg }]); return; }
    dlg("🪑 The Porch", "String lights buzz. New Haven hums below the hill.", [
      { t: "🚬 Share a smoke.", f: () => { closeDlg(); ws.used.porch = true; addStress(-8); addRep733(4, "porch time"); dlg("🪑 The Porch", "Smoke curls into the yard light. He talks about his sister's quince; you talk about nothing. It helps.<br><small>-8 stress</small>", [{ t: "Yeah.", f: closeDlg }]); } },
      { t: "☕ Coffee and the sky.", f: () => { closeDlg(); ws.used.porch = true; addStress(-8); addRep733(4, "porch time"); dlg("🪑 The Porch", "Decaf, two sugars. He talks about his sister's quince; you talk about nothing. It helps just the same.<br><small>-8 stress</small>", [{ t: "Yeah.", f: closeDlg }]); } },
      { t: "🎵 Put on music.", f: () => { closeDlg(); ws.used.porch = true; addStress(-5); addRep733(3, "his playlist"); const m = meta733(); if (!m._v733track1 && tier733() >= 1) { m._v733track1 = true; toast("🎵 COLLECTIBLE TRACK — \"Corridos del Cielo\" added to the deck.", 3600); } dlg("🪑 The Porch", "He queues something with accordion and 808s. \"My cousin's band.\" It's genuinely good.<br><small>-5 stress</small>", [{ t: "One more.", f: closeDlg }]); } },
      { t: "Head back.", f: closeDlg },
    ]);
  }
  function tuneUp733() {
    const m = meta733(), s = S;
    if (repPts() < 40) { dlg("🌙 Midnight Tune-Up", "\"That's an all-night job, hermano. I don't do all-nighters for just anybody.\"<br><small>Needs 40 rep.</small>", [{ t: "Understood.", f: closeDlg }]); return; }
    if (m._v733roadReady) { dlg("🌙 Midnight Tune-Up", "She's already singing. ROAD READY stands.", [{ t: "Nice.", f: closeDlg }]); return; }
    const c = car733(); CAR_PARTS.forEach(p => c[p] = Math.min(100, c[p] + 25));
    m._v733roadReady = true; m._v733roadReadyDay = m.day || s.day;
    addStress(-10); addRep733(8, "the all-nighter");
    dlg("🌙 Midnight Tune-Up", "2 AM. Coffee, torque wrench, the radio low. You talk career, Felicia, the night work — and admit you feel valued only when something's broken.<br><br><i>\"Then stop showing up only when something's broken.\"</i><br><br><small>ROAD READY — no breakdowns, smooth drives · all parts +25 · -10 stress</small>", [{ t: "...Noted.", f: closeDlg }]);
    sfx("promote"); save();
  }
  function dishMarket733() {
    const s = S, m = meta733();
    const opts = [];
    Object.keys(SKILLS733).forEach(id => {
      const k = SKILLS733[id], owned = skills733().includes(id), eq = equip733().includes(id);
      if (owned) opts.push({ t: `${eq ? "✅" : "▫️"} ${k.name} <small>· ${eq ? "equipped — tap to unequip" : "owned — tap to equip"}</small>`, f: () => { const r = equipSkill733(id); closeDlg(); toast(r === "full" ? "⚙️ Only 2 intel slots — unequip something first." : `⚙️ ${k.name} ${r === "on" ? "equipped" : "unequipped"}.`, 2600); } });
      else opts.push({ t: `💾 ${k.name} — $${k.cost} <small>· ${k.desc}</small>`, f: () => { if (s.budget < k.cost) { closeDlg(); toast("💾 Not enough cash for that report.", 2400); return; } s.budget -= k.cost; unlockSkill733(id); closeDlg(); toast(`💾 ${k.name} acquired — equip it from the dish.`, 3200); sfx("promote"); save(); } });
    });
    opts.push({ t: "🛰️ Just watch the sky.", f: () => { closeDlg(); const ws = ws733(); if (!ws.used.dish) { ws.used.dish = true; addStress(-6); addRep733(2, "satellite watching"); } } });
    opts.push({ t: "Step away.", f: closeDlg });
    dlg("🛰️ THE DISH — threat-intel market", `Waldo's receiver chatters. Reports priced in cash; skills equip into <b>2 slots</b>.<br><small>Equipped: ${equip733().map(i => SKILLS733[i].name).join(" · ") || "none"}</small>`, opts);
  }

  // ---------- quest rewards (exactly once, after the scene) ----------
  function smokeReward733() {
    const m = meta733(); if (!m || m._v733smokePaid) return;
    const pick = m._v733smoke || "listen";
    m._v733smokePaid = true;
    addStress(-14);
    addRep733(pick === "listen" ? 12 : pick === "past" ? 10 : 6, "Smoke Signals");
    unlockSkill733("intercept");
    if (!m._v733track1) m._v733track1 = true;
    toast("🛰️ SIGNAL INTERCEPT unlocked · \"Corridos del Cielo\" on the deck · -14 stress", 4600);
    try { save(); } catch (e) { }
  }
  function trackerReward733() {
    const m = meta733(); if (!m || m._v733trackerPaid) return;
    m._v733trackerPaid = true;
    const pick = m._v733tracker || "preserve";
    m._v733carDiag = true; // vehicle diagnostics upgrade — repairs restore more
    addStress(-12);
    addRep733(10, "Check Engine Friendship");
    if (pick === "trace") { m._v733traceRoute = true; }
    if (pick === "spoof") { addStress(-4); }
    if (pick === "preserve") { m._v733docs = m._v733docs || []; m._v733docs.push("tracker-device"); }
    toast(`🔧 DIAGNOSTICS UPGRADE — garage repairs restore more · device ${pick === "trace" ? "live: you're following its signal" : pick === "spoof" ? "fed a loop of fake commutes" : pick === "destroy" ? "crushed under a boot" : "bagged as evidence"} · -12 stress`, 5600);
    try { save(); } catch (e) { }
  }

  // ---------- the interact wrap: at Waldo's, E is social; repair rounds take E ----------
  const _interact733 = interact;
  window.interact = function () {
    const s = S;
    if (s && s.nightMode && atWaldo733() && !s.inDialog) {
      if (NM && !NM.drive && NM.x < NM_CAR_X + 150) return nmCarMenu();
      const ws = ws733();
      if (ws && ws.repair) return repairRound733();
      return waldoMenu733();
    }
    return _interact733();
  };
  // no fights on Waldo's lawn
  const _nmJab733 = nmJab;
  window.nmJab = function () {
    if (atWaldo733()) return;
    // GROUND STATION PIVOT: jab 2 becomes the launcher sweep
    if (equip733().includes("pivot") && NM && NM.jabStage === 1 && (performance.now() - NM.lastJab) <= 700) NM.jabStage = 2;
    const perfectBefore = NM ? NM.perfectT : 0;
    _nmJab733();
    try {
      if (!NM) return;
      const eq = equip733(), now = performance.now();
      if (eq.includes("orbital")) {
        for (const e of NM.enemies) {
          if (e.hitT >= 7 && e.alive) {
            if (e.launch > 0 && !e.marked) { e.marked = true; NM.msg = "🛰️ ORBITAL TRACE — target marked"; NM.msgT = now + 1100; }
            if (e.marked) e.hp -= 4; // tracking hits land harder
          }
        }
      }
      if (eq.includes("telemetry") && NM.combo >= 5) for (const e of NM.enemies) if (e.hitT >= 7 && e.alive) e.showHp = now + 4000;
      if (eq.includes("intercept") && NM.perfectT > perfectBefore) for (const e of NM.enemies) if (e.alive && Math.abs(e.x - NM.x) < 320) { e.exposed = now + 2500; }
      if (eq.includes("relay")) {
        if (NM.perfectT > perfectBefore) { NM._v733streak = (NM._v733streak || 0) + 1; }
        else if (NM.jabAnim === 9) NM._v733streak = 0; // a non-perfect jab breaks the chain
        if (NM._v733streak >= 3) { NM._v733streak = 0; NM.dashCD = 0; NM.msg = "🛰️ LOW-ORBIT RELAY — dash recharged"; NM.msgT = now + 1400; sfx("dash"); }
      }
    } catch (e) { window.__err733c = String(e && e.stack || e); }
  };

  // ==========================================================================
  // SCENE DRAW — Waldo's property over the night street + augment HUD
  // ==========================================================================
  const _drawNM733 = drawNM;
  window.drawNM = function () {
    _drawNM733();
    if (typeof NM === "undefined" || !NM) return;
    const now = performance.now();
    // augment overlays in combat districts
    if (NM.district !== "waldo") {
      const eq = equip733();
      if (!eq.length) return;
      ctx.save();
      for (const e of NM.enemies) {
        if (!e.alive) continue;
        const sx = e.x - NM.cam, sy = e.y;
        if (eq.includes("orbital") && e.marked) { ctx.strokeStyle = "#39d3ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + e.w / 2, sy - 12, 10 + 2 * Math.sin(now / 200), 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx + e.w / 2 - 14, sy - 12); ctx.lineTo(sx + e.w / 2 + 14, sy - 12); ctx.moveTo(sx + e.w / 2, sy - 26); ctx.lineTo(sx + e.w / 2, sy + 2); ctx.stroke(); }
        if (eq.includes("telemetry") && e.showHp > now) { ctx.fillStyle = "#000a"; ctx.fillRect(sx - 14, sy - 34, e.w + 28, 14); ctx.fillStyle = "#7ee787"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText(`${Math.max(0, e.hp)} HP`, sx + e.w / 2, sy - 24); }
        if (eq.includes("intercept") && e.exposed > now) { ctx.fillStyle = "#ffd166"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText(e.lunges ? "NEXT: LUNGE" : e.dashes ? "NEXT: BLINK" : e.blocks ? "NEXT: SHIELD" : e.hover ? "NEXT: ZAP" : "NEXT: SWING", sx + e.w / 2, sy - 44); }
        if (eq.includes("forecast" ) && e.lunges && e.cd <= 10 && e.cd >= 0 && Math.abs(e.x - NM.x) < 330) { ctx.fillStyle = "#ff6b81"; ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.fillText("⚠", sx + e.w / 2, sy - 52); }
      }
      ctx.restore();
      return;
    }
    // ---------- Waldo's property ----------
    const cam = NM.cam, ground = NM_FLOOR;
    const W = cv.width, H = cv.height; // same convention as night_hooks drawNM
    ctx.save();
    // house facade behind the porch
    ctx.fillStyle = "#131a2e"; ctx.fillRect(640 - cam, ground - 260, 480, 260);
    ctx.fillStyle = "#0e1424"; ctx.beginPath(); ctx.moveTo(620 - cam, ground - 260); ctx.lineTo(880 - cam, ground - 330); ctx.lineTo(1140 - cam, ground - 260); ctx.closePath(); ctx.fill(); // gable
    ctx.fillStyle = "#1d2740"; ctx.fillRect(660 - cam, ground - 240, 440, 20); // eave
    // windows (warm)
    for (let i = 0; i < 3; i++) { const wx = 690 - cam + i * 150; ctx.fillStyle = "rgba(255,190,90,.85)"; ctx.fillRect(wx, ground - 220, 44, 56); ctx.fillStyle = "#131a2e"; ctx.fillRect(wx + 20, ground - 220, 4, 56); ctx.fillRect(wx, ground - 194, 44, 4); }
    // porch deck + posts
    ctx.fillStyle = "#241d16"; ctx.fillRect(700 - cam, ground - 40, 320, 40);
    ctx.fillStyle = "#31271c"; ctx.fillRect(700 - cam, ground - 46, 320, 8);
    ctx.fillStyle = "#1a1510"; ctx.fillRect(716 - cam, ground - 160, 10, 120); ctx.fillRect(994 - cam, ground - 160, 10, 120);
    ctx.fillStyle = "#221a12"; ctx.fillRect(700 - cam, ground - 168, 320, 12); // porch roof
    // string lights along the porch roof (animated)
    for (let i = 0; i < 14; i++) {
      const lx = 706 - cam + i * 23, ly = ground - 152 + 6 * Math.sin(i * .9) ;
      ctx.fillStyle = ((now / 600 + i) | 0) % 2 ? "#ffd166" : "#ffb347";
      ctx.beginPath(); ctx.arc(lx, ly, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,209,102,.14)"; ctx.beginPath(); ctx.arc(lx, ly, 7, 0, 7); ctx.fill();
    }
    // porch chairs
    ctx.fillStyle = "#3a2f22"; ctx.fillRect(760 - cam, ground - 66, 34, 26); ctx.fillRect(930 - cam, ground - 66, 34, 26);
    // garage (right of house) with the Charger's silhouette
    ctx.fillStyle = "#10162a"; ctx.fillRect(1060 - cam, ground - 180, 220, 180);
    ctx.fillStyle = "#1a2440"; ctx.fillRect(1076 - cam, ground - 150, 188, 150); // open door
    ctx.fillStyle = "#0a0f1e"; ctx.fillRect(1096 - cam, ground - 90, 150, 90); // car shadow inside
    ctx.fillStyle = "#39ff88"; ctx.fillRect(1100 - cam, ground - 60, 142, 3); // underglow
    // tool chest
    ctx.fillStyle = "#7a2a20"; ctx.fillRect(1252 - cam, ground - 78, 40, 78); ctx.fillStyle = "#571d16"; for (let i = 0; i < 4; i++) ctx.fillRect(1256 - cam, ground - 70 + i * 17, 32, 10);
    // satellite dish on the lawn's far end
    ctx.strokeStyle = "#2a3550"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1420 - cam, ground); ctx.lineTo(1420 - cam, ground - 70); ctx.stroke();
    ctx.fillStyle = "#26304e"; ctx.beginPath(); ctx.ellipse(1420 - cam, ground - 84, 34, 22, -.6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#39d3ff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(1420 - cam, ground - 84, 34, 22, -.6, 0, 7); ctx.stroke();
    if (((now / 900) | 0) % 2) { ctx.strokeStyle = "rgba(57,211,255,.5)"; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.arc(1420 - cam, ground - 110, i * 12, -2.2, -.9); ctx.stroke(); } }
    // the lawn (mow state)
    const ws = ws733();
    for (let i = 0; i < W_MOW_CELLS; i++) {
      const lx = W_MOW_X - cam + i * W_MOW_CELL_W;
      const v = ws.mow ? ws.mow.cells[i] : 0;
      ctx.fillStyle = v >= 2 ? "#1d3a1f" : v === 1 ? "#274a24" : "#2f5a2a";
      ctx.fillRect(lx, ground - 26, W_MOW_CELL_W - 2, 26);
      if (v < 2) { ctx.strokeStyle = v === 1 ? "#3a6a34" : "#40793a"; ctx.lineWidth = 1.5; for (let b = 0; b < 4; b++) { const bx = lx + 6 + b * 9; ctx.beginPath(); ctx.moveTo(bx, ground - 24); ctx.lineTo(bx + 2, ground - 32 - (v ? 0 : 3)); ctx.stroke(); } }
    }
    // the mower
    ctx.fillStyle = "#a83226"; ctx.fillRect(330 - cam, ground - 44, 40, 22); ctx.fillStyle = "#0d0f14"; ctx.beginPath(); ctx.arc(340 - cam, ground - 18, 8, 0, 7); ctx.arc(362 - cam, ground - 18, 8, 0, 7); ctx.fill();
    ctx.strokeStyle = "#444"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(336 - cam, ground - 42); ctx.lineTo(320 - cam, ground - 74); ctx.stroke();
    // the grill with smoke
    ctx.fillStyle = "#151920"; ctx.beginPath(); ctx.arc(560 - cam, ground - 40, 20, Math.PI, 0); ctx.fill(); ctx.fillRect(540 - cam, ground - 40, 40, 8);
    ctx.strokeStyle = "#151920"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(548 - cam, ground - 32); ctx.lineTo(544 - cam, ground); ctx.moveTo(572 - cam, ground - 32); ctx.lineTo(576 - cam, ground); ctx.stroke();
    for (let i = 0; i < 3; i++) { const sy = ground - 60 - ((now / 14 + i * 30) % 90); ctx.fillStyle = `rgba(180,190,210,${.25 - i * .06})`; ctx.beginPath(); ctx.arc(560 - cam + Math.sin(now / 700 + i) * 8, sy, 7 + i * 3, 0, 7); ctx.fill(); }
    // Waldo himself
    const wig = Math.sin(now / 480) * 1.5;
    drawWaldo733(ctx, ws.waldoX - cam, ground + wig * 0, 46 + wig, ws.waldoDir > 0 ? "idle" : "idle", ws.waldoDir < 0);
    // hotspot prompt
    const h = hotspot733();
    if (h && !S.inDialog && !ws.repair) {
      ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 190, 136, 380, 26);
      ctx.fillStyle = "#39d3ff"; ctx.font = "12px monospace"; ctx.textAlign = "center";
      ctx.fillText(`E — ${h.label}`, W / 2, 153);
    }
    // mowing HUD
    if (ws.mow && !ws.mow.done) {
      ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 160, 88, 320, 34);
      ctx.fillStyle = "#333"; ctx.fillRect(W / 2 - 140, 100, 280, 10);
      ctx.fillStyle = "#7ee787"; ctx.fillRect(W / 2 - 140, 100, 280 * mowPct733() / 100, 10);
      ctx.fillStyle = "#e8f4ff"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.fillText(`MOWING ${mowPct733()}%`, W / 2, 96 + 28);
    }
    // repair HUD
    if (ws.repair) {
      const r = ws.repair;
      ctx.fillStyle = "#000c"; ctx.fillRect(W / 2 - 220, 150, 440, 74);
      ctx.strokeStyle = "#2a3560"; ctx.strokeRect(W / 2 - 220, 150, 440, 74);
      ctx.fillStyle = "#e8f4ff"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
      ctx.fillText(`HOLD THE LIGHT — ${r.part.toUpperCase()} · round ${4 - r.rounds}/3 · hits ${r.hits}`, W / 2, 170);
      ctx.fillStyle = "#222"; ctx.fillRect(W / 2 - 180, 186, 360, 14);
      ctx.fillStyle = "#39ff88"; ctx.fillRect(W / 2 - 180 + 360 * .4, 186, 360 * .2, 14); // green zone
      ctx.fillStyle = "#ffd166"; ctx.fillRect(W / 2 - 180 + 360 * r.marker - 3, 182, 6, 22); // marker
      ctx.fillStyle = "#8b93b8"; ctx.font = "10px monospace"; ctx.fillText("E when the marker crosses green", W / 2, 216);
    }
    ctx.restore();
  };

  // ==========================================================================
  // GHOST SHIFT SEED — the encrypted message after a cracked tree
  // ==========================================================================
  const _enterNight733 = enterNight;
  window.enterNight = function () {
    _enterNight733();
    try {
      const s = S, m = meta733();
      if (s && m && s.meta.tree && s.meta.tree.cracked && !m._v733ghost) {
        m._v733ghost = true;
        setTimeout(() => toast("📡 ENCRYPTED — \"You restored the system. You never asked who broke it.\" · coords logged: the old recycling plant", 6200), 2400);
        try { save(); } catch (e) { }
      }
    } catch (e) { }
  };
  // the crescent-cursor tag watches the Industrial District once the message lands
  const _drawNM733b = window.drawNM;
  window.drawNM = function () {
    _drawNM733b();
    try {
      const m = meta733();
      if (typeof NM !== "undefined" && NM && NM.district === "industrial" && m && m._v733ghost) {
        const gx = 1240 - NM.cam, gy = NM_FLOOR - 150;
        ctx.save(); ctx.strokeStyle = "rgba(57,211,255,.65)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(gx, gy, 22, .8, 5.6); ctx.stroke(); // crescent
        ctx.strokeRect(gx + 16, gy - 8, 4, 16); // the blinking cursor
        if (((performance.now() / 500) | 0) % 2) { ctx.fillStyle = "rgba(57,211,255,.65)"; ctx.fillRect(gx + 16, gy - 8, 4, 16); }
        ctx.restore();
      }
    } catch (e) { }
  };

  // ==========================================================================
  // CINEMATICS — registered on the shared v7.25 engine (no parallel framework)
  // ==========================================================================
  if (window.v725 && v725.register && v725.h) {
    const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
    const GREEN = H.GREEN, CYAN = H.CYAN, DIM = H.DIM, GOLD = H.GOLD, PUR = H.PUR, RED = H.RED, AMBER = H.AMBER;
    function house733(x, tm) { // Waldo's house at dusk, string lights on
      H.bg(x, "#0b0f22");
      x.fillStyle = "#131a2e"; x.fillRect(LW / 2 - 260, LH - BAR - 330, 520, 300);
      x.fillStyle = "#0e1424"; x.beginPath(); x.moveTo(LW / 2 - 290, LH - BAR - 330); x.lineTo(LW / 2, LH - BAR - 420); x.lineTo(LW / 2 + 290, LH - BAR - 330); x.closePath(); x.fill();
      for (let i = 0; i < 3; i++) { const wx = LW / 2 - 200 + i * 170; x.fillStyle = "rgba(255,190,90,.85)"; x.fillRect(wx, LH - BAR - 290, 52, 64); x.fillStyle = "#131a2e"; x.fillRect(wx + 24, LH - BAR - 290, 4, 64); }
      for (let i = 0; i < 12; i++) { const lx = LW / 2 - 230 + i * 42, ly = LH - BAR - 350 + 8 * Math.sin(i * .9); x.fillStyle = ((tm / 600 + i) | 0) % 2 ? "#ffd166" : "#ffb347"; x.beginPath(); x.arc(lx, ly, 3.4, 0, 7); x.fill(); }
      x.fillStyle = "#2f5a2a"; x.fillRect(0, LH - BAR - 30, LW, 30); // lawn
    }
    function dishProp733(x, dx, dy, s, tm) {
      x.strokeStyle = "#2a3550"; x.lineWidth = 6 * s; x.beginPath(); x.moveTo(dx, dy); x.lineTo(dx, dy - 90 * s); x.stroke();
      x.fillStyle = "#26304e"; x.beginPath(); x.ellipse(dx, dy - 106 * s, 44 * s, 28 * s, -.6, 0, 7); x.fill();
      x.strokeStyle = CYAN; x.lineWidth = 2 * s; x.beginPath(); x.ellipse(dx, dy - 106 * s, 44 * s, 28 * s, -.6, 0, 7); x.stroke();
      x.strokeStyle = "rgba(57,211,255,.4)";
      for (let i = 1; i < 4; i++) { const rr2 = i * 16 * s + (tm / 40 % (16 * s)); x.beginPath(); x.arc(dx, dy - 140 * s, rr2, -2.2, -.9); x.stroke(); }
    }
    function stars733(x, tm, n) {
      for (let i = 0; i < (n || 70); i++) { const sx = (i * 173) % LW, sy = BAR + 10 + (i * 89) % 240; x.fillStyle = i % 5 ? "rgba(232,236,255,.5)" : "rgba(57,211,255,.7)"; x.fillRect(sx, sy, 2, 2); }
      // one slow satellite
      const sx = (tm / 90) % (LW + 200) - 100;
      x.fillStyle = "#e8ecff"; x.fillRect(sx, BAR + 90, 3, 3);
    }
    const WALDO_MEET_SHOTS = [
      { dur: 2400, cap: "MAPLE STREET, 7:40 PM — the house with the dish.", draw(x, tm) { house733(x, tm); dishProp733(x, LW - 220, LH - BAR - 20, 1.1, tm); H.mike(x, "down0", LW / 2 - 300, LH - BAR - 40, 130); } },
      { dur: 2400, cap: "Waldo. Space gangster. Old friend.", draw(x, tm) { house733(x, tm); drawWaldo733(x, LW / 2, LH - BAR - 40, 200, "wave"); H.mike(x, "down0", LW / 2 - 260, LH - BAR - 40, 135); } },
      { dur: 2600, cap: "\"Everybody wants intelligence. Nobody wants to help with the yard.\"", draw(x, tm) { house733(x, tm); drawWaldo733(x, LW / 2 + 120, LH - BAR - 40, 170, "idle"); H.bubble(x, "Everybody wants intelligence.", LW / 2 - 420, BAR + 80, 400); H.bubble(x, "Nobody wants to help with the yard.", LW / 2 - 380, BAR + 160, 430); } },
      { dur: 2400, cap: "He hands you the mower instead of a briefing.", draw(x, tm) { house733(x, tm); drawWaldo733(x, LW / 2 + 160, LH - BAR - 40, 170, "idle", true); H.mike(x, "down0", LW / 2 - 120, LH - BAR - 40, 140); x.fillStyle = "#a83226"; x.fillRect(LW / 2 - 20, LH - BAR - 110, 70, 40); x.fillStyle = "#0d0f14"; x.beginPath(); x.arc(LW / 2 - 2, LH - BAR - 62, 12, 0, 7); x.arc(LW / 2 + 38, LH - BAR - 62, 12, 0, 7); x.fill(); } },
      { dur: 2800, cap: "WALDO'S PLACE UNLOCKED — mow, wrench, hang out.", draw(x, tm) { house733(x, tm); drawWaldo733(x, LW / 2 + 200, LH - BAR - 40, 170, "wave"); H.mike(x, "down0", LW / 2 - 200, LH - BAR - 40, 140); H.panel(x, LW / 2 - 300, BAR + 80, 600, 60, "#0d1f16"); H.txt(x, "WALDO'S PLACE UNLOCKED", LW / 2, BAR + 110, 20, GREEN, "center", true); } },
    ];
    const WALDO_GRASS_SHOTS = [
      { dur: 2200, cap: "Sunset. The yard gives up its secrets.", draw(x, tm) { house733(x, tm); for (let i = 0; i < 8; i++) { x.fillStyle = "#1d3a1f"; x.fillRect(200 + i * 110, LH - BAR - 30, 60, 30); } H.mike(x, "down0", LW / 2 - 100, LH - BAR - 40, 130); drawWaldo733(x, LW / 2 + 240, LH - BAR - 40, 160, "idle"); } },
      { dur: 2600, cap: "\"That dead bird overhead? Last week it started talking again.\"", draw(x, tm) { house733(x, tm); dishProp733(x, LW - 240, LH - BAR - 20, 1.2, tm); drawWaldo733(x, LW / 2 - 40, LH - BAR - 40, 180, "idle"); H.bubble(x, "That dead bird overhead?", LW / 2 - 480, BAR + 80, 340); H.bubble(x, "Last week it started talking again.", LW / 2 - 440, BAR + 155, 420); } },
      { dur: 2400, cap: "Aim: an AeroTech ground station. Nobody Tasked it.", draw(x, tm) { H.bg(x, "#0a0e20"); H.twinCity(x, tm, LW / 2 - 380, BAR + 90, 760, 300, false); H.txt(x, "INACTIVE SATELLITE — TRANSMISSION DETECTED", LW / 2, BAR + 60, 17, RED, "center", true); H.txt(x, "AIM: AEROTECH GROUND STATION 04", LW / 2, BAR + 420, 15, AMBER, "center", true); } },
      { dur: 2800, cap: "ORBITAL TRACE UNLOCKED — first indicator logged.", draw(x, tm) { house733(x, tm); drawWaldo733(x, LW / 2 + 180, LH - BAR - 40, 170, "wave"); H.mike(x, "down0", LW / 2 - 180, LH - BAR - 40, 140); H.panel(x, LW / 2 - 310, BAR + 80, 620, 92, "#0d1f16"); H.txt(x, "ORBITAL TRACE UNLOCKED", LW / 2, BAR + 112, 19, CYAN, "center", true); H.txt(x, "SATELLITE INDICATOR — LOGGED TO DOCS", LW / 2, BAR + 142, 14, GREEN, "center", true); } },
    ];
    const WALDO_SMOKE_SHOTS = [
      { dur: 2400, cap: "The porch. String lights. Nowhere to be.", draw(x, tm) { house733(x, tm); stars733(x, tm, 60); drawWaldo733(x, LW / 2 - 80, LH - BAR - 40, 170, "idle"); H.mike(x, "down0", LW / 2 + 100, LH - BAR - 40, 140); for (let i = 0; i < 3; i++) { const sy = LH - BAR - 220 - ((tm / 12 + i * 40) % 120); x.fillStyle = `rgba(190,200,220,${.2 - i * .05})`; x.beginPath(); x.arc(LW / 2 - 70 + Math.sin(tm / 800 + i) * 10, sy, 8 + i * 3, 0, 7); x.fill(); } } },
      { dur: 2800, cap: "\"From up there, nobody owns the sky.\"", draw(x, tm) { H.bg(x, "#070b18"); stars733(x, tm, 120); drawWaldo733(x, LW / 2 - 160, LH - BAR - 40, 190, "idle"); H.bubble(x, "From up there, nobody owns the sky.", 240, BAR + 90, 460); H.bubble(x, "Down here, everybody wants to charge rent for it.", 280, BAR + 170, 520); } },
      { dur: 2600, cap: "Something changes orbit. It's on no public tracker.", draw(x, tm) { H.bg(x, "#070b18"); stars733(x, tm, 100); const sx = 300 + (tm / 20) % 500, sy = BAR + 120 + 40 * Math.sin(tm / 900); x.fillStyle = RED; x.fillRect(sx, sy, 5, 5); x.strokeStyle = RED; x.beginPath(); x.arc(sx + 2, sy + 2, 14 + 4 * Math.sin(tm / 300), 0, 7); x.stroke(); H.txt(x, "UNTRACKED OBJECT — ORBIT CHANGE DETECTED", LW / 2, BAR + 260, 16, RED, "center", true); drawWaldo733(x, LW / 2 + 240, LH - BAR - 40, 160, "idle"); } },
      {
        dur: 0, cap: "He watches you. How do you answer a friend?", choice: {
          prompt: "THE LONG TALK",
          options: ["1 — JUST LISTEN", "2 — ASK ABOUT HIS PAST", "3 — TALK SHOP"],
          store: "_v733smoke", values: ["listen", "past", "shop"]
        }, draw(x, tm) { house733(x, tm); stars733(x, tm, 70); drawWaldo733(x, LW / 2 - 100, LH - BAR - 40, 180, "idle"); H.mike(x, "down0", LW / 2 + 120, LH - BAR - 40, 145); }
      },
      { dur: 2800, cap: "SIGNAL INTERCEPT UNLOCKED — and a track for the deck.", draw(x, tm) { house733(x, tm); stars733(x, tm, 80); drawWaldo733(x, LW / 2 - 100, LH - BAR - 40, 170, "wave"); H.mike(x, "down0", LW / 2 + 120, LH - BAR - 40, 145); H.panel(x, LW / 2 - 320, BAR + 80, 640, 92, "#0d1f16"); H.txt(x, "SIGNAL INTERCEPT UNLOCKED", LW / 2, BAR + 112, 19, CYAN, "center", true); H.txt(x, "TRACK: CORRIDOS DEL CIELO", LW / 2, BAR + 142, 14, GOLD, "center", true); } },
    ];
    const WALDO_TRACKER_SHOTS = [
      { dur: 2400, cap: "CHECK ENGINE. It vanishes whenever anyone looks.", draw(x, tm) { H.bg(x, "#0d1024"); x.fillStyle = "#10162a"; x.fillRect(LW / 2 - 380, LH - BAR - 260, 760, 260); x.strokeStyle = H.EDGE; x.lineWidth = 3; x.strokeRect(LW / 2 - 380, LH - BAR - 260, 760, 260); x.fillStyle = "#0a0f1e"; x.fillRect(LW / 2 - 320, LH - BAR - 150, 640, 150); x.fillStyle = AMBER; x.font = "bold 22px 'Courier New',monospace"; x.textAlign = "center"; if (((tm / 500) | 0) % 3) x.fillText("CHECK ENGINE", LW / 2, LH - BAR - 200); } },
      { dur: 2600, cap: "Battery. Wiring. Reproduce the fault. A burned ground strap.", draw(x, tm) { H.bg(x, "#0d1024"); drawWaldo733(x, LW / 2 - 200, LH - BAR - 40, 180, "wrench"); H.mike(x, "laptop" in PLAYER_ATLAS.frames ? "laptop" : "down0", LW / 2 + 160, LH - BAR - 40, 150); H.panel(x, LW / 2 - 300, BAR + 80, 600, 120); H.txt(x, "DIAGNOSIS", LW / 2 - 270, BAR + 110, 15, CYAN, "left", true); H.txt(x, "BATTERY 12.6V — OK · GROUND STRAP — BURNED", LW / 2 - 270, BAR + 140, 13, GREEN, "left", true); H.txt(x, "FAULT REPRODUCED — INTERMITTENT OPEN", LW / 2 - 270, BAR + 168, 13, AMBER, "left", true); } },
      { dur: 2600, cap: "Then his hand stops. Behind the dash — something extra.", draw(x, tm) { H.bg(x, "#120d18"); x.fillStyle = "#0a0f1e"; H.panel(x, LW / 2 - 260, BAR + 110, 520, 240, "#0a0f1e"); x.fillStyle = PUR; H.rr(x, LW / 2 - 40, BAR + 200, 80, 40, 6); x.fill(); x.strokeStyle = PUR; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(LW / 2, BAR + 220, 50 + i * 22 + (tm / 30 % 22), 0, 7); x.stroke(); } H.txt(x, "UNAUTHORIZED DEVICE — TRANSMITTING", LW / 2, BAR + 150, 16, RED, "center", true); } },
      { dur: 2600, cap: "\"It's been reporting your drives, hermano. Every one.\"", draw(x, tm) { H.bg(x, "#120d18"); drawWaldo733(x, LW / 2 - 180, LH - BAR - 40, 190, "idle"); H.mike(x, "down0", LW / 2 + 140, LH - BAR - 40, 150); H.bubble(x, "It's been reporting your drives.", LW / 2 - 500, BAR + 90, 400); H.bubble(x, "Every one.", LW / 2 - 460, BAR + 165, 160); x.fillStyle = "rgba(255,68,85,.06)"; x.fillRect(0, BAR, LW, LH - 2 * BAR); } },
      {
        dur: 0, cap: "The device blinks. Your call.", choice: {
          prompt: "THE TRACKER",
          options: ["1 — TRACE THE SIGNAL", "2 — PRESERVE AS EVIDENCE", "3 — FEED IT FALSE DATA", "4 — DESTROY IT"],
          store: "_v733tracker", values: ["trace", "preserve", "spoof", "destroy"]
        }, draw(x, tm) { H.bg(x, "#120d18"); drawWaldo733(x, LW / 2 - 220, LH - BAR - 40, 180, "idle"); x.fillStyle = PUR; H.rr(x, LW / 2 + 60, LH - BAR - 220, 90, 44, 6); x.fill(); x.strokeStyle = PUR; x.lineWidth = 2; H.rr(x, LW / 2 + 60, LH - BAR - 220, 90, 44, 6); x.stroke(); H.mike(x, "down0", LW / 2 + 260, LH - BAR - 40, 145); }
      },
      { dur: 2800, cap: "DIAGNOSTICS UPGRADE — the garage knows your car now.", draw(x, tm) { house733(x, tm); drawWaldo733(x, LW / 2 - 180, LH - BAR - 40, 180, "wrench"); H.mike(x, "down0", LW / 2 + 160, LH - BAR - 40, 145); H.panel(x, LW / 2 - 330, BAR + 80, 660, 92, "#0d1f16"); H.txt(x, "DIAGNOSTICS UPGRADE — REPAIRS RESTORE MORE", LW / 2, BAR + 112, 17, GREEN, "center", true); H.txt(x, "WALDO REPUTATION +10", LW / 2, BAR + 142, 14, GOLD, "center", true); } },
    ];
    v725.register("waldo_meet", { title: "FRIENDS IN HIGH PLACES — WALDO'S PLACE", shots: WALDO_MEET_SHOTS, cues: { 1: "chime", 4: "beep520" } });
    v725.register("waldo_grass", { title: "GRASSROOTS INTELLIGENCE", shots: WALDO_GRASS_SHOTS, cues: { 2: "alarm", 3: "chime" } });
    v725.register("waldo_smoke", { title: "SMOKE SIGNALS — THE PORCH", shots: WALDO_SMOKE_SHOTS, cues: { 2: "beep440", 4: "chime" } });
    v725.register("waldo_tracker", { title: "CHECK ENGINE FRIENDSHIP", shots: WALDO_TRACKER_SHOTS, cues: { 0: "err", 2: "alarm", 5: "chime" } });
  }

  // ---------- exports ----------
  window.v733 = {
    version: VER,
    rep: repPts, tier: tier733, tierName: () => TIER_NAMES[tier733()],
    skills: skills733, equipped: equip733, equip: equipSkill733, unlock: unlockSkill733,
    car: car733, roadReady: roadReady733,
    atWaldo: atWaldo733, hotspots: W_HOTSPOTS, mowPct: mowPct733,
    startRepair: startRepair733, repairRound: repairRound733,
    state: () => { const m = meta733() || {}; return { met: !!m._v733met, q1: !!m._v733q1, smoke: m._v733smoke || null, tracker: m._v733tracker || null, ghost: !!m._v733ghost, docs: m._v733docs || [], clear: !!((typeof S !== "undefined") && S && S._v733clear) }; },
    play: (id) => v725.play(id || "waldo_meet", null),
  };
  console.log("[v7.33] Friends in High Places loaded — Waldo's place is on the map");
})();

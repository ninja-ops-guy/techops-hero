// v5.0 — NIGHT CRAWL: exit door, speed ramps, skate/bike shortcuts, night platformer beat-'em-up.
// Loads LAST (after comm_hooks.js). Hooks in without modifying game.js:
//  - step(): car (Factory Tugger) now runs 3x; adds Fixie Bike at 1.6x; night mode physics
//  - draw(): renders exit door + ramps + shortcuts in the office; night mode scene
//  - interact(): door / ramp / shortcut / jab (in night mode) / the Charger (district map)
//  - checkDayEnd(): the 5 PM force-end is suppressed while you're out at night
// Time flow: door unlocks 16:00 → night starts 18:00 → each stage +20 min →
// heading home triggers end-of-day normally. Ramps recharge every 3 days.
//
// v7.31 — NIGHT SHIFT rework (reference-sheet pass, edited in place):
//  - Real beat-'em-up combat: tighter gravity, hit-stop, 3-hit chain into a
//    launcher finisher, attack tokens (max 2 aggressors), enemy archetypes from
//    the sheets (Street Thug / Corrupt Guard / Cyber Skimmer / Drone Operator /
//    Elite Hunter) with blocks, dash-lunges, hover zaps and telegraphed lunges.
//  - Districts: the Charger is the night hub. Walk back to the car, hit E, pick
//    a district (Downtown / Long Wharf / Industrial / Wooster / Airport /
//    Suburbs) — two streets each, rising danger and pay — or drive HOME STREET
//    to end the night. Short in-engine drive transition between spots.
//  - Visuals match the night-drive sheets: layered parallax (far skyline, neon
//    midground with legible English signs, near railing), wet road reflections,
//    lamp glow pools, the parked Charger, and a sheet-style HUD (HP + FOCUS
//    pips, COMBO, DISTRICT · time · DANGER, cash).

// ---------- speed: the car is 3x, and there's a bike now ----------
try { SHOP.push({ id: "lab_bike", name: "Fixie Bike", icon: "🚲", cost: 550, type: "lab", effect: "+60% move speed — beat New Haven traffic", key: "bike", vendor: "procurement" }); } catch (e) { }

// ---------- production sprite bridges ----------
// Night mode was originally authored with procedural debug silhouettes. Keep
// those as fallbacks, but prefer the already-loaded production atlases when
// they are available in the browser bundle.
let __nmGlitchImg = null;
function nmGlitchImg() {
  try {
    if (typeof TO_GLITCH === "undefined" || !TO_GLITCH) return null;
    if (!__nmGlitchImg || __nmGlitchImg.src !== TO_GLITCH) {
      __nmGlitchImg = new Image();
      __nmGlitchImg.src = TO_GLITCH;
    }
    return (__nmGlitchImg.complete && __nmGlitchImg.naturalWidth) ? __nmGlitchImg : null;
  } catch (e) { return null; }
}

function nmEnemySpriteIndex(e) {
  if (!e) return 0;
  if (e.kind === "guard") return 1;
  if (e.kind === "skimmer") return 2;
  if (e.kind === "hunter") return 3;
  if (e.kind === "droneop") return 5;
  return 0;
}

function drawNightEnemyAtlas(x, e, ex, now) {
  const img = nmGlitchImg();
  if (!img || !e) return false;
  const C = 112;
  const gi = nmEnemySpriteIndex(e);
  const sx = (gi % 3) * C, sy = Math.floor(gi / 3) * C;
  const size = Math.max(58, Math.round((e.h || 38) * 1.7));
  const dx = Math.round(ex + (e.w || 30) / 2 - size / 2);
  const dy = Math.round(e.y + (e.h || 38) - size + 6);
  x.save();
  x.imageSmoothingEnabled = false;
  if (e.hitT > 0 && Math.floor(now / 55) % 2) x.globalAlpha = .62;
  if (e.down > 0) {
    x.translate(dx + size / 2, dy + size / 2);
    x.rotate(.24 * Math.sign(e.kb || 1));
    x.drawImage(img, sx, sy, C, C, -size / 2, -size / 2, size, size);
  } else {
    x.drawImage(img, sx, sy, C, C, dx, dy, size, size);
  }
  x.restore();
  return true;
}

function drawNightPlayerAtlas(x, NM, px, py, now) {
  try {
    if (typeof PLAYER_ATLAS === "undefined" || typeof playerImg === "undefined") return false;
    if (!playerImg.complete || !playerImg.naturalWidth) return false;
    const C = PLAYER_ATLAS.cell || 96;
    const moving = Math.abs(NM.vx || 0) > .45;
    let key = "right0";
    if (NM.jabAnim > 0) key = "thumbs";
    else if (NM.block) key = "laptop";
    else if (NM.dashT > 0) key = "party";
    else if (moving) key = "right" + (1 + Math.floor(now / 120) % 2);
    if (!PLAYER_ATLAS.frames[key]) key = "right0";
    const fr = PLAYER_ATLAS.frames[key] || PLAYER_ATLAS.frames.down0;
    if (!fr) return false;
    const h = Math.round((NM.h || 34) * 1.55);
    const w = h;
    const dx = Math.round(px + (NM.w || 22) / 2 - w / 2);
    const dy = Math.round(py + (NM.h || 34) - h + 5);
    x.save();
    x.imageSmoothingEnabled = false;
    if (NM.ifr > 0 && Math.floor(now / 80) % 2) x.globalAlpha = .45;
    if (NM.face < 0) {
      x.translate(dx + w, 0);
      x.scale(-1, 1);
      x.drawImage(playerImg, fr[0] * C, fr[1] * C, C, C, 0, dy, w, h);
    } else {
      x.drawImage(playerImg, fr[0] * C, fr[1] * C, C, C, dx, dy, w, h);
    }
    x.restore();
    return true;
  } catch (e) { return false; }
}

const __origStepV50 = step;
step = function (dt) {
  const s = S;
  if (s && s.nightMode) return stepNM(dt);
  let mult = 1;
  if (s && s.lab) {
    if (s.lab.includes("tugger")) mult = 3.0 / 1.45; // 3x total (game.js already gives 1.45x)
    else if (s.lab.includes("bike")) mult = 1.6;
  }
  __origStepV50(dt * mult);
};

// ---------- world objects: exit door, ramps, shortcuts (placed per day on open floor) ----------
const __origSetupDayV50 = setupDay;
setupDay = function () {
  __origSetupDayV50();
  const s = S; if (!s || !s.map) return;
  const openAt = (x, y) => s.map[y] && s.map[y][x] === 0;
  const find = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (openAt(x, y)) return { x, y };
    return { x: x0, y: y0 };
  };
  const prev = (s.meta.nightObjs || {});
  s._nightObjs = {
    door: find(20, 28, 23, 30),                                        // south edge of the office
    ramps: [
      { id: "atrium", label: "Atrium Kicker", ...find(17, 20, 24, 24), nextDay: prev.ramps?.[0]?.nextDay || 0 },
      { id: "dock", label: "Loading Dock Ramp", ...find(8, 26, 14, 30), nextDay: prev.ramps?.[1]?.nextDay || 0 },
    ],
    shortcuts: [
      { id: "rail", label: "Handrail Shortcut", needs: "skate", ...find(5, 12, 10, 16), nextDay: prev.shortcuts?.[0]?.nextDay || 0 },
      { id: "alley", label: "Back-Alley Cut", needs: "bike", ...find(31, 17, 36, 21), nextDay: prev.shortcuts?.[1]?.nextDay || 0 },
    ],
  };
  s.meta.nightObjs = s._nightObjs; // persist cooldowns across days
};

// ---------- tricks: ramps & shortcuts pay $100-$250, usable once per 3 days ----------
function trickGame(obj, rideIcon) {
  const s = S;
  if (s.day < obj.nextDay) return toast(`🚧 ${obj.label} is closed for repairs — back on DAY ${obj.nextDay}.`);
  if (obj.needs && !s.lab.includes(obj.needs)) {
    const need = obj.needs === "skate" ? "Skateboard" : "Fixie Bike";
    return toast(`🔒 You need the ${need} to hit ${obj.label}.`);
  }
  advanceClock(10);
  dlg(`${rideIcon} ${obj.label}`, `Roll in fast…<br><b>Hit the button the moment the trick window opens.</b><br><small>Reaction decides the payout: $100–$250.</small>`, [{
    t: "🎬 Line up the trick", f: () => {
      dlg(`${rideIcon} ${obj.label}`, `<i>rolling… wait for it…</i>`, [{ t: "…", f: () => { } }]);
      const delay = 700 + Math.random() * 900;
      setTimeout(() => {
        const t0 = performance.now();
        dlg(`${rideIcon} ${obj.label}`, `<b style="font-size:20px">🛹 NOW!</b>`, [{
          t: "🔥 POP IT!", f: () => {
            const rt = performance.now() - t0;
            const pay = rt < 260 ? 250 : rt < 420 ? 200 : rt < 620 ? 150 : 100;
            obj.nextDay = s.day + 3;
            s.budget += pay;
            if (typeof setPose === "function") setPose("victory", 1600);
            toast(`${["🤙 Sloppy", "🛹 Clean", "✨ Stylish", "🔥 PERFECT"][pay === 250 ? 3 : pay === 200 ? 2 : pay === 150 ? 1 : 0]} — +$${pay}! (${Math.round(rt)}ms) Ramp closed for 3 days.`);
            closeDlg(); updateHUD(); save();
          } }]);
      }, delay);
    } }]);
}

// ---------- exit door ----------
function nightDoorDialog() {
  const s = S;
  if (s.clock < 16 * 60) return toast(`🚪 The New Haven night crawl opens at 16:00. It's ${fmtClock(s.clock)}.`);
  dlg("🚪 AeroTech — South Exit", `The badge reader blinks green. Beyond the door: New Haven after dark.<br><br><small>Night mode: platforming, dashes, double jumps — and whatever crawls out of the dark. Clear each street to move on. Head home when you're done (or carried out).</small>`, [
    { t: "🌃 Head out (night falls)", f: () => { closeDlg(); enterNight(); } },
    { t: "Not tonight.", f: closeDlg },
  ]);
}

// ---------- interaction routing ----------
const __origInteractV50 = interact;
interact = function () {
  const s = S;
  if (s && s.nightMode) {
    // v7.31: next to the parked Charger, E opens the district map instead of jabbing
    if (NM && !NM.drive && NM.x < NM_CAR_X + 150 && !s.inDialog) return nmCarMenu();
    return nmJab();
  }
  const o = s && s._nightObjs;
  if (o && !s.inDialog && !s.inBattle) {
    const p = { x: s.px, y: s.py };
    if (adjacent(p, o.door)) return nightDoorDialog();
    const r = o.ramps.find(r => adjacent(p, r));
    if (r) return trickGame(r, "🛺");
    const c = o.shortcuts.find(c => adjacent(p, c));
    if (c) return trickGame(c, c.needs === "skate" ? "🛹" : "🚲");
  }
  __origInteractV50();
};

// ---------- day-end suppression while out at night ----------
const __origCheckDayEndV50 = checkDayEnd;
checkDayEnd = function (force) {
  if (S && S.nightMode) return; // the day can't end while you're crawling New Haven
  __origCheckDayEndV50(force);
};

// ================= NIGHT MODE — beat-'em-up + the Charger hub =================
const NM_W = 1800, NM_FLOOR = 430, NM_GRAV = .48, NM_CAR_X = 26;
let NM = null;

// v7.31 districts — sheet city locations, rising danger & pay
const NM_DISTRICTS = {
  downtown:   { name: "DOWNTOWN",            streets: 2, danger: 1.0,  accent: "#3fa9f5", sky: "#060a1a", far: "#0d1428", mid: "#131c38", signs: ["NOODLE BAR", "24H MART", "HOTEL"], roster: ["thug", "thug", "skimmer"] },
  longwharf:  { name: "LONG WHARF",          streets: 2, danger: 1.15, accent: "#2dd4bf", sky: "#050c16", far: "#0a1626", mid: "#10203a", signs: ["PIER 7", "BAIT & TACKLE", "CRANE 4"], roster: ["thug", "guard", "skimmer"] },
  industrial: { name: "INDUSTRIAL DISTRICT", streets: 2, danger: 1.3,  accent: "#f59e0b", sky: "#0d0906", far: "#181009", mid: "#241812", signs: ["FOUNDRY", "IRON & TIDE", "DEPOT 9"], roster: ["guard", "droneop", "thug"] },
  wooster:    { name: "WOOSTER SQUARE",      streets: 2, danger: 1.45, accent: "#f472b6", sky: "#0d0817", far: "#160f26", mid: "#1f1636", signs: ["CHERRY INN", "FLORIST", "BAKERY"], roster: ["skimmer", "guard", "droneop"] },
  airport:    { name: "AIRPORT ROAD",        streets: 2, danger: 1.6,  accent: "#a3e635", sky: "#070d09", far: "#0c1810", mid: "#14241a", signs: ["HANGAR 9", "CARGO", "FUEL"], roster: ["droneop", "skimmer", "guard"] },
  suburbs:    { name: "SUBURBS",             streets: 2, danger: 1.8,  accent: "#fbbf24", sky: "#0a0c16", far: "#12142a", mid: "#1a1c34", signs: ["MAPLE ST", "GARAGE"], roster: ["hunter", "guard", "skimmer"] },
  home:       { name: "HOME STREET",         streets: 1, danger: 0,    accent: "#7dd87d", sky: "#080d1c", far: "#0e1428", mid: "#141a30", signs: ["APT 4B"], roster: [] },
};
const NM_ORDER = ["downtown", "longwharf", "industrial", "wooster", "airport", "suburbs"];
// enemy archetypes from the night-drive sheets (night-glitch silhouettes, canon palette)
const NM_KINDS = {
  thug:    { name: "Street Thug",    hp: 34, spd: 1.05, dmg: 8,  tint: "#7ee787", cash: [15, 25], w: 24, h: 30 },
  guard:   { name: "Corrupt Guard",  hp: 58, spd: .7,   dmg: 11, tint: "#ffb347", cash: [22, 32], w: 27, h: 33, blocks: true },
  skimmer: { name: "Cyber Skimmer",  hp: 40, spd: 1.55, dmg: 12, tint: "#67e8f9", cash: [25, 36], w: 22, h: 28, dashes: true },
  droneop: { name: "Drone Operator", hp: 48, spd: .8,   dmg: 10, tint: "#c4b5fd", cash: [28, 40], w: 24, h: 30, hover: true },
  hunter:  { name: "Elite Hunter",   hp: 95, spd: 1.2,  dmg: 16, tint: "#ff6b81", cash: [48, 64], w: 27, h: 35, lunges: true },
};

function nmStagePlatforms(st, dist) {
  const D = NM_DISTRICTS[dist || "downtown"];
  const base = [
    { x: 300, y: 330, w: 130, h: 14 }, { x: 560, y: 262, w: 110, h: 14 },
    { x: 820, y: 340, w: 150, h: 14 }, { x: 1100, y: 270, w: 120, h: 14 }, { x: 1380, y: 338, w: 140, h: 14 },
  ];
  if (st >= 2) base.push({ x: 420, y: 192, w: 90, h: 14 }, { x: 940, y: 200, w: 90, h: 14 });
  if (D.danger >= 1.3) base.push({ x: 680, y: 152, w: 80, h: 14 }, { x: 1500, y: 222, w: 80, h: 14 });
  return base;
}
function nmSpawnEnemies(st, dist) {
  const D = NM_DISTRICTS[dist || "downtown"];
  if (!D.roster.length) return [];
  const n = 2 + st + (D.danger >= 1.45 ? 1 : 0), out = [];
  for (let i = 0; i < n; i++) {
    const kind = D.roster[Math.min(i, D.roster.length - 1)];
    const k = NM_KINDS[kind];
    out.push({
      ...k, kind, x: 520 + i * (980 / n) + Math.random() * 80, y: NM_FLOOR - k.h, w: k.w, h: k.h,
      hp: Math.round((k.hp + (st - 1) * 12) * D.danger), maxHp: Math.round((k.hp + (st - 1) * 12) * D.danger),
      dmg: Math.round(k.dmg * D.danger), vx: 0, windup: 0, hitT: 0, kb: 0, launch: 0, down: 0, alive: true,
      cd: 0, // per-enemy special cooldown (dash / zap / lunge)
    });
  }
  return out;
}

function nmLoadDistrict(id) {
  const D = NM_DISTRICTS[id];
  NM.district = id; NM.street = 1;
  NM.x = NM_CAR_X + 84; NM.y = NM_FLOOR - NM.h; NM.vx = 0; NM.vy = 0; NM.face = 1;
  NM.platforms = nmStagePlatforms(1, id); NM.enemies = nmSpawnEnemies(1, id);
  NM.clear = false; NM.cam = 0;
  NM.msg = D.roster.length ? `${D.name} — STREET 1/${D.streets} · clear every enemy, → to push on, ← the Charger waits` : `${D.name} — home. Head right →`;
  NM.msgT = performance.now() + 3600;
}

function enterNight() {
  const s = S;
  s.clock = Math.max(s.clock, 18 * 60); // night falls at 18:00 sharp
  NM = {
    district: "downtown", street: 1, done: {}, drive: null,
    x: NM_CAR_X + 84, y: NM_FLOOR - 34, vx: 0, vy: 0, w: 22, h: 34, face: 1,
    onGround: true, jumps: 0, flip: 0, dashT: 0, dashCD: 0, ifr: 0, jHeld: false,
    hp: 100, block: false, cash: 0, kills: 0, hitStop: 0,
    combo: 0, comboT: 0, lastJab: 0, jabAnim: 0, jabStage: 0, perfectT: 0,
    platforms: nmStagePlatforms(1, "downtown"), enemies: nmSpawnEnemies(1, "downtown"),
    clear: false, cam: 0,
    msg: `DOWNTOWN — STREET 1/2 · clear every enemy · ← the Charger waits`, msgT: performance.now() + 3600,
  };
  s.nightMode = NM;
  sfx("portal");
  // the day shift is over — its tracker leaves the screen until morning
  const qt = document.getElementById("quest-tracker");
  if (qt) { NM._qtHidden = qt.classList.contains("hidden"); qt.classList.add("hidden"); }
  toast("🌃 NEW HAVEN AFTER DARK — ←/→ move · W/↑ jump (x2 = flip) · SHIFT dash · E/A jab · K block · E at the Charger to drive", 4600);
  updateHUD();
}

// the Charger: drive the district map
function nmCarMenu() {
  const s = S;
  const opts = NM_ORDER.filter(id => !NM.done[id]).map(id => {
    const D = NM_DISTRICTS[id];
    return {
      t: `🚗 ${D.name} <small>· DANGER ${Math.round(D.danger * 100)}% · ${NM_ORDER.indexOf(id) === 0 ? "" : "+" + Math.round((D.danger - 1) * 100) + "% pay"}</small>`,
      f: () => { closeDlg(); NM.drive = { t: 0, dur: 1500, to: id }; sfx("portal"); },
    };
  });
  opts.push({ t: `🏠 HOME STREET <small>· call it a night</small>`, f: () => { closeDlg(); NM.drive = { t: 0, dur: 1500, to: "home" }; sfx("portal"); } });
  opts.push({ t: "Back to the street.", f: closeDlg });
  dlg("🚗 THE CHARGER — where to?", `The engine idles. New Haven glows wet and neon.<br><small>Cleared districts stay cleared tonight. Pay scales with danger.</small>`, opts);
}

function nmNextStage() {
  const s = S, D = NM_DISTRICTS[NM.district];
  advanceClock(20); // each street takes 20 minutes
  if (NM.district === "home") return exitNight(true);
  const st = NM.street + 1;
  if (st > D.streets) {
    // district cleared — back to the car, map reopens
    NM.done[NM.district] = true;
    NM.cash += 40; // district clear bonus
    NM.x = NM_CAR_X + 84; NM.y = NM_FLOOR - NM.h; NM.vx = 0; NM.vy = 0;
    NM.enemies = []; NM.clear = false;
    NM.msg = `✅ ${D.name} CLEAR — +$40 · the Charger waits (← E to drive)`; NM.msgT = performance.now() + 4200;
    sfx("promote");
    return;
  }
  NM.street = st;
  NM.x = NM_CAR_X + 84; NM.y = NM_FLOOR - NM.h; NM.vx = 0; NM.vy = 0;
  NM.platforms = nmStagePlatforms(st, NM.district); NM.enemies = nmSpawnEnemies(st, NM.district);
  NM.clear = false;
  NM.msg = `${D.name} — STREET ${st}/${D.streets} — clear every enemy`; NM.msgT = performance.now() + 3000;
}

function exitNight(homeSafe) {
  const s = S, cash = NM.cash, kills = NM.kills, districts = Object.keys(NM.done).length;
  const qt = document.getElementById("quest-tracker");
  if (qt && !NM._qtHidden) qt.classList.remove("hidden"); // day HUD returns in the morning
  s.nightMode = null; NM = null;
  s.budget += cash;
  if (homeSafe) toast(`🏠 Home safe. Night crawl: ${kills} enemies cleared, ${districts} district${districts === 1 ? "" : "s"}, +$${cash} earned.`, 4600);
  else { addStress(20); toast(`🤕 You limp home battered. +20 stress. (+$${cash} salvage)`, 4200); }
  updateHUD(); save();
  __origCheckDayEndV50(true); // the day finally ends
}

// ---------- combat ----------
function nmJab() {
  if (!NM || NM.block || NM.drive) return;
  const now = performance.now(), gap = now - NM.lastJab;
  NM.lastJab = now; NM.jabAnim = 9;
  NM.jabStage = (gap <= 700) ? (NM.jabStage + 1) % 3 : 0; // jab 1 → jab 2 → sweep
  // rhythm system: spaced presses hit harder than button mashing
  let dmg = 12, tag = null;
  if (NM.combo > 0 && gap >= 260 && gap <= 520) { dmg = 24; tag = "PERFECT"; NM.perfectT = now + 500; }
  else if (gap < 160) { dmg = 6; tag = "sloppy"; }
  NM.combo = gap <= 700 ? NM.combo + 1 : 1;
  NM.comboT = now + 700;
  const finisher = NM.jabStage === 2; // the sweep launches
  const hx = NM.face > 0 ? NM.x + NM.w : NM.x - 34, hw = 34;
  let hit = false;
  for (const e of NM.enemies) {
    if (!e.alive || e.down > 0) continue;
    if (e.x + e.w > hx && e.x < hx + hw && Math.abs(e.y - NM.y) < 44) {
      hit = true;
      let dealt = dmg * (finisher ? 1.5 : 1);
      // corrupt guards catch some hits on the shield
      if (e.blocks && !finisher && Math.random() < .35) {
        dealt = Math.ceil(dealt * .35); e.kb = NM.face * 1.5;
        NM.msg = `🛡️ ${e.name} blocks!`; NM.msgT = now + 700; sfx("block");
      } else {
        e.kb = NM.face * (finisher ? 10 : 4);
        if (finisher) { e.launch = 14; e.down = 34; } // launched, then floored
      }
      e.hp -= Math.round(dealt);
      e.hitT = 8;
      NM.hitStop = Math.max(NM.hitStop, finisher ? 6 : 3); // hit-stop sells the impact
      if (e.hp <= 0) {
        e.alive = false; NM.kills++;
        NM.hitStop = Math.max(NM.hitStop, 8);
        const c = e.cash[0] + Math.floor(Math.random() * (e.cash[1] - e.cash[0] + 1));
        NM.cash += c;
        NM.msg = `💥 ${e.name} deleted! +$${c}`; NM.msgT = performance.now() + 1400;
      }
    }
  }
  if (hit) sfx("hit"); else sfx("ping");
  if (tag === "PERFECT") { NM.msg = "⚡ PERFECT TIMING"; NM.msgT = performance.now() + 700; }
  nmCheckClear();
}
function nmCheckClear() {
  if (!NM.clear && NM.enemies.length && NM.enemies.every(e => !e.alive)) {
    NM.clear = true;
    NM.msg = "✅ STREET CLEAR — head right →"; NM.msgT = performance.now() + 3000;
    sfx("promote");
  }
}

// ---------- physics & AI ----------
function stepNM(dt) {
  if (!NM) return;
  if (S.inDialog) return; // map open / dialog — the night waits
  const f = dt * 60, now = performance.now();
  // drive transition: frozen street, the car rolls
  if (NM.drive) {
    NM.drive.t += dt * 1000;
    if (NM.drive.t >= NM.drive.dur) { const to = NM.drive.to; NM.drive = null; nmLoadDistrict(to); }
    return;
  }
  // hit-stop: the world freezes for a beat on impact
  if (NM.hitStop > 0) { NM.hitStop -= f; return; }
  const L = keys.a || keys.arrowleft, R = keys.d || keys.arrowright, J = keys.w || keys.arrowup;
  NM.block = false; // re-evaluated after ground collision resolves
  // run
  if (!NM.block) {
    const acc = NM.onGround ? .62 : .4;
    if (L) { NM.vx -= acc * f; NM.face = -1; }
    if (R) { NM.vx += acc * f; NM.face = 1; }
  }
  const maxV = NM.dashT > 0 ? 9.5 : 4.8;
  NM.vx = clamp(NM.vx, -maxV, maxV);
  if (!L && !R && NM.onGround) NM.vx *= Math.pow(.76, f);
  // jump / double jump (flip)
  if (J && !NM.jHeld) {
    if (NM.onGround) { NM.vy = -10.4; NM.onGround = false; NM.jumps = 1; sfx("jump"); }
    else if (NM.jumps < 2) { NM.vy = -8.8; NM.jumps = 2; NM.flip = 16; sfx("jump"); }
  }
  NM.jHeld = !!J;
  // dash
  if (keys.shift && NM.dashCD <= 0 && !NM.block) { NM.dashT = 10; NM.dashCD = 42; NM.ifr = Math.max(NM.ifr, 12); NM.vx = NM.face * 9.5; sfx("dash"); }
  if (NM.dashCD > 0) NM.dashCD -= f;
  if (NM.dashT > 0) NM.dashT -= f;
  // gravity (tighter than the old float)
  NM.vy = Math.min(NM.vy + NM_GRAV * f, 13.5);
  // integrate
  const prevBottom = NM.y + NM.h;
  NM.x = clamp(NM.x + NM.vx * f, 0, NM_W - NM.w);
  NM.y += NM.vy * f;
  // floor
  NM.onGround = false;
  if (NM.y + NM.h >= NM_FLOOR) { NM.y = NM_FLOOR - NM.h; NM.vy = 0; NM.onGround = true; NM.jumps = 0; }
  // platforms (land only when falling onto them)
  for (const p of NM.platforms) {
    if (NM.vy >= 0 && prevBottom <= p.y && NM.y + NM.h >= p.y && NM.x + NM.w > p.x && NM.x < p.x + p.w) {
      NM.y = p.y - NM.h; NM.vy = 0; NM.onGround = true; NM.jumps = 0;
    }
  }
  // grounded? blocking is a grounded stance (beat-'em-up rules)
  if (NM.onGround && keys.k) NM.block = true;
  if (NM.flip > 0) NM.flip -= f;
  if (NM.ifr > 0) NM.ifr -= f;
  if (NM.jabAnim > 0) NM.jabAnim -= f;
  if (now > NM.comboT) { NM.combo = 0; NM.jabStage = 0; }
  // enemies — attack tokens: at most 2 aggressors press in at once
  let tokens = 0;
  for (const e of NM.enemies) if (e.alive && e._press) e._press = false;
  for (const e of NM.enemies) {
    if (!e.alive) continue;
    // launch / downed states first
    if (e.launch > 0) { e.launch -= f; e.y -= 3.2 * f; e.x += (e.kb || 0) * f; if (e.launch <= 0) e.kb = 0; continue; }
    if (e.down > 0) { e.down -= f; e.y = NM_FLOOR - e.h; continue; }
    if (e.kb) { e.x += e.kb * f; e.kb *= Math.pow(.7, f); if (Math.abs(e.kb) < .3) e.kb = 0; }
    if (e.hitT > 0) e.hitT -= f;
    if (e.cd > 0) e.cd -= f;
    const dx = (NM.x + NM.w / 2) - (e.x + e.w / 2);
    const adx = Math.abs(dx);
    e.y = e.hover ? NM_FLOOR - e.h - 34 - Math.sin(now / 300 + e.x) * 6 : NM_FLOOR - e.h;
    const pressing = tokens < 2 && !e.kb;
    if (pressing && adx < 340 && adx > 34) { e.x += Math.sign(dx) * e.spd * f; e._press = true; tokens++; }
    else if (!pressing && adx < 340 && adx > 90 && !e.kb) e.x += Math.sign(dx) * e.spd * .35 * f; // hang back
    // archetype specials
    if (e.dashes && e.cd <= 0 && adx > 90 && adx < 300) { e.cd = 130; e.x += Math.sign(dx) * 90; sfx("dash"); } // skimmer blink-step
    if (e.lunges && e.cd <= 0 && adx > 120 && adx < 320) { e.cd = 150; e.kb = Math.sign(dx) * 11; } // hunter lunge
    // attack
    if (adx <= 36 && Math.abs(e.y - NM.y) < 40 && NM.ifr <= 0) {
      e.windup += f;
      if (e.windup > 26) {
        e.windup = 0;
        const chip = NM.block;
        NM.hp -= chip ? Math.ceil(e.dmg * .25) : e.dmg;
        NM.ifr = 22;
        if (!chip) { NM.vx = Math.sign(dx) * -5; NM.vy = -3; }
        sfx(chip ? "block" : "bad");
        NM.msg = chip ? "🛡️ blocked!" : `💥 ${e.name} hits you!`; NM.msgT = now + 900;
        if (NM.hp <= 0) return exitNight(false);
      }
    } else e.windup = 0;
    // drone operator: ranged zap at mid distance
    if (e.hover && e.cd <= 0 && adx >= 130 && adx < 280) {
      e.windup += f * 1.2;
      if (e.windup > 30) {
        e.windup = 0; e.cd = 150;
        if (NM.ifr <= 0) {
          const chip = NM.block;
          NM.hp -= chip ? Math.ceil(e.dmg * .3) : Math.ceil(e.dmg * .8);
          NM.ifr = 22;
          sfx(chip ? "block" : "bad");
          NM.msg = chip ? "🛡️ zap caught on the stance!" : `⚡ drone zap — ${e.dmg} arc damage!`; NM.msgT = now + 900;
          if (NM.hp <= 0) return exitNight(false);
        }
      }
    }
  }
  // camera + exits: right edge advances, the car waits at the left
  NM.cam = clamp(NM.x - cv.width / 2.4, 0, NM_W - cv.width);
  if (NM.clear && NM.x > NM_W - 110) nmNextStage();
  if (NM.district === "home" && NM.x > NM_W - 240) exitNight(true);
}

// ---------- night rendering ----------
const __origDrawV50 = draw;
draw = function () {
  if (S && S.nightMode) return drawNM();
  __origDrawV50.apply(this, arguments);
  // office overlay: exit door, ramps, shortcuts
  const s = S, o = s && s._nightObjs;
  if (!o || !s.map) return;
  const ts = cv.height / 14, sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🚪", o.door.x * TILE + 16, o.door.y * TILE + 14);
  ctx.font = "9px monospace"; ctx.fillStyle = "#9fb7d9";
  ctx.fillText("EXIT", o.door.x * TILE + 16, o.door.y * TILE - 6);
  for (const r of o.ramps) {
    const open = s.day >= r.nextDay;
    ctx.globalAlpha = open ? 1 : .35;
    // ramp wedge
    ctx.fillStyle = "#8a94a6";
    ctx.beginPath();
    ctx.moveTo(r.x * TILE, (r.y + 1) * TILE); ctx.lineTo((r.x + 1) * TILE, (r.y + 1) * TILE); ctx.lineTo((r.x + 1) * TILE, r.y * TILE + 10);
    ctx.closePath(); ctx.fill();
    ctx.font = "12px serif"; ctx.fillText("🛺", r.x * TILE + 16, r.y * TILE + 4);
    ctx.globalAlpha = 1;
  }
  for (const c of o.shortcuts) {
    const open = s.day >= c.nextDay;
    ctx.globalAlpha = open ? 1 : .35;
    ctx.font = "16px serif";
    ctx.fillText(c.needs === "skate" ? "🛹" : "🚲", c.x * TILE + 16, c.y * TILE + 12);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

// the parked Charger (drawn — slab body, green ghost-flame hints, underglow)
function nmCar(x, cx, cy, w, tm) {
  const h = w * .24;
  x.save();
  x.shadowColor = "#39ff88"; x.shadowBlur = 14;
  x.fillStyle = "#0a0c12"; x.beginPath(); x.roundRect(cx - w / 2, cy - h, w, h, 7); x.fill();
  x.restore();
  x.fillStyle = "#12141e"; x.beginPath(); x.roundRect(cx - w * .3, cy - h * 1.5, w * .52, h * .62, 5); x.fill(); // cabin
  x.fillStyle = "#1d2433"; x.fillRect(cx - w * .26, cy - h * 1.42, w * .44, h * .34); // glass
  x.strokeStyle = "#2a3350"; x.lineWidth = 2; x.beginPath(); x.roundRect(cx - w / 2, cy - h, w, h, 7); x.stroke();
  // ghost-flame tongues (drawn shapes)
  x.fillStyle = "#1d5c38";
  for (let i = 0; i < 3; i++) {
    const fx = cx - w * .32 + i * w * .09;
    x.beginPath(); x.moveTo(fx, cy - h * .5); x.quadraticCurveTo(fx + 8, cy - h * .95, fx + 16, cy - h * .55); x.quadraticCurveTo(fx + 8, cy - h * .4, fx, cy - h * .5); x.fill();
  }
  // underglow
  x.save(); x.globalAlpha = .5 + .18 * Math.sin(tm / 320); x.fillStyle = "#39ff88";
  x.fillRect(cx - w * .42, cy + 3, w * .84, 3); x.restore();
  for (const wx of [-w * .3, w * .3]) {
    x.fillStyle = "#05060a"; x.beginPath(); x.arc(cx + wx, cy, h * .34, 0, 7); x.fill();
    x.strokeStyle = "#39ff8855"; x.lineWidth = 2; x.stroke();
  }
  // tail light bar
  x.fillStyle = "#ff4444"; x.fillRect(cx - w / 2 + 2, cy - h * .8, 4, h * .3);
}

function drawNM() {
  const now = performance.now();
  const W = cv.width, H = cv.height, horizon = NM_FLOOR - 60;
  const D = NM_DISTRICTS[NM.district];
  // drive transition: the Charger owns the frame, world streams past
  if (NM.drive) {
    const t = NM.drive.t / NM.drive.dur;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#05070f"); sky.addColorStop(1, "#141c34");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    for (let layer = 0; layer < 3; layer++) {
      const par = [3.2, 2.1, 1.2][layer] * (1 + t);
      ctx.fillStyle = ["#0c1326", "#111a33", "#182444"][layer];
      for (let i = 0; i < 10; i++) {
        const bw = 110 + (i * 67 % 90), bh = 130 + (i * 83 % 160) + layer * 50;
        const bx = ((i * 210 - now / 16 * par) % (W + 320)) - 160;
        ctx.fillRect(bx, horizon - bh, bw, bh);
        if (layer === 2) { ctx.fillStyle = "#ffd24a2e"; for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 3; wx++) if ((i + wy + wx) % 3 === 0) ctx.fillRect(bx + 14 + wx * 26, horizon - bh + 16 + wy * 30, 9, 12); ctx.fillStyle = "#182444"; }
      }
    }
    ctx.fillStyle = "#1c2333"; ctx.fillRect(0, NM_FLOOR, W, H - NM_FLOOR);
    ctx.fillStyle = "#ffd24a66";
    for (let i = 0; i < 10; i++) ctx.fillRect(((i * 150 - now / 3) % (W + 150)) - 75, NM_FLOOR + 24, 60, 5);
    nmCar(ctx, W / 2, NM_FLOOR - 6, 300, now);
    ctx.fillStyle = "#9fb7d9"; ctx.font = "13px monospace"; ctx.textAlign = "center";
    ctx.fillText(`DRIVING — ${NM_DISTRICTS[NM.drive.to].name}`, W / 2, 70);
    return;
  }
  // night sky per district
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, D.sky); sky.addColorStop(.7, D.far); sky.addColorStop(1, D.mid);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // v7.34: painted district backdrop (payload-loaded) replaces the procedural
  // sky layers when present; the street/railing/HUD stay procedural either way
  const __bg734 = (typeof NM_BG734 !== "undefined") && NM_BG734[NM.district];
  if (__bg734 && __bg734.complete && __bg734.naturalWidth) {
    const bs = Math.max(W / __bg734.naturalWidth, (horizon + 60) / __bg734.naturalHeight);
    const bw = __bg734.naturalWidth * bs, bh = __bg734.naturalHeight * bs;
    const bx = -((NM.cam * .18) % Math.max(1, bw - W + 1));
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(__bg734, bx, horizon + 40 - bh, bw, bh);
  } else {
  // moon + stars
  ctx.fillStyle = "#e8ecff"; ctx.beginPath(); ctx.arc(W - 90, 60, 22, 0, 7); ctx.fill();
  ctx.fillStyle = "#ffffff55";
  for (let i = 0; i < 40; i++) ctx.fillRect((i * 173 + 40) % W, (i * 97 + 20) % 220, 2, 2);
  // far skyline
  ctx.fillStyle = D.far;
  for (let i = 0; i < 12; i++) {
    const bw = 90 + (i * 53 % 70), bh = 130 + (i * 91 % 150);
    const bx = ((i * 170 - NM.cam * .28) % (NM_W + 200)) - 120;
    ctx.fillRect(bx, horizon - bh, bw, bh);
  }
  // midground blocks with legible neon signage (district accent)
  for (let i = 0; i < 8; i++) {
    const bw = 150 + (i * 61 % 60), bh = 90 + (i * 47 % 70);
    const bx = ((i * 260 - NM.cam * .55) % (NM_W + 300)) - 160;
    ctx.fillStyle = D.mid; ctx.fillRect(bx, horizon - bh, bw, bh);
    ctx.fillStyle = "#ffd24a2a";
    for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 4; wx++)
      if ((i * 5 + wy * 2 + wx) % 3 === 0) ctx.fillRect(bx + 14 + wx * 30, horizon - bh + 12 + wy * 24, 10, 12);
    const sign = D.signs[i % D.signs.length];
    if (sign) {
      ctx.save();
      ctx.shadowColor = D.accent; ctx.shadowBlur = 10;
      ctx.fillStyle = D.accent; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
      ctx.globalAlpha = .85 + (i % 3 === 0 ? Math.sin(now / 500 + i) * .15 : 0); // an occasional flicker
      ctx.fillText(sign, bx + bw / 2, horizon - bh - 8);
      ctx.restore();
    }
  }
  } // v7.34: end procedural-sky else (painted backdrop drew instead)
  // near railing (fast parallax)
  ctx.strokeStyle = "#232c44"; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) { const bx = ((i * 140 - NM.cam * .85) % (NM_W + 160)) - 80; ctx.moveTo(bx, horizon + 6); ctx.lineTo(bx, horizon - 22); }
  ctx.stroke();
  ctx.strokeStyle = "#2c3652"; ctx.beginPath(); ctx.moveTo(0, horizon - 20); ctx.lineTo(W, horizon - 20); ctx.stroke();
  // street: asphalt, lane marks, wet sheen under lamps
  ctx.fillStyle = "#1e2536"; ctx.fillRect(0, NM_FLOOR, W, H - NM_FLOOR);
  ctx.fillStyle = "#151b29"; ctx.fillRect(0, NM_FLOOR, W, 8);
  ctx.fillStyle = "#ffd24a55";
  for (let i = 0; i < 14; i++) ctx.fillRect(((i * 130 - NM.cam) % (NM_W + 130)) - 60, NM_FLOOR + 22, 46, 4);
  for (let i = 0; i < 7; i++) {
    const lx = ((i * 300 - NM.cam) % (NM_W + 300)) - 150;
    ctx.fillStyle = "#2a3350"; ctx.fillRect(lx, NM_FLOOR - 96, 4, 96); // lamp post
    const g = ctx.createRadialGradient(lx + 2, NM_FLOOR - 96, 6, lx + 2, NM_FLOOR - 20, 90);
    g.addColorStop(0, D.accent + "30"); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(lx + 2, NM_FLOOR - 10, 90, 26, 0, 0, 7); ctx.fill();
  }
  // platforms
  ctx.fillStyle = "#3a4663";
  for (const p of NM.platforms) { ctx.fillRect(p.x - NM.cam, p.y, p.w, p.h); ctx.fillStyle = "#55628a"; ctx.fillRect(p.x - NM.cam, p.y, p.w, 3); ctx.fillStyle = "#3a4663"; }
  // the Charger waits at the left end of every street
  nmCar(ctx, NM_CAR_X + 60 - NM.cam, NM_FLOOR - 4, 120, now);
  if (NM.x < NM_CAR_X + 150) {
    ctx.save(); ctx.globalAlpha = .7 + Math.sin(now / 260) * .3;
    ctx.fillStyle = "#9fb7d9"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Ⓔ DRIVE", NM_CAR_X + 60 - NM.cam, NM_FLOOR - 92);
    ctx.restore();
  }
  // exit marker
  if (NM.clear) {
    ctx.font = "22px serif"; ctx.textAlign = "center";
    ctx.globalAlpha = .6 + Math.sin(now / 200) * .4;
    ctx.fillText("➡️", NM_W - 70 - NM.cam, NM_FLOOR - 50);
    ctx.globalAlpha = 1;
  }
  // enemies — archetype silhouettes with glitch flicker
  for (const e of NM.enemies) {
    if (!e.alive) continue;
    const ex = e.x - NM.cam;
    // tint underglow — figures read against the dark street
    ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = e.tint;
    ctx.beginPath(); ctx.ellipse(ex + e.w / 2, NM_FLOOR + 4, e.w * .9, 6, 0, 0, 7); ctx.fill(); ctx.restore();
    if (!drawNightEnemyAtlas(ctx, e, ex, now)) {
      const flick = e.hitT > 0 || (e.kind === "hunter" && Math.floor(now / 140 + e.x) % 7 === 0);
      ctx.fillStyle = flick ? "#ffffff" : "#2a3a56";
      ctx.beginPath(); ctx.roundRect(ex, e.y, e.w, e.h, 6); ctx.fill();
      ctx.strokeStyle = e.tint; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = e.tint;
      ctx.fillRect(ex + 5, e.y + 8, 4, 5); ctx.fillRect(ex + e.w - 9, e.y + 8, 4, 5); // eyes
      if (e.kind === "guard") { ctx.fillStyle = e.tint + "88"; ctx.fillRect(ex - 5, e.y + 6, 5, e.h - 10); } // shield slab
      if (e.kind === "droneop") { // hovering drone companion
        ctx.fillStyle = e.tint;
        const dy = e.y - 26 + Math.sin(now / 240) * 4;
        ctx.fillRect(ex + e.w / 2 - 6, dy, 12, 5); ctx.fillRect(ex + e.w / 2 - 2, dy - 3, 4, 3);
      }
    }
    if (e.down > 0) { ctx.save(); ctx.translate(ex + e.w / 2, e.y + e.h / 2); ctx.rotate(.35 * Math.sign(e.kb || 1)); ctx.globalAlpha = .7; ctx.restore(); }
    if (e.windup > 8) { ctx.fillStyle = "#ff5252"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillText("!", ex + e.w / 2, e.y - 12); }
    // hp pip
    ctx.fillStyle = "#222"; ctx.fillRect(ex, e.y - 7, e.w, 3);
    ctx.fillStyle = e.tint; ctx.fillRect(ex, e.y - 7, e.w * Math.max(0, e.hp) / e.maxHp, 3);
  }
  // player (flip rotation on double jump, arm on jab, shield on block, dash trail)
  const px = NM.x - NM.cam, py = NM.y, cxp = px + NM.w / 2, cyp = py + NM.h / 2;
  if (NM.dashT > 0) {
    ctx.save(); ctx.globalAlpha = .22;
    for (let i = 1; i <= 3; i++) { ctx.fillStyle = "#7ec8ff"; ctx.fillRect(px - NM.face * i * 9, py + 6, NM.w, NM.h - 6); }
    ctx.restore();
  }
  if (!drawNightPlayerAtlas(ctx, NM, px, py, now)) {
    ctx.save();
    ctx.translate(cxp, cyp);
    if (NM.flip > 0) ctx.rotate((NM.face) * (16 - NM.flip) / 16 * Math.PI * 2);
    if (NM.ifr > 0 && Math.floor(now / 80) % 2) ctx.globalAlpha = .45;
    ctx.scale(NM.face, 1);
    ctx.fillStyle = "#4a6390"; ctx.fillRect(-NM.w / 2, -NM.h / 2 + 10, NM.w, NM.h - 10); // jacket
    ctx.strokeStyle = "#7ec8ff88"; ctx.lineWidth = 2; ctx.strokeRect(-NM.w / 2, -NM.h / 2 + 10, NM.w, NM.h - 10); // rim light
    ctx.fillStyle = "#5a3b28"; ctx.fillRect(-NM.w / 2 + 3, -NM.h / 2 - 2, NM.w - 6, 12); // head
    ctx.fillStyle = "#14100c"; ctx.fillRect(-NM.w / 2 + 1, -NM.h / 2 - 6, NM.w - 2, 6); // dreads
    if (NM.jabAnim > 0) { // jab 1 / jab 2 / sweep
      ctx.fillStyle = "#5a3b28";
      if (NM.jabStage === 2) { ctx.fillRect(NM.w / 2 - 2, -10, 18, 5); ctx.fillRect(NM.w / 2 - 2, 2, 18, 5); }
      else ctx.fillRect(NM.w / 2 - 2, -4 + (NM.jabStage === 1 ? -5 : 0), 16, 6);
    }
    ctx.restore();
  }
  if (NM.block) { ctx.strokeStyle = "#7ec8ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cxp, cyp, 24, -1.2, 1.2); ctx.stroke(); }
  // ---------- sheet-style HUD ----------
  // left: HP + FOCUS pips + cash
  ctx.fillStyle = "#0009"; ctx.fillRect(10, 10, 250, 76);
  ctx.fillStyle = "#333"; ctx.fillRect(18, 18, 160, 10);
  ctx.fillStyle = NM.hp > 35 ? "#7ee787" : "#ff6b81"; ctx.fillRect(18, 18, 160 * Math.max(0, NM.hp) / 100, 10);
  ctx.strokeStyle = "#556"; ctx.strokeRect(18, 18, 160, 10);
  ctx.fillStyle = "#9fb7d9"; ctx.font = "11px monospace"; ctx.textAlign = "left";
  ctx.fillText("HP", 184, 27);
  ctx.fillText("FOCUS", 18, 46);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i < Math.min(NM.combo, 6) ? (NM.perfectT > now ? "#ffd24a" : "#7ec8ff") : "#2a3350";
    ctx.fillRect(66 + i * 14, 38, 10, 8);
  }
  ctx.fillStyle = "#7dd87d";
  ctx.fillText(`$${NM.cash}`, 18, 62);
  if (NM.combo > 1) {
    ctx.fillStyle = NM.perfectT > now ? "#ffd24a" : "#9fb7d9"; ctx.font = "bold 15px monospace";
    ctx.fillText(`COMBO ×${NM.combo}${NM.perfectT > now ? " PERFECT" : ""}`, 18, 80);
  }
  // right: district / time / danger
  ctx.fillStyle = "#0009"; ctx.fillRect(W - 262, 10, 252, 62);
  ctx.fillStyle = D.accent; ctx.font = "bold 13px monospace"; ctx.textAlign = "right";
  ctx.fillText(`${D.name} · ST ${NM.street}/${D.streets}`, W - 20, 30);
  ctx.fillStyle = "#9fb7d9"; ctx.font = "11px monospace";
  ctx.fillText(fmtClock(S.clock), W - 20, 48);
  ctx.fillText("DANGER", W - 160, 48);
  const dp = Math.min(1, D.danger / 2);
  ctx.fillStyle = "#333"; ctx.fillRect(W - 100, 40, 80, 8);
  ctx.fillStyle = dp > .7 ? "#ff6b81" : dp > .4 ? "#ffb347" : "#7ee787";
  ctx.fillRect(W - 100, 40, 80 * dp, 8);
  ctx.fillStyle = "#9fb7d9";
  ctx.fillText(`💀 ${NM.kills}`, W - 20, 64);
  // center message
  if (NM.msgT > now) {
    ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 260, 96, 520, 34);
    ctx.fillStyle = "#ffd24a"; ctx.textAlign = "center"; ctx.font = "13px monospace";
    ctx.fillText(NM.msg, W / 2, 118);
  }
  ctx.textAlign = "center";
}

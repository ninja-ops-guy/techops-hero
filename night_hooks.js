// v5.0 — NIGHT CRAWL: exit door, speed ramps, skate/bike shortcuts, night platformer beat-'em-up.
// Loads LAST (after comm_hooks.js). Hooks in without modifying game.js:
//  - step(): car (Factory Tugger) now runs 3x; adds Fixie Bike at 1.6x; night mode physics
//  - draw(): renders exit door + ramps + shortcuts in the office; night mode scene
//  - interact(): door / ramp / shortcut / jab (in night mode)
//  - checkDayEnd(): the 5 PM force-end is suppressed while you're out at night
// Time flow: door unlocks 16:00 → night starts 18:00 → each stage +20 min →
// heading home triggers end-of-day normally. Ramps recharge every 3 days.

// ---------- speed: the car is 3x, and there's a bike now ----------
try { SHOP.push({ id: "lab_bike", name: "Fixie Bike", icon: "🚲", cost: 550, type: "lab", effect: "+60% move speed — beat New Haven traffic", key: "bike", vendor: "procurement" }); } catch (e) { }

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
  if (s && s.nightMode) return nmJab();
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

// ================= NIGHT MODE — floaty platformer + beat-'em-up =================
const NM_W = 1600, NM_FLOOR = 430, NM_GRAV = .34;
let NM = null;

function nmStagePlatforms(st) {
  const base = [
    { x: 260, y: 330, w: 130, h: 14 }, { x: 520, y: 260, w: 110, h: 14 },
    { x: 760, y: 340, w: 150, h: 14 }, { x: 1040, y: 270, w: 120, h: 14 }, { x: 1300, y: 340, w: 140, h: 14 },
  ];
  if (st >= 2) base.push({ x: 380, y: 190, w: 90, h: 14 }, { x: 880, y: 200, w: 90, h: 14 });
  if (st >= 3) base.push({ x: 620, y: 150, w: 80, h: 14 }, { x: 1420, y: 220, w: 80, h: 14 });
  return base;
}
function nmSpawnEnemies(st) {
  const n = 2 + st, out = [];
  const kinds = [
    { name: "Glitch Imp", hp: 30, spd: .9, dmg: 8, tint: "#7ee787", cash: [15, 25] },
    { name: "Corrupt Drone", hp: 45, spd: .65, dmg: 11, tint: "#ffb347", cash: [20, 30] },
    { name: "Null Stalker", hp: 60, spd: 1.2, dmg: 14, tint: "#ff6b81", cash: [25, 35] },
  ];
  for (let i = 0; i < n; i++) {
    const k = kinds[Math.min(st - 1, kinds.length - 1)];
    out.push({
      ...k, x: 400 + i * (1000 / n) + Math.random() * 80, y: NM_FLOOR - 30, w: 24, h: 30,
      hp: k.hp + (st - 1) * 10, vx: 0, windup: 0, hitT: 0, kb: 0, alive: true,
    });
  }
  return out;
}

function enterNight() {
  const s = S;
  s.clock = Math.max(s.clock, 18 * 60); // night falls at 18:00 sharp
  NM = {
    stage: 1, x: 60, y: NM_FLOOR - 34, vx: 0, vy: 0, w: 22, h: 34, face: 1,
    onGround: true, jumps: 0, flip: 0, dashT: 0, dashCD: 0, ifr: 0, jHeld: false,
    hp: 100, block: false, cash: 0, kills: 0,
    combo: 0, comboT: 0, lastJab: 0, jabAnim: 0, perfectT: 0,
    platforms: nmStagePlatforms(1), enemies: nmSpawnEnemies(1),
    clear: false, cam: 0, msg: `NIGHT STREET 1/3 — clear every enemy to move on`, msgT: performance.now() + 3000,
  };
  s.nightMode = NM;
  sfx("portal");
  toast("🌃 NEW HAVEN AFTER DARK — ←/→ move · W/↑ jump (x2 = flip jump) · SHIFT dash · E/A jab · K block", 4200);
  updateHUD();
}

function nmNextStage() {
  const s = S, st = NM.stage + 1;
  advanceClock(20); // each street takes 20 minutes
  if (st > 3) return exitNight(true);
  NM.stage = st; NM.x = 60; NM.y = NM_FLOOR - 34; NM.vx = 0; NM.vy = 0;
  NM.platforms = nmStagePlatforms(st); NM.enemies = nmSpawnEnemies(st);
  NM.clear = false;
  NM.msg = `NIGHT STREET ${st}/3 — clear every enemy to move on`; NM.msgT = performance.now() + 3000;
}

function exitNight(homeSafe) {
  const s = S, cash = NM.cash, kills = NM.kills;
  s.nightMode = null; NM = null;
  s.budget += cash;
  if (homeSafe) toast(`🏠 Home safe. Night crawl: ${kills} enemies cleared, +$${cash} earned.`, 4200);
  else { addStress(20); toast(`🤕 You limp home battered. +20 stress. (+$${cash} salvage)`, 4200); }
  updateHUD(); save();
  __origCheckDayEndV50(true); // the day finally ends
}

// ---------- combat ----------
function nmJab() {
  if (!NM || NM.block) return;
  const now = performance.now(), gap = now - NM.lastJab;
  NM.lastJab = now; NM.jabAnim = 9;
  // rhythm system: spaced presses hit harder than button mashing
  let dmg = 12, tag = null;
  if (NM.combo > 0 && gap >= 260 && gap <= 520) { dmg = 24; tag = "PERFECT"; NM.perfectT = now + 500; }
  else if (gap < 160) { dmg = 6; tag = "sloppy"; }
  NM.combo = gap <= 700 ? NM.combo + 1 : 1;
  NM.comboT = now + 700;
  const finisher = NM.combo % 3 === 0; // every 3rd hit launches
  const hx = NM.face > 0 ? NM.x + NM.w : NM.x - 34, hw = 34;
  let hit = false;
  for (const e of NM.enemies) {
    if (!e.alive) continue;
    if (e.x + e.w > hx && e.x < hx + hw && Math.abs(e.y - NM.y) < 40) {
      hit = true;
      e.hp -= dmg * (finisher ? 1.5 : 1);
      e.kb = NM.face * (finisher ? 9 : 4); e.hitT = 8;
      if (e.hp <= 0) {
        e.alive = false; NM.kills++;
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
  if (!NM.clear && NM.enemies.every(e => !e.alive)) {
    NM.clear = true;
    NM.msg = "✅ STREET CLEAR — head right →"; NM.msgT = performance.now() + 3000;
    sfx("promote");
  }
}

// ---------- physics & AI ----------
function stepNM(dt) {
  if (!NM) return;
  const f = dt * 60, now = performance.now();
  const L = keys.a || keys.arrowleft, R = keys.d || keys.arrowright, J = keys.w || keys.arrowup;
  NM.block = false; // re-evaluated after ground collision resolves
  // run
  if (!NM.block) {
    const acc = NM.onGround ? .55 : .35;
    if (L) { NM.vx -= acc * f; NM.face = -1; }
    if (R) { NM.vx += acc * f; NM.face = 1; }
  }
  const maxV = NM.dashT > 0 ? 9 : 4.4;
  NM.vx = clamp(NM.vx, -maxV, maxV);
  if (!L && !R && NM.onGround) NM.vx *= Math.pow(.78, f);
  // jump / double jump (flip)
  if (J && !NM.jHeld) {
    if (NM.onGround) { NM.vy = -9.6; NM.onGround = false; NM.jumps = 1; sfx("jump"); }
    else if (NM.jumps < 2) { NM.vy = -8.4; NM.jumps = 2; NM.flip = 16; sfx("jump"); }
  }
  NM.jHeld = !!J;
  // dash
  if (keys.shift && NM.dashCD <= 0 && !NM.block) { NM.dashT = 10; NM.dashCD = 42; NM.ifr = Math.max(NM.ifr, 12); NM.vx = NM.face * 9; sfx("dash"); }
  if (NM.dashCD > 0) NM.dashCD -= f;
  if (NM.dashT > 0) NM.dashT -= f;
  // gravity (floaty)
  NM.vy = Math.min(NM.vy + NM_GRAV * f, 12);
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
  if (now > NM.comboT) NM.combo = 0;
  // enemies
  for (const e of NM.enemies) {
    if (!e.alive) continue;
    if (e.kb) { e.x += e.kb * f; e.kb *= Math.pow(.7, f); if (Math.abs(e.kb) < .3) e.kb = 0; }
    if (e.hitT > 0) e.hitT -= f;
    const dx = (NM.x + NM.w / 2) - (e.x + e.w / 2);
    if (Math.abs(dx) < 320 && Math.abs(dx) > 30 && !e.kb) e.x += Math.sign(dx) * e.spd * f;
    e.y = NM_FLOOR - e.h;
    // attack
    if (Math.abs(dx) <= 34 && Math.abs(e.y - NM.y) < 36 && NM.ifr <= 0) {
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
  }
  // camera + stage exit
  NM.cam = clamp(NM.x - cv.width / 2.4, 0, NM_W - cv.width);
  if (NM.clear && NM.x > NM_W - 110) nmNextStage();
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

function drawNM() {
  const now = performance.now();
  const W = cv.width, H = cv.height, horizon = NM_FLOOR - 60;
  // night sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#060a1a"); sky.addColorStop(.7, "#101a33"); sky.addColorStop(1, "#1a2340");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // moon + stars
  ctx.fillStyle = "#e8ecff"; ctx.beginPath(); ctx.arc(W - 90, 60, 22, 0, 7); ctx.fill();
  ctx.fillStyle = "#ffffff55";
  for (let i = 0; i < 40; i++) ctx.fillRect((i * 173 + 40) % W, (i * 97 + 20) % 220, 2, 2);
  // parallax skyline
  for (let layer = 0; layer < 2; layer++) {
    const par = [.3, .55][layer], tint = ["#0d1428", "#131c38"][layer];
    ctx.fillStyle = tint;
    for (let i = 0; i < 12; i++) {
      const bw = 90 + (i * 53 % 70), bh = 120 + (i * 91 % 140) + layer * 40;
      const bx = ((i * 160 - NM.cam * par) % (NM_W)) - 100;
      ctx.fillRect(bx, horizon - bh, bw, bh);
      ctx.fillStyle = "#ffd24a33";
      for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 3; wx++)
        if ((i * 7 + wy * 3 + wx + layer) % 3 === 0) ctx.fillRect(bx + 12 + wx * 24, horizon - bh + 14 + wy * 26, 8, 10);
      ctx.fillStyle = tint;
    }
  }
  // street
  ctx.fillStyle = "#232a3d"; ctx.fillRect(0, NM_FLOOR, W, H - NM_FLOOR);
  ctx.fillStyle = "#ffd24a55";
  for (let i = 0; i < 14; i++) ctx.fillRect(((i * 130 - NM.cam) % (NM_W + 130)) - 60, NM_FLOOR + 22, 46, 4);
  // platforms
  ctx.fillStyle = "#3a4663";
  for (const p of NM.platforms) { ctx.fillRect(p.x - NM.cam, p.y, p.w, p.h); ctx.fillStyle = "#55628a"; ctx.fillRect(p.x - NM.cam, p.y, p.w, 3); ctx.fillStyle = "#3a4663"; }
  // exit marker
  if (NM.clear) {
    ctx.font = "22px serif"; ctx.textAlign = "center";
    ctx.globalAlpha = .6 + Math.sin(now / 200) * .4;
    ctx.fillText("➡️", NM_W - 70 - NM.cam, NM_FLOOR - 50);
    ctx.globalAlpha = 1;
  }
  // enemies
  for (const e of NM.enemies) {
    if (!e.alive) continue;
    const ex = e.x - NM.cam;
    ctx.fillStyle = e.hitT > 0 ? "#ffffff" : e.tint;
    ctx.beginPath(); ctx.roundRect(ex, e.y, e.w, e.h, 6); ctx.fill();
    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(ex + 5, e.y + 8, 4, 5); ctx.fillRect(ex + e.w - 9, e.y + 8, 4, 5); // eyes
    if (e.windup > 8) { ctx.fillStyle = "#ff5252"; ctx.fillText("!", ex + e.w / 2, e.y - 12); }
    // hp pip
    ctx.fillStyle = "#222"; ctx.fillRect(ex, e.y - 7, e.w, 3);
    ctx.fillStyle = e.tint; ctx.fillRect(ex, e.y - 7, e.w * Math.max(0, e.hp) / 70, 3);
  }
  // player (flip rotation on double jump, arm on jab, shield on block)
  const px = NM.x - NM.cam, py = NM.y, cxp = px + NM.w / 2, cyp = py + NM.h / 2;
  ctx.save();
  ctx.translate(cxp, cyp);
  if (NM.flip > 0) ctx.rotate((NM.face) * (16 - NM.flip) / 16 * Math.PI * 2);
  if (NM.ifr > 0 && Math.floor(now / 80) % 2) ctx.globalAlpha = .45;
  ctx.scale(NM.face, 1);
  ctx.fillStyle = "#2b3a55"; ctx.fillRect(-NM.w / 2, -NM.h / 2 + 10, NM.w, NM.h - 10); // jacket
  ctx.fillStyle = "#5a3b28"; ctx.fillRect(-NM.w / 2 + 3, -NM.h / 2 - 2, NM.w - 6, 12); // head
  ctx.fillStyle = "#14100c"; ctx.fillRect(-NM.w / 2 + 1, -NM.h / 2 - 6, NM.w - 2, 6); // dreads
  if (NM.jabAnim > 0) { ctx.fillStyle = "#5a3b28"; ctx.fillRect(NM.w / 2 - 2, -4, 16, 6); } // jab arm
  ctx.restore();
  if (NM.block) { ctx.strokeStyle = "#7ec8ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cxp, cyp, 24, -1.2, 1.2); ctx.stroke(); }
  // HUD
  ctx.fillStyle = "#0009"; ctx.fillRect(10, 10, 240, 62);
  ctx.fillStyle = "#333"; ctx.fillRect(18, 18, 160, 10);
  ctx.fillStyle = NM.hp > 35 ? "#7ee787" : "#ff6b81"; ctx.fillRect(18, 18, 160 * Math.max(0, NM.hp) / 100, 10);
  ctx.fillStyle = "#fff"; ctx.font = "12px monospace"; ctx.textAlign = "left";
  ctx.fillText(`NIGHT ${NM.stage}/3 · 💰$${NM.cash} · 💀${NM.kills}`, 18, 42);
  if (NM.combo > 1) { ctx.fillStyle = NM.perfectT > now ? "#ffd24a" : "#9fb7d9"; ctx.fillText(`COMBO x${NM.combo}${NM.perfectT > now ? " ⚡PERFECT" : ""}`, 18, 62); }
  if (NM.msgT > now) {
    ctx.fillStyle = "#000a"; ctx.fillRect(W / 2 - 240, 84, 480, 34);
    ctx.fillStyle = "#ffd24a"; ctx.textAlign = "center"; ctx.font = "14px monospace";
    ctx.fillText(NM.msg, W / 2, 106);
  }
  ctx.textAlign = "center";
}

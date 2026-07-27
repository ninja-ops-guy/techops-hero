/* ============================================================
   TECHOPS HERO v5.5 — "Rhythm of the Week" (v55_hooks.js)
   Loads AFTER v54_hooks.js. Adds:
   • Week cycle: Mon–Fri names in the HUD, Monday ticket floods,
     Friday 4:45 PM emergencies
   • Daily weather: sunny / rain / storm / heatwave — visuals + effects
   • Full mobile support: night-mode touch controls (move, jump,
     dash, block, jab), small-screen polish for phone UI
   ============================================================ */
"use strict";

// ---------- week & weather ----------
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekday = () => WEEKDAYS[(S.day - 1) % 5];
const WEATHERS = [
  { id: "sunny", icon: "☀️", name: "Sunny", chance: .35, note: "+5% production — the plant hums along" },
  { id: "rain", icon: "🌧️", name: "Rain", chance: .3, note: "networking tickets pay +$10 (moisture finds every splice)" },
  { id: "storm", icon: "⛈️", name: "Thunderstorm", chance: .2, note: "+5 stress, incidents more likely — power blinks all day" },
  { id: "heat", icon: "🥵", name: "Heatwave", chance: .15, note: "terminal drills pay +$2 (everyone hides in the server-room AC)" },
];
function pickWeather() {
  const r = Math.random(); let acc = 0;
  for (const w of WEATHERS) { acc += w.chance; if (r < acc) return w; }
  return WEATHERS[0];
}

const __origSetupDayV55 = setupDay;
setupDay = function () {
  __origSetupDayV55();
  const s = S; if (!s || !s.map) return;
  const w = pickWeather();
  s.weather = w.id;
  s.meta.fridayEmergency = false;
  // weather start-of-day effects
  if (w.id === "storm") { addStress(5); s.meta.treeBoost = true; }
  setTimeout(() => toast(`${w.icon} <b>${weekday()}</b> — ${w.name}. ${w.note}.`, 3600), 5200);
  // Monday flood: two extra walk-ins
  if (weekday() === "Monday") {
    for (let i = 0; i < 2; i++) {
      const type = pick(TICKET_TYPES.filter(t => t.id !== "hw_replace"));
      const dept = pick(DEPTS);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
      const npc = { id: 850 + i, name: pick(NPC_NAMES), dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
        done: false, interviewed: false, diagnosed: false, correctDiag: false, critical: false, pv: R(0, PAL_NPCS.length - 1) };
      s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
    }
    setTimeout(() => toast("📅 <b>Monday flood</b> — two extra walk-ins. Weekend updates strike again.", 4200), 6400);
  }
  if (weekday() === "Friday") setTimeout(() => toast("📅 Friday. Nobody deploys today. <b>Nobody.</b> (Watch the clock at 16:45…)", 4200), 6400);
};

// HUD day label: DAY 3 · WED 🌧️
const __origUpdateHUDV55 = updateHUD;
updateHUD = function () {
  __origUpdateHUDV55.apply(this, arguments);
  const s = S; if (!s) return;
  const w = WEATHERS.find(x => x.id === s.weather) || WEATHERS[0];
  $("hud-day").textContent = `DAY ${s.day} · ${weekday().slice(0, 3).toUpperCase()} ${w.icon}`;
};

// Friday 4:45 PM emergency — one critical, always
const __origStepV55 = step;
step = function (dt) {
  __origStepV55(dt);
  const s = S;
  if (!s || s.nightMode || s.meta.fridayEmergency || weekday() !== "Friday" || s.clock < 16 * 60 + 45) return;
  s.meta.fridayEmergency = true;
  const type = pick(TICKET_TYPES.filter(t => t.id !== "hw_replace"));
  const dept = pick(DEPTS);
  const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
  const npc = { id: 860, name: pick(NPC_NAMES), dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
    done: false, interviewed: false, diagnosed: false, correctDiag: false, critical: true, pv: R(0, PAL_NPCS.length - 1) };
  if (typeof INCIDENT_NAMES !== "undefined") npc.codename = pick(INCIDENT_NAMES);
  s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
  sevBanner("FRIDAY 16:45", (npc.codename || type.label).toUpperCase());
  toast(`🚨 <b>Friday 4:45 PM emergency</b> — ${type.label} in ${dept}. Of course. Of COURSE.`);
};

// rain: networking closes pay +$10 · heat: drill payouts handled in quiz wrap below
const __origResolveTicketV55 = resolveTicket;
resolveTicket = function (n) {
  __origResolveTicketV55(n);
  const s = S; if (!s || !n || !n.type || !n.done) return;
  if (s.weather === "rain" && n.type.stat === "networking") {
    s.budget += 10;
    setTimeout(() => toast("🌧️ Moisture-splice surcharge. (+$10)"), 4300);
  }
};
// heatwave: terminal drills pay +$2 (wrap the quiz payout by bumping budget at setup)
const __origRunQuizV55 = (typeof runQuiz === "function") ? runQuiz : null;
if (__origRunQuizV55) {
  runQuiz = function (title, intro, qs) {
    if (S && S.weather === "heat") { S.budget += 2; toast("🥵 AC appreciation bonus (+$2)."); }
    __origRunQuizV55(title, intro, qs);
  };
}
// storm: incident trees more likely (nudge the org_hooks roll by re-rolling once)
// (implemented as: if no tree spawned on a storm day, one extra 20% chance)
const __origSetupDayV55b = setupDay;
setupDay = function () {
  __origSetupDayV55b();
  const s = S; if (!s || !s.map) return;
  if (s.weather === "storm" && !s.meta.tree && s.day >= 2 && Math.random() < .2 && typeof INCIDENT_TREES !== "undefined") {
    const tree = pick(INCIDENT_TREES);
    let spawned = 0;
    for (let i = 0; i < 3; i++) {
      const type = TICKET_TYPES.find(t => t.id === tree.leaves[i % tree.leaves.length]);
      if (!type) continue;
      const dept = pick(DEPTS);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
      s.npcs.push({ id: 870 + i, name: pick(NPC_NAMES), dept, type, x: pos.x, y: pos.y, face: "🧑‍💼",
        done: false, interviewed: false, diagnosed: false, correctDiag: false, critical: false, pv: R(0, PAL_NPCS.length - 1), treeRoot: tree.root });
      s.tickets.push(s.npcs[s.npcs.length - 1]); s.ticketsTotal++;
      spawned++;
    }
    if (spawned) { s.meta.tree = { root: tree.root, cracked: false }; sevBanner("ANOMALY DETECTED", tree.root.toUpperCase()); }
  }
};

// ---------- rain visuals ----------
const __origDrawV55 = draw;
draw = function () {
  __origDrawV55.apply(this, arguments);
  const s = S;
  if (!s || s.nightMode || !s.weather || (s.weather !== "rain" && s.weather !== "storm")) return;
  const tm = performance.now();
  const heavy = s.weather === "storm";
  ctx.save();
  ctx.strokeStyle = heavy ? "rgba(140,170,255,.30)" : "rgba(140,170,255,.18)";
  ctx.lineWidth = 1;
  const n = heavy ? 60 : 30;
  for (let i = 0; i < n; i++) {
    const x = ((i * 197 + tm * (heavy ? .9 : .5)) % (cv.width + 40)) - 20;
    const y = ((i * 89 + tm * (heavy ? 1.4 : .8)) % (cv.height + 30)) - 15;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 11); ctx.stroke();
  }
  if (heavy && Math.floor(tm / 4000) !== Math.floor((tm - 16) / 4000) && Math.random() < .3) {
    ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fillRect(0, 0, cv.width, cv.height); // lightning blink
  }
  ctx.restore();
};

// ---------- mobile: night-mode touch controls ----------
(function injectNightTouchCss() {
  if (document.getElementById("v55-css")) return;
  const st = document.createElement("style");
  st.id = "v55-css";
  st.textContent = `
#v55-nmbtns { position:absolute; bottom:96px; right:10px; z-index:55; display:none; flex-direction:column; gap:8px; align-items:flex-end; }
#v55-nmbtns.on { display:flex; }
.v55-nbtn { width:56px; height:44px; border-radius:10px; border:2px solid #ffb84d; background:linear-gradient(160deg,#2a1e10,#161008); color:#ffd76a; font:700 11px monospace; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none; }
.v55-nbtn.held { background:#4a3418; transform:scale(.94); }
@media (max-width: 640px) {
  .v54-chat { width:180px; font-size:10px; }
  #v54-phone { top:96px; }
  #v53-banner { font-size:9px; padding:8px 10px; width:80%; }
}`;
  document.head.appendChild(st);
  const wrap = document.getElementById("game-wrap");
  if (!wrap) return;
  const box = document.createElement("div");
  box.id = "v55-nmbtns";
  const mk = (label, key) => {
    const b = document.createElement("div");
    b.className = "v55-nbtn"; b.textContent = label;
    const press = e => { e.preventDefault(); keys[key] = true; b.classList.add("held"); };
    const release = e => { e.preventDefault(); keys[key] = false; b.classList.remove("held"); };
    b.addEventListener("touchstart", press, { passive: false });
    b.addEventListener("touchend", release, { passive: false });
    b.addEventListener("touchcancel", release, { passive: false });
    b.addEventListener("mousedown", press);
    b.addEventListener("mouseup", release);
    box.appendChild(b);
    return b;
  };
  mk("⚡ DASH", "shift");
  mk("🛡️ BLOCK", "k");
  wrap.appendChild(box);
})();
// the dpad drives a virtual joystick (joy.x/joy.y), but night mode reads `keys` —
// bridge joystick → keys while night mode runs
const __origStepNMV55 = (typeof stepNM === "function") ? stepNM : null;
if (__origStepNMV55) {
  stepNM = function (dt) {
    const hadA = keys.a, hadD = keys.d, hadW = keys.w;
    if (typeof joy !== "undefined") {
      if (joy.x < -.3) keys.a = true;
      if (joy.x > .3) keys.d = true;
      if (joy.y < -.4) keys.w = true;
    }
    __origStepNMV55(dt);
    keys.a = hadA; keys.d = hadD; keys.w = hadW;
  };
}
// show/hide the night buttons + relabel Ⓐ as JAB
const __origDrawV55b = draw;
draw = function () {
  __origDrawV55b.apply(this, arguments);
  const s = S; if (!s) return;
  const box = document.getElementById("v55-nmbtns");
  const tb = document.getElementById("tb-interact");
  const night = !!s.nightMode;
  if (box) box.classList.toggle("on", night);
  if (tb && tb.dataset.v55 !== String(night)) { tb.dataset.v55 = String(night); tb.textContent = night ? "👊" : "A"; }
};

console.log("%c[TechOps Hero] v5.5 Rhythm of the Week loaded — week cycles, weather, mobile night controls.", "color:#60a5fa");

// v7.8 "Feel & Story" — certification polish pass, phase 3. Combat feel
// finishers, the first-ticket stinger, and environmental storytelling states
// (Felicia's desk tells the arc with zero dialogue). No new mechanics.
(function () {
  const animsOn = () => !window.V67SET || V67SET.anims !== false;

  // ---------- new synthesized voices (extend the global sfx kit) ----------
  const V78_NOTES = {
    stinger: [[150, 0, .05, "sine"], [72, .04, .14, "sine"], [220, .02, .03, "triangle"]], // ticket slam
    heartbeat: [[56, 0, .09, "sine"], [50, .17, .1, "sine"]],
    flourish: [[880, 0, .08, "triangle"], [1108, .08, .08, "triangle"], [1318, .16, .16, "triangle"]],
  };
  const __origSfx78 = sfx;
  sfx = function (kind) {
    if (!V78_NOTES[kind]) return __origSfx78.apply(this, arguments);
    if (typeof sfxMuted !== "undefined" && sfxMuted) return;
    try {
      const vol = (window.V67SET && V67SET.volSfx !== undefined) ? V67SET.volSfx : 1;
      if (vol <= 0) return;
      window.AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const t0 = AC.currentTime;
      for (const [f, d, dur, type] of V78_NOTES[kind]) {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(.07 * vol, t0 + d);
        g.gain.exponentialRampToValueAtTime(.001, t0 + d + dur);
        o.connect(g).connect(AC.destination);
        o.start(t0 + d); o.stop(t0 + d + dur);
      }
    } catch (e) { }
  };

  // ---------- P0-5: first-ticket impact stinger ----------
  let lastOpen = null;
  function ticketWatch(s) {
    if (!s || !s.tickets) return;
    const open = s.tickets.filter(t => !t.done).length;
    if (lastOpen !== null && open > lastOpen) {
      sfx("stinger");
      window.v78.stingers++;
      if (animsOn()) {
        const f = document.createElement("div");
        f.className = "v78-sting"; document.body.appendChild(f);
        setTimeout(() => f.remove(), 260);
      }
    }
    lastOpen = open;
  }

  // ---------- combat feel ----------
  const retrigger = (el, cls) => { if (!el || !animsOn()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  // battle entry: zoom + desaturate pulse
  const battleEl = document.getElementById("battle");
  if (battleEl) {
    let wasHidden = battleEl.classList.contains("hidden");
    new MutationObserver(() => {
      const hid = battleEl.classList.contains("hidden");
      if (hid === wasHidden) return; // ignore our own v78-enter class churn
      wasHidden = hid;
      if (!hid) { retrigger(battleEl, "v78-enter"); window.v78.entries++; }
    }).observe(battleEl, { attributes: true, attributeFilter: ["class"] });
  }
  // follow-through punch when the enemy takes damage
  const ehp = document.getElementById("enemy-hp");
  if (ehp) {
    let last = ehp.style.width || "100%";
    new MutationObserver(() => {
      const w = ehp.style.width, a = parseFloat(last), b = parseFloat(w); last = w;
      if (!isNaN(a) && !isNaN(b) && b < a) retrigger(document.getElementById("battle-scene"), "v78-punch");
    }).observe(ehp, { attributes: true, attributeFilter: ["style"] });
  }
  // perfect-investigation flourish
  const blog = document.getElementById("battle-log");
  if (blog) {
    new MutationObserver(() => {
      const t = blog.textContent || "";
      if (window.v78._lastBlog === t) return; window.v78._lastBlog = t;
      if (/★★★★★|PERFECT/i.test(t)) {
        sfx("flourish"); window.v78.flourishes++;
        const ring = document.createElement("div");
        ring.className = "v78-ring";
        const host = document.getElementById("battle-scene");
        if (host && animsOn()) { host.appendChild(ring); setTimeout(() => ring.remove(), 900); }
      }
    }).observe(blog, { childList: true, characterData: true, subtree: true });
  }
  // low-HP heartbeat, volume ∝ missing HP
  setInterval(() => {
    try {
      const bEl = document.getElementById("battle");
      if (!bEl || bEl.classList.contains("hidden") || !S) return;
      if (S.hp > 0 && S.hp <= S.maxHp * .3) { sfx("heartbeat"); window.v78.heartbeats++; }
    } catch (e) { }
  }, 950);

  // ---------- environmental storytelling: Felicia's desk ----------
  let deskSpot = null, deskDay = -1;
  function desk() {
    const s = S;
    if (!s || !s.map) return null;
    if (deskDay !== s.day) {
      deskDay = s.day; deskSpot = null;
      try { deskSpot = spotInBiome(s.map, BIOME_OF_DEPT.Marketing); } catch (e) { }
    }
    return deskSpot;
  }
  function deskMode() {
    const s = S; if (!s) return null;
    let a = null; try { a = window.v73.arc(); } catch (e) { }
    if (s.day >= 11 && a && a.choice) return a.choice === "A" ? "empty" : "mug";
    if (s.day >= 5 && s.day <= 9) return "case";
    return null;
  }
  function drawDesk() {
    const s = S, m = deskMode(), p = desk();
    if (!s || !m || !p || s.room || s.nightMode) return;
    const ts = cv.height / 14, sc = ts / TILE;
    const X = (p.x * TILE - camX) * sc, Y = (p.y * TILE - camY) * sc, u = sc; // u = 1px in world units
    ctx.save();
    if (m === "case") {
      // her violin case, leaning — dark shell, gold latch
      ctx.fillStyle = "#1c1610"; ctx.fillRect(X + 4 * u, Y + 6 * u, 24 * u, 9 * u);
      ctx.fillStyle = "#2c2318"; ctx.fillRect(X + 4 * u, Y + 6 * u, 24 * u, 3 * u);
      ctx.fillStyle = "#c9a24a"; ctx.fillRect(X + 14 * u, Y + 9 * u, 4 * u, 2 * u);
    } else if (m === "empty") {
      // Ending A: the desk is cleaned out — bare outline and a banker's box
      ctx.strokeStyle = "rgba(120,128,150,.7)"; ctx.lineWidth = Math.max(1, u);
      ctx.strokeRect(X + 2 * u, Y + 2 * u, 28 * u, 28 * u);
      ctx.fillStyle = "#7a6a4f"; ctx.fillRect(X + 18 * u, Y + 18 * u, 11 * u, 9 * u);
      ctx.fillStyle = "#5d5240"; ctx.fillRect(X + 18 * u, Y + 18 * u, 11 * u, 3 * u);
    } else if (m === "mug") {
      // B/TRUE: a second mug lives here now — it says BACKUP
      ctx.fillStyle = "#e8ecf5"; ctx.fillRect(X + 12 * u, Y + 10 * u, 9 * u, 11 * u);
      ctx.strokeStyle = "#e8ecf5"; ctx.lineWidth = Math.max(1, u);
      ctx.strokeRect(X + 21 * u, Y + 12 * u, 4 * u, 5 * u);
      ctx.fillStyle = "#232c46"; ctx.font = `${Math.max(5, 5 * u)}px monospace`;
      ctx.fillText("B", X + 14.5 * u, Y + 18 * u);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(X + 13 * u, Y + 6 * u, 2 * u, 3 * u); // steam
      ctx.fillRect(X + 17 * u, Y + 5 * u, 2 * u, 4 * u);
    }
    ctx.restore();
  }

  // ---------- wraps ----------
  const __origHUD78 = updateHUD;
  updateHUD = function () {
    const r = __origHUD78.apply(this, arguments);
    try { ticketWatch(S); } catch (e) { }
    return r;
  };
  const __origDraw78 = draw;
  draw = function () {
    const r = __origDraw78.apply(this, arguments);
    try { if (animsOn()) drawDesk(); } catch (e) { }
    return r;
  };

  const st = document.createElement("style");
  st.textContent = `
.v78-sting{position:fixed;inset:0;pointer-events:none;z-index:950;animation:v78-sting .26s ease-out forwards;
 box-shadow:inset 0 0 80px 20px #ffd24a55}
@keyframes v78-sting{from{opacity:1}to{opacity:0}}
#battle.v78-enter #battle-scene{animation:v78-enter .3s ease-out}
@keyframes v78-enter{0%{transform:scale(1);filter:saturate(.6)}45%{transform:scale(1.05)}100%{transform:scale(1);filter:saturate(1)}}
#battle-scene.v78-punch{animation:v78-punch .16s ease-out}
@keyframes v78-punch{0%{transform:scale(1)}40%{transform:scale(1.025)}100%{transform:scale(1)}}
.v78-ring{position:absolute;left:50%;top:38%;width:20px;height:20px;border:3px solid #ffd24a;border-radius:50%;
 transform:translate(-50%,-50%);pointer-events:none;animation:v78-ring .9s ease-out forwards;box-shadow:0 0 18px #ffd24a88}
@keyframes v78-ring{from{opacity:1;width:20px;height:20px}to{opacity:0;width:220px;height:220px}}`;
  document.head.appendChild(st);

  window.v78 = { deskMode, stingers: 0, entries: 0, flourishes: 0, heartbeats: 0, _lastBlog: "" };
  console.log("[v7.8] Feel & Story loaded");
})();

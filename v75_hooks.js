// v7.5 "Director's Cut" — quality-of-life pass:
//  1) Objectives tracker is minimizable (persists, shows open count when collapsed)
//  2) Scene Director — cutscenes fire at scripted moments under real conditions
//     (player free + time window + trigger), not on blind timers. The day-8 and
//     day-10 rooftop scenes now happen when you walk up to Felicia in the world
//     (with a graceful auto fallback so they can never be missed).
//  3) Animation pack — cinematic cutscene FX (letterbox ease-in, slide-change
//     flash, film grain, scanlines, vignette, rain / golden-hour weather layers),
//     world ambience (dust motes, day-10 storm rain), battle screen shake, and
//     idle bobbing + soft shadows for every NPC. All gated on the existing
//     "UI animations" setting.
(function () {
  const animsOn = () => !window.V67SET || V67SET.anims !== false;
  const arc = () => window.v73.arc();
  const cine = (slides, onDone) => window.v73.cine(slides, onDone);

  // ============================================================
  // 1) MINIMIZABLE OBJECTIVES TRACKER
  // ============================================================
  let qmin = false;
  try { qmin = localStorage.getItem("techops_qtrack_min") === "1"; } catch (e) { }
  function tracker() {
    const qt = $("quest-tracker");
    if (!qt) return;
    // innerHTML is rebuilt by updateHUD every tick — re-inject the header
    const open = S && S.tickets ? S.tickets.filter(t => !t.done).length : 0;
    qt.querySelectorAll(".v75-qh").forEach(x => x.remove()); // never stack duplicate headers
    const h = document.createElement("div");
    h.className = "v75-qh";
    h.innerHTML = `<span class="v75-qt">🎯 OBJECTIVES</span><span class="v75-qn">${open} open</span><button class="v75-qb" title="${qmin ? "Expand" : "Minimize"}">${qmin ? "+" : "–"}</button>`;
    qt.prepend(h);
    qt.classList.toggle("v75-min", qmin);
  }
  // updateHUD rebuilds the tracker every tick, so a per-button onclick dies
  // between mousedown and mouseup — delegate on the persistent parent instead
  const qtEl = document.getElementById("quest-tracker");
  if (qtEl) {
    qtEl.addEventListener("pointerdown", (e) => {
      if (!e.target.closest || !e.target.closest(".v75-qb")) return;
      e.stopPropagation(); e.preventDefault();
      qmin = !qmin;
      try { localStorage.setItem("techops_qtrack_min", qmin ? "1" : "0"); } catch (err) { }
      tracker();
    });
  }

  // ============================================================
  // 2) SCENE DIRECTOR
  // ============================================================
  const beats = []; // {id, when(s,a), fire(s,a), npc}
  function freeNow(s) {
    return s && !s.inDialog && !s.inBattle && !s.room && !document.getElementById("v73-cine");
  }
  function reg(id, when, fire) {
    if (beats.some(b => b.id === id)) return;
    beats.push({ id, when, fire, npc: null });
  }
  function directorTick(s, a) {
    if (s.moving) a._v75moved = true;
    for (const b of beats.slice()) {
      let due = false;
      try { due = b.when(s, a); } catch (e) { }
      if (!due) continue;
      if (b.npc) pinNpc(b.npc); // scripted NPCs hold their mark while waiting
      if (!freeNow(s)) continue; // the player is busy — the scene waits its cue
      beats.splice(beats.indexOf(b), 1);
      try { b.fire(s, a); } catch (e) { console.warn("[v7.5] beat failed:", b.id, e); }
      break; // one beat per tick
    }
  }

  // ---- scripted Felicia NPC (day 8 rooftop invite / day 10 finale) ----
  function spawnFelicia(a, dept, sceneKey) {
    const s = S;
    let n = s.npcs.find(x => x._felScene);
    if (n) { n._felScene = sceneKey; return n; }
    let pos = null;
    try { pos = spotInBiome(s.map, BIOME_OF_DEPT[dept] || BIOME_OF_DEPT.Marketing); } catch (e) { }
    if (!pos) pos = { x: Math.max(1, Math.round(s.px) + 2), y: Math.max(1, Math.round(s.py)) };
    n = {
      id: 7500 + s.day, name: "Felicia", dept: "Marketing", x: pos.x, y: pos.y, face: "🎻",
      ambient: true, pv: 1, _felScene: sceneKey,
    };
    n._pin = { x: pos.x, y: pos.y };
    s.npcs.push(n);
    return n;
  }
  function pinNpc(n) { if (n._pin && (n.x !== n._pin.x || n.y !== n._pin.y)) { n.x = n._pin.x; n.y = n._pin.y; } }
  function removeFelicia() {
    const i = S.npcs.findIndex(x => x._felScene);
    if (i >= 0) S.npcs.splice(i, 1);
  }

  // talking to her runs the scripted scene instead of ambient chatter
  const __origAmbientTalk75 = ambientTalk;
  ambientTalk = function (n) {
    if (n && n._felScene) {
      const key = n._felScene; n._felScene = null; removeFelicia();
      if (key === "d8") d8Scene();
      else if (key === "d10") window.v73.finale();
      return;
    }
    return __origAmbientTalk75.apply(this, arguments);
  };

  // ---- replicated story beats (v7.3 content, director-scheduled) ----
  function d5Scene() {
    cine([
      { img: 1, cap: "DAY 5 — MONDAY. Three printer outages, VPN down again... who keeps unplugging the label printer?!", zoom: "in" },
      { img: 1, cap: "“You going to the flight demonstration this afternoon?” — “Flight demonstration?”", zoom: "out", pan: 1 },
      { img: 0, cap: "LIVE — “Violinist Plays On Top of Flying Aircraft.” 15.8 million views.", zoom: "in" },
      { img: 0, cap: "...No way.", zoom: "in", pan: -1 },
      { img: 1, cap: "Felicia Cruz. The Violinist. Everyone knows her... except me.", zoom: "out" },
      { title: true, cap: "That case... there's more to it.<br><br><b>MISSION COMPLETE</b><br>LORE UNLOCKED — <b>FELICIA</b>: world-famous aerial violinist. Somehow knows more about IT than she should.<br><br><small>NEXT OBJECTIVE: investigate unusual access logs and Engineering data requests.</small>" },
    ], () => toast("📖 LORE UNLOCKED — FELICIA, THE VIOLINIST"));
    try { window.unlockGallery && unlockGallery("d5", "Day 5 — The Woman on the Wing"); } catch (e) { }
  }
  function d6Scene() {
    dlg("Nick — IT", "Did you SEE the stream?! 15.8 million! She's more famous than the CEO. Marketing's walking around like they won the championship.", [
      { t: "“Shouldn't she be heading back to Marketing?”", f: () => { closeDlg(); dlg("Mike — thought", "Shouldn't she be heading back to Marketing? ...So why was her badge near the Engineering network door at 19:42?", [{ t: "Hm.", f: closeDlg }]); } },
      { t: "Back to the queue.", f: closeDlg },
    ]);
  }
  function d7Scene() {
    cine([
      { img: 2, cap: "DAY 7. Badge 41782 — FELICIA — ENG-NET: GRANTED. HANGAR ACCESS: GRANTED. ...Deleted entries recovered.", zoom: "in" },
      { img: 2, cap: "Why is Marketing accessing Engineering so often? Something's not adding up.", zoom: "out", pan: 1 },
      { img: 2, cap: "CAM 07 — ENG HALL, 18:21. She knows exactly where she's going.", zoom: "in", pan: -1 },
    ], () => window.v73.spawnCJ(window.v73.CJ[0]));
  }
  function d8Scene() {
    cine([
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

  // register the day's beats — v7.3's own timers are pre-suppressed below
  function registerDayBeats(s, a) {
    const d = s.day;
    if (d === 5 && a.seen.d5 && !a._v75d5) {
      a._v75d5 = true;
      reg("d5", (s2, a2) => a2._v75moved, () => d5Scene()); // rolls as you take your first steps
    }
    if (d === 6 && a.seen.d6 && !a._v75d6) {
      a._v75d6 = true;
      reg("d6", () => true, () => d6Scene());
    }
    if (d === 7 && a.seen.d7 && !a._v75d7) {
      a._v75d7 = true;
      reg("d7", (s2) => {
        try { const b = biomeAt(s2.px, s2.py); if (b && /eng/i.test(b.id || "")) return true; } catch (e) { }
        return s2.clock >= 12 * 60; // fallback: midday
      }, () => d7Scene());
    }
  }

  // ---- take over scheduling (outermost wrap) ----
  const __origSetupDay75 = setupDay;
  setupDay = function () {
    const s = S, a = arc(), d = s.day;
    // pre-mark v7.3's blind-timer beats so the Director owns them
    if (d >= 5 && d <= 7 && !a.seen["d" + d]) a.seen["d" + d] = true;
    const r = __origSetupDay75.apply(this, arguments);
    registerDayBeats(s, a);
    return r;
  };

  const __origHUD75 = updateHUD;
  updateHUD = function () {
    const s = S, a = arc();
    // pre-mark v7.3's clock-driven auto-fires; the Director owns them now
    if (s.day === 8 && !a.seen.d8roof) {
      a.seen.d8roof = true;
      reg("d8", (s2) => s2.clock >= 16 * 60 && s2.clock < 18 * 60,
        (s2) => { spawnFelicia(a, "Marketing", "d8"); toast("🎻 Someone's on the roof again. The door's propped open."); });
      // safety net: if you never walk up, the scene comes to you before shift end
      reg("d8auto", (s2) => s2.clock >= 18 * 60, () => { removeFelicia(); d8Scene(); });
    }
    if (s.day === 10 && !a.seen.d10fin) {
      a.seen.d10fin = true;
      reg("d10", (s2) => s2.clock >= 15 * 60 && s2.clock < 17.5 * 60 && !a.choice,
        (s2) => { spawnFelicia(a, "Engineering", "d10"); toast("🎻 Felicia is waiting by the Engineering wing. She looks like she's made up her mind."); });
      reg("d10auto", (s2) => s2.clock >= 17.5 * 60 && !a.choice, () => { removeFelicia(); window.v73.finale(); });
    }
    const r = __origHUD75.apply(this, arguments);
    try { directorTick(s, a); } catch (e) { }
    try { tracker(); } catch (e) { }
    return r;
  };

  // ============================================================
  // 3) ANIMATION PACK
  // ============================================================
  const st = document.createElement("style");
  st.textContent = `
/* tracker minimize */
#quest-tracker .v75-qh{pointer-events:auto; /* tracker is click-through; the header must be clickable */
 display:flex;align-items:center;gap:6px;padding:2px 0 6px;border-bottom:1px solid #46536e55;margin-bottom:6px;
 font-size:8px;color:#8fa0c8;letter-spacing:1px}
#quest-tracker .v75-qh .v75-qn{margin-left:auto;color:#ffd24a}
#quest-tracker .v75-qh .v75-qb{background:#232c46;border:1px solid #46536e;color:#e8ecf5;border-radius:4px;
 font-family:inherit;font-size:9px;line-height:1;padding:2px 7px;cursor:pointer}
#quest-tracker .v75-qh .v75-qb:hover{filter:brightness(1.25)}
#quest-tracker.v75-min>*:not(.v75-qh){display:none}
#quest-tracker.v75-min .v75-qh{border-bottom:none;margin-bottom:0;padding-bottom:2px}
/* cutscene FX frame */
#v73-cine .v73-bar{transition:height .6s cubic-bezier(.2,.8,.2,1)}
#v73-cine.v75-cine-on .v73-bar{height:10vh}
#v73-cine .v73-capwrap{transition:transform .35s ease,opacity .35s ease}
#v73-cine .v75-fx{position:absolute;inset:0;pointer-events:none;z-index:1}
#v73-cine .v75-fx.grain{opacity:.5;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
 animation:v75-grain .45s steps(3) infinite}
@keyframes v75-grain{0%{transform:translate(0,0)}33%{transform:translate(-8px,5px)}66%{transform:translate(6px,-7px)}100%{transform:translate(0,0)}}
#v73-cine .v75-fx.scan{background:repeating-linear-gradient(0deg,#0000 0 2px,#00000022 2px 3px);opacity:.6}
#v73-cine .v75-fx.vig{background:radial-gradient(ellipse at center,#0000 55%,#000a 100%)}
#v73-cine .v75-wx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
#v73-cine .v75-flash{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:2}
#v73-cine .v75-flash.go{animation:v75-sflash .38s ease-out}
@keyframes v75-sflash{0%{opacity:.85}100%{opacity:0}}`;
  document.head.appendChild(st);

  // ---- cutscene enhancement (any cine: story beats and gallery replays) ----
  function moodOf(txt) {
    if (/RAIN|storm/i.test(txt)) return "rain";
    if (/sun goes down|roof|16:00|golden/i.test(txt)) return "gold";
    return "";
  }
  function enhanceCine(ov) {
    if (ov.querySelector(".v75-fx")) return;
    requestAnimationFrame(() => ov.classList.add("v75-cine-on")); // letterbox ease-in
    const mk = (cls) => { const d = document.createElement("div"); d.className = "v75-fx " + cls; ov.insertBefore(d, ov.querySelector(".v73-capwrap")); return d; };
    if (animsOn()) { mk("vig"); mk("scan"); mk("grain"); }
    const wx = document.createElement("canvas"); wx.className = "v75-wx";
    ov.insertBefore(wx, ov.querySelector(".v73-capwrap"));
    const flash = document.createElement("div"); flash.className = "v75-flash";
    ov.insertBefore(flash, ov.querySelector(".v73-capwrap"));
    const wc = wx.getContext("2d");
    let mood = "", parts = [], raf = 0, bolt = 0;
    function sizeWx() { wx.width = ov.clientWidth; wx.height = ov.clientHeight; }
    sizeWx();
    function seed() {
      parts = [];
      if (mood === "rain") for (let i = 0; i < 110; i++) parts.push({ x: Math.random() * wx.width, y: Math.random() * wx.height, v: 9 + Math.random() * 6, l: 12 + Math.random() * 10 });
      if (mood === "gold") for (let i = 0; i < 46; i++) parts.push({ x: Math.random() * wx.width, y: Math.random() * wx.height, r: .8 + Math.random() * 1.8, p: Math.random() * 6.28, s: .12 + Math.random() * .3 });
    }
    function paint() {
      if (!ov.isConnected) { cancelAnimationFrame(raf); return; }
      wc.clearRect(0, 0, wx.width, wx.height);
      if (animsOn() && mood === "rain") {
        wc.strokeStyle = "rgba(165,190,235,.5)"; wc.lineWidth = 1.2; wc.beginPath();
        for (const p of parts) {
          wc.moveTo(p.x, p.y); wc.lineTo(p.x - 2.5, p.y + p.l);
          p.y += p.v; p.x -= .8; if (p.y > wx.height) { p.y = -20; p.x = Math.random() * (wx.width + 40); }
        }
        wc.stroke();
        if (Math.random() < .006) bolt = 5; // distant lightning
        if (bolt > 0) { wc.fillStyle = `rgba(200,215,255,${bolt * .05})`; wc.fillRect(0, 0, wx.width, wx.height); bolt--; }
      } else if (animsOn() && mood === "gold") {
        for (const p of parts) {
          p.p += .02; p.y -= p.s; p.x += Math.sin(p.p) * .3;
          if (p.y < -4) { p.y = wx.height + 4; p.x = Math.random() * wx.width; }
          wc.fillStyle = `rgba(255,205,120,${.25 + Math.sin(p.p) * .18})`;
          wc.beginPath(); wc.arc(p.x, p.y, p.r, 0, 7); wc.fill();
        }
      }
      raf = requestAnimationFrame(paint);
    }
    // watch the caption: slide changes drive mood + transition flash
    const cap = ov.querySelector(".v73-cap");
    let lastTxt = null;
    new MutationObserver(() => {
      const t = cap.textContent || "";
      if (t === lastTxt) return;
      const newMood = moodOf(t);
      if (newMood !== mood) { mood = newMood; seed(); }
      if (lastTxt !== null && animsOn()) { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); }
      lastTxt = t;
    }).observe(cap, { childList: true, characterData: true, subtree: true });
    paint();
  }
  new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType === 1 && n.id === "v73-cine") { try { enhanceCine(n); } catch (e) { } }
    }
  }).observe(document.body, { childList: true });

  // ---- NPC idle bob + soft shadow (drawSpr is used for every NPC render) ----
  const __origDrawSpr75 = drawSpr;
  let bobCount = 0;
  drawSpr = function (rows, pal, tx, ty, flip) {
    if (rows === SPR_NPC && animsOn()) {
      const tm = performance.now(), ph = ((tx * 7 + ty * 13) % 628) / 100;
      const bob = Math.sin(tm / 520 + ph) * 1.3;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.beginPath(); ctx.ellipse(tx * TILE + TILE / 2, ty * TILE + TILE - 5, 9 - bob, 3, 0, 0, 7); ctx.fill();
      ctx.translate(0, bob);
      __origDrawSpr75.apply(this, arguments);
      ctx.restore();
      bobCount++;
      return;
    }
    return __origDrawSpr75.apply(this, arguments);
  };

  // ---- world ambience + battle shake ----
  let shake = 0, dust = null;
  function watchEnemyBar() {
    const el = $("enemy-hp");
    if (!el) return;
    let last = el.style.width || "100%";
    new MutationObserver(() => {
      const w = el.style.width, a = parseFloat(last), b = parseFloat(w);
      last = w;
      if (!isNaN(a) && !isNaN(b) && b < a) shake = 10;
    }).observe(el, { attributes: true, attributeFilter: ["style"] });
  }
  watchEnemyBar();
  const __origDraw75 = draw;
  draw = function () {
    if (shake > 0 && animsOn()) {
      ctx.save();
      ctx.translate((Math.random() - .5) * shake * .9, (Math.random() - .5) * shake * .9);
      const r = __origDraw75.apply(this, arguments);
      ctx.restore();
      shake--;
      return r;
    }
    const r = __origDraw75.apply(this, arguments);
    const s = S;
    if (!s || !s.map || s.room || !animsOn()) return r;
    // floating dust motes; storm rain once the arc hits day 10
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!dust) dust = Array.from({ length: 22 }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, p: Math.random() * 6.28 }));
    for (const d of dust) {
      d.p += .015; d.y -= .18; d.x += Math.sin(d.p) * .22;
      if (d.y < -3) { d.y = cv.height + 3; d.x = Math.random() * cv.width; }
      ctx.fillStyle = `rgba(220,228,255,${.05 + Math.sin(d.p) * .035})`;
      ctx.fillRect(d.x, d.y, 2, 2);
    }
    if (s.day >= 10) {
      ctx.strokeStyle = "rgba(150,175,220,.13)"; ctx.lineWidth = 1; ctx.beginPath();
      const t0 = performance.now() / 16;
      for (let i = 0; i < 40; i++) {
        const x = ((i * 97 + t0 * 7) % (cv.width + 60)) - 30, y = ((i * 173 + t0 * 22) % (cv.height + 40)) - 20;
        ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14);
      }
      ctx.stroke();
    }
    // scripted Felicia marker — a soft beacon so you can find your cue
    const fn = s.npcs && s.npcs.find(n => n._felScene);
    if (fn) {
      ctx.restore();
      ctx.save();
      const ts = cv.height / 14, sc = ts / TILE;
      ctx.scale(sc, sc); ctx.translate(-camX, -camY);
      const tm = performance.now(), pulse = 6 + Math.sin(tm / 300) * 2.5;
      ctx.strokeStyle = "rgba(255,210,74,.8)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(fn.x * TILE + TILE / 2, fn.y * TILE + TILE / 2, pulse + 8, 0, 7); ctx.stroke();
      ctx.font = "16px serif"; ctx.textAlign = "center";
      ctx.fillText("🎻", fn.x * TILE + TILE / 2, fn.y * TILE - 8 - Math.sin(tm / 400) * 2);
    }
    ctx.restore();
    return r;
  };

  window.v75 = { beats, reg, directorTick, spawnFelicia, d5Scene, d8Scene, tracker, get bobCount() { return bobCount; } };
  console.log("[v7.5] Director's Cut loaded");
})();

// v6.7 "Cinematic Combat": settings & accessibility, ambient audio zones, adaptive battle
// music, ability projectiles & combo finishers, boss cinematics, dynamic lighting,
// environmental life, NPC dialogue portraits, gallery mode, night parallax — plus
// graphical bug fixes (Felicia portrait leak, floating coffee mug, tracker readability).
(function () {
  const V67_VER = "6.7.0";

  // ================= settings & accessibility =================
  const DEF_SET = { shake: true, particles: 1, textSpeed: 1, volSfx: .8, volMusic: .8, colorblind: false };
  let SET = { ...DEF_SET };
  try { Object.assign(SET, JSON.parse(localStorage.getItem("techops_settings") || "{}")); } catch (e) { }
  window.V67SET = SET;
  function saveSet() {
    try { localStorage.setItem("techops_settings", JSON.stringify(SET)); } catch (e) { }
    applySet();
  }
  function applySet() {
    document.body.classList.toggle("v67-cb", !!SET.colorblind);
    if (typeof scWidget !== "undefined" && scWidget && scWidget.setVolume) {
      try { scWidget.setVolume(Math.round(SET.volMusic * 100)); } catch (e) { }
    }
  }
  function buildSettings() {
    if ($("v67-settings")) return;
    const d = document.createElement("div");
    d.id = "v67-settings"; d.className = "hidden";
    d.innerHTML = `
      <div class="v67-set-card">
        <div class="v67-set-h">⚙️ SETTINGS <button id="v67-set-x">✕</button></div>
        <label class="v67-row"><span>Screen shake</span><input type="checkbox" id="v67s-shake"></label>
        <label class="v67-row"><span>Particle density</span><input type="range" id="v67s-part" min="0" max="1" step="0.5"></label>
        <label class="v67-row"><span>Text speed</span><input type="range" id="v67s-text" min="0.5" max="99" step="48.5"></label>
        <label class="v67-row"><span>SFX volume</span><input type="range" id="v67s-sfx" min="0" max="1" step="0.1"></label>
        <label class="v67-row"><span>Music volume</span><input type="range" id="v67s-mus" min="0" max="1" step="0.1"></label>
        <label class="v67-row"><span>Colorblind-safe palette</span><input type="checkbox" id="v67s-cb"></label>
        <div class="v67-note">Accessibility settings save automatically.</div>
      </div>`;
    $("game-wrap").appendChild(d);
    $("v67-set-x").onclick = () => d.classList.add("hidden");
    const bind = (id, key, isCheck) => {
      const el = $(id);
      if (isCheck) el.checked = SET[key]; else el.value = SET[key];
      el.oninput = () => { SET[key] = isCheck ? el.checked : parseFloat(el.value); saveSet(); };
    };
    bind("v67s-shake", "shake", true); bind("v67s-part", "particles"); bind("v67s-text", "textSpeed");
    bind("v67s-sfx", "volSfx"); bind("v67s-mus", "volMusic"); bind("v67s-cb", "colorblind", true);
  }
  function openSettings() { buildSettings(); $("v67-settings").classList.remove("hidden"); }
  const gear = document.createElement("button");
  gear.id = "v67-gear"; gear.className = "hud-btn"; gear.textContent = "⚙️";
  gear.title = "Settings";
  gear.onclick = openSettings;
  const menuBtn = $("btn-menu");
  if (menuBtn) menuBtn.parentElement.insertBefore(gear, menuBtn);
  window.v67OpenSettings = openSettings;

  // ================= dialogue portraits (bug fix: Felicia leak) =================
  const _npcImg67 = new Image();
  if (typeof TO_NPCS !== "undefined") _npcImg67.src = TO_NPCS;
  const _portraitCache = {};
  function npcPortraitURL(idx) {
    if (_portraitCache[idx]) return _portraitCache[idx];
    if (!_npcImg67.complete || !_npcImg67.naturalWidth) return null;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    c.getContext("2d").drawImage(_npcImg67, idx * 128, 0, 128, 128, 0, 0, 128, 128);
    return (_portraitCache[idx] = c.toDataURL("image/png"));
  }
  function stripPortraits() {
    document.querySelectorAll("#dialogue .v64-portrait, #dialogue .v67-portrait").forEach(im => im.remove());
  }
  const __origDlg67 = dlg;
  dlg = function (name, text, options) {
    stripPortraits(); // the Felicia portrait must never leak into other conversations
    const r = __origDlg67(name, text, options);
    try {
      let url = null;
      if (/felicia/i.test(name)) return r; // felDlg injects her own portrait
      const n = S && S.npcs ? S.npcs.find(n => n.name === name) : null;
      if (n && typeof npcIdx === "function") url = npcPortraitURL(npcIdx(n));
      if (url) {
        const txt = $("dlg-text");
        const im = document.createElement("img");
        im.src = url; im.className = "v64-portrait v67-portrait"; im.alt = name;
        txt.parentElement.insertBefore(im, txt);
      }
    } catch (e) { }
    return r;
  };
  // closeDlg also strips portraits so nothing persists between conversations
  const __origClose67 = closeDlg;
  closeDlg = function () { stripPortraits(); return __origClose67(); };

  // ================= bug fix: coffee mug floats off its tile =================
  const __origDrawExtra67 = drawExtra;
  drawExtra = function (key, tx, ty, size = 26) {
    if (key === "mug" && typeof PLAYER_EXTRA !== "undefined" && PLAYER_EXTRA.frames.mug) {
      const [cx, cy] = PLAYER_EXTRA.frames.mug, C = PLAYER_EXTRA.cell;
      // draw centered ON the machine tile instead of the emote-bubble offset above it
      ctx.drawImage(extraImg, cx * C, cy * C, C, C, tx * TILE + (TILE - size) / 2, ty * TILE + (TILE - size) / 2, size, size);
      return;
    }
    return __origDrawExtra67(key, tx, ty, size);
  };

  // ================= ambient audio zones =================
  let _ambAC = null, _ambNodes = null, _ambZone = null, _ambTimer = null;
  function ambEnsure() {
    if (_ambAC) return true;
    try {
      _ambAC = new (window.AudioContext || window.webkitAudioContext)();
      if (_ambAC.state === "suspended") _ambAC.resume();
      const master = _ambAC.createGain(); master.gain.value = 0; master.connect(_ambAC.destination);
      const noiseBuf = _ambAC.createBuffer(1, _ambAC.sampleRate * 2, _ambAC.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < ch.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; ch[i] = last * 3.5; }
      const mk = (freq, type, g) => {
        const src = _ambAC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
        const f = _ambAC.createBiquadFilter(); f.type = type; f.frequency.value = freq;
        const gn = _ambAC.createGain(); gn.gain.value = g;
        src.connect(f).connect(gn).connect(master); src.start();
        return gn;
      };
      _ambNodes = {
        master,
        factory: mk(120, "lowpass", .5),   // low machine rumble
        server: mk(300, "bandpass", .35),  // fan hum
        office: mk(800, "highpass", .08),  // HVAC air
      };
      // periodic life: server beeps, factory clanks, office keyboard clacks
      _ambTimer = setInterval(() => {
        if (!_ambZone || sfxMuted) return;
        const t = _ambAC.currentTime;
        const blip = (f0, dur, type, g0) => {
          const o = _ambAC.createOscillator(), g = _ambAC.createGain();
          o.type = type; o.frequency.value = f0;
          g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
          o.connect(g).connect(_ambNodes.master); o.start(t); o.stop(t + dur);
        };
        if (_ambZone === "server" && Math.random() < .3) blip(1800 + Math.random() * 600, .06, "square", .012);
        if (_ambZone === "factory" && Math.random() < .25) blip(90 + Math.random() * 40, .18, "sawtooth", .05);
        if (_ambZone === "office" && Math.random() < .5) blip(2400 + Math.random() * 1200, .02, "square", .006);
      }, 700);
      return true;
    } catch (e) { return false; }
  }
  function zoneOf(x, y) {
    if (typeof SRV !== "undefined" && x >= SRV.x0 && x <= SRV.x1 && y >= SRV.y0 && y <= SRV.y1) return "server";
    if (typeof IT_ROOM !== "undefined" && x >= IT_ROOM.x0 && x <= IT_ROOM.x1 && y >= IT_ROOM.y0 && y <= IT_ROOM.y1) return "office";
    return "factory";
  }
  function ambTick() {
    if (typeof S === "undefined" || !S || S.nightMode || sfxMuted) { if (_ambNodes) _ambNodes.master.gain.value = 0; return; }
    if (!_ambAC && !ambEnsure()) return;
    const z = zoneOf(S.px ?? S.x, S.py ?? S.y);
    _ambZone = z;
    const v = SET.volSfx * .14;
    const t = _ambAC.currentTime;
    _ambNodes.master.gain.setTargetAtTime(v, t, .4);
    for (const k of ["factory", "server", "office"]) {
      const target = k === z ? 1 : .12;
      _ambNodes[k].gain.setTargetAtTime(target * (k === "factory" ? .5 : k === "server" ? .35 : .08), t, .5);
    }
  }
  setInterval(ambTick, 800);

  // ================= adaptive battle music =================
  const MUS = { ac: null, timer: null, step: 0, active: false };
  function musEnsure() {
    if (MUS.ac) return true;
    try { MUS.ac = new (window.AudioContext || window.webkitAudioContext)(); if (MUS.ac.state === "suspended") MUS.ac.resume(); return true; } catch (e) { return false; }
  }
  function musIntensity() {
    if (!B) return 0;
    let i = 0;
    if (S.hp <= S.maxHp * .4) i++;
    if (B.hp <= 30) i++;
    if (B.felicia || (B.t && (B.t.id === "shadow" || B.t.id === "apt"))) i++;
    return i;
  }
  function musStep() {
    if (!MUS.active || sfxMuted) return;
    const int_ = musIntensity();
    const t = MUS.ac.currentTime;
    const vol = SET.volMusic * .5;
    const note = (f0, dur, type, g0) => {
      const o = MUS.ac.createOscillator(), g = MUS.ac.createGain();
      o.type = type; o.frequency.value = f0;
      g.gain.setValueAtTime(g0 * vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(MUS.ac.destination); o.start(t); o.stop(t + dur);
    };
    const s16 = MUS.step % 16;
    const roots = [55, 55, 65.4, 49]; // A A C G — dark driving bass
    const root = roots[(MUS.step >> 4) % 4];
    if (s16 % 4 === 0) note(root, .22, "square", .09);
    if (s16 % 2 === 0) note(6000 + Math.random() * 2000, .02, "square", .008); // hats
    if (int_ >= 1) { // tension arp
      const arp = [220, 261.6, 329.6, 261.6];
      if (s16 % 2 === 1) note(arp[(s16 >> 1) % 4] * 2, .08, "triangle", .03);
    }
    if (int_ >= 2 && s16 % 4 === 2) note(root * 4, .12, "sawtooth", .035); // danger stabs
    MUS.step++;
  }
  function musStart() { if (!musEnsure()) return; if (MUS.active) return; MUS.active = true; MUS.step = 0; MUS.timer = setInterval(musStep, 125); }
  function musStop() { MUS.active = false; clearInterval(MUS.timer); }

  // ================= boss cinematics =================
  function cine(title, sub, ms = 2100) {
    let c = $("v67-cine");
    if (!c) {
      c = document.createElement("div"); c.id = "v67-cine";
      c.innerHTML = `<div class="v67-bar top"></div><div class="v67-bar bot"></div><div class="v67-card"><div class="v67-card-t"></div><div class="v67-card-s"></div></div>`;
      $("game-wrap").appendChild(c);
    }
    c.querySelector(".v67-card-t").textContent = title;
    c.querySelector(".v67-card-s").textContent = sub || "";
    c.classList.remove("hidden", "v67-cine-out");
    c.classList.add("v67-cine-in");
    const b = $("battle"); if (b) { b.classList.remove("v67-zoom"); void b.offsetWidth; b.classList.add("v67-zoom"); }
    clearTimeout(c._t);
    c._t = setTimeout(() => { c.classList.add("v67-cine-out"); setTimeout(() => c.classList.add("hidden"), 500); }, ms);
    c.onclick = () => { clearTimeout(c._t); c.classList.add("hidden"); };
  }
  window.v67Cine = cine;

  const __origSB67 = startBattle;
  startBattle = function (portal) {
    const r = __origSB67(portal);
    try {
      const n = portal && S.npcs ? S.npcs.find(n => n.id === portal.npc) : null;
      const isBoss = B && (B.felicia || (B.t && B.t.id === "shadow") || (n && (n.legacy || n.critical)));
      if (isBoss) {
        cine(B.felicia ? "APT-17 «MORNINGSTAR»" : `⚠ ${B.t.name}`, B.felicia ? "Three fronts. One pattern. End this." : "Major incident — hold the line");
        unlockGallery(B.felicia ? "felicia_fight" : "boss_" + B.t.id, B.felicia ? "🕶️" : "⚠️",
          B.felicia ? "The Confrontation" : `Boss: ${B.t.name}`,
          B.felicia ? "You laid out the pattern — badges, beacons, cameras — and Felicia Voss stopped pretending." : `The ${B.t.name} incident pushed Building 7 to the brink. You held the line.`);
      }
      musStart();
    } catch (e) { }
    return r;
  };

  // ================= ability projectiles & combo finishers =================
  const PROJ_STYLE = {
    ping: ["📡", "#4af"], powershell: ["💠", "#7fd4ff"], flushdns: ["🌀", "#4af"], patch: ["🩹", "#8f8"],
    firewall: ["🧱", "#fa4"], zerotrust: ["🛡️", "#c6f"], contain: ["🔒", "#c6f"], siem: ["📊", "#4af"],
    reimage: ["💿", "#bbb"], swap: ["🔧", "#fa4"], tracert: ["📈", "#4af"], coffee: ["☕", "#d9a"],
    reboot: ["🔄", "#8f8"], backup: ["💾", "#8f8"], default: ["⚡", "#ffd24a"],
  };
  function projectile(ab) {
    if (!SET.particles) return;
    const scene = $("battle-scene"); if (!scene) return;
    const [icon, color] = PROJ_STYLE[ab.id] || PROJ_STYLE.default;
    const p = document.createElement("div");
    p.className = "v67-proj"; p.textContent = icon;
    p.style.setProperty("--pc", color);
    scene.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
  function flavor(txt, cls) {
    const enemy = $("battle-enemy"); if (!enemy) return;
    const f = document.createElement("div");
    f.className = "v67-flavor " + (cls || "");
    f.textContent = txt;
    enemy.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }
  function comboInc() {
    B._combo67 = (B._combo67 || 0) + 1;
    if (B._combo67 >= 3) {
      flavor(`🔥 COMBO x${B._combo67}`, "combo");
      const b = $("battle"); if (b && SET.shake) { b.classList.remove("v67-finisher"); void b.offsetWidth; b.classList.add("v67-finisher"); }
      if (B._combo67 === 3) sfx("crit");
    }
  }
  const __origDoAb67 = doAbility;
  doAbility = function (a) {
    if (B && !B.over && a && a.dmg && a.dmg[1] > 0) {
      projectile(a);
      const hp0 = B.hp;
      const r = __origDoAb67(a);
      if (B.hp < hp0) comboInc();
      else B._combo67 = 0; // whiffed or backfired — combo drops
      return r;
    }
    return __origDoAb67(a);
  };

  const __origBlog67 = blog;
  blog = function (h) {
    __origBlog67(h);
    try {
      if (h.includes("CRITICAL HIT")) flavor("CRITICAL BREACH", "breach");
      if (h.includes("resists") || h.includes("RESISTED")) flavor("ACCESS DENIED", "denied");
      if (h.includes("BLIND FIX BACKFIRED")) flavor("PATCH FAILED", "denied");
    } catch (e) { }
  };
  const __origWin67 = winBattle;
  winBattle = function () {
    try { flavor("ROOT ACCESS", "breach"); } catch (e) { }
    musStop();
    return __origWin67();
  };
  const __origLose67 = loseBattle;
  loseBattle = function () { musStop(); return __origLose67(); };

  // combo badge display
  let _lastPHp67 = null;
  const __origRB67 = renderBattle;
  renderBattle = function () {
    __origRB67();
    if (!B || !S) return;
    _lastPHp67 = S.hp;
    // combo badge
    let badge = $("v67-combo");
    if ((B._combo67 || 0) >= 2 && !B.over) {
      if (!badge) { badge = document.createElement("div"); badge.id = "v67-combo"; $("battle-enemy").appendChild(badge); }
      badge.textContent = `🔥 x${B._combo67}`;
    } else if (badge) badge.remove();
  };

  // ================= gallery / replay mode =================
  const GALLERY_DEFS = [];
  function unlockGallery(id, icon, title, body) {
    if (!S || !S.meta) return;
    S.meta._gallery = S.meta._gallery || {};
    if (S.meta._gallery[id]) return;
    S.meta._gallery[id] = true;
    GALLERY_DEFS.push({ id, icon, title, body });
    toast(`🎬 Cutscene unlocked: ${title} (see GALLERY)`);
  }
  window.unlockGallery = unlockGallery;
  function openGallery() {
    buildGallery();
    $("v67-gallery").classList.remove("hidden");
  }
  function buildGallery() {
    let g = $("v67-gallery");
    if (!g) {
      g = document.createElement("div"); g.id = "v67-gallery"; g.className = "hidden";
      $("game-wrap").appendChild(g);
    }
    const owned = (S && S.meta && S.meta._gallery) || {};
    const items = GALLERY_DEFS.filter(d => owned[d.id]);
    g.innerHTML = `<div class="v67-set-card v67-gal-card">
      <div class="v67-set-h">🎬 CUTSCENE GALLERY <button id="v67-gal-x">✕</button></div>
      ${items.length ? "" : '<div class="v67-note">No cutscenes unlocked yet — bosses, incidents and story moments appear here.</div>'}
      ${items.map(d => `<button class="v67-gal-item" data-id="${d.id}">${d.icon} <b>${d.title}</b><br><small>▶ replay</small></button>`).join("")}
    </div>`;
    g.querySelector("#v67-gal-x").onclick = () => g.classList.add("hidden");
    g.querySelectorAll(".v67-gal-item").forEach(btn => {
      btn.onclick = () => {
        const d = GALLERY_DEFS.find(x => x.id === btn.dataset.id);
        g.classList.add("hidden");
        cine(d.title, "replay");
        setTimeout(() => dlg(d.title, d.body, [{ t: "End replay", f: closeDlg }]), 1200);
      };
    });
  }
  window.v67OpenGallery = openGallery;
  // gallery button next to settings
  const galBtn = document.createElement("button");
  galBtn.id = "v67-gal"; galBtn.className = "hud-btn"; galBtn.textContent = "🎬";
  galBtn.title = "Cutscene gallery";
  galBtn.onclick = openGallery;
  if (menuBtn) menuBtn.parentElement.insertBefore(galBtn, menuBtn);
  // seed default gallery moments
  const __origSetupDay67 = (typeof setupDay !== "undefined") ? setupDay : null;
  if (__origSetupDay67) {
    setupDay = function () {
      const first = !S.meta._gallery;
      const r = __origSetupDay67.apply(this, arguments);
      if (first) unlockGallery("shift_start", "🌅", "First Shift", "Day 1 at AeroTech Building 7. The queue was already full. Every ticket a dungeon, every day a run.");
      if (S.chaos && (S.chaos.id === "outage" || S.chaos.id === "drill")) unlockGallery("chaos_" + S.chaos.id, "🚨", S.chaos.name, S.chaos.desc + " — the day the building held its breath.");
      return r;
    };
  }

  // ================= environmental life =================
  const __origDraw67 = draw;
  let _sparkT = 0;
  draw = function () {
    __origDraw67.apply(this, arguments);
    const s = S; if (!s || !s.map || s.nightMode) return;
    const tm = performance.now();
    // dynamic lighting: outage flicker + storm lightning
    if (s.chaos && s.chaos.id === "outage") {
      const a = .22 + (Math.random() < .08 ? .35 : 0) + .05 * Math.sin(tm / 90);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(2,4,18,${Math.min(.6, a)})`;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }
    if (s.weather === "storm" && Math.random() < .004) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "rgba(220,230,255,.28)"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }
    // sparks at factory machinery
    if (tm - _sparkT > 900 && Math.random() < .7 && typeof v63PropSpots === "function") {
      _sparkT = tm;
      const spots = v63PropSpots(s).filter(([idx]) => idx >= 20 && idx < 40);
      if (spots.length) {
        const [idx, x, y] = pick(spots);
        s._sparks = s._sparks || [];
        for (let i = 0; i < 6; i++) s._sparks.push({ x: x + .5, y: y + .4, vx: (Math.random() - .5) * .06, vy: -Math.random() * .08, t: tm, life: 500 + Math.random() * 300 });
      }
    }
    if (s._sparks && s._sparks.length) {
      const ts = cv.height / 14, sc = ts / TILE;
      ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
      s._sparks = s._sparks.filter(p => tm - p.t < p.life);
      for (const p of s._sparks) {
        const age = (tm - p.t) / p.life;
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = age < .4 ? "#ffd24a" : "#ff8c42";
        ctx.fillRect((p.x + p.vx * (tm - p.t) / 16) * TILE, (p.y + p.vy * (tm - p.t) / 16 + .5 * age * age) * TILE, 2, 2);
      }
      ctx.globalAlpha = 1; ctx.restore();
    }
    // monitor flicker on unfixed devices
    const ts2 = cv.height / 14, sc2 = ts2 / TILE;
    ctx.save(); ctx.scale(sc2, sc2); ctx.translate(-camX, -camY);
    for (const d of (s.devices || [])) {
      if (d.fixed) continue;
      if (Math.random() < .05) {
        ctx.globalAlpha = .25 + Math.random() * .3;
        ctx.fillStyle = "#7fd4ff";
        ctx.fillRect(d.x * TILE + 6, d.y * TILE + 4, TILE - 12, 6);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  };

  // ambient NPC wander — rooms feel occupied even when you stand still
  const __origStep67 = step;
  let _wanderT = 0;
  step = function (dt) {
    const r = __origStep67(dt);
    const tm = performance.now();
    if (S && S.npcs && tm - _wanderT > 2600 && !S.inBattle && !S.inDialog) {
      _wanderT = tm;
      const amb = S.npcs.filter(n => n.ambient);
      const n = pick(amb);
      if (n && Math.random() < .6) {
        const dx = R(-1, 1), dy = R(-1, 1);
        const nx = n.x + dx, ny = n.y + dy;
        if (S.map[ny] && S.map[ny][nx] === 0 && !S.npcs.some(o => o.x === nx && o.y === ny) && !(S.x === nx && S.y === ny)) {
          n.x = nx; n.y = ny;
        }
      }
    }
    return r;
  };

  // ================= night parallax depth =================
  let _skyImg = null;
  if (typeof TO_SKYLINE !== "undefined") { _skyImg = new Image(); _skyImg.src = TO_SKYLINE; }
  const __origDrawNM67 = (typeof drawNM !== "undefined") ? drawNM : null;
  if (__origDrawNM67) {
    drawNM = function () {
      // distant real-skyline photo layer, slowest parallax, behind the vector layers
      if (_skyImg && _skyImg.complete && _skyImg.naturalWidth && typeof NM !== "undefined" && NM.cam !== undefined) {
        const W = cv.width, H = cv.height, horizon = NM_FLOOR - 60;
        const off = -((NM.cam * .12) % W);
        ctx.save(); ctx.globalAlpha = .55;
        for (let x = off - W; x < W * 2; x += W) ctx.drawImage(_skyImg, x, horizon - 260, W, 260);
        ctx.globalAlpha = 1;
        // darkening gradient so the vector layers blend in
        const g = ctx.createLinearGradient(0, horizon - 260, 0, horizon);
        g.addColorStop(0, "#060a1a00"); g.addColorStop(1, "#060a1acc");
        ctx.fillStyle = g; ctx.fillRect(0, horizon - 260, W, 260);
        ctx.restore();
      }
      __origDrawNM67.apply(this, arguments);
    };
  }

  applySet();
  window.v67ZoneOf = zoneOf; window.v67MusStart = musStart; window.v67MusStop = musStop;
  window.v67Projectile = projectile; window.v67Flavor = flavor;
  console.log(`[v6.7] Cinematic Combat loaded (${V67_VER})`);
})();
// v6.6 "AAA Polish": game juice — floating damage numbers, hit flash & screen shake,
// extended synthesized SFX, typewriter dialogue, win confetti, hurt vignette,
// low-HP heartbeat, smooth bars. No new assets: everything is code + CSS.
(function () {
  const V66_VER = "6.6.0";

  // ================= extended SFX synth =================
  const EXTRA_NOTES = {
    coin:  [[988, 0, .06, "square"], [1319, .06, .12, "square"]],
    crit:  [[880, 0, .06, "square"], [1108, .05, .08, "square"], [1318, .11, .16, "square"]],
    hurt:  [[180, 0, .12, "sawtooth"], [120, .08, .18, "sawtooth"]],
    heal2: [[523, 0, .08, "sine"], [659, .07, .1, "sine"], [784, .15, .14, "sine"]],
    click: [[1200, 0, .03, "square"]],
    blip:  [[1500, 0, .02, "square"]],
    kill:  [[659, 0, .08, "square"], [880, .07, .08, "square"], [1108, .14, .2, "square"]],
  };
  function playNotes(notes) {
    if (sfxMuted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const t0 = AC.currentTime;
      for (const [f, d, dur, type] of notes) {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(.06, t0 + d);
        g.gain.exponentialRampToValueAtTime(.001, t0 + d + dur);
        o.connect(g).connect(AC.destination);
        o.start(t0 + d); o.stop(t0 + d + dur);
      }
    } catch (e) { }
  }
  const __origSfx66 = sfx;
  sfx = function (kind) {
    if (EXTRA_NOTES[kind]) return playNotes(EXTRA_NOTES[kind]);
    return __origSfx66(kind);
  };

  // ================= battle juice =================
  let lastEHp = null, lastPHp = null;
  function floatNum(host, txt, cls) {
    if (!host) return;
    const f = document.createElement("div");
    f.className = "v66-float " + (cls || "");
    f.textContent = txt;
    f.style.left = (30 + Math.random() * 40) + "%";
    host.appendChild(f);
    setTimeout(() => f.remove(), 1150);
  }
  function retrigger(el, cls) {
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  }

  const __origSB66 = startBattle;
  startBattle = function (portal) {
    const r = __origSB66(portal);
    lastEHp = B ? B.hp : null;
    lastPHp = S ? S.hp : null;
    retrigger($("battle-enemy"), "v66-intro");
    return r;
  };

  const __origRB66 = renderBattle;
  renderBattle = function () {
    __origRB66();
    if (!B || typeof S === "undefined" || !S) return;
    const enemy = $("battle-enemy"), player = $("battle-player"), scene = $("battle-scene");
    if (lastEHp !== null && B.hp < lastEHp) {
      const d = lastEHp - B.hp;
      floatNum(enemy, "-" + d, d >= 30 ? "crit" : "dmg");
      retrigger(enemy, "v66-hit");
      retrigger(scene, "v66-shake");
    } else if (lastEHp !== null && B.hp > lastEHp) {
      floatNum(enemy, "+" + (B.hp - lastEHp), "heal");
    }
    lastEHp = B.hp;
    if (lastPHp !== null && S.hp < lastPHp) {
      floatNum(player, "-" + (lastPHp - S.hp), "phit");
      sfx("hurt");
      retrigger(scene, "v66-phit");
    } else if (lastPHp !== null && S.hp > lastPHp) {
      floatNum(player, "+" + (S.hp - lastPHp), "heal");
    }
    lastPHp = S.hp;
  };

  const __origBlog66 = blog;
  blog = function (h) {
    __origBlog66(h);
    try {
      if (h.includes("CRITICAL HIT")) sfx("crit");
      if (h.includes("BLIND FIX BACKFIRED") || h.includes("FORK BOMB")) retrigger($("battle-scene"), "v66-shake");
      if (/\+\$\d+/.test(h)) sfx("coin");
      if (h.includes("🔎") || h.includes("Weakness found")) { /* signal moments stay quiet */ }
      const log = $("battle-log");
      const last = log && log.lastElementChild;
      if (last) last.classList.add("v66-lognew");
    } catch (e) { }
  };

  function confetti(host, gold) {
    if (!host) return;
    const colors = gold ? ["#ffd700", "#fff3b0", "#ffb700", "#ffffff"]
      : ["#7dd87d", "#5fb8ff", "#ffd700", "#ff6b6b", "#c792ff", "#ffffff"];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement("div");
      c.className = "v66-confetti";
      c.style.left = (10 + Math.random() * 80) + "%";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * .35) + "s";
      c.style.animationDuration = (.9 + Math.random() * .7) + "s";
      if (i % 3 === 0) c.style.borderRadius = "50%";
      host.appendChild(c);
      setTimeout(() => c.remove(), 1900);
    }
  }

  const __origWin66 = winBattle;
  winBattle = function () {
    try {
      const enemy = $("enemy-sprite"), scene = $("battle-scene");
      if (enemy) enemy.classList.add("v66-kill");
      const hadLegendary = B && B.t && B.t.id === "shadow";
      confetti(scene, hadLegendary);
      sfx("kill");
    } catch (e) { }
    return __origWin66();
  };

  // ================= typewriter dialogue =================
  let twTimer = null;
  const __origDlg66 = dlg;
  dlg = function (name, text, options) {
    __origDlg66(name, text, options);
    const el = $("dlg-text");
    if (!el) return;
    clearInterval(twTimer);
    if (/<[a-z]/i.test(text) || text.length < 60) {
      // HTML-rich or short confirmations: instant text + smooth fade
      retrigger(el, "v66-dlgfade");
      return;
    }
    const full = text;
    let i = 0;
    el.textContent = "";
    el.onclick = () => { clearInterval(twTimer); el.textContent = full; };
    twTimer = setInterval(() => {
      i += 2;
      el.textContent = full.slice(0, i);
      if (i % 8 === 0 && i < full.length) sfx("blip");
      if (i >= full.length) clearInterval(twTimer);
    }, 16);
  };

  // ================= low-HP heartbeat =================
  const __origHud66 = updateHUD;
  updateHUD = function () {
    __origHud66();
    try {
      if (typeof S === "undefined" || !S) return;
      const low = S.hp <= Math.max(10, Math.round(S.maxHp * .25));
      $("game-wrap").classList.toggle("v66-lowhp", low);
    } catch (e) { }
  };

  // ================= UI click sounds (one delegated listener) =================
  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("#battle-actions button, #dlg-options button, .big-btn, .hud-btn, .tbtn, .dbtn")) sfx("click");
  }, true);

  window.v66Confetti = confetti;
  console.log(`[v6.6] AAA Polish loaded (${V66_VER})`);
})();
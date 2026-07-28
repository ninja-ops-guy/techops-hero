// v7.1 "Interface Polish": objectives tracker is toggleable, side-view backdrops
// render aspect-correct (cover-fit, no distortion), and a UI animation pack adds
// rise/pop/fade entrances, staggered battle actions, a floating title, battle
// hit-jolt feedback, and room-transition fades — all behind a UI-animations setting.
(function () {
  const V71_VER = "7.1.0";

  // ---------- settings ----------
  if (window.V67SET) {
    if (V67SET.tracker === undefined) V67SET.tracker = true;
    if (V67SET.anims === undefined) V67SET.anims = true;
    try { localStorage.setItem("techops_settings", JSON.stringify(V67SET)); } catch (e) { }
  }
  const animsOn = () => !window.V67SET || V67SET.anims !== false;
  const applyAnims = () => document.body.classList.toggle("v71-anims", animsOn());
  applyAnims();

  // ---------- animation stylesheet (gated on body.v71-anims) ----------
  const st = document.createElement("style");
  st.id = "v71-style";
  st.textContent = `
@keyframes v71-rise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
@keyframes v71-fade{from{opacity:0}to{opacity:1}}
@keyframes v71-pop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes v71-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes v71-pulse{0%{transform:translateX(-6px);opacity:.4}100%{transform:none;opacity:1}}
@keyframes v71-jolt{0%{transform:translateX(0)}25%{transform:translateX(-7px) scale(1.06)}55%{transform:translateX(5px)}100%{transform:none}}
@keyframes v71-rflash{0%{box-shadow:inset 0 0 0 0 #ff3b3b00}30%{box-shadow:inset 0 0 60px 12px #ff3b3b66}100%{box-shadow:inset 0 0 0 0 #ff3b3b00}}
body.v71-anims #dialogue:not(.hidden){animation:v71-rise .18s ease-out}
body.v71-anims #panel:not(.hidden){animation:v71-rise .2s ease-out}
body.v71-anims #eod:not(.hidden){animation:v71-fade .35s ease-out}
body.v71-anims #toast:not(.hidden){animation:v71-pop .16s ease-out}
body.v71-anims #battle-actions button{animation:v71-pop .18s ease-out backwards}
body.v71-anims #battle-actions button:nth-child(2){animation-delay:.05s}
body.v71-anims #battle-actions button:nth-child(3){animation-delay:.1s}
body.v71-anims #battle-actions button:nth-child(4){animation-delay:.15s}
body.v71-anims #dlg-options button{animation:v71-rise .16s ease-out backwards}
body.v71-anims #dlg-options button:nth-child(2){animation-delay:.04s}
body.v71-anims #dlg-options button:nth-child(3){animation-delay:.08s}
body.v71-anims #dlg-options button:nth-child(4){animation-delay:.12s}
body.v71-anims .t-line1,body.v71-anims .t-line2{animation:v71-float 3.2s ease-in-out infinite}
body.v71-anims .t-line2{animation-delay:.25s}
body.v71-anims button{transition:transform .12s ease,filter .12s ease}
body.v71-anims button:hover{transform:translateY(-1px);filter:brightness(1.15)}
body.v71-anims button:active{transform:translateY(1px)}
#quest-tracker{transition:opacity .2s ease}
body.v71-anims #quest-tracker.v71-pulse{animation:v71-pulse .5s ease-out}
body.v71-anims #battle-enemy.v71-hit{animation:v71-jolt .14s ease-out}
body.v71-anims #battle.v71-phit #battle-scene{animation:v71-rflash .18s ease-out}`;
  document.head.appendChild(st);

  // ---------- settings rows ----------
  function mkRow(id, label, key, cb) {
    const card = document.querySelector("#v67-settings .v67-set-card");
    if (!card || $(id)) return;
    const note = card.querySelector(".v67-note");
    const row = document.createElement("label");
    row.className = "v67-row";
    row.innerHTML = `<span>${label}</span><input type="checkbox" id="${id}">`;
    card.insertBefore(row, note);
    const el = row.querySelector("input");
    el.checked = V67SET[key] !== false;
    el.oninput = () => { V67SET[key] = el.checked; try { localStorage.setItem("techops_settings", JSON.stringify(V67SET)); } catch (e) { } cb && cb(); };
  }
  function injectRows71() {
    mkRow("v71s-tracker", "Objectives tracker (HUD)", "tracker", applyTracker);
    mkRow("v71s-anims", "UI animations", "anims", applyAnims);
  }
  const g = $("v67-gear");
  if (g) { const old = g.onclick; g.onclick = () => { old && old(); setTimeout(injectRows71, 0); }; }

  // ---------- objectives tracker toggle + pulse on change ----------
  let _lastOpenCount = null;
  function applyTracker() {
    const el = $("quest-tracker");
    if (el) el.style.display = (window.V67SET && V67SET.tracker === false) ? "none" : "";
  }
  const __origUpdateHUD71 = updateHUD;
  updateHUD = function () {
    const r = __origUpdateHUD71.apply(this, arguments);
    applyTracker();
    if (S && S.tickets) {
      const open = S.tickets.filter(t => !t.done).length;
      if (_lastOpenCount !== null && open !== _lastOpenCount && animsOn()) {
        const el = $("quest-tracker");
        if (el) { el.classList.remove("v71-pulse"); void el.offsetWidth; el.classList.add("v71-pulse"); }
      }
      _lastOpenCount = open;
    }
    return r;
  };

  // ---------- battle hit feedback (no game internals needed: watch the HP bars) ----------
  function watchBar(id, cb) {
    const el = $(id);
    if (!el) return;
    let last = el.style.width || "100%";
    new MutationObserver(() => {
      const w = el.style.width;
      const a = parseFloat(last), b = parseFloat(w);
      last = w;
      if (!isNaN(a) && !isNaN(b) && b < a) cb();
    }).observe(el, { attributes: true, attributeFilter: ["style"] });
  }
  const retrigger = (el, cls, ms) => { if (!el || !animsOn()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
  watchBar("enemy-hp", () => retrigger($("battle-enemy"), "v71-hit", 180));
  watchBar("player-hp", () => retrigger($("battle"), "v71-phit", 220));

  // ---------- room transition fade ----------
  let v71Fade = 0, v71WasRoom = undefined;
  window.v71State = { get fade() { return v71Fade; } };
  const __origDraw71 = draw;
  draw = function () {
    const r = __origDraw71.apply(this, arguments);
    const inR = !!(S && S.room);
    if (v71WasRoom !== undefined && inR !== v71WasRoom && animsOn()) v71Fade = 1;
    v71WasRoom = inR;
    if (v71Fade > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(0,0,0,${(v71Fade * .65).toFixed(3)})`;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
      v71Fade -= .06;
    }
    return r;
  };

  console.log(`[v7.1] Interface Polish loaded (${V71_VER})`);
})();

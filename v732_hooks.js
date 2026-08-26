/* ==========================================================================
   v7.32 — OPENING THEME: menu music + save hardening + scene validator
   1. MENU MUSIC — optional production theme. Set window.TECHOPS_THEME_SRC to
      an actual shipped/licensed audio URL before this script loads. No default
      file is requested, so production never emits a missing-audio 404.
   2. SAVE HARDENING — rotating backup slot.
   3. SCENE VALIDATOR (dev) — validates registered cinematics under ?dev=1.
   ========================================================================== */
(function () {
  const VER = "7.32.1";
  if (window.v732) return;

  let theme = null, themeWanted = false;
  function themeSource() {
    try { return (typeof window.TECHOPS_THEME_SRC === "string" && window.TECHOPS_THEME_SRC.trim()) ? window.TECHOPS_THEME_SRC.trim() : ""; }
    catch (e) { return ""; }
  }
  function getTheme() {
    if (theme) return theme;
    const src = themeSource();
    if (!src) return null;
    theme = new Audio(src);
    theme.loop = true;
    try { theme.volume = (window.V67SET ? V67SET.volMusic : .8); } catch (e) { theme.volume = .8; }
    return theme;
  }
  function themeVolume() { try { if (theme && window.V67SET) theme.volume = V67SET.volMusic; } catch (e) { } }
  function titleVisible() { const t = $("title-screen"); return t && !t.classList.contains("hidden"); }
  function tryPlay() {
    const t = getTheme();
    if (!t) return false;
    themeVolume();
    if (!titleVisible()) return false;
    if (window.V67SET && V67SET.volMusic <= 0) return false;
    if (typeof sfxMuted !== "undefined" && sfxMuted) return false;
    themeWanted = true;
    t.play().catch(() => { });
    return true;
  }
  function stopTheme() { themeWanted = false; if (theme) theme.pause(); }
  const gesture = () => { if (titleVisible()) tryPlay(); };
  addEventListener("pointerdown", gesture);
  addEventListener("keydown", gesture);
  const _startRun732 = startRun;
  window.startRun = function () { stopTheme(); return _startRun732.apply(this, arguments); };
  const _setMusic732 = (typeof setMusic !== "undefined") ? setMusic : null;
  if (_setMusic732) {
    window.setMusic = function (on) {
      const r = _setMusic732.apply(this, arguments);
      try { themeVolume(); if (!on) { if (theme) theme.pause(); } else if (titleVisible()) tryPlay(); } catch (e) { }
      return r;
    };
  }
  setInterval(() => { if (theme && themeWanted && titleVisible() && theme.paused && !(typeof sfxMuted !== "undefined" && sfxMuted)) tryPlay(); themeVolume(); }, 2500);

  const LS = window.localStorage;
  const _setItem = LS.setItem.bind(LS);
  const _getItem = LS.getItem.bind(LS);
  let healing732 = false;
  LS.setItem = function (k, v) {
    if (k === "techops_save" && !healing732) {
      try { const prev = _getItem("techops_save"); if (prev && prev !== v) _setItem("techops_save_bak", prev); } catch (e) { }
    }
    return _setItem(k, v);
  };
  LS.getItem = function (k) {
    if (k !== "techops_save") return _getItem(k);
    const v = _getItem(k);
    if (v) { try { JSON.parse(v); return v; } catch (e) { } }
    const bak = _getItem("techops_save_bak");
    if (bak) { try { healing732 = true; _setItem("techops_save", bak); healing732 = false; } catch (e) { healing732 = false; } }
    return bak;
  };

  function validate732() {
    const issues = [];
    const cines = (window.v725 && v725.defs) ? v725.defs() : {};
    const ids = Object.keys(cines);
    if (ids.length !== new Set(ids).size) issues.push("duplicate scene id");
    for (const id of ids) {
      const c = cines[id];
      if (!c.title) issues.push(id + ": missing title");
      if (!Array.isArray(c.shots) || !c.shots.length) { issues.push(id + ": no shots"); continue; }
      c.shots.forEach((sh, i) => {
        const tag = id + "#" + i;
        if (sh.choice) {
          if (sh.dur !== 0) issues.push(tag + ": choice shot must have dur 0");
          if (!sh.choice.store) issues.push(tag + ": choice without store flag");
          if (!Array.isArray(sh.choice.options) || sh.choice.options.length < 2) issues.push(tag + ": choice needs 2+ options");
          if (sh.choice.options && sh.choice.values && sh.choice.options.length !== sh.choice.values.length) issues.push(tag + ": options/values length mismatch");
        } else if (!(sh.dur > 0)) issues.push(tag + ": non-choice shot without duration (soft-lock risk)");
        if (sh.cap && sh.cap.length > 110) issues.push(tag + ": caption over safe capacity (" + sh.cap.length + " chars)");
        if (typeof sh.draw !== "function") issues.push(tag + ": shot missing draw");
      });
      const last = c.shots[c.shots.length - 1];
      if (last.choice) issues.push(id + ": scene ends on a choice (no exit state)");
      if (!c.shots.some(sh => sh.dur > 0 && !sh.choice)) issues.push(id + ": no timed exit shot");
    }
    return issues;
  }
  try {
    if (location.search.includes("dev=1")) {
      const issues = validate732();
      if (issues.length) console.warn("[v7.32] scene validator:", issues);
      else console.log("[v7.32] scene validator: all scenes clean");
    }
  } catch (e) { window.__err732 = String(e && e.stack || e); }

  window.v732 = { version: VER, theme: () => theme, playTheme: tryPlay, stopTheme, validate: validate732 };
  console.log("[v7.32] Opening Theme loaded — optional menu music, save backup, scene validator");
})();

/* ============================================================
   TechOps Hero — R1 day-side feel: tech-debt warning (verifier v10)
   s.meta.debt grows when gambles backfire (decommission "hidden
   dependency", failed "Try Random Fix") and the EOD screen warns at
   debt >= 5 — but mid-day the player gets no signal at the crossing.
   Now the moment is legible: one honest toast, mirroring the game's
   own EOD wording. Feedback only — no balance changes.

   Additive module: wraps the global step() game loop (chains cleanly
   after the v8 night watcher). The original always runs first; we
   only poll the result. No window → no-op.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var WARN_AT = 5, TOAST_MS = 3400;

  var lastDebt = null;  // null = no baseline yet (silent first observation)
  var latched = false;
  var wrapped = null;

  function debt() {
    try {
      return (typeof S !== "undefined" && S && S.meta && typeof S.meta.debt === "number") ? S.meta.debt : null;
    } catch (e) { return null; }
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, TOAST_MS); } catch (e) { window.__techopsDebtError = String(e && e.stack || e); }
  }
  function playBad() {
    try { if (typeof sfx === "function") sfx("bad"); } catch (e) { /* audio must never break gameplay */ }
  }

  function watch() {
    var v = debt();
    if (v === null) return;
    if (lastDebt === null) {           // silent baseline (e.g. loaded save)
      lastDebt = v;
      latched = v >= WARN_AT;
      return;
    }
    if (v < WARN_AT) { latched = false; lastDebt = v; return; } // re-arm
    if (v >= WARN_AT && lastDebt < WARN_AT && !latched) {
      latched = true;
      say("⚠️ TECH DEBT HIGH (" + v + ") — repeat tickets are becoming more likely. Verify before you fix.");
      playBad();
    }
    lastDebt = v;
  }

  function wrapStep() {
    if (wrapped && wrapped.installed === (typeof step !== "undefined" ? step : null)) return;
    if (typeof step !== "function") return;
    if (step.__techopsDebtWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: step.__techopsDebtOrig, installed: step };
      return;
    }
    var orig = step;
    var wrapper = function (dt) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { watch(); } catch (e) { window.__techopsDebtError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsDebtWrapped = true;
    wrapper.__techopsDebtOrig = orig;
    step = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapStep();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapStep);
  }

  if (!window.TechOpsTechDebtWarning) {
    window.TechOpsTechDebtWarning = {
      WARN_AT: WARN_AT,
      reset: function () { lastDebt = null; latched = false; },
    };
  }
})();

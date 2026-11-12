/* ============================================================
   TechOps Hero — R1 day-side feel: stress recovery (verifier v13)
   addStress clamps 0–100; hitting 100 burns out (-10 HP, floored at 1),
   coffee relieves -25, a verified fix relieves -5. The game warns on the
   way up (v9) but never acknowledges the recovery — the most satisfying
   beat of the stress loop. Now: after stress has been high (>= 80), the
   first drop back below 50 gets a "back in the zone" toast + sfx("win").

   Additive module: wraps the global addStress() (chains cleanly after the
   v9 warning wrapper). The original always runs first; we only poll the
   result. No window → no-op. Celebration only — no balance changes.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var HIGH_AT = 80;    // same threshold as the v9 stress warning
  var CALM_BELOW = 50; // same re-arm floor as the v9 stress warning
  var TOAST_MS = 3400;

  var lastStress = null; // null = no baseline yet (silent first observation)
  var strained = false;  // stress has been >= HIGH_AT since last recovery
  var wrapped = null;

  function stress() {
    try {
      if (typeof S === "undefined" || !S || typeof S.stress !== "number") return null;
      return S.stress;
    } catch (e) { return null; }
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, TOAST_MS); } catch (e) { window.__techopsCalmError = String(e && e.stack || e); }
  }
  function playWin() {
    try { if (typeof sfx === "function") sfx("win"); } catch (e) { /* audio must never break gameplay */ }
  }

  function watch() {
    var v = stress();
    if (v === null) return;
    if (lastStress === null) {          // silent baseline (e.g. loaded save)
      lastStress = v;
      strained = v >= HIGH_AT;          // recovering from a loaded high still celebrates
      return;
    }
    if (v >= HIGH_AT) strained = true;
    else if (strained && lastStress >= CALM_BELOW && v < CALM_BELOW) {
      strained = false;
      say("😮‍💨 BACK IN THE ZONE — stress down to " + v + ". Nice recovery.");
      playWin();
    }
    lastStress = v;
  }

  function wrapAddStress() {
    if (wrapped && wrapped.installed === (typeof addStress !== "undefined" ? addStress : null)) return;
    if (typeof addStress !== "function") return;
    if (addStress.__techopsCalmWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: addStress.__techopsCalmOrig, installed: addStress };
      return;
    }
    var orig = addStress;
    var wrapper = function (n) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { watch(); } catch (e) { window.__techopsCalmError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsCalmWrapped = true;
    wrapper.__techopsCalmOrig = orig;
    addStress = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapAddStress();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapAddStress);
  }

  if (!window.TechOpsStressRecovery) {
    window.TechOpsStressRecovery = {
      HIGH_AT: HIGH_AT,
      CALM_BELOW: CALM_BELOW,
      reset: function () { lastStress = null; strained = false; },
    };
  }
})();

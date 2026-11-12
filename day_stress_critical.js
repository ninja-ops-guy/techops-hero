/* ============================================================
   TechOps Hero — R1 day-side feel: stress-critical warning (verifier v15)
   addStress clamps to 100 and burns out at >= 100 (stress → 70, -10 HP,
   "🔥 BURNOUT!"). v9 warns at 80; v13 celebrates recovery below 50. But
   between 80 and the -10 HP hit there is no escalation — the player gets
   one generic warning and then silence until the penalty lands.

   Additive module: wraps the global addStress() (chains cleanly after the
   v9/v13 wrappers). The original always runs first; we only poll the
   result. No window → no-op. Announcement only — no balance changes.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var CRIT_AT = 90;    // stress threshold: one spike from burnout (100 → -10 HP)
  var TOAST_MS = 3400;

  var lastStress = null; // null = no baseline yet (silent first observation)
  var announced = false;
  var wrapped = null;

  function cur() {
    try {
      if (typeof S === "undefined" || !S) return null;
      if (typeof S.stress !== "number") return null;
      return S.stress;
    } catch (e) { return null; }
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, TOAST_MS); } catch (e) { window.__techopsStressCritError = String(e && e.stack || e); }
  }
  function playBad() {
    try { if (typeof sfx === "function") sfx("bad"); } catch (e) { /* audio must never break gameplay */ }
  }

  function watch() {
    var v = cur();
    if (v === null) return; // no state: keep baseline, stay silent
    if (lastStress === null) {          // silent baseline (e.g. save loaded at high stress)
      lastStress = v;
      announced = v >= CRIT_AT;
      return;
    }
    if (v < CRIT_AT) announced = false; // recovery (incl. post-burnout reset to 70): re-arm
    else if (lastStress < CRIT_AT && !announced) {
      announced = true;
      say("🚨 STRESS CRITICAL — " + v + "/100. One more spike and you burn out (-10 HP). Find a break now.");
      playBad();
    }
    lastStress = v;
  }

  function wrapAddStress() {
    if (wrapped && wrapped.installed === (typeof addStress !== "undefined" ? addStress : null)) return;
    if (typeof addStress !== "function") return;
    if (addStress.__techopsStressCritWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: addStress.__techopsStressCritOrig, installed: addStress };
      return;
    }
    var orig = addStress;
    var wrapper = function (n) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { watch(); } catch (e) { window.__techopsStressCritError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsStressCritWrapped = true;
    wrapper.__techopsStressCritOrig = orig;
    addStress = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapAddStress();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapAddStress);
  }

  if (!window.TechOpsStressCritical) {
    window.TechOpsStressCritical = {
      CRIT_AT: CRIT_AT,
      reset: function () { lastStress = null; announced = false; },
    };
  }
})();

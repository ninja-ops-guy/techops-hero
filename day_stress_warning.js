/* ============================================================
   TechOps Hero — R1 day-side feel: high-stress warning (verifier v9)
   Stress is a core day resource, but the game never says it's nearing
   the cap. Now the moment is legible: a warning at 80+, an escalation
   at 100, re-armed below 50.

   Additive module: wraps the global addStress() from game.js. The
   original always runs first (heat-chaos multipliers, stressResist and
   clamping unchanged); we only read the result. Feedback copy is
   honest — no unverified consequences are claimed.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var WARN_AT = 80, MAX_AT = 100, REARM_BELOW = 50;
  var WARN_MSG = "😰 STRESS HIGH — grab coffee, rest the team, or clock out strong.";
  var MAX_MSG = "🤯 STRESS MAXED — you can't take much more of this shift.";

  var stage = 0; // 0 = calm, 1 = warned, 2 = maxed
  var wrapped = null;

  function stress() {
    try { return (typeof S !== "undefined" && S && typeof S.stress === "number") ? S.stress : null; } catch (e) { return null; }
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, 3400); } catch (e) { window.__techopsStressError = String(e && e.stack || e); }
  }
  function playBad() {
    try { if (typeof sfx === "function") sfx("bad"); } catch (e) { /* audio must never break gameplay */ }
  }

  function check() {
    var v = stress();
    if (v === null) return;
    if (v < REARM_BELOW) { stage = 0; return; }
    var want = v >= MAX_AT ? 2 : v >= WARN_AT ? 1 : 0;
    if (want <= stage) return;
    stage = want;
    say(want === 2 ? MAX_MSG : WARN_MSG);
    playBad();
  }

  function wrapAddStress() {
    if (wrapped && wrapped.installed === (typeof addStress !== "undefined" ? addStress : null)) return;
    if (typeof addStress !== "function") return;
    if (addStress.__techopsStressWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: addStress.__techopsStressOrig, installed: addStress };
      return;
    }
    var orig = addStress;
    var wrapper = function (n) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { check(); } catch (e) { window.__techopsStressError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsStressWrapped = true;
    wrapper.__techopsStressOrig = orig;
    addStress = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapAddStress();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapAddStress);
  }

  if (!window.TechOpsStressWarning) {
    window.TechOpsStressWarning = {
      WARN_AT: WARN_AT, MAX_AT: MAX_AT, REARM_BELOW: REARM_BELOW,
      reset: function () { stage = 0; },
    };
  }
})();

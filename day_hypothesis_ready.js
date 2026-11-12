/* ============================================================
   TechOps Hero — R1 day-side feel: hypothesis-ready cue (verifier v14)
   Battle evidence raises B.confidence; at >= 60 the "Form Hypothesis"
   action silently joins the action list ("hypothesis unlocks at 60%
   confidence — evidence earns the right to commit"; desc: "Commit to a
   root cause: +50% fix damage if right."). A new button appearing with no
   fanfare is easy to miss mid-battle — now the unlock announces itself.

   Additive module: wraps the global step() game loop (chains cleanly
   after the v8/v10/v11/v12 watchers). The original always runs first; we
   only poll the result. No window → no-op. Announcement only — no
   balance changes, no unverified consequence claims.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var READY_AT = 60;   // confidence threshold that unlocks Form Hypothesis
  var TOAST_MS = 3400;

  var lastConf = null;  // null = no baseline yet (silent first observation)
  var announced = false;
  var wrapped = null;

  function battle() {
    try {
      if (typeof B === "undefined" || !B) return null;
      if (typeof B.confidence !== "number") return null;
      return B;
    } catch (e) { return null; }
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, TOAST_MS); } catch (e) { window.__techopsHypError = String(e && e.stack || e); }
  }
  function playWin() {
    try { if (typeof sfx === "function") sfx("win"); } catch (e) { /* audio must never break gameplay */ }
  }

  function watch() {
    var b = battle();
    if (b === null) { lastConf = null; announced = false; return; } // out of battle: re-arm
    if (b.hyp || b.hypFailed) { lastConf = b.confidence; return; }    // already decided: nothing to announce
    var c = b.confidence;
    if (lastConf === null) {            // silent baseline (e.g. save loaded mid-battle)
      lastConf = c;
      announced = c >= READY_AT;        // already unlocked: stay silent
      return;
    }
    if (c < READY_AT) announced = false; // false positives can knock it back down: re-arm
    else if (lastConf < READY_AT && !announced) {
      announced = true;
      say("🧠 HYPOTHESIS READY — Form Hypothesis is unlocked. Commit to a root cause: +50% fix damage if right.");
      playWin();
    }
    lastConf = c;
  }

  function wrapStep() {
    if (wrapped && wrapped.installed === (typeof step !== "undefined" ? step : null)) return;
    if (typeof step !== "function") return;
    if (step.__techopsHypWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: step.__techopsHypOrig, installed: step };
      return;
    }
    var orig = step;
    var wrapper = function (dt) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { watch(); } catch (e) { window.__techopsHypError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsHypWrapped = true;
    wrapper.__techopsHypOrig = orig;
    step = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapStep();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapStep);
  }

  if (!window.TechOpsHypothesisReady) {
    window.TechOpsHypothesisReady = {
      READY_AT: READY_AT,
      reset: function () { lastConf = null; announced = false; },
    };
  }
})();

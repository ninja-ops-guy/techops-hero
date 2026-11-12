/* ============================================================
   TechOps Hero — R1 day-side feel: reputation milestone (verifier v11)
   s.rep[dept] is a 0–5 trust track per department (+1 automated close,
   +1 Executives on clean deploy, -1 per missed ticket at EOD). Maxing a
   department is a real achievement — now the game says so, once.

   Additive module: wraps the global step() game loop (chains cleanly
   after the v8/v10 watchers). The original always runs first; we only
   poll the result. No window → no-op. Celebration only — no balance
   changes, no unverified consequence claims.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var MAX_REP = 5, TOAST_MS = 3400;

  var lastRep = null;   // null = no baseline yet (silent first observation)
  var latched = {};     // dept -> true while at max
  var wrapped = null;

  function reps() {
    try {
      if (typeof S === "undefined" || !S || !S.rep || typeof S.rep !== "object") return null;
      return S.rep;
    } catch (e) { return null; }
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, TOAST_MS); } catch (e) { window.__techopsRepError = String(e && e.stack || e); }
  }
  function playPromote() {
    try { if (typeof sfx === "function") sfx("promote"); } catch (e) { /* audio must never break gameplay */ }
  }

  function watch() {
    var rep = reps();
    if (rep === null) return;
    var now = {}, dept, v;
    for (dept in rep) {
      v = rep[dept];
      if (typeof v === "number") now[dept] = v;
    }
    if (lastRep === null) {           // silent baseline (e.g. loaded save)
      lastRep = now;
      for (dept in now) latched[dept] = now[dept] >= MAX_REP;
      return;
    }
    var crossed = [];
    for (dept in now) {
      v = now[dept];
      if (v < MAX_REP) { latched[dept] = false; continue; }   // re-arm
      var prev = typeof lastRep[dept] === "number" ? lastRep[dept] : 0;
      if (prev < MAX_REP && !latched[dept]) {
        latched[dept] = true;
        crossed.push(dept);
      }
    }
    lastRep = now;
    if (crossed.length) {
      say("⭐ REPUTATION MAXED — " + crossed.join(", ") +
          (crossed.length === 1 ? " has" : " have") + " full trust in you (5/5).");
      playPromote();
    }
  }

  function wrapStep() {
    if (wrapped && wrapped.installed === (typeof step !== "undefined" ? step : null)) return;
    if (typeof step !== "function") return;
    if (step.__techopsRepWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: step.__techopsRepOrig, installed: step };
      return;
    }
    var orig = step;
    var wrapper = function (dt) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { watch(); } catch (e) { window.__techopsRepError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsRepWrapped = true;
    wrapper.__techopsRepOrig = orig;
    step = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapStep();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapStep);
  }

  if (!window.TechOpsRepMilestone) {
    window.TechOpsRepMilestone = {
      MAX_REP: MAX_REP,
      reset: function () { lastRep = null; latched = {}; },
    };
  }
})();

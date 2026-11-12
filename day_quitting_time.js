/* ============================================================
   TechOps Hero — R1 day-side feel: quitting-time warning (verifier v12)
   The day force-ends at 17:00 (clock is minutes since midnight; the game
   toasts "It's 5 PM. Remaining tickets roll to the backlog..." and EOD
   docks department rep for each missed ticket). A 4:30 PM heads-up while
   tickets are still open turns that blindside into a prioritization
   decision.

   Additive module: wraps the global step() game loop (chains cleanly
   after the v8/v10/v11 watchers). The original always runs first; we
   only poll the result. No window → no-op. Warning only — no balance
   changes, no unverified consequence claims.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var WARN_AT = 16 * 60 + 30;  // 4:30 PM — 30 minutes before the 5 PM force-end
  var TOAST_MS = 3400;

  var lastClock = null;  // null = no baseline yet (silent first observation)
  var warnedDay = null;  // S.day value we already warned for (once per day)
  var wrapped = null;

  function state() {
    try {
      if (typeof S === "undefined" || !S) return null;
      if (typeof S.clock !== "number") return null;
      return S;
    } catch (e) { return null; }
  }
  function remaining(s) {
    var total = typeof s.ticketsTotal === "number" ? s.ticketsTotal : 0;
    var done = typeof s.ticketsDone === "number" ? s.ticketsDone : 0;
    var r = total - done;
    return r > 0 ? r : 0;
  }
  function say(html) {
    try { if (typeof toast === "function") toast(html, TOAST_MS); } catch (e) { window.__techopsClockError = String(e && e.stack || e); }
  }
  function playBad() {
    try { if (typeof sfx === "function") sfx("bad"); } catch (e) { /* audio must never break gameplay */ }
  }

  function watch() {
    var s = state();
    if (s === null) return;
    var clock = s.clock;
    if (lastClock === null) {          // silent baseline (e.g. loaded save)
      lastClock = clock;
      if (clock >= WARN_AT) warnedDay = s.day;  // already past 4:30: stay silent today
      return;
    }
    if (s.day !== warnedDay && lastClock < WARN_AT && clock >= WARN_AT) {
      warnedDay = s.day;               // latch even with a clear queue
      var n = remaining(s);
      if (n > 0) {
        say("🕟 4:30 PM — " + n + (n === 1 ? " ticket" : " tickets") +
            " still open. The shift ends at 5 PM; unfinished tickets roll to the backlog.");
        playBad();
      }
    }
    lastClock = clock;
  }

  function wrapStep() {
    if (wrapped && wrapped.installed === (typeof step !== "undefined" ? step : null)) return;
    if (typeof step !== "function") return;
    if (step.__techopsClockWrapped) {
      // another copy of this module already wrapped it — adopt, don't re-wrap
      wrapped = { orig: step.__techopsClockOrig, installed: step };
      return;
    }
    var orig = step;
    var wrapper = function (dt) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate silently
      try { watch(); } catch (e) { window.__techopsClockError = String(e && e.stack || e); }
      return r;
    };
    wrapper.__techopsClockWrapped = true;
    wrapper.__techopsClockOrig = orig;
    step = wrapper;
    wrapped = { orig: orig, installed: wrapper };
  }

  wrapStep();
  if ((!wrapped) && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapStep);
  }

  if (!window.TechOpsQuittingTime) {
    window.TechOpsQuittingTime = {
      WARN_AT: WARN_AT,
      reset: function () { lastClock = null; warnedDay = null; },
    };
  }
})();

/* ============================================================
   TechOps Hero — R1 day-side feel: Perfect Shift bonus (verifier v6)
   A flawless day (zero unresolved tickets) used to earn only the
   backlog0 achievement. Now the end-of-day screen pays out: +25 XP,
   a PERFECT SHIFT banner, and a promote jingle.

   Additive module: wraps the global endOfDay() from game.js. The
   original always runs first; we observe the DOM it rendered
   (#eod-title / #eod-summary) so we never touch the private state S.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var BONUS_XP = 25;
  var BANNER = '🏆 <b>PERFECT SHIFT</b> — zero backlog. Bonus +' + BONUS_XP + ' XP!';
  var lastAwardedDay = -1;
  var installedWrapper = null;

  function el(id) {
    try { return window.document && window.document.getElementById(id); }
    catch (e) { return null; }
  }

  function perfectDay() {
    var title = el("eod-title");
    var summary = el("eod-summary");
    if (!title || !summary) return null;
    var m = /DAY (\d+) COMPLETE/.exec(String(title.textContent || ""));
    if (!m) return null; // game-over screens ("RUN TERMINATED" etc.) never qualify
    if (String(summary.innerHTML || "").indexOf("ZERO BACKLOG") === -1) return null;
    return parseInt(m[1], 10);
  }

  function award(day) {
    if (day === null || day === lastAwardedDay) return;
    lastAwardedDay = day;
    var summary = el("eod-summary");
    if (summary) summary.innerHTML = String(summary.innerHTML || "") + "<br>" + BANNER;
    if (typeof window.addXP === "function") {
      try { window.addXP(BONUS_XP); } catch (e) { window.__techopsPerfectShiftError = String(e && e.stack || e); }
    }
    if (typeof window.sfx === "function") {
      try { window.sfx("promote"); } catch (e) { /* audio must never break EOD */ }
    }
  }

  function wrapEndOfDay() {
    if (installedWrapper && window.endOfDay === installedWrapper) return;
    if (typeof window.endOfDay !== "function") return;
    var orig = window.endOfDay;
    var wrapper = function () {
      var ret = orig.apply(this, arguments); // original first; exceptions propagate, no award
      award(perfectDay());
      return ret;
    };
    window.endOfDay = wrapper;
    installedWrapper = wrapper;
  }

  wrapEndOfDay();
  if (typeof window.endOfDay !== "function" && window.document) {
    window.document.addEventListener("DOMContentLoaded", wrapEndOfDay);
  }

  window.TechOpsPerfectShift = {
    BONUS_XP: BONUS_XP,
    reset: function () { lastAwardedDay = -1; },
  };
})();

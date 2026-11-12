/* ============================================================
   TechOps Hero — R1 day-side feel: Perfect Shift streaks (verifier v7)
   v6 made one flawless day pay out; this adds momentum. Consecutive
   zero-backlog days escalate: streak 2 → +15 XP, streak 3+ → +35 XP,
   with its own 🔥 PERFECT STREAK banner on the EOD screen.

   Additive module: wraps whatever window.endOfDay is at load (the v6
   wrapper when both modules are present — chain order original → v6 →
   v7). State lives in localStorage["techops_perfect_streak"]; the
   private game state S is never touched.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var KEY = "techops_perfect_streak";
  var BONUS = function (streak) { return streak >= 3 ? 35 : 15; }; // streak 1: no extra (v6 covers day one)
  var installedWrapper = null;

  function el(id) {
    try { return window.document && window.document.getElementById(id); }
    catch (e) { return null; }
  }
  function store() {
    try { return window.localStorage || null; } catch (e) { return null; }
  }
  function readState() {
    var ls = store(); if (!ls) return null;
    try {
      var v = JSON.parse(ls.getItem(KEY) || "null");
      if (v && typeof v.day === "number" && typeof v.streak === "number") return v;
    } catch (e) { /* corrupt → treat as no state */ }
    return null;
  }
  function writeState(day, streak) {
    var ls = store(); if (!ls) return;
    try { ls.setItem(KEY, JSON.stringify({ day: day, streak: streak })); } catch (e) { }
  }

  // Returns { kind: "perfect"|"messy"|"gameover", day } from the rendered EOD DOM.
  function readEod() {
    var title = el("eod-title");
    var summary = el("eod-summary");
    if (!title || !summary) return null;
    var m = /DAY (\d+) COMPLETE/.exec(String(title.textContent || ""));
    if (!m) return { kind: "gameover", day: -1 };
    var perfect = String(summary.innerHTML || "").indexOf("ZERO BACKLOG") !== -1;
    return { kind: perfect ? "perfect" : "messy", day: parseInt(m[1], 10) };
  }

  function handle() {
    var eod = readEod();
    if (!eod) return;
    var prev = readState() || { day: -1, streak: 0 };
    if (eod.kind === "perfect") {
      if (prev.day === eod.day) return; // same day re-fired: no double count
      var streak = prev.day === eod.day - 1 ? prev.streak + 1 : 1;
      writeState(eod.day, streak);
      if (streak >= 2) {
        var xp = BONUS(streak);
        var summary = el("eod-summary");
        if (summary) summary.innerHTML = String(summary.innerHTML || "") +
          "<br>🔥 <b>PERFECT STREAK ×" + streak + "</b> — momentum bonus +" + xp + " XP!";
        if (typeof window.addXP === "function") {
          try { window.addXP(xp); } catch (e) { window.__techopsPerfectStreakError = String(e && e.stack || e); }
        }
        if (typeof window.sfx === "function") {
          try { window.sfx("promote"); } catch (e) { /* audio must never break EOD */ }
        }
      }
    } else {
      // messy day or terminated run: momentum breaks
      if (prev.streak !== 0 || prev.day !== eod.day) writeState(eod.day, 0);
    }
  }

  function wrapEndOfDay() {
    if (installedWrapper && window.endOfDay === installedWrapper) return;
    if (typeof window.endOfDay !== "function") return;
    var orig = window.endOfDay;
    var wrapper = function () {
      var ret = orig.apply(this, arguments); // original (incl. v6) first; exceptions propagate
      handle();
      return ret;
    };
    window.endOfDay = wrapper;
    installedWrapper = wrapper;
  }

  wrapEndOfDay();
  if (typeof window.endOfDay !== "function" && window.document) {
    window.document.addEventListener("DOMContentLoaded", wrapEndOfDay);
  }

  window.TechOpsPerfectStreak = {
    KEY: KEY,
    peek: function () { return readState(); },
    reset: function () { var ls = store(); if (ls) { try { ls.removeItem(KEY); } catch (e) { } } },
  };
})();

/* ============================================================
   TechOps Hero — R1 night feel: low-HP danger warning (verifier v8)
   Night mode shows HP pips, but nothing tells the player they're one
   mistake from losing the night. Now danger is legible: a warning at
   ≤25 HP, an urgent escalation at ≤10 HP, re-armed above 45.

   Additive module: wraps the global step() like the combo-rewards and
   coach slices. Night state is reached via the lexical global
   S.nightMode (never window.S); TechOpsNightCombat owns its own combat
   bookkeeping, so we stay silent while it is active.
   ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var WARN_HP = 25, CRIT_HP = 10, REARM_HP = 45;
  var WARN_MSG = "⚠️ CRITICAL HP — block (K), dash out (Shift), or fall back!";
  var CRIT_MSG = "🚨 ONE HIT FROM DOWN — get clear NOW!";

  var lastNM = null; // object identity: a new night resets automatically
  var stage = 0;     // 0 = healthy, 1 = warned, 2 = critical-escalated
  var stepWrapped = false;

  function now() {
    return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  }
  function nightState() {
    try { return (typeof S !== "undefined" && S && S.nightMode) ? S.nightMode : null; } catch (e) { return null; }
  }
  function nightCombatActive(NM) {
    try { return !!(window.TechOpsNightCombat && window.TechOpsNightCombat.active(NM)); } catch (e) { return false; }
  }
  function playBad() {
    try { if (typeof sfx === "function") sfx("bad"); } catch (e) { /* audio must never break the loop */ }
  }

  function watch() {
    var NM = nightState();
    if (!NM || nightCombatActive(NM)) return;
    if (NM !== lastNM) { lastNM = NM; stage = 0; }
    var hp = typeof NM.hp === "number" ? NM.hp : 100;
    if (hp > REARM_HP) { stage = 0; return; }
    var want = hp <= CRIT_HP ? 2 : hp <= WARN_HP ? 1 : 0;
    if (want <= stage) return;
    // politeness: never stomp a live message; retry next frame
    if ((NM.msgT || 0) > now()) return;
    NM.msg = want === 2 ? CRIT_MSG : WARN_MSG;
    NM.msgT = now() + 1600;
    playBad();
    stage = want;
  }

  function wrapStep() {
    if (stepWrapped || typeof step !== "function") return;
    stepWrapped = true;
    var orig = step;
    step = function (dt) {
      var r = orig.apply(this, arguments); // original first; exceptions propagate
      try { watch(); } catch (e) { window.__techopsDangerError = String(e && e.stack || e); }
      return r;
    };
  }

  wrapStep();
  if (typeof step !== "function" && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", wrapStep);
  }

  window.TechOpsNightDanger = {
    WARN_HP: WARN_HP, CRIT_HP: CRIT_HP, REARM_HP: REARM_HP,
    reset: function () { lastNM = null; stage = 0; },
  };
})();

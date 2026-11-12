// night_combo_rewards.js — combo tiers pay out, and getting hit breaks the streak.
// The night combo counter (NM.combo) was display-only: FOCUS pips filled but a
// long streak earned nothing extra and nothing punished sloppy play. This module
// closes the risk/reward loop without touching night_hooks.js or game.js:
//   - kill cash is multiplied by the active combo tier (x1.5 / x2 / x3)
//   - taking a hit at combo >= 3 breaks the streak (vanilla street combat only;
//     TechOpsNightCombat owns its own combo state when it is active)
// Hooks are load-order independent: nmJab/step are wrapped lazily, retried on
// DOMContentLoaded, and everything no-ops outside a browser environment.
(function () {
  if (typeof window === "undefined") return;

  var TIERS = [
    { min: 12, mult: 3, label: "RAMPAGE" },
    { min: 8, mult: 2, label: "ON FIRE" },
    { min: 5, mult: 1.5, label: "HEATING UP" },
  ];

  function tierFor(combo) {
    for (var i = 0; i < TIERS.length; i++) if (combo >= TIERS[i].min) return TIERS[i];
    return null;
  }

  function now() {
    return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  }

  function nightState() {
    try { return (typeof S !== "undefined" && S && S.nightMode) ? S.nightMode : null; } catch (e) { return null; }
  }

  function nightCombatActive(NM) {
    try { return !!(window.TechOpsNightCombat && window.TechOpsNightCombat.active(NM)); } catch (e) { return false; }
  }

  // Kill-reward hook: wrap nmJab, compare kills/cash before and after. The
  // delta approach works whether the jab runs vanilla or delegates into
  // TechOpsNightCombat.attack — the kill still lands on NM.
  var jabWrapped = false;
  function wrapJab() {
    if (jabWrapped || typeof nmJab !== "function") return;
    jabWrapped = true;
    var orig = nmJab;
    nmJab = function () {
      var before = nightState();
      var kills0 = before ? before.kills : 0, cash0 = before ? before.cash : 0;
      var r = orig.apply(this, arguments);
      var NM = nightState();
      if (NM && NM.kills > kills0) {
        var tier = tierFor(NM.combo || 0); // combo at kill time (nmJab already incremented)
        var base = NM.cash - cash0;
        var bonus = tier ? Math.round(base * (tier.mult - 1)) : 0;
        if (bonus > 0) {
          NM.cash += bonus;
          NM.msg = "🔥 " + tier.label + " ×" + tier.mult + " — kill bonus +$" + bonus;
          NM.msgT = now() + 1300;
          try { if (typeof sfx === "function") sfx("promote"); } catch (e) { }
        }
      }
      return r;
    };
  }

  // Streak observer: wrap the game loop, watch the hp delta per frame. A hit at
  // combo >= 3 breaks the streak. Skipped while TechOpsNightCombat is active —
  // that module owns its own combat bookkeeping.
  var stepWrapped = false;
  function wrapStep() {
    if (stepWrapped || typeof step !== "function") return;
    stepWrapped = true;
    var orig = step;
    step = function (dt) {
      var before = nightState();
      var hp0 = before ? before.hp : null;
      var r = orig.apply(this, arguments);
      var NM = nightState();
      if (NM && hp0 !== null && NM.hp < hp0 && (NM.combo || 0) >= 3 && !nightCombatActive(NM)) {
        NM.combo = 0;
        NM.jabStage = 0;
        NM.msg = "💔 COMBO BROKEN";
        NM.msgT = now() + 900;
      }
      return r;
    };
  }

  wrapJab();
  wrapStep();
  if ((!jabWrapped || !stepWrapped) && typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", function () { wrapJab(); wrapStep(); });
  }

  window.TechOpsComboRewards = { tierFor: tierFor, TIERS: TIERS };
})();

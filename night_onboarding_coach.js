// night_onboarding_coach.js — teach night controls in context, not in one toast.
// enterNight() fires a single 5.2s toast crammed with every control; new players
// miss it or forget it before the first fight. This coach watches the night
// state each frame and surfaces the right hint at the right moment — once per
// night, and only when no combat message is on screen. It touches nothing in
// night_hooks.js or game.js: a lazy step wrapper observes S.nightMode, and hint
// state lives on the NM object, so a new night automatically resets the coach.
(function () {
  if (typeof window === "undefined") return;

  var NM_CAR_X = 26; // matches night_hooks.js — the Charger parks at the left edge

  var HINTS = [
    { id: "move",   msg: "🌃 WASD / arrows to move · Space to jump — again mid-air to flip" },
    { id: "attack", msg: "👊 E to punch — chain 3 hits for a launcher. Rhythm beats mashing!" },
    { id: "defend", msg: "⚠️ It's charging! K to block, or Shift to dash straight through" },
    { id: "clear",  msg: "✅ Street clear — push right → to the next block" },
    { id: "car",    msg: "🚗 E by the Charger to pick a district — or drive HOME to bank the night" },
  ];

  function now() {
    return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  }

  function nightState() {
    try { return (typeof S !== "undefined" && S && S.nightMode) ? S.nightMode : null; } catch (e) { return null; }
  }

  function nightCombatActive(NM) {
    try { return !!(window.TechOpsNightCombat && window.TechOpsNightCombat.active(NM)); } catch (e) { return false; }
  }

  function shown(NM) {
    return NM._coachHints || (NM._coachHints = {});
  }

  function say(NM, hint) {
    // Politeness: never stomp a live combat/street message.
    if ((NM.msgT || 0) > now()) return false;
    NM.msg = hint.msg;
    NM.msgT = now() + 3600;
    return true;
  }

  // One pass of the coach. Exported for tests; the step wrapper calls it.
  function tick(NM) {
    if (!NM || nightCombatActive(NM)) return;
    var seen = shown(NM);
    var enemies = NM.enemies || [];
    var nearest = null, nearestAdx = 1e9, charging = false;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      var adx = Math.abs((e.x + (e.w || 0) / 2) - (NM.x + (NM.w || 0) / 2));
      if (adx < nearestAdx) { nearestAdx = adx; nearest = e; }
      if ((e.windup || 0) >= 8) charging = true;
    }
    var nearCar = NM.x < NM_CAR_X + 150 && !(nearest && nearestAdx < 90);
    // Priority: danger coaching first, then combat, then navigation.
    if (!seen.move && say(NM, HINTS[0])) seen.move = true;
    if (charging && !seen.defend) { if (say(NM, HINTS[2])) seen.defend = true; }
    else if (nearest && nearestAdx < 200 && !seen.attack) { if (say(NM, HINTS[1])) seen.attack = true; }
    else if (NM.clear && !seen.clear) { if (say(NM, HINTS[3])) seen.clear = true; }
    else if (nearCar && !seen.car) { if (say(NM, HINTS[4])) seen.car = true; }
  }

  var stepWrapped = false;
  function wrapStep() {
    if (stepWrapped || typeof step !== "function") return;
    stepWrapped = true;
    var orig = step;
    step = function (dt) {
      var r = orig.apply(this, arguments);
      try { tick(nightState()); } catch (e) { window.__techopsCoachError = String(e && e.stack || e); }
      return r;
    };
  }

  wrapStep();
  if (!stepWrapped && typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", wrapStep);
  }

  window.TechOpsNightCoach = { HINTS: HINTS, tick: tick, reset: function (NM) { if (NM) delete NM._coachHints; } };
})();

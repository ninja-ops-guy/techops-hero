/* TechOps Hero — canonical Mike animation semantics.
 * This file is the authority for which atlas frames may be used for a named
 * gameplay state. Unknown MIKE_ACTIONS frames remain quarantined until they
 * are visually reviewed and explicitly labeled here.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsMikeAnimations = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 2;
  var WALK_FRAME_MS = 135;

  var DAY_SHIFT = Object.freeze({
    atlas: "PLAYER_ATLAS",
    drawSize: 46,
    states: Object.freeze({
      idle_down: Object.freeze({ frames: ["down0"], flip: false }),
      idle_up: Object.freeze({ frames: ["up0"], flip: false }),
      idle_right: Object.freeze({ frames: ["right0"], flip: false }),
      idle_left: Object.freeze({ frames: ["right0"], flip: true }),
      walk_down: Object.freeze({ frames: ["down0", "down1", "down0", "down2"], flip: false }),
      walk_up: Object.freeze({ frames: ["up0", "up1", "up0", "up2"], flip: false }),
      walk_right: Object.freeze({ frames: ["right0", "right1", "right0", "right2"], flip: false }),
      walk_left: Object.freeze({ frames: ["right0", "right1", "right0", "right2"], flip: true }),
      interact: Object.freeze({ frames: ["laptop"], flip: false }),
      thumbs: Object.freeze({ frames: ["thumbs"], flip: false }),
      party: Object.freeze({ frames: ["party"], flip: false })
    })
  });

  var ACTION_ATLAS = Object.freeze({
    atlas: "MIKE_ACTIONS",
    frameCount: 182,
    naming: "f000..f181",
    status: "unclassified",
    sourceStatus: "metadata_only",
    payloadGlobals: Object.freeze(["TO_MIKE_ACTIONS", "__GK_MIKE_ACTIONS"]),
    approvedStates: Object.freeze({}),
    policy: "Do not bind MIKE_ACTIONS frames to gameplay semantics until the source sheet has been visually reviewed, a renderable source payload is present, and the frame range is explicitly labeled in this manifest."
  });

  function stateKey(facing, moving) {
    facing = ["up", "down", "left", "right"].indexOf(facing) >= 0 ? facing : "down";
    return (moving ? "walk_" : "idle_") + facing;
  }

  function stateSpec(key) {
    return DAY_SHIFT.states[key] || null;
  }

  function resolveDayShift(state, tm) {
    state = state || {};
    tm = Number(tm || 0);
    if (state.partyUntil && tm < state.partyUntil) return { state: "party", key: "party", flip: false, index: 0 };
    if (state.thumbsUntil && tm < state.thumbsUntil) return { state: "thumbs", key: "thumbs", flip: false, index: 0 };
    if (state.inDialog) return { state: "interact", key: "laptop", flip: false, index: 0 };
    var semantic = stateKey(state.fx, !!state.moving);
    var spec = stateSpec(semantic) || DAY_SHIFT.states.idle_down;
    var index = spec.frames.length > 1 ? Math.floor(tm / WALK_FRAME_MS) % spec.frames.length : 0;
    return { state: semantic.indexOf("walk_") === 0 ? "walk" : "idle", semantic: semantic, key: spec.frames[index], flip: !!spec.flip, index: index };
  }

  function actionFrameApproved(frameKey) {
    var states = ACTION_ATLAS.approvedStates;
    return Object.keys(states).some(function (name) { return states[name].frames.indexOf(frameKey) >= 0; });
  }

  function actionAtlasSource(scope) {
    scope = scope || root || {};
    var atlas = scope[ACTION_ATLAS.atlas];
    if (atlas && typeof atlas.src === "string" && atlas.src.length > 0) return { kind: "atlas_src", value: atlas.src };
    for (var i = 0; i < ACTION_ATLAS.payloadGlobals.length; i++) {
      var name = ACTION_ATLAS.payloadGlobals[i];
      if (typeof scope[name] === "string" && scope[name].length > 0) return { kind: "payload", name: name, value: scope[name] };
    }
    return null;
  }

  function actionAtlasReady(scope) {
    var source = actionAtlasSource(scope);
    var atlas = (scope || root || {})[ACTION_ATLAS.atlas];
    return !!(source && atlas && atlas.frames && Object.keys(atlas.frames).length === ACTION_ATLAS.frameCount);
  }

  return {
    VERSION: VERSION,
    WALK_FRAME_MS: WALK_FRAME_MS,
    DAY_SHIFT: DAY_SHIFT,
    ACTION_ATLAS: ACTION_ATLAS,
    stateKey: stateKey,
    stateSpec: stateSpec,
    resolveDayShift: resolveDayShift,
    actionFrameApproved: actionFrameApproved,
    actionAtlasSource: actionAtlasSource,
    actionAtlasReady: actionAtlasReady
  };
});

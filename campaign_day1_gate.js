/* TechOps Hero — canonical Day 1 runtime gate.
 * Keeps the base roguelite clock and procedural ticket interactions dormant until
 * Campaign Director commits day_work_unlocked. This is a bridge, not story authority.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsDay1Gate = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  function campaignState() {
    if (!root || !root.TechOpsCampaign || typeof root.TechOpsCampaign.load !== "function") return null;
    try { return root.TechOpsCampaign.load(root.localStorage || null); } catch (e) { return null; }
  }

  function isCanonicalDay1Locked() {
    var game = root && root.S;
    var campaign = campaignState();
    return !!(game && game.day === 1 && campaign && !campaign.flags.day_work_unlocked && !campaign.flags.tuesday_morning_reached);
  }

  function gateStatus() {
    var campaign = campaignState();
    return {
      locked: isCanonicalDay1Locked(),
      dayWorkUnlocked: !!(campaign && campaign.flags.day_work_unlocked),
      phase: campaign && campaign.campaign ? campaign.campaign.phase : null
    };
  }

  function installClockGate() {
    if (!root || root.__techopsDay1ClockGateInstalled || typeof root.advanceClock !== "function") return false;
    root.__techopsDay1ClockGateInstalled = true;
    var original = root.advanceClock;
    root.advanceClock = function (minutes) {
      if (isCanonicalDay1Locked() && Number(minutes) > 0) {
        var game = root.S;
        if (game) {
          game.meta = game.meta || {};
          game.meta.ticketTimersActive = false;
          game.meta.dayWorkUnlocked = false;
        }
        return game ? game.clock : undefined;
      }
      return original.apply(this, arguments);
    };
    return true;
  }

  function installInteractionGate() {
    if (!root || root.__techopsDay1InteractionGateInstalled || typeof root.interact !== "function") return false;
    root.__techopsDay1InteractionGateInstalled = true;
    var original = root.interact;
    root.interact = function () {
      if (!isCanonicalDay1Locked()) return original.apply(this, arguments);

      // Native Act I owns authored contacts and may need to intercept first. If the
      // native wrapper is already installed, it should be outside this bridge in the
      // call chain. This fallback only blocks unresolved base/procedural work.
      if (root.S && !root.S.inDialog && typeof root.dlg === "function") {
        root.dlg("SHIFT NOT STARTED",
          "The queue is visible, but its clock is paused. Complete standup and the workstation opening before taking ordinary Day 1 work.",
          [
            { t: "Open canonical workstation", f: function () {
              if (root.TechOpsCampaignNativeAct1 && typeof root.TechOpsCampaignNativeAct1.openWorkstation === "function") {
                root.TechOpsCampaignNativeAct1.openWorkstation();
              }
            } },
            { t: "Back", f: function () { if (typeof root.closeDlg === "function") root.closeDlg(); } }
          ]);
        return;
      }
      return undefined;
    };
    return true;
  }

  function syncGameMeta() {
    var game = root && root.S;
    var campaign = campaignState();
    if (!game || !campaign) return false;
    game.meta = game.meta || {};
    game.meta.dayWorkUnlocked = !!campaign.flags.day_work_unlocked;
    game.meta.ticketTimersActive = !!campaign.flags.day_work_unlocked;
    return true;
  }

  function install() {
    var clock = installClockGate();
    var interaction = installInteractionGate();
    syncGameMeta();
    return clock || interaction;
  }

  var api = {
    campaignState: campaignState,
    isCanonicalDay1Locked: isCanonicalDay1Locked,
    gateStatus: gateStatus,
    installClockGate: installClockGate,
    installInteractionGate: installInteractionGate,
    syncGameMeta: syncGameMeta,
    install: install
  };

  if (root && root.document) {
    if (root.document.readyState === "loading" && root.document.addEventListener) root.document.addEventListener("DOMContentLoaded", install);
    else install();
  }
  return api;
});
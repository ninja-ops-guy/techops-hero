/* TechOps Hero - native Act I campaign integration.
 * Moves the New Game -> Tuesday Morning contract out of the desk-only adapter
 * and into ordinary Day 1 world interactions.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignNativeAct1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var DEFAULT_ASSET_BASE = "assets/campaign/";

  var NATIVE_ASSET_BINDINGS = {
    standup: [
      "ui.standup.board",
      "ui.standup.ticket_card",
      "ui.standup.owner_badge"
    ],
    workstation: [
      "workstation.felicia.video_frame",
      "workstation.orpheus.glitch_frame",
      "workstation.corporate_aircraft_panel"
    ],
    shipping: [
      "shipping.dock_background",
      "shipping.clerk.idle",
      "shipping.label_printer",
      "shipping.printed_label_success"
    ],
    plating: [
      "plating.line_background",
      "plating.operator.idle",
      "plating.workstation_cracked",
      "plating.line_stopped_display"
    ],
    access: [
      "ui.standup.owner_badge"
    ]
  };

  var CONTACTS = {
    standup: {
      id: "campaign_standup",
      name: "STANDUP BOARD",
      face: "BOARD",
      assetSlot: "ui.standup.board",
      fallback: { x: 34, y: 12 }
    },
    shipping: {
      id: "campaign_shipping",
      ticketId: "shipping_cannot_print",
      name: "SHIPPING CLERK",
      dept: "Shipping",
      face: "SHIP",
      biome: "factory",
      assetSlot: "shipping.clerk.idle",
      backgroundAssetSlot: "shipping.dock_background",
      fallback: { x: 8, y: 34 }
    },
    plating: {
      id: "campaign_plating",
      ticketId: "plating_workstation_down",
      name: "PLATING OPERATOR",
      dept: "Manufacturing",
      face: "LINE",
      biome: "factory",
      assetSlot: "plating.operator.idle",
      backgroundAssetSlot: "plating.line_background",
      fallback: { x: 18, y: 35 }
    },
    access: {
      id: "campaign_access",
      ticketId: "impossible_access_event",
      name: "SECURITY OPS",
      dept: "Security",
      face: "SEC",
      biome: "office",
      assetSlot: "ui.standup.owner_badge",
      fallback: { x: 38, y: 12 }
    }
  };

  var TICKET_COPY = {
    shipping_cannot_print: {
      title: "SHIPPING CANNOT PRINT",
      body: "The clerk does not have a printer issue. She has trucks waiting. The queue accepts jobs, then drops customs labels before they print.",
      verify: "The customs label prints and Shipping confirms the label is accurate.",
      assetContext: "shipping"
    },
    plating_workstation_down: {
      title: "PLATING WORKSTATION DOWN",
      body: "The operator does not have a Windows issue. He has a line that cannot move. The workstation restarted overnight and never came back.",
      verify: "The operator completes a real production interaction and confirms the line can resume.",
      assetContext: "plating"
    },
    impossible_access_event: {
      title: "IMPOSSIBLE ACCESS EVENT",
      body: "Badge ID: M.OLIVEFIELD<br>Door: SECTOR04-EAST<br>Timestamp: 02:13<br>Controller ACK: VALID<br><br>Mike was not there.",
      verify: "The record is not closed as solved. It is documented as identity evidence.",
      assetContext: "access"
    }
  };

  function act1() {
    if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required");
    return root.TechOpsCampaign;
  }

  function runtime() {
    return root && root.TechOpsCampaignRuntime ? root.TechOpsCampaignRuntime : null;
  }

  function sector04() {
    return root && root.TechOpsSector04 ? root.TechOpsSector04 : null;
  }

  function sector04Runtime() {
    return root && root.TechOpsSector04Runtime ? root.TechOpsSector04Runtime : null;
  }

  function assetsApi() {
    return root && root.TechOpsCampaignAssets ? root.TechOpsCampaignAssets : null;
  }

  function assetFilename(slotId) {
    var api = assetsApi();
    return api && typeof api.slotFilename === "function" ? api.slotFilename(slotId) : slotId + ".png";
  }

  function normalizeBasePath(basePath) {
    basePath = basePath || DEFAULT_ASSET_BASE;
    return basePath.charAt(basePath.length - 1) === "/" ? basePath : basePath + "/";
  }

  function assetUrl(slotId, basePath) {
    return normalizeBasePath(basePath || (root && root.TECHOPS_CAMPAIGN_ASSET_BASE) || DEFAULT_ASSET_BASE) + assetFilename(slotId);
  }

  function assetsForContext(contextId) {
    return (NATIVE_ASSET_BINDINGS[contextId] || []).slice();
  }

  function assetUrlsForContext(contextId, basePath) {
    return assetsForContext(contextId).map(function (slotId) {
      return { slot: slotId, url: assetUrl(slotId, basePath) };
    });
  }

  function setAssetContext(contextId) {
    var slots = assetsForContext(contextId);
    var context = {
      id: contextId,
      slots: slots,
      urls: slots.map(function (slotId) { return assetUrl(slotId); })
    };
    if (root) root.__techopsCampaignNativeAct1Assets = context;
    return context;
  }

  function storage() {
    return root && root.localStorage ? root.localStorage : null;
  }

  function loadState() {
    return act1().load(storage());
  }

  function saveState(state) {
    act1().save(state, storage());
    return state;
  }

  function gameState() {
    return root && root.S ? root.S : null;
  }

  function hasGameFunction(name) {
    return root && typeof root[name] === "function";
  }

  function callDialog(name, body, options) {
    if (hasGameFunction("dlg")) {
      root.dlg(name, body, options || []);
      return true;
    }
    return false;
  }

  function closeDialog() {
    if (hasGameFunction("closeDlg")) root.closeDlg();
  }

  function notify(message, ms) {
    if (hasGameFunction("toast")) root.toast(message, ms || 3600);
  }

  function isAdjacent(a, b) {
    if (!a || !b) return false;
    if (hasGameFunction("adjacent")) return root.adjacent(a, b);
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
  }

  function openTile(map, pos) {
    return !!(map && map[pos.y] && map[pos.y][pos.x] === 0);
  }

  function findSpot(map, contact, used) {
    var pos = null;
    if (contact.biome && typeof root.spotInBiome === "function") {
      try { pos = root.spotInBiome(map, contact.biome); } catch (e) { pos = null; }
    }
    if (!pos || !openTile(map, pos)) pos = { x: contact.fallback.x, y: contact.fallback.y };
    var key = pos.x + "," + pos.y;
    while (used[key]) {
      pos = { x: Math.min(pos.x + 1, 40), y: pos.y };
      key = pos.x + "," + pos.y;
    }
    used[key] = true;
    if (map && map[pos.y]) map[pos.y][pos.x] = 0;
    return pos;
  }

  function addContact(state, contact, pos) {
    if (!state.npcs) state.npcs = [];
    if (state.npcs.some(function (npc) { return npc.id === contact.id; })) return;
    state.npcs.push({
      id: contact.id,
      name: contact.name,
      dept: contact.dept || "IT",
      face: contact.face,
      assetSlot: contact.assetSlot || null,
      backgroundAssetSlot: contact.backgroundAssetSlot || null,
      x: pos.x,
      y: pos.y,
      ambient: true,
      campaignAct1: contact.ticketId || contact.id
    });
  }

  function ensureWorld() {
    var state = gameState();
    if (!state || !state.map) return false;
    if (state.day !== 1) return false;
    var campaign = loadState();
    if (campaign.flags.tuesdayMorningReached) return false;

    var used = {};
    var native = {};
    Object.keys(CONTACTS).forEach(function (key) {
      var contact = CONTACTS[key];
      var pos = findSpot(state.map, contact, used);
      native[key] = pos;
      addContact(state, contact, pos);
    });
    native.sector04Door = state._nightObjs && state._nightObjs.door ? {
      x: state._nightObjs.door.x,
      y: state._nightObjs.door.y
    } : { x: 20, y: 28 };
    state.meta = state.meta || {};
    state.meta.campaignAct1Native = native;
    return true;
  }

  function withAssignedState() {
    var state = loadState();
    if (!state.flags.ticketAssignmentsConfirmed) {
      var rt = runtime();
      state = rt ? rt.confirmAssignments("firsthand") : state;
    }
    return state;
  }

  function openStandup() {
    setAssetContext("standup");
    var state = loadState();
    if (state.flags.ticketAssignmentsConfirmed) {
      return callDialog("CAMPAIGN STANDUP",
        "Every active ticket has exactly one owner.<br><br>Shipping -> Mike<br>Plating -> Amit<br>Impossible Access -> Mike",
        [{ t: "Back to work", f: closeDialog }]);
    }
    return callDialog("CAMPAIGN STANDUP",
      "The board is not flavor. The day cannot begin until every active problem belongs to someone.",
      [
        { t: "Assign queue: Mike investigates access", f: function () {
          var rt = runtime();
          if (rt) rt.confirmAssignments("firsthand");
          callDialog("OWNERSHIP CONFIRMED",
            "Shipping -> Mike<br>Plating -> Amit<br>Impossible Access -> Mike<br><br>Every problem belongs to someone before it can be solved.",
            [{ t: "Open workstation", f: openWorkstation }]);
        } },
        { t: "Delegate Impossible Access to Security", f: function () {
          var rt = runtime();
          if (rt) rt.confirmAssignments("delegated");
          callDialog("OWNERSHIP CONFIRMED",
            "Shipping -> Mike<br>Plating -> Amit<br>Impossible Access -> Security Ops<br><br>Delegation changes perspective, not reality.",
            [{ t: "Open workstation", f: openWorkstation }]);
        } },
        { t: "Back", f: closeDialog }
      ]);
  }

  function openWorkstation() {
    setAssetContext("workstation");
    var state = loadState();
    if (!state.flags.ticketAssignmentsConfirmed) return openStandup();
    if (!state.flags.workstationOpened) {
      var rt = runtime();
      state = rt ? rt.runWorkstation() : state;
    }
    return callDialog("ENGINEERING THE HUMAN CONNECTION",
      "Mike's monitor becomes the world: queue, messages, overnight alerts, company blog.<br><br>Felicia plays violin aboard the aircraft. Behind her: antennas, racks, drones. A telemetry graphic glitches for less than a second:<br><br><b>ORPHEUS</b><br><br>Gone. The clock begins.",
      [{ t: "Start day shift", f: closeDialog }]);
  }

  function resolveTicket(ticketId) {
    setAssetContext(TICKET_COPY[ticketId] && TICKET_COPY[ticketId].assetContext);
    var campaign = withAssignedState();
    if (!campaign.flags.workstationOpened) {
      return callDialog("WORKSTATION REQUIRED",
        "Mike needs to see the queue, alerts, and Felicia video before the day shift opens.",
        [{ t: "Open workstation", f: openWorkstation }, { t: "Back", f: closeDialog }]);
    }
    if (campaign.tickets[ticketId]) {
      return callDialog(TICKET_COPY[ticketId].title,
        "Already verified.<br><br>" + TICKET_COPY[ticketId].verify,
        [{ t: "Back", f: closeDialog }]);
    }
    act1().resolveTicket(campaign, ticketId, {
      technicalResolution: true,
      verification: "strong",
      humanOutcome: "restored"
    });
    saveState(campaign);
    return callDialog(TICKET_COPY[ticketId].title,
      TICKET_COPY[ticketId].body + "<br><br><b>VERIFY:</b> " + TICKET_COPY[ticketId].verify,
      [{ t: "Document closure", f: closeDialog }]);
  }

  function recordAccessEvidence() {
    setAssetContext("access");
    var campaign = withAssignedState();
    if (!campaign.flags.workstationOpened) {
      return callDialog("WORKSTATION REQUIRED",
        "Mike needs the day-shift context before he can investigate access control responsibly.",
        [{ t: "Open workstation", f: openWorkstation }, { t: "Back", f: closeDialog }]);
    }
    act1().recordGhostEvidence(campaign, {
      id: "badge_impossible_access",
      perspective: "firsthand",
      reliability: "high",
      completeness: "partial",
      discoveredBy: "mike",
      authority: "access_control"
    });
    saveState(campaign);
    return callDialog(TICKET_COPY.impossible_access_event.title,
      TICKET_COPY.impossible_access_event.body + "<br><br><b>VALID IDENTITY != VERIFIED PRESENCE</b><br><br>Documentation is what remains when memory becomes unreliable.",
      [{ t: "Continue", f: closeDialog }]);
  }

  function sector04Door() {
    var campaign = loadState();
    if (!campaign.flags.workstationOpened) {
      return callDialog("SECTOR 04 LOCKED",
        "Night Walker cannot begin until Mike has opened the workstation and the day has actually started.",
        [{ t: "Back", f: closeDialog }]);
    }
    return callDialog("SECTOR 04 - NIGHT WALKER",
      "Rain strikes the hangar roof. Interfaces become physical. Permissions become doors.<br><br>Damage can suppress the Access Guard. Understanding can defeat it.",
      [
        { t: "Enter Sector 04", f: function () {
          var sxRuntime = sector04Runtime();
          if (sxRuntime && typeof sxRuntime.enterBrowser === "function" && root.document) {
            sxRuntime.enterBrowser();
            return;
          }
          var sx = sector04();
          if (sx) {
            var campaign = loadState();
            sx.enter(campaign);
            saveState(campaign);
          } else {
            var rt = runtime();
            if (rt) rt.enterSector04();
          }
          insightSector04();
        } },
        { t: "Use normal night crawl", f: function () {
          closeDialog();
          if (typeof root.enterNight === "function") root.enterNight();
        } },
        { t: "Back", f: closeDialog }
      ]);
  }

  function insightSector04() {
    var sx = sector04();
    var result;
    if (sx) {
      var campaign = loadState();
      result = sx.insight(campaign);
      saveState(campaign);
    } else {
      var rt = runtime();
      result = rt ? rt.insightAccessGuard() : act1().insightAccessGuard(loadState());
    }
    if (!result.success) {
      return callDialog("SECTOR 04 INSIGHT",
        result.message + "<br><br>The player can still fight, but Mike cannot yet understand the controller dependency.",
        [{ t: "Retreat", f: closeDialog }]);
    }
    if (sx) {
      var clueState = loadState();
      sx.inspect(clueState, "purple_damage");
      saveState(clueState);
    }
    return callDialog("ACCESS GUARD",
      result.message + "<br><br>An enemy collapses with purple damage already burned through its body. Mike did not cause it.",
      [
        { t: "Suppress manifestation", f: suppressSector04 },
        { t: "Retreat", f: closeDialog }
      ]);
  }

  function suppressSector04() {
    var campaign = loadState();
    var sx = sector04();
    if (sx) {
      sx.suppress(campaign);
      sx.insight(campaign);
    } else {
      act1().suppressAccessGuard(campaign, 15000);
      act1().insightAccessGuard(campaign);
    }
    saveState(campaign);
    return callDialog("ACCESS GUARD SUPPRESSED",
      "The body falls. The incident remains.<br><br>Damage created time. It did not solve the dependency.",
      [{ t: "Sever identity controller", f: completeSector04 }]);
  }

  function completeSector04() {
    var campaign = loadState();
    var sx = sector04();
    if (sx) {
      sx.severController(campaign);
      sx.inspect(campaign, "locked_violin_door");
      sx.terminal(campaign);
      sx.complete(campaign);
    } else {
      act1().severAccessController(campaign);
      act1().transitionToTuesday(campaign);
    }
    saveState(campaign);
    return callDialog("TUESDAY MORNING",
      "A locked door stands beyond the arena. From behind it: one violin note.<br><br><b>YOU ARE FIXING THE SYMPTOMS.</b><br><br>Mike: Then show me the problem.<br><br>Morning comes. The queue is waiting.",
      [{ t: "Continue", f: closeDialog }]);
  }

  function currentWorldProgress() {
    var campaign = loadState();
    return {
      phase: campaign.campaign.phase,
      day: campaign.campaign.day,
      assigned: campaign.flags.ticketAssignmentsConfirmed,
      workstation: campaign.flags.workstationOpened,
      shipping: !!campaign.tickets.shipping_cannot_print,
      plating: !!campaign.tickets.plating_workstation_down,
      accessEvidence: campaign.evidence.ghostIdentityEvidence.status,
      sector04: campaign.flags.sector04Completed,
      tuesday: campaign.flags.tuesdayMorningReached
    };
  }

  function install() {
    if (root.__techopsCampaignNativeAct1Installed) return false;
    root.__techopsCampaignNativeAct1Installed = true;

    if (typeof root.setupDay === "function") {
      var originalSetupDay = root.setupDay;
      root.setupDay = function () {
        originalSetupDay.apply(this, arguments);
        ensureWorld();
      };
    }

    if (typeof root.interact === "function") {
      var originalInteract = root.interact;
      root.interact = function () {
        var state = gameState();
        var native = state && state.meta && state.meta.campaignAct1Native;
        if (state && !state.inDialog && !state.inBattle && !state.nightMode && native) {
          var p = { x: state.px, y: state.py };
          if (isAdjacent(p, native.standup)) return openStandup();
          if (isAdjacent(p, native.shipping)) return resolveTicket("shipping_cannot_print");
          if (isAdjacent(p, native.plating)) return resolveTicket("plating_workstation_down");
          if (isAdjacent(p, native.access)) return recordAccessEvidence();
        }
        return originalInteract.apply(this, arguments);
      };
    }

    if (typeof root.nightDoorDialog === "function") {
      var originalNightDoorDialog = root.nightDoorDialog;
      root.nightDoorDialog = function () {
        var campaign = loadState();
        if (campaign.flags.workstationOpened && campaign.campaign.day === 1 && !campaign.flags.tuesdayMorningReached) return sector04Door();
        return originalNightDoorDialog.apply(this, arguments);
      };
    }
    return true;
  }

  var api = {
    CONTACTS: CONTACTS,
    NATIVE_ASSET_BINDINGS: NATIVE_ASSET_BINDINGS,
    assetFilename: assetFilename,
    assetUrl: assetUrl,
    assetsForContext: assetsForContext,
    assetUrlsForContext: assetUrlsForContext,
    setAssetContext: setAssetContext,
    ensureWorld: ensureWorld,
    openStandup: openStandup,
    openWorkstation: openWorkstation,
    resolveTicket: resolveTicket,
    recordAccessEvidence: recordAccessEvidence,
    sector04Door: sector04Door,
    insightSector04: insightSector04,
    completeSector04: completeSector04,
    currentWorldProgress: currentWorldProgress,
    install: install
  };

  if (root && root.document) {
    if (root.document.readyState === "loading" && root.document.addEventListener) {
      root.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }

  return api;
});

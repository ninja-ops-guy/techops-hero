/* TechOps Hero - native Act I campaign integration.
 * Canonical Day 1 world + first-person workstation flow.
 * Story authority remains campaign_act1.js; this module only presents/bridges it.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignNativeAct1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var DEFAULT_ASSET_BASE = "assets/campaign/";
  var WORKSTATION_TABS = ["QUEUE", "TEAMS", "ALERTS", "COMPANY", "MUSIC"];

  var NATIVE_ASSET_BINDINGS = {
    standup: ["ui.standup.board", "ui.standup.ticket_card", "ui.standup.owner_badge"],
    workstation: ["workstation.felicia.video_frame", "workstation.orpheus.glitch_frame", "workstation.corporate_aircraft_panel"],
    shipping: ["shipping.dock_background", "shipping.clerk.idle", "shipping.label_printer", "shipping.printed_label_success"],
    plating: ["plating.line_background", "plating.operator.idle", "plating.workstation_cracked", "plating.line_stopped_display"],
    access: ["ui.standup.owner_badge"]
  };

  var CONTACTS = {
    standup: { id: "campaign_standup", name: "STANDUP BOARD", face: "BOARD", assetSlot: "ui.standup.board", fallback: { x: 34, y: 12 } },
    shipping: { id: "campaign_shipping", ticketId: "shipping_cannot_print", name: "SHIPPING CLERK", dept: "Shipping", face: "SHIP", biome: "factory", assetSlot: "shipping.clerk.idle", backgroundAssetSlot: "shipping.dock_background", fallback: { x: 8, y: 34 } },
    plating: { id: "campaign_plating", ticketId: "plating_workstation_down", name: "PLATING OPERATOR", dept: "Manufacturing", face: "LINE", biome: "factory", assetSlot: "plating.operator.idle", backgroundAssetSlot: "plating.line_background", fallback: { x: 18, y: 35 } },
    access: { id: "campaign_access", ticketId: "impossible_access_event", name: "SECURITY OPS", dept: "Security", face: "SEC", biome: "office", assetSlot: "ui.standup.owner_badge", fallback: { x: 38, y: 12 } }
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
  function runtime() { return root && root.TechOpsCampaignRuntime ? root.TechOpsCampaignRuntime : null; }
  function sector04() { return root && root.TechOpsSector04 ? root.TechOpsSector04 : null; }
  function sector04Runtime() { return root && root.TechOpsSector04Runtime ? root.TechOpsSector04Runtime : null; }
  function assetsApi() { return root && root.TechOpsCampaignAssets ? root.TechOpsCampaignAssets : null; }
  function storage() { return root && root.localStorage ? root.localStorage : null; }
  function loadState() { return act1().load(storage()); }
  function saveState(state) { act1().save(state, storage()); return state; }
  function gameState() { return root && root.S ? root.S : null; }
  function hasGameFunction(name) { return root && typeof root[name] === "function"; }
  function callDialog(name, body, options) { if (hasGameFunction("dlg")) { root.dlg(name, body, options || []); return true; } return false; }
  function closeDialog() { if (hasGameFunction("closeDlg")) root.closeDlg(); }
  function notify(message, ms) { if (hasGameFunction("toast")) root.toast(message, ms || 3600); }
  function isAdjacent(a, b) { if (!a || !b) return false; if (hasGameFunction("adjacent")) return root.adjacent(a, b); return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; }

  function assetFilename(slotId) { var api = assetsApi(); return api && typeof api.slotFilename === "function" ? api.slotFilename(slotId) : slotId + ".png"; }
  function normalizeBasePath(basePath) { basePath = basePath || DEFAULT_ASSET_BASE; return basePath.charAt(basePath.length - 1) === "/" ? basePath : basePath + "/"; }
  function assetUrl(slotId, basePath) { return normalizeBasePath(basePath || (root && root.TECHOPS_CAMPAIGN_ASSET_BASE) || DEFAULT_ASSET_BASE) + assetFilename(slotId); }
  function assetsForContext(contextId) { return (NATIVE_ASSET_BINDINGS[contextId] || []).slice(); }
  function assetUrlsForContext(contextId, basePath) { return assetsForContext(contextId).map(function (slotId) { return { slot: slotId, url: assetUrl(slotId, basePath) }; }); }
  function setAssetContext(contextId) {
    var slots = assetsForContext(contextId);
    var context = { id: contextId, slots: slots, urls: slots.map(function (slotId) { return assetUrl(slotId); }) };
    if (root) root.__techopsCampaignNativeAct1Assets = context;
    return context;
  }

  function openTile(map, pos) { return !!(map && map[pos.y] && map[pos.y][pos.x] === 0); }
  function findSpot(map, contact, used) {
    var pos = null;
    if (contact.biome && typeof root.spotInBiome === "function") {
      try { pos = root.spotInBiome(map, contact.biome); } catch (e) { pos = null; }
    }
    if (!pos || !openTile(map, pos)) pos = { x: contact.fallback.x, y: contact.fallback.y };
    var key = pos.x + "," + pos.y;
    while (used[key]) { pos = { x: Math.min(pos.x + 1, 40), y: pos.y }; key = pos.x + "," + pos.y; }
    used[key] = true;
    if (map && map[pos.y]) map[pos.y][pos.x] = 0;
    return pos;
  }
  function addContact(state, contact, pos) {
    if (!state.npcs) state.npcs = [];
    if (state.npcs.some(function (npc) { return npc.id === contact.id; })) return;
    state.npcs.push({ id: contact.id, name: contact.name, dept: contact.dept || "IT", face: contact.face, assetSlot: contact.assetSlot || null, backgroundAssetSlot: contact.backgroundAssetSlot || null, x: pos.x, y: pos.y, ambient: true, campaignAct1: contact.ticketId || contact.id });
  }
  function ensureWorld() {
    var state = gameState();
    if (!state || !state.map || state.day !== 1) return false;
    var campaign = loadState();
    if (campaign.flags.tuesday_morning_reached) return false;
    var used = {}, native = {};
    Object.keys(CONTACTS).forEach(function (key) { var contact = CONTACTS[key]; var pos = findSpot(state.map, contact, used); native[key] = pos; addContact(state, contact, pos); });
    native.sector04Door = state._nightObjs && state._nightObjs.door ? { x: state._nightObjs.door.x, y: state._nightObjs.door.y } : { x: 20, y: 28 };
    state.meta = state.meta || {};
    state.meta.campaignAct1Native = native;
    return true;
  }

  function withAssignedState() {
    var state = loadState();
    if (!state.flags.ticket_assignments_confirmed) {
      var rt = runtime();
      state = rt ? rt.confirmAssignments("firsthand") : state;
    }
    return state;
  }

  function openStandup() {
    setAssetContext("standup");
    var state = loadState();
    if (state.flags.ticket_assignments_confirmed) {
      return callDialog("CAMPAIGN STANDUP", "Every active ticket has exactly one owner.<br><br>Shipping -> Mike<br>Plating -> Amit<br>Impossible Access -> " + (state.assignments.impossible_access_event === "security" ? "Security Ops" : "Mike"), [{ t: state.flags.day_work_unlocked ? "Back to work" : "Open workstation", f: state.flags.day_work_unlocked ? closeDialog : openWorkstation }]);
    }
    return callDialog("CAMPAIGN STANDUP", "The board is not flavor. The day cannot begin until every active problem belongs to someone.", [
      { t: "Assign queue: Mike investigates access", f: function () { var rt = runtime(); if (rt) rt.confirmAssignments("firsthand"); callDialog("OWNERSHIP CONFIRMED", "Shipping -> Mike<br>Plating -> Amit<br>Impossible Access -> Mike<br><br>Every problem belongs to someone before it can be solved.", [{ t: "Open workstation", f: openWorkstation }]); } },
      { t: "Delegate Impossible Access to Security", f: function () { var rt = runtime(); if (rt) rt.confirmAssignments("delegated"); callDialog("OWNERSHIP CONFIRMED", "Shipping -> Mike<br>Plating -> Amit<br>Impossible Access -> Security Ops<br><br>Delegation changes perspective, not reality.", [{ t: "Open workstation", f: openWorkstation }]); } },
      { t: "Back", f: closeDialog }
    ]);
  }

  function ensureWorkstationChecked(state) {
    if (!state.flags.workstation_checked) {
      act1().checkWorkstation(state);
      saveState(state);
    }
    return state;
  }

  function workstationStatus(state) {
    return [
      "STANDUP " + (state.flags.standup_completed ? "✓" : "—"),
      "WORKSTATION " + (state.flags.workstation_checked ? "✓" : "—"),
      "MUSIC " + (state.flags.red_in_mirror_heard ? "✓" : "—"),
      "COMPANY " + (state.flags.felicia_video_watched ? "✓" : "—"),
      "DAY SHIFT " + (state.flags.day_work_unlocked ? "UNLOCKED" : "LOCKED")
    ].join(" · ");
  }

  function workstationOptions() {
    return WORKSTATION_TABS.map(function (tab) { return { t: tab, f: function () { openWorkstationTab(tab); } }; }).concat([{ t: "Exit workstation", f: closeDialog }]);
  }

  function openWorkstation() {
    setAssetContext("workstation");
    var state = loadState();
    if (!state.flags.ticket_assignments_confirmed) return openStandup();
    state = ensureWorkstationChecked(state);
    return callDialog("MIKE // WORKSTATION", "The monitor fills Mike's field of view. No quest marker, no shortcut—just the systems the shift actually runs through.<br><br><b>" + workstationStatus(state) + "</b>", workstationOptions());
  }

  function openWorkstationTab(tab) {
    setAssetContext("workstation");
    var state = ensureWorkstationChecked(loadState());
    if (tab === "QUEUE") {
      return callDialog("WORKSTATION // QUEUE", "<b>DAY 1 OWNERSHIP</b><br><br>Shipping Cannot Print -> " + (state.assignments.shipping_cannot_print || "UNASSIGNED") + "<br>Plating Workstation Down -> " + (state.assignments.plating_workstation_down || "UNASSIGNED") + "<br>Impossible Access Event -> " + (state.assignments.impossible_access_event || "UNASSIGNED") + "<br><br>Ticket clocks: <b>" + (state.flags.day_work_unlocked ? "RUNNING" : "PAUSED UNTIL OPENING COMPLETE") + "</b>", [{ t: "Back to desktop", f: openWorkstation }]);
    }
    if (tab === "TEAMS") {
      return callDialog("WORKSTATION // TEAMS", "Amit: Plating rebooted overnight and did not recover.<br>Shipping: customs labels are vanishing after submission.<br>Security Ops: overnight access anomaly needs an owner.<br><br>The messages establish people and consequences before symptoms become mechanics.", [{ t: "Back to desktop", f: openWorkstation }]);
    }
    if (tab === "ALERTS") {
      return callDialog("WORKSTATION // ALERTS", "02:13  SECTOR04-EAST  ACCESS GRANTED<br>05:42  PLATING-WS07  SERVICE RECOVERY FAILED<br>07:18  SHIP-LBL02  QUEUE RETRY LIMIT<br><br>Nothing here says conspiracy. It says the morning has work in it.", [{ t: "Back to desktop", f: openWorkstation }]);
    }
    if (tab === "MUSIC") return openMusicTab();
    if (tab === "COMPANY") return openCompanyTab();
    return openWorkstation();
  }

  function openMusicTab() {
    var state = ensureWorkstationChecked(loadState());
    if (state.flags.red_in_mirror_heard) {
      return callDialog("WORKSTATION // MUSIC", "Now playing history: <b>RED IN THE MIRROR</b><br><br>It is just a song in Mike's morning. No evidence flag. No ORPHEUS clue. Meaning can arrive later.", [{ t: "Back to desktop", f: openWorkstation }]);
    }
    return callDialog("WORKSTATION // MUSIC", "A saved track sits in the player: <b>RED IN THE MIRROR</b>.<br><br>The shift has not started yet. Mike can listen before the queue begins to move.", [
      { t: "Play Red in the Mirror", f: function () { var s = loadState(); act1().hearRedInMirror(s); saveState(s); notify("RED IN THE MIRROR — playback logged as ordinary listening"); openMusicTab(); } },
      { t: "Back to desktop", f: openWorkstation }
    ]);
  }

  function openCompanyTab() {
    var state = ensureWorkstationChecked(loadState());
    if (!state.flags.felicia_blog_found) {
      return callDialog("WORKSTATION // COMPANY", "Internal company blog.<br><br><b>ENGINEERING THE HUMAN CONNECTION</b><br>Field systems profile: Felicia — Security Research / Systems Integrations.<br><br>A thumbnail shows an aircraft interior, antenna racks, and a violin case.", [
        { t: "Open Felicia profile", f: function () { var s = loadState(); act1().findFeliciaBlog(s); saveState(s); openCompanyTab(); } },
        { t: "Back to desktop", f: openWorkstation }
      ]);
    }
    if (!state.flags.felicia_video_watched) {
      return callDialog("COMPANY // FELICIA", "Felicia — Security Research / Systems Integrations.<br><br>The company video is available. Mike has not met her yet. This is context, not a reveal.", [
        { t: "Play Engineering the Human Connection", f: playFeliciaVideo },
        { t: "Back to desktop", f: openWorkstation }
      ]);
    }
    if (!state.flags.day_work_unlocked) {
      var blockers = [];
      if (!state.flags.red_in_mirror_heard) blockers.push("listen to Red in the Mirror in MUSIC");
      if (blockers.length) return callDialog("WORKSTATION // COMPANY", "Company video complete.<br><br>The authored opening still requires Mike to " + blockers.join(" and ") + " before the clock begins.", [{ t: "Go to MUSIC", f: openMusicTab }, { t: "Back to desktop", f: openWorkstation }]);
      return callDialog("WORKSTATION // COMPANY", "Company video complete. Queue ownership is confirmed. Mike has checked the workstation. The opening state is coherent.<br><br><b>The ticket clock can begin now.</b>", [
        { t: "CLOCK IN — START DAY SHIFT", f: unlockDayShift },
        { t: "Back to desktop", f: openWorkstation }
      ]);
    }
    return callDialog("WORKSTATION // COMPANY", "ENGINEERING THE HUMAN CONNECTION — viewed.<br><br>Day work is unlocked. The company video remains context; Felicia's first real conversation still happens in daylight.", [{ t: "Back to desktop", f: openWorkstation }]);
  }

  function playFeliciaVideo() {
    return callDialog("ENGINEERING THE HUMAN CONNECTION", "Factories. Aircraft. Fluorescent smiles.<br><br>Felicia plays violin aboard the aircraft. Behind her: antennas, racks, drones.<br><br>A telemetry graphic corrupts for less than a second:<br><b>ORPHEUS</b><br><br>Then the corporate edit continues normally.", [
      { t: "Finish video", f: function () { completeFeliciaVideo(false); } },
      { t: "Skip video", f: function () { completeFeliciaVideo(true); } }
    ]);
  }

  function completeFeliciaVideo(skipped) {
    var state = loadState();
    act1().completeFeliciaVideo(state, { started: true, skipped: !!skipped });
    saveState(state);
    notify(skipped ? "Video skipped deliberately — required state committed" : "Company video complete");
    return openCompanyTab();
  }

  function unlockDayShift() {
    var state = loadState();
    if (!state.flags.red_in_mirror_heard || !state.flags.felicia_video_watched || !state.flags.workstation_checked || !state.flags.standup_completed) {
      return callDialog("OPENING INCOMPLETE", "The day clock cannot start until standup, workstation, music, and company context are complete.", [{ t: "Back to desktop", f: openWorkstation }]);
    }
    act1().unlockDayWork(state);
    saveState(state);
    var gs = gameState();
    if (gs) { gs.meta = gs.meta || {}; gs.meta.dayWorkUnlocked = true; gs.meta.ticketTimersActive = true; }
    notify("DAY SHIFT UNLOCKED — ticket clocks are now active");
    return callDialog("09:00 // DAY SHIFT", "The desktop recedes back into the room.<br><br>Shipping is waiting. Plating is waiting. Security has a contradiction.<br><br><b>Now the clock begins.</b>", [{ t: "Stand up", f: closeDialog }]);
  }

  function resolveTicket(ticketId) {
    setAssetContext(TICKET_COPY[ticketId] && TICKET_COPY[ticketId].assetContext);
    var campaign = withAssignedState();
    if (!campaign.flags.day_work_unlocked) return callDialog("DAY WORK LOCKED", "The queue exists, but its timer has not started. Complete the workstation opening before treating Day 1 tickets.", [{ t: "Open workstation", f: openWorkstation }, { t: "Back", f: closeDialog }]);
    if (campaign.tickets[ticketId]) return callDialog(TICKET_COPY[ticketId].title, "Already verified.<br><br>" + TICKET_COPY[ticketId].verify, [{ t: "Back", f: closeDialog }]);
    act1().resolveTicket(campaign, ticketId, { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
    saveState(campaign);
    return callDialog(TICKET_COPY[ticketId].title, TICKET_COPY[ticketId].body + "<br><br><b>VERIFY:</b> " + TICKET_COPY[ticketId].verify, [{ t: "Document closure", f: closeDialog }]);
  }

  function recordAccessEvidence() {
    setAssetContext("access");
    var campaign = withAssignedState();
    if (!campaign.flags.day_work_unlocked) return callDialog("DAY WORK LOCKED", "Mike needs the complete workstation context before he can investigate access control responsibly.", [{ t: "Open workstation", f: openWorkstation }, { t: "Back", f: closeDialog }]);
    var perspective = campaign.assignments.impossible_access_event === "security" ? "delegated_verified" : "firsthand";
    act1().recordGhostEvidence(campaign, { id: "badge_impossible_access", perspective: perspective, reliability: "high", completeness: "partial", discoveredBy: perspective === "firsthand" ? "mike" : "security", authority: "access_control" });
    saveState(campaign);
    return callDialog(TICKET_COPY.impossible_access_event.title, TICKET_COPY.impossible_access_event.body + "<br><br><b>VALID IDENTITY != VERIFIED PRESENCE</b><br><br>Perspective: " + perspective + ". Documentation is what remains when memory becomes unreliable.", [{ t: "Continue", f: closeDialog }]);
  }

  function sector04Door() {
    var campaign = loadState();
    if (!campaign.flags.day_work_unlocked) return callDialog("SECTOR 04 LOCKED", "Night Walker cannot begin until the authored Day 1 opening has completed and day work is unlocked.", [{ t: "Back", f: closeDialog }]);
    return callDialog("SECTOR 04 - NIGHT WALKER", "Rain strikes the hangar roof. Interfaces become physical. Permissions become doors.<br><br>Damage can suppress the Access Guard. Understanding can defeat it.", [
      { t: "Enter Sector 04", f: function () {
        var sxRuntime = sector04Runtime();
        if (sxRuntime && typeof sxRuntime.enterBrowser === "function" && root.document) { sxRuntime.enterBrowser(); return; }
        var sx = sector04();
        if (sx) { var campaign = loadState(); sx.enter(campaign); saveState(campaign); } else { var rt = runtime(); if (rt) rt.enterSector04(); }
        insightSector04();
      } },
      { t: "Use normal night crawl", f: function () { closeDialog(); if (typeof root.enterNight === "function") root.enterNight(); } },
      { t: "Back", f: closeDialog }
    ]);
  }

  function insightSector04() {
    var sx = sector04(), result;
    if (sx) { var campaign = loadState(); result = sx.insight(campaign); saveState(campaign); }
    else { var rt = runtime(); result = rt ? rt.insightAccessGuard() : act1().insightAccessGuard(loadState()); }
    if (!result.success) return callDialog("SECTOR 04 INSIGHT", result.message + "<br><br>The player can still fight, but Mike cannot yet understand the controller dependency.", [{ t: "Retreat", f: closeDialog }]);
    if (sx) { var clueState = loadState(); sx.inspect(clueState, "purple_damage"); saveState(clueState); }
    return callDialog("ACCESS GUARD", result.message + "<br><br>An enemy collapses with purple damage already burned through its body. Mike did not cause it.", [{ t: "Suppress manifestation", f: suppressSector04 }, { t: "Retreat", f: closeDialog }]);
  }

  function suppressSector04() {
    var campaign = loadState(), sx = sector04();
    if (sx) { sx.suppress(campaign); sx.insight(campaign); }
    else { act1().suppressAccessGuard(campaign, 15000); act1().insightAccessGuard(campaign); }
    saveState(campaign);
    return callDialog("ACCESS GUARD SUPPRESSED", "The body falls. The incident remains.<br><br>Damage created time. It did not solve the dependency.", [{ t: "Sever identity controller", f: completeSector04 }]);
  }

  function completeSector04() {
    var campaign = loadState(), sx = sector04();
    if (sx) { sx.severController(campaign); sx.inspect(campaign, "locked_violin_door"); sx.terminal(campaign); sx.complete(campaign); }
    else { act1().severAccessController(campaign); act1().transitionToTuesday(campaign); }
    saveState(campaign);
    return callDialog("TUESDAY MORNING", "A locked door stands beyond the arena. From behind it: one violin note.<br><br><b>YOU ARE FIXING THE SYMPTOMS.</b><br><br>Mike: Then show me the problem.<br><br>Morning comes. The queue is waiting.", [{ t: "Continue", f: closeDialog }]);
  }

  function currentWorldProgress() {
    var campaign = loadState();
    return {
      phase: campaign.campaign.phase,
      day: campaign.campaign.day,
      assigned: campaign.flags.ticket_assignments_confirmed,
      workstation: campaign.flags.workstation_checked,
      redInMirror: campaign.flags.red_in_mirror_heard,
      feliciaBlog: campaign.flags.felicia_blog_found,
      feliciaVideo: campaign.flags.felicia_video_watched,
      dayWorkUnlocked: campaign.flags.day_work_unlocked,
      shipping: !!campaign.tickets.shipping_cannot_print,
      plating: !!campaign.tickets.plating_workstation_down,
      accessEvidence: campaign.evidence.ghostIdentityEvidence.status,
      sector04: campaign.flags.sector04_completed,
      tuesday: campaign.flags.tuesday_morning_reached
    };
  }

  function dayWorkLocked() {
    var gs = gameState();
    if (!gs || gs.day !== 1 || gs.nightMode) return false;
    var campaign = loadState();
    return campaign.campaign.day === 1 && !campaign.flags.day_work_unlocked && !campaign.flags.tuesday_morning_reached;
  }

  function blockedBaseWorkAtPlayer() {
    var gs = gameState();
    if (!gs) return null;
    var p = { x: gs.px, y: gs.py };
    var npc = (gs.npcs || []).find(function (n) { return isAdjacent(p, n) && !n.ambient && !n.campaignAct1; });
    if (npc) return { kind: "ticket", target: npc };
    var portal = (gs.portals || []).find(function (item) { return isAdjacent(p, item); });
    if (portal) return { kind: "portal", target: portal };
    var device = (gs.devices || []).find(function (item) { return isAdjacent(p, item) && !item.fixed; });
    if (device) return { kind: "device", target: device };
    return null;
  }

  function pauseBaseWorkDialog() {
    var campaign = loadState();
    return callDialog("SHIFT PAUSED", "The procedural queue is visible, but its clock has not started. Complete the authored opening before ordinary ticket work can age, escalate, or resolve.", [
      { t: campaign.flags.standup_completed ? "Open workstation" : "Go to standup", f: campaign.flags.standup_completed ? openWorkstation : openStandup },
      { t: "Back", f: closeDialog }
    ]);
  }

  function syncDayWorkMeta() {
    var gs = gameState();
    if (!gs) return false;
    var campaign = loadState();
    gs.meta = gs.meta || {};
    gs.meta.dayWorkUnlocked = !!campaign.flags.day_work_unlocked;
    gs.meta.ticketTimersActive = !!campaign.flags.day_work_unlocked;
    return true;
  }

  function install() {
    if (root.__techopsCampaignNativeAct1Installed) return false;
    root.__techopsCampaignNativeAct1Installed = true;
    if (typeof root.setupDay === "function") {
      var originalSetupDay = root.setupDay;
      root.setupDay = function () { originalSetupDay.apply(this, arguments); ensureWorld(); syncDayWorkMeta(); };
    }
    if (typeof root.advanceClock === "function") {
      var originalAdvanceClock = root.advanceClock;
      root.advanceClock = function (minutes) {
        if (dayWorkLocked() && Number(minutes) > 0) {
          syncDayWorkMeta();
          return gameState() ? gameState().clock : undefined;
        }
        return originalAdvanceClock.apply(this, arguments);
      };
    }
    if (typeof root.interact === "function") {
      var originalInteract = root.interact;
      root.interact = function () {
        var state = gameState(), native = state && state.meta && state.meta.campaignAct1Native;
        if (state && !state.inDialog && !state.inBattle && !state.nightMode && native) {
          var p = { x: state.px, y: state.py };
          if (isAdjacent(p, native.standup)) return openStandup();
          if (isAdjacent(p, native.shipping)) return resolveTicket("shipping_cannot_print");
          if (isAdjacent(p, native.plating)) return resolveTicket("plating_workstation_down");
          if (isAdjacent(p, native.access)) return recordAccessEvidence();
        }
        if (dayWorkLocked() && blockedBaseWorkAtPlayer()) return pauseBaseWorkDialog();
        return originalInteract.apply(this, arguments);
      };
    }
    if (typeof root.nightDoorDialog === "function") {
      var originalNightDoorDialog = root.nightDoorDialog;
      root.nightDoorDialog = function () { var campaign = loadState(); if (campaign.flags.day_work_unlocked && campaign.campaign.day === 1 && !campaign.flags.tuesday_morning_reached) return sector04Door(); return originalNightDoorDialog.apply(this, arguments); };
    }
    syncDayWorkMeta();
    return true;
  }

  var api = {
    CONTACTS: CONTACTS,
    WORKSTATION_TABS: WORKSTATION_TABS.slice(),
    NATIVE_ASSET_BINDINGS: NATIVE_ASSET_BINDINGS,
    assetFilename: assetFilename,
    assetUrl: assetUrl,
    assetsForContext: assetsForContext,
    assetUrlsForContext: assetUrlsForContext,
    setAssetContext: setAssetContext,
    ensureWorld: ensureWorld,
    openStandup: openStandup,
    openWorkstation: openWorkstation,
    openWorkstationTab: openWorkstationTab,
    openMusicTab: openMusicTab,
    openCompanyTab: openCompanyTab,
    playFeliciaVideo: playFeliciaVideo,
    completeFeliciaVideo: completeFeliciaVideo,
    unlockDayShift: unlockDayShift,
    resolveTicket: resolveTicket,
    recordAccessEvidence: recordAccessEvidence,
    sector04Door: sector04Door,
    insightSector04: insightSector04,
    completeSector04: completeSector04,
    currentWorldProgress: currentWorldProgress,
    dayWorkLocked: dayWorkLocked,
    blockedBaseWorkAtPlayer: blockedBaseWorkAtPlayer,
    syncDayWorkMeta: syncDayWorkMeta,
    install: install
  };

  if (root && root.document) {
    if (root.document.readyState === "loading" && root.document.addEventListener) root.document.addEventListener("DOMContentLoaded", install);
    else install();
  }
  return api;
});
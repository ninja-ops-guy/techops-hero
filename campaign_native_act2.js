/* TechOps Hero — native Acts II–III proof integration.
 * Presents campaign_act2 semantics in the actual world and uses the stable
 * reference-driven visual layer for authored encounters.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignNativeAct2 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var CONTACTS = Object.freeze({
    badge: { id: "campaign_p1_badge", name: "BADGE CLONER", dept: "Security", face: "SEC", fallback: { x: 36, y: 13 }, campaignAct2: "badge_cloner" },
    felicia: { id: "campaign_p1_felicia", name: "FELICIA", dept: "Systems Integration", face: "FEL", fallback: { x: 31, y: 16 }, campaignAct2: "felicia_daylight" },
    trace: { id: "campaign_p1_trace", name: "TRACE CONSOLE", dept: "Engineering", face: "SYS", fallback: { x: 23, y: 15 }, campaignAct2: "morningstar_trace" },
    rooftop: { id: "campaign_p1_rooftop", name: "ROOFTOP ACCESS", dept: "Facilities", face: "ROOF", fallback: { x: 40, y: 8 }, campaignAct2: "rooftop_violin" }
  });

  function act1() { if (!root || !root.TechOpsCampaign) throw new Error("TechOpsCampaign is required"); return root.TechOpsCampaign; }
  function act2() { if (!root || !root.TechOpsCampaignAct2) throw new Error("TechOpsCampaignAct2 is required"); return root.TechOpsCampaignAct2; }
  function visuals() { return root && root.TechOpsCampaignVisuals ? root.TechOpsCampaignVisuals : null; }
  function storage() { return root && root.localStorage ? root.localStorage : null; }
  function load() { return act1().load(storage()); }
  function save(state) { act1().save(state, storage()); return state; }
  function gs() { return root && root.S ? root.S : null; }
  function hasFn(name) { return root && typeof root[name] === "function"; }
  function close() { if (visuals()) visuals().hide(); if (hasFn("closeDlg")) root.closeDlg(); }
  function dlg(name, body, options) { if (!hasFn("dlg")) return false; root.dlg(name, body, options || []); return true; }
  function notify(message) { if (hasFn("toast")) root.toast(message, 3400); }
  function show(sceneId) { if (visuals()) visuals().show(sceneId); }

  function openTile(map, p) { return !!(map && map[p.y] && map[p.y][p.x] === 0); }
  function findSpot(map, fallback, used) {
    var p = { x: fallback.x, y: fallback.y };
    while ((!openTile(map, p) || used[p.x + "," + p.y]) && p.x > 3) p.x--;
    used[p.x + "," + p.y] = true;
    if (map && map[p.y]) map[p.y][p.x] = 0;
    return p;
  }
  function addContact(state, key, contact, pos) {
    state.npcs = state.npcs || [];
    if (state.npcs.some(function (npc) { return npc.id === contact.id; })) return;
    state.npcs.push({ id: contact.id, name: contact.name, dept: contact.dept, face: contact.face, x: pos.x, y: pos.y, ambient: true, campaignAct2: contact.campaignAct2 });
  }

  function ensureWorld() {
    var state = gs();
    if (!state || !state.map || state.day < 2) return false;
    var campaign = load();
    if (!(campaign.flags.tuesday_morning_reached || campaign.flags.tuesdayMorningReached)) return false;
    act2().beginGhostFrequency(campaign);
    save(campaign);
    var used = {}, native = {};
    Object.keys(CONTACTS).forEach(function (key) {
      var contact = CONTACTS[key];
      var pos = findSpot(state.map, contact.fallback, used);
      native[key] = pos;
      addContact(state, key, contact, pos);
    });
    state.meta = state.meta || {};
    state.meta.campaignAct2Native = native;
    return true;
  }

  function badgeCloner() {
    show("badge_lab");
    var state = load();
    var snap = act2().snapshot(state);
    if (snap.badgeClonerVerified) return dlg("BADGE CLONER // VERIFIED", "The cloned credential and the access audit disagree in a way they should not. The contradiction is preserved as evidence instead of being explained away.", [{ t: "Close", f: close }]);
    return dlg("SECURITY LAB // BADGE CLONER", "A physical clone sits beside the reader. Same badge identity. Different history. The audit says Mike used Sector 04 at 02:13.<br><br>This scene is staged as a real investigation: artifact on the bench, controller history on the wall display, Mike and Security Ops facing the same evidence.", [
      { t: "Compare physical badge to audit", f: function () { var s = load(); act2().recordBadgeClonerEvidence(s, { physicalArtifact: true, auditContradiction: true, perspective: "firsthand", reliability: "high" }); save(s); notify("Evidence +2 // ghost identity established"); badgeCloner(); } },
      { t: "Leave evidence untouched", f: close }
    ]);
  }

  function feliciaDaylight() {
    show("felicia_day");
    var state = load();
    var snap = act2().snapshot(state);
    if (!snap.badgeClonerVerified) return dlg("CONNECTOR HALL", "Felicia is here in daylight, but Mike does not yet have enough context to turn this into an interrogation. The encounter stays social until the badge contradiction is established.", [{ t: "Keep it professional", f: close }]);
    if (snap.feliciaDaylightConversation) return dlg("FELICIA", "The first conversation is already in the record. Trust and evidence remain separate systems.", [{ t: "Continue", f: close }]);
    return dlg("FELICIA // DAYLIGHT", "The references frame this as a grounded first meeting, not a boss reveal: bright industrial glass, aircraft structure behind her, normal workday posture, and no Night Walker title card.<br><br>Felicia: “You look like you found something that doesn't fit.”", [
      { t: "Professional — ask about systems integration", f: function () { var s = load(); act2().firstDaylightFeliciaConversation(s, { approach: "professional" }); save(s); notify("Trust +2"); close(); } },
      { t: "Curious — ask what she works on", f: function () { var s = load(); act2().firstDaylightFeliciaConversation(s, { approach: "curious" }); save(s); notify("Trust +1"); close(); } },
      { t: "Accuse her of knowing more", f: function () { var s = load(); act2().firstDaylightFeliciaConversation(s, { approach: "accusatory" }); save(s); notify("Trust -1"); close(); } }
    ]);
  }

  function morningstarTrace() {
    show("morningstar_trace");
    var state = load();
    var snap = act2().snapshot(state);
    if (!snap.feliciaDaylightConversation) return dlg("TRACE BAY // LOCKED CONTEXT", "Mike has traces, but not the human context to interpret them yet. Talk to Felicia in daylight first.", [{ t: "Back", f: close }]);
    var p1 = act2().ensure(state);
    if (p1.morningstar.signatureFound) return dlg("MORNINGSTAR // COMPONENT LEDGER", "A verified systems signature now exists. It is not an aircraft unlock. It is a component-level trace with provenance.<br><br>Verified components: " + Object.keys(p1.morningstar.components).filter(function (k) { return p1.morningstar.components[k].verified; }).join(", ").toUpperCase(), [{ t: "Back", f: close }]);
    return dlg("TRACE BAY // MORNINGSTAR", "Telemetry fragments repeat across systems that should not share a control plane. The visual presentation uses the same layered industrial look as the references: rack silhouettes, green telemetry grid, Mike physically standing in front of the trace instead of reading a detached lore menu.", [
      { t: "Verify telemetry signature", f: function () { var s = load(); act2().recordMorningstarTrace(s, { component: "telemetry", source: "trace_bay_telemetry_bus", verified: true }); save(s); notify("MORNINGSTAR telemetry trace verified"); morningstarTrace(); } },
      { t: "Log unverified compute trace", f: function () { var s = load(); act2().recordMorningstarTrace(s, { component: "compute", source: "trace_bay_compute_bus", verified: false }); save(s); notify("Trace logged — not yet verified"); morningstarTrace(); } },
      { t: "Back", f: close }
    ]);
  }

  function rooftop() {
    show("rooftop_violin");
    var state = load();
    var snap = act2().snapshot(state);
    if (!snap.morningstarSignatureFound) return dlg("ROOFTOP ACCESS", "The rooftop signal is visible, but Mike cannot connect it to MORNINGSTAR without a verified trace. The game does not reward sequence-breaking with a premature reveal.", [{ t: "Return downstairs", f: close }]);
    if (!snap.rooftopViolinVerified) return dlg("ROOFTOP // SIGNAL", "Night skyline. Layered parallax. Utility cables crossing the frame. Felicia holds the far side of the composition with the violin while Mike enters from the opposite edge.<br><br>The signal blooms around each sustained note instead of turning the scene into a static dialogue box.", [
      { t: "Observe signal timing", f: function () { var s = load(); act2().recordRooftopViolinEvidence(s, { signalObserved: true, corroborated: true, perspective: "firsthand" }); save(s); notify("Rooftop violin signal corroborated"); rooftop(); } },
      { t: "Leave before drawing a conclusion", f: close }
    ]);
    if (!snap.violinistRevealEligible) return dlg("ROOFTOP // INCOMPLETE", "The signal is real, but Mike is still missing one or more prerequisites. Evidence does not become identity by proximity.", [{ t: "Back", f: close }]);
    if (!snap.violinistRevealed) return dlg("THE VIOLINIST", "The same woman Mike met in daylight now occupies the operational silhouette he has been chasing at night. The reveal lands because the player has already seen both halves separately.", [
      { t: "Recognize Felicia", f: function () { var s = load(); act2().revealViolinist(s); save(s); notify("PARTS IN MOTION unlocked"); rooftop(); } }
    ]);
    return dlg("PARTS IN MOTION", "The Violinist reveal is complete. Evidence and Trust remain independent going forward.", [{ t: "Continue", f: close }]);
  }

  function interactionFor(npc) {
    if (!npc || !npc.campaignAct2) return false;
    if (npc.campaignAct2 === "badge_cloner") return badgeCloner();
    if (npc.campaignAct2 === "felicia_daylight") return feliciaDaylight();
    if (npc.campaignAct2 === "morningstar_trace") return morningstarTrace();
    if (npc.campaignAct2 === "rooftop_violin") return rooftop();
    return false;
  }

  function installInteractionWrapper() {
    if (!root || typeof root.interact !== "function" || root.interact.__campaignAct2Wrapped) return false;
    var base = root.interact;
    var wrapped = function () {
      var state = gs();
      if (state && state.npcs && typeof root.adjacent === "function") {
        var player = { x: state.px, y: state.py };
        for (var i = 0; i < state.npcs.length; i++) {
          var npc = state.npcs[i];
          if (npc.campaignAct2 && root.adjacent(player, npc)) return interactionFor(npc);
        }
      }
      return base.apply(this, arguments);
    };
    wrapped.__campaignAct2Wrapped = true;
    root.interact = wrapped;
    return true;
  }

  function installDayWrapper() {
    if (!root || typeof root.setupDay !== "function" || root.setupDay.__campaignAct2Wrapped) return false;
    var base = root.setupDay;
    var wrapped = function () { var result = base.apply(this, arguments); try { ensureWorld(); } catch (e) {} return result; };
    wrapped.__campaignAct2Wrapped = true;
    root.setupDay = wrapped;
    return true;
  }

  installInteractionWrapper();
  installDayWrapper();
  try { ensureWorld(); } catch (e) {}

  return { CONTACTS: CONTACTS, ensureWorld: ensureWorld, badgeCloner: badgeCloner, feliciaDaylight: feliciaDaylight, morningstarTrace: morningstarTrace, rooftop: rooftop, interactionFor: interactionFor, installInteractionWrapper: installInteractionWrapper, installDayWrapper: installDayWrapper };
});
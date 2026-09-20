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
  function save(state) { if (act1().save(state, storage()) !== true) throw new Error("Campaign state was not saved"); return state; }
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
    return dlg("SECURITY LAB // BADGE CLONER", "A physical clone sits beside the reader. Same badge identity. Different history. The audit says Mike used Sector 04 at 02:13.<br><br>Security Ops: “I can prove the reader accepted this identity. I can't prove you were the person holding it.”<br><br>Compare the artifact with the controller's record before drawing a conclusion.", [
      { t: "Compare physical badge to audit", f: function () { var s = load(); act2().recordBadgeClonerEvidence(s, { physicalArtifact: true, auditContradiction: true, perspective: "firsthand", reliability: "high" }); save(s); notify("Evidence +2 // ghost identity established"); badgeCloner(); } },
      { t: "Leave evidence untouched", f: close }
    ]);
  }

  function feliciaDaylight() {
    show("felicia_day");
    var state = load();
    var snap = act2().snapshot(state);
    if (snap.violinistRevealed) return trustIsEarned();
    if (!snap.badgeClonerVerified) return dlg("CONNECTOR HALL", "Felicia is here in daylight, but Mike does not yet have enough context to turn this into an interrogation. The encounter stays social until the badge contradiction is established.", [{ t: "Keep it professional", f: close }]);
    if (snap.feliciaDaylightConversation) return dlg("FELICIA", "Felicia glances toward the trace bay.<br><br>“A good question deserves a good record. Start with what those systems are actually sending.”<br><br>Next: review the telemetry at the Trace Console.", [{ t: "Continue", f: close }]);
    return dlg("FELICIA // DAYLIGHT", "Felicia pauses beside the glass overlooking the aircraft floor. Mike recognizes her from the company video.<br><br>Felicia: “You look like you found something that doesn't fit.”", [
      { t: "Professional — ask about systems integration", f: function () { var s = load(); act2().firstDaylightFeliciaConversation(s, { approach: "professional" }); save(s); notify("Trust +2"); close(); } },
      { t: "Curious — ask what she works on", f: function () { var s = load(); act2().firstDaylightFeliciaConversation(s, { approach: "curious" }); save(s); notify("Trust +1"); close(); } },
      { t: "Accuse her of knowing more", f: function () { var s = load(); act2().firstDaylightFeliciaConversation(s, { approach: "accusatory" }); save(s); notify("Trust -1"); close(); } }
    ]);
  }

  function commitTrustApproach(approach) {
    return trustAction(function (state) { act2().recordTrustInvestigation(state, { approach: approach }); });
  }

  function trustAction(action, feedback) {
    try {
      var state = load();
      action(state);
      save(state);
      if (feedback) return dlg("TRUST IS EARNED // FINDING", feedback, [{ t: "Continue investigation", f: trustIsEarned }, { t: "Return to the floor", f: close }]);
      return trustIsEarned();
    } catch (error) {
      return trustRecovery();
    }
  }

  function trustRecovery() {
    return dlg("TRUST IS EARNED // REVIEW CURRENT STEP", "This action could not be recorded. Your last saved investigation is still available. Review it before continuing.", [{ t: "Review saved investigation", f: trustIsEarned }, { t: "Return to the floor", f: close }]);
  }

  function beginTrustIsEarned() {
    // The historical racks movie assigns an enemy and toolkit before evidence.
    // This canonical scene keeps the response decision in the investigation.
    return trustAction(function (state) { act2().beginTrustInvestigation(state); });
  }

  function completeTrustIsEarned() {
    return trustAction(function (state) { act2().completeTrustReport(state, { reported: true, sharedOwnership: true }); });
  }

  function reviewTrustEvidence() {
    var state = load(), trust = act2().ensure(state).trustEarned;
    var body = act2().TRUST_EVIDENCE.filter(function (item) { return trust.observations.some(function (seen) { return seen.id === item.id; }); }).map(function (item) { return "<b>" + item.label + "</b><br>" + item.text; }).join("<br><br>");
    return dlg("TRUST IS EARNED // FIELD NOTES", (body || "No observations have been recorded yet.") + "<br><br><b>Next:</b> " + act2().trustObjective(state), [{ t: "Resume current step", f: trustIsEarned }, { t: "Return to the floor", f: close }]);
  }

  function trustIsEarned() {
    show("morningstar_trace");
    var state = load(), snap = act2().snapshot(state), trust = snap.trustIsEarned;
    if (trust.completed || state.story && state.story.completedActs && state.story.completedActs.indexOf("act_4") >= 0) {
      var outcome = trust.requesterVerified && trust.response ? "Felicia: “You kept the line running. You kept the evidence. And you told me what you still couldn't prove.”<br><br>The report names Mike as response owner and Felicia as verification partner. Inspection has its acknowledgement. " + trust.response.consequence : "The previously recorded alliance and hangar access remain available. This older report has no separate Inspection verification record.";
      return dlg("TRUST IS EARNED // ALLIANCE", outcome + "<br><br>Felicia opens the MORNINGSTAR hangar ledger.", [{ t: "Review the field notes", f: reviewTrustEvidence }, { t: "Continue", f: close }]);
    }
    if (!snap.trustIsEarnedEligible && trust.stage === "locked") {
      return dlg("TRUST IS EARNED // LOCKED", "Parts in Motion must be resolved before Mike can ask Felicia for the whole story.", [{ t: "Back", f: close }]);
    }
    if (trust.stage === "locked") {
      return dlg("TRUST IS EARNED", "Inspection cannot release its next part: results are submitted, but acknowledgement never arrives. A sealed rack is carrying unauthorized internal traffic.<br><br>Felicia: “Trust is earned. And you haven't earned the whole story.”<br><br>Mike: “Then let's start with the person waiting on us.”", [
        { t: "Investigate the unauthorized traffic together", f: beginTrustIsEarned },
        { t: "Back", f: close }
      ]);
    }
    if (trust.stage === "investigate") {
      return dlg("TRUST IS EARNED // INVESTIGATE", "Felicia: “Trace it, contain it, or ask the people who touched it. But keep Inspection online.”<br><br>Choose a response plan. Each plan still needs observations, a supported conclusion, and confirmation from Inspection.<br><br>Response owner: Mike. Verification partner: Felicia.", [
        { t: "Trace the source", f: function () { commitTrustApproach("trace"); } },
        { t: "Contain the breach", f: function () { commitTrustApproach("contain"); } },
        { t: "Confront the source", f: function () { commitTrustApproach("confront"); } },
        { t: "Return to the floor", f: close }
      ]);
    }
    var body = "<b>Next:</b> " + snap.trustObjective + "<br><br>Response owner: Mike. Verification partner: Felicia.<br>Observations: " + trust.observations.length + "/3. Technical check: " + (trust.technicalVerified ? "confirmed" : "pending") + ". Inspection confirmation: " + (trust.requesterVerified ? "confirmed" : "pending") + ".";
    var options = [], title = trust.stage.replace(/_/g, " ").toUpperCase();
    if (trust.stage === "observe") {
      act2().TRUST_EVIDENCE.filter(function (item) { return !trust.observations.some(function (seen) { return seen.id === item.id; }); }).forEach(function (item) {
        options.push({ t: item.label, f: function () { trustAction(function (fresh) { act2().observeTrustEvidence(fresh, item.id); }, item.text); } });
      });
    } else if (trust.stage === "hypothesize") {
      body += "<br><br>Felicia: “Say what the records support. Leave the rest open.”";
      act2().TRUST_HYPOTHESES.filter(function (item) { return trust.ruledOut.indexOf(item.id) < 0; }).forEach(function (item) {
        options.push({ t: item.label, f: function () { trustAction(function (fresh) { act2().evaluateTrustHypothesis(fresh, item.id); }, item.feedback); } });
      });
    } else if (trust.stage === "respond") {
      var response = act2().TRUST_RESPONSES[trust.investigation.approach];
      body += "<br><br>" + response.text;
      options.push({ t: response.label, f: function () { trustAction(function (fresh) { act2().applyTrustResponse(fresh); }); } });
    } else if (trust.stage === "technical_verify") {
      options.push({ t: "Recheck the traffic and live service", f: function () { trustAction(function (fresh) { act2().verifyTrustResponse(fresh, "technical"); }, "The repeated copies have stopped. Inspection still answers over its live route.<br><br>Felicia: “That's the system. Now ask the person.”"); } });
    } else if (trust.stage === "requester_verify") {
      options.push({ t: "Have Inspection submit and confirm a real result", f: function () { trustAction(function (fresh) { act2().verifyTrustResponse(fresh, "requester"); }, "The operator submits the waiting inspection result, receives the acknowledgement, and releases the part.<br><br>Inspection: “That's the one I needed. Thank you.”<br><br>The service outcome is confirmed. The records still do not prove who left the mirror active or why."); } });
    } else if (trust.stage === "report") {
      body += "<br><br>The report records the expired mirror, the preserved observations, the verified inspection task, and the unanswered question of intent. Mike owns the response; Felicia corroborates the result.";
      options.push({ t: "Report the finding and share ownership", f: completeTrustIsEarned });
    }
    options.push({ t: "Review the field notes", f: reviewTrustEvidence }, { t: "Return to the floor", f: close });
    return dlg("TRUST IS EARNED // " + title, body, options);
  }

  function morningstarTrace() {
    show("morningstar_trace");
    var state = load();
    var snap = act2().snapshot(state);
    if (!snap.feliciaDaylightConversation) return dlg("TRACE BAY // LOCKED CONTEXT", "Mike has traces, but not the human context to interpret them yet. Talk to Felicia in daylight first.", [{ t: "Back", f: close }]);
    var p1 = act2().ensure(state);
    if (p1.morningstar.signatureFound) return dlg("MORNINGSTAR // COMPONENT LEDGER", "A verified systems signature now exists. It is not an aircraft unlock. It is a component-level trace with provenance.<br><br>Verified components: " + Object.keys(p1.morningstar.components).filter(function (k) { return p1.morningstar.components[k].verified; }).join(", ").toUpperCase(), [{ t: "Back", f: close }]);
    return dlg("TRACE BAY // MORNINGSTAR", "Telemetry fragments repeat across systems that should not share a control plane. Mike compares their timing against the rack's local record.<br><br>A name recurs in the component metadata: MORNINGSTAR.<br><br>A repeated name is a lead. A matching record can establish a signature.", [
      { t: "Verify telemetry signature", f: function () { var s = load(); act2().recordMorningstarTrace(s, { component: "telemetry", source: "trace_bay_telemetry_bus", verified: true }); save(s); notify("MORNINGSTAR telemetry trace verified"); morningstarTrace(); } },
      { t: "Log unverified compute trace", f: function () { var s = load(); act2().recordMorningstarTrace(s, { component: "compute", source: "trace_bay_compute_bus", verified: false }); save(s); notify("Trace logged — not yet verified"); morningstarTrace(); } },
      { t: "Back", f: close }
    ]);
  }

  function rooftop() {
    show("rooftop_violin");
    var state = load();
    var snap = act2().snapshot(state);
    if (!snap.morningstarSignatureFound) return dlg("ROOFTOP ACCESS", "A signal flickers above the rooftop, but Mike has nothing reliable to compare it with.<br><br>Next: verify the MORNINGSTAR telemetry signature at the Trace Console.", [{ t: "Return downstairs", f: close }]);
    if (!snap.rooftopViolinVerified) return dlg("ROOFTOP // SIGNAL", "A violin note carries across the roof. The signal rises with it, then falls into the silence.<br><br>Mike watches the next note against the verified telemetry timing. One coincidence would not be enough.", [
      { t: "Observe signal timing", f: function () { var s = load(); act2().recordRooftopViolinEvidence(s, { signalObserved: true, corroborated: true, perspective: "firsthand" }); save(s); notify("Rooftop violin signal corroborated"); rooftop(); } },
      { t: "Leave before drawing a conclusion", f: close }
    ]);
    if (!snap.violinistRevealEligible) return dlg("ROOFTOP // INCOMPLETE", "The signal is real, but Mike is still missing one or more prerequisites. Evidence does not become identity by proximity.", [{ t: "Back", f: close }]);
    if (!snap.violinistRevealed) return dlg("THE VIOLINIST", "The final note fades. She lowers the violin and turns.<br><br>Mike: “Felicia?”<br><br>Felicia: “You followed the signal.”<br><br>The woman from the connector hall. The silhouette from Sector 04. For the first time, Mike can place them together.", [
      { t: "Recognize Felicia", f: function () { var s = load(); act2().revealViolinist(s); save(s); notify("PARTS IN MOTION unlocked"); rooftop(); } }
    ]);
    return dlg("PARTS IN MOTION", "Felicia puts the violin away.<br><br>“You know who I am. That doesn't mean you know what I'm doing.”<br><br>Next: talk with Felicia in the connector hall about the unauthorized traffic.", [{ t: "Continue", f: close }]);
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
      if (state && !state.nightMode && !state.inDialog && !state.inBattle && state.npcs && typeof root.adjacent === "function") {
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

  return { CONTACTS: CONTACTS, ensureWorld: ensureWorld, badgeCloner: badgeCloner, feliciaDaylight: feliciaDaylight, trustIsEarned: trustIsEarned, beginTrustIsEarned: beginTrustIsEarned, completeTrustIsEarned: completeTrustIsEarned, morningstarTrace: morningstarTrace, rooftop: rooftop, interactionFor: interactionFor, installInteractionWrapper: installInteractionWrapper, installDayWrapper: installDayWrapper };
});

"use strict";
const assert = require("assert");
const C = require("./campaign_act1.js");

function assignOnly(state, impossibleOwner) {
  C.assignTicket(state, "shipping_cannot_print", "mike");
  C.assignTicket(state, "plating_workstation_down", "mike");
  C.assignTicket(state, "impossible_access_event", impossibleOwner || "mike");
  C.completeStandup(state);
}
function assignAll(state, impossibleOwner) {
  assignOnly(state, impossibleOwner);
  C.completeWorkstation(state, { redInTheMirrorHeard: true });
}

// Ticket template contract.
const templates = C.listTicketTemplates();
assert.equal(templates.length, 3);
assert.equal(C.getTicketTemplate("shipping_cannot_print").ordinary, true);
assert.equal(C.getTicketTemplate("plating_workstation_down").ordinary, true);
assert.equal(C.getTicketTemplate("impossible_access_event").ordinary, false);
assert.equal(C.getTicketTemplate("impossible_access_event").campaignOutputs[0], "ghost_identity_evidence");
assert.equal(C.getTicketTemplate("impossible_access_event").nightManifestation, "sector_04_access_guard");
assert.throws(() => C.getTicketTemplate("unknown"), /Unknown Act I ticket/);
const mutatedTemplate = C.getTicketTemplate("shipping_cannot_print");
mutatedTemplate.humanNeed = "mutated";
assert.notEqual(C.getTicketTemplate("shipping_cannot_print").humanNeed, "mutated", "ticket templates are defensive copies");

// Story Bible v1.2 opening-state contract.
const opening = C.createInitialState();
assert.equal(C.VERSION, 2);
assert.equal(opening.flags.standup_started, true);
assert.equal(opening.flags.ticket_assignments_confirmed, false);
assert.equal(opening.flags.standup_completed, false);
assert.equal(opening.flags.workstation_checked, false);
assert.equal(opening.flags.red_in_mirror_heard, false);
assert.equal(opening.flags.felicia_blog_found, false);
assert.equal(opening.flags.felicia_video_watched, false);
assert.equal(opening.flags.day_work_unlocked, false);
assert.throws(() => C.resolveTicket(opening, "shipping_cannot_print", { technicalResolution: true, verification: "strong", humanOutcome: "restored" }), /Day 1 work is locked/);
assert.throws(() => C.checkWorkstation(opening), /Standup must complete/);
assignOnly(opening, "mike");
assert.equal(opening.flags.ticket_assignments_confirmed, true);
assert.equal(opening.flags.standup_completed, true);
assert.equal(opening.flags.ticketAssignmentsConfirmed, true, "legacy aliases stay synchronized");
C.checkWorkstation(opening);
assert.throws(() => C.completeFeliciaVideo(opening, { started: true }), /company-blog post/);
C.hearRedInMirror(opening);
C.findFeliciaBlog(opening);
C.completeFeliciaVideo(opening, { started: true, skipped: true });
assert.equal(opening.flags.day_work_unlocked, false, "video completion alone must not start ticket timers");
C.unlockDayWork(opening);
assert.equal(opening.flags.day_work_unlocked, true);
assert.equal(opening.flags.workstationOpened, true, "workstation compatibility alias follows canonical state");
assert.equal(opening.history.some(e => e.type === "felicia_video_skipped"), true, "deliberate skip commits completion state");

// Tuesday boundary contract.
const tuesday = C.getTuesdayMorningContract();
assert.ok(tuesday.persists.includes("evidence provenance"));
assert.ok(tuesday.persists.includes("verification history"));
assert.ok(tuesday.resets.includes("active combat state"));
assert.ok(tuesday.transforms.includes("Night evidence becomes daytime hypotheses"));

// Canonical firsthand route: daytime understanding enables permanent Night Walker defeat.
const direct = C.createInitialState();
assert.throws(() => C.completeStandup(direct), /exactly one owner/);
assignAll(direct, "mike");
assert.equal(direct.flags.day_work_unlocked, true);
C.resolveTicket(direct, "shipping_cannot_print", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
C.resolveTicket(direct, "plating_workstation_down", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
C.recordGhostEvidence(direct, { id: "badge_impossible_access", perspective: "firsthand", discoveredBy: "mike", completeness: "complete" });
C.resolveTicket(direct, "impossible_access_event", { technicalResolution: true, verification: "strong", humanOutcome: "restored" });
C.enterSector04(direct);
assert.equal(C.insightAccessGuard(direct).success, true);
C.suppressAccessGuard(direct);
assert.equal(direct.flags.sector04_completed, false, "damage only suppresses");
C.severAccessController(direct);
assert.equal(direct.flags.sector04_completed, true);
assert.equal(direct.flags.sector04Completed, true, "legacy sector alias stays synchronized");
C.transitionToTuesday(direct);
assert.equal(direct.campaign.day, 2);
assert.equal(direct.campaign.chapter, "ghost_frequency");
assert.equal(direct.flags.tuesday_morning_reached, true);
assert.equal(direct.evidence.ghostIdentityEvidence.bestPerspective, "firsthand");
assert.equal(direct.night.sector, null, "temporary night state resets");

// Delegated/no-evidence route: combat remains available, diagnosis remains unavailable.
const delegated = C.createInitialState();
assignAll(delegated, "access_team");
C.enterSector04(delegated);
const unknown = C.insightAccessGuard(delegated);
assert.equal(unknown.success, false);
assert.match(unknown.message, /daytime investigation required/);
C.suppressAccessGuard(delegated);
assert.throws(() => C.severAccessController(delegated), /not understood/);
assert.equal(delegated.flags.sector04_completed, false);

// v1 save migration: do not replay completed opening beats or strand existing saves.
const legacy = C.clone(direct);
legacy.schemaVersion = 1;
delete legacy.flags.ticket_assignments_confirmed;
delete legacy.flags.standup_completed;
delete legacy.flags.workstation_checked;
delete legacy.flags.red_in_mirror_heard;
delete legacy.flags.felicia_blog_found;
delete legacy.flags.felicia_video_watched;
delete legacy.flags.day_work_unlocked;
delete legacy.flags.sector04_entered;
delete legacy.flags.sector04_completed;
delete legacy.flags.tuesday_morning_reached;
legacy.flags.ticketAssignmentsConfirmed = true;
legacy.flags.workstationOpened = true;
legacy.flags.redInTheMirrorHeard = true;
legacy.flags.feliciaVideoSeen = true;
legacy.flags.sector04Completed = true;
legacy.flags.tuesdayMorningReached = true;
const legacyMemory = new Map([[C.SAVE_KEY, JSON.stringify(legacy)]]);
const migrated = C.load({ setItem: (k, v) => legacyMemory.set(k, v), getItem: k => legacyMemory.get(k) || null });
assert.equal(migrated.schemaVersion, 2);
assert.equal(migrated.flags.standup_completed, true);
assert.equal(migrated.flags.felicia_blog_found, true);
assert.equal(migrated.flags.felicia_video_watched, true);
assert.equal(migrated.flags.day_work_unlocked, true);
assert.equal(migrated.flags.tuesday_morning_reached, true);

// Persistence contract.
const memory = new Map();
const storage = { setItem: (k, v) => memory.set(k, v), getItem: k => memory.get(k) || null };
C.save(direct, storage);
assert.deepEqual(C.load(storage), direct);

console.log("Campaign Director v2 / Story Bible v1.2: Act I contract PASS");

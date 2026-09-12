"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const campaignSource = fs.readFileSync(path.join(__dirname, "campaign_act1.js"), "utf8");
const nativeSource = fs.readFileSync(path.join(__dirname, "campaign_native_act1.js"), "utf8");
const SHIPPING = "shipping_cannot_print", PLATING = "plating_workstation_down", ACCESS = "impossible_access_event";
let passed = 0;
function test(name, body) { body(); passed++; console.log("PASS " + name); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function storage() {
  const values = new Map();
  return { writes: 0, getItem(key) { return values.get(key) || null; }, setItem(key, value) { this.writes++; values.set(key, String(value)); } };
}
function boot(store = storage()) {
  const context = vm.createContext({ console, localStorage: store,
    S: { day: 1, px: 4, py: 4, clock: 540, meta: {}, inDialog: false, inBattle: false, nightMode: false },
    dlg(name, body, options) { context.dialog = { name, body, options }; context.S.inDialog = true; },
    closeDlg() { context.dialog = null; context.S.inDialog = false; },
    interact() { context.baseInteractions = (context.baseInteractions || 0) + 1; }
  });
  vm.runInContext(campaignSource, context, { filename: "campaign_act1.js" });
  vm.runInContext(nativeSource, context, { filename: "campaign_native_act1.js" });
  return { context, C: context.TechOpsCampaign, N: context.TechOpsCampaignNativeAct1, store };
}
function shift(b, accessOwner = "mike") {
  const state = b.C.createInitialState();
  b.C.assignTicket(state, SHIPPING, "mike"); b.C.assignTicket(state, PLATING, "amit"); b.C.assignTicket(state, ACCESS, accessOwner);
  b.C.completeStandup(state); b.C.completeWorkstation(state, { feliciaVideoSkipped: true });
  b.C.save(state, b.store); return state;
}
function close(b, state, id, verification = "strong", humanOutcome = "restored") {
  b.C.resolveTicket(state, id, { technicalResolution: true, verification, humanOutcome }); b.C.save(state, b.store);
}
function click(b, label) {
  const option = b.context.dialog.options.find(item => item.t === label);
  assert.ok(option, "Missing option: " + label); option.f();
}
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

test("fresh casebook does not invent progress or reveal future answers", () => {
  const b = boot(), s = b.C.createInitialState(), before = JSON.stringify(s);
  const records = b.N.ticketHistory(freeze(s));
  assert.equal(records.length, 3); assert.equal(records[0].status, "OPEN");
  assert.equal(records[2].status, "AWAITING INVESTIGATION");
  assert.doesNotMatch(JSON.stringify(records), /02:13|orpheus|ghost.fork|violinist|controller_replay|credential_clone/i);
  assert.equal(JSON.stringify(s), before); assert.equal(b.store.writes, 0);
});

test("verification and human outcome remain independent across all valid outcomes", () => {
  const b = boot();
  for (const verification of ["partial", "strong"]) for (const outcome of ["restored", "degraded", "unmet"]) {
    const s = shift(b); close(b, s, SHIPPING, verification, outcome);
    const record = b.N.ticketRecord(s, SHIPPING);
    assert.equal(record.verification, verification); assert.equal(record.humanOutcome, outcome);
    assert.equal(record.status, verification === "strong" && outcome === "restored" ? "VERIFIED / RESTORED" : "FOLLOW-UP NEEDED");
  }
});

test("partial, missing technical proof, and inconsistent outcomes cannot look verified", () => {
  const b = boot(), s = shift(b); close(b, s, SHIPPING);
  s.tickets[SHIPPING].technicalResolution = false;
  assert.equal(b.N.ticketRecord(s, SHIPPING).needsAttention, true);
  s.tickets[SHIPPING].technicalResolution = true; s.humanOutcomes[SHIPPING] = "degraded";
  assert.equal(b.N.ticketRecord(s, SHIPPING).conflict, true);
  assert.equal(b.N.ticketRecord(s, SHIPPING).status, "FOLLOW-UP NEEDED");
  assert.equal(b.N.ticketRecord(s, SHIPPING).needsAttention, true);
  assert.match(b.N.ticketFollowUp(s, SHIPPING), /records disagree/);
  s.humanOutcomes[SHIPPING] = "restored"; s.tickets[SHIPPING].status = "reopened";
  assert.equal(b.N.ticketRecord(s, SHIPPING).status, "FOLLOW-UP NEEDED");
});

test("assignment and recorded completion ownership do not collapse into each other", () => {
  const b = boot(), s = shift(b); close(b, s, PLATING); s.assignments[PLATING] = "mike";
  const record = b.N.ticketRecord(s, PLATING);
  assert.equal(record.assignedOwner, "Mike"); assert.equal(record.completionOwner, "Amit");
  assert.doesNotMatch(b.N.ticketFollowUp(s, PLATING), /Mike verified|I fixed|I witnessed/);
});

test("unrelated identity evidence cannot reveal the badge record", () => {
  const b = boot(), s = shift(b);
  b.C.recordGhostEvidence(s, { id: "unrelated_source", perspective: "firsthand" });
  const record = b.N.ticketRecord(s, ACCESS);
  assert.equal(record.sources.length, 0); assert.equal(record.status, "AWAITING INVESTIGATION");
  assert.doesNotMatch(record.symptom, /02:13|SECTOR04-EAST/);
});

test("delegated badge evidence keeps its actual source and remains unresolved", () => {
  const b = boot(), s = shift(b, "security");
  b.C.recordGhostEvidence(s, { id: "badge_impossible_access", perspective: "delegated_partial", discoveredBy: "security" });
  b.C.save(s, b.store); b.N.openTicketRecord(ACCESS);
  assert.match(b.context.dialog.body, /delegated_partial \(Security Ops\)/);
  assert.match(b.context.dialog.body, /DOCUMENTED \/ UNRESOLVED/);
  assert.match(b.context.dialog.body, /02:13/);
  assert.doesNotMatch(b.context.dialog.body, /VERIFIED \/ RESTORED|orpheus_interference/);
  // Legacy or inconsistent closure records must not hide an unresolved access case.
  close(b, s, ACCESS);
  assert.equal(b.N.ticketRecord(s, ACCESS).status, "DOCUMENTED / UNRESOLVED");
  assert.equal(b.N.ticketRecord(s, ACCESS).needsAttention, true);
});

test("reviewing an existing badge report cannot upgrade provenance or duplicate history", () => {
  const b = boot(), s = shift(b); // Assignment is Mike, but the stored source is delegated.
  b.C.recordGhostEvidence(s, { id: "badge_impossible_access", perspective: "delegated_partial", discoveredBy: "security" });
  b.C.save(s, b.store);
  const before = b.store.getItem(b.C.SAVE_KEY), writes = b.store.writes;
  b.N.recordAccessEvidence(); b.N.recordAccessEvidence();
  assert.equal(b.store.getItem(b.C.SAVE_KEY), before); assert.equal(b.store.writes, writes);
  click(b, "Review ticket record"); assert.match(b.context.dialog.body, /delegated_partial/);
});

test("history can be read before standup without clock-in, workstation writes or discovery", () => {
  const b = boot(), s = b.C.createInitialState(); b.C.save(s, b.store);
  const before = b.store.getItem(b.C.SAVE_KEY), writes = b.store.writes;
  b.N.openTicketHistory(); b.N.openTicketRecord(ACCESS); b.N.openTicketEvents(ACCESS);
  assert.equal(b.store.getItem(b.C.SAVE_KEY), before); assert.equal(b.store.writes, writes);
  assert.equal(b.context.S.clock, 540); assert.equal(b.C.load(b.store).flags.day_work_unlocked, false);
});

test("QUEUE exposes the casebook through real dialog callbacks without duplicate actions", () => {
  const b = boot(); shift(b); b.N.openWorkstationTab("QUEUE");
  assert.equal(b.context.dialog.options.filter(o => o.t === "Review ticket history").length, 1);
  click(b, "Review ticket history"); assert.equal(b.context.dialog.name, "WORKSTATION // TICKET HISTORY");
  assert.ok(b.context.dialog.options.length <= 5);
  click(b, "SHIPPING CANNOT PRINT — OPEN");
  assert.match(b.context.dialog.body, /Human outcome: unrecorded/);
  click(b, "Recorded events"); assert.match(b.context.dialog.body, /Assigned to Mike/);
  click(b, "Back to record"); click(b, "Back to history"); click(b, "Close history");
  assert.equal(b.context.S.inDialog, false);
});

test("needs-attention filter retains unresolved access and excludes only proven restoration", () => {
  const b = boot(), s = shift(b); close(b, s, SHIPPING); close(b, s, PLATING, "partial", "restored");
  b.N.openTicketHistory(); click(b, "Show needs attention");
  const labels = b.context.dialog.options.map(o => o.t);
  assert.ok(labels.some(t => /PLATING.*FOLLOW-UP/.test(t))); assert.ok(labels.some(t => /ACCESS.*AWAITING/.test(t)));
  assert.ok(!labels.some(t => /SHIPPING/.test(t)));
  click(b, "PLATING WORKSTATION DOWN — FOLLOW-UP NEEDED"); click(b, "Back to history");
  assert.ok(b.context.dialog.options.some(o => o.t === "Show all records"));
});

test("TEAMS remembers the saved outcomes rather than repeating stale pre-repair complaints", () => {
  const b = boot(), s = shift(b); close(b, s, SHIPPING); close(b, s, PLATING, "partial", "degraded");
  const before = b.store.getItem(b.C.SAVE_KEY); b.N.openWorkstationTab("TEAMS");
  assert.match(b.context.dialog.body, /customs label was confirmed accurate/);
  assert.match(b.context.dialog.body, /degraded service with partial verification/);
  assert.doesNotMatch(b.context.dialog.body, /customs labels are vanishing after submission/);
  click(b, "Review ticket history"); assert.equal(b.store.getItem(b.C.SAVE_KEY), before);
});

test("completed-contact interaction uses honest memory and cannot grant a second completion", () => {
  const b = boot(), s = shift(b); close(b, s, SHIPPING, "partial", "unmet");
  b.context.S.meta.campaignAct1Native = { shipping: { x: 4, y: 5 } }; b.N.install();
  const before = b.store.getItem(b.C.SAVE_KEY), writes = b.store.writes;
  b.context.interact(); assert.match(b.context.dialog.body, /unmet service with partial verification/);
  assert.doesNotMatch(b.context.dialog.body, /Already verified/);
  click(b, "Back"); b.context.interact();
  assert.equal(b.store.getItem(b.C.SAVE_KEY), before); assert.equal(b.store.writes, writes);
});

test("old saves without history get no fabricated events", () => {
  const b = boot(), s = shift(b); s.history = []; delete s.verificationHistory; delete s.humanOutcomes;
  b.C.save(s, b.store); const before = b.store.getItem(b.C.SAVE_KEY);
  b.N.openTicketEvents(SHIPPING);
  assert.match(b.context.dialog.body, /No recorded events/); assert.equal(b.store.getItem(b.C.SAVE_KEY), before);
});

test("timeline is bounded, chronological and excludes future story events", () => {
  const b = boot(), s = shift(b); s.history = [];
  for (let i = 11; i >= 0; i--) s.history.push({ type: "ticket_assigned", ticketId: SHIPPING, ownerId: "mike", at: `2026-09-12T01:00:${String(i).padStart(2, "0")}Z` });
  s.history.push({ type: "ending_selected", ticketId: SHIPPING, at: "2026-09-12T02:00:00Z", text: "ORPHEUS secret ending" });
  const log = b.N.ticketEvents(s, SHIPPING);
  assert.equal(log.total, 12); assert.equal(log.events.length, 8);
  assert.match(log.events[0].at, /04Z$/); assert.match(log.events[7].at, /11Z$/);
  assert.doesNotMatch(JSON.stringify(log), /ORPHEUS|ending_selected/);
});

test("invalid event timestamps remain unknown instead of becoming invented dates", () => {
  const b = boot(), s = shift(b); s.history = [{ type: "ticket_assigned", ticketId: SHIPPING, ownerId: "mike", at: "not-a-date" }];
  b.C.save(s, b.store); b.N.openTicketEvents(SHIPPING); assert.match(b.context.dialog.body, /Time not recorded/);
});

test("save-controlled labels are escaped and prototype-shaped owner IDs stay text", () => {
  const b = boot(), s = shift(b); s.assignments[SHIPPING] = '<img src=x onerror="bad()">';
  b.C.save(s, b.store); b.N.openWorkstationTab("QUEUE"); assert.doesNotMatch(b.context.dialog.body, /<img/);
  assert.match(b.context.dialog.body, /&lt;img/); b.N.openTicketRecord(SHIPPING); assert.doesNotMatch(b.context.dialog.body, /<img/);
  s.assignments[SHIPPING] = "__proto__"; assert.equal(b.N.ticketRecord(s, SHIPPING).assignedOwner, "__proto__");
  assert.throws(() => b.N.ticketRecord(s, "__proto__"), /Unknown casebook/);
  assert.throws(() => b.N.ticketRecord(s, "watchdog"), /Unknown casebook/);
});

test("cold runtime reload reconstructs memory from the canonical save only", () => {
  const b = boot(), s = shift(b); close(b, s, SHIPPING); close(b, s, PLATING, "partial", "degraded");
  const before = plain(b.N.ticketHistory(b.C.load(b.store))), writes = b.store.writes;
  const reloaded = boot(b.store);
  assert.deepEqual(plain(reloaded.N.ticketHistory(reloaded.C.load(b.store))), before);
  reloaded.N.openWorkstationTab("TEAMS"); assert.match(reloaded.context.dialog.body, /confirmed accurate/);
  assert.equal(b.store.writes, writes);
});

test("Tuesday transition preserves the recorded casebook without resetting outcomes", () => {
  const b = boot(), s = shift(b); close(b, s, SHIPPING);
  b.C.recordGhostEvidence(s, { id: "badge_impossible_access", perspective: "firsthand" });
  const before = plain(b.N.ticketHistory(s));
  b.C.enterSector04(s); b.C.insightAccessGuard(s); b.C.suppressAccessGuard(s); b.C.severAccessController(s); b.C.transitionToTuesday(s); b.C.save(s, b.store);
  const reloaded = boot(b.store); assert.equal(reloaded.C.load(b.store).campaign.day, 2);
  assert.deepEqual(plain(reloaded.N.ticketHistory(reloaded.C.load(b.store))), before);
});

test("malformed or inaccessible storage fails visibly without overwriting progress", () => {
  const b = boot(); b.store.setItem(b.C.SAVE_KEY, "{broken"); const writes = b.store.writes;
  assert.equal(b.N.openTicketHistory(), false); assert.equal(b.context.dialog.name, "TICKET HISTORY UNAVAILABLE");
  assert.equal(b.store.getItem(b.C.SAVE_KEY), "{broken"); assert.equal(b.store.writes, writes);
  const unavailable = boot({ getItem() { throw new Error("Storage unavailable"); }, setItem() { throw new Error("Unexpected write"); } });
  assert.equal(unavailable.N.openTicketHistory(), false); click(unavailable, "Close"); assert.equal(unavailable.context.S.inDialog, false);
});

test("every record callback reloads fresh state and repeated review remains read-only", () => {
  const b = boot(), s = shift(b); b.N.openTicketHistory();
  const oldOpen = b.context.dialog.options.find(o => /SHIPPING/.test(o.t)).f;
  close(b, s, SHIPPING); oldOpen(); assert.match(b.context.dialog.body, /VERIFIED \/ RESTORED/);
  const before = b.store.getItem(b.C.SAVE_KEY), writes = b.store.writes;
  for (let i = 0; i < 20; i++) { b.N.openTicketHistory(); b.N.openTicketRecord(SHIPPING); b.N.openTicketEvents(SHIPPING); b.N.openTicketFollowUp(SHIPPING); }
  assert.equal(b.store.getItem(b.C.SAVE_KEY), before); assert.equal(b.store.writes, writes);
  assert.deepEqual(plain(b.N.WORKSTATION_TABS), ["QUEUE", "TEAMS", "ALERTS", "COMPANY", "MUSIC"]);
});

console.log(`Campaign casebook: ${passed} tests passed`);

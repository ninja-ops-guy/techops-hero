"use strict";

const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("game.js", "utf8");
const guide = fs.readFileSync("v62_hooks.js", "utf8");
const stabilize = source.match(/function stabilizeBattle\(\) \{[\s\S]*?\n\}/);
const workflow = source.match(/function workflowAction\(a\) \{[\s\S]*?\n\}/);
const loss = source.match(/function loseBattle\(\) \{[\s\S]*?\n\}/);
assert.ok(stabilize && workflow && loss, "ticket lifecycle functions must remain inspectable");

assert.ok(source.includes("if (B.hp <= 0) return stabilizeBattle()"), "zero technical health must stabilize instead of close");
assert.ok(!source.includes("if (B.hp <= 0) return winBattle()"), "no damage path may auto-close a ticket");
assert.ok(stabilize[0].includes("B.stabilized = true"));
assert.ok(workflow[0].includes('a.cat === "verify" && !B.stabilized'), "verification requires stabilized service");
assert.ok(workflow[0].includes('a.cat === "document" && (!B.stabilized || !B.verified)'), "documentation requires verification");
assert.ok(workflow[0].includes("return winBattle()"), "verified documentation is the explicit closure action");
assert.ok(workflow[0].indexOf('B.seq.push("verify")') < workflow[0].indexOf('B.seq.push("document")'), "workflow records verify before document");
assert.ok(source.includes('a.cat !== "verify" && a.cat !== "document"'), "mandatory verification/documentation cannot be stress-capped into a soft lock");

const enemyPhase = source.match(/function enemyPhase\(\) \{[\s\S]*?\n\}/);
assert.ok(enemyPhase, "enemy phase must remain inspectable");
assert.ok(enemyPhase[0].indexOf("if (s.hp <= 0) return loseBattle()") < enemyPhase[0].indexOf("if (B.hp <= 0) return stabilizeBattle()"), "simultaneous reflected death must resolve as a player loss before stabilization");
assert.ok(source.includes("save(); // closure rewards and ticket identity must survive an immediate reload"), "successful ticket closure must persist after the battle shell releases");

const normalLoss = loss[0].slice(loss[0].indexOf("addStress(20)"));
assert.ok(normalLoss.includes("n.escalated = true"), "loss creates an escalation");
assert.ok(normalLoss.includes("ticket remains open"), "loss copy must tell the truth");
assert.ok(!normalLoss.includes("s.ticketsDone++"), "ordinary loss cannot advance queue completion");
assert.ok(!normalLoss.includes("dev.fixed = true"), "ordinary loss cannot repair the device");
assert.ok(!normalLoss.includes("s.portals = s.portals.filter"), "ordinary loss keeps a retry route available");
assert.ok(source.includes("unresolved · handed off"), "EOD copy must not claim unimplemented rollover");
assert.ok(guide.includes('["GATHER", "HYPOTHESIZE", "RESOLVE", "VERIFY", "DOCUMENT"]'), "battle guidance must teach the full closure lifecycle");

console.log("Ticket stabilize -> verify -> document + honest escalation contract: PASS");

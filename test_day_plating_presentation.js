'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const r = {}; vm.runInNewContext(fs.readFileSync('runtime_day_plating.js', 'utf8'), r);
const api = r.TechOpsDayPlating;
function record(extra) { return Object.assign({ evidence: [], phase: 'gather' }, extra); }
let checks = 0;
function test(name, f) { f(); checks++; console.log('PASS ' + name); }
test('unobserved services do not reveal the stopped dependency', () => {
 const html = api.services({}, record(), false, false);
 assert.match(html, /Query required/); assert.match(html, /Not inspected/); assert.doesNotMatch(html, />Stopped</);
 assert.match(html, /data-day-action="observe" data-value="integration_service"/);
 assert.match(html, /data-day-action="doors-startup" data-value="auto"/);
 assert.match(html, /data-day-action="doors-apply"/);
});
test('inspection reveals only its supported dependency chain', () => {
 const html = api.services({ startup: 'manual' }, record({ evidence: ['integration_service'] }), false, false);
 assert.match(html, /Did not restart/); assert.match(html, />Stopped</); assert.match(html, /data-value="manual" aria-pressed="true"/);
 assert.doesNotMatch(html, /Controller network path[\s\S]*>Reachable</);
});
test('controller reachability and technical session stay independent', () => {
 const html = api.connection(record({ evidence: ['local_login', 'controller_reachability'] }), false, false);
 assert.match(html, />Responsive</); assert.match(html, />Reachable</); assert.match(html, />Not verified</);
 assert.doesNotMatch(html, />Session verified</); assert.match(html, /data-value="controller_reachability"/);
});
test('repair is ready to test without granting requester verification', () => {
 const html = api.connection(record({ fixApplied: true, evidence: ['integration_service'] }), false, true);
 assert.match(html, /Repair applied · test pending/); assert.match(html, /data-day-action="technical"/);
 assert.match(html, /data-hold="confirmed"/); assert.doesNotMatch(html, />Session verified</);
 const physical = api.physical({ record: record({ fixApplied: true }) }, true);
 assert.match(physical, /READY TO TEST/); assert.match(physical, /Integration service: running/);
});
test('technical verification does not claim production is resumed', () => {
 const html = api.connection(record({ fixApplied: true, technicalCheckPassed: true }), false, true);
 assert.match(html, />Session verified</); assert.match(html, /separate requester verification/);
 assert.doesNotMatch(html, /data-day-action="technical"/); assert.doesNotMatch(html, /line can resume|production resumed/i);
});
test('completed handoff alone never fabricates a technical session', () => {
 const html = api.connection(record(), true, false);
 assert.match(html, />Not verified</); assert.doesNotMatch(html, />Session verified</);
 assert.doesNotMatch(html, /data-day-action=/);
});
test('operator hold visibility follows only the supplied persisted flag', () => {
 assert.match(api.services({}, record({ hypothesis: 'integration_failure' }), false, false), /not coordinated/);
 assert.match(api.services({}, record(), false, true), /confirmed for change/);
 assert.match(api.connection(record({ technicalCheckPassed: true }), false, false), /data-hold="pending"/);
});
test('physical cabinet cannot produce evidence, authorize, repair or close cases', () => {
 const html = api.physical({ record: record() }, false);
 assert.match(html, /<svg[^>]+role="img"[^>]+aria-label=/); assert.match(html, /PLATING-WS07/);
 assert.doesNotMatch(html, /data-day-action|<button/); assert.doesNotMatch(html, />STOPPED</);
});
test('all views are pure for frozen canonical records and ephemeral startup', () => {
 const rec = Object.freeze({ evidence: Object.freeze(['local_login', 'integration_service']), fixApplied: false });
 const ui = Object.freeze({ startup: 'auto' });
 const before = JSON.stringify({rec,ui});
 api.physical(Object.freeze({record:rec}),true);api.services(ui,rec,false,true);api.connection(rec,false,true);
 assert.equal(JSON.stringify({rec,ui}),before);
});
console.log('Plating presentation: ' + checks + ' contract groups PASS');

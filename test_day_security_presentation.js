'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('runtime_day_security.js', 'utf8');
const native = fs.readFileSync('campaign_native_act1.js', 'utf8');
const context = vm.createContext({});
// Rendering must neither consult nor modify story/save authority. Throwing
// getters catch accidental dependencies even without a running game or DOM.
for (const key of ['TechOpsCampaign', 'TechOpsCampaignNativeAct1', 'localStorage', 'document', 'S', 'setTimeout', 'setInterval', 'requestAnimationFrame']) {
  Object.defineProperty(context, key, { get() { throw new Error('Security view touched ' + key); } });
}
vm.runInContext(source, context);
const html = context.TechOpsDaySecurity.view();
assert.equal(context.TechOpsDaySecurity.view(), html, 'event review is deterministic and stateless');
assert.ok(Object.isFrozen(context.TechOpsDaySecurity));
assert.ok(native.includes('Timestamp: 02:13') && native.includes('SECTOR04-EAST'), 'timestamp and location are existing authored content');
assert.equal((html.match(/<time>/g) || []).length, 1, 'timeline does not invent more events');
assert.ok(html.includes('<time>02:13</time>'));
assert.equal((html.match(/ACCESS GRANTED/g) || []).length, 1);
assert.ok(html.includes('Source: Badge reader'));
assert.ok(html.includes('WHAT THE LOG PROVES') && html.includes('Credential accepted'));
assert.ok(html.includes('WHAT IT DOES NOT PROVE') && html.includes('Physical presence unverified'));
assert.ok(html.includes('camera gives no corroborating physical match'));
assert.ok(html.includes('inconsistency remains unresolved'));
assert.ok(html.includes('not a camera frame') && html.includes('not a camera image or evidence that someone entered'));
assert.ok(!/M\.OLIVEFIELD|clone|replay|orpheus|Mike was not there|<script|on\w+=/i.test(html), 'no early identity/cause reveal or executable dynamic markup');
assert.equal((html.match(/data-day-action=/g) || []).length, 1, 'only existing review action is exposed');
assert.ok(html.includes('data-day-action="doors-badge"') && html.includes('>Review access event</button>'));
assert.ok(html.includes('role="img" aria-label=') && html.includes('aria-label="Evidence boundaries"'), 'illustration and evidence boundary are accessible');
assert.ok(!/<input|<form|<iframe|<img\b/.test(html), 'static source has no escaping surface or third-party assets');
const css = fs.readFileSync('runtime_day_security.css', 'utf8');
assert.ok(css.includes('minmax(0, 1fr)') && css.includes('@media (max-width: 700px)'));
assert.ok(!/animation:|transition:/.test(css), 'static presentation respects reduced motion without timing state');
console.log('Security presentation: existing single event, read-only rendering, source boundaries and review-only action PASS');

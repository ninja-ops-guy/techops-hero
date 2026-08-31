const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("good_boys_intro_repair.js", "utf8");
new Function(source);

// Preserve the four authored beats while replacing only the broken presentation/handoff.
assert.strictEqual((source.match(/\{k:"goodboys_/g) || []).length, 4, "intro must retain exactly four authored cards");
assert.ok(source.includes('overlay.id="good-boys-story-cine"'), "intro must remain visible to authored cinematic/runtime blockers");
assert.ok(source.includes('className="gbi-repaired"'), "intro must use the repaired composition class");
assert.ok(source.includes('class="gbi-visual"'), "intro needs a dedicated visual region so portrait does not create a dead black gap");
assert.ok(source.includes('flex:0 0 clamp(190px,38dvh,390px)'), "portrait visual stage must be viewport-relative and bounded");
assert.ok(source.includes('flex:1 1 auto;min-height:0'), "card zone must consume the remaining viewport rather than pinning to the bottom");

// iOS regression: progress on normal click semantics rather than pointerdown-only.
assert.ok(source.includes('btn.addEventListener("click",advance'), "slide progression must use click semantics for iOS Safari");
assert.ok(!source.includes('btn.addEventListener("pointerdown",advance'), "repaired intro must not regress to pointerdown-only progression");
assert.ok(source.includes('if(advancing||!active)return'), "slide progression must reject double taps/re-entrancy");

// Final-card regression: remove the blocker, invoke canonical v736 start, then verify attachment.
const launch = source.indexOf("function launchCampaign()");
const cleanup = source.indexOf("cleanup();", launch);
const start = source.indexOf("invokeStart();", launch);
assert.ok(launch >= 0 && cleanup > launch && start > cleanup, "final CTA must clear the intro before starting the campaign");
assert.ok(source.includes('function campaignAttached(){try{return !!(root.NM&&root.NM._v736);'), "final CTA must verify the canonical campaign actually attached");
assert.ok(source.includes('if(attempt<2){invokeStart();'), "final CTA needs one bounded retry instead of deadlocking");
assert.ok(source.includes('dataset.gbdBypass="1"'), "legacy director click interception must be bypassed intentionally");
assert.ok(source.includes('root.__gbiSkipBuiltinM1=true'), "legacy duplicate mission-1 cinematic must be skipped during repaired handoff");

console.log("Good Boys intro repair contract: PASS");

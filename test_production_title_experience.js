const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const SOURCE = fs.readFileSync("production_title_experience.js", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const STYLE = fs.readFileSync("style.css", "utf8");
const BOOTSTRAP = fs.readFileSync("production_bootstrap.js", "utf8");

class ClassList {
  constructor(node) { this.node = node; this.values = new Set(); }
  add(...names) { names.forEach(name => this.values.add(name)); this.sync(); }
  remove(...names) { names.forEach(name => this.values.delete(name)); this.sync(); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.values.has(name) : !!force;
    if (on) this.values.add(name); else this.values.delete(name);
    this.sync(); return on;
  }
  reset(value) { this.values = new Set(String(value || "").split(/\s+/).filter(Boolean)); this.sync(); }
  sync() { this.node._className = [...this.values].join(" "); }
}

class Element {
  constructor(document, tag) {
    this.ownerDocument = document;
    this.tagName = String(tag || "div").toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = Object.create(null);
    this.listeners = Object.create(null);
    this.classList = new ClassList(this);
    this._text = "";
    this._id = "";
    this.hidden = false;
    this.disabled = false;
  }
  set id(value) { this._id = String(value || ""); if (this._id) this.ownerDocument.ids[this._id] = this; }
  get id() { return this._id; }
  set className(value) { this.classList.reset(value); }
  get className() { return this._className || ""; }
  set textContent(value) { this.children.slice().forEach(child => { child.parentNode = null; }); this.children = []; this._text = String(value == null ? "" : value); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    this.children.push(child); child.parentNode = this; return child;
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null; return child;
  }
  insertBefore(child, anchor) {
    if (child.parentNode) child.parentNode.removeChild(child);
    const index = anchor ? this.children.indexOf(anchor) : -1;
    if (index < 0) this.children.push(child); else this.children.splice(index, 0, child);
    child.parentNode = this; return child;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  closest(selector) {
    const ids = String(selector).split(",").map(value => value.trim().replace(/^#/, ""));
    let node = this;
    while (node) { if (ids.includes(node.id)) return node; node = node.parentNode; }
    return null;
  }
}

class Document {
  constructor() {
    this.ids = Object.create(null);
    this.listeners = Object.create(null);
    this.body = this.createElement("body");
  }
  createElement(tag) { return new Element(this, tag); }
  getElementById(id) { return this.ids[id] || null; }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
}

function add(document, parent, tag, id, text, className) {
  const node = document.createElement(tag);
  node.id = id;
  node.textContent = text || "";
  if (className) node.className = className;
  parent.appendChild(node);
  return node;
}

function boot(options = {}) {
  const document = new Document();
  const screen = add(document, document.body, "section", "title-screen");
  add(document, screen, "div", "title-logo", "TECHOPS HERO");
  add(document, screen, "div", "title-flavor", "Every ticket is a dungeon.");
  const start = add(document, screen, "button", "btn-start", "CLOCK IN", "big-btn");
  const continuation = add(document, screen, "button", "btn-continue", "CONTINUE RUN", "big-btn hidden");
  add(document, screen, "div", "title-hint", "MOVE · INTERACT");
  const dogs = add(document, screen, "button", "btn-v736", "GOOD DOGS PROTOCOL — CO-OP SIDE STORY");
  const night = add(document, screen, "button", "btn-nightcrawler", "NIGHT CRAWLER");
  const storage = new Map(Object.entries(options.storage || {}));
  let dogLaunches = 0;
  let nightLaunches = 0;
  const ready = options.ready !== false;
  const rootListeners = Object.create(null);
  const context = {
    console,
    document,
    JSON,
    Date,
    Number,
    String,
    Object,
    Array,
    Math,
    Set,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); }
    },
    setInterval() { return 1; },
    clearInterval() {},
    setTimeout() { return 1; },
    addEventListener(type, handler) { (rootListeners[type] ||= []).push(handler); },
    __productionBootstrapReady: ready,
    TechOpsCampaign: ready ? {} : null,
    TechOpsCampaignNativeAct1: ready ? {} : null,
    TechOpsStory: ready ? {} : null,
    TechOpsGoodBoysButtonHardFix: {
      depsReady() { return ready; },
      launch(source) { assert.equal(source, "production-title"); dogLaunches++; return true; },
      launching: false
    },
    TechOpsProductionModeRouter: {
      launchNightCrawler(fromCapture) { assert.equal(fromCapture, true); nightLaunches++; return true; }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: "production_title_experience.js" });
  return { context, document, screen, start, continuation, dogs, night, storage, counts: () => ({ dogLaunches, nightLaunches }) };
}

function event(target) {
  return {
    target,
    defaultPrevented: false,
    propagationStopped: false,
    immediateStopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; },
    stopImmediatePropagation() { this.immediateStopped = true; }
  };
}

assert.match(
  INDEX,
  /v737_hooks\.js"><\/script><script src="production_title_experience\.js\?v=20260920-quality-r1"><\/script><script src="v742_hooks\.js/,
  "title authority must load immediately after v737 and before later wrappers"
);
assert.match(INDEX, /style\.css\?v=20260920-quality-r1/, "title CSS must use the matching cache build");
assert.match(SOURCE, /BUILD = "20260920-quality-r1"/, "runtime build marker must match the entrypoint");
assert.doesNotMatch(INDEX, /<script src="good_boys_mobile_launch_guard\.js/, "readiness gating must retire the duplicate parser-time mobile launch guard");
assert.match(BOOTSTRAP, /"good_boys_mobile_launch_guard\.js"/, "the mobile launch guard must remain in the production bootstrap before readiness");
assert.match(STYLE, /#title-mode-grid \.title-mode-card:focus-visible/, "mode cards need a visible keyboard focus treatment");
assert.match(STYLE, /@media\(max-width:620px\)/, "mode cards need a narrow-screen composition");
assert.match(STYLE, /prefers-reduced-motion:reduce/, "title motion must honor reduced-motion preference");

{
  const b = boot();
  const api = b.context.TechOpsProductionTitleExperience;
  assert.equal(api.state().ready, true, "ready production dependencies must unlock the title");
  [b.start, b.continuation, b.dogs, b.night].forEach(button => {
    assert.equal(button.getAttribute("data-production-title-card"), api.BUILD);
    assert.ok(button.getAttribute("aria-label"));
    assert.equal(button.disabled, false);
  });
  assert.equal(b.document.getElementById("title-mode-grid").children.length, 4, "all routes must share one mode-card grid");

  b.dogs.textContent = "GOOD DOGS PROTOCOL";
  api.refresh();
  assert.ok(b.dogs.children.some(child => child.classList.contains("title-mode-copy")), "a cancelled mode handoff must restore the cinematic card structure");

  const dayEvent = event(b.start);
  assert.equal(api.capture(dayEvent), true, "ready Day route must propagate to its canonical handler");
  assert.equal(dayEvent.defaultPrevented, false);

  const first = event(b.dogs);
  api.capture(first);
  const syntheticClick = event(b.dogs);
  api.capture(syntheticClick);
  assert.deepEqual(b.counts(), { dogLaunches: 1, nightLaunches: 0 }, "pointer/click pair must delegate Good Dogs exactly once");
  assert.equal(first.immediateStopped, true, "legacy Good Dogs capture and onclick routes must be blocked");
  b.context.__goodBoysOpeningPhase = {phase:"title"};
  assert.equal(api.routeCancelled("gooddogs"),true);
  assert.equal(api.state().ready,true,'cancellation releases the title synchronously');
  api.capture(event(b.dogs));
  assert.equal(b.counts().dogLaunches,2,'an immediate valid reopen cannot wait for a polling interval');
}

{
  const b = boot();
  const api = b.context.TechOpsProductionTitleExperience;
  const first = event(b.night);
  api.capture(first);
  assert.equal(b.start.disabled, true, "launching state may lock visible title input");
  b.context.__productionTitleInternalStart = "nightcrawler";
  const canonicalStart = event(b.start);
  assert.equal(api.capture(canonicalStart), true, "the router's one-shot canonical start must pass the title capture owner");
  assert.equal(canonicalStart.defaultPrevented, false);
  b.context.__productionTitleInternalStart = null;
  api.capture(event(b.night));
  assert.deepEqual(b.counts(), { dogLaunches: 0, nightLaunches: 1 }, "pointer/click pair must delegate Night Crawler exactly once");
  assert.equal(first.immediateStopped, true, "legacy Night Crawler onclick must be blocked");
}

{
  const b = boot();
  const api = b.context.TechOpsProductionTitleExperience;
  api.capture(event(b.night));
  assert.equal(api.routeFailed("nightcrawler", "night_runtime_timeout"), false);
  assert.equal(api.state().phase, "failed", "a failed alternate handoff must return title ownership to a retryable state");
  assert.equal(b.document.getElementById("title-readiness-retry").hidden, false);
}

{
  const b = boot({ ready: false });
  const api = b.context.TechOpsProductionTitleExperience;
  assert.equal(api.state().ready, false);
  [b.start, b.continuation, b.dogs, b.night].forEach(button => assert.equal(button.disabled, true));
  const coldNight = event(b.night);
  assert.equal(api.capture(coldNight), false, "cold alternate routes must fail closed");
  assert.deepEqual(b.counts(), { dogLaunches: 0, nightLaunches: 0 });
  assert.equal(coldNight.immediateStopped, true);
  assert.match(b.document.getElementById("title-readiness-detail").textContent, /No mode was started/);
  assert.ok(b.document.getElementById("title-readiness-retry"), "a visible retry control must exist for readiness failures");
}

{
  const key = "techops_nightcrawler_last_result_v1";
  const b = boot({ storage: { [key]: JSON.stringify({ summary: "District secured", message: "Three streets cleared without a down." }) } });
  assert.equal(b.storage.has(key), false, "Night result must be consumed exactly once");
  assert.equal(b.document.getElementById("title-night-result").hidden, false);
  assert.equal(b.document.getElementById("title-night-result-summary").textContent, "District secured");
  assert.equal(b.document.getElementById("title-night-result-message").textContent, "Three streets cleared without a down.");
}

console.log("Production title/readiness experience: PASS");

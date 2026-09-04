const assert = require("assert");
const arcade = require("./runtime_arcade.js");

assert.strictEqual(arcade.ARCADE_PATH, "beat-runner-tester/index.html?v=586267f");
assert.ok(arcade.isMikeDeskTitle("🖥️ MIKE'S DESK — REMOTE SESSION"));
assert.ok(arcade.isMikeDeskTitle("MIKE’S DESK"));
assert.ok(!arcade.isMikeDeskTitle("ROOT TERMINAL"));

function classList() {
  const set = new Set();
  return {
    add(...xs) { xs.forEach(x => set.add(x)); },
    remove(...xs) { xs.forEach(x => set.delete(x)); },
    contains(x) { return set.has(x); }
  };
}
function find(node, pred) {
  for (const child of node.children || []) {
    if (pred(child)) return child;
    const nested = find(child, pred);
    if (nested) return nested;
  }
  return null;
}
function element(tag, doc) {
  return {
    tagName: String(tag).toUpperCase(),
    id: "", className: "", textContent: "", innerHTML: "", hidden: false,
    children: [], parentNode: null, style: {}, attributes: {}, classList: classList(),
    appendChild(child) { child.parentNode = this; this.children.push(child); if (child.id) doc.nodes[child.id] = child; return child; },
    insertBefore(child, before) { child.parentNode = this; const i = this.children.indexOf(before); if (i < 0) this.children.push(child); else this.children.splice(i, 0, child); if (child.id) doc.nodes[child.id] = child; return child; },
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === "src") this.src = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : (k === "src" ? this.src : undefined); },
    addEventListener(type, fn) { this["_on" + type] = fn; },
    querySelector(sel) {
      if (sel === "iframe") return find(this, n => n.tagName === "IFRAME");
      if (sel === "[data-techops-arcade-hint]") return find(this, n => n.attributes && n.attributes["data-techops-arcade-hint"]);
      return null;
    }
  };
}

const doc = {
  nodes: {}, listeners: {},
  createElement(tag) { return element(tag, this); },
  getElementById(id) { return this.nodes[id] || null; },
  addEventListener(type, fn) { this.listeners[type] = fn; }
};
doc.documentElement = element("html", doc);
doc.head = element("head", doc);
doc.body = element("body", doc);

const name = element("div", doc); name.id = "dlg-name"; name.textContent = "🖥️ MIKE'S DESK — REMOTE SESSION"; doc.nodes[name.id] = name;
const text = element("div", doc); text.id = "dlg-text"; doc.nodes[text.id] = text;
const opts = element("div", doc); opts.id = "dlg-options"; doc.nodes[opts.id] = opts;
const logoff = element("button", doc); logoff.textContent = "Log off"; opts.appendChild(logoff);

let openedDesk = 0;
const host = {
  document: doc,
  mikeDesk() { openedDesk++; },
  closeDlg() {},
  open() {},
  setTimeout,
  clearTimeout
};

assert.strictEqual(arcade.install(host), true);
host.mikeDesk();
assert.strictEqual(openedDesk, 1);
const arcadeButton = doc.getElementById(arcade.BUTTON_ID);
assert.ok(arcadeButton, "Mike desk should receive the Beat Runner button");
assert.strictEqual(opts.children[0], arcadeButton, "Arcade button should appear before Log off");
assert.ok(text.querySelector("[data-techops-arcade-hint]"), "Mike desk should mention the installed game");

assert.strictEqual(arcade.openArcade(host), true);
const overlay = doc.getElementById(arcade.OVERLAY_ID);
assert.ok(overlay && !overlay.hidden, "Arcade overlay should open");
const iframe = overlay.querySelector("iframe");
assert.strictEqual(iframe.getAttribute("src"), arcade.ARCADE_PATH, "Arcade should load the standalone tester directly");

assert.strictEqual(arcade.closeArcade(host, false), true);
assert.ok(overlay.hidden, "Arcade overlay should close");
assert.strictEqual(iframe.getAttribute("src"), "about:blank", "Closing arcade should release WebGL/audio iframe");

console.log("Mike workstation arcade: PASS");

/* TechOps Hero — Day 1 reference-driven presentation bridge.
 * Stable concern module: upgrades canonical Act I dialogues with the shipped
 * standup/workstation/Shipping/Plating/access art while leaving story authority
 * in campaign_act1.js and interaction authority in campaign_native_act1.js.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignNativeAct1Visuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 1;
  var BASE = "assets/campaign/";
  var SCENES = Object.freeze({
    standup: {
      label: "TECHOPS STANDUP // 08:55",
      mode: "board",
      background: "ui.standup.board",
      props: ["ui.standup.ticket_card", "ui.standup.owner_badge"]
    },
    workstation: {
      label: "MIKE // WORKSTATION",
      mode: "first_person",
      background: "workstation.corporate_aircraft_panel",
      props: ["workstation.felicia.video_frame", "workstation.orpheus.glitch_frame"]
    },
    shipping: {
      label: "SHIPPING DOCK // DAY",
      mode: "side_view",
      background: "shipping.dock_background",
      actor: "shipping.clerk.idle",
      props: ["shipping.label_printer", "shipping.printed_label_success"]
    },
    plating: {
      label: "PLATING LINE // DAY",
      mode: "side_view",
      background: "plating.line_background",
      actor: "plating.operator.idle",
      props: ["plating.workstation_cracked", "plating.line_stopped_display"]
    },
    access: {
      label: "SECURITY OPS // IMPOSSIBLE ACCESS",
      mode: "investigation",
      background: "ui.standup.board",
      props: ["ui.standup.owner_badge"]
    }
  });

  function filename(slot) { return slot + ".png"; }
  function url(slot) { return BASE + filename(slot); }
  function contextId() {
    var c = root && root.__techopsCampaignNativeAct1Assets;
    return c && c.id ? c.id : null;
  }
  function sceneForDialog(name) {
    name = String(name || "").toUpperCase();
    var ctx = contextId();
    if (ctx && SCENES[ctx]) return ctx;
    if (name.indexOf("STANDUP") >= 0 || name.indexOf("OWNERSHIP") >= 0) return "standup";
    if (name.indexOf("WORKSTATION") >= 0 || name.indexOf("COMPANY") >= 0 || name.indexOf("ENGINEERING THE HUMAN CONNECTION") >= 0 || name.indexOf("09:00 // DAY SHIFT") >= 0) return "workstation";
    if (name.indexOf("SHIPPING") >= 0) return "shipping";
    if (name.indexOf("PLATING") >= 0) return "plating";
    if (name.indexOf("IMPOSSIBLE ACCESS") >= 0 || name.indexOf("SECURITY OPS") >= 0) return "access";
    return null;
  }
  function canDom() { return !!(root && root.document && root.document.body); }

  function ensureStyle() {
    if (!canDom() || root.document.getElementById("act1-reference-style")) return;
    var s = root.document.createElement("style");
    s.id = "act1-reference-style";
    s.textContent = [
      ".act1-reference{position:fixed;inset:0;z-index:13;overflow:hidden;pointer-events:none;background:#071017;font-family:'Press Start 2P',monospace}",
      ".act1-reference .a1-bg{position:absolute;inset:0;background-size:cover;background-position:center;image-rendering:auto;filter:saturate(.92) contrast(1.06)}",
      ".act1-reference .a1-grade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,10,15,.74),rgba(5,10,15,.12) 45%,rgba(5,10,15,.55)),radial-gradient(circle at 50% 42%,transparent 20%,rgba(0,0,0,.6) 100%)}",
      ".act1-reference .a1-label{position:absolute;left:18px;top:max(18px,env(safe-area-inset-top));font-size:9px;color:#d7e6ea;letter-spacing:1px;text-shadow:0 2px 0 #000}",
      ".act1-reference .a1-actor{position:absolute;right:10%;bottom:18%;height:52%;max-width:34%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 16px 10px rgba(0,0,0,.55))}",
      ".act1-reference .a1-props{position:absolute;left:7%;right:7%;bottom:18%;height:30%;display:flex;gap:18px;align-items:flex-end;justify-content:center}",
      ".act1-reference .a1-prop{max-width:28%;max-height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 9px 8px rgba(0,0,0,.45))}",
      ".act1-reference.a1-side_view .a1-actor{right:13%;height:48%}.act1-reference.a1-side_view .a1-props{justify-content:flex-start;left:14%;right:42%;bottom:20%}",
      ".act1-reference.a1-first_person .a1-bg{filter:brightness(.58) saturate(.8)}.act1-reference.a1-first_person .a1-props{left:15%;right:15%;bottom:24%;height:46%;align-items:center}.act1-reference.a1-first_person .a1-prop{max-width:44%;max-height:100%;box-shadow:0 0 0 2px rgba(126,255,205,.16),0 18px 40px rgba(0,0,0,.45)}",
      ".act1-reference.a1-board .a1-bg{background-size:contain;background-repeat:no-repeat;background-color:#10171b}.act1-reference.a1-board .a1-props{bottom:10%;height:26%}",
      ".act1-reference.a1-investigation .a1-bg{filter:brightness(.42) contrast(1.1)}.act1-reference.a1-investigation:after{content:'02:13  //  SECTOR04-EAST  //  VALID IDENTITY ≠ VERIFIED PRESENCE';position:absolute;left:8%;right:8%;top:22%;padding:18px;border:1px solid rgba(126,255,205,.32);background:rgba(5,16,20,.76);color:#7effcd;font-size:10px;line-height:1.7;text-align:center;text-shadow:0 0 9px rgba(126,255,205,.55)}",
      "@media(max-width:600px){.act1-reference .a1-label{font-size:7px}.act1-reference .a1-actor{right:4%;height:40%;max-width:44%;bottom:25%}.act1-reference .a1-props{left:4%;right:4%;gap:8px;bottom:25%;height:24%}.act1-reference.a1-first_person .a1-props{left:6%;right:6%;height:36%}.act1-reference.a1-investigation:after{left:4%;right:4%;font-size:7px;padding:12px}}"
    ].join("\n");
    root.document.head.appendChild(s);
  }

  function image(slot, cls) {
    var im = root.document.createElement("img");
    im.className = cls;
    im.src = url(slot);
    im.alt = "";
    return im;
  }

  function hide() {
    if (!canDom()) return false;
    var el = root.document.getElementById("act1-reference");
    if (el && el.parentNode) el.parentNode.removeChild(el);
    return !!el;
  }

  function show(sceneId) {
    var spec = SCENES[sceneId];
    if (!spec) return { id: sceneId, active: false };
    if (!canDom()) return { id: sceneId, active: false, mode: spec.mode, background: url(spec.background) };
    ensureStyle(); hide();
    var el = root.document.createElement("div");
    el.id = "act1-reference";
    el.className = "act1-reference a1-" + spec.mode;
    var bg = root.document.createElement("div");
    bg.className = "a1-bg";
    bg.style.backgroundImage = "url(" + JSON.stringify(url(spec.background)) + ")";
    el.appendChild(bg);
    var grade = root.document.createElement("div"); grade.className = "a1-grade"; el.appendChild(grade);
    if (spec.actor) el.appendChild(image(spec.actor, "a1-actor"));
    if (spec.props && spec.props.length) {
      var props = root.document.createElement("div"); props.className = "a1-props";
      spec.props.forEach(function (slot) { props.appendChild(image(slot, "a1-prop")); });
      el.appendChild(props);
    }
    var label = root.document.createElement("div"); label.className = "a1-label"; label.textContent = spec.label; el.appendChild(label);
    root.document.body.appendChild(el);
    root.__techopsAct1ReferenceScene = sceneId;
    return { id: sceneId, active: true, mode: spec.mode, background: url(spec.background) };
  }

  function install() {
    if (!root || root.__techopsAct1ReferenceInstalled || typeof root.dlg !== "function") return false;
    root.__techopsAct1ReferenceInstalled = true;
    var baseDlg = root.dlg;
    root.dlg = function (name) {
      try {
        var scene = sceneForDialog(name);
        if (scene) show(scene); else hide();
      } catch (e) {}
      return baseDlg.apply(this, arguments);
    };
    if (typeof root.closeDlg === "function") {
      var baseClose = root.closeDlg;
      root.closeDlg = function () { try { hide(); } catch (e) {} return baseClose.apply(this, arguments); };
    }
    return true;
  }

  install();
  return { VERSION: VERSION, BASE: BASE, SCENES: SCENES, filename: filename, url: url, sceneForDialog: sceneForDialog, show: show, hide: hide, install: install };
});

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

  var VERSION = 2;
  var BASE = "assets/campaign/";
  var SCENES = Object.freeze({
    standup: { label: "TECHOPS STANDUP // 08:55", mode: "board", background: "ui.standup.board", props: ["ui.standup.ticket_card", "ui.standup.owner_badge"], motion: ["board_focus", "ambient_drift"] },
    workstation: { label: "MIKE // WORKSTATION", mode: "first_person", background: "workstation.corporate_aircraft_panel", props: ["workstation.felicia.video_frame", "workstation.orpheus.glitch_frame"], motion: ["screen_scan", "orpheus_glitch", "camera_push"] },
    shipping: { label: "SHIPPING DOCK // DAY", mode: "side_view", background: "shipping.dock_background", actor: "shipping.clerk.idle", props: ["shipping.label_printer", "shipping.printed_label_success"], motion: ["forklift_pass", "printer_feed", "camera_track"] },
    plating: { label: "PLATING LINE // DAY", mode: "side_view", background: "plating.line_background", actor: "plating.operator.idle", props: ["plating.workstation_cracked", "plating.line_stopped_display"], motion: ["warning_beacon", "machine_idle", "camera_track"] },
    access: { label: "SECURITY OPS // IMPOSSIBLE ACCESS", mode: "investigation", background: "ui.standup.board", props: ["ui.standup.owner_badge"], motion: ["audit_sweep", "evidence_pulse", "camera_push"] }
  });

  function filename(slot) { return slot + ".png"; }
  function url(slot) { return BASE + filename(slot); }
  function contextId() { var c = root && root.__techopsCampaignNativeAct1Assets; return c && c.id ? c.id : null; }
  function motionFor(sceneId) { var scene = SCENES[sceneId]; return scene && scene.motion ? scene.motion.slice() : []; }
  function sceneForDialog(name) {
    name = String(name || "").toUpperCase();
    var ctx = contextId();
    if (ctx && SCENES[ctx]) return ctx;
    // Specific ticket scenes must win before the generic WORKSTATION token;
    // e.g. "PLATING WORKSTATION DOWN" is a factory scene, not Mike's desktop.
    if (name.indexOf("SHIPPING") >= 0) return "shipping";
    if (name.indexOf("PLATING") >= 0) return "plating";
    if (name.indexOf("IMPOSSIBLE ACCESS") >= 0 || name.indexOf("SECURITY OPS") >= 0) return "access";
    if (name.indexOf("STANDUP") >= 0 || name.indexOf("OWNERSHIP") >= 0) return "standup";
    if (name.indexOf("WORKSTATION") >= 0 || name.indexOf("COMPANY") >= 0 || name.indexOf("ENGINEERING THE HUMAN CONNECTION") >= 0 || name.indexOf("09:00 // DAY SHIFT") >= 0) return "workstation";
    return null;
  }
  function canDom() { return !!(root && root.document && root.document.body); }
  function reducedMotion() {
    try { return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
  }
  function ensureStyle() {
    if (!canDom() || root.document.getElementById("act1-reference-style")) return;
    var s = root.document.createElement("style"); s.id = "act1-reference-style";
    s.textContent = [
      ".act1-reference{position:fixed;inset:0;z-index:13;overflow:hidden;pointer-events:none;background:#071017;font-family:'Press Start 2P',monospace;animation:a1-enter .22s ease-out both}",
      ".act1-reference .a1-bg{position:absolute;inset:-2%;background-size:cover;background-position:center;image-rendering:auto;filter:saturate(.92) contrast(1.06);animation:a1-breathe 8s ease-in-out infinite alternate}",
      ".act1-reference .a1-grade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,10,15,.74),rgba(5,10,15,.12) 45%,rgba(5,10,15,.55)),radial-gradient(circle at 50% 42%,transparent 20%,rgba(0,0,0,.6) 100%)}",
      ".act1-reference .a1-label{position:absolute;left:18px;top:max(18px,env(safe-area-inset-top));font-size:9px;color:#d7e6ea;letter-spacing:1px;text-shadow:0 2px 0 #000}",
      ".act1-reference .a1-actor{position:absolute;right:10%;bottom:18%;height:52%;max-width:34%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 16px 10px rgba(0,0,0,.55));animation:a1-actor-idle 2.8s ease-in-out infinite alternate}",
      ".act1-reference .a1-props{position:absolute;left:7%;right:7%;bottom:18%;height:30%;display:flex;gap:18px;align-items:flex-end;justify-content:center}",
      ".act1-reference .a1-prop{max-width:28%;max-height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 9px 8px rgba(0,0,0,.45))}",
      ".act1-reference.a1-side_view .a1-actor{right:13%;height:48%}.act1-reference.a1-side_view .a1-props{justify-content:flex-start;left:14%;right:42%;bottom:20%}",
      ".act1-reference.a1-first_person .a1-bg{filter:brightness(.58) saturate(.8)}.act1-reference.a1-first_person .a1-props{left:15%;right:15%;bottom:24%;height:46%;align-items:center}.act1-reference.a1-first_person .a1-prop{max-width:44%;max-height:100%;box-shadow:0 0 0 2px rgba(126,255,205,.16),0 18px 40px rgba(0,0,0,.45)}",
      ".act1-reference.a1-board .a1-bg{background-size:contain;background-repeat:no-repeat;background-color:#10171b}.act1-reference.a1-board .a1-props{bottom:10%;height:26%}",
      ".act1-reference.a1-investigation .a1-bg{filter:brightness(.42) contrast(1.1)}.act1-reference.a1-investigation:after{content:'02:13  //  SECTOR04-EAST  //  VALID IDENTITY ≠ VERIFIED PRESENCE';position:absolute;left:8%;right:8%;top:22%;padding:18px;border:1px solid rgba(126,255,205,.32);background:rgba(5,16,20,.76);color:#7effcd;font-size:10px;line-height:1.7;text-align:center;text-shadow:0 0 9px rgba(126,255,205,.55);animation:a1-evidence 2.2s ease-in-out infinite}",
      ".act1-reference .a1-motion{position:absolute;pointer-events:none}",
      ".act1-reference .a1-scan{inset:0;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(126,255,205,.035) 6px 7px);animation:a1-scan 4s linear infinite}",
      ".act1-reference .a1-glitch{left:13%;right:13%;top:20%;height:2px;background:#8d5cff;box-shadow:0 0 15px rgba(141,92,255,.85);opacity:0;animation:a1-glitch 5.4s steps(1,end) infinite}",
      ".act1-reference .a1-forklift{left:-24%;bottom:21%;width:18%;height:11%;border:3px solid rgba(213,178,75,.42);background:linear-gradient(90deg,rgba(65,52,19,.72),rgba(128,99,28,.62));box-shadow:28px -18px 0 -12px rgba(80,64,22,.7);animation:a1-forklift 10s linear infinite}",
      ".act1-reference .a1-feed{left:18%;bottom:20%;width:62px;height:3px;background:#dfe8e7;box-shadow:0 5px 0 rgba(255,255,255,.3);transform-origin:left center;animation:a1-feed 2.6s ease-in-out infinite}",
      ".act1-reference .a1-beacon{right:4%;top:18%;width:18px;height:18px;border-radius:50%;background:#ff593f;box-shadow:0 0 30px #ff593f;animation:a1-beacon 1.15s steps(2,end) infinite}",
      ".act1-reference .a1-machine{left:0;right:0;bottom:24%;height:2px;background:linear-gradient(90deg,transparent,rgba(255,194,86,.45),transparent);animation:a1-machine 3.2s linear infinite}",
      ".act1-reference .a1-audit{left:8%;right:8%;top:21%;height:2px;background:#7effcd;box-shadow:0 0 15px rgba(126,255,205,.8);animation:a1-audit 2.8s ease-in-out infinite}",
      ".act1-reference.a1-camera_push .a1-bg{animation:a1-push 7s ease-in-out infinite alternate}.act1-reference.a1-camera_track .a1-bg{animation:a1-track 9s ease-in-out infinite alternate}",
      ".act1-reference.a1-board_focus .a1-props .a1-prop:first-child{animation:a1-boardfocus 2.8s ease-in-out infinite}",
      "@keyframes a1-enter{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}",
      "@keyframes a1-breathe{from{transform:scale(1.01)}to{transform:scale(1.025)}}",
      "@keyframes a1-push{from{transform:scale(1.01) translateX(0)}to{transform:scale(1.055) translateX(-.7%)}}",
      "@keyframes a1-track{from{transform:scale(1.025) translateX(-1.3%)}to{transform:scale(1.025) translateX(1.3%)}}",
      "@keyframes a1-actor-idle{from{transform:translateY(0)}to{transform:translateY(-4px)}}",
      "@keyframes a1-scan{from{transform:translateY(-8px)}to{transform:translateY(8px)}}",
      "@keyframes a1-glitch{0%,91%,94%,100%{opacity:0;transform:translateY(0)}92%{opacity:.8;transform:translateY(70px)}93%{opacity:.35;transform:translateY(115px)}}",
      "@keyframes a1-forklift{0%,10%{transform:translateX(0)}70%,100%{transform:translateX(760%)}}",
      "@keyframes a1-feed{0%,35%{transform:scaleX(.15);opacity:.45}60%,85%{transform:scaleX(1);opacity:1}100%{transform:translateY(12px) scaleX(1);opacity:0}}",
      "@keyframes a1-beacon{0%,45%{opacity:.25}50%,100%{opacity:1}}",
      "@keyframes a1-machine{from{transform:translateX(-30%)}to{transform:translateX(30%)}}",
      "@keyframes a1-audit{0%,100%{transform:translateY(0);opacity:.2}50%{transform:translateY(165px);opacity:.8}}",
      "@keyframes a1-evidence{0%,100%{box-shadow:0 0 0 rgba(126,255,205,0)}50%{box-shadow:0 0 24px rgba(126,255,205,.18)}}",
      "@keyframes a1-boardfocus{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}",
      "@media(prefers-reduced-motion:reduce){.act1-reference,.act1-reference *{animation:none!important;transition:none!important}}",
      "@media(max-width:600px){.act1-reference .a1-label{font-size:7px}.act1-reference .a1-actor{right:4%;height:40%;max-width:44%;bottom:25%}.act1-reference .a1-props{left:4%;right:4%;gap:8px;bottom:25%;height:24%}.act1-reference.a1-first_person .a1-props{left:6%;right:6%;height:36%}.act1-reference.a1-investigation:after{left:4%;right:4%;font-size:7px;padding:12px}.act1-reference .a1-forklift{bottom:28%}}"
    ].join("\n"); root.document.head.appendChild(s);
  }
  function image(slot, cls) { var im = root.document.createElement("img"); im.className = cls; im.src = url(slot); im.alt = ""; return im; }
  function motionNode(cls) { var n = root.document.createElement("div"); n.className = "a1-motion " + cls; return n; }
  function addMotion(el, sceneId) {
    if (!el || reducedMotion()) return;
    var motion = motionFor(sceneId);
    motion.forEach(function (name) {
      if (name === "camera_push" || name === "camera_track" || name === "board_focus") el.className += " a1-" + name;
      else if (name === "screen_scan") el.appendChild(motionNode("a1-scan"));
      else if (name === "orpheus_glitch") el.appendChild(motionNode("a1-glitch"));
      else if (name === "forklift_pass") el.appendChild(motionNode("a1-forklift"));
      else if (name === "printer_feed") el.appendChild(motionNode("a1-feed"));
      else if (name === "warning_beacon") el.appendChild(motionNode("a1-beacon"));
      else if (name === "machine_idle") el.appendChild(motionNode("a1-machine"));
      else if (name === "audit_sweep") el.appendChild(motionNode("a1-audit"));
    });
  }
  function hide() { if (!canDom()) return false; var el = root.document.getElementById("act1-reference"); if (el && el.parentNode) el.parentNode.removeChild(el); root.__techopsAct1ReferenceScene = null; return !!el; }
  function show(sceneId) {
    var spec = SCENES[sceneId];
    if (!spec) return { id: sceneId, active: false };
    if (!canDom()) return { id: sceneId, active: false, mode: spec.mode, background: url(spec.background), motion: motionFor(sceneId) };
    ensureStyle(); hide();
    var el = root.document.createElement("div"); el.id = "act1-reference"; el.className = "act1-reference a1-" + spec.mode;
    var bg = root.document.createElement("div"); bg.className = "a1-bg"; bg.style.backgroundImage = "url(" + JSON.stringify(url(spec.background)) + ")"; el.appendChild(bg);
    var grade = root.document.createElement("div"); grade.className = "a1-grade"; el.appendChild(grade);
    if (spec.actor) el.appendChild(image(spec.actor, "a1-actor"));
    if (spec.props && spec.props.length) { var props = root.document.createElement("div"); props.className = "a1-props"; spec.props.forEach(function (slot) { props.appendChild(image(slot, "a1-prop")); }); el.appendChild(props); }
    addMotion(el, sceneId);
    var label = root.document.createElement("div"); label.className = "a1-label"; label.textContent = spec.label; el.appendChild(label);
    root.document.body.appendChild(el); root.__techopsAct1ReferenceScene = sceneId;
    return { id: sceneId, active: true, mode: spec.mode, background: url(spec.background), motion: motionFor(sceneId) };
  }
  function install() {
    if (!root || root.__techopsAct1ReferenceInstalled || typeof root.dlg !== "function") return false;
    root.__techopsAct1ReferenceInstalled = true;
    var baseDlg = root.dlg;
    root.dlg = function (name) { try { var scene = sceneForDialog(name); if (scene) show(scene); else hide(); } catch (e) {} return baseDlg.apply(this, arguments); };
    if (typeof root.closeDlg === "function") { var baseClose = root.closeDlg; root.closeDlg = function () { try { hide(); } catch (e) {} return baseClose.apply(this, arguments); }; }
    return true;
  }
  install();
  return { VERSION: VERSION, BASE: BASE, SCENES: SCENES, filename: filename, url: url, motionFor: motionFor, sceneForDialog: sceneForDialog, show: show, hide: hide, install: install };
});

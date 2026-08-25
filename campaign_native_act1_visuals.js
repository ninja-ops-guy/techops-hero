/* TechOps Hero — Day 1 reference-driven presentation bridge.
 * Stable concern module. Story authority remains in campaign_act1.js and
 * interaction authority remains in campaign_native_act1.js.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsCampaignNativeAct1Visuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var VERSION = 3;
  var BASE = "assets/campaign/";
  var EXIT_MS = 180;
  var SCENES = Object.freeze({
    standup: { label: "TECHOPS STANDUP // 08:55", mode: "board", background: "ui.standup.board", props: ["ui.standup.ticket_card", "ui.standup.owner_badge"] },
    workstation: { label: "MIKE // WORKSTATION", mode: "first_person", background: "workstation.corporate_aircraft_panel", props: ["workstation.felicia.video_frame", "workstation.orpheus.glitch_frame"] },
    shipping: { label: "SHIPPING DOCK // DAY", mode: "side_view", background: "shipping.dock_background", actor: "shipping.clerk.idle", props: ["shipping.label_printer", "shipping.printed_label_success"] },
    plating: { label: "PLATING LINE // DAY", mode: "side_view", background: "plating.line_background", actor: "plating.operator.idle", props: ["plating.workstation_cracked", "plating.line_stopped_display"] },
    access: { label: "SECURITY OPS // IMPOSSIBLE ACCESS", mode: "investigation", background: "ui.standup.board", props: ["ui.standup.owner_badge"] }
  });

  function filename(slot) { return slot + ".png"; }
  function url(slot) { return BASE + filename(slot); }
  function contextId() { var c = root && root.__techopsCampaignNativeAct1Assets; return c && c.id ? c.id : null; }
  function canDom() { return !!(root && root.document && root.document.body); }
  function reducedMotion() { try { return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } }
  function loadCampaign() {
    try { return root && root.TechOpsCampaign && typeof root.TechOpsCampaign.load === "function" ? root.TechOpsCampaign.load(root.localStorage) : null; }
    catch (e) { return null; }
  }
  function sceneForDialog(name) {
    name = String(name || "").toUpperCase();
    var ctx = contextId();
    if (ctx && SCENES[ctx]) return ctx;
    if (name.indexOf("SHIPPING") >= 0) return "shipping";
    if (name.indexOf("PLATING") >= 0) return "plating";
    if (name.indexOf("IMPOSSIBLE ACCESS") >= 0 || name.indexOf("SECURITY OPS") >= 0) return "access";
    if (name.indexOf("STANDUP") >= 0 || name.indexOf("OWNERSHIP") >= 0) return "standup";
    if (name.indexOf("WORKSTATION") >= 0 || name.indexOf("COMPANY") >= 0 || name.indexOf("ENGINEERING THE HUMAN CONNECTION") >= 0 || name.indexOf("09:00 // DAY SHIFT") >= 0) return "workstation";
    return null;
  }

  function presentationFor(sceneId, state, dialogName) {
    state = state || null;
    var flags = state && state.flags || {};
    var tickets = state && state.tickets || {};
    var evidence = state && state.evidence && state.evidence.ghostIdentityEvidence || { status: "unknown", sources: [] };
    var p = { sceneId: sceneId, variant: "default", props: (SCENES[sceneId] && SCENES[sceneId].props || []).slice(), motion: [], statusText: null };

    if (sceneId === "standup") {
      p.variant = flags.standup_completed ? "owned" : "assigning";
      p.motion = flags.standup_completed ? ["board_lock", "ambient_drift"] : ["board_focus", "ambient_drift"];
      p.statusText = flags.standup_completed ? "ALL ACTIVE TICKETS OWNED" : "ASSIGN ONE OWNER PER ACTIVE TICKET";
    } else if (sceneId === "workstation") {
      var n = String(dialogName || "").toUpperCase();
      var video = n.indexOf("ENGINEERING THE HUMAN CONNECTION") >= 0 || n.indexOf("COMPANY // FELICIA") >= 0;
      p.variant = flags.day_work_unlocked ? "clocked_in" : (video ? "company_video" : "pre_shift");
      p.motion = ["screen_scan", "camera_push"];
      if (video) p.motion.push("orpheus_glitch");
      p.statusText = flags.day_work_unlocked ? "DAY SHIFT ACTIVE" : "TICKET CLOCK PAUSED";
    } else if (sceneId === "shipping") {
      var shippingDone = !!tickets.shipping_cannot_print;
      p.variant = shippingDone ? "verified" : "fault";
      p.props = shippingDone ? ["shipping.printed_label_success"] : ["shipping.label_printer"];
      p.motion = shippingDone ? ["verification_glow", "printer_eject", "camera_push"] : ["forklift_pass", "printer_feed", "camera_track"];
      p.statusText = shippingDone ? "CUSTOMS LABEL VERIFIED BY REQUESTER" : "PRINT JOBS DISAPPEAR FROM QUEUE";
    } else if (sceneId === "plating") {
      var platingDone = !!tickets.plating_workstation_down;
      p.variant = platingDone ? "restored" : "stopped";
      p.props = platingDone ? [] : ["plating.workstation_cracked", "plating.line_stopped_display"];
      p.motion = platingDone ? ["machine_run", "status_clear", "camera_push"] : ["warning_beacon", "machine_idle", "camera_track"];
      p.statusText = platingDone ? "OPERATOR VERIFIED — LINE RESUMED" : "LINE STOPPED — DIGITAL DEPENDENCY";
    } else if (sceneId === "access") {
      var established = evidence.status === "established";
      p.variant = established ? "documented" : "unresolved";
      p.motion = established ? ["audit_lock", "evidence_stack", "camera_push"] : ["audit_sweep", "evidence_pulse", "camera_push"];
      p.statusText = established ? "CONTRADICTION PRESERVED WITH PROVENANCE" : "VALID IDENTITY ≠ VERIFIED PRESENCE";
    }
    return p;
  }
  function motionFor(sceneId, state, dialogName) { return presentationFor(sceneId, state, dialogName).motion.slice(); }

  function ensureStyle() {
    if (!canDom() || root.document.getElementById("act1-reference-style")) return;
    var s = root.document.createElement("style"); s.id = "act1-reference-style";
    s.textContent = [
      ".act1-reference{position:fixed;inset:0;z-index:13;overflow:hidden;pointer-events:none;background:#071017;font-family:'Press Start 2P',monospace;animation:a1-enter .22s ease-out both}",
      ".act1-reference.a1-leave{animation:a1-leave .18s ease-in both}",
      ".act1-reference .a1-bg{position:absolute;inset:-2%;background-size:cover;background-position:center;image-rendering:auto;filter:saturate(.92) contrast(1.06);animation:a1-breathe 8s ease-in-out infinite alternate}",
      ".act1-reference .a1-grade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,10,15,.74),rgba(5,10,15,.12) 45%,rgba(5,10,15,.55)),radial-gradient(circle at 50% 42%,transparent 20%,rgba(0,0,0,.6) 100%)}",
      ".act1-reference .a1-label{position:absolute;left:18px;top:max(18px,env(safe-area-inset-top));font-size:9px;color:#d7e6ea;letter-spacing:1px;text-shadow:0 2px 0 #000}",
      ".act1-reference .a1-status{position:absolute;left:8%;right:8%;bottom:10%;padding:9px 12px;border:1px solid rgba(215,230,234,.16);background:rgba(4,10,14,.68);color:#d7e6ea;font-size:8px;line-height:1.5;text-align:center;text-shadow:0 2px 0 #000}",
      ".act1-reference.a1-verified .a1-status,.act1-reference.a1-restored .a1-status,.act1-reference.a1-documented .a1-status,.act1-reference.a1-owned .a1-status{color:#7effcd;border-color:rgba(126,255,205,.32)}",
      ".act1-reference .a1-actor{position:absolute;right:10%;bottom:18%;height:52%;max-width:34%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 16px 10px rgba(0,0,0,.55));animation:a1-actor-idle 2.8s ease-in-out infinite alternate}",
      ".act1-reference .a1-props{position:absolute;left:7%;right:7%;bottom:18%;height:30%;display:flex;gap:18px;align-items:flex-end;justify-content:center}",
      ".act1-reference .a1-prop{max-width:28%;max-height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 9px 8px rgba(0,0,0,.45))}",
      ".act1-reference.a1-side_view .a1-actor{right:13%;height:48%}.act1-reference.a1-side_view .a1-props{justify-content:flex-start;left:14%;right:42%;bottom:20%}",
      ".act1-reference.a1-first_person .a1-bg{filter:brightness(.58) saturate(.8)}.act1-reference.a1-first_person .a1-props{left:15%;right:15%;bottom:24%;height:46%;align-items:center}.act1-reference.a1-first_person .a1-prop{max-width:44%;max-height:100%;box-shadow:0 0 0 2px rgba(126,255,205,.16),0 18px 40px rgba(0,0,0,.45)}",
      ".act1-reference.a1-board .a1-bg{background-size:contain;background-repeat:no-repeat;background-color:#10171b}.act1-reference.a1-board .a1-props{bottom:14%;height:24%}",
      ".act1-reference.a1-investigation .a1-bg{filter:brightness(.42) contrast(1.1)}.act1-reference.a1-investigation:after{content:'02:13  //  SECTOR04-EAST';position:absolute;left:8%;right:8%;top:22%;padding:18px;border:1px solid rgba(126,255,205,.32);background:rgba(5,16,20,.76);color:#7effcd;font-size:10px;line-height:1.7;text-align:center;text-shadow:0 0 9px rgba(126,255,205,.55)}",
      ".act1-reference .a1-motion{position:absolute;pointer-events:none}.act1-reference .a1-scan{inset:0;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(126,255,205,.035) 6px 7px);animation:a1-scan 4s linear infinite}",
      ".act1-reference .a1-glitch{left:13%;right:13%;top:20%;height:2px;background:#8d5cff;box-shadow:0 0 15px rgba(141,92,255,.85);opacity:0;animation:a1-glitch 5.4s steps(1,end) infinite}",
      ".act1-reference .a1-forklift{left:-24%;bottom:21%;width:18%;height:11%;border:3px solid rgba(213,178,75,.42);background:linear-gradient(90deg,rgba(65,52,19,.72),rgba(128,99,28,.62));box-shadow:28px -18px 0 -12px rgba(80,64,22,.7);animation:a1-forklift 10s linear infinite}",
      ".act1-reference .a1-feed{left:18%;bottom:20%;width:62px;height:3px;background:#dfe8e7;box-shadow:0 5px 0 rgba(255,255,255,.3);transform-origin:left center;animation:a1-feed 2.6s ease-in-out infinite}",
      ".act1-reference .a1-eject{left:23%;bottom:23%;width:72px;height:34px;background:rgba(245,248,244,.92);box-shadow:0 0 18px rgba(126,255,205,.35);animation:a1-eject 2.8s ease-in-out infinite}",
      ".act1-reference .a1-beacon{right:4%;top:18%;width:18px;height:18px;border-radius:50%;background:#ff593f;box-shadow:0 0 30px #ff593f;animation:a1-beacon 1.15s steps(2,end) infinite}",
      ".act1-reference .a1-machine{left:0;right:0;bottom:24%;height:2px;background:linear-gradient(90deg,transparent,rgba(255,194,86,.45),transparent);animation:a1-machine 3.2s linear infinite}",
      ".act1-reference .a1-run{left:0;right:0;bottom:24%;height:4px;background:linear-gradient(90deg,transparent,rgba(126,255,205,.42),transparent);animation:a1-run 1.35s linear infinite}",
      ".act1-reference .a1-audit{left:8%;right:8%;top:21%;height:2px;background:#7effcd;box-shadow:0 0 15px rgba(126,255,205,.8);animation:a1-audit 2.8s ease-in-out infinite}",
      ".act1-reference .a1-lock{left:18%;right:18%;top:32%;bottom:36%;border:1px solid rgba(126,255,205,.35);box-shadow:inset 0 0 30px rgba(126,255,205,.08);animation:a1-lock 2.4s ease-in-out infinite}",
      ".act1-reference .a1-verify{left:12%;right:12%;bottom:16%;height:3px;background:#7effcd;box-shadow:0 0 20px rgba(126,255,205,.65);animation:a1-verify 2s ease-in-out infinite}",
      ".act1-reference.a1-camera_push .a1-bg{animation:a1-push 7s ease-in-out infinite alternate}.act1-reference.a1-camera_track .a1-bg{animation:a1-track 9s ease-in-out infinite alternate}",
      ".act1-reference.a1-board_focus .a1-props .a1-prop:first-child{animation:a1-boardfocus 2.8s ease-in-out infinite}.act1-reference.a1-board_lock .a1-props{filter:drop-shadow(0 0 14px rgba(126,255,205,.18))}",
      "@keyframes a1-enter{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}@keyframes a1-leave{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.992)}}",
      "@keyframes a1-breathe{from{transform:scale(1.01)}to{transform:scale(1.025)}}@keyframes a1-push{from{transform:scale(1.01) translateX(0)}to{transform:scale(1.055) translateX(-.7%)}}@keyframes a1-track{from{transform:scale(1.025) translateX(-1.3%)}to{transform:scale(1.025) translateX(1.3%)}}",
      "@keyframes a1-actor-idle{from{transform:translateY(0)}to{transform:translateY(-4px)}}@keyframes a1-scan{from{transform:translateY(-8px)}to{transform:translateY(8px)}}@keyframes a1-glitch{0%,91%,94%,100%{opacity:0;transform:translateY(0)}92%{opacity:.8;transform:translateY(70px)}93%{opacity:.35;transform:translateY(115px)}}",
      "@keyframes a1-forklift{0%,10%{transform:translateX(0)}70%,100%{transform:translateX(760%)}}@keyframes a1-feed{0%,35%{transform:scaleX(.15);opacity:.45}60%,85%{transform:scaleX(1);opacity:1}100%{transform:translateY(12px) scaleX(1);opacity:0}}@keyframes a1-eject{0%,25%{transform:translateY(-14px);opacity:0}45%,78%{transform:translateY(0);opacity:1}100%{transform:translateY(12px);opacity:0}}",
      "@keyframes a1-beacon{0%,45%{opacity:.25}50%,100%{opacity:1}}@keyframes a1-machine{from{transform:translateX(-30%)}to{transform:translateX(30%)}}@keyframes a1-run{from{transform:translateX(-40%)}to{transform:translateX(40%)}}",
      "@keyframes a1-audit{0%,100%{transform:translateY(0);opacity:.2}50%{transform:translateY(165px);opacity:.8}}@keyframes a1-lock{0%,100%{opacity:.35}50%{opacity:.8}}@keyframes a1-verify{0%,100%{opacity:.25;transform:scaleX(.5)}50%{opacity:.9;transform:scaleX(1)}}@keyframes a1-boardfocus{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}",
      "@media(prefers-reduced-motion:reduce){.act1-reference,.act1-reference *{animation:none!important;transition:none!important}}",
      "@media(max-width:600px){.act1-reference .a1-label{font-size:7px}.act1-reference .a1-status{font-size:6px;bottom:14%}.act1-reference .a1-actor{right:4%;height:40%;max-width:44%;bottom:25%}.act1-reference .a1-props{left:4%;right:4%;gap:8px;bottom:25%;height:24%}.act1-reference.a1-first_person .a1-props{left:6%;right:6%;height:36%}.act1-reference.a1-investigation:after{left:4%;right:4%;font-size:7px;padding:12px}.act1-reference .a1-forklift{bottom:28%}}"
    ].join("\n"); root.document.head.appendChild(s);
  }

  function image(slot, cls) { var im = root.document.createElement("img"); im.className = cls; im.src = url(slot); im.alt = ""; return im; }
  function motionNode(cls) { var n = root.document.createElement("div"); n.className = "a1-motion " + cls; return n; }
  function addMotion(el, profile) {
    if (!el || reducedMotion()) return;
    profile.motion.forEach(function (name) {
      if (name === "camera_push" || name === "camera_track" || name === "board_focus" || name === "board_lock") el.className += " a1-" + name;
      else if (name === "screen_scan") el.appendChild(motionNode("a1-scan"));
      else if (name === "orpheus_glitch") el.appendChild(motionNode("a1-glitch"));
      else if (name === "forklift_pass") el.appendChild(motionNode("a1-forklift"));
      else if (name === "printer_feed") el.appendChild(motionNode("a1-feed"));
      else if (name === "printer_eject") el.appendChild(motionNode("a1-eject"));
      else if (name === "warning_beacon") el.appendChild(motionNode("a1-beacon"));
      else if (name === "machine_idle") el.appendChild(motionNode("a1-machine"));
      else if (name === "machine_run") el.appendChild(motionNode("a1-run"));
      else if (name === "audit_sweep") el.appendChild(motionNode("a1-audit"));
      else if (name === "audit_lock") el.appendChild(motionNode("a1-lock"));
      else if (name === "verification_glow" || name === "status_clear" || name === "evidence_stack") el.appendChild(motionNode("a1-verify"));
    });
  }

  function removeNow(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
  function hide(immediate) {
    if (!canDom()) return false;
    var el = root.document.getElementById("act1-reference");
    if (!el) return false;
    root.__techopsAct1ReferenceScene = null;
    if (immediate || reducedMotion() || !root.setTimeout) removeNow(el);
    else { el.className += " a1-leave"; root.setTimeout(function () { removeNow(el); }, EXIT_MS); }
    return true;
  }
  function show(sceneId, dialogName, state) {
    var spec = SCENES[sceneId];
    if (!spec) return { id: sceneId, active: false };
    state = state || loadCampaign();
    var profile = presentationFor(sceneId, state, dialogName);
    if (!canDom()) return { id: sceneId, active: false, mode: spec.mode, background: url(spec.background), presentation: profile };
    ensureStyle(); hide(true);
    var el = root.document.createElement("div"); el.id = "act1-reference"; el.className = "act1-reference a1-" + spec.mode + " a1-" + profile.variant;
    var bg = root.document.createElement("div"); bg.className = "a1-bg"; bg.style.backgroundImage = "url(" + JSON.stringify(url(spec.background)) + ")"; el.appendChild(bg);
    var grade = root.document.createElement("div"); grade.className = "a1-grade"; el.appendChild(grade);
    if (spec.actor) el.appendChild(image(spec.actor, "a1-actor"));
    if (profile.props.length) { var props = root.document.createElement("div"); props.className = "a1-props"; profile.props.forEach(function (slot) { props.appendChild(image(slot, "a1-prop")); }); el.appendChild(props); }
    addMotion(el, profile);
    var label = root.document.createElement("div"); label.className = "a1-label"; label.textContent = spec.label; el.appendChild(label);
    if (profile.statusText) { var status = root.document.createElement("div"); status.className = "a1-status"; status.textContent = profile.statusText; el.appendChild(status); }
    root.document.body.appendChild(el); root.__techopsAct1ReferenceScene = sceneId;
    return { id: sceneId, active: true, mode: spec.mode, background: url(spec.background), presentation: profile };
  }

  function install() {
    if (!root || root.__techopsAct1ReferenceInstalled || typeof root.dlg !== "function") return false;
    root.__techopsAct1ReferenceInstalled = true;
    var baseDlg = root.dlg;
    root.dlg = function (name) { try { var scene = sceneForDialog(name); if (scene) show(scene, name); else hide(false); } catch (e) {} return baseDlg.apply(this, arguments); };
    if (typeof root.closeDlg === "function") { var baseClose = root.closeDlg; root.closeDlg = function () { try { hide(false); } catch (e) {} return baseClose.apply(this, arguments); }; }
    return true;
  }

  install();
  return { VERSION: VERSION, BASE: BASE, EXIT_MS: EXIT_MS, SCENES: SCENES, filename: filename, url: url, sceneForDialog: sceneForDialog, presentationFor: presentationFor, motionFor: motionFor, show: show, hide: hide, install: install };
});

/* ==========================================================================
   v7.18 — ASK, DON'T ANSWER
   The v7.14 decision tree had a role inversion: branch questions like
   "Is it just you, or the whole team locked out?" were answered BY THE
   PLAYER ("pick what you actually observe") — which both breaks the
   fiction (it's the USER's problem, they hold the observations) and lets
   players metagame by picking whichever answer prunes the most.

   Now the question is put TO the ticket user, and the user answers
   according to the ticket's actual hidden root cause (TRUTH table,
   hand-audited against every type's diag.best). The player chooses WHICH
   question to ask — the world decides what the answer is.

   Implemented at the dlg layer (loads last, outermost): tree question
   dialogs ("🔧 {label} — {short}") get their answer buttons collapsed
   into a single "Ask the user" action that fires the TRUE answer's
   original callback. Costs/rewards unchanged (+5 min, +5 conf).
   ========================================================================== */
(function () {
  "use strict";

  /* true answer index per type:node — audited against each type's diag.best */
  const TRUTH = {
    "printer:scope": 0, "printer:queue": 0,         // spooler crash → everyone down, jobs vanish
    "vpn:stage": 0, "vpn:reach": 0,                 // certs/IKE → dies in handshake, gateway pings fine
    "dns:split": 0, "dns:scope": 0,                 // bad record → IP works, internal names fail
    "ad:pattern": 0, "ad:follows": 0,               // stored-cred retry → instant re-lock, follows the user
    "malware:behavior": 0, "malware:spread": 0,     // scareware, spreading → isolate first
    "email:split": 1, "email:direction": 0,         // Exchange queue/auth → OWA broken too, can't send
    "bsod:pattern": 0, "bsod:boot": 0,              // same driver every time, crashes during boot
    "plc:link": 1, "plc:segment": 1,                // VLAN/trunk → link up no ping, whole line dropped
    "wifi:scope": 0, "wifi:band": 0,                // coverage/congestion → area-wide, 2.4 GHz dead
    "cert:who": 0, "cert:detail": 0,                // expired cert → every client warns, "expired"
    "disk:what": 0, "disk:rate": 1,                 // logs/temps, slow creep → purge + quotas
    "update:stage": 1, "update:history": 0,         // servicing stack → installs then rolls back, failed before
    "share:scope": 0, "share:layer": 0,             // one SID denied, instant "Access is denied"
    "vlan:scope": 0, "vlan:lease": 1,               // one jack, valid IP from the WRONG range
    "backup:when": 0, "backup:target": 1,           // VSS snapshot fails instantly, target has room
    "slowpc:when": 0, "slowpc:resmon": 0,           // login pile-up, disk at 100%
    "av_hdmi:chain": 0, "av_hdmi:cheap": 0,         // no signal on all inputs, cable swap fixes
    "av_teams:scope": 0, "av_teams:periph": 1,      // signed out (account), peripherals healthy
    "plant_scanner:where": 0, "plant_scanner:base": 0, // roaming drops in aisles, only this unit dead
    "label_printer:reach": 0, "label_printer:queue": 0, // unreachable (DHCP/share), jobs stack
    "hw_replace:facts": 0, "hw_replace:diag": 0,    // 6+ years, disk+battery failing
    "shadow:trace": 1,                              // orphaned/reparented → trace to the root terminal
  };

  function findNode(label, short) {
    const t = (typeof TICKET_TYPES !== "undefined") && TICKET_TYPES.find(x => x.label === label);
    if (!t || !window.v714 || !window.v714.DT) return null;
    const nd = (window.v714.DT[t.id] || []).find(x => x.short === short);
    return nd ? { type: t, nd } : null;
  }

  const __origDlg718 = dlg;
  dlg = function (name, text, options) {
    try {
      if (typeof name === "string" && name.startsWith("🔧 ") && typeof text === "string" &&
          text.includes("Pick what you actually observe") && Array.isArray(options)) {
        const m = name.replace(/^🔧\s*/, "").split(" — "); // 🔧 is a surrogate pair — never slice(2)
        const hit = m.length >= 2 ? findNode(m[0], m.slice(1).join(" — ")) : null;
        if (hit) {
          const idx = TRUTH[hit.type.id + ":" + hit.nd.id];
          const answers = options.filter(o => o.t.startsWith("🗨️"));
          const back = options.filter(o => o.t.startsWith("🔙"));
          if (typeof idx === "number" && answers.length >= 2 && hit.nd.answers[idx]) {
            const want = hit.nd.answers[idx].t;
            const trueOpt = answers.find(o => o.t.includes(want)) || answers[idx];
            const origF = trueOpt.f;
            const askOpt = {
              t: `🗨️ Ask the user <small>(+5 min, +5 conf)</small>`,
              f: () => {
                if (typeof toast === "function") try { toast(`💬 "${want}"`, 3200); } catch (e) { }
                origF();
              },
            };
            text = text.replace(
              "Pick what you actually observe — the answer decides which branches of the tree get pruned.",
              "Put the question to the user — <b>they</b> hold the observations. What they tell you decides which branches of the tree get pruned.");
            options = [askOpt, ...back]; // ask first, back last
          }
        }
      }
    } catch (e) { }
    return __origDlg718.call(this, name, text, options);
  };

  window.v718 = { version: "7.18", TRUTH };
})();

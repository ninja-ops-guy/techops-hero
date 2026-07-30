/* ============================================================
   TechOps Hero v7.11 — INFRA TRUTH
   Continues the v7.10 True North reconciliation: every remaining
   battle where the "super effective" tools contradicted the
   diagnosis tables or didn't match the infrastructure AeroTech
   actually hosts (Cisco switching, OT/PLC VLAN, Exchange, AD,
   file servers with share+NTFS ACLs, client fleet).

   Hard rule (now enforced by a dev invariant): a WEAK (1.6x)
   move may never appear as a listed WRONG answer for the same
   ticket, and a RESIST move may never be the BEST answer.

   Changes (mutations only — game.js stays pristine):
     wifi:   weak ["swap","tracert"] -> ["wireshark","ping"]
             "Replace the user's WiFi adapter" is a listed wrong
             answer — hardware swap can't be super effective.
             Real fix is an RF survey: Wireshark for the air,
             Ping for coverage verification. Both are network
             evidence (weight 4) and Ping is rank-1 accessible.
     share:  weak ["gpo","ps"] -> ["ps","eventvwr"]
             gpupdate /force does not repair Share-vs-NTFS ACLs.
             Effective access is proven from the security log
             (Event 4656/4663) + scripted ACL comparison.
     slowpc: weak ["ps","patch"] -> ["ps","eventvwr"]
             Deploying patches is not a slow-PC remediation
             (it's the trap answer's cousin). Startup/resource
             audit = PowerShell + performance/diagnostic logs.
   plc stays weak to ping+tracert ON PURPOSE: its "okay" answer
   is "ping the PLC & check link lights" — the weak tool maps to
   the okay (partial) solution, and sudo resisting with the note
   "NEVER sudo random commands on factory equipment" is exactly
   how real OT environments work.
   ============================================================ */
(function () {
  "use strict";

  // ---- 1. tactics reconciliation -----------------------------
  try {
    if (typeof ENEMY_TACTICS !== "undefined") {
      ENEMY_TACTICS.wifi.weak = ["wireshark", "ping"];
      ENEMY_TACTICS.share.weak = ["ps", "eventvwr"];
      ENEMY_TACTICS.slowpc.weak = ["ps", "eventvwr"];
    }
  } catch (e) { console.warn("v711 tactics", e); }

  // ---- 2. invariant guard (dev consoles only) ----------------
  // Cross-checks every ticket: weak tools must not be wrong
  // answers, resist tools must not be the best answer, and weak
  // recon tools should sit in a high-weight evidence category.
  try {
    if (typeof TICKET_TYPES !== "undefined" && typeof ENEMY_TACTICS !== "undefined") {
      const MOVE_NAMES = {};
      try {
        (typeof ABILITIES !== "undefined" ? ABILITIES : []).forEach(a => MOVE_NAMES[a.id] = a.name.toLowerCase());
        (typeof CERT_ABILITIES !== "undefined" ? Object.values(CERT_ABILITIES) : []).forEach(a => MOVE_NAMES[a.id] = a.name.toLowerCase());
        (typeof MOVE_LEVELS !== "undefined" ? MOVE_LEVELS : []).forEach(m => MOVE_NAMES[m.ability.id] = m.ability.name.toLowerCase());
      } catch (e) { }
      const problems = [];
      TICKET_TYPES.forEach(t => {
        const tac = ENEMY_TACTICS[t.id];
        if (!tac || !t.diag) return;
        const wrongText = (t.diag.wrong || []).join(" ").toLowerCase();
        (tac.weak || []).forEach(w => {
          const n = MOVE_NAMES[w] || "";
          // flag when the move's own name (or its hardware action) shows up as a wrong answer
          if (n && n.length > 3 && wrongText.includes(n)) problems.push(t.id + ": weak '" + w + "' is a listed wrong answer");
          if (w === "swap" && /replace|reseat|new (ram|hardware|adapter)/.test(wrongText)) problems.push(t.id + ": weak 'swap' contradicts wrong answer about replacing hardware");
        });
        const best = (t.diag.best || "").toLowerCase();
        (tac.resist || []).forEach(r => {
          const n = MOVE_NAMES[r] || "";
          if (n && n.length > 3 && best.includes(n)) problems.push(t.id + ": resist '" + r + "' is the best answer");
        });
      });
      if (problems.length) console.warn("v711 tactics invariant:", problems);
      window.v711 = { invariant: () => problems.slice(), problems };
    }
  } catch (e) { console.warn("v711 invariant", e); }
})();

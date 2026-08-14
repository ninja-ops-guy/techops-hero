/* ==========================================================================
   v7.17 — NOC WIRE (P2 quality-of-life from QA_REVIEW)
     · Overnight command-center events arrive as a NOC channel in the
       phone/Teams UI (was: a single toast you could miss)
     · EOD summary cross-links enterprise uptime + outages next to day stats
     · (balance half lives in v60_hooks.js: nightly wear ceiling now grows
       with day count, so full-security builds aren't strictly dominant)
   Loads LAST. game.js untouched.
   ========================================================================== */
(function () {
  "use strict";

  const ccOf = () => (typeof S !== "undefined" && S && S.meta && S.meta.cc) ? S.meta.cc : null;
  const ccUnlocked717 = () => (typeof ccUnlocked === "function") ? ccUnlocked() : false;
  const avg717 = cc => Math.round(cc.sites.reduce((a, x) => a + x.health, 0) / cc.sites.length);

  /* ---------- 1. NOC channel: overnight report → phone ---------- */
  function nocChatToast(cc) {
    const wrap = document.getElementById("game-wrap");
    if (!wrap) return;
    const ph = (typeof phoneState === "function") ? phoneState() : null;
    if (ph) {
      ph.unread++;
      const badge = document.getElementById("v54-badge");
      if (badge) { badge.textContent = ph.unread; badge.classList.remove("hidden"); }
    }
    const chats = wrap.querySelectorAll(".v54-chat");
    if (chats.length >= 3) chats[0].remove();
    const c = document.createElement("div");
    c.className = "v54-chat";
    c.style.top = (108 + wrap.querySelectorAll(".v54-chat").length * 62) + "px";
    const up = avg717(cc), out = cc.sites.filter(x => x.health < 40).length;
    c.innerHTML = `<b>🌐 NOC</b> · overnight<br>"${out ? `${out} site${out > 1 ? "s" : ""} in OUTAGE — ` : ""}enterprise uptime ${up}%. Full report in Teams."<small>🌐 NOC wire — tap to open Teams</small>`;
    c.onclick = () => { c.remove(); if (typeof phonePanel === "function") phonePanel(); };
    wrap.appendChild(c);
    setTimeout(() => { if (c.parentNode) { c.style.opacity = "0"; c.style.transition = "opacity .5s"; setTimeout(() => c.remove(), 500); } }, 7000);
  }

  // after the v6.0 nightly sim runs (inside the setupDay chain), wire the report to the phone
  const __origSetup717 = setupDay;
  setupDay = function () {
    __origSetup717.apply(this, arguments);
    const s = S; if (!s) return;
    const cc = ccOf();
    if (!cc || !cc.lastReport || !ccUnlocked717()) return;
    if (cc._nocWired === s.day) return; // once per day
    cc._nocWired = s.day;
    setTimeout(() => { try { nocChatToast(cc); } catch (e) { } }, 6600); // lands just after the stock overnight toast
  };

  // the NOC report lives as the top entry in the Teams panel until read
  function nocReportDlg(cc) {
    const up = avg717(cc);
    const upColor = up >= 80 ? "#4ade80" : up >= 40 ? "#facc15" : "#f87171";
    dlg("🌐 NOC — LAST NIGHT",
      `📊 <b>ENTERPRISE UPTIME: <span style="color:${upColor}">${up}%</span></b><br><br>` +
      `<small>${cc.lastReport.join("<br>")}</small>` +
      (cc.advice ? `<br><br><small>💡 ${cc.advice}</small>` : "") +
      `<br><br><small>Policy changes: management console → command center.</small>`,
      [{ t: "🌐 Open command center", f: () => { if (typeof commandCenter === "function") commandCenter(); else closeDlg(); } },
       { t: "Back to Teams", f: () => { if (typeof phonePanel === "function") phonePanel(); else closeDlg(); } }]);
  }
  if (typeof phonePanel === "function") {
    const __origPhone717 = phonePanel;
    phonePanel = function () {
      const cc = ccOf();
      const fresh = cc && cc.lastReport && ccUnlocked717() && cc._nocRead !== (S ? S.day : -1);
      __origPhone717.apply(this, arguments);
      if (!fresh) return;
      const nameEl = document.getElementById("dlg-name");
      const optsEl = document.getElementById("dlg-options");
      if (!nameEl || !optsEl || !nameEl.textContent.includes("TEAMS")) return;
      const sib = optsEl.querySelector("button");
      const btn = document.createElement("button");
      if (sib) btn.className = sib.className;
      btn.textContent = "🌐 NOC: overnight report";
      btn.onclick = () => { cc._nocRead = S.day; nocReportDlg(cc); };
      optsEl.insertBefore(btn, optsEl.firstChild);
      // zero-ticket early-return path: stock panel shows a "queue is silent" dialog — add the entry there too
      if (nameEl.textContent.trim() === "📱 TEAMS") { /* same injection above covers it */ }
    };
  }

  /* ---------- 2. EOD cross-link: enterprise uptime beside day stats ---------- */
  if (typeof endOfDay === "function") {
    const __origEod717 = endOfDay;
    endOfDay = function () {
      __origEod717.apply(this, arguments);
      const cc = ccOf();
      if (!cc || !ccUnlocked717()) return;
      const el = document.getElementById("eod-summary");
      if (!el || el.dataset.nocLinked === String(S.day)) return;
      el.dataset.nocLinked = String(S.day);
      const up = avg717(cc), out = cc.sites.filter(x => x.health < 40).length;
      const upColor = up >= 80 ? "#4ade80" : up >= 40 ? "#facc15" : "#f87171";
      el.innerHTML += `<br><br>🌐 <b>Enterprise uptime: <span style="color:${upColor}">${up}%</span></b>` +
        (out ? ` · <span style="color:#f87171">${out} site${out > 1 ? "s" : ""} OUTAGE — expect spillover tickets</span>` : " · all sites green") +
        `<br><small>Policy: 🛡️ ${cc.alloc.sec} · 🖥️ ${cc.alloc.hw} · 👥 ${cc.alloc.staff} (command center at the management console)</small>`;
    };
  }

  window.v717 = { version: "7.17", nocReportDlg, wired: () => { const cc = ccOf(); return cc ? cc._nocWired : null; } };
})();

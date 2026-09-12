/* ============================================================
   TECHOPS HERO — Mike's Workstation Arcade (runtime_arcade.js)

   Authority boundary:
   - Owns only the optional arcade launcher/presentation on Mike's desk.
   - Does not write campaign facts, ticket ownership, evidence/trust,
     ending eligibility, time, XP, budget, stress, or progression state.
   - Embeds the repository's standalone Beat Runner tester directly;
     no fetch/srcdoc/runtime source rewriting.
   ============================================================ */
(function (root) {
  "use strict";

  const ARCADE_PATH = "beat-runner-tester/index.html?v=586267f";
  const OVERLAY_ID = "techops-mike-arcade";
  const BUTTON_ID = "mike-desk-beat-runner";
  const STYLE_ID = "techops-mike-arcade-style";
  const INSTALL_FLAG = "__techopsMikeArcadeInstalled";

  function isMikeDeskTitle(text) {
    return /MIKE['’]S\s+DESK/i.test(String(text || ""));
  }

  function ensureStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${OVERLAY_ID}{position:fixed;inset:0;z-index:100000;background:#05070b;display:flex;flex-direction:column;overscroll-behavior:none;touch-action:none}
#${OVERLAY_ID}[hidden]{display:none!important}
#${OVERLAY_ID} .arcade-bar{height:54px;min-height:54px;display:flex;align-items:center;gap:10px;padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) 8px max(10px,env(safe-area-inset-left));background:#0c1119;border-bottom:1px solid #31576a;color:#d9f7ff;font-family:'Press Start 2P',monospace;box-sizing:content-box}
#${OVERLAY_ID} .arcade-title{font-size:11px;line-height:1.5;flex:1;color:#63f5b0;text-shadow:0 0 8px rgba(0,255,136,.35)}
#${OVERLAY_ID} .arcade-sub{display:block;margin-top:4px;font-size:7px;color:#78909c;text-shadow:none}
#${OVERLAY_ID} .arcade-close{appearance:none;border:1px solid #4b6978;background:#17212c;color:#fff;padding:10px 12px;font:9px 'Press Start 2P',monospace;cursor:pointer;min-height:38px;border-radius:3px}
#${OVERLAY_ID} .arcade-close:active{transform:translateY(1px);background:#253544}
#${OVERLAY_ID} .arcade-stage{position:relative;flex:1;min-height:0;background:#080a10}
#${OVERLAY_ID} iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#080a10;display:block}
#${OVERLAY_ID} .arcade-boot{position:absolute;inset:0;display:grid;place-items:center;z-index:2;pointer-events:none;background:#080a10;color:#00ff88;font:10px/1.8 'Press Start 2P',monospace;text-align:center;padding:24px}
#${OVERLAY_ID}.loaded .arcade-boot{display:none}
#${OVERLAY_ID} .arcade-fallback{position:absolute;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3;display:none;background:rgba(5,7,11,.92);border:1px solid #31576a;color:#a9c4cf;padding:10px 12px;font:8px/1.5 'Press Start 2P',monospace;text-align:center;max-width:min(90vw,560px)}
#${OVERLAY_ID}.slow .arcade-fallback{display:block}
#${OVERLAY_ID} .arcade-fallback button{margin-top:8px;border:1px solid #00ff88;background:#0e2a22;color:#7cffbd;padding:8px 10px;font:8px 'Press Start 2P',monospace}
#${BUTTON_ID}{border-color:#00b96b!important;box-shadow:inset 3px 0 0 #00ff88;background:linear-gradient(90deg,#10261d,#16202e)!important;color:#b8ffd8!important}
@media(max-width:700px){#${OVERLAY_ID} .arcade-bar{min-height:46px;height:46px}#${OVERLAY_ID} .arcade-title{font-size:9px}#${OVERLAY_ID} .arcade-sub{font-size:6px}#${OVERLAY_ID} .arcade-close{font-size:8px;padding:8px 9px}}
`;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function buildOverlay(host) {
    const doc = host && host.document;
    if (!doc) return null;
    let overlay = doc.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    ensureStyles(doc);

    overlay = doc.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Beat Runner 3D on Mike's computer");

    const bar = doc.createElement("div");
    bar.className = "arcade-bar";

    const title = doc.createElement("div");
    title.className = "arcade-title";
    title.textContent = "MIKE'S COMPUTER // BEAT RUNNER 3D";
    const sub = doc.createElement("span");
    sub.className = "arcade-sub";
    sub.textContent = "LOCAL ARCADE BUILD — ESC TO RETURN TO TECHOPS";
    title.appendChild(sub);

    const close = doc.createElement("button");
    close.className = "arcade-close";
    close.type = "button";
    close.textContent = "✕ CLOSE";
    close.addEventListener("click", function () { closeArcade(host, true); });

    bar.appendChild(title);
    bar.appendChild(close);

    const stage = doc.createElement("div");
    stage.className = "arcade-stage";

    const boot = doc.createElement("div");
    boot.className = "arcade-boot";
    boot.innerHTML = "BOOTING BEAT RUNNER 3D…<br><small>WEBGL // LOCAL TESTER</small>";

    const frame = doc.createElement("iframe");
    frame.title = "Beat Runner 3D";
    frame.setAttribute("allow", "autoplay; fullscreen; gamepad");
    frame.setAttribute("referrerpolicy", "same-origin");
    frame.src = "about:blank";
    frame.addEventListener("load", function () {
      if (frame.getAttribute("src") && frame.getAttribute("src") !== "about:blank") {
        overlay.classList.add("loaded");
        overlay.classList.remove("slow");
      }
    });

    const fallback = doc.createElement("div");
    fallback.className = "arcade-fallback";
    fallback.textContent = "Still loading? The standalone build can be opened directly.";
    const fallbackButton = doc.createElement("button");
    fallbackButton.type = "button";
    fallbackButton.textContent = "OPEN STANDALONE";
    fallbackButton.addEventListener("click", function () {
      if (host && typeof host.open === "function") host.open(ARCADE_PATH, "_blank", "noopener");
      else if (host && host.location) host.location.href = ARCADE_PATH;
    });
    fallback.appendChild(doc.createElement("br"));
    fallback.appendChild(fallbackButton);

    stage.appendChild(frame);
    stage.appendChild(boot);
    stage.appendChild(fallback);
    overlay.appendChild(bar);
    overlay.appendChild(stage);
    doc.body.appendChild(overlay);
    return overlay;
  }

  function openArcade(host) {
    host = host || root;
    const doc = host && host.document;
    if (!doc) return false;
    const overlay = buildOverlay(host);
    if (!overlay) return false;

    try {
      if (typeof host.closeDlg === "function") host.closeDlg();
    } catch (_) {}

    const frame = overlay.querySelector ? overlay.querySelector("iframe") : null;
    overlay.classList.remove("loaded", "slow");
    overlay.hidden = false;
    host.__techopsArcadeOpen = true;

    if (frame) frame.setAttribute("src", ARCADE_PATH);

    clearTimeout(host.__techopsArcadeSlowTimer);
    host.__techopsArcadeSlowTimer = setTimeout(function () {
      if (host.__techopsArcadeOpen && !overlay.classList.contains("loaded")) overlay.classList.add("slow");
    }, 7000);

    return true;
  }

  function closeArcade(host, reopenDesk) {
    host = host || root;
    const doc = host && host.document;
    if (!doc) return false;
    const overlay = doc.getElementById(OVERLAY_ID);
    if (!overlay) return false;

    clearTimeout(host.__techopsArcadeSlowTimer);
    host.__techopsArcadeOpen = false;
    overlay.hidden = true;
    overlay.classList.remove("loaded", "slow");
    const frame = overlay.querySelector ? overlay.querySelector("iframe") : null;
    if (frame) frame.setAttribute("src", "about:blank");

    if (reopenDesk && typeof host.mikeDesk === "function") {
      setTimeout(function () {
        if (!host.__techopsArcadeOpen) {
          try { host.mikeDesk(); } catch (_) {}
        }
      }, 0);
    }
    return true;
  }

  function injectDeskOption(host) {
    host = host || root;
    const doc = host && host.document;
    if (!doc) return false;
    const nameEl = doc.getElementById("dlg-name");
    const optsEl = doc.getElementById("dlg-options");
    if (!nameEl || !optsEl || !isMikeDeskTitle(nameEl.textContent)) return false;
    if (doc.getElementById(BUTTON_ID)) return true;

    const button = doc.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "🎮 BEAT RUNNER 3D — play on Mike's PC";
    button.setAttribute("aria-label", "Play Beat Runner 3D on Mike's computer");
    button.addEventListener("click", function () { openArcade(host); });

    const children = Array.prototype.slice.call(optsEl.children || []);
    const exitButton = children.find(function (candidate) {
      return /log off|bask in it|walk away|leave/i.test(String(candidate && candidate.textContent || ""));
    });
    if (exitButton && optsEl.insertBefore) optsEl.insertBefore(button, exitButton);
    else optsEl.appendChild(button);

    const textEl = doc.getElementById("dlg-text");
    if (textEl && !(textEl.querySelector && textEl.querySelector("[data-techops-arcade-hint]"))) {
      const hint = doc.createElement("div");
      hint.setAttribute("data-techops-arcade-hint", "1");
      hint.style.cssText = "margin-top:8px;color:#63f5b0;font-size:9px;line-height:1.5;opacity:.9";
      hint.textContent = "▸ Beat Runner 3D is installed locally on this workstation.";
      textEl.appendChild(hint);
    }
    return true;
  }

  function install(host) {
    host = host || root;
    if (!host || !host.document) return false;
    if (host[INSTALL_FLAG]) return true;
    if (typeof host.mikeDesk !== "function") return false;

    const originalMikeDesk = host.mikeDesk;
    host.mikeDesk = function () {
      const result = originalMikeDesk.apply(this, arguments);
      injectDeskOption(host);
      return result;
    };

    const onKey = function (event) {
      if (!host.__techopsArcadeOpen) return;
      if (event && (event.key === "Escape" || event.key === "Esc")) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        closeArcade(host, true);
      }
    };
    host.document.addEventListener("keydown", onKey, true);

    host[INSTALL_FLAG] = true;
    host.TechOpsArcade = {
      version: 1,
      path: ARCADE_PATH,
      open: function () { return openArcade(host); },
      close: function (reopenDesk) { return closeArcade(host, reopenDesk !== false); },
      inject: function () { return injectDeskOption(host); }
    };
    return true;
  }

  const api = {
    ARCADE_PATH: ARCADE_PATH,
    OVERLAY_ID: OVERLAY_ID,
    BUTTON_ID: BUTTON_ID,
    isMikeDeskTitle: isMikeDeskTitle,
    install: install,
    injectDeskOption: injectDeskOption,
    openArcade: openArcade,
    closeArcade: closeArcade
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else if (root && root.document) install(root);
})(typeof globalThis !== "undefined" ? globalThis : this);

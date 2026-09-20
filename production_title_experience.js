/* TechOps Hero — production title/readiness authority v1.
 *
 * This module loads immediately after the legacy Good Dogs and Night Crawler
 * title buttons exist. It owns presentation and cold-start gating only. Day and
 * Continue retain their canonical handlers; alternate modes delegate once to
 * their production launch authorities after every shared dependency is ready.
 */
(function (root) {
  "use strict";
  if (!root || !root.document || root.TechOpsProductionTitleExperience) return;

  var VERSION = 1;
  var BUILD = "20260920-quality-r1";
  var RESULT_KEY = "techops_nightcrawler_last_result_v1";
  var READY_TIMEOUT = Math.max(4000, Number(root.TECHOPS_TITLE_READY_TIMEOUT) || 20000);
  var POLL_MS = 100;
  var doc = root.document;
  var timer = null;
  var deadline = 0;
  var mounted = false;
  var launchMode = null;
  var lastResult = null;
  var ui = {};
  var gate = { phase: "loading", ready: false, detail: "Preparing the production runtime…", snapshot: null };

  var CARDS = {
    "btn-start": {
      mode: "day",
      kicker: "PRIMARY CAMPAIGN",
      name: "DAY SHIFT",
      detail: "Investigate the systems behind the symptoms.",
      label: "Start a new Day Shift campaign"
    },
    "btn-continue": {
      mode: "continue",
      kicker: "SAVED CAMPAIGN",
      name: "CONTINUE RUN",
      detail: "Return to your current AeroTech shift.",
      label: "Continue the saved campaign"
    },
    "btn-v736": {
      mode: "gooddogs",
      kicker: "CO-OP STORY",
      name: "GOOD DOGS",
      detail: "Katrin and Manchez follow Waldo’s trail.",
      label: "Start or resume the Good Dogs co-op campaign"
    },
    "btn-nightcrawler": {
      mode: "nightcrawler",
      kicker: "AFTER HOURS",
      name: "NIGHT CRAWLER",
      detail: "Take the Charger into New Haven after dark.",
      label: "Start the standalone Night Crawler mode"
    }
  };

  function byId(id) { return doc.getElementById(id); }
  function now() { return Date.now ? Date.now() : new Date().getTime(); }
  function make(tag, id, className, text) {
    var el = doc.createElement(tag);
    if (id) el.id = id;
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
  function stop(ev) {
    try { if (ev && ev.preventDefault) ev.preventDefault(); } catch (_) {}
    try { if (ev && ev.stopPropagation) ev.stopPropagation(); } catch (_) {}
    try { if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } catch (_) {}
  }
  function closestAction(target) {
    try {
      if (target && typeof target.closest === "function") {
        return target.closest("#btn-start,#btn-continue,#btn-v736,#btn-nightcrawler,#title-night-new");
      }
    } catch (_) {}
    while (target) {
      if (CARDS[target.id] || target.id === "title-night-new") return target;
      target = target.parentNode;
    }
    return null;
  }
  function safeString(value, limit) {
    if (value == null) return "";
    var text = String(value).replace(/\s+/g, " ").trim();
    return text.length > limit ? text.slice(0, limit - 1) + "…" : text;
  }

  function consumeNightResult() {
    var raw = null;
    try {
      raw = root.localStorage && root.localStorage.getItem(RESULT_KEY);
      if (root.localStorage) root.localStorage.removeItem(RESULT_KEY);
    } catch (error) {
      root.__productionTitleResultError = String(error && error.message || error);
      return null;
    }
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      var summary = safeString(parsed.summary, 180);
      var message = safeString(parsed.message, 360);
      if (!summary && !message) return null;
      lastResult = {
        summary: summary || "Night shift report received",
        message: message,
        at: parsed.at || parsed.completedAt || null
      };
      root.__productionTitleNightResult = lastResult;
      return lastResult;
    } catch (error) {
      root.__productionTitleResultError = "invalid-night-result";
      return null;
    }
  }

  function decorateButton(button, config) {
    if (!button || !config) return false;
    var night = config.mode === "nightcrawler" && root.TechOpsNightRuntime && root.TechOpsNightRuntime.checkpointStatus ? root.TechOpsNightRuntime.checkpointStatus() : null;
    var checkpointCopy = night ? night.status + ":" + (night.savedAt || "") : "";
    var children = button.children || [];
    var hasCopy = false;
    for (var index = 0; index < children.length; index++) {
      if (children[index].classList && children[index].classList.contains("title-mode-copy")) { hasCopy = true; break; }
    }
    // Launch authorities temporarily replace button text with loading/retry copy.
    // Rebuild the card when control returns to the title instead of trusting a
    // stale build marker on an element whose structured children were removed.
    if (button.getAttribute && button.getAttribute("data-production-title-card") === BUILD && button.getAttribute("data-night-checkpoint") === checkpointCopy && hasCopy) return true;
    var original = String(button.textContent || "");
    var resume = original.match(/RESUME\s+M(\d+)/i);
    var detail = resume ? "Resume Good Dogs mission " + resume[1] + "." : config.detail;
    if (night && night.status === "ready") detail = "Continue " + night.state.nightMode.district.replace(/\b\w/g, function(c) { return c.toUpperCase(); }) + " · Street " + night.state.nightMode.street + ". Your route and rewards are saved.";
    else if (night && (night.status === "invalid" || night.status === "unavailable")) detail = night.message;
    button.textContent = "";
    button.type = "button";
    button.classList.add("title-mode-card", "title-mode-card--" + config.mode);
    button.setAttribute("data-production-title-card", BUILD);
    button.setAttribute("data-night-checkpoint", checkpointCopy);
    button.setAttribute("data-title-mode", config.mode);
    button.setAttribute("aria-label", night && night.status === "ready" ? "Resume the saved standalone Night run" : config.label);
    var copy = make("span", null, "title-mode-copy");
    copy.appendChild(make("span", null, "title-mode-kicker", config.kicker));
    copy.appendChild(make("span", null, "title-mode-name", night && night.status === "ready" ? "RESUME NIGHT" : config.name));
    copy.appendChild(make("span", null, "title-mode-detail", detail));
    button.appendChild(copy);
    var arrow = make("span", null, "title-mode-arrow", "›");
    arrow.setAttribute("aria-hidden", "true");
    button.appendChild(arrow);
    return true;
  }

  function buildStatus(screen, anchor) {
    var panel = byId("title-system-panel");
    if (!panel) {
      panel = make("section", "title-system-panel", "title-system-panel");
      var result = make("div", "title-night-result", "title-night-result");
      result.hidden = true;
      result.setAttribute("role", "status");
      result.setAttribute("aria-live", "polite");
      result.appendChild(make("span", null, "title-night-result-kicker", "NIGHT CRAWLER DEBRIEF"));
      result.appendChild(make("strong", "title-night-result-summary", null, ""));
      result.appendChild(make("span", "title-night-result-message", null, ""));
      panel.appendChild(result);

      var readiness = make("div", "title-readiness", "title-readiness");
      readiness.setAttribute("role", "status");
      readiness.setAttribute("aria-live", "polite");
      readiness.setAttribute("aria-atomic", "true");
      var dot = make("span", "title-readiness-dot", "title-readiness-dot");
      dot.setAttribute("aria-hidden", "true");
      readiness.appendChild(dot);
      var copy = make("span", null, "title-readiness-copy");
      copy.appendChild(make("strong", "title-readiness-label", null, "PRODUCTION SYSTEMS"));
      copy.appendChild(make("span", "title-readiness-detail", null, gate.detail));
      readiness.appendChild(copy);
      var retry = make("button", "title-readiness-retry", "title-readiness-retry", "RETRY");
      retry.type = "button";
      retry.hidden = true;
      retry.addEventListener("click", function (ev) { stop(ev); retryGate(); });
      readiness.appendChild(retry);
      panel.appendChild(readiness);
      screen.insertBefore(panel, anchor || null);
    }
    ui.panel = panel;
    ui.result = byId("title-night-result");
    ui.resultSummary = byId("title-night-result-summary");
    ui.resultMessage = byId("title-night-result-message");
    ui.readiness = byId("title-readiness");
    ui.readinessLabel = byId("title-readiness-label");
    ui.readinessDetail = byId("title-readiness-detail");
    ui.retry = byId("title-readiness-retry");
    var freshNight = byId("title-night-new");
    if (!freshNight) {
      freshNight = make("button", "title-night-new", "title-readiness-retry", "Start a new Night run instead");
      freshNight.type = "button";
      freshNight.setAttribute("aria-label", "Replace the saved Night checkpoint with a new run");
      panel.appendChild(freshNight);
    }
    ui.freshNight = freshNight;
  }

  function mount() {
    var screen = byId("title-screen");
    if (!screen) return false;
    screen.classList.add("production-title-experience");
    screen.setAttribute("aria-labelledby", "title-logo");
    screen.setAttribute("aria-describedby", "title-readiness-detail");
    var hint = byId("title-hint");
    var grid = byId("title-mode-grid");
    if (!grid) {
      grid = make("div", "title-mode-grid", "title-mode-grid");
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", "Choose a game mode");
      screen.insertBefore(grid, hint || null);
    }
    Object.keys(CARDS).forEach(function (id) {
      var button = byId(id);
      if (!button) return;
      decorateButton(button, CARDS[id]);
      grid.appendChild(button);
    });
    buildStatus(screen, hint);
    ui.screen = screen;
    ui.grid = grid;
    mounted = true;
    render();
    return true;
  }

  function dependencySnapshot() {
    var hardFix = root.TechOpsGoodBoysButtonHardFix;
    var router = root.TechOpsProductionModeRouter;
    var goodDogsAuthority = !!(hardFix && typeof hardFix.launch === "function");
    var goodDogsDependencies = false;
    if (goodDogsAuthority && typeof hardFix.depsReady === "function") {
      try { goodDogsDependencies = hardFix.depsReady() === true; } catch (_) { goodDogsDependencies = false; }
    }
    var snapshot = {
      production: root.__productionBootstrapReady === true,
      campaign: !!(root.TechOpsCampaign && root.TechOpsCampaignNativeAct1 && root.TechOpsStory),
      goodDogsAuthority: goodDogsAuthority,
      goodDogsDependencies: goodDogsDependencies,
      nightAuthority: !!(router && typeof router.launchNightCrawler === "function"),
      bootstrapError: root.__productionBootstrapError || root.__productionBootstrapWireError || null
    };
    snapshot.ready = snapshot.production && snapshot.campaign && snapshot.goodDogsAuthority && snapshot.goodDogsDependencies && snapshot.nightAuthority;
    return snapshot;
  }

  function waitingDetail(snapshot) {
    var missing = [];
    if (!snapshot.production) missing.push("runtime");
    if (!snapshot.campaign) missing.push("campaign");
    if (!snapshot.goodDogsAuthority || !snapshot.goodDogsDependencies) missing.push("Good Dogs assets");
    if (!snapshot.nightAuthority) missing.push("Night routing");
    if (!missing.length) return "Finalizing title controls…";
    return "Loading " + missing.join(" · ") + "…";
  }

  function setButtonsEnabled(enabled) {
    Object.keys(CARDS).forEach(function (id) {
      var button = byId(id);
      if (!button) return;
      button.disabled = !enabled;
      button.setAttribute("aria-disabled", enabled ? "false" : "true");
    });
  }

  function render() {
    if (!mounted && !mount()) return false;
    Object.keys(CARDS).forEach(function (id) { decorateButton(byId(id), CARDS[id]); });
    var busy = gate.phase === "loading" || gate.phase === "launching";
    ui.screen.setAttribute("aria-busy", busy ? "true" : "false");
    ui.screen.setAttribute("data-title-readiness", gate.phase);
    ui.readiness.setAttribute("data-state", gate.phase);
    if (gate.phase === "ready") ui.readinessLabel.textContent = "ALL MODES READY";
    else if (gate.phase === "failed") ui.readinessLabel.textContent = "SAFE STARTUP PAUSED";
    else if (gate.phase === "launching") ui.readinessLabel.textContent = "OPENING " + (launchMode === "gooddogs" ? "GOOD DOGS" : "NIGHT CRAWLER");
    else ui.readinessLabel.textContent = "BRINGING SYSTEMS ONLINE";
    ui.readinessDetail.textContent = gate.detail;
    ui.retry.hidden = gate.phase !== "failed";
    setButtonsEnabled(gate.ready && !launchMode);
    var night = root.TechOpsNightRuntime && root.TechOpsNightRuntime.checkpointStatus ? root.TechOpsNightRuntime.checkpointStatus() : null;
    ui.freshNight.hidden = !night || (night.status !== "ready" && night.status !== "invalid");
    ui.freshNight.disabled = !!launchMode || !dependencySnapshot().ready;
    if (lastResult && ui.result) {
      ui.result.hidden = false;
      ui.resultSummary.textContent = lastResult.summary;
      ui.resultMessage.textContent = lastResult.message;
      ui.resultMessage.hidden = !lastResult.message;
    }
    return true;
  }

  function stopPolling() {
    if (timer && root.clearInterval) root.clearInterval(timer);
    timer = null;
  }
  function fail(message) {
    stopPolling();
    launchMode = null;
    gate.phase = "failed";
    gate.ready = false;
    gate.detail = safeString(message || "Production systems did not finish loading. Retry when ready.", 260);
    root.__productionTitleReadiness = { ready: false, phase: gate.phase, detail: gate.detail, snapshot: gate.snapshot, at: now(), version: VERSION };
    render();
    return false;
  }
  function refresh() {
    if (!mounted) mount();
    if (launchMode || gate.phase === "failed") return gate.ready;
    var snapshot = dependencySnapshot();
    gate.snapshot = snapshot;
    if (snapshot.ready) {
      stopPolling();
      gate.phase = "ready";
      gate.ready = true;
      gate.detail = "Choose a shift. Every route now has its production authority.";
    } else if (deadline && now() >= deadline) {
      return fail("The production runtime is incomplete (" + waitingDetail(snapshot).replace(/^Loading\s+|…$/g, "") + "). No mode was started. Retry to check again.");
    } else {
      gate.phase = "loading";
      gate.ready = false;
      gate.detail = waitingDetail(snapshot);
    }
    root.__productionTitleReadiness = { ready: gate.ready, phase: gate.phase, detail: gate.detail, snapshot: snapshot, at: now(), version: VERSION };
    render();
    return gate.ready;
  }
  function startPolling() {
    stopPolling();
    deadline = now() + READY_TIMEOUT;
    gate.phase = "loading";
    gate.ready = false;
    gate.detail = "Preparing the production runtime…";
    refresh();
    if (!gate.ready && root.setInterval) timer = root.setInterval(refresh, POLL_MS);
  }
  function retryGate() {
    launchMode = null;
    startPolling();
    return true;
  }

  function titleVisible() {
    var screen = byId("title-screen");
    return !!(screen && !screen.classList.contains("hidden"));
  }
  function routeCancelled(mode) {
    var authority = root.TechOpsGoodBoysButtonHardFix;
    if (mode !== "gooddogs" || launchMode !== mode || !titleVisible() || !authority || authority.launching !== false || !root.__goodBoysOpeningPhase || root.__goodBoysOpeningPhase.phase !== "title") return false;
    launchMode = null;
    gate.phase = "ready";
    gate.ready = true;
    gate.detail = "Good Dogs opening cancelled. Choose any ready mode.";
    render();
    return true;
  }
  function watchGoodDogsReturn() {
    var checks = 0;
    function check() {
      if (launchMode !== "gooddogs" || !titleVisible()) return;
      if (routeCancelled("gooddogs")) return;
      if (++checks < 600 && root.setTimeout) root.setTimeout(check, 100);
    }
    if (root.setTimeout) root.setTimeout(check, 100);
  }

  function launchAlternate(mode, options) {
    if (launchMode) return true;
    var snapshot = dependencySnapshot();
    if (!gate.ready || !snapshot.ready) {
      gate.snapshot = snapshot;
      gate.detail = "Still " + waitingDetail(snapshot).replace(/^Loading\s+/, "loading ") + " No mode was started.";
      render();
      return false;
    }
    var recovery = mode === "nightcrawler" && root.TechOpsNightRuntime && root.TechOpsNightRuntime.checkpointStatus ? root.TechOpsNightRuntime.checkpointStatus() : null;
    if (recovery && recovery.status === "invalid" && !(options && options.fresh)) {
      // A damaged isolated Night save must not disable the other title routes.
      gate.detail = recovery.message;
      render();
      return false;
    }
    launchMode = mode;
    gate.phase = "launching";
    gate.ready = false;
    gate.detail = mode === "gooddogs" ? "Handing off to the canonical Waldo’s House opening…" : "Handing off to the canonical Night Crawler route…";
    render();
    try {
      var result;
      if (mode === "gooddogs") {
        var hardFix = root.TechOpsGoodBoysButtonHardFix;
        if (!hardFix || typeof hardFix.launch !== "function" || (hardFix.depsReady && hardFix.depsReady() !== true)) throw new Error("Good Dogs production authority is unavailable");
        result = hardFix.launch("production-title");
        watchGoodDogsReturn();
      } else {
        var router = root.TechOpsProductionModeRouter;
        if (!router || typeof router.launchNightCrawler !== "function") throw new Error("Night Crawler production authority is unavailable");
        result = router.launchNightCrawler(true, options);
      }
      if (result === false) return fail(root.__productionModeRouterError || "The production route declined the launch");
      root.__productionTitleLaunch = { mode: mode, issued: true, at: now(), version: VERSION };
      return true;
    } catch (error) {
      root.__productionTitleLaunchError = String(error && error.stack || error);
      return fail("That mode stopped safely before launch. Retry after production systems are ready.");
    }
  }

  function routeFailed(mode, message) {
    if (launchMode && mode && launchMode !== mode) return false;
    root.__productionTitleLaunchError = safeString(message || "alternate-route-failed", 260);
    return fail(message || (mode === "nightcrawler" ? "Night Crawler" : "That mode") + " stopped safely before launch. Retry when production systems are ready.");
  }

  function capture(ev) {
    var action = closestAction(ev && ev.target);
    if (!action) return true;
    if (action.id === "title-night-new") {
      stop(ev);
      if (gate.phase === "failed") retryGate();
      return launchAlternate("nightcrawler", {fresh:true});
    }
    var mode = CARDS[action.id] && CARDS[action.id].mode;
    if (mode === "day" || mode === "continue") {
      // The Night router must pass through the real canonical New Game
      // listener to create lexical S and show difficulty selection. This
      // one-shot marker is never set by user input or by other title routes.
      if (mode === "day" && launchMode === "nightcrawler" && root.__productionTitleInternalStart === "nightcrawler") return true;
      if (gate.ready && !launchMode) return true;
      stop(ev);
      gate.detail = "The campaign is still loading. No shift was started.";
      render();
      return false;
    }
    stop(ev);
    return launchAlternate(mode);
  }

  consumeNightResult();
  doc.addEventListener("pointerup", capture, true);
  doc.addEventListener("click", capture, true);
  if (root.addEventListener) {
    ["techops:campaign-ready", "techops:story-ready", "techops:production-ready"].forEach(function (name) {
      root.addEventListener(name, refresh);
    });
  }
  mount();
  startPolling();

  root.TechOpsProductionTitleExperience = {
    VERSION: VERSION,
    BUILD: BUILD,
    RESULT_KEY: RESULT_KEY,
    mount: mount,
    refresh: refresh,
    retry: retryGate,
    capture: capture,
    launchAlternate: launchAlternate,
    dependencySnapshot: dependencySnapshot,
    consumeNightResult: consumeNightResult,
    routeFailed: routeFailed,
    routeCancelled: routeCancelled,
    state: function () { return { phase: gate.phase, ready: gate.ready, detail: gate.detail, launchMode: launchMode, lastResult: lastResult }; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);

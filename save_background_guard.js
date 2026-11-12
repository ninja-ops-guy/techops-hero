// save_background_guard.js — flush progress when the page hides or is killed.
// Mobile browsers evict backgrounded tabs without warning; pagehide and
// visibilitychange(hidden) are the last reliable chances to persist the run.
// save() is the canonical, already-hardened entry point (schema versioning,
// verified writes, backup slot, quarantine, night checkpoint routing) and is
// fully defensive: it no-ops when S is null and records storage failures
// instead of throwing into the page lifecycle.
(function () {
  if (typeof window === "undefined" || !window.addEventListener) return;
  let flushing = false;
  function flush(reason) {
    if (flushing) return; // a save triggered by an earlier event is still landing
    flushing = true;
    try {
      if (typeof save === "function") save();
    } catch (e) {
      // Never let persistence break the page lifecycle event that hosts it.
      window.__techopsSaveError = String(e && e.stack || e);
    } finally {
      flushing = false;
    }
  }
  window.addEventListener("pagehide", function () { flush("pagehide"); });
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush("visibilitychange");
    });
  }
})();

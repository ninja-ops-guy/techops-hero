// v7.33 — Waldo atlas payload loader.
// The sliced palette-PNG atlas ships with the platform deploy (binary-accurate,
// like techops-theme.mp3). In the GitHub repo the payload is omitted and the game
// uses the procedural Waldo figure (v733_hooks.js drawWaldo733) — same contract.
window.TO_WALDO_A = (function () {
  try { if (typeof window.__WALDO_A_FULL !== "undefined") return window.__WALDO_A_FULL; } catch (e) { }
  return undefined;
})();

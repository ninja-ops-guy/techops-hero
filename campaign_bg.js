// campaign_bg.js — v7.35 assets: registers painted campaign backgrounds into window.NM_BG734.
// Mirrors the v734_hooks.js BG_SRCS loop; procedural night street stays as fallback when absent.
(function () {
  window.NM_BG734 = window.NM_BG734 || {};
  var BG_SRCS = {
    orbital_eye: function () { return (typeof window.__GK_BG_ORBITAL_EYE !== "undefined") ? window.__GK_BG_ORBITAL_EYE : null; },
    orbital_gate: function () { return (typeof window.__GK_BG_ORBITAL_GATE !== "undefined") ? window.__GK_BG_ORBITAL_GATE : null; },
    suburb_rift: function () { return (typeof window.__GK_BG_SUBURB_RIFT !== "undefined") ? window.__GK_BG_SUBURB_RIFT : null; },
    noc_twin: function () { return (typeof window.__GK_BG_NOC_TWIN !== "undefined") ? window.__GK_BG_NOC_TWIN : null; }
  };
  for (var id in BG_SRCS) {
    try {
      var src = BG_SRCS[id]();
      if (src) { var im = new Image(); im.src = src; window.NM_BG734[id] = im; }
    } catch (e) { }
  }
  console.log("[v7.35-assets] campaign backgrounds loaded");
})();

// v7.35 assets wave 2: waldo_loft, waldo_garage, music_venue (payloads in campaign_bg2_payload.js).
// NOTE: cell_corridor intentionally skipped — BFC1B0DD's bottom bg row has no clean corridor panel
// (only abstract dark/red-alert/smoke/spark/glitch-green panels), per wave-2 brief.
(function () {
  window.NM_BG734 = window.NM_BG734 || {};
  var BG_SRCS2 = {
    waldo_loft: function () { return (typeof window.__GK_BG_WALDO_LOFT !== "undefined") ? window.__GK_BG_WALDO_LOFT : null; },
    waldo_garage: function () { return (typeof window.__GK_BG_WALDO_GARAGE !== "undefined") ? window.__GK_BG_WALDO_GARAGE : null; },
    music_venue: function () { return (typeof window.__GK_BG_MUSIC_VENUE !== "undefined") ? window.__GK_BG_MUSIC_VENUE : null; }
  };
  for (var id in BG_SRCS2) {
    try {
      var src = BG_SRCS2[id]();
      if (src) { var im = new Image(); im.src = src; window.NM_BG734[id] = im; }
    } catch (e) { }
  }
  console.log("[v7.35-assets] wave-2 backgrounds loaded");
})();

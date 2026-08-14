/* ==========================================================================
   v7.21 — RUNTIME BLEED
   v7.19 fixed the palette-PNG black-halo bug at the FILE level by shipping
   alpha-bled RGBA atlases. That tripled the asset payload and, worse, left
   the GitHub-hosted atlases (palette PNGs whose transparent palette entry
   is RGB(0,0,0)) still broken on Safari, which interpolates palette alpha
   WITHOUT premultiplication — bilinear sampling then bleeds black into
   every sprite silhouette.

   This hook fixes it at RUNTIME instead, for every PNG data-URL image no
   matter which file or scope created it:

   1. CanvasRenderingContext2D.drawImage is wrapped: the first time an
      HTMLImageElement backed by a data:image/png is drawn (and decoded),
      it is alpha-bled into an offscreen canvas — opaque edge colors are
      flood-propagated outward through the transparent region via a
      multi-source BFS — and that canvas is substituted as the draw source
      from then on. A canvas bitmap is RGBA in memory, so Safari has no
      palette to misinterpolate. All atlases have BINARY alpha (0/255), so
      the getImageData/putImageData premultiplication round-trip is exact.

   2. DOM <img> tags that embed an atlas PNG directly (the title-screen
      crest, dialog seals/portraits) can't be canvas-wrapped, so dlg() is
      wrapped to bleed those in place (async swap of el.src to an RGBA
      data-URL), plus a one-time scan at load for the title crest.

   The file-level v7.19 bleed is harmless on top of this (bleeding an
   already-bled image is a no-op), which is why the repo's atlas part files
   stay as the compact palette PNGs. Loads LAST. game.js untouched.
   ========================================================================== */
(function () {
  "use strict";

  const bled721 = new WeakMap();   // HTMLImageElement -> offscreen canvas
  const domDone = new WeakSet();   // <img> elements already swapped
  let stats721 = { canvases: 0, domImgs: 0 };
  let inBleed721 = false;          // re-entrancy guard: bleeding itself draws
  const __origDrawImage721 = CanvasRenderingContext2D.prototype.drawImage;

  /* multi-source BFS alpha bleed: transparent pixels take the average color
     of their nearest already-colored neighbors, wave by wave, until the
     whole transparent field carries edge colors (never black). */
  function bleedToCanvas(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return null;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d", { willReadFrequently: true });
    inBleed721 = true;
    try { __origDrawImage721.call(x, img, 0, 0); } finally { inBleed721 = false; }
    let id;
    try { id = x.getImageData(0, 0, w, h); } catch (e) { return null; }
    const d = id.data, N = w * h;
    const done = new Uint8Array(N);
    let frontier = [];
    for (let p = 0; p < N; p++) {
      if (d[p * 4 + 3] !== 0) { done[p] = 1; continue; }
      const px = p % w, py = (p / w) | 0;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = (ny * w + nx) * 4;
        if (d[j + 3] === 255) { r += d[j]; g += d[j + 1]; b += d[j + 2]; n++; }
      }
      if (n) { d[p * 4] = r / n; d[p * 4 + 1] = g / n; d[p * 4 + 2] = b / n; done[p] = 1; frontier.push(p); }
    }
    // BFS waves until the transparent field is fully colored
    while (frontier.length) {
      const next = [];
      for (const p of frontier) {
        const px = p % w, py = (p / w) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (done[q]) continue;
          // average over colored neighbors (original opaque OR already filled)
          let r = 0, g = 0, b = 0, n = 0;
          for (let ddy = -1; ddy <= 1; ddy++) for (let ddx = -1; ddx <= 1; ddx++) {
            if (!ddx && !ddy) continue;
            const mx = nx + ddx, my = ny + ddy;
            if (mx < 0 || my < 0 || mx >= w || my >= h) continue;
            const m = my * w + mx;
            if (done[m]) { r += d[m * 4]; g += d[m * 4 + 1]; b += d[m * 4 + 2]; n++; }
          }
          if (n) {
            d[q * 4] = r / n; d[q * 4 + 1] = g / n; d[q * 4 + 2] = b / n;
            done[q] = 1; next.push(q);
          }
        }
      }
      frontier = next;
    }
    x.putImageData(id, 0, 0);
    stats721.canvases++;
    return c;
  }

  function canvasFor(img) {
    let c = bled721.get(img);
    if (c === undefined) {
      c = (img.complete && img.naturalWidth) ? bleedToCanvas(img) : null;
      bled721.set(img, c); // null = "tried too early"; retry next draw
      if (c === null) bled721.delete(img);
    }
    return c || img;
  }

  /* ---------- 1. wrap every canvas draw of a PNG data-URL image ---------- */
  CanvasRenderingContext2D.prototype.drawImage = function (img) {
    if (!inBleed721 && img instanceof HTMLImageElement &&
        typeof img.src === "string" && img.src.startsWith("data:image/png") &&
        img.complete && img.naturalWidth) {
      img = canvasFor(img);
    }
    return __origDrawImage721.apply(this, [img].concat(Array.prototype.slice.call(arguments, 1)));
  };

  /* ---------- 2. bleed DOM <img> embeds (crest, dialog seals) ---------- */
  function bleedDomImg(el) {
    if (domDone.has(el)) return;
    const src = el.src;
    if (typeof src !== "string" || !src.startsWith("data:image/png")) return;
    domDone.add(el);
    const t = new Image();
    t.onload = () => {
      const c = bleedToCanvas(t);
      if (c) { el.src = c.toDataURL("image/png"); stats721.domImgs++; }
    };
    t.src = src;
  }
  function bleedDomScope(root) {
    (root || document).querySelectorAll('img[src^="data:image/png"]').forEach(bleedDomImg);
  }
  if (typeof dlg === "function") {
    const __origDlg721 = dlg;
    dlg = function () {
      __origDlg721.apply(this, arguments);
      try {
        const box = document.getElementById("dialogue") || document.getElementById("dlg-box");
        if (box) bleedDomScope(box);
      } catch (e) { }
    };
  }
  // title crest + anything already in the DOM at load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bleedDomScope(document));
  } else {
    bleedDomScope(document);
  }

  window.v721 = {
    version: "7.21",
    isBled: img => bled721.has(img),
    canvasFor: img => bled721.get(img) || null,
    stats: () => Object.assign({}, stats721),
  };
})();

/* ==========================================================================
   v7.19 — TRUE TRANSPARENCY
   Bug: on real phones (most visible on iPhone/Safari) the player sprite
   showed a dark boxy halo and looked like it was "clipping" — an opaque
   dark rectangle that swallowed neighbouring NPCs and floor detail.

   Root cause (two layers):
     1. ASSET — every character/prop atlas (player, extra poses, Felicia,
        NPCs, scenic props) was a palette PNG whose fully-transparent
        palette entry was RGB(0,0,0). Alpha was correct, but the moment any
        draw path sampled the art with bilinear smoothing (canvas default:
        imageSmoothingEnabled is true), the black hiding inside the
        transparent pixels bled into the silhouette edges -> dark fringe.
        The v6.1 "pristine: de-bled" comment was wrong — the alpha was
        de-bled, the COLOUR channels underneath were not.
     2. PATH — v7.13's NPC renderer explicitly sets
        ctx.imageSmoothingEnabled = false, so NPCs always sampled
        nearest-neighbour and stayed crisp. The player draw chain
        (game.js / sprite_hooks / v6.3 / v6.4) never touched the flag, so
        Mike (and Felicia) were the ONLY sprites on screen drawn with
        bilinear sampling. Player fringed dark, NPCs didn't — hence
        "the characters aren't transparent, look at the player".

   Fix (two layers):
     1. ASSETS re-encoded as RGBA with true alpha-bleed: transparent pixels
        now carry the average colour of their opaque neighbourhood (8 px
        dilation, flat-fill beyond). Alpha channel and every opaque pixel
        are byte-identical to before — only the invisible colour under
        transparency changed, so no smoothed sampler can ever pull black.
     2. THIS HOOK wraps drawPlayer so the player renders with
        imageSmoothingEnabled = false — exact parity with the v7.13 NPC
        path. Nearest-neighbour keeps the chibi pixel-comic art crisp at
        every DPR and makes the draw immune to any future un-bled atlas.

   Verified: all five atlases reassemble byte-for-byte from their part
   files; alpha channels unchanged; no page errors at DPR 1 and DPR 3.
   ========================================================================== */
(function () {
  const __origDrawPlayer719 = drawPlayer;
  drawPlayer = function (s, tm) {
    ctx.save();
    ctx.imageSmoothingEnabled = false; // parity with the v7.13 NPC renderer
    try { return __origDrawPlayer719(s, tm); }
    finally { ctx.restore(); }
  };

  window.v719 = { version: "7.19" };
  console.log("[v7.19] True Transparency loaded");
})();

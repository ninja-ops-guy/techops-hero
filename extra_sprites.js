// Extra sprite atlas (from the TechOps Hero character sheet) — action poses, emotes, equipment
// Atlas payload is split across sp0..spN part files (loaded before this file) for reliable delivery.
const PLAYER_EXTRA = {
  cell: 128,
  frames: {
    helpdesk: [0, 0], fixit: [1, 0], coffee: [2, 0], solved: [3, 0], hurt: [4, 0],
    powerup: [0, 1], victory: [1, 1], wrench: [2, 1], router: [3, 1], server: [4, 1],
    dots: [0, 2], bq: [1, 2], bex: [2, 2], heart: [3, 2], cool: [4, 2],
    lol: [0, 3], mug: [1, 3], check: [2, 3], warn: [3, 3], ticket: [4, 3],
  },
  src: "data:image/png;base64," + (window.__SP || []).join(""),
};

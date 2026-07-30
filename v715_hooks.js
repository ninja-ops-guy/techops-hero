/* ==========================================================================
   v7.15 — TILE-TRUE MOVEMENT
   The old engine hopped: an accumulator fired at irregular, frame-rate-
   dependent intervals and the player TELEPORTED a full tile each time.
   On touch screens especially that read as "not tile accurate" — you
   landed between where you expected to be.

   This hook rebuilds movement as classic grid-locked locomotion:
     · s.px / s.py stay INTEGER tile coordinates — every system that
       checks collision, adjacency, interaction, waypoints or NPC
       positions keeps exact tile truth.
     · New s.rx / s.ry hold the fractional RENDER position, which glides
       toward the logical tile at moveSpeed() tiles/sec.
     · A new tile is only committed when the render position has mostly
       caught up, so holding a direction flows at exactly one tile per
       (1 / moveSpeed) seconds, and a single tap moves exactly one tile.
     · draw() is wrapped so the camera, player sprite and minimap render
       from the fractional position — smooth motion, exact logic.

   The original step() chain still runs untouched for every other system
   (NPC wander, facing, phone watch, war-driving, onward doors...); only
   its tile-hop is neutralised by pinning the legacy hop accumulator far
   below its firing threshold (moveAcc is a mutable engine global; the
   hop branch also resets it, so it can never recover). Felicia's Impreza
   boost (2.4x) is honoured in the glide.
   ========================================================================== */
(function () {
  const __origStep715 = step;
  const __origSpeed715 = moveSpeed;

  function felDrive715() {
    try { return typeof isFel === "function" && isFel() && S.lab.includes("impreza"); }
    catch (e) { return false; }
  }

  step = function (dt) {
    const s = S;
    if (s && s.map && (s.rx === undefined || s.ry === undefined)) { s.rx = s.px; s.ry = s.py; }

    // pin the legacy hop accumulator: the inner chain runs normally
    // (facing, NPC wander, all dt-driven systems) but never tile-hops.
    if (typeof moveAcc !== "undefined") moveAcc = -1e9;

    __origStep715(dt);

    if (!s || !s.map) return;
    if (s.inDialog || s.inBattle || s.gameOver || panelOpen || eodOpen) {
      // frozen world: park the render position on the logical tile
      s.rx = s.px; s.ry = s.py; s.moving = false;
      return;
    }

    // teleports (doors, drive-home, scene transitions) snap instantly
    if (Math.hypot(s.px - s.rx, s.py - s.ry) > 3) { s.rx = s.px; s.ry = s.py; }

    // 1) glide the render position toward the logical tile
    let v = __origSpeed715();
    if (felDrive715()) v *= 2.4; // she drives, not walks
    const gx = s.px - s.rx, gy = s.py - s.ry;
    const gd = Math.hypot(gx, gy);
    if (gd > 0.001) {
      const st = Math.min(gd, v * dt);
      s.rx += gx / gd * st; s.ry += gy / gd * st;
    }
    if (Math.hypot(s.px - s.rx, s.py - s.ry) < 0.02) { s.rx = s.px; s.ry = s.py; }
    s.moving = gd > 0.02;

    // 2) commit the next tile only once we've mostly arrived — this is what
    //    makes holding a key flow at exactly moveSpeed() tiles per second
    if (gd > 0.3) return;
    const dx = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0) + joy.x;
    const dy = (keys.w || keys.arrowup ? -1 : 0) + (keys.s || keys.arrowdown ? 1 : 0) + joy.y;
    if (Math.hypot(dx, dy) <= .3) return;
    const nx = clamp(s.px + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0), 1, MAPW - 2);
    const ny = clamp(s.py + (Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0), 1, MAPH - 2);
    if (s.map[ny][nx] === 0 && !npcAt(nx, ny)) { s.px = nx; s.py = ny; s.moving = true; }
    else if (s.map[s.py][nx] === 0 && !npcAt(nx, s.py)) { s.px = nx; s.moving = true; }
    else if (s.map[ny][s.px] === 0 && !npcAt(s.px, ny)) { s.py = ny; s.moving = true; }
  };

  // camera, player sprite and minimap render from the fractional position
  const __origDraw715 = draw;
  draw = function () {
    const s = S;
    if (s && s.map && s.rx !== undefined) {
      const opx = s.px, opy = s.py;
      s.px = s.rx; s.py = s.ry;
      try { __origDraw715.apply(this, arguments); }
      finally { s.px = opx; s.py = opy; }
      return;
    }
    return __origDraw715.apply(this, arguments);
  };

  window.v715 = { version: "7.15" };
})();

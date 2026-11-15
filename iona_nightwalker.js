/* Iona's band-reference appearance for her earned linked Night Walker sections.
 * Presentation only: no actor flags are persisted, and combat owns its clock. */
(function (root) {
  'use strict';
  const SRC = 'assets/iona-nightwalker/iona-band-v1.webp';
  const BICYCLE_SRC = 'assets/iona-nightwalker/iona-bicycle-v1.webp';
  const CELLS = Object.freeze({
    idle: 0, jump: 5, block: 6, jab: 7, cross: 8, uppercut: 9,
    low: 10, kick: 11, 'rising-kick': 12, sweep: 13, launcher: 14,
    air: 15, 'air-kick': 16, 'air-slam': 17, 'air-down': 17, dash: 18, grab: 19,
    throw: 20, 'throw-up': 21, 'throw-down': 20, hurt: 22, down: 23
  });
  let image = null, bicycleImage = null, failed = false;
  function warmBicycle() {
    if (!bicycleImage && root.Image) { bicycleImage = new root.Image(); bicycleImage.decoding = 'async'; bicycleImage.src = BICYCLE_SRC; }
    return bicycleImage && bicycleImage.complete && bicycleImage.naturalWidth === 1254 && bicycleImage.naturalHeight === 1254 ? bicycleImage : null;
  }
  function frame(cell) {
    // The generated down pose crosses the nominal final column boundary.
    // Measured blank gutters keep its head out of hurt and retain the full body.
    if (cell === 22) return {rect: [1008, 768, 240, 256], pivot: [144, 240]};
    if (cell === 23) return {rect: [1248, 768, 288, 256], pivot: [160, 224]};
    return {rect: [(cell % 6) * 256, Math.floor(cell / 6) * 256, 256, 256], pivot: [128, 240]};
  }
  function warm() {
    if (!image && root.Image) {
      image = new root.Image();
      image.decoding = 'async';
      image.onerror = function () { failed = true; };
      image.src = SRC;
    }
    return image && image.complete && image.naturalWidth === 1536 && image.naturalHeight === 1024 ? image : null;
  }
  function owns(n) {
    return !!(root.TechOpsNightCombat && root.TechOpsNightCombat.actor(n) === 'iona');
  }
  function sample(n, now) {
    const pose = root.TechOpsNightMoves && root.TechOpsNightMoves.sample(n, now);
    let cell = 0, kind = 'idle', face = n.face || 1;
    if (pose) {
      kind = pose.kind; face = pose.face;
      if (kind === 'bicycle-kick') {
        const cell = pose.age < 75 || pose.age >= 275 ? 0 : pose.age < 145 ? 1 : pose.age < 215 ? 2 : 3;
        return {kind, cell, face, bicycle: true, rect: [cell % 2 * 627, Math.floor(cell / 2) * 627, 627, 627], pivot: [260, 596], standingHeight: 520};
      }
      if (kind === 'get-up') cell = [23, 10, 6, 0][pose.frame];
      else {
        cell = CELLS[kind] === undefined ? 6 : CELLS[kind];
        // One distinct action key pose, with guard anticipation/recovery.
        // Injury, defense, grabs, dashes and grounded defeat keep their own pose.
        if (!['down', 'hurt', 'block', 'grab', 'dash'].includes(kind) &&
            (pose.frame === 0 || pose.frame === 3)) cell = n.onGround ? 6 : 5;
      }
    } else if (!n.onGround) { kind = 'jump'; cell = 5; }
    else if (Math.abs(n.vx || 0) > .45) {
      kind = 'walk';
      const time = n._nightCombat ? n._nightCombat.time : now || 0;
      cell = 1 + Math.floor(time / 125) % 4;
    }
    return {kind, cell, face, ...frame(cell)};
  }
  function draw(ctx, n, px, py, now, height) {
    if (!owns(n)) return false;
    const img = warm(), cx = px + (n.w || 22) / 2, base = py + (n.h || 34) + 3;
    if (!img) {
      // Never silently substitute Mike while an Iona asset is unavailable.
      ctx.save(); ctx.fillStyle = '#eee'; ctx.font = '11px monospace';
      ctx.fillText(failed ? 'Iona · sprite unavailable' : 'Iona · loading', cx - 42, base - 45);
      ctx.restore(); return true;
    }
    let pose = sample(n, now), drawnImage = img;
    if (pose.bicycle) {
      const bicycle = warmBicycle();
      if (bicycle) drawnImage = bicycle;
      else pose = {...pose, ...frame(16), standingHeight: 220};
    }
    const scale = (height || 75) / (pose.standingHeight || 220);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (n.onGround) {
      ctx.fillStyle = '#0005'; ctx.beginPath();
      ctx.ellipse(cx, base - 1, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (n.ifr > 0 && Math.floor((now || 0) / 80) % 2) ctx.globalAlpha = .55;
    ctx.translate(Math.round(cx), Math.round(base)); ctx.scale(pose.face < 0 ? -1 : 1, 1);
    ctx.drawImage(drawnImage, ...pose.rect, -pose.pivot[0] * scale, -pose.pivot[1] * scale, pose.rect[2] * scale, pose.rect[3] * scale);
    ctx.restore(); return true;
  }
  root.TechOpsIonaNightwalker = {VERSION: 2, SRC, BICYCLE_SRC, CELLS, owns, warm, warmBicycle, frame, sample, draw};
  warm(); warmBicycle();
})(typeof globalThis !== 'undefined' ? globalThis : this);

// v6.9 "Department Interiors": entering a department switches to a side-view scene
// (pixel-art backdrop, side-scrolling walk, talk to the dept's people at their stations),
// in the reference art style. Toggleable in Settings. Consistency pass included.
(function () {
  const V69_VER = "6.9.0";
  const SIDE_BIOMES = ["itdept", "eng", "exec", "finance", "sales", "hr", "marketing"];

  // ---------- settings toggle ----------
  if (window.V67SET && V67SET.sideRooms === undefined) { V67SET.sideRooms = true; try { localStorage.setItem("techops_settings", JSON.stringify(V67SET)); } catch (e) { } }
  function injectRow() {
    const card = document.querySelector("#v67-settings .v67-set-card");
    if (!card || $("v69s-rooms")) return;
    const note = card.querySelector(".v67-note");
    const row = document.createElement("label");
    row.className = "v67-row";
    row.innerHTML = `<span>Side-view department interiors</span><input type="checkbox" id="v69s-rooms">`;
    card.insertBefore(row, note);
    const el = row.querySelector("input");
    el.checked = V67SET.sideRooms !== false;
    el.oninput = () => { V67SET.sideRooms = el.checked; try { localStorage.setItem("techops_settings", JSON.stringify(V67SET)); } catch (e) { } };
  }
  const g = $("v67-gear");
  if (g) { const old = g.onclick; g.onclick = () => { old && old(); setTimeout(injectRow, 0); }; }

  // ---------- assets ----------
  const roomImgs = {};
  if (typeof TO_ROOMS !== "undefined") for (const k in TO_ROOMS) { const im = new Image(); im.src = TO_ROOMS[k]; roomImgs[k] = im; }
  const _npcImg69 = new Image();
  if (typeof TO_NPCS !== "undefined") _npcImg69.src = TO_NPCS;
  const _felImg69 = new Image();
  if (typeof TO_FELICIA !== "undefined") _felImg69.src = TO_FELICIA;

  // ---------- room state ----------
  function inRoom() { return !!(S && S.room); }
  function roomNpcs(biomeId) {
    if (biomeId === "itdept") {
      // the IT crew are set-dressing from office_hooks, not world NPCs — give them stations
      return [
        { name: "Nick", dept: "IT", ambient: true, _pseudo: true },
        { name: "Amit", dept: "IT", ambient: true, _pseudo: true },
        { name: "Brandon", dept: "IT", ambient: true, _pseudo: true },
        { name: "Daniel", dept: "IT", ambient: true, _pseudo: true },
      ];
    }
    return S.npcs.filter(n => (typeof BIOME_OF_DEPT !== "undefined") && BIOME_OF_DEPT[n.dept] === biomeId);
  }
  function enterRoom(biome) {
    const key = (typeof ROOM_OF_BIOME !== "undefined") && ROOM_OF_BIOME[biome.id];
    if (!key || !roomImgs[key]) return;
    S.room = { id: biome.id, key, x: .12, back: { px: S.px, py: S.py } };
    toast(`🏢 ${biome.name} — side view. Walk to the left door (or press Q) to head back out.`, 2600);
  }
  function exitRoom() {
    if (!S.room) return;
    S.px = S.room.back.px; S.py = S.room.back.py;
    _lastBiome = S.room.id; // don't retrigger while still standing inside
    S.room = null;
  }
  window.v69ExitRoom = exitRoom; window.v69InRoom = inRoom;

  // ---------- enter/exit detection (transitions on biome ENTRY, not presence) ----------
  let _lastBiome = undefined;
  const __origStep69 = step;
  step = function (dt) {
    const s = S;
    if (s && s.room) {
      // side-view movement: left/right along the floor
      if (!s.inDialog && !s.inBattle && !s.gameOver) {
        let dx = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0) + joy.x;
        s.moving = Math.abs(dx) > .3;
        if (s.moving) {
          s.room.x = clamp(s.room.x + Math.sign(dx) * dt * .32, .03, .97);
          s.fx = dx < 0 ? "left" : "right";
        }
        if (s.room.x <= .031 && s.moving && dx < 0) exitRoom();
      }
      return;
    }
    const r = __origStep69(dt);
    if (s && !s.nightMode && !s.inBattle && !s.inDialog && window.V67SET && V67SET.sideRooms !== false && typeof biomeAt === "function") {
      // Felicia's Watchdog mode is campus-wide top-down — side rooms would break her cruise
      if (typeof isFel === "function" && isFel()) return r;
      const b = biomeAt(s.px, s.py);
      const id = b ? b.id : null;
      if (_lastBiome === undefined) { _lastBiome = id; return r; } // seed without triggering
      if (id !== _lastBiome) {
        if (id && SIDE_BIOMES.includes(id) && !nearClueOrFel(s)) enterRoom(b);
        _lastBiome = id;
      }
    }
    return r;
  };

  // ---------- interaction ----------
  function nearestRoomNpc() {
    if (!S.room) return null;
    const npcs = roomNpcs(S.room.id);
    let best = null, bd = 1e9;
    npcs.forEach((n, i) => {
      const nx = .15 + i * Math.min(.16, .7 / Math.max(1, npcs.length));
      const d = Math.abs(nx - S.room.x);
      if (d < bd) { bd = d; best = n; }
    });
    return bd < .07 ? best : null;
  }
  // clue spots and the Felicia NPC keep their world (top-down) interactions —
  // room mode must not swallow them
  function nearClueOrFel(s) {
    if (typeof isFel === "function" && isFel()) return false;
    const f = (typeof fel === "function") ? fel() : null;
    if (!f) return false;
    const px = Math.round(s.px), py = Math.round(s.py);
    if (f.pos && !f.defeated && Math.abs(f.pos.x - px) + Math.abs(f.pos.y - py) <= 1) return true;
    if (f.spots && f.spots.some(c => !f.clues.includes(c.id) && Math.abs(c.x - px) + Math.abs(c.y - py) <= 1)) return true;
    return false;
  }
  const __origInteract69 = interact;
  interact = function () {
    const s = S;
    if (s && s.room) {
      if (s.inDialog) return;
      if (nearClueOrFel(s)) { exitRoom(); return __origInteract69(); }
      if (s.room.x <= .05) return exitRoom();
      // Felicia's station inside this department
      const f = (typeof fel === "function") ? fel() : null;
      if (f && f.pos && !f.defeated && Math.abs(s.room.x - .88) < .07 && typeof biomeAt === "function") {
        const fb = biomeAt(f.pos.x, f.pos.y);
        if (fb && fb.id === s.room.id) { exitRoom(); return __origInteract69(); }
      }
      const n = nearestRoomNpc();
      if (n) return n.ambient ? ambientTalk(n) : ticketFlow(n);
      return;
    }
    return __origInteract69();
  };
  document.addEventListener("keydown", (e) => { if (S && S.room && (e.key === "q" || e.key === "Q" || e.key === "Escape")) exitRoom(); });

  // ---------- rendering ----------
  function drawSideSprite(img, cell, frame, x, floorY, h, flip, tm) {
    if (!img.complete || !img.naturalWidth) return;
    const bob = Math.sin((tm || 0) / 480 + x) * 2;
    const w = h;
    ctx.save();
    if (flip) { ctx.translate(x + w / 2, 0); ctx.scale(-1, 1); ctx.drawImage(img, frame[0] * cell, frame[1] * cell, cell, cell, -w / 2, floorY - h + bob, w, h); }
    else ctx.drawImage(img, frame[0] * cell, frame[1] * cell, cell, cell, x - w / 2, floorY - h + bob, w, h);
    ctx.restore();
  }

  // name plates are their own objects: a standing desk plaque under each person,
  // not text baked onto the sprite (reference-art style)
  function drawNamePlate(x, floorY, name, color) {
    ctx.save();
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = Math.max(34, ctx.measureText(name).width + 16), h = 13;
    const px = x - w / 2, py = floorY + 7;
    // post + foot
    ctx.fillStyle = "#232936"; ctx.fillRect(x - 1.5, py + h, 3, 5);
    ctx.fillStyle = "#1a1f2b"; ctx.fillRect(x - 7, py + h + 5, 14, 2);
    // plaque body
    ctx.fillStyle = "#12161f";
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px, py, w, h, 3); ctx.fill(); } else ctx.fillRect(px, py, w, h);
    ctx.strokeStyle = "#46536e"; ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px + .5, py + .5, w - 1, h - 1, 3); ctx.stroke(); } else ctx.strokeRect(px + .5, py + .5, w - 1, h - 1);
    // top sheen + engraved name
    ctx.fillStyle = "#ffffff10"; ctx.fillRect(px + 2, py + 1, w - 4, 3);
    ctx.fillStyle = color || "#dfe6f5";
    ctx.fillText(name, x, py + h / 2 + .5);
    ctx.restore();
  }

  const __origDraw69 = draw;
  draw = function () {
    const s = S;
    if (!s || !s.room) return __origDraw69.apply(this, arguments);
    const tm = performance.now();
    const W = cv.width, H = cv.height;
    const img = roomImgs[s.room.key];
    const floorY = Math.round(H * .82);
    // backdrop
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, W, H);
    else { ctx.fillStyle = "#1a2030"; ctx.fillRect(0, 0, W, H); }
    // floor shadow strip
    ctx.fillStyle = "#00000038"; ctx.fillRect(0, floorY, W, H - floorY);
    // door marker (left)
    ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🚪", W * .03, floorY - 26);
    ctx.font = "bold 10px monospace"; ctx.fillStyle = "#9f9";
    ctx.fillText("EXIT", W * .03, floorY - 8);
    // dept name plate
    const b = (typeof BIOMES !== "undefined") ? BIOMES.find(b => b.id === s.room.id) : null;
    ctx.font = "bold 12px monospace"; ctx.fillStyle = "#fffc";
    ctx.fillText(b ? b.name : s.room.id, W / 2, 22);
    // npcs at stations
    const npcs = roomNpcs(s.room.id);
    npcs.forEach((n, i) => {
      const nx = .15 + i * Math.min(.16, .7 / Math.max(1, npcs.length));
      const x = nx * W;
      // shadow
      ctx.fillStyle = "#0006"; ctx.beginPath(); ctx.ellipse(x, floorY + 4, 22, 5, 0, 0, 7); ctx.fill();
      if (typeof npcIdx === "function") drawSideSprite(_npcImg69, 128, [npcIdx(n), 0], x, floorY, 64, false, tm);
      if (!n.ambient && !n.done) { ctx.font = "15px serif"; ctx.fillText(n.critical ? "🚨" : "🎫", x + 18, floorY - 66); }
      else if (!n.ambient && n.done) { ctx.font = "13px serif"; ctx.fillText("✅", x + 18, floorY - 64); }
      drawNamePlate(x, floorY, n.name, n.ambient ? "#9fb4d8" : "#ffd24a");
    });
    // felicia, if she's in this department
    const f = (typeof fel === "function") ? fel() : null;
    if (f && f.pos && !f.defeated && typeof biomeAt === "function" && !(typeof isFel === "function" && isFel())) {
      const fb = biomeAt(f.pos.x, f.pos.y);
      if (fb && fb.id === s.room.id) {
        const x = W * .88;
        ctx.fillStyle = "#0006"; ctx.beginPath(); ctx.ellipse(x, floorY + 4, 22, 5, 0, 0, 7); ctx.fill();
        drawSideSprite(_felImg69, (typeof FEL_ATLAS !== "undefined" ? FEL_ATLAS.cell : 128), [0, 0], x, floorY, 66, false, tm);
        drawNamePlate(x, floorY, "Felicia", "#00d9ff");
      }
    }
    // player (side view, walk frames)
    const px = s.room.x * W;
    ctx.fillStyle = "#0007"; ctx.beginPath(); ctx.ellipse(px, floorY + 5, 24, 6, 0, 0, 7); ctx.fill();
    if (typeof playerImg !== "undefined" && playerImg.complete && playerImg.naturalWidth && typeof PLAYER_ATLAS !== "undefined") {
      const fk = s.moving ? `${s.fx === "left" ? "left" : "right"}${1 + Math.floor(tm / 160) % 2}` : "down0";
      const fr = PLAYER_ATLAS.frames[fk] || PLAYER_ATLAS.frames.down0 || [0, 0];
      drawSideSprite(playerImg, PLAYER_ATLAS.cell, fr, px, floorY, 72, false, s.moving ? tm : 0);
    } else {
      ctx.font = "34px serif"; ctx.fillText("🧑‍🔧", px, floorY - 30);
    }
    // interaction hint
    const n = nearestRoomNpc();
    if (n && !s.inDialog) {
      ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd24a";
      ctx.fillText(`E — talk to ${n.name}`, px, floorY - 84);
    }
  };

  console.log(`[v6.9] Department Interiors loaded (${V69_VER})`);
})();

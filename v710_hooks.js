// v7.10 "True North" — side-view interiors finally match the top-down map,
// graphically and logically; battle evidence/solution tables reconciled so the
// right tool in a fight is never the wrong answer in the diagnosis.
//
// A) ROOM ↔ MAP CORRESPONDENCE (v7.10 owns room render/interact end-to-end)
//    1. Palette truth: each biome's map colors (floor tones + accent line) drive
//       the room — multiply wash over the shared office art, biome-carpet floor
//       strip with accent baseboard, dept chip + entry card in the accent color.
//    2. Positional truth: NPCs (and Felicia) stand in the room where they stand
//       on the map — world-x inside the biome rect maps to room-x, west→left.
//    3. Door logic: the exit door sits on the edge you entered through
//       (west entry → left door, east entry → right door). Walk into it (or Q)
//       to leave back to the exact tile you came from.
//    4. Entry name card + a live dept chip (open tickets in this department).
//
// B) BATTLE FLOW CONSISTENCY — ENEMY_TACTICS weak-lists contradicted the
//    diagnosis tables (the fight called moves "super effective" that the
//    diagnosis listed as wrong answers):
//      printer: weak was swap/patch, but "Replace the toner" is a wrong answer
//               and the root fix is the spooler → weak = PowerShell + Event Viewer
//      vpn:     ACL strike isn't a VPN tool → weak = Traceroute + Wireshark
//      ad:      Password Reset was weak while "Reset the user's password" is a
//               listed wrong answer (the fix is Event 4740) → weak = PowerShell + Event Viewer
//      bsod:    Hardware Swap was weak while "Run a full memory test first" is a
//               listed wrong answer (the fix is dump analysis) → weak = Event Viewer + Patch
//      cert:    ACL isn't a certificate tool → weak = PowerShell + Event Viewer
//      backup:  Containment isn't a backup tool (the fix is VSS/job logs)
//               → weak = Event Viewer + PowerShell
//    Plus the battle intro said "form a hypothesis at ≤50%" while the gate is
//    60% CONFIDENCE — the text now says so.
(function () {
  const animsOn = () => !window.V67SET || V67SET.anims !== false;

  // ============================================================
  // B) BATTLE CONSISTENCY (mutate the shared tables in place)
  // ============================================================
  try {
    if (typeof ENEMY_TACTICS !== "undefined") {
      ENEMY_TACTICS.printer.weak = ["ps", "eventvwr"];      // spooler restart + queue logs
      ENEMY_TACTICS.vpn.weak = ["tracert", "wireshark"];    // path trace + IKE handshake capture
      ENEMY_TACTICS.ad.weak = ["ps", "eventvwr"];           // Event 4740 lockout source
      ENEMY_TACTICS.bsod.weak = ["eventvwr", "patch"];      // dump/driver logs + fixed driver
      ENEMY_TACTICS.cert.weak = ["ps", "eventvwr"];         // certutil + chain logs
      ENEMY_TACTICS.backup.weak = ["eventvwr", "ps"];       // VSS writers + job logs
    }
  } catch (e) { }
  // v69's entry toast always says "left door" — the door now follows the entry edge
  const __origToast710 = toast;
  toast = function (msg, ms) {
    if (typeof msg === "string") msg = msg.replace("Walk to the left door (or press Q)", "Walk back out through the glowing door (or press Q)");
    return __origToast710.apply(this, arguments);
  };
  const __origBlog710 = blog;
  blog = function (h) {
    if (typeof h === "string" && h.includes("Form a hypothesis at ≤50%")) {
      h = h.replace("Form a hypothesis at ≤50%", "Form a hypothesis once <b>CONFIDENCE</b> hits <b>60%</b>");
    }
    return __origBlog710.apply(this, arguments);
  };

  // ============================================================
  // A) ROOM ↔ MAP CORRESPONDENCE
  // ============================================================
  const PAL_FALLBACK = {
    itdept: { name: "IT DEPARTMENT", f1: "#2a3a4a", f2: "#243442", line: "#4ac8e8" },
    marketing: { name: "MARKETING", f1: "#4a3a5a", f2: "#443452", line: "#e88ad8" },
    factory: { name: "FACTORY FLOOR", f1: "#3a3a32", f2: "#34342c", line: "#e8c84a" },
  };
  function palOf(id) {
    const b = (typeof BIOMES !== "undefined") && BIOMES.find(z => z.id === id);
    if (b) return b;
    return PAL_FALLBACK[id] || { name: (id || "").toUpperCase(), f1: "#2e3442", f2: "#282e3a", line: "#8fa0c8" };
  }

  // assets (own handles; v69's are private)
  const roomImgs = {};
  if (typeof TO_ROOMS !== "undefined") for (const k in TO_ROOMS) { const im = new Image(); im.src = TO_ROOMS[k]; roomImgs[k] = im; }
  const npcImg = new Image(); if (typeof TO_NPCS !== "undefined") npcImg.src = TO_NPCS;
  const felImg = new Image(); if (typeof TO_FELICIA !== "undefined") felImg.src = TO_FELICIA;

  function roomNpcs710(biomeId) {
    if (biomeId === "itdept") {
      return [
        { name: "Nick", dept: "IT", ambient: true, _pseudo: true },
        { name: "Amit", dept: "IT", ambient: true, _pseudo: true },
        { name: "Brandon", dept: "IT", ambient: true, _pseudo: true },
        { name: "Daniel", dept: "IT", ambient: true, _pseudo: true },
      ];
    }
    return S.npcs.filter(n => (typeof BIOME_OF_DEPT !== "undefined") && BIOME_OF_DEPT[n.dept] === biomeId);
  }
  // world-x → room-x: the dept's west edge is the left of the room, east is right
  function roomXof(n, biomeId) {
    const b = (typeof BIOMES !== "undefined") && BIOMES.find(z => z.id === biomeId);
    if (!b || n._pseudo || typeof n.x !== "number") return null;
    const t = (n.x - b.x0) / Math.max(1, b.x1 - b.x0);
    return .18 + Math.max(0, Math.min(1, t)) * .64;
  }
  function npcSpot(n, i, count, biomeId) {
    const mapped = roomXof(n, biomeId);
    if (mapped !== null) return mapped;
    return .15 + i * Math.min(.16, .7 / Math.max(1, count));
  }
  function nearestRoomNpc710() {
    if (!S.room) return null;
    const npcs = roomNpcs710(S.room.id);
    let best = null, bd = 1e9;
    npcs.forEach((n, i) => {
      const d = Math.abs(npcSpot(n, i, npcs.length, S.room.id) - S.room.x);
      if (d < bd) { bd = d; best = n; }
    });
    return bd < .07 ? best : null;
  }
  function felHere(s) {
    const f = (typeof fel === "function") ? fel() : null;
    if (!f || !f.pos || f.defeated || (typeof isFel === "function" && isFel())) return null;
    const fb = (typeof biomeAt === "function") && biomeAt(f.pos.x, f.pos.y);
    if (fb && fb.id === s.room.id) return f;
    return null;
  }
  function nearClueOrFel710(s) {
    // clue spots and the APT herself keep their top-down interactions
    if (typeof isFel === "function" && isFel()) return false;
    const f = (typeof fel === "function") ? fel() : null;
    if (!f) return false;
    const px = Math.round(s.px), py = Math.round(s.py);
    if (f.pos && !f.defeated && Math.abs(f.pos.x - px) + Math.abs(f.pos.y - py) <= 1) return true;
    if (f.spots && f.spots.some(c => !f.clues.includes(c.id) && Math.abs(c.x - px) + Math.abs(c.y - py) <= 1)) return true;
    return false;
  }

  // ---- movement: door on the entry edge; v69 drives left-door rooms ----
  const __origStep710 = step;
  step = function (dt) {
    const s = S;
    const hadRoom = s && s.room;
    if (s && s.room && s.room.door === "right") {
      if (!s.inDialog && !s.inBattle && !s.gameOver) {
        let dx = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0) + joy.x;
        s.moving = Math.abs(dx) > .3;
        if (s.moving) {
          s.room.x = clamp(s.room.x + Math.sign(dx) * dt * .32, .03, .97);
          s.fx = dx < 0 ? "left" : "right";
        }
        if (s.room.x >= .969 && s.moving && dx > 0) window.v69ExitRoom();
      }
      return;
    }
    const r = __origStep710.apply(this, arguments);
    if (!hadRoom && s && s.room && !s.room.door) {
      const b = (typeof BIOMES !== "undefined") && BIOMES.find(z => z.id === s.room.id);
      if (b) {
        const t = (s.room.back.px - b.x0) / Math.max(1, b.x1 - b.x0);
        if (t > .5) { s.room.door = "right"; s.room.x = .88; }
        else s.room.door = "left";
      } else s.room.door = "left";
      roomCard(s.room.id);
    }
    return r;
  };

  const __origInteract710 = interact;
  interact = function () {
    const s = S;
    if (s && s.room) {
      if (s.inDialog) return;
      if (nearClueOrFel710(s)) { window.v69ExitRoom(); return __origInteract710.apply(this, arguments); }
      const doorRight = s.room.door === "right";
      if (!doorRight && s.room.x <= .05) return window.v69ExitRoom();
      if (doorRight && s.room.x >= .95) return window.v69ExitRoom();
      // Felicia's station inside this department → step back out and talk in the world
      const f = felHere(s);
      if (f) {
        const fx = roomXof({ x: f.pos.x }, s.room.id);
        if (fx !== null && Math.abs(s.room.x - fx) < .07) { window.v69ExitRoom(); return __origInteract710.apply(this, arguments); }
      }
      const n = nearestRoomNpc710();
      if (n) return n.ambient ? ambientTalk(n) : ticketFlow(n);
      return;
    }
    return __origInteract710.apply(this, arguments);
  };

  // ---- entry name card ----
  let cardT = null;
  function roomCard(biomeId) {
    const old = document.getElementById("v710-card"); if (old) old.remove();
    const p = palOf(biomeId);
    const open = S.npcs.filter(n => !n.done && n.type && (BIOME_OF_DEPT[n.dept] === biomeId)).length;
    const d = document.createElement("div");
    d.id = "v710-card";
    d.innerHTML = `<div class="v710-name">${p.name}</div><div class="v710-sub">${open ? open + " open ticket" + (open > 1 ? "s" : "") + " here" : "no open tickets here"}</div>`;
    d.style.setProperty("--acc", p.line);
    document.body.appendChild(d);
    requestAnimationFrame(() => d.classList.add("on"));
    clearTimeout(cardT);
    cardT = setTimeout(() => { d.classList.remove("on"); setTimeout(() => d.remove(), 500); }, animsOn() ? 2200 : 1200);
  }

  // ---- full room render (v7.10 owns it; v69's room draw never runs) ----
  function drawSideSprite(img, cell, frame, x, floorY, h, flip, tm) {
    if (!img.complete || !img.naturalWidth) return;
    const bob = Math.sin((tm || 0) / 480 + x) * 2;
    const w = h;
    ctx.save();
    if (flip) { ctx.translate(x + w / 2, 0); ctx.scale(-1, 1); ctx.drawImage(img, frame[0] * cell, frame[1] * cell, cell, cell, -w / 2, floorY - h + bob, w, h); }
    else ctx.drawImage(img, frame[0] * cell, frame[1] * cell, cell, cell, x - w / 2, floorY - h + bob, w, h);
    ctx.restore();
  }
  function drawNamePlate(x, floorY, name, color) {
    ctx.save();
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = Math.max(34, ctx.measureText(name).width + 16), h = 13;
    const px = x - w / 2, py = floorY + 7;
    ctx.fillStyle = "#232936"; ctx.fillRect(x - 1.5, py + h, 3, 5);
    ctx.fillStyle = "#1a1f2b"; ctx.fillRect(x - 7, py + h + 5, 14, 2);
    ctx.fillStyle = "#12161f";
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px, py, w, h, 3); ctx.fill(); } else ctx.fillRect(px, py, w, h);
    ctx.strokeStyle = "#46536e"; ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px + .5, py + .5, w - 1, h - 1, 3); ctx.stroke(); } else ctx.strokeRect(px + .5, py + .5, w - 1, h - 1);
    ctx.fillStyle = "#ffffff10"; ctx.fillRect(px + 2, py + 1, w - 4, 3);
    ctx.fillStyle = color || "#dfe6f5";
    ctx.fillText(name, x, py + h / 2 + .5);
    ctx.restore();
  }

  const __origDraw710 = draw;
  draw = function () {
    const s = S;
    if (!s || !s.room) return __origDraw710.apply(this, arguments);
    const tm = performance.now();
    const W = cv.width, H = cv.height;
    const p = palOf(s.room.id);
    const floorY = Math.round(H * .82);
    const img = roomImgs[s.room.key];
    // backdrop — cover-fit, never distorted
    if (img && img.complete && img.naturalWidth) {
      const ir = img.naturalWidth / img.naturalHeight, cr = W / H;
      let dw, dh;
      if (cr > ir) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else { ctx.fillStyle = "#1a2030"; ctx.fillRect(0, 0, W, H); }
    // palette truth: biome wash + biome carpet + accent baseboard
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = .22; ctx.fillStyle = p.f1;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const g = ctx.createLinearGradient(0, floorY, 0, H);
    g.addColorStop(0, p.f1); g.addColorStop(1, p.f2);
    ctx.fillStyle = g; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.fillStyle = p.line; ctx.globalAlpha = .85; ctx.fillRect(0, floorY, W, 3); ctx.globalAlpha = 1;
    ctx.fillStyle = "#00000030"; ctx.fillRect(0, floorY + 3, W, 6);
    // door on the edge you entered through
    const doorRight = s.room.door === "right";
    const doorX = doorRight ? W * .97 : W * .03;
    ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🚪", doorX, floorY - 26);
    ctx.font = "bold 10px monospace"; ctx.fillStyle = "#9f9";
    ctx.fillText(doorRight ? "EXIT ▶" : "◀ EXIT", doorX, floorY - 8);
    // npcs at their mapped stations
    const npcs = roomNpcs710(s.room.id);
    npcs.forEach((n, i) => {
      const x = npcSpot(n, i, npcs.length, s.room.id) * W;
      ctx.fillStyle = "#0006"; ctx.beginPath(); ctx.ellipse(x, floorY + 4, 22, 5, 0, 0, 7); ctx.fill();
      if (typeof npcIdx === "function") drawSideSprite(npcImg, 128, [npcIdx(n), 0], x, floorY, 64, false, tm);
      if (!n.ambient && !n.done) { ctx.font = "15px serif"; ctx.fillText(n.critical ? "🚨" : "🎫", x + 18, floorY - 66); }
      else if (!n.ambient && n.done) { ctx.font = "13px serif"; ctx.fillText("✅", x + 18, floorY - 64); }
      drawNamePlate(x, floorY, n.name, n.ambient ? "#9fb4d8" : "#ffd24a");
    });
    // felicia at her mapped station
    const f = felHere(s);
    if (f) {
      const fx = roomXof({ x: f.pos.x }, s.room.id);
      if (fx !== null) {
        const x = fx * W;
        ctx.fillStyle = "#0006"; ctx.beginPath(); ctx.ellipse(x, floorY + 4, 22, 5, 0, 0, 7); ctx.fill();
        drawSideSprite(felImg, (typeof FEL_ATLAS !== "undefined" ? FEL_ATLAS.cell : 128), [0, 0], x, floorY, 66, false, tm);
        drawNamePlate(x, floorY, "Felicia", "#00d9ff");
      }
    }
    // player
    const px = s.room.x * W;
    ctx.fillStyle = "#0007"; ctx.beginPath(); ctx.ellipse(px, floorY + 5, 24, 6, 0, 0, 7); ctx.fill();
    if (typeof playerImg !== "undefined" && playerImg.complete && playerImg.naturalWidth && typeof PLAYER_ATLAS !== "undefined") {
      const fk = s.moving ? `${s.fx === "left" ? "left" : "right"}${1 + Math.floor(tm / 160) % 2}` : "down0";
      const fr = PLAYER_ATLAS.frames[fk] || PLAYER_ATLAS.frames.down0 || [0, 0];
      drawSideSprite(playerImg, PLAYER_ATLAS.cell, fr, px, floorY, 72, false, s.moving ? tm : 0);
    } else { ctx.font = "34px serif"; ctx.fillText("🧑‍🔧", px, floorY - 30); }
    // hint
    const n = nearestRoomNpc710();
    if (n && !s.inDialog) {
      ctx.font = "bold 10px monospace"; ctx.fillStyle = "#ffd24a"; ctx.textAlign = "center";
      ctx.fillText(`E — talk to ${n.name}`, px, floorY - 84);
    }
    // dept chip: accent stripe + live open-ticket count
    const open = s.npcs.filter(x => !x.done && x.type && (BIOME_OF_DEPT[x.dept] === s.room.id)).length;
    ctx.textAlign = "left";
    ctx.fillStyle = "#00000088"; ctx.fillRect(8, 8, 196, 34);
    ctx.fillStyle = p.line; ctx.fillRect(8, 8, 3, 34);
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#e8ecf5"; ctx.fillText(p.name, 18, 21);
    ctx.fillStyle = open ? "#ffd24a" : "#7dd87d";
    ctx.fillText(open ? `🎫 ${open} open here` : "✅ all clear", 18, 35);
  };

  const st = document.createElement("style");
  st.textContent = `
#v710-card{position:fixed;left:50%;top:18%;transform:translate(-50%,-8px);z-index:940;pointer-events:none;
 opacity:0;transition:opacity .4s ease,transform .4s cubic-bezier(.2,.8,.2,1);text-align:center}
#v710-card.on{opacity:1;transform:translate(-50%,0)}
#v710-card .v710-name{font-family:'Press Start 2P',monospace;font-size:18px;color:var(--acc,#8fa0c8);
 text-shadow:0 0 18px #000,0 2px 0 #000;letter-spacing:2px}
#v710-card .v710-sub{font-family:'Press Start 2P',monospace;font-size:9px;color:#e8ecf5cc;margin-top:8px;
 text-shadow:0 1px 0 #000}`;
  document.head.appendChild(st);

  window.v710 = { palOf, roomXof, nearestRoomNpc710, roomCard };
  console.log("[v7.10] True North loaded");
})();

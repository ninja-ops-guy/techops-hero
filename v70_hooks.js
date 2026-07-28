// v7.0 "Ghost Protocol": Felicia now appears only on occasion at scripted haunts
// (campus café, break area, front steps) and walks off-map after each encounter,
// staying gone until her next scheduled appearance. Prod/dev separation hardening:
// playable Felicia requires the boss-win unlock (console tampering is reverted),
// and test helpers exist only behind ?dev=1. Name plates + IT backdrop are asset swaps.
(function () {
  const V70_VER = "7.0.0";
  const DEV = /[?&]dev=1\b/.test(location.search);
  window.TOH_DEV = DEV;

  // ---------- durable unlock flag (run saves are wiped on new games) ----------
  const UNLOCK_KEY = "techops_felicia_unlock";
  const unlocked70 = () => {
    try { if (localStorage.getItem(UNLOCK_KEY) === "1") return true; } catch (e) { }
    try { const d = load(); return !!(d && d.meta && d.meta._fel && d.meta._fel.unlocked); } catch (e) { return false; }
  };
  // migrate a save-based unlock to the durable flag
  try { const d = load(); if (d && d.meta && d.meta._fel && d.meta._fel.unlocked) localStorage.setItem(UNLOCK_KEY, "1"); } catch (e) { }
  // stamp the flag when the boss is beaten (v6.4's handler runs in the same chain)
  const __origWinBattle70 = winBattle;
  winBattle = function () {
    const wasFel = !!(typeof B !== "undefined" && B && B.felicia);
    const r = __origWinBattle70.apply(this, arguments);
    if (wasFel) try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (e) { }
    return r;
  };
  // v6.4 injected the title button at its load time from the (now wiped) save —
  // if the durable flag says she's unlocked, make sure the button exists
  (function ensureFelButton70() {
    if (!unlocked70()) return;
    const ts = document.getElementById("title-screen");
    if (!ts || document.getElementById("btn-felicia")) return;
    const b = document.createElement("button");
    b.id = "btn-felicia";
    b.textContent = "🕶️ WATCHDOG PROTOCOL — PLAY AS FELICIA";
    b.onclick = () => { localStorage.setItem("techops_char", "felicia"); document.getElementById("btn-start").click(); };
    ts.appendChild(b);
  })();

  // ---------- prod guard: playable Felicia requires the unlock ----------
  const __origNewState70 = newState;
  newState = function () {
    const s = __origNewState70();
    if (s && s.meta && s.meta._char === "felicia" && !unlocked70()) {
      s.meta._char = null;
      try { localStorage.removeItem("techops_char"); } catch (e) { }
      console.warn("[v7.0] Felicia selected without unlock — reverting to Mike");
    }
    return s;
  };

  // dev-only test helpers — never exist in prod (no ?dev=1, no API)
  if (DEV) {
    window.TOH_DEBUG = {
      unlockFelicia() { try { localStorage.setItem(UNLOCK_KEY, "1"); const d = load() || {}; d.meta = d.meta || {}; d.meta._fel = Object.assign(d.meta._fel || {}, { unlocked: true }); localStorage.setItem("techops_save", JSON.stringify(d)); } catch (e) { } },
      lockFelicia() { try { localStorage.removeItem(UNLOCK_KEY); const d = load() || {}; if (d.meta && d.meta._fel) d.meta._fel.unlocked = false; localStorage.setItem("techops_save", JSON.stringify(d)); } catch (e) { } },
    };
  }

  // ---------- scripted haunts (café, break area, front steps) ----------
  const FEL_SPOTS = [
    { x: 26, y: 14, label: "campus café" },
    { x: 8, y: 15, label: "break area" },
    { x: 17, y: 4, label: "front steps" },
  ];

  // ---------- appearance scheduling (after v6.4 places her every day) ----------
  const __origSetupDay70 = setupDay;
  setupDay = function () {
    __origSetupDay70();
    const s = S;
    if (!s || typeof fel !== "function" || (typeof isFel === "function" && isFel())) return;
    const f = fel();
    f._leaving = null; f._talked = false;
    if (f.defeated) { f.pos = null; return; }
    if ((f.clues || []).length >= 5) return; // endgame: she stays findable for the confrontation
    const next = f.nextAppear || 1;
    if (s.day < next) { f.pos = null; return; } // off campus today
    const spot = FEL_SPOTS[(s.day + (f.visits || 0)) % FEL_SPOTS.length];
    f.pos = freeSpot(s.map, spot.x, spot.y);
    f._spot = spot.label;
  };

  // ---------- interaction: room-station fix + encounter detection ----------
  const __origInteract70 = interact;
  interact = function () {
    const s = S;
    const f = (typeof fel === "function") ? fel() : null;
    const npcFel = f && f.pos && !f.defeated && !(typeof isFel === "function" && isFel());
    // Felicia stationed inside a side-view room: step back out next to her, then talk
    if (npcFel && s.room && Math.abs(s.room.x - .88) < .07 && typeof biomeAt === "function") {
      const fb = biomeAt(Math.round(f.pos.x), Math.round(f.pos.y));
      if (fb && fb.id === s.room.id) {
        if (typeof window.v69ExitRoom === "function") window.v69ExitRoom();
        s.px = Math.round(f.pos.x) + 1; s.py = Math.round(f.pos.y); // stand right beside her
        const r = __origInteract70();
        if (s.inDialog) f._talked = true;
        return r;
      }
    }
    const wasAdj = npcFel && !s.room &&
      Math.abs(Math.round(s.px) - Math.round(f.pos.x)) + Math.abs(Math.round(s.py) - Math.round(f.pos.y)) <= 2;
    const r = __origInteract70();
    if (wasAdj && s.inDialog) f._talked = true; // her conversation has begun
    return r;
  };

  // ---------- walk-off: after the encounter she leaves the map ----------
  const __origStep70 = step;
  step = function (dt) {
    const r = __origStep70(dt);
    const s = S;
    if (!s || !s.map || typeof fel !== "function" || (typeof isFel === "function" && isFel())) return r;
    const f = fel();
    if (!f.pos || f.defeated) return r;
    if (s.inBattle || (typeof B !== "undefined" && B && B.felicia)) return r; // confrontation in progress
    if (f._talked && !s.inDialog && !f._leaving) {
      // head for the nearest map edge, two tiles past the boundary
      const mw = s.map[0].length, mh = s.map.length;
      const cands = [{ x: -2, y: f.pos.y }, { x: mw + 2, y: f.pos.y }, { x: f.pos.x, y: -2 }, { x: f.pos.x, y: mh + 2 }];
      let best = cands[0], bd = 1e9;
      cands.forEach(c => { const d = Math.abs(c.x - f.pos.x) + Math.abs(c.y - f.pos.y); if (d < bd) { bd = d; best = c; } });
      f._leaving = best;
    }
    if (f._leaving) {
      const sp = 3.2 * dt;
      const dx = f._leaving.x - f.pos.x, dy = f._leaving.y - f.pos.y, d = Math.hypot(dx, dy);
      if (d <= Math.max(sp, .3)) {
        f.pos = null; f._leaving = null; f._talked = false;
        f.visits = (f.visits || 0) + 1;
        f.nextAppear = s.day + (typeof R === "function" ? R(1, 2) : 2); // gone for a day or two
        try { save(); } catch (e) { }
        toast("👋 Felicia heads off campus.", 2200);
      } else {
        f.pos = { x: f.pos.x + dx / d * sp, y: f.pos.y + dy / d * sp };
      }
    }
    return r;
  };

  console.log(`[v7.0] Ghost Protocol loaded (${V70_VER})${DEV ? " — DEV MODE" : ""}`);
})();
/* ==========================================================================
   v7.20 — FIELD POLISH (mobile annotation pass)
   Direct fixes from annotated on-device screenshots:

   1. SPAWN — setupDay() spawned at freeSpot(map centre ±4), which could
      land two tiles outside the lobby in random office clutter ("weird
      spawn location"). genMap() literally carves a lobby "reception area
      at spawn" — now the spawn actually lands IN it, deterministic tile
      order from the lobby centre out.

   2. HUD DOCK — the v5.4 Teams phone floated at top:52px right:8px while
      #hud-right's button column (twin / sweep / music / menu) grew down
      past it with a 2px gap: overlapping, cramped, sub-44px touch targets
      ("all crammed on top of each other"). The phone is moved INTO the
      hud-right column as a static flex child, the column gets an 8px gap
      and 44px touch targets, and chat toasts shift left of the dock.

   3. PROP INSPECTION — the 40 v6.3 scenic props were pure decoration:
      unlabelled and inert ("the item can't be picked up, and it's
      impossible to know what it is"). interact() now falls through to a
      prop-inspection: stand next to any scenic prop and you'll learn what
      it is, with a flavour line. Fires only when nothing else handled the
      interaction (NPCs, portals, devices, coffee, lore all win first).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 1. spawn in the lobby ---------- */
  const __origSetupDay720 = setupDay;
  setupDay = function () {
    const r = __origSetupDay720.apply(this, arguments);
    const s = S;
    if (!s || !s.map) return r;
    const cx = MAPW >> 1, cy = MAPH >> 1;
    // lobby spans (cx-5..cx+5, cy-2..cy+2) — try centre-out for a free tile
    const cands = [];
    for (let r2 = 0; r2 <= 2; r2++)
      for (let dy = -r2; dy <= r2; dy++) for (let dx = -r2; dx <= r2; dx++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r2) cands.push([cx + dx, cy + 1 + dy]);
    for (const [x, y] of cands) {
      if (y >= LOBBY.y0 && y <= LOBBY.y1 && x >= LOBBY.x0 && x <= LOBBY.x1 &&
          s.map[y] && s.map[y][x] === 0 &&
          !(typeof npcAt === "function" && npcAt(x, y))) {
        s.px = x; s.py = y;
        if (s.rx !== undefined) { s.rx = x; s.ry = y; }
        if (s._v64rx !== undefined) { s._v64rx = x; s._v64ry = y; }
        break;
      }
    }
    return r;
  };

  /* ---------- 2. HUD dock ---------- */
  const st = document.createElement("style");
  st.textContent = `
#hud-right{gap:8px !important;align-items:flex-end}
.hud-btn{min-width:44px;min-height:42px;font-size:18px;display:inline-flex;align-items:center;justify-content:center;padding:5px 8px}
#hud-right #v54-phone{position:static;width:44px;height:42px;font-size:18px;border-radius:8px}
.v54-chat{right:64px !important}
#v55-nmbtns{bottom:110px}
`;
  document.head.appendChild(st);
  const dock = () => {
    const hr = document.getElementById("hud-right");
    const ph = document.getElementById("v54-phone");
    if (hr && ph && ph.parentElement !== hr) hr.insertBefore(ph, hr.firstChild);
  };
  dock();
  // the phone button is created at v5.4 load (before us), but re-dock defensively
  setTimeout(dock, 500);

  /* ---------- 3. prop inspection ---------- */
  const PROP_INFO = [
    ["Server Rack", "Rack 04 — the production core hums behind the glass."],
    ["Terminal Monitor", "A console tailing the deploy logs. Someone watch-themed it."],
    ["Potted Plant", "A ficus. It survived three office moves and one flood."],
    ["Coffee Machine", "A decorative tribute to the sacred HELP DESK FUEL dispenser."],
    ["Whiteboard", "Last sprint's network diagram. 'DO NOT ERASE' — dated 2023."],
    ["Water Cooler", "Conversational uptime here: 99.99%."],
    ["Filing Cabinet", "Paper tickets from before the system. Shudder."],
    ["Office Chair", "A good chair. Someone dialed the lumbar in just right."],
    ["Hot Desk Bench", "Dual monitors: the minimum viable setup."],
    ["Retired Switch", "A decommissioned access switch. It blinked once, in memoriam."],
    ["Fire Extinguisher", "CO2. For electrical fires and dramatic exits."],
    ["Copier", "The copier. Jams on days ending in Y."],
    ["Toolbox", "Facilities' toolbox. The 10mm socket is gone, obviously."],
    ["Vending Machine", "Row C4 has the good chips. The machine knows what it did."],
    ["Trash Bin", "E-waste goes in the BLUE bin. This is not the blue bin."],
    ["Wall Clock", "Right twice a day — like some dashboards."],
    ["Spare Peripherals", "A keyboard and mouse. The keyboard has seen things."],
    ["Cardboard Boxes", "Unmarked boxes. Nobody moves them; nobody opens them."],
    ["Desk Lamp", "An architect's lamp. Mood lighting for budget spreadsheets."],
    ["Laptop on Stand", "A loaner laptop. Asset tag scratched off — suspicious."],
    ["Model Aircraft", "A scale model of the AeroTech VTOL prototype. Engineer's pride."],
    ["Drafting Table", "Blueprints of Bay 2. The revision dates tell a story."],
    ["CNC Mill", "Paused mid-op. Tolerances wait for no one."],
    ["Traffic Cone", "It guards a spill that dried in March."],
    ["Cable Spool", "Cat6A by the metre — the plant's ethernet lifeline."],
    ["Welding Bottles", "Argon and oxygen. Not IT's department. Definitely."],
    ["Robot Arm", "Pick-and-place arm. It waves at the shift bell; nobody admits programming that."],
    ["Pallet of Boxes", "Outbound. Marked FRAGILE, stacked optimistically."],
    ["Forklift", "Keys live in the ignition; trust lives in the culture."],
    ["Shift Lockers", "One of them smells like bravery."],
    ["Warning Sign", "The hazard left. The sign stayed."],
    ["AC Unit", "Evaporator fans keeping the floor at 'jacket-optional'."],
    ["Satellite Dish", "Telemetry uplink. Do not kick."],
    ["Test Engine", "A rocket test article. Technically not IT's problem."],
    ["Coolant Barrel", "Concentrate. The label says 'do not taste'."],
    ["Tool Cart", "Millwright's cart. Everything metric."],
    ["Hard-Hat Hanger", "Hard hats wait here like obedient turtles."],
    ["Industrial Fan", "Moves air and loose papers in equal measure."],
    ["Impact Wrench", "Ugga-dugga calibrated."],
    ["Control Panel", "Line 3 controls. The ammeter flirts with the redline."],
  ];
  const __origInteract720 = interact;
  interact = function () {
    const s = S;
    const r = __origInteract720.apply(this, arguments);
    // only inspect when nothing else claimed the interaction
    if (!s || s.inDialog || s.inBattle) return r;
    if (!(window.v63 && window.v63.v63PropSpots)) return r;
    const spots = window.v63.v63PropSpots(s);
    const hit = spots.find(([, x, y]) => Math.abs(x - s.px) + Math.abs(y - s.py) === 1);
    if (!hit) return r;
    const [name, flavor] = PROP_INFO[hit[0]] || ["Equipment", "Plant equipment. Not your ticket."];
    dlg("🔍 " + name, `<i>${flavor}</i><br><br><small>Scenery — no ticket here. The real work glows 🎫.</small>`,
      [{ t: "Back to work", f: closeDlg }]);
    return r;
  };

  window.v720 = { version: "7.20", PROP_INFO };
  console.log("[v7.20] Field Polish loaded");
})();

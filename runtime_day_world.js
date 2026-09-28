/* TechOps Hero — physical Day stations and passive wayfinding.
 * game.js owns setup, collision and rendering. This module adds no wrappers,
 * listeners, timers or animation loop. Campaign state is read, never advanced.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TechOpsDayWorld = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";
  var VERSION = 1, TILE = 32, lastState = null, lastMap = null, routeCache = null;
  var CARDINAL = [[0, 1], [-1, 0], [1, 0], [0, -1]];
  var SPECS = [
    { id: "mike_desk", label: "Mike's workstation", kind: "desk", deviceType: "desktop", roomId: "office", zoneId: "office", surface: "screen", art: 2, x: 31, y: 15 },
    { id: "shipping_printer", label: "Shipping label printer", kind: "device", deviceType: "printer", ticketId: "shipping_cannot_print", roomId: "factory", zoneId: "factory", surface: "physical", art: 14, x: 8, y: 26, contact: "shipping" },
    { id: "shipping_workstation", label: "Shipping dispatch workstation", kind: "device", deviceType: "desktop", ticketId: "shipping_cannot_print", roomId: "factory", zoneId: "factory", surface: "screen", art: 2, x: 10, y: 26, contact: "shipping" },
    { id: "plating_workstation", label: "Plating operator workstation", kind: "device", deviceType: "desktop", ticketId: "plating_workstation_down", roomId: "factory", zoneId: "factory", surface: "both", art: 2, x: 18, y: 26, contact: "plating" },
    { id: "security_workstation", label: "Security evidence workstation", kind: "device", deviceType: "desktop", ticketId: "impossible_access_event", roomId: "office", zoneId: "office", surface: "screen", art: 2, x: 38, y: 12, contact: "access" },
    { id: "laptop_dock_link", caseId: "laptop_dock_link", label: "Engineering laptop dock", kind: "device", deviceType: "laptop", roomId: "eng", zoneId: "eng", surface: "both", art: 2, x: 6, y: 10 },
    { id: "desktop_restart_window", caseId: "desktop_restart_window", label: "Finance workstation", kind: "device", deviceType: "desktop", roomId: "office", zoneId: "finance", surface: "both", art: 2, x: 14, y: 4 },
    { id: "signage_player_session", caseId: "signage_player_session", label: "Lobby signage player", kind: "device", deviceType: "mini_pc", roomId: "office", zoneId: "lobby", surface: "both", art: 21, x: 25, y: 15 },
    { id: "printer_queue_blocked", caseId: "printer_queue_blocked", label: "Finance batch printer", kind: "device", deviceType: "printer", roomId: "office", zoneId: "finance", surface: "both", art: 14, x: 18, y: 5 },
    { id: "plc_hmi_dependency", caseId: "plc_hmi_dependency", label: "Packaging cell HMI", kind: "device", deviceType: "plc_hmi", roomId: "factory", zoneId: "factory", surface: "both", art: 6, x: 25, y: 26 },
    { id: "industrial_scanner_vlan", caseId: "industrial_scanner_vlan", label: "Traceability scanner", kind: "device", deviceType: "industrial_scanner", roomId: "factory", zoneId: "factory", surface: "both", art: 6, x: 34, y: 26 },
    { id: "access_point_poe", caseId: "access_point_poe", label: "Engineering wireless AP", kind: "device", deviceType: "access_point", roomId: "eng", zoneId: "eng", surface: "both", art: 21, x: 8, y: 12 },
    { id: "timeclock_time_sync", caseId: "timeclock_time_sync", label: "HR time clock", kind: "device", deviceType: "time_clock", roomId: "office", zoneId: "hr", surface: "both", art: 21, x: 24, y: 10 }
  ];
  var ROOM_NAMES = { office: "IT / OPERATIONS", factory: "PRODUCTION FLOOR", eng: "ENGINEERING LAB", finance: "FINANCE ROW", lobby: "RECEPTION", hr: "HR CORNER", server: "DATA CENTER", exec: "EXECUTIVE SUITE", sales: "SALES FLOOR" };
  function state() { try { return typeof S !== "undefined" ? S : root.S || null; } catch (_) { return root.S || null; } }
  function active() { var s = state(); return !!(s && s.map && !s.nightMode && !(s.meta && s.meta._standaloneMode)); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function key(p) { return p.x + "," + p.y; }
  function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function player(s) { return { x: Math.round(s.px), y: Math.round(s.py) }; }
  function floor(map, p) { return !!(map[p.y] && map[p.y][p.x] === 0); }
  function neighbor(p, delta) { return { x: p.x + delta[0], y: p.y + delta[1] }; }
  function zone(x, y) {
    if (typeof root.zoneAt === "function") return root.zoneAt(x, y);
    if (x >= 1 && x <= 10 && y >= 1 && y <= 7) return "exec";
    if (x >= 11 && x <= 19 && y >= 1 && y <= 7) return "finance";
    if (x >= 20 && x <= 27 && y >= 1 && y <= 7) return "sales";
    if (x >= 1 && x <= 10 && y >= 8 && y <= 13) return "eng";
    if (x >= 20 && x <= 27 && y >= 8 && y <= 13) return "hr";
    if (x >= 16 && x <= 26 && y >= 14 && y <= 18) return "lobby";
    if (x >= 29 && x <= 40 && y >= 2 && y <= 8) return "server";
    return y >= 23 ? "factory" : "office";
  }
  function occupants(s) {
    var out = Object.create(null);
    (s.npcs || []).forEach(function (n) { out[key(n)] = true; });
    return out;
  }
  function occupiedProps(s) {
    var out = occupants(s);
    [s.devices, s.portals, s.coffeeMachines, s.loreSpots].forEach(function (list) { (list || []).forEach(function (p) { out[key(p)] = true; }); });
    var night = s._nightObjs || {};
    Object.keys(night).forEach(function (id) { var item = night[id]; if (item && Number.isFinite(item.x) && Number.isFinite(item.y)) out[key(item)] = true; });
    return out;
  }
  function flood(map, start, blockers, excluded) {
    var queue = [], visited = Object.create(null), prev = Object.create(null);
    if (!floor(map, start)) return { queue: queue, visited: visited, prev: prev };
    queue.push(start); visited[key(start)] = true;
    for (var i = 0; i < queue.length; i++) {
      var p = queue[i];
      CARDINAL.forEach(function (d) {
        var n = neighbor(p, d), k = key(n);
        if (visited[k] || !floor(map, n) || blockers && blockers[k] || excluded && k === excluded) return;
        visited[k] = true; prev[k] = key(p); queue.push(n);
      });
    }
    return { queue: queue, visited: visited, prev: prev };
  }
  function contact(id) {
    var s = state(), ids = { standup: "campaign_standup", shipping: "campaign_shipping", plating: "campaign_plating", access: "campaign_access" };
    if (!s) return null;
    var npc = (s.npcs || []).find(function (n) { return n.id === (ids[id] || id); });
    if (npc) return { id: id, kind: "contact", label: npc.name, x: npc.x, y: npc.y };
    var p = s.meta && s.meta.campaignAct1Native && s.meta.campaignAct1Native[id];
    return p ? { id: id, kind: "contact", label: id === "sector04Door" ? "Sector 04 entrance" : id, x: p.x, y: p.y } : null;
  }
  function data() { var s = state(); return s && s.meta && s.meta.dayStations; }
  function stations() { var d = data(); return d && Array.isArray(d.items) ? d.items.map(copy) : []; }
  function station(id) { var d = data(); return d && Array.isArray(d.items) ? d.items.find(function (item) { return item.id === id; }) || null : null; }
  function place(s, spec, taken, component) {
    var origin = spec.contact ? contact(spec.contact) || spec : spec;
    var candidates = component.queue.filter(function (p) {
      return !taken[key(p)] && distance(p, player(s)) > 0 && zone(p.x, p.y) === spec.zoneId;
    }).sort(function (a, b) { return distance(a, origin) - distance(b, origin) || a.y - b.y || a.x - b.x; });
    for (var i = 0; i < candidates.length; i++) {
      var p = candidates[i], after = flood(s.map, player(s), null, key(p));
      // A prop may consume a floor tile, but must never sever a corridor.
      if (after.queue.length !== component.queue.length - 1) continue;
      var approach = CARDINAL.map(function (d) { return neighbor(p, d); }).find(function (n) { return after.visited[key(n)] && !taken[key(n)]; });
      if (!approach) continue;
      var item = Object.assign({}, spec, { x: p.x, y: p.y, approach: approach, roomName: ROOM_NAMES[spec.zoneId], available: true });
      if (spec.id === "printer_queue_blocked" || spec.id === "access_point_poe") item.supportComputer = { kind: "service_laptop", label: "Mike's service laptop", connection: spec.id === "access_point_poe" ? "Managed switch console" : "Approved print administration session" };
      delete item.contact;
      s.map[p.y][p.x] = spec.art; taken[key(p)] = true;
      return { item: item, component: after };
    }
    return { item: Object.assign({}, spec, { available: false, roomName: ROOM_NAMES[spec.zoneId], unavailableReason: "No reachable service position in this room." }), component: component };
  }
  function validStore(s, d) {
    return d && d.version === VERSION && d.day === s.day && d.width === s.map[0].length && d.height === s.map.length && Array.isArray(d.items) && d.items.length === SPECS.length && SPECS.every(function (spec) {
      var item = d.items.find(function (a) { return a.id === spec.id; });
      return item && (!item.available || s.map[item.y] && s.map[item.y][item.x] === spec.art);
    });
  }
  function ensureWorld() {
    if (!active()) return false;
    var s = state(), d = data();
    if (lastState === s && lastMap === s.map && validStore(s, d)) return true;
    // A new procedural day reuses profile metadata, whereas a checkpoint also
    // restores its collision tiles. Reuse only a complete matching checkpoint.
    var newMapInSameRun = lastState === s && lastMap && lastMap !== s.map;
    if (!newMapInSameRun && validStore(s, d)) { lastState = s; lastMap = s.map; routeCache = null; return true; }
    var component = flood(s.map, player(s)), taken = occupiedProps(s), items = [];
    if (!component.queue.length) return false;
    SPECS.forEach(function (spec) { var placed = place(s, spec, taken, component); items.push(placed.item); component = placed.component; });
    s.meta = s.meta || {};
    s.meta.dayStations = { version: VERSION, day: s.day, width: s.map[0].length, height: s.map.length, items: items, routeTarget: null };
    lastState = s; lastMap = s.map; routeCache = null;
    // Existing owner caches map identity, so invalidate only when props change.
    if (typeof root.draw === "function") { root.draw._tlMap = null; root.draw._mmMap = null; }
    return true;
  }
  function at(id) { var s = state(), item = typeof id === "string" ? station(id) : station(id && id.id); return !!(active() && item && item.available && distance(player(s), item) <= 1 && floor(s.map, player(s))); }
  function deskNearby() { return at("mike_desk"); }
  function nearby() { if (!active()) return []; var s = state(); return stations().filter(function (item) { return item.available && distance(player(s), item) <= 1; }).sort(function (a, b) { return distance(player(s), a) - distance(player(s), b) || a.id.localeCompare(b.id); }); }
  function target(value) {
    if (typeof value === "string") return station(value) || contact(value);
    if (!value || typeof value !== "object") return null;
    if (value.stationId || value.target) return target(value.stationId || value.target);
    if (value.id && (station(value.id) || contact(value.id))) return target(value.id);
    return Number.isInteger(value.x) && Number.isInteger(value.y) ? value : null;
  }
  function plan(value) {
    var s = state(), dest = target(value);
    if (!active() || !dest || dest.available === false) return { ok: false, status: "unavailable", path: [], steps: 0, message: dest && dest.unavailableReason || "This destination is unavailable in the current scene." };
    var start = player(s), explored = flood(s.map, start, occupants(s));
    var endings = CARDINAL.map(function (d) { return neighbor(dest, d); });
    if (dest.kind !== "contact" && floor(s.map, dest)) endings.push({ x: dest.x, y: dest.y });
    var endingKeys = Object.create(null); endings.forEach(function (p) { endingKeys[key(p)] = true; });
    var finish = explored.queue.find(function (p) { return endingKeys[key(p)]; });
    if (!finish) return { ok: false, status: "unreachable", target: copy(dest), path: [], steps: 0, message: "The route to " + dest.label + " is blocked. Try again after the aisle clears." };
    var path = [], k = key(finish);
    while (k) { var parts = k.split(","); path.push({ x: Number(parts[0]), y: Number(parts[1]) }); k = explored.prev[k]; }
    path.reverse();
    return { ok: true, status: path.length <= 1 ? "arrived" : "walking", target: copy(dest), path: path, steps: path.length - 1, message: path.length <= 1 ? "At " + dest.label + ". Interact to continue." : "Follow the floor guide to " + dest.label + "." };
  }
  function route(value) {
    var d = data();
    if (value === null) { if (d) d.routeTarget = null; routeCache = null; return { ok: true, status: "cleared", path: [], steps: 0 }; }
    var dest = target(value), result = plan(dest);
    if (d) d.routeTarget = dest ? dest.id || { x: dest.x, y: dest.y, label: dest.label, kind: dest.kind } : null;
    routeCache = null;
    return result;
  }
  function currentRoute() {
    var s = state(), d = data(); if (!active() || !d || !d.routeTarget) return null;
    var signature = key(player(s)) + "|" + JSON.stringify(d.routeTarget) + "|" + (s.npcs || []).map(key).join(";");
    if (!routeCache || routeCache.signature !== signature) routeCache = { signature: signature, result: plan(d.routeTarget) };
    return routeCache.result;
  }
  function objective(id, label, detail, phase) { return { id: id, target: id, stationId: station(id) ? id : null, label: label, detail: detail, phase: phase }; }
  function nextObjective() {
    if (!active()) return null;
    var c; try { c = root.TechOpsCampaign && root.TechOpsCampaign.load(root.localStorage); } catch (_) { return objective("mike_desk", "Review the workday", "Walk to Mike's workstation.", "desk"); }
    if (!c) return objective("mike_desk", "Review the workday", "Walk to Mike's workstation.", "desk");
    var f = c.flags || {}, investigations = c.investigations || {}, tickets = c.tickets || {};
    if (f.tuesday_morning_reached) return objective("mike_desk", "Review the next-shift handoff", "Check the verified outcomes and follow-up work at your desk.", "handoff");
    if (!f.standup_completed) return objective("standup", "Attend morning standup", "Agree who owns each problem before beginning work.", "standup");
    if (!f.day_work_unlocked) return objective("mike_desk", "Begin the morning at your desk", "Queue, Red in the Mirror, and Felicia's company profile.", "desk");
    if (!tickets.shipping_cannot_print) {
      var shipping = investigations.shipping_cannot_print;
      if (shipping && /human_verify|workaround_verify/.test(shipping.phase)) return objective("shipping", "Verify the real Shipping task", "Talk to the clerk and check a real customs label.", "verify");
      if (!shipping || !Array.isArray(shipping.evidence) || shipping.evidence.indexOf("printer_self_test") < 0) return objective("shipping_printer", "Inspect the Shipping printer", "Check the local print engine before blaming the workstation.", "inspect");
      return objective("shipping_workstation", "Trace the customs-label failure", "Use the Shipping computer to inspect the queue and identity evidence.", "investigate");
    }
    if (!tickets.plating_workstation_down) {
      var plating = investigations.plating_workstation_down;
      if (plating && /human_verify|workaround_verify/.test(plating.phase)) return objective("plating", "Verify the operator's production task", "Confirm the real production interaction with the operator.", "verify");
      return objective("plating_workstation", "Inspect the Plating workstation", "Support the assigned owner; distinguish Windows health from the integration dependency.", "investigate");
    }
    var sources = c.evidence && c.evidence.ghostIdentityEvidence && c.evidence.ghostIdentityEvidence.sources || [];
    if (!sources.some(function (source) { return source.id === "badge_impossible_access"; })) return objective("security_workstation", "Document the impossible badge record", "Inspect the access record at Security's evidence workstation.", "evidence");
    return objective("sector04Door", "Continue to Sector 04", "Finish the handoff, then follow the established Night Walker transition.", "departure");
  }
  function render(ctx, now) {
    if (!ctx || !active()) return false;
    var d = data(); if (!d) return false;
    var guided = currentRoute(), tm = Number(now) || 0;
    var reduced = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (guided && guided.ok && guided.path.length > 1) {
      ctx.strokeStyle = "#062831"; ctx.lineWidth = 6; ctx.beginPath();
      guided.path.forEach(function (p, i) { if (!i) ctx.moveTo(p.x * TILE + 16, p.y * TILE + 16); else ctx.lineTo(p.x * TILE + 16, p.y * TILE + 16); }); ctx.stroke();
      ctx.strokeStyle = "#9ee6cc"; ctx.lineWidth = 2; ctx.setLineDash([3, 8]); ctx.lineDashOffset = reduced ? 0 : -tm / 90; ctx.stroke(); ctx.setLineDash([]);
    }
    d.items.forEach(function (item) {
      if (!item.available) return;
      var x = item.x * TILE, y = item.y * TILE, selected = guided && guided.target && guided.target.id === item.id;
      var color = selected ? "#e7f9b1" : item.kind === "desk" ? "#9ee6cc" : "#f2c888";
      // A visible service laptop supports software diagnostics on headless gear.
      // It belongs to this station; this never grants remote desktop access.
      if (item.supportComputer) {
        ctx.fillStyle = "#132331"; ctx.fillRect(x + 2, y + 19, 13, 9);
        ctx.fillStyle = "#83bbcc"; ctx.fillRect(x + 4, y + 21, 9, 5);
        ctx.fillStyle = "#c2cbd0"; ctx.fillRect(x + 1, y + 28, 15, 2);
      }
      ctx.strokeStyle = color; ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = "#132331"; ctx.fillRect(x + 22, y - 3, 11, 11);
      ctx.fillStyle = color; ctx.font = "bold 9px monospace"; ctx.fillText(item.kind === "desk" ? "M" : item.caseId ? "+" : "!", x + 27.5, y + 2.5);
      if (selected || at(item.id)) {
        var text = item.label, width = Math.min(220, ctx.measureText(text).width + 12);
        ctx.fillStyle = "#10222ded"; ctx.fillRect(x + 16 - width / 2, y - 19, width, 14);
        ctx.fillStyle = "#f3f5df"; ctx.fillText(text, x + 16, y - 12);
      }
    });
    ctx.restore(); return true;
  }
  return { VERSION: VERSION, ensureWorld: ensureWorld, stations: stations, nearby: nearby, at: at, deskNearby: deskNearby, route: route, currentRoute: currentRoute, nextObjective: nextObjective, render: render, contact: contact };
});

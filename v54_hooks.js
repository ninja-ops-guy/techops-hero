/* ============================================================
   TECHOPS HERO v5.4 — "Connected" (v54_hooks.js)
   Loads AFTER v53_hooks.js. Adds:
   • Phone/Teams interface — tickets arrive as chat notifications;
     respond, remote-fix, delegate, or escalate from your pocket
   • Living helpdesk — the IT room visibly levels up with your rank,
     from folding-table chaos to a full command center
   ============================================================ */
"use strict";

// ---------- phone: chat toasts for new tickets + a full Teams panel ----------
(function injectPhoneCss() {
  if (document.getElementById("v54-css")) return;
  const st = document.createElement("style");
  st.id = "v54-css";
  st.textContent = `
#v54-phone { position:absolute; top:52px; right:8px; z-index:55; width:46px; height:46px; border-radius:12px; background:linear-gradient(160deg,#1c2438,#0d1220); border:2px solid #3fd2ff; color:#fff; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(63,210,255,.35); }
#v54-phone:hover { background:#243050; }
#v54-badge { position:absolute; top:-6px; right:-6px; min-width:18px; height:18px; border-radius:9px; background:#ff5a6a; color:#fff; font:700 11px/18px monospace; text-align:center; padding:0 3px; }
#v54-badge.hidden { display:none; }
.v54-chat { position:absolute; right:8px; z-index:54; width:230px; background:linear-gradient(160deg,#16202e,#0d1420); border:1px solid #3fd2ff88; border-radius:10px; padding:8px 10px; color:#cfe6ff; font:11px/1.5 monospace; box-shadow:0 4px 16px rgba(0,0,0,.5); animation:v54slide .3s ease-out; cursor:pointer; }
.v54-chat b { color:#3fd2ff; }
.v54-chat small { color:#7fa3c8; display:block; margin-top:2px; }
@keyframes v54slide { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }`;
  document.head.appendChild(st);
  const wrap = document.getElementById("game-wrap");
  if (!wrap) return;
  const btn = document.createElement("div");
  btn.id = "v54-phone"; btn.innerHTML = `📱<div id="v54-badge" class="hidden">0</div>`;
  btn.title = "Teams (P)";
  btn.onclick = () => { if (typeof S !== "undefined" && S && !S.inBattle) phonePanel(); };
  wrap.appendChild(btn);
  document.addEventListener("keydown", e => {
    if (e.key.toLowerCase() === "p" && typeof S !== "undefined" && S && !S.inBattle && !S.inDialog && !panelOpen && !eodOpen) phonePanel();
  });
})();
const PHONE_LINES = {
  printer: "The printer is eating jobs again", vpn: "VPN just spins forever", dns: "Is the internet down for everyone?",
  ad: "Locked out. AGAIN.", malware: "There's a pop-up that says I'm the 1,000,000th visitor",
  email: "Outlook stopped syncing this morning", bsod: "My screen went blue mid-email", plc: "Line 2 HMI is dark",
  wifi: "No bars in the corner office", cert: "Browser says the site is 'dangerous'?", disk: "It says my disk is FULL",
  update: "Update's been at 34% for an hour", share: "Cannot access the shared drive", vlan: "Plugged in, no network",
  backup: "Backup failed alert, again", slowpc: "Everything takes forever to open", shadow: "...do you see this process too?",
  av_hdmi: "Boardroom says NO SIGNAL and the VP is HERE", av_teams: "The Teams Room won't join the all-hands",
  plant_scanner: "Scanner won't scan, pallets stacking up", label_printer: "Label printer is dead, shipping is blocked",
  hw_replace: "My laptop makes a noise like a small helicopter",
};
function phoneState() { const s = S; s.meta.phone = s.meta.phone || { seen: {}, unread: 0 }; return s.meta.phone; }
function phoneNotify(t) {
  const s = S, ph = phoneState();
  ph.unread++;
  const badge = document.getElementById("v54-badge");
  if (badge) { badge.textContent = ph.unread; badge.classList.remove("hidden"); }
  // stacked chat toast, newest on top
  const wrap = document.getElementById("game-wrap");
  if (!wrap) return;
  const chats = wrap.querySelectorAll(".v54-chat");
  if (chats.length >= 3) chats[0].remove();
  const c = document.createElement("div");
  c.className = "v54-chat";
  c.style.top = (108 + wrap.querySelectorAll(".v54-chat").length * 62) + "px";
  const hh = String(Math.floor(s.clock / 60)).padStart(2, "0"), mm = String(s.clock % 60).padStart(2, "0");
  c.innerHTML = `<b>${t.name} (${t.dept})</b> · ${hh}:${mm}<br>"${PHONE_LINES[t.type.id] || "Something is broken."}"<small>${t.type.icon} ${t.type.label} — tap to open Teams</small>`;
  c.onclick = () => { c.remove(); phonePanel(); };
  wrap.appendChild(c);
  setTimeout(() => { if (c.parentNode) { c.style.opacity = "0"; c.style.transition = "opacity .5s"; setTimeout(() => c.remove(), 500); } }, 6000);
}
// watch for newly spawned tickets
const __origStepV54 = step;
let __v54Watch = 0;
step = function (dt) {
  __origStepV54(dt);
  const s = S; if (!s || !s.tickets || s.nightMode) return;
  __v54Watch += dt;
  if (__v54Watch < 1500) return;
  __v54Watch = 0;
  const ph = phoneState();
  for (const t of s.tickets) {
    if (!t.type || t.done || ph.seen[t.id]) continue;
    ph.seen[t.id] = true;
    phoneNotify(t);
  }
};

function phonePanel() {
  const s = S, ph = phoneState();
  ph.unread = 0;
  const badge = document.getElementById("v54-badge");
  if (badge) badge.classList.add("hidden");
  const open = s.tickets.filter(t => !t.done && t.type && !t.ambient);
  if (!open.length) return dlg("📱 TEAMS", "Zero unread. The queue is silent.<br><small>This never happens. Enjoy it.</small>", [{ t: "Close", f: closeDlg }]);
  const opts = open.slice(0, 6).map(t => ({
    t: `${t.vip ? "⭐ " : ""}${t.type.icon} ${t.name}: "${(PHONE_LINES[t.type.id] || t.type.label).slice(0, 34)}…"`,
    f: () => phoneTicketActions(t),
  }));
  opts.push({ t: "Close phone", f: closeDlg });
  dlg("📱 TEAMS — UNREAD", `${open.length} open ticket${open.length > 1 ? "s" : ""} buzzing.<br><small>Reply, remote in, delegate, or escalate — right from your pocket.</small>`, opts);
}
function phoneTicketActions(t) {
  const s = S, idx = (typeof rankIdx === "function") ? rankIdx() : 0;
  const canRemote = typeof REMOTE_OK !== "undefined" && REMOTE_OK[t.type.id];
  const opts = [];
  opts.push({ t: "🚶 \"On my way\" — mark the waypoint", f: () => {
    closeDlg();
    toast(`🚶 ${t.name} (${t.dept}) — head ${t.x < s.px ? "west" : "east"}, ${t.y < s.py ? "north" : "south"}. They waved back.`);
    s.flashBiome = BIOME_OF_DEPT[t.dept]; s.flashUntil = performance.now() + 2500;
  } });
  if (canRemote) opts.push({ t: "🛰️ Remote in from here", f: () => { closeDlg(); remoteFix(t); } });
  if (idx >= 2) {
    const freeCrew = COWORKERS.filter(c => !((s.meta.delegated || {})[c.id]));
    if (freeCrew.length && !t.critical && !t.delegatedTo) opts.push({ t: `🤝 Delegate to ${freeCrew[0].name}`, f: () => {
      s.meta.delegated = s.meta.delegated || {};
      s.meta.delegated[freeCrew[0].id] = t.id; t.delegatedTo = freeCrew[0].id;
      closeDlg();
      toast(`🤝 ${freeCrew[0].name}: "on it. probably." — closes by end of day.`);
      save();
    } });
  }
  if (!t.critical) opts.push({ t: "🚨 Escalate to CRITICAL", f: () => {
    t.critical = true;
    if (typeof INCIDENT_NAMES !== "undefined" && !t.codename) t.codename = pick(INCIDENT_NAMES);
    closeDlg();
    sevBanner("ESCALATED", (t.codename || t.type.label).toUpperCase());
    toast(`🚨 ${t.type.label} escalated ${t.codename ? "— «" + t.codename + "»" : ""}. Bigger reward, bigger risk.`);
    save();
  } });
  opts.push({ t: "Back", f: phonePanel });
  dlg(`📱 ${t.name} (${t.dept})`, `"${PHONE_LINES[t.type.id] || t.type.label}"<br><br><small>${t.type.icon} ${t.type.label}${t.diagnosed ? " · diagnosed" : ""}${t.vip ? " · ⭐ VIP" : ""}</small>`, opts);
}

// ---------- living helpdesk: the IT room levels up with your rank ----------
const DESK_TIERS = [
  { min: 0, name: "FOLDING TABLE ERA", cable: true,  mugs: 1, screens: 0, posters: ["IT'S DNS", "HAVE YOU TRIED REBOOTING"] },
  { min: 2, name: "ACTUAL FURNITURE",    cable: true,  mugs: 2, screens: 1, posters: ["TRUST THE PROCESS"] },
  { min: 4, name: "DASHBOARD WALL",      cable: false, mugs: 3, screens: 2, posters: ["ZERO DOWNTIME"] },
  { min: 6, name: "COMMAND CENTER",      cable: false, mugs: 4, screens: 3, posters: ["THE BUILDING REMEMBERS"] },
];
const __origDrawV54 = draw;
draw = function () {
  __origDrawV54.apply(this, arguments);
  const s = S;
  if (!s || s.nightMode || !s.map || typeof IT_ROOM === "undefined") return;
  const vis = (X, Y) => X > camX - 96 && X < camX + cv.width + 96 && Y > camY - 96 && Y < camY + cv.height + 96;
  if (!vis(IT_ROOM.x0 * TILE, IT_ROOM.y0 * TILE) && !vis(IT_ROOM.x1 * TILE, IT_ROOM.y1 * TILE)) return;
  const tm = performance.now();
  const ts = cv.height / 14, sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  ctx.textBaseline = "middle";
  const idx = (typeof rankIdx === "function") ? rankIdx() : 0;
  const tier = DESK_TIERS.filter(t => idx >= t.min).pop();
  // messy cable era: cable spaghetti on the floor
  if (tier.cable) {
    ctx.strokeStyle = "rgba(120,90,40,.8)"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const bx = (29 + i * 3) * TILE, by = 14.5 * TILE;
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + 20, by + 14 + Math.sin(tm / 900 + i) * 2, bx + 44, by - 8, bx + 64, by + 10);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  // extra monitors appear on the side desks as you climb
  for (let i = 0; i < tier.screens; i++) {
    const gx = (29 + i) * TILE, gy = 11 * TILE;
    const flick = .5 + .3 * Math.sin(tm / 400 + i * 2.1);
    ctx.fillStyle = "#0a0f1e"; ctx.fillRect(gx + 4, gy + 6, 24, 15);
    ctx.strokeStyle = "#3fd2ff"; ctx.strokeRect(gx + 4.5, gy + 6.5, 23, 14);
    ctx.fillStyle = `rgba(63,210,255,${flick})`;
    for (let b = 0; b < 4; b++) ctx.fillRect(gx + 8 + b * 5, gy + 17 - (3 + ((Math.floor(tm / 700) + b + i) % 8)), 3, 3 + ((Math.floor(tm / 700) + b + i) % 8));
  }
  // coffee mugs accumulate — a thriving dept runs on caffeine
  ctx.font = "10px serif"; ctx.textAlign = "center";
  for (let i = 0; i < tier.mugs; i++) ctx.fillText("☕", (30 + i * 3) * TILE + 26, 12 * TILE + 2);
  // motivational posters multiply
  ctx.font = "bold 7px monospace"; ctx.textAlign = "left";
  tier.posters.forEach((p, i) => {
    const px = 28.2 * TILE, py = (12 + i * 2) * TILE;
    ctx.fillStyle = "#101828"; ctx.fillRect(px, py, 22, 26);
    ctx.strokeStyle = "#ffd76a"; ctx.strokeRect(px + .5, py + .5, 21, 25);
    ctx.fillStyle = "#ffd76a";
    p.split(" ").forEach((w, wi) => ctx.fillText(w, px + 2, py + 7 + wi * 7));
  });
  // command center: golden trim + rank plaque
  if (tier.min >= 6) {
    ctx.strokeStyle = "rgba(255,215,106,.55)"; ctx.lineWidth = 2;
    ctx.strokeRect(IT_ROOM.x0 * TILE + 2, IT_ROOM.y0 * TILE + 2, (IT_ROOM.x1 - IT_ROOM.x0 + 1) * TILE - 4, (IT_ROOM.y1 - IT_ROOM.y0 + 1) * TILE - 4);
    ctx.lineWidth = 1;
    ctx.fillStyle = "#0d1226"; ctx.fillRect(38 * TILE, 10 * TILE + 2, 3.6 * TILE, 13);
    ctx.fillStyle = "#ffd76a"; ctx.font = "bold 8px monospace";
    ctx.fillText("★ " + rank().name.toUpperCase().slice(0, 16), 38 * TILE + 3, 10 * TILE + 11);
  }
  // tier label under the dept sign
  ctx.font = "7px monospace"; ctx.fillStyle = "#5a7fa8"; ctx.textAlign = "left";
  ctx.fillText(tier.name, 30 * TILE, 10 * TILE + 22);
  ctx.restore();
};

console.log("%c[TechOps Hero] v5.4 Connected loaded — phone/Teams interface, living helpdesk.", "color:#34d399");

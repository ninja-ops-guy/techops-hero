/* ============================================================
   TECHOPS HERO v6.2 — "Fair Fights & Clean Exits" (v62_hooks.js)
   Loads AFTER v61_hooks.js. Adds:
   • Portal battle rework — rebalanced to a real troubleshooting
     session: softer enemy scaling, lower starting uncertainty,
     damage mitigation, and a 4-phase session guide (GATHER →
     HYPOTHESIZE → RESOLVE → VERIFY) shown in the battle UI
   • South Exit marked clearly on the map (glow, sign, countdown)
   • Modern-clean title backdrop + dialog polish
   ============================================================ */
"use strict";

// ---------- 1. battle rebalance ----------
// stock scaling: hp = 22 + lv*10 (lv ≈ 1 + day/2), unc 70/90 — mid-game
// enemies outlast the player's 40 HP. Rescale to a fair session.
const __origStartBattleV62 = startBattle;
startBattle = function (portal) {
  __origStartBattleV62(portal);
  if (!B) return;
  B.hp = B.maxHp = Math.max(18, Math.round(B.maxHp * 0.6));
  B.uncertainty = B.boss ? 72 : 52;
  blog(`<span class="sys">📋 <b>Troubleshooting session opened.</b> Work the process: gather evidence → form a hypothesis → resolve → verify.</span>`);
  renderBattle();
};
// mitigation: corruption is dangerous, not lethal — refund 30% of HP lost
// during every enemy phase (covers signature moves & regular attacks)
const __origEnemyPhaseV62 = enemyPhase;
enemyPhase = function () {
  const hp0 = S.hp;
  __origEnemyPhaseV62();
  if (S && S.hp < hp0) {
    const refund = Math.round((hp0 - S.hp) * 0.3);
    S.hp = Math.min(S.maxHp, S.hp + refund);
  }
};
// evidence work is a little more productive
const __origWorkflowActionV62 = workflowAction;
workflowAction = function (a) {
  __origWorkflowActionV62(a);
  if (B && !B.over && (a.cat === "ask" || a.cat === "inspect")) {
    B.uncertainty = Math.max(0, B.uncertainty - 5);
  }
};

// ---------- 2. troubleshooting session guide (phase banner) ----------
function v62Phase() {
  if (!B) return null;
  if (B.verified || B.hp <= 0) return { n: 4, name: "VERIFY & CLOSE", hint: "confirm the fix holds with the user" };
  if (B.hyp) return { n: 3, name: "RESOLVE", hint: "execute the fix — hypothesis locked, damage +50%" };
  if (B.uncertainty > 50) return { n: 1, name: "GATHER EVIDENCE", hint: "ask & inspect until uncertainty ≤ 50%" };
  return { n: 2, name: "HYPOTHESIZE", hint: "name the root cause from the surviving branches" };
}
const __origRenderBattleV62 = renderBattle;
renderBattle = function () {
  __origRenderBattleV62.apply(this, arguments);
  if (!B) return;
  const scene = document.getElementById("battle-scene");
  if (!scene) return;
  let el = document.getElementById("v62-phase");
  if (!el) {
    el = document.createElement("div");
    el.id = "v62-phase";
    el.style.cssText = "font-size:11px;letter-spacing:1px;color:#9fb7d9;background:#0d1420cc;border:1px solid #2a4a6a;border-radius:8px;padding:5px 12px;text-align:center;max-width:92%";
    scene.insertBefore(el, scene.firstChild);
  }
  const p = v62Phase();
  const steps = ["GATHER", "HYPOTHESIZE", "RESOLVE", "VERIFY"];
  el.innerHTML = steps.map((s2, i) =>
    `<span style="color:${i + 1 === p.n ? "#ffd24a" : i + 1 < p.n ? "#4ade80" : "#4a5a6a"}">${i + 1 < p.n ? "✓" : i + 1 === p.n ? "▶" : "·"} ${s2}</span>`
  ).join(' <span style="color:#2a4a6a">→</span> ') +
  `<br><small style="color:#7fa0c0">${p.hint}</small>`;
};

// ---------- 3. south exit: clearly marked on the map ----------
const __origDrawV62 = draw;
draw = function () {
  __origDrawV62.apply(this, arguments);
  const s = S, o = s && s._nightObjs;
  if (!o || !s.map || s.nightMode) return;
  const tm = performance.now();
  const ts = cv.height / 14, sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  const X = o.door.x * TILE + 16, Y = o.door.y * TILE + 14;
  const open = s.clock >= 16 * 60;
  const pulse = .5 + .5 * Math.sin(tm / 350);
  // glowing ring
  ctx.strokeStyle = open ? `rgba(74,222,128,${.5 + .4 * pulse})` : `rgba(255,210,74,${.35 + .3 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(X, Y, 17 + 2 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  // sign
  ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = open ? "🚪 SOUTH EXIT — OPEN" : "🚪 SOUTH EXIT · 16:00";
  const lw = ctx.measureText(label).width + 10;
  ctx.fillStyle = "#0d1420dd";
  ctx.fillRect(X - lw / 2, Y - 26, lw, 13);
  ctx.strokeStyle = open ? "#4ade80" : "#ffd24a";
  ctx.strokeRect(X - lw / 2, Y - 26, lw, 13);
  ctx.fillStyle = open ? "#4ade80" : "#ffd24a";
  ctx.fillText(label, X, Y - 19);
  // chevron trail pointing at the door
  ctx.font = "10px serif";
  ctx.globalAlpha = .35 + .35 * pulse;
  for (let i = 1; i <= 3; i++) ctx.fillText("▼", X, Y - 34 - i * 9);
  ctx.globalAlpha = 1;
  ctx.restore();
};

console.log("%c[TechOps Hero] v6.2 Fair Fights & Clean Exits loaded — battle rework, session guide, exit marker.", "color:#f472b6");

// ---------- 4. modern-clean title backdrop ----------
(function () {
  if (typeof TO_SKYLINE !== "string") return;
  const ts = document.getElementById("title-screen");
  if (!ts || document.getElementById("v62-skyline")) return;
  const img = document.createElement("img");
  img.id = "v62-skyline";
  img.src = TO_SKYLINE;
  img.alt = "";
  img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.42;image-rendering:pixelated;pointer-events:none";
  ts.prepend(img);
})();

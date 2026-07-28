// v7.2 "Feel the Fight": the battle arena gets real generated sprites — a six-monster
// glitch atlas for tickets and a dedicated APT operative for the secret boss (new art,
// no Felicia reuse, no emoji stand-ins) — plus hit-stop freeze on critical hits and
// pixel-art emote icons that give ambient NPCs idle variety in the world.
(function () {
  const V72_VER = "7.2.0";

  // ---------- assets ----------
  const glitchImg = new Image(); if (typeof TO_GLITCH !== "undefined") glitchImg.src = TO_GLITCH;
  const aptImg = new Image(); if (typeof TO_APT !== "undefined") aptImg.src = TO_APT;
  const emoteImg = new Image(); if (typeof TO_EMOTE !== "undefined") emoteImg.src = TO_EMOTE;
  const GCELL = 112, ACW = 128, ACH = 160, ECELL = 48;

  // ---------- glitch pick: ticket type -> monster ----------
  function glitchIdx(B) {
    const id = (B && B.t && B.t.id) || "", stat = (B && B.t && B.t.stat) || "";
    if (/malware|ransom|phish|virus|security|cert/.test(id)) return 3;   // red static wraith
    if (/printer|paper|toner|jam|label/.test(id)) return 4;               // paper imp
    if (/net|vpn|wifi|switch|vlan|dhcp|dns/.test(id) || stat === "networking") return 1; // cable serpent
    if (/server|database|system|pki|ntp|exchange|raid|san/.test(id)) return 5; // circuit beast
    if (stat === "hardware" || /bsod|laptop|hw|battery|eol|scanner/.test(id)) return 2; // broken robot
    return 0;                                                             // glitch blob
  }

  // ---------- arena sprite renderer ----------
  function renderArenaSprite() {
    const host = $("enemy-sprite");
    if (!host || typeof B === "undefined" || !B) return;
    const isApt = !!B.felicia;
    const img = isApt ? aptImg : glitchImg;
    if (!img.complete || !img.naturalWidth) return; // keep emoji fallback until loaded
    host.textContent = "";
    host.style.filter = "";
    let cv72 = host.querySelector("canvas");
    if (!cv72) { cv72 = document.createElement("canvas"); host.appendChild(cv72); }
    const boss = isApt || B.boss;
    const H = boss ? 120 : 96, W = isApt ? Math.round(H * ACW / ACH) : H;
    cv72.width = W; cv72.height = H;
    cv72.style.imageRendering = "pixelated";
    const c2 = cv72.getContext("2d");
    c2.clearRect(0, 0, W, H);
    if (isApt) c2.drawImage(img, 0, 0, ACW, ACH, 0, 0, W, H);
    else {
      const gi = glitchIdx(B);
      c2.drawImage(img, (gi % 3) * GCELL, Math.floor(gi / 3) * GCELL, GCELL, GCELL, 0, 0, W, H);
    }
    host.classList.add("v72-arena");
  }
  const __origStartBattle72 = startBattle;
  startBattle = function () {
    const r = __origStartBattle72.apply(this, arguments);
    setTimeout(renderArenaSprite, 0);
    // assets can arrive after the first battle of a session — retry once
    setTimeout(renderArenaSprite, 1200);
    return r;
  };

  // ---------- hit-stop on criticals ----------
  const st72 = document.createElement("style");
  st72.id = "v72-style";
  st72.textContent = `
@keyframes v72-stop{0%{transform:scale(1.045);filter:brightness(1.7)}55%{transform:scale(1.045);filter:brightness(1.7)}100%{transform:none;filter:none}}
@keyframes v72-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
body.v71-anims #battle-scene.v72-stop{animation:v72-stop .16s ease-out}
body.v71-anims #enemy-sprite.v72-arena{animation:v72-bob 2.4s ease-in-out infinite}
#enemy-sprite.v72-arena canvas{display:block;margin:0 auto}`;
  document.head.appendChild(st72);
  const __origBlog72 = blog;
  blog = function (h) {
    __origBlog72(h);
    try {
      if (h.includes("CRITICAL HIT")) {
        const sc = $("battle-scene");
        if (sc) { sc.classList.remove("v72-stop"); void sc.offsetWidth; sc.classList.add("v72-stop"); setTimeout(() => sc.classList.remove("v72-stop"), 200); }
      }
    } catch (e) { }
  };

  // ---------- NPC idle variety: pixel emote icons in world space ----------
  // each ambient/settled NPC shows a small emote on a deterministic schedule
  const EMOTES = [3, 2, 5, 4, 1]; // coffee, zzz, gear, question, sweat
  function emoteFor(n, tm) {
    let h = 0; for (let i = 0; i < n.name.length; i++) h = (h * 31 + n.name.charCodeAt(i)) >>> 0;
    const period = 9000 + (h % 7000);
    const phase = (tm + h * 97) % period;
    if (phase > 1800) return -1;
    return EMOTES[h % EMOTES.length];
  }
  const __origDraw72 = draw;
  draw = function () {
    const r = __origDraw72.apply(this, arguments);
    const s = S;
    if (!s || !s.map || s.room || s.nightMode) return r;
    if (!emoteImg.complete || !emoteImg.naturalWidth) return r;
    if (window.V67SET && V67SET.anims === false) return r;
    const tm = performance.now();
    const ts = cv.height / 14, sc = ts / TILE;
    ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
    s.npcs.forEach(n => {
      if (!n.done && !n.ambient) return; // open tickets already have their own bubbles
      const ei = emoteFor(n, tm);
      if (ei < 0) return;
      const bob = Math.sin(tm / 300) * 2;
      const x = n.x * TILE + TILE / 2 + 6, y = n.y * TILE - 8 + bob;
      ctx.drawImage(emoteImg, (ei % 3) * ECELL, Math.floor(ei / 3) * ECELL, ECELL, ECELL, x, y, 18, 18);
    });
    ctx.restore();
    return r;
  };

  // ---------- boss-cine "undefined" fix (critical tickets carry codenames, not names) ----------
  function bossName72() {
    if (typeof B === "undefined" || !B || !B.t) return "CRITICAL INCIDENT";
    if (B.t.codename) return B.t.codename;
    if (B.t.name) return B.t.name;
    if (B.t.id) return B.t.id.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return "CRITICAL INCIDENT";
  }
  new MutationObserver(() => {
    const t = document.querySelector("#v67-cine .v67-card-t");
    if (t && t.textContent.includes("undefined")) t.textContent = t.textContent.replace("undefined", bossName72());
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  const __origSBData72 = startBattle;
  startBattle = function () {
    const r = __origSBData72.apply(this, arguments);
    try { if (typeof B !== "undefined" && B && B.t && !B.t.name) B.t.name = bossName72(); } catch (e) { }
    return r;
  };

  window.v72 = { renderArenaSprite, glitchIdx, emoteFor, EMOTES };
  console.log(`[v7.2] Feel the Fight loaded (${V72_VER})`);
})();

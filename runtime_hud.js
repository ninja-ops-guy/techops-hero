/* Passive screen-space HUD presentation. The existing render owners call this
 * module; it has no simulation, input, story state or scheduling authority. */
(function (root) {
  'use strict';
  if (root.TechOpsRuntimeHud) return;
  const BODY = 13, HEADING = 14, LINE = 18;
  const finite = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, Number(value) || 0));

  function viewport(canvas) {
    canvas = canvas || {};
    let rect;
    try { rect = canvas.getBoundingClientRect && canvas.getBoundingClientRect(); } catch (_) {}
    const css = (axis, client) => {
      if (rect && finite(rect[axis])) return Number(rect[axis]);
      if (finite(canvas[client])) return Number(canvas[client]);
      const style = canvas.style && canvas.style[axis];
      // Percentages and calc() need layout; only an explicit px value is safe.
      if (typeof style === 'string' && /^\d+(?:\.\d+)?px$/.test(style) && finite(parseFloat(style))) return parseFloat(style);
      return finite(canvas[axis]) ? Number(canvas[axis]) : 1;
    };
    const width = css('width', 'clientWidth'), height = css('height', 'clientHeight');
    return { width, height, scaleX:finite(canvas.width) ? canvas.width / width : 1, scaleY:finite(canvas.height) ? canvas.height / height : 1 };
  }
  function game() { try { return typeof S !== 'undefined' ? S : root.S; } catch (_) { return root.S; } }
  function handles(n) {
    const s = game();
    return !!(n && !n._v736 && !n._sector04 && n.district !== 'waldo' && s && s.nightMode && (s.nightMode === n || s.nightMode === true));
  }
  function blocked() {
    const s = game(), director = root.TechOpsPresentationDirector;
    return !!(root.document && root.document.hidden || s && (s.inDialog || s.inBattle || s.paused || s.gameOver) || director && typeof director.isBlocking === 'function' && director.isBlocking() || root.TechOpsNightRuntime && typeof root.TechOpsNightRuntime.blocked === 'function' && root.TechOpsNightRuntime.blocked());
  }
  function wrap(ctx, text, width) {
    const lines = [];
    let line = '';
    for (const word of String(text || '').trim().split(/\s+/).filter(Boolean)) {
      if (ctx.measureText(line ? line + ' ' + word : word).width <= width) { line += (line ? ' ' : '') + word; continue; }
      if (line) { lines.push(line); line = ''; }
      // Long tokens must not cross the card, including unspaced identifiers.
      for (const letter of Array.from(word)) {
        if (line && ctx.measureText(line + letter).width > width) { lines.push(line); line = ''; }
        line += letter;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function panel(ctx, x, y, width, height) {
    ctx.fillStyle = '#06111ded'; ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#819fb94d'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, width - 1, height - 1);
  }
  function text(ctx, value, x, y, color, weight) {
    ctx.fillStyle = color || '#d8e7f5'; ctx.font = (weight ? 'bold ' : '') + (weight ? HEADING : BODY) + 'px monospace';
    ctx.fillText(String(value), x, y);
  }
  function layout(view) {
    const pad = view.width < 400 ? 6 : 8, gap = 6;
    const width = Math.max(1, view.width - pad * 2), left = Math.min(220, width * .4);
    return { pad, gap, width, left, right:width - left - gap, top:6 };
  }
  function combatModel(n) {
    const c = n._nightCombat;
    if (!c) return null;
    const dashReady = c.dash && !c.dash.spent && c.time <= c.dash.until;
    if (!c.grab && !c.attack && !c.hits && !dashReady && c.stunUntil <= c.time) return null;
    return { hint:c.grab ? '← / → THROW · ↑ LAUNCH · ↓ SLAM' : c.stunUntil > c.time ? 'RECOVER' : dashReady ? 'DASH → ATTACK TO GRAB' : c.attack && c.attack.kind && c.attack.kind.startsWith('air') ? 'AIR COMBO · THREE HITS MAX' : '↑ / ↓ AIM · JUMP TO FOLLOW', age:c.time - c.lastInput, lastHit:c.lastHit };
  }
  function drawNight(ctx, n, options) {
    if (!handles(n)) return false;
    if (blocked() || n.drive) { root.__techOpsNightHudEvidence = { mode:'night', blocked:true, panels:[], text:[] }; return true; } // Suppress fallback HUDs under a modal.
    options = options || {};
    const view = viewport(ctx.canvas), l = layout(view), d = options.district || {}, now = Number(options.now) || 0;
    const guide = root.TechOpsGameplayExperience;
    const status = guide && guide.streetStatus(n) || (n.clear ? 'STREET SECURED' : 'HOSTILES ' + (n.enemies || []).filter(e => e.alive).length);
    const combat = combatModel(n), audio = root.TechOpsCombatAudio;
    const caption = audio && typeof audio.caption === 'function' ? audio.caption(n) : '';
    const receipt = { mode:'night', viewport:view, bodyFont:BODY, headingFont:HEADING, panels:[], text:[], blocked:false };
    ctx.save();
    try {
      ctx.scale(view.scaleX, view.scaleY); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
      const leftX = l.pad, rightX = leftX + l.left + l.gap;
      ctx.font = 'bold ' + HEADING + 'px monospace';
      const districtLines = wrap(ctx, d.name || n.district, l.right - 16);
      ctx.font = BODY + 'px monospace';
      const danger = d.danger > 1.4 ? 'HIGH' : d.danger > .8 ? 'MID' : 'LOW';
      const detailLines = wrap(ctx, 'ST ' + n.street + '/' + d.streets + ' · ' + (options.clock || '') + ' · THREAT ' + danger, l.right - 16);
      const statusText = String(status).replace('REINFORCEMENTS INBOUND', 'INBOUND').replace('STREET SECURED · CONTINUE OR RETURN TO CHARGER', 'STREET SECURED').replace('CHECK THE STREET', 'CHECK STREET');
      const statusLines = wrap(ctx, statusText, l.right - 16);
      const comboText = n.combo > 1 ? '×' + n.combo + (n.perfectT > now ? ' PERFECT' : '') : '';
      const cashText = '$' + Math.max(0, Math.round(Number(n.cash) || 0));
      const separateCombo = comboText && ctx.measureText(cashText + '  ' + comboText).width > l.left - 16;
      const cardHeight = Math.max(separateCombo ? 94 : 76, 16 + (districtLines.length + detailLines.length + statusLines.length) * LINE);
      panel(ctx, leftX, l.top, l.left, cardHeight); panel(ctx, rightX, l.top, l.right, cardHeight);
      receipt.panels.push({ role:'health', x:leftX, y:l.top, width:l.left, height:cardHeight }, { role:'district', x:rightX, y:l.top, width:l.right, height:cardHeight });
      const hp = Math.round(clamp(n.hp, 0, 100)), hpWidth = Math.max(12, l.left - 82);
      text(ctx, 'HP ' + hp, leftX + 8, l.top + 19, hp > 35 ? '#b0f0b6' : '#ff91a3', true);
      ctx.fillStyle = '#304053'; ctx.fillRect(leftX + 73, l.top + 9, hpWidth, 10);
      ctx.fillStyle = hp > 35 ? '#7ee787' : '#ff6b81'; ctx.fillRect(leftX + 73, l.top + 9, hpWidth * hp / 100, 10);
      text(ctx, 'FOCUS', leftX + 8, l.top + 40);
      const pipWidth = Math.max(3, Math.min(11, (l.left - 76) / 6 - 3));
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i < Math.min(Number(n.combo) || 0, 6) ? (n.perfectT > now ? '#ffd24a' : '#7ec8ff') : '#304053'; ctx.fillRect(leftX + 64 + i * (pipWidth + 3), l.top + 30, pipWidth, 9); }
      text(ctx, cashText, leftX + 8, l.top + 63, '#98e7ab');
      if (comboText) { ctx.textAlign = 'right'; text(ctx, comboText, leftX + l.left - 8, l.top + (separateCombo ? 81 : 63), n.perfectT > now ? '#ffd24a' : '#d8e7f5'); ctx.textAlign = 'left'; }
      // A short header keeps clock, threat and location on distinct baselines.
      let cardY = l.top + 19;
      districtLines.forEach(line => { text(ctx, line, rightX + 8, cardY, d.accent || '#9bd4ff', true); cardY += LINE; });
      detailLines.concat(statusLines).forEach(line => { text(ctx, line, rightX + 8, cardY); cardY += LINE; });
      let y = l.top + cardHeight + l.gap;
      const drawCopy = (role, copy, color, rhythm) => {
        ctx.font = BODY + 'px monospace'; const lines = wrap(ctx, copy, l.width - 20);
        if (!lines.length) return;
        const height = 10 + lines.length * LINE + (rhythm ? 13 : 0);
        panel(ctx, l.pad, y, l.width, height);
        ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = BODY + 'px monospace';
        lines.forEach((line, index) => ctx.fillText(line, view.width / 2, y + 18 + index * LINE));
        receipt.panels.push({ role, x:l.pad, y, width:l.width, height }); receipt.text.push({ role, lines });
        if (rhythm) {
          const rules = root.TechOpsNightCombat && root.TechOpsNightCombat.RULES || { beatMin:260, beatMax:500 }, barX = l.pad + 12, barY = y + height - 11, barW = l.width - 24;
          ctx.fillStyle = '#304053'; ctx.fillRect(barX, barY, barW, 5); ctx.fillStyle = '#b18b39'; ctx.fillRect(barX + barW * rules.beatMin / 700, barY, barW * (rules.beatMax - rules.beatMin) / 700, 5);
          if (combat.lastHit >= 0 && combat.age >= 0 && combat.age < 700) { ctx.fillStyle = combat.age >= rules.beatMin && combat.age <= rules.beatMax ? '#ffe39a' : '#8dc6fa'; ctx.fillRect(barX + barW * combat.age / 700 - 2, barY - 2, 4, 9); }
        }
        y += height + l.gap; ctx.textAlign = 'left';
      };
      // Share the combat card so sound captions never push the transient message
      // onto the actor on a short landscape viewport.
      if (combat) drawCopy('combat', combat.hint + (caption ? '  ' + caption : ''), '#d8e7f5', true);
      else if (caption) drawCopy('caption', caption, '#fff2cd', false);
      if (n.msgT > now && n.msg) drawCopy('message', n.msg, '#ffd24a', false);
      receipt.bottom = y - l.gap;
      root.__techOpsNightHudEvidence = receipt;
      return true;
    } finally { ctx.restore(); }
  }
  function drawDrive(ctx, n, title) {
    if (!handles(n)) return false;
    if (blocked()) return true;
    const view = viewport(ctx.canvas);
    ctx.save();
    try { ctx.scale(view.scaleX, view.scaleY); ctx.textAlign = 'center'; text(ctx, 'DRIVING — ' + title, view.width / 2, 40, '#d8e7f5', true); }
    finally { ctx.restore(); }
    return true;
  }
  root.TechOpsRuntimeHud = { VERSION:1, viewport, handles, wrap, layout, combatModel, drawNight, drawDrive };
})(typeof globalThis !== 'undefined' ? globalThis : this);

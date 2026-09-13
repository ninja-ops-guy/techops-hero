// Browser-driver policy only. Observe the real M1 interaction predicate from
// v736_hooks.js; never write positions, puzzle flags, or mission/save state.
export function localHiddenBayExitSnapshot(readyOnly = false) {
  const n = window.NM, c = n?._v736, s = window.S;
  const coop = window.TechOpsGoodDogsCoop;
  const row = window.TechOpsLevelRegistry?.goodDogsMission(1);
  const target = Number(row?.target) || 1460;
  const characters = c?.chars;
  const pairLive = ['katrin', 'manchez'].every(id => {
    const ch = characters?.[id];
    return !!ch && ch.hp > 0 && !ch.downed && !ch.out;
  });
  const evidence = {
    mission: c?.m ?? null, metaMission: s?.meta?._v736?.m ?? null,
    mode: coop?.mode() ?? null, x: n?.x ?? null,
    partnerX: c?.partner?.x ?? null, target, exitX: target - 35,
    regroupTolerance: 180,
    distance: n && c?.partner ? Math.abs(c.partner.x - n.x) : null,
    trailComplete: !!n?._gbWaldoTrailComplete,
    puzzleComplete: !!coop?.complete(1), pairLive,
    blocked: !coop || !!coop.blocked() || !!s?.inDialog || !!c?.ending || !!c?.resolving,
    vx: n?.vx ?? null, partnerVx: c?.partner?.vx ?? null
  };
  evidence.ready = !!(s?.nightMode && evidence.mission === 1 && evidence.metaMission === 1 &&
    evidence.mode === 'local' && !evidence.blocked && pairLive &&
    evidence.puzzleComplete && evidence.trailComplete &&
    Number.isFinite(evidence.x) && Number.isFinite(evidence.partnerX) &&
    evidence.x >= evidence.exitX && evidence.distance < evidence.regroupTolerance);
  // Settling is a driver guard, not a new gameplay requirement. A sampled
  // crossing of the threshold must not authorize USE while still drifting back.
  evidence.settled = Number.isFinite(evidence.vx) && Number.isFinite(evidence.partnerVx) &&
    Math.abs(evidence.vx) < .1 && Math.abs(evidence.partnerVx) < .1;
  return readyOnly ? (evidence.ready && evidence.settled ? evidence : false) : evidence;
}

// moveDogTo is the existing trusted-keyboard route driver, passed explicitly
// so scheduling/negative cases can be tested without launching a browser.
export async function enterLocalHiddenBay(page, moveDogTo) {
  let before = null;
  try {
    const initial = await page.evaluate(localHiddenBayExitSnapshot);
    // Regroup P2 first. Leave P1 safely inside the exit, not at the old
    // driver's 15 px tolerance boundary (1440 - 15 == 1425).
    await moveDogTo(page, initial.target - 50, {player: 2, tolerance: 5});
    await moveDogTo(page, initial.target - 20, {player: 1, tolerance: 5});
    const ready = await page.waitForFunction(localHiddenBayExitSnapshot, true, {timeout: 5000});
    try { before = await ready.jsonValue(); } finally { await ready.dispose(); }
    // Exactly one real interaction. Do not retry USE or synthesize progression.
    await page.keyboard.press('KeyE');
    const advanced = await page.waitForFunction(() => window.S?.meta?._v736?.m === 2, null, {timeout: 5000});
    await advanced.dispose();
    return {before, after: await page.evaluate(localHiddenBayExitSnapshot)};
  } catch (cause) {
    const observed = await page.evaluate(localHiddenBayExitSnapshot).catch(() => null);
    const error = new Error('Local co-op M1 -> M2 exit failed: ' + JSON.stringify({before, observed}), {cause});
    error.exitEvidence = {before, observed};
    throw error;
  }
}

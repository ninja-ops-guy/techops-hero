/** Read-only browser observation. Keep self-contained for page.evaluate().
 * A terminal film result is not a completed native mission handoff.
 */
export function readGoodDogsHandoff({mission, cutsceneId}) {
  const root = globalThis;
  const s = typeof S !== 'undefined' ? S : root.S;
  const n = typeof NM !== 'undefined' ? NM : root.NM;
  const c = n?._v736;
  const a = root.TechOpsGoodBoysProgressionAuthority;
  const b = root.TechOpsGoodDogsCutsceneBridge;
  const director = root.TechOpsPresentationDirector;
  const state = root.TechOpsGoodBoysCampaignState;
  const reasons = [];
  const result = {mission, cutsceneId, ready: false, reasons};
  // Do not call acceptance APIs on absent state: some legacy getters initialize it.
  if (!s?.meta?._v736 || !c) {
    reasons.push('runtime-unavailable');
    return result;
  }
  if (!a?.acceptance || !b?.acceptance || !director?.current || !state?.mission || !root.v725?.active) {
    reasons.push('authority-unavailable');
    return result;
  }
  const progress = a.acceptance();
  const bridge = b.acceptance();
  const presentation = director.current('gooddogs');
  const nativeCinematic = !!root.v725.active();
  const visibleDialogs = [];
  for (const id of ['v725-cine', 'dialogue', 'gb-prison-cine', 'good-boys-story-cine',
    'good-boys-campaign-intro', 'good-boys-earthfall-cine', 'good-boys-mobile-recovery',
    'good-boys-ship-interlude', 'good-boys-ship-flight', 'good-boys-crash-canonical',
    'good-dogs-cutscene-overlay']) {
    const el = root.document?.getElementById(id);
    if (!el || el.classList.contains('hidden')) continue;
    if (id === 'good-dogs-cutscene-overlay' && !el.classList.contains('active')) continue;
    const style = root.getComputedStyle(el);
    // A fading but still mounted modal retains ownership, even at opacity zero.
    if (style.display !== 'none' && style.visibility !== 'hidden') visibleDialogs.push(id);
  }
  Object.assign(result, {
    runtimeMission: Number(c.m), metaMission: Number(s.meta._v736.m),
    stateMission: Number(state.mission()), activeWorld: s.nightMode === n,
    ending: !!c.ending, active: progress.active, transition: progress.transition,
    handoff: progress.handoff, handoffComplete: progress.handoffComplete,
    runtimePending: progress.runtimePending, handoffError: progress.handoffError,
    inDialog: !!s.inDialog, cinematicVisible: progress.cinematicVisible,
    nativeCinematic, visibleDialogs, presentation,
    bridgeRunning: !!b.running || !!bridge.running,
    preRenderedActive: !!root.__goodDogsPreRenderedCutsceneActive,
    bridgeVisibleBlocker: bridge.visibleBlocker,
    bridgeError: bridge.error, seen: bridge.seen?.[cutsceneId] === true,
    exit: root.__goodDogsCutsceneExit || null
  });
  if (!result.activeWorld || result.ending || progress.active !== true) reasons.push('runtime-not-playable');
  if ([result.runtimeMission, result.metaMission, result.stateMission, progress.mission].some(m => m !== mission)) reasons.push('mission-diverged');
  if (progress.handoff || progress.runtimePending || progress.transition !== false || progress.handoffComplete?.mission !== mission) reasons.push('handoff-pending');
  if (progress.handoffError || bridge.error) reasons.push('authority-error');
  if (nativeCinematic || presentation.blocking || visibleDialogs.length || progress.cinematicVisible) reasons.push('presentation-owned');
  if (result.bridgeRunning || result.preRenderedActive || bridge.visibleBlocker) reasons.push('film-owned');
  if (!result.seen || result.exit?.id !== cutsceneId || !['COMPLETED', 'USER_SKIPPED'].includes(result.exit?.status)) reasons.push('film-not-settled');
  if (s.inDialog) reasons.push('dialog-blocked');
  result.ready = reasons.length === 0;
  return result;
}

/** Observe only. Never skip a native scene, tick an authority or clear a dialog.
 * The deadline includes naturally completing native cinematics (M4 is ~11 s).
 */
export async function waitForGoodDogsHandoff(page, request, {timeout = 15000, pollInterval = 50} = {}) {
  if (!Number.isInteger(request?.mission) || request.mission < 3 || request.mission > 7 ||
      !/^GD_CUT_0[4-8]$/.test(request.cutsceneId) ||
      !Number.isFinite(timeout) || timeout <= 0 || !Number.isFinite(pollInterval) || pollInterval <= 0) {
    throw new TypeError('Invalid Good Dogs handoff request or deadline');
  }
  const started = performance.now();
  const observations = [];
  let last = null, previous = '';
  while (performance.now() - started < timeout) {
    last = await page.evaluate(readGoodDogsHandoff, request);
    const signature = JSON.stringify(last.reasons);
    if (signature !== previous && observations.length < 20) {
      observations.push({elapsedMs: Math.round(performance.now() - started), state: last});
      previous = signature;
    }
    if (last.ready && performance.now() - started < timeout) {
      return {elapsedMs: Math.round(performance.now() - started), observations, state: last};
    }
    const remaining = timeout - (performance.now() - started);
    if (remaining > 0) await page.waitForTimeout(Math.min(pollInterval, remaining));
  }
  const error = new Error(`Good Dogs handoff did not settle after ${request.cutsceneId}: ${JSON.stringify(last)}`);
  error.code = 'GOOD_DOGS_HANDOFF_TIMEOUT';
  error.cutsceneId = request.cutsceneId;
  error.handoff = {elapsedMs: Math.round(performance.now() - started), observations, state: last};
  throw error;
}

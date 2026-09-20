import assert from 'node:assert/strict';

// Chromium can report a CSS 44px edge as 43.999969482421875 after transforming
// layout coordinates. Allow only 0.0001 CSS pixel of measurement roundoff;
// the required target remains 44px, and genuine deficits such as 43.99 fail.
const TOUCH_TARGET_PX = 44, RECT_ROUNDOFF_PX = 0.0001;
export function assertTouchTarget(box, label = 'touch target') {
  assert.ok(box && Number.isFinite(box.width) && Number.isFinite(box.height), `${label} must have finite numeric width and height`);
  assert.ok(box.width + RECT_ROUNDOFF_PX >= TOUCH_TARGET_PX && box.height + RECT_ROUNDOFF_PX >= TOUCH_TARGET_PX,
    `${label} retains a 44px touch target (${box.width} × ${box.height}; measurement tolerance ${RECT_ROUNDOFF_PX}px)`);
}

// Read the live production projection and rendered controls. No state injection,
// input replacement, camera mutation, or unprojected canvas-coordinate checks.
export async function assertLandscapeControlBounds(page) {
  const snapshot = await page.evaluate(() => {
    const canvas = document.getElementById('game'), world = window.NM;
    if (!canvas || !world || innerWidth <= innerHeight || innerHeight > 500) return null;
    const bounds = canvas.getBoundingClientRect();
    const scale = bounds.height / canvas.height;
    const controls = [...document.querySelectorAll('#dpad .dbtn, #touch-buttons .tbtn, #v55-nmbtns .v55-nbtn, #good-dogs-touch button')]
      .map(el => {
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return { id: el.id || el.className, width: rect.width, height: rect.height, top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom,
          computed: { width: style.width, minWidth: style.minWidth, flexBasis: style.flexBasis, flexShrink: style.flexShrink, boxSizing: style.boxSizing, padding: style.padding, transform: style.transform },
          reachable: !!hit && (hit === el || el.contains(hit)), hit: hit && (hit.id || hit.className || hit.tagName),
          visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0' };
      }).filter(control => control.visible);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      presentation: {
        bodyClass: document.body.className,
        inputCapabilities: {
          pointerCoarse: matchMedia('(pointer:coarse)').matches,
          pointerFine: matchMedia('(pointer:fine)').matches,
          pointerNone: matchMedia('(pointer:none)').matches,
          hover: matchMedia('(hover:hover)').matches,
          anyPointerCoarse: matchMedia('(any-pointer:coarse)').matches,
          maxTouchPoints: navigator.maxTouchPoints
        },
        inputOwner: document.getElementById('v55-nmbtns')?.getAttribute('data-night-combat-input'),
        expanded: document.getElementById('night-input-assists')?.getAttribute('aria-expanded'),
        narrowLandscape: matchMedia('(orientation:landscape) and (max-height:500px) and (min-width:560px) and (max-width:640px)').matches,
        controls: ['touch-ui', 'dpad', 'v55-nmbtns', 'touch-buttons'].map(id => {
          const element = document.getElementById(id), style = element && getComputedStyle(element);
          return style && { id, className: element.className, inlineStyle: element.getAttribute('style'), parent: element.parentElement?.id || element.parentElement?.tagName,
            bounds: element.getBoundingClientRect().toJSON(), width: style.width, gap: style.gap, right: style.right, display: style.display, visibility: style.visibility, pointerEvents: style.pointerEvents, direction: style.flexDirection, columns: style.gridTemplateColumns };
        })
      },
      mode: world._v736 ? 'gooddogs' : 'night',
      projectedFoot: bounds.top + (Number(world.y) + Number(world.h)) * scale,
      canvas: { width: canvas.width, height: canvas.height, scale }, controls
    };
  });
  if (!snapshot) return { applicable: false };
  try {
    assert.ok(snapshot.controls.length >= 4, 'landscape gameplay exposes movement controls');
    assert.ok(Number.isFinite(snapshot.projectedFoot), 'actor must have a finite projected foot position');
    for (const control of snapshot.controls) {
      assertTouchTarget(control, control.id);
      assert.ok(control.left >= 0 && control.right <= snapshot.viewport.width + 1 && control.bottom <= snapshot.viewport.height + 1, `${control.id} stays inside the viewport`);
      assert.ok(control.top >= snapshot.projectedFoot + 4, `${control.id} must stay below the grounded actor (${control.top} vs ${snapshot.projectedFoot})`);
      assert.ok(control.reachable, `${control.id} center is intercepted by ${control.hit}`);
    }
    for (let a = 0; a < snapshot.controls.length; a++) {
      for (let b = a + 1; b < snapshot.controls.length; b++) {
        const first = snapshot.controls[a], second = snapshot.controls[b];
        const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left);
        const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
        assert.ok(overlapX <= 0 || overlapY <= 0, `${first.id} overlaps ${second.id} by ${overlapX} × ${overlapY}`);
      }
    }
    return { applicable: true, ...snapshot };
  } catch (error) {
    error.controlSnapshot = snapshot;
    throw error;
  }
}

// Renderer-state fixture: exercise hover/press feedback without firing combat or
// menu actions. Geometry is measured against the live production control layout.
export async function assertControlFeedbackBounds(page, baseline) {
  const selector = '#dpad .dbtn, #touch-buttons .tbtn, #v55-nmbtns .v55-nbtn, #good-dogs-touch button';
  const client = await page.context().newCDPSession(page), states = [];
  let nodeIds = [], current;
  const geometry = snapshot => snapshot.controls.map(({ left, top, width, height }) => ({ left, top, width, height }));
  try {
    await client.send('DOM.enable');
    await client.send('CSS.enable');
    const { root } = await client.send('DOM.getDocument');
    ({ nodeIds } = await client.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector }));
    for (const state of ['hover', 'active', 'held']) {
      for (const nodeId of nodeIds) await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: state === 'held' ? [] : [state] });
      if (state === 'held') await page.locator(selector).evaluateAll(elements => elements.forEach(element => {
        if (!element.classList.contains('held')) { element.dataset.presentationFixtureHeld = 'true'; element.classList.add('held'); }
      }));
      // Finish the CSS feedback transition, not an arbitrary browser delay.
      await page.locator(selector).evaluateAll(elements => elements.forEach(element => {
        getComputedStyle(element).transform;
        for (const animation of element.getAnimations()) if (animation instanceof CSSTransition) animation.finish();
      }));
      current = await assertLandscapeControlBounds(page);
      states.push({ state, controls: current });
      assert.deepEqual(geometry(current), geometry(baseline), `${state} feedback must preserve gameplay target position and size`);
    }
  } catch (error) {
    error.controlSnapshot ||= current;
    error.feedbackStates = states;
    throw error;
  } finally {
    for (const nodeId of nodeIds) await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }).catch(() => {});
    await page.locator('[data-presentation-fixture-held]').evaluateAll(elements => elements.forEach(element => {
      element.classList.remove('held'); delete element.dataset.presentationFixtureHeld;
    })).catch(() => {});
    // The context owns this session until close. Detaching a secondary Chromium
    // session resets touch emulation (including pointer media and maxTouchPoints)
    // even when it only enabled DOM/CSS, invalidating the remaining mobile run.
  }
  current = await assertLandscapeControlBounds(page);
  states.push({ state: 'restored', controls: current });
  try {
    assert.deepEqual(current.presentation.inputCapabilities, baseline.presentation.inputCapabilities, 'feedback cleanup must preserve the browser input profile');
    assert.deepEqual(geometry(current), geometry(baseline), 'feedback cleanup must preserve the complete gameplay control layout');
    return states;
  } catch (error) {
    error.controlSnapshot = current;
    error.feedbackStates = states;
    throw error;
  }
}

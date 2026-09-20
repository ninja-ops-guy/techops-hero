import assert from 'node:assert/strict';

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
          computed: { width: style.width, minWidth: style.minWidth, flexBasis: style.flexBasis, flexShrink: style.flexShrink, boxSizing: style.boxSizing, padding: style.padding },
          reachable: !!hit && (hit === el || el.contains(hit)), hit: hit && (hit.id || hit.className || hit.tagName),
          visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0' };
      }).filter(control => control.visible);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      presentation: {
        bodyClass: document.body.className,
        expanded: document.getElementById('night-input-assists')?.getAttribute('aria-expanded'),
        narrowLandscape: matchMedia('(orientation:landscape) and (max-height:500px) and (min-width:560px) and (max-width:640px)').matches,
        controls: ['dpad', 'v55-nmbtns', 'touch-buttons'].map(id => {
          const element = document.getElementById(id), style = element && getComputedStyle(element);
          return style && { id, width: style.width, gap: style.gap, right: style.right, display: style.display, direction: style.flexDirection, columns: style.gridTemplateColumns };
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
      assert.ok(control.width >= 44 && control.height >= 44, `${control.id} retains a 44px touch target`);
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

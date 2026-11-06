import assert from 'node:assert/strict';
import {assertTouchTarget} from './responsive_control_contract.mjs';

// Renderer-only fixture: sample the actual production entrance animation at
// deterministic times, so a fast click cannot hide a transient undersized target.
export async function assertWorkstationTouchTarget(locator) {
  const samples = await locator.evaluate(button => {
    const window = button.closest('.os-window');
    const animations = window.getAnimations();
    const saved = animations.map(animation => ({animation, time: animation.currentTime, state: animation.playState}));
    const samples = [];
    try {
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        for (const animation of animations) {
          animation.pause();
          animation.currentTime = Number(animation.effect.getTiming().duration) * progress;
        }
        const rect = button.getBoundingClientRect(), style = getComputedStyle(button), parent = getComputedStyle(window);
        samples.push({progress, width: rect.width, height: rect.height,
          computed: {minHeight: style.minHeight, height: style.height, transform: style.transform,
            windowScale: parent.scale, windowTransform: parent.transform, animationName: parent.animationName}});
      }
    } finally {
      for (const {animation, time, state} of saved) {
        animation.currentTime = time;
        if (state === 'running') animation.play();
        else if (state === 'finished') animation.finish();
      }
    }
    return samples;
  });
  for (const sample of samples) assertTouchTarget(sample, `Back to desktop at entrance progress ${sample.progress}`);
  assert.ok(samples.length === 5, 'All workstation entrance samples measured');
  return samples;
}

/**
 * LUMINARY — helpers.js
 * Shared utility functions used across all modules.
 */

'use strict';

/**
 * Clamp a value between min and max.
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Debounce: delay execution until after wait ms have passed since the last call.
 */
function debounce(fn, wait = 80) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * RAF-throttle: coalesce rapid calls into one per animation frame.
 */
function rafThrottle(fn) {
  let rafId = null;
  return (...args) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Motion utilities respecting accessibility preferences and smooth easing.
 */

/**
 * Returns true if the user has requested reduced motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a numeric counter smoothly from start to end.
 * If reduced motion is requested, sets the final value immediately.
 * @param {HTMLElement} element - Target element to display number
 * @param {number} start - Initial value
 * @param {number} end - Target value
 * @param {number} duration - Animation duration in ms
 * @returns {() => void} Cleanup function to cancel the rAF loop
 */
export function countUp(element, start, end, duration) {
  if (!element) return () => {};

  if (prefersReducedMotion() || duration <= 0) {
    element.textContent = end.toLocaleString();
    return () => {};
  }

  let rafId = null;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Cubic ease-out curve
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(ease * (end - start) + start);
    element.textContent = current.toLocaleString();

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      element.textContent = end.toLocaleString();
    }
  }

  rafId = requestAnimationFrame(step);

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

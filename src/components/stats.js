import { countUp } from '../utils/motion.js';

/**
 * Initializes the milestone statistics counter cards with scroll reveal trigger.
 * @param {HTMLElement} root - Container hosting the milestones wrap
 * @param {object} config - Active configuration with derived statistics
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  const wrap = root.querySelector('.milestones-wrap');
  if (!wrap) return { reset: () => {}, destroy: () => {} };

  const stats = config.derived?.stats || { years: 11, months: 132, days: 4018, hours: 96432 };
  const cleanups = [];
  let hasAnimated = false;

  function triggerCountUps() {
    if (hasAnimated) return;
    hasAnimated = true;

    const yearsEl = wrap.querySelector('#ms-years');
    const monthsEl = wrap.querySelector('#ms-months');
    const daysEl = wrap.querySelector('#ms-days');
    const hoursEl = wrap.querySelector('#ms-hours');

    cleanups.push(countUp(yearsEl, 0, stats.years, 1200));
    cleanups.push(countUp(monthsEl, 0, stats.months, 1400));
    cleanups.push(countUp(daysEl, 0, stats.days, 1600));
    cleanups.push(countUp(hoursEl, 0, stats.hours, 1800));
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerCountUps();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );

  observer.observe(wrap);

  return {
    reset() {
      hasAnimated = false;
      cleanups.forEach((c) => c());
      cleanups.length = 0;
      triggerCountUps();
    },
    destroy() {
      observer.disconnect();
      cleanups.forEach((c) => c());
      cleanups.length = 0;
    },
  };
}

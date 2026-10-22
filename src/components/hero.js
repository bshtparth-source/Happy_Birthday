import { resolveHeroPhoto } from '../config/content.js';
import { countUp } from '../utils/motion.js';
import { setText } from '../utils/dom.js';

/**
 * Initializes the Hero section.
 * @param {HTMLElement} root - The #hero-section container
 * @param {object} config - Active configuration
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  let cancelCounter = null;
  const nameEl = root.querySelector('#hero-name');
  const ageNumEl = root.querySelector('#age-number');
  const photoEl = root.querySelector('#hero-photo');
  const subtitleEl = root.querySelector('#hero-subtitle');
  const eyebrowEl = root.querySelector('#hero-eyebrow-text');

  // Populate text safely via textContent
  setText(nameEl, `Happy Birthday, ${config.recipient?.fullName || 'Shridhika Sinha'}!`);
  setText(subtitleEl, config.hero?.tagline);
  if (eyebrowEl && config.hero?.eyebrow) {
    setText(eyebrowEl, config.hero.eyebrow);
  }

  // Setup photo
  if (photoEl) {
    const photoUrl = resolveHeroPhoto(config.hero?.photo?.id || 'hero');
    photoEl.src = photoUrl;
    photoEl.alt = config.hero?.photo?.alt || 'Portrait of celebrant';
    const focusX = config.hero?.photo?.focus?.x ?? 50;
    const focusY = config.hero?.photo?.focus?.y ?? 40;
    photoEl.style.objectPosition = `${focusX}% ${focusY}%`;
    photoEl.setAttribute('fetchpriority', 'high');
  }

  // Count-up age
  const targetAge = config.derived?.age || 11;
  cancelCounter = countUp(ageNumEl, 0, targetAge, 1200);

  return {
    reset() {
      if (cancelCounter) cancelCounter();
      cancelCounter = countUp(ageNumEl, 0, targetAge, 1200);
    },
    destroy() {
      if (cancelCounter) {
        cancelCounter();
        cancelCounter = null;
      }
    },
  };
}

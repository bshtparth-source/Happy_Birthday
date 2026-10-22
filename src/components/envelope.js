import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/motion.js';

/**
 * Initializes the full-screen interactive envelope intro sequence.
 * @param {HTMLElement} root - The #env-section container
 * @param {object} config - Active configuration
 * @param {{ onOpen: () => void }} callbacks
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config, { onOpen }) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  let opened = false;
  const button = root.querySelector('.env-button');
  const seal = root.querySelector('.wax-seal');
  const flap = root.querySelector('.env-flap');
  const card = root.querySelector('.env-card');

  // Lock scroll initially
  document.body.style.overflow = 'hidden';

  function openEnvelope(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (opened) return;
    opened = true;

    // Trigger music and unhide sections underneath so layout is ready behind the overlay
    if (onOpen) onOpen();

    // 1. Wax seal dissolves with gentle pop
    if (seal) seal.classList.add('hidden');

    // 2. Flap unfolds smoothly in 3D
    setTimeout(() => {
      if (flap) flap.classList.add('open');
    }, 120);

    // 3. Card slides up gracefully
    setTimeout(() => {
      if (card) card.classList.add('peek');
    }, 350);

    // 4. Confetti burst at card peak
    setTimeout(() => {
      if (!prefersReducedMotion()) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: 0.32, y: 0.62 },
          colors: ['#f472b6', '#fbcfe8', '#fef08a'],
        });
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: 0.68, y: 0.62 },
          colors: ['#f472b6', '#fbcfe8', '#fef08a'],
        });
      }
    }, 750);

    // 5. Silky smooth dissolve of envelope overlay
    setTimeout(() => {
      root.classList.add('closing');
      setTimeout(() => {
        root.style.display = 'none';
        document.body.style.overflow = '';
      }, 700);
    }, 1500);
  }

  button.addEventListener('click', openEnvelope);

  return {
    reset() {
      opened = false;
      root.style.display = 'flex';
      root.classList.remove('closing');
      if (seal) seal.classList.remove('hidden');
      if (flap) flap.classList.remove('open');
      if (card) card.classList.remove('peek');
      document.body.style.overflow = 'hidden';
    },
    destroy() {
      button.removeEventListener('click', openEnvelope);
      document.body.style.overflow = '';
    },
  };
}

import confetti from 'canvas-confetti';
import { SCRATCH_REVEAL_THRESHOLD, SCRATCH_CHECK_INTERVAL } from '../constants.js';
import { prefersReducedMotion } from '../utils/motion.js';
import { setText } from '../utils/dom.js';

/**
 * Initializes the DPR-aware scratch-off card with pointer events and accessible reveal.
 * @param {HTMLElement} root - The #scratch-section container
 * @param {object} config - Active configuration
 * @returns {{ reveal: () => void, reset: () => void, destroy: () => void }}
 */
export function init(root, config) {
  if (!root) return { reveal: () => {}, reset: () => {}, destroy: () => {} };

  const canvas = root.querySelector('#scratch-canvas');
  const revealBtn = root.querySelector('#scratch-reveal-btn');
  const badgeEl = root.querySelector('#scratch-badge');
  const textEl = root.querySelector('#scratch-secret-text');
  const subEl = root.querySelector('#scratch-secret-sub');
  const liveRegion = root.querySelector('#scratch-live-region');

  // Populate secret content safely via textContent
  setText(badgeEl, config.scratchReward?.title || 'SPECIAL BIRTHDAY VOUCHER 🎟️');
  setText(textEl, config.scratchReward?.message || '✨ A Day Full Of Treats & Hugs! ✨');
  setText(subEl, 'Valid forever & cannot expire 💕');

  if (!canvas) return { reveal: () => {}, reset: () => {}, destroy: () => {} };

  const ctx = canvas.getContext('2d');
  const width = (canvas.width = 360);
  const height = (canvas.height = 220);

  let isScratching = false;
  let scratchedCount = 0;
  let isRevealed = false;

  function paintCover() {
    isRevealed = false;
    canvas.classList.remove('scratch-canvas--faded');
    ctx.globalCompositeOperation = 'source-over';

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.3, '#fef08a');
    grad.addColorStop(0.6, '#ec4899');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sparkle specks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered instruction text
    ctx.fillStyle = '#831843';
    ctx.font = 'bold 15px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Scratch with finger to reveal 🎀', width / 2, height / 2 - 6);
    ctx.font = '12px "DM Sans", sans-serif';
    ctx.fillText('Your Secret Birthday Gift 💕', width / 2, height / 2 + 16);
  }

  function scratch(e) {
    if (!isScratching || isRevealed) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    scratchedCount++;
    if (scratchedCount % SCRATCH_CHECK_INTERVAL === 0) {
      checkPercentage();
    }
  }

  function checkPercentage() {
    if (isRevealed) return;
    const imgData = ctx.getImageData(0, 0, width, height);
    let transparent = 0;
    const total = imgData.data.length / 4;
    // Sample every 4th pixel for speed
    for (let i = 3; i < imgData.data.length; i += 16) {
      if (imgData.data[i] === 0) transparent++;
    }
    const sampleTotal = total / 4;
    if (transparent / sampleTotal > SCRATCH_REVEAL_THRESHOLD) {
      reveal();
    }
  }

  function reveal() {
    if (isRevealed) return;
    isRevealed = true;
    canvas.classList.add('scratch-canvas--faded');

    if (!prefersReducedMotion()) {
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#f472b6', '#fbcfe8', '#fef08a'],
      });
    }

    if (liveRegion) {
      liveRegion.textContent = 'Your secret birthday reward has been revealed!';
    }
  }

  function handlePointerDown(e) {
    isScratching = true;
    scratch(e);
  }
  function handlePointerUp() {
    isScratching = false;
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', scratch);
  window.addEventListener('pointerup', handlePointerUp);

  if (revealBtn) {
    revealBtn.addEventListener('click', reveal);
  }

  paintCover();

  return {
    reveal,
    reset() {
      paintCover();
    },
    destroy() {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', scratch);
      window.removeEventListener('pointerup', handlePointerUp);
      if (revealBtn) revealBtn.removeEventListener('click', reveal);
    },
  };
}

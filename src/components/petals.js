import { PETAL_COUNT_MOBILE, PETAL_COUNT_DESKTOP } from '../constants.js';
import { prefersReducedMotion } from '../utils/motion.js';

/**
 * Initializes background floating petals canvas and interactive tap particle reactions.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(canvas) {
  if (!canvas) return { reset: () => {}, destroy: () => {} };

  const ctx = canvas.getContext('2d');
  let cw = (canvas.width = window.innerWidth);
  let ch = (canvas.height = window.innerHeight);
  let rafId = null;
  let active = true;

  const isMobile = window.innerWidth < 768;
  const count = isMobile ? PETAL_COUNT_MOBILE : PETAL_COUNT_DESKTOP;
  const petals = [];

  for (let i = 0; i < count; i++) {
    petals.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 6 + 4,
      dx: Math.random() * 0.8 - 0.4,
      dy: Math.random() * 0.7 + 0.3,
      rot: Math.random() * Math.PI * 2,
      dRot: Math.random() * 0.02 - 0.01,
      opacity: Math.random() * 0.45 + 0.25,
      isHeart: Math.random() > 0.65,
    });
  }

  function handleResize() {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', handleResize);

  function handleVisibilityChange() {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (active && !prefersReducedMotion()) {
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Tap reaction particle spawner
  const emojiParticles = ['🌸', '✨', '💖', '🎀', '🍓'];
  function handlePointerDown(e) {
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    const p = document.createElement('div');
    p.className = 'tap-particle';
    p.textContent = emojiParticles[Math.floor(Math.random() * emojiParticles.length)];
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY}px`;
    p.style.setProperty('--dx', `${Math.random() * 50 - 25}px`);
    document.body.appendChild(p);
    setTimeout(() => {
      p.remove();
    }, 880);
  }
  window.addEventListener('pointerdown', handlePointerDown);

  function render() {
    if (!active || prefersReducedMotion()) return;

    ctx.clearRect(0, 0, cw, ch);

    // Subtle background ambient gradient
    const grad = ctx.createRadialGradient(cw * 0.5, ch * 0.2, 50, cw * 0.5, ch * 0.4, cw * 0.75);
    grad.addColorStop(0, 'rgba(255, 182, 218, 0.14)');
    grad.addColorStop(0.5, 'rgba(192, 132, 252, 0.08)');
    grad.addColorStop(1, 'rgba(17, 2, 29, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    petals.forEach((p) => {
      p.y += p.dy;
      p.x += p.dx;
      p.rot += p.dRot;

      if (p.y > ch + 20) {
        p.y = -20;
        p.x = Math.random() * cw;
      }
      if (p.x > cw + 20) p.x = -20;
      if (p.x < -20) p.x = cw + 20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.opacity;

      if (p.isHeart) {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(-p.r * 0.4, -p.r * 0.4, p.r * 0.5, 0, Math.PI * 2);
        ctx.arc(p.r * 0.4, -p.r * 0.4, p.r * 0.5, 0, Math.PI * 2);
        ctx.lineTo(0, p.r * 0.6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    rafId = requestAnimationFrame(render);
  }

  if (!prefersReducedMotion()) {
    rafId = requestAnimationFrame(render);
  }

  return {
    reset() {
      // Petals maintain gentle continuous flow
    },
    destroy() {
      active = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handlePointerDown);
    },
  };
}

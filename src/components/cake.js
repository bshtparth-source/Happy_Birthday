import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/motion.js';
import { setText } from '../utils/dom.js';

/**
 * Initializes the 3D SVG luxury cake, candles, and blow/relight sequencing.
 * @param {HTMLElement} root - The #cake-section container
 * @param {object} config - Active configuration
 * @returns {{ blow: () => void, relight: () => void, reset: () => void, destroy: () => void }}
 */
export function init(root, config) {
  if (!root) return { blow: () => {}, relight: () => {}, reset: () => {}, destroy: () => {} };

  const cakeSvgWrap = root.querySelector('#cake-svg-wrap');
  const blowBtn = root.querySelector('#blow-btn');
  const relightBtn = root.querySelector('#relight-btn');
  const blowControls = root.querySelector('#blow-controls');
  const wishMsg = root.querySelector('#wish-msg');
  const wishSubText = root.querySelector('#wish-sub-text');

  const candleCount = config.derived?.candleCount || 11;
  // Tier 3 top width is 156 (x: 112 to 268). Safe candle zone is x: 135 to 245 (span = 110px).
  // This guarantees candles stay comfortably seated on the tier with ~23px margin on each side.
  const maxSpan = Math.min(110, Math.max(30, (candleCount - 1) * 14));
  const candleSpacing = candleCount > 1 ? maxSpan / (candleCount - 1) : 0;
  const startX = 190 - ((candleCount - 1) * candleSpacing) / 2;

  const CANDLE_COLORS = [
    { base: '#FF8FAB', stripe: '#FFE5EC' },
    { base: '#CDB4FF', stripe: '#F3E8FF' },
    { base: '#FDE68A', stripe: '#FFFBEB' },
    { base: '#A7F3D0', stripe: '#ECFDF5' },
    { base: '#BAE6FD', stripe: '#F0F9FF' },
    { base: '#FED7AA', stripe: '#FFF7ED' },
    { base: '#F472B6', stripe: '#FDF2F8' },
  ];

  let candlesSvg = '';
  let flamesSvg = '';
  let smokeSvg = '';

  for (let i = 0; i < candleCount; i++) {
    const cx = Number((startX + i * candleSpacing).toFixed(1));
    const col = CANDLE_COLORS[i % CANDLE_COLORS.length];
    // Natural slight height variation
    const h = 29 + (i % 2 === 0 ? 3 : 0);
    // Subtle arc following Tier 3 elliptical top surface
    const normX = (cx - 190) / 78;
    const yBottom = Number((151 + Math.sqrt(Math.max(0, 1 - normX * normX)) * 2).toFixed(1));
    const yTop = yBottom - h;
    const wickTipY = yTop - 7;

    candlesSvg += `
      <g id="candle-${i}" class="candle-stick">
        <!-- Candle Body -->
        <rect x="${(cx - 2.6).toFixed(1)}" y="${yTop}" width="5.2" height="${h}" rx="1.5" fill="${col.base}"/>
        <!-- Diagonal Candy Stripes -->
        <line x1="${(cx - 2.6).toFixed(1)}" y1="${yTop + 6}" x2="${(cx + 2.6).toFixed(1)}" y2="${yTop + 3}" stroke="${col.stripe}" stroke-width="1.3" opacity="0.8"/>
        <line x1="${(cx - 2.6).toFixed(1)}" y1="${yTop + 14}" x2="${(cx + 2.6).toFixed(1)}" y2="${yTop + 11}" stroke="${col.stripe}" stroke-width="1.3" opacity="0.8"/>
        <line x1="${(cx - 2.6).toFixed(1)}" y1="${yTop + 22}" x2="${(cx + 2.6).toFixed(1)}" y2="${yTop + 19}" stroke="${col.stripe}" stroke-width="1.3" opacity="0.8"/>
        <!-- Candle Wick -->
        <line x1="${cx}" y1="${yTop}" x2="${cx}" y2="${wickTipY}" stroke="#2B2D42" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    `;

    flamesSvg += `
      <g id="flame-group-${i}" class="candle-flame-group" style="transform-origin: ${cx}px ${wickTipY}px;">
        <circle cx="${cx}" cy="${wickTipY - 6}" r="7" fill="#FFA500" opacity="0.4" filter="url(#flameGlow)"/>
        <path d="M ${cx} ${wickTipY} C ${cx - 3.4} ${wickTipY - 4}, ${cx - 3.8} ${wickTipY - 9}, ${cx} ${wickTipY - 15} C ${cx + 3.8} ${wickTipY - 9}, ${cx + 3.4} ${wickTipY - 4}, ${cx} ${wickTipY} Z" fill="url(#flameGrad)"/>
        <path d="M ${cx} ${wickTipY - 1.5} C ${cx - 1.6} ${wickTipY - 4}, ${cx - 1.8} ${wickTipY - 7}, ${cx} ${wickTipY - 10.5} C ${cx + 1.8} ${wickTipY - 7}, ${cx + 1.6} ${wickTipY - 4}, ${cx} ${wickTipY - 1.5} Z" fill="#FFFDF4"/>
      </g>
    `;

    smokeSvg += `
      <path id="smoke-${i}" class="smoke-wisp" d="M ${cx} ${wickTipY} Q ${cx - 4} ${wickTipY - 12}, ${cx + 3} ${wickTipY - 26}" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0"/>
    `;
  }

  // Render SVG Cake structure with rich 3D gradients and decorative details
  cakeSvgWrap.innerHTML = `
    <svg id="cake-svg" viewBox="0 25 380 335" width="100%" height="100%" role="img" aria-label="Birthday cake with lit candles">
      <defs>
        <radialGradient id="cakeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFA834" stop-opacity="0.8"/>
          <stop offset="45%" stop-color="#FF5D8F" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#7B2CBF" stop-opacity="0"/>
        </radialGradient>
        <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#FF4500"/>
          <stop offset="55%" stop-color="#FFA500"/>
          <stop offset="100%" stop-color="#FFEE55"/>
        </linearGradient>
        <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="65%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#CBD5E1"/>
        </linearGradient>
        <linearGradient id="tier1Grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#F27295"/>
          <stop offset="40%" stop-color="#FF94B1"/>
          <stop offset="100%" stop-color="#E85D81"/>
        </linearGradient>
        <linearGradient id="tier2Grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#BFA0F5"/>
          <stop offset="40%" stop-color="#D4C2FE"/>
          <stop offset="100%" stop-color="#B18EF0"/>
        </linearGradient>
        <linearGradient id="tier3Grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFF8E7"/>
          <stop offset="40%" stop-color="#FFFDF9"/>
          <stop offset="100%" stop-color="#F5ECD5"/>
        </linearGradient>
        <radialGradient id="strawberryGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FF4D6D"/>
          <stop offset="60%" stop-color="#D90429"/>
          <stop offset="100%" stop-color="#9B001B"/>
        </radialGradient>
      </defs>

      <ellipse id="cake-ambient-halo" class="cake-ambient-halo" cx="190" cy="135" rx="150" ry="90" fill="url(#cakeGlow)"/>

      <g id="cake-floating-group">
        <!-- Cake Plate & Soft Ground Shadow -->
        <ellipse cx="190" cy="336" rx="148" ry="12" fill="rgba(0,0,0,0.35)"/>
        <ellipse cx="190" cy="328" rx="146" ry="13" fill="url(#plateGrad)"/>
        <ellipse cx="190" cy="325" rx="142" ry="10" fill="#FFFFFF"/>

        <!-- Tier 1: Strawberry Pink (Width 254: x 63 to 317) -->
        <rect x="63" y="260" width="254" height="65" rx="12" fill="url(#tier1Grad)"/>
        <ellipse cx="190" cy="260" rx="127" ry="13" fill="#FFA5BD"/>
        <!-- Tier 1 Frosting Drips -->
        <path d="M 63 260 C 76 278, 88 284, 100 262 C 114 280, 128 286, 142 264 C 158 282, 172 288, 186 264 C 202 284, 218 288, 232 262 C 246 280, 260 286, 274 262 C 288 280, 302 282, 317 260 Z" fill="#FFB8CB"/>
        <!-- Tier 1 Pearl Icing Border -->
        <circle cx="80" cy="261" r="2.5" fill="#FFF"/>
        <circle cx="102" cy="263" r="2.5" fill="#FFF"/>
        <circle cx="126" cy="264" r="2.5" fill="#FFF"/>
        <circle cx="152" cy="265" r="2.5" fill="#FFF"/>
        <circle cx="180" cy="266" r="2.5" fill="#FFF"/>
        <circle cx="208" cy="266" r="2.5" fill="#FFF"/>
        <circle cx="236" cy="265" r="2.5" fill="#FFF"/>
        <circle cx="262" cy="264" r="2.5" fill="#FFF"/>
        <circle cx="286" cy="263" r="2.5" fill="#FFF"/>
        <circle cx="305" cy="261" r="2.5" fill="#FFF"/>

        <!-- Tier 2: Lavender Lilac (Width 202: x 89 to 291) -->
        <rect x="89" y="202" width="202" height="60" rx="10" fill="url(#tier2Grad)"/>
        <ellipse cx="190" cy="202" rx="101" ry="11" fill="#DFCFFF"/>
        <!-- Tier 2 Frosting Drips -->
        <path d="M 89 202 C 102 220, 114 226, 126 204 C 140 224, 154 228, 168 205 C 184 226, 198 230, 214 205 C 228 224, 242 228, 256 205 C 268 222, 280 224, 291 202 Z" fill="#E8DCFF"/>
        <!-- Tier 2 Sprinkles -->
        <rect x="110" y="215" width="2" height="6" rx="1" transform="rotate(35 110 215)" fill="#FDE68A"/>
        <rect x="150" y="220" width="2" height="6" rx="1" transform="rotate(-25 150 220)" fill="#FF8FAB"/>
        <rect x="230" y="218" width="2" height="6" rx="1" transform="rotate(45 230 218)" fill="#A7F3D0"/>
        <rect x="270" y="215" width="2" height="6" rx="1" transform="rotate(-30 270 215)" fill="#FDE68A"/>

        <!-- Tier 3: Vanilla Cream (Width 156: x 112 to 268) -->
        <rect x="112" y="150" width="156" height="54" rx="8" fill="url(#tier3Grad)"/>
        <ellipse cx="190" cy="150" rx="78" ry="10" fill="#FFFDF7"/>
        <!-- Tier 3 Frosting Drips -->
        <path d="M 112 150 C 122 166, 132 168, 142 152 C 154 168, 166 172, 178 152 C 190 168, 202 172, 214 152 C 226 168, 238 170, 250 152 C 258 165, 264 165, 268 150 Z" fill="#FEF3C7"/>

        <!-- Decorative Strawberry (Resting delicately on front drip of Tier 3, clear of candles) -->
        <g id="cake-strawberry">
          <!-- Strawberry Calyx / Green Leaves -->
          <path d="M 183 162 C 186 160, 190 163, 190 163 C 190 163, 194 160, 197 162 C 195 165, 190 166, 190 166 C 190 166, 185 165, 183 162 Z" fill="#10B981"/>
          <line x1="190" y1="161" x2="190" y2="157" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/>
          <!-- Strawberry Body -->
          <path d="M 184 163 C 183 159, 197 159, 196 163 C 197 170, 193 176, 190 177 C 187 176, 183 170, 184 163 Z" fill="url(#strawberryGrad)"/>
          <!-- Gloss highlight -->
          <ellipse cx="187" cy="165" rx="1.5" ry="3" transform="rotate(-20 187 165)" fill="rgba(255,255,255,0.7)"/>
        </g>

        <!-- Candles, Flames, Smoke (All seated securely within Tier 3) -->
        ${candlesSvg}
        ${flamesSvg}
        ${smokeSvg}
      </g>
    </svg>
  `;

  // Populate wish message
  setText(wishSubText, config.candles?.wishMessage || 'The universe heard your whisper ✨');

  function blow() {
    for (let i = 0; i < candleCount; i++) {
      const flame = cakeSvgWrap.querySelector(`#flame-group-${i}`);
      const smk = cakeSvgWrap.querySelector(`#smoke-${i}`);
      if (flame) {
        setTimeout(() => {
          flame.classList.add('flame-extinguished');
          if (smk) smk.classList.add('smoke-puff');
        }, i * 35);
      }
    }

    const halo = cakeSvgWrap.querySelector('#cake-ambient-halo');
    if (halo) halo.classList.add('cake-ambient-halo--dim');

    setTimeout(
      () => {
        if (!prefersReducedMotion()) {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.65 },
            colors: ['#f472b6', '#fbcfe8', '#fef08a'],
          });
        }
        blowControls.style.display = 'none';
        wishMsg.classList.add('wish-msg--visible');
      },
      candleCount * 35 + 200
    );
  }

  function relight() {
    for (let i = 0; i < candleCount; i++) {
      const flame = cakeSvgWrap.querySelector(`#flame-group-${i}`);
      const smk = cakeSvgWrap.querySelector(`#smoke-${i}`);
      if (flame) flame.classList.remove('flame-extinguished');
      if (smk) smk.classList.remove('smoke-puff');
    }

    const halo = cakeSvgWrap.querySelector('#cake-ambient-halo');
    if (halo) halo.classList.remove('cake-ambient-halo--dim');

    blowControls.style.display = 'flex';
    wishMsg.classList.remove('wish-msg--visible');
  }

  blowBtn.addEventListener('click', blow);
  relightBtn.addEventListener('click', relight);

  return {
    blow,
    relight,
    reset() {
      relight();
    },
    destroy() {
      blowBtn.removeEventListener('click', blow);
      relightBtn.removeEventListener('click', relight);
    },
  };
}

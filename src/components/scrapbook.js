import { resolveMemoryPhoto } from '../config/content.js';
import { el, useIcon } from '../utils/dom.js';

/**
 * Initializes the polaroid scrapbook gallery with alternating tilt and keyboard triggers.
 * @param {HTMLElement} root - The #gallery-section container
 * @param {object} config - Active configuration
 * @param {{ onOpenPhoto: (index: number) => void }} callbacks
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config, { onOpenPhoto }) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  const container = root.querySelector('#polaroid-container');
  if (!container) return { reset: () => {}, destroy: () => {} };

  const memories = config.memories || [];
  const tilts = [-3.5, 3.2, -2.8, 3.6, -3.0, 2.5];
  const stickers = ['ribbon', 'flower', 'sparkle', 'heart'];

  container.innerHTML = '';

  memories.forEach((item, idx) => {
    const tilt = tilts[idx % tilts.length];
    const stickerIcon = stickers[idx % stickers.length];
    const photoUrl = resolveMemoryPhoto(item.id);

    const btn = el('button', {
      className: 'polaroid-card',
      attrs: {
        type: 'button',
        'aria-label': `View photo: ${item.caption || item.alt}`,
      },
    });
    btn.style.setProperty('--tilt', `${tilt}deg`);

    const fig = el('figure', { className: 'polaroid-figure' });

    const washi = el('div', { className: 'washi-tape' });
    fig.appendChild(washi);

    const img = el('img', {
      className: 'polaroid-img',
      attrs: {
        src: photoUrl,
        alt: item.alt || item.caption || 'Memory snapshot',
        loading: 'lazy',
        decoding: 'async',
        width: '200',
        height: '200',
      },
    });
    const focusX = item.focus?.x ?? 50;
    const focusY = item.focus?.y ?? 50;
    img.style.objectPosition = `${focusX}% ${focusY}%`;
    fig.appendChild(img);

    const figcap = el('figcaption', { className: 'polaroid-figcaption' });
    const cap = el('span', { className: 'polaroid-caption', text: item.caption });
    const tag = el('span', { className: 'polaroid-tag', text: item.tag });
    figcap.appendChild(cap);
    figcap.appendChild(tag);
    fig.appendChild(figcap);

    const stickerEl = el('div', { className: 'polaroid-sticker' });
    stickerEl.appendChild(useIcon(stickerIcon));
    fig.appendChild(stickerEl);

    btn.appendChild(fig);

    btn.addEventListener('click', () => {
      if (onOpenPhoto) onOpenPhoto(idx);
    });

    container.appendChild(btn);
  });

  return {
    reset() {},
    destroy() {
      container.innerHTML = '';
    },
  };
}

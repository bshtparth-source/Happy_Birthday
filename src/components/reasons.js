import { el, useIcon } from '../utils/dom.js';

/**
 * Initializes the "Reasons Why You Make Me Smile" grid cards.
 * @param {HTMLElement} root - The #letter-section container hosting reasons
 * @param {object} config - Active configuration
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  const container = root.querySelector('#reasons-container');
  if (!container) return { reset: () => {}, destroy: () => {} };

  container.innerHTML = '';
  const reasons = config.reasons || [];

  reasons.forEach((r, idx) => {
    const card = el('div', { className: 'reason-card' });

    const header = el('div', { className: 'reason-header' });
    const badge = el('span', {
      className: 'reason-badge',
      text: `REASON ${String(idx + 1).padStart(2, '0')}`,
    });
    const iconWrap = el('div', { className: 'reason-icon' });
    iconWrap.appendChild(useIcon(r.icon || 'flower'));

    header.appendChild(badge);
    header.appendChild(iconWrap);

    const title = el('div', { className: 'reason-title', text: r.title });
    const desc = el('div', { className: 'reason-text', text: r.text });

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(desc);

    container.appendChild(card);
  });

  return {
    reset() {},
    destroy() {
      container.innerHTML = '';
    },
  };
}

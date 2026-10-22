import { setText, el } from '../utils/dom.js';

/**
 * Initializes the personal love letter card with paragraph mapping.
 * @param {HTMLElement} root - The #letter-section container
 * @param {object} config - Active configuration
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  const greetingEl = root.querySelector('#letter-greeting');
  const bodyEl = root.querySelector('#letter-body');
  const signoffEl = root.querySelector('#letter-signoff');

  setText(greetingEl, config.letter?.greeting || 'My Dearest Shridhika,');

  if (bodyEl) {
    bodyEl.innerHTML = '';
    const paragraphs = config.letter?.paragraphs || [];
    paragraphs.forEach((pText) => {
      const p = el('p', { text: pText });
      bodyEl.appendChild(p);
    });
  }

  const closing = config.letter?.closing || 'Forever & Always, with all my love,';
  const sender = config.sender?.name ? `\n${config.sender.name}` : '';
  setText(signoffEl, `${closing}${sender}`);

  return {
    reset() {},
    destroy() {},
  };
}

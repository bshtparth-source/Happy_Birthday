import { setText } from '../utils/dom.js';

/**
 * Initializes the Finale section with replay trigger.
 * @param {HTMLElement} root - The #finale-section container
 * @param {object} config - Active configuration
 * @param {{ onReplay: () => void }} callbacks
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config, { onReplay }) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  const nameEl = root.querySelector('#finale-name');
  const msgEl = root.querySelector('#finale-message');
  const senderEl = root.querySelector('#finale-sender');
  const replayBtn = root.querySelector('#replay-btn');

  setText(nameEl, config.recipient?.firstName || 'Shridhika');
  if (config.finale?.message) {
    setText(msgEl, config.finale.message);
  }

  const closing = config.finale?.closingLine || 'With all my heart';
  const senderName = config.sender?.name ? `, ${config.sender.name}` : '';
  setText(senderEl, `${closing}${senderName}`);

  function handleReplay() {
    if (onReplay) onReplay();
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', handleReplay);
  }

  return {
    reset() {},
    destroy() {
      if (replayBtn) replayBtn.removeEventListener('click', handleReplay);
    },
  };
}

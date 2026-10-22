import { resolveMemoryPhoto } from '../config/content.js';

/**
 * Initializes the accessible native <dialog> lightbox with keyboard and swipe navigation.
 * @param {HTMLDialogElement} dialog - The #lightbox-dialog element
 * @param {object} config - Active configuration
 * @returns {{ open: (index: number) => void, close: () => void, reset: () => void, destroy: () => void }}
 */
export function init(dialog, config) {
  if (!dialog) return { open: () => {}, close: () => {}, reset: () => {}, destroy: () => {} };

  const imgEl = dialog.querySelector('.lightbox-img');
  const closeBtn = dialog.querySelector('.lightbox-close');
  const prevBtn = dialog.querySelector('.lightbox-nav--prev');
  const nextBtn = dialog.querySelector('.lightbox-nav--next');

  const memories = config.memories || [];
  let currentIndex = 0;
  let lastActiveElement = null;

  function updateImage(idx) {
    if (idx < 0) idx = memories.length - 1;
    if (idx >= memories.length) idx = 0;
    currentIndex = idx;
    const item = memories[currentIndex];
    if (item && imgEl) {
      imgEl.src = resolveMemoryPhoto(item.id);
      imgEl.alt = item.alt || item.caption || 'Memory snapshot';
    }
  }

  function open(idx = 0) {
    lastActiveElement = document.activeElement;
    updateImage(idx);
    dialog.showModal();
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (dialog.open) {
      dialog.close();
    }
    if (lastActiveElement && lastActiveElement.focus) {
      lastActiveElement.focus();
    }
  }

  function handleKeydown(e) {
    if (!dialog.open) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      updateImage(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      updateImage(currentIndex + 1);
    }
  }

  // Swipe detection on touch devices
  let touchStartX = 0;
  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
  }
  function handleTouchEnd(e) {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        updateImage(currentIndex - 1);
      } else {
        updateImage(currentIndex + 1);
      }
    }
  }

  function handleBackdropClick(e) {
    if (e.target === dialog) {
      close();
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', () => updateImage(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => updateImage(currentIndex + 1));
  dialog.addEventListener('click', handleBackdropClick);
  window.addEventListener('keydown', handleKeydown);
  dialog.addEventListener('touchstart', handleTouchStart, { passive: true });
  dialog.addEventListener('touchend', handleTouchEnd, { passive: true });

  return {
    open,
    close,
    reset() {
      close();
    },
    destroy() {
      close();
      window.removeEventListener('keydown', handleKeydown);
      dialog.removeEventListener('click', handleBackdropClick);
    },
  };
}

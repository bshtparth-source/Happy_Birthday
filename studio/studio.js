import { fetchContent, saveContent } from './api.js';
import {
  initStore,
  getState,
  subscribe,
  hasUnsavedChanges,
  markSaved,
  discardChanges,
} from './store.js';

import { mount as mountBasics } from './panels/basics.js';
import { mount as mountPhotos } from './panels/photos.js';
import { mount as mountLetter } from './panels/letter.js';
import { mount as mountReasons } from './panels/reasons.js';
import { mount as mountMusic } from './panels/music.js';
import { mount as mountChecklist } from './panels/checklist.js';
import { mount as mountPublish } from './panels/publish.js';

const panels = {
  basics: mountBasics,
  photos: mountPhotos,
  letter: mountLetter,
  reasons: mountReasons,
  music: mountMusic,
  checklist: mountChecklist,
  publish: mountPublish,
};

let activeTab = 'basics';
let debounceTimer = null;

async function initStudio() {
  const data = await fetchContent();
  initStore(data);

  const panelContainer = document.getElementById('studio-panel-container');
  const saveBtn = document.getElementById('studio-save-btn');
  const discardBtn = document.getElementById('studio-discard-btn');
  const previewFrame = document.getElementById('preview-iframe');

  function renderCurrentPanel() {
    panelContainer.innerHTML = '';
    const mountFn = panels[activeTab];
    if (mountFn) {
      mountFn(panelContainer);
    }
  }

  // Subscribe store changes to update Save button state & send live updates to iframe
  subscribe((state) => {
    const unsaved = hasUnsavedChanges();
    saveBtn.disabled = !unsaved;
    discardBtn.disabled = !unsaved;

    // Debounced live update to iframe
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (previewFrame && previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage(
          {
            type: 'STUDIO_PREVIEW_UPDATE',
            content: state,
          },
          window.location.origin
        );
      }
    }, 250);
  });

  // Tab switching
  document.querySelectorAll('.studio-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document
        .querySelectorAll('.studio-tab')
        .forEach((t) => t.classList.remove('studio-tab--active'));
      tab.classList.add('studio-tab--active');
      activeTab = tab.dataset.panel;
      renderCurrentPanel();
    });
  });

  // Save action
  saveBtn.addEventListener('click', async () => {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      await saveContent(getState());
      markSaved();
      saveBtn.textContent = 'Save & Publish';
      alert('Content saved successfully! Ready to commit and push.');
    } catch (err) {
      alert(`Save failed: ${err.message}`);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save & Publish';
    }
  });

  // Discard action
  discardBtn.addEventListener('click', () => {
    if (confirm('Discard all unsaved changes and revert to last saved state?')) {
      discardChanges();
      renderCurrentPanel();
    }
  });

  // Device toggle buttons
  document.querySelectorAll('.device-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('.device-btn')
        .forEach((b) => b.classList.remove('device-btn--active'));
      btn.classList.add('device-btn--active');
      const dev = btn.dataset.device;
      previewFrame.className = `preview-iframe preview-iframe--${dev}`;
    });
  });

  // Jump to section dropdown
  const jumpSel = document.getElementById('jump-to-section');
  if (jumpSel) {
    jumpSel.addEventListener('change', (e) => {
      const hash = e.target.value;
      if (hash && previewFrame && previewFrame.contentWindow) {
        previewFrame.contentWindow.location.hash = hash;
      }
    });
  }

  // Beforeunload warning
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  renderCurrentPanel();
}

initStudio();

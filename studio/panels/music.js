import { getState, setState } from '../store.js';

export function mount(container) {
  const state = getState();

  container.innerHTML = `
    <div class="form-group">
      <label class="form-label">Music Track Title</label>
      <input type="text" id="inp-music-title" class="form-input" value="${state.music?.title || 'Birthday Melodies'}" />
      <p class="form-hint">Displayed in the floating music pill in the top-right corner.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Default Audio Synthesizer</label>
      <p class="form-hint">
        When no custom MP3/M4A file is provided, a gentle 100% offline Web Audio melody synthesizer plays "Happy Birthday".
      </p>
    </div>
  `;

  container.querySelector('#inp-music-title').addEventListener('input', (e) => {
    setState((s) => ({ ...s, music: { ...s.music, title: e.target.value } }));
  });
}

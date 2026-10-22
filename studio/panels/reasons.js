import { getState, setState } from '../store.js';

export function mount(container) {
  const state = getState();
  const reasons = state.reasons || [];
  const iconOptions = ['ribbon', 'flower', 'sparkle', 'star', 'heart'];

  container.innerHTML = `
    <p class="form-hint" style="margin-bottom: 1rem;">
      Customize the heartfelt cards explaining why she makes you smile. Choose an icon, title, and sweet description.
    </p>
    <div id="reasons-list"></div>
  `;

  const list = container.querySelector('#reasons-list');
  reasons.forEach((r, idx) => {
    const card = document.createElement('div');
    card.style.cssText =
      'border: 1px solid var(--studio-border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fff;';
    card.innerHTML = `
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
        <select class="form-input reason-icon" data-idx="${idx}" style="width: 110px;">
          ${iconOptions.map((opt) => `<option value="${opt}" ${opt === r.icon ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
        <input type="text" class="form-input reason-title" data-idx="${idx}" value="${r.title || ''}" placeholder="Title" />
      </div>
      <textarea class="form-textarea reason-text" data-idx="${idx}" rows="2" placeholder="Description">${r.text || ''}</textarea>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.reason-icon').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.idx);
      setState((s) => {
        const rList = [...s.reasons];
        rList[idx] = { ...rList[idx], icon: e.target.value };
        return { ...s, reasons: rList };
      });
    });
  });

  list.querySelectorAll('.reason-title').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      setState((s) => {
        const rList = [...s.reasons];
        rList[idx] = { ...rList[idx], title: e.target.value };
        return { ...s, reasons: rList };
      });
    });
  });

  list.querySelectorAll('.reason-text').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      setState((s) => {
        const rList = [...s.reasons];
        rList[idx] = { ...rList[idx], text: e.target.value };
        return { ...s, reasons: rList };
      });
    });
  });
}

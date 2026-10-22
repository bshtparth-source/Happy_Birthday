import { getState, setState } from '../store.js';

export function mount(container) {
  const state = getState();
  const paragraphs = state.letter?.paragraphs || [];

  container.innerHTML = `
    <div class="form-group">
      <label class="form-label">Greeting</label>
      <input type="text" id="inp-greeting" class="form-input" value="${state.letter?.greeting || ''}" />
    </div>

    <div class="form-group">
      <label class="form-label">Letter Paragraphs</label>
      <div id="para-list"></div>
    </div>

    <div class="form-group">
      <label class="form-label">Closing Sign-off</label>
      <input type="text" id="inp-closing" class="form-input" value="${state.letter?.closing || ''}" />
    </div>
  `;

  const paraList = container.querySelector('#para-list');
  paragraphs.forEach((p, idx) => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '0.75rem';
    wrap.innerHTML = `
      <textarea class="form-textarea para-text" data-idx="${idx}" rows="3">${p}</textarea>
    `;
    paraList.appendChild(wrap);
  });

  container.querySelector('#inp-greeting').addEventListener('input', (e) => {
    setState((s) => ({ ...s, letter: { ...s.letter, greeting: e.target.value } }));
  });

  container.querySelector('#inp-closing').addEventListener('input', (e) => {
    setState((s) => ({ ...s, letter: { ...s.letter, closing: e.target.value } }));
  });

  paraList.querySelectorAll('.para-text').forEach((textarea) => {
    textarea.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      setState((s) => {
        const paras = [...s.letter.paragraphs];
        paras[idx] = e.target.value;
        return { ...s, letter: { ...s.letter, paragraphs: paras } };
      });
    });
  });
}

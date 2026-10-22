import { getState, setState } from '../store.js';
import { uploadPhoto } from '../api.js';

export function mount(container) {
  const state = getState();
  const memories = state.memories || [];
  const heroPhoto = state.hero?.photo || { id: 'hero', alt: '', focus: { x: 50, y: 40 } };

  container.innerHTML = `
    <!-- Hero Photo -->
    <div style="border: 1px solid var(--studio-border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; background: #fff;">
      <h3 style="font-size: 1rem; margin-bottom: 0.35rem;">Hero Profile Picture</h3>
      <p class="form-hint" style="margin-bottom: 0.75rem;">
        Displayed in the glowing circular hero frame. Accepts JPG, PNG, WebP up to 15 MB. (iPhone HEIC: please export as JPG).
      </p>

      <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
        <div id="hero-thumb-wrap" style="position: relative; width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 2px solid var(--studio-border); background: #eee; cursor: crosshair;">
          <img id="hero-thumb" src="/src/assets/images/hero/placeholder.svg" style="width: 100%; height: 100%; object-fit: cover; object-position: ${heroPhoto.focus?.x ?? 50}% ${heroPhoto.focus?.y ?? 40}%;" alt="Hero preview" />
          <div id="hero-focus-dot" style="position: absolute; width: 8px; height: 8px; background: red; border-radius: 50%; transform: translate(-50%, -50%); left: ${heroPhoto.focus?.x ?? 50}%; top: ${heroPhoto.focus?.y ?? 40}%; pointer-events: none;"></div>
        </div>
        <div style="flex: 1;">
          <label class="studio-btn" style="cursor: pointer; display: inline-flex; margin-bottom: 0.5rem;">
            <span>📷 Choose Photo</span>
            <input type="file" id="hero-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;" />
          </label>
          <p id="hero-upload-status" class="form-hint" style="color: var(--studio-muted);">Click on circle to adjust crop center (${heroPhoto.focus?.x ?? 50}%, ${heroPhoto.focus?.y ?? 40}%).</p>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Hero Alt Text (Required)</label>
        <input type="text" id="hero-alt" class="form-input" value="${heroPhoto.alt || ''}" placeholder="e.g. Portrait of Shridhika smiling" />
      </div>
    </div>

    <!-- Scrapbook Memories -->
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h3 style="font-size: 1rem;">Scrapbook Memories (<span id="mem-count">${memories.length}</span> / 8)</h3>
        <label class="studio-btn studio-btn--primary" style="cursor: pointer; font-size: 0.8rem; padding: 0.35rem 0.75rem;">
          <span>+ Add Memory</span>
          <input type="file" id="add-memory-input" accept="image/jpeg,image/png,image/webp" style="display: none;" />
        </label>
      </div>
      <p class="form-hint" style="margin-bottom: 1rem;">
        Polaroid cards shown in the gallery. Each card requires meaningful alt text.
      </p>

      <div id="memory-cards-list"></div>
    </div>
  `;

  // 1. Hero Focus Point Picker
  const heroThumbWrap = container.querySelector('#hero-thumb-wrap');
  const heroThumb = container.querySelector('#hero-thumb');
  const heroDot = container.querySelector('#hero-focus-dot');
  const heroStatus = container.querySelector('#hero-upload-status');

  heroThumbWrap.addEventListener('click', (e) => {
    const rect = heroThumbWrap.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    heroDot.style.left = `${x}%`;
    heroDot.style.top = `${y}%`;
    heroThumb.style.objectPosition = `${x}% ${y}%`;
    heroStatus.textContent = `Crop center adjusted to (${x}%, ${y}%).`;
    setState((s) => ({
      ...s,
      hero: {
        ...s.hero,
        photo: {
          ...s.hero?.photo,
          focus: { x, y },
        },
      },
    }));
  });

  // 2. Hero Photo Upload
  const heroInput = container.querySelector('#hero-file-input');
  heroInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      heroStatus.textContent = 'Processing and optimizing…';
      const result = await uploadPhoto(file, 'hero');
      heroThumb.src = result.previewUrl;
      heroStatus.textContent = `Uploaded (${result.sizeKb} KB). ${result.warning || ''}`;
      setState((s) => ({
        ...s,
        hero: {
          ...s.hero,
          photo: {
            ...s.hero?.photo,
            id: result.id,
          },
        },
      }));
    } catch (err) {
      alert(`Hero photo upload failed: ${err.message}`);
      heroStatus.textContent = 'Upload failed. Try another JPG or PNG.';
    }
  });

  // 3. Hero Alt Text
  container.querySelector('#hero-alt').addEventListener('input', (e) => {
    setState((s) => ({
      ...s,
      hero: {
        ...s.hero,
        photo: {
          ...s.hero?.photo,
          alt: e.target.value,
        },
      },
    }));
  });

  // 4. Render Memory Cards
  const list = container.querySelector('#memory-cards-list');

  function renderMemories() {
    list.innerHTML = '';
    const currentMems = getState().memories || [];
    container.querySelector('#mem-count').textContent = currentMems.length;

    currentMems.forEach((mem, idx) => {
      const card = document.createElement('div');
      card.style.cssText =
        'border: 1px solid var(--studio-border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fff;';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span style="font-weight: 600; font-size: 0.85rem; color: var(--studio-muted);">Polaroid #${idx + 1}</span>
          <div style="display: flex; gap: 0.25rem;">
            <button type="button" class="studio-btn move-up-btn" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} style="padding: 0.2rem 0.5rem; min-height: 28px; font-size: 0.75rem;">▲</button>
            <button type="button" class="studio-btn move-down-btn" data-idx="${idx}" ${idx === currentMems.length - 1 ? 'disabled' : ''} style="padding: 0.2rem 0.5rem; min-height: 28px; font-size: 0.75rem;">▼</button>
            <button type="button" class="studio-btn remove-mem-btn" data-idx="${idx}" style="padding: 0.2rem 0.5rem; min-height: 28px; font-size: 0.75rem; color: var(--studio-danger);" ${currentMems.length <= 2 ? 'disabled' : ''}>✕</button>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem;">
          <label class="studio-btn" style="cursor: pointer; font-size: 0.8rem; padding: 0.3rem 0.6rem;">
            <span>📷 Replace Image</span>
            <input type="file" class="replace-mem-input" data-idx="${idx}" accept="image/jpeg,image/png,image/webp" style="display: none;" />
          </label>
          <span class="mem-upload-status form-hint" style="align-self: center;">ID: ${mem.id}</span>
        </div>

        <div class="form-group" style="margin-bottom: 0.75rem;">
          <label class="form-label">Caption</label>
          <input type="text" class="form-input mem-caption" data-idx="${idx}" value="${mem.caption || ''}" />
        </div>
        <div class="form-group" style="margin-bottom: 0.75rem;">
          <label class="form-label">Tag / Date</label>
          <input type="text" class="form-input mem-tag" data-idx="${idx}" value="${mem.tag || ''}" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Alt Text (Required)</label>
          <input type="text" class="form-input mem-alt" data-idx="${idx}" value="${mem.alt || ''}" />
        </div>
      `;

      list.appendChild(card);
    });

    // Bind item actions
    list.querySelectorAll('.move-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx > 0) {
          setState((s) => {
            const arr = [...s.memories];
            const temp = arr[idx];
            arr[idx] = arr[idx - 1];
            arr[idx - 1] = temp;
            return { ...s, memories: arr };
          });
          renderMemories();
        }
      });
    });

    list.querySelectorAll('.move-down-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const mems = getState().memories || [];
        if (idx < mems.length - 1) {
          setState((s) => {
            const arr = [...s.memories];
            const temp = arr[idx];
            arr[idx] = arr[idx + 1];
            arr[idx + 1] = temp;
            return { ...s, memories: arr };
          });
          renderMemories();
        }
      });
    });

    list.querySelectorAll('.remove-mem-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        setState((s) => {
          const arr = s.memories.filter((_, i) => i !== idx);
          return { ...s, memories: arr };
        });
        renderMemories();
      });
    });

    list.querySelectorAll('.replace-mem-input').forEach((inp) => {
      inp.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const idx = Number(e.target.dataset.idx);
        const cardEl = e.target.closest('div').parentElement;
        const statusEl = cardEl.querySelector('.mem-upload-status');
        try {
          statusEl.textContent = 'Processing…';
          const result = await uploadPhoto(file, 'memory');
          statusEl.textContent = `Optimized (${result.sizeKb} KB)`;
          setState((s) => {
            const arr = [...s.memories];
            arr[idx] = { ...arr[idx], id: result.id };
            return { ...s, memories: arr };
          });
        } catch (err) {
          alert(`Image upload error: ${err.message}`);
          statusEl.textContent = 'Upload failed';
        }
      });
    });

    list.querySelectorAll('.mem-caption').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        setState((s) => {
          const arr = [...s.memories];
          arr[idx] = { ...arr[idx], caption: e.target.value };
          return { ...s, memories: arr };
        });
      });
    });

    list.querySelectorAll('.mem-tag').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        setState((s) => {
          const arr = [...s.memories];
          arr[idx] = { ...arr[idx], tag: e.target.value };
          return { ...s, memories: arr };
        });
      });
    });

    list.querySelectorAll('.mem-alt').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        setState((s) => {
          const arr = [...s.memories];
          arr[idx] = { ...arr[idx], alt: e.target.value };
          return { ...s, memories: arr };
        });
      });
    });
  }

  // 5. Add Memory Button
  const addMemoryInput = container.querySelector('#add-memory-input');
  addMemoryInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await uploadPhoto(file, 'memory');
      setState((s) => {
        const arr = [...(s.memories || [])];
        arr.push({
          id: result.id,
          alt: 'Birthday memory snapshot',
          caption: 'Sweet memory',
          tag: 'Special Day',
          focus: { x: 50, y: 50 },
        });
        return { ...s, memories: arr };
      });
      renderMemories();
    } catch (err) {
      alert(`Add photo failed: ${err.message}`);
    }
  });

  renderMemories();
}

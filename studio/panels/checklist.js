import { getState } from '../store.js';
import { validateContent } from '../../src/config/schema.js';

export function mount(container) {
  const state = getState();
  const validation = validateContent(state);

  const checks = [
    { label: 'Recipient full name is set', pass: !!state.recipient?.fullName },
    { label: 'Birth date is configured', pass: !!state.recipient?.birthDate },
    {
      label: 'Sender name is specified',
      pass: !!state.sender?.name && state.sender.name !== 'Your Friend',
    },
    { label: 'Hero photo has alt text', pass: !!state.hero?.photo?.alt },
    {
      label: 'At least 2 scrapbook polaroids configured',
      pass: (state.memories || []).length >= 2,
    },
    { label: 'All polaroids have alt text', pass: (state.memories || []).every((m) => !!m.alt) },
    { label: 'Secret scratch-off message set', pass: !!state.scratchReward?.message },
    { label: 'Schema limits respected', pass: validation.valid },
  ];

  container.innerHTML = `
    <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Pre-Flight Quality Checklist</h3>
    <p class="form-hint" style="margin-bottom: 1.25rem;">Verify that all personal details are filled out before sharing the link.</p>

    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      ${checks
        .map(
          (c) => `
        <div style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; color: ${c.pass ? 'var(--studio-text)' : 'var(--studio-danger)'};">
          <span style="font-size: 1.1rem;">${c.pass ? '✅' : '❌'}</span>
          <span>${c.label}</span>
        </div>
      `
        )
        .join('')}
    </div>

    ${
      !validation.valid
        ? `
      <div style="margin-top: 1.5rem; padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 0.85rem; color: #991b1b;">
        <strong>Validation Issues:</strong>
        <ul style="margin-top: 0.5rem; margin-left: 1.25rem; list-style: disc;">
          ${validation.errors.map((err) => `<li>${err}</li>`).join('')}
        </ul>
      </div>
    `
        : ''
    }
  `;
}

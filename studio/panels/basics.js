import { getState, setState } from '../store.js';

export function mount(container) {
  const state = getState();

  container.innerHTML = `
    <div class="form-group">
      <label class="form-label">Recipient's First Name</label>
      <input type="text" id="inp-firstname" class="form-input" value="${state.recipient?.firstName || ''}" />
      <p class="form-hint">Used in warm conversational greetings throughout the surprise.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Recipient's Full Name</label>
      <input type="text" id="inp-fullname" class="form-input" value="${state.recipient?.fullName || ''}" />
      <p class="form-hint">Displayed in the main Hero headline.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Birth Date</label>
      <input type="date" id="inp-birthdate" class="form-input" value="${state.recipient?.birthDate || ''}" />
      <p class="form-hint">The milestone stats (Years, Months, Days, Hours) and cake candle count are automatically derived from this date.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Sender Name / Closing</label>
      <input type="text" id="inp-sender" class="form-input" value="${state.sender?.name || ''}" />
      <p class="form-hint">Appears on the closing line of the letter and the finale.</p>
    </div>

    <div class="form-group">
      <label class="form-label">Hero Tagline</label>
      <textarea id="inp-tagline" class="form-textarea" rows="2">${state.hero?.tagline || ''}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Secret Scratch-Off Message</label>
      <textarea id="inp-scratch-msg" class="form-textarea" rows="2">${state.scratchReward?.message || ''}</textarea>
      <p class="form-hint">Revealed when she scratches away the gold glitter card.</p>
    </div>
  `;

  // Bind inputs to reactive state
  container.querySelector('#inp-firstname').addEventListener('input', (e) => {
    setState((s) => ({ ...s, recipient: { ...s.recipient, firstName: e.target.value } }));
  });
  container.querySelector('#inp-fullname').addEventListener('input', (e) => {
    setState((s) => ({ ...s, recipient: { ...s.recipient, fullName: e.target.value } }));
  });
  container.querySelector('#inp-birthdate').addEventListener('change', (e) => {
    setState((s) => ({ ...s, recipient: { ...s.recipient, birthDate: e.target.value } }));
  });
  container.querySelector('#inp-sender').addEventListener('input', (e) => {
    setState((s) => ({ ...s, sender: { ...s.sender, name: e.target.value } }));
  });
  container.querySelector('#inp-tagline').addEventListener('input', (e) => {
    setState((s) => ({ ...s, hero: { ...s.hero, tagline: e.target.value } }));
  });
  container.querySelector('#inp-scratch-msg').addEventListener('input', (e) => {
    setState((s) => ({ ...s, scratchReward: { ...s.scratchReward, message: e.target.value } }));
  });
}

/**
 * Centralized reactive store for Content Studio state.
 */

let state = null;
let originalState = null;
const listeners = new Set();

export function initStore(initialData) {
  state = JSON.parse(JSON.stringify(initialData));
  originalState = JSON.parse(JSON.stringify(initialData));
}

export function getState() {
  return state;
}

export function setState(updater) {
  if (typeof updater === 'function') {
    state = updater(state);
  } else {
    state = { ...state, ...updater };
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function hasUnsavedChanges() {
  return JSON.stringify(state) !== JSON.stringify(originalState);
}

export function markSaved() {
  originalState = JSON.parse(JSON.stringify(state));
  listeners.forEach((fn) => fn(state));
}

export function discardChanges() {
  state = JSON.parse(JSON.stringify(originalState));
  listeners.forEach((fn) => fn(state));
}

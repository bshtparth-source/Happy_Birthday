import { MUSIC_FADE_DURATION } from '../constants.js';
import { getAudioContext, resumeAudioContext, fadeInGain, fadeOutGain } from '../utils/audio.js';

/**
 * Initializes the Web Audio synthesiser and music pill controller.
 * @param {HTMLElement} pillElement - Floating button element
 * @param {object} config - Active content configuration
 * @returns {{ start: () => void, toggle: () => void, reset: () => void, destroy: () => void }}
 */
export function init(pillElement, config) {
  if (!pillElement)
    return { start: () => {}, toggle: () => {}, reset: () => {}, destroy: () => {} };

  let masterGain = null;
  let playing = false;
  let muted = sessionStorage.getItem('birthday_muted') === 'true';
  let timer = null;

  const FREQ = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,
    C6: 1046.5,
  };

  const MELODY = [
    ['G4', 0.75],
    ['G4', 0.25],
    ['A4', 1],
    ['G4', 1],
    ['C5', 1],
    ['B4', 2],
    ['G4', 0.75],
    ['G4', 0.25],
    ['A4', 1],
    ['G4', 1],
    ['D5', 1],
    ['C5', 2],
    ['G4', 0.75],
    ['G4', 0.25],
    ['G5', 1],
    ['E5', 1],
    ['C5', 1],
    ['B4', 1],
    ['A4', 1],
    ['F5', 0.75],
    ['F5', 0.25],
    ['E5', 1],
    ['C5', 1],
    ['D5', 1],
    ['C5', 2.5],
  ];

  function playNote(freq, start, dur) {
    const ctx = getAudioContext();
    if (!ctx || ctx.state === 'closed') return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.001, start);
    g.gain.exponentialRampToValueAtTime(0.3, start + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function schedule() {
    if (!playing) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state === 'closed') return;

    let t = ctx.currentTime + 0.1;
    let total = 0;
    MELODY.forEach(([note, beats]) => {
      const dur = beats * 0.58;
      playNote(FREQ[note], t, dur * 0.9);
      t += dur;
      total += dur;
    });
    timer = setTimeout(schedule, (total + 1.5) * 1000);
  }

  function start() {
    if (playing) return;
    try {
      const ctx = getAudioContext();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      if (muted) {
        masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      } else {
        fadeInGain(masterGain, 0.45, MUSIC_FADE_DURATION);
      }

      resumeAudioContext();
      playing = true;
      schedule();

      pillElement.classList.add('music-pill--visible');
      pillElement.classList.toggle('music-pill--muted', muted);
      pillElement.setAttribute('aria-pressed', String(!muted));
    } catch {
      // AudioContext policy fallback
    }
  }

  function toggle() {
    if (!playing) {
      start();
      return;
    }
    muted = !muted;
    sessionStorage.setItem('birthday_muted', String(muted));
    const ctx = getAudioContext();
    if (masterGain && ctx && ctx.state !== 'closed') {
      if (muted) {
        fadeOutGain(masterGain, 0.4);
      } else {
        fadeInGain(masterGain, 0.45, 0.5);
      }
    }
    pillElement.classList.toggle('music-pill--muted', muted);
    pillElement.setAttribute('aria-pressed', String(!muted));
  }

  function handleVisibility() {
    const ctx = getAudioContext();
    if (!ctx || ctx.state === 'closed') return;
    if (document.hidden) {
      if (masterGain) fadeOutGain(masterGain, 0.2);
    } else if (playing && !muted) {
      if (masterGain) fadeInGain(masterGain, 0.45, 0.5);
    }
  }

  pillElement.addEventListener('click', toggle);
  document.addEventListener('visibilitychange', handleVisibility);

  // If title is defined in config, update the label safely
  const labelEl = pillElement.querySelector('.music-pill__label');
  if (labelEl && config?.music?.title) {
    labelEl.textContent = config.music.title;
  }

  let pausedForMic = false;

  function duckForMic() {
    if (playing && !muted) {
      pausedForMic = true;
      const ctx = getAudioContext();
      if (masterGain && ctx && ctx.state !== 'closed') {
        fadeOutGain(masterGain, 0.3);
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  }

  function restoreFromMic() {
    if (pausedForMic) {
      pausedForMic = false;
      if (playing && !muted) {
        const ctx = getAudioContext();
        if (masterGain && ctx && ctx.state !== 'closed') {
          fadeInGain(masterGain, 0.45, 0.5);
        }
        schedule();
      }
    }
  }

  return {
    start,
    toggle,
    duckForMic,
    restoreFromMic,
    reset() {
      // Retain music state across resets
    },
    destroy() {
      playing = false;
      if (timer) clearTimeout(timer);
      pillElement.removeEventListener('click', toggle);
      document.removeEventListener('visibilitychange', handleVisibility);
    },
  };
}

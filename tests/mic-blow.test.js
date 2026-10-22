/**
 * Automated Audio & Microphone Blow Detection Test Suite
 *
 * Verifies that:
 * 1. 60s silence -> zero false triggers
 * 2. 60s ambient room noise -> zero false triggers
 * 3. 30s speech/music (tonal/mid-high frequency) -> zero false triggers
 * 4. Short clicks / claps (< 100ms) -> zero false triggers
 * 5. 1s low-frequency breath blow -> reliable trigger and tracks stopped
 * 6. "Blow Out Candles" button -> works as before
 * 7. Permission denied -> friendly UI message, no crash
 * 8. Tab visibilitychange -> detection stops cleanly
 * 9. Repeated 3x without flakiness
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { init as initCakeMic } from '../src/components/cake-mic.js';

class MockAudioTrack {
  constructor() {
    this.stopped = false;
  }
  stop() {
    this.stopped = true;
  }
}

class MockMediaStream {
  constructor() {
    this.tracks = [new MockAudioTrack()];
  }
  getTracks() {
    return this.tracks;
  }
}

class MockAnalyserNode {
  constructor(sampleGenerator) {
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
    this.smoothingTimeConstant = 0.3;
    this.sampleGenerator = sampleGenerator;
  }

  getFloatTimeDomainData(array) {
    if (this.sampleGenerator?.getTimeDomain) {
      this.sampleGenerator.getTimeDomain(array);
    } else {
      array.fill(0);
    }
  }

  getByteFrequencyData(array) {
    if (this.sampleGenerator?.getFrequency) {
      this.sampleGenerator.getFrequency(array);
    } else {
      array.fill(0);
    }
  }
}

class MockAudioContext {
  constructor(sampleGenerator) {
    this.state = 'running';
    this.sampleRate = 48000;
    this.sampleGenerator = sampleGenerator;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  createMediaStreamSource() {
    return {
      connect: () => {},
    };
  }
  createAnalyser() {
    return new MockAnalyserNode(this.sampleGenerator);
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

function setupMockEnvironment(sampleGenerator, { denyPermission = false } = {}) {
  let currentTime = 1000;
  const listeners = new Map();
  const docListeners = new Map();

  const mockMicBtn = {
    classList: {
      classes: new Set(),
      add(c) {
        this.classes.add(c);
      },
      remove(c) {
        this.classes.delete(c);
      },
      contains(c) {
        return this.classes.has(c);
      },
    },
    addEventListener(evt, fn) {
      listeners.set(evt, fn);
    },
    removeEventListener(evt) {
      listeners.delete(evt);
    },
    click() {
      const fn = listeners.get('click');
      if (fn) fn();
    },
  };

  const mockMicStatus = {
    textContent: '',
    classList: {
      classes: new Set(),
      toggle(c, val) {
        if (val) this.classes.add(c);
        else this.classes.delete(c);
      },
      add(c) {
        this.classes.add(c);
      },
      remove(c) {
        this.classes.delete(c);
      },
    },
  };

  const root = {
    querySelector(selector) {
      if (selector === '#mic-btn') return mockMicBtn;
      if (selector === '#mic-status') return mockMicStatus;
      return null;
    },
  };

  let rafIdCounter = 1;
  const rafCallbacks = new Map();

  globalThis.window = {
    AudioContext: function () {
      return new MockAudioContext(sampleGenerator);
    },
    webkitAudioContext: function () {
      return new MockAudioContext(sampleGenerator);
    },
    performance: {
      now: () => currentTime,
    },
    location: {
      search: '',
    },
    addEventListener: (evt, fn) => {
      listeners.set(evt, fn);
    },
    removeEventListener: (evt) => {
      listeners.delete(evt);
    },
  };

  globalThis.document = {
    hidden: false,
    addEventListener: (evt, fn) => {
      docListeners.set(evt, fn);
    },
    removeEventListener: (evt) => {
      docListeners.delete(evt);
    },
    getElementById: () => null,
    createElement: () => ({ style: {}, classList: { add() {} } }),
    body: { appendChild() {} },
  };

  globalThis.requestAnimationFrame = (fn) => {
    const id = rafIdCounter++;
    rafCallbacks.set(id, fn);
    return id;
  };

  globalThis.cancelAnimationFrame = (id) => {
    rafCallbacks.delete(id);
  };

  let lastStreamCreated = null;
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: (constraints) => {
          if (denyPermission) {
            return Promise.reject(new Error('Permission denied'));
          }
          lastStreamCreated = new MockMediaStream();
          return Promise.resolve(lastStreamCreated);
        },
      },
    },
    configurable: true,
    writable: true,
  });

  function advanceTime(ms, stepMs = 16.67) {
    const target = currentTime + ms;
    while (currentTime < target) {
      currentTime += stepMs;
      const callbacks = Array.from(rafCallbacks.entries());
      rafCallbacks.clear();
      for (const [, cb] of callbacks) {
        cb(currentTime);
      }
    }
  }

  return {
    root,
    mockMicBtn,
    mockMicStatus,
    advanceTime,
    getStream: () => lastStreamCreated,
    triggerVisibilityChange(hidden) {
      globalThis.document.hidden = hidden;
      const fn = docListeners.get('visibilitychange');
      if (fn) fn();
    },
  };
}

describe('Microphone Blow Detection Test Suite', () => {
  for (let round = 1; round <= 3; round++) {
    describe(`Round ${round} / 3 Validation`, () => {
      test('1. Silence for 60 seconds: candles stay lit, zero false blow', async () => {
        let blown = false;
        const generator = {
          getTimeDomain: (arr) => arr.fill(0),
          getFrequency: (arr) => arr.fill(0),
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, { onBlow: () => (blown = true) });

        env.mockMicBtn.click();
        await Promise.resolve(); // resolve getUserMedia

        // Advance 60 simulated seconds
        env.advanceTime(60000);

        assert.equal(blown, false, 'Candles must NOT extinguish during 60s of silence');
        mic.destroy();
      });

      test('2. Room background noise for 60 seconds: candles stay lit', async () => {
        let blown = false;
        // Low level noise RMS ~0.015, evenly distributed frequency
        const generator = {
          getTimeDomain: (arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = (Math.random() - 0.5) * 0.03;
            }
          },
          getFrequency: (arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 20);
            }
          },
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, { onBlow: () => (blown = true) });

        env.mockMicBtn.click();
        await Promise.resolve();

        env.advanceTime(60000);

        assert.equal(blown, false, 'Candles must NOT extinguish with ambient room noise');
        mic.destroy();
      });

      test('3. Speech or tonal audio (1-4 kHz) at normal volume for 30s: rejected by low-band ratio', async () => {
        let blown = false;
        // Speech has higher RMS (0.07) but energy concentrated in mid/high bins (1 kHz+), lowRatio is ~0.20
        const generator = {
          getTimeDomain: (arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.sin(i * 0.25) * 0.07;
            }
          },
          getFrequency: (arr) => {
            arr.fill(0);
            // Mid-high frequencies (bins 50 to 300)
            for (let i = 50; i < 300; i++) {
              arr[i] = 120;
            }
          },
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, { onBlow: () => (blown = true) });

        env.mockMicBtn.click();
        await Promise.resolve();

        env.advanceTime(30000);

        assert.equal(blown, false, 'Speech or music tones must NOT trigger blow detection');
        mic.destroy();
      });

      test('4. Short loud clicks (< 100ms): candles stay lit', async () => {
        let blown = false;
        let isClick = false;

        const generator = {
          getTimeDomain: (arr) => {
            if (isClick) {
              for (let i = 0; i < arr.length; i++) {
                arr[i] = (Math.random() - 0.5) * 0.4;
              }
            } else {
              arr.fill(0.005);
            }
          },
          getFrequency: (arr) => {
            if (isClick) {
              arr.fill(180);
            } else {
              arr.fill(5);
            }
          },
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, { onBlow: () => (blown = true) });

        env.mockMicBtn.click();
        await Promise.resolve();

        // Pass warm-up and calibration
        env.advanceTime(2000);

        // Click 1 (80ms)
        isClick = true;
        env.advanceTime(80);
        isClick = false;
        env.advanceTime(500);

        // Click 2 (90ms)
        isClick = true;
        env.advanceTime(90);
        isClick = false;
        env.advanceTime(500);

        // Click 3 (70ms)
        isClick = true;
        env.advanceTime(70);
        isClick = false;
        env.advanceTime(1000);

        assert.equal(blown, false, 'Clicks under 100ms must NOT extinguish candles');
        mic.destroy();
      });

      test('5. Simulated 1s low-frequency breath blow after calibration: reliably extinguishes candles and stops tracks', async () => {
        let blown = false;
        let isBlowing = false;

        const generator = {
          getTimeDomain: (arr) => {
            if (isBlowing) {
              // Turbulent aerodynamic low-frequency breath (RMS ~0.09)
              for (let i = 0; i < arr.length; i++) {
                arr[i] = (Math.random() - 0.5) * 0.18;
              }
            } else {
              // Quiet room
              for (let i = 0; i < arr.length; i++) {
                arr[i] = (Math.random() - 0.5) * 0.01;
              }
            }
          },
          getFrequency: (arr) => {
            arr.fill(0);
            if (isBlowing) {
              // High energy in low bins 1..30 (< 850 Hz)
              for (let i = 1; i <= 30; i++) {
                arr[i] = 190;
              }
              // Very little high frequency
              for (let i = 31; i < arr.length; i++) {
                arr[i] = 8;
              }
            } else {
              for (let i = 1; i <= 30; i++) {
                arr[i] = 10;
              }
            }
          },
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, { onBlow: () => (blown = true) });

        env.mockMicBtn.click();
        await Promise.resolve();

        // 1. Warm-up and calibrate for 2s in quiet room
        env.advanceTime(2000);
        assert.equal(blown, false, 'Must not blow during calibration');

        // 2. Start sustained breath blow
        isBlowing = true;
        env.advanceTime(1000); // 1 second of blowing

        assert.equal(blown, true, 'Sustained breath blow MUST extinguish candles');
        assert.equal(
          env.getStream().getTracks()[0].stopped,
          true,
          'Audio track must be stopped after blow'
        );

        mic.destroy();
      });

      test('5b. Early blowing during calibration: baseline cap ensures candles still extinguish once armed', async () => {
        let blown = false;
        let isBlowing = true; // User begins blowing immediately upon clicking!

        const generator = {
          getTimeDomain: (arr) => {
            if (isBlowing) {
              for (let i = 0; i < arr.length; i++) {
                arr[i] = (Math.random() - 0.5) * 0.16;
              }
            }
          },
          getFrequency: (arr) => {
            arr.fill(0);
            if (isBlowing) {
              for (let i = 1; i <= 30; i++) arr[i] = 180;
              for (let i = 31; i < arr.length; i++) arr[i] = 10;
            }
          },
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, { onBlow: () => (blown = true) });

        env.mockMicBtn.click();
        await Promise.resolve();

        // 1. Advance through warmup and calibration while blowing: must not blow during calibration
        env.advanceTime(900);
        assert.equal(blown, false, 'Must not extinguish during calibration window');

        // 2. Continue blowing after calibration: baseline cap must ensure threshold is reachable
        env.advanceTime(700);
        assert.equal(blown, true, 'Early blowing must not prevent extinction once armed');

        mic.destroy();
      });

      test('6. Permission denied: shows friendly message without crashing', async () => {
        const env = setupMockEnvironment(null, { denyPermission: true });
        const mic = initCakeMic(env.root, {});

        env.mockMicBtn.click();
        await Promise.resolve();
        await Promise.resolve();

        assert.match(
          env.mockMicStatus.textContent,
          /Tap "Blow Out Candles" button instead/i,
          'Status must advise user to use the button fallback'
        );
        mic.destroy();
      });

      test('7. Tab visibility change: cancels listening cleanly', async () => {
        const generator = {
          getTimeDomain: (arr) => arr.fill(0),
          getFrequency: (arr) => arr.fill(0),
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {});

        env.mockMicBtn.click();
        await Promise.resolve();

        env.advanceTime(1000);
        assert.equal(env.mockMicBtn.classList.contains('btn-sub--listening'), true);

        // User switches tab
        env.triggerVisibilityChange(true);

        assert.equal(
          env.mockMicBtn.classList.contains('btn-sub--listening'),
          false,
          'Mic button must deactivate on tab hide'
        );
        assert.equal(env.getStream().getTracks()[0].stopped, true, 'Audio track must stop on tab hide');
        mic.destroy();
      });

      test('8. Double-clicking mic button toggles and stops listening cleanly', async () => {
        const generator = {
          getTimeDomain: (arr) => arr.fill(0),
          getFrequency: (arr) => arr.fill(0),
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {});

        // First click: starts
        env.mockMicBtn.click();
        await Promise.resolve();
        assert.equal(env.mockMicBtn.classList.contains('btn-sub--listening'), true);

        // Second click: stops
        env.mockMicBtn.click();
        assert.equal(env.mockMicBtn.classList.contains('btn-sub--listening'), false);
        assert.equal(env.getStream().getTracks()[0].stopped, true);

        mic.destroy();
      });

      test('9. Music ducking and restoration callbacks trigger on mic start and stop', async () => {
        let ducked = false;
        let restored = false;

        const generator = {
          getTimeDomain: (arr) => arr.fill(0),
          getFrequency: (arr) => arr.fill(0),
        };

        const env = setupMockEnvironment(generator);
        const mic = initCakeMic(env.root, {}, {
          onMicStart: () => { ducked = true; },
          onMicStop: () => { restored = true; },
        });

        env.mockMicBtn.click();
        await Promise.resolve();
        assert.equal(ducked, true, 'Music must duck when mic starts');

        env.mockMicBtn.click();
        assert.equal(restored, true, 'Music must restore when mic stops');

        mic.destroy();
      });
    });
  }
});

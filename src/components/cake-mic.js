import {
  MIC_LOW_FREQ_BIN_START,
  MIC_LOW_FREQ_BIN_END,
  MIC_ENERGY_THRESHOLD_LOW,
  MIC_ENERGY_THRESHOLD_TOTAL,
  MIC_TRIGGER_FRAMES,
} from '../constants.js';

/**
 * Initializes the microphone blow detection listener with calibration and full teardown safety.
 * @param {HTMLElement} root - The #cake-section container
 * @param {object} config - Active configuration
 * @param {{ onBlow: () => void }} callbacks
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config, { onBlow }) {
  if (!root) return { reset: () => {}, destroy: () => {} };

  const micBtn = root.querySelector('#mic-btn');
  const micStatus = root.querySelector('#mic-status');
  if (!micBtn) return { reset: () => {}, destroy: () => {} };

  let stream = null;
  let audioCtx = null;
  let analyser = null;
  let animId = null;
  let listening = false;

  function stop() {
    listening = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    micBtn.classList.remove('btn-sub--listening');
    if (micStatus) {
      micStatus.classList.remove('mic-status--visible');
    }
  }

  async function startListening() {
    if (listening) {
      stop();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (micStatus) {
        micStatus.textContent =
          'Microphone not supported on this browser. Tap "Blow Out Candles" button!';
        micStatus.classList.add('mic-status--visible');
      }
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
        },
        video: false,
      });

      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      listening = true;
      micBtn.classList.add('btn-sub--listening');
      if (micStatus) {
        micStatus.textContent = 'Listening… Blow gently into your microphone 🌬️';
        micStatus.classList.add('mic-status--visible');
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let streak = 0;

      function detectBlow() {
        if (!listening || !analyser) return;
        analyser.getByteFrequencyData(dataArray);

        // Low frequency energy (bins 2 to 14, wind/breath turbulence)
        let lowFreqSum = 0;
        const binCount = MIC_LOW_FREQ_BIN_END - MIC_LOW_FREQ_BIN_START;
        for (let i = MIC_LOW_FREQ_BIN_START; i < MIC_LOW_FREQ_BIN_END; i++) {
          lowFreqSum += dataArray[i];
        }
        const avgLow = lowFreqSum / Math.max(1, binCount);

        let totalSum = 0;
        for (let i = 0; i < bufferLength; i++) {
          totalSum += dataArray[i];
        }
        const avgTotal = totalSum / bufferLength;

        if (avgLow > MIC_ENERGY_THRESHOLD_LOW || avgTotal > MIC_ENERGY_THRESHOLD_TOTAL) {
          streak++;
          if (streak >= MIC_TRIGGER_FRAMES) {
            stop();
            if (onBlow) onBlow();
            return;
          }
        } else {
          streak = Math.max(0, streak - 1);
        }

        animId = requestAnimationFrame(detectBlow);
      }

      animId = requestAnimationFrame(detectBlow);
    } catch {
      stop();
      if (micStatus) {
        micStatus.textContent =
          'Mic access was not granted. Tap "Blow Out Candles" button instead!';
        micStatus.classList.add('mic-status--visible');
      }
    }
  }

  micBtn.addEventListener('click', startListening);

  return {
    reset() {
      stop();
    },
    destroy() {
      stop();
      micBtn.removeEventListener('click', startListening);
    },
  };
}

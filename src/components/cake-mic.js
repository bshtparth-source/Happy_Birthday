import {
  MIC_WARMUP_MS,
  MIC_CALIBRATION_MS,
  MIC_FFT_SIZE,
  MIC_SMOOTHING,
  MIC_LOW_FREQ_CUTOFF_HZ,
  MIC_MIN_RMS_THRESHOLD,
  MIC_BASELINE_MULTIPLIER,
  MIC_MAX_BASELINE_CAP,
  MIC_LOW_RATIO_START,
  MIC_LOW_RATIO_KEEP,
  MIC_BLOW_FILL_RATE,
  MIC_BLOW_DECAY_RATE,
  MIC_GAP_TOLERANCE_MS,
} from '../constants.js';

/**
 * Initializes the robust, calibrated microphone blow detection system.
 * Rejects speech, ambient noise, music, and clicks; triggers only on genuine sustained breath turbulence.
 *
 * @param {HTMLElement} root - The #cake-section container
 * @param {object} config - Active configuration
 * @param {{
 *   onBlow: () => void,
 *   onBlowStrength?: (strength: number) => void,
 *   onMicStart?: () => void,
 *   onMicStop?: () => void,
 * }} callbacks
 * @returns {{ reset: () => void, destroy: () => void }}
 */
export function init(root, config, { onBlow, onBlowStrength, onMicStart, onMicStop } = {}) {
  if (!root) {
    return { reset: () => {}, destroy: () => {} };
  }

  const micBtn = root.querySelector('#mic-btn');
  const micStatus = root.querySelector('#mic-status');
  if (!micBtn) {
    return { reset: () => {}, destroy: () => {} };
  }

  let stream = null;
  let audioCtx = null;
  let analyser = null;
  let animId = null;
  let isStarting = false;
  let listening = false;

  // Blow detector state
  let state = 'idle'; // 'idle' | 'warmup' | 'calibrating' | 'armed' | 'blowing' | 'done'
  let startTime = 0;
  let baselineRms = 0.015;
  let calibrationSamples = [];
  let blowStrength = 0;
  let lastBlowTime = 0;
  let lastFrameTime = 0;

  // Debug overlay (enabled if ?debug=1 in URL)
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  let debugOverlay = null;

  if (isDebug) {
    debugOverlay = document.getElementById('mic-debug-overlay');
    if (!debugOverlay) {
      debugOverlay = document.createElement('div');
      debugOverlay.id = 'mic-debug-overlay';
      debugOverlay.className = 'mic-debug-overlay';
      document.body.appendChild(debugOverlay);
    }
  }

  function updateDebug(metrics = {}) {
    if (!debugOverlay) return;
    const { rms = 0, threshold = 0, lowRatio = 0, strength = 0 } = metrics;
    const barBlocks = Math.round(strength * 10);
    const bar = '█'.repeat(barBlocks) + '░'.repeat(10 - barBlocks);
    debugOverlay.innerHTML = `
      <div style="font-weight:bold;margin-bottom:4px;color:#fef08a">🎤 MIC DEBUG (${state.toUpperCase()})</div>
      <div>RMS: ${rms.toFixed(4)} (Base: ${baselineRms.toFixed(4)} / Req: ${threshold.toFixed(4)})</div>
      <div>Low-Ratio: ${(lowRatio * 100).toFixed(1)}% (Req: ${state === 'blowing' ? (MIC_LOW_RATIO_KEEP * 100).toFixed(0) : (MIC_LOW_RATIO_START * 100).toFixed(0)}%)</div>
      <div>Strength: [${bar}] ${(strength * 100).toFixed(0)}%</div>
    `;
  }

  function setStatus(text, visible = true) {
    if (!micStatus) return;
    micStatus.textContent = text;
    micStatus.classList.toggle('mic-status--visible', visible);
  }

  function stop(reason = 'stopped') {
    listening = false;
    isStarting = false;
    state = reason === 'done' ? 'done' : 'idle';

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
    analyser = null;

    micBtn.classList.remove('btn-sub--listening');
    if (reason !== 'done') {
      setStatus('', false);
      if (onBlowStrength) onBlowStrength(0);
    }

    if (onMicStop) onMicStop();
    if (debugOverlay) updateDebug();
  }

  async function startListening() {
    // If already active, clicking again cancels listening
    if (listening || isStarting) {
      stop();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus(
        'Microphone is not supported on this browser. Tap "Blow Out Candles" button instead!',
        true
      );
      return;
    }

    isStarting = true;

    try {
      // Duck music so speaker audio cannot bleed into microphone
      if (onMicStart) onMicStart();

      // Ensure AudioContext is instantiated or resumed synchronously during the user click token
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Try preferred constraints: echoCancellation: false preserves raw breath turbulence (< 250 Hz) and AGC provides sufficient gain
      let userStream;
      try {
        userStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (err) {
        // If permission was denied, do not retry alternate constraints
        const isDenied =
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          (err?.message && err.message.toLowerCase().includes('denied'));
        if (isDenied) {
          throw err;
        }

        try {
          userStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1,
            },
            video: false,
          });
        } catch {
          userStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
      }

      // Guard against user clicking cancel during the permission dialog
      if (!isStarting) {
        if (userStream) userStream.getTracks().forEach((t) => t.stop());
        return;
      }

      stream = userStream;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = MIC_FFT_SIZE;
      analyser.smoothingTimeConstant = MIC_SMOOTHING;

      // Ensure analyser is NOT connected to destination (strictly input analysis, no feedback)
      source.connect(analyser);

      listening = true;
      isStarting = false;
      micBtn.classList.add('btn-sub--listening');

      state = 'warmup';
      startTime = window.performance ? window.performance.now() : Date.now();
      lastFrameTime = startTime;
      calibrationSamples = [];
      blowStrength = 0;
      lastBlowTime = 0;
      setStatus('Listening… stay quiet for a moment 🤫', true);

      const timeDomainData = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const binWidth = audioCtx.sampleRate / analyser.fftSize;
      const cutoffBin = Math.max(
        1,
        Math.min(Math.floor(MIC_LOW_FREQ_CUTOFF_HZ / binWidth), freqData.length - 1)
      );

      function processAudioFrame(now) {
        if (!listening || !analyser) return;

        const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
        lastFrameTime = now;
        const elapsed = now - startTime;

        if (typeof analyser.getFloatTimeDomainData === 'function') {
          analyser.getFloatTimeDomainData(timeDomainData);
        } else {
          const byteData = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(byteData);
          for (let i = 0; i < byteData.length; i++) {
            timeDomainData[i] = (byteData[i] - 128) / 128;
          }
        }
        analyser.getByteFrequencyData(freqData);

        // 1. Calculate acoustic RMS (Root Mean Square) with DC offset cancellation
        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          sum += timeDomainData[i];
        }
        const mean = sum / timeDomainData.length;

        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const diff = timeDomainData[i] - mean;
          sumSquares += diff * diff;
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);

        // 2. Calculate low-frequency vs high-frequency average power density ratio
        let lowEnergy = 0;
        for (let i = 1; i <= cutoffBin; i++) {
          lowEnergy += freqData[i] * freqData[i];
        }
        let highEnergy = 0;
        for (let i = cutoffBin + 1; i < freqData.length; i++) {
          highEnergy += freqData[i] * freqData[i];
        }
        const highBinsCount = Math.max(1, freqData.length - 1 - cutoffBin);
        const avgLow = lowEnergy / cutoffBin;
        const avgHigh = highEnergy / highBinsCount;
        const lowRatio = avgLow + avgHigh > 0 ? avgLow / (avgLow + avgHigh) : 0;

        // Stage 1: Warmup phase (discard hardware activation transients)
        if (elapsed < MIC_WARMUP_MS) {
          state = 'warmup';
          updateDebug({ rms, lowRatio, strength: 0 });
          animId = requestAnimationFrame(processAudioFrame);
          return;
        }

        // Stage 2: Calibration phase (measure true ambient noise baseline)
        if (elapsed < MIC_WARMUP_MS + MIC_CALIBRATION_MS) {
          state = 'calibrating';
          calibrationSamples.push(rms);
          setStatus('Listening… stay quiet for a moment 🤫', true);
          updateDebug({ rms, lowRatio, strength: 0 });
          animId = requestAnimationFrame(processAudioFrame);
          return;
        }

        // Finalize calibration baseline on first frame after calibration
        if (state === 'calibrating') {
          if (calibrationSamples.length > 0) {
            calibrationSamples.sort((a, b) => a - b);
            const medianIndex = Math.floor(calibrationSamples.length / 2);
            baselineRms = Math.min(
              MIC_MAX_BASELINE_CAP,
              Math.max(0.003, calibrationSamples[medianIndex])
            );
          }
          state = 'armed';
          setStatus('Ready! Blow into your microphone 🌬️', true);
        }

        // Stage 3: Armed blow detection
        const dynamicThreshold = Math.max(
          MIC_MIN_RMS_THRESHOLD,
          baselineRms * MIC_BASELINE_MULTIPLIER
        );

        const isCurrentlyBlowing = state === 'blowing';
        const requiredRatio = isCurrentlyBlowing ? MIC_LOW_RATIO_KEEP : MIC_LOW_RATIO_START;

        const isBlowFrame = rms > dynamicThreshold && lowRatio >= requiredRatio;

        if (isBlowFrame) {
          state = 'blowing';
          lastBlowTime = now;
          blowStrength = Math.min(1.0, blowStrength + MIC_BLOW_FILL_RATE * dt);
          setStatus('Blowing detected! Keep blowing… 💨', true);
        } else {
          // Allow micro-gaps of turbulence dips under MIC_GAP_TOLERANCE_MS
          const timeSinceBlow = now - lastBlowTime;
          if (timeSinceBlow > MIC_GAP_TOLERANCE_MS) {
            blowStrength = Math.max(0.0, blowStrength - MIC_BLOW_DECAY_RATE * dt);
            if (blowStrength <= 0.05) {
              if (state === 'blowing') {
                state = 'armed';
                setStatus('Ready! Blow into your microphone 🌬️', true);
              }
            }
          }
        }

        if (onBlowStrength) {
          onBlowStrength(blowStrength);
        }

        updateDebug({
          rms,
          threshold: dynamicThreshold,
          lowRatio,
          strength: blowStrength,
        });

        // If sustained blow completes the fill, trigger successful blow!
        if (blowStrength >= 1.0) {
          stop('done');
          setStatus('✨ You made a wish!', true);
          if (onBlow) onBlow();
          return;
        }

        animId = requestAnimationFrame(processAudioFrame);
      }

      animId = requestAnimationFrame(processAudioFrame);
    } catch {
      stop();
      setStatus(
        'Mic access was not granted or blocked. Tap "Blow Out Candles" button instead!',
        true
      );
    }
  }

  function handleVisibilityChange() {
    if (document.hidden && listening) {
      stop();
    }
  }

  micBtn.addEventListener('click', startListening);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handleVisibilityChange);

  return {
    reset() {
      stop();
      blowStrength = 0;
      if (onBlowStrength) onBlowStrength(0);
    },
    destroy() {
      stop();
      micBtn.removeEventListener('click', startListening);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
      if (debugOverlay && debugOverlay.parentNode) {
        debugOverlay.parentNode.removeChild(debugOverlay);
      }
    },
  };
}

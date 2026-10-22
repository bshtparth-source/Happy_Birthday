/**
 * Web Audio context helper with safe volume ramping and session state management.
 */

let sharedContext = null;

/**
 * Returns the singleton AudioContext instance.
 * @returns {AudioContext}
 */
export function getAudioContext() {
  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedContext;
}

/**
 * Safely resumes a suspended AudioContext after user gesture.
 * @returns {Promise<void>}
 */
export async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Ignored if auto-resume is blocked by browser policy
    }
  }
}

/**
 * Smoothly ramps audio gain up to the target value.
 * @param {GainNode} gainNode
 * @param {number} targetValue
 * @param {number} durationSeconds
 */
export function fadeInGain(gainNode, targetValue, durationSeconds) {
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  gainNode.gain.cancelScheduledValues(startTime);
  gainNode.gain.setValueAtTime(0.001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(
    Math.max(0.001, targetValue),
    startTime + durationSeconds
  );
}

/**
 * Smoothly ramps audio gain down to silence.
 * @param {GainNode} gainNode
 * @param {number} durationSeconds
 */
export function fadeOutGain(gainNode, durationSeconds) {
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  gainNode.gain.cancelScheduledValues(startTime);
  gainNode.gain.setTargetAtTime(0.0001, startTime, durationSeconds / 4);
}

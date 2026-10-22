// Animation durations in milliseconds
export const DURATION_FAST = 200;
export const DURATION_MED = 400;
export const DURATION_SLOW = 800;
export const DURATION_ENVELOPE = 1200;

// Candle configuration
export const MAX_CANDLES = 11;

// Scratch card parameters
export const SCRATCH_REVEAL_THRESHOLD = 0.55;
export const SCRATCH_BRUSH_RADIUS_MIN = 18;
export const SCRATCH_BRUSH_RADIUS_MAX = 28;
export const SCRATCH_CHECK_INTERVAL = 10;

// Microphone blow detection parameters
export const MIC_WARMUP_MS = 250; // Fast initial warmup to discard switching transient
export const MIC_CALIBRATION_MS = 750; // Swift 750ms ambient baseline measurement
export const MIC_FFT_SIZE = 1024; // Fast FFT resolution (512 frequency bins)
export const MIC_SMOOTHING = 0.25; // Responsive temporal smoothing
export const MIC_LOW_FREQ_CUTOFF_HZ = 900; // Low frequency cutoff for breath turbulence
export const MIC_MIN_RMS_THRESHOLD = 0.016; // Realistic minimum RMS for built-in laptop/phone microphones
export const MIC_BASELINE_MULTIPLIER = 1.6; // Sensitive multiplier above measured ambient baseline
export const MIC_MAX_BASELINE_CAP = 0.022; // Cap baseline so early blowing never locks the detector
export const MIC_LOW_RATIO_START = 0.52; // Low-frequency ratio required to start (breath: 0.70-0.98, speech: 0.10-0.30)
export const MIC_LOW_RATIO_KEEP = 0.42; // Hysteresis threshold to sustain blow
export const MIC_BLOW_FILL_RATE = 3.2; // Requires ~310ms of sustained breath to extinguish
export const MIC_BLOW_DECAY_RATE = 2.0; // Decay rate when breath ceases
export const MIC_GAP_TOLERANCE_MS = 120; // Natural breath flutter tolerance

// Petals particle count
export const PETAL_COUNT_MOBILE = 12;
export const PETAL_COUNT_DESKTOP = 24;

// Audio transition duration in seconds
export const MUSIC_FADE_DURATION = 1.5;

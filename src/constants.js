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
export const MIC_WARMUP_MS = 500; // Ignore initial audio frames to discard hardware switching transients
export const MIC_CALIBRATION_MS = 1200; // Time spent measuring ambient baseline noise
export const MIC_FFT_SIZE = 2048; // High frequency resolution for low-band breath turbulence analysis
export const MIC_SMOOTHING = 0.3; // Temporal smoothing constant for analyser
export const MIC_LOW_FREQ_CUTOFF_HZ = 850; // Low frequency cutoff for breath turbulence
export const MIC_MIN_RMS_THRESHOLD = 0.035; // Absolute minimum RMS floor
export const MIC_BASELINE_MULTIPLIER = 3.0; // Required RMS multiplier above ambient baseline
export const MIC_LOW_RATIO_START = 0.62; // Low-frequency energy ratio required to start blow
export const MIC_LOW_RATIO_KEEP = 0.46; // Low-frequency energy ratio required to sustain blow (hysteresis)
export const MIC_BLOW_FILL_RATE = 2.8; // Blow strength units per second (~350ms of sustained blow)
export const MIC_BLOW_DECAY_RATE = 2.0; // Blow strength decay rate per second when sound drops
export const MIC_GAP_TOLERANCE_MS = 80; // Brief audio gap allowed without resetting blow streak

// Petals particle count
export const PETAL_COUNT_MOBILE = 12;
export const PETAL_COUNT_DESKTOP = 24;

// Audio transition duration in seconds
export const MUSIC_FADE_DURATION = 1.5;

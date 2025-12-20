export const AUDIO_CURVES = {
  FILTER: {
    BASE_HZ: 300,
    MULTIPLIER: 10,
  },
  PAN: {
    BASE_FREQ: 0.05,
    MULTIPLIER: 20,
  },
  LFO: {
    BASE_FREQ: 0.2,
    DEPTH_BASE: 10,
    MULTIPLIER: 30,
    DEPTH_MULT: 20
  },
  DISTORTION: {
    FACTOR: 400
  },
  STEREO: {
    GAIN_FACTOR: 0.8,
    POWER: 3
  }
} as const;

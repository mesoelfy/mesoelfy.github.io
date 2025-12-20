import { AUDIO_CURVES } from '@/engine/config/AudioConfig';

/**
 * AUDIO MATH LIBRARY
 */

export const getAmbienceFilterHz = (val: number): number => {
  const { BASE_HZ, MULTIPLIER } = AUDIO_CURVES.FILTER;
  return BASE_HZ * Math.pow(MULTIPLIER, (val - 0.5) * 2);
};

export const getAmbiencePanFreq = (val: number): number => {
  const { BASE_FREQ, MULTIPLIER } = AUDIO_CURVES.PAN;
  return BASE_FREQ * Math.pow(MULTIPLIER, (val - 0.5) * 2);
};

export const getAmbienceModFreq = (val: number): number => {
  const { BASE_FREQ, MULTIPLIER } = AUDIO_CURVES.LFO;
  return BASE_FREQ * Math.pow(MULTIPLIER, (val - 0.5) * 2);
};

export const getAmbienceModDepth = (val: number): number => {
  const { DEPTH_BASE, DEPTH_MULT } = AUDIO_CURVES.LFO;
  return DEPTH_BASE * Math.pow(DEPTH_MULT, (val - 0.5) * 2);
};

export const getAmbienceStereoGain = (val: number): number => {
  const { GAIN_FACTOR, POWER } = AUDIO_CURVES.STEREO;
  return Math.pow(val, POWER) * GAIN_FACTOR;
};

export const getAmbienceDistortion = (val: number): number => {
  return val * AUDIO_CURVES.DISTORTION.FACTOR;
};

/**
 * Generates a synthetic impulse response for reverb.
 */
export const generateImpulseResponse = (ctx: AudioContext, duration: number = 2.0, decay: number = 2.0, reverse: boolean = false): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = reverse ? length - i : i;
    // Exponential decay
    const e = Math.pow(1 - n / length, decay);
    
    // Noise burst
    left[i] = (Math.random() * 2 - 1) * e;
    right[i] = (Math.random() * 2 - 1) * e;
  }

  return impulse;
};

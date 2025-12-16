/**
 * AUDIO MATH LIBRARY
 */

export const getAmbienceFilterHz = (val: number): number => {
  return 300 * Math.pow(10, (val - 0.5) * 2);
};

export const getAmbiencePanFreq = (val: number): number => {
  return 0.05 * Math.pow(20, (val - 0.5) * 2);
};

export const getAmbienceModFreq = (val: number): number => {
  return 0.2 * Math.pow(30, (val - 0.5) * 2);
};

export const getAmbienceModDepth = (val: number): number => {
  return 10 * Math.pow(20, (val - 0.5) * 2);
};

export const getAmbienceStereoGain = (val: number): number => {
  return Math.pow(val, 3) * 0.8;
};

export const getAmbienceDistortion = (val: number): number => {
  return val * 400;
};

/**
 * Generates a synthetic impulse response for reverb.
 * Creates a "Metallic/Digital" decay sound.
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

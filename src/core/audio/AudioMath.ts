/**
 * AUDIO MATH LIBRARY
 * Single source of truth for DSP conversions.
 * 
 * LOGIC UPDATE:
 * Formulas use a base anchor at val=0.5 (The Default).
 * The curve is calculated to hit the specific MAX at val=1.0.
 * formula: Anchor * (Ratio ^ ((val - 0.5) * 2))
 */

// 1. FILTER (Density)
// Anchor: 300Hz. Range: 30Hz - 3000Hz.
export const getAmbienceFilterHz = (val: number): number => {
  return 300 * Math.pow(10, (val - 0.5) * 2);
};

// 2. PAN SPEED (Circulation)
// Anchor: 0.05Hz (Default). 
// Target Max: 1.0Hz.
// Ratio: 1.0 / 0.05 = 20.
export const getAmbiencePanFreq = (val: number): number => {
  return 0.05 * Math.pow(20, (val - 0.5) * 2);
};

// 3. MOD SPEED (Fluctuation / LFO Rate)
// Anchor: 0.2Hz (Default).
// Target Max: 6.0Hz.
// Ratio: 6.0 / 0.2 = 30.
export const getAmbienceModFreq = (val: number): number => {
  return 0.2 * Math.pow(30, (val - 0.5) * 2);
};

// 4. MOD DEPTH (Instability / LFO Depth)
// Anchor: 10Hz (Default).
// Target Max: 200Hz.
// Ratio: 200 / 10 = 20.
export const getAmbienceModDepth = (val: number): number => {
  return 10 * Math.pow(20, (val - 0.5) * 2);
};

// 5. STEREO WIDTH
// Mapping: 0.0-1.0 -> Gain 0.0 - 0.8
export const getAmbienceStereoGain = (val: number): number => {
  return Math.pow(val, 3) * 0.8;
};

// 6. GRIT (Distortion)
// Mapping: 0.0-1.0 -> Distortion Index 0 - 400
export const getAmbienceDistortion = (val: number): number => {
  return val * 400;
};

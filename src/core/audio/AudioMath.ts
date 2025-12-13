/**
 * AUDIO MATH LIBRARY
 * Single source of truth for DSP conversions (0.0-1.0 UI values -> Audio Parameters).
 * Ensures Settings Labels always match the Audio Engine exactly.
 */

// 1. FILTER (Density)
// Mapping: 0.0-1.0 -> 30Hz - 3000Hz (Logarithmic)
// Center (0.5) = 300Hz
export const getAmbienceFilterHz = (val: number): number => {
  return 300 * Math.pow(10, (val - 0.5) * 2);
};

// 2. PAN SPEED (Circulation)
// Mapping: 0.0-1.0 -> 0.01Hz - 1.0Hz
// Center (0.5) = 0.1Hz
// Adjusted for Max 1.0Hz
export const getAmbiencePanFreq = (val: number): number => {
  return 0.1 * Math.pow(10, (val - 0.5) * 2);
};

// 3. MOD SPEED (Fluctuation)
// Mapping: 0.0-1.0 -> 0.06Hz - 6.0Hz
// Center (0.5) = 0.6Hz
// Adjusted for Max 6.0Hz
export const getAmbienceModFreq = (val: number): number => {
  return 0.6 * Math.pow(10, (val - 0.5) * 2);
};

// 4. MOD DEPTH (Instability)
// Mapping: 0.0-1.0 -> +/- 2Hz - +/- 200Hz
// Center (0.5) = +/- 20Hz
// Adjusted for Max 200Hz
export const getAmbienceModDepth = (val: number): number => {
  return 20 * Math.pow(10, (val - 0.5) * 2);
};

// 5. STEREO WIDTH
// Mapping: 0.0-1.0 -> Gain 0.0 - 0.8 (Cubic curve for natural feel)
export const getAmbienceStereoGain = (val: number): number => {
  return Math.pow(val, 3) * 0.8;
};

// 6. GRIT (Distortion)
// Mapping: 0.0-1.0 -> Distortion Index 0 - 400
export const getAmbienceDistortion = (val: number): number => {
  return val * 400;
};
